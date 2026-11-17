import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import path from 'path';
import fs from 'fs';

const UPLOADS_DIR = path.join(__dirname, '../../../../uploads/icons');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function processIcon(iconData: string | undefined): string | undefined {
  if (!iconData) return undefined;
  if (iconData.startsWith('/icons/')) return iconData;
  if (iconData.startsWith('data:image')) {
    const matches = iconData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return undefined;
    const fileBuffer = Buffer.from(matches[2], 'base64');
    const safeFileName = `${Date.now()}-icon.png`;
    const filePath = path.join(UPLOADS_DIR, safeFileName);
    fs.writeFileSync(filePath, fileBuffer);
    return `/uploads/icons/${safeFileName}`;
  }
  return iconData;
}

export const getDiseases = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search } = req.query;
    const where: any = {};
    if (search) {
      where.name = { contains: search as string, mode: 'insensitive' };
    }
    
    const consultationType = typeof req.query.consultationType === 'string'
      ? req.query.consultationType.trim().toLowerCase()
      : (typeof req.query.type === 'string' ? req.query.type.trim().toLowerCase() : '');
    const isVideo = consultationType === 'video' || consultationType === 'video_consultation' || consultationType === 'video-consult' || consultationType === 'doctor';
    const isOp = consultationType === 'op' || consultationType === 'hospital-op' || consultationType === 'normal';

    const doctorCondition: any = { 
      role: 'DOCTOR', 
      active: true,
      OR: [
        { inactiveUntil: null },
        { inactiveUntil: { lte: new Date() } }
      ]
    };
    if (isVideo) {
      doctorCondition.doctorSchedules = {
        some: {
          isAvailable: true,
          videoStartTime: { not: null }
        }
      };
    }

    const hospitalCondition: any = {
      verificationStatus: 'APPROVED'
    };
    if (isVideo) {
      hospitalCondition.OR = [
        { services: { has: 'video_consultation' } },
        { services: { isEmpty: true } },
        { businessType: 'HOSPITAL' }
      ];
    } else if (isOp) {
      hospitalCondition.OR = [
        { services: { has: 'op_consultation' } },
        { services: { isEmpty: true } },
        { businessType: 'HOSPITAL' }
      ];
    }

    // Fetch active diseases added explicitly by hospitals that have active doctors
    const addedDiseases = await prisma.disease.findMany({
      where: { 
        isActive: true,
        department: {
          isActive: true,
          hospital: hospitalCondition,
          users: { some: doctorCondition }
        }
      },
      include: {
        department: {
          select: { id: true, name: true, specialtyId: true }
        }
      }
    });
    const addedDiseaseNames = new Set(addedDiseases.map(d => d.name.toLowerCase()));

    // Fetch active hospital departments that have active doctors
    const activeDepartments = await prisma.department.findMany({
      where: { 
        isActive: true, 
        hospital: hospitalCondition,
        users: { some: doctorCondition }
      },
      select: { specialtyId: true, name: true }
    });

    const activeSpecialtyIds = new Set<string>();
    const activeDeptNames = new Set<string>();
    for (const d of activeDepartments) {
      if (d.specialtyId) activeSpecialtyIds.add(d.specialtyId);
      if (d.name) activeDeptNames.add(d.name.trim().toLowerCase());
    }

    // Match departments to PlatformSpecialty by name if specialtyId was not set
    if (activeDeptNames.size > 0) {
      const allPlatformSpecialties = await prisma.platformSpecialty.findMany({
        select: { id: true, name: true }
      });
      for (const ps of allPlatformSpecialties) {
        if (activeDeptNames.has(ps.name.trim().toLowerCase())) {
          activeSpecialtyIds.add(ps.id);
        }
      }
    }

    const conditionsDataRaw = await prisma.platformCondition.findMany({ 
      where, 
      orderBy: { name: 'asc' },
      include: { specialty: true } 
    });

    // Filter to strictly only diseases supported by registered hospital departments that have active doctors
    const conditionsData = conditionsDataRaw.filter(d => 
      addedDiseaseNames.has(d.name.toLowerCase()) || activeSpecialtyIds.has(d.specialtyId)
    );
    const conditions = conditionsData.map(d => ({
      id: d.id,
      name: d.name,
      description: d.description,
      specialtyId: d.specialtyId,
      specialtyName: d.specialty?.name,
      icon: d.icon,
      classification: d.classification,
    }));

    const categoricalMap = new Map();
    for (const d of conditionsData) {
      if (!categoricalMap.has(d.specialtyId)) {
        categoricalMap.set(d.specialtyId, {
          id: d.specialtyId,
          name: d.specialty?.name,
          description: d.specialty?.description,
          conditions: []
        });
      }
      categoricalMap.get(d.specialtyId).conditions.push({
         id: d.id,
         name: d.name,
         description: d.description,
         specialtyId: d.specialtyId,
         specialtyName: d.specialty?.name,
         icon: d.icon,
         classification: d.classification
      });
    }
    const general = conditions.filter(c => c.classification === 'GENERAL');
    const advanced = conditions.filter(c => c.classification === 'ADVANCED');

    res.json({ 
      success: true, 
      data: {
        total: conditionsData.length,
        conditions,
        general,
        advanced,
        categorical: Array.from(categoricalMap.values())
      } 
    });
  } catch (error) { next(error); }
};

export const createDisease = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { departmentId, name, description, icon, isActive } = req.body;
    if (!departmentId || !name) return res.status(400).json({ success: false, error: { message: 'Missing required fields' } });

    const existing = await prisma.disease.findFirst({ where: { departmentId, name: { equals: name, mode: 'insensitive' } } });
    if (existing) return res.status(409).json({ success: false, error: { message: 'Disease already exists' } });

    const iconUrl = processIcon(icon);
    const disease = await prisma.disease.create({
      data: { departmentId, name, description, icon: iconUrl, isActive: isActive !== undefined ? isActive : true }
    });
    res.status(201).json({ success: true, data: disease });
  } catch (error) { next(error); }
};

export const updateDisease = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description, icon, isActive } = req.body;
    
    const iconUrl = processIcon(icon);
    const disease = await prisma.disease.update({
      where: { id: id as string },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        icon: iconUrl || undefined,
        isActive: isActive !== undefined ? isActive : undefined
      }
    });
    res.json({ success: true, data: disease });
  } catch (error) { next(error); }
};

export const deleteDisease = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.disease.delete({ where: { id: req.params.id as string } });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) { next(error); }
};

export const getDiseaseById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const disease = await prisma.disease.findUnique({ where: { id: req.params.id as string } });
    res.json({ success: true, data: disease });
  } catch (error) { next(error); }
};
