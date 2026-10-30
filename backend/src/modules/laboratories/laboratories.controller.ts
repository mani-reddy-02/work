import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { BusinessType, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { sendNotification } from '../notifications/notifications.service';
import { calculateHaversineDistanceKm, formatDistanceText, parseGeoParams, getEffectiveCoordinates } from '../../utils/geo';

export const getLaboratories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const type = req.query.type as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const hospitalId = typeof req.query.hospitalId === 'string' ? req.query.hospitalId.trim() : '';
    const location = (typeof req.query.location === 'string' && req.query.location.trim() !== '' && req.query.location !== 'ALL')
      ? req.query.location.trim()
      : ((typeof req.query.place === 'string' && req.query.place.trim() !== '' && req.query.place !== 'ALL') ? req.query.place.trim() : '');
    const verificationStatus = req.query.verificationStatus as string;

    const geo = parseGeoParams(req.query);

    // Fetch authoritative counts for summary tiles (laboratories only, no hospitals or unrelated users)
    const [
      standaloneApprovedCount,
      standalonePendingCount,
      standaloneTotalCount,
      hospitalBasedApprovedCount,
      hospitalBasedPendingCount,
      hospitalBasedTotalCount
    ] = await Promise.all([
      prisma.hospital.count({ where: { businessType: BusinessType.LABORATORY, verificationStatus: { in: ['APPROVED', 'VERIFIED'] } } }),
      prisma.hospital.count({ where: { businessType: BusinessType.LABORATORY, verificationStatus: 'PENDING' } }),
      prisma.hospital.count({ where: { businessType: BusinessType.LABORATORY } }),
      prisma.lab.count({ where: { type: 'HOSPITAL_BASED', verificationStatus: { in: ['APPROVED', 'VERIFIED'] } } }),
      prisma.lab.count({ where: { type: 'HOSPITAL_BASED', verificationStatus: 'PENDING' } }),
      prisma.lab.count({ where: { type: 'HOSPITAL_BASED' } })
    ]);

    const totalLabCount = standaloneTotalCount + hospitalBasedTotalCount;
    const approvedLabCount = standaloneApprovedCount + hospitalBasedApprovedCount;
    const pendingLabCount = standalonePendingCount + hospitalBasedPendingCount;

    let items: any[] = [];

    // 1. Fetch Standalone Labs (stored in Hospital table with businessType = LABORATORY)
    if (!type || type === 'ALL' || type === 'STANDALONE') {
      const hospWhere: any = { businessType: BusinessType.LABORATORY };

      if (verificationStatus && verificationStatus !== 'ALL') {
        const vStatus = verificationStatus.toUpperCase();
        if (vStatus === 'APPROVED' || vStatus === 'VERIFIED') {
          hospWhere.verificationStatus = { in: ['APPROVED', 'VERIFIED'] };
        } else if (vStatus === 'PENDING') {
          hospWhere.verificationStatus = { equals: 'PENDING', mode: 'insensitive' };
        } else {
          hospWhere.verificationStatus = { equals: verificationStatus, mode: 'insensitive' };
        }
      }

      if (hospitalId && hospitalId !== 'ALL') {
        hospWhere.id = hospitalId;
      }

      if (location && !geo.hasCoords) {
        hospWhere.OR = [
          { city: { contains: location, mode: 'insensitive' } },
          { area: { contains: location, mode: 'insensitive' } },
          { state: { contains: location, mode: 'insensitive' } },
          { addressLine1: { contains: location, mode: 'insensitive' } }
        ];
      }

      if (search) {
        hospWhere.AND = [
          ...(hospWhere.AND || []),
          {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { id: { contains: search, mode: 'insensitive' } },
              { city: { contains: search, mode: 'insensitive' } },
              { area: { contains: search, mode: 'insensitive' } },
              { state: { contains: search, mode: 'insensitive' } },
              { addressLine1: { contains: search, mode: 'insensitive' } },
              { contactPhone: { contains: search, mode: 'insensitive' } },
              { contactEmail: { contains: search, mode: 'insensitive' } }
            ]
          }
        ];
      }

      const standaloneHospitals = await prisma.hospital.findMany({
        where: hospWhere,
        select: {
          id: true,
          name: true,
          businessType: true,
          facilityType: true,
          logoUrl: true,
          contactPhone: true,
          contactEmail: true,
          addressLine1: true,
          addressLine2: true,
          area: true,
          city: true,
          state: true,
          pincode: true,
          latitude: true,
          longitude: true,
          services: true,
          hospitalShare: true,
          verificationStatus: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { name: 'asc' }
      });

      items.push(...standaloneHospitals.map(lab => {
        let distance: number | null = null;
        let distanceText: string | null = null;

        const coords = getEffectiveCoordinates(lab);
        if (geo.hasCoords && coords && coords.latitude != null && coords.longitude != null) {
          distance = calculateHaversineDistanceKm(geo.lat!, geo.lng!, coords.latitude, coords.longitude);
          distanceText = formatDistanceText(distance);
        }

        return {
          id: lab.id,
          name: lab.name,
          businessType: lab.businessType,
          facilityType: lab.facilityType || 'Standalone Laboratory',
          type: 'STANDALONE',
          logoUrl: lab.logoUrl,
          contactPhone: lab.contactPhone,
          contactEmail: lab.contactEmail,
          addressLine1: lab.addressLine1,
          area: lab.area,
          city: lab.city,
          state: lab.state,
          pincode: lab.pincode,
          latitude: coords?.latitude ?? lab.latitude,
          longitude: coords?.longitude ?? lab.longitude,
          distance,
          distanceText,
          location: [lab.area, lab.city, lab.state].filter(Boolean).join(', ') || lab.city || 'India',
          address: [lab.addressLine1, lab.area, lab.city].filter(Boolean).join(', ') || lab.city || 'India',
          services: lab.services,
          hospitalShare: lab.hospitalShare ?? null,
          verificationStatus: lab.verificationStatus || 'APPROVED',
          createdAt: lab.createdAt.toISOString(),
          updatedAt: lab.updatedAt.toISOString(),
          hospitalName: null,
          hospitalId: null,
          rating: (lab as any).rating ?? null,
          reviewCount: (lab as any).reviewCount ?? 0,
          time: 'Within 24 Hours'
        };
      }));
    }

    // 2. Fetch Hospital-Based Labs (stored in Lab model with type = HOSPITAL_BASED)
    if (!type || type === 'ALL' || type === 'HOSPITAL_BASED') {
      const labWhere: any = { type: 'HOSPITAL_BASED' };

      if (verificationStatus && verificationStatus !== 'ALL') {
        const vStatus = verificationStatus.toUpperCase();
        if (vStatus === 'APPROVED' || vStatus === 'VERIFIED') {
          labWhere.verificationStatus = { in: ['APPROVED', 'VERIFIED'] };
        } else if (vStatus === 'PENDING') {
          labWhere.verificationStatus = { equals: 'PENDING', mode: 'insensitive' };
        } else {
          labWhere.verificationStatus = { equals: verificationStatus, mode: 'insensitive' };
        }
      }

      if (hospitalId && hospitalId !== 'ALL') {
        labWhere.hospitalId = hospitalId;
      }

      if (location && !geo.hasCoords) {
        labWhere.OR = [
          { city: { contains: location, mode: 'insensitive' } },
          { state: { contains: location, mode: 'insensitive' } },
          { address: { contains: location, mode: 'insensitive' } }
        ];
      }

      if (search) {
        labWhere.AND = [
          ...(labWhere.AND || []),
          {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { id: { contains: search, mode: 'insensitive' } },
              { city: { contains: search, mode: 'insensitive' } },
              { state: { contains: search, mode: 'insensitive' } },
              { address: { contains: search, mode: 'insensitive' } },
              { contactPhone: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { hospital: { name: { contains: search, mode: 'insensitive' } } }
            ]
          }
        ];
      }

      const hospBasedLabs = await prisma.lab.findMany({
        where: labWhere,
        include: {
          hospital: {
            select: { id: true, name: true, city: true, state: true, addressLine1: true, contactPhone: true, contactEmail: true, hospitalShare: true, latitude: true, longitude: true, rating: true, reviewCount: true }
          }
        },
        orderBy: { name: 'asc' }
      });

      items.push(...hospBasedLabs.map(lab => {
        const coords = getEffectiveCoordinates(lab, lab.hospital);
        let distance: number | null = null;
        let distanceText: string | null = null;

        if (geo.hasCoords && coords && coords.latitude != null && coords.longitude != null) {
          distance = calculateHaversineDistanceKm(geo.lat!, geo.lng!, coords.latitude, coords.longitude);
          distanceText = formatDistanceText(distance);
        }

        return {
          id: lab.id,
          name: lab.name,
          businessType: 'HOSPITAL',
          facilityType: 'Hospital-Based Laboratory',
          type: 'HOSPITAL_BASED',
          logoUrl: null,
          contactPhone: lab.contactPhone || lab.hospital?.contactPhone || null,
          contactEmail: lab.email || lab.hospital?.contactEmail || null,
          addressLine1: lab.address || lab.hospital?.addressLine1 || null,
          area: null,
          city: lab.city || lab.hospital?.city || null,
          state: lab.state || lab.hospital?.state || null,
          pincode: lab.pinCode || null,
          latitude: coords?.latitude ?? (lab.latitude ?? lab.hospital?.latitude ?? null),
          longitude: coords?.longitude ?? (lab.longitude ?? lab.hospital?.longitude ?? null),
          distance,
          distanceText,
          location: [lab.city || lab.hospital?.city, lab.state || lab.hospital?.state].filter(Boolean).join(', ') || 'India',
          address: [lab.address || lab.hospital?.addressLine1, lab.city || lab.hospital?.city].filter(Boolean).join(', ') || 'India',
          services: ['lab_tests', 'diagnostics'],
          hospitalShare: lab.hospital?.hospitalShare ?? null,
          verificationStatus: lab.verificationStatus || 'APPROVED',
          createdAt: lab.createdAt.toISOString(),
          updatedAt: lab.updatedAt.toISOString(),
          hospitalName: lab.hospital?.name || null,
          hospitalId: lab.hospital?.id || null,
          hospital: lab.hospital,
          rating: (lab as any).rating ?? lab.hospital?.rating ?? null,
          reviewCount: (lab as any).reviewCount ?? lab.hospital?.reviewCount ?? 0,
          time: 'Within 24 Hours'
        };
      }));
    }

    // Apply strict location proximity filtering when nearby filtering is active
    if (geo.hasCoords && geo.nearbyOnly) {
      items = items.filter(l => l.distance !== null && l.distance <= geo.radius);
      items.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    }

    // Fetch minimum test prices and test counts for each lab
    const labIds = items.map(l => l.id);
    const parentHospitalIds = items.map(l => l.hospitalId).filter(Boolean);
    const allQueryIds = Array.from(new Set([...labIds, ...parentHospitalIds]));

    const offerings = await prisma.labTest.findMany({
      where: {
        hospitalId: { in: allQueryIds },
        isActive: true,
      },
      select: {
        hospitalId: true,
        price: true,
      }
    });

    const labStatsMap = new Map<string, { minPrice: number; count: number }>();
    for (const o of offerings) {
      const existing = labStatsMap.get(o.hospitalId);
      if (!existing) {
        labStatsMap.set(o.hospitalId, { minPrice: o.price, count: 1 });
      } else {
        existing.count += 1;
        if (o.price < existing.minPrice) existing.minPrice = o.price;
      }
    }

    const formatted = items.map(lab => {
      const stats = labStatsMap.get(lab.id) || (lab.hospitalId ? labStatsMap.get(lab.hospitalId) : undefined);
      const minPrice = stats?.minPrice ? `₹${Math.round(stats.minPrice)}` : '₹149';

      return {
        ...lab,
        price: minPrice,
        testCount: stats?.count || 0
      };
    });

    // Pagination
    const totalItems = formatted.length;
    const startIndex = (page - 1) * limit;
    const paginatedResults = formatted.slice(startIndex, startIndex + limit);

    res.json({
      success: true,
      data: paginatedResults,
      pagination: {
        total: totalItems,
        page,
        limit,
        totalPages: Math.ceil(totalItems / limit) || 1,
        nearbyRadiusKm: geo.radius,
        hasLocationFilter: geo.hasCoords && geo.nearbyOnly,
        userLocation: geo.hasCoords ? { lat: geo.lat, lng: geo.lng } : null
      },
      summary: {
        total: totalLabCount,
        approved: approvedLabCount,
        pending: pendingLabCount
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getLaboratoryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    
    // First try finding in Hospital table
    let hospitalLab = await prisma.hospital.findFirst({
      where: {
        id,
        OR: [
          { businessType: BusinessType.LABORATORY },
          { services: { hasSome: ['lab_tests', 'lab', 'laboratory', 'diagnostics'] } }
        ]
      },
      include: {
        verifications: true,
        labs: {
          include: {
            schedules: true,
            platformDepartment: true
          }
        }
      }
    });

    let labRecord: any = null;
    let associatedHospital: any = null;
    let schedules: any[] = [];
    let verifications: any[] = [];
    let isStandalone = true;
    let labLicenseNumber = null;
    let labLicenseDocumentUrl = null;
    let licenseValidUntil: any = null;

    if (hospitalLab) {
      isStandalone = hospitalLab.businessType === BusinessType.LABORATORY;
      verifications = hospitalLab.verifications || [];
      if (hospitalLab.labs && hospitalLab.labs.length > 0) {
        schedules = hospitalLab.labs[0].schedules || [];
        labLicenseNumber = hospitalLab.labs[0].labLicenseNumber;
        labLicenseDocumentUrl = hospitalLab.labs[0].labLicenseDocumentUrl;
        licenseValidUntil = hospitalLab.labs[0].licenseValidUntil;
      }
      if (!isStandalone) {
        associatedHospital = {
          id: hospitalLab.id,
          name: hospitalLab.name,
          city: hospitalLab.city,
          state: hospitalLab.state,
          address: hospitalLab.addressLine1,
          phone: hospitalLab.contactPhone,
          email: hospitalLab.contactEmail
        };
      }
    } else {
      // Try finding in Lab table
      labRecord = await prisma.lab.findUnique({
        where: { id },
        include: {
          hospital: {
            include: {
              verifications: true
            }
          },
          schedules: true,
          platformDepartment: true
        }
      });

      if (!labRecord) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Laboratory not found' }
        });
      }

      isStandalone = labRecord.type === 'STANDALONE';
      schedules = labRecord.schedules || [];
      labLicenseNumber = labRecord.labLicenseNumber;
      labLicenseDocumentUrl = labRecord.labLicenseDocumentUrl;
      licenseValidUntil = labRecord.licenseValidUntil;
      verifications = labRecord.hospital?.verifications || [];
      if (labRecord.hospital) {
        associatedHospital = {
          id: labRecord.hospital.id,
          name: labRecord.hospital.name,
          city: labRecord.hospital.city,
          state: labRecord.hospital.state,
          address: labRecord.hospital.addressLine1,
          phone: labRecord.hospital.contactPhone,
          email: labRecord.hospital.contactEmail
        };
      }
    }

    const targetHospitalId = hospitalLab ? hospitalLab.id : (labRecord?.hospitalId || id);

    // Get offerings for this lab
    const offerings = await prisma.labTest.findMany({
      where: {
        OR: [
          { hospitalId: targetHospitalId, isActive: true },
          { hospitalId: id, isActive: true }
        ]
      },
      include: {
        platformTest: true
      },
      orderBy: { platformTest: { name: 'asc' } }
    });

    const minPrice = offerings.length > 0 
      ? Math.min(...offerings.map(o => o.price))
      : 149;

    const baseRecord: any = hospitalLab || labRecord;

    const formattedData = {
      id: baseRecord.id,
      name: baseRecord.name,
      businessType: hospitalLab ? hospitalLab.businessType : (isStandalone ? 'LABORATORY' : 'HOSPITAL'),
      facilityType: hospitalLab?.facilityType || (isStandalone ? 'Standalone Laboratory' : 'Hospital Laboratory Department'),
      type: isStandalone ? 'STANDALONE' : 'HOSPITAL_BASED',
      logoUrl: hospitalLab?.logoUrl || null,
      status: hospitalLab ? 'Active' : (labRecord?.status || 'Active'),
      verificationStatus: baseRecord.verificationStatus || 'APPROVED',
      cancellationReason: baseRecord.cancellationReason || null,
      cancelledAt: baseRecord.cancelledAt ? baseRecord.cancelledAt.toISOString() : null,
      registrationNumber: hospitalLab?.registrationNumber || null,
      establishedYear: hospitalLab?.establishedYear || null,
      labLicenseNumber: labLicenseNumber || hospitalLab?.registrationNumber || null,
      labLicenseDocumentUrl: labLicenseDocumentUrl || null,
      licenseValidUntil: licenseValidUntil ? licenseValidUntil.toISOString() : null,
      contactPhone: baseRecord.contactPhone || hospitalLab?.contactPhone || '—',
      contactEmail: hospitalLab?.contactEmail || labRecord?.email || '—',
      email: hospitalLab?.contactEmail || labRecord?.email || '—',
      website: hospitalLab?.website || null,
      emergencyContact: hospitalLab?.emergencyContact || null,
      addressLine1: hospitalLab?.addressLine1 || labRecord?.address || '—',
      addressLine2: hospitalLab?.addressLine2 || null,
      area: hospitalLab?.area || null,
      city: hospitalLab?.city || labRecord?.city || '—',
      state: hospitalLab?.state || labRecord?.state || '—',
      pincode: hospitalLab?.pincode || labRecord?.pinCode || null,
      pinCode: hospitalLab?.pincode || labRecord?.pinCode || null,
      latitude: baseRecord.latitude ?? baseRecord.hospital?.latitude ?? null,
      longitude: baseRecord.longitude ?? baseRecord.hospital?.longitude ?? null,
      country: hospitalLab?.country || 'India',
      location: [hospitalLab?.area, hospitalLab?.city || labRecord?.city, hospitalLab?.state || labRecord?.state].filter(Boolean).join(', ') || 'India',
      address: [hospitalLab?.addressLine1 || labRecord?.address, hospitalLab?.city || labRecord?.city].filter(Boolean).join(', ') || 'India',
      services: hospitalLab?.services || ['lab_tests', 'diagnostics'],
      hospitalShare: hospitalLab?.hospitalShare ?? (labRecord?.hospital?.hospitalShare ?? 80),
      createdAt: baseRecord.createdAt ? baseRecord.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: baseRecord.updatedAt ? baseRecord.updatedAt.toISOString() : new Date().toISOString(),
      rating: labRecord?.rating ?? hospitalLab?.rating ?? null,
      reviewCount: labRecord?.reviewCount ?? hospitalLab?.reviewCount ?? 0,
      time: 'Within 24 Hours',
      price: `₹${Math.round(minPrice)}`,
      availableTestsCount: offerings.length,
      hospital: associatedHospital,
      schedules: schedules.sort((a, b) => {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return days.indexOf(a.dayOfWeek) - days.indexOf(b.dayOfWeek);
      }),
      verifications: verifications.map(v => ({
        id: v.id,
        documentType: v.documentType,
        fileUrl: v.fileUrl,
        createdAt: v.createdAt.toISOString()
      })),
      tests: offerings.map((o: any) => ({
        id: o.platformTest?.id || o.id,
        name: o.platformTest?.name || 'Diagnostic Test',
        category: o.platformTest?.departmentId || 'General',
        sampleType: o.platformTest?.sampleType || 'Blood',
        price: `₹${Math.round(o.price)}`,
        numericPrice: o.price,
        time: o.tatHours ? `${o.tatHours} Hours` : '12 Hours',
        homeCollectionAvailable: o.isHomeCollectionAvailable ?? true,
        homeCollectionFee: o.homeCollectionFee ?? 0,
      }))
    };

    res.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    next(error);
  }
};

