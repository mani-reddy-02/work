const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const labBookings = await prisma.labBooking.findMany({ 
    where: { status: 'REPORT_READY' },
    include: { patient: true, hospital: true } 
  });
  
  for (const updated of labBookings) {
    if (!updated.reportUrl) {
        const fileUrl = `/uploads/reports/dummy-${updated.id}.pdf`;
        await prisma.labBooking.update({
            where: { id: updated.id },
            data: { reportUrl: fileUrl }
        });

        await prisma.patientReport.create({
            data: {
              userId: updated.patientId,
              title: 'Lab Report - ' + updated.id.substring(0, 8).toUpperCase(),
              hospital: updated.hospital.name, 
              date: new Date().toISOString().split('T')[0],
              status: 'Normal',
              fileUrl: fileUrl,
            }
        });
        console.log(`Created report for booking ${updated.id}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
