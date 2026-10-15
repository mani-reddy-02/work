const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  const hospitalAdmin = await prisma.user.findFirst({ where: { role: 'HOSPITAL_ADMIN', hospitalId: { not: null } } });
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  const adminToken = jwt.sign({ userId: admin.id }, secret, { expiresIn: '1d' });
  const hospToken = jwt.sign({ userId: hospitalAdmin.id }, secret, { expiresIn: '1d' });

  const BASE = 'http://localhost:5000/api/v1';

  console.log('--- 1. Testing GET /api/v1/home-nursing/admin/stats ---');
  let res = await fetch(`${BASE}/home-nursing/admin/stats`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  let json = await res.json();
  console.log('Stats response:', json);
  if (!json.success || json.data.totalNursingServices === undefined || json.data.totalNurses === undefined) {
    throw new Error('Stats API failed');
  }

  console.log('--- 2. Testing GET /api/v1/home-nursing/admin/services ---');
  res = await fetch(`${BASE}/home-nursing/admin/services?limit=20`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  json = await res.json();
  console.log(`Retrieved ${json.data?.length} services. Total: ${json.pagination?.total}`);
  if (!json.success || !Array.isArray(json.data)) throw new Error('List API failed');

  console.log('--- 3. Testing POST /api/v1/home-nursing/admin/services (Create new service) ---');
  const testName = `Test Nursing Care ${Date.now()}`;
  res = await fetch(`${BASE}/home-nursing/admin/services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      name: testName,
      description: 'Specialized home nursing test procedure with vital signs and recovery support.',
      iconUrl: '/icons/nurse.png',
      active: true,
    })
  });
  json = await res.json();
  console.log('Create response:', json.success, json.data?.id, json.data?.name);
  if (!json.success || !json.data?.id) throw new Error('Create API failed');
  const createdId = json.data.id;

  console.log('--- 4. Testing Duplicate Service Name Prevention ---');
  res = await fetch(`${BASE}/home-nursing/admin/services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      name: testName,
      description: 'Duplicate attempt',
    })
  });
  json = await res.json();
  console.log('Duplicate check status code:', res.status, 'error:', json.error?.code);
  if (res.status !== 400 || json.error?.code !== 'DUPLICATE_SERVICE') {
    throw new Error('Duplicate check failed');
  }

  console.log('--- 5. Testing PATCH /api/v1/home-nursing/admin/services/:id ---');
  res = await fetch(`${BASE}/home-nursing/admin/services/${createdId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      description: 'Updated description for home nursing test procedure.',
      active: true,
    })
  });
  json = await res.json();
  console.log('Update response:', json.success, json.data?.description);
  if (!json.success || json.data?.description !== 'Updated description for home nursing test procedure.') {
    throw new Error('Update API failed');
  }

  console.log('--- 6. Testing GET /api/v1/home-nursing/hospital/offerings ---');
  res = await fetch(`${BASE}/home-nursing/hospital/offerings`, {
    headers: { Authorization: `Bearer ${hospToken}` }
  });
  json = await res.json();
  console.log('Hospital offerings count:', json.data?.length, 'Offered:', json.offeredCount);
  const foundInHosp = json.data?.find(s => s.id === createdId);
  console.log('Newly created service found in hospital offerings list:', !!foundInHosp, 'isOffered initially:', foundInHosp?.isOffered);
  if (!foundInHosp) throw new Error('Service not found in hospital offerings');

  console.log('--- 7. Testing POST /api/v1/home-nursing/hospital/offerings/toggle (Select) ---');
  res = await fetch(`${BASE}/home-nursing/hospital/offerings/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${hospToken}` },
    body: JSON.stringify({
      serviceId: createdId,
      available: true,
      price: 850
    })
  });
  json = await res.json();
  console.log('Hospital selection toggle result:', json.success, json.message);
  if (!json.success) throw new Error('Toggle selection failed');

  // Verify offering state
  res = await fetch(`${BASE}/home-nursing/hospital/offerings`, {
    headers: { Authorization: `Bearer ${hospToken}` }
  });
  json = await res.json();
  const checkedOffered = json.data?.find(s => s.id === createdId);
  console.log('Service isOffered after selection:', checkedOffered?.isOffered, 'price:', checkedOffered?.price);
  if (!checkedOffered?.isOffered) throw new Error('Offering was not set to true');

  console.log('--- 8. Testing POST /api/v1/home-nursing/hospital/offerings/toggle (Deselect) ---');
  res = await fetch(`${BASE}/home-nursing/hospital/offerings/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${hospToken}` },
    body: JSON.stringify({
      serviceId: createdId,
      available: false
    })
  });
  json = await res.json();
  console.log('Hospital deselection toggle result:', json.success, json.message);
  if (!json.success) throw new Error('Toggle deselection failed');

  res = await fetch(`${BASE}/home-nursing/hospital/offerings`, {
    headers: { Authorization: `Bearer ${hospToken}` }
  });
  json = await res.json();
  const checkedDeselected = json.data?.find(s => s.id === createdId);
  console.log('Service isOffered after deselection:', checkedDeselected?.isOffered);
  if (checkedDeselected?.isOffered !== false) throw new Error('Offering was not deselected');

  console.log('--- 9. Testing DELETE (permanently deletes service and offerings) ---');
  res = await fetch(`${BASE}/home-nursing/admin/services/${createdId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  json = await res.json();
  console.log('Delete response:', json.success, 'deleted:', json.deleted, 'message:', json.message);
  if (!json.success || !json.deleted) throw new Error('Permanent delete failed');

  // Verify it is no longer in DB
  const checkDb = await prisma.nursingService.findUnique({ where: { id: createdId } });
  console.log('Verified deleted from DB:', checkDb === null);
  if (checkDb !== null) throw new Error('Service still exists in DB');

  console.log('\n>>> ALL 9 END-TO-END NURSING SERVICE API TESTS PASSED SUCCESSFULLY! <<<');
}

run()
  .catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
