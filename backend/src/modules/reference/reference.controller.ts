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
