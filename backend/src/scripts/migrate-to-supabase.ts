import { prisma } from '../config/prisma';
import { storageService, StorageBucket } from '../services/storage.service';
import { supabaseClient } from '../config/supabase';
import fs from 'fs';
import path from 'path';

async function migrate() {
  console.log('=== MediQuee Local to Supabase Storage Migration ===\n');

  if (!supabaseClient) {
    console.warn('[Warning] Supabase client is not configured. Please set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY in backend/.env to run cloud sync.');
  }

  // 1. Migrate Patient Reports
  const reports = await prisma.patientReport.findMany({
    where: {
      fileUrl: { startsWith: '/uploads/reports/' }
    }
  });
  console.log(`Found ${reports.length} patient reports to check.`);

  for (const report of reports) {
    const fileName = path.basename(report.fileUrl);
    const localPath = path.join(process.cwd(), 'uploads/reports', fileName);

    if (fs.existsSync(localPath)) {
      const buffer = fs.readFileSync(localPath);
      const res = await storageService.uploadFile('reports', fileName, buffer);
      if (res.isSupabase) {
        await prisma.patientReport.update({
          where: { id: report.id },
          data: { fileUrl: res.fileUrl }
        });
        console.log(`[Migrated Report] ${report.title} -> ${res.fileUrl}`);
      }
    }
  }

  // 2. Migrate Lab Bookings
  const labBookings = await prisma.labBooking.findMany({
    where: {
      reportUrl: { startsWith: '/uploads/reports/' }
    }
  });
  console.log(`Found ${labBookings.length} lab bookings to check.`);

  for (const booking of labBookings) {
    if (!booking.reportUrl) continue;
    const fileName = path.basename(booking.reportUrl);
    const localPath = path.join(process.cwd(), 'uploads/reports', fileName);

    if (fs.existsSync(localPath)) {
      const buffer = fs.readFileSync(localPath);
      const res = await storageService.uploadFile('reports', fileName, buffer);
      if (res.isSupabase) {
        await prisma.labBooking.update({
          where: { id: booking.id },
          data: { reportUrl: res.fileUrl }
        });
        console.log(`[Migrated Lab Booking] ${booking.id} -> ${res.fileUrl}`);
      }
    }
  }

  // 3. Migrate Doctor Licenses
  const doctors = await prisma.user.findMany({
    where: {
      licenseDocumentUrl: { startsWith: '/uploads/licenses/' }
    }
  });
  console.log(`Found ${doctors.length} doctor licenses to check.`);

  for (const doc of doctors) {
    if (!doc.licenseDocumentUrl) continue;
    const fileName = path.basename(doc.licenseDocumentUrl);
    const localPath = path.join(process.cwd(), 'uploads/licenses', fileName);

    if (fs.existsSync(localPath)) {
      const buffer = fs.readFileSync(localPath);
      const res = await storageService.uploadFile('licenses', fileName, buffer);
      if (res.isSupabase) {
        await prisma.user.update({
          where: { id: doc.id },
          data: { licenseDocumentUrl: res.fileUrl }
        });
        console.log(`[Migrated Doctor License] Dr. ${doc.name} -> ${res.fileUrl}`);
      }
    }
  }

  // 4. Migrate Lab Licenses
  const labs = await prisma.lab.findMany({
    where: {
      labLicenseDocumentUrl: { startsWith: '/uploads/licenses/' }
    }
  });
  console.log(`Found ${labs.length} lab licenses to check.`);

  for (const lab of labs) {
    if (!lab.labLicenseDocumentUrl) continue;
    const fileName = path.basename(lab.labLicenseDocumentUrl);
    const localPath = path.join(process.cwd(), 'uploads/licenses', fileName);

    if (fs.existsSync(localPath)) {
      const buffer = fs.readFileSync(localPath);
      const res = await storageService.uploadFile('licenses', fileName, buffer);
      if (res.isSupabase) {
        await prisma.lab.update({
          where: { id: lab.id },
          data: { labLicenseDocumentUrl: res.fileUrl }
        });
        console.log(`[Migrated Lab License] ${lab.name} -> ${res.fileUrl}`);
      }
    }
  }

  console.log('\nMigration complete.');
  await prisma.$disconnect();
}

migrate().catch(console.error);

