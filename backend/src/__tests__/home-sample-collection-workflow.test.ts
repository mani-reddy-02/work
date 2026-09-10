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
  console.log('--- STARTING HOME SAMPLE COLLECTION WORKFLOW INTEGRATION TESTS ---');

  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      console.log(`Test server listening at ${baseUrl}`);
      resolve();
    });
  });

  let createdBookingId: string | null = null;
  let testId: string | null = null;
  let laboratoryId: string | null = null;

  try {
    // 1. Ensure test users exist
    let user1 = await prisma.user.findFirst({
      where: { role: Role.PATIENT, active: true },
    });
    if (!user1) {
      user1 = await prisma.user.create({
        data: {
          email: `homesample.patient1_${Date.now()}@example.com`,
          name: 'Home Sample User One',
          role: Role.PATIENT,
          phone: '9876543210',
          gender: 'MALE',
          passwordHash: 'dummy_password_hash',
          active: true,
        },
      });
    }

    let user2 = await prisma.user.findFirst({
      where: { id: { not: user1.id }, role: Role.PATIENT, active: true },
    });
    if (!user2) {
      user2 = await prisma.user.create({
        data: {
          email: `homesample.patient2_${Date.now()}@example.com`,
          name: 'Home Sample User Two',
          role: Role.PATIENT,
          phone: '9876543211',
          gender: 'FEMALE',
          passwordHash: 'dummy_password_hash',
          active: true,
        },
      });
    }

    const token1 = jwt.sign(
      { userId: user1.id, role: user1.role, email: user1.email },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const token2 = jwt.sign(
      { userId: user2.id, role: user2.role, email: user2.email },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 2. Test 1: GET /api/v1/home-sample-collection/tests (Should return tests eligible for home collection)
    console.log('\nTest 1: Discover home sample collection tests');
    const testsRes = await makeRequest('/api/v1/home-sample-collection/tests');
    if (testsRes.status !== 200 || !testsRes.body.success || !Array.isArray(testsRes.body.data)) {
      throw new Error(`Expected 200 with test array, got ${testsRes.status}: ${JSON.stringify(testsRes.body)}`);
    }
    console.log(`✓ Retrieved ${testsRes.body.data.length} home collection tests.`);
    if (testsRes.body.data.length > 0) {
      testId = testsRes.body.data[0].id;
      console.log(`  Using test: "${testsRes.body.data[0].name}" (${testId})`);
    } else {
      throw new Error('No tests found in database for home collection test suite');
    }

    // 3. Test 2: Search tests by name/category
    console.log('\nTest 2: Search home collection tests');
    const searchRes = await makeRequest('/api/v1/home-sample-collection/tests?search=blood');
    if (searchRes.status !== 200 || !searchRes.body.success) {
      throw new Error(`Search failed: ${JSON.stringify(searchRes.body)}`);
    }
    console.log(`✓ Search for "blood" returned ${searchRes.body.data.length} tests`);

    // 4. Test 3: Get eligible laboratories for test
    console.log(`\nTest 3: Get laboratories offering home collection for test ${testId}`);
    const labsRes = await makeRequest(`/api/v1/home-sample-collection/tests/${testId}/laboratories`);
    if (labsRes.status !== 200 || !labsRes.body.success || !Array.isArray(labsRes.body.data)) {
      throw new Error(`Expected 200 with lab offerings, got ${labsRes.status}: ${JSON.stringify(labsRes.body)}`);
    }
    if (labsRes.body.data.length === 0) {
      throw new Error(`No laboratories offering home collection found for test ${testId}`);
    }
    laboratoryId = labsRes.body.data[0].id;
    console.log(`✓ Found ${labsRes.body.data.length} lab(s). Selected lab: "${labsRes.body.data[0].name}" (${laboratoryId})`);
    console.log(`  Price: ${labsRes.body.data[0].price}, Home collection fee: ₹${labsRes.body.data[0].homeCollectionFee}`);

    // 5. Test 4: Get laboratory availability slots
    console.log(`\nTest 4: Get collection slot availability for lab ${laboratoryId}`);
    const availRes = await makeRequest(`/api/v1/home-sample-collection/laboratories/${laboratoryId}/availability`);
    if (availRes.status !== 200 || !availRes.body.success || !availRes.body.data.slots) {
      throw new Error(`Expected 200 with availability slots, got: ${JSON.stringify(availRes.body)}`);
    }
    const targetDate = availRes.body.data.availableDates[1]?.date || availRes.body.data.selectedDate;
    const availableSlot = availRes.body.data.slots.find((s: any) => s.available)?.slot || '10:00 AM';
    console.log(`✓ Found availability: ${availRes.body.data.slots.length} slots for ${targetDate}. Chosen: ${availableSlot}`);

    // 6. Test 5: Reject unauthenticated booking (401)
    console.log('\nTest 5: Reject unauthenticated booking attempt');
    const unauthRes = await makeRequest('/api/v1/home-sample-collection/bookings', {
      method: 'POST',
      body: {
        testId,
        laboratoryId,
        bookingDate: targetDate,
        timeSlot: availableSlot,
        collectionAddress: '123 Test Street, Whitefield, Bangalore',
      },
    });
    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401 Unauthorized, got ${unauthRes.status}`);
    }
    console.log('✓ Unauthenticated booking rejected with 401.');

    // 7. Test 6: Reject Home Sample Collection without address (400)
    console.log('\nTest 6: Reject Home Sample Collection without collection address');
    const noAddrRes = await makeRequest('/api/v1/home-sample-collection/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
      body: {
        testId,
        laboratoryId,
        bookingDate: targetDate,
        timeSlot: availableSlot,
        collectionAddress: '',
      },
    });
    if (noAddrRes.status !== 400) {
      throw new Error(`Expected 400 Bad Request for missing address, got ${noAddrRes.status}`);
    }
    console.log('✓ Missing collectionAddress rejected with 400.');

    // 8. Test 7: Successfully create Home Sample Collection booking (201)
    console.log('\nTest 7: Create real Home Sample Collection booking');
    const bookingRes = await makeRequest('/api/v1/home-sample-collection/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
      body: {
        testId,
        laboratoryId,
        bookingDate: targetDate,
        timeSlot: availableSlot,
        patientName: 'John Doe',
        patientAge: 32,
        patientGender: 'Male',
        patientPhone: '9876543210',
        patientEmail: 'johndoe@example.com',
        collectionAddress: 'Flat 402, Sunshine Heights, Koramangala, Bangalore - 560034',
        notes: 'Please ring bell twice.',
      },
    });

    if (bookingRes.status !== 201 || !bookingRes.body.success) {
      throw new Error(`Expected 201 Created, got ${bookingRes.status}: ${JSON.stringify(bookingRes.body)}`);
    }

    const bookingData = bookingRes.body.data;
    createdBookingId = bookingData.id;
    console.log(`✓ Real Home Sample Booking created successfully!`);
    console.log(`  Booking ID: ${bookingData.bookingNumber}`);
    console.log(`  Collection Type: ${bookingData.collectionType}`);
    console.log(`  Collection Address: ${bookingData.collectionAddress}`);
    console.log(`  Total Amount: ${bookingData.amount} (Test: ₹${bookingData.testPrice} + Fee: ₹${bookingData.collectionFee})`);
    console.log(`  Status: ${bookingData.status} | Payment: ${bookingData.paymentStatus}`);

    if (bookingData.collectionType !== 'HOME_COLLECTION') {
      throw new Error(`Expected collectionType HOME_COLLECTION, got ${bookingData.collectionType}`);
    }

    // 9. Test 8: Prevent slot double-booking (409 Conflict)
    console.log('\nTest 8: Prevent slot double-booking (Conflict detection)');
    const conflictRes = await makeRequest('/api/v1/home-sample-collection/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token2}` },
      body: {
        testId,
        laboratoryId,
        bookingDate: targetDate,
        timeSlot: availableSlot,
        patientName: 'Jane Smith',
        patientPhone: '9876543211',
        collectionAddress: 'Another Address, Indiranagar, Bangalore',
      },
    });
    if (conflictRes.status !== 409) {
      throw new Error(`Expected 409 Conflict for already booked slot, got ${conflictRes.status}: ${JSON.stringify(conflictRes.body)}`);
    }
    console.log('✓ Slot double-booking rejected with 409 Conflict.');

    // 10. Test 9: Get user's home sample bookings
    console.log('\nTest 9: Retrieve authenticated user bookings via /bookings/my');
    const myBookingsRes = await makeRequest('/api/v1/home-sample-collection/bookings/my', {
      headers: { Authorization: `Bearer ${token1}` },
    });
    if (myBookingsRes.status !== 200 || !myBookingsRes.body.success || !Array.isArray(myBookingsRes.body.data)) {
      throw new Error(`Expected 200 with user bookings array, got: ${JSON.stringify(myBookingsRes.body)}`);
    }
    const found = myBookingsRes.body.data.find((b: any) => b.id === createdBookingId);
    if (!found) {
      throw new Error(`Created booking ${createdBookingId} was not returned in user's bookings list`);
    }
    console.log(`✓ User has ${myBookingsRes.body.data.length} home collection booking(s). Created booking verified.`);

    // 11. Test 10: Cross-user booking access isolation (403 Forbidden)
    console.log('\nTest 10: Prevent cross-user access to booking details');
    const crossRes = await makeRequest(`/api/v1/home-sample-collection/bookings/${createdBookingId}`, {
      headers: { Authorization: `Bearer ${token2}` },
    });
    if (crossRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for unauthorized user viewing booking, got ${crossRes.status}`);
    }
    console.log('✓ Cross-user booking access denied with 403 Forbidden.');

    // 12. Test 11: Owner viewing single booking details (200)
    console.log('\nTest 11: Owner views single booking details');
    const detailRes = await makeRequest(`/api/v1/home-sample-collection/bookings/${createdBookingId}`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    if (detailRes.status !== 200 || !detailRes.body.success) {
      throw new Error(`Expected 200 for owner viewing booking, got ${detailRes.status}: ${JSON.stringify(detailRes.body)}`);
    }
    console.log(`✓ Booking details retrieved successfully for booking number: ${detailRes.body.data.bookingNumber}`);

    // 13. Test 12: Cancel booking
    console.log('\nTest 12: Cancel home sample booking');
    const cancelRes = await makeRequest(`/api/v1/home-sample-collection/bookings/${createdBookingId}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token1}` },
    });
    if (cancelRes.status !== 200 || !cancelRes.body.success || cancelRes.body.data.status !== 'CANCELLED') {
      throw new Error(`Expected 200 with status CANCELLED, got ${cancelRes.status}: ${JSON.stringify(cancelRes.body)}`);
    }
    console.log(`✓ Booking cancelled successfully. Status: ${cancelRes.body.data.status}, PaymentStatus: ${cancelRes.body.data.paymentStatus}`);

    // 14. Test 13: Reject cancelling an already cancelled booking (400)
    console.log('\nTest 13: Reject cancelling already cancelled booking');
    const repeatCancelRes = await makeRequest(`/api/v1/home-sample-collection/bookings/${createdBookingId}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token1}` },
    });
    if (repeatCancelRes.status !== 400) {
      throw new Error(`Expected 400 Bad Request when cancelling already cancelled booking, got ${repeatCancelRes.status}`);
    }
    console.log('✓ Repeat cancellation rejected with 400 Bad Request.');

    console.log('\n============================================================');
    console.log('ALL HOME SAMPLE COLLECTION BACKEND INTEGRATION TESTS PASSED!');
    console.log('============================================================\n');
  } finally {
    // Clean up created test booking
    if (createdBookingId) {
      await prisma.labBooking.deleteMany({
        where: { id: createdBookingId },
      });
    }
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

runTests().catch((err) => {
  console.error('Integration test failed with error:', err);
  process.exit(1);
});
