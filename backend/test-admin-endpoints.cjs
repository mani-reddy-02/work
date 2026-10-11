const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (!admin) {
    console.log('No super admin found!');
    return;
  }
  const token = jwt.sign(
    { userId: admin.id, role: admin.role, email: admin.email },
    'local_dev_secret_key',
    { expiresIn: '7d' }
  );

  console.log('Testing Admin Endpoints with token...');

  // 1. Analytics
  const analyticsRes = await fetch('http://localhost:5000/api/v1/admin/lab-orders/analytics', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const analyticsData = await analyticsRes.json();
  console.log('Analytics Response:', JSON.stringify(analyticsData, null, 2));

  // 2. Orders list
  const listRes = await fetch('http://localhost:5000/api/v1/admin/lab-bookings?page=1&limit=5', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const listData = await listRes.json();
  console.log('Lab Bookings List (count):', listData.data?.length, 'Total in pagination:', listData.pagination?.total);
  if (listData.data?.length > 0) {
    console.log('Sample booking item:', JSON.stringify(listData.data[0], null, 2));
  }
}

test().catch(console.error).finally(() => prisma.$disconnect());
