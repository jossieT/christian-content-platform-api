import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Devotionals (e2e)', () => {
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

  it('creates a devotional and exposes it through the public endpoints', async () => {
    const unique = Date.now();
    const email = `devotional-${unique}@e2e.test`;
    const password = 'DevotionalPassword123!';

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: 'Devotional',
        lastName: 'Tester',
        role: 'CREATOR',
      },
    });

    const category = await prisma.category.create({
      data: {
        name: `Devotional Category ${unique}`,
        slug: `devotional-category-${unique}`,
        description: 'Temporary category for devotional e2e tests',
      },
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);

    const token = loginResponse.body.accessToken;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const date = today.toISOString().split('T')[0];

    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/devotionals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: `Daily Devotional ${unique}`,
        scriptureReference: 'John 15:5',
        scriptureText: 'I am the vine; you are the branches.',
        content: 'A devotional created during e2e testing.',
        prayer: 'Lord, help us abide in You.',
        date,
        status: 'PUBLISHED',
        categoryId: category.id,
      })
      .expect(201);

    expect(createResponse.body.title).toBe(`Daily Devotional ${unique}`);

    const todayResponse = await request(app.getHttpServer())
      .get('/api/v1/devotionals/today')
      .expect(200);

    expect(todayResponse.body.title).toBe(`Daily Devotional ${unique}`);

    const publicListResponse = await request(app.getHttpServer())
      .get('/api/v1/devotionals')
      .expect(200);

    expect(publicListResponse.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: `Daily Devotional ${unique}` }),
      ]),
    );

    await prisma.devotional.deleteMany({
      where: { title: { contains: `Daily Devotional ${unique}` } },
    });
    await prisma.category.deleteMany({ where: { id: category.id } });
    await prisma.user.deleteMany({ where: { id: user.id } });
  });
});
