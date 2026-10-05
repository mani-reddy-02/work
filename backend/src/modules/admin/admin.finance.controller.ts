import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';

export const getTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const opBookings = await prisma.oPBooking.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        hospital: { select: { id: true, name: true } },
        patient: { select: { id: true, name: true } },
        doctor: { select: { id: true, name: true } }
      }
    });

    const labBookings = await prisma.labBooking.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        hospital: { select: { id: true, name: true } },
        patient: { select: { id: true, name: true } }
      }
    });

    const nursingBookings = await prisma.homeNursingBooking.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        hospital: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } }
      }
    });

    // Combine into a generic transaction array
    let transactions = [
      ...opBookings.map(b => ({
        id: b.id,
        bookingId: b.id.substring(0, 8).toUpperCase(),
        date: b.createdAt,
        patientName: b.patientName || b.patient?.name || 'Unknown',
        service: b.opType === 'Normal' ? 'OP Booking' : b.opType,
        hospitalName: b.hospital?.name || 'Unknown',
        hospitalId: b.hospital?.id,
        grossAmount: b.fee || 0,
        hospitalSharePercentage: b.hospitalSharePercentage || 80,
        mediqueeCommissionPercentage: b.mediqueeCommissionPercentage || 20,
        hospitalAmount: b.hospitalAmount || ((b.fee || 0) * 0.8),
        mediqueeAmount: b.mediqueeAmount || ((b.fee || 0) * 0.2),
        status: b.status === 'COMPLETED' ? 'Completed' : 'Pending',
        raw: b
      })),
      ...labBookings.map(b => ({
        id: b.id,
        bookingId: b.id.substring(0, 8).toUpperCase(),
        date: b.createdAt,
        patientName: b.patient?.name || 'Unknown',
        service: b.bookingType === 'HOME_COLLECTION' ? 'Home Sample Collection' : 'Lab Tests',
        hospitalName: b.hospital?.name || 'Unknown',
        hospitalId: b.hospital?.id,
        grossAmount: b.totalAmount || 0,
        hospitalSharePercentage: 80, // Defaulting as lab orders don't have these fields explicitly yet
        mediqueeCommissionPercentage: 20,
        hospitalAmount: (b.totalAmount || 0) * 0.8,
        mediqueeAmount: (b.totalAmount || 0) * 0.2,
        status: ['REPORT_READY', 'SAMPLE_COLLECTED', 'IN_LAB_PROCESSING'].includes(b.status) ? 'Completed' : 'Pending',
        raw: b
      })),
      ...nursingBookings.map(b => ({
        id: b.id,
        bookingId: b.bookingNumber || b.id.substring(0, 8).toUpperCase(),
        date: b.createdAt,
        patientName: b.patientName || b.user?.name || 'Unknown',
        service: 'Home Nursing',
        hospitalName: b.hospital?.name || 'Unknown',
        hospitalId: b.hospital?.id,
        grossAmount: b.totalAmount || 0,
        hospitalSharePercentage: 80,
        mediqueeCommissionPercentage: 20,
        hospitalAmount: (b.totalAmount || 0) * 0.8,
        mediqueeAmount: (b.totalAmount || 0) * 0.2,
        status: b.status === 'COMPLETED' ? 'Completed' : 'Pending',
        raw: b
      }))
    ];

    transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    res.json({ success: true, data: transactions });
  } catch (error) {
    next(error);
  }
};

export const getTransactionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    // We would need to search across OPBooking, LabBooking, HomeNursingBooking
    // Since we combined them in memory above, let's just do a quick generic find.
    // In a real production system with high volume, this would be indexed differently.
    const op = await prisma.oPBooking.findUnique({ where: { id }, include: { hospital: true, patient: true, doctor: true } });
    if (op) return res.json({ success: true, data: { ...op, type: 'OP Booking' } });

    const lab = await prisma.labBooking.findUnique({ where: { id }, include: { hospital: true, patient: true } });
    if (lab) return res.json({ success: true, data: { ...lab, type: lab.bookingType === 'HOME_COLLECTION' ? 'Home Sample Collection' : 'Lab Tests' } });

    const nursing = await prisma.homeNursingBooking.findUnique({ where: { id }, include: { hospital: true, user: true } });
    if (nursing) return res.json({ success: true, data: { ...nursing, type: 'Home Nursing' } });

    res.status(404).json({ success: false, message: 'Transaction not found' });
  } catch (error) {
    next(error);
  }
};