export const getLaboratoryTests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const offerings = await prisma.labTest.findMany({
      where: { hospitalId: id, isActive: true },
      include: {
        platformTest: true
      },
      orderBy: { platformTest: { name: 'asc' } }
    });

    const tests = offerings.map((o: any) => ({
      id: o.platformTest.id,
      name: o.platformTest.name,
      category: o.platformTest.departmentId,
      sampleType: o.platformTest.sampleType || 'Blood',
      sample: o.platformTest.sampleType || 'Blood',
      price: `₹${Math.round(o.price)}`,
      numericPrice: o.price,
      time: o.tatHours ? `${o.tatHours} Hours` : '12 Hours',
      tat: o.tatHours ? `${o.tatHours} Hours` : '12 Hours',
      parameters: 1,
      parametersCount: 1,
      desc: o.platformTest.description || '',
      prep: o.platformTest.fastingRequired ? 'Fasting Required' : 'No special preparation required.',
      homeCollectionAvailable: o.isHomeCollectionAvailable,
      homeCollectionFee: o.homeCollectionFee,
    }));

    res.json({ success: true, data: tests });
  } catch (error) {
    next(error);
  }
};

const UPLOADS_LICENSES_DIR = path.join(process.cwd(), 'uploads/licenses');
if (!fs.existsSync(UPLOADS_LICENSES_DIR)) {
  fs.mkdirSync(UPLOADS_LICENSES_DIR, { recursive: true });
}

