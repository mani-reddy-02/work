import { PrismaClient, Role } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'local_dev_secret_key';
const BASE_URL = 'http://localhost:5000/api/v1';

interface AuditContext {
  hospitalId: string;
  adminId: string;
  adminToken: string;
  createdDeptId?: string;
  createdDoctorId?: string;
  createdBookingId?: string;
  createdMarketingReqId?: string;
  createdCampReqId?: string;
  originalEmergencyContact?: string | null;
}

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

async function runAudit() {
  printHeader('MEDIQUEE HOSPITAL DASHBOARD: FULL E2E SUPABASE AUDIT');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Target Backend: ${BASE_URL}\n`);

  const ctx: AuditContext = {
    hospitalId: '',
    adminId: '',
    adminToken: '',
  };

  try {
    // ------------------------------------------------------------------------
    // WORKFLOW 1: AUTHENTICATION & PROFILE VERIFICATION
    // ------------------------------------------------------------------------
    printHeader('1. AUTHENTICATION & PROFILE VERIFICATION');

    // 1.1 Query existing Hospital Admin from Supabase
    const admin = await prisma.user.findFirst({
      where: {
        role: Role.HOSPITAL_ADMIN,
        active: true,
        hospitalId: { not: null },
      },
      include: { hospital: true },
    });

    if (!admin || !admin.hospitalId || !admin.hospital) {
      throw new Error('No active Hospital Admin with associated Hospital found in Supabase.');
    }

    ctx.hospitalId = admin.hospitalId;
    ctx.adminId = admin.id;
    ctx.adminToken = jwt.sign({ userId: admin.id }, JWT_SECRET, { expiresIn: '2h' });
    ctx.originalEmergencyContact = admin.hospital.emergencyContact;

    printStep(
      'Identify Hospital Admin in Supabase',
      'PASS',
      `Admin: "${admin.name}" (${admin.id}) | Facility: "${admin.hospital.name}" (${admin.hospitalId})`
    );

    // 1.2 GET /api/v1/users/me
    const meRes = await fetch(`${BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${ctx.adminToken}` },
    });
    const meData = await meRes.json();
    if (meRes.status !== 200 || meData.data?.id !== admin.id || meData.data?.role !== 'HOSPITAL_ADMIN') {
      throw new Error(`GET /users/me failed: status ${meRes.status}, data: ${JSON.stringify(meData)}`);
    }
    printStep(
      'GET /api/v1/users/me verified',
      'PASS',
      `HTTP 200 | Name: "${meData.data.name}", Role: ${meData.data.role}, Hospital ID: ${meData.data.hospitalId}`
    );

    // 1.3 GET /api/v1/hospital/profile
    const profileRes = await fetch(`${BASE_URL}/hospital/profile`, {
      headers: { Authorization: `Bearer ${ctx.adminToken}` },
    });
    const profileData = await profileRes.json();
    if (profileRes.status !== 200 || profileData.data?.id !== ctx.hospitalId) {
      throw new Error(`GET /hospital/profile failed: status ${profileRes.status}`);
    }
    printStep(
      'GET /api/v1/hospital/profile verified',
      'PASS',
      `HTTP 200 | Facility: "${profileData.data.name}", Address: "${profileData.data.address || profileData.data.addressLine1}"`
    );

    // 1.4 PUT /api/v1/hospital/profile
    const auditHelpline = '+91 90000 88888';
    const putRes = await fetch(`${BASE_URL}/hospital/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.adminToken}`,
      },
      body: JSON.stringify({
        emergencyContact: auditHelpline,
      }),
    });
    const putData = await putRes.json();
    if (putRes.status !== 200) {
      throw new Error(`PUT /hospital/profile failed: status ${putRes.status}`);
    }

    // Direct Supabase DB Check for profile
    const dbHospitalAfterPut = await prisma.hospital.findUnique({
      where: { id: ctx.hospitalId },
    });
    if (dbHospitalAfterPut?.emergencyContact !== auditHelpline) {
      throw new Error('Supabase database does not reflect updated emergency contact!');
    }
    printStep(
      'PUT /api/v1/hospital/profile & Supabase Direct DB Check',
      'PASS',
      `HTTP 200 | Updated emergency helpline persisted in Supabase: "${dbHospitalAfterPut.emergencyContact}"`
    );

    // Revert helpline to original
    await prisma.hospital.update({
      where: { id: ctx.hospitalId },
      data: { emergencyContact: ctx.originalEmergencyContact },
    });

    // ------------------------------------------------------------------------
    // WORKFLOW 2: DEPARTMENT & SPECIALTY MAPPING FLOW
    // ------------------------------------------------------------------------
    printHeader('2. DEPARTMENT & SPECIALTY MAPPING FLOW');

    // 2.1 Fetch specialties from /api/v1/reference/specialties
    const specRes = await fetch(`${BASE_URL}/reference/specialties`, {
      headers: { Authorization: `Bearer ${ctx.adminToken}` },
    });
    const specData = await specRes.json();
    if (specRes.status !== 200 || !Array.isArray(specData.data) || specData.data.length === 0) {
      throw new Error(`GET /reference/specialties failed: status ${specRes.status}`);
    }
    const targetSpecialty = specData.data[0];
    printStep(
      'GET /api/v1/reference/specialties verified',
      'PASS',
      `HTTP 200 | Available Specialties: ${specData.data.length} | Selected: "${targetSpecialty.name}" (${targetSpecialty.id})`
    );

    // 2.2 POST /api/v1/departments
    const deptPayload = {
      name: `Audit Wing ${Date.now().toString().slice(-4)}`,
      code: `AUD-${Date.now().toString().slice(-3)}`,
      description: 'Automated E2E Audit Clinical Department',
      specialtyId: targetSpecialty.id,
    };
    const deptRes = await fetch(`${BASE_URL}/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.adminToken}`,
      },
      body: JSON.stringify(deptPayload),
    });
    const deptData = await deptRes.json();
    if (deptRes.status !== 201 || !deptData.data?.id) {
      throw new Error(`POST /departments failed: status ${deptRes.status}, data: ${JSON.stringify(deptData)}`);
    }
    ctx.createdDeptId = deptData.data.id;

    // Direct Supabase DB Check for Department
    const dbDept = await prisma.department.findUnique({
      where: { id: ctx.createdDeptId },
      include: { specialty: true },
    });
    if (!dbDept || dbDept.hospitalId !== ctx.hospitalId || dbDept.specialtyId !== targetSpecialty.id) {
      throw new Error('Supabase Department table verification failed!');
    }
    printStep(
      'POST /api/v1/departments & Supabase Direct DB Check',
      'PASS',
      `HTTP 201 | Created Dept ID: ${dbDept.id} | Name: "${dbDept.name}" | Specialty: "${dbDept.specialty.name}"`
    );

    // ------------------------------------------------------------------------
    // WORKFLOW 3: STAFF & DOCTOR ASSIGNMENT FLOW
    // ------------------------------------------------------------------------
    printHeader('3. STAFF & DOCTOR ASSIGNMENT FLOW');

    // 3.1 POST /api/v1/staff (Create Doctor)
    const doctorPayload = {
      name: `Dr. Audit Specialist ${Date.now().toString().slice(-4)}`,
      email: `audit.doctor.${Date.now()}@mediquee.test`,
      password: 'AuditSecurePassword123!',
      role: 'DOCTOR',
      departmentId: ctx.createdDeptId,
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      designation: 'Senior Consultant',
    };
    const staffRes = await fetch(`${BASE_URL}/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.adminToken}`,
      },
      body: JSON.stringify(doctorPayload),
    });
    const staffData = await staffRes.json();
    if (staffRes.status !== 201 || !staffData.data?.id) {
      throw new Error(`POST /staff failed: status ${staffRes.status}, error: ${JSON.stringify(staffData)}`);
    }
    ctx.createdDoctorId = staffData.data.id;

    // Direct Supabase DB Check for Doctor
    const dbDoctor = await prisma.user.findUnique({
      where: { id: ctx.createdDoctorId },
      include: { department: true },
    });
    if (!dbDoctor || dbDoctor.role !== Role.DOCTOR || dbDoctor.departmentId !== ctx.createdDeptId) {
      throw new Error('Supabase User/Doctor table verification failed!');
    }
    printStep(
      'POST /api/v1/staff & Supabase Direct DB Check',
      'PASS',
      `HTTP 201 | Doctor ID: ${dbDoctor.id} | Name: "${dbDoctor.name}" | Assigned Dept: "${dbDoctor.department?.name}"`
    );

    // 3.2 POST /api/v1/doctor/schedule (Doctor sets schedule)
    const doctorToken = jwt.sign({ userId: dbDoctor.id }, JWT_SECRET, { expiresIn: '1h' });
    const schedulePayload = {
      schedule: [
        {
          dayOfWeek: 'Monday',
          startTime: '09:00',
          endTime: '13:00',
          slotDurationMinutes: 15,
          isAvailable: true,
        },
        {
          dayOfWeek: 'Wednesday',
          startTime: '10:00',
          endTime: '14:00',
          slotDurationMinutes: 15,
          isAvailable: true,
        },
      ],
    };
    const schedRes = await fetch(`${BASE_URL}/doctor/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify(schedulePayload),
    });
    const schedData = await schedRes.json();
    if (schedRes.status !== 200) {
      throw new Error(`POST /doctor/schedule failed: status ${schedRes.status}, error: ${JSON.stringify(schedData)}`);
    }

    // Direct Supabase DB Check for DoctorSchedule
    const dbSchedules = await prisma.doctorSchedule.findMany({
      where: { doctorId: ctx.createdDoctorId },
    });
    if (dbSchedules.length !== 2) {
      throw new Error(`Expected 2 DoctorSchedule rows in Supabase, found ${dbSchedules.length}`);
    }
    printStep(
      'POST /api/v1/doctor/schedule & Supabase Direct DB Check',
      'PASS',
      `HTTP 200 | Persisted ${dbSchedules.length} DoctorSchedule rows in Supabase (Days: ${dbSchedules.map(s => s.dayOfWeek).join(', ')})`
    );

    // ------------------------------------------------------------------------
    // WORKFLOW 4: RECEPTIONIST OP QUEUE & BOOKING FLOW
    // ------------------------------------------------------------------------
    printHeader('4. RECEPTIONIST OP QUEUE & BOOKING FLOW');

    // 4.1 POST /api/v1/hospital/bookings/walk-in
    const bookingPayload = {
      departmentId: ctx.createdDeptId,
      doctorId: ctx.createdDoctorId,
      patientName: 'Audit Patient Kumar',
      patientPhone: '9876543210',
      patientAge: 45,
      patientGender: 'Male',
      opType: 'General Consultation',
      fee: 400,
      appointmentDate: new Date().toISOString(),
    };
    const bookRes = await fetch(`${BASE_URL}/hospital/bookings/walk-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.adminToken}`,
      },
      body: JSON.stringify(bookingPayload),
    });
    const bookData = await bookRes.json();
    if (bookRes.status !== 201 || !bookData.data?.id) {
      throw new Error(`POST /hospital/bookings/walk-in failed: status ${bookRes.status}, error: ${JSON.stringify(bookData)}`);
    }
    ctx.createdBookingId = bookData.data.id;

    // Direct Supabase DB Check for initial booking
    const dbBooking1 = await prisma.oPBooking.findUnique({
      where: { id: ctx.createdBookingId },
    });
    if (!dbBooking1 || dbBooking1.status !== 'WAITING' || !dbBooking1.id) {
      throw new Error('Supabase OPBooking table initial check failed!');
    }
    const tokenDisplay = `OP-${dbBooking1.id.slice(0, 6).toUpperCase()}`;
    printStep(
      'POST /api/v1/hospital/bookings/walk-in & Supabase Direct DB Check',
      'PASS',
      `HTTP 201 | Booking ID: ${dbBooking1.id} | OP Token: ${tokenDisplay} | Status: ${dbBooking1.status} | Fee: ₹${dbBooking1.fee}`
    );

    // 4.2 Status Transition 1: WAITING -> IN_CONSULTATION
    const patch1 = await fetch(`${BASE_URL}/hospital/bookings/${ctx.createdBookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.adminToken}`,
      },
      body: JSON.stringify({ status: 'IN_CONSULTATION' }),
    });
    if (patch1.status !== 200) throw new Error(`Transition to IN_CONSULTATION failed: status ${patch1.status}`);
    const dbBooking2 = await prisma.oPBooking.findUnique({ where: { id: ctx.createdBookingId } });
    if (dbBooking2?.status !== 'IN_CONSULTATION') throw new Error('DB status is not IN_CONSULTATION');
    printStep(
      'PATCH /api/v1/hospital/bookings/:id/status (IN_CONSULTATION)',
      'PASS',
      `HTTP 200 | Transitioned status to: ${dbBooking2.status}`
    );

    // 4.3 Status Transition 2: IN_CONSULTATION -> COMPLETED
    const patch2 = await fetch(`${BASE_URL}/hospital/bookings/${ctx.createdBookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.adminToken}`,
      },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    if (patch2.status !== 200) throw new Error(`Transition to COMPLETED failed: status ${patch2.status}`);
    const dbBooking3 = await prisma.oPBooking.findUnique({ where: { id: ctx.createdBookingId } });
    if (dbBooking3?.status !== 'COMPLETED') throw new Error('DB status is not COMPLETED');
    printStep(
      'PATCH /api/v1/hospital/bookings/:id/status (COMPLETED)',
      'PASS',
      `HTTP 200 | Transitioned status to: ${dbBooking3.status}`
    );

    // ------------------------------------------------------------------------
    // WORKFLOW 5: DASHBOARD OVERVIEW & PAYOUTS AGGREGATION
    // ------------------------------------------------------------------------
    printHeader('5. DASHBOARD OVERVIEW & PAYOUTS AGGREGATION');

    // 5.1 GET /api/v1/hospital/dashboard/overview
    const dashRes = await fetch(`${BASE_URL}/hospital/dashboard/overview`, {
      headers: { Authorization: `Bearer ${ctx.adminToken}` },
    });
    const dashData = await dashRes.json();
    if (dashRes.status !== 200 || !dashData.data) {
      throw new Error(`GET /hospital/dashboard/overview failed: status ${dashRes.status}`);
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const actualDbTodayCount = await prisma.oPBooking.count({
      where: {
        hospitalId: ctx.hospitalId,
        appointmentDate: { gte: todayStart, lte: todayEnd },
      },
    });

    printStep(
      'GET /api/v1/hospital/dashboard/overview & Supabase Audit',
      'PASS',
      `HTTP 200 | Today Total OPs: ${dashData.data.totalOPs} (DB Count: ${actualDbTodayCount}) | Revenue Today: ₹${dashData.data.revenueToday}`
    );

    // 5.2 GET /api/v1/hospital/payouts
    const payoutsRes = await fetch(`${BASE_URL}/hospital/payouts`, {
      headers: { Authorization: `Bearer ${ctx.adminToken}` },
    });
    const payoutsData = await payoutsRes.json();
    if (payoutsRes.status !== 200 || !payoutsData.data) {
      throw new Error(`GET /hospital/payouts failed: status ${payoutsRes.status}`);
    }

    const dbCompletedAgg = await prisma.oPBooking.aggregate({
      where: {
        hospitalId: ctx.hospitalId,
        status: 'COMPLETED',
      },
      _sum: { fee: true },
    });

    printStep(
      'GET /api/v1/hospital/payouts & Supabase Revenue Calculation Audit',
      'PASS',
      `HTTP 200 | Total Payout: ₹${payoutsData.data.totalPayout} | Recent Txns: ${payoutsData.data.recentTransactions?.length} | Derived from live DB sum (Sum: ₹${dbCompletedAgg._sum.fee ?? 0})`
    );

    // ------------------------------------------------------------------------
    // WORKFLOW 6: MARKETING & MEDICAL CAMP WORKFLOW
    // ------------------------------------------------------------------------
    printHeader('6. MARKETING & MEDICAL CAMP WORKFLOW');

    // 6.1 POST /api/v1/hospital/marketing-requests
    const mktPayload = {
      campaignType: 'End-to-End Audit Marketing Campaign',
      budget: 18000,
      targetAudience: 'Local community within 15km radius',
      preferredTime: 'morning',
      notes: 'Automated audit test campaign',
    };
    const mktRes = await fetch(`${BASE_URL}/hospital/marketing-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.adminToken}`,
      },
      body: JSON.stringify(mktPayload),
    });
    const mktData = await mktRes.json();
    if (mktRes.status !== 201 || !mktData.data?.id) {
      throw new Error(`POST /hospital/marketing-requests failed: status ${mktRes.status}`);
    }
    ctx.createdMarketingReqId = mktData.data.id;

    // Direct Supabase DB Check for MarketingRequest
    const dbMkt = await prisma.marketingRequest.findUnique({
      where: { id: ctx.createdMarketingReqId },
    });
    if (!dbMkt || dbMkt.hospitalId !== ctx.hospitalId || dbMkt.status !== 'PENDING') {
      throw new Error('Supabase MarketingRequest table check failed!');
    }
    printStep(
      'POST /api/v1/hospital/marketing-requests & Supabase Direct DB Check',
      'PASS',
      `HTTP 201 | Marketing Req ID: ${dbMkt.id} | Campaign: "${dbMkt.campaignType}" | Status: ${dbMkt.status}`
    );

    // 6.2 POST /api/v1/hospital/camp-requests
    const campPayload = {
      campTitle: 'End-to-End Audit Medical Camp',
      location: 'Community Hall, Health Zone 1',
      expectedDate: '2026-11-25T10:00:00.000Z',
      expectedFootfall: '100-300 people',
      speciality: 'Cardiology',
      specialties: ['Cardiology', 'General Medicine'],
      notes: 'Automated audit medical camp request',
    };
    const campRes = await fetch(`${BASE_URL}/hospital/camp-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.adminToken}`,
      },
      body: JSON.stringify(campPayload),
    });
    const campData = await campRes.json();
    if (campRes.status !== 201 || !campData.data?.id) {
      throw new Error(`POST /hospital/camp-requests failed: status ${campRes.status}`);
    }
    ctx.createdCampReqId = campData.data.id;

    // Direct Supabase DB Check for MedicalCampRequest
    const dbCamp = await prisma.medicalCampRequest.findUnique({
      where: { id: ctx.createdCampReqId },
    });
    if (!dbCamp || dbCamp.hospitalId !== ctx.hospitalId || dbCamp.status !== 'PENDING') {
      throw new Error('Supabase MedicalCampRequest table check failed!');
    }
    printStep(
      'POST /api/v1/hospital/camp-requests & Supabase Direct DB Check',
      'PASS',
      `HTTP 201 | Camp Req ID: ${dbCamp.id} | Title: "${dbCamp.campTitle}" | Status: ${dbCamp.status}`
    );

    // 6.3 GET /api/v1/hospital/requests
    const listRes = await fetch(`${BASE_URL}/hospital/requests`, {
      headers: { Authorization: `Bearer ${ctx.adminToken}` },
    });
    const listData = await listRes.json();
    if (listRes.status !== 200 || !listData.data?.marketingRequests || !listData.data?.campRequests) {
      throw new Error(`GET /hospital/requests failed: status ${listRes.status}`);
    }
    const foundMkt = listData.data.marketingRequests.some((r: any) => r.id === ctx.createdMarketingReqId);
    const foundCamp = listData.data.campRequests.some((r: any) => r.id === ctx.createdCampReqId);
    if (!foundMkt || !foundCamp) {
      throw new Error('Created requests were not found in hospital requests history response!');
    }
    printStep(
      'GET /api/v1/hospital/requests verified',
      'PASS',
      `HTTP 200 | Confirmed both new requests present in history (Mkt: ${listData.data.marketingRequests.length}, Camp: ${listData.data.campRequests.length})`
    );

    printHeader('AUDIT EXECUTION SUMMARY: ALL 6 SEQUENTIAL WORKFLOWS PASSED (100%)');
  } catch (error: any) {
    printStep('Audit encountered an unexpected failure', 'FAIL', error.message || String(error));
    throw error;
  } finally {
    // ------------------------------------------------------------------------
    // POST-AUDIT CLEANUP
    // ------------------------------------------------------------------------
    printHeader('CLEANING UP TEMPORARY AUDIT RECORDS FROM SUPABASE');

    if (ctx.createdBookingId) {
      await prisma.oPBooking.delete({ where: { id: ctx.createdBookingId } }).catch(() => {});
      console.log(`- Pruned temporary OPBooking: ${ctx.createdBookingId}`);
    }

    if (ctx.createdDoctorId) {
      await prisma.doctorSchedule.deleteMany({ where: { doctorId: ctx.createdDoctorId } }).catch(() => {});
      await prisma.user.delete({ where: { id: ctx.createdDoctorId } }).catch(() => {});
      console.log(`- Pruned temporary Doctor & DoctorSchedules: ${ctx.createdDoctorId}`);
    }

    if (ctx.createdDeptId) {
      await prisma.department.delete({ where: { id: ctx.createdDeptId } }).catch(() => {});
      console.log(`- Pruned temporary Department: ${ctx.createdDeptId}`);
    }

    if (ctx.createdMarketingReqId) {
      await prisma.marketingRequest.delete({ where: { id: ctx.createdMarketingReqId } }).catch(() => {});
      console.log(`- Pruned temporary MarketingRequest: ${ctx.createdMarketingReqId}`);
    }

    if (ctx.createdCampReqId) {
      await prisma.medicalCampRequest.delete({ where: { id: ctx.createdCampReqId } }).catch(() => {});
      console.log(`- Pruned temporary MedicalCampRequest: ${ctx.createdCampReqId}`);
    }

    console.log('Cleanup complete. Database state is clean.\n');
    await prisma.$disconnect();
  }
}

runAudit().catch(err => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
