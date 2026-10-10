const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const reports = await prisma.patientReport.findMany();
  console.log(reports);
}

main().finally(() => prisma.$disconnect());
