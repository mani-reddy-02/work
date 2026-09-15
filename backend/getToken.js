const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

async function main() {
  let user = await prisma.user.findFirst({ where: { role: 'PATIENT' } });
  if (!user) {
    user = await prisma.user.create({
      data: { name: 'Test User', email: 'testpat123@example.com', mobile: '9999999999', role: 'PATIENT', active: true, password: 'hash' }
    });
  }
  const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || 'mediquee_secret_key', { expiresIn: '1d' });
  console.log(token);
}
main();
