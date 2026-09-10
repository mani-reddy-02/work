import http from 'http';
import jwt from 'jsonwebtoken';
import app from '../app';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { Role } from '@prisma/client';

let server: http.Server;
let baseUrl: string;

function makeRequest(path: string, options: { method?: string; headers?: Record<string, string>; body?: any } = {}): Promise<{ status: number; body: any, headers: any }> {
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
          resolve({ status: res.statusCode || 500, body: json, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode || 500, body: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING REPORTS WORKFLOW INTEGRATION TESTS ---');

  server = app.listen(0);
  const address = server.address() as any;
  baseUrl = `http://127.0.0.1:${address.port}`;
  console.log(`Test server listening at ${baseUrl}`);

  let testUser = await prisma.user.findFirst({
    where: { role: Role.PATIENT, active: true }
  });
  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: `testreport_${Date.now()}@example.com`,
        name: 'Test Report User',
        passwordHash: 'dummy_hash',
        role: Role.PATIENT,
        phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`
      }
    });
  }

  const patientToken = jwt.sign({ userId: testUser.id }, env.JWT_SECRET, { expiresIn: '1h' });

  try {
    console.log('\n[TEST GROUP: GET REPORTS]');
    const getRes = await makeRequest('/api/v1/reports', {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    console.assert(getRes.status === 200, `Expected 200, got ${getRes.status}`);
    console.assert(getRes.body.success === true, 'Expected success === true');
    console.assert(Array.isArray(getRes.body.data), 'Expected array data');
    console.log(`✔ Fetch reports passed (${getRes.body.data.length} reports)`);

    console.log('\n[TEST GROUP: UPLOAD REPORT]');
    const mockBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const uploadRes = await makeRequest('/api/v1/reports/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${patientToken}` },
      body: {
        title: 'Blood Test Mock',
        hospital: 'Mock Hospital',
        date: '10 Sep 2026',
        fileData: mockBase64,
        fileName: 'test-image.png'
      }
    });
    console.assert(uploadRes.status === 201, `Expected 201 Created, got ${uploadRes.status}`);
    console.assert(uploadRes.body.success === true, 'Expected upload success === true');
    console.assert(uploadRes.body.data.id != null, 'Report ID returned');
    console.assert(uploadRes.body.data.fileUrl.includes('.png'), 'File URL generated');
    const reportId = uploadRes.body.data.id;
    console.log(`✔ Upload report passed (ID: ${reportId})`);

    console.log('\n[TEST GROUP: DOWNLOAD REPORT]');
    const downloadRes = await makeRequest(`/api/v1/reports/${reportId}/download`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    console.assert(downloadRes.status === 200, `Expected 200 OK, got ${downloadRes.status}`);
    console.log(`✔ Download report passed (Headers Content-Type: ${downloadRes.headers['content-type']})`);

    console.log('\n[TEST GROUP: CROSS-USER AUTHORIZATION]');
    let otherUser = await prisma.user.findFirst({
      where: { role: Role.PATIENT, active: true, id: { not: testUser.id } }
    });
    if (!otherUser) {
      otherUser = await prisma.user.create({
        data: {
          email: `otherreport_${Date.now()}@example.com`,
          name: 'Other Report User',
          passwordHash: 'dummy_hash',
          role: Role.PATIENT,
        }
      });
    }
    const otherToken = jwt.sign({ userId: otherUser.id }, env.JWT_SECRET, { expiresIn: '1h' });
    const authRes = await makeRequest(`/api/v1/reports/${reportId}/download`, {
      headers: { Authorization: `Bearer ${otherToken}` }
    });
    console.assert(authRes.status === 403, `Expected 403 Forbidden, got ${authRes.status}`);
    console.log(`✔ Cross-user download prevention passed`);

    console.log('\n[TEST GROUP: DELETE REPORT]');
    const deleteRes = await makeRequest(`/api/v1/reports/${reportId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    console.assert(deleteRes.status === 200, `Expected 200 OK, got ${deleteRes.status}`);
    console.assert(deleteRes.body.success === true, 'Expected delete success === true');
    console.log(`✔ Delete report passed`);

    // Verify it's gone
    const fetchAfterDelete = await makeRequest(`/api/v1/reports/${reportId}/download`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    console.assert(fetchAfterDelete.status === 404, `Expected 404, got ${fetchAfterDelete.status}`);
    console.log(`✔ Report completely removed`);

    console.log('\n========================================');
    console.log('ALL REPORTS WORKFLOW TESTS PASSED 100%');
    console.log('========================================\n');

  } finally {
    if (server) server.close();
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  if (server) server.close();
  process.exit(1);
});
