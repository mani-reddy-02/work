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
    const type = req.query.type as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const hospitalId = typeof req.query.hospitalId === 'string' ? req.query.hospitalId.trim() : '';
    const location = typeof req.query.location === 'string' ? req.query.location.trim() : '';

    const whereClause: any = {};
    if (type === 'STANDALONE') {
      whereClause.businessType = BusinessType.LABORATORY;
    } else if (type === 'HOSPITAL_BASED') {
      whereClause.businessType = { not: BusinessType.LABORATORY };
      whereClause.services = { hasSome: ['lab_tests', 'lab', 'laboratory', 'diagnostics'] };
    } else {
      whereClause.OR = [
        { businessType: BusinessType.LABORATORY },
        { services: { hasSome: ['lab_tests', 'lab', 'laboratory', 'diagnostics'] } }
      ];
    }

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

    const totalCount = await prisma.hospital.count({ where: whereClause });
    const labs = await prisma.hospital.findMany({
      skip: (page - 1) * limit,
      take: limit,
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

    res.json({
      success: true,
      data: formatted,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
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
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      
      const scheduleForDay = schedules.find(s => s.dayOfWeek.toLowerCase() === dayName.toLowerCase());
      
      if (scheduleForDay && scheduleForDay.isAvailable) {
        const dateStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
        
        let label = '';
        if (i === 0) label = `Today, ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        else if (i === 1) label = `Tomorrow, ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        else label = `${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;
        
        availableDates.push({ date: dateStr, label });
        
        if (!targetDate && availableDates.length === 1) {
           targetDate = new Date(d); // default to first available
        }
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
