import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@soytuagente.com';
  const username = 'admin';
  const password = 'admin123'; // luego lo cambias
  const hash = await bcrypt.hash(password, 10);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: {
      email,
      username,
      passwordHash: hash,
      roles: ['admin'],
      isActive: true,
    },
  });

  console.log('✅ Admin creado:', {
    email: admin.email,
    username: admin.username,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
