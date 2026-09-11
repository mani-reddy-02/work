import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';

export const getHospitalPayouts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user?.hospitalId;
    if (!hospitalId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'User does not belong to a hospital' }
      });
    }

    const { startDate, endDate } = req.query;
    const now = new Date();

    // Parse date boundaries
    let start: Date;
    let end: Date;

    if (startDate) {
      start = new Date(String(startDate));
      start.setHours(0, 0, 0, 0);
    } else {
      // Default: 1st day of current month
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    }

    if (endDate) {
      end = new Date(String(endDate));
      end.setHours(23, 59, 59, 999);
    } else {
      // Default: last day of current month
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // This Month and Last Month ranges for KPI summaries
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Concurrently fetch completed records for the requested range & KPI periods
    const [
      opBookings,
      thisMonthOPAgg,
      lastMonthOPAgg
    ] = await Promise.all([
      // OPBookings in requested date range
      prisma.oPBooking.findMany({
        where: {
          hospitalId,
          appointmentDate: { gte: start, lte: end },
          status: 'COMPLETED'
        },
        select: {
          id: true,
          fee: true,
          opType: true,
          appointmentDate: true,
          patientName: true,
          status: true
        }
      }),

      // This Month OP completed fee sum
      prisma.oPBooking.aggregate({
        where: {
          hospitalId,
          appointmentDate: { gte: thisMonthStart, lte: thisMonthEnd },
          status: 'COMPLETED'
        },
        _sum: { fee: true }
      }),

      // Last Month OP completed fee sum
      prisma.oPBooking.aggregate({
        where: {
          hospitalId,
          appointmentDate: { gte: lastMonthStart, lte: lastMonthEnd },
          status: 'COMPLETED'
        },
        _sum: { fee: true }
      })
    ]);

    // Query lab bookings in requested date range safely
    let labBookings: any[] = [];
    let thisMonthLabAgg = 0;
    let lastMonthLabAgg = 0;
    try {
      labBookings = await prisma.labBooking.findMany({
        where: {
          hospitalId,
          bookingDate: { gte: start, lte: end },
          status: 'COMPLETED'
        },
        select: {
          id: true,
          bookingNumber: true,
          totalAmount: true,
          bookingDate: true,
          patientName: true,
          status: true,
          collectionType: true
        }
      });

      const thisMonthLab = await prisma.labBooking.aggregate({
        where: {
          hospitalId,
          bookingDate: { gte: thisMonthStart, lte: thisMonthEnd },
          status: 'COMPLETED'
        },
        _sum: { totalAmount: true }
      });
      thisMonthLabAgg = thisMonthLab._sum.totalAmount ?? 0;

      const lastMonthLab = await prisma.labBooking.aggregate({
        where: {
          hospitalId,
          bookingDate: { gte: lastMonthStart, lte: lastMonthEnd },
          status: 'COMPLETED'
        },
        _sum: { totalAmount: true }
      });
      lastMonthLabAgg = lastMonthLab._sum.totalAmount ?? 0;
    } catch {
      labBookings = [];
    }

    // Query home nursing bookings in requested date range safely
    let homeNursingBookings: any[] = [];
    let thisMonthNursingAgg = 0;
    let lastMonthNursingAgg = 0;
    try {
      homeNursingBookings = await prisma.homeNursingBooking.findMany({
        where: {
          hospitalId,
          serviceDate: { gte: start, lte: end },
          status: 'COMPLETED'
        },
        select: {
          id: true,
          bookingNumber: true,
          totalAmount: true,
          serviceDate: true,
          patientName: true,
          status: true
        }
      });

      const thisMonthNursing = await prisma.homeNursingBooking.aggregate({
        where: {
          hospitalId,
          serviceDate: { gte: thisMonthStart, lte: thisMonthEnd },
          status: 'COMPLETED'
        },
        _sum: { totalAmount: true }
      });
      thisMonthNursingAgg = thisMonthNursing._sum.totalAmount ?? 0;

      const lastMonthNursing = await prisma.homeNursingBooking.aggregate({
        where: {
          hospitalId,
          serviceDate: { gte: lastMonthStart, lte: lastMonthEnd },
          status: 'COMPLETED'
        },
        _sum: { totalAmount: true }
      });
      lastMonthNursingAgg = lastMonthNursing._sum.totalAmount ?? 0;
    } catch {
      homeNursingBookings = [];
    }

    // Categorize OP vs Video Consultation
    let opRevenue = 0;
    let opCount = 0;
    let videoRevenue = 0;
    let videoCount = 0;

    const allTransactions: Array<{
      id: string;
      service: string;
      type: string;
      rawDate: Date;
      amount: number;
      status: string;
      statusColor: string;
      patientName: string;
    }> = [];

    for (const b of opBookings) {
      const amount = b.fee || 0;
      const isVideo = (b.opType || '').toLowerCase().includes('video');
      if (isVideo) {
        videoRevenue += amount;
        videoCount += 1;
        allTransactions.push({
          id: b.id.slice(0, 8).toUpperCase(),
          service: 'Video Consultation',
          type: 'VIDEO_CONSULTATION',
          rawDate: new Date(b.appointmentDate),
          amount,
          status: 'COMPLETED',
          statusColor: 'text-purple-700 bg-purple-50 border-purple-200',
          patientName: b.patientName
        });
      } else {
        opRevenue += amount;
        opCount += 1;
        allTransactions.push({
          id: b.id.slice(0, 8).toUpperCase(),
          service: 'OP',
          type: 'OP',
          rawDate: new Date(b.appointmentDate),
          amount,
          status: 'COMPLETED',
          statusColor: 'text-blue-700 bg-blue-50 border-blue-200',
          patientName: b.patientName
        });
      }
    }

    // Categorize Lab vs Home Sample Collection
    let labRevenue = 0;
    let labCount = 0;
    let sampleRevenue = 0;
    let sampleCount = 0;

    for (const b of labBookings) {
      const amount = b.totalAmount || 0;
      const isSample = b.collectionType === 'HOME_COLLECTION';
      if (isSample) {
        sampleRevenue += amount;
        sampleCount += 1;
        allTransactions.push({
          id: b.bookingNumber || b.id.slice(0, 8).toUpperCase(),
          service: 'Home Sample Collection',
          type: 'HOME_SAMPLE_COLLECTION',
          rawDate: new Date(b.bookingDate),
          amount,
          status: 'COMPLETED',
          statusColor: 'text-orange-700 bg-orange-50 border-orange-200',
          patientName: b.patientName
        });
      } else {
        labRevenue += amount;
        labCount += 1;
        allTransactions.push({
          id: b.bookingNumber || b.id.slice(0, 8).toUpperCase(),
          service: 'Lab Tests',
          type: 'LAB_TEST',
          rawDate: new Date(b.bookingDate),
          amount,
          status: 'COMPLETED',
          statusColor: 'text-pink-700 bg-pink-50 border-pink-200',
          patientName: b.patientName
        });
      }
    }

    // Categorize Home Nursing
    let nursingRevenue = 0;
    let nursingCount = 0;

    for (const b of homeNursingBookings) {
      const amount = b.totalAmount || 0;
      nursingRevenue += amount;
      nursingCount += 1;
      allTransactions.push({
        id: b.bookingNumber || b.id.slice(0, 8).toUpperCase(),
        service: 'Home Nursing',
        type: 'HOME_NURSING',
        rawDate: new Date(b.serviceDate),
        amount,
        status: 'COMPLETED',
        statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        patientName: b.patientName
      });
    }

    // Total payout and counts
    const totalPayout = opRevenue + videoRevenue + nursingRevenue + labRevenue + sampleRevenue;
    const totalTransactions = opCount + videoCount + nursingCount + labCount + sampleCount;
    const averagePayout = totalTransactions > 0 ? Math.round(totalPayout / totalTransactions) : 0;

    // Monthly totals
    const thisMonthTotal = (thisMonthOPAgg._sum.fee ?? 0) + thisMonthLabAgg + thisMonthNursingAgg;
    const lastMonthTotal = (lastMonthOPAgg._sum.fee ?? 0) + lastMonthLabAgg + lastMonthNursingAgg;

    // Sort transactions by date descending
    allTransactions.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());

    // Format transactions for response
    const recentTransactions = allTransactions.slice(0, 25).map(txn => ({
      id: txn.id,
      service: txn.service,
      type: txn.type,
      date: txn.rawDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) + ' ' + txn.rawDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      amount: txn.amount,
      status: txn.status,
      statusColor: txn.statusColor,
      patientName: txn.patientName
    }));

    // Generate trend data (group by date string)
    const dailyMap = new Map<string, number>();

    // If range is within 31 days, generate everyday point
    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 31) {
      const iter = new Date(start);
      while (iter <= end) {
        const key = iter.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        dailyMap.set(key, 0);
        iter.setDate(iter.getDate() + 1);
      }
    }

    for (const txn of allTransactions) {
      const key = txn.rawDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      dailyMap.set(key, (dailyMap.get(key) || 0) + txn.amount);
    }

    const payoutTrend = Array.from(dailyMap.entries()).map(([name, value]) => ({
      name,
      value
    }));

    res.json({
      success: true,
      data: {
        totalPayout,
        byService: {
          op: { revenue: opRevenue, count: opCount },
          videoConsultation: { revenue: videoRevenue, count: videoCount },
          homeNursing: { revenue: nursingRevenue, count: nursingCount },
          labTests: { revenue: labRevenue, count: labCount },
          homeSampleCollection: { revenue: sampleRevenue, count: sampleCount }
        },
        payoutSummary: {
          totalTransactions,
          averagePayout,
          thisMonth: thisMonthTotal,
          lastMonth: lastMonthTotal
        },
        payoutTrend,
        recentTransactions,
        dateRange: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
