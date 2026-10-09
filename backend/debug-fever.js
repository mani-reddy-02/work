const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const fever = await prisma.platformCondition.findFirst({ where: { name: { contains: 'Fever', mode: 'insensitive' } } });
  console.log('Fever:', fever);
  if (fever) {
    const specialty = await prisma.platformSpecialty.findUnique({ where: { id: fever.specialtyId } });
    console.log('Specialty:', specialty);
    const depts = await prisma.department.findMany({ 
      where: { specialtyId: fever.specialtyId }, 
      include: { 
        hospital: { select: { name: true } }, 
        users: { select: { id: true, name: true, role: true } } 
      } 
    });
    console.log('Departments with this specialty:', JSON.stringify(depts, null, 2));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
