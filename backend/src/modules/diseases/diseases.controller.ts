import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';

// Primary/General care specialty names to categorize General diseases
const GENERAL_SPECIALTIES = [
  'General Medicine',
  'Family Medicine',
  'Primary Care',
  'Internal Medicine'
];

// Advanced/Critical care specialty names
const ADVANCED_SPECIALTIES = [
  'Cardiology',
  'Cardiothoracic Surgery',
  'Neurology',
  'Neurosurgery',
  'Oncology (Medical)',
  'Surgical Oncology',
  'Nephrology',
  'Pulmonology',
  'Hepatology',
  'Gastrointestinal Surgery',
  'Vascular Surgery'
];

export const getDiseases = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    const conditions = await prisma.platformCondition.findMany({
      where: search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { specialty: { name: { contains: search, mode: 'insensitive' } } }
        ]
      } : undefined,
      include: {
        specialty: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const specialties = await prisma.platformSpecialty.findMany({
      where: search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { conditions: { some: { name: { contains: search, mode: 'insensitive' } } } }
        ]
      } : undefined,
      include: {
        conditions: {
          where: search ? {
            name: { contains: search, mode: 'insensitive' }
          } : undefined,
          select: {
            id: true,
            name: true,
            description: true,
            specialtyId: true
          },
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });

    const general = conditions.filter(c => 
      GENERAL_SPECIALTIES.some(s => s.toLowerCase() === c.specialty.name.toLowerCase())
    );

    const advanced = conditions.filter(c =>
      ADVANCED_SPECIALTIES.some(s => s.toLowerCase() === c.specialty.name.toLowerCase())
    );

    res.json({
      success: true,
      data: {
        total: conditions.length,
        conditions: conditions.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description,
          specialtyId: c.specialty.id,
          specialtyName: c.specialty.name
        })),
        general: (general.length > 0 ? general : conditions.slice(0, 20)).map(c => ({
          id: c.id,
          name: c.name,
          description: c.description,
          specialtyId: c.specialty.id,
          specialtyName: c.specialty.name
        })),
        advanced: (advanced.length > 0 ? advanced : conditions.slice(20, 40)).map(c => ({
          id: c.id,
          name: c.name,
          description: c.description,
          specialtyId: c.specialty.id,
          specialtyName: c.specialty.name
        })),
        categorical: specialties.map(s => ({
          id: s.id,
          name: s.name,
          description: s.description,
          conditions: s.conditions
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getDiseaseById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const condition = await prisma.platformCondition.findUnique({
      where: { id },
      include: {
        specialty: true
      }
    });

    if (!condition) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Disease/Condition not found' }
      });
    }

    res.json({
      success: true,
      data: {
        id: condition.id,
        name: condition.name,
        description: condition.description,
        specialtyId: condition.specialty.id,
        specialtyName: condition.specialty.name
      }
    });
  } catch (error) {
    next(error);
  }
};
