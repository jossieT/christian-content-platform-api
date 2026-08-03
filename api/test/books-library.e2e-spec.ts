import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Books and Library (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    prisma = moduleFixture.get(PrismaService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('hides draft books from the public catalog and detail route', async () => {
    const unique = Date.now();
    const adminEmail = `admin-${unique}@e2e.test`;
    const password = 'AdminPassword123!';

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        firstName: 'Admin',
        lastName: 'E2E',
        role: 'ADMIN',
      },
    });

    const category = await prisma.category.create({
      data: {
        name: `E2E Category ${unique}`,
        slug: `e2e-category-${unique}`,
        description: 'Temporary category for e2e tests',
      },
    });

    const draftBookPayload = {
      title: `Draft Book ${unique}`,
      authorName: 'Test Author',
      description: 'A draft book that should stay hidden from the public API.',
      status: 'DRAFT',
      categoryId: category.id,
    };

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password })
      .expect(200);

    const token = loginResponse.body.accessToken;

    await request(app.getHttpServer())
      .post('/api/v1/books')
      .set('Authorization', `Bearer ${token}`)
      .send(draftBookPayload)
      .expect(201);

    const listResponse = await request(app.getHttpServer())
      .get('/api/v1/books')
      .expect(200);

    expect(listResponse.body.items).toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({ title: draftBookPayload.title }),
      ]),
    );

    const detailResponse = await request(app.getHttpServer())
      .get(
        `/api/v1/books/${draftBookPayload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      )
      .expect(200);

    expect(detailResponse.body.status).toBe('DRAFT');

    await prisma.book.deleteMany({
      where: { title: { contains: `Draft Book ${unique}` } },
    });
    await prisma.category.deleteMany({ where: { id: category.id } });
    await prisma.user.deleteMany({ where: { email: adminEmail } });
  });

  it('lets a user claim a book and manage reading progress', async () => {
    const unique = Date.now();
    const userEmail = `reader-${unique}@e2e.test`;
    const password = 'ReaderPassword123!';

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: userEmail,
        passwordHash,
        firstName: 'Reader',
        lastName: 'E2E',
        role: 'USER',
      },
    });

    const category = await prisma.category.create({
      data: {
        name: `Library Category ${unique}`,
        slug: `library-category-${unique}`,
        description: 'Temporary category for library e2e tests',
      },
    });

    const publishedBook = await prisma.book.create({
      data: {
        title: `Library Book ${unique}`,
        slug: `library-book-${unique}`,
        authorName: 'Library Author',
        description: 'A published book that should be claimable by a user.',
        price: 0,
        isFree: true,
        format: 'EPUB',
        status: 'PUBLISHED',
        categoryId: category.id,
      },
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: userEmail, password })
      .expect(200);

    const token = loginResponse.body.accessToken;

    const claimResponse = await request(app.getHttpServer())
      .post(`/api/v1/library/claim/${publishedBook.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    expect(claimResponse.body.book.id).toBe(publishedBook.id);

    const bookshelfResponse = await request(app.getHttpServer())
      .get('/api/v1/library')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(bookshelfResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          book: expect.objectContaining({ id: publishedBook.id }),
        }),
      ]),
    );

    const progressResponse = await request(app.getHttpServer())
      .get(`/api/v1/library/progress/${publishedBook.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(progressResponse.body.completionPercentage).toBe(0);

    await request(app.getHttpServer())
      .patch(`/api/v1/library/progress/${publishedBook.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ currentLocation: 'Chapter 1', completionPercentage: 25 })
      .expect(200);

    const updatedProgress = await prisma.readingProgress.findUnique({
      where: { userId_bookId: { userId: user.id, bookId: publishedBook.id } },
    });

    expect(updatedProgress?.currentLocation).toBe('Chapter 1');
    expect(updatedProgress?.completionPercentage).toBe(25);

    await prisma.readingProgress.deleteMany({ where: { userId: user.id } });
    await prisma.userLibrary.deleteMany({ where: { userId: user.id } });
    await prisma.book.deleteMany({ where: { id: publishedBook.id } });
    await prisma.category.deleteMany({ where: { id: category.id } });
    await prisma.user.deleteMany({ where: { id: user.id } });
  });
});
