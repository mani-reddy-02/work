const { PrismaClient, Role } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const fever = await prisma.platformCondition.findFirst({
    where: { name: { contains: 'Fever', mode: 'insensitive' } },
  });
  console.log('Fever condition ID:', fever.id);

  const targetSpecialtyId = fever.specialtyId;

  const whereClause = {
    departments: {
      some: {
        specialtyId: targetSpecialtyId,
        users: { some: { role: Role.DOCTOR, active: true } }
      }
    }
  };

  const hospitals = await prisma.hospital.findMany({
    where: whereClause,
    include: {
      departments: {
        select: {
          id: true,
          name: true,
          specialtyId: true,
          users: true
        }
      }
    }
  });

  console.log('Hospitals found:', hospitals.length);
  console.log(JSON.stringify(hospitals.map(h => h.name), null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
