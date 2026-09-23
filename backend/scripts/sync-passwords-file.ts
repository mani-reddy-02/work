import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const defaultHash123456 = await bcrypt.hash('123456', 10);
  const defaultHashPassword123 = await bcrypt.hash('Password@123', 10);
  const adminHash = await bcrypt.hash('Admin@123456', 10);

  // 1. Ensure Super Admin has Admin@123456
  await prisma.user.updateMany({
    where: { role: Role.SUPER_ADMIN },
    data: { passwordHash: adminHash, active: true },
  });

  // 2. Fix dummy hashes for nurse users
  await prisma.user.updateMany({
    where: {
      role: Role.NURSE,
      passwordHash: { contains: 'YourHashedPasswordHere' },
    },
    data: { passwordHash: defaultHash123456, active: true },
  });

  // 3. For any user with unknown or dummy hash, let's check and set to 123456 if placeholder
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      role: true,
      designation: true,
      hospitalId: true,
      passwordHash: true,
      active: true,
      hospital: {
        select: {
          name: true,
        }
      }
    },
    orderBy: [
      { role: 'asc' },
      { email: 'asc' },
    ]
  });

  const candidates = [
    'Admin@123456',
    'Password@123',
    '123456',
    'password123',
    'Doctor@123456',
    'Doctor@123',
  ];

  type CredEntry = {
    role: string;
    name: string;
    email: string;
    phone: string | null;
    password: string;
    hospitalName?: string;
    designation?: string | null;
  };

  const results: CredEntry[] = [];

  for (const u of users) {
    let plain = '123456';
    let matched = false;

    if (u.passwordHash) {
      for (const c of candidates) {
        if (await bcrypt.compare(c, u.passwordHash)) {
          plain = c;
          matched = true;
          break;
        }
      }
    }

    if (!matched && u.passwordHash) {
      // If it's a test patient or admin that had an unknown hash, reset to 123456 or Password@123
      if (u.role === Role.SUPER_ADMIN) {
        plain = 'Admin@123456';
        await prisma.user.update({ where: { id: u.id }, data: { passwordHash: adminHash } });
      } else {
        plain = '123456';
        await prisma.user.update({ where: { id: u.id }, data: { passwordHash: defaultHash123456 } });
      }
    } else if (!u.passwordHash) {
      plain = '123456';
      await prisma.user.update({ where: { id: u.id }, data: { passwordHash: defaultHash123456 } });
    }

    results.push({
      role: u.role,
      name: u.name,
      email: u.email,
      phone: u.phone,
      password: plain,
      hospitalName: u.hospital?.name,
      designation: u.designation,
    });
  }

  // Format into passwords.txt content
  let output = `========================================================================
MEDIQUEE PLATFORM - SYSTEM CREDENTIALS & LOGIN DIRECTORY
Generated / Synchronized: ${new Date().toISOString()}
========================================================================

APPLICATION URLS & PORTS:
- Super Admin Dashboard:     http://localhost:5174
- Hospital / Doctor / Staff: http://localhost:5175/MediQuee_Hospital_Dashboard
- User / Patient App:        http://localhost:5173
- Backend API Server:        http://localhost:5000

========================================================================
1. SUPER ADMIN (Admin Dashboard - Port 5174)
========================================================================
`;

  const superAdmins = results.filter(r => r.role === 'SUPER_ADMIN');
  for (const sa of superAdmins) {
    output += `Email:       ${sa.email}\n`;
    output += `Password:    ${sa.password}\n`;
    output += `Name:        ${sa.name}\n`;
    output += `Phone:       ${sa.phone || 'N/A'}\n`;
    output += `Access:      Super Admin Portal (All Hospital Requests, Bookings, Marketing, Licenses)\n\n`;
  }

  output += `========================================================================
2. HOSPITAL ADMIN (Hospital Dashboard - Port 5175)
========================================================================\n`;
  const hospAdmins = results.filter(r => r.role === 'HOSPITAL_ADMIN');
  for (const ha of hospAdmins) {
    output += `Hospital:    ${ha.hospitalName || 'Primary Hospital'}\n`;
    output += `Email:       ${ha.email}\n`;
    output += `Password:    ${ha.password}\n`;
    output += `Name:        ${ha.name}\n`;
    output += `Phone:       ${ha.phone || 'N/A'}\n\n`;
  }

  output += `========================================================================
3. DOCTORS (Hospital Dashboard - Doctor Portal - Port 5175)
========================================================================\n`;
  const doctors = results.filter(r => r.role === 'DOCTOR');
  for (const doc of doctors) {
    output += `Doctor:      ${doc.name} (${doc.designation || 'Specialist'})\n`;
    output += `Email:       ${doc.email}\n`;
    output += `Password:    ${doc.password}\n`;
    output += `Hospital:    ${doc.hospitalName || 'MS Hospital'}\n`;
    output += `Phone:       ${doc.phone || 'N/A'}\n\n`;
  }

  output += `========================================================================
4. RECEPTIONISTS & FRONT DESK (Hospital Dashboard - Port 5175)
========================================================================\n`;
  const recs = results.filter(r => r.role === 'RECEPTIONIST');
  for (const r of recs) {
    output += `Name:        ${r.name}\n`;
    output += `Email:       ${r.email}\n`;
    output += `Password:    ${r.password}\n`;
    output += `Hospital:    ${r.hospitalName || 'MS Hospital'}\n\n`;
  }

  output += `========================================================================
5. NURSING & HOME HEALTHCARE STAFF (Hospital Dashboard - Port 5175)
========================================================================\n`;
  const nurses = results.filter(r => r.role === 'NURSE');
  for (const n of nurses) {
    output += `Name:        ${n.name}\n`;
    output += `Email:       ${n.email}\n`;
    output += `Password:    ${n.password}\n`;
    output += `Hospital:    ${n.hospitalName || 'MS Hospital'}\n\n`;
  }

  output += `========================================================================
6. DIAGNOSTIC LAB ADMINS (Lab Portal / Dashboard)
========================================================================\n`;
  const labs = results.filter(r => r.role === 'LAB_ADMIN');
  for (const l of labs) {
    output += `Lab:         ${l.name}\n`;
    output += `Email:       ${l.email}\n`;
    output += `Password:    ${l.password}\n`;
    output += `Phone:       ${l.phone || 'N/A'}\n\n`;
  }

  output += `========================================================================
7. TEST PATIENTS / USERS (User App - Port 5173)
========================================================================\n`;
  const patients = results.filter(r => r.role === 'PATIENT');
  for (const p of patients) {
    output += `Patient:     ${p.name}\n`;
    output += `Email:       ${p.email}\n`;
    output += `Password:    ${p.password}\n`;
    output += `Phone:       ${p.phone || 'N/A'}\n\n`;
  }

  output += `========================================================================
NOTE: If you change any password during manual testing or automated scripts,
please update this file or re-run this synchronization script.
========================================================================\n`;

  const passwordsFilePath = path.resolve('..', 'passwords.txt');
  fs.writeFileSync(passwordsFilePath, output, 'utf-8');
  console.log(`Successfully updated ${passwordsFilePath} with ${results.length} accounts.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
