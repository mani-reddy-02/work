import { prisma } from '../../config/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { env } from '../../config/env';
import { BusinessType, Role } from '@prisma/client';
import { resolveCoordinatesForLocation } from '../../utils/geo';
import { storageService } from '../../services/storage.service';

const DOC_TITLES: Record<string, string> = {
  registrationCertificate: 'Hospital Registration Certificate',
  clinicalEstablishment: 'Clinical Establishment Registration',
  nabh: 'NABH Accreditation Certificate',
  nabl: 'NABL Accreditation Certificate',
  fireSafety: 'Fire Safety Certificate / NOC',
  bioWaste: 'Biomedical Waste Authorization',
  gst: 'GST Registration Certificate',
  pan: 'PAN / Business Tax Document',
  pharmacyLicense: 'Pharmacy License',
  iso: 'ISO Certification',
  otherCertifications: 'Other Certification',
};

// Maps the frontend UI role selector values to the authoritative database Role enum.
const UI_ROLE_TO_DB_ROLE: Record<string, Role> = {
  admin: Role.HOSPITAL_ADMIN,
  super_admin: Role.SUPER_ADMIN,
  doctor: Role.DOCTOR,
  nurse: Role.NURSE,
  receptionist: Role.RECEPTIONIST,
  lab: Role.LAB_ADMIN,
  patient: Role.PATIENT,
};

// Memory map for tracking failed login attempts per identifier to prevent brute force
const failedLoginAttempts = new Map<string, { count: number; lockedUntil?: number }>();

