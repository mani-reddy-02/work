import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PgTable {
  tablename: string;
  rowsecurity: boolean;
}

async function run() {
  console.log('====================================================');
  console.log('CHECKING & ENABLING ROW LEVEL SECURITY (RLS)');
  console.log('====================================================\n');

  try {
    // 1. Fetch all tables in the public schema
    const tables = await prisma.$queryRaw<PgTable[]>`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename ASC;
    `;

    console.log(`Found ${tables.length} tables in public schema:\n`);

    let enabledCount = 0;
    let alreadyEnabledCount = 0;

    for (const t of tables) {
      // Skip prisma migration table if present
      if (t.tablename === '_prisma_migrations') {
        console.log(`- Skipping ${t.tablename} (internal migration table)`);
        continue;
      }

      if (t.rowsecurity) {
        console.log(`- [ALREADY ENABLED] ${t.tablename}`);
        alreadyEnabledCount++;
      } else {
        process.stdout.write(`- Enabling RLS on "${t.tablename}"... `);
        await prisma.$executeRawUnsafe(`ALTER TABLE "public"."${t.tablename}" ENABLE ROW LEVEL SECURITY;`);
        console.log('DONE');
        enabledCount++;
      }
    }

    console.log('\n----------------------------------------------------');
    console.log(`Summary: ${enabledCount} newly enabled, ${alreadyEnabledCount} already enabled.`);

    // 2. Verify all tables
    const verifyTables = await prisma.$queryRaw<PgTable[]>`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename ASC;
    `;

    const nonSecured = verifyTables.filter(t => !t.rowsecurity && t.tablename !== '_prisma_migrations');
    if (nonSecured.length === 0) {
      console.log('SUCCESS: All application tables in public schema have RLS enabled!');
    } else {
      console.warn('WARNING: Some tables do not have RLS enabled:', nonSecured.map(t => t.tablename));
    }

  } catch (err) {
    console.error('Error enabling RLS:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
