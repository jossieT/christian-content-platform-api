import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateReadingProgressDto } from './dto/update-reading-progress.dto';

@Injectable()
export class LibraryService {
  constructor(private prisma: PrismaService) {}

  async claimBook(userId: string, bookId: string) {
    const book = await this.prisma.book.findUnique({ where: { id: bookId } });

    if (!book || book.status !== ContentStatus.PUBLISHED) {
      throw new NotFoundException(`Book with ID '${bookId}' not found or unavailable`);
    }

    const existingEntry = await this.prisma.userLibrary.findUnique({
      where: {
        userId_bookId: { userId, bookId },
      },
    });

    if (existingEntry) {
      throw new ConflictException('This book is already in your library');
    }

    const [libraryEntry] = await this.prisma.$transaction([
      this.prisma.userLibrary.create({
        data: {
          userId,
          bookId,
          pricePaid: book.price,
        },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              slug: true,
              authorName: true,
              coverImageUrl: true,
              format: true,
              fileUrl: true,
            },
          },
        },
      }),
      this.prisma.readingProgress.upsert({
        where: { userId_bookId: { userId, bookId } },
        create: {
          userId,
          bookId,
          completionPercentage: 0,
        },
        update: {},
      }),
    ]);

    return libraryEntry;
  }

  async getUserBookshelf(userId: string) {
    const entries = await this.prisma.userLibrary.findMany({
      where: { userId },
      orderBy: { purchasedAt: 'desc' },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            slug: true,
            authorName: true,
            coverImageUrl: true,
            format: true,
            fileUrl: true,
          },
        },
      },
    });

    const bookIds = entries.map((e) => e.bookId);

    const progresses = await this.prisma.readingProgress.findMany({
      where: {
        userId,
        bookId: { in: bookIds },
      },
    });

    const progressMap = new Map(progresses.map((p) => [p.bookId, p]));

    return entries.map((entry) => ({
      ...entry,
      progress: progressMap.get(entry.bookId) || {
        completionPercentage: 0,
        currentLocation: null,
        lastReadAt: entry.purchasedAt,
      },
    }));
  }

  async getReadingProgress(userId: string, bookId: string) {
    await this.verifyEntitlement(userId, bookId);

    const progress = await this.prisma.readingProgress.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });

    if (!progress) {
      return {
        userId,
        bookId,
        currentLocation: null,
        completionPercentage: 0,
        lastReadAt: new Date(),
      };
    }

    return progress;
  }

  async updateReadingProgress(
    userId: string,
    bookId: string,
    dto: UpdateReadingProgressDto,
  ) {
    await this.verifyEntitlement(userId, bookId);

    return this.prisma.readingProgress.upsert({
      where: { userId_bookId: { userId, bookId } },
      create: {
        userId,
        bookId,
        currentLocation: dto.currentLocation,
        completionPercentage: dto.completionPercentage ?? 0,
        lastReadAt: new Date(),
      },
      update: {
        ...(dto.currentLocation !== undefined && { currentLocation: dto.currentLocation }),
        ...(dto.completionPercentage !== undefined && {
          completionPercentage: dto.completionPercentage,
        }),
        lastReadAt: new Date(),
      },
    });
  }

  private async verifyEntitlement(userId: string, bookId: string) {
    const entitlement = await this.prisma.userLibrary.findUnique({
      where: { userId_bookId: { userId, bookId } },
    });

    if (!entitlement) {
      throw new ForbiddenException('You do not own this book in your library');
    }
  }
}