export const createHospitalLab = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user?.hospitalId;
    if (!hospitalId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'User does not belong to a hospital' }
      });
    }

    const {
      platformDepartmentId,
      labLicenseNumber,
      labLicenseDocumentUrl,
      licenseValidUntil,
      email,
      password,
      phone
    } = req.body;

    // Check platform lab department exists
    const platformDept = await prisma.platformLabDepartment.findUnique({
      where: { id: platformDepartmentId }
    });

    if (!platformDept) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Platform laboratory department not found' }
      });
    }

    // Check duplicate email
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: 'A user with this email already exists' }
      });
    }

    // Check duplicate phone
    if (phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingPhone) {
        return res.status(409).json({
          success: false,
          error: { code: 'CONFLICT', message: 'A user with this phone number already exists' }
        });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const parsedValidUntil = licenseValidUntil ? new Date(licenseValidUntil) : null;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create or link Department for this lab
      let dept = await tx.department.findFirst({
        where: {
          hospitalId,
          OR: [
            { name: `${platformDept.name} (Lab)` },
            { name: platformDept.name },
            { platformLabDepartmentId: platformDept.id }
          ]
        }
      });

      if (!dept) {
        dept = await tx.department.create({
          data: {
            hospitalId,
            name: `${platformDept.name} (Lab)`,
            code: platformDept.code,
            description: platformDept.description,
            type: 'LAB',
            platformLabDepartmentId: platformDept.id,
            labLicenseNumber,
            labLicenseDocumentUrl,
            licenseValidUntil: parsedValidUntil,
          }
        });
      } else {
        dept = await tx.department.update({
          where: { id: dept.id },
          data: {
            type: 'LAB',
            platformLabDepartmentId: platformDept.id,
            labLicenseNumber,
            labLicenseDocumentUrl,
            licenseValidUntil: parsedValidUntil,
          }
        });
      }

      // 2. Create the Lab record
      const lab = await tx.lab.create({
        data: {
          hospitalId,
          platformDepartmentId: platformDept.id,
          name: `${platformDept.name} Laboratory`,
          labLicenseNumber,
          labLicenseDocumentUrl,
          licenseValidUntil: parsedValidUntil,
        }
      });

      // 3. Create the LAB_ADMIN staff user
      const user = await tx.user.create({
        data: {
          name: `${platformDept.name} Lab Admin`,
          email,
          phone: phone || null,
          passwordHash,
          role: Role.LAB_ADMIN,
          designation: 'Laboratory Administrator',
          hospitalId,
          departmentId: dept.id,
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
        }
      });

      // 4. Update hospital services to ensure lab capabilities are listed
      const hospital = await tx.hospital.findUnique({
        where: { id: hospitalId },
        select: { services: true }
      });
      const currentServices = hospital?.services || [];
      const neededServices = ['lab_tests', 'diagnostics', 'lab'];
      const updatedServices = Array.from(new Set([...currentServices, ...neededServices]));
      if (updatedServices.length > currentServices.length) {
        await tx.hospital.update({
          where: { id: hospitalId },
          data: { services: updatedServices }
        });
      }

      return { lab, department: dept, user };
    });

    // INTERNAL_EVENT: Laboratory registered. No user notification generated.

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const uploadLicenseCertificate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileData, fileName } = req.body;
    if (!fileData || !fileName) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'fileData and fileName are required' }
      });
    }

    // Process base64 file data
    let base64Content = fileData;
    const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      base64Content = matches[2];
    }

    const fileBuffer = Buffer.from(base64Content, 'base64');

    if (fileBuffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: { code: 'FILE_TOO_LARGE', message: 'File size must not exceed 10MB' }
      });
    }

    const safeFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
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


