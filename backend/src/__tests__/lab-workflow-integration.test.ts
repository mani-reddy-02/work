import http from 'http';
import app from '../app';
import { prisma } from '../config/prisma';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Role } from '@prisma/client';

let server: http.Server;
let baseUrl: string;

function makeRequest(
  path: string,
  options: { method?: string; headers?: Record<string, string>; body?: any } = {}
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
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

async function runTests() {
  console.log('--- STARTING REAL LAB TEST WORKFLOW INTEGRATION TESTS ---');

  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      console.log(`Test server listening at ${baseUrl}`);
      resolve();
    });
  });

  let createdBookingId: string | null = null;

  try {
    // 1. Ensure test users exist
    let user1 = await prisma.user.findFirst({
      where: { role: Role.PATIENT },
    });
    if (!user1) {
      user1 = await prisma.user.create({
        data: {
          email: `labpatient1_${Date.now()}@test.com`,
          name: 'Lab Patient One',
          passwordHash: 'dummyhash',
          role: Role.PATIENT,
          phone: `999${Math.floor(1000000 + Math.random() * 9000000)}`,
        },
      });
    }

    let user2 = await prisma.user.findFirst({
      where: { id: { not: user1.id }, role: Role.PATIENT },
    });
    if (!user2) {
      user2 = await prisma.user.create({
        data: {
          email: `labpatient2_${Date.now()}@test.com`,
          name: 'Lab Patient Two',
          passwordHash: 'dummyhash',
          role: Role.PATIENT,
          phone: `998${Math.floor(1000000 + Math.random() * 9000000)}`,
        },
      });
    }

    const token1 = jwt.sign(
      { userId: user1.id, id: user1.id, email: user1.email, role: user1.role, hospitalId: user1.hospitalId },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const token2 = jwt.sign(
      { userId: user2.id, id: user2.id, email: user2.email, role: user2.role, hospitalId: user2.hospitalId },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 2. Fetch sample test and offering
    const labTest = await prisma.labTest.findFirst({
      where: { active: true },
      include: { offerings: true },
    });
    if (!labTest || labTest.offerings.length === 0) {
      throw new Error('No active lab tests with offerings found in database');
    }

    const laboratory = await prisma.hospital.findUnique({
      where: { id: labTest.offerings[0].laboratoryId },
    });
    if (!laboratory) {
      throw new Error('Offering laboratory not found in database');
    }

    // ----------------------------------------------------
    // TEST GROUP 1: LAB TESTS & CATEGORIES
    // ----------------------------------------------------
    console.log('\n[TEST GROUP: LAB TESTS & CATEGORIES]');
    const allTestsRes = await makeRequest('/api/v1/lab-tests');
    if (allTestsRes.status !== 200 || !allTestsRes.body.success) {
      throw new Error(`GET /lab-tests failed: status ${allTestsRes.status}`);
    }
    console.log(`✔ GET /lab-tests returned ${allTestsRes.body.data.length} tests from database`);

    // Case-insensitive search
    const searchRes = await makeRequest('/api/v1/lab-tests?search=BLOOD');
    if (searchRes.status !== 200 || searchRes.body.data.length === 0) {
      throw new Error('Case-insensitive search for "BLOOD" returned no tests');
    }
    console.log(`✔ GET /lab-tests?search=BLOOD returned ${searchRes.body.data.length} matches`);

    // Categories
    const catRes = await makeRequest('/api/v1/lab-tests/categories');
    if (catRes.status !== 200 || !catRes.body.data.includes('All Tests')) {
      throw new Error('GET /lab-tests/categories failed');
    }
    console.log(`✔ GET /lab-tests/categories returned: ${catRes.body.data.join(', ')}`);

    // Individual test details
    const testDetailRes = await makeRequest(`/api/v1/lab-tests/${labTest.id}`);
    if (testDetailRes.status !== 200 || testDetailRes.body.data.id !== labTest.id) {
      throw new Error(`GET /lab-tests/${labTest.id} failed`);
    }
    console.log(`✔ GET /lab-tests/:id returned test "${testDetailRes.body.data.name}" with ${testDetailRes.body.data.laboratories.length} offering laboratories`);

    // Laboratories offering this test
    const labsForTestRes = await makeRequest(`/api/v1/lab-tests/${labTest.id}/laboratories`);
    if (labsForTestRes.status !== 200 || labsForTestRes.body.data.length === 0) {
      throw new Error('GET /lab-tests/:id/laboratories failed');
    }
    console.log(`✔ GET /lab-tests/:id/laboratories returned ${labsForTestRes.body.data.length} valid laboratories`);

    // ----------------------------------------------------
    // TEST GROUP 2: LABORATORIES & AVAILABILITY
    // ----------------------------------------------------
    console.log('\n[TEST GROUP: LABORATORIES & AVAILABILITY]');
    const labsRes = await makeRequest('/api/v1/laboratories');
    if (labsRes.status !== 200 || labsRes.body.data.length === 0) {
      throw new Error('GET /laboratories failed');
    }
    console.log(`✔ GET /laboratories returned ${labsRes.body.data.length} laboratories`);

    const labTestsRes = await makeRequest(`/api/v1/laboratories/${laboratory.id}/tests`);
    if (labTestsRes.status !== 200 || labTestsRes.body.data.length === 0) {
      throw new Error(`GET /laboratories/${laboratory.id}/tests failed`);
    }
    console.log(`✔ GET /laboratories/:id/tests returned ${labTestsRes.body.data.length} tests for ${laboratory.name}`);

    const availRes = await makeRequest(`/api/v1/laboratories/${laboratory.id}/availability`);
    if (availRes.status !== 200 || !availRes.body.data.slots || availRes.body.data.slots.length === 0) {
      throw new Error('GET /laboratories/:id/availability failed');
    }
    console.log(`✔ GET /laboratories/:id/availability returned ${availRes.body.data.slots.length} available slots`);

    // ----------------------------------------------------
    // TEST GROUP 3: LAB BOOKINGS & SECURITY
    // ----------------------------------------------------
    console.log('\n[TEST GROUP: LAB BOOKINGS & SECURITY]');
    // 1. Unauthenticated rejection
    const unauthRes = await makeRequest('/api/v1/lab-bookings', {
      method: 'POST',
      body: {
        testId: labTest.id,
        laboratoryId: laboratory.id,
        bookingDate: '2026-09-25',
        timeSlot: '09:00 AM',
      },
    });
    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated booking, got ${unauthRes.status}`);
    }
    console.log('✔ Unauthenticated POST /lab-bookings correctly rejected with 401');

    // 2. Successful booking creation
    const slotTime = `09:${Math.floor(10 + Math.random() * 49)} AM`;
    const bookRes = await makeRequest('/api/v1/lab-bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
      body: {
        testId: labTest.id,
        laboratoryId: laboratory.id,
        bookingDate: '2026-09-28',
        timeSlot: slotTime,
        collectionType: 'LAB_VISIT',
        patientName: 'Lab Patient One',
        patientAge: 30,
        patientGender: 'Male',
        patientPhone: '9876543210',
      },
    });

    if (bookRes.status !== 201 || !bookRes.body.success) {
      throw new Error(`POST /lab-bookings failed: status ${bookRes.status}, error: ${JSON.stringify(bookRes.body)}`);
    }
    createdBookingId = bookRes.body.data.id;
    console.log(`✔ Lab booking created in PostgreSQL (ID: ${createdBookingId}, Number: ${bookRes.body.data.bookingNumber}, Amount: ${bookRes.body.data.amount})`);

    // 3. Double-booking conflict detection
    const conflictRes = await makeRequest('/api/v1/lab-bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token2}` },
      body: {
        testId: labTest.id,
        laboratoryId: laboratory.id,
        bookingDate: '2026-09-28',
        timeSlot: slotTime,
        collectionType: 'LAB_VISIT',
        patientName: 'Patient Two',
        patientPhone: '9988776655',
      },
    });
    if (conflictRes.status !== 409) {
      throw new Error(`Expected 409 Conflict for duplicate slot, got ${conflictRes.status}`);
    }
    console.log('✔ Duplicate slot booking correctly rejected with 409 Conflict');

    // 4. GET /lab-bookings/my ownership isolation
    const myBookings1 = await makeRequest('/api/v1/lab-bookings/my', {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const found1 = myBookings1.body.data.some((b: any) => b.id === createdBookingId);
    if (!found1) {
      throw new Error('Created booking not returned in user1 GET /lab-bookings/my');
    }

    const myBookings2 = await makeRequest('/api/v1/lab-bookings/my', {
      headers: { Authorization: `Bearer ${token2}` },
    });
    const found2 = myBookings2.body.data.some((b: any) => b.id === createdBookingId);
    if (found2) {
      throw new Error('User2 was able to see User1 booking in GET /my!');
    }
    console.log('✔ GET /lab-bookings/my strictly enforces verified JWT user ownership');

    // 5. GET /lab-bookings/:id authorized vs unauthorized
    const ownerDetails = await makeRequest(`/api/v1/lab-bookings/${createdBookingId}`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    if (ownerDetails.status !== 200 || ownerDetails.body.data.id !== createdBookingId) {
      throw new Error(`Owner could not access their booking details: status ${ownerDetails.status}`);
    }

    const intruderDetails = await makeRequest(`/api/v1/lab-bookings/${createdBookingId}`, {
      headers: { Authorization: `Bearer ${token2}` },
    });
    if (intruderDetails.status !== 403) {
      throw new Error(`Expected 403 Forbidden for cross-user booking access, got ${intruderDetails.status}`);
    }
    console.log('✔ GET /lab-bookings/:id correctly allows owner and returns 403 Forbidden for cross-user access');

    console.log('\n=============================================');
    console.log('ALL LAB WORKFLOW INTEGRATION TESTS PASSED 100%');
    console.log('=============================================\n');
  } finally {
    if (createdBookingId) {
      await prisma.labBooking.deleteMany({
        where: { id: createdBookingId },
      });
      console.log('✔ Test booking cleaned up from database');
    }
    server.close();
    await prisma.$disconnect();
  }
}

runTests().catch((e) => {
  console.error('Test suite failed:', e);
  process.exit(1);
});
