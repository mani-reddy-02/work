import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { Role, Prisma } from '@prisma/client';
import { sendNotification } from '../notifications/notifications.service';

export const getDepartments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalIdQuery = typeof req.query.hospitalId === 'string' ? req.query.hospitalId.trim() : '';
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const specialtyId = typeof req.query.specialtyId === 'string' ? req.query.specialtyId.trim() : '';

    const hospitalId = hospitalIdQuery || req.user?.hospitalId;

    const whereClause: any = {};
    if (hospitalId) {
      whereClause.hospitalId = hospitalId;
    }
    if (specialtyId) {
      whereClause.specialtyId = specialtyId;
    }
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const departments = await prisma.department.findMany({
      where: whereClause,
      include: {
        hospital: {
          select: { id: true, name: true, city: true }
        },
        specialty: {
          select: { id: true, name: true }
        },
        _count: {
          select: {
            users: {
              where: { role: Role.DOCTOR, active: true }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: departments.map(d => ({
        id: d.id,
        name: d.name,
        code: d.code,
        description: d.description,
        specialtyId: d.specialtyId,
        specialty: d.specialty,
        hospitalId: d.hospitalId,
        hospitalName: d.hospital?.name,
        doctorCount: d._count.users
      }))
    });
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user!.hospitalId;
    if (!hospitalId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'User does not belong to a hospital' } });
    }

    let { name, code, description, specialtyId } = req.body;

    // Infer name and code from PlatformSpecialty if not provided
    if (!name || !code) {
      const specialty = await prisma.platformSpecialty.findUnique({ where: { id: specialtyId } });
      if (!specialty) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Platform specialty not found' } });
      }
      if (!name) name = specialty.name;
      if (!code) code = specialty.name.substring(0, 3).toUpperCase();
    }

    // 1. Check if department for this platform specialty already exists in the hospital
    if (specialtyId) {
      const existingSpecialty = await prisma.department.findFirst({
        where: { hospitalId, specialtyId }
      });
      if (existingSpecialty) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'CONFLICT',
            message: `Department for '${existingSpecialty.name}' already exists in your hospital.`
          }
        });
      }
    }

    const trimmedName = name.trim();
    const trimmedCode = code ? code.trim().toUpperCase() : undefined;

    // 2. Check for duplicate name or code in the same hospital (case-insensitive)
    const orConditions: Prisma.DepartmentWhereInput[] = [
      { name: { equals: trimmedName, mode: 'insensitive' } },
    ];
    if (trimmedCode) {
      orConditions.push({ code: { equals: trimmedCode, mode: 'insensitive' } });
    }

    const existing = await prisma.department.findFirst({
      where: {
        hospitalId,
        OR: orConditions
      }
    });

    if (existing) {
      const isNameMatch = existing.name.toLowerCase() === trimmedName.toLowerCase();
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: isNameMatch
            ? `Department '${trimmedName}' already exists in your hospital.`
            : `Department code '${trimmedCode}' is already in use by '${existing.name}'.`
        }
      });
    }

    const department = await prisma.department.create({
      data: {
        name: trimmedName,
        code: trimmedCode,
        description: description ? description.trim() : null,
        specialtyId,
        hospitalId
      }
    });

    sendNotification({
      hospitalId,
      title: 'New Department Created',
      message: `Department "${trimmedName}" (${trimmedCode}) was created.`,
      type: 'department',
      metadata: { departmentId: department.id, name: trimmedName, code: trimmedCode }
    }).catch(console.error);

    res.status(201).json({ success: true, data: department });
  } catch (error) {
    next(error);
  }
};

