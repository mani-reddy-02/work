import { prisma } from './src/config/prisma';
import jwt from 'jsonwebtoken';
import { env } from './src/config/env';

async function testUpcomingBooking() {
  console.log('Testing Upcoming Booking API logic...');

  // Get a random patient
  const patient = await prisma.user.findFirst({
    where: { role: 'PATIENT' }
  });

  if (!patient) {
    console.log('No patient found for testing');
    return;
  }

  // Create a dummy OP booking for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const doctor = await prisma.user.findFirst({ where: { role: 'DOCTOR' } });
  const hospital = await prisma.hospital.findFirst();
  const dept = await prisma.department.findFirst();
  
  if (doctor && hospital && dept) {
    await prisma.oPBooking.create({
      data: {
        hospitalId: hospital.id,
        doctorId: doctor.id,
        departmentId: dept.id,
        patientId: patient.id,
        patientName: patient.name || 'Test',
        patientPhone: patient.phone || '000',
        appointmentDate: tomorrow,
        timeSlot: '10:00 AM',
        status: 'WAITING',
        fee: 500,
        opType: 'Normal'
      }
    });
    console.log('Created a dummy booking for tomorrow.');
  }

  // Generate valid token
  const token = jwt.sign({ userId: patient.id }, env.JWT_SECRET);
  console.log(`Generated token for patient ${patient.name}`);

  // Fetch the upcoming booking via HTTP request to localhost:5000
  const res = await fetch('http://localhost:5000/api/v1/user/bookings/upcoming', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await res.json();
  console.log('API Response:', JSON.stringify(data, null, 2));
}

testUpcomingBooking()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
