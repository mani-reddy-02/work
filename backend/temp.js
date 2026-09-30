require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const conds = await prisma.platformCondition.findMany({ include: { specialty: true } });
  console.log(JSON.stringify(conds, null, 2));
}

main().finally(() => prisma.$disconnect());
