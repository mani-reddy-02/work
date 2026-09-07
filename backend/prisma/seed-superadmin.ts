import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@mediquee.com';
  const plainPassword = 'Admin@123456';
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      role: Role.SUPER_ADMIN,
      active: true,
      passwordHash,
    },
    create: {
      name: 'Super Admin',
      email,
      phone: '9999999999',
      role: Role.SUPER_ADMIN,
      passwordHash,
      active: true,
      designation: 'System Administrator',
    },
  });

  console.log('Super Admin seeded successfully:');
  console.log(`Email: ${admin.email}`);
  console.log(`Role: ${admin.role}`);
  console.log(`Password: ${plainPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
