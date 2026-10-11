const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const cols = await p.$queryRawUnsafe(`
    SELECT column_name, data_type, udt_name 
    FROM information_schema.columns 
    WHERE table_name = 'lab_bookings'
    ORDER BY ordinal_position
  `);
  console.log('lab_bookings columns:', cols);
}
main().catch(console.error).finally(() => p.$disconnect());
