
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api/v1';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_dev';

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1d' });
}

async function request(method, path, token, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return res;
}

async function runTests() {
  console.log('--- STARTING RBAC TESTS ---');

  // Create Hospital A and B
  const hospitalA = await prisma.hospital.create({
    data: { name: 'Hospital A - Test', businessType: 'HOSPITAL' }
  });
  const hospitalB = await prisma.hospital.create({
    data: { name: 'Hospital B - Test', businessType: 'HOSPITAL' }
  });

  // Create Admin A, Receptionist A, Admin B
  const adminA = await prisma.user.create({
    data: { email: 'adminA@test.com', passwordHash: 'hash', name: 'Admin A', role: 'HOSPITAL_ADMIN', hospitalId: hospitalA.id }
  });
  const recA = await prisma.user.create({
    data: { email: 'recA@test.com', passwordHash: 'hash', name: 'Rec A', role: 'RECEPTIONIST', hospitalId: hospitalA.id }
  });
  const adminB = await prisma.user.create({
    data: { email: 'adminB@test.com', passwordHash: 'hash', name: 'Admin B', role: 'HOSPITAL_ADMIN', hospitalId: hospitalB.id }
  });

  const tokenAdminA = generateToken(adminA.id);
  const tokenRecA = generateToken(recA.id);
  const tokenAdminB = generateToken(adminB.id);

  console.log('Test A: Admin manages Receptionist permissions');
  let res = await request('PUT', '/permissions/roles/RECEPTIONIST', tokenAdminA, {
    permissions: { 'staff.create': true }
  });
  console.log('Test A Status:', res.status);
  
  console.log('Test C: Receptionist creates staff (allowed)');
  res = await request('POST', '/staff', tokenRecA, { name: 'New Staff', role: 'NURSE' });
  console.log('Test C (allowed) Status:', res.status); // might fail validation but should not be 403

  console.log('Test C2: Admin disables staff.create for Receptionist');
  res = await request('PUT', '/permissions/roles/RECEPTIONIST', tokenAdminA, {
    permissions: { 'staff.create': false }
  });
  
  console.log('Test C3: Receptionist attempts to create staff (denied)');
  res = await request('POST', '/staff', tokenRecA, { name: 'New Staff', role: 'NURSE' });
  console.log('Test C3 (denied) Status:', res.status, await res.json());

  console.log('Test D: Department permission');
  res = await request('PUT', '/permissions/roles/RECEPTIONIST', tokenAdminA, {
    permissions: { 'departments.create': false }
  });
  res = await request('POST', '/departments', tokenRecA, { name: 'Cardio' });
  console.log('Test D (denied) Status:', res.status);

  console.log('Test E: Permission re-enable');
  res = await request('PUT', '/permissions/roles/RECEPTIONIST', tokenAdminA, {
    permissions: { 'departments.create': true }
  });
  res = await request('POST', '/departments', tokenRecA, { name: 'Cardio' });
  console.log('Test E (allowed) Status:', res.status);

  console.log('Test F: Non-admin cannot manage permissions');
  res = await request('PUT', '/permissions/roles/NURSE', tokenRecA, {
    permissions: { 'staff.create': true }
  });
  console.log('Test F Status:', res.status);

  console.log('Test G: Cross-hospital isolation');
  res = await request('PUT', '/permissions/roles/RECEPTIONIST', tokenAdminB, {
    permissions: { 'staff.create': true } // admin B updates Rec permissions for Hospital B
  });
  // recA belongs to hospital A, so recA should still be denied staff.create because adminB only updated hospital B
  res = await request('POST', '/staff', tokenRecA, { name: 'New Staff', role: 'NURSE' });
  console.log('Test G Status (should still be 403 for recA):', res.status);

  console.log('Test H: Role manipulation via permission API');
  res = await request('PUT', '/permissions/roles/DOCTOR', tokenAdminA, {
    permissions: { 'role': 'HOSPITAL_ADMIN' }
  });
  console.log('Test H Status (should be 200 but ignore the bad key):', res.status);
  
  // Clean up
  await prisma.rolePermission.deleteMany({ where: { hospitalId: { in: [hospitalA.id, hospitalB.id] } } });
  await prisma.user.deleteMany({ where: { hospitalId: { in: [hospitalA.id, hospitalB.id] } } });
  await prisma.hospital.deleteMany({ where: { id: { in: [hospitalA.id, hospitalB.id] } } });
  
  console.log('--- TESTS COMPLETE ---');
}

runTests().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
});
