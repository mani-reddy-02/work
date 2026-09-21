import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';

/**
 * GET /api/v1/reference/specialties
 * Returns all Platform Specialties and their associated Conditions.
 */
export const getSpecialties = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const specialties = await prisma.platformSpecialty.findMany({
      include: {
        conditions: {
          select: {
            id: true,
            name: true,
            description: true,
          }
        }
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: specialties });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/reference/lab-departments
 * Returns all diagnostic departments with their count of available tests.
 */
export const getLabDepartments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const departments = await prisma.platformLabDepartment.findMany({
      include: {
        _count: {
          select: { tests: true }
        }
      },
      orderBy: { name: 'asc' },
    });

    const formatted = departments.map(d => ({
      id: d.id,
      code: d.code,
      name: d.name,
      description: d.description,
      icon: d.icon,
      testCount: d._count.tests
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/reference/lab-tests
 * Returns master tests. Supports ?departmentId=... and ?search=...
 */
export const getPlatformLabTests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const departmentId = typeof req.query.departmentId === 'string' ? req.query.departmentId.trim() : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
    const homeCollectionOnly = req.query.homeCollectionOnly === 'true';

    const where: any = {};
    if (departmentId) where.departmentId = departmentId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (homeCollectionOnly) {
      where.canBeCollectedAtHome = true;
    }

    const tests = await prisma.platformLabTest.findMany({
      where,
      include: {
        department: { select: { id: true, name: true, code: true } }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ success: true, data: tests });
  } catch (error) {
    next(error);
  }
};
