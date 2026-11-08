/**
 * Super Admin Dashboard Remediation Verification Suite (Run-3)
 * Validates fixes for MQ3-SEC-01 through MQ3-SEC-07:
 * 1. [MQ3-SEC-01] Weekly settlement generator ignores bookings with status 'CANCELLED'.
 * 2. [MQ3-SEC-02] Staff belonging to a suspended/unapproved hospital receive HTTP 403 upon API access.
 * 3. [MQ3-SEC-02] Public booking endpoint rejects appointments targeting suspended hospitals with HTTP 400.
 * 4. [MQ3-SEC-04] Admin document uploads with .html or unapproved extensions return HTTP 400.
 * 5. [MQ3-SEC-05] Financial listings cap requested pagination limits at 100 records.
 * 6. [MQ3-SEC-06] Administrative actions generate tamper-evident audit log entries.
 * 7. [MQ3-SEC-07] AuthService locks accounts after 5 consecutive failed login attempts.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import app from '../app';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { Role } from '@prisma/client';
import { generateWeeklySettlementsEngine } from '../modules/admin/admin.settlement.controller';
import { AuthService } from '../modules/auth/auth.service';

let server: http.Server;
let baseUrl: string;

function makeRequest(
  pathUrl: string,
  options: { method?: string; headers?: Record<string, string>; body?: any } = {}
): Promise<{ status: number; body: any; headers: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(pathUrl, baseUrl);
    const postData = options.body ? JSON.stringify(options.body) : null;

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
            const json = data ? JSON.parse(data) : {};
            resolve({ status: res.statusCode || 500, body: json, headers: res.headers });
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

function generateToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_SECRET as string, { expiresIn: '1h' });
}

async function runTests() {
  console.log('========================================================================');
  console.log(' RUN-3 SUPER ADMIN REMEDIATION VERIFICATION SUITE');
  console.log('========================================================================\n');

  // Start test server on random port
  server = app.listen(0);
  const address = server.address() as any;
  baseUrl = `http://localhost:${address.port}`;

  let passed = 0;
  let failed = 0;

  try {
    // Setup test fixtures
    // 1. Super Admin
    let superAdmin = await prisma.user.findFirst({ where: { role: Role.SUPER_ADMIN, active: true } });
    if (!superAdmin) {
      superAdmin = await prisma.user.create({
        data: {
          name: 'Super Admin Test',
          email: `superadmin_test_${Date.now()}@mediquee.com`,
          phone: `999000${Math.floor(1000 + Math.random() * 9000)}`,
          passwordHash: 'hashed_pw',
          role: Role.SUPER_ADMIN,
          active: true
        }
      });
    }
    const superAdminToken = generateToken(superAdmin.id);

    // 2. Suspended Hospital & Staff
    let suspendedHospital = await prisma.hospital.findFirst({ where: { verificationStatus: 'CANCELLED' } });
    if (!suspendedHospital) {
      suspendedHospital = await prisma.hospital.create({
        data: {
          name: 'Suspended Test Hospital',
          businessType: 'HOSPITAL',
          contactPhone: '9888800000',
          addressLine1: 'Test Address',
          city: 'Hyderabad',
          verificationStatus: 'CANCELLED',
          cancellationReason: 'Suspended for regulatory review'
        }
      });
    }

    let suspendedDoctor = await prisma.user.findFirst({
      where: { hospitalId: suspendedHospital.id, role: Role.DOCTOR }
    });
    if (!suspendedDoctor) {
      suspendedDoctor = await prisma.user.create({
        data: {
          name: 'Suspended Doctor',
          email: `susp_doc_${Date.now()}@mediquee.com`,
          phone: `988800${Math.floor(1000 + Math.random() * 9000)}`,
          passwordHash: 'hashed_pw',
          role: Role.DOCTOR,
          hospitalId: suspendedHospital.id,
          active: true
        }
      });
    }
    const suspendedDoctorToken = generateToken(suspendedDoctor.id);

    // 3. Approved Hospital
    let approvedHospital = await prisma.hospital.findFirst({ where: { verificationStatus: 'APPROVED' } });
    if (!approvedHospital) {
      approvedHospital = await prisma.hospital.create({
        data: {
          name: 'Approved Test Hospital',
          businessType: 'HOSPITAL',
          contactPhone: '9777700000',
          addressLine1: 'Approved Address',
          city: 'Hyderabad',
          verificationStatus: 'APPROVED'
        }
      });
    }

    let approvedDepartment = await prisma.department.findFirst({ where: { hospitalId: approvedHospital.id } });
    if (!approvedDepartment) {
      approvedDepartment = await prisma.department.create({
        data: {
          name: 'General Medicine',
          hospitalId: approvedHospital.id
        }
      });
    }

    let approvedDoctor = await prisma.user.findFirst({ where: { hospitalId: approvedHospital.id, role: Role.DOCTOR } });
    if (!approvedDoctor) {
      approvedDoctor = await prisma.user.create({
        data: {
          name: 'Approved Doctor',
          phone: `977700${Math.floor(1000 + Math.random() * 9000)}`,
          passwordHash: 'hashed_pw',
          role: Role.DOCTOR,
          hospitalId: approvedHospital.id,
          departmentId: approvedDepartment.id,
          active: true
        }
      });
    }

    // 4. Test Patient
    let testPatient = await prisma.user.findFirst({ where: { role: Role.PATIENT, active: true } });
    if (!testPatient) {
      testPatient = await prisma.user.create({
        data: {
          name: 'Verification Patient',
          email: `patient_test_${Date.now()}@mediquee.com`,
          phone: `966600${Math.floor(1000 + Math.random() * 9000)}`,
          passwordHash: 'hashed_pw',
          role: Role.PATIENT,
          active: true
        }
      });
    }
    const patientToken = generateToken(testPatient.id);

    // -------------------------------------------------------------------------
    // TEST 1: Weekly settlement generator ignores bookings with status 'CANCELLED'
    // -------------------------------------------------------------------------
    console.log('[TEST 1] [MQ3-SEC-01] Settlement Engine Ignores CANCELLED Bookings:');
    try {
      // Seed a cancelled OP booking
      const cancelledBooking = await prisma.oPBooking.create({
        data: {
          patientId: testPatient.id,
          hospitalId: approvedHospital.id,
          doctorId: approvedDoctor.id,
          departmentId: approvedDepartment.id,
          patientName: 'Cancelled Test Patient',
          patientPhone: '9000000001',
          fee: 500,
          status: 'CANCELLED',
          isWalkIn: false,
          payoutEligible: true,
        }
      });

      // Run settlement engine
      await generateWeeklySettlementsEngine();

      // Check whether cancelledBooking was included in any settlement items
      const settlementItem = await prisma.settlementItem.findFirst({
        where: { bookingId: cancelledBooking.id }
      });

      // Clean up test booking
      await prisma.oPBooking.delete({ where: { id: cancelledBooking.id } }).catch(() => {});

      if (!settlementItem) {
        console.log('  âœ” PASS: Cancelled booking was excluded from settlement generation');
        passed++;
      } else {
        console.error('  âœ— FAIL: Cancelled booking was unexpectedly included in settlement item:', settlementItem);
        failed++;
      }
    } catch (err: any) {
      console.error('  âœ— ERROR:', err.message);
      failed++;
    }

    // -------------------------------------------------------------------------
    // TEST 2: Staff belonging to a suspended hospital receive HTTP 403 upon API access
    // -------------------------------------------------------------------------
    console.log('\n[TEST 2] [MQ3-SEC-02] Staff of Suspended Hospital Receive HTTP 403:');
    try {
      const res = await makeRequest('/api/v1/doctors/schedule', {
        headers: { Authorization: `Bearer ${suspendedDoctorToken}` }
      });

      if (res.status === 403 && res.body?.error?.message?.includes('suspended')) {
        console.log(`  ✔ PASS: Request rejected with HTTP ${res.status} ("${res.body?.error?.message}")`);
        passed++;
      } else {
        console.error(`  ✖ FAIL: Expected HTTP 403 with suspended message, got HTTP ${res.status}:`, res.body);
        failed++;
      }
    } catch (err: any) {
      console.error('  ✖ ERROR:', err.message);
      failed++;
    }

    // -------------------------------------------------------------------------
    // TEST 3: Public booking endpoint rejects appointments targeting suspended hospitals
    // -------------------------------------------------------------------------
    console.log('\n[TEST 3] [MQ3-SEC-02] Public Booking Endpoint Rejects Suspended Hospital:');
    try {
      const res = await makeRequest('/api/v1/appointments', {
        method: 'POST',
        headers: { Authorization: `Bearer ${patientToken}` },
        body: {
          hospitalId: suspendedHospital.id,
          doctorId: suspendedDoctor.id,
          date: new Date().toISOString().split('T')[0],
          timeSlot: '10:00 AM',
          patientName: 'Test Patient',
          patientPhone: '9000000000',
          opType: 'Normal'
        }
      });

      if (res.status === 400 && res.body?.error?.message?.includes('Target hospital is inactive, suspended, or unapproved')) {
        console.log(`  âœ” PASS: Appointment creation rejected with HTTP 400 ("${res.body?.error?.message}")`);
        passed++;
      } else {
        console.error(`  âœ— FAIL: Expected HTTP 400 with target hospital suspended message, got HTTP ${res.status}:`, res.body);
        failed++;
      }
    } catch (err: any) {
      console.error('  âœ— ERROR:', err.message);
      failed++;
    }

    // -------------------------------------------------------------------------
    // TEST 4: Admin document uploads with .html or unapproved extensions return HTTP 400
    // -------------------------------------------------------------------------
    console.log('\n[TEST 4] [MQ3-SEC-04] Admin Document Uploads Reject .html / Invalid Extensions:');
    try {
      let testSettlement = await prisma.settlement.findFirst();
      if (!testSettlement) {
        testSettlement = await prisma.settlement.create({
          data: {
            settlementNumber: `TEST-SETTLE-${Date.now()}`,
            partnerId: approvedHospital.id,
            partnerName: approvedHospital.name,
            partnerType: 'HOSPITAL',
            periodLabel: 'Test Period',
            periodStart: new Date(),
            periodEnd: new Date(),
            transactionCount: 1,
            grossRevenue: 1000,
            adminCommissionRate: 20,
            adminCommission: 200,
            partnerShareRate: 80,
            partnerShare: 800,
            payableAmount: 800,
            paidAmount: 0,
            status: 'PENDING'
          }
        });
      }

      // Upload HTML payload with .html extension
      const htmlPayload = Buffer.from('<script>alert("XSS")</script>').toString('base64');
      const resHtml = await makeRequest(`/api/v1/admin/finance/settlements/${testSettlement.id}/attachments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          fileName: 'malicious_exploit.html',
          documentType: 'SETTLEMENT_STATEMENT',
          fileData: `data:text/html;base64,${htmlPayload}`
        }
      });

      // Upload fake PDF with invalid magic bytes
      const fakePdfPayload = Buffer.from('NOT_A_REAL_PDF_FILE').toString('base64');
      const resFakePdf = await makeRequest(`/api/v1/admin/finance/settlements/${testSettlement.id}/attachments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: {
          fileName: 'fake_invoice.pdf',
          documentType: 'SETTLEMENT_STATEMENT',
          fileData: `data:application/pdf;base64,${fakePdfPayload}`
        }
      });

      if (resHtml.status === 400 && resFakePdf.status === 400) {
        console.log(`  âœ” PASS: Both .html (${resHtml.status}) and fake magic bytes (${resFakePdf.status}) rejected with HTTP 400`);
        passed++;
      } else {
        console.error(`  âœ— FAIL: resHtml status: ${resHtml.status}, resFakePdf status: ${resFakePdf.status}`);
        failed++;
      }
    } catch (err: any) {
      console.error('  âœ— ERROR:', err.message);
      failed++;
    }

    // -------------------------------------------------------------------------
    // TEST 5: Financial listings cap requested pagination limits at 100 records
    // -------------------------------------------------------------------------
    console.log('\n[TEST 5] [MQ3-SEC-05] Financial Listings Cap Pagination at 100 Records:');
    try {
      const res = await makeRequest('/api/v1/admin/finance/transactions?limit=250', {
        headers: { Authorization: `Bearer ${superAdminToken}` }
      });

      if (res.status === 200 && res.body?.pagination?.limit === 100 && res.body?.data?.length <= 100) {
        console.log(`  âœ” PASS: Requested limit=250 capped at limit=${res.body.pagination.limit} (returned ${res.body.data.length} records)`);
        passed++;
      } else {
        console.error(`  âœ— FAIL: Expected limit capped at 100, got status ${res.status}:`, res.body?.pagination);
        failed++;
      }
    } catch (err: any) {
      console.error('  âœ— ERROR:', err.message);
      failed++;
    }

    // -------------------------------------------------------------------------
    // TEST 6: Audit log verification
    // -------------------------------------------------------------------------
    console.log('\n[TEST 6] [MQ3-SEC-06] Administrative Audit Log Verification:');
    try {
      // Execute an administrative revenue share mutation
      await makeRequest(`/api/v1/admin/hospitals/${approvedHospital.id}/revenue-share`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${superAdminToken}` },
        body: { hospitalSharePercentage: 80 }
      });

      const logPath = path.join(process.cwd(), 'logs', 'audit.log');
      if (fs.existsSync(logPath)) {
        const logContent = fs.readFileSync(logPath, 'utf8');
        const lines = logContent.trim().split('\n').filter(Boolean);
        if (lines.length > 0) {
          const sample = JSON.parse(lines[lines.length - 1]);
          if (sample.action && sample.actorId && sample.timestamp) {
            console.log(`  ✔ PASS: Audit log contains ${lines.length} entries. Latest: [${sample.action}] on ${sample.targetEntity}`);
            passed++;
          } else {
            console.error('  ✖ FAIL: Audit log entry missing required fields:', sample);
            failed++;
          }
        } else {
          console.error('  ✖ FAIL: Audit log is empty');
          failed++;
        }
      } else {
        console.error('  ✖ FAIL: Audit log file does not exist at', logPath);
        failed++;
      }
    } catch (err: any) {
      console.error('  ✖ ERROR:', err.message);
      failed++;
    }

    // -------------------------------------------------------------------------
    // TEST 7: AuthService account lockout after 5 consecutive failed attempts
    // -------------------------------------------------------------------------
    console.log('\n[TEST 7] [MQ3-SEC-07] Authentication Service Account Lockout:');
    try {
      const testPhone = `955500${Math.floor(1000 + Math.random() * 9000)}`;
      // Create user for lockout test
      const testLockoutUser = await prisma.user.create({
        data: {
          name: 'Lockout Test User',
          phone: testPhone,
          passwordHash: 'hashed_dummy_pw',
          role: Role.SUPER_ADMIN,
          active: true
        }
      });

      let lockoutTriggered = false;
      for (let i = 0; i < 6; i++) {
        try {
          await AuthService.login(testPhone, 'wrong_password');
        } catch (authErr: any) {
          if (authErr.message?.includes('temporarily locked')) {
            lockoutTriggered = true;
            break;
          }
        }
      }

      await prisma.user.delete({ where: { id: testLockoutUser.id } }).catch(() => {});

      if (lockoutTriggered) {
        console.log('  âœ” PASS: Account lockout triggered after consecutive failed attempts');
        passed++;
      } else {
        console.error('  âœ— FAIL: Lockout was not triggered after 6 failed attempts');
        failed++;
      }
    } catch (err: any) {
      console.error('  âœ— ERROR:', err.message);
      failed++;
    }

  } catch (globalErr: any) {
    console.error('Unexpected test error:', globalErr);
  } finally {
    if (server) server.close();
    await prisma.$disconnect();
  }

  console.log('\n========================================================================');
  console.log(` RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(console.error);
