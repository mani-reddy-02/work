import { prisma } from '../config/prisma';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('================================================================');
  console.log('=== STAGING DATABASE MIGRATION & VERIFICATION RUNNER ===');
  console.log('================================================================\n');

  try {
    // 1. Pre-Migration Baseline Records Check
    console.log('[STEP 1] Recording Pre-Migration Baseline Counts...');
    const baselineCounts: any = await prisma.$queryRaw`
      SELECT 
        (SELECT COUNT(*) FROM "OPBooking") as "opBookings",
        (SELECT COUNT(*) FROM "Hospital") as "hospitals",
        (SELECT COUNT(*) FROM "User") as "users";
    `;
    const opBefore = Number(baselineCounts[0].opBookings);
    const hospBefore = Number(baselineCounts[0].hospitals);
    const userBefore = Number(baselineCounts[0].users);
    console.log(`  -> Baseline: OPBookings=${opBefore}, Hospitals=${hospBefore}, Users=${userBefore}`);

    // 2. Pre-Migration Dependency and Collision Checks
    console.log('\n[STEP 2] Running Strict Pre-Migration Conflict Checks...');
    const preCheckSql = `
      DO $$ 
      DECLARE
          tbl_exists boolean;
          enum_dir_exists boolean;
          enum_status_exists boolean;
          col_count integer;
      BEGIN
          SELECT EXISTS (
              SELECT 1 FROM information_schema.tables 
              WHERE table_schema = 'public' AND table_name = 'call_logs'
          ) INTO tbl_exists;
          
          SELECT EXISTS (
              SELECT 1 FROM pg_type WHERE typname = 'CallDirection'
          ) INTO enum_dir_exists;
          
          SELECT EXISTS (
              SELECT 1 FROM pg_type WHERE typname = 'CallStatus'
          ) INTO enum_status_exists;

          IF tbl_exists THEN
              SELECT count(*) INTO col_count 
              FROM information_schema.columns 
              WHERE table_schema = 'public' AND table_name = 'call_logs';
              
              IF col_count != 18 THEN
                  RAISE EXCEPTION 'PRE-MIGRATION ABORT: Table call_logs already exists with incompatible schema (% columns).', col_count;
              END IF;
              RAISE NOTICE 'Table call_logs already exists with compatible definition.';
          END IF;

          IF enum_dir_exists THEN
              IF NOT EXISTS (
                  SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid 
                  WHERE t.typname = 'CallDirection' AND e.enumlabel = 'PATIENT_TO_HOSPITAL'
              ) THEN
                  RAISE EXCEPTION 'PRE-MIGRATION ABORT: Type CallDirection exists with incompatible values.';
              END IF;
          END IF;

          IF enum_status_exists THEN
              IF NOT EXISTS (
                  SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid 
                  WHERE t.typname = 'CallStatus' AND e.enumlabel = 'INITIATED'
              ) THEN
                  RAISE EXCEPTION 'PRE-MIGRATION ABORT: Type CallStatus exists with incompatible values.';
              END IF;
          END IF;
      END $$;
    `;
    await prisma.$executeRawUnsafe(preCheckSql);
    console.log('  -> Pre-migration checks passed: No conflicting tables or enums detected.');

    // 3. Apply Migration
    console.log('\n[STEP 3] Executing Corrected Migration Script...');
    const migrationPath = path.join(__dirname, '../../prisma/migrations/20261118_add_call_logs/migration.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    // Split statements or execute raw
    await prisma.$executeRawUnsafe(migrationSql);
    console.log('  -> Migration SQL executed successfully.');

    // 4. Verify Schema After Migration
    console.log('\n[STEP 4] Verifying Resulting Schema Structure...');
    const tableColumns: any = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'call_logs'
      ORDER BY ordinal_position;
    `;
    console.log(`  -> call_logs created with ${tableColumns.length} columns (Expected: 18).`);
    if (tableColumns.length !== 18) {
      throw new Error(`Column count mismatch in call_logs: expected 18, got ${tableColumns.length}`);
    }

    const rlsCheck: any = await prisma.$queryRaw`
      SELECT relname, relrowsecurity, relforcerowsecurity
      FROM pg_class
      WHERE relname = 'call_logs';
    `;
    console.log('  -> RLS Status on call_logs:', rlsCheck[0]);
    if (!rlsCheck[0]?.relrowsecurity) {
      throw new Error('Supabase Row-Level Security (RLS) is NOT enabled on call_logs!');
    }

    const rlsPolicies: any = await prisma.$queryRaw`
      SELECT policyname, permissive, roles::text as roles, cmd, qual::text as qual
      FROM pg_policies
      WHERE tablename = 'call_logs';
    `;
    console.log(`  -> Active public policies on call_logs: ${rlsPolicies.length} (Expected: 0 for Default Deny All)`);
    if (rlsPolicies.length > 0) {
      throw new Error(`Unexpected public policies found on call_logs: ${JSON.stringify(rlsPolicies)}`);
    }

    // 5. Test Rollback Procedure (Without CASCADE)
    console.log('\n[STEP 5] Testing Non-Destructive Rollback Procedure (Without CASCADE)...');
    // Check dependent foreign keys before dropping
    const fkDependencies: any = await prisma.$queryRaw`
      SELECT
          tc.table_name as dependent_table,
          kcu.column_name as foreign_column,
          ccu.table_name AS referenced_table
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'call_logs';
    `;
    console.log(`  -> Dependent foreign keys referencing call_logs: ${fkDependencies.length} (Expected: 0)`);
    if (fkDependencies.length > 0) {
      throw new Error('Cannot drop call_logs without CASCADE: active foreign key dependencies detected!');
    }

    // Execute safe rollback without CASCADE
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "call_logs";`);
    await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "CallStatus";`);
    await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "CallDirection";`);
    console.log('  -> Rollback executed cleanly without CASCADE.');

    // Verify baseline counts after rollback
    const afterRollbackCounts: any = await prisma.$queryRaw`
      SELECT 
        (SELECT COUNT(*) FROM "OPBooking") as "opBookings",
        (SELECT COUNT(*) FROM "Hospital") as "hospitals",
        (SELECT COUNT(*) FROM "User") as "users";
    `;
    assert(Number(afterRollbackCounts[0].opBookings) === opBefore, 'OPBookings count altered during rollback!');
    assert(Number(afterRollbackCounts[0].hospitals) === hospBefore, 'Hospitals count altered during rollback!');
    assert(Number(afterRollbackCounts[0].users) === userBefore, 'Users count altered during rollback!');
    console.log('  -> Rollback verification successful: Existing tables and records 100% unaffected.');

    // 6. Re-Apply Migration Cleanly for Staging Operation
    console.log('\n[STEP 6] Re-applying Staging Migration Cleanly...');
    await prisma.$executeRawUnsafe(migrationSql);
    console.log('  -> Staging migration re-applied successfully.');

    // 7. Verify Authorized Backend Operations (Create, Query, Update)
    console.log('\n[STEP 7] Verifying Authorized Backend Operations...');
    const testCallId = 'test-call-' + Date.now();
    const testCallSid = 'test-sid-' + Date.now();

    const createdRecord: any = await (prisma as any).callLog.create({
      data: {
        id: testCallId,
        callSid: testCallSid,
        bookingType: 'OP',
        initiatedById: 'test-admin-uuid',
        callerRole: 'SUPER_ADMIN',
        fromPhone: 'enc:v1:test_encrypted_from',
        toPhone: 'enc:v1:test_encrypted_to',
        virtualNumber: '08047290980',
        direction: 'PATIENT_TO_HOSPITAL',
        status: 'INITIATED',
      },
    });
    console.log(`  -> Backend INSERT verified: Record created with ID: ${createdRecord.id}`);

    const fetchedRecord: any = await (prisma as any).callLog.findUnique({
      where: { callSid: testCallSid },
    });
    console.log(`  -> Backend SELECT verified: Found status: ${fetchedRecord.status}`);

    const updatedRecord: any = await (prisma as any).callLog.update({
      where: { callSid: testCallSid },
      data: {
        status: 'COMPLETED',
        duration: 45,
      },
    });
    console.log(`  -> Backend UPDATE verified: Updated status to: ${updatedRecord.status}, duration: ${updatedRecord.duration}s`);

    // Clean up test record
    await (prisma as any).callLog.delete({
      where: { id: testCallId },
    });
    console.log('  -> Test record cleaned up successfully.');

    // 8. Final Baseline Integrity Check
    console.log('\n[STEP 8] Final Existing Records Integrity Check...');
    const finalCounts: any = await prisma.$queryRaw`
      SELECT 
        (SELECT COUNT(*) FROM "OPBooking") as "opBookings",
        (SELECT COUNT(*) FROM "Hospital") as "hospitals",
        (SELECT COUNT(*) FROM "User") as "users";
    `;
    const opAfter = Number(finalCounts[0].opBookings);
    const hospAfter = Number(finalCounts[0].hospitals);
    const userAfter = Number(finalCounts[0].users);

    console.log(`  -> Final Counts: OPBookings=${opAfter} (${opAfter === opBefore ? 'MATCH' : 'MISMATCH'}), Hospitals=${hospAfter} (${hospAfter === hospBefore ? 'MATCH' : 'MISMATCH'}), Users=${userAfter} (${userAfter === userBefore ? 'MATCH' : 'MISMATCH'})`);

    if (opAfter !== opBefore || hospAfter !== hospBefore || userAfter !== userBefore) {
      throw new Error('Integrity failure: Existing database records were modified during migration!');
    }

    console.log('\n================================================================');
    console.log('=== STAGING MIGRATION & VERIFICATION COMPLETED WITH 100% SUCCESS ===');
    console.log('================================================================');
  } catch (err: any) {
    console.error('\n[STAGING MIGRATION ERROR]:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

main();
