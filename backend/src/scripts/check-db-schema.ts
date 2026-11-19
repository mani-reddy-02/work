import { prisma } from '../config/prisma';

async function main() {
  console.log('================================================================');
  console.log('=== READ-ONLY DATABASE SCHEMA & RLS VERIFICATION ===');
  console.log('================================================================\n');

  try {
    // 1. Check Table Existence
    const tableExists: any = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'call_logs'
      ) as "exists";
    `;
    const isTablePresent = Boolean(tableExists[0]?.exists);
    console.log(`[CHECK 1] Table "call_logs" Exists: ${isTablePresent}`);

    if (isTablePresent) {
      // 2. Check All Columns
      const columns: any = await prisma.$queryRaw`
        SELECT column_name, data_type, udt_name, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'call_logs'
        ORDER BY ordinal_position;
      `;
      console.log(`\n[CHECK 2] Columns Count: ${columns.length} (Expected: 18)`);
      columns.forEach((c: any, i: number) => {
        console.log(`  ${i + 1}. ${c.column_name} (${c.udt_name}, nullable: ${c.is_nullable}, default: ${c.column_default})`);
      });

      // 3. Check Enums
      const enums: any = await prisma.$queryRaw`
        SELECT t.typname, e.enumlabel
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname IN ('CallDirection', 'CallStatus')
        ORDER BY t.typname, e.enumsortorder;
      `;
      console.log(`\n[CHECK 3] Enums count: ${enums.length}`);
      const dirLabels = enums.filter((e: any) => e.typname === 'CallDirection').map((e: any) => e.enumlabel);
      const statusLabels = enums.filter((e: any) => e.typname === 'CallStatus').map((e: any) => e.enumlabel);
      console.log('  CallDirection values:', dirLabels);
      console.log('  CallStatus values:', statusLabels);

      // 4. Check Indexes
      const indexes: any = await prisma.$queryRaw`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'call_logs'
        ORDER BY indexname;
      `;
      console.log(`\n[CHECK 4] Indexes count: ${indexes.length}`);
      indexes.forEach((idx: any) => {
        console.log(`  - ${idx.indexname}: ${idx.indexdef}`);
      });

      // 5. Check RLS Configuration
      const rlsStatus: any = await prisma.$queryRaw`
        SELECT rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'call_logs';
      `;
      console.log(`\n[CHECK 5] Row Level Security (RLS) Enabled: ${rlsStatus[0]?.rowsecurity}`);

      const policies: any = await prisma.$queryRaw`
        SELECT policyname, permissive, roles::text as roles, cmd, qual::text as qual
        FROM pg_policies 
        WHERE tablename = 'call_logs';
      `;
      console.log(`  Policies count: ${policies.length}`);
      policies.forEach((p: any) => {
        console.log(`  - Policy: ${p.policyname} (${p.cmd}, roles: ${p.roles})`);
      });
    } else {
      console.log('\n[CRITICAL NOTICE] Table "call_logs" does NOT exist in this database target.');
    }

    // 6. Record counts of primary entities
    const counts: any = await prisma.$queryRaw`
      SELECT 
        (SELECT COUNT(*) FROM "OPBooking") as "opBookings",
        (SELECT COUNT(*) FROM "Hospital") as "hospitals",
        (SELECT COUNT(*) FROM "User") as "users";
    `;
    console.log('\n[CHECK 6] Existing Business Records:');
    console.log(`  OPBookings: ${counts[0]?.opBookings}`);
    console.log(`  Hospitals:  ${counts[0]?.hospitals}`);
    console.log(`  Users:      ${counts[0]?.users}`);

  } catch (err: any) {
    console.error('[ERROR during check]:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
