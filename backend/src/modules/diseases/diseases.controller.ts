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
    
    const conditionsData = await prisma.platformCondition.findMany({ 
      where, 
      orderBy: { name: 'asc' },
      include: { specialty: true } 
    });
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
