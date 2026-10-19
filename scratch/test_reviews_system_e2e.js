const http = require('http');
const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '..', 'backend', 'node_modules', '@prisma', 'client'));

const prisma = new PrismaClient();

function request(method, urlPath, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json'
    };
    if (data) {
      headers['Content-Length'] = Buffer.byteLength(data);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path: urlPath,
        method,
        headers
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(raw) });
          } catch (e) {
            resolve({ status: res.statusCode, raw });
          }
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

const get = (urlPath, token) => request('GET', urlPath, null, token);
const post = (urlPath, body, token) => request('POST', urlPath, body, token);
const patch = (urlPath, body, token) => request('PATCH', urlPath, body, token);

async function run() {
  console.log('================================================================');
  console.log('🚀 MEDIQUEE REVIEWS & RATINGS SYSTEM E2E VERIFICATION TEST');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Log in Admin
    console.log('--- STEP 1: AUTHENTICATION ---');
    const adminLogin = await post('/api/v1/auth/login', {
      email: 'admin@mediquee.com',
      password: 'Admin@123456'
    });
    assert(adminLogin.status === 200 && adminLogin.body.data?.token, 'Super Admin logged in successfully');
    const adminToken = adminLogin.body.data.token;

    // 2. Find or create a test patient
    let patient = await prisma.user.findFirst({
      where: { role: 'PATIENT', active: true }
    });
    if (!patient) {
      throw new Error('No active patient found in database');
    }
    console.log(`Found patient: ${patient.name} (${patient.email || patient.phone})`);

    // Log in patient (or generate token using jwt)
    const jwt = require(path.join(__dirname, '..', 'backend', 'node_modules', 'jsonwebtoken'));
    const jwtSecret = process.env.JWT_SECRET || 'local_dev_secret_key';
    const patientToken = jwt.sign({ userId: patient.id }, jwtSecret, { expiresIn: '1d' });
    assert(!!patientToken, 'Patient JWT token generated for verified tests');

    // 3. Find Hospital & Doctor
    const hospital = await prisma.hospital.findFirst({ where: { verificationStatus: 'APPROVED' } }) || await prisma.hospital.findFirst();
    const doctor = await prisma.user.findFirst({ where: { role: 'DOCTOR', hospitalId: hospital.id } }) || await prisma.user.findFirst({ where: { role: 'DOCTOR' } });
    const dept = await prisma.department.findFirst({ where: { hospitalId: hospital.id } }) || await prisma.department.findFirst();

    console.log(`Test context: Hospital=${hospital.name}, Doctor=${doctor.name}`);

    // Clean up existing reviews for our test bookings if needed
    console.log('\n--- STEP 2: OP & VIDEO CONSULTATION REVIEWS (INDEPENDENT) ---');

    // Create completed OP booking
    const opBooking = await prisma.oPBooking.create({
      data: {
        hospitalId: hospital.id,
        doctorId: doctor.id,
        departmentId: dept ? dept.id : doctor.departmentId,
        patientId: patient.id,
        patientName: patient.name,
        patientPhone: patient.phone,
        status: 'COMPLETED',
        appointmentDate: new Date(),
        opType: 'Normal',
        fee: 500
      }
    });

    // Test 1: Submit Hospital review for completed OP booking
    const hospRevRes = await post(
      '/api/v1/reviews',
      {
        bookingId: opBooking.id,
        serviceType: 'OP_CONSULTATION',
        targetType: 'HOSPITAL',
        rating: 5,
        comment: 'Great hospital facilities and welcoming staff!'
      },
      patientToken
    );
    assert(hospRevRes.status === 201, 'Completed OP booking: Hospital review submitted successfully');
    assert(hospRevRes.body.data.targetType === 'HOSPITAL', 'Target type is HOSPITAL');
    assert(hospRevRes.body.data.doctorId === null, 'Hospital review has doctorId=null');

    // Test 2: Check review status - Hospital submitted, Doctor pending!
    const statusRes1 = await get(`/api/v1/reviews/booking/${opBooking.id}`, patientToken);
    assert(statusRes1.status === 200, 'Review status checked successfully');
    assert(statusRes1.body.data.hospitalReview !== null, 'Hospital review is marked as submitted');
    assert(statusRes1.body.data.doctorReview === null, 'Doctor review is still pending');

    // Test 3: Duplicate Hospital review submission is REJECTED
    const dupHospRes = await post(
      '/api/v1/reviews',
      {
        bookingId: opBooking.id,
        serviceType: 'OP_CONSULTATION',
        targetType: 'HOSPITAL',
        rating: 4,
        comment: 'Trying duplicate submission'
      },
      patientToken
    );
    assert(dupHospRes.status === 409, 'Duplicate Hospital review is correctly rejected with 409 Conflict');

    // Test 4: Submit Doctor review independently for same OP booking
    const docRevRes = await post(
      '/api/v1/reviews',
      {
        bookingId: opBooking.id,
        serviceType: 'OP_CONSULTATION',
        targetType: 'DOCTOR',
        rating: 5,
        comment: 'Dr. was attentive, listened carefully, and gave clear prescription.'
      },
      patientToken
    );
    assert(docRevRes.status === 201, 'Completed OP booking: Doctor review submitted successfully');
    assert(docRevRes.body.data.targetType === 'DOCTOR', 'Target type is DOCTOR');
    assert(docRevRes.body.data.doctorId === doctor.id, 'Doctor review references doctor ID');

    // Test 5: Check review status - Now both Hospital and Doctor are submitted
    const statusRes2 = await get(`/api/v1/reviews/booking/${opBooking.id}`, patientToken);
    assert(statusRes2.body.data.hospitalReview !== null && statusRes2.body.data.doctorReview !== null, 'Both reviews are now marked as submitted independently');

    console.log('\n--- STEP 3: NON-COMPLETED BOOKINGS CANNOT BE REVIEWED ---');
    // Create a WAITING/PENDING OP booking
    const pendingOp = await prisma.oPBooking.create({
      data: {
        hospitalId: hospital.id,
        doctorId: doctor.id,
        departmentId: dept ? dept.id : doctor.departmentId,
        patientId: patient.id,
        patientName: patient.name,
        status: 'WAITING',
        fee: 500
      }
    });

    const pendingReviewRes = await post(
      '/api/v1/reviews',
      {
        bookingId: pendingOp.id,
        serviceType: 'OP_CONSULTATION',
        targetType: 'HOSPITAL',
        rating: 5
      },
      patientToken
    );
    assert(pendingReviewRes.status === 400, 'Non-completed (WAITING) booking review is rejected with 400');
    assert(pendingReviewRes.body.error?.code === 'NOT_COMPLETED', 'Error code is NOT_COMPLETED');

    console.log('\n--- STEP 4: LAB TESTS & HOME SAMPLE REVIEWS (HOSPITAL ONLY) ---');
    // Create completed Lab Booking
    const labBooking = await prisma.labBooking.create({
      data: {
        hospitalId: hospital.id,
        patientId: patient.id,
        bookingType: 'WALK_IN',
        status: 'COMPLETED',
        totalAmount: 1200
      }
    });

    // Test 6: Lab Test Hospital review
    const labRevRes = await post(
      '/api/v1/reviews',
      {
        bookingId: labBooking.id,
        serviceType: 'LAB_TEST',
        targetType: 'HOSPITAL',
        rating: 4,
        comment: 'Diagnostic report was delivered fast and on time.'
      },
      patientToken
    );
    assert(labRevRes.status === 201, 'Lab Test: Hospital review submitted successfully');

    // Test 7: Attempting DOCTOR review on Lab Test is REJECTED
    const labDocRevRes = await post(
      '/api/v1/reviews',
      {
        bookingId: labBooking.id,
        serviceType: 'LAB_TEST',
        targetType: 'DOCTOR',
        rating: 5
      },
      patientToken
    );
    assert(labDocRevRes.status === 400, 'Doctor review on Lab Test booking is rejected');

    console.log('\n--- STEP 5: HOME NURSING REVIEWS (PROVIDER ONLY) ---');
    const nursingService = await prisma.nursingService.findFirst();
    let nursingBooking;
    if (nursingService) {
      nursingBooking = await prisma.homeNursingBooking.create({
        data: {
          hospitalId: hospital.id,
          userId: patient.id,
          serviceId: nursingService.id,
          patientName: patient.name,
          patientPhone: patient.phone || '9999999999',
          serviceDate: new Date(),
          timeSlot: '09:00 AM - 01:00 PM',
          address: '123 Test Street',
          totalAmount: 1500,
          status: 'COMPLETED',
          bookingNumber: 'HN-' + Date.now()
        }
      });

      const nursingRevRes = await post(
        '/api/v1/reviews',
        {
          bookingId: nursingBooking.id,
          serviceType: 'HOME_NURSING',
          targetType: 'HOSPITAL',
          rating: 5,
          comment: 'Nurse arrived on time and provided excellent home patient care.'
        },
        patientToken
      );
      assert(nursingRevRes.status === 201, 'Home Nursing: Provider review submitted successfully');

      const nursingDocRevRes = await post(
        '/api/v1/reviews',
        {
          bookingId: nursingBooking.id,
          serviceType: 'HOME_NURSING',
          targetType: 'DOCTOR',
          rating: 5
        },
        patientToken
      );
      assert(nursingDocRevRes.status === 400, 'Doctor review on Home Nursing booking is rejected');
    }

    console.log('\n--- STEP 6: PUBLIC AGGREGATIONS & PRIVACY ---');
    // Test 8: Get Hospital public reviews
    const hospPublicRes = await get(`/api/v1/reviews/hospital/${hospital.id}`);
    assert(hospPublicRes.status === 200, 'Hospital public reviews fetched successfully');
    assert(typeof hospPublicRes.body.data.summary.averageRating === 'number', 'Hospital average rating is a valid number');
    assert(hospPublicRes.body.data.summary.totalReviews > 0, 'Hospital total reviews count is greater than 0');
    assert(hospPublicRes.body.data.reviews.length > 0, 'Hospital reviews list is populated');
    const firstHospRev = hospPublicRes.body.data.reviews[0];
    assert(firstHospRev.reviewerName !== undefined, 'Reviewer name is present');
    assert(!firstHospRev.reviewerName.includes(patient.phone || '1234567890'), 'Patient phone number is not leaked in public reviews');

    // Test 9: Get Doctor public reviews
    const docPublicRes = await get(`/api/v1/reviews/doctor/${doctor.id}`);
    assert(docPublicRes.status === 200, 'Doctor public reviews fetched successfully');
    assert(typeof docPublicRes.body.data.summary.averageRating === 'number', 'Doctor average rating is a valid number');
    assert(docPublicRes.body.data.summary.totalReviews > 0, 'Doctor total reviews count is greater than 0');

    console.log('\n--- STEP 7: HOSPITAL DASHBOARD CONTRACT ENDPOINT ---');
    // Test 10: Hospital dashboard review endpoint with hospital isolation
    let hospAdmin = await prisma.user.findFirst({ where: { role: 'HOSPITAL_ADMIN', hospitalId: hospital.id } });
    if (!hospAdmin) {
      hospAdmin = await prisma.user.findFirst({ where: { role: 'HOSPITAL_ADMIN' } });
    }
    if (hospAdmin) {
      const hospAdminToken = jwt.sign({ userId: hospAdmin.id }, jwtSecret, { expiresIn: '1d' });
      const hospDashRes = await get('/api/v1/hospital/reviews', hospAdminToken);
      assert(hospDashRes.status === 200, 'Hospital Dashboard API /api/v1/hospital/reviews returns 200');
      assert(hospDashRes.body.data.summary.hospital !== undefined, 'Hospital dashboard summary contains hospital metrics');
      assert(Array.isArray(hospDashRes.body.data.summary.doctors), 'Hospital dashboard summary contains doctor metrics array');
      assert(Array.isArray(hospDashRes.body.data.reviews), 'Hospital dashboard reviews list is returned');
    }

    console.log('\n--- STEP 8: ADMIN REVIEWS MANAGEMENT & MODERATION ---');
    // Test 11: Admin reviews listing
    const adminReviewsRes = await get('/api/v1/reviews/admin', adminToken);
    assert(adminReviewsRes.status === 200, 'Admin reviews list /api/v1/reviews/admin returns 200');
    assert(adminReviewsRes.body.data.items.length > 0, 'Admin reviews items array is populated with real records');

    // Test 12: Admin stats
    const adminStatsRes = await get('/api/v1/reviews/admin/stats', adminToken);
    assert(adminStatsRes.status === 200, 'Admin reviews stats /api/v1/reviews/admin/stats returns 200');
    assert(adminStatsRes.body.data.totalReviews >= 3, 'Total reviews count is accurate');
    assert(typeof adminStatsRes.body.data.overallAverage === 'number', 'Overall average is calculated');

    // Test 13: Moderation action (Hide Review)
    const reviewToModerate = hospRevRes.body.data;
    const hideRes = await patch(
      `/api/v1/reviews/admin/${reviewToModerate.id}/moderation`,
      { status: 'HIDDEN', moderationNotes: 'Test hiding inappropriate review' },
      adminToken
    );
    assert(hideRes.status === 200, 'Review successfully moderated to HIDDEN');
    assert(hideRes.body.data.status === 'HIDDEN', 'Review status changed to HIDDEN');
    assert(hideRes.body.data.moderatedAt !== null, 'Moderation timestamp recorded');

    // Test 14: Hidden review is excluded from public calculation
    const hospPublicAfterHide = await get(`/api/v1/reviews/hospital/${hospital.id}`);
    const hiddenFound = hospPublicAfterHide.body.data.reviews.some((r) => r.id === reviewToModerate.id);
    assert(!hiddenFound, 'Hidden review is excluded from public hospital reviews list');

    // Test 15: Publish review back
    const pubRes = await patch(
      `/api/v1/reviews/admin/${reviewToModerate.id}/moderation`,
      { status: 'PUBLISHED', moderationNotes: 'Restored after review' },
      adminToken
    );
    assert(pubRes.status === 200, 'Review successfully restored to PUBLISHED');
    assert(pubRes.body.data.status === 'PUBLISHED', 'Review status changed to PUBLISHED');

    console.log('\n================================================================');
    console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during E2E verification:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
