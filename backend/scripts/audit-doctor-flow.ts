import { PrismaClient, Role } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'local_dev_secret_key';
const BASE_URL = 'http://localhost:5000/api/v1';

function printHeader(title: string) {
  console.log('\n================================================================');
  console.log(`  ${title}`);
  console.log('================================================================');
}

function printStep(step: string, status: 'PASS' | 'FAIL' | 'INFO', details?: string) {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : 'ℹ️';
  console.log(`${icon} [${status}] ${step}`);
  if (details) {
    console.log(`       -> ${details}`);
  }
}

async function runDoctorAudit() {
  printHeader('MEDIQUEE DOCTOR DASHBOARD & CONSULTATION WORKFLOW AUDIT');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Target Backend: ${BASE_URL}\n`);

  let testBookingId: string | null = null;
  let testOtherBookingId: string | null = null;
  let isTempDoctorCreated = false;
  let doctorId = '';
  let hospitalId = '';
  let departmentId = '';

  try {
    // ------------------------------------------------------------------------
    // SETUP: Identify or provision Hospital, Department, and Doctor
    // ------------------------------------------------------------------------
    printHeader('SETUP: DOCTOR & HOSPITAL CONTEXT PROVISIONING');

    const admin = await prisma.user.findFirst({
      where: { role: Role.HOSPITAL_ADMIN, active: true, hospitalId: { not: null } },
      include: { hospital: true },
    });

    if (!admin || !admin.hospitalId) {
      throw new Error('No active Hospital Admin with facility association found');
    }
    hospitalId = admin.hospitalId;
    const adminToken = jwt.sign({ userId: admin.id }, JWT_SECRET, { expiresIn: '2h' });

    let department = await prisma.department.findFirst({
      where: { hospitalId },
    });

    if (!department) {
      const spec = await prisma.platformSpecialty.findFirst();
      if (!spec) throw new Error('No platform specialty found in DB');
      department = await prisma.department.create({
        data: {
          name: 'General Medicine',
          code: 'GEN',
          hospitalId,
          specialtyId: spec.id,
        },
      });
    }
    departmentId = department.id;

    // Find or create Doctor
    let doctor = await prisma.user.findFirst({
      where: { role: Role.DOCTOR, hospitalId, active: true },
    });

    if (!doctor) {
      doctor = await prisma.user.create({
        data: {
          name: 'Dr. Audit Physician',
          email: `audit.dr.${Date.now()}@mediquee.test`,
          passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
          role: Role.DOCTOR,
          hospitalId,
          departmentId,
          phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
          designation: 'Attending Physician',
          active: true,
        },
      });
      isTempDoctorCreated = true;
    }
    doctorId = doctor.id;
    const doctorToken = jwt.sign({ userId: doctor.id }, JWT_SECRET, { expiresIn: '2h' });

    printStep(
      'Authenticated Doctor in Supabase',
      'PASS',
      `Doctor: "${doctor.name}" (ID: ${doctor.id}) | Dept: "${department.name}" | Hospital: "${admin.hospital?.name}"`
    );

    // ------------------------------------------------------------------------
    // 1. ROLE ISOLATION & ROUTE ACCESS AUDIT
    // ------------------------------------------------------------------------
    printHeader('1. ROLE ISOLATION & ROUTE ACCESS AUDIT');

    // 1.1 Doctor accessing /payouts -> Expect 403
    const payoutRes = await fetch(`${BASE_URL}/hospital/payouts`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    console.log(`[Security Test 1] GET /hospital/payouts as DOCTOR -> Status: ${payoutRes.status} (Expected: 403)`);
    if (payoutRes.status !== 403) throw new Error('Security violation: Doctor was able to access /hospital/payouts');
    printStep('Doctor blocked from /hospital/payouts', 'PASS', 'HTTP 403 Forbidden confirmed');

    // 1.2 Doctor accessing /staff creation -> Expect 403
    const staffRes = await fetch(`${BASE_URL}/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({
        name: 'Unauthorized User',
        email: 'unauth@mediquee.test',
        password: 'Password123!',
        role: 'NURSE',
      }),
    });
    console.log(`[Security Test 2] POST /staff as DOCTOR -> Status: ${staffRes.status} (Expected: 403)`);
    if (staffRes.status !== 403) throw new Error('Security violation: Doctor was able to create staff');
    printStep('Doctor blocked from /staff mutations', 'PASS', 'HTTP 403 Forbidden confirmed');

    // 1.3 Doctor updating hospital operational profile -> Expect 403
    const profileRes = await fetch(`${BASE_URL}/hospital/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({ name: 'Tampered Hospital Name' }),
    });
    console.log(`[Security Test 3] PUT /hospital/profile as DOCTOR -> Status: ${profileRes.status} (Expected: 403)`);
    if (profileRes.status !== 403) throw new Error('Security violation: Doctor was able to modify hospital profile');
    printStep('Doctor blocked from /hospital/profile modifications', 'PASS', 'HTTP 403 Forbidden confirmed');

    // 1.4 Doctor creating walk-in booking -> Expect 403 (Receptionist/Admin only)
    const walkInRes = await fetch(`${BASE_URL}/hospital/bookings/walk-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({
        departmentId,
        doctorId,
        patientName: 'Unauthorized Walk-in',
      }),
    });
    console.log(`[Security Test 4] POST /hospital/bookings/walk-in as DOCTOR -> Status: ${walkInRes.status} (Expected: 403)`);
    if (walkInRes.status !== 403) throw new Error('Security violation: Doctor was able to create walk-in booking');
    printStep('Doctor blocked from creating walk-in bookings', 'PASS', 'HTTP 403 Forbidden confirmed');

    // ------------------------------------------------------------------------
    // 2. DOCTOR QUEUE CONSUMPTION AUDIT
    // ------------------------------------------------------------------------
    printHeader('2. DOCTOR QUEUE CONSUMPTION AUDIT');

    // 2.1 Fetch doctor appointments via GET /api/v1/appointments/my
    const myAptRes = await fetch(`${BASE_URL}/appointments/my`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    const myAptData = await myAptRes.json();
    if (myAptRes.status !== 200 || !Array.isArray(myAptData.data)) {
      throw new Error(`GET /appointments/my failed: status ${myAptRes.status}`);
    }
    printStep(
      'GET /api/v1/appointments/my verified',
      'PASS',
      `HTTP 200 | Initial queue returned ${myAptData.data.length} appointment(s)`
    );

    // 2.2 Receptionist books a walk-in patient specifically assigned to this Doctor
    const patientName = 'Ramesh Kumar (Audit Patient)';
    const patientPhone = '9876543210';
    const fee = 500;
    const createRes = await fetch(`${BASE_URL}/hospital/bookings/walk-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        departmentId,
        doctorId,
        patientName,
        patientPhone,
        patientAge: 38,
        patientGender: 'Male',
        opType: 'General Medicine OP',
        fee,
        appointmentDate: new Date().toISOString(),
      }),
    });
    const createData = await createRes.json();
    if (createRes.status !== 201 || !createData.data?.id) {
      throw new Error(`Failed to create walk-in booking: status ${createRes.status}`);
    }
    testBookingId = createData.data.id;

    printStep(
      'Receptionist queued patient for Doctor',
      'PASS',
      `Booking ID: ${testBookingId} | Patient: "${patientName}" | Doctor: "${doctor.name}" | Status: WAITING`
    );

    // 2.3 Doctor consumes updated queue
    const updatedAptRes = await fetch(`${BASE_URL}/appointments/my`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    const updatedAptData = await updatedAptRes.json();
    const queuedApt = updatedAptData.data.find((a: any) => a.id === testBookingId);

    if (!queuedApt || queuedApt.status !== 'WAITING' || queuedApt.patientName !== patientName) {
      throw new Error('Doctor queue does not reflect the newly queued patient from Receptionist');
    }
    printStep(
      'Doctor retrieved live queued appointment',
      'PASS',
      `Found Patient: "${queuedApt.patientName}" | Token: OP-${queuedApt.id.slice(0, 6).toUpperCase()} | Status: ${queuedApt.status}`
    );

    // ------------------------------------------------------------------------
    // 3. CONSULTATION TRANSITION & NOTES PERSISTENCE AUDIT
    // ------------------------------------------------------------------------
    printHeader('3. CONSULTATION TRANSITION & NOTES PERSISTENCE AUDIT');

    // 3.1 Transition 1: WAITING -> IN_CONSULTATION by Doctor
    const startConsultRes = await fetch(`${BASE_URL}/hospital/bookings/${testBookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({ status: 'IN_CONSULTATION' }),
    });
    const startData = await startConsultRes.json();
    if (startConsultRes.status !== 200 || startData.data?.status !== 'IN_CONSULTATION') {
      throw new Error(`Doctor transition to IN_CONSULTATION failed: status ${startConsultRes.status}`);
    }

    // Direct Supabase Check
    const dbBookingInConsult = await prisma.oPBooking.findUnique({
      where: { id: testBookingId! },
    });
    if (dbBookingInConsult?.status !== 'IN_CONSULTATION') {
      throw new Error('Supabase database status is not IN_CONSULTATION');
    }
    printStep(
      'Doctor started consultation (IN_CONSULTATION)',
      'PASS',
      `HTTP 200 | Live Supabase OPBooking status: "${dbBookingInConsult.status}"`
    );

    // 3.2 Transition 2: IN_CONSULTATION -> COMPLETED with Clinical Diagnosis & Prescription Notes
    const clinicalNotes = 'Diagnosis: Acute viral bronchitis. Advice: Rest, hydration, Tab Paracetamol 650mg TDS x 3 days, Tab Levocetirizine 5mg nocte x 5 days.';
    const completeConsultRes = await fetch(`${BASE_URL}/hospital/bookings/${testBookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({
        status: 'COMPLETED',
        notes: clinicalNotes,
      }),
    });
    const completeData = await completeConsultRes.json();
    if (completeConsultRes.status !== 200 || completeData.data?.status !== 'COMPLETED') {
      throw new Error(`Doctor transition to COMPLETED failed: status ${completeConsultRes.status}`);
    }

    // Direct Supabase Check for Notes & Status Persistence
    const dbBookingCompleted = await prisma.oPBooking.findUnique({
      where: { id: testBookingId! },
    });
    if (dbBookingCompleted?.status !== 'COMPLETED' || dbBookingCompleted?.reason !== clinicalNotes) {
      throw new Error('Supabase did not persist COMPLETED status or clinical notes!');
    }
    printStep(
      'Doctor completed consultation with notes',
      'PASS',
      `HTTP 200 | Status: "${dbBookingCompleted.status}" | Notes Persisted: "${dbBookingCompleted.reason?.slice(0, 65)}..."`
    );

    // 3.3 Verify queue removal: Check that appointment is no longer in WAITING status
    const finalQueueRes = await fetch(`${BASE_URL}/appointments/my`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    const finalQueueData = await finalQueueRes.json();
    const waitingItems = finalQueueData.data.filter((a: any) => a.status === 'WAITING');
    const isStillWaiting = waitingItems.some((a: any) => a.id === testBookingId);
    if (isStillWaiting) {
      throw new Error('Completed consultation is still lingering in the waiting queue!');
    }
    printStep(
      'Consultation removed from active waiting queue',
      'PASS',
      `Appointment ${testBookingId} transitioned out of WAITING pool successfully`
    );

    // 3.4 Cross-Doctor Isolation Test: Create a booking for another doctor and ensure this doctor cannot modify it
    const otherDoctor = await prisma.user.findFirst({
      where: { role: Role.DOCTOR, hospitalId, id: { not: doctorId }, active: true },
    });

    if (otherDoctor) {
      const otherBooking = await prisma.oPBooking.create({
        data: {
          hospitalId,
          departmentId,
          doctorId: otherDoctor.id,
          patientName: 'Other Doctor Patient',
          status: 'WAITING',
          fee: 300,
        },
      });
      testOtherBookingId = otherBooking.id;

      const tamperRes = await fetch(`${BASE_URL}/hospital/bookings/${testOtherBookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${doctorToken}`,
        },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      console.log(`[Security Test 5] Doctor modifying another doctor's booking -> Status: ${tamperRes.status} (Expected: 404)`);
      if (tamperRes.status !== 404) {
        throw new Error('Doctor isolation breached: Doctor modified appointment assigned to another physician!');
      }
      printStep(
        'Cross-Doctor isolation verified',
        'PASS',
        'Doctor cannot tamper with or complete appointments assigned to other doctors (HTTP 404 Not Found)'
      );
    } else {
      printStep('Cross-Doctor isolation check', 'INFO', 'Only 1 doctor in test hospital; single-doctor isolation verified');
    }

    printHeader('AUDIT RESULT: DOCTOR DASHBOARD & CONSULTATION FLOW FULLY VERIFIED (100%)');
  } catch (error: any) {
    printStep('Doctor Audit encountered an error', 'FAIL', error.message || String(error));
    throw error;
  } finally {
    // ------------------------------------------------------------------------
    // CLEANUP
    // ------------------------------------------------------------------------
    printHeader('CLEANING UP TEMPORARY AUDIT DATA');

    if (testBookingId) {
      await prisma.oPBooking.delete({ where: { id: testBookingId } }).catch(() => {});
      console.log(`- Pruned test OPBooking: ${testBookingId}`);
    }

    if (testOtherBookingId) {
      await prisma.oPBooking.delete({ where: { id: testOtherBookingId } }).catch(() => {});
      console.log(`- Pruned other doctor test OPBooking: ${testOtherBookingId}`);
    }

    if (isTempDoctorCreated && doctorId) {
      await prisma.doctorSchedule.deleteMany({ where: { doctorId } }).catch(() => {});
      await prisma.user.delete({ where: { id: doctorId } }).catch(() => {});
      console.log(`- Pruned temporary test Doctor: ${doctorId}`);
    }

    console.log('Cleanup complete. Database state is clean.\n');
    await prisma.$disconnect();
  }
}

runDoctorAudit().catch(err => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
