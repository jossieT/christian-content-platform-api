import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ContentQueryDto } from '../dto/content-query.dto';
import { CreateArticleDto } from '../dto/create-article.dto';
import { UpdateArticleDto } from '../dto/update-article.dto';

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  async create(authorId: string, dto: CreateArticleDto) {
    const slug = await this.generateUniqueSlug(dto.title);
    const status = dto.status ?? ContentStatus.DRAFT;
    const publishedAt = status === ContentStatus.PUBLISHED ? new Date() : null;

    const tagConnectOrCreate = dto.tags?.map((tagName) => {
      const tagSlug = this.slugify(tagName);
      return {
        where: { slug: tagSlug },
        create: { name: tagName, slug: tagSlug },
      };
    });

    return this.prisma.article.create({
      data: {
        title: dto.title,
        slug,
        summary: dto.summary,
        content: dto.content,
        coverImageUrl: dto.coverImageUrl,
        status,
        publishedAt,
        author: { connect: { id: authorId } },
        ...(dto.categoryId && { category: { connect: { id: dto.categoryId } } }),
        ...(tagConnectOrCreate && { tags: { connectOrCreate: tagConnectOrCreate } }),
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true } },
        category: true,
        tags: true,
      },
    });
  }

  async findAll(query: ContentQueryDto, isPublicOnly = true) {
    const { skip, take, category, tag, search, status } = query;

    const where: Prisma.ArticleWhereInput = {
      ...(isPublicOnly ? { status: ContentStatus.PUBLISHED } : status ? { status } : {}),
      ...(category && {
        category: {
          OR: [{ id: category }, { slug: category }],
        },
      }),
      ...(tag && {
        tags: {
          some: { slug: tag },
        },
      }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { summary: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        skip,
        take,
        orderBy: { publishedAt: 'desc' },
        include: {
          author: { select: { id: true, firstName: true, lastName: true } },
          category: { select: { id: true, name: true, slug: true } },
          tags: { select: { id: true, name: true, slug: true } },
        },
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      items,
      total,
      skip: skip ?? 0,
      take: take ?? 20,
    };
  }

  async findBySlug(slug: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: { select: { avatarUrl: true, bio: true } },
          },
        },
        category: true,
        tags: true,
      },
    });

    if (!article) {
      throw new NotFoundException(`Article with slug '${slug}' not found`);
    }

    return article;
  }

  async update(id: string, userId: string, dto: UpdateArticleDto, isAdmin = false) {
    const article = await this.prisma.article.findUnique({ where: { id } });

    if (!article) {
      throw new NotFoundException(`Article with ID '${id}' not found`);
    }

    if (!isAdmin && article.authorId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this article');
    }

    const status = dto.status ?? article.status;
    let publishedAt = article.publishedAt;
    if (status === ContentStatus.PUBLISHED && !publishedAt) {
      publishedAt = new Date();
    }

    return this.prisma.article.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.summary !== undefined && { summary: dto.summary }),
        ...(dto.content && { content: dto.content }),
        ...(dto.coverImageUrl !== undefined && { coverImageUrl: dto.coverImageUrl }),
        status,
        publishedAt,
        ...(dto.categoryId !== undefined && {
          category: dto.categoryId ? { connect: { id: dto.categoryId } } : { disconnect: true },
        }),
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        category: true,
        tags: true,
      },
    });
  }

  async delete(id: string, userId: string, isAdmin = false) {
    const article = await this.prisma.article.findUnique({ where: { id } });

    if (!article) {
      throw new NotFoundException(`Article with ID '${id}' not found`);
    }

    if (!isAdmin && article.authorId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this article');
    }

    await this.prisma.article.delete({ where: { id } });
    return { message: 'Article deleted successfully' };
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = this.slugify(title);
    let slug = baseSlug;
    let counter = 1;

    while (await this.prisma.article.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
