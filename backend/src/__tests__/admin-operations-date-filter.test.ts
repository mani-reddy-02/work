import http from 'http';
import app from '../app';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { Role } from '@prisma/client';

let server: http.Server;
let baseUrl: string;

function makeRequest(
  endpoint: string,
  options: { method?: string; headers?: Record<string, string>; body?: any } = {}
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, baseUrl);
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
            resolve({ status: res.statusCode || 500, body: json });
          } catch {
            resolve({ status: res.statusCode || 500, body: data });
          }
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`✔ ${message}`);
  }
}

async function runTests() {
  server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const port = (server.address() as any).port;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server running on ${baseUrl}`);

  try {
    console.log('--- STARTING ADMIN OPERATIONS DATE-WISE MONITORING TESTS ---');

    let superAdminUser = await prisma.user.findFirst({
      where: { role: Role.SUPER_ADMIN },
    });

    if (!superAdminUser) {
      superAdminUser = await prisma.user.create({
        data: {
          name: 'Super Admin Test',
          email: `superadmin.${Date.now()}@mediquee.test`,
          passwordHash: 'dummy',
          role: Role.SUPER_ADMIN,
        },
      });
    }

    const adminToken = jwt.sign(
      { userId: superAdminUser.id },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const authHeader = { Authorization: `Bearer ${adminToken}` };

    // 1. Fetch OP Bookings default (no date filter)
    console.log('\n[TEST GROUP 1: DEFAULT OP BOOKINGS LIST]');
    const resDefault = await makeRequest('/api/v1/admin/appointments?limit=20', {
      headers: authHeader,
    });
    assert(resDefault.status === 200, 'GET /admin/appointments returns 200');
    assert(resDefault.body.success === true, 'Response success is true');
    assert(Array.isArray(resDefault.body.data), 'Returns data array');
    assert(resDefault.body.pagination?.limit === 20, 'Pagination limit is 20');
    assert(resDefault.body.stats !== undefined, 'KPI stats returned');

    // 2. Filter OP Bookings by Single Date (2026-10-17)
    console.log('\n[TEST GROUP 2: SINGLE DATE FILTER (2026-10-17)]');
    const resSingleDate = await makeRequest('/api/v1/admin/appointments?date=2026-10-17', {
      headers: authHeader,
    });
    assert(resSingleDate.status === 200, 'Single date query returns 200');
    assert(resSingleDate.body.success === true, 'Single date query success is true');
    assert(resSingleDate.body.data.length > 0, 'Found bookings for 2026-10-17');
    for (const b of resSingleDate.body.data) {
      const bDate = b.appointmentDate.split('T')[0];
      assert(bDate === '2026-10-17', `Booking ${b.id} matches 2026-10-17 date (got ${bDate})`);
    }
    assert(resSingleDate.body.stats.total === resSingleDate.body.pagination.total, 'Stats total matches pagination total');

    // 3. Filter OP Bookings by Date Range (2026-10-10 to 2026-10-17)
    console.log('\n[TEST GROUP 3: DATE RANGE FILTER (2026-10-10 to 2026-10-17)]');
    const resDateRange = await makeRequest(
      '/api/v1/admin/appointments?startDate=2026-10-10&endDate=2026-10-17',
      { headers: authHeader }
    );
    assert(resDateRange.status === 200, 'Date range query returns 200');
    assert(resDateRange.body.success === true, 'Date range query success is true');
    assert(resDateRange.body.data.length >= resSingleDate.body.data.length, 'Range returns at least as many bookings as single date');
    for (const b of resDateRange.body.data) {
      const bDate = b.appointmentDate.split('T')[0];
      assert(bDate >= '2026-10-10' && bDate <= '2026-10-17', `Booking ${b.id} is within range (got ${bDate})`);
    }

    // 4. Combined Date and Search Filter
    console.log('\n[TEST GROUP 4: COMBINED DATE & SEARCH FILTER]');
    const samplePatient = resSingleDate.body.data[0].patientName;
    const resCombined = await makeRequest(
      `/api/v1/admin/appointments?date=2026-10-17&search=${encodeURIComponent(samplePatient)}`,
      { headers: authHeader }
    );
    assert(resCombined.status === 200, 'Combined date & search returns 200');
    assert(resCombined.body.success === true, 'Combined query success is true');
    assert(resCombined.body.data.length > 0, `Found matching booking for ${samplePatient}`);
    assert(resCombined.body.data[0].patientName.toLowerCase().includes(samplePatient.toLowerCase()), 'Patient name matches search');

    // 5. Empty Date Result
    console.log('\n[TEST GROUP 5: EMPTY DATE RESULT STATE]');
    const resEmpty = await makeRequest('/api/v1/admin/appointments?date=1995-01-01', {
      headers: authHeader,
    });
    assert(resEmpty.status === 200, 'Empty date filter query returns 200');
    assert(resEmpty.body.data.length === 0, 'Returns 0 bookings for non-existent date');
    assert(resEmpty.body.pagination.total === 0, 'Pagination total is 0');
    assert(resEmpty.body.stats.total === 0, 'Stats total is 0');

    // 6. Video Consultations Date Filter
    console.log('\n[TEST GROUP 6: VIDEO CONSULTATIONS DATE FILTER]');
    const resVcDate = await makeRequest('/api/v1/admin/video-consultations?date=2026-10-17', {
      headers: authHeader,
    });
    assert(resVcDate.status === 200, 'VC date query returns 200');
    assert(resVcDate.body.success === true, 'VC query success is true');
    assert(Array.isArray(resVcDate.body.data), 'VC data is array');
    assert(resVcDate.body.stats !== undefined, 'VC stats returned');

    // 7. Video Consultation Read-Only Detail View
    if (resVcDate.body.data.length > 0) {
      const vcId = resVcDate.body.data[0].id;
      console.log(`\n[TEST GROUP 7: VIDEO CONSULTATION READ-ONLY DETAIL (ID: ${vcId})]`);
      const resDetail = await makeRequest(`/api/v1/admin/video-consultations/${vcId}`, {
        headers: authHeader,
      });
      assert(resDetail.status === 200, 'GET /admin/video-consultations/:id returns 200');
      assert(resDetail.body.success === true, 'Detail response success is true');
      assert(resDetail.body.data.id === vcId, 'Detail ID matches requested ID');
      assert(resDetail.body.data.consultationId !== undefined, 'Detail has consultationId');
      assert(resDetail.body.data.patientName !== undefined, 'Detail has patientName');
      assert(resDetail.body.data.doctorName !== undefined, 'Detail has doctorName');
      assert(resDetail.body.data.hospitalName !== undefined, 'Detail has hospitalName');
      assert(resDetail.body.data.consultationStatus !== undefined, 'Detail has consultationStatus');
      assert(resDetail.body.data.sessionStatus !== undefined, 'Detail has sessionStatus');
      assert(resDetail.body.data.token === undefined, 'LiveKit tokens/secrets strictly excluded from response');
    }

    console.log('\n===========================================================');
    console.log('ALL ADMIN OPERATIONS TESTS PASSED SUCCESSFULLY (100%)');
    console.log('===========================================================');
  } finally {
    if (server) {
      server.close();
    }
  }
}

runTests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Test suite failed:', err);
    process.exit(1);
  });
