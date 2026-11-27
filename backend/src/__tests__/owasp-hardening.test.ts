import assert from 'assert';
import http from 'http';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import app from '../app';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { errorHandler } from '../middleware/errorHandler';
import { Role, BusinessType } from '@prisma/client';

let server: http.Server;
let baseUrl: string;

function makeRequest(
  reqPath: string,
  options: { method?: string; headers?: Record<string, string>; body?: any } = {}
): Promise<{ status: number; body: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const url = new URL(reqPath, baseUrl);
    const postData = options.body !== undefined ? JSON.stringify(options.body) : null;

    const req = http.request(
      url,
      {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
          ...(options.headers || {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode || 500, body: data ? JSON.parse(data) : {}, headers: res.headers });
          } catch {
            resolve({ status: res.statusCode || 500, body: data, headers: res.headers });
          }
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runOwaspHardeningTests() {
  console.log('================================================================');
  console.log('  MEDIQUEE: OWASP TOP 10:2025 HARDENING REGRESSION SUITE        ');
  console.log('================================================================\n');

  const cleanupBookingIds: string[] = [];
  const cleanupReportIds: string[] = [];
  const cleanupDeptIds: string[] = [];
  const cleanupUserIds: string[] = [];
  const cleanupHospitalIds: string[] = [];

  try {
    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });

    // 1. A01: Open Redirect protection in universalFileProxy
    const redirectRes = await makeRequest('/api/v1/files/preview?url=https://evil.example.com/phish');
    assert.strictEqual(redirectRes.status, 403, 'Untrusted external redirect must return 403');
    console.log('✔ [A01] Untrusted URL open redirect rejected (403)');

    // 2. A05: XSS / unsafe filename rejection & CSP header on fallback preview
    const xssRes = await makeRequest('/uploads/reports/%3Cscript%3Ealert(1)%3C%2Fscript%3E.html');
    assert.strictEqual(xssRes.status, 400, 'Unsafe filename characters must return 400');
    const safeFallbackRes = await makeRequest('/uploads/reports/nonexistent_owasp_check_123.html');
    assert.ok(
      typeof safeFallbackRes.headers['content-security-policy'] === 'string',
      'Fallback HTML/SVG response must include Content-Security-Policy header'
    );
    console.log('✔ [A05] Reflected XSS / unsafe filename blocked (400) & CSP header applied');

    // 3. A01/A06: Geographic bounds on reverse-geocode
    const geoRes = await makeRequest('/api/v1/public/reverse-geocode?lat=999&lng=999');
    assert.strictEqual(geoRes.status, 400, 'Out-of-bounds lat/lng must return 400');
    console.log('✔ [A01] Reverse-geocode invalid coordinates rejected (400)');

    // 4. A01: Payment routes require authentication
    const unauthOrder = await makeRequest('/api/v1/payments/create-order', {
      method: 'POST',
      body: { serviceType: 'OP_BOOKING', bookingId: '00000000-0000-0000-0000-000000000000' },
    });
    assert.strictEqual(unauthOrder.status, 401, 'Unauthenticated /payments/create-order must return 401');

    const unauthCancel = await makeRequest('/api/v1/payments/cancel-pending', {
      method: 'POST',
      body: { serviceType: 'OP_BOOKING', bookingId: '00000000-0000-0000-0000-000000000000' },
    });
    assert.strictEqual(unauthCancel.status, 401, 'Unauthenticated /payments/cancel-pending must return 401');
    console.log('✔ [A01] Payment endpoints fail closed (401 without JWT)');

    // Provision ephemeral fixture entities for tenant IDOR, payment ownership, & fee tests
    const ts = Date.now();
    const dummyHash = await bcrypt.hash('TestPass@123', 10);

    const hospA = await prisma.hospital.create({
      data: {
        name: `OWASP Test Hospital A ${ts}`,
        businessType: BusinessType.HOSPITAL,
        verificationStatus: 'APPROVED',
        city: 'Hyderabad',
      },
    });
    cleanupHospitalIds.push(hospA.id);

    const hospB = await prisma.hospital.create({
      data: {
        name: `OWASP Test Hospital B ${ts}`,
        businessType: BusinessType.HOSPITAL,
        verificationStatus: 'APPROVED',
        city: 'Hyderabad',
      },
    });
    cleanupHospitalIds.push(hospB.id);

    const deptA = await prisma.department.create({
      data: { hospitalId: hospA.id, name: 'General Medicine' },
    });
    cleanupDeptIds.push(deptA.id);

    const doctorA = await prisma.user.create({
      data: {
        name: 'Dr OWASP Test A',
        email: `owasp_doc_a_${ts}@test.local`,
        phone: `91${String(ts).slice(-8)}1`,
        passwordHash: dummyHash,
        role: Role.DOCTOR,
        hospitalId: hospA.id,
        departmentId: deptA.id,
        consultationFee: 650,
        active: true,
      },
    });
    cleanupUserIds.push(doctorA.id);

    const doctorB = await prisma.user.create({
      data: {
        name: 'Dr OWASP Test B',
        email: `owasp_doc_b_${ts}@test.local`,
        phone: `91${String(ts).slice(-8)}2`,
        passwordHash: dummyHash,
        role: Role.DOCTOR,
        hospitalId: hospB.id,
        active: true,
      },
    });
    cleanupUserIds.push(doctorB.id);

    const hospAdminNoHosp = await prisma.user.create({
      data: {
        name: 'OWASP Orphan Admin',
        email: `owasp_orphan_${ts}@test.local`,
        phone: `91${String(ts).slice(-8)}3`,
        passwordHash: dummyHash,
        role: Role.HOSPITAL_ADMIN,
        hospitalId: null,
        active: true,
      },
    });
    cleanupUserIds.push(hospAdminNoHosp.id);

    const patientA = await prisma.user.create({
      data: {
        name: 'OWASP Patient A',
        email: `owasp_pat_a_${ts}@test.local`,
        phone: `91${String(ts).slice(-8)}4`,
        passwordHash: dummyHash,
        role: Role.PATIENT,
        active: true,
      },
    });
    cleanupUserIds.push(patientA.id);

    const patientB = await prisma.user.create({
      data: {
        name: 'OWASP Patient B',
        email: `owasp_pat_b_${ts}@test.local`,
        phone: `91${String(ts).slice(-8)}5`,
        passwordHash: dummyHash,
        role: Role.PATIENT,
        active: true,
      },
    });
    cleanupUserIds.push(patientB.id);

    const tokenPatientA = jwt.sign({ userId: patientA.id }, env.JWT_SECRET, { expiresIn: '1h' });
    const tokenPatientB = jwt.sign({ userId: patientB.id }, env.JWT_SECRET, { expiresIn: '1h' });
    const tokenDoctorB = jwt.sign({ userId: doctorB.id }, env.JWT_SECRET, { expiresIn: '1h' });
    const tokenDoctorA = jwt.sign({ userId: doctorA.id }, env.JWT_SECRET, { expiresIn: '1h' });
    const tokenOrphanAdmin = jwt.sign({ userId: hospAdminNoHosp.id }, env.JWT_SECRET, { expiresIn: '1h' });

    // 5. A06: OP Booking ignores client-supplied fee
    const futureDateObj = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const futureDate = futureDateObj.toISOString().split('T')[0];
    const dayName = new Date(futureDate).toLocaleDateString('en-US', { weekday: 'long' });
    await prisma.doctorSchedule.create({
      data: {
        hospitalId: hospA.id,
        doctorId: doctorA.id,
        dayOfWeek: dayName,
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: true,
      },
    });

    const bookRes = await makeRequest('/api/v1/appointments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenPatientA}` },
      body: {
        hospitalId: hospA.id,
        departmentId: deptA.id,
        doctorId: doctorA.id,
        date: futureDate,
        timeSlot: '11:30 AM',
        fee: 0, // Tampered client fee attempt
        patientName: 'OWASP Patient A',
        patientPhone: patientA.phone,
      },
    });
    assert.strictEqual(bookRes.status, 201, `Expected 201 creating OP booking, got ${bookRes.status}: ${JSON.stringify(bookRes.body)}`);
    const createdBookingId = bookRes.body?.data?.id;
    assert.ok(createdBookingId, 'Created booking ID must exist');
    cleanupBookingIds.push(createdBookingId);
    assert.strictEqual(bookRes.body.data.fee, 650, 'Booking fee must use server DB doctor.consultationFee (650), not client 0');
    console.log('✔ [A06] Client-tampered OP booking fee ignored; authoritative server fee enforced');

    // 6. A01: Cross-user payment cancel-pending IDOR blocked
    const cancelIdorRes = await makeRequest('/api/v1/payments/cancel-pending', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenPatientB}` },
      body: { serviceType: 'OP_BOOKING', bookingId: createdBookingId },
    });
    assert.strictEqual(cancelIdorRes.status, 403, `Expected 403 on cross-user cancel-pending, got ${cancelIdorRes.status}`);
    const stillExists = await prisma.oPBooking.findUnique({ where: { id: createdBookingId } });
    assert.ok(stillExists, 'Patient A booking must NOT be deleted by Patient B');
    console.log('✔ [A01] Cross-user /payments/cancel-pending IDOR blocked (403)');

    // 7. A01: Cross-tenant PatientReport download IDOR blocked
    const report = await prisma.patientReport.create({
      data: {
        userId: patientA.id,
        title: 'OWASP Confidential Report',
        hospital: hospA.name,
        date: '27 Nov 2026',
        fileUrl: '/uploads/reports/owasp_test_dummy.pdf',
      },
    });
    cleanupReportIds.push(report.id);

    const reportIdorRes = await makeRequest(`/api/v1/reports/${report.id}/download`, {
      headers: { Authorization: `Bearer ${tokenDoctorB}` },
    });
    assert.strictEqual(reportIdorRes.status, 403, `Doctor from unaffiliated hospital must receive 403, got ${reportIdorRes.status}`);
    console.log('✔ [A01] Cross-hospital PatientReport download IDOR blocked (403)');

    // 8. A01: Clinical history blocks hospital-unaffiliated admin
    const clinicalIdorRes = await makeRequest(`/api/v1/clinical/patients/${patientA.id}/history`, {
      headers: { Authorization: `Bearer ${tokenOrphanAdmin}` },
    });
    assert.strictEqual(clinicalIdorRes.status, 403, `Unaffiliated HOSPITAL_ADMIN must receive 403, got ${clinicalIdorRes.status}`);
    console.log('✔ [A01] Cross-tenant clinical patient history without hospitalId blocked (403)');

    // 9. A08: Invalid appointment status enum rejected
    const badStatusRes = await makeRequest(`/api/v1/appointments/${createdBookingId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenDoctorA}` },
      body: { status: 'INVALID_EVIL_STATUS' },
    });
    assert.strictEqual(badStatusRes.status, 400, `Invalid status enum must return 400, got ${badStatusRes.status}`);
    console.log('✔ [A08] Invalid appointment status enum rejected (400)');

    // 10. A10: Production error handler redacts 500 internal error details
    const origNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    let capturedStatus = 0;
    let capturedJson: any = null;
    const mockRes: any = {
      headersSent: false,
      status(code: number) {
        capturedStatus = code;
        return this;
      },
      json(payload: any) {
        capturedJson = payload;
        return this;
      },
    };
    errorHandler(new Error('SELECT * FROM secret_table WHERE token=abc'), {} as any, mockRes, () => {});
    process.env.NODE_ENV = origNodeEnv;
    assert.strictEqual(capturedStatus, 500);
    assert.strictEqual(capturedJson?.error?.message, 'Internal Server Error');
    console.log('✔ [A10] Global errorHandler hides internal 500 error details in production');

    console.log('\n🎉 ALL OWASP TOP 10:2025 HARDENING REGRESSION CHECKS PASSED!\n');
  } finally {
    for (const id of cleanupBookingIds) {
      await prisma.oPBooking.deleteMany({ where: { id } }).catch(() => {});
    }
    for (const id of cleanupReportIds) {
      await prisma.patientReport.deleteMany({ where: { id } }).catch(() => {});
    }
    for (const id of cleanupUserIds) {
      await prisma.doctorSchedule.deleteMany({ where: { doctorId: id } }).catch(() => {});
      await prisma.user.deleteMany({ where: { id } }).catch(() => {});
    }
    for (const id of cleanupDeptIds) {
      await prisma.department.deleteMany({ where: { id } }).catch(() => {});
    }
    for (const id of cleanupHospitalIds) {
      await prisma.hospital.deleteMany({ where: { id } }).catch(() => {});
    }
    if (server) server.close();
    await prisma.$disconnect();
  }
}

runOwaspHardeningTests().catch((err) => {
  console.error('❌ OWASP hardening test suite failed:', err);
  process.exit(1);
});
