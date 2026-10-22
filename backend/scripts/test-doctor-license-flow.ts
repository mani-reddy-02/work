import http from 'http';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import { prisma } from '../src/config/prisma';
import { env } from '../src/config/env';
import { Role } from '@prisma/client';

let server: http.Server;
let baseUrl: string;

function makeRequest(
  endpoint: string,
  options: { method?: string; headers?: Record<string, string>; body?: any } = {}
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, baseUrl);
    const postData = options.body ? JSON.stringify(options.body) : null;

    const req = http.request(
      url,
      {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
          ...(options.headers || {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = data ? JSON.parse(data) : {};
            resolve({ status: res.statusCode || 500, body: json });
          } catch {
            resolve({ status: res.statusCode || 500, body: data });
          }
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function printHeader(title: string) {
  console.log('\n================================================================');
  console.log(`  ${title}`);
  console.log('================================================================');
}

function printStep(step: string, status: 'PASS' | 'FAIL' | 'INFO', details?: string) {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : 'ℹ️';
  console.log(`${icon} [${status}] ${step}`);
  if (details) {
    console.log(`       -> ${details}`);
  }
}

async function runTests() {
  printHeader('MANDATORY DOCTOR LICENSE & SUPABASE STORAGE AUDIT');
  console.log(`Timestamp: ${new Date().toISOString()}`);

  let hospitalAdminUser: any = null;
  let hospitalAdminToken: string = '';
  let superAdminUser: any = null;
  let superAdminToken: string = '';
  let targetDepartment: any = null;
  let createdDoctorId: string | null = null;
  let uploadedFileDiskPath: string | null = null;

  try {
    // 0. Start In-Memory Server
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        printStep('In-Process Test Server Running', 'PASS', `Listening at ${baseUrl}`);
        resolve();
      });
    });

    // 1. Prerequisites Setup
    printHeader('1. PREREQUISITES & AUTHENTICATION');
    
    // Find hospital with admin
    const hospital = await prisma.hospital.findFirst({
      where: {
        users: { some: { role: Role.HOSPITAL_ADMIN } }
      },
      include: {
        users: { where: { role: Role.HOSPITAL_ADMIN } },
        departments: true
      }
    });

    if (!hospital || hospital.users.length === 0) {
      throw new Error('No hospital with admin found in database');
    }

    hospitalAdminUser = hospital.users[0];
    hospitalAdminToken = jwt.sign(
      { userId: hospitalAdminUser.id },
      env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    printStep('Hospital Admin Authenticated', 'PASS', `Hospital: "${hospital.name}" | Admin: "${hospitalAdminUser.name}"`);

    // Find Super Admin
    superAdminUser = await prisma.user.findFirst({
      where: { role: Role.SUPER_ADMIN }
    });

    if (!superAdminUser) {
      superAdminUser = await prisma.user.create({
        data: {
          name: 'Super Admin Test',
          email: `superadmin.${Date.now()}@mediquee.test`,
          passwordHash: 'dummy',
          role: Role.SUPER_ADMIN
        }
      });
    }

    superAdminToken = jwt.sign(
      { userId: superAdminUser.id },
      env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    printStep('Super Admin Authenticated', 'PASS', `Super Admin: "${superAdminUser.name}"`);

    // Target Department
    if (hospital.departments.length > 0) {
      targetDepartment = hospital.departments[0];
    } else {
      let specialty = await prisma.platformSpecialty.findFirst();
      if (!specialty) {
        specialty = await prisma.platformSpecialty.create({
          data: { name: `Cardiology Test ${Date.now()}`, icon: 'Heart' }
        });
      }
      targetDepartment = await prisma.department.create({
        data: {
          name: 'Cardiology',
          hospitalId: hospital.id,
          specialtyId: specialty.id
        }
      });
    }

    printStep('Target Department Selected', 'PASS', `Dept: "${targetDepartment.name}" (${targetDepartment.id})`);

    const hospitalHeaders = { Authorization: `Bearer ${hospitalAdminToken}` };
    const adminHeaders = { Authorization: `Bearer ${superAdminToken}` };

    // 2. Validation Test: Missing licenseNumber for doctor
    printHeader('2. MANDATORY LICENSE NUMBER & DOCUMENT ENFORCEMENT');

    const missingLicenseRes = await makeRequest('/api/v1/staff', {
      method: 'POST',
      headers: hospitalHeaders,
      body: {
        name: 'Dr. Test Missing License',
        email: `dr.missing.lic.${Date.now()}@mediquee.test`,
        password: 'Password@123',
        role: 'DOCTOR',
        departmentId: targetDepartment.id,
        // licenseNumber missing
        licenseDocumentUrl: '/uploads/licenses/sample.pdf',
        experienceYears: 5,
        consultationFee: 500
      }
    });

    if (missingLicenseRes.status === 400) {
      printStep('Reject Missing licenseNumber', 'PASS', 'HTTP 400 Bad Request returned as expected');
    } else {
      throw new Error(`Expected HTTP 400 for missing license number, got ${missingLicenseRes.status}`);
    }

    // 3. Validation Test: Missing licenseDocumentUrl for doctor
    const missingDocRes = await makeRequest('/api/v1/staff', {
      method: 'POST',
      headers: hospitalHeaders,
      body: {
        name: 'Dr. Test Missing Document',
        email: `dr.missing.doc.${Date.now()}@mediquee.test`,
        password: 'Password@123',
        role: 'DOCTOR',
        departmentId: targetDepartment.id,
        licenseNumber: 'TSMC/2026/8912',
        // licenseDocumentUrl missing
        experienceYears: 5,
        consultationFee: 500
      }
    });

    if (missingDocRes.status === 400) {
      printStep('Reject Missing licenseDocumentUrl', 'PASS', 'HTTP 400 Bad Request returned: License document certificate is mandatory');
    } else {
      throw new Error(`Expected HTTP 400 for missing license document, got ${missingDocRes.status}`);
    }

    // 4. Test File Upload Endpoint for Doctor License
    printHeader('3. DOCTOR MEDICAL LICENSE CERTIFICATE UPLOAD');
    const dummyPdfBase64 = 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwgL0xlbmd0aCA1IDAgUiAvRmlsdGVyIC9GbGF0ZURlY29kZSA+PgpzdHJlYW0KeAEr5HIKWTAwNAEAAzACVAplbmRzdHJlYW0KZW5kb2JqCg==';
    const uploadRes = await makeRequest('/api/v1/staff/upload-license', {
      method: 'POST',
      headers: hospitalHeaders,
      body: {
        fileName: 'telangana_state_medical_council_reg.pdf',
        fileData: dummyPdfBase64,
      }
    });

    if (uploadRes.status !== 201 || !uploadRes.body.success || !uploadRes.body.data?.fileUrl) {
      throw new Error(`Upload failed: status ${uploadRes.status}, body: ${JSON.stringify(uploadRes.body)}`);
    }

    const uploadedDocUrl = uploadRes.body.data.fileUrl;
    const uploadedFileName = uploadRes.body.data.fileName;
    uploadedFileDiskPath = path.join(process.cwd(), 'uploads/licenses', uploadedFileName);

    printStep('Upload Doctor Medical License Certificate', 'PASS', `Stored at: "${uploadedDocUrl}" (${uploadRes.body.data.size} bytes)`);

    // Verify physical file on disk
    if (fs.existsSync(uploadedFileDiskPath)) {
      printStep('Physical Disk Persistence', 'PASS', `File verified: ${uploadedFileDiskPath}`);
    } else {
      throw new Error(`Uploaded file was not found on disk at: ${uploadedFileDiskPath}`);
    }

    // 5. Test Successful Doctor Creation with Mandatory License
    printHeader('4. SUCCESSFUL DOCTOR CREATION & SUPABASE PERSISTENCE');
    const testDoctorEmail = `dr.audit.${Date.now()}@mediquee.test`;
    const testDoctorLicense = `TSMC-${Math.floor(10000 + Math.random() * 90000)}`;

    const createRes = await makeRequest('/api/v1/staff', {
      method: 'POST',
      headers: hospitalHeaders,
      body: {
        name: 'Dr. Srinivas Reddy',
        email: testDoctorEmail,
        password: 'Password@123',
        phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
        role: 'DOCTOR',
        departmentId: targetDepartment.id,
        licenseNumber: testDoctorLicense,
        licenseDocumentUrl: uploadedDocUrl,
        experienceYears: 8,
        consultationFee: 750,
      }
    });

    if (createRes.status !== 201 || !createRes.body.success) {
      throw new Error(`Doctor creation failed: status ${createRes.status}, body: ${JSON.stringify(createRes.body)}`);
    }

    createdDoctorId = createRes.body.data.id;
    printStep('Doctor Created via API', 'PASS', `Doctor ID: ${createdDoctorId} | Name: ${createRes.body.data.name}`);

    // 6. Direct Supabase Database Query Verification
    printHeader('5. DIRECT SUPABASE POSTGRESQL AUDIT');
    const dbDoctor = await prisma.user.findUnique({
      where: { id: createdDoctorId! }
    });

    if (!dbDoctor) {
      throw new Error('Doctor record was not found in Supabase database');
    }

    if (dbDoctor.licenseNumber !== testDoctorLicense) {
      throw new Error(`License mismatch in Supabase: expected ${testDoctorLicense}, found ${dbDoctor.licenseNumber}`);
    }

    if (dbDoctor.licenseDocumentUrl !== uploadedDocUrl) {
      throw new Error(`License Document URL mismatch in Supabase: expected ${uploadedDocUrl}, found ${dbDoctor.licenseDocumentUrl}`);
    }

    printStep('Supabase PostgreSQL Verified', 'PASS', `licenseNumber: "${dbDoctor.licenseNumber}" | licenseDocumentUrl: "${dbDoctor.licenseDocumentUrl}"`);

    // 7. Hospital Visibility Verification
    printHeader('6. HOSPITAL ACCESS AUDIT');
    const hospitalStaffRes = await makeRequest('/api/v1/staff', {
      method: 'GET',
      headers: hospitalHeaders
    });

    if (hospitalStaffRes.status !== 200 || !hospitalStaffRes.body.success) {
      throw new Error(`Failed to fetch hospital staff: status ${hospitalStaffRes.status}`);
    }

    const hospitalDoctorRecord = hospitalStaffRes.body.data.find((s: any) => s.id === createdDoctorId);
    if (!hospitalDoctorRecord) {
      throw new Error('Hospital staff query did not return created doctor');
    }

    if (!hospitalDoctorRecord.licenseNumber || !hospitalDoctorRecord.licenseDocumentUrl) {
      throw new Error('Hospital staff query missing licenseNumber or licenseDocumentUrl');
    }

    printStep('Hospital Can View Doctor License', 'PASS', `Hospital verified: License "${hospitalDoctorRecord.licenseNumber}", Doc: "${hospitalDoctorRecord.licenseDocumentUrl}"`);

    // 8. Super Admin Visibility Verification
    printHeader('7. SUPER ADMIN ACCESS AUDIT');
    const adminUserRes = await makeRequest(`/api/v1/admin/users/${createdDoctorId}`, {
      method: 'GET',
      headers: adminHeaders
    });

    if (adminUserRes.status !== 200 || !adminUserRes.body.success) {
      throw new Error(`Super admin failed to fetch doctor: status ${adminUserRes.status}`);
    }

    const adminDoctorRecord = adminUserRes.body.data;
    if (adminDoctorRecord.licenseNumber !== testDoctorLicense || adminDoctorRecord.licenseDocumentUrl !== uploadedDocUrl) {
      throw new Error('Super admin doctor details missing correct license or certificate URL');
    }

    printStep('Super Admin Can View Doctor License', 'PASS', `Super Admin verified: License "${adminDoctorRecord.licenseNumber}", Doc: "${adminDoctorRecord.licenseDocumentUrl}"`);

    // Verify Admin list query
    const adminListRes = await makeRequest(`/api/v1/admin/users?role=DOCTOR&search=${encodeURIComponent(testDoctorEmail)}`, {
      method: 'GET',
      headers: adminHeaders
    });

    if (adminListRes.status === 200 && adminListRes.body.success && adminListRes.body.data.length > 0) {
      const listed = adminListRes.body.data[0];
      if (listed.licenseDocumentUrl === uploadedDocUrl) {
        printStep('Super Admin Doctor List View', 'PASS', `List reflects licenseDocumentUrl: "${listed.licenseDocumentUrl}"`);
      }
    }

    printHeader('ALL 7 AUDIT CHECKS PASSED PERFECTLY!');
  } finally {
    // Cleanup
    printHeader('CLEANUP AUDIT RECORDS');
    if (createdDoctorId) {
      await prisma.user.delete({ where: { id: createdDoctorId } }).catch(() => {});
      printStep('Cleaned Up Test Doctor', 'INFO', `Deleted doctor ${createdDoctorId}`);
    }
    if (uploadedFileDiskPath && fs.existsSync(uploadedFileDiskPath)) {
      fs.unlinkSync(uploadedFileDiskPath);
      printStep('Cleaned Up Test Upload File', 'INFO', `Removed ${uploadedFileDiskPath}`);
    }
    if (server) {
      server.close();
    }
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error('\n❌ AUDIT FAILED WITH ERROR:', err);
  process.exit(1);
});
