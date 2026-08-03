import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BookQueryDto } from './dto/book-query.dto';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Injectable()
export class BooksService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBookDto) {
    const slug = await this.generateUniqueSlug(dto.title);

    if (dto.isbn) {
      const existingIsbn = await this.prisma.book.findUnique({
        where: { isbn: dto.isbn },
      });
      if (existingIsbn) {
        throw new ConflictException(
          `Book with ISBN '${dto.isbn}' already exists`,
        );
      }
    }

    return this.prisma.book.create({
      data: {
        title: dto.title,
        slug,
        authorName: dto.authorName,
        publisher: dto.publisher,
        isbn: dto.isbn,
        description: dto.description,
        coverImageUrl: dto.coverImageUrl,
        price: dto.price ?? 0.0,
        isFree: dto.isFree ?? (dto.price === 0 || dto.price === undefined),
        format: dto.format,
        fileUrl: dto.fileUrl,
        status: dto.status ?? ContentStatus.DRAFT,
        ...(dto.categoryId && {
          category: { connect: { id: dto.categoryId } },
        }),
      },
      include: { category: true },
    });
  }

  async findAll(query: BookQueryDto, isPublicOnly = true) {
    const { skip, take, category, format, isFree, search, status } = query;

    const where: Prisma.BookWhereInput = {
      ...(isPublicOnly
        ? { status: ContentStatus.PUBLISHED }
        : status
          ? { status }
          : {}),
      ...(format && { format }),
      ...(isFree !== undefined && { isFree }),
      ...(category && {
        category: {
          OR: [{ id: category }, { slug: category }],
        },
      }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { authorName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.book.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { category: { select: { id: true, name: true, slug: true } } },
      }),
      this.prisma.book.count({ where }),
    ]);

    return {
      items,
      total,
      skip: skip ?? 0,
      take: take ?? 20,
    };
  }

  async findBySlug(slug: string) {
    const book = await this.prisma.book.findUnique({
      where: { slug },
      include: { category: true },
    });

    if (!book) {
      throw new NotFoundException(`Book with slug '${slug}' not found`);
    }

    return book;
  }

  async update(id: string, dto: UpdateBookDto) {
    const book = await this.prisma.book.findUnique({ where: { id } });

    if (!book) {
      throw new NotFoundException(`Book with ID '${id}' not found`);
    }

    return this.prisma.book.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.authorName && { authorName: dto.authorName }),
        ...(dto.publisher !== undefined && { publisher: dto.publisher }),
        ...(dto.isbn !== undefined && { isbn: dto.isbn }),
        ...(dto.description && { description: dto.description }),
        ...(dto.coverImageUrl !== undefined && {
          coverImageUrl: dto.coverImageUrl,
        }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.isFree !== undefined && { isFree: dto.isFree }),
        ...(dto.format && { format: dto.format }),
        ...(dto.fileUrl !== undefined && { fileUrl: dto.fileUrl }),
        ...(dto.status && { status: dto.status }),
        ...(dto.categoryId !== undefined && {
          category: dto.categoryId
            ? { connect: { id: dto.categoryId } }
            : { disconnect: true },
        }),
      },
      include: { category: true },
    });
  }

  async delete(id: string) {
    const book = await this.prisma.book.findUnique({ where: { id } });

    if (!book) {
      throw new NotFoundException(`Book with ID '${id}' not found`);
    }

    await this.prisma.book.delete({ where: { id } });
    return { message: 'Book deleted successfully' };
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = this.slugify(title);
    let slug = baseSlug;
    let counter = 1;

    while (await this.prisma.book.findUnique({ where: { slug } })) {
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
