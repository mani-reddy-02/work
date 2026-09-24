const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const fever = await prisma.platformCondition.findFirst({
    where: { name: { contains: 'Fever', mode: 'insensitive' } },
    include: { specialty: true }
  });
  console.log('Fever condition:', fever);

  if (fever) {
    const depts = await prisma.department.findMany({
      where: { specialtyId: fever.specialtyId },
      include: {
        hospital: { select: { id: true, name: true } },
        users: { select: { id: true, name: true, role: true, active: true } }
      }
    });
    console.log('Departments with same specialty:', JSON.stringify(depts, null, 2));

    const allDoctors = await prisma.user.findMany({
      where: { role: 'DOCTOR' },
      include: { department: true }
    });
    console.log('All doctors departments:', JSON.stringify(allDoctors.map(d => ({ doc: d.name, dept: d.department?.name, specialtyId: d.department?.specialtyId })), null, 2));
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
