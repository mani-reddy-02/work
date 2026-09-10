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
  console.log('--- STARTING REAL HOME NURSING WORKFLOW INTEGRATION TESTS ---');

  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      console.log(`Test server listening at ${baseUrl}`);
      resolve();
    });
  });

  let createdBookingId: string | null = null;
  let serviceId: string | null = null;
  let hospitalId: string | null = null;
  let nurseId: string | null = null;

  try {
    // 1. Ensure test users exist
    let user1 = await prisma.user.findFirst({
      where: { role: Role.PATIENT },
    });
    if (!user1) {
      user1 = await prisma.user.create({
        data: {
          email: `nursingpatient1_${Date.now()}@test.com`,
          name: 'Nursing Patient One',
          passwordHash: 'dummyhash',
          role: Role.PATIENT,
          phone: `988${Math.floor(1000000 + Math.random() * 9000000)}`,
        },
      });
    }

    let user2 = await prisma.user.findFirst({
      where: {
        role: Role.PATIENT,
        id: { not: user1.id },
      },
    });
    if (!user2) {
      user2 = await prisma.user.create({
        data: {
          email: `nursingpatient2_${Date.now()}@test.com`,
          name: 'Nursing Patient Two',
          passwordHash: 'dummyhash',
          role: Role.PATIENT,
          phone: `987${Math.floor(1000000 + Math.random() * 9000000)}`,
        },
      });
    }

    const token1 = jwt.sign(
      { userId: user1.id, email: user1.email, role: user1.role },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const token2 = jwt.sign(
      { userId: user2.id, email: user2.email, role: user2.role },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 2. Test GET /api/v1/home-nursing/services (public list)
    console.log('\n[Test 1] GET /api/v1/home-nursing/services');
    const res1 = await makeRequest('/api/v1/home-nursing/services');
    if (res1.status !== 200 || !res1.body.success || !Array.isArray(res1.body.data) || res1.body.data.length === 0) {
      throw new Error(`Failed to list nursing services: ${JSON.stringify(res1.body)}`);
    }
    console.log(`✓ Listed ${res1.body.data.length} nursing services successfully`);
    serviceId = res1.body.data[0].id;
    const serviceName = res1.body.data[0].name;

    // 3. Test GET /api/v1/home-nursing/services/categories
    console.log('\n[Test 2] GET /api/v1/home-nursing/services/categories');
    const res2 = await makeRequest('/api/v1/home-nursing/services/categories');
    if (res2.status !== 200 || !res2.body.success || !Array.isArray(res2.body.data) || !res2.body.data.includes('All Services')) {
      throw new Error(`Failed to list categories: ${JSON.stringify(res2.body)}`);
    }
    console.log(`✓ Categories fetched: ${res2.body.data.join(', ')}`);

    // 4. Test Search filter
    console.log(`\n[Test 3] GET /api/v1/home-nursing/services?search=${encodeURIComponent(serviceName.substring(0, 4))}`);
    const res3 = await makeRequest(`/api/v1/home-nursing/services?search=${encodeURIComponent(serviceName.substring(0, 4))}`);
    if (res3.status !== 200 || !res3.body.success || res3.body.data.length === 0) {
      throw new Error(`Failed search filter: ${JSON.stringify(res3.body)}`);
    }
    console.log(`✓ Search returned ${res3.body.data.length} match(es)`);

    // 5. Test GET /api/v1/home-nursing/services/:id/providers
    console.log(`\n[Test 4] GET /api/v1/home-nursing/services/${serviceId}/providers`);
    const res4 = await makeRequest(`/api/v1/home-nursing/services/${serviceId}/providers`);
    if (res4.status !== 200 || !res4.body.success || !Array.isArray(res4.body.data) || res4.body.data.length === 0) {
      throw new Error(`Failed to fetch providers: ${JSON.stringify(res4.body)}`);
    }
    console.log(`✓ Providers fetched for service: ${res4.body.data.length} hospital(s) offer this service`);
    hospitalId = res4.body.data[0].id;
    const offeringPrice = res4.body.data[0].numericPrice;

    // 6. Test GET /api/v1/home-nursing/hospitals/:id/nurses
    console.log(`\n[Test 5] GET /api/v1/home-nursing/hospitals/${hospitalId}/nurses`);
    const res5 = await makeRequest(`/api/v1/home-nursing/hospitals/${hospitalId}/nurses`);
    if (res5.status !== 200 || !res5.body.success) {
      throw new Error(`Failed to fetch nurses: ${JSON.stringify(res5.body)}`);
    }
    console.log(`✓ Hospital nurses fetched: ${res5.body.data.length} nurse(s) found`);
    if (res5.body.data.length > 0) {
      nurseId = res5.body.data[0].id;
    }

    // 7. Test GET /api/v1/home-nursing/services/:id/availability
    console.log(`\n[Test 6] GET /api/v1/home-nursing/services/${serviceId}/availability?hospitalId=${hospitalId}`);
    const res6 = await makeRequest(`/api/v1/home-nursing/services/${serviceId}/availability?hospitalId=${hospitalId}`);
    if (res6.status !== 200 || !res6.body.success || !Array.isArray(res6.body.data.slots) || res6.body.data.slots.length === 0) {
      throw new Error(`Failed to fetch availability: ${JSON.stringify(res6.body)}`);
    }
    const chosenSlot = res6.body.data.slots[0].slot;
    const serviceDate = res6.body.data.date;
    console.log(`✓ Availability verified: ${res6.body.data.slots.length} slots available. Target date: ${serviceDate}`);

    // 8. Test POST /api/v1/home-nursing/bookings without token (401 Unauthorized)
    console.log('\n[Test 7] POST /api/v1/home-nursing/bookings without auth (expect 401)');
    const res7 = await makeRequest('/api/v1/home-nursing/bookings', {
      method: 'POST',
      body: { serviceId, hospitalId, serviceDate, timeSlot: chosenSlot },
    });
    if (res7.status !== 401) {
      throw new Error(`Expected 401 Unauthorized, got ${res7.status}`);
    }
    console.log('✓ Correctly rejected unauthenticated booking request with 401');

    // 9. Test POST /api/v1/home-nursing/bookings with valid token (201 Created)
    console.log('\n[Test 8] POST /api/v1/home-nursing/bookings with auth (User 1)');
    const bookingPayload = {
      serviceId,
      hospitalId,
      nurseId: nurseId || undefined,
      patientName: 'Kavita Rao',
      patientPhone: '9876543210',
      patientEmail: 'kavita.rao@example.com',
      patientAge: 62,
      patientGender: 'Female',
      serviceDate,
      timeSlot: chosenSlot,
      address: 'Flat 402, Lotus Residency, Jubilee Hills',
      city: 'Hyderabad',
      pincode: '500033',
      notes: 'Please bring BP monitor and dressing kit',
      paymentMethod: 'CARD',
    };

    const res8 = await makeRequest('/api/v1/home-nursing/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
      body: bookingPayload,
    });
    if (res8.status !== 201 || !res8.body.success || !res8.body.data.bookingNumber) {
      throw new Error(`Failed to create home nursing booking: ${JSON.stringify(res8.body)}`);
    }
    createdBookingId = res8.body.data.id;
    console.log(`✓ Created home nursing booking: ${res8.body.data.bookingNumber}, Status: ${res8.body.data.status}, Amount: ₹${res8.body.data.totalAmount}`);

    // 10. Test Duplicate Booking / Slot Conflict (409 Conflict)
    console.log('\n[Test 9] POST duplicate booking on same slot (expect 409 Conflict)');
    const res9 = await makeRequest('/api/v1/home-nursing/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token2}` },
      body: bookingPayload,
    });
    if (res9.status !== 409) {
      throw new Error(`Expected 409 Conflict, got ${res9.status}: ${JSON.stringify(res9.body)}`);
    }
    console.log('✓ Successfully prevented slot double-booking with 409 Conflict');

    // 11. Test GET /api/v1/home-nursing/bookings/my (User 1 sees booking, User 2 sees 0)
    console.log('\n[Test 10] GET /api/v1/home-nursing/bookings/my (User Isolation)');
    const res10a = await makeRequest('/api/v1/home-nursing/bookings/my', {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const res10b = await makeRequest('/api/v1/home-nursing/bookings/my', {
      headers: { Authorization: `Bearer ${token2}` },
    });

    const user1Bookings = res10a.body.data || [];
    const user2Bookings = res10b.body.data || [];

    if (!user1Bookings.some((b: any) => b.id === createdBookingId)) {
      throw new Error('Created booking not found in User 1 bookings');
    }
    if (user2Bookings.some((b: any) => b.id === createdBookingId)) {
      throw new Error('Data leak: User 2 can see User 1 booking');
    }
    console.log(`✓ User isolation verified. User 1 has ${user1Bookings.length} booking(s); User 2 has ${user2Bookings.length}`);

    // 12. Test GET /api/v1/home-nursing/bookings/:id (Owner vs Cross-User 403)
    console.log('\n[Test 11] GET /api/v1/home-nursing/bookings/:id (Access Control)');
    const res11a = await makeRequest(`/api/v1/home-nursing/bookings/${createdBookingId}`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    if (res11a.status !== 200 || !res11a.body.success) {
      throw new Error(`Owner could not fetch booking details: ${JSON.stringify(res11a.body)}`);
    }

    const res11b = await makeRequest(`/api/v1/home-nursing/bookings/${createdBookingId}`, {
      headers: { Authorization: `Bearer ${token2}` },
    });
    if (res11b.status !== 403) {
      throw new Error(`Expected 403 Forbidden for cross-user view, got ${res11b.status}`);
    }
    console.log('✓ Access control verified: Owner got 200, unauthorized user got 403');

    // 13. Test PATCH /api/v1/home-nursing/bookings/:id/cancel
    console.log('\n[Test 12] PATCH /api/v1/home-nursing/bookings/:id/cancel');
    const res12a = await makeRequest(`/api/v1/home-nursing/bookings/${createdBookingId}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token2}` },
    });
    if (res12a.status !== 403) {
      throw new Error(`Expected 403 Forbidden when unauthorized user attempts cancellation, got ${res12a.status}`);
    }

    const res12b = await makeRequest(`/api/v1/home-nursing/bookings/${createdBookingId}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token1}` },
    });
    if (res12b.status !== 200 || res12b.body.data.status !== 'CANCELLED') {
      throw new Error(`Failed to cancel booking: ${JSON.stringify(res12b.body)}`);
    }
    console.log('✓ Booking cancelled successfully by owner, status updated to CANCELLED');

    console.log('\n======================================================');
    console.log('  ALL HOME NURSING WORKFLOW TESTS PASSED SUCCESSFULLY! ');
    console.log('======================================================\n');
  } finally {
    // Cleanup created booking if any
    if (createdBookingId) {
      try {
        await prisma.homeNursingBooking.delete({ where: { id: createdBookingId } });
      } catch (err) {
        // Ignored
      }
    }
    await prisma.$disconnect();
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  if (server) server.close();
  process.exit(1);
});
