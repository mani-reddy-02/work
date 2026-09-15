const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const doctors = await prisma.user.findMany({
      where: { role: 'DOCTOR' },
      include: {
        department: {
          include: { specialty: true }
        },
        hospital: true
      }
    });

    console.log(JSON.stringify(doctors.map(u => ({
      name: u.name,
      active: u.active,
      specialty: u.department?.specialty?.name,
      hospital: u.hospital?.name
    })), null, 2));

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
