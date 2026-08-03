import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ContentQueryDto } from '../dto/content-query.dto';
import { CreateDevotionalDto } from '../dto/create-devotional.dto';
import { UpdateDevotionalDto } from '../dto/update-devotional.dto';

@Injectable()
export class DevotionalsService {
  constructor(private prisma: PrismaService) {}

  async create(authorId: string, dto: CreateDevotionalDto) {
    const devotionalDate = new Date(dto.date);
    devotionalDate.setUTCHours(0, 0, 0, 0);

    const existingForDate = await this.prisma.devotional.findUnique({
      where: { date: devotionalDate },
    });

    if (existingForDate) {
      throw new ConflictException(
        `A devotional already exists for date ${dto.date}`,
      );
    }

    const slug = await this.generateUniqueSlug(dto.title);
    const status = dto.status ?? ContentStatus.DRAFT;

    return this.prisma.devotional.create({
      data: {
        title: dto.title,
        slug,
        scriptureReference: dto.scriptureReference,
        scriptureText: dto.scriptureText,
        content: dto.content,
        prayer: dto.prayer,
        date: devotionalDate,
        status,
        author: { connect: { id: authorId } },
        ...(dto.categoryId && {
          category: { connect: { id: dto.categoryId } },
        }),
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        category: true,
      },
    });
  }

  async getTodayDevotional() {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const devotional = await this.prisma.devotional.findFirst({
      where: {
        date: today,
        status: ContentStatus.PUBLISHED,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        category: true,
      },
    });

    if (!devotional) {
      throw new NotFoundException('No daily devotional published for today');
    }

    return devotional;
  }

  async findByDate(dateStr: string) {
    const targetDate = new Date(dateStr);
    targetDate.setUTCHours(0, 0, 0, 0);

    const devotional = await this.prisma.devotional.findUnique({
      where: { date: targetDate },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        category: true,
      },
    });

    if (!devotional) {
      throw new NotFoundException(`Devotional for date '${dateStr}' not found`);
    }

    return devotional;
  }

  async findAll(query: ContentQueryDto, isPublicOnly = true) {
    const { skip, take, category, search, status } = query;

    const where: Prisma.DevotionalWhereInput = {
      ...(isPublicOnly
        ? { status: ContentStatus.PUBLISHED }
        : status
          ? { status }
          : {}),
      ...(category && {
        category: {
          OR: [{ id: category }, { slug: category }],
        },
      }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { scriptureReference: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.devotional.findMany({
        where,
        skip,
        take,
        orderBy: { date: 'desc' },
        include: {
          author: { select: { id: true, firstName: true, lastName: true } },
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
      this.prisma.devotional.count({ where }),
    ]);

    return {
      items,
      total,
      skip: skip ?? 0,
      take: take ?? 20,
    };
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateDevotionalDto,
    isAdmin = false,
  ) {
    const devotional = await this.prisma.devotional.findUnique({
      where: { id },
    });

    if (!devotional) {
      throw new NotFoundException(`Devotional with ID '${id}' not found`);
    }

    if (!isAdmin && devotional.authorId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to modify this devotional',
      );
    }

    let dateObj: Date | undefined;
    if (dto.date) {
      dateObj = new Date(dto.date);
      dateObj.setUTCHours(0, 0, 0, 0);
    }

    return this.prisma.devotional.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.scriptureReference && {
          scriptureReference: dto.scriptureReference,
        }),
        ...(dto.scriptureText !== undefined && {
          scriptureText: dto.scriptureText,
        }),
        ...(dto.content && { content: dto.content }),
        ...(dto.prayer !== undefined && { prayer: dto.prayer }),
        ...(dateObj && { date: dateObj }),
        ...(dto.status && { status: dto.status }),
        ...(dto.categoryId !== undefined && {
          category: dto.categoryId
            ? { connect: { id: dto.categoryId } }
            : { disconnect: true },
        }),
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        category: true,
      },
    });
  }

  async delete(id: string, userId: string, isAdmin = false) {
    const devotional = await this.prisma.devotional.findUnique({
      where: { id },
    });

    if (!devotional) {
      throw new NotFoundException(`Devotional with ID '${id}' not found`);
    }

    if (!isAdmin && devotional.authorId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this devotional',
      );
    }

    await this.prisma.devotional.delete({ where: { id } });
    return { message: 'Devotional deleted successfully' };
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = this.slugify(title);
    let slug = baseSlug;
    let counter = 1;

    while (await this.prisma.devotional.findUnique({ where: { slug } })) {
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
