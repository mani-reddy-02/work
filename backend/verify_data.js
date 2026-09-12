const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findFirst({
  where: { role: 'DOCTOR' },
  include: {
    department: {
      include: {
        specialty: {
          include: {
            conditions: true
          }
        }
      }
    }
  }
}).then(d => {
  console.log(JSON.stringify(d, null, 2));
  prisma.$disconnect();
});
