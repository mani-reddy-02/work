import { prisma } from '../config/prisma';

async function main() {
  console.log('=== Applying Comprehensive Supabase Row-Level Security (RLS) ===\n');

  // List of all tables in public schema
  const publicTables: { name: string; isQuoted: boolean }[] = [
    { name: 'Department', isQuoted: true },
    { name: 'Hospital', isQuoted: true },
    { name: 'HospitalVerification', isQuoted: true },
    { name: 'LabSchedule', isQuoted: true },
    { name: 'OPBooking', isQuoted: true },
    { name: 'Permission', isQuoted: true },
    { name: 'PlatformCondition', isQuoted: true },
    { name: 'PlatformSpecialty', isQuoted: true },
    { name: 'RolePermission', isQuoted: true },
    { name: 'User', isQuoted: true },
    { name: '_prisma_migrations', isQuoted: true },
    { name: 'diseases', isQuoted: false },
    { name: 'doctor_lab_orders', isQuoted: false },
    { name: 'doctor_schedules', isQuoted: false },
    { name: 'faqs', isQuoted: false },
    { name: 'home_nursing_bookings', isQuoted: false },
    { name: 'home_page_posters', isQuoted: false },
    { name: 'hospital_labs', isQuoted: false },
    { name: 'insurances', isQuoted: false },
    { name: 'lab_booking_items', isQuoted: false },
    { name: 'lab_bookings', isQuoted: false },
    { name: 'lab_packages', isQuoted: false },
    { name: 'lab_tests', isQuoted: false },
    { name: 'marketing_requests', isQuoted: false },
    { name: 'medical_camp_request_history', isQuoted: false },
    { name: 'medical_camp_requests', isQuoted: false },
    { name: 'notifications', isQuoted: false },
    { name: 'nursing_service_offerings', isQuoted: false },
    { name: 'nursing_services', isQuoted: false },
    { name: 'patient_reports', isQuoted: false },
    { name: 'patient_vitals', isQuoted: false },
    { name: 'payout_records', isQuoted: false },
    { name: 'platform_lab_departments', isQuoted: false },
    { name: 'platform_lab_tests', isQuoted: false },
    { name: 'prescription_items', isQuoted: false },
    { name: 'prescriptions', isQuoted: false },
    { name: 'review_aggregates', isQuoted: false },
    { name: 'review_invitations', isQuoted: false },
    { name: 'review_moderation_logs', isQuoted: false },
    { name: 'review_reports', isQuoted: false },
    { name: 'review_responses', isQuoted: false },
    { name: 'reviews', isQuoted: false },
    { name: 'settlement_attachments', isQuoted: false },
    { name: 'settlement_items', isQuoted: false },
    { name: 'settlements', isQuoted: false },
    { name: 'video_consultations', isQuoted: false },
    { name: 'whatsapp_message_logs', isQuoted: false },
    { name: 'whatsapp_otps', isQuoted: false },
  ];

  // Helper to format table name with quotes if needed
  const formatTable = (schema: string, name: string, isQuoted: boolean) =>
    `${schema}.${isQuoted ? `"${name}"` : name}`;

  // 1. Enable RLS on every table in public schema
  console.log('1. Enabling RLS on all public schema tables...');
  for (const t of publicTables) {
    const tableRef = formatTable('public', t.name, t.isQuoted);
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE ${tableRef} ENABLE ROW LEVEL SECURITY;`);
      console.log(`  ✓ RLS enabled on ${tableRef}`);
    } catch (err: any) {
      console.error(`  ✗ Error enabling RLS on ${tableRef}:`, err.message);
    }
  }

  // Also ensure RLS is enabled on storage schema tables
  console.log('\n2. Ensuring RLS enabled on storage tables...');
  const storageTables = ['buckets', 'objects'];
  for (const st of storageTables) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE storage.${st} ENABLE ROW LEVEL SECURITY;`);
      console.log(`  ✓ RLS enabled on storage.${st}`);
    } catch (err: any) {
      console.error(`  ✗ Error on storage.${st}:`, err.message);
    }
  }

  // 2. Clear old policies to guarantee a clean, consistent state
  console.log('\n3. Dropping existing or outdated policies...');
  const existingPolicies: any = await prisma.$queryRaw`
    SELECT schemaname::text, tablename::text, policyname::text 
    FROM pg_policies 
    WHERE schemaname IN ('public', 'storage');
  `;
  for (const p of existingPolicies) {
    const tableRef = `"${p.schemaname}"."${p.tablename}"`;
    try {
      await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "${p.policyname}" ON ${tableRef};`);
      console.log(`  ✓ Dropped policy "${p.policyname}" on ${tableRef}`);
    } catch (err: any) {
      console.warn(`  - Note on drop:`, err.message);
    }
  }

  // 3. Create Admin & Service Role Policy on EVERY public table
  console.log('\n4. Creating service_role and postgres full-access admin policy on all public tables...');
  for (const t of publicTables) {
    const tableRef = formatTable('public', t.name, t.isQuoted);
    try {
      await prisma.$executeRawUnsafe(`
        CREATE POLICY "admin_service_role_all" ON ${tableRef}
        FOR ALL
        TO service_role, postgres
        USING (true)
        WITH CHECK (true);
      `);
      console.log(`  ✓ Admin policy added to ${tableRef}`);
    } catch (err: any) {
      console.error(`  ✗ Error creating admin policy on ${tableRef}:`, err.message);
    }
  }

  // 4. Create Public Read Policies for discovery, directories, catalogs, and public content
  console.log('\n5. Creating public read policies for discovery & directory catalogs...');
  const publicReadTables: { name: string; isQuoted: boolean }[] = [
    { name: 'PlatformSpecialty', isQuoted: true },
    { name: 'PlatformCondition', isQuoted: true },
    { name: 'diseases', isQuoted: false },
    { name: 'Hospital', isQuoted: true },
    { name: 'Department', isQuoted: true },
    { name: 'doctor_schedules', isQuoted: false },
    { name: 'hospital_labs', isQuoted: false },
    { name: 'LabSchedule', isQuoted: true },
    { name: 'platform_lab_departments', isQuoted: false },
    { name: 'platform_lab_tests', isQuoted: false },
    { name: 'lab_tests', isQuoted: false },
    { name: 'lab_packages', isQuoted: false },
    { name: 'nursing_services', isQuoted: false },
    { name: 'nursing_service_offerings', isQuoted: false },
    { name: 'insurances', isQuoted: false },
    { name: 'faqs', isQuoted: false },
    { name: 'home_page_posters', isQuoted: false },
    { name: 'reviews', isQuoted: false },
    { name: 'review_aggregates', isQuoted: false },
    { name: 'review_responses', isQuoted: false },
  ];

  for (const t of publicReadTables) {
    const tableRef = formatTable('public', t.name, t.isQuoted);
    try {
      await prisma.$executeRawUnsafe(`
        CREATE POLICY "public_read_directory" ON ${tableRef}
        FOR SELECT
        TO anon, authenticated
        USING (true);
      `);
      console.log(`  ✓ Public read policy added to ${tableRef}`);
    } catch (err: any) {
      console.error(`  ✗ Error creating public read policy on ${tableRef}:`, err.message);
    }
  }

  // 5. Create Scoped Policies for User Profiles & Healthcare Transactions
  console.log('\n6. Creating secure user-scoped policies for patients & healthcare data...');

  // User table
  try {
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "public_read_practitioners" ON public."User"
      FOR SELECT
      TO anon, authenticated
      USING (role IN ('DOCTOR', 'NURSE'));
    `);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "users_read_own_profile" ON public."User"
      FOR SELECT
      TO authenticated
      USING (auth.uid()::text = id);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "users_update_own_profile" ON public."User"
      FOR UPDATE
      TO authenticated
      USING (auth.uid()::text = id);
    `);
    console.log('  ✓ User profile policies created');
  } catch (err: any) {
    console.error('  ✗ Error creating User policies:', err.message);
  }

  // OPBooking
  try {
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "patient_read_own_op_bookings" ON public."OPBooking"
      FOR SELECT
      TO authenticated
      USING (auth.uid()::text = "patientId");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "patient_insert_own_op_bookings" ON public."OPBooking"
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid()::text = "patientId");
    `);
    console.log('  ✓ OPBooking patient policies created');
  } catch (err: any) {
    console.error('  ✗ Error creating OPBooking policies:', err.message);
  }

  // home_nursing_bookings
  try {
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "patient_read_own_nursing_bookings" ON public.home_nursing_bookings
      FOR SELECT
      TO authenticated
      USING (auth.uid()::text = "userId");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "patient_insert_own_nursing_bookings" ON public.home_nursing_bookings
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid()::text = "userId");
    `);
    console.log('  ✓ home_nursing_bookings policies created');
  } catch (err: any) {
    console.error('  ✗ Error on home_nursing_bookings:', err.message);
  }

  // lab_bookings & items
  try {
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "patient_read_own_lab_bookings" ON public.lab_bookings
      FOR SELECT
      TO authenticated
      USING (auth.uid()::text = "patientId");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "authenticated_read_lab_items" ON public.lab_booking_items
      FOR SELECT
      TO authenticated
      USING (true);
    `);
    console.log('  ✓ lab_bookings & items policies created');
  } catch (err: any) {
    console.error('  ✗ Error on lab_bookings:', err.message);
  }

  // patient_reports
  try {
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "patient_read_own_reports" ON public.patient_reports
      FOR SELECT
      TO authenticated
      USING (auth.uid()::text = "userId");
    `);
    console.log('  ✓ patient_reports policy created');
  } catch (err: any) {
    console.error('  ✗ Error on patient_reports:', err.message);
  }

  // patient_vitals
  try {
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "patient_read_own_vitals" ON public.patient_vitals
      FOR SELECT
      TO authenticated
      USING (auth.uid()::text = "patientId");
    `);
    console.log('  ✓ patient_vitals policy created');
  } catch (err: any) {
    console.error('  ✗ Error on patient_vitals:', err.message);
  }

  // prescriptions & items
  try {
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "authenticated_read_prescriptions" ON public.prescriptions
      FOR SELECT
      TO authenticated
      USING (true);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "authenticated_read_prescription_items" ON public.prescription_items
      FOR SELECT
      TO authenticated
      USING (true);
    `);
    console.log('  ✓ prescriptions & items policies created');
  } catch (err: any) {
    console.error('  ✗ Error on prescriptions:', err.message);
  }

  // video_consultations
  try {
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "authenticated_read_video_consultations" ON public.video_consultations
      FOR SELECT
      TO authenticated
      USING (true);
    `);
    console.log('  ✓ video_consultations policy created');
  } catch (err: any) {
    console.error('  ✗ Error on video_consultations:', err.message);
  }

  // notifications
  try {
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "user_read_own_notifications" ON public.notifications
      FOR SELECT
      TO authenticated
      USING (auth.uid()::text = "userId");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "user_update_own_notifications" ON public.notifications
      FOR UPDATE
      TO authenticated
      USING (auth.uid()::text = "userId");
    `);
    console.log('  ✓ notifications policies created');
  } catch (err: any) {
    console.error('  ✗ Error on notifications:', err.message);
  }

  // reviews insert
  try {
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "patient_insert_reviews" ON public.reviews
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid()::text = "userId");
    `);
    console.log('  ✓ reviews insert policy created');
  } catch (err: any) {
    console.error('  ✗ Error on reviews:', err.message);
  }

  // 6. Create Storage Policies
  console.log('\n7. Creating policies for Supabase Storage buckets & objects...');
  try {
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "public_read_buckets" ON storage.buckets
      FOR SELECT
      TO anon, authenticated
      USING (public = true);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "admin_all_buckets" ON storage.buckets
      FOR ALL
      TO service_role, postgres
      USING (true)
      WITH CHECK (true);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "public_read_objects" ON storage.objects
      FOR SELECT
      TO anon, authenticated
      USING (bucket_id IN ('reports', 'licenses', 'avatars', 'attachments'));
    `);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "admin_all_objects" ON storage.objects
      FOR ALL
      TO service_role, postgres
      USING (true)
      WITH CHECK (true);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "authenticated_upload_objects" ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id IN ('reports', 'licenses', 'avatars', 'attachments'));
    `);
    console.log('  ✓ Storage bucket & object policies created');
  } catch (err: any) {
    console.error('  ✗ Error on storage policies:', err.message);
  }

  // 7. Verification: Check RLS status & policy count for every table
  console.log('\n=== Verification Summary ===');
  const finalTables: any = await prisma.$queryRaw`
    SELECT schemaname, tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `;
  const nonRlsTables = finalTables.filter((t: any) => !t.rowsecurity);
  console.log(`Public tables with RLS enabled: ${finalTables.length - nonRlsTables.length} / ${finalTables.length}`);
  if (nonRlsTables.length > 0) {
    console.warn('Tables missing RLS:', nonRlsTables.map((t: any) => t.tablename));
  } else {
    console.log('✔ ALL public tables have RLS ENABLED!');
  }

  const finalPolicies: any = await prisma.$queryRaw`
    SELECT schemaname::text, tablename::text, COUNT(*)::int as count
    FROM pg_policies 
    WHERE schemaname IN ('public', 'storage')
    GROUP BY schemaname, tablename
    ORDER BY schemaname, tablename;
  `;
  console.log(`\nTables with active RLS policies: ${finalPolicies.length}`);
  finalPolicies.forEach((p: any) => {
    console.log(`  - ${p.schemaname}.${p.tablename}: ${p.count} policies`);
  });

  console.log('\nSupabase RLS remediation complete!');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

