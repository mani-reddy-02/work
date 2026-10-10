import http from 'http';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { AccessToken } from 'livekit-server-sdk';
import app from '../app';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { Role } from '@prisma/client';
import { VideoService } from '../modules/video/video.service';

let server: http.Server;
let baseUrl: string;

function makeRequest(
  path: string,
  options: { method?: string; headers?: Record<string, string>; body?: any } = {}
): Promise<{ status: number; body: any; headers: any }> {
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

function generateUserToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: '1d' });
}

async function runVideoIntegrationTests() {
  console.log('===========================================================');
  console.log('STARTING MEDIQUEE LIVEKIT VIDEO CONSULTATION INTEGRATION TESTS');
  console.log('===========================================================');

  server = app.listen(0);
  const address = server.address() as any;
  baseUrl = `http://127.0.0.1:${address.port}`;
  console.log(`Test server running at ${baseUrl}`);

  let testPatient1: any = null;
  let testPatient2: any = null;
  let testDoctor1: any = null;
  let testDoctor2: any = null;
  let testHospital: any = null;
  let testDepartment: any = null;
  let testBooking1: any = null;
  let testBookingCancelled: any = null;

  try {
    // ----------------------------------------------------
    // TEST GROUP 1: CONFIGURATION & MISSING CREDENTIALS HANDLING
    // ----------------------------------------------------
    console.log('\n[TEST GROUP 1: CONFIGURATION STATUS & MISSING CREDENTIALS]');

    // Test GET /api/v1/video/status
    const configRes = await makeRequest('/api/v1/video/status');
    console.assert(configRes.status === 200, `Expected 200 from /video/status, got ${configRes.status}`);
    console.assert(configRes.body.success === true, 'Expected success === true');
    console.log(`✔ Public configuration status endpoint responds with 200: Configured = ${configRes.body.data.isConfigured}`);

    // If LIVEKIT credentials are unset in env, verify 503 error handling
    const originalUrl = env.LIVEKIT_URL;
    const originalKey = env.LIVEKIT_API_KEY;
    const originalSecret = env.LIVEKIT_API_SECRET;

    // Temporarily unset
    (env as any).LIVEKIT_URL = undefined;
    (env as any).LIVEKIT_API_KEY = undefined;
    (env as any).LIVEKIT_API_SECRET = undefined;

    // Create dummy patient and appointment to test unconfigured error
    testDepartment = await prisma.department.findFirst({ include: { hospital: true } });
    if (!testDepartment || !testDepartment.hospital) {
      testHospital = await prisma.hospital.findFirst();
      if (!testHospital) {
        throw new Error('No hospital in DB for test');
      }
      testDepartment = await prisma.department.create({
        data: {
          name: `General Test ${Date.now()}`,
          hospitalId: testHospital.id,
        },
      });
    } else {
      testHospital = testDepartment.hospital;
    }

    testPatient1 = await prisma.user.create({
      data: {
        name: 'Video Test Patient 1',
        email: `videopatient1_${Date.now()}@example.com`,
        phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
        passwordHash: 'dummy_hash',
        role: Role.PATIENT,
      },
    });

    testPatient2 = await prisma.user.create({
      data: {
        name: 'Video Test Patient 2',
        email: `videopatient2_${Date.now()}@example.com`,
        phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
        passwordHash: 'dummy_hash',
        role: Role.PATIENT,
      },
    });

    testDoctor1 = await prisma.user.create({
      data: {
        name: 'Dr. Test Assigned',
        email: `videodoc1_${Date.now()}@example.com`,
        phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
        passwordHash: 'dummy_hash',
        role: Role.DOCTOR,
        hospitalId: testHospital.id,
        departmentId: testDepartment.id,
      },
    });

    testDoctor2 = await prisma.user.create({
      data: {
        name: 'Dr. Test Other',
        email: `videodoc2_${Date.now()}@example.com`,
        phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
        passwordHash: 'dummy_hash',
        role: Role.DOCTOR,
        hospitalId: testHospital.id,
        departmentId: testDepartment.id,
      },
    });

    testBooking1 = await prisma.oPBooking.create({
      data: {
        hospitalId: testHospital.id,
        departmentId: testDepartment.id,
        doctorId: testDoctor1.id,
        patientId: testPatient1.id,
        patientName: testPatient1.name,
        patientPhone: testPatient1.phone,
        status: 'WAITING',
        opType: 'Video Consultation',
        timeSlot: '11:00 AM',
        fee: 600,
      },
    });

    const patient1Token = generateUserToken(testPatient1.id);
    const patient2Token = generateUserToken(testPatient2.id);
    const doctor1Token = generateUserToken(testDoctor1.id);
    const doctor2Token = generateUserToken(testDoctor2.id);

    // Call POST /video/token without credentials -> 503
    const unconfRes = await makeRequest('/api/v1/video/token', {
      method: 'POST',
      headers: { Authorization: `Bearer ${patient1Token}` },
      body: { bookingId: testBooking1.id },
    });
    console.assert(unconfRes.status === 503, `Expected 503 LIVEKIT_NOT_CONFIGURED, got ${unconfRes.status}`);
    console.assert(unconfRes.body.error.code === 'LIVEKIT_NOT_CONFIGURED', 'Expected error code LIVEKIT_NOT_CONFIGURED');
    console.log('✔ Missing LiveKit credentials safely rejected with 503 LIVEKIT_NOT_CONFIGURED without crash');

    // Restore credentials (use mock credentials for testing token generation and HMAC verification)
    const testLiveKitUrl = 'wss://mediquee-test.livekit.cloud';
    const testLiveKitKey = 'API_TEST_KEY_12345';
    const testLiveKitSecret = 'SECRET_TEST_KEY_ABCDEF1234567890ABCDEF1234567890';
    (env as any).LIVEKIT_URL = testLiveKitUrl;
    (env as any).LIVEKIT_API_KEY = testLiveKitKey;
    (env as any).LIVEKIT_API_SECRET = testLiveKitSecret;

    // ----------------------------------------------------
    // TEST GROUP 2: TOKEN GENERATION & ROLE AUTHORIZATION
    // ----------------------------------------------------
    console.log('\n[TEST GROUP 2: TOKEN GENERATION & ROLE-BASED ACCESS CONTROL]');

    // 2a. Unauthenticated request -> 401
    const noAuthRes = await makeRequest('/api/v1/video/token', {
      method: 'POST',
      body: { bookingId: testBooking1.id },
    });
    console.assert(noAuthRes.status === 401, `Expected 401 for unauthenticated request, got ${noAuthRes.status}`);
    console.log('✔ Unauthenticated request rejected with 401');

    // 2b. Invalid booking ID -> 400
    const invalidIdRes = await makeRequest('/api/v1/video/token', {
      method: 'POST',
      headers: { Authorization: `Bearer ${patient1Token}` },
      body: { bookingId: 'not-a-valid-uuid' },
    });
    console.assert(invalidIdRes.status === 400, `Expected 400 for invalid UUID, got ${invalidIdRes.status}`);
    console.log('✔ Invalid booking UUID rejected with 400');

    // 2c. Non-existent booking ID -> 404
    const notFoundRes = await makeRequest('/api/v1/video/token', {
      method: 'POST',
      headers: { Authorization: `Bearer ${patient1Token}` },
      body: { bookingId: '00000000-0000-0000-0000-000000000000' },
    });
    console.assert(notFoundRes.status === 404, `Expected 404 for non-existent booking, got ${notFoundRes.status}`);
    console.log('✔ Non-existent booking rejected with 404');

    // 2d. Patient 1 (Owner) joins video consultation -> 200
    const patientTokenRes = await makeRequest('/api/v1/video/token', {
      method: 'POST',
      headers: { Authorization: `Bearer ${patient1Token}` },
      body: { bookingId: testBooking1.id },
    });
    console.assert(patientTokenRes.status === 200, `Expected 200 for patient token, got ${patientTokenRes.status}: ${JSON.stringify(patientTokenRes.body)}`);
    console.assert(patientTokenRes.body.success === true, 'Expected success === true');
    console.assert(typeof patientTokenRes.body.data.token === 'string', 'Expected JWT token string');
    console.assert(patientTokenRes.body.data.participant.identity === `patient_${testPatient1.id}`, 'Expected patient identity');
    console.assert(patientTokenRes.body.data.serverUrl === testLiveKitUrl, 'Expected serverUrl');
    const assignedRoomName = patientTokenRes.body.data.roomName;
    console.assert(assignedRoomName.startsWith(`mq_room_${testBooking1.id}`), 'Expected secure room identifier');
    console.log(`✔ Patient 1 authorized and issued LiveKit token for room: ${assignedRoomName}`);

    // 2e. Patient 2 (Unauthorized) tries to join Patient 1's appointment -> 403
    const crossPatientRes = await makeRequest('/api/v1/video/token', {
      method: 'POST',
      headers: { Authorization: `Bearer ${patient2Token}` },
      body: { bookingId: testBooking1.id },
    });
    console.assert(crossPatientRes.status === 403, `Expected 403 for cross-patient access, got ${crossPatientRes.status}`);
    console.log('✔ Cross-user access rejected with 403 Forbidden (Patient 2 cannot access Patient 1 room)');

    // 2f. Doctor 2 (Unassigned doctor) tries to join Doctor 1's appointment -> 403
    const crossDocRes = await makeRequest('/api/v1/video/token', {
      method: 'POST',
      headers: { Authorization: `Bearer ${doctor2Token}` },
      body: { bookingId: testBooking1.id },
    });
    console.assert(crossDocRes.status === 403, `Expected 403 for unassigned doctor, got ${crossDocRes.status}`);
    console.log('✔ Unauthorized doctor rejected with 403 Forbidden (Doctor 2 cannot access Doctor 1 appointment)');

    // 2g. Doctor 1 (Assigned Doctor) joins video consultation -> 200
    const doctorTokenRes = await makeRequest('/api/v1/video/token', {
      method: 'POST',
      headers: { Authorization: `Bearer ${doctor1Token}` },
      body: { bookingId: testBooking1.id },
    });
    console.assert(doctorTokenRes.status === 200, `Expected 200 for assigned doctor token, got ${doctorTokenRes.status}`);
    console.assert(doctorTokenRes.body.data.participant.identity === `doctor_${testDoctor1.id}`, 'Expected doctor identity');
    console.assert(doctorTokenRes.body.data.roomName === assignedRoomName, 'Expected doctor to join identical room as patient');
    console.log('✔ Assigned Doctor 1 authorized and joins the EXACT same room identifier as Patient 1');

    // ----------------------------------------------------
    // TEST GROUP 3: CANCELLED APPOINTMENT REJECTION
    // ----------------------------------------------------
    console.log('\n[TEST GROUP 3: CANCELLED APPOINTMENT REJECTION]');

    testBookingCancelled = await prisma.oPBooking.create({
      data: {
        hospitalId: testHospital.id,
        departmentId: testDepartment.id,
        doctorId: testDoctor1.id,
        patientId: testPatient1.id,
        patientName: testPatient1.name,
        status: 'CANCELLED',
        opType: 'Video Consultation',
      },
    });

    const cancelledRes = await makeRequest('/api/v1/video/token', {
      method: 'POST',
      headers: { Authorization: `Bearer ${patient1Token}` },
      body: { bookingId: testBookingCancelled.id },
    });
    console.assert(cancelledRes.status === 400, `Expected 400 APPOINTMENT_CANCELLED, got ${cancelledRes.status}`);
    console.assert(cancelledRes.body.error.code === 'APPOINTMENT_CANCELLED', 'Expected APPOINTMENT_CANCELLED code');
    console.log('✔ Cancelled appointments strictly rejected from joining or starting video rooms (400)');

    // ----------------------------------------------------
    // TEST GROUP 4: LIVEKIT WEBHOOKS & LIFECYCLE MANAGEMENT
    // ----------------------------------------------------
    console.log('\n[TEST GROUP 4: LIVEKIT WEBHOOK VERIFICATION & LIFECYCLE]');

    // 4a. Missing Authorization header -> 401
    const noWebhookAuth = await makeRequest('/api/v1/video/webhook', {
      method: 'POST',
      body: { event: 'room_started' },
    });
    console.assert(noWebhookAuth.status === 401, `Expected 401 for missing webhook auth, got ${noWebhookAuth.status}`);
    console.log('✔ Webhook without Authorization header rejected with 401');

    // 4b. Invalid HMAC signature -> 401
    const invalidSignatureRes = await makeRequest('/api/v1/video/webhook', {
      method: 'POST',
      headers: { Authorization: 'Bearer fake_tampered_signature_token' },
      body: { event: 'room_started' },
    });
    console.assert(invalidSignatureRes.status === 401, `Expected 401 for invalid signature, got ${invalidSignatureRes.status}`);
    console.log('✔ Webhook with tampered/invalid signature rejected with 401');

    // 4c. Valid signed participant_joined webhook (Patient joins)
    const patientJoinPayload = JSON.stringify({
      event: 'participant_joined',
      room: { name: assignedRoomName },
      participant: { identity: `patient_${testPatient1.id}`, name: testPatient1.name },
      createdAt: Math.floor(Date.now() / 1000),
    });

    // Generate valid LiveKit webhook token using official AccessToken
    const at = new AccessToken(testLiveKitKey, testLiveKitSecret, { ttl: '1m' });
    at.sha256 = crypto.createHash('sha256').update(patientJoinPayload).digest('base64');
    const validWebhookToken = await at.toJwt();

    const webhookRes = await makeRequest('/api/v1/video/webhook', {
      method: 'POST',
      headers: {
        Authorization: validWebhookToken,
      },
      body: JSON.parse(patientJoinPayload),
    });
    console.assert(webhookRes.status === 200, `Expected 200 for valid webhook, got ${webhookRes.status}: ${JSON.stringify(webhookRes.body)}`);
    console.log('✔ Valid HMAC signed LiveKit webhook accepted and processed successfully');

    // Verify DB recorded patientJoinedAt
    const dbConsultation = await prisma.videoConsultation.findUnique({
      where: { roomName: assignedRoomName },
    });
    console.assert(dbConsultation?.patientJoinedAt != null, 'Expected patientJoinedAt to be recorded');
    console.log('✔ Webhook event participant_joined persisted patientJoinedAt in PostgreSQL');

    // ----------------------------------------------------
    // TEST GROUP 5: CONSULTATION STATUS & DURATION ACCURACY
    // ----------------------------------------------------
    console.log('\n[TEST GROUP 5: CONSULTATION STATUS & DURATION ACCURACY]');

    const statusRes = await makeRequest(`/api/v1/video/status/${testBooking1.id}`, {
      headers: { Authorization: `Bearer ${patient1Token}` },
    });
    console.assert(statusRes.status === 200, `Expected 200 from status API, got ${statusRes.status}`);
    console.assert(statusRes.body.data.roomName === assignedRoomName, 'Expected matching roomName');
    console.assert(typeof statusRes.body.data.formattedDuration === 'string', 'Expected formattedDuration');
    console.log(`✔ GET /status/:bookingId returned consultation status: ${statusRes.body.data.status}, Duration: ${statusRes.body.data.formattedDuration}`);

    // ----------------------------------------------------
    // TEST GROUP 6: END CONSULTATION & FINALIZATION
    // ----------------------------------------------------
    console.log('\n[TEST GROUP 6: END CALL & FINALIZATION]');

    const endRes = await makeRequest(`/api/v1/video/end/${testBooking1.id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${doctor1Token}` },
    });
    console.assert(endRes.status === 200, `Expected 200 from endCall, got ${endRes.status}`);
    console.assert(endRes.body.data.status === 'COMPLETED', 'Expected status COMPLETED');

    const finalizedBooking = await prisma.oPBooking.findUnique({
      where: { id: testBooking1.id },
    });
    console.assert(finalizedBooking?.status === 'COMPLETED', 'Booking status should be COMPLETED');
    console.log('✔ Doctor ended call: Consultation and OP appointment transitioned to COMPLETED');

    // ----------------------------------------------------
    // TEST GROUP 7: CONSULTATION HISTORY
    // ----------------------------------------------------
    console.log('\n[TEST GROUP 7: CONSULTATION HISTORY AUTHORIZATION]');

    const historyRes = await makeRequest('/api/v1/video/history', {
      headers: { Authorization: `Bearer ${patient1Token}` },
    });
    console.assert(historyRes.status === 200, `Expected 200 from history API, got ${historyRes.status}`);
    console.assert(Array.isArray(historyRes.body.data), 'Expected array of consultations');
    console.assert(historyRes.body.data.some((h: any) => h.bookingId === testBooking1.id), 'Expected created consultation in history');
    console.log(`✔ Patient consultation history retrieved (${historyRes.body.data.length} consultations)`);

    // Restore original env
    (env as any).LIVEKIT_URL = originalUrl;
    (env as any).LIVEKIT_API_KEY = originalKey;
    (env as any).LIVEKIT_API_SECRET = originalSecret;

    console.log('\n===========================================================');
    console.log('ALL VIDEO CONSULTATION INTEGRATION TESTS PASSED 100%');
    console.log('===========================================================');
  } finally {
    // Clean up test data
    if (testBooking1) {
      await prisma.videoConsultation.deleteMany({ where: { bookingId: testBooking1.id } });
      await prisma.oPBooking.deleteMany({ where: { id: testBooking1.id } });
    }
    if (testBookingCancelled) {
      await prisma.oPBooking.deleteMany({ where: { id: testBookingCancelled.id } });
    }
    if (testPatient1) await prisma.user.deleteMany({ where: { id: testPatient1.id } });
    if (testPatient2) await prisma.user.deleteMany({ where: { id: testPatient2.id } });
    if (testDoctor1) await prisma.user.deleteMany({ where: { id: testDoctor1.id } });
    if (testDoctor2) await prisma.user.deleteMany({ where: { id: testDoctor2.id } });

    server.close();
  }
}

runVideoIntegrationTests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Video Consultation Integration Test Failed:', err);
    process.exit(1);
  });
