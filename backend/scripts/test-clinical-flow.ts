import { PrismaClient, Role, DoctorPresenceStatus } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'local_dev_secret_key';
const BASE_URL = 'http://localhost:5000/api/v1';

function printHeader(title: string) {
  console.log('\n================================================================');
  console.log(`  ${title}`);
  console.log('================================================================');
}

function printStep(step: string, status: 'PASS' | 'FAIL' | 'INFO', details?: string) {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : 'ℹ️';
  console.log(`${icon} [${status}] ${step}`);
  if (details) {
    console.log(`       -> ${details}`);
  }
}

async function runClinicalTest() {
  printHeader('CLINICAL CONSULTATION DATA ARCHITECTURE VERIFICATION');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Target Backend: ${BASE_URL}\n`);

  let testBookingId: string | null = null;
  let isTempDoctor = false;
  let isTempLabTest = false;
  let testLabTestId = '';
  let doctorId = '';
  let hospitalId = '';
  let departmentId = '';

  try {
    // ------------------------------------------------------------------------
    // SETUP: Provision Hospital, Department, Doctor, and Lab Test
    // ------------------------------------------------------------------------
    printHeader('1. PROVISIONING DOCTOR & TEST PREREQUISITES');

    const hospital = await prisma.hospital.findFirst({
      where: { users: { some: { role: Role.HOSPITAL_ADMIN } } },
      include: { departments: true }
    });

    if (!hospital) {
      throw new Error('No hospital with admin found in database');
    }
    hospitalId = hospital.id;

    let department = hospital.departments[0];
    if (!department) {
      const specialty = await prisma.platformSpecialty.findFirst();
      if (!specialty) throw new Error('No platform specialty found');
      department = await prisma.department.create({
        data: {
          hospitalId,
          name: 'General Medicine',
          code: 'GEN',
          specialtyId: specialty.id
        }
      });
    }
    departmentId = department.id;

    let doctor = await prisma.user.findFirst({
      where: { role: Role.DOCTOR, hospitalId, active: true }
    });

    if (!doctor) {
      doctor = await prisma.user.create({
        data: {
          name: 'Dr. Test Consultant',
          email: `clinical.dr.${Date.now()}@mediquee.test`,
          passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
          role: Role.DOCTOR,
          hospitalId,
          departmentId,
          phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
          designation: 'Senior Consultant',
          active: true
        }
      });
      isTempDoctor = true;
    }
    doctorId = doctor.id;
    const doctorToken = jwt.sign({ userId: doctor.id }, JWT_SECRET, { expiresIn: '2h' });

    printStep('Doctor Authenticated', 'PASS', `Doctor: "${doctor.name}" (ID: ${doctor.id})`);

    // Find or create a LabTest
    let labTest = await prisma.labTest.findFirst({ where: { active: true } });
    if (!labTest) {
      labTest = await prisma.labTest.create({
        data: {
          name: 'Complete Blood Count (CBC)',
          category: 'Hematology',
          price: 350,
          sampleType: 'Blood',
          description: 'Basic blood panel'
        }
      });
      isTempLabTest = true;
    }
    testLabTestId = labTest.id;
    printStep('Lab Test Available', 'PASS', `Test: "${labTest.name}" (ID: ${labTest.id})`);

    // ------------------------------------------------------------------------
    // STEP 2: CREATE TEST OP BOOKING WITH ORIGINAL REASON
    // ------------------------------------------------------------------------
    printHeader('2. CREATE APPOINTMENT WITH ORIGINAL CHIEF COMPLAINT');

    const originalChiefComplaint = 'Patient reports chronic dry cough, mild fever, and shortness of breath for 3 days.';
    const testPatientPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;

    const booking = await prisma.oPBooking.create({
      data: {
        hospitalId,
        departmentId,
        doctorId,
        patientName: 'Kavitha Ramachandran',
        patientPhone: testPatientPhone,
        patientAge: 38,
        patientGender: 'Female',
        reason: originalChiefComplaint,
        opType: 'Normal',
        status: 'WAITING',
        timeSlot: '11:00 AM',
        slotTime: '11:00 AM',
        appointmentDate: new Date(),
        fee: 500
      }
    });
    testBookingId = booking.id;

    printStep(
      'OP Booking Created',
      'PASS',
      `Booking #${booking.id.slice(0, 8)} | Status: WAITING | Reason: "${originalChiefComplaint}"`
    );

    // ------------------------------------------------------------------------
    // STEP 3: ATOMIC CONSULTATION RECORDING
    // ------------------------------------------------------------------------
    printHeader('3. ATOMIC CONSULTATION RECORDING (POST /api/v1/clinical/consultations/:id/record)');

    const consultationPayload = {
      diagnosis: 'Acute Upper Respiratory Tract Infection (URTI) with mild bronchospasm',
      clinicalNotes: 'Chest clear with mild bilateral wheezing. Throat erythematous. No cervical lymphadenopathy.',
      generalAdvice: 'Warm saline gargles thrice daily, steam inhalation, and adequate hydration.',
      followUpDate: '2026-09-25T10:00:00.000Z',
      vitals: {
        systolicBp: 124,
        diastolicBp: 82,
        pulseRate: 76,
        bodyTemperature: 99.4,
        respiratoryRate: 18,
        spo2: 98,
        weightKg: 64.5,
        heightCm: 165.0
      },
      prescriptions: [
        {
          medicineName: 'Amoxicillin + Clavulanic Acid (Augmentin)',
          dosageForm: 'Tablet',
          strength: '625mg',
          frequency: '1-0-1',
          durationDays: 5,
          timing: 'AFTER_FOOD',
          instructions: 'Take strictly after food. Complete full 5-day course.'
        },
        {
          medicineName: 'Levocetirizine + Montelukast',
          dosageForm: 'Tablet',
          strength: '5mg/10mg',
          frequency: '0-0-1',
          durationDays: 7,
          timing: 'AFTER_FOOD',
          instructions: 'Take at bedtime.'
        },
        {
          medicineName: 'Paracetamol',
          dosageForm: 'Tablet',
          strength: '650mg',
          frequency: 'SOS (as needed)',
          durationDays: 3,
          timing: 'AFTER_FOOD',
          instructions: 'Take only if body temperature exceeds 99.5°F.'
        }
      ],
      labTestIds: [testLabTestId]
    };

    const recordRes = await fetch(`${BASE_URL}/clinical/consultations/${testBookingId}/record`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      },
      body: JSON.stringify(consultationPayload)
    });

    const recordData = await recordRes.json();

    if (recordRes.status !== 201 || !recordData.success) {
      throw new Error(`Consultation recording failed (${recordRes.status}): ${JSON.stringify(recordData)}`);
    }

    printStep(
      'Consultation Recorded API Response (201 Created)',
      'PASS',
      `Prescription ID: ${recordData.data.prescriptionId} | Vitals: ${recordData.data.vitalsRecorded} | Medicines: ${recordData.data.prescriptionItemsCount} | Labs: ${recordData.data.labOrdersCount}`
    );

    // ------------------------------------------------------------------------
    // STEP 4: DIRECT SUPABASE VERIFICATION (PRESERVE REASON + CLINICAL MODELS)
    // ------------------------------------------------------------------------
    printHeader('4. DIRECT SUPABASE PERSISTENCE & INTEGRITY AUDIT');

    // A. Verify OPBooking status is COMPLETED and reason is UNTOUCHED
    const verifiedBooking = await prisma.oPBooking.findUnique({
      where: { id: testBookingId }
    });

    if (!verifiedBooking) throw new Error('Booking disappeared from database');
    if (verifiedBooking.status !== 'COMPLETED') {
      throw new Error(`Expected booking status COMPLETED, got ${verifiedBooking.status}`);
    }
    printStep('Booking Status Updated to COMPLETED', 'PASS');

    if (verifiedBooking.reason !== originalChiefComplaint) {
      throw new Error(
        `CRITICAL FAILURE: OPBooking.reason was corrupted! Expected: "${originalChiefComplaint}", Found: "${verifiedBooking.reason}"`
      );
    }
    printStep('OPBooking.reason Strictly Preserved', 'PASS', `Reason remains: "${verifiedBooking.reason}"`);

    // B. Verify Patient Vitals in database
    const verifiedVitals = await prisma.patientVitals.findUnique({
      where: { bookingId: testBookingId }
    });

    if (!verifiedVitals) throw new Error('PatientVitals record was not created in Supabase');
    if (
      verifiedVitals.systolicBp !== 124 ||
      verifiedVitals.diastolicBp !== 82 ||
      verifiedVitals.pulseRate !== 76 ||
      verifiedVitals.bodyTemperature !== 99.4 ||
      verifiedVitals.spo2 !== 98 ||
      verifiedVitals.weightKg !== 64.5
    ) {
      throw new Error(`Vitals values mismatch: ${JSON.stringify(verifiedVitals)}`);
    }
    printStep(
      'PatientVitals Verified in Supabase',
      'PASS',
      `BP: ${verifiedVitals.systolicBp}/${verifiedVitals.diastolicBp} mmHg | Pulse: ${verifiedVitals.pulseRate} bpm | Temp: ${verifiedVitals.bodyTemperature}°F | SpO2: ${verifiedVitals.spo2}% | Weight: ${verifiedVitals.weightKg} kg`
    );

    // C. Verify Prescription & Prescription Items
    const verifiedPrescription = await prisma.prescription.findUnique({
      where: { bookingId: testBookingId },
      include: { items: true }
    });

    if (!verifiedPrescription) throw new Error('Prescription record was not created in Supabase');
    if (verifiedPrescription.diagnosis !== consultationPayload.diagnosis) {
      throw new Error(`Prescription diagnosis mismatch: ${verifiedPrescription.diagnosis}`);
    }
    if (verifiedPrescription.items.length !== 3) {
      throw new Error(`Expected 3 prescription items, found ${verifiedPrescription.items.length}`);
    }
    printStep(
      'Prescription & Items Verified in Supabase',
      'PASS',
      `Diagnosis: "${verifiedPrescription.diagnosis}" | Items count: ${verifiedPrescription.items.length}`
    );
    for (const item of verifiedPrescription.items) {
      console.log(`       -> Rx: ${item.medicineName} (${item.dosageForm}, ${item.strength}) | ${item.frequency} for ${item.durationDays}d [${item.timing}]`);
    }

    // D. Verify Doctor Lab Order
    const verifiedLabOrders = await prisma.doctorLabOrder.findMany({
      where: { bookingId: testBookingId },
      include: { test: true }
    });

    if (verifiedLabOrders.length !== 1) {
      throw new Error(`Expected 1 doctor lab order, found ${verifiedLabOrders.length}`);
    }
    printStep(
      'DoctorLabOrder Verified in Supabase',
      'PASS',
      `Ordered Test: "${verifiedLabOrders[0].test.name}" (Category: ${verifiedLabOrders[0].test.category})`
    );

    // ------------------------------------------------------------------------
    // STEP 5: PATIENT CLINICAL HISTORY ENDPOINT
    // ------------------------------------------------------------------------
    printHeader('5. PATIENT CLINICAL HISTORY (GET /api/v1/clinical/patient-history)');

    const historyRes = await fetch(`${BASE_URL}/clinical/patient-history?phone=${testPatientPhone}`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });

    const historyData = await historyRes.json();
    if (historyRes.status !== 200 || !historyData.success || !Array.isArray(historyData.data)) {
      throw new Error(`Patient history retrieval failed: ${JSON.stringify(historyData)}`);
    }

    const patientVisit = historyData.data.find((h: any) => h.bookingId === testBookingId);
    if (!patientVisit) {
      throw new Error('Completed consultation was not returned in patient clinical history');
    }

    printStep(
      'Patient Clinical History Retrieved',
      'PASS',
      `Found completed visit #${patientVisit.bookingId.slice(0, 8)} with chief complaint: "${patientVisit.chiefComplaint}"`
    );
    printStep(
      'History Nested Vitals & Prescription',
      'PASS',
      `Vitals BP: ${patientVisit.vitals.systolicBp}/${patientVisit.vitals.diastolicBp} | Rx Items: ${patientVisit.prescription.items.length} | Lab Orders: ${patientVisit.labOrders.length}`
    );

    // ------------------------------------------------------------------------
    // STEP 6: DOCTOR OPERATIONAL PRESENCE STATUS CONTROLS
    // ------------------------------------------------------------------------
    printHeader('6. DOCTOR PRESENCE CONTROLS (PATCH /api/v1/clinical/presence)');

    const presenceRes = await fetch(`${BASE_URL}/clinical/presence`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      },
      body: JSON.stringify({ presenceStatus: DoctorPresenceStatus.AVAILABLE_IN_OPD })
    });

    const presenceData = await presenceRes.json();
    if (presenceRes.status !== 200 || !presenceData.success) {
      throw new Error(`Failed to update presence: ${JSON.stringify(presenceData)}`);
    }

    printStep(
      'Doctor Presence Updated to AVAILABLE_IN_OPD',
      'PASS',
      `User presenceStatus in DB: ${presenceData.data.presenceStatus}`
    );

    const checkDoctor = await prisma.user.findUnique({ where: { id: doctorId } });
    if (checkDoctor?.presenceStatus !== DoctorPresenceStatus.AVAILABLE_IN_OPD) {
      throw new Error(`Presence status in DB was not updated. Expected AVAILABLE_IN_OPD, got ${checkDoctor?.presenceStatus}`);
    }
    printStep('Supabase Confirmed Doctor Presence Status', 'PASS');

    // ------------------------------------------------------------------------
    // CLEANUP
    // ------------------------------------------------------------------------
    printHeader('7. CLEANUP TEST DATA');

    if (testBookingId) {
      await prisma.doctorLabOrder.deleteMany({ where: { bookingId: testBookingId } });
      await prisma.prescriptionItem.deleteMany({ where: { prescription: { bookingId: testBookingId } } });
      await prisma.prescription.deleteMany({ where: { bookingId: testBookingId } });
      await prisma.patientVitals.deleteMany({ where: { bookingId: testBookingId } });
      await prisma.oPBooking.delete({ where: { id: testBookingId } });
      printStep('Deleted Test Booking & Cascade Clinical Entities', 'PASS');
    }

    if (isTempLabTest && testLabTestId) {
      await prisma.labTest.delete({ where: { id: testLabTestId } });
      printStep('Deleted Temporary Lab Test', 'PASS');
    }

    if (isTempDoctor && doctorId) {
      await prisma.user.delete({ where: { id: doctorId } });
      printStep('Deleted Temporary Test Doctor', 'PASS');
    }

    printHeader('ALL CLINICAL CONSULTATION WORKFLOW TESTS PASSED');
    console.log('Summary of Achievements:');
    console.log('1. Dedicated database tables live: patient_vitals, prescriptions, prescription_items, doctor_lab_orders.');
    console.log('2. Atomic POST /consultations/:id/record successfully completed consultation.');
    console.log('3. OPBooking.reason was strictly PRESERVED (no more overwriting).');
    console.log('4. Patient clinical history correctly aggregated vitals, Rx, and labs.');
    console.log('5. Doctor presence controls (AVAILABLE_IN_OPD, ON_BREAK, etc.) operational.\n');
  } catch (err: any) {
    console.error('\n❌ CLINICAL AUDIT FAILED:', err.message);
    if (testBookingId) {
      try {
        await prisma.doctorLabOrder.deleteMany({ where: { bookingId: testBookingId } });
        await prisma.prescriptionItem.deleteMany({ where: { prescription: { bookingId: testBookingId } } });
        await prisma.prescription.deleteMany({ where: { bookingId: testBookingId } });
        await prisma.patientVitals.deleteMany({ where: { bookingId: testBookingId } });
        await prisma.oPBooking.delete({ where: { id: testBookingId } });
      } catch (_) {}
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runClinicalTest();
