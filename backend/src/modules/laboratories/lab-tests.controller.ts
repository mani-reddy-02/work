import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';

/**
 * GET /api/v1/hospital/lab-tests
 * Returns active tests belonging to the authenticated hospital
 */
export const getHospitalLabTests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = (req as any).user?.hospitalId;
    if (!hospitalId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'User is not associated with a hospital' } });
    }

    const tests = await prisma.labTest.findMany({
      where: { hospitalId },
      include: {
        platformTest: {
          include: { department: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: tests });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/hospital/lab-tests/batch
 * Accepts an array of { platformTestId, price, tatHours, isHomeCollectionAvailable, homeCollectionFee }
 */
export const addHospitalLabTestsBatch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = (req as any).user?.hospitalId;
    if (!hospitalId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'User is not associated with a hospital' } });
    }

    const payload = req.body;
    if (!Array.isArray(payload)) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Expected an array of tests' } });
    }

    const results = [];
    for (const item of payload) {
      const { platformTestId, price, tatHours, isHomeCollectionAvailable, homeCollectionFee } = item;
      
      const platformTest = await prisma.platformLabTest.findUnique({ where: { id: platformTestId } });
      if (!platformTest) {
        return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: `Platform test ${platformTestId} not found` } });
      }

      if (isHomeCollectionAvailable && !platformTest.canBeCollectedAtHome) {
        return res.status(400).json({ 
          success: false, 
          error: { code: 'BAD_REQUEST', message: `Test [${platformTest.name}] requires hospital diagnostic equipment and cannot be collected at home.` } 
        });
      }

      const created = await prisma.labTest.upsert({
        where: {
          hospitalId_platformTestId: {
            hospitalId,
            platformTestId,
          }
        },
        update: {
          price: Number(price),
          tatHours: Number(tatHours),
          isHomeCollectionAvailable: Boolean(isHomeCollectionAvailable),
          homeCollectionFee: Number(homeCollectionFee || 0),
          isActive: true
        },
        create: {
          hospitalId,
          platformTestId,
          price: Number(price),
          tatHours: Number(tatHours),
          isHomeCollectionAvailable: Boolean(isHomeCollectionAvailable),
          homeCollectionFee: Number(homeCollectionFee || 0),
          isActive: true
        }
      });
      results.push(created);
    }

    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/hospital/lab-tests/:id
 */
export const updateHospitalLabTest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = (req as any).user?.hospitalId;
    if (!hospitalId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'User is not associated with a hospital' } });
    }

    const testId = String(req.params.id);
    const { price, tatHours, isHomeCollectionAvailable, homeCollectionFee, isActive } = req.body;

    const existing = await prisma.labTest.findFirst({
      where: { id: testId, hospitalId },
      include: { platformTest: true }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Test not found in hospital offerings' } });
    }

    if (isHomeCollectionAvailable && !existing.platformTest.canBeCollectedAtHome) {
      return res.status(400).json({ 
        success: false, 
        error: { code: 'BAD_REQUEST', message: `Test [${existing.platformTest.name}] requires hospital diagnostic equipment and cannot be collected at home.` } 
      });
    }

    const updated = await prisma.labTest.update({
      where: { id: testId },
      data: {
        ...(price !== undefined && { price: Number(price) }),
        ...(tatHours !== undefined && { tatHours: Number(tatHours) }),
        ...(isHomeCollectionAvailable !== undefined && { isHomeCollectionAvailable: Boolean(isHomeCollectionAvailable) }),
        ...(homeCollectionFee !== undefined && { homeCollectionFee: Number(homeCollectionFee) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};
