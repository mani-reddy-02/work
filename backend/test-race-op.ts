import { prisma } from './src/config/prisma';
import jwt from 'jsonwebtoken';
import { env } from './src/config/env';

async function testRaceCondition() {
  console.log('Starting OP Booking Race Condition Test...');

  const doctor = await prisma.user.findFirst({
    where: { role: 'DOCTOR', active: true, hospitalId: { not: null } },
    include: {
      hospital: true,
      department: true,
    }
  });

  if (!doctor || !doctor.hospitalId) {
    console.log('No doctor found');
    return;
  }

  const patients = await prisma.user.findMany({
    where: { role: 'PATIENT' },
    take: 2
  });

  if (patients.length < 2) {
    console.log('Need at least 2 patients to test race condition');
    return;
  }

  const token1 = jwt.sign(
    { id: patients[0].id, role: patients[0].role, email: patients[0].email },
    env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  const token2 = jwt.sign(
    { id: patients[1].id, role: patients[1].role, email: patients[1].email },
    env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  const testSlot = '10:00 AM';
  const testDate = new Date();
  testDate.setDate(testDate.getDate() + 1);

  const dayName = testDate.toLocaleDateString('en-US', { weekday: 'long' });
  const schedule = await prisma.doctorSchedule.findFirst({
    where: { doctorId: doctor.id, dayOfWeek: dayName }
  });

  if (!schedule) {
    await prisma.doctorSchedule.create({
      data: {
        doctorId: doctor.id,
        hospitalId: doctor.hospitalId,
        dayOfWeek: dayName,
        startTime: '08:00',
        endTime: '17:00',
        isAvailable: true,
      }
    });
  }

  const payload = {
    hospitalId: doctor.hospitalId,
    doctorId: doctor.id,
    departmentId: doctor.departmentId,
    date: testDate.toISOString(),
    timeSlot: testSlot,
    patientName: 'Test Patient',
    patientPhone: '9999999999',
    opType: 'Normal'
  };

  const headers1 = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` };
  const headers2 = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token2}` };

  const req1 = fetch('http://localhost:5000/api/v1/user/bookings/op', {
    method: 'POST',
    headers: headers1,
    body: JSON.stringify(payload)
  });

  const req2 = fetch('http://localhost:5000/api/v1/user/bookings/op', {
    method: 'POST',
    headers: headers2,
    body: JSON.stringify(payload)
  });

  const [res1, res2] = await Promise.all([req1, req2]);
  const data1 = await res1.json();
  const data2 = await res2.json();

  console.log(`Response 1: ${res1.status}`, data1.success ? 'Success' : data1.error?.message);
  console.log(`Response 2: ${res2.status}`, data2.success ? 'Success' : data2.error?.message);
}

testRaceCondition().catch(console.error);
