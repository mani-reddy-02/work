import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { Role, BusinessType } from '@prisma/client';

export const getHospitals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const conditionId = typeof req.query.conditionId === 'string' ? req.query.conditionId.trim() : '';
    const specialtyId = typeof req.query.specialtyId === 'string' ? req.query.specialtyId.trim() : '';
    const departmentId = typeof req.query.departmentId === 'string' ? req.query.departmentId.trim() : '';
    const city = typeof req.query.city === 'string' ? req.query.city.trim() : '';
    const location = typeof req.query.location === 'string' ? req.query.location.trim() : '';

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

    if (city) {
      whereClause.city = { contains: city, mode: 'insensitive' };
    }

    if (location) {
      whereClause.OR = [
        ...(whereClause.OR || []),
        { city: { contains: location, mode: 'insensitive' } },
        { area: { contains: location, mode: 'insensitive' } },
        { state: { contains: location, mode: 'insensitive' } }
      ];
    }

    if (departmentId) {
      whereClause.departments = {
        some: {
          id: departmentId
        }
      };
    } else if (targetSpecialtyId) {
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

    // Enforce strict filtering: if no hospitals match the condition/specialty, return empty array.

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

export const getHospitalDepartments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.params.id as string;
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      select: { id: true, name: true }
    });

    if (!hospital) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Hospital not found' }
      });
    }

    const departments = await prisma.department.findMany({
      where: { hospitalId },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        specialtyId: true,
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
        doctorCount: d._count.users
      }))
    });
  } catch (error) {
    next(error);
  }
};

export const getHospitalLaboratories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.params.id as string;
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      select: {
        id: true,
        name: true,
        city: true,
        services: true
      }
    });

    if (!hospital) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Hospital not found' }
      });
    }

    // Find all laboratories linked or matching the hospital
    const labs = await prisma.hospital.findMany({
      where: {
        OR: [
          { id: hospitalId },
          { businessType: BusinessType.LABORATORY, city: hospital.city || undefined }
        ],
        AND: [
          {
            OR: [
              { businessType: BusinessType.LABORATORY },
              { services: { hasSome: ['lab_tests', 'lab', 'laboratory', 'diagnostics'] } }
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        businessType: true,
        facilityType: true,
        logoUrl: true,
        contactPhone: true,
        contactEmail: true,
        addressLine1: true,
        area: true,
        city: true,
        state: true,
        pincode: true,
        services: true
      }
    });

    res.json({
      success: true,
      data: labs.map(lab => ({
        id: lab.id,
        name: lab.name,
        businessType: lab.businessType,
        facilityType: lab.facilityType,
        address: [lab.addressLine1, lab.area, lab.city].filter(Boolean).join(', ') || lab.city || 'India',
        location: [lab.area, lab.city, lab.state].filter(Boolean).join(', ') || lab.city || 'India',
        contactPhone: lab.contactPhone,
        services: lab.services,
        rating: 4.8,
        price: '₹399'
      }))
    });
  } catch (error) {
    next(error);
  }
};

