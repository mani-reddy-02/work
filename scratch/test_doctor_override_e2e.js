const http = require('http');

function post(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body || {});
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers,
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch (e) {
          resolve({ status: res.statusCode, raw });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function patch(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body || {});
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'PATCH',
      headers,
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch (e) {
          resolve({ status: res.statusCode, raw });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'GET',
      headers,
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch (e) {
          resolve({ status: res.statusCode, raw });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('=== TEST DOCTOR ACTIVE/INACTIVE OVERRIDE & USER HIDING E2E ===\n');

  // 1. Logins
  console.log('1. Logging in Receptionist, Doctor, Patient...');
  const recLogin = await post('/api/v1/auth/login', { email: 'receptionist2@gmail.com', password: 'password123' });
  const recToken = recLogin.body.data ? recLogin.body.data.token : (await post('/api/v1/auth/login', { email: 'receptionist2@gmail.com', password: 'Password@123' })).body.data?.token || (await post('/api/v1/auth/login', { email: 'receptionist2@gmail.com', password: '123456' })).body.data?.token;
  console.log('Receptionist login:', recToken ? 'SUCCESS' : 'FAILED');

  const docLogin = await post('/api/v1/auth/login', { email: 'doctor6@gmail.com', password: '123456' });
  const docToken = docLogin.body.data?.token;
  const doctorUser = docLogin.body.data?.user;
  console.log('Doctor login:', docToken ? `SUCCESS (ID: ${doctorUser?.id}, Name: ${doctorUser?.name})` : 'FAILED');

  const patientLogin = await post('/api/v1/auth/login', { email: 'm123456@gmail.com', password: 'password123' });
  const patientToken = patientLogin.body.data?.token || (await post('/api/v1/auth/login', { email: 'm123456@gmail.com', password: '123456' })).body.data?.token;
  console.log('Patient login:', patientToken ? 'SUCCESS' : 'FAILED');

  if (!recToken || !docToken || !doctorUser) {
    console.error('Failed to authenticate');
    process.exit(1);
  }

  const doctorId = doctorUser.id;
  const hospitalId = doctorUser.hospitalId;

  // 2. Initial state: set Sunday schedule ON and ensure doctor is active
  console.log('\n2. Setting doctor Sunday base schedule ON and ensuring active...');
  await post('/api/v1/doctor/schedule', {
    schedule: [
      { day: 'Sunday', active: true, opStartTime: '09:00', opEndTime: '18:00', videoStartTime: '14:00', videoEndTime: '18:00' },
      { day: 'Monday', active: true, opStartTime: '09:00', opEndTime: '18:00', videoStartTime: '14:00', videoEndTime: '18:00' },
    ]
  }, docToken);

  await patch(`/api/v1/doctors/${doctorId}/active-status`, { active: true }, recToken);

  // 3. Receptionist fetches hospital doctors status
  console.log('\n3. Receptionist fetches live doctor status list:');
  const statusRes = await get('/api/v1/doctors/status', recToken);
  const myDocStatus = statusRes.body.data?.find(d => d.doctorId === doctorId);
  console.log('Doctor status in Receptionist portal:', {
    name: myDocStatus?.doctorName,
    effectiveStatus: myDocStatus?.effectiveStatus,
    isTemporarilyInactive: myDocStatus?.isTemporarilyInactive,
    todayShift: myDocStatus?.todayShift
  });

  // 4. Patient checks doctor list before pause
  console.log('\n4. Patient checks doctor listing before override...');
  const publicDocsBefore = await get('/api/v1/doctors', patientToken);
  const foundBefore = publicDocsBefore.body.data?.some(d => d.id === doctorId);
  console.log(`Doctor visible in public doctor listing: ${foundBefore}`);

  const hospDocsBefore = await get(`/api/v1/hospitals/${hospitalId}/doctors`, patientToken);
  const foundHospBefore = hospDocsBefore.body.data?.some(d => d.id === doctorId);
  console.log(`Doctor visible in hospital doctor listing: ${foundHospBefore}`);

  // 5. Receptionist sets doctor to INACTIVE for 2 hours
  console.log('\n5. Receptionist sets doctor to INACTIVE for 2 hours (Reason: "In Emergency Surgery")...');
  const pauseRes = await patch(`/api/v1/doctors/${doctorId}/active-status`, {
    active: false,
    durationHours: 2,
    reason: "In Emergency Surgery"
  }, recToken);
  console.log('Pause response status:', pauseRes.status);
  console.log('Pause response data:', {
    effectiveStatus: pauseRes.body.data?.effectiveStatus,
    isTemporarilyInactive: pauseRes.body.data?.isTemporarilyInactive,
    inactiveReason: pauseRes.body.data?.inactiveReason,
    remainingMinutes: pauseRes.body.data?.remainingMinutes,
    reactivateAtTime: pauseRes.body.data?.reactivateAtTime
  });

  // 6. Doctor portal checks their live status
  console.log('\n6. Doctor portal fetches /api/v1/doctors/status/mine:');
  const docMineRes = await get('/api/v1/doctors/status/mine', docToken);
  console.log('Doctor self status:', {
    effectiveStatus: docMineRes.body.data?.effectiveStatus,
    isTemporarilyInactive: docMineRes.body.data?.isTemporarilyInactive,
    overrideUpdatedBy: docMineRes.body.data?.overrideUpdatedBy,
    reactivateAtTime: docMineRes.body.data?.reactivateAtTime
  });

  // 7. STRICT USER-SIDE HIDING CHECK
  console.log('\n7. STRICT USER-SIDE HIDING: Patient checks doctor availability while INACTIVE:');
  const publicDocsDuring = await get('/api/v1/doctors', patientToken);
  const foundDuring = publicDocsDuring.body.data?.some(d => d.id === doctorId);
  console.log(`Doctor visible in public doctor listing: ${foundDuring} (Expected: false)`);

  const hospDocsDuring = await get(`/api/v1/hospitals/${hospitalId}/doctors`, patientToken);
  const foundHospDuring = hospDocsDuring.body.data?.some(d => d.id === doctorId);
  console.log(`Doctor visible in hospital doctor listing: ${foundHospDuring} (Expected: false)`);

  const slotsDuring = await get(`/api/v1/doctors/${doctorId}/available-slots`, patientToken);
  console.log('Slots response during pause:', {
    isAvailable: slotsDuring.body.data?.isAvailable,
    isTemporarilyInactive: slotsDuring.body.data?.isTemporarilyInactive,
    availableSlotsCount: slotsDuring.body.data?.availableSlots?.length
  });

  // 8. Booking guard check
  console.log('\n8. Attempting to book an appointment with the paused doctor (User guard check)...');
  const bookAttempt = await post('/api/v1/appointments', {
    hospitalId,
    doctorId,
    date: new Date().toISOString().split('T')[0],
    timeSlot: '10:00 AM',
    patientName: 'Test Patient',
    opType: 'Normal'
  }, patientToken);
  console.log('Booking attempt status code:', bookAttempt.status);
  console.log('Booking error response:', bookAttempt.body.error);

  // 9. Manual reactivation test ("Activate Now")
  console.log('\n9. Receptionist / Doctor clicks "Activate Now" to restore doctor immediately...');
  const reactivateRes = await patch(`/api/v1/doctors/${doctorId}/active-status`, { active: true }, docToken);
  console.log('Reactivate response status:', reactivateRes.status);
  console.log('Reactivate data:', {
    effectiveStatus: reactivateRes.body.data?.effectiveStatus,
    isTemporarilyInactive: reactivateRes.body.data?.isTemporarilyInactive,
    inactiveUntil: reactivateRes.body.data?.inactiveUntil
  });

  // 10. Patient checks doctor listing after reactivation
  console.log('\n10. Patient checks doctor listing after reactivation:');
  const publicDocsAfter = await get('/api/v1/doctors', patientToken);
  const foundAfter = publicDocsAfter.body.data?.some(d => d.id === doctorId);
  console.log(`Doctor reappeared in public doctor listing: ${foundAfter} (Expected: true)`);

  const hospDocsAfter = await get(`/api/v1/hospitals/${hospitalId}/doctors`, patientToken);
  const foundHospAfter = hospDocsAfter.body.data?.some(d => d.id === doctorId);
  console.log(`Doctor reappeared in hospital doctor listing: ${foundHospAfter} (Expected: true)`);

  // 11. Auto-Reactivation on Expiry (Past timestamp test)
  console.log('\n11. Testing Automatic Expiry Reactivation:');
  const pastDate = new Date(Date.now() - 60000); // 1 minute in the past
  await patch(`/api/v1/doctors/${doctorId}/active-status`, {
    active: false,
    inactiveUntil: pastDate.toISOString(),
    reason: "Expired test"
  }, recToken);

  console.log('Querying doctor status after expiration:');
  const statusAfterExpiry = await get('/api/v1/doctors/status', recToken);
  const docAfterExpiry = statusAfterExpiry.body.data?.find(d => d.doctorId === doctorId);
  console.log('Doctor auto-reactivated status:', {
    effectiveStatus: docAfterExpiry?.effectiveStatus,
    isTemporarilyInactive: docAfterExpiry?.isTemporarilyInactive,
    inactiveUntil: docAfterExpiry?.inactiveUntil
  });

  const passedAll = 
    foundBefore === true &&
    pauseRes.body.data?.isTemporarilyInactive === true &&
    foundDuring === false &&
    foundHospDuring === false &&
    slotsDuring.body.data?.isAvailable === false &&
    bookAttempt.status === 400 &&
    bookAttempt.body.error?.code === 'DOCTOR_UNAVAILABLE' &&
    foundAfter === true &&
    foundHospAfter === true &&
    docAfterExpiry?.effectiveStatus === 'ACTIVE';

  console.log('\n======================================================');
  console.log(`OVERALL E2E VERIFICATION RESULT: ${passedAll ? 'PASSED 100% ✅' : 'FAILED ❌'}`);
  console.log('======================================================\n');
}

run().catch(console.error);
