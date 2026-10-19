import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { Role, BusinessType } from '@prisma/client';
import { checkAndExpireDoctorOverrides } from '../doctors/doctor-override.service';

export const getHospitals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const conditionId = typeof req.query.conditionId === 'string' ? req.query.conditionId.trim() : '';
    const specialtyId = typeof req.query.specialtyId === 'string' ? req.query.specialtyId.trim() : '';
    const departmentId = typeof req.query.departmentId === 'string' ? req.query.departmentId.trim() : '';
    const city = typeof req.query.city === 'string' ? req.query.city.trim() : '';
    const location = typeof req.query.location === 'string' ? req.query.location.trim() : '';
    const consultationType = ((req.query.consultationType as string) || 'OP').toUpperCase() === 'VIDEO' ? 'VIDEO' : 'OP';

    let targetSpecialtyId = specialtyId;
    let targetConditionName = '';

    if (conditionId) {
      const condition = await prisma.platformCondition.findUnique({
        where: { id: conditionId },
        include: { specialty: true }
      });
      if (condition) {
        targetSpecialtyId = condition.specialtyId;
        targetConditionName = condition.name.trim();
      } else {
        // Enforce strict disease-driven filter: conditionId invalid/missing -> return empty
        return res.json({ success: true, data: [] });
      }
    }

    await checkAndExpireDoctorOverrides();
    const now = new Date();

    const hospitalWhere: any = {
      verificationStatus: 'APPROVED',
      businessType: BusinessType.HOSPITAL
    };

    if (city) {
      hospitalWhere.city = { contains: city, mode: 'insensitive' };
    }

    if (location) {
      hospitalWhere.OR = [
        ...(hospitalWhere.OR || []),
        { city: { contains: location, mode: 'insensitive' } },
        { area: { contains: location, mode: 'insensitive' } },
        { state: { contains: location, mode: 'insensitive' } }
      ];
    }

    if (search) {
      hospitalWhere.OR = [
        ...(hospitalWhere.OR || []),
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { area: { contains: search, mode: 'insensitive' } },
        { addressLine1: { contains: search, mode: 'insensitive' } },
        { departments: { some: { name: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    const hospitals = await prisma.hospital.findMany({
      where: hospitalWhere,
      include: {
        departments: {
          where: {
            isActive: true,
            type: 'CLINICAL'
          },
          include: {
            specialty: true,
            diseases: {
              where: { isActive: true }
            },
            users: {
              where: {
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
              include: {
                doctorSchedules: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const formatted: any[] = [];

    for (const h of hospitals) {
      // 1. Consultation service capability check
      if (consultationType === 'VIDEO') {
        if (!h.services || !h.services.includes('video_consultation')) {
          continue;
        }
      } else {
        if (h.services && h.services.length > 0 && !h.services.includes('op_consultation')) {
          continue;
        }
      }

      // 2. Department and Doctor matching
      const matchingDepartments: any[] = [];

      for (const dept of h.departments) {
        let deptMatches = false;

        if (targetConditionName) {
          const hasConfiguredDisease = dept.diseases && dept.diseases.some(d =>
            d.name.toLowerCase() === targetConditionName.toLowerCase() ||
            d.name.toLowerCase().includes(targetConditionName.toLowerCase()) ||
            targetConditionName.toLowerCase().includes(d.name.toLowerCase())
          );
          const matchesSpecialty = !!(targetSpecialtyId && dept.specialtyId === targetSpecialtyId);
          deptMatches = hasConfiguredDisease || matchesSpecialty;
        } else if (targetSpecialtyId) {
          deptMatches = dept.specialtyId === targetSpecialtyId;
        } else if (departmentId) {
          deptMatches = dept.id === departmentId;
        } else {
          deptMatches = true;
        }

        if (!deptMatches) continue;

        // Check doctors in this department with available schedule for the consultation type
        const eligibleDoctors = (dept.users || []).filter(doc => {
          if (!doc.active) return false;
          if (doc.inactiveUntil && doc.inactiveUntil > now) return false;

          if (consultationType === 'VIDEO') {
            return doc.doctorSchedules && doc.doctorSchedules.some(s => s.isAvailable && s.videoStartTime && s.videoEndTime);
          } else {
            return doc.doctorSchedules && doc.doctorSchedules.some(s => s.isAvailable && s.startTime && s.endTime);
          }
        });

        if (eligibleDoctors.length > 0) {
          matchingDepartments.push({
            id: dept.id,
            name: dept.name,
            code: dept.code,
            description: dept.description,
            specialtyId: dept.specialtyId,
            specialty: dept.specialty,
            doctorCount: eligibleDoctors.length,
            doctors: eligibleDoctors
          });
        }
      }

      // Hospital is eligible ONLY if it has at least one matching department with eligible doctors
      if (matchingDepartments.length > 0) {
        const distinctDoctors = Array.from(
          new Map(matchingDepartments.flatMap(d => d.doctors).map(doc => [doc.id, doc])).values()
        );

        formatted.push({
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
          relevantDepartment: matchingDepartments[0].name,
          departments: matchingDepartments.map(d => d.name),
          departmentList: matchingDepartments.map(d => ({
            id: d.id,
            name: d.name,
            code: d.code,
            description: d.description,
            specialtyId: d.specialtyId,
            specialty: d.specialty,
            doctorCount: d.doctorCount
          })),
          doctorCount: distinctDoctors.length,
          eligibleDoctorCount: distinctDoctors.length,
          eligibleDoctors: distinctDoctors.map(d => ({
            id: d.id,
            name: d.name,
            designation: d.designation,
            specialization: d.specialization
          }))
        });
      }
    }

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
    const conditionId = typeof req.query.conditionId === 'string' ? req.query.conditionId.trim() : '';
    const consultationType = ((req.query.consultationType as string) || 'OP').toUpperCase() === 'VIDEO' ? 'VIDEO' : 'OP';

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      select: {
        id: true,
        name: true,
        city: true,
        services: true,
        businessType: true,
        verificationStatus: true
      }
    });

    if (!hospital || hospital.verificationStatus !== 'APPROVED') {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Hospital not found or not approved' }
      });
    }

    // Verify hospital consultation capability
    if (consultationType === 'VIDEO') {
      if (!hospital.services || !hospital.services.includes('video_consultation')) {
        return res.json({ success: true, data: [] });
      }
    } else {
      if (hospital.services && hospital.services.length > 0 && !hospital.services.includes('op_consultation')) {
        return res.json({ success: true, data: [] });
      }
    }

    let targetSpecialtyId = '';
    let targetConditionName = '';
    if (conditionId) {
      const condition = await prisma.platformCondition.findUnique({
        where: { id: conditionId },
        include: { specialty: true }
      });
      if (condition) {
        targetSpecialtyId = condition.specialtyId;
        targetConditionName = condition.name.trim();
      } else {
        // Condition not found, strict matching returns empty
        return res.json({ success: true, data: [] });
      }
    }

    await checkAndExpireDoctorOverrides();

    const now = new Date();
    const doctors = await prisma.user.findMany({
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
      include: {
        hospital: {
          select: { id: true, name: true, city: true }
        },
        department: {
          include: {
            specialty: true,
            diseases: { where: { isActive: true } }
          }
        },
        doctorSchedules: true
      },
      orderBy: { name: 'asc' }
    });

    const eligibleDoctors: any[] = [];
    const seenDoctorIds = new Set<string>();

    for (const doc of doctors) {
      if (seenDoctorIds.has(doc.id)) continue;

      // Department & Disease matching
      if (targetConditionName || targetSpecialtyId) {
        if (!doc.department || !doc.department.isActive || doc.department.type !== 'CLINICAL') {
          continue;
        }

        const hasConfiguredDisease = doc.department.diseases && doc.department.diseases.some(d =>
          d.name.toLowerCase() === targetConditionName.toLowerCase() ||
          d.name.toLowerCase().includes(targetConditionName.toLowerCase()) ||
          targetConditionName.toLowerCase().includes(d.name.toLowerCase())
        );
        const matchesSpecialty = !!(targetSpecialtyId && doc.department.specialtyId === targetSpecialtyId);

        if (!hasConfiguredDisease && !matchesSpecialty) {
          continue;
        }
      } else if (departmentId) {
        if (doc.departmentId !== departmentId) continue;
      } else if (departmentName) {
        if (doc.department?.name.toLowerCase() !== departmentName.toLowerCase()) continue;
      }

      // Schedule availability check
      let hasSchedule = false;
      if (consultationType === 'VIDEO') {
        hasSchedule = doc.doctorSchedules && doc.doctorSchedules.some(s => s.isAvailable && s.videoStartTime && s.videoEndTime);
      } else {
        hasSchedule = doc.doctorSchedules && doc.doctorSchedules.some(s => s.isAvailable && s.startTime && s.endTime);
      }

      if (!hasSchedule) continue;

      seenDoctorIds.add(doc.id);
      eligibleDoctors.push({
        id: doc.id,
        name: doc.name,
        specialization: doc.specialization || doc.department?.name || 'General Medicine',
        qualification: doc.qualification || 'MBBS, MD',
        experience: doc.experienceYears ? `${doc.experienceYears}+ Years` : '8+ Years',
        experienceYears: doc.experienceYears,
        designation: doc.designation || 'Senior Consultant',
        avatar: doc.avatar,
        dob: doc.dob,
        gender: doc.gender,
        hospitalId: doc.hospitalId,
        hospitalName: doc.hospital?.name || hospital.name,
        departmentId: doc.departmentId,
        department: doc.department?.name || 'General Medicine',
        fees: doc.consultationFee ? `₹${doc.consultationFee}` : '₹500',
        consultationFee: doc.consultationFee || 500,
        rating: 4.8
      });
    }

    res.json({
      success: true,
      data: eligibleDoctors
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

