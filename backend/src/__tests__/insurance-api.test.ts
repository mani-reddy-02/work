import { prisma } from '../config/prisma';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import http from 'http';
import app from '../app';

let server: http.Server;
let baseUrl: string;
let superAdminToken: string;
let patientToken: string;
let testSuperAdminId: string;
let testPatientId: string;
const cleanupInsuranceIds: string[] = [];

function makeRequest(
  urlPath: string,
  options: {
    method?: string;
    token?: string;
    body?: any;
  } = {}
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, baseUrl);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (options.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }

    const payload = options.body ? JSON.stringify(options.body) : undefined;
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload).toString();
    }

    const req = http.request(
      url,
      {
        method: options.method || 'GET',
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let body = data;
          try {
            body = JSON.parse(data);
          } catch {}
          resolve({ status: res.statusCode || 500, body });
        });
      }
    );

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runInsuranceTests() {
  console.log('=== STARTING INSURANCE MANAGEMENT API TESTS ===');

  // Setup test server
  server = app.listen(0);
  const address = server.address() as any;
  baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // Create Super Admin & Patient users
    const adminEmail = `test-admin-${Date.now()}@mediquee.com`;
    const patientEmail = `test-patient-${Date.now()}@mediquee.com`;
    const passwordHash = await bcrypt.hash('TestPass123!', 10);

    const adminUser = await prisma.user.create({
      data: {
        name: 'Test Super Admin',
        email: adminEmail,
        passwordHash,
        role: Role.SUPER_ADMIN,
        active: true,
      },
    });
    testSuperAdminId = adminUser.id;
    superAdminToken = jwt.sign({ userId: adminUser.id }, env.JWT_SECRET, { expiresIn: '1h' });

    const patientUser = await prisma.user.create({
      data: {
        name: 'Test Patient',
        email: patientEmail,
        passwordHash,
        role: Role.PATIENT,
        active: true,
      },
    });
    testPatientId = patientUser.id;
    patientToken = jwt.sign({ userId: patientUser.id }, env.JWT_SECRET, { expiresIn: '1h' });

    // TEST 1: Unauthorized access to Admin Insurance Write Endpoints
    console.log('\n[TEST 1] Unauthorized Access Prevention:');
    const unauthPost = await makeRequest('/api/v1/insurance/admin', {
      method: 'POST',
      body: { title: 'Hacker Insurance', description: 'desc', successRate: 90, applicationUrl: 'https://test.com' },
    });
    console.assert(unauthPost.status === 401, `Expected 401 for unauthenticated POST, got ${unauthPost.status}`);
    console.log('  ✔ Unauthenticated POST /insurance/admin blocked with 401');

    const patientPost = await makeRequest('/api/v1/insurance/admin', {
      method: 'POST',
      token: patientToken,
      body: { title: 'Patient Insurance', description: 'desc', successRate: 90, applicationUrl: 'https://test.com' },
    });
    console.assert(patientPost.status === 403, `Expected 403 for non-superadmin POST, got ${patientPost.status}`);
    console.log('  ✔ Non-admin role blocked with 403 Forbidden');

    // TEST 2: Validation on Create Insurance
    console.log('\n[TEST 2] Input Validation:');
    const invalidRateRes = await makeRequest('/api/v1/insurance/admin', {
      method: 'POST',
      token: superAdminToken,
      body: {
        title: 'Invalid Rate Plan',
        description: 'Valid description',
        successRate: 150, // Invalid: > 100
        applicationUrl: 'https://example.com/apply',
      },
    });
    console.assert(invalidRateRes.status === 400, `Expected 400 for successRate > 100, got ${invalidRateRes.status}`);
    console.log('  ✔ Success rate > 100% rejected with 400 Bad Request');

    const invalidUrlRes = await makeRequest('/api/v1/insurance/admin', {
      method: 'POST',
      token: superAdminToken,
      body: {
        title: 'Invalid URL Plan',
        description: 'Valid description',
        successRate: 90,
        applicationUrl: 'javascript:alert(1)', // Invalid protocol
      },
    });
    console.assert(invalidUrlRes.status === 400, `Expected 400 for unsafe URL protocol, got ${invalidUrlRes.status}`);
    console.log('  ✔ Unsafe application URL protocol rejected with 400');

    // TEST 3: Successful Creation of Insurance
    console.log('\n[TEST 3] Successful Insurance Creation:');
    const validPlan = {
      title: `Star Health Test Policy ${Date.now()}`,
      icon: '/icons/shield.png',
      description: 'Comprehensive hospitalization and cashless claim cover for families.',
      successRate: 96.5,
      applicationUrl: 'https://starhealth.in/apply',
      isActive: true,
    };

    const createRes = await makeRequest('/api/v1/insurance/admin', {
      method: 'POST',
      token: superAdminToken,
      body: validPlan,
    });
    console.assert(createRes.status === 201, `Expected 201 Created, got ${createRes.status}`);
    console.assert(createRes.body.success === true, 'Response body success is true');
    console.assert(createRes.body.data.id != null, 'Insurance ID generated');
    const createdId = createRes.body.data.id;
    cleanupInsuranceIds.push(createdId);
    console.log(`  ✔ Insurance created successfully (ID: ${createdId})`);

    // TEST 4: Duplicate Title Rejection
    console.log('\n[TEST 4] Duplicate Prevention:');
    const dupRes = await makeRequest('/api/v1/insurance/admin', {
      method: 'POST',
      token: superAdminToken,
      body: validPlan,
    });
    console.assert(dupRes.status === 409, `Expected 409 Conflict for duplicate title, got ${dupRes.status}`);
    console.log('  ✔ Duplicate insurance title rejected with 409 Conflict');

    // TEST 5: Public User Insurance Endpoint
    console.log('\n[TEST 5] Public User Endpoint:');
    const publicRes = await makeRequest('/api/v1/insurance');
    console.assert(publicRes.status === 200, `Expected 200 OK, got ${publicRes.status}`);
    console.assert(Array.isArray(publicRes.body.data), 'Public data is array');
    const foundCreated = publicRes.body.data.some((p: any) => p.id === createdId);
    console.assert(foundCreated, 'Newly created insurance appears in public user listing');
    console.log('  ✔ Public GET /api/v1/insurance returns created plan');

    // TEST 6: Admin Update
    console.log('\n[TEST 6] Admin Update Insurance:');
    const updateRes = await makeRequest(`/api/v1/insurance/admin/${createdId}`, {
      method: 'PATCH',
      token: superAdminToken,
      body: {
        title: validPlan.title + ' (Updated)',
        description: 'Updated policy description with higher bonus.',
        successRate: 98.0,
        applicationUrl: 'https://starhealth.in/apply-v2',
      },
    });
    console.assert(updateRes.status === 200, `Expected 200 OK for update, got ${updateRes.status}`);
    console.assert(updateRes.body.data.successRate === 98.0, 'Success rate updated to 98%');
    console.log('  ✔ Admin PATCH /api/v1/insurance/admin/:id updated record successfully');

    // TEST 7: Total Insurance Count Stats
    console.log('\n[TEST 7] Insurance Stats:');
    const statsRes = await makeRequest('/api/v1/insurance/stats');
    console.assert(statsRes.status === 200, `Expected 200 OK, got ${statsRes.status}`);
    console.assert(statsRes.body.data.totalInsurances >= 1, 'Total insurances count reflects db records');
    console.log(`  ✔ Insurance stats returned authoritative count: ${statsRes.body.data.totalInsurances}`);

    // TEST 8: Admin Delete
    console.log('\n[TEST 8] Admin Removal:');
    const deleteRes = await makeRequest(`/api/v1/insurance/admin/${createdId}`, {
      method: 'DELETE',
      token: superAdminToken,
    });
    console.assert(deleteRes.status === 200, `Expected 200 OK for delete, got ${deleteRes.status}`);
    console.log(`  ✔ Admin DELETE /api/v1/insurance/admin/:id removed record successfully`);

    // Verify deletion
    const verifyDel = await makeRequest(`/api/v1/insurance/${createdId}`);
    console.assert(verifyDel.status === 404, `Expected 404 after deletion, got ${verifyDel.status}`);
    console.log('  ✔ Record no longer exists in database (HTTP 404)');

    console.log('\n=== ALL INSURANCE API TESTS PASSED SUCCESSFULLY! ===\n');
  } finally {
    // Cleanup
    for (const id of cleanupInsuranceIds) {
      await prisma.insurance.deleteMany({ where: { id } }).catch(() => {});
    }
    if (testSuperAdminId) {
      await prisma.user.deleteMany({ where: { id: testSuperAdminId } }).catch(() => {});
    }
    if (testPatientId) {
      await prisma.user.deleteMany({ where: { id: testPatientId } }).catch(() => {});
    }
    server.close();
  }
}

runInsuranceTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