export const getLaboratoryAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const dateQuery = typeof req.query.date === 'string' ? req.query.date.trim() : '';

    let lab = await prisma.lab.findUnique({
      where: { id }
    });

    let schedules: any[] = [];
    if (lab) {
      schedules = await prisma.labSchedule.findMany({
        where: { labId: id }
      });
    } else {
      const hospital = await prisma.hospital.findUnique({
        where: { id }
      });
      if (!hospital) {
        return res.status(404).json({ success: false, error: 'Lab not found' });
      }
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      schedules = days.map(d => ({
        dayOfWeek: d,
        isAvailable: true,
        startTime: '08:00',
        endTime: '18:00',
        slotDurationMinutes: 60
      }));
    }

    // Helper to generate dates for next 14 days
    const availableDates = [];
    let targetDate = null;
    const now = new Date();
    
    // Parse target date if provided
    if (dateQuery) {
      const parts = dateQuery.split('-');
      if (parts.length === 3) {
        targetDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
    }

    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const dateStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      
      let label = '';
      if (i === 0) label = `Today, ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      else if (i === 1) label = `Tomorrow, ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      else label = `${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;
      
      availableDates.push({ date: dateStr, label });
      
      if (!targetDate && availableDates.length === 1) {
         targetDate = new Date(d); // default to first date
      }
    }

    let slots: any[] = [];
    
    if (targetDate) {
      const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
      const schedule = schedules.find(s => s.dayOfWeek.toLowerCase() === dayName.toLowerCase());
      
      if (schedule && schedule.isAvailable) {
        // Physical Lab Slots
        let currentMinutes = 0;
        const [startH, startM] = (schedule.startTime || '09:00').split(':').map(Number);
        const [endH, endM] = (schedule.endTime || '17:00').split(':').map(Number);
        
        currentMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        const duration = schedule.slotDurationMinutes || 30;
        
        while (currentMinutes + duration <= endMinutes) {
          const h = Math.floor(currentMinutes / 60);
          const m = currentMinutes % 60;
          const ampm = h >= 12 ? 'PM' : 'AM';
          const displayH = h % 12 === 0 ? 12 : h % 12;
          const timeStr = `${displayH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
          slots.push({ time: timeStr, status: 'available', type: 'LAB' });
          currentMinutes += duration;
        }

        // We can just merge or provide them. The frontend does not distinguish type in the basic view, 
        // but if it does, it's fine. We'll return physical lab slots. Home slots could be handled if required.
      }
    }

    res.json({
      success: true,
      data: {
        availableDates,
        slots
      }
    });
  } catch (error) {
    next(error);
  }
};


