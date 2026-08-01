const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

(async () => {
  try {
    const existing = await prisma.user.findUnique({ where: { email: 'admin@christianplatform.org' } });
    if (existing) {
      console.log('exists');
      return;
    }

    const passwordHash = await bcrypt.hash('Admin123!', 10);
    const user = await prisma.user.create({
      data: {
        email: 'admin@christianplatform.org',
        passwordHash,
        firstName: 'System',
        lastName: 'Admin',
        role: 'ADMIN',
      },
    });

    console.log('created', user.id);
  } finally {
    await prisma.$disconnect();
  }
})();
