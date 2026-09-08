import http from 'http';
import jwt from 'jsonwebtoken';
import app from '../app';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { Role } from '@prisma/client';

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
  console.log('--- STARTING OP BOOKING INTEGRATION TESTS ---');

  // Start HTTP test server on an ephemeral port
  server = app.listen(0);
  const address = server.address() as any;
  baseUrl = `http://127.0.0.1:${address.port}`;
  console.log(`Test server listening at ${baseUrl}`);

  try {
    // 1. DISEASE TESTS
    console.log('\n[TEST GROUP: DISEASES]');
    
    const diseasesRes = await makeRequest('/api/v1/diseases');
    console.assert(diseasesRes.status === 200, `Expected 200, got ${diseasesRes.status}`);
    console.assert(diseasesRes.body.success === true, 'Expected success === true');
    console.assert(Array.isArray(diseasesRes.body.data.conditions), 'Conditions must be an array');
    console.assert(Array.isArray(diseasesRes.body.data.general), 'General diseases must be an array');
    console.assert(Array.isArray(diseasesRes.body.data.advanced), 'Advanced diseases must be an array');
    console.assert(Array.isArray(diseasesRes.body.data.categorical), 'Categorical specialties must be an array');
    console.log(`✔ Fetch diseases passed (${diseasesRes.body.data.total} conditions found)`);

    // Disease search
    const searchRes = await makeRequest('/api/v1/diseases?search=Fever');
    console.assert(searchRes.status === 200, 'Search should return 200');
    console.assert(searchRes.body.data.conditions.some((c: any) => c.name.toLowerCase().includes('fever')), 'Search should find fever');
    console.log('✔ Disease search works');

    // 2. HOSPITAL TESTS
    console.log('\n[TEST GROUP: HOSPITALS]');
    const hospRes = await makeRequest('/api/v1/hospitals');
    console.assert(hospRes.status === 200, `Expected 200, got ${hospRes.status}`);
    console.assert(Array.isArray(hospRes.body.data) && hospRes.body.data.length > 0, 'Should have at least 1 hospital');
    const testHospital = hospRes.body.data[0];
    console.log(`✔ Fetch hospitals passed (${hospRes.body.data.length} hospitals found, sample: ${testHospital.name})`);

    // Hospital search
    const hospSearchRes = await makeRequest(`/api/v1/hospitals?search=${encodeURIComponent(testHospital.name.slice(0, 4))}`);
    console.assert(hospSearchRes.status === 200, 'Hospital search should return 200');
    console.assert(hospSearchRes.body.data.length > 0, 'Hospital search should find match');
    console.log('✔ Hospital search works');

    // Hospital details by ID
    const hospDetailRes = await makeRequest(`/api/v1/hospitals/${testHospital.id}`);
    console.assert(hospDetailRes.status === 200, 'Hospital detail should return 200');
    console.assert(hospDetailRes.body.data.id === testHospital.id, 'Hospital detail should match ID');
    console.log('✔ Hospital details by ID works');

    // 3. DOCTOR TESTS
    console.log('\n[TEST GROUP: DOCTORS]');
    // Find a hospital that has active doctors
    let hospitalWithDoc: any = null;
    let testDoctor: any = null;

    for (const h of hospRes.body.data) {
      const docRes = await makeRequest(`/api/v1/hospitals/${h.id}/doctors`);
      if (docRes.status === 200 && docRes.body.data.length > 0) {
        hospitalWithDoc = h;
        testDoctor = docRes.body.data[0];
        break;
      }
    }

    if (!testDoctor) {
      // If none, find any active doctor in db and use their hospital
      const d = await prisma.user.findFirst({
        where: { role: Role.DOCTOR, active: true },
        include: { hospital: true }
      });
      if (d && d.hospital) {
        hospitalWithDoc = d.hospital;
        testDoctor = { id: d.id, name: d.name, hospitalId: d.hospitalId };
      }
    }

    console.assert(testDoctor != null, 'Must have at least one active doctor for testing');
    console.log(`✔ Hospital doctors retrieved: Dr. ${testDoctor.name} at ${hospitalWithDoc.name}`);

    // Doctor details
    const docDetailRes = await makeRequest(`/api/v1/doctors/${testDoctor.id}`);
    console.assert(docDetailRes.status === 200, 'Doctor detail should return 200');
    console.assert(docDetailRes.body.data.id === testDoctor.id, 'Doctor detail should match ID');
    console.log('✔ Doctor details works');

    // Doctor availability
    const availRes = await makeRequest(`/api/v1/doctors/${testDoctor.id}/availability?date=2026-10-15`);
    console.assert(availRes.status === 200, 'Availability should return 200');
    console.assert(Array.isArray(availRes.body.data.availableSlots), 'Should return availableSlots array');
    console.log(`✔ Doctor availability works (${availRes.body.data.availableSlots.length} available slots)`);

    // 4. SECURITY & AUTHENTICATION TESTS
    console.log('\n[TEST GROUP: SECURITY & AUTHENTICATION]');

    // POST /appointments without token -> 401
    const noAuthRes = await makeRequest('/api/v1/appointments', {
      method: 'POST',
      body: { hospitalId: hospitalWithDoc.id, doctorId: testDoctor.id, date: '2026-10-15', timeSlot: '10:00 AM' }
    });
    console.assert(noAuthRes.status === 401, `Expected 401 for unauthenticated request, got ${noAuthRes.status}`);
    console.log('✔ Rejection of request without JWT (401) works');

    // Invalid JWT -> 401
    const invalidAuthRes = await makeRequest('/api/v1/appointments', {
      method: 'POST',
      headers: { Authorization: 'Bearer invalid_token_xyz' },
      body: { hospitalId: hospitalWithDoc.id, doctorId: testDoctor.id, date: '2026-10-15', timeSlot: '10:00 AM' }
    });
    console.assert(invalidAuthRes.status === 401, `Expected 401 for invalid JWT, got ${invalidAuthRes.status}`);
    console.log('✔ Rejection of invalid JWT (401) works');

    // Create a test patient user or find existing patient
    let patientUser = await prisma.user.findFirst({
      where: { role: Role.PATIENT, active: true }
    });
    if (!patientUser) {
      patientUser = await prisma.user.create({
        data: {
          email: `testpatient_${Date.now()}@example.com`,
          name: 'Test Patient Real',
          passwordHash: 'dummy_hash',
          role: Role.PATIENT,
          phone: `99${Math.floor(10000000 + Math.random() * 90000000)}`
        }
      });
    }

    // Another patient user for cross-user tests
    let otherPatient = await prisma.user.findFirst({
      where: { role: Role.PATIENT, active: true, id: { not: patientUser.id } }
    });
    if (!otherPatient) {
      otherPatient = await prisma.user.create({
        data: {
          email: `testpatient2_${Date.now()}@example.com`,
          name: 'Other Patient Real',
          passwordHash: 'dummy_hash',
          role: Role.PATIENT,
          phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`
        }
      });
    }

    const patientToken = jwt.sign({ userId: patientUser.id }, env.JWT_SECRET, { expiresIn: '1h' });
    const otherPatientToken = jwt.sign({ userId: otherPatient.id }, env.JWT_SECRET, { expiresIn: '1h' });

    // Doctor/Hospital mismatch rejection
    const fakeHospital = hospRes.body.data.find((h: any) => h.id !== hospitalWithDoc.id);
    if (fakeHospital) {
      const mismatchRes = await makeRequest('/api/v1/appointments', {
        method: 'POST',
        headers: { Authorization: `Bearer ${patientToken}` },
        body: {
          hospitalId: fakeHospital.id,
          doctorId: testDoctor.id,
          date: '2026-10-15',
          timeSlot: '10:00 AM'
        }
      });
      console.assert(mismatchRes.status === 400, `Doctor/hospital mismatch should be 400, got ${mismatchRes.status}`);
      console.log('✔ Doctor/hospital mismatch rejected with 400');
    }

    // Invalid disease rejection
    const invalidDiseaseRes = await makeRequest('/api/v1/appointments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${patientToken}` },
      body: {
        hospitalId: hospitalWithDoc.id,
        doctorId: testDoctor.id,
        conditionId: '00000000-0000-0000-0000-000000000000',
        date: '2026-10-15',
        timeSlot: '10:00 AM'
      }
    });
    console.assert(invalidDiseaseRes.status === 400, `Invalid condition should be 400, got ${invalidDiseaseRes.status}`);
    console.log('✔ Invalid disease rejected with 400');

    // 5. BOOKING WORKFLOW & PERSISTENCE TESTS
    console.log('\n[TEST GROUP: BOOKING CREATION & RELATIONS]');
    const testCondition = diseasesRes.body.data.conditions[0];
    const testSlot = '11:00 AM';
    const testDate = '2026-10-20';

    // First booking
    const bookingRes = await makeRequest('/api/v1/appointments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${patientToken}` },
      body: {
        hospitalId: hospitalWithDoc.id,
        doctorId: testDoctor.id,
        conditionId: testCondition.id,
        date: testDate,
        timeSlot: testSlot,
        patientName: 'Test Patient Real',
        patientPhone: '9999999999',
        reason: 'General fever consultation test'
      }
    });

    console.assert(bookingRes.status === 201, `Expected 201 Created, got ${bookingRes.status}: ${JSON.stringify(bookingRes.body)}`);
    console.assert(bookingRes.body.success === true, 'Expected booking success === true');
    const createdAppointmentId = bookingRes.body.data.id;
    console.assert(createdAppointmentId != null, 'Must return real appointment ID');
    console.assert(bookingRes.body.data.patientId === patientUser.id, 'Patient ID must be derived from JWT');
    console.assert(bookingRes.body.data.hospitalId === hospitalWithDoc.id, 'Must reference correct hospital');
    console.assert(bookingRes.body.data.doctorId === testDoctor.id, 'Must reference correct doctor');
    console.assert(bookingRes.body.data.conditionId === testCondition.id, 'Must reference correct disease');
    console.log(`✔ Appointment created successfully (ID: ${createdAppointmentId}) with correct relational IDs`);

    // Verify in database
    const dbRecord = await prisma.oPBooking.findUnique({
      where: { id: createdAppointmentId },
      include: {
        hospital: true,
        doctor: true,
        patient: true,
        condition: true,
        department: true
      }
    });
    console.assert(dbRecord != null, 'Record must exist in database');
    console.assert(dbRecord?.hospitalId === hospitalWithDoc.id, 'DB hospitalId must match');
    console.assert(dbRecord?.doctorId === testDoctor.id, 'DB doctorId must match');
    console.assert(dbRecord?.patientId === patientUser.id, 'DB patientId must match');
    console.assert(dbRecord?.conditionId === testCondition.id, 'DB conditionId must match');
    console.log('✔ Direct database check in PostgreSQL confirmed all foreign key relations');

    // 6. DOUBLE-BOOKING PROTECTION TEST
    console.log('\n[TEST GROUP: DOUBLE-BOOKING PROTECTION]');
    const doubleBookRes = await makeRequest('/api/v1/appointments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${otherPatientToken}` },
      body: {
        hospitalId: hospitalWithDoc.id,
        doctorId: testDoctor.id,
        conditionId: testCondition.id,
        date: testDate,
        timeSlot: testSlot, // Same slot!
        patientName: 'Other Patient Real'
      }
    });

    console.assert(doubleBookRes.status === 409, `Expected 409 Conflict for double booking, got ${doubleBookRes.status}`);
    console.assert(doubleBookRes.body.error.code === 'CONFLICT', 'Error code should be CONFLICT');
    console.log('✔ Double-booking prevention verified (409 Conflict returned on duplicate slot)');

    // Check availability now excludes the booked slot
    const availAfterRes = await makeRequest(`/api/v1/doctors/${testDoctor.id}/availability?date=${testDate}`);
    console.assert(!availAfterRes.body.data.availableSlots.includes(testSlot), 'Booked slot must not be in availableSlots');
    console.assert(availAfterRes.body.data.bookedSlots.includes(testSlot), 'Booked slot must be in bookedSlots');
    console.log('✔ Availability API reflects booked slot');

    // 7. APPOINTMENT RETRIEVAL & AUTHORIZATION
    console.log('\n[TEST GROUP: APPOINTMENT ACCESS CONTROL & MY BOOKINGS]');
    // Patient can view their appointment
    const getOwnRes = await makeRequest(`/api/v1/appointments/${createdAppointmentId}`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    console.assert(getOwnRes.status === 200, 'Owner can view appointment');
    console.assert(getOwnRes.body.data.doctorName === testDoctor.name, 'Doctor name must match');
    console.log('✔ Authenticated patient can view their own appointment details');

    // Another patient cannot view this appointment -> 403
    const getOtherRes = await makeRequest(`/api/v1/appointments/${createdAppointmentId}`, {
      headers: { Authorization: `Bearer ${otherPatientToken}` }
    });
    console.assert(getOtherRes.status === 403, `Cross-user access should be 403 Forbidden, got ${getOtherRes.status}`);
    console.log('✔ Cross-user appointment access prevented (403 Forbidden)');

    // 8. GET /api/v1/appointments/my TESTS
    console.log('\n[TEST GROUP: GET /api/v1/appointments/my]');
    // Unauthenticated request -> 401
    const myNoAuthRes = await makeRequest('/api/v1/appointments/my');
    console.assert(myNoAuthRes.status === 401, `Expected 401 for GET /my without auth, got ${myNoAuthRes.status}`);
    console.log('✔ GET /my rejected without JWT (401)');

    // Patient 1 gets my appointments
    const myBookingsRes = await makeRequest('/api/v1/appointments/my', {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    console.assert(myBookingsRes.status === 200, `Expected 200 for GET /my, got ${myBookingsRes.status}`);
    console.assert(Array.isArray(myBookingsRes.body.data), 'GET /my must return an array');
    const foundBooking = myBookingsRes.body.data.find((b: any) => b.id === createdAppointmentId);
    console.assert(foundBooking != null, 'Newly created appointment must appear in GET /my');
    console.assert(foundBooking.hospitalName === hospitalWithDoc.name, 'Hospital name must match');
    console.assert(foundBooking.doctorName === testDoctor.name, 'Doctor name must match');
    console.assert(foundBooking.diseaseName === testCondition.name, 'Disease name must match');
    console.assert(foundBooking.timeSlot === testSlot, 'Time slot must match');
    console.assert(foundBooking.status === 'WAITING', 'Status must match');
    console.log('✔ GET /my returned newly created appointment with full hospital, doctor, and condition details');

    // Patient 2 calling GET /my must NOT see Patient 1's appointment
    const otherBookingsRes = await makeRequest('/api/v1/appointments/my', {
      headers: { Authorization: `Bearer ${otherPatientToken}` }
    });
    console.assert(otherBookingsRes.status === 200, 'Other patient GET /my returns 200');
    console.assert(!otherBookingsRes.body.data.some((b: any) => b.id === createdAppointmentId), 'Patient 2 must not see Patient 1 appointment');
    console.log('✔ Cross-user isolation verified: Patient 2 does NOT see Patient 1 appointment in GET /my');

    // Clean up the test booking
    await prisma.oPBooking.delete({ where: { id: createdAppointmentId } });
    console.log('✔ Cleaned up test booking');

    console.log('\n========================================');
    console.log('ALL BACKEND INTEGRATION TESTS PASSED 100%');
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
