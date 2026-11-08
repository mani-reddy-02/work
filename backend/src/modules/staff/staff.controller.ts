import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { sendNotification } from '../notifications/notifications.service';

import { checkAndExpireDoctorOverrides } from '../doctors/doctor-override.service';

const UPLOADS_LICENSES_DIR = path.join(process.cwd(), 'uploads/licenses');
if (!fs.existsSync(UPLOADS_LICENSES_DIR)) {
  fs.mkdirSync(UPLOADS_LICENSES_DIR, { recursive: true });
}

// Staff roles that can be managed by a Hospital Admin
const STAFF_ROLES: Role[] = [Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST, Role.LAB_ADMIN];

export const getStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user!.hospitalId;
    if (!hospitalId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'User does not belong to a hospital' } });
    }

    await checkAndExpireDoctorOverrides();

    const staff = await prisma.user.findMany({
      where: {
        hospitalId,
        role: { in: STAFF_ROLES },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        designation: true,
        active: true,
        avatar: true,
        gender: true,
        dob: true,
        address: true,
        bio: true,
        specialization: true,
        qualification: true,
        experienceYears: true,
        consultationFee: true,
        licenseNumber: true,
        licenseDocumentUrl: true,
        inactiveUntil: true,
        inactiveReason: true,
        overrideUpdatedBy: true,
        doctorSchedules: {
          select: {
            dayOfWeek: true,
            isAvailable: true,
            startTime: true,
            endTime: true,
            videoStartTime: true,
            videoEndTime: true
          }
        },
        createdAt: true,
        updatedAt: true,
        department: { select: { id: true, name: true, code: true } }
        // passwordHash is intentionally EXCLUDED
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

export const createStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user!.hospitalId;
    if (!hospitalId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'User does not belong to a hospital' } });
    }

    const { 
      name, email, password, role, phone, designation, avatar, departmentId,
      experienceYears, licenseNumber, licenseDocumentUrl, consultationFee, qualification, specialization,
      bio, gender, dob, address
    } = req.body;

    // Verify role is in the allowlist (double-check beyond Zod)
    if (!STAFF_ROLES.includes(role as Role)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid staff role' } });
    }

    // If departmentId is supplied, verify it belongs to this hospital
    let deptName: string | null = null;
    if (departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: departmentId } });
      if (!dept || dept.hospitalId !== hospitalId) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Department does not belong to this hospital' } });
      }
      deptName = dept.name;
    }

    // Check for duplicate email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'A user with this email already exists' } });
    }

    // Check for duplicate phone if provided
    if (phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingPhone) {
        return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'A user with this phone number already exists' } });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        passwordHash,
        role: role as Role,
        active: role === Role.DOCTOR ? false : true, // Doctors require Super Admin verification before activation
        designation: designation || (role === 'DOCTOR' && deptName ? `Consultant - ${deptName}` : null),
        avatar: avatar || null,
        hospitalId, // ALWAYS from the authenticated admin, NEVER from the request
        departmentId: departmentId || null,
        experienceYears: experienceYears !== undefined && experienceYears !== null ? Number(experienceYears) : null,
        licenseNumber: licenseNumber || null,
        licenseDocumentUrl: licenseDocumentUrl || null,
        consultationFee: consultationFee !== undefined && consultationFee !== null ? Number(consultationFee) : null,
        qualification: qualification || (role === 'DOCTOR' ? 'MBBS, MD' : null),
        specialization: specialization || (role === 'DOCTOR' && deptName ? deptName : null),
        bio: bio || null,
        gender: gender || null,
        dob: dob || null,
        address: address || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        designation: true,
        active: true,
        createdAt: true,
        specialization: true,
        qualification: true,
        experienceYears: true,
        consultationFee: true,
        licenseNumber: true,
        licenseDocumentUrl: true,
        department: { select: { id: true, name: true, code: true } }
      },
    });

    // INTERNAL_EVENT: New staff registered. No user notification generated.

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const updateStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user!.hospitalId;
    if (!hospitalId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'User does not belong to a hospital' } });
    }

    const { id } = req.params;
    const { 
      name, phone, designation, departmentId, active,
      experienceYears, licenseNumber, licenseDocumentUrl, consultationFee, qualification, specialization,
      bio, gender, dob, address, avatar
    } = req.body;

    // Find target user
    const targetUser = await prisma.user.findUnique({ where: { id: id as string } });
    if (!targetUser) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Staff member not found' } });
    }

    // Verify ownership: target must belong to the same hospital
    if (targetUser.hospitalId !== hospitalId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Unauthorized to modify this staff member' } });
    }

    // Verify target is a staff role (not admin/superadmin)
    if (!STAFF_ROLES.includes(targetUser.role)) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Cannot modify this user type' } });
    }

    // If departmentId is supplied, verify it belongs to this hospital
    if (departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: departmentId } });
      if (!dept || dept.hospitalId !== hospitalId) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Department does not belong to this hospital' } });
      }
    }

    const updated = await prisma.user.update({
      where: { id: id as string },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(designation !== undefined && { designation }),
        ...(active !== undefined && { active }),
        ...(avatar !== undefined && { avatar }),
        ...(departmentId !== undefined && { departmentId: departmentId || null }),
        ...(experienceYears !== undefined && { experienceYears: experienceYears === null ? null : Number(experienceYears) }),
        ...(licenseNumber !== undefined && { licenseNumber }),
        ...(licenseDocumentUrl !== undefined && { licenseDocumentUrl }),
        ...(consultationFee !== undefined && { consultationFee: consultationFee === null ? null : Number(consultationFee) }),
        ...(qualification !== undefined && { qualification }),
        ...(specialization !== undefined && { specialization }),
        ...(bio !== undefined && { bio }),
        ...(gender !== undefined && { gender }),
        ...(dob !== undefined && { dob }),
        ...(address !== undefined && { address }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        designation: true,
        active: true,
        updatedAt: true,
        specialization: true,
        qualification: true,
        experienceYears: true,
        consultationFee: true,
        licenseNumber: true,
        licenseDocumentUrl: true,
        department: { select: { id: true, name: true, code: true } }
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const uploadStaffLicense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileData, fileName } = req.body;
    if (!fileData || !fileName) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'fileData and fileName are required' }
      });
    }

    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(String(fileName)).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DOCUMENT_FORMAT', message: 'Invalid document format. Only PDF, JPEG, and PNG files are allowed.' }
      });
    }

    // Process base64 file data & MIME check
    let base64Content = fileData;
    let mimeType = '';
    const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      mimeType = matches[1].toLowerCase();
      base64Content = matches[2];
    }

    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (mimeType && !allowedMimeTypes.includes(mimeType)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DOCUMENT_FORMAT', message: 'Invalid document MIME type. Only PDF, JPEG, and PNG files are allowed.' }
      });
    }

    const fileBuffer = Buffer.from(base64Content, 'base64');

    if (fileBuffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: { code: 'FILE_TOO_LARGE', message: 'File size must not exceed 10MB' }
      });
    }

    // Validate binary magic numbers
    const isPdf = fileBuffer.length >= 4 && fileBuffer.toString('ascii', 0, 4) === '%PDF';
    const isPng = fileBuffer.length >= 8 && fileBuffer[0] === 0x89 && fileBuffer[1] === 0x50 && fileBuffer[2] === 0x4E && fileBuffer[3] === 0x47;
    const isJpg = fileBuffer.length >= 3 && fileBuffer[0] === 0xFF && fileBuffer[1] === 0xD8 && fileBuffer[2] === 0xFF;

    if (!isPdf && !isPng && !isJpg) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DOCUMENT_FORMAT', message: 'Invalid document signature. File content does not match allowed types (PDF, JPEG, PNG).' }
      });
    }

    // Discard client-provided base filename and generate a cryptographically random filename
    const safeFileName = `doctor-license-${crypto.randomUUID()}${ext}`;
    const filePath = path.join(UPLOADS_LICENSES_DIR, safeFileName);

    fs.writeFileSync(filePath, fileBuffer);

    const fileUrl = `/uploads/licenses/${safeFileName}`;

    res.status(201).json({
      success: true,
      data: {
        fileUrl,
        fileName: safeFileName,
        size: fileBuffer.length
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deactivateStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user!.hospitalId;
    if (!hospitalId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'User does not belong to a hospital' } });
    }

    const { id } = req.params;

    const targetUser = await prisma.user.findUnique({ where: { id: id as string } });
    if (!targetUser) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Staff member not found' } });
    }

    if (targetUser.hospitalId !== hospitalId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Unauthorized to deactivate this staff member' } });
    }

    if (!STAFF_ROLES.includes(targetUser.role)) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Cannot deactivate this user type' } });
    }

    // Deactivate, do NOT delete
    await prisma.user.update({
      where: { id: id as string },
      data: { active: false },
    });

    res.json({ success: true, message: 'Staff member deactivated successfully' });
  } catch (error) {
    next(error);
  }
};
