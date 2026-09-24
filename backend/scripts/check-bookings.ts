import { prisma } from '../src/config/prisma';

async function main() {
  const doctor = await prisma.user.findUnique({ where: { email: 'doctor1@gmail.com' } });
  console.log('Doctor:', doctor?.id, doctor?.name, doctor?.role, doctor?.hospitalId);
  if (doctor) {
    const bookings = await prisma.oPBooking.findMany({ where: { doctorId: doctor.id } });
    console.log('Bookings for doctor count:', bookings.length);
    console.log('Doctor bookings:', JSON.stringify(bookings, null, 2));

    const allBookings = await prisma.oPBooking.findMany();
    console.log('Total bookings in DB:', allBookings.length);
    for (const b of allBookings) {
      console.log(`Booking: ${b.id}, doc: ${b.doctorId}, pt: ${b.patientName}, date: ${b.appointmentDate}, status: ${b.status}`);
    }
  }
}

main().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
