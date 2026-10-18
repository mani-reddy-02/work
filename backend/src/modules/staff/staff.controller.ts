import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { sendNotification } from '../notifications/notifications.service';

import { checkAndExpireDoctorOverrides } from '../doctors/doctor-override.service';

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
      experienceYears, licenseNumber, consultationFee, qualification, specialization,
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
        designation: designation || (role === 'DOCTOR' && deptName ? `Consultant - ${deptName}` : null),
        avatar: avatar || null,
        hospitalId, // ALWAYS from the authenticated admin, NEVER from the request
        departmentId: departmentId || null,
        experienceYears: experienceYears !== undefined && experienceYears !== null ? Number(experienceYears) : null,
        licenseNumber: licenseNumber || null,
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
      experienceYears, licenseNumber, consultationFee, qualification, specialization,
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
        department: { select: { id: true, name: true, code: true } }
      },
    });

    res.json({ success: true, data: updated });
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
