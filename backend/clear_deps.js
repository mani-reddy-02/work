const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearDepartments() {
  await prisma.user.updateMany({ data: { departmentId: null } });
  await prisma.department.deleteMany();
  console.log('Departments cleared');
  await prisma.$disconnect();
}

clearDepartments().catch(console.error);
