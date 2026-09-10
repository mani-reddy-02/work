import http from 'http';
import app from '../app';
import { prisma } from '../config/prisma';

let server: http.Server;
let baseUrl: string;

function makeRequest(path: string, options: { method?: string; headers?: Record<string, string>; body?: any } = {}): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const postData = options.body ? JSON.stringify(options.body) : null;

    const req = http.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
        ...(options.headers || {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode || 500, body: json });
        } catch {
          resolve({ status: res.statusCode || 500, body: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING DISCOVERY INTEGRATION TESTS ---');

  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      console.log(`Test server listening at ${baseUrl}`);
      resolve();
    });
  });

  try {
    // 1. HOSPITALS
    console.log('\n[TEST GROUP: HOSPITALS]');
    const allHospitalsRes = await makeRequest('/api/v1/hospitals');
    if (allHospitalsRes.status !== 200 || !allHospitalsRes.body.success) {
      throw new Error(`GET /hospitals failed: status ${allHospitalsRes.status}`);
    }
    const hospitals = allHospitalsRes.body.data;
    console.log(`✔ GET /hospitals returned ${hospitals.length} hospitals`);

    if (hospitals.length === 0) {
      throw new Error('No hospitals found in database');
    }

    const testHosp = hospitals[0];

    // Hospital search
    const searchHospRes = await makeRequest(`/api/v1/hospitals?search=${encodeURIComponent(testHosp.name.substring(0, 3))}`);
    if (searchHospRes.status !== 200 || !searchHospRes.body.data.some((h: any) => h.id === testHosp.id)) {
      throw new Error(`Hospital search failed for query "${testHosp.name.substring(0, 3)}"`);
    }
    console.log(`✔ Hospital search by name works`);

    // Hospital details by ID
    const hospDetailRes = await makeRequest(`/api/v1/hospitals/${testHosp.id}`);
    if (hospDetailRes.status !== 200 || hospDetailRes.body.data.id !== testHosp.id) {
      throw new Error(`GET /hospitals/:id failed: ${JSON.stringify(hospDetailRes.body)}`);
    }
    console.log(`✔ Hospital details by ID works: ${hospDetailRes.body.data.name}`);

    // Hospital departments
    const hospDeptsRes = await makeRequest(`/api/v1/hospitals/${testHosp.id}/departments`);
    if (hospDeptsRes.status !== 200 || !Array.isArray(hospDeptsRes.body.data)) {
      throw new Error(`GET /hospitals/:id/departments failed: ${JSON.stringify(hospDeptsRes.body)}`);
    }
    console.log(`✔ Hospital departments returned ${hospDeptsRes.body.data.length} departments`);

    // Hospital doctors
    const hospDocsRes = await makeRequest(`/api/v1/hospitals/${testHosp.id}/doctors`);
    if (hospDocsRes.status !== 200 || !Array.isArray(hospDocsRes.body.data)) {
      throw new Error(`GET /hospitals/:id/doctors failed: ${JSON.stringify(hospDocsRes.body)}`);
    }
    console.log(`✔ Hospital doctors returned ${hospDocsRes.body.data.length} doctors`);

    // Invalid Hospital ID
    const invalidHospRes = await makeRequest('/api/v1/hospitals/00000000-0000-0000-0000-000000000000');
    if (invalidHospRes.status !== 404) {
      throw new Error(`Expected 404 for invalid hospital ID, got ${invalidHospRes.status}`);
    }
    console.log(`✔ Invalid hospital ID returns 404 cleanly`);

    // 2. DOCTORS
    console.log('\n[TEST GROUP: DOCTORS]');
    const allDocsRes = await makeRequest('/api/v1/doctors');
    if (allDocsRes.status !== 200 || !allDocsRes.body.success) {
      throw new Error(`GET /doctors failed: status ${allDocsRes.status}`);
    }
    const doctors = allDocsRes.body.data;
    console.log(`✔ GET /doctors returned ${doctors.length} doctors`);

    if (doctors.length > 0) {
      const testDoc = doctors[0];
      // Doctor search
      const docSearchRes = await makeRequest(`/api/v1/doctors?search=${encodeURIComponent(testDoc.name.substring(0, 3))}`);
      if (docSearchRes.status !== 200 || !docSearchRes.body.data.some((d: any) => d.id === testDoc.id)) {
        throw new Error(`Doctor search failed for query "${testDoc.name.substring(0, 3)}"`);
      }
      console.log(`✔ Doctor search by partial name works`);

      // Filter doctors by hospitalId
      if (testDoc.hospitalId) {
        const docHospFilterRes = await makeRequest(`/api/v1/doctors?hospitalId=${testDoc.hospitalId}`);
        if (docHospFilterRes.status !== 200 || !docHospFilterRes.body.data.every((d: any) => d.hospitalId === testDoc.hospitalId)) {
          throw new Error('Doctor filter by hospitalId returned mismatched doctors');
        }
        console.log(`✔ Doctor filter by hospitalId works`);
      }

      // Doctor details by ID
      const docDetailRes = await makeRequest(`/api/v1/doctors/${testDoc.id}`);
      if (docDetailRes.status !== 200 || docDetailRes.body.data.id !== testDoc.id) {
        throw new Error(`GET /doctors/:id failed: ${JSON.stringify(docDetailRes.body)}`);
      }
      console.log(`✔ Doctor details by ID works: ${docDetailRes.body.data.name}`);

      // Doctor availability
      const docAvailRes = await makeRequest(`/api/v1/doctors/${testDoc.id}/availability?date=2026-11-01`);
      if (docAvailRes.status !== 200 || !Array.isArray(docAvailRes.body.data.availableSlots)) {
        throw new Error(`GET /doctors/:id/availability failed`);
      }
      console.log(`✔ Doctor availability returned ${docAvailRes.body.data.availableSlots.length} available slots`);
    }

    // Invalid Doctor ID
    const invalidDocRes = await makeRequest('/api/v1/doctors/00000000-0000-0000-0000-000000000000');
    if (invalidDocRes.status !== 404) {
      throw new Error(`Expected 404 for invalid doctor ID, got ${invalidDocRes.status}`);
    }
    console.log(`✔ Invalid doctor ID returns 404 cleanly`);

    // 3. DEPARTMENTS
    console.log('\n[TEST GROUP: DEPARTMENTS]');
    const allDeptsRes = await makeRequest('/api/v1/departments');
    if (allDeptsRes.status !== 200 || !allDeptsRes.body.success) {
      throw new Error(`GET /departments failed: status ${allDeptsRes.status}`);
    }
    const departments = allDeptsRes.body.data;
    console.log(`✔ GET /departments returned ${departments.length} departments without requiring login`);

    if (departments.length > 0) {
      const testDept = departments[0];

      // Department details by ID
      const deptDetailRes = await makeRequest(`/api/v1/departments/${testDept.id}`);
      if (deptDetailRes.status !== 200 || deptDetailRes.body.data.id !== testDept.id) {
        throw new Error(`GET /departments/:id failed`);
      }
      console.log(`✔ Department details by ID works: ${deptDetailRes.body.data.name}`);

      // Department doctors
      const deptDocsRes = await makeRequest(`/api/v1/departments/${testDept.id}/doctors`);
      if (deptDocsRes.status !== 200 || !Array.isArray(deptDocsRes.body.data)) {
        throw new Error(`GET /departments/:id/doctors failed`);
      }
      console.log(`✔ Department doctors returned ${deptDocsRes.body.data.length} doctors`);
    }

    // Invalid Department ID
    const invalidDeptRes = await makeRequest('/api/v1/departments/00000000-0000-0000-0000-000000000000');
    if (invalidDeptRes.status !== 404) {
      throw new Error(`Expected 404 for invalid department ID, got ${invalidDeptRes.status}`);
    }
    console.log(`✔ Invalid department ID returns 404 cleanly`);

    // 4. LABORATORIES
    console.log('\n[TEST GROUP: LABORATORIES]');
    const allLabsRes = await makeRequest('/api/v1/laboratories');
    if (allLabsRes.status !== 200 || !allLabsRes.body.success) {
      throw new Error(`GET /laboratories failed: status ${allLabsRes.status}`);
    }
    const labs = allLabsRes.body.data;
    console.log(`✔ GET /laboratories returned ${labs.length} laboratories`);

    if (labs.length > 0) {
      const testLab = labs[0];

      // Lab search
      const labSearchRes = await makeRequest(`/api/v1/laboratories?search=${encodeURIComponent(testLab.name.substring(0, 3))}`);
      if (labSearchRes.status !== 200 || !labSearchRes.body.data.some((l: any) => l.id === testLab.id)) {
        throw new Error(`Lab search failed for query "${testLab.name.substring(0, 3)}"`);
      }
      console.log(`✔ Laboratory search works`);

      // Lab details by ID
      const labDetailRes = await makeRequest(`/api/v1/laboratories/${testLab.id}`);
      if (labDetailRes.status !== 200 || labDetailRes.body.data.id !== testLab.id) {
        throw new Error(`GET /laboratories/:id failed`);
      }
      console.log(`✔ Laboratory details by ID works: ${labDetailRes.body.data.name}`);
    }

    // Invalid Lab ID
    const invalidLabRes = await makeRequest('/api/v1/laboratories/00000000-0000-0000-0000-000000000000');
    if (invalidLabRes.status !== 404) {
      throw new Error(`Expected 404 for invalid lab ID, got ${invalidLabRes.status}`);
    }
    console.log(`✔ Invalid laboratory ID returns 404 cleanly`);

    console.log('\n========================================');
    console.log('ALL DISCOVERY INTEGRATION TESTS PASSED 100%');
    console.log('========================================');
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  if (server) server.close();
  prisma.$disconnect();
  process.exit(1);
});
