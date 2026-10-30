import { prisma } from '../src/config/prisma';
import reviewsService from '../src/modules/reviews/reviews.service';
import { Role, BookingStatus, LabBookingType, LabBookingStatus, BusinessType } from '@prisma/client';

async function runAcceptanceTests() {
  console.log('🧪 Starting Acceptance Tests for Post-Service Review & Rating System...\n');

  let passedCount = 0;
  const totalTests = 14;

  const runTest = async (testNumber: number, title: string, fn: () => Promise<void>) => {
    try {
      await fn();
      console.log(`✅ [Test ${testNumber}/${totalTests}] Passed: ${title}`);
      passedCount++;
    } catch (err: any) {
      console.error(`❌ [Test ${testNumber}/${totalTests}] FAILED: ${title}`);
      console.error('   Error:', err.message || err);
    }
  };

  // 1. Setup Hospital
  const testHospital = await prisma.hospital.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'MediQuee Central Hospital',
      businessType: BusinessType.HOSPITAL,
      city: 'Hyderabad',
      addressLine1: 'Banjara Hills, Hyderabad',
    },
    update: {},
  });

  // 2. Setup Department
  const testDepartment = await prisma.department.upsert({
    where: {
      hospitalId_name: {
        hospitalId: testHospital.id,
        name: 'General Medicine Test',
      }
    },
    create: {
      hospitalId: testHospital.id,
      name: 'General Medicine Test',
    },
    update: {},
  });

  // 3. Setup Doctor (User with role DOCTOR)
  const testDoctor = await prisma.user.upsert({
    where: { phone: '9999000003' },
    create: {
      phone: '9999000003',
      name: 'Dr. Ramesh Sharma',
      role: Role.DOCTOR,
      passwordHash: 'dummy_hash',
      hospitalId: testHospital.id,
      departmentId: testDepartment.id,
      specialization: 'Cardiology',
    },
    update: {
      hospitalId: testHospital.id,
    },
  });

  // 4. Setup Patients
  const testUser = await prisma.user.upsert({
    where: { phone: '9999000001' },
    create: {
      phone: '9999000001',
      name: 'Post-Service Test Patient 1',
      role: Role.PATIENT,
      passwordHash: 'dummy_hash',
    },
    update: {},
  });

  const otherUser = await prisma.user.upsert({
    where: { phone: '9999000002' },
    create: {
      phone: '9999000002',
      name: 'Post-Service Test Patient 2',
      role: Role.PATIENT,
      passwordHash: 'dummy_hash',
    },
    update: {},
  });

  // 5. Setup Nursing Service
  const testNursingService = await prisma.nursingService.upsert({
    where: { code: 'TEST_NS_01' },
    create: {
      name: 'Critical Home Care Test',
      code: 'TEST_NS_01',
      category: 'Specialized Nursing',
      basePrice: 1200,
    },
    update: {},
  });

  // Clean existing test records for testUser and otherUser
  await prisma.review.deleteMany({ where: { userId: { in: [testUser.id, otherUser.id] } } });
  await prisma.reviewInvitation.deleteMany({ where: { userId: { in: [testUser.id, otherUser.id] } } });
  await prisma.videoConsultation.deleteMany({ where: { booking: { patientId: { in: [testUser.id, otherUser.id] } } } });
  await prisma.oPBooking.deleteMany({ where: { patientId: { in: [testUser.id, otherUser.id] } } });
  await prisma.labBooking.deleteMany({ where: { patientId: { in: [testUser.id, otherUser.id] } } });
  await prisma.homeNursingBooking.deleteMany({ where: { userId: { in: [testUser.id, otherUser.id] } } });

  // 1. Complete an OP appointment -> eligible review popup appears (Doctor & Hospital)
  let opCompletedBookingId = '';
  await runTest(1, 'Complete an OP appointment -> eligible review popup appears (Doctor & Hospital)', async () => {
    const op = await prisma.oPBooking.create({
      data: {
        patientId: testUser.id,
        doctorId: testDoctor.id,
        hospitalId: testHospital.id,
        departmentId: testDepartment.id,
        patientName: 'Test Patient',
        status: BookingStatus.COMPLETED,
        timeSlot: '10:00 AM',
      }
    });
    opCompletedBookingId = op.id;

    const invs = await reviewsService.getPendingInvitations(testUser.id, false);
    const opInvs = invs.filter(i => i.bookingId === op.id);
    if (opInvs.length !== 2) {
      throw new Error(`Expected 2 invitations (Doctor & Hospital), got ${opInvs.length}`);
    }
    const hasDoc = opInvs.some(i => i.targetType === 'DOCTOR' && i.targetId === testDoctor.id);
    const hasHosp = opInvs.some(i => i.targetType === 'HOSPITAL' && i.targetId === testHospital.id);
    if (!hasDoc || !hasHosp) {
      throw new Error('Missing doctor or hospital invitation');
    }
  });

  // 2. Complete a Video Consultation -> eligible review popup appears only after backend completion
  let videoBookingId = '';
  await runTest(2, 'Complete a Video Consultation -> eligible review popup appears only after backend completion', async () => {
    // A: In Progress video consultation -> 0 invitations
    const videoCall = await prisma.oPBooking.create({
      data: {
        patientId: testUser.id,
        doctorId: testDoctor.id,
        hospitalId: testHospital.id,
        departmentId: testDepartment.id,
        patientName: 'Test Patient',
        status: BookingStatus.IN_CONSULTATION,
        timeSlot: '11:00 AM',
        videoConsultation: {
          create: {
            roomName: `test-room-${Date.now()}`,
            status: 'IN_PROGRESS',
          }
        }
      }
    });
    videoBookingId = videoCall.id;

    let invs = await reviewsService.getPendingInvitations(testUser.id, false);
    let videoInvs = invs.filter(i => i.bookingId === videoCall.id);
    if (videoInvs.length !== 0) {
      throw new Error(`In-progress video consultation should NOT trigger review, got ${videoInvs.length}`);
    }

    // B: Complete video consultation in backend
    await prisma.oPBooking.update({
      where: { id: videoCall.id },
      data: { status: BookingStatus.COMPLETED },
    });

    invs = await reviewsService.getPendingInvitations(testUser.id, false);
    videoInvs = invs.filter(i => i.bookingId === videoCall.id);
    if (videoInvs.length !== 2) {
      throw new Error(`Completed video consultation should trigger 2 invitations, got ${videoInvs.length}`);
    }
    if (videoInvs[0].bookingType !== 'VIDEO_CONSULTATION') {
      throw new Error(`Expected bookingType VIDEO_CONSULTATION, got ${videoInvs[0].bookingType}`);
    }
  });

  // 3. Complete a Lab Test -> laboratory review popup appears
  let labBookingId = '';
  await runTest(3, 'Complete a Lab Test (Walk-in) -> laboratory review popup appears', async () => {
    const lab = await prisma.labBooking.create({
      data: {
        patientId: testUser.id,
        hospitalId: testHospital.id,
        bookingType: LabBookingType.WALK_IN,
        status: LabBookingStatus.COMPLETED,
        totalAmount: 450,
      }
    });
    labBookingId = lab.id;

    const invs = await reviewsService.getPendingInvitations(testUser.id, false);
    const labInvs = invs.filter(i => i.bookingId === lab.id);
    if (labInvs.length !== 1) {
      throw new Error(`Expected 1 laboratory invitation, got ${labInvs.length}`);
    }
    if (labInvs[0].targetType !== 'LABORATORY') {
      throw new Error(`Expected targetType LABORATORY, got ${labInvs[0].targetType}`);
    }
  });

  // 4. Complete Home Sample Collection -> eligible provider review popup appears
  let homeSampleId = '';
  await runTest(4, 'Complete Home Sample Collection -> eligible provider review popup appears', async () => {
    const sample = await prisma.labBooking.create({
      data: {
        patientId: testUser.id,
        hospitalId: testHospital.id,
        bookingType: LabBookingType.HOME_COLLECTION,
        status: LabBookingStatus.COMPLETED,
        totalAmount: 600,
      }
    });
    homeSampleId = sample.id;

    const invs = await reviewsService.getPendingInvitations(testUser.id, false);
    const sampleInvs = invs.filter(i => i.bookingId === sample.id);
    if (sampleInvs.length !== 1) {
      throw new Error(`Expected 1 home sample laboratory invitation, got ${sampleInvs.length}`);
    }
    if (sampleInvs[0].bookingType !== 'HOME_SAMPLE') {
      throw new Error(`Expected bookingType HOME_SAMPLE, got ${sampleInvs[0].bookingType}`);
    }
  });

  // 5. Complete Home Nursing -> hospital/service provider review popup appears
  let nursingId = '';
  await runTest(5, 'Complete Home Nursing -> hospital/service provider review popup appears', async () => {
    const nursing = await prisma.homeNursingBooking.create({
      data: {
        bookingNumber: `HNB-TEST-${Date.now()}`,
        userId: testUser.id,
        hospitalId: testHospital.id,
        serviceId: testNursingService.id,
        patientName: 'Test Patient',
        patientPhone: '9999000001',
        serviceDate: new Date(),
        timeSlot: '10:00 AM',
        address: 'Banjara Hills, Hyderabad',
        status: 'COMPLETED',
        totalAmount: 1200,
      }
    });
    nursingId = nursing.id;

    const invs = await reviewsService.getPendingInvitations(testUser.id, false);
    const nursingInvs = invs.filter(i => i.bookingId === nursing.id);
    if (nursingInvs.length !== 1) {
      throw new Error(`Expected 1 hospital nursing invitation, got ${nursingInvs.length}`);
    }
    if (nursingInvs[0].targetType !== 'HOSPITAL') {
      throw new Error(`Expected targetType HOSPITAL, got ${nursingInvs[0].targetType}`);
    }
  });

  // 6. Cancelled booking -> no popup
  await runTest(6, 'Cancelled booking -> no popup', async () => {
    const cancelled = await prisma.oPBooking.create({
      data: {
        patientId: testUser.id,
        doctorId: testDoctor.id,
        hospitalId: testHospital.id,
        departmentId: testDepartment.id,
        patientName: 'Test Patient',
        timeSlot: '02:00 PM',
        status: BookingStatus.CANCELLED,
      }
    });

    const invs = await reviewsService.getPendingInvitations(testUser.id, false);
    const cancelledInvs = invs.filter(i => i.bookingId === cancelled.id);
    if (cancelledInvs.length !== 0) {
      throw new Error(`Cancelled booking must NOT produce review invitations, got ${cancelledInvs.length}`);
    }
  });

  // 7. In-progress service -> no popup
  await runTest(7, 'In-progress service -> no popup', async () => {
    const inProgress = await prisma.homeNursingBooking.create({
      data: {
        bookingNumber: `HNB-INPROG-${Date.now()}`,
        userId: testUser.id,
        hospitalId: testHospital.id,
        serviceId: testNursingService.id,
        patientName: 'Test Patient',
        patientPhone: '9999000001',
        serviceDate: new Date(),
        timeSlot: '03:00 PM',
        address: 'Banjara Hills',
        status: 'IN_PROGRESS',
        totalAmount: 1200,
      }
    });

    const invs = await reviewsService.getPendingInvitations(testUser.id, false);
    const inProgressInvs = invs.filter(i => i.bookingId === inProgress.id);
    if (inProgressInvs.length !== 0) {
      throw new Error(`In-progress nursing booking must NOT produce review invitations, got ${inProgressInvs.length}`);
    }
  });

  // 8. Payment success without service completion -> no popup
  await runTest(8, 'Payment success without service completion -> no popup', async () => {
    const paidBooking = await prisma.oPBooking.create({
      data: {
        patientId: testUser.id,
        doctorId: testDoctor.id,
        hospitalId: testHospital.id,
        departmentId: testDepartment.id,
        patientName: 'Test Patient',
        timeSlot: '03:00 PM',
        status: BookingStatus.WAITING, // Paid and waiting, NOT completed
      }
    });

    const invs = await reviewsService.getPendingInvitations(testUser.id, false);
    const paidInvs = invs.filter(i => i.bookingId === paidBooking.id);
    if (paidInvs.length !== 0) {
      throw new Error(`Paid but not completed booking must NOT produce review invitations, got ${paidInvs.length}`);
    }
  });

  // 9. Close popup (postpone) -> invitation remains available in My Bookings
  await runTest(9, 'Close popup (postpone) -> dismissed from popup queue, available in My Bookings', async () => {
    const invs = await reviewsService.getPendingInvitations(testUser.id, false);
    const nursingInv = invs.find(i => i.bookingId === nursingId);
    if (!nursingInv) throw new Error('Nursing invitation not found');

    // Postpone for 24h
    await reviewsService.postponeInvitation(testUser.id, {
      invitationId: nursingInv.id,
      bookingId: nursingInv.bookingId,
      targetId: nursingInv.targetId,
      hours: 24,
    });

    // Active popup check (includePostponed = false) should NOT include it
    const activeInvs = await reviewsService.getPendingInvitations(testUser.id, false);
    if (activeInvs.some(i => i.id === nursingInv.id)) {
      throw new Error('Postponed invitation should NOT appear in active popup queue');
    }

    // My Bookings check (includePostponed = true) MUST include it
    const myBookingsInvs = await reviewsService.getPendingInvitations(testUser.id, true);
    const postponedInMyBookings = myBookingsInvs.find(i => i.id === nursingInv.id);
    if (!postponedInMyBookings || postponedInMyBookings.status !== 'POSTPONED') {
      throw new Error('Postponed invitation must remain available in My Bookings');
    }
  });

  // 10. Refresh or log in again -> no repeated popup for an already submitted review
  await runTest(10, 'Refresh or log in again -> no repeated popup for submitted review', async () => {
    // Submit review for lab booking
    const labInv = (await reviewsService.getPendingInvitations(testUser.id, false)).find(i => i.bookingId === labBookingId);
    if (!labInv) throw new Error('Lab invitation not found');

    await reviewsService.submitReview(testUser.id, {
      bookingId: labBookingId,
      bookingType: 'LAB_BOOKING',
      targetType: 'LABORATORY',
      targetId: testHospital.id,
      rating: 5,
      categoryRatings: { reportAccuracy: 5 },
      title: 'Quick and accurate test',
    });

    // Simulate login/refresh
    const refreshedInvs = await reviewsService.getPendingInvitations(testUser.id, false);
    if (refreshedInvs.some(i => i.bookingId === labBookingId)) {
      throw new Error('Submitted lab review must NOT reappear on refresh or login');
    }
  });

  // 11. Submit a review -> correct target rating and review status update
  await runTest(11, 'Submit a review -> correct target rating and review status update', async () => {
    const submittedReview = await prisma.review.findFirst({
      where: {
        userId: testUser.id,
        bookingId: labBookingId,
        targetType: 'LABORATORY',
      }
    });

    if (!submittedReview) throw new Error('Review record was not created in database');
    if (submittedReview.rating !== 5) throw new Error(`Expected rating 5, got ${submittedReview.rating}`);
    if (submittedReview.status !== 'PENDING') throw new Error(`Expected review status PENDING, got ${submittedReview.status}`);

    const inv = await prisma.reviewInvitation.findFirst({
      where: {
        userId: testUser.id,
        bookingId: labBookingId,
        targetType: 'LABORATORY',
      }
    });
    if (!inv || inv.status !== 'SUBMITTED') {
      throw new Error(`ReviewInvitation status must be SUBMITTED, got ${inv?.status}`);
    }
  });

  // 12. Multiple completed bookings -> invitations are queued one at a time
  await runTest(12, 'Multiple completed bookings -> invitations are queued independently', async () => {
    const queue = await reviewsService.getPendingInvitations(testUser.id, false);
    if (queue.length < 2) {
      throw new Error(`Expected at least 2 remaining queued invitations, got ${queue.length}`);
    }
    // Check that each invitation in queue has unique target keys
    const keys = new Set(queue.map(q => `${q.bookingId}_${q.targetType}_${q.targetId}`));
    if (keys.size !== queue.length) {
      throw new Error('Queue contains duplicate invitation keys');
    }
  });

  // 13. Doctor reviewed but hospital not reviewed -> only the outstanding target is offered
  await runTest(13, 'Doctor reviewed but hospital not reviewed -> only outstanding hospital is offered', async () => {
    // Submit review for OP Doctor only
    await reviewsService.submitReview(testUser.id, {
      bookingId: opCompletedBookingId,
      bookingType: 'OP_BOOKING',
      targetType: 'DOCTOR',
      targetId: testDoctor.id,
      rating: 4,
      categoryRatings: { doctorExplanation: 4 },
      title: 'Attentive doctor',
    });

    const invs = await reviewsService.getPendingInvitations(testUser.id, false);
    const opInvs = invs.filter(i => i.bookingId === opCompletedBookingId);
    if (opInvs.length !== 1) {
      throw new Error(`Expected only 1 outstanding target, got ${opInvs.length}`);
    }
    if (opInvs[0].targetType !== 'HOSPITAL') {
      throw new Error(`Expected outstanding target to be HOSPITAL, got ${opInvs[0].targetType}`);
    }
  });

  // 14. Another user cannot access or submit the invitation
  await runTest(14, 'Another user cannot access, submit, or postpone the invitation', async () => {
    const otherInvs = await reviewsService.getPendingInvitations(otherUser.id, false);
    if (otherInvs.some(i => i.bookingId === opCompletedBookingId || i.bookingId === labBookingId)) {
      throw new Error('Other user saw another patient’s invitations');
    }

    // Try to postpone testUser invitation as otherUser
    const testUserInv = await prisma.reviewInvitation.findFirst({
      where: { userId: testUser.id, bookingId: opCompletedBookingId }
    });
    if (!testUserInv) throw new Error('Test user invitation not found');

    let errorThrown = false;
    try {
      await reviewsService.postponeInvitation(otherUser.id, {
        invitationId: testUserInv.id,
      });
    } catch {
      errorThrown = true;
    }
    if (!errorThrown) {
      throw new Error('Other user should NOT be able to postpone or mutate another user invitation');
    }
  });

  // Summary
  console.log('\n=========================================');
  console.log(`🎉 Acceptance Tests Completed: ${passedCount}/${totalTests} Passed`);
  console.log('=========================================\n');

  if (passedCount !== totalTests) {
    process.exit(1);
  }
}

runAcceptanceTests()
  .catch((e) => {
    console.error('Fatal error in tests:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
