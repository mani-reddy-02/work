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

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      select: { hospitalShare: true }
    });
    
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }

    const HOSPITAL_SHARE_RATE = (hospital.hospitalShare ?? 80) / 100;
    const ADMIN_COMMISSION_RATE = 1 - HOSPITAL_SHARE_RATE;

    const { startDate, endDate } = req.query;
    const now = new Date();

    // Parse date boundaries safely (prevent timezone-shift issues with YYYY-MM-DD)
    const parseStartDate = (dateStr?: any) => {
      if (!dateStr) {
        return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      }
      const parts = String(dateStr).split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
      }
      const d = new Date(String(dateStr));
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const parseEndDate = (dateStr?: any) => {
      if (!dateStr) {
        return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      }
      const parts = String(dateStr).split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        return new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);
      }
      const d = new Date(String(dateStr));
      d.setHours(23, 59, 59, 999);
      return d;
    };

    const start = parseStartDate(startDate);
    const end = parseEndDate(endDate);

    // This Month and Last Month ranges for KPI summaries
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Bounding range covering the requested interval AND the this/last month KPI intervals
    const minDate = new Date(Math.min(start.getTime(), lastMonthStart.getTime()));
    const maxDate = new Date(Math.max(end.getTime(), thisMonthEnd.getTime()));

    // 1. Fetch active OP bookings in a single query (prevents connection pool exhaustion)
    const allOpBookings = await prisma.oPBooking.findMany({
      where: {
        hospitalId,
        appointmentDate: { gte: minDate, lte: maxDate },
        status: { not: 'CANCELLED' }
      },
      select: {
        id: true,
        fee: true,
        opType: true,
        appointmentDate: true,
        patientName: true,
        status: true,
        hospitalAmount: true,
        mediqueeAmount: true
      },
      orderBy: { appointmentDate: 'desc' }
    });

    // 2. Fetch lab bookings safely
    let allLabBookings: any[] = [];
    try {
      allLabBookings = await prisma.labBooking.findMany({
        where: {
          hospitalId,
          createdAt: { gte: minDate, lte: maxDate },
          status: { not: 'CANCELLED' }
        },
        select: {
          id: true,
          totalAmount: true,
          createdAt: true,
          patientId: true,
          status: true,
          bookingType: true,
          hospitalAmount: true,
          mediqueeAmount: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch {
      allLabBookings = [];
    }

    // 3. Fetch home nursing bookings safely
    let allNursingBookings: any[] = [];
    try {
      allNursingBookings = await prisma.homeNursingBooking.findMany({
        where: {
          hospitalId,
          serviceDate: { gte: minDate, lte: maxDate },
          status: { not: 'CANCELLED' }
        },
        select: {
          id: true,
          bookingNumber: true,
          totalAmount: true,
          serviceDate: true,
          patientName: true,
          status: true,
          hospitalAmount: true,
          mediqueeAmount: true
        },
        orderBy: { serviceDate: 'desc' }
      });
    } catch {
      allNursingBookings = [];
    }

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'COMPLETED':
          return 'text-emerald-700 bg-emerald-50 border-emerald-200';
        case 'IN_CONSULTATION':
          return 'text-blue-700 bg-blue-50 border-blue-200';
        case 'WAITING':
        case 'PENDING':
          return 'text-amber-700 bg-amber-50 border-amber-200';
        default:
          return 'text-gray-700 bg-gray-50 border-gray-200';
      }
    };

    // Filter bookings strictly for the requested [start, end] range
    const rangeOpBookings = allOpBookings.filter(
      b => b.appointmentDate >= start && b.appointmentDate <= end
    );
    const rangeLabBookings = allLabBookings.filter(
      b => b.createdAt >= start && b.createdAt <= end
    );
    const rangeNursingBookings = allNursingBookings.filter(
      b => b.serviceDate >= start && b.serviceDate <= end
    );

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
      adminCommission: number;
      hospitalPayout: number;
      status: string;
      statusColor: string;
      patientName: string;
    }> = [];

    for (const b of rangeOpBookings) {
      const amount = b.fee || 0;
      const adminCut = b.mediqueeAmount ?? Math.round(amount * 0.20);
      const hospitalNet = b.hospitalAmount ?? Math.round(amount * 0.80);
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
          adminCommission: adminCut,
          hospitalPayout: hospitalNet,
          status: b.status,
          statusColor: getStatusColor(b.status),
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
          adminCommission: adminCut,
          hospitalPayout: hospitalNet,
          status: b.status,
          statusColor: getStatusColor(b.status),
          patientName: b.patientName
        });
      }
    }

    // Categorize Lab vs Home Sample Collection
    let labRevenue = 0;
    let labCount = 0;
    let sampleRevenue = 0;
    let sampleCount = 0;

    for (const b of rangeLabBookings) {
      const amount = (b as any).totalAmount || (b as any).price || 0;
      const adminCut = (b as any).mediqueeAmount ?? Math.round(amount * 0.20);
      const hospitalNet = (b as any).hospitalAmount ?? Math.round(amount * 0.80);
      const isSample = b.bookingType === 'HOME_COLLECTION';
      if (isSample) {
        sampleRevenue += amount;
        sampleCount += 1;
        allTransactions.push({
          id: b.id.slice(0, 8).toUpperCase(),
          service: 'Home Sample Collection',
          type: 'HOME_SAMPLE_COLLECTION',
          rawDate: new Date(b.createdAt),
          amount,
          adminCommission: adminCut,
          hospitalPayout: hospitalNet,
          status: b.status,
          statusColor: getStatusColor(b.status),
          patientName: (b as any).patientId || 'Patient'
        });
      } else {
        labRevenue += amount;
        labCount += 1;
        allTransactions.push({
          id: b.id.slice(0, 8).toUpperCase(),
          service: 'Lab Tests',
          type: 'LAB_TEST',
          rawDate: new Date(b.createdAt),
          amount,
          adminCommission: adminCut,
          hospitalPayout: hospitalNet,
          status: b.status,
          statusColor: getStatusColor(b.status),
          patientName: (b as any).patientId || 'Patient'
        });
      }
    }

    // Categorize Home Nursing
    let nursingRevenue = 0;
    let nursingCount = 0;

    for (const b of rangeNursingBookings) {
      const amount = b.totalAmount || 0;
      const adminCut = b.mediqueeAmount ?? Math.round(amount * 0.20);
      const hospitalNet = b.hospitalAmount ?? Math.round(amount * 0.80);
      nursingRevenue += amount;
      nursingCount += 1;
      allTransactions.push({
        id: b.bookingNumber || b.id.slice(0, 8).toUpperCase(),
        service: 'Home Nursing',
        type: 'HOME_NURSING',
        rawDate: new Date(b.serviceDate),
        amount,
        adminCommission: adminCut,
        hospitalPayout: hospitalNet,
        status: b.status,
        statusColor: getStatusColor(b.status),
        patientName: b.patientName
      });
    }

    // Calculate Gross and Net (actuals or fallback) per service
    const opAdminCommission = allTransactions.filter(t => t.type === 'OP').reduce((sum, t) => sum + t.adminCommission, 0);
    const opHospitalPayout = allTransactions.filter(t => t.type === 'OP').reduce((sum, t) => sum + t.hospitalPayout, 0);

    const videoAdminCommission = allTransactions.filter(t => t.type === 'VIDEO_CONSULTATION').reduce((sum, t) => sum + t.adminCommission, 0);
    const videoHospitalPayout = allTransactions.filter(t => t.type === 'VIDEO_CONSULTATION').reduce((sum, t) => sum + t.hospitalPayout, 0);

    const nursingAdminCommission = allTransactions.filter(t => t.type === 'HOME_NURSING').reduce((sum, t) => sum + t.adminCommission, 0);
    const nursingHospitalPayout = allTransactions.filter(t => t.type === 'HOME_NURSING').reduce((sum, t) => sum + t.hospitalPayout, 0);

    const labAdminCommission = allTransactions.filter(t => t.type === 'LAB_TEST').reduce((sum, t) => sum + t.adminCommission, 0);
    const labHospitalPayout = allTransactions.filter(t => t.type === 'LAB_TEST').reduce((sum, t) => sum + t.hospitalPayout, 0);

    const sampleAdminCommission = allTransactions.filter(t => t.type === 'HOME_SAMPLE_COLLECTION').reduce((sum, t) => sum + t.adminCommission, 0);
    const sampleHospitalPayout = allTransactions.filter(t => t.type === 'HOME_SAMPLE_COLLECTION').reduce((sum, t) => sum + t.hospitalPayout, 0);

    // Totals
    const totalGross = opRevenue + videoRevenue + nursingRevenue + labRevenue + sampleRevenue;
    const totalAdminCommission = opAdminCommission + videoAdminCommission + nursingAdminCommission + labAdminCommission + sampleAdminCommission;
    const totalHospitalPayout = totalGross - totalAdminCommission;

    const totalTransactions = opCount + videoCount + nursingCount + labCount + sampleCount;
    const averagePayout = totalTransactions > 0 ? Math.round(totalGross / totalTransactions) : 0;
    const averageHospitalPayout = totalTransactions > 0 ? Math.round(totalHospitalPayout / totalTransactions) : 0;

    // Monthly totals (This Month & Last Month)
    const thisMonthOP = allOpBookings
      .filter(b => b.appointmentDate >= thisMonthStart && b.appointmentDate <= thisMonthEnd)
      .reduce((sum, b) => sum + (b.fee || 0), 0);
    const thisMonthLab = allLabBookings
      .filter(b => b.createdAt >= thisMonthStart && b.createdAt <= thisMonthEnd)
      .reduce((sum, b) => sum + ((b as any).totalAmount || (b as any).price || 0), 0);
    const thisMonthNursing = allNursingBookings
      .filter(b => b.serviceDate >= thisMonthStart && b.serviceDate <= thisMonthEnd)
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    const lastMonthOP = allOpBookings
      .filter(b => b.appointmentDate >= lastMonthStart && b.appointmentDate <= lastMonthEnd)
      .reduce((sum, b) => sum + (b.fee || 0), 0);
    const lastMonthLab = allLabBookings
      .filter(b => b.createdAt >= lastMonthStart && b.createdAt <= lastMonthEnd)
      .reduce((sum, b) => sum + ((b as any).totalAmount || (b as any).price || 0), 0);
    const lastMonthNursing = allNursingBookings
      .filter(b => b.serviceDate >= lastMonthStart && b.serviceDate <= lastMonthEnd)
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    const thisMonthTotal = thisMonthOP + thisMonthLab + thisMonthNursing;
    const thisMonthHospitalPayout = allOpBookings.filter(b => b.appointmentDate >= thisMonthStart && b.appointmentDate <= thisMonthEnd).reduce((sum, b) => sum + (b.hospitalAmount ?? (b.fee || 0) * 0.8), 0) +
      allLabBookings.filter(b => b.createdAt >= thisMonthStart && b.createdAt <= thisMonthEnd).reduce((sum, b) => sum + ((b as any).hospitalAmount ?? ((b as any).totalAmount || (b as any).price || 0) * 0.8), 0) +
      allNursingBookings.filter(b => b.serviceDate >= thisMonthStart && b.serviceDate <= thisMonthEnd).reduce((sum, b) => sum + (b.hospitalAmount ?? (b.totalAmount || 0) * 0.8), 0);

    const lastMonthTotal = lastMonthOP + lastMonthLab + lastMonthNursing;
    const lastMonthHospitalPayout = allOpBookings.filter(b => b.appointmentDate >= lastMonthStart && b.appointmentDate <= lastMonthEnd).reduce((sum, b) => sum + (b.hospitalAmount ?? (b.fee || 0) * 0.8), 0) +
      allLabBookings.filter(b => b.createdAt >= lastMonthStart && b.createdAt <= thisMonthEnd).reduce((sum, b) => sum + ((b as any).hospitalAmount ?? ((b as any).totalAmount || (b as any).price || 0) * 0.8), 0) +
      allNursingBookings.filter(b => b.serviceDate >= lastMonthStart && b.serviceDate <= thisMonthEnd).reduce((sum, b) => sum + (b.hospitalAmount ?? (b.totalAmount || 0) * 0.8), 0);

    // Sort transactions by date descending
    allTransactions.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());

    // Format transactions for response
    const recentTransactions = allTransactions.slice(0, 50).map(txn => ({
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
      amount: txn.amount, // Gross
      adminCommission: txn.adminCommission,
      hospitalPayout: txn.hospitalPayout,
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
      if (dailyMap.has(key)) {
        dailyMap.set(key, (dailyMap.get(key) || 0) + txn.hospitalPayout);
      } else {
        dailyMap.set(key, txn.hospitalPayout);
      }
    }

    const payoutTrend = Array.from(dailyMap.entries()).map(([name, value]) => ({
      name,
      value
    }));

    const toYMD = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    res.json({
      success: true,
      data: {
        totalPayout: totalGross,
        totalGross,
        totalAdminCommission,
        totalHospitalPayout,
        adminCommissionRate: ADMIN_COMMISSION_RATE,
        hospitalShareRate: HOSPITAL_SHARE_RATE,
        byService: {
          op: {
            revenue: opRevenue,
            count: opCount,
            adminCommission: opAdminCommission,
            hospitalPayout: opHospitalPayout
          },
          videoConsultation: {
            revenue: videoRevenue,
            count: videoCount,
            adminCommission: videoAdminCommission,
            hospitalPayout: videoHospitalPayout
          },
          homeNursing: {
            revenue: nursingRevenue,
            count: nursingCount,
            adminCommission: nursingAdminCommission,
            hospitalPayout: nursingHospitalPayout
          },
          labTests: {
            revenue: labRevenue,
            count: labCount,
            adminCommission: labAdminCommission,
            hospitalPayout: labHospitalPayout
          },
          homeSampleCollection: {
            revenue: sampleRevenue,
            count: sampleCount,
            adminCommission: sampleAdminCommission,
            hospitalPayout: sampleHospitalPayout
          }
        },
        payoutSummary: {
          totalTransactions,
          averagePayout,
          averageHospitalPayout,
          thisMonth: thisMonthTotal,
          thisMonthHospitalPayout,
          lastMonth: lastMonthTotal,
          lastMonthHospitalPayout
        },
        payoutTrend,
        recentTransactions,
        dateRange: {
          startDate: toYMD(start),
          endDate: toYMD(end)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
