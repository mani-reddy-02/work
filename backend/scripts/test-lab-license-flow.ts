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
  printHeader('MANDATORY LAB LICENSE & CERTIFICATE UPLOAD E2E TEST');
  console.log(`Timestamp: ${new Date().toISOString()}`);

  let hospitalAdminUser: any = null;
  let hospitalAdminToken: string = '';
  let platformDept: any = null;
  let createdLabId: string | null = null;
  let createdDeptId: string | null = null;
  let createdUserId: string | null = null;
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
        users: { where: { role: Role.HOSPITAL_ADMIN } }
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

    // Find platform lab department
    platformDept = await prisma.platformLabDepartment.findFirst();
    if (!platformDept) {
      platformDept = await prisma.platformLabDepartment.create({
        data: {
          code: 'TEST_BIO',
          name: 'Clinical Biochemistry',
          description: 'Automated chemical diagnostics',
          icon: 'Flask'
        }
      });
    }

    printStep('Platform Lab Department Selected', 'PASS', `Dept: "${platformDept.name}" (${platformDept.code})`);

    const authHeaders = {
      Authorization: `Bearer ${hospitalAdminToken}`,
    };

    // 2. Validation Test: Missing labLicenseNumber
    printHeader('2. VALIDATION RULE ENFORCEMENT');
    const missingLicenseRes = await makeRequest('/api/v1/laboratories', {
      method: 'POST',
      headers: authHeaders,
      body: {
        platformDepartmentId: platformDept.id,
        // labLicenseNumber omitted
        labLicenseDocumentUrl: '/uploads/licenses/sample.pdf',
        email: `lab.test.${Date.now()}@mediquee.test`,
        password: 'password123',
        phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
      }
    });

    if (missingLicenseRes.status === 400) {
      printStep('Reject Missing labLicenseNumber', 'PASS', 'HTTP 400 Bad Request returned as expected');
    } else {
      throw new Error(`Expected HTTP 400 for missing license number, got ${missingLicenseRes.status}`);
    }

    // 3. Validation Test: License Number too short (< 3 characters)
    const shortLicenseRes = await makeRequest('/api/v1/laboratories', {
      method: 'POST',
      headers: authHeaders,
      body: {
        platformDepartmentId: platformDept.id,
        labLicenseNumber: 'AB', // < 3 chars
        labLicenseDocumentUrl: '/uploads/licenses/sample.pdf',
        email: `lab.test.${Date.now()}@mediquee.test`,
        password: 'password123',
        phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
      }
    });

    if (shortLicenseRes.status === 400) {
      printStep('Reject Short labLicenseNumber (< 3 chars)', 'PASS', 'HTTP 400 Bad Request returned as expected');
    } else {
      throw new Error(`Expected HTTP 400 for short license number, got ${shortLicenseRes.status}`);
    }

    // 4. Validation Test: Missing labLicenseDocumentUrl
    const missingDocRes = await makeRequest('/api/v1/laboratories', {
      method: 'POST',
      headers: authHeaders,
      body: {
        platformDepartmentId: platformDept.id,
        labLicenseNumber: 'CEA/LAB/2026/8921',
        // labLicenseDocumentUrl omitted
        email: `lab.test.${Date.now()}@mediquee.test`,
        password: 'password123',
        phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
      }
    });

    if (missingDocRes.status === 400) {
      printStep('Reject Missing labLicenseDocumentUrl', 'PASS', 'HTTP 400 Bad Request returned as expected');
    } else {
      throw new Error(`Expected HTTP 400 for missing license certificate URL, got ${missingDocRes.status}`);
    }

    // 5. Test File Upload Endpoint
    printHeader('3. COMPLIANCE CERTIFICATE DOCUMENT UPLOAD');
    const dummyPdfBase64 = 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwgL0xlbmd0aCA1IDAgUiAvRmlsdGVyIC9GbGF0ZURlY29kZSA+PgpzdHJlYW0KeAEr5HIKWTAwNAEAAzACVAplbmRzdHJlYW0KZW5kb2JqCg==';
    const uploadRes = await makeRequest('/api/v1/laboratories/upload-license', {
      method: 'POST',
      headers: authHeaders,
      body: {
        fileName: 'telangana_lab_accreditation_certificate.pdf',
        fileData: dummyPdfBase64,
      }
    });

    if (uploadRes.status !== 201 || !uploadRes.body.success || !uploadRes.body.data?.fileUrl) {
      throw new Error(`Upload failed: status ${uploadRes.status}, body: ${JSON.stringify(uploadRes.body)}`);
    }

    const uploadedDocUrl = uploadRes.body.data.fileUrl;
    const uploadedFileName = uploadRes.body.data.fileName;
    uploadedFileDiskPath = path.join(process.cwd(), 'uploads/licenses', uploadedFileName);

    printStep('Upload Certificate Document', 'PASS', `Stored at: "${uploadedDocUrl}" (${uploadRes.body.data.size} bytes)`);

    // Verify file exists on disk
    if (fs.existsSync(uploadedFileDiskPath)) {
      printStep('Physical Disk Verification', 'PASS', `File verified on disk: ${uploadedFileDiskPath}`);
    } else {
      throw new Error(`Uploaded file was not found on disk at: ${uploadedFileDiskPath}`);
    }

    // 6. Test Successful Laboratory Creation
    printHeader('4. FULL HOSPITAL LABORATORY CREATION');
    const testEmail = `diagnostic.lab.${Date.now()}@mediquee.test`;
    const testPhone = `91${Math.floor(10000000 + Math.random() * 90000000)}`;
    const testLicenseNumber = `CEA/LAB/2026/${Math.floor(1000 + Math.random() * 9000)}`;
    const testValidUntil = '2028-12-31';

    const createRes = await makeRequest('/api/v1/laboratories', {
      method: 'POST',
      headers: authHeaders,
      body: {
        platformDepartmentId: platformDept.id,
        labLicenseNumber: testLicenseNumber,
        labLicenseDocumentUrl: uploadedDocUrl,
        licenseValidUntil: testValidUntil,
        email: testEmail,
        password: 'Password@123',
        phone: testPhone,
      }
    });

    if (createRes.status !== 201 || !createRes.body.success) {
      throw new Error(`Laboratory creation failed: status ${createRes.status}, response: ${JSON.stringify(createRes.body)}`);
    }

    const labData = createRes.body.data;
    createdLabId = labData.lab.id;
    createdDeptId = labData.department.id;
    createdUserId = labData.user.id;

    printStep('Create Hospital Laboratory API', 'PASS', `Lab ID: ${createdLabId} | Dept ID: ${createdDeptId}`);

    // 7. Direct Database Persistence & Integrity Verification in Supabase
    printHeader('5. DIRECT SUPABASE POSTGRESQL PERSISTENCE AUDIT');

    if (!createdDeptId || !createdLabId || !createdUserId) {
      throw new Error('Created entity IDs are missing');
    }

    // 7.1 Verify Department record
    const dbDept = await prisma.department.findUnique({
      where: { id: createdDeptId }
    });

    if (!dbDept) throw new Error('Department record not found in database');
    if (dbDept.type !== 'LAB') throw new Error(`Expected Department.type to be 'LAB', got '${dbDept.type}'`);
    if (dbDept.labLicenseNumber !== testLicenseNumber) throw new Error(`Department license number mismatch: expected ${testLicenseNumber}, got ${dbDept.labLicenseNumber}`);
    if (dbDept.labLicenseDocumentUrl !== uploadedDocUrl) throw new Error(`Department license doc URL mismatch: expected ${uploadedDocUrl}, got ${dbDept.labLicenseDocumentUrl}`);

    printStep('Department Persistence Verified', 'PASS', `Type: "${dbDept.type}" | License: "${dbDept.labLicenseNumber}" | URL: "${dbDept.labLicenseDocumentUrl}"`);

    // 7.2 Verify Lab record (hospital_labs table)
    const dbLab = await prisma.lab.findUnique({
      where: { id: createdLabId }
    });

    if (!dbLab) throw new Error('Lab record not found in hospital_labs table');
    if (dbLab.labLicenseNumber !== testLicenseNumber) throw new Error(`Lab record license number mismatch: expected ${testLicenseNumber}, got ${dbLab.labLicenseNumber}`);
    if (dbLab.labLicenseDocumentUrl !== uploadedDocUrl) throw new Error(`Lab record doc URL mismatch: expected ${uploadedDocUrl}, got ${dbLab.labLicenseDocumentUrl}`);
    if (dbLab.hospitalId !== hospital.id) throw new Error(`Lab hospitalId mismatch: expected ${hospital.id}, got ${dbLab.hospitalId}`);

    printStep('Hospital Lab Persistence Verified', 'PASS', `Table: "hospital_labs" | Name: "${dbLab.name}" | Hospital ID: "${dbLab.hospitalId}"`);

    // 7.3 Verify LAB_ADMIN User
    const dbUser = await prisma.user.findUnique({
      where: { id: createdUserId }
    });

    if (!dbUser) throw new Error('User record not found in database');
    if (dbUser.role !== Role.LAB_ADMIN) throw new Error(`Expected user role to be LAB_ADMIN, got ${dbUser.role}`);
    if (dbUser.departmentId !== createdDeptId) throw new Error(`User departmentId mismatch: expected ${createdDeptId}, got ${dbUser.departmentId}`);
    if (dbUser.hospitalId !== hospital.id) throw new Error(`User hospitalId mismatch: expected ${hospital.id}, got ${dbUser.hospitalId}`);

    printStep('LAB_ADMIN User Account Verified', 'PASS', `Email: "${dbUser.email}" | Role: "${dbUser.role}" | Hospital ID: "${dbUser.hospitalId}"`);

    // 7.4 Verify Hospital Services Updated
    const dbHospital = await prisma.hospital.findUnique({
      where: { id: hospital.id },
      select: { services: true }
    });

    if (!dbHospital?.services.includes('lab_tests')) {
      throw new Error('Hospital services does not contain "lab_tests"');
    }

    printStep('Hospital Services Synced', 'PASS', `Services includes: ${dbHospital.services.join(', ')}`);

    printHeader('TEST EXECUTION SUMMARY: ALL 7 AUDITS PASSED SUCCESSFULLY');

  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED WITH ERROR:', error);
    process.exitCode = 1;
  } finally {
    // Clean up temporary records
    printHeader('CLEANUP OF TEST ARTIFACTS');
    try {
      if (createdUserId) {
        await prisma.user.delete({ where: { id: createdUserId } }).catch(() => {});
        console.log(`- Removed test user: ${createdUserId}`);
      }
      if (createdLabId) {
        await prisma.lab.delete({ where: { id: createdLabId } }).catch(() => {});
        console.log(`- Removed test lab: ${createdLabId}`);
      }
      if (createdDeptId) {
        await prisma.department.delete({ where: { id: createdDeptId } }).catch(() => {});
        console.log(`- Removed test department: ${createdDeptId}`);
      }
      if (uploadedFileDiskPath && fs.existsSync(uploadedFileDiskPath)) {
        fs.unlinkSync(uploadedFileDiskPath);
        console.log(`- Removed uploaded test file from disk: ${uploadedFileDiskPath}`);
      }
      printStep('Cleanup Completed', 'PASS');
    } catch (cleanErr) {
      console.warn('Warning during cleanup:', cleanErr);
    }

    if (server) {
      server.close();
    }
    await prisma.$disconnect();
  }
}

runTests();
