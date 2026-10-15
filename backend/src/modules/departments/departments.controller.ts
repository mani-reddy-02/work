import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { Role, Prisma } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const UPLOADS_DIR = path.join(__dirname, '../../../../uploads/icons');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function processIcon(iconData: string | undefined): string | undefined {
  if (!iconData) return undefined;
  if (iconData.startsWith('/icons/')) return iconData; // existing optimized icon
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

export const getDepartments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalIdQuery = typeof req.query.hospitalId === 'string' ? req.query.hospitalId.trim() : '';
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const hospitalId = hospitalIdQuery || req.user?.hospitalId;

    const whereClause: any = {};
    if (hospitalId) whereClause.hospitalId = hospitalId;
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const departments = await prisma.department.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { users: { where: { role: Role.DOCTOR, active: true } }, diseases: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: departments.map(d => ({
        id: d.id,
        name: d.name,
        description: d.description,
        icon: d.icon,
        isActive: d.isActive,
        hospitalId: d.hospitalId,
        doctorCount: d._count.users,
        diseaseCount: d._count.diseases
      }))
    });
  } catch (error) { next(error); }
};

export const createDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user!.hospitalId;
    if (!hospitalId) return res.status(403).json({ success: false, error: { message: 'Forbidden' } });

    let { name, description, icon, isActive, specialtyId, code, status } = req.body;

    // If name is not explicitly passed, derive it from platformSpecialty
    if ((!name || !name.trim()) && specialtyId) {
      const specialty = await prisma.platformSpecialty.findUnique({
        where: { id: String(specialtyId) }
      });
      if (specialty) {
        name = specialty.name;
        if (!icon && specialty.icon) {
          icon = specialty.icon;
        }
      }
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: { message: 'Department name is required' } });
    }

    const trimmedName = name.trim();

    const existing = await prisma.department.findFirst({
      where: {
        hospitalId,
        OR: [
          { name: { equals: trimmedName, mode: 'insensitive' } },
          ...(specialtyId ? [{ specialtyId: String(specialtyId) }] : [])
        ]
      }
    });
    if (existing) {
      return res.status(409).json({ success: false, error: { message: `'${trimmedName}' department already exists for your hospital` } });
    }

    const iconUrl = processIcon(icon);
    const activeFlag = isActive !== undefined ? isActive : (status ? status === 'active' : true);

    const department = await prisma.department.create({
      data: {
        name: trimmedName,
        code: code || trimmedName.slice(0, 4).toUpperCase(),
        description: description || null,
        icon: iconUrl || null,
        specialtyId: specialtyId ? String(specialtyId) : null,
        isActive: activeFlag,
        hospitalId
      }
    });
    res.status(201).json({ success: true, data: department });
  } catch (error) { next(error); }
};

export const updateDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const { id } = req.params;
    const { name, description, icon, isActive, status } = req.body;

    const department = await prisma.department.findUnique({ where: { id: String(id) } });
    if (!department || department.hospitalId !== hospitalId) return res.status(404).json({ success: false, error: { message: 'Not found' } });

    const iconUrl = processIcon(icon);
    const activeFlag = isActive !== undefined ? isActive : (status ? status === 'active' : undefined);

    const updated = await prisma.department.update({
      where: { id: String(id) },
      data: {
        name: name ? name.trim() : undefined,
        description: description !== undefined ? description : undefined,
        icon: iconUrl || undefined,
        isActive: activeFlag !== undefined ? activeFlag : undefined
      }
    });
    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
};

export const deleteDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const { id } = req.params;
    const department = await prisma.department.findUnique({ where: { id: String(id) } });
    if (!department || department.hospitalId !== hospitalId) {
      return res.status(404).json({ success: false, error: { message: 'Department not found' } });
    }
    await prisma.department.delete({ where: { id: String(id) } });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) { next(error); }
};

export const getDepartmentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const department = await prisma.department.findUnique({
      where: { id: String(req.params.id) },
      include: {
        diseases: true,
        _count: { select: { users: true, diseases: true } }
      }
    });
    if (!department) return res.status(404).json({ success: false, error: { message: 'Not found' } });
    res.json({ success: true, data: department });
  } catch (error) { next(error); }
};

export const getDepartmentDoctors = async (req: Request, res: Response, next: NextFunction) => {
    // keeping empty for brevity
    res.json({ success: true, data: [] });
}
