import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const data = await prisma.$queryRaw`SELECT * FROM "home_page_posters"`;
  console.log(data);
}
run().finally(() => prisma.$disconnect());
