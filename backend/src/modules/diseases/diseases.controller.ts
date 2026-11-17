import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { Role, BusinessType } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { calculateHaversineDistanceKm, formatDistanceText, parseGeoParams, getEffectiveCoordinates } from '../../utils/geo';

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
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const hospitalIdQuery = typeof req.query.hospitalId === 'string' ? req.query.hospitalId.trim() : '';
    
    const consultationType = typeof req.query.consultationType === 'string'
      ? req.query.consultationType.trim().toLowerCase()
      : (typeof req.query.type === 'string' ? req.query.type.trim().toLowerCase() : '');
    const isVideo = consultationType === 'video' || consultationType === 'video_consultation' || consultationType === 'video-consult' || consultationType === 'doctor';
    const isOp = consultationType === 'op' || consultationType === 'hospital-op' || consultationType === 'normal';

    const now = new Date();
    const doctorCondition: any = { 
      role: Role.DOCTOR, 
      active: true,
      hospital: {
        verificationStatus: 'APPROVED',
        cancelledAt: null
      },
      AND: [
        {
          OR: [
            { inactiveUntil: null },
            { inactiveUntil: { lte: now } }
          ]
        }
      ]
    };

    if (hospitalIdQuery) {
      doctorCondition.hospitalId = hospitalIdQuery;
    }

    if (isVideo) {
      doctorCondition.hospital = {
        ...(doctorCondition.hospital || {}),
        services: { has: 'video_consultation' }
      };
      doctorCondition.doctorSchedules = {
        some: {
          isAvailable: true,
          videoStartTime: { not: null }
        }
      };
    } else if (isOp) {
      doctorCondition.hospital = {
        ...(doctorCondition.hospital || {}),
        OR: [
          { services: { has: 'op_consultation' } },
          { services: { isEmpty: true } },
          { businessType: BusinessType.HOSPITAL }
        ]
      };
    }

    // Fetch active doctors with their departments, specialties, and custom diseases
    const matchingDoctors = await prisma.user.findMany({
      where: doctorCondition,
      select: {
        id: true,
        name: true,
        specialization: true,
        designation: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
            specialtyId: true,
            specialty: {
              select: { id: true, name: true, description: true }
            },
            diseases: {
              where: { isActive: true },
              select: { id: true, name: true, description: true, icon: true }
            }
          }
        },
        hospital: {
          select: {
            id: true,
            name: true,
            city: true,
            latitude: true,
            longitude: true,
            addressLine1: true
          }
        }
      }
    });

    const geo = parseGeoParams(req.query);

    // Apply distance filtering if location coordinates and nearbyOnly are provided
    let activeDoctors = matchingDoctors;
    if (geo.hasCoords && geo.nearbyOnly) {
      activeDoctors = activeDoctors.filter(doc => {
        const coords = getEffectiveCoordinates(doc.hospital);
        if (!coords || coords.latitude == null || coords.longitude == null) return false;
        const dist = calculateHaversineDistanceKm(geo.lat!, geo.lng!, coords.latitude, coords.longitude);
        return dist <= geo.radius;
      });
    }

    // If no active doctors are available in range for this consultation type, return 0 diseases
    if (activeDoctors.length === 0) {
      return res.json({
        success: true,
        data: {
          total: 0,
          conditions: [],
          general: [],
          advanced: [],
          categorical: []
        },
        meta: {
          total: 0,
          nearbyRadiusKm: geo.radius,
          hasLocationFilter: geo.hasCoords && geo.nearbyOnly,
          userLocation: geo.hasCoords ? { lat: geo.lat, lng: geo.lng } : null
        }
      });
    }

    // Load all platform specialties to map departments and specializations accurately
    const allPlatformSpecialties = await prisma.platformSpecialty.findMany({
      select: { id: true, name: true, description: true, icon: true }
    });
    const specialtyById = new Map<string, { id: string; name: string; description: string | null; icon: string | null }>();
    for (const ps of allPlatformSpecialties) {
      specialtyById.set(ps.id, ps);
    }

    const coveredSpecialtyIds = new Set<string>();
    const coveredCustomDiseases = new Map<string, any>();

    for (const doc of activeDoctors) {
      if (doc.department?.specialtyId) {
        coveredSpecialtyIds.add(doc.department.specialtyId);
      }
      if (doc.department?.specialty?.id) {
        coveredSpecialtyIds.add(doc.department.specialty.id);
      }

      const deptName = doc.department?.name?.trim().toLowerCase() || '';
      const docSpec = doc.specialization?.trim().toLowerCase() || '';
      const docDesig = doc.designation?.trim().toLowerCase() || '';

      for (const ps of allPlatformSpecialties) {
        const psName = ps.name.trim().toLowerCase();
        if (
          (deptName && (deptName === psName || deptName.includes(psName) || psName.includes(deptName))) ||
          (docSpec && (docSpec === psName || docSpec.includes(psName) || psName.includes(docSpec))) ||
          (docDesig && docDesig.includes(psName))
        ) {
          coveredSpecialtyIds.add(ps.id);
        }
      }

      if (doc.department?.diseases) {
        for (const cd of doc.department.diseases) {
          coveredCustomDiseases.set(cd.name.trim().toLowerCase(), {
            ...cd,
            specialtyId: doc.department.specialtyId || doc.department.id,
            specialtyName: doc.department.specialty?.name || doc.department.name
          });
        }
      }
    }

    const conditionWhere: any = { isActive: true };
    if (search) {
      conditionWhere.name = { contains: search, mode: 'insensitive' };
    }

    const allPlatformConditions = await prisma.platformCondition.findMany({
      where: conditionWhere,
      orderBy: { name: 'asc' },
      include: { specialty: true }
    });

    // Strictly filter: ONLY include conditions where an active doctor exists for its specialty or disease name
    const validConditions = allPlatformConditions.filter(pc =>
      coveredSpecialtyIds.has(pc.specialtyId) || coveredCustomDiseases.has(pc.name.trim().toLowerCase())
    );

    const conditions: any[] = validConditions.map(d => ({
      id: d.id,
      name: d.name,
      description: d.description,
      specialtyId: d.specialtyId,
      specialtyName: d.specialty?.name,
      icon: d.icon,
      classification: d.classification || 'GENERAL',
    }));

    // Add any custom hospital diseases under active doctors' departments that are not in platform conditions
    const existingNames = new Set(conditions.map(c => c.name.toLowerCase()));
    for (const [nameLower, cd] of coveredCustomDiseases.entries()) {
      if (!existingNames.has(nameLower)) {
        if (!search || cd.name.toLowerCase().includes(search.toLowerCase())) {
          conditions.push({
            id: cd.id,
            name: cd.name,
            description: cd.description,
            specialtyId: cd.specialtyId,
            specialtyName: cd.specialtyName,
            icon: cd.icon,
            classification: 'GENERAL'
          });
        }
      }
    }

    // Build categorical specialties: strictly only include specialties that have valid conditions with active doctors
    const categoricalMap = new Map();
    for (const d of conditions) {
      if (!categoricalMap.has(d.specialtyId)) {
        const specMeta = specialtyById.get(d.specialtyId);
        categoricalMap.set(d.specialtyId, {
          id: d.specialtyId,
          name: d.specialtyName || specMeta?.name || 'General',
          description: specMeta?.description || `Specialized clinical care for ${d.specialtyName || 'this field'}`,
          icon: specMeta?.icon || d.icon,
          conditions: []
        });
      }
      categoricalMap.get(d.specialtyId).conditions.push(d);
    }

    const general = conditions.filter(c => c.classification === 'GENERAL');
    const advanced = conditions.filter(c => c.classification === 'ADVANCED');

    res.json({
      success: true,
      data: {
        total: conditions.length,
        conditions,
        general,
        advanced,
        categorical: Array.from(categoricalMap.values())
      },
      meta: {
        total: conditions.length,
        nearbyRadiusKm: geo.radius,
        hasLocationFilter: geo.hasCoords && geo.nearbyOnly,
        userLocation: geo.hasCoords ? { lat: geo.lat, lng: geo.lng } : null
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
