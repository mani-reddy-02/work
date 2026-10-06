import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { Role } from '@prisma/client';

export const getAdminDepartments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { search, hospitalId, diseaseId, doctorId, status } = req.query;

    const whereClause: any = {};

    if (search) {
      whereClause.name = { contains: search as string, mode: 'insensitive' };
    }
    if (hospitalId && hospitalId !== 'all') {
      whereClause.departments = { some: { hospitalId: hospitalId as string } };
    }
    if (diseaseId && diseaseId !== 'all') {
      whereClause.conditions = { some: { id: diseaseId as string } };
    }
    if (doctorId && doctorId !== 'all') {
      whereClause.departments = { some: { users: { some: { id: doctorId as string } } } };
    }
    // Note: status is not in PlatformSpecialty, so we ignore or map if it existed

    const total = await prisma.platformSpecialty.count({ where: whereClause });

    const specialties = await prisma.platformSpecialty.findMany({
      where: whereClause,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: {
          select: {
            conditions: true,
            departments: true,
          }
        },
        departments: {
          include: {
            _count: {
              select: {
                users: {
                  where: { role: Role.DOCTOR, active: true }
                }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const formatted = specialties.map(s => {
      const doctorCount = s.departments.reduce((acc, d) => acc + d._count.users, 0);
      return {
        id: s.id,
        name: s.name,
        description: s.description,
        diseaseCount: s._count.conditions,
        hospitalCount: s._count.departments,
        doctorCount,
        status: 'ACTIVE',
        createdAt: s.createdAt.toISOString(),
      };
    });

    res.json({ 
      success: true, 
      data: formatted,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminDepartmentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const specialty = await prisma.platformSpecialty.findUnique({
      where: { id },
      include: {
        conditions: {
          orderBy: { name: 'asc' }
        },
        departments: {
          include: {
            hospital: {
              select: { id: true, name: true, city: true, _count: { select: { users: { where: { role: Role.DOCTOR } } } } }
            },
            users: {
              where: { role: Role.DOCTOR },
              select: { id: true, name: true, specialization: true, experienceYears: true, active: true }
            },
            _count: {
              select: {
                users: {
                  where: { role: Role.DOCTOR, active: true }
                }
              }
            }
          }
        }
      }
    });

    if (!specialty) {
      return res.status(404).json({ success: false, error: { message: 'Department not found' } });
    }

    const doctorCount = specialty.departments.reduce((acc, d) => acc + d._count.users, 0);
    
    // Extract unique hospitals and doctors
    const hospitalsMap = new Map();
    const doctorsMap = new Map();
    
    specialty.departments.forEach(d => {
      if (d.hospital) {
        if (!hospitalsMap.has(d.hospital.id)) {
          hospitalsMap.set(d.hospital.id, {
            id: d.hospital.id,
            name: d.hospital.name,
            city: d.hospital.city,
            totalDoctors: d.hospital._count.users
          });
        }
      }
      if (d.users) {
        d.users.forEach(u => {
          if (!doctorsMap.has(u.id)) {
            doctorsMap.set(u.id, u);
          }
        });
      }
    });

    const appointments = await prisma.oPBooking.findMany({
      where: { department: { specialtyId: id } },
      orderBy: { appointmentDate: 'desc' },
      include: {
        patient: { select: { id: true, name: true } },
        doctor: { select: { id: true, name: true } },
        hospital: { select: { id: true, name: true } }
      }
    });

    res.json({
      success: true,
      data: {
        id: specialty.id,
        name: specialty.name,
        description: specialty.description,
        status: 'ACTIVE',
        createdAt: specialty.createdAt.toISOString(),
        diseases: specialty.conditions,
        hospitals: Array.from(hospitalsMap.values()),
        doctors: Array.from(doctorsMap.values()),
        appointments,
        diseaseCount: specialty.conditions.length,
        hospitalCount: hospitalsMap.size,
        doctorCount,
        appointmentCount: appointments.length
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createAdminDisease = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const specialtyId = req.params.id as string;
    const { name, description, icon } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, error: { message: 'Disease name is required' } });
    }

    const existing = await prisma.platformCondition.findFirst({
      where: { specialtyId, name: { equals: name.trim(), mode: 'insensitive' } }
    });

    if (existing) {
      return res.status(409).json({ success: false, error: { message: 'Disease already exists in this department' } });
    }

    const condition = await prisma.platformCondition.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        icon: icon ? icon.trim() : null,
        specialtyId
      }
    });

    res.status(201).json({ success: true, data: condition });
  } catch (error) {
    next(error);
  }
};

export const updateAdminDisease = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const diseaseId = req.params.diseaseId as string;
    const { name, description, isActive, icon } = req.body; // isActive might not exist on schema yet

    const condition = await prisma.platformCondition.findUnique({ where: { id: diseaseId } });
    if (!condition) {
      return res.status(404).json({ success: false, error: { message: 'Disease not found' } });
    }

    const updated = await prisma.platformCondition.update({
      where: { id: diseaseId },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description: description ? description.trim() : null } : {}),
        ...(icon !== undefined ? { icon: icon ? icon.trim() : null } : {})
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteAdminDisease = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const diseaseId = req.params.diseaseId as string;
    
    // Instead of hard deleting, we might want to check if it's used.
    // PlatformCondition is used in OPBooking.
    const usage = await prisma.oPBooking.count({ where: { conditionId: diseaseId } });
    
    if (usage > 0) {
      return res.status(400).json({ success: false, error: { message: 'Cannot delete disease because it is referenced in appointments. Consider deactivating it instead.' } });
    }

    await prisma.platformCondition.delete({ where: { id: diseaseId } });
    res.json({ success: true, message: 'Disease removed' });
  } catch (error) {
    next(error);
  }
};

export const createAdminDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, error: { message: 'Department name is required' } });
    }

    const existing = await prisma.platformSpecialty.findFirst({
      where: { name: { equals: name.trim(), mode: 'insensitive' } }
    });

    if (existing) {
      return res.status(409).json({ success: false, error: { message: 'Department already exists' } });
    }

    const specialty = await prisma.platformSpecialty.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
      }
    });

    res.status(201).json({ success: true, data: specialty });
  } catch (error) {
    next(error);
  }
};

export const updateAdminDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { name, description } = req.body;

    const specialty = await prisma.platformSpecialty.findUnique({ where: { id } });
    if (!specialty) {
      return res.status(404).json({ success: false, error: { message: 'Department not found' } });
    }

    if (name) {
      const existing = await prisma.platformSpecialty.findFirst({
        where: { name: { equals: name.trim(), mode: 'insensitive' }, id: { not: id } }
      });
      if (existing) {
        return res.status(409).json({ success: false, error: { message: 'Another department with this name already exists' } });
      }
    }

    const updated = await prisma.platformSpecialty.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description: description ? description.trim() : null } : {})
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const getDepartmentFilters = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitals = await prisma.hospital.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });
    const diseases = await prisma.platformCondition.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });
    const doctors = await prisma.user.findMany({ where: { role: 'DOCTOR' }, select: { id: true, name: true }, orderBy: { name: 'asc' } });
    
    res.json({
      success: true,
      data: {
        hospitals,
        diseases,
        doctors
      }
    });
  } catch (error) {
    next(error);
  }
};
