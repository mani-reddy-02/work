const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const allConditions = await prisma.platformCondition.findMany();
  console.log(`Found ${allConditions.length} conditions.`);
  
  // Assign half to ADVANCED for demonstration, since they all default to GENERAL.
  const advancedCount = Math.floor(allConditions.length / 2);
  let updatedCount = 0;
  
  for (let i = 0; i < advancedCount; i++) {
    await prisma.platformCondition.update({
      where: { id: allConditions[i].id },
      data: { classification: 'ADVANCED' }
    });
    updatedCount++;
  }
  
  console.log(`Updated ${updatedCount} conditions to ADVANCED.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
