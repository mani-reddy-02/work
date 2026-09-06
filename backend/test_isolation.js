const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const env = require('../backend/dist/config/env').env;

const prisma = new PrismaClient();

async function runTest() {
  console.log('--- STARTING TENANT ISOLATION TESTS ---');

  // 1. Get two hospitals (Hospital A and Hospital B)
  const users = await prisma.user.findMany({
    where: { role: 'HOSPITAL_ADMIN' },
    include: { hospital: true }
  });

  if (users.length < 2) {
    console.log('Need at least 2 hospital admins to test isolation. Found:', users.length);
    return;
  }

  const userA = users[0];
  const userB = users[1];

  console.log(`Hospital A: ${userA.hospital.name} (${userA.hospitalId})`);
  console.log(`Hospital B: ${userB.hospital.name} (${userB.hospitalId})`);

  const tokenA = jwt.sign({ userId: userA.id }, env.JWT_SECRET, { expiresIn: '1h' });
  const tokenB = jwt.sign({ userId: userB.id }, env.JWT_SECRET, { expiresIn: '1h' });

  // Helper to make API requests
  const api = async (path, method, body, token) => {
    const res = await fetch(`http://localhost:5000/api/v1${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: body ? JSON.stringify(body) : undefined
    });
    return { status: res.status, data: await res.json() };
  };

  // 2. Create Departments for Hospital A
  console.log('\nCreating departments for Hospital A...');
  let resA1 = await api('/departments', 'POST', { name: 'Cardiology Test', code: 'CARD' }, tokenA);
  console.log('Create A1 Status:', resA1.status, resA1.data.success ? 'Success' : 'Failed');
  
  let resA2 = await api('/departments', 'POST', { name: 'Emergency Test', code: 'EMR' }, tokenA);
  console.log('Create A2 Status:', resA2.status, resA2.data.success ? 'Success' : 'Failed');

  // 3. Create Department for Hospital B
  console.log('\nCreating department for Hospital B...');
  let resB1 = await api('/departments', 'POST', { name: 'Pediatrics Test', code: 'PED' }, tokenB);
  console.log('Create B1 Status:', resB1.status, resB1.data.success ? 'Success' : 'Failed');

  // 4. Test GET isolation
  console.log('\nTesting GET Isolation...');
  let getA = await api('/departments', 'GET', null, tokenA);
  console.log(`Hospital A sees ${getA.data.data.length} departments.`);
  
  let getB = await api('/departments', 'GET', null, tokenB);
  console.log(`Hospital B sees ${getB.data.data.length} departments.`);

  // 5. Test PATCH isolation
  const deptAId = resA1.data.data?.id;
  if (!deptAId) {
    console.log('Could not get Dept A ID');
    return;
  }
  
  console.log('\nTesting PATCH Isolation (Hospital B trying to update Hospital A department)...');
  let patchRes = await api(`/departments/${deptAId}`, 'PATCH', { name: 'Hacked Cardiology' }, tokenB);
  console.log('PATCH Status:', patchRes.status, 'Expected 403 or 404');

  // 6. Test DELETE isolation
  console.log('\nTesting DELETE Isolation (Hospital B trying to delete Hospital A department)...');
  let deleteRes = await api(`/departments/${deptAId}`, 'DELETE', null, tokenB);
  console.log('DELETE Status:', deleteRes.status, 'Expected 403 or 404');

  // 7. Verify Unauthenticated
  console.log('\nTesting Unauthenticated GET...');
  let unauthRes = await api('/departments', 'GET', null, 'invalid_token');
  console.log('Unauth Status:', unauthRes.status, 'Expected 401');

  // 8. Clean up created departments
  console.log('\nCleaning up test departments...');
  await api(`/departments/${resA1.data.data.id}`, 'DELETE', null, tokenA);
  await api(`/departments/${resA2.data.data.id}`, 'DELETE', null, tokenA);
  await api(`/departments/${resB1.data.data.id}`, 'DELETE', null, tokenB);
  
  console.log('--- TESTS COMPLETE ---');
}

runTest().catch(console.error).finally(() => prisma.$disconnect());
