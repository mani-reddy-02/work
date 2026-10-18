import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(__dirname, '../../../../uploads/settlements');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Calculates Monday-to-Sunday weekly boundaries for a given date
 */
export function getWeekRange(date: Date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  const diffToMonday = (day === 0 ? -6 : 1) - day;

  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const startFmt = monday.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  const endFmt = sunday.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  const periodLabel = `${startFmt} - ${endFmt}`;

  // Week number (1-53)
  const onejan = new Date(monday.getFullYear(), 0, 1);
  const weekNum = Math.ceil((((monday.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
  const weekCode = `${monday.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;

  return { monday, sunday, periodLabel, weekCode };
}

/**
 * Weekly settlement generator engine
 * - Excludes transactions that are already linked to a settlement (enforced via SettlementItem unique constraint)
 * - Computes gross, commission, and partner share using authoritative hospital commission rates
 * - Groups transactions by partner and weekly period
 */
export async function generateWeeklySettlementsEngine() {
  // 1. Fetch all settled transaction identifiers to exclude duplicates
  const existingItems = await prisma.settlementItem.findMany({
    select: { bookingType: true, bookingId: true }
  });
  const settledMap = new Set(existingItems.map(i => `${i.bookingType}_${i.bookingId}`));

  // 2. Fetch all bookings
  const [opBookings, labBookings, nursingBookings] = await Promise.all([
    prisma.oPBooking.findMany({
      where: { fee: { gt: 0 }, isWalkIn: false, payoutEligible: true },
      include: {
        hospital: { select: { id: true, name: true, hospitalShare: true, businessType: true } },
        patient: { select: { name: true } },
        videoConsultation: { select: { id: true } }
      }
    }),
    prisma.labBooking.findMany({
      where: { totalAmount: { gt: 0 } },
      include: {
        hospital: { select: { id: true, name: true, hospitalShare: true, businessType: true } },
        patient: { select: { name: true } }
      }
    }),
    prisma.homeNursingBooking.findMany({
      where: { totalAmount: { gt: 0 }, paymentStatus: 'PAID' },
      include: {
        hospital: { select: { id: true, name: true, hospitalShare: true, businessType: true } },
        user: { select: { name: true } }
      }
    })
  ]);

  interface CandidateItem {
    bookingType: 'OP_BOOKING' | 'LAB_BOOKING' | 'HOME_NURSING';
    bookingId: string;
    bookingNumber: string;
    serviceName: string;
    patientName: string;
    transactionDate: Date;
    grossAmount: number;
    commissionPercentage: number;
    adminCommission: number;
    partnerShare: number;
    partnerId: string;
    partnerName: string;
    partnerType: string;
  }

  const unassignedItems: CandidateItem[] = [];

  // Collect OP Bookings
  for (const b of opBookings) {
    if (settledMap.has(`OP_BOOKING_${b.id}`)) continue;
    if (!b.hospitalId || !b.hospital) continue;

    const isVideo = Boolean(b.videoConsultation) || b.opType?.toLowerCase().includes('video') || b.opType?.toLowerCase().includes('online');
    const serviceName = isVideo ? 'Video Consultation' : (b.opType === 'Normal' ? 'OP Booking' : (b.opType || 'OP Booking'));
    const gross = b.fee || 0;
    const hSharePct = b.hospitalSharePercentage ?? b.hospital.hospitalShare ?? 80;
    const mSharePct = 100 - hSharePct;
    const hAmt = b.hospitalAmount ?? (gross * (hSharePct / 100));
    const mAmt = b.mediqueeAmount ?? (gross * (mSharePct / 100));

    unassignedItems.push({
      bookingType: 'OP_BOOKING',
      bookingId: b.id,
      bookingNumber: b.id.substring(0, 8).toUpperCase(),
      serviceName,
      patientName: b.patientName || b.patient?.name || 'Patient',
      transactionDate: b.createdAt,
      grossAmount: gross,
      commissionPercentage: mSharePct,
      adminCommission: mAmt,
      partnerShare: hAmt,
      partnerId: b.hospital.id,
      partnerName: b.hospital.name,
      partnerType: b.hospital.businessType || 'HOSPITAL'
    });
  }

  // Collect Lab Bookings
  for (const b of labBookings) {
    if (settledMap.has(`LAB_BOOKING_${b.id}`)) continue;
    if (!b.hospitalId || !b.hospital) continue;

    const serviceName = b.bookingType === 'HOME_COLLECTION' ? 'Home Sample Collection' : 'Lab Tests';
    const gross = b.totalAmount || 0;
    const hSharePct = b.hospitalSharePercentage ?? b.hospital.hospitalShare ?? 80;
    const mSharePct = 100 - hSharePct;
    const hAmt = b.hospitalAmount ?? (gross * (hSharePct / 100));
    const mAmt = b.mediqueeAmount ?? (gross * (mSharePct / 100));

    unassignedItems.push({
      bookingType: 'LAB_BOOKING',
      bookingId: b.id,
      bookingNumber: b.id.substring(0, 8).toUpperCase(),
      serviceName,
      patientName: b.patient?.name || 'Patient',
      transactionDate: b.createdAt,
      grossAmount: gross,
      commissionPercentage: mSharePct,
      adminCommission: mAmt,
      partnerShare: hAmt,
      partnerId: b.hospital.id,
      partnerName: b.hospital.name,
      partnerType: b.hospital.businessType || 'LABORATORY'
    });
  }

  // Collect Home Nursing Bookings
  for (const b of nursingBookings) {
    if (settledMap.has(`HOME_NURSING_${b.id}`)) continue;
    if (!b.hospitalId || !b.hospital) continue;

    const gross = b.totalAmount || 0;
    const hSharePct = b.hospitalSharePercentage ?? b.hospital.hospitalShare ?? 80;
    const mSharePct = 100 - hSharePct;
    const hAmt = b.hospitalAmount ?? (gross * (hSharePct / 100));
    const mAmt = b.mediqueeAmount ?? (gross * (mSharePct / 100));

    unassignedItems.push({
      bookingType: 'HOME_NURSING',
      bookingId: b.id,
      bookingNumber: b.bookingNumber || b.id.substring(0, 8).toUpperCase(),
      serviceName: 'Home Nursing',
      patientName: b.patientName || b.user?.name || 'Patient',
      transactionDate: b.createdAt,
      grossAmount: gross,
      commissionPercentage: mSharePct,
      adminCommission: mAmt,
      partnerShare: hAmt,
      partnerId: b.hospital.id,
      partnerName: b.hospital.name,
      partnerType: b.hospital.businessType || 'HOSPITAL'
    });
  }

  if (unassignedItems.length === 0) {
    return { created: 0, updated: 0, processedTransactions: 0 };
  }

  // Group candidate items by partnerId + weekCode
  const batches = new Map<string, {
    partnerId: string;
    partnerName: string;
    partnerType: string;
    monday: Date;
    sunday: Date;
    periodLabel: string;
    weekCode: string;
    items: CandidateItem[];
  }>();

  for (const item of unassignedItems) {
    const { monday, sunday, periodLabel, weekCode } = getWeekRange(item.transactionDate);
    const batchKey = `${item.partnerId}_${weekCode}`;

    if (!batches.has(batchKey)) {
      batches.set(batchKey, {
        partnerId: item.partnerId,
        partnerName: item.partnerName,
        partnerType: item.partnerType,
        monday,
        sunday,
        periodLabel,
        weekCode,
        items: []
      });
    }
    batches.get(batchKey)!.items.push(item);
  }

  let createdCount = 0;
  let updatedCount = 0;

  for (const [_, batch] of batches) {
    // Check if an existing open settlement exists for this partner & period
    let settlement = await prisma.settlement.findFirst({
      where: {
        partnerId: batch.partnerId,
        periodStart: batch.monday,
        periodEnd: batch.sunday
      }
    });

    if (settlement && settlement.status === 'PAID') {
      // Do not append to a completed paid settlement
      continue;
    }

    if (!settlement) {
      const typeCode = batch.partnerType === 'LABORATORY' ? 'LAB' : 'HOSP';
      const partnerSub = batch.partnerId.replace(/-/g, '').substring(0, 4).toUpperCase();
      const settlementNumber = `SETTLE-${typeCode}-${batch.weekCode}-${partnerSub}`;

      // Calculate totals for batch
      const grossRevenue = batch.items.reduce((sum, i) => sum + i.grossAmount, 0);
      const adminCommission = batch.items.reduce((sum, i) => sum + i.adminCommission, 0);
      const partnerShare = batch.items.reduce((sum, i) => sum + i.partnerShare, 0);
      const avgCommissionRate = grossRevenue > 0 ? (adminCommission / grossRevenue) * 100 : 20.0;
      const avgPartnerRate = 100 - avgCommissionRate;

      settlement = await prisma.settlement.create({
        data: {
          settlementNumber,
          partnerId: batch.partnerId,
          partnerName: batch.partnerName,
          partnerType: batch.partnerType,
          periodStart: batch.monday,
          periodEnd: batch.sunday,
          periodLabel: batch.periodLabel,
          status: 'APPROVED',
          transactionCount: batch.items.length,
          grossRevenue,
          commissionBasis: grossRevenue,
          adminCommissionRate: Math.round(avgCommissionRate * 10) / 10,
          adminCommission,
          partnerShareRate: Math.round(avgPartnerRate * 10) / 10,
          partnerShare,
          adjustments: 0,
          refunds: 0,
          payableAmount: partnerShare,
          dueDate: new Date(batch.sunday.getTime() + 5 * 86400000) // 5 days after period end
        }
      });
      createdCount++;
    } else {
      // Update existing pending/approved settlement
      const addGross = batch.items.reduce((sum, i) => sum + i.grossAmount, 0);
      const addAdmin = batch.items.reduce((sum, i) => sum + i.adminCommission, 0);
      const addPartner = batch.items.reduce((sum, i) => sum + i.partnerShare, 0);

      const newGross = settlement.grossRevenue + addGross;
      const newAdmin = settlement.adminCommission + addAdmin;
      const newPartner = settlement.partnerShare + addPartner;
      const newCount = settlement.transactionCount + batch.items.length;
      const newPayable = newPartner - settlement.adjustments - settlement.refunds;

      settlement = await prisma.settlement.update({
        where: { id: settlement.id },
        data: {
          grossRevenue: newGross,
          commissionBasis: newGross,
          adminCommission: newAdmin,
          partnerShare: newPartner,
          payableAmount: newPayable,
          transactionCount: newCount
        }
      });
      updatedCount++;
    }

    // Insert items into settlement
    for (const item of batch.items) {
      await prisma.settlementItem.create({
        data: {
          settlementId: settlement.id,
          bookingType: item.bookingType,
          bookingId: item.bookingId,
          bookingNumber: item.bookingNumber,
          serviceName: item.serviceName,
          patientName: item.patientName,
          transactionDate: item.transactionDate,
          grossAmount: item.grossAmount,
          commissionPercentage: item.commissionPercentage,
          adminCommission: item.adminCommission,
          partnerShare: item.partnerShare,
          status: 'COMPLETED'
        }
      });
    }
  }

  return { created: createdCount, updated: updatedCount, processedTransactions: unassignedItems.length };
}

/**
 * GET /api/v1/admin/finance/settlements
 * List all settlements with search, filters, pagination, and KPI summaries
 */
export const getSettlements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // If table is empty, auto-run weekly generator on first load
    const count = await prisma.settlement.count();
    if (count === 0) {
      await generateWeeklySettlementsEngine();
    }

    const {
      search,
      partnerType,
      status,
      period,
      page = '1',
      limit = '20'
    } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search && String(search).trim()) {
      const q = String(search).trim();
      where.OR = [
        { settlementNumber: { contains: q, mode: 'insensitive' } },
        { partnerName: { contains: q, mode: 'insensitive' } },
        { periodLabel: { contains: q, mode: 'insensitive' } },
        { paymentReference: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (partnerType && partnerType !== 'all') {
      where.partnerType = String(partnerType).toUpperCase();
    }

    if (status && status !== 'all') {
      where.status = String(status).toUpperCase();
    }

    if (period && period !== 'all') {
      where.periodLabel = { contains: String(period), mode: 'insensitive' };
    }

    const [total, settlements, allAggregates] = await Promise.all([
      prisma.settlement.count({ where }),
      prisma.settlement.findMany({
        where,
        orderBy: [{ periodStart: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limitNum,
        include: {
          attachments: { select: { id: true, fileName: true, fileUrl: true, documentType: true } }
        }
      }),
      prisma.settlement.aggregate({
        where,
        _sum: {
          grossRevenue: true,
          adminCommission: true,
          partnerShare: true,
          payableAmount: true,
          paidAmount: true
        }
      })
    ]);

    // Format with continuous serial numbers
    const formatted = settlements.map((s, idx) => ({
      sNo: skip + idx + 1,
      id: s.id,
      settlementNumber: s.settlementNumber,
      partnerId: s.partnerId,
      partnerName: s.partnerName,
      partnerType: s.partnerType === 'LABORATORY' ? 'Lab' : 'Hospital',
      rawPartnerType: s.partnerType,
      period: s.periodLabel,
      periodStart: s.periodStart,
      periodEnd: s.periodEnd,
      eligibleTransactions: s.transactionCount,
      transactionCount: s.transactionCount,
      grossRevenue: s.grossRevenue,
      commissionBasis: s.commissionBasis,
      adminCommission: s.adminCommission,
      adminCommissionRate: s.adminCommissionRate,
      partnerShare: s.partnerShare,
      partnerShareRate: s.partnerShareRate,
      adjustments: s.adjustments,
      refunds: s.refunds,
      payableAmount: s.payableAmount,
      paidAmount: s.paidAmount,
      status: s.status,
      paymentReference: s.paymentReference,
      paymentDate: s.paymentDate,
      paymentProofUrl: s.paymentProofUrl,
      processedBy: s.processedBy,
      attachmentsCount: s.attachments.length,
      attachments: s.attachments,
      createdAt: s.createdAt
    }));

    res.json({
      success: true,
      data: formatted,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.max(1, Math.ceil(total / limitNum))
      },
      summary: {
        totalGross: allAggregates._sum.grossRevenue || 0,
        totalCommission: allAggregates._sum.adminCommission || 0,
        totalPayable: allAggregates._sum.payableAmount || 0,
        totalPaid: allAggregates._sum.paidAmount || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/finance/settlements/:id
 * Retrieve complete settlement details, breakdown, included transactions, and attachments
 */
export const getSettlementById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const settlement = await prisma.settlement.findFirst({
      where: {
        OR: [
          { id },
          { settlementNumber: id }
        ]
      },
      include: {
        items: {
          orderBy: { transactionDate: 'desc' }
        },
        attachments: {
          orderBy: { uploadedAt: 'desc' }
        },
        payoutHistory: {
          orderBy: { createdAt: 'desc' }
        },
        hospital: {
          select: {
            id: true,
            name: true,
            businessType: true,
            contactPhone: true,
            contactEmail: true,
            city: true,
            state: true,
            addressLine1: true,
            hospitalShare: true
          }
        }
      }
    });

    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: `Settlement not found for ID: ${id}`
      });
    }

    res.json({
      success: true,
      data: {
        id: settlement.id,
        settlementNumber: settlement.settlementNumber,
        partnerId: settlement.partnerId,
        partnerName: settlement.partnerName,
        partnerType: settlement.partnerType === 'LABORATORY' ? 'Lab' : 'Hospital',
        rawPartnerType: settlement.partnerType,
        periodLabel: settlement.periodLabel,
        periodStart: settlement.periodStart,
        periodEnd: settlement.periodEnd,
        createdAt: settlement.createdAt,
        dueDate: settlement.dueDate,
        status: settlement.status,
        transactionCount: settlement.transactionCount,
        paymentReference: settlement.paymentReference,
        paymentDate: settlement.paymentDate,
        paymentMethod: settlement.paymentMethod,
        paymentProofUrl: settlement.paymentProofUrl,
        processedBy: settlement.processedBy,
        notes: settlement.notes,

        // Breakdown values
        breakdown: {
          grossRevenue: settlement.grossRevenue,
          commissionBasis: settlement.commissionBasis,
          adminCommissionRate: settlement.adminCommissionRate,
          adminCommission: settlement.adminCommission,
          partnerShareRate: settlement.partnerShareRate,
          partnerShare: settlement.partnerShare,
          adjustments: settlement.adjustments,
          refunds: settlement.refunds,
          payableAmount: settlement.payableAmount,
          paidAmount: settlement.paidAmount || 0,
          outstandingAmount: Math.max(0, settlement.payableAmount - (settlement.paidAmount || 0))
        },

        // Included transactions
        transactions: settlement.items.map(item => ({
          id: item.id,
          bookingId: item.bookingNumber || item.bookingId.substring(0, 8).toUpperCase(),
          rawBookingId: item.bookingId,
          bookingType: item.bookingType,
          serviceType: item.serviceName,
          patientName: item.patientName || 'Unknown Patient',
          paymentDate: item.transactionDate,
          grossAmount: item.grossAmount,
          adminCommission: item.adminCommission,
          commissionPercentage: item.commissionPercentage,
          partnerShare: item.partnerShare,
          status: item.status
        })),

        // Attachments
        attachments: settlement.attachments.map(att => ({
          id: att.id,
          fileName: att.fileName,
          documentType: att.documentType,
          fileUrl: att.fileUrl,
          fileSize: att.fileSize,
          mimeType: att.mimeType,
          uploadedBy: att.uploadedBy || 'Admin',
          uploadedAt: att.uploadedAt
        })),

        // Payout Records
        payoutHistory: settlement.payoutHistory,

        // Partner Facility Information
        partner: settlement.hospital
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/finance/settlements/generate
 * Trigger weekly settlement generation batch
 */
export const generateSettlements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await generateWeeklySettlementsEngine();
    res.json({
      success: true,
      message: `Weekly settlement generation completed. Created: ${result.created}, Updated: ${result.updated}, Transactions processed: ${result.processedTransactions}`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/finance/settlements/:id/attachments
 * Upload a supporting document or payment proof
 */
export const uploadSettlementAttachment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settlementId = req.params.id as string;
    const { fileName, documentType = 'SETTLEMENT_STATEMENT', fileData } = req.body;

    if (!fileName || !fileData) {
      return res.status(400).json({
        success: false,
        message: 'File name and Base64 file data are required'
      });
    }

    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId }
    });

    if (!settlement) {
      return res.status(404).json({ success: false, message: 'Settlement not found' });
    }

    // Extract Base64 buffer
    let mimeType = 'application/octet-stream';
    let base64Content = fileData;
    const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      mimeType = matches[1];
      base64Content = matches[2];
    }

    const fileBuffer = Buffer.from(base64Content, 'base64');
    const safeFileName = `SETTLE_${settlement.settlementNumber}_${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(UPLOADS_DIR, safeFileName);

    fs.writeFileSync(filePath, fileBuffer);
    const fileUrl = `/uploads/settlements/${safeFileName}`;

    const attachment = await prisma.settlementAttachment.create({
      data: {
        settlementId: settlement.id,
        fileName,
        documentType,
        fileUrl,
        fileSize: fileBuffer.length,
        mimeType,
        uploadedBy: req.user?.name || (req.user as any)?.email || 'Super Admin'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Attachment uploaded successfully',
      data: attachment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/admin/finance/settlements/:id/attachments/:attachmentId
 * Delete attachment
 */
export const deleteSettlementAttachment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, attachmentId } = req.params;

    const attachment = await prisma.settlementAttachment.findFirst({
      where: { id: attachmentId as string, settlementId: id as string }
    });

    if (!attachment) {
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }

    // Attempt to remove file from disk
    try {
      const fileName = path.basename(attachment.fileUrl);
      const filePath = path.join(UPLOADS_DIR, fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      // Ignore filesystem unlinking error
    }

    await prisma.settlementAttachment.delete({
      where: { id: attachmentId as string }
    });

    res.json({ success: true, message: 'Attachment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/finance/settlements/:id/payout
 * Confirm manual external bank/UPI transfer payout
 * - Atomic database transaction
 * - Rejects if settlement is already PAID (prevents duplicate payouts)
 * - Persists PayoutRecord in permanent payout history
 * - Updates Settlement status to PAID
 * - Sends Notification to Hospital/Lab admin
 */
export const processManualPayout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settlementId = req.params.id as string;
    const {
      transferReference,
      paymentDate,
      paymentMethod = 'BANK_TRANSFER',
      amount,
      notes,
      proofAttachmentId,
      proofFile,
      exceptionReason
    } = req.body;

    const ref = (transferReference || '').trim();
    const exReason = (exceptionReason || '').trim();

    if (!ref && !exReason) {
      return res.status(400).json({
        success: false,
        message: 'A valid transfer reference (UTR / Transaction ID) or a recorded exception reason is required'
      });
    }

    const payTimestamp = paymentDate ? new Date(paymentDate) : new Date();
    if (isNaN(payTimestamp.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid payment date provided' });
    }

    // Process optional proof file upload if included in request
    let proofUrl: string | undefined = undefined;
    if (proofFile && proofFile.fileData && proofFile.fileName) {
      try {
        let base64Content = proofFile.fileData;
        let mimeType = 'image/png';
        const matches = proofFile.fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          base64Content = matches[2];
        }
        const fileBuffer = Buffer.from(base64Content, 'base64');
        const safeFileName = `PROOF_${settlementId.substring(0, 8)}_${Date.now()}_${proofFile.fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const filePath = path.join(UPLOADS_DIR, safeFileName);
        fs.writeFileSync(filePath, fileBuffer);
        proofUrl = `/uploads/settlements/${safeFileName}`;

        await prisma.settlementAttachment.create({
          data: {
            settlementId,
            fileName: proofFile.fileName,
            documentType: 'BANK_TRANSFER_RECEIPT',
            fileUrl: proofUrl,
            fileSize: fileBuffer.length,
            mimeType,
            uploadedBy: req.user?.name || (req.user as any)?.email || 'Super Admin'
          }
        });
      } catch (err) {
        console.error('Failed to save proof attachment during payout:', err);
      }
    } else if (proofAttachmentId) {
      const att = await prisma.settlementAttachment.findUnique({ where: { id: proofAttachmentId } });
      if (att) proofUrl = att.fileUrl;
    }

    // Execute payout in an atomic transaction to prevent concurrent duplicate payouts
    const payoutResult = await prisma.$transaction(async (tx) => {
      // Fetch latest settlement record inside transaction
      const settlement = await tx.settlement.findUnique({
        where: { id: settlementId },
        include: { attachments: true }
      });

      if (!settlement) {
        throw new Error('NOT_FOUND: Settlement does not exist');
      }

      // ── CRITICAL: Prevent Duplicate Payout ──
      if (settlement.status === 'PAID') {
        throw new Error('ALREADY_PAID: This settlement has already been paid and recorded. Duplicate payouts are strictly prohibited.');
      }

      // Reconcile amount: ensure confirmation amount matches payable amount
      if (amount !== undefined && Math.abs(Number(amount) - settlement.payableAmount) > 0.05) {
        throw new Error(`AMOUNT_MISMATCH: Provided confirmation amount (₹${amount}) does not match payable settlement amount (₹${settlement.payableAmount})`);
      }

      const effectiveProofUrl = proofUrl || settlement.paymentProofUrl || (settlement.attachments.length > 0 ? settlement.attachments[0].fileUrl : null);
      const effectiveReference = ref || `EXCEPTION: ${exReason}`;
      const adminIdentifier = req.user?.name || (req.user as any)?.email || 'Super Admin';
      const payoutNumber = `PAY-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

      // 1. Create permanent PayoutRecord
      const payoutRecord = await tx.payoutRecord.create({
        data: {
          payoutNumber,
          settlementId: settlement.id,
          partnerId: settlement.partnerId,
          partnerName: settlement.partnerName,
          partnerType: settlement.partnerType,
          periodLabel: settlement.periodLabel,
          amountPaid: settlement.payableAmount,
          paymentDate: payTimestamp,
          transferReference: effectiveReference,
          paymentMethod,
          paymentProofUrl: effectiveProofUrl,
          processedBy: adminIdentifier,
          notes: notes || (exReason ? `Exception: ${exReason}` : undefined),
          status: 'COMPLETED'
        }
      });

      // 2. Mark Settlement as PAID
      const updatedSettlement = await tx.settlement.update({
        where: { id: settlement.id },
        data: {
          status: 'PAID',
          paidAmount: settlement.payableAmount,
          paymentReference: effectiveReference,
          paymentDate: payTimestamp,
          paymentMethod,
          paymentProofUrl: effectiveProofUrl,
          processedBy: adminIdentifier,
          notes: notes ? `${settlement.notes ? settlement.notes + '\n' : ''}${notes}` : settlement.notes
        }
      });

      // 3. Dispatch Notification to Hospital / Lab Admin
      try {
        await tx.notification.create({
          data: {
            hospitalId: settlement.partnerId,
            title: 'Settlement Payout Completed',
            message: `A payout of ₹${settlement.payableAmount.toLocaleString('en-IN')} for period ${settlement.periodLabel} has been recorded. Reference: ${effectiveReference}`,
            type: 'payout',
            metadata: {
              settlementId: settlement.id,
              settlementNumber: settlement.settlementNumber,
              payoutId: payoutRecord.id,
              payoutNumber: payoutRecord.payoutNumber,
              amount: settlement.payableAmount,
              reference: effectiveReference,
              paymentDate: payTimestamp.toISOString()
            }
          }
        });
      } catch (notifErr) {
        console.error('Notification dispatch warning (non-fatal):', notifErr);
      }

      return { updatedSettlement, payoutRecord };
    });

    res.json({
      success: true,
      message: 'Payout recorded successfully',
      data: {
        settlement: payoutResult.updatedSettlement,
        payoutRecord: payoutResult.payoutRecord
      }
    });
  } catch (error: any) {
    if (error.message?.includes('ALREADY_PAID')) {
      return res.status(409).json({
        success: false,
        message: 'This settlement has already been paid and recorded. Duplicate payouts are strictly prohibited.'
      });
    }
    if (error.message?.includes('AMOUNT_MISMATCH')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.message?.includes('NOT_FOUND')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * GET /api/v1/admin/finance/payouts
 * Retrieve permanent payout history with search, filters, and pagination
 */
export const getPayoutHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      search,
      partnerType,
      status,
      startDate,
      endDate,
      page = '1',
      limit = '20'
    } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search && String(search).trim()) {
      const q = String(search).trim();
      where.OR = [
        { payoutNumber: { contains: q, mode: 'insensitive' } },
        { partnerName: { contains: q, mode: 'insensitive' } },
        { transferReference: { contains: q, mode: 'insensitive' } },
        { periodLabel: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (partnerType && partnerType !== 'all') {
      where.partnerType = String(partnerType).toUpperCase();
    }

    if (status && status !== 'all') {
      where.status = String(status).toUpperCase();
    }

    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(String(startDate));
      if (endDate) {
        const end = new Date(String(endDate));
        end.setHours(23, 59, 59, 999);
        where.paymentDate.lte = end;
      }
    }

    const [total, records, aggregate] = await Promise.all([
      prisma.payoutRecord.count({ where }),
      prisma.payoutRecord.findMany({
        where,
        orderBy: { paymentDate: 'desc' },
        skip,
        take: limitNum,
        include: {
          settlement: {
            select: {
              settlementNumber: true,
              grossRevenue: true,
              adminCommission: true,
              partnerShare: true
            }
          }
        }
      }),
      prisma.payoutRecord.aggregate({
        where,
        _sum: { amountPaid: true }
      })
    ]);

    const formatted = records.map((r, idx) => ({
      sNo: skip + idx + 1,
      id: r.id,
      payoutId: r.payoutNumber,
      settlementId: r.settlement.settlementNumber,
      rawSettlementId: r.settlementId,
      partner: r.partnerName,
      partnerType: r.partnerType === 'LABORATORY' ? 'Lab' : 'Hospital',
      rawPartnerType: r.partnerType,
      settlementPeriod: r.periodLabel,
      amountPaid: r.amountPaid,
      paymentDate: r.paymentDate,
      transferReference: r.transferReference,
      paymentMethod: r.paymentMethod,
      paymentProofUrl: r.paymentProofUrl,
      processedBy: r.processedBy,
      status: r.status,
      notes: r.notes,
      grossRevenue: r.settlement.grossRevenue,
      adminCommission: r.settlement.adminCommission
    }));

    res.json({
      success: true,
      data: formatted,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.max(1, Math.ceil(total / limitNum))
      },
      summary: {
        totalPaidAmount: aggregate._sum.amountPaid || 0,
        recordCount: total
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/finance/payouts/:id
 * Retrieve single payout record details
 */
export const getPayoutRecordById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const record = await prisma.payoutRecord.findFirst({
      where: {
        OR: [
          { id },
          { payoutNumber: id }
        ]
      },
      include: {
        settlement: {
          include: {
            attachments: true,
            items: true
          }
        }
      }
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Payout record not found' });
    }

    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};
