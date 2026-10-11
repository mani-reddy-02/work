const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const result = await p.$queryRawUnsafe('SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = \'LabBookingStatus\'');
  console.log('Postgres LabBookingStatus values:', result);
  const bookings = await p.labBooking.findMany({
    select: {
      id: true,
      status: true,
      reportUrl: true,
      bookingType: true,
      collectionAddress: true,
      collectionDate: true,
      collectionTimeSlot: true,
      phlebotomistName: true,
      phlebotomistPhone: true,
      sampleCollectedAt: true
    }
  });
  console.log('All bookings count:', bookings.length);
  console.log('All bookings:', bookings);
}
main().catch(console.error).finally(() => p.$disconnect());
