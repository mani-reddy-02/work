import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const candidates = [
  'Admin@123456',
  'Doctor@123456',
  'Doctor@123',
  'Hospital@123456',
  'Hospital@123',
  'Password@123',
  'password123',
  '123456',
  'admin123',
  'secret',
  'Admin@123',
  'Test@123',
  'User@123456',
];

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      role: true,
      hospitalId: true,
      passwordHash: true,
      active: true,
    }
  });

  console.log(`Found ${users.length} users:`);
  for (const u of users) {
    let matchedPass = 'UNKNOWN (hash set)';
    if (!u.passwordHash) {
      matchedPass = 'NO PASSWORD';
    } else {
      for (const c of candidates) {
        if (await bcrypt.compare(c, u.passwordHash)) {
          matchedPass = c;
          break;
        }
      }
    }
    console.log(`- Role: ${u.role} | Name: ${u.name} | Email: ${u.email} | Phone: ${u.phone} | Password: ${matchedPass}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
