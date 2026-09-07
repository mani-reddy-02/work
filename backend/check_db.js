const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
  const hospitalCount = await prisma.hospital.count();
  const permissionCount = await prisma.permission.count();
  console.log(`Users: ${userCount}, Hospitals: ${hospitalCount}, Permissions: ${permissionCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
