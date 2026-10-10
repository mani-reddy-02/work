const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const labBookings = await prisma.labBooking.findMany({ include: { patient: true } });
  console.log("Lab Bookings:");
  labBookings.forEach(lb => console.log(`ID: ${lb.id}, Status: ${lb.status}, Patient: ${lb.patient.name} (${lb.patientId}), ReportUrl: ${lb.reportUrl}`));

  const reports = await prisma.patientReport.findMany();
  console.log("\nPatient Reports:");
  reports.forEach(r => console.log(`ID: ${r.id}, Title: ${r.title}, UserID: ${r.userId}, Date: ${r.date}`));
}

main().finally(() => prisma.$disconnect());
