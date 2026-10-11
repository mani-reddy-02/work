const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  console.log('Adding enum values and cancellationReason if needed...');
  try {
    await p.$executeRawUnsafe(`ALTER TYPE "LabBookingStatus" ADD VALUE IF NOT EXISTS 'REPORT_UPLOAD_PENDING'`);
    console.log('Added REPORT_UPLOAD_PENDING to enum');
  } catch (e) {
    console.log('REPORT_UPLOAD_PENDING enum note:', e.message);
  }
  
  try {
    await p.$executeRawUnsafe(`ALTER TYPE "LabBookingStatus" ADD VALUE IF NOT EXISTS 'COMPLETED'`);
    console.log('Added COMPLETED to enum');
  } catch (e) {
    console.log('COMPLETED enum note:', e.message);
  }

  try {
    await p.$executeRawUnsafe(`ALTER TABLE "lab_bookings" ADD COLUMN IF NOT EXISTS "cancellationReason" TEXT`);
    console.log('Added cancellationReason column');
  } catch (e) {
    console.log('cancellationReason column note:', e.message);
  }

  const result = await p.$queryRawUnsafe('SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = \'LabBookingStatus\'');
  console.log('Updated LabBookingStatus values:', result);
}

main().catch(console.error).finally(() => p.$disconnect());