export class AuthService {
  static async login(identifier: string, password: string, selectedRole?: string) {
    const normIdentifier = identifier.toLowerCase().trim();
    const attemptRecord = failedLoginAttempts.get(normIdentifier);
    if (attemptRecord?.lockedUntil && attemptRecord.lockedUntil > Date.now()) {
      const waitMinutes = Math.ceil((attemptRecord.lockedUntil - Date.now()) / 60000);
      throw new Error(`Too many failed login attempts. Account temporarily locked for ${waitMinutes} minute(s).`);
    }

    console.log('[LOGIN_DEBUG] LOGIN REQUEST RECEIVED');
    console.log('[LOGIN_DEBUG] IDENTIFIER TYPE:', identifier.includes('@') ? 'EMAIL' : 'PHONE');

    // Find user by email or phone (case-insensitive for email)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: 'insensitive' } },
          { phone: identifier },
        ],
      },
    });

    console.log('[LOGIN_DEBUG] USER FOUND:', user ? 'YES' : 'NO');

    if (!user) {
      const record = failedLoginAttempts.get(normIdentifier) || { count: 0 };
      record.count += 1;
      if (record.count >= 5) {
        record.lockedUntil = Date.now() + 15 * 60 * 1000;
      }
      failedLoginAttempts.set(normIdentifier, record);
      throw new Error('Invalid credentials');
    }

    if (!user.active) {
      console.log('[LOGIN_DEBUG] ACCOUNT IS DEACTIVATED');
      throw new Error('Account is deactivated');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    console.log('[LOGIN_DEBUG] PASSWORD CHECK RESULT:', isValid ? 'MATCH' : 'NO MATCH');
    
    if (!isValid) {
      const record = failedLoginAttempts.get(normIdentifier) || { count: 0 };
      record.count += 1;
      if (record.count >= 5) {
        record.lockedUntil = Date.now() + 15 * 60 * 1000;
      }
      failedLoginAttempts.set(normIdentifier, record);
      throw new Error('Invalid credentials');
    }

    // Clear failed attempts counter on successful authentication
    failedLoginAttempts.delete(normIdentifier);

    // If a role was selected on the login UI, verify it matches the database role.
    if (selectedRole) {
      const expectedDbRole = UI_ROLE_TO_DB_ROLE[selectedRole.toLowerCase()];
      if (!expectedDbRole || expectedDbRole !== user.role) {
        throw new Error('Role mismatch');
      }
    }

    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET as string, { expiresIn: env.JWT_EXPIRES_IN as any });

    return {
      token,
      role: user.role,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        hospitalId: user.hospitalId,
      },
    };
  }

  static async registerPatient(payload: {
    name: string;
    phone: string;
    password: string;
    email?: string;
    whatsappConsent?: boolean;
    otp: string;
  }) {
    // Enforce mandatory WhatsApp OTP verification before patient registration
    if (!payload.otp || typeof payload.otp !== 'string' || payload.otp.trim().length < 4) {
      throw new Error('Valid WhatsApp OTP code is required for registration');
    }

    const { WhatsAppOtpService } = await import('../whatsapp/whatsapp-otp.service');
    const verifyResult = await WhatsAppOtpService.verifyOtp(payload.phone, payload.otp.trim());
    if (!verifyResult.valid) {
      throw new Error(verifyResult.message || 'Invalid or expired WhatsApp OTP');
    }

    const searchConditions: any[] = [{ phone: payload.phone }];
    if (payload.email) {
      searchConditions.push({ email: payload.email });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: searchConditions,
      },
    });

    if (existingUser) {
      if (existingUser.phone === payload.phone) {
        throw new Error('User with this mobile number already exists');
      }
      throw new Error('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);

    const user = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email || null,
        phone: payload.phone,
        passwordHash,
        role: Role.PATIENT,
        whatsappConsent: payload.whatsappConsent ?? true,
      },
    });

    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET as string, { expiresIn: env.JWT_EXPIRES_IN as any });

    return {
      token,
      role: user.role,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    };
  }

  static async register(payload: any) {
    // If patient registration payload
    if (payload.name && payload.phone && !payload.businessType) {
      return this.registerPatient(payload);
    }

    // Check if hospital admin user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: payload.account.email },
          { phone: payload.account.phone },
        ],
      },
    });

    if (existingUser) {
      throw new Error('User with this email or phone already exists');
    }

    const passwordHash = await bcrypt.hash(payload.account.password, 10);
    
    const info = payload.hospitalInfo || payload.labInfo || {};
    const loc = payload.hospitalLocation || payload.labLocation || {};
    const services = payload.hospitalServices?.services || payload.labServices?.services || [];
    const depts = payload.hospitalDepartments?.departments || payload.labDepartments?.departments || [];
    const customDepts = payload.hospitalDepartments?.customDepartments || payload.labDepartments?.customDepartments || [];
    const admin = payload.hospitalAdmin || payload.labAdmin || payload.account;
    const verification = payload.hospitalVerification || payload.labVerification || {};
    const bType = payload.businessType.businessType === 'hospital' ? BusinessType.HOSPITAL : BusinessType.LABORATORY;

    const resolvedCoords = resolveCoordinatesForLocation({
      pincode: loc.pincode,
      city: loc.city,
      area: loc.area,
      address: loc.address1 || loc.address2,
    });

    let createdHospitalId: string | null = null;
    try {
      // 1. Create Hospital
      const hospital = await prisma.hospital.create({
        data: {
          name: info.hospitalName || info.labName || payload.account.name,
          businessType: bType,
          facilityType: info.hospitalType || info.labType,
          registrationNumber: info.registrationNumber,
          contactPhone: info.hospitalPhone || info.labPhone,
          contactEmail: info.hospitalEmail || info.labEmail,
          website: info.website,
          establishedYear: info.establishedYear,
          addressLine1: loc.address1,
          addressLine2: loc.address2,
          area: loc.area,
          city: loc.city,
          state: loc.state,
          country: loc.country,
          pincode: loc.pincode,
          latitude: loc.latitude != null ? Number(loc.latitude) : (resolvedCoords?.latitude ?? null),
          longitude: loc.longitude != null ? Number(loc.longitude) : (resolvedCoords?.longitude ?? null),
          emergencyContact: loc.emergencyContact,
          services: services,
        },
      });
      createdHospitalId = hospital.id;

      // 2. Fetch platform specialties for automatic specialtyId linking (only if departments provided)
      if (depts.length > 0 || customDepts.length > 0) {
        const platformSpecialties = await prisma.platformSpecialty.findMany({
          where: { isActive: true },
          select: { id: true, name: true },
        });
        const specialtyMap = new Map(
          platformSpecialties.map((s) => [s.name.trim().toLowerCase(), s.id])
        );

        // Create Departments with auto-linked specialtyId
        const deptData = depts.map((d: string) => {
          const trimmed = (d || '').trim();
          const matchedId = specialtyMap.get(trimmed.toLowerCase()) || null;
          return {
            hospitalId: hospital.id,
            name: trimmed,
            specialtyId: matchedId,
          };
        });

        const customDeptData = customDepts.map((d: any) => {
          const trimmed = (d.name || '').trim();
          const matchedId = specialtyMap.get(trimmed.toLowerCase()) || null;
          return {
            hospitalId: hospital.id,
            name: trimmed,
            code: d.code,
            description: d.description,
            specialtyId: matchedId,
          };
        });

        await prisma.department.createMany({
          data: [...deptData, ...customDeptData],
          skipDuplicates: true,
        });
      }

      // 3. Create Admin User
      const user = await prisma.user.create({
        data: {
          name: admin.adminName || payload.account.name,
          email: payload.account.email,
          phone: payload.account.phone,
          passwordHash,
          role: bType === BusinessType.LABORATORY ? Role.LAB_ADMIN : Role.HOSPITAL_ADMIN,
          designation: admin.adminRole || (bType === BusinessType.LABORATORY ? 'Lab Administrator' : 'Hospital Administrator'),
          hospitalId: hospital.id,
        },
      });

      // 4. Process & Persist Verification Documents
      for (const [key, docValue] of Object.entries(verification)) {
        if (!docValue) continue;

        let fileBuffer: Buffer | null = null;
        let originalFileName = `${key}.pdf`;
        let mimeType = 'application/pdf';

        if (typeof docValue === 'string') {
          if (docValue.startsWith('data:')) {
            const matches = docValue.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
              mimeType = matches[1];
              fileBuffer = Buffer.from(matches[2], 'base64');
            }
          } else if (docValue.startsWith('http://') || docValue.startsWith('https://') || docValue.startsWith('/uploads/')) {
            await prisma.hospitalVerification.create({
              data: {
                hospitalId: hospital.id,
                documentType: DOC_TITLES[key] || key,
                fileUrl: docValue,
              }
            });
            continue;
          }
        } else if (typeof docValue === 'object' && docValue !== null) {
          const docObj = docValue as any;
          if (docObj.fileData && typeof docObj.fileData === 'string') {
            const matches = docObj.fileData.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
              mimeType = matches[1] || docObj.mimeType || 'application/pdf';
              fileBuffer = Buffer.from(matches[2], 'base64');
            }
          }
          if (docObj.fileName) {
            originalFileName = docObj.fileName;
          }
        }

        if (fileBuffer) {
          try {
            const ext = path.extname(originalFileName) || (mimeType.includes('pdf') ? '.pdf' : '.png');
            const cleanFileName = `hosp_verif_${hospital.id}_${key}_${Date.now()}${ext}`;
            const uploadResult = await storageService.uploadFile('licenses', cleanFileName, fileBuffer, mimeType);

            await prisma.hospitalVerification.create({
              data: {
                hospitalId: hospital.id,
                documentType: DOC_TITLES[key] || key,
                fileUrl: uploadResult.fileUrl,
              }
            });
          } catch (uploadErr) {
            console.error(`[Verification Upload Failed for ${key}]:`, uploadErr);
          }
        }
      }

      const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });

      return { user, hospital, token };
    } catch (error) {
      if (createdHospitalId) {
        try {
          await prisma.hospitalVerification.deleteMany({ where: { hospitalId: createdHospitalId } });
          await prisma.department.deleteMany({ where: { hospitalId: createdHospitalId } });
          await prisma.hospital.delete({ where: { id: createdHospitalId } });
        } catch (cleanupErr) {
          console.error('[Registration Rollback Error]:', cleanupErr);
        }
      }
      throw error;
    }
  }
}
