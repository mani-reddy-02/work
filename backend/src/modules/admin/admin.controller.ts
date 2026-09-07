import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { Role } from '@prisma/client';

export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalHospitals,
      totalUsers,
      totalPatients,
      totalDoctors,
      totalDepartments,
      activeUsers,
    ] = await Promise.all([
      prisma.hospital.count(),
      prisma.user.count(),
      prisma.user.count({ where: { role: Role.PATIENT } }),
      prisma.user.count({ where: { role: Role.DOCTOR } }),
      prisma.department.count(),
      prisma.user.count({ where: { active: true } }),
    ]);

    res.json({
      success: true,
      data: {
        totalHospitals,
        totalUsers,
        totalPatients,
        totalDoctors,
        totalDepartments,
        activeUsers,
        totalAppointments: 0,
        todaysAppointments: 0,
        pendingVerifications: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getHospitals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitals = await prisma.hospital.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            departments: true,
            users: true,
          },
        },
        departments: {
          select: { id: true, name: true },
        },
        verifications: true,
      },
    });

    const formatted = hospitals.map((h) => ({
      id: h.id,
      name: h.name,
      businessType: h.businessType,
      facilityType: h.facilityType,
      registrationNumber: h.registrationNumber || 'N/A',
      email: h.contactEmail || 'N/A',
      phone: h.contactPhone || 'N/A',
      address: [h.addressLine1, h.area, h.city].filter(Boolean).join(', '),
      city: h.city || 'N/A',
      state: h.state || 'N/A',
      verificationStatus: h.verifications.length > 0 ? 'VERIFIED' : 'PENDING',
      status: 'ACTIVE',
      departmentCount: h._count.departments,
      doctorCount: h._count.users,
      services: h.services,
      createdAt: h.createdAt.toISOString(),
      updatedAt: h.updatedAt.toISOString(),
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        designation: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        hospital: {
          select: { id: true, name: true },
        },
        department: {
          select: { id: true, name: true },
        },
      },
    });

    const formatted = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone || 'N/A',
      role: u.role,
      status: u.active ? 'ACTIVE' : 'INACTIVE',
      hospitalName: u.hospital?.name,
      departmentName: u.department?.name,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};
