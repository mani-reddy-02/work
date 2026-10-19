const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5000/api/v1${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('========================================================');
  console.log('MEDIQUEE DISEASE-BASED HOSPITAL & DOCTOR FILTERING TEST');
  console.log('========================================================\n');

  // Test 1: Fever OP Consultation
  console.log('--- TEST 1: Fever OP Consultation Hospitals ---');
  const feverOp = await get('/hospitals?conditionId=d759cf13-6eef-4058-9a09-d218a15ca59a&consultationType=OP');
  console.log(`Status: ${feverOp.status}`);
  console.log(`Total Hospitals: ${feverOp.body.data?.length}`);
  
  const hospitalNames = (feverOp.body.data || []).map(h => h.name);
  console.log('Hospitals found:', hospitalNames);

  // Check Admin A is NOT present
  const hasAdminA = hospitalNames.some(name => name.toLowerCase().includes('admin a'));
  console.log(`PASS: Admin A excluded? ${!hasAdminA}`);

  // Check standalone labs are NOT present
  const hasDiagnosticLab = hospitalNames.some(name => name.toLowerCase().includes('apollo diagnostics') || name.toLowerCase().includes('vijaya'));
  console.log(`PASS: Standalone Labs excluded? ${!hasDiagnosticLab}`);

  // Check departments on Radiology & Diagnostic Imaging Laboratory
  const radHosp = (feverOp.body.data || []).find(h => h.id === '9c2e7291-de11-4a74-9752-781454e0f99c');
  if (radHosp) {
    console.log(`Radiology Hospital departments:`, radHosp.departments);
    console.log(`Radiology Hospital relevantDepartment:`, radHosp.relevantDepartment);
    console.log(`Radiology Hospital eligibleDoctorCount:`, radHosp.eligibleDoctorCount);
    console.log(`PASS: Only General Medicine department shown? ${radHosp.departments.length === 1 && radHosp.departments[0] === 'General Medicine'}`);
  } else {
    console.log('FAIL: Radiology Hospital not found in results');
  }

  // Test 2: Fever OP Consultation Doctors
  console.log('\n--- TEST 2: Fever OP Consultation Doctors for Hospital ---');
  const feverDoctors = await get('/hospitals/9c2e7291-de11-4a74-9752-781454e0f99c/doctors?conditionId=d759cf13-6eef-4058-9a09-d218a15ca59a&consultationType=OP');
  console.log(`Total Doctors: ${feverDoctors.body.data?.length}`);
  const docs = feverDoctors.body.data || [];
  console.log('Doctors:', docs.map(d => ({ id: d.id, name: d.name, dept: d.department })));

  const allGenMed = docs.every(d => d.department === 'General Medicine');
  console.log(`PASS: All doctors belong to General Medicine? ${allGenMed}`);
  const uniqueDocIds = new Set(docs.map(d => d.id));
  console.log(`PASS: No duplicate doctors? ${uniqueDocIds.size === docs.length}`);

  // Test 3: Video Consultation
  console.log('\n--- TEST 3: Fever Video Consultation ---');
  const feverVideo = await get('/hospitals?conditionId=d759cf13-6eef-4058-9a09-d218a15ca59a&consultationType=VIDEO');
  console.log(`Video Hospitals count: ${feverVideo.body.data?.length}`);
  const videoDocs = await get('/hospitals/9c2e7291-de11-4a74-9752-781454e0f99c/doctors?conditionId=d759cf13-6eef-4058-9a09-d218a15ca59a&consultationType=VIDEO');
  console.log(`Video Doctors count: ${videoDocs.body.data?.length}`);

  // Test 4: Chest Pain (Doctor mani in Cardiology has NO active schedule)
  console.log('\n--- TEST 4: Chest Pain (No doctor has schedule) ---');
  const chestPain = await get('/hospitals?conditionId=feaac922-6327-4687-98f5-dabf9f189f5f&consultationType=OP');
  console.log(`Chest Pain Hospitals count: ${chestPain.body.data?.length}`);
  console.log(`PASS: Returns 0 hospitals when no doctors have available schedule? ${chestPain.body.data?.length === 0}`);

  // Test 5: PCOS (Gynecology)
  console.log('\n--- TEST 5: PCOS / PCOD (Gynecology) ---');
  const pcos = await get('/hospitals?conditionId=20521735-1000-414f-8401-0d92e8c01ca0&consultationType=OP');
  console.log(`PCOS Hospitals count: ${pcos.body.data?.length}`);
  if (pcos.body.data?.[0]) {
    console.log(`PCOS Hospital relevantDepartment:`, pcos.body.data[0].relevantDepartment);
    console.log(`PCOS Hospital departments:`, pcos.body.data[0].departments);
    console.log(`PASS: Only Gynecology department shown? ${pcos.body.data[0].departments.includes('Gynecology') && !pcos.body.data[0].departments.includes('General Medicine')}`);
  }

  console.log('\n========================================================');
  console.log('ALL API TESTS COMPLETED');
  console.log('========================================================');
}

runTests().catch(console.error);
