import { prisma } from '../config/prisma';

async function main() {
  console.log('=== Checking Database Objects ===');
  try {
    const tables: any = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('call_logs', 'OPBooking', 'Hospital', 'User')
      ORDER BY table_name;
    `;
    console.log('Tables check:', tables);

    const enums: any = await prisma.$queryRaw`
      SELECT t.typname, e.enumlabel
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname IN ('CallDirection', 'CallStatus', 'Role')
      ORDER BY t.typname, e.enumsortorder;
    `;
    console.log('Enums check count:', enums.length);
    const enumTypes = [...new Set(enums.map((e: any) => e.typname))];
    console.log('Distinct enums found:', enumTypes);

    const counts: any = await prisma.$queryRaw`
      SELECT 
        (SELECT COUNT(*) FROM "OPBooking") as "opBookingsCount",
        (SELECT COUNT(*) FROM "Hospital") as "hospitalsCount",
        (SELECT COUNT(*) FROM "User") as "usersCount";
    `;
    console.log('Existing Records Summary:', counts);
  } catch (err: any) {
    console.error('Error during check:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
