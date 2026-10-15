import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';



import { getHospitalRevenueAnalytics } from '../dashboard/dashboard.controller';

// Unified handler for both Dashboard Revenue and Payouts analytics
export const getHospitalPayouts = getHospitalRevenueAnalytics;

/**
 * GET /api/v1/hospital/payouts/settlements
 * Partner view of settlements (strictly scoped to partner's hospitalId)
 */
export const getPartnerSettlements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user?.hospitalId;
    if (!hospitalId) {
      return res.status(403).json({ success: false, message: 'User is not linked to a hospital or laboratory facility' });
    }

    const settlements = await prisma.settlement.findMany({
      where: { partnerId: hospitalId },
      orderBy: { periodStart: 'desc' },
      include: {
        attachments: {
          select: { id: true, fileName: true, documentType: true, fileUrl: true, uploadedAt: true }
        },
        payoutHistory: {
          select: { id: true, payoutNumber: true, amountPaid: true, paymentDate: true, transferReference: true, paymentProofUrl: true, status: true }
        }
      }
    });

    res.json({ success: true, data: settlements });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/hospital/payouts/settlements/:id
 * Partner view of single settlement details (strictly scoped to partner's hospitalId)
 */
export const getPartnerSettlementById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user?.hospitalId;
    if (!hospitalId) {
      return res.status(403).json({ success: false, message: 'User is not linked to a hospital or laboratory facility' });
    }

    const id = req.params.id as string;

    const settlement = await prisma.settlement.findFirst({
      where: {
        id,
        partnerId: hospitalId // Enforces strict partner isolation
      },
      include: {
        items: {
          orderBy: { transactionDate: 'desc' }
        },
        attachments: true,
        payoutHistory: true
      }
    });

    if (!settlement) {
      return res.status(404).json({ success: false, message: 'Settlement not found or unauthorized' });
    }

    res.json({ success: true, data: settlement });
  } catch (error) {
    next(error);
  }
};