export const updateLaboratoryAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { schedules } = req.body; // array of schedules

    // Validate if lab exists
    const lab = await prisma.lab.findUnique({ where: { id } });
    if (!lab) {
      return res.status(404).json({ success: false, error: 'Lab not found' });
    }

    // Delete existing schedules for this lab
    await prisma.labSchedule.deleteMany({
      where: { labId: id }
    });

    if (schedules && schedules.length > 0) {
      const scheduleData = schedules.map((s: any) => ({
        labId: id,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime || '09:00',
        endTime: s.endTime || '17:00',
        homeSampleStartTime: s.homeSampleStartTime || '10:00',
        homeSampleEndTime: s.homeSampleEndTime || '16:00',
        slotDurationMinutes: s.slotDurationMinutes || 30,
        isAvailable: s.isAvailable !== undefined ? s.isAvailable : true,
      }));

      await prisma.labSchedule.createMany({
        data: scheduleData
      });
    }

    const updatedSchedules = await prisma.labSchedule.findMany({
      where: { labId: id }
    });

    res.json({
      success: true,
      data: updatedSchedules
    });
  } catch (error) {
    next(error);
  }
};

export const getMyLaboratoryAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = (req as any).user?.hospitalId;
    if (!hospitalId) {
      return res.status(403).json({ success: false, error: 'User is not associated with a hospital' });
    }

    let lab = await prisma.lab.findFirst({ where: { hospitalId } });
    if (!lab) {
      // Auto-create a default lab for this hospital/standalone lab
      const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
      if (!hospital) {
        return res.status(404).json({ success: false, error: 'Hospital not found' });
      }
      lab = await prisma.lab.create({
        data: {
          name: hospital.businessType === 'LABORATORY' ? hospital.name : `${hospital.name} - Main Laboratory`,
          type: hospital.businessType === 'LABORATORY' ? 'STANDALONE' : 'HOSPITAL_BASED',
          hospitalId: hospital.id,
          contactPhone: hospital.contactPhone,
          email: hospital.contactEmail,
          city: hospital.city,
          state: hospital.state,
          status: 'Active'
        }
      });
    }

    const schedules = await prisma.labSchedule.findMany({
      where: { labId: lab.id }
    });

    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    next(error);
  }
};