export const getRevenueAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Generate analytics based on transactions
    // Since we lack a dedicated Revenue table, we aggregate on the fly.
    const opBookings = await prisma.oPBooking.findMany({ include: { hospital: true }});
    const labBookings = await prisma.labBooking.findMany({ include: { hospital: true }});
    const nursingBookings = await prisma.homeNursingBooking.findMany({ include: { hospital: true }});

    let grossRevenue = 0;
    let hospitalShare = 0;
    let mediqueeCommission = 0;
    let totalTransactions = 0;

    let revenueByHospital: any = {};
    let revenueByService: any = {
      'OP Booking': { gross: 0, hospital: 0, mediquee: 0, count: 0 },
      'Lab Tests': { gross: 0, hospital: 0, mediquee: 0, count: 0 },
      'Home Sample Collection': { gross: 0, hospital: 0, mediquee: 0, count: 0 },
      'Home Nursing': { gross: 0, hospital: 0, mediquee: 0, count: 0 }
    };

    const processItem = (item: any, serviceType: string, gross: number, hShare: number, mShare: number, hospName: string) => {
      grossRevenue += gross;
      hospitalShare += hShare;
      mediqueeCommission += mShare;
      totalTransactions++;

      if (!revenueByHospital[hospName]) {
        revenueByHospital[hospName] = { hospitalName: hospName, gross: 0, hospital: 0, mediquee: 0, count: 0 };
      }
      revenueByHospital[hospName].gross += gross;
      revenueByHospital[hospName].hospital += hShare;
      revenueByHospital[hospName].mediquee += mShare;
      revenueByHospital[hospName].count++;

      revenueByService[serviceType].gross += gross;
      revenueByService[serviceType].hospital += hShare;
      revenueByService[serviceType].mediquee += mShare;
      revenueByService[serviceType].count++;
    };

    opBookings.forEach(b => {
      const gross = b.fee || 0;
      const hShare = b.hospitalAmount || (gross * 0.8);
      const mShare = b.mediqueeAmount || (gross * 0.2);
      processItem(b, 'OP Booking', gross, hShare, mShare, b.hospital?.name || 'Unknown');
    });

    labBookings.forEach(b => {
      const gross = b.totalAmount || 0;
      const hShare = gross * 0.8;
      const mShare = gross * 0.2;
      const sType = b.bookingType === 'HOME_COLLECTION' ? 'Home Sample Collection' : 'Lab Tests';
      processItem(b, sType, gross, hShare, mShare, b.hospital?.name || 'Unknown');
    });

    nursingBookings.forEach(b => {
      const gross = b.totalAmount || 0;
      const hShare = gross * 0.8;
      const mShare = gross * 0.2;
      processItem(b, 'Home Nursing', gross, hShare, mShare, b.hospital?.name || 'Unknown');
    });

    res.json({
      success: true,
      data: {
        kpis: {
          grossRevenue,
          hospitalShare,
          mediqueeCommission,
          totalTransactions,
          averageTransaction: totalTransactions ? (grossRevenue / totalTransactions) : 0
        },
        revenueByHospital: Object.values(revenueByHospital),
        revenueByService: Object.entries(revenueByService).map(([name, data]: any) => ({ name, ...data }))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getSettlements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // There is no Settlements table in the DB.
    // We will generate mocked settlement periods based on hospital payout aggregations.
    // A proper implementation would require a Settlement Prisma Model.
    // For now, we group transactions by hospital and month to represent "Settlements".
    const opBookings = await prisma.oPBooking.findMany({ include: { hospital: true }});
    
    let settlementsMap: any = {};

    opBookings.forEach(b => {
      const date = new Date(b.createdAt);
      const period = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      const hospitalId = b.hospitalId || 'unknown';
      const key = `${hospitalId}-${period}`;

      if (!settlementsMap[key]) {
        settlementsMap[key] = {
          id: `SETTLE-${b.hospitalId?.substring(0, 5).toUpperCase()}-${period.replace(' ', '').toUpperCase()}`,
          hospitalId: b.hospitalId,
          hospitalName: b.hospital?.name || 'Unknown',
          period,
          transactionCount: 0,
          grossRevenue: 0,
          hospitalAmount: 0,
          status: 'PENDING',
          createdDate: new Date(date.getFullYear(), date.getMonth() + 1, 1).toISOString(),
        };
      }
      
      const gross = b.fee || 0;
      const hShare = b.hospitalAmount || (gross * 0.8);
      
      settlementsMap[key].transactionCount++;
      settlementsMap[key].grossRevenue += gross;
      settlementsMap[key].hospitalAmount += hShare;
    });

    res.json({ success: true, data: Object.values(settlementsMap) });
  } catch (error) {
    next(error);
  }
};
