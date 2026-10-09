const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const doc = await prisma.user.findFirst({ where: { name: { contains: 'Smith' } } });
  if (doc && doc.departmentId) {
     const dept = await prisma.department.findUnique({ where: { id: doc.departmentId }, include: { specialty: true } });
     console.log('Doc Dept Specialty:', dept.specialty?.name);
     const condition = await prisma.platformCondition.findFirst({ where: { specialtyId: dept.specialtyId } });
     console.log('Condition Name:', condition?.name);
  } else {
     console.log('No doc or departmentId');
  }
}
main().finally(() => prisma.$disconnect());