export const updateMyLaboratoryAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = (req as any).user?.hospitalId;
    if (!hospitalId) {
      return res.status(403).json({ success: false, error: 'User is not associated with a hospital' });
    }

    let lab = await prisma.lab.findFirst({ where: { hospitalId } });
    if (!lab) {
      // Auto-create a default lab for this hospital/standalone lab
      const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
      if (!hospital) {
        return res.status(404).json({ success: false, error: 'Hospital not found' });
      }
      lab = await prisma.lab.create({
        data: {
          name: hospital.businessType === 'LABORATORY' ? hospital.name : `${hospital.name} - Main Laboratory`,
          type: hospital.businessType === 'LABORATORY' ? 'STANDALONE' : 'HOSPITAL_BASED',
          hospitalId: hospital.id,
          contactPhone: hospital.contactPhone,
          email: hospital.contactEmail,
          city: hospital.city,
          state: hospital.state,
          status: 'Active'
        }
      });
    }

    const { schedules } = req.body;

    await prisma.labSchedule.deleteMany({
      where: { labId: lab.id }
    });

    if (schedules && schedules.length > 0) {
      const scheduleData = schedules.map((s: any) => ({
        labId: lab.id,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime || '09:00',
        endTime: s.endTime || '17:00',
        homeSampleStartTime: s.homeSampleStartTime || '10:00',
        homeSampleEndTime: s.homeSampleEndTime || '16:00',
        slotDurationMinutes: s.slotDurationMinutes || 30,
        isAvailable: s.isAvailable !== undefined ? s.isAvailable : true,
      }));

      await prisma.labSchedule.createMany({
        data: scheduleData
      });
    }

    const updatedSchedules = await prisma.labSchedule.findMany({
      where: { labId: lab.id }
    });

    res.json({
      success: true,
      data: updatedSchedules
    });
  } catch (error) {
    next(error);
  }
};

