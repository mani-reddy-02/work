const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const depts = await prisma.department.findMany({ select: { id: true, name: true }});
  const staff = await prisma.user.findMany({ select: { id: true, name: true, role: true }});
  console.log('Departments:', depts.length, depts);
  console.log('Staff:', staff.length, staff);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
