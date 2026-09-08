import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { Role } from '@prisma/client';

export const getHospitals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const conditionId = typeof req.query.conditionId === 'string' ? req.query.conditionId.trim() : '';
    const specialtyId = typeof req.query.specialtyId === 'string' ? req.query.specialtyId.trim() : '';

    let targetSpecialtyId = specialtyId;
    if (conditionId && !targetSpecialtyId) {
      const condition = await prisma.platformCondition.findUnique({
        where: { id: conditionId },
        select: { specialtyId: true }
      });
      if (condition) {
        targetSpecialtyId = condition.specialtyId;
      }
    }

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { area: { contains: search, mode: 'insensitive' } },
        { addressLine1: { contains: search, mode: 'insensitive' } },
        { departments: { some: { name: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    if (targetSpecialtyId) {
      whereClause.departments = {
        some: {
          specialtyId: targetSpecialtyId
        }
      };
    }

    let hospitals = await prisma.hospital.findMany({
      where: whereClause,
      include: {
        departments: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
            specialtyId: true,
            specialty: {
              select: { id: true, name: true }
            }
          }
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

    if (targetSpecialtyId && hospitals.length === 0) {
      hospitals = await prisma.hospital.findMany({
        where: search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } }
          ]
        } : undefined,
        include: {
          departments: {
            select: {
              id: true,
              name: true,
              code: true,
              description: true,
              specialtyId: true,
              specialty: {
                select: { id: true, name: true }
              }
            }
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
    }

    const formatted = hospitals.map(h => ({
      id: h.id,
      name: h.name,
      businessType: h.businessType,
      facilityType: h.facilityType,
      registrationNumber: h.registrationNumber,
      logoUrl: h.logoUrl,
      contactPhone: h.contactPhone,
      contactEmail: h.contactEmail,
      addressLine1: h.addressLine1,
      area: h.area,
      city: h.city,
      state: h.state,
      pincode: h.pincode,
      services: h.services,
      departments: h.departments.map(d => d.name),
      departmentList: h.departments,
      doctorCount: h._count.users
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

export const getHospitalById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const hospital = await prisma.hospital.findUnique({
      where: { id },
      include: {
        departments: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
            specialtyId: true,
            specialty: {
              select: { id: true, name: true }
            }
          }
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

    if (!hospital) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Hospital not found' }
      });
    }

    res.json({
      success: true,
      data: {
        id: hospital.id,
        name: hospital.name,
        businessType: hospital.businessType,
        facilityType: hospital.facilityType,
        registrationNumber: hospital.registrationNumber,
        logoUrl: hospital.logoUrl,
        contactPhone: hospital.contactPhone,
        contactEmail: hospital.contactEmail,
        website: hospital.website,
        addressLine1: hospital.addressLine1,
        area: hospital.area,
        city: hospital.city,
        state: hospital.state,
        pincode: hospital.pincode,
        services: hospital.services,
        departments: hospital.departments.map(d => d.name),
        departmentList: hospital.departments,
        doctorCount: hospital._count.users
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getHospitalDoctors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.params.id as string;
    const departmentId = typeof req.query.departmentId === 'string' ? req.query.departmentId.trim() : '';
    const departmentName = typeof req.query.department === 'string' ? req.query.department.trim() : '';

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      select: { id: true, name: true, city: true }
    });

    if (!hospital) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Hospital not found' }
      });
    }

    const whereClause: any = {
      hospitalId,
      role: Role.DOCTOR,
      active: true
    };

    if (departmentId) {
      whereClause.departmentId = departmentId;
    } else if (departmentName) {
      whereClause.department = {
        name: { equals: departmentName, mode: 'insensitive' }
      };
    }

    let doctors = await prisma.user.findMany({
      where: whereClause,
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
          select: { id: true, name: true, specialtyId: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    if (doctors.length === 0 && (departmentId || departmentName)) {
      doctors = await prisma.user.findMany({
        where: {
          hospitalId,
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
            select: { id: true, name: true, specialtyId: true }
          }
        },
        orderBy: { name: 'asc' }
      });
    }

    res.json({
      success: true,
      data: doctors.map(doc => ({
        id: doc.id,
        name: doc.name,
        specialization: doc.department?.name || doc.designation || 'General Specialist',
        qualification: 'MBBS, MD',
        experience: '10+ Years',
        designation: doc.designation || 'Consultant Specialist',
        avatar: doc.avatar,
        hospitalId: doc.hospitalId,
        hospitalName: doc.hospital?.name || hospital.name,
        departmentId: doc.departmentId,
        department: doc.department?.name || 'General Medicine',
        fees: '₹500',
        rating: 4.8
      }))
    });
  } catch (error) {
    next(error);
  }
};