export const getMyLaboratoryProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let hospitalId = (req as any).user?.hospitalId;
    const userId = (req as any).user?.id;
    if (!hospitalId && userId) {
      const u = await prisma.user.findUnique({ where: { id: userId }, select: { hospitalId: true } });
      hospitalId = u?.hospitalId;
    }

    if (!hospitalId) {
      return res.status(403).json({ success: false, error: 'User is not associated with a hospital or laboratory facility' });
    }

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      include: {
        verifications: true,
        labs: {
          include: {
            schedules: true
          }
        }
      }
    });

    if (!hospital) {
      return res.status(404).json({ success: false, error: 'Hospital/Laboratory facility not found' });
    }

    // Get primary lab record or auto-create if missing
    let lab = hospital.labs && hospital.labs.length > 0 ? hospital.labs[0] : null;
    if (!lab) {
      lab = await prisma.lab.create({
        data: {
          name: hospital.businessType === 'LABORATORY' ? hospital.name : `${hospital.name} - Diagnostic Laboratory`,
          type: hospital.businessType === 'LABORATORY' ? 'STANDALONE' : 'HOSPITAL_BASED',
          hospitalId: hospital.id,
          contactPhone: hospital.contactPhone,
          email: hospital.contactEmail,
          city: hospital.city,
          state: hospital.state,
          pinCode: hospital.pincode,
          address: hospital.addressLine1,
          status: 'Active',
          verificationStatus: 'VERIFIED'
        },
        include: {
          schedules: true
        }
      });
    }

    // Get current logged-in user details (in-charge / owner)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        designation: true,
        avatar: true
      }
    });

    // Real-time counter metrics from PostgreSQL
    const [activeTestsCount, packagesCount, completedOrdersCount, totalTestsCount] = await Promise.all([
      prisma.labTest.count({ where: { hospitalId, isActive: true } }),
      prisma.labPackage.count({ where: { hospitalId, status: 'Active' } }),
      prisma.labBooking.count({ where: { hospitalId, status: 'COMPLETED' } }),
      prisma.labTest.count({ where: { hospitalId } })
    ]);

    // Check home collection availability across tests or schedules
    const homeCollectionTestCount = await prisma.labTest.count({
      where: { hospitalId, isHomeCollectionAvailable: true, isActive: true }
    });
    const hasHomeCollectionSchedules = (lab.schedules || []).some((s: any) => s.isAvailable && s.homeSampleStartTime);
    const isHomeCollectionAvailable = homeCollectionTestCount > 0 || hasHomeCollectionSchedules;

    // Build regulatory documents cards (with Verified status)
    const documents: any[] = [];
    if (lab.labLicenseDocumentUrl || lab.labLicenseNumber) {
      documents.push({
        id: `lab-license-${lab.id}`,
        title: 'Diagnostic Lab License',
        documentType: 'LAB_LICENSE',
        licenseNumber: lab.labLicenseNumber || hospital.registrationNumber || 'MED-LAB-2026',
        category: 'Diagnostic & Pathology Compliance',
        status: 'VERIFIED',
        fileUrl: lab.labLicenseDocumentUrl || null,
        createdAt: lab.createdAt
      });
    }
    if (hospital.registrationNumber) {
      documents.push({
        id: `hosp-reg-${hospital.id}`,
        title: 'Clinical Establishment Registration Certificate',
        documentType: 'CLINICAL_REGISTRATION',
        licenseNumber: hospital.registrationNumber,
        category: 'Facility Registration Certificate',
        status: 'VERIFIED',
        fileUrl: null,
        createdAt: hospital.createdAt
      });
    }
    if (hospital.verifications && hospital.verifications.length > 0) {
      hospital.verifications.forEach((v: any) => {
        documents.push({
          id: v.id,
          title: v.documentType || 'Facility Verification Document',
          documentType: v.documentType,
          licenseNumber: v.id.slice(0, 8).toUpperCase(),
          category: 'Regulatory Certification',
          status: 'VERIFIED',
          fileUrl: v.fileUrl,
          createdAt: v.createdAt
        });
      });
    }

    // Clean address parsing
    const street = hospital.addressLine1 || lab.address || '';
    const city = hospital.city || lab.city || '';
    const state = hospital.state || lab.state || '';
    const pinCode = hospital.pincode || lab.pinCode || '';
    const formattedAddress = [street, hospital.addressLine2, hospital.area, city, state, pinCode].filter(Boolean).join(', ');

    // Calculate operating hours from schedules or default
    let operationalHours = '08:00 AM – 08:00 PM';
    if (lab.schedules && lab.schedules.length > 0) {
      const activeSched = lab.schedules.find((s: any) => s.isAvailable);
      if (activeSched && activeSched.startTime && activeSched.endTime) {
        operationalHours = `${activeSched.startTime} – ${activeSched.endTime}`;
      }
    }

    res.json({
      success: true,
      data: {
        id: lab.id,
        labId: lab.id,
        hospitalId: hospital.id,
        name: lab.name || hospital.name,
        labName: lab.name || hospital.name,
        hospitalName: hospital.name,
        businessType: hospital.businessType,
        facilityType: hospital.facilityType || 'DIAGNOSTIC_CENTRE',
        labType: lab.type,
        status: 'Active',
        verificationStatus: 'VERIFIED',
        
        // Owner / In-charge
        inChargeName: user?.name || 'Lab In-Charge',
        ownerName: user?.name || 'Lab In-Charge',
        ownerPhone: user?.phone || hospital.contactPhone || '',
        ownerEmail: user?.email || hospital.contactEmail || '',
        designation: user?.designation || 'Lab In-Charge / Pathologist',
        roleBadge: 'DIAGNOSTIC LAB',
        verificationBadge: 'Verified & Active',
        
        // Contact details
        contactPhone: lab.contactPhone || hospital.contactPhone || user?.phone || '',
        contactEmail: lab.email || hospital.contactEmail || user?.email || '',
        phone: lab.contactPhone || hospital.contactPhone || user?.phone || '',
        email: lab.email || hospital.contactEmail || user?.email || '',

        // Address
        address: {
          street,
          city,
          state,
          pinCode,
          full: formattedAddress || street
        },
        addressLine1: street,
        city,
        state,
        pinCode,
        formattedAddress,

        // Regulatory & Compliance
        labLicenseNumber: lab.labLicenseNumber || hospital.registrationNumber || '',
        labLicenseDocumentUrl: lab.labLicenseDocumentUrl || null,
        registrationNumber: hospital.registrationNumber || '',
        documents,

        // Operational
        operationalHours,
        homeCollectionAvailable: isHomeCollectionAvailable,
        homeCollectionFee: 150,

        // Live stats counters
        stats: {
          activeTestsCount,
          packagesCount,
          completedOrdersCount,
          totalTestsCount
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateMyLaboratoryProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let hospitalId = (req as any).user?.hospitalId;
    const userId = (req as any).user?.id;
    if (!hospitalId && userId) {
      const u = await prisma.user.findUnique({ where: { id: userId }, select: { hospitalId: true } });
      hospitalId = u?.hospitalId;
    }

    if (!hospitalId) {
      return res.status(403).json({ success: false, error: 'User is not associated with a hospital or laboratory facility' });
    }

    const {
      labName,
      inChargeName,
      contactPhone,
      contactEmail,
      street,
      city,
      state,
      pinCode,
      labLicenseNumber,
      labLicenseDocumentUrl,
      operationalHours,
      homeCollectionAvailable
    } = req.body;

    // 1. Update User (in-charge name / phone / email)
    if (userId && (inChargeName || contactPhone || contactEmail)) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(inChargeName && { name: inChargeName.trim() }),
          ...(contactPhone && { phone: contactPhone.trim() }),
          ...(contactEmail && { email: contactEmail.trim().toLowerCase() }),
        }
      });
    }

    // 2. Update Hospital
    await prisma.hospital.update({
      where: { id: hospitalId },
      data: {
        ...(labName && { name: labName.trim() }),
        ...(contactPhone && { contactPhone: contactPhone.trim() }),
        ...(contactEmail && { contactEmail: contactEmail.trim().toLowerCase() }),
        ...(street && { addressLine1: street.trim() }),
        ...(city && { city: city.trim() }),
        ...(state && { state: state.trim() }),
        ...(pinCode && { pincode: pinCode.trim() }),
        ...(labLicenseNumber && { registrationNumber: labLicenseNumber.trim() }),
      }
    });

    // 3. Update or create Lab record
    let lab = await prisma.lab.findFirst({ where: { hospitalId } });
    if (lab) {
      lab = await prisma.lab.update({
        where: { id: lab.id },
        data: {
          ...(labName && { name: labName.trim() }),
          ...(contactPhone && { contactPhone: contactPhone.trim() }),
          ...(contactEmail && { email: contactEmail.trim().toLowerCase() }),
          ...(street && { address: street.trim() }),
          ...(city && { city: city.trim() }),
          ...(state && { state: state.trim() }),
          ...(pinCode && { pinCode: pinCode.trim() }),
          ...(labLicenseNumber && { labLicenseNumber: labLicenseNumber.trim() }),
          ...(labLicenseDocumentUrl && { labLicenseDocumentUrl: labLicenseDocumentUrl.trim() }),
        }
      });
    }

    // 4. Update home collection availability on tests if explicitly passed
    if (homeCollectionAvailable !== undefined) {
      await prisma.labTest.updateMany({
        where: { hospitalId },
        data: { isHomeCollectionAvailable: Boolean(homeCollectionAvailable) }
      });
    }

    // Return the fresh authoritative profile
    return getMyLaboratoryProfile(req, res, next);
  } catch (error) {
    next(error);
  }
};

