const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = 'seed-admin@christianplatform.org';
  const passwordHash = await bcrypt.hash('SeedAdmin123!', 10);

  let admin = await prisma.user.findUnique({ where: { email } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: 'Seed',
        lastName: 'Admin',
        role: 'ADMIN',
      },
    });
  }

  const categories = [
    {
      name: 'Faith & Prayer',
      slug: 'faith-prayer',
      description: 'Encouragement for daily prayer and spiritual growth.',
    },
    {
      name: 'Bible Study',
      slug: 'bible-study',
      description: 'Short studies and reflections grounded in Scripture.',
    },
  ];

  for (const categoryData of categories) {
    await prisma.category.upsert({
      where: { slug: categoryData.slug },
      update: {},
      create: categoryData,
    });
  }

  const category = await prisma.category.findUnique({ where: { slug: 'faith-prayer' } });

  const articles = [
    {
      title: 'Finding Peace in a Restless World',
      slug: 'finding-peace-in-a-restless-world',
      summary: 'A short reflection on surrendering anxiety to God.',
      content: 'Peace comes when we bring our worries to God and trust Him with the outcomes.',
      status: 'PUBLISHED',
      authorId: admin.id,
      categoryId: category.id,
    },
    {
      title: 'Why Community Matters in the Christian Life',
      slug: 'why-community-matters-in-the-christian-life',
      summary: 'The value of belonging and encouragement in the church.',
      content: 'God designed us for fellowship, growth, and shared discipleship.',
      status: 'PUBLISHED',
      authorId: admin.id,
      categoryId: category.id,
    },
  ];

  for (const articleData of articles) {
    await prisma.article.upsert({
      where: { slug: articleData.slug },
      update: {},
      create: articleData,
    });
  }

  const devotionals = [
    {
      title: 'Abiding in the Vine',
      slug: 'abiding-in-the-vine',
      scriptureReference: 'John 15:5',
      scriptureText: 'I am the vine; you are the branches.',
      content: 'Today we reflect on staying connected to Christ in every season.',
      prayer: 'Lord, help us remain rooted in Your love.',
      date: new Date('2026-08-01T00:00:00.000Z'),
      status: 'PUBLISHED',
      authorId: admin.id,
      categoryId: category.id,
    },
    {
      title: 'Trusting God with Tomorrow',
      slug: 'trusting-god-with-tomorrow',
      scriptureReference: 'Matthew 6:34',
      scriptureText: 'Do not worry about tomorrow.',
      content: 'God invites us to live with courage and trust today.',
      prayer: 'Father, teach us to rest in Your care.',
      date: new Date('2026-08-02T00:00:00.000Z'),
      status: 'PUBLISHED',
      authorId: admin.id,
      categoryId: category.id,
    },
  ];

  for (const devotionalData of devotionals) {
    await prisma.devotional.upsert({
      where: { slug: devotionalData.slug },
      update: {},
      create: devotionalData,
    });
  }

  const books = [
    {
      title: 'The Pursuit of God',
      slug: 'the-pursuit-of-god',
      authorName: 'A. W. Tozer',
      description: 'A classic devotional work encouraging deeper fellowship with God.',
      price: 0,
      isFree: true,
      format: 'EPUB',
      status: 'PUBLISHED',
      categoryId: category.id,
    },
    {
      title: 'Streams in the Desert',
      slug: 'streams-in-the-desert',
      authorName: 'L. B. Cowman',
      description: 'A timeless collection of devotional encouragement.',
      price: 0,
      isFree: true,
      format: 'PDF',
      status: 'PUBLISHED',
      categoryId: category.id,
    },
  ];

  for (const bookData of books) {
    await prisma.book.upsert({
      where: { slug: bookData.slug },
      update: {},
      create: bookData,
    });
  }

  console.log('Seed content created successfully');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
