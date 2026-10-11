import { prisma } from '../config/prisma';
import { Role } from '@prisma/client';
import { isNotificationAuthorizedForUser, buildNotificationWhereClause } from '../modules/notifications/notifications.service';

const API_BASE = 'http://localhost:5000/api/v1';

async function apiPost(endpoint: string, data: any, headers: Record<string, string> = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  return { status: res.status, ok: res.ok, data: json };
}

async function apiGet(endpoint: string, headers: Record<string, string> = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'GET',
    headers: { ...headers }
  });
  const json = await res.json();
  return { status: res.status, ok: res.ok, data: json };
}

async function runTests() {
  console.log('================================================================');
  console.log('STARTING NOTIFICATION ROUTING AND ROLE-BASED VISIBILITY TESTS');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${msg}`);
      failed++;
    }
  }

  // --- UNIT / EVALUATION TESTS ---
  console.log('Test Suite 1: Pure Authorization Logic (isNotificationAuthorizedForUser)');
  
  const labNotif = {
    id: 'test-lab-1',
    hospitalId: 'hosp-1',
    userId: null,
    title: 'New Lab Test Order',
    message: 'New Walk-in order placed by Patient',
    type: 'lab',
    metadata: { targetRoles: ['LAB_ADMIN', 'HOSPITAL_ADMIN'] }
  };

  const opNotif = {
    id: 'test-op-1',
    hospitalId: 'hosp-1',
    userId: 'doctor-1',
    title: 'New OP Appointment',
    message: 'Patient booked with Dr. Smith',
    type: 'appointment',
    metadata: { targetRoles: ['RECEPTIONIST', 'HOSPITAL_ADMIN', 'DOCTOR'] }
  };

  const nursingNotif = {
    id: 'test-nursing-1',
    hospitalId: 'hosp-1',
    userId: null,
    title: 'New Home Nursing Booking',
    message: 'Patient booked Catheter care',
    type: 'activity',
    metadata: { targetRoles: ['HOSPITAL_ADMIN', 'NURSE'] }
  };

  const patientNotif = {
    id: 'test-patient-1',
    hospitalId: null,
    userId: 'patient-1',
    title: 'Booking Confirmed',
    message: 'Your booking is confirmed',
    type: 'BOOKING_CONFIRMED',
    metadata: { targetRoles: ['PATIENT'] }
  };

  // 1. Receptionist isolation
  assert(!isNotificationAuthorizedForUser(labNotif, Role.RECEPTIONIST, 'rec-1', 'hosp-1'),
    'Receptionist CANNOT see Lab Test Orders');
  assert(!isNotificationAuthorizedForUser(nursingNotif, Role.RECEPTIONIST, 'rec-1', 'hosp-1'),
    'Receptionist CANNOT see Home Nursing Bookings');
  assert(isNotificationAuthorizedForUser(opNotif, Role.RECEPTIONIST, 'rec-1', 'hosp-1'),
    'Receptionist CAN see OP Appointment notifications for their hospital');
  assert(!isNotificationAuthorizedForUser(opNotif, Role.RECEPTIONIST, 'rec-1', 'hosp-2'),
    'Receptionist CANNOT see appointments from another hospital');

  // 2. Patient isolation
  assert(!isNotificationAuthorizedForUser(labNotif, Role.PATIENT, 'patient-1', null),
    'Patient CANNOT see internal Lab Test Orders');
  assert(!isNotificationAuthorizedForUser(opNotif, Role.PATIENT, 'patient-1', null),
    'Patient CANNOT see internal OP Appointment alerts');
  assert(isNotificationAuthorizedForUser(patientNotif, Role.PATIENT, 'patient-1', null),
    'Patient CAN see their own Booking Confirmed notification');
  assert(!isNotificationAuthorizedForUser(patientNotif, Role.PATIENT, 'patient-2', null),
    'Another Patient CANNOT see patient-1 notification');

  // 3. Lab Admin isolation
  assert(isNotificationAuthorizedForUser(labNotif, Role.LAB_ADMIN, 'lab-1', 'hosp-1'),
    'Lab Admin CAN see Lab Test Orders for their hospital');
  assert(!isNotificationAuthorizedForUser(opNotif, Role.LAB_ADMIN, 'lab-1', 'hosp-1'),
    'Lab Admin CANNOT see OP Appointment alerts');
  assert(!isNotificationAuthorizedForUser(nursingNotif, Role.LAB_ADMIN, 'lab-1', 'hosp-1'),
    'Lab Admin CANNOT see Home Nursing bookings');

  // 4. Doctor isolation
  assert(isNotificationAuthorizedForUser(opNotif, Role.DOCTOR, 'doctor-1', 'hosp-1'),
    'Assigned Doctor CAN see their own appointment');
  assert(!isNotificationAuthorizedForUser(opNotif, Role.DOCTOR, 'doctor-2', 'hosp-1'),
    'Different Doctor CANNOT see another doctor appointment');
  assert(!isNotificationAuthorizedForUser(labNotif, Role.DOCTOR, 'doctor-1', 'hosp-1'),
    'Doctor CANNOT see walk-in lab orders');

  // 5. Nurse isolation
  assert(isNotificationAuthorizedForUser(nursingNotif, Role.NURSE, 'nurse-1', 'hosp-1'),
    'Nurse CAN see Home Nursing Bookings for their hospital');
  assert(!isNotificationAuthorizedForUser(labNotif, Role.NURSE, 'nurse-1', 'hosp-1'),
    'Nurse CANNOT see Lab Test Orders');
  assert(!isNotificationAuthorizedForUser(opNotif, Role.NURSE, 'nurse-1', 'hosp-1'),
    'Nurse CANNOT see Doctor OP appointments');

  // 6. Hospital Admin oversight
  assert(isNotificationAuthorizedForUser(labNotif, Role.HOSPITAL_ADMIN, 'admin-1', 'hosp-1'),
    'Hospital Admin CAN see Lab orders for their hospital');
  assert(isNotificationAuthorizedForUser(opNotif, Role.HOSPITAL_ADMIN, 'admin-1', 'hosp-1'),
    'Hospital Admin CAN see OP appointments for their hospital');
  assert(isNotificationAuthorizedForUser(nursingNotif, Role.HOSPITAL_ADMIN, 'admin-1', 'hosp-1'),
    'Hospital Admin CAN see Home nursing bookings for their hospital');
  assert(!isNotificationAuthorizedForUser(labNotif, Role.HOSPITAL_ADMIN, 'admin-1', 'hosp-2'),
    'Hospital Admin CANNOT see notifications from another hospital');

  console.log('\nTest Suite 2: Real Authenticated API Endpoints');

  try {
    // Helper to log in
    async function login(identifier: string, pass: string) {
      const res = await apiPost('/auth/login', {
        identifier,
        password: pass
      });
      const token = res.data.data?.token || res.data.token;
      const user = res.data.data?.user || res.data.user;
      return {
        token,
        user
      };
    }

    // 1. Receptionist Test
    console.log('\n--- 2.1 Testing Receptionist Account (receptionist2@gmail.com) ---');
    const recAuth = await login('receptionist2@gmail.com', '123456');
    const recHeaders = { Authorization: `Bearer ${recAuth.token}` };

    const recNotifsRes = await apiGet('/notifications', recHeaders);
    const recNotifs = recNotifsRes.data.data;
    assert(recNotifsRes.data.success === true, 'Receptionist notifications API returned 200 OK');

    const recHasLab = recNotifs.some((n: any) => n.type === 'lab' || n.title.toLowerCase().includes('lab'));
    assert(!recHasLab, 'Receptionist view contains 0 Lab Test Order notifications');

    const recHasHomeNursing = recNotifs.some((n: any) => n.title.toLowerCase().includes('home nursing') || n.title.toLowerCase().includes('home visit'));
    assert(!recHasHomeNursing, 'Receptionist view contains 0 Home Nursing / Home Visit notifications');

    const recUnreadRes = await apiGet('/notifications/unread-count', recHeaders);
    assert(typeof recUnreadRes.data.data.unreadCount === 'number', 'Receptionist unread-count returned valid integer');

    // 2. Lab Admin Test
    console.log('\n--- 2.2 Testing Lab Admin Account (lab1@gmail.com) ---');
    const labAuth = await login('lab1@gmail.com', '123456');
    const labHeaders = { Authorization: `Bearer ${labAuth.token}` };

    const labNotifsRes = await apiGet('/notifications', labHeaders);
    const labNotifs = labNotifsRes.data.data;
    assert(labNotifsRes.data.success === true, 'Lab Admin notifications API returned 200 OK');

    const labHasOps = labNotifs.some((n: any) => n.type === 'appointment' || n.title.toLowerCase().includes('new op appointment'));
    assert(!labHasOps, 'Lab Admin view contains 0 Doctor OP Appointment notifications');

    const labHasNursing = labNotifs.some((n: any) => n.title.toLowerCase().includes('home nursing'));
    assert(!labHasNursing, 'Lab Admin view contains 0 Home Nursing notifications');

    // 3. Doctor Test
    console.log('\n--- 2.3 Testing Doctor Account (doctor5@gmail.com) ---');
    const docAuth = await login('doctor5@gmail.com', '123456');
    const docHeaders = { Authorization: `Bearer ${docAuth.token}` };

    const docNotifsRes = await apiGet('/notifications', docHeaders);
    const docNotifs = docNotifsRes.data.data;
    assert(docNotifsRes.data.success === true, 'Doctor notifications API returned 200 OK');

    const docOnlyAssigned = docNotifs.every((n: any) => n.userId === docAuth.user.id);
    assert(docOnlyAssigned, 'Doctor view strictly contains ONLY notifications targeted to Doctor5');

    const docHasWalkInLab = docNotifs.some((n: any) => n.title === 'New Lab Test Order');
    assert(!docHasWalkInLab, 'Doctor view contains 0 walk-in Lab Test Order notifications');

    // 3.1 Nurse Test
    console.log('\n--- 2.3.1 Testing Nurse Account (nurse2@gmail.com) ---');
    const nurseAuth = await login('nurse2@gmail.com', '123456');
    const nurseHeaders = { Authorization: `Bearer ${nurseAuth.token}` };

    const nurseNotifsRes = await apiGet('/notifications', nurseHeaders);
    const nurseNotifs = nurseNotifsRes.data.data;
    assert(nurseNotifsRes.data.success === true, 'Nurse notifications API returned 200 OK');

    const nurseHasLab = nurseNotifs.some((n: any) => n.title === 'New Lab Test Order');
    assert(!nurseHasLab, 'Nurse view contains 0 walk-in Lab Test Order notifications');

    const nurseHasOps = nurseNotifs.some((n: any) => n.type === 'appointment' && !n.title.toLowerCase().includes('home') && !n.title.toLowerCase().includes('nurse'));
    assert(!nurseHasOps, 'Nurse view contains 0 Doctor OP Appointment notifications');

    // 4. Patient 1 Test
    console.log('\n--- 2.4 Testing Patient Account (mytest@mediquee.com) ---');
    const pat1Auth = await login('mytest@mediquee.com', '123456');
    const pat1Headers = { Authorization: `Bearer ${pat1Auth.token}` };

    const pat1NotifsRes = await apiGet('/notifications', pat1Headers);
    const pat1Notifs = pat1NotifsRes.data.data;
    assert(pat1NotifsRes.data.success === true, 'Patient 1 notifications API returned 200 OK');

    const pat1HasInternalHospital = pat1Notifs.some((n: any) => 
      n.title === 'New Lab Test Order' ||
      n.title === 'New OP Appointment' ||
      n.title === 'Walk-In OP Registered' ||
      n.title === 'New Home Nursing Booking'
    );
    assert(!pat1HasInternalHospital, 'Patient 1 view contains 0 internal hospital operational notifications');

    const pat1OnlyOwn = pat1Notifs.every((n: any) => n.userId === pat1Auth.user.id);
    assert(pat1OnlyOwn, 'Patient 1 view contains strictly their own notifications');

    // 5. Patient 2 Isolation Test
    console.log('\n--- 2.5 Testing Patient 2 Isolation (patient_1788782064112@example.com) ---');
    const pat2Auth = await login('patient_1788782064112@example.com', 'Password@123');
    const pat2Headers = { Authorization: `Bearer ${pat2Auth.token}` };

    const pat2NotifsRes = await apiGet('/notifications', pat2Headers);
    const pat2Notifs = pat2NotifsRes.data.data;
    
    const pat2ContainsPat1Notif = pat2Notifs.some((n: any) => n.userId === pat1Auth.user.id);
    assert(!pat2ContainsPat1Notif, 'Patient 2 CANNOT access any notification belonging to Patient 1');

    // 6. Hospital Admin Test
    console.log('\n--- 2.6 Testing Hospital Admin Account (gorkalsreenu10@gmail.com) ---');
    const adminAuth = await login('gorkalsreenu10@gmail.com', '123456');
    const adminHeaders = { Authorization: `Bearer ${adminAuth.token}` };

    const adminNotifsRes = await apiGet('/notifications', adminHeaders);
    const adminNotifs = adminNotifsRes.data.data;
    assert(adminNotifsRes.data.success === true, 'Hospital Admin notifications API returned 200 OK');

    const adminCrossHospital = adminNotifs.some((n: any) => n.hospitalId && n.hospitalId !== adminAuth.user.hospitalId);
    assert(!adminCrossHospital, 'Hospital Admin view contains 0 notifications from other hospitals');

    // 7. Security Spoofing Test
    console.log('\n--- 2.7 Testing Client Query Spoofing Attack Prevention ---');
    const spoofRes = await apiGet(`/notifications?hospitalId=${adminAuth.user.hospitalId}`, pat1Headers);
    const spoofNotifs = spoofRes.data.data;
    const spoofLeakedHospitalAlert = spoofNotifs.some((n: any) => n.title === 'New Lab Test Order' || n.title === 'New OP Appointment');
    assert(!spoofLeakedHospitalAlert, 'Client-supplied hospitalId query parameter was ignored; no leak occurred');

  } catch (err: any) {
    console.error('Error during API tests:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
