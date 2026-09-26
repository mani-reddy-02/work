import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING REAL HOME NURSING BOOKINGS ---');

  const userId = '1c4ce18f-6629-4900-9490-cf125e1df784'; // mani
  const hospitalId = '9c2e7291-de11-4a74-9752-781454e0f99c'; // SM_Hospital
  const nurseId = '107a7e06-b32a-44b9-83c1-892949e7ef01'; // Nurse2

  // Delete previous test bookings
  await prisma.homeNursingBooking.deleteMany({
    where: {
      bookingNumber: { in: ['MQ-HN-20260925-01', 'MQ-HN-20260925-02', 'MQ-HN-20260926-01', 'MQ-HN-20260924-01', 'MQ-HN-20260925-05'] }
    }
  });

  // 1. Today Visit 1: Elderly Care - Assigned to Nurse2
  const b1 = await prisma.homeNursingBooking.create({
    data: {
      bookingNumber: 'MQ-HN-20260925-01',
      userId,
      hospitalId,
      nurseId,
      serviceId: 'b88fb7cb-8bd1-4780-81da-d5d00cc56704',
      patientName: 'Mani Reddy',
      patientPhone: '9666108171',
      patientEmail: 'm123456@gmail.com',
      serviceDate: new Date('2026-09-25T00:00:00.000Z'),
      timeSlot: '10:00 AM - 12:00 PM',
      duration: '12 / 24 Hours',
      address: 'Flat 402, Sai Residency, Mantralayam',
      city: 'Mantralayam',
      status: 'ASSIGNED',
      paymentStatus: 'PAID',
      paymentMethod: 'UPI',
      totalAmount: 1500,
      notes: 'Regular health monitoring and vital signs tracking.'
    }
  });
  console.log('Created booking 1 (Today):', b1.bookingNumber);

  // 2. Today Visit 2: Injection / Dressing Support - Assigned to Nurse2
  const b2 = await prisma.homeNursingBooking.create({
    data: {
      bookingNumber: 'MQ-HN-20260925-02',
      userId,
      hospitalId,
      nurseId,
      serviceId: 'dff49768-b21f-4a56-97c3-fedd99a0d9d9',
      patientName: 'Suresh Kumar',
      patientPhone: '9876543210',
      patientEmail: 'suresh@gmail.com',
      serviceDate: new Date('2026-09-25T00:00:00.000Z'),
      timeSlot: '04:00 PM - 05:00 PM',
      duration: 'Per Visit',
      address: 'Door 12-4, Temple Road, Mantralayam',
      city: 'Mantralayam',
      status: 'ASSIGNED',
      paymentStatus: 'PAID',
      paymentMethod: 'CARD',
      totalAmount: 450,
      notes: 'Post-op aseptic wound dressing.'
    }
  });
  console.log('Created booking 2 (Today):', b2.bookingNumber);

  // 3. Tomorrow Visit 3: Post-Hospitalization Care - Assigned to Nurse2
  const b3 = await prisma.homeNursingBooking.create({
    data: {
      bookingNumber: 'MQ-HN-20260926-01',
      userId,
      hospitalId,
      nurseId,
      serviceId: 'd7d54b51-8f7d-4024-a82e-419da611090c',
      patientName: 'Lakshmi Devi',
      patientPhone: '9123456780',
      patientEmail: 'lakshmi@gmail.com',
      serviceDate: new Date('2026-09-26T00:00:00.000Z'),
      timeSlot: '09:00 AM - 01:00 PM',
      duration: '12 / 24 Hours',
      address: 'Plot 88, River View Colony, Mantralayam',
      city: 'Mantralayam',
      status: 'ASSIGNED',
      paymentStatus: 'PAID',
      paymentMethod: 'CARD',
      totalAmount: 1800,
      notes: 'Physiotherapy mobility assistance.'
    }
  });
  console.log('Created booking 3 (Tomorrow):', b3.bookingNumber);

  // 4. Past Visit 4: Mother & Baby Care - Completed by Nurse2
  const b4 = await prisma.homeNursingBooking.create({
    data: {
      bookingNumber: 'MQ-HN-20260924-01',
      userId,
      hospitalId,
      nurseId,
      serviceId: '747e56c7-8eef-44c7-8f3a-83598e91d307',
      patientName: 'Ananya Sharma',
      patientPhone: '9988776655',
      patientEmail: 'ananya@gmail.com',
      serviceDate: new Date('2026-09-24T00:00:00.000Z'),
      timeSlot: '11:00 AM - 01:00 PM',
      duration: '12 Hours',
      address: 'House 15, Green Park, Mantralayam',
      city: 'Mantralayam',
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      paymentMethod: 'UPI',
      totalAmount: 1600,
      notes: 'Newborn umbilical care and lactation assistance.'
    }
  });
  console.log('Created booking 4 (Completed):', b4.bookingNumber);

  // 5. Booking 5: Unassigned booking awaiting hospital nurse assignment
  const b5 = await prisma.homeNursingBooking.create({
    data: {
      bookingNumber: 'MQ-HN-20260925-05',
      userId,
      hospitalId,
      nurseId: null,
      serviceId: '41c8719d-86bb-4028-b92e-b3a3906dc0f0',
      patientName: 'Venkat Rao',
      patientPhone: '9001122334',
      patientEmail: 'venkat@gmail.com',
      serviceDate: new Date('2026-09-25T00:00:00.000Z'),
      timeSlot: '02:00 PM - 03:00 PM',
      duration: 'Per Visit',
      address: 'Door 4-18, Station Road, Mantralayam',
      city: 'Mantralayam',
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      paymentMethod: 'CARD',
      totalAmount: 600,
      notes: 'Catheter replacement needed.'
    }
  });
  console.log('Created booking 5 (Unassigned at hospital):', b5.bookingNumber);

  console.log('✔ All home nursing bookings successfully seeded in database!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
