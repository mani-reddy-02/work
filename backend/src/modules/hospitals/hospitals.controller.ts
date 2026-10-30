import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { Role, BusinessType } from '@prisma/client';
import { checkAndExpireDoctorOverrides } from '../doctors/doctor-override.service';
import { calculateHaversineDistanceKm, formatDistanceText, parseGeoParams, getEffectiveCoordinates } from '../../utils/geo';

export const getHospitals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const conditionId = typeof req.query.conditionId === 'string' ? req.query.conditionId.trim() : '';
    const specialtyId = typeof req.query.specialtyId === 'string' ? req.query.specialtyId.trim() : '';
    const departmentId = typeof req.query.departmentId === 'string' ? req.query.departmentId.trim() : '';
    const city = typeof req.query.city === 'string' ? req.query.city.trim() : '';
    const location = typeof req.query.location === 'string' ? req.query.location.trim() : '';
    const service = typeof req.query.service === 'string' ? req.query.service.trim() : '';
    const businessType = typeof req.query.businessType === 'string' ? req.query.businessType.trim() : '';

    const geo = parseGeoParams(req.query);

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

    let targetSpecialtyName: string | null = null;
    if (targetSpecialtyId) {
      const spec = await prisma.platformSpecialty.findUnique({
        where: { id: targetSpecialtyId },
        select: { name: true }
      });
      if (spec) {
        targetSpecialtyName = spec.name;
      }
    }

    const whereClause: any = {
      verificationStatus: { in: ['APPROVED', 'VERIFIED'] }
    };

    // Filter by businessType if provided, otherwise default to HOSPITAL for hospital endpoints
    if (businessType && (businessType === 'HOSPITAL' || businessType === 'LABORATORY')) {
      whereClause.businessType = businessType as BusinessType;
    } else if (!req.query.allowAllBusinessTypes) {
      // By default, hospital discovery only returns actual hospitals, not standalone labs
      whereClause.businessType = BusinessType.HOSPITAL;
    }

    if (service) {
      whereClause.services = { has: service };
    }

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

    if (location && !geo.hasCoords) {
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
          id: departmentId,
          users: { some: { role: Role.DOCTOR, active: true } }
        }
      };
    } else if (targetSpecialtyId) {
      if (targetSpecialtyName) {
        whereClause.departments = {
          some: {
            OR: [
              { specialtyId: targetSpecialtyId },
              { name: { equals: targetSpecialtyName, mode: 'insensitive' } }
            ],
            users: { some: { role: Role.DOCTOR, active: true } }
          }
        };
      } else {
        whereClause.departments = {
          some: {
            specialtyId: targetSpecialtyId,
            users: { some: { role: Role.DOCTOR, active: true } }
          }
        };
      }
    }

    // Enforce strict disease-driven filter: if conditionId was passed but no targetSpecialtyId was resolved, 
    // it means the disease doesn't exist or isn't mapped, so return empty.
    if (conditionId && !targetSpecialtyId) {
      return res.json({ success: true, data: [], meta: { total: 0 } });
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

    let formatted = hospitals.map(h => {
      let distance: number | null = null;
      let distanceText: string | null = null;

      const effectiveCoords = getEffectiveCoordinates(h);

      if (geo.hasCoords && effectiveCoords) {
        distance = calculateHaversineDistanceKm(geo.lat!, geo.lng!, effectiveCoords.latitude, effectiveCoords.longitude);
        distanceText = formatDistanceText(distance);
      }

      return {
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
        latitude: effectiveCoords?.latitude ?? h.latitude ?? null,
        longitude: effectiveCoords?.longitude ?? h.longitude ?? null,
        distance,
        distanceText,
        services: h.services,
        departments: h.departments.map(d => d.name),
        departmentList: h.departments,
        doctorCount: h._count.users,
        rating: h.rating ?? null,
        reviewCount: h.reviewCount ?? 0
      };
    });

    // Apply strict location proximity filtering when nearby filtering is active
    if (geo.hasCoords && geo.nearbyOnly) {
      // Exclude providers with missing/invalid coordinates or outside configured radius
      formatted = formatted.filter(h => h.distance !== null && h.distance <= geo.radius);
      // Sort ascending by distance (nearest first)
      formatted.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    }

    res.json({
      success: true,
      data: formatted,
      meta: {
        total: formatted.length,
        nearbyRadiusKm: geo.radius,
        hasLocationFilter: geo.hasCoords && geo.nearbyOnly,
        userLocation: geo.hasCoords ? { lat: geo.lat, lng: geo.lng } : null
      }
    });
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
        latitude: hospital.latitude,
        longitude: hospital.longitude,
        services: hospital.services,
        departments: hospital.departments.map(d => d.name),
        departmentList: hospital.departments,
        doctorCount: hospital._count.users,
        rating: hospital.rating ?? null,
        reviewCount: hospital.reviewCount ?? 0
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
    const conditionId = typeof req.query.conditionId === 'string' ? req.query.conditionId.trim() : '';

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

    let targetSpecialtyId = '';
    if (conditionId) {
      const condition = await prisma.platformCondition.findUnique({
        where: { id: conditionId },
        select: { specialtyId: true }
      });
      if (condition) {
        targetSpecialtyId = condition.specialtyId;
      } else {
        // Condition not found, strict matching returns empty
        return res.json({ success: true, data: [] });
      }
    }

    await checkAndExpireDoctorOverrides();

    const now = new Date();
    const whereClause: any = {
      hospitalId,
      role: Role.DOCTOR,
      active: true,
      AND: [
        {
          OR: [
            { inactiveUntil: null },
            { inactiveUntil: { lte: now } }
          ]
        }
      ]
    };

    if (targetSpecialtyId) {
      whereClause.department = {
        specialtyId: targetSpecialtyId
      };
    } else if (departmentId) {
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
        specialization: true,
        qualification: true,
        experienceYears: true,
        consultationFee: true,
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

    if (doctors.length === 0 && (departmentId || departmentName) && !conditionId) {
      doctors = await prisma.user.findMany({
        where: {
          hospitalId,
          role: Role.DOCTOR,
          active: true,
          AND: [
            {
              OR: [
                { inactiveUntil: null },
                { inactiveUntil: { lte: now } }
              ]
            }
          ]
        },
        select: {
          id: true,
          name: true,
          designation: true,
          specialization: true,
          qualification: true,
          experienceYears: true,
          consultationFee: true,
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
        specialization: doc.department?.name || doc.specialization || doc.designation || 'Not specified',
        qualification: doc.qualification || 'Not specified',
        experience: doc.experienceYears ? `${doc.experienceYears}+ Years` : 'Not specified',
        designation: doc.designation || 'Not specified',
        avatar: doc.avatar,
        hospitalId: doc.hospitalId,
        hospitalName: doc.hospital?.name || hospital.name,
        departmentId: doc.departmentId,
        department: doc.department?.name || 'Not assigned',
        fees: doc.consultationFee ? `₹${doc.consultationFee}` : 'Not specified',
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

