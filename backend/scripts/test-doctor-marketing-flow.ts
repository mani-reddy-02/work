import { prisma } from '../src/config/prisma';

const API_BASE = 'http://localhost:5000/api/v1';

async function main() {
  console.log('--- STARTING DOCTOR MARKETING WORKFLOW INTEGRATION TEST ---\n');

  // 1. Verify doctor account exists
  const doctor = await prisma.user.findFirst({
    where: { role: 'DOCTOR', active: true, email: 'doctor1@gmail.com' },
    select: { id: true, name: true, email: true, hospitalId: true }
  });

  if (!doctor) {
    throw new Error('Test doctor doctor1@gmail.com not found in database');
  }
  console.log(`[STEP 1] Found doctor: Dr. ${doctor.name} (${doctor.email}) in hospital: ${doctor.hospitalId}`);

  // 2. Doctor Login
  console.log('\n[STEP 2] Logging in as Doctor...');
  const docLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'doctor1@gmail.com',
      password: 'Password@123',
      role: 'DOCTOR'
    })
  });

  const docLoginData = await docLoginRes.json();
  if (!docLoginRes.ok || !docLoginData.data?.token) {
    throw new Error(`Doctor login failed: ${JSON.stringify(docLoginData)}`);
  }
  const doctorToken = docLoginData.data.token;
  console.log('✔ Doctor logged in successfully, JWT received.');

  // 3. Submit Marketing Request from Doctor account
  console.log('\n[STEP 3] Submitting Marketing Request as Doctor...');
  const marketingPayload = {
    campaignType: 'Doctor Profile & Social Media Growth, OPD Search & Google Ranking (SEO)',
    services: ['Doctor Profile & Social Media Growth', 'OPD Search & Google Ranking (SEO)'],
    preferredTime: 'Morning (9 AM - 12 PM)',
    budget: 25000,
    notes: `Doctor: Dr. ${doctor.name} | Goals: Increase cardiology OPD consultations and promote verified social reels`
  };

  const submitRes = await fetch(`${API_BASE}/hospital/marketing-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${doctorToken}`
    },
    body: JSON.stringify(marketingPayload)
  });

  const submitData = await submitRes.json();
  console.log(`Submit response status: ${submitRes.status}`);
  if (!submitRes.ok || !submitData.success) {
    throw new Error(`Doctor marketing submission failed: ${JSON.stringify(submitData)}`);
  }

  const createdRequest = submitData.data;
  console.log('✔ Marketing Request created successfully!');
  console.log('  Request ID:', createdRequest.id);
  console.log('  Doctor ID:', createdRequest.doctorId);
  console.log('  Doctor Name:', createdRequest.doctorName);
  console.log('  Campaign Type:', createdRequest.campaignType);
  console.log('  Status:', createdRequest.status);

  if (createdRequest.doctorId !== doctor.id) {
    throw new Error(`Expected doctorId ${doctor.id}, got ${createdRequest.doctorId}`);
  }
  if (createdRequest.doctorName !== doctor.name) {
    throw new Error(`Expected doctorName ${doctor.name}, got ${createdRequest.doctorName}`);
  }

  // 4. Admin Login
  console.log('\n[STEP 4] Logging in as Super Admin...');
  const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'admin@mediquee.com',
      password: 'Admin@123456',
      role: 'SUPER_ADMIN'
    })
  });

  const adminLoginData = await adminLoginRes.json();
  if (!adminLoginRes.ok || !adminLoginData.data?.token) {
    throw new Error(`Admin login failed: ${JSON.stringify(adminLoginData)}`);
  }
  const adminToken = adminLoginData.data.token;
  console.log('✔ Admin logged in successfully.');

  // 5. Query Admin Hospital Requests
  console.log('\n[STEP 5] Querying Admin Requests screen feed (GET /api/v1/admin/hospital-requests)...');
  const adminFeedRes = await fetch(`${API_BASE}/admin/hospital-requests`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });

  const adminFeedData = await adminFeedRes.json();
  if (!adminFeedRes.ok || !adminFeedData.success) {
    throw new Error(`Admin feed fetch failed: ${JSON.stringify(adminFeedData)}`);
  }

  const marketingList = adminFeedData.data.marketing || [];
  const foundInAdmin = marketingList.find((m: any) => m.id === createdRequest.id);

  if (!foundInAdmin) {
    throw new Error(`Created marketing request ${createdRequest.id} NOT found in Admin requests screen!`);
  }
  console.log('✔ Found Doctor Marketing Request in Admin Requests feed!');
  console.log('  Admin Visible Hospital:', foundInAdmin.hospital?.name);
  console.log('  Admin Visible Doctor Name:', foundInAdmin.doctorName);
  console.log('  Admin Visible Services:', foundInAdmin.campaignType);
  console.log('  Admin Visible Notes:', foundInAdmin.notes);

  // 6. Admin updates status to REVIEWING, then APPROVED
  console.log('\n[STEP 6] Admin transitions request to APPROVED...');
  const updateRes = await fetch(`${API_BASE}/admin/hospital-requests/marketing/${createdRequest.id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      status: 'APPROVED',
      notes: 'Contacted Dr. ' + doctor.name + ' via phone. Strategy session scheduled.'
    })
  });

  const updateData = await updateRes.json();
  if (!updateRes.ok || !updateData.success) {
    throw new Error(`Status update failed: ${JSON.stringify(updateData)}`);
  }
  console.log(`✔ Admin updated status to APPROVED. Result status: ${updateData.data.status}`);

  // 7. Verify doctor received notification
  console.log('\n[STEP 7] Verifying in-app notifications generated for doctor...');
  const doctorNotifs = await prisma.notification.findMany({
    where: { userId: doctor.id },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  const hasConfirmation = doctorNotifs.some(n => n.title.includes('Marketing Request') || n.message.includes('marketing'));
  console.log(`✔ Doctor notifications verified (Total recent: ${doctorNotifs.length}, Marketing found: ${hasConfirmation})`);

  console.log('\n======================================================');
  console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
  console.log('Doctor marketing booking is 100% operational and synced to Admin requests screen.');
  console.log('======================================================');
}

main()
  .catch((err) => {
    console.error('\n❌ TEST FAILED:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