export const updateDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user!.hospitalId;
    if (!hospitalId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'User does not belong to a hospital' } });
    }

    const { id } = req.params;
    const { name, code, description, specialtyId } = req.body;

    const department = await prisma.department.findUnique({
      where: { id: id as string }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Department not found' } });
    }

    if (department.hospitalId !== hospitalId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Unauthorized to modify this department' } });
    }

    // Check if updating specialty to one already used in this hospital
    if (specialtyId && specialtyId !== department.specialtyId) {
      const existingSpecialty = await prisma.department.findFirst({
        where: { hospitalId, specialtyId, id: { not: id as string } }
      });
      if (existingSpecialty) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'CONFLICT',
            message: `Department for this specialty ('${existingSpecialty.name}') already exists in your hospital.`
          }
        });
      }
    }

    const trimmedName = name ? name.trim() : undefined;
    const trimmedCode = code ? code.trim().toUpperCase() : undefined;

    const duplicateConditions: Prisma.DepartmentWhereInput[] = [];
    if (trimmedName && trimmedName.toLowerCase() !== department.name.toLowerCase()) {
      duplicateConditions.push({ name: { equals: trimmedName, mode: 'insensitive' } });
    }
    if (trimmedCode && trimmedCode.toLowerCase() !== (department.code || '').toLowerCase()) {
      duplicateConditions.push({ code: { equals: trimmedCode, mode: 'insensitive' } });
    }

    if (duplicateConditions.length > 0) {
      const existing = await prisma.department.findFirst({
        where: {
          hospitalId,
          id: { not: id as string },
          OR: duplicateConditions
        }
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'A department with this name or code already exists in your hospital.'
          }
        });
      }
    }

    const updated = await prisma.department.update({
      where: { id: id as string },
      data: {
        ...(trimmedName ? { name: trimmedName } : {}),
        ...(trimmedCode !== undefined ? { code: trimmedCode } : {}),
        ...(description !== undefined ? { description: description ? description.trim() : null } : {}),
        ...(specialtyId ? { specialtyId } : {})
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user!.hospitalId;
    if (!hospitalId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'User does not belong to a hospital' } });
    }

    const { id } = req.params;

    const department = await prisma.department.findUnique({
      where: { id: id as string }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Department not found' } });
    }

    if (department.hospitalId !== hospitalId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Unauthorized to delete this department' } });
    }

    // In a real system, you might check if there are users/staff assigned to this department
    // but right now there's no relation in Prisma schema between User and Department.

    await prisma.department.delete({
      where: { id: id as string }
    });

    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getDepartmentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        hospital: {
          select: { id: true, name: true, city: true, contactPhone: true, addressLine1: true }
        },
        specialty: {
          select: { id: true, name: true, description: true }
        },
        _count: {
          select: {
            users: {
              where: { role: Role.DOCTOR, active: true }
            }
          }
        }
      }
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Department not found' }
      });
    }

    res.json({
      success: true,
      data: {
        id: department.id,
        name: department.name,
        code: department.code,
        description: department.description,
        specialtyId: department.specialtyId,
        specialty: department.specialty,
        hospitalId: department.hospitalId,
        hospital: department.hospital,
        doctorCount: department._count.users
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getDepartmentDoctors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        hospital: {
          select: { id: true, name: true, city: true }
        }
      }
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Department not found' }
      });
    }

    const doctors = await prisma.user.findMany({
      where: {
        departmentId: id,
        role: Role.DOCTOR,
        active: true
      },
      select: {
        id: true,
        name: true,
        designation: true,
        avatar: true,
        dob: true,
        gender: true,
        hospitalId: true,
        departmentId: true,
        hospital: {
          select: { id: true, name: true, city: true }
        },
        department: {
          select: { id: true, name: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: doctors.map(doc => ({
        id: doc.id,
        name: doc.name,
        specialization: department.name,
        qualification: 'MBBS, MD',
        experience: '10+ Years',
        designation: doc.designation || 'Consultant Specialist',
        avatar: doc.avatar,
        hospitalId: doc.hospitalId,
        hospitalName: doc.hospital?.name || department.hospital?.name,
        departmentId: doc.departmentId,
        department: department.name,
        fees: '₹500',
        rating: 4.8
      }))
    });
  } catch (error) {
    next(error);
  }
};

