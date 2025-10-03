import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

async function main() {
  const prisma = new PrismaClient();
  const email = process.argv[2] || process.env.ADMIN_SEED_EMAIL || 'admin@local';
  const username = process.argv[3] || process.env.ADMIN_SEED_USERNAME || 'admin';
  const password = process.argv[4] || process.env.ADMIN_SEED_PASSWORD || 'Cambiar123!';
  const hash = bcrypt.hashSync(password, 10);

  const exists = await prisma.adminUser.findFirst({ where: { OR: [{ email }, { username }] } });
  if (exists) {
    console.log('Admin ya existe:', { id: exists.id, email: exists.email, username: exists.username });
    return;
  }
  const user = await prisma.adminUser.create({
    data: { email, username, passwordHash: hash, roles: ['admin'], isActive: true },
  });
  console.log('Admin creado:', { id: user.id, email: user.email, username: user.username });
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => process.exit(0));
