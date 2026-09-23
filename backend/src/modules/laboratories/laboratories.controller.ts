import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { BusinessType, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { sendNotification } from '../notifications/notifications.service';

export const getLaboratories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const hospitalId = typeof req.query.hospitalId === 'string' ? req.query.hospitalId.trim() : '';
    const location = typeof req.query.location === 'string' ? req.query.location.trim() : '';

    const whereClause: any = {
      OR: [
        { businessType: BusinessType.LABORATORY },
        { services: { hasSome: ['lab_tests', 'lab', 'laboratory', 'diagnostics'] } }
      ]
    };

    if (hospitalId) {
      whereClause.id = hospitalId;
    }

    if (search) {
      whereClause.AND = [
        ...(whereClause.AND || []),
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
            { area: { contains: search, mode: 'insensitive' } },
            { addressLine1: { contains: search, mode: 'insensitive' } }
          ]
        }
      ];
    }

    if (location) {
      whereClause.AND = [
        ...(whereClause.AND || []),
        {
          OR: [
            { city: { contains: location, mode: 'insensitive' } },
            { area: { contains: location, mode: 'insensitive' } },
            { state: { contains: location, mode: 'insensitive' } }
          ]
        }
      ];
    }

    const labs = await prisma.hospital.findMany({
      where: whereClause,
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
        services: true
      },
      orderBy: { name: 'asc' }
    });

    const labIds = labs.map(l => l.id);

    // Fetch minimum test prices and test counts for each lab
    const offerings = await prisma.labTest.findMany({
      where: {
        hospitalId: { in: labIds },
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

    const formatted = labs.map(lab => {
      const stats = labStatsMap.get(lab.id);
      const minPrice = stats?.minPrice ? `₹${Math.round(stats.minPrice)}` : '₹149';

      return {
        id: lab.id,
        name: lab.name,
        businessType: lab.businessType,
        facilityType: lab.facilityType,
        logoUrl: lab.logoUrl,
        contactPhone: lab.contactPhone,
        contactEmail: lab.contactEmail,
        addressLine1: lab.addressLine1,
        area: lab.area,
        city: lab.city,
        state: lab.state,
        pincode: lab.pincode,
        location: [lab.area, lab.city, lab.state].filter(Boolean).join(', ') || lab.city || 'India',
        address: [lab.addressLine1, lab.area, lab.city].filter(Boolean).join(', ') || lab.city || 'India',
        services: lab.services,
        rating: 4.8,
        time: 'Within 24 Hours',
        price: minPrice,
        testCount: stats?.count || 0
      };
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

export const getLaboratoryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const lab = await prisma.hospital.findFirst({
      where: {
        id,
        OR: [
          { businessType: BusinessType.LABORATORY },
          { services: { hasSome: ['lab_tests', 'lab', 'laboratory', 'diagnostics'] } }
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
        addressLine2: true,
        area: true,
        city: true,
        state: true,
        pincode: true,
        services: true
      }
    });

    if (!lab) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Laboratory not found' }
      });
    }

    // Get offerings for this lab
    const offerings = await prisma.labTest.findMany({
      where: { hospitalId: id, isActive: true },
      include: {
        platformTest: true
      },
      orderBy: { platformTest: { name: 'asc' } }
    });

    const minPrice = offerings.length > 0 
      ? Math.min(...offerings.map(o => o.price))
      : 149;

    res.json({
      success: true,
      data: {
        id: lab.id,
        name: lab.name,
        businessType: lab.businessType,
        facilityType: lab.facilityType,
        logoUrl: lab.logoUrl,
        contactPhone: lab.contactPhone,
        contactEmail: lab.contactEmail,
        addressLine1: lab.addressLine1,
        area: lab.area,
        city: lab.city,
        state: lab.state,
        pincode: lab.pincode,
        location: [lab.area, lab.city, lab.state].filter(Boolean).join(', ') || lab.city || 'India',
        address: [lab.addressLine1, lab.area, lab.city].filter(Boolean).join(', ') || lab.city || 'India',
        services: lab.services,
        rating: 4.8,
        time: 'Within 24 Hours',
        price: `₹${Math.round(minPrice)}`,
        availableTestsCount: offerings.length,
        tests: offerings.map((o: any) => ({
          id: o.platformTest.id,
          name: o.platformTest.name,
          category: o.platformTest.departmentId,
          sampleType: o.platformTest.sampleType,
          price: `₹${Math.round(o.price)}`,
          numericPrice: o.price,
          time: o.tatHours ? `${o.tatHours} Hours` : '12 Hours',
          homeCollectionAvailable: o.isHomeCollectionAvailable,
          homeCollectionFee: o.homeCollectionFee,
        }))
      }
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

    sendNotification({
      hospitalId,
      title: 'Laboratory Registered',
      message: `${platformDept.name} Lab registered with license ${labLicenseNumber}`,
      type: 'lab',
      metadata: { labId: result.lab.id, departmentId: result.department.id }
    }).catch(console.error);

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
