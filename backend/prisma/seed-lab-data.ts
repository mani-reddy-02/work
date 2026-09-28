import { PrismaClient, LabBookingType, LabBookingStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING REAL LAB DATA ---');

  const hospitalId = '9c2e7291-de11-4a74-9752-781454e0f99c'; // SM_Hospital

  // 1. Fetch available platform lab tests
  const platformTests = await prisma.platformLabTest.findMany({
    take: 20
  });

  if (platformTests.length === 0) {
    console.error('No platform lab tests found! Please seed platform data first.');
    return;
  }

  console.log(`Found ${platformTests.length} platform tests.`);

  // 2. Ensure hospital has offerings in LabTest
  const createdLabTests: any[] = [];
  for (const pt of platformTests) {
    const existing = await prisma.labTest.findUnique({
      where: {
        hospitalId_platformTestId: {
          hospitalId,
          platformTestId: pt.id
        }
      }
    });

    if (!existing) {
      // Pick a realistic price based on test
      let price = 399;
      if (pt.name.includes('Culture')) price = 850;
      else if (pt.name.includes('Heart') || pt.name.includes('Cardiac') || pt.name.includes('NT-proBNP')) price = 1200;
      else if (pt.name.includes('X-Ray')) price = 500;
      else if (pt.name.includes('CRP')) price = 450;
      else if (pt.name.includes('Urine')) price = 250;
      else if (pt.name.includes('Stool')) price = 300;
      else if (pt.name.includes('Thyroid')) price = 650;
      else if (pt.name.includes('CBC')) price = 350;

      const lt = await prisma.labTest.create({
        data: {
          hospitalId,
          platformTestId: pt.id,
          price,
          tatHours: pt.defaultTatHours || 12,
          isHomeCollectionAvailable: pt.canBeCollectedAtHome,
          homeCollectionFee: pt.canBeCollectedAtHome ? 100 : 0,
          isActive: true
        }
      });
      createdLabTests.push(lt);
    } else {
      createdLabTests.push(existing);
    }
  }
  console.log(`Ensured ${createdLabTests.length} hospital lab tests available.`);

  // 3. Fetch patients
  const patients = await prisma.user.findMany({
    where: { role: 'PATIENT' },
    take: 8
  });

  if (patients.length === 0) {
    console.error('No patient users found.');
    return;
  }

  // 4. Clean up any previous test lab bookings for SM_Hospital to keep data fresh and clean
  await prisma.labBooking.deleteMany({
    where: { hospitalId }
  });
  console.log('Cleared previous lab bookings.');

  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');

  // Helper to create timestamp offsets
  const getDateOffset = (daysAgo: number, hour: number, minute: number = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  // 5. Seed Real Bookings across various statuses:
  // Today's bookings
  const todaySpecs = [
    {
      patient: patients[0],
      type: LabBookingType.HOME_COLLECTION,
      status: LabBookingStatus.REQUESTED,
      testIndices: [0], // e.g. Urine
      hour: 8,
      minute: 30,
      slot: '09:00 AM - 10:00 AM',
      address: 'Flat 302, Green View Apartments, Hyderabad',
      phlebName: null,
      phlebPhone: null
    },
    {
      patient: patients[1] || patients[0],
      type: LabBookingType.WALK_IN,
      status: LabBookingStatus.REQUESTED,
      testIndices: [1], // X-Ray
      hour: 9,
      minute: 15,
      slot: '10:00 AM - 10:30 AM',
      address: null,
      phlebName: null,
      phlebPhone: null
    },
    {
      patient: patients[2] || patients[0],
      type: LabBookingType.HOME_COLLECTION,
      status: LabBookingStatus.ASSIGNED,
      testIndices: [2, 3], // Typhoid + Blood Culture
      hour: 9,
      minute: 45,
      slot: '11:00 AM - 12:00 PM',
      address: 'Plot 55, Road No 12, Jubilee Hills, Hyderabad',
      phlebName: 'Ramesh Verma',
      phlebPhone: '9848022338'
    },
    {
      patient: patients[3] || patients[0],
      type: LabBookingType.WALK_IN,
      status: LabBookingStatus.SAMPLE_COLLECTED,
      testIndices: [4], // Stool
      hour: 10,
      minute: 10,
      slot: '10:00 AM - 10:30 AM',
      address: null,
      phlebName: null,
      phlebPhone: null,
      collectedAt: getDateOffset(0, 10, 30)
    },
    {
      patient: patients[4] || patients[0],
      type: LabBookingType.HOME_COLLECTION,
      status: LabBookingStatus.SAMPLE_COLLECTED,
      testIndices: [5], // RF
      hour: 10,
      minute: 30,
      slot: '09:30 AM - 10:30 AM',
      address: 'Door 4-2-10, Madhapur, Hyderabad',
      phlebName: 'Kishore G',
      phlebPhone: '9849112233',
      collectedAt: getDateOffset(0, 11, 0)
    },
    {
      patient: patients[0],
      type: LabBookingType.WALK_IN,
      status: LabBookingStatus.IN_LAB_PROCESSING,
      testIndices: [6, 7], // PT/INR + Cardiac Marker
      hour: 11,
      minute: 0,
      slot: '11:00 AM - 11:30 AM',
      address: null,
      phlebName: null,
      phlebPhone: null,
      collectedAt: getDateOffset(0, 11, 20)
    },
    {
      patient: patients[1] || patients[0],
      type: LabBookingType.HOME_COLLECTION,
      status: LabBookingStatus.IN_LAB_PROCESSING,
      testIndices: [8], // Beta hCG
      hour: 11,
      minute: 45,
      slot: '10:00 AM - 11:00 AM',
      address: 'Villa 18, Rainbow Meadows, Kondapur',
      phlebName: 'Ramesh Verma',
      phlebPhone: '9848022338',
      collectedAt: getDateOffset(0, 12, 15)
    },
    {
      patient: patients[2] || patients[0],
      type: LabBookingType.WALK_IN,
      status: LabBookingStatus.REPORT_READY,
      testIndices: [10], // hs-CRP
      hour: 8,
      minute: 0,
      slot: '08:30 AM - 09:00 AM',
      address: null,
      phlebName: null,
      phlebPhone: null,
      collectedAt: getDateOffset(0, 9, 0)
    },
    {
      patient: patients[3] || patients[0],
      type: LabBookingType.HOME_COLLECTION,
      status: LabBookingStatus.REPORT_READY,
      testIndices: [11], // CPK-MB
      hour: 8,
      minute: 15,
      slot: '08:00 AM - 09:00 AM',
      address: 'H-No 12/A, Banjara Hills, Hyderabad',
      phlebName: 'Kishore G',
      phlebPhone: '9849112233',
      collectedAt: getDateOffset(0, 8, 45)
    },
    {
      patient: patients[4] || patients[0],
      type: LabBookingType.WALK_IN,
      status: LabBookingStatus.REPORT_READY,
      testIndices: [0, 6], // CUE + PT/INR
      hour: 7,
      minute: 45,
      slot: '08:00 AM - 08:30 AM',
      address: null,
      phlebName: null,
      phlebPhone: null,
      collectedAt: getDateOffset(0, 8, 30)
    }
  ];

  for (const s of todaySpecs) {
    const selectedTests = s.testIndices.map(idx => createdLabTests[idx % createdLabTests.length]);
    const itemsTotal = selectedTests.reduce((acc, t) => acc + t.price, 0);
    const homeFee = s.type === LabBookingType.HOME_COLLECTION ? 100 : 0;
    const totalAmount = itemsTotal + homeFee;

    const bDate = getDateOffset(0, s.hour, s.minute);

    const b = await prisma.labBooking.create({
      data: {
        hospitalId,
        patientId: s.patient.id,
        bookingType: s.type,
        status: s.status,
        collectionAddress: s.address,
        collectionDate: bDate,
        collectionTimeSlot: s.slot,
        phlebotomistName: s.phlebName,
        phlebotomistPhone: s.phlebPhone,
        sampleCollectedAt: s.collectedAt || null,
        totalAmount,
        homeCollectionFee: homeFee,
        createdAt: bDate,
        updatedAt: bDate,
        items: {
          create: selectedTests.map(t => ({
            labTestId: t.id,
            price: t.price
          }))
        }
      }
    });

    // If report is ready, create PatientReport
    if (s.status === LabBookingStatus.REPORT_READY) {
      await prisma.patientReport.create({
        data: {
          userId: s.patient.id,
          title: selectedTests.map(t => platformTests.find(pt => pt.id === t.platformTestId)?.name || 'Lab Test').join(' & '),
          hospital: 'SM_Hospital',
          doctor: 'Dr. Diagnostic Pathologist',
          date: bDate.toISOString().split('T')[0],
          pages: '2 pages',
          status: 'Normal',
          statusColor: 'text-emerald-600 bg-emerald-100/60',
          fileUrl: '/uploads/reports/sample-lab-report.pdf'
        }
      });
    }
  }

  // Past 6 days (This week's revenue)
  const pastWeekDays = [1, 2, 3, 4, 5, 6];
  for (const day of pastWeekDays) {
    // 2-3 bookings per day
    const numBookings = 2 + (day % 2);
    for (let i = 0; i < numBookings; i++) {
      const p = patients[(day + i) % patients.length];
      const t1 = createdLabTests[(day * 2 + i) % createdLabTests.length];
      const t2 = createdLabTests[(day * 2 + i + 1) % createdLabTests.length];
      const tests = i % 2 === 0 ? [t1, t2] : [t1];
      const itemsTotal = tests.reduce((acc, t) => acc + t.price, 0);
      const isHome = i % 2 === 1;
      const homeFee = isHome ? 100 : 0;
      const totalAmount = itemsTotal + homeFee;
      const bDate = getDateOffset(day, 10 + i * 2, 30);

      await prisma.labBooking.create({
        data: {
          hospitalId,
          patientId: p.id,
          bookingType: isHome ? LabBookingType.HOME_COLLECTION : LabBookingType.WALK_IN,
          status: LabBookingStatus.REPORT_READY,
          collectionAddress: isHome ? 'Residential Address, Hyderabad' : null,
          collectionDate: bDate,
          collectionTimeSlot: '10:00 AM - 11:00 AM',
          phlebotomistName: isHome ? 'Ramesh Verma' : null,
          phlebotomistPhone: isHome ? '9848022338' : null,
          sampleCollectedAt: bDate,
          totalAmount,
          homeCollectionFee: homeFee,
          createdAt: bDate,
          updatedAt: bDate,
          items: {
            create: tests.map(t => ({
              labTestId: t.id,
              price: t.price
            }))
          }
        }
      });
    }
  }

  // Past 10-25 days (This month's revenue)
  const olderDays = [8, 11, 14, 17, 20, 23, 27];
  for (const day of olderDays) {
    for (let i = 0; i < 2; i++) {
      const p = patients[(day + i) % patients.length];
      const t = createdLabTests[(day + i) % createdLabTests.length];
      const bDate = getDateOffset(day, 11, 0);
      const totalAmount = t.price;

      await prisma.labBooking.create({
        data: {
          hospitalId,
          patientId: p.id,
          bookingType: LabBookingType.WALK_IN,
          status: LabBookingStatus.REPORT_READY,
          collectionDate: bDate,
          collectionTimeSlot: '11:00 AM - 11:30 AM',
          sampleCollectedAt: bDate,
          totalAmount,
          homeCollectionFee: 0,
          createdAt: bDate,
          updatedAt: bDate,
          items: {
            create: [{
              labTestId: t.id,
              price: t.price
            }]
          }
        }
      });
    }
  }

  const finalCount = await prisma.labBooking.count({ where: { hospitalId } });
  console.log(`SUCCESS! Seeded ${finalCount} real lab bookings for SM_Hospital.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
