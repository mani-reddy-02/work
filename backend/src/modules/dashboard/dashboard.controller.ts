import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';

export const getHospitalDashboardOverview = async (req: Request, res: Response, next: NextFunction) => {
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

    const hospitalShare = hospital?.hospitalShare ?? 80;
    const mediqueeCommission = 100 - hospitalShare;

    const now = new Date();

    // 1. Time range for Today: 00:00:00.000 to 23:59:59.999
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // 2. Time range for Current Week (Monday to Sunday)
    const dayOfWeek = now.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // 3. Time range for Current Month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // 4. Time range for Current Year
    const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    // 5. Concurrent metrics queries strictly filtered by hospitalId
    const [
      totalOPs,
      pendingOPs,
      completedOPs,
      upcomingOPs,
      todayBookings,
      upcomingBookings,
      activeBookingsThisYear,
      allLabBookingsThisYear,
      allNursingBookingsThisYear
    ] = await Promise.all([
      // Count of all OPBooking records today
      prisma.oPBooking.count({
        where: {
          hospitalId,
          appointmentDate: { gte: startOfDay, lte: endOfDay }
        }
      }),

      // Count of pending OPBooking records today (WAITING, IN_CONSULTATION, PENDING)
      prisma.oPBooking.count({
        where: {
          hospitalId,
          appointmentDate: { gte: startOfDay, lte: endOfDay },
          status: { in: ['WAITING', 'IN_CONSULTATION', 'PENDING'] }
        }
      }),

      // Count of completed OPBooking records today
      prisma.oPBooking.count({
        where: {
          hospitalId,
          appointmentDate: { gte: startOfDay, lte: endOfDay },
          status: 'COMPLETED'
        }
      }),

      // Count of upcoming OP bookings beyond today
      prisma.oPBooking.count({
        where: {
          hospitalId,
          appointmentDate: { gt: endOfDay },
          status: { not: 'CANCELLED' }
        }
      }),

      // Today's appointments list for the preview table
      prisma.oPBooking.findMany({
        where: {
          hospitalId,
          appointmentDate: { gte: startOfDay, lte: endOfDay }
        },
        include: {
          doctor: { select: { id: true, name: true, avatar: true } },
          department: { select: { id: true, name: true } }
        },
        orderBy: [
          { appointmentDate: 'asc' },
          { createdAt: 'asc' }
        ],
        take: 10
      }),

      // Upcoming appointments list beyond today
      prisma.oPBooking.findMany({
        where: {
          hospitalId,
          appointmentDate: { gt: endOfDay },
          status: { not: 'CANCELLED' }
        },
        include: {
          doctor: { select: { id: true, name: true, avatar: true } },
          department: { select: { id: true, name: true } }
        },
        orderBy: [
          { appointmentDate: 'asc' },
          { createdAt: 'asc' }
        ],
        take: 10
      }),

      // All active (non-cancelled) bookings this year for accurate, real-time revenue & trends
      prisma.oPBooking.findMany({
        where: {
          hospitalId,
          appointmentDate: { gte: startOfYear, lte: endOfYear },
          status: { not: 'CANCELLED' }
        },
        select: {
          id: true,
          fee: true,
          appointmentDate: true,
          timeSlot: true,
          slotTime: true
        }
      }),

      prisma.labBooking.findMany({
        where: {
          hospitalId,
          createdAt: { gte: startOfYear, lte: endOfYear },
          status: { not: 'CANCELLED' }
        },
        select: {
          id: true,
          totalAmount: true,
          createdAt: true
        }
      }).catch(() => []),

      prisma.homeNursingBooking.findMany({
        where: {
          hospitalId,
          serviceDate: { gte: startOfYear, lte: endOfYear },
          status: { not: 'CANCELLED' }
        },
        select: {
          id: true,
          totalAmount: true,
          serviceDate: true
        }
      }).catch(() => [])
    ]);

    const activeBookingsToday = activeBookingsThisYear.filter(
      b => b.appointmentDate >= startOfDay && b.appointmentDate <= endOfDay
    );
    const activeBookingsThisWeek = activeBookingsThisYear.filter(
      b => b.appointmentDate >= startOfWeek && b.appointmentDate <= endOfWeek
    );
    const activeBookingsThisMonth = activeBookingsThisYear.filter(
      b => b.appointmentDate >= startOfMonth && b.appointmentDate <= endOfMonth
    );

    // 6. Lab Tests count (scoped to hospital, returns 0 safely if none)
    let labTests = 0;
    try {
      labTests = await prisma.labBooking.count({
        where: {
          hospitalId,
          createdAt: { gte: startOfDay, lte: endOfDay },
          status: { not: 'CANCELLED' }
        }
      });
    } catch {
      labTests = 0;
    }

    // 7. Real-Time Complete Revenue Calculations Across All Services (Day, Week, Month, Year)
    const opRevenueToday = activeBookingsThisYear
      .filter(b => b.appointmentDate >= startOfDay && b.appointmentDate <= endOfDay)
      .reduce((sum, b) => sum + (b.fee || 0), 0);
    const labRevenueToday = (allLabBookingsThisYear as any[])
      .filter(b => b.createdAt >= startOfDay && b.createdAt <= endOfDay)
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const nursingRevenueToday = (allNursingBookingsThisYear as any[])
      .filter(b => b.serviceDate >= startOfDay && b.serviceDate <= endOfDay)
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const revenueToday = opRevenueToday + labRevenueToday + nursingRevenueToday;

    const opRevenueThisWeek = activeBookingsThisYear
      .filter(b => b.appointmentDate >= startOfWeek && b.appointmentDate <= endOfWeek)
      .reduce((sum, b) => sum + (b.fee || 0), 0);
    const labRevenueThisWeek = (allLabBookingsThisYear as any[])
      .filter(b => b.createdAt >= startOfWeek && b.createdAt <= endOfWeek)
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const nursingRevenueThisWeek = (allNursingBookingsThisYear as any[])
      .filter(b => b.serviceDate >= startOfWeek && b.serviceDate <= endOfWeek)
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const revenueThisWeek = opRevenueThisWeek + labRevenueThisWeek + nursingRevenueThisWeek;

    const opRevenueThisMonth = activeBookingsThisYear
      .filter(b => b.appointmentDate >= startOfMonth && b.appointmentDate <= endOfMonth)
      .reduce((sum, b) => sum + (b.fee || 0), 0);
    const labRevenueThisMonth = (allLabBookingsThisYear as any[])
      .filter(b => b.createdAt >= startOfMonth && b.createdAt <= endOfMonth)
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const nursingRevenueThisMonth = (allNursingBookingsThisYear as any[])
      .filter(b => b.serviceDate >= startOfMonth && b.serviceDate <= endOfMonth)
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const revenueThisMonth = opRevenueThisMonth + labRevenueThisMonth + nursingRevenueThisMonth;

    const revenueThisYear = activeBookingsThisYear.reduce((sum, b) => sum + (b.fee || 0), 0) +
      (allLabBookingsThisYear as any[]).reduce((sum, b) => sum + (b.totalAmount || 0), 0) +
      (allNursingBookingsThisYear as any[]).reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    // 8. Trend: Today (hourly/interval buckets)
    const todayBuckets = [
      { name: '9 AM', startH: 0, endH: 10, revenue: 0 },
      { name: '11 AM', startH: 10, endH: 12, revenue: 0 },
      { name: '1 PM', startH: 12, endH: 14, revenue: 0 },
      { name: '3 PM', startH: 14, endH: 16, revenue: 0 },
      { name: '5 PM', startH: 16, endH: 18, revenue: 0 },
      { name: '7 PM+', startH: 18, endH: 24, revenue: 0 }
    ];
    for (const item of activeBookingsToday) {
      const d = new Date(item.appointmentDate);
      const h = d.getHours();
      const b = todayBuckets.find(bucket => h >= bucket.startH && h < bucket.endH);
      if (b) {
        b.revenue += (item.fee || 0);
      } else {
        todayBuckets[0].revenue += (item.fee || 0);
      }
    }
    const trendToday = todayBuckets.map(b => ({ name: b.name, revenue: b.revenue }));

    // 9. Trend: Week (Monday to Sunday)
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dailyTotals: Record<string, number> = {
      Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0
    };
    for (const item of activeBookingsThisWeek) {
      const itemDate = new Date(item.appointmentDate);
      const dayIdx = itemDate.getDay(); // 0 is Sun
      const key = dayIdx === 0 ? 'Sun' : dayNames[dayIdx - 1];
      dailyTotals[key] = (dailyTotals[key] || 0) + (item.fee || 0);
    }
    const trendWeek = dayNames.map(name => ({
      name,
      revenue: dailyTotals[name] || 0
    }));

    // 10. Trend: Month (Week 1 to Week 5)
    const monthWeeks = [
      { name: 'Week 1', startDay: 1, endDay: 7, revenue: 0 },
      { name: 'Week 2', startDay: 8, endDay: 14, revenue: 0 },
      { name: 'Week 3', startDay: 15, endDay: 21, revenue: 0 },
      { name: 'Week 4', startDay: 22, endDay: 28, revenue: 0 },
      { name: 'Week 5', startDay: 29, endDay: 31, revenue: 0 }
    ];
    for (const item of activeBookingsThisMonth) {
      const dayNum = new Date(item.appointmentDate).getDate();
      const w = monthWeeks.find(w => dayNum >= w.startDay && dayNum <= w.endDay);
      if (w) w.revenue += (item.fee || 0);
    }
    const trendMonth = monthWeeks.map(w => ({ name: w.name, revenue: w.revenue }));

    // 11. Trend: Year (Jan to Dec)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const yearlyTotals: Record<string, number> = {};
    monthNames.forEach(m => { yearlyTotals[m] = 0; });
    for (const item of activeBookingsThisYear) {
      const mIdx = new Date(item.appointmentDate).getMonth();
      const mName = monthNames[mIdx];
      yearlyTotals[mName] = (yearlyTotals[mName] || 0) + (item.fee || 0);
    }
    const trendYear = monthNames.map(name => ({
      name,
      revenue: yearlyTotals[name] || 0
    }));

    // 12. Format appointments for preview
    const mapAppointmentToPreview = (b: any) => {
      const timeStr = b.timeSlot || b.slotTime || new Date(b.appointmentDate).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      let statusColor = 'text-amber-600 bg-amber-50';
      if (b.status === 'COMPLETED') statusColor = 'text-emerald-600 bg-emerald-50';
      else if (b.status === 'IN_CONSULTATION') statusColor = 'text-blue-600 bg-blue-50';
      else if (b.status === 'CANCELLED') statusColor = 'text-rose-600 bg-rose-50';

      return {
        id: b.id,
        patientId: b.patientId,
        date: b.appointmentDate.toISOString().split('T')[0],
        time: timeStr,
        name: b.patientName,
        dept: b.department?.name || 'Not assigned',
        doctor: b.doctor?.name || 'Not assigned',
        status: b.status,
        statusColor,
        avatar: b.doctor?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(b.patientName)}`
      };
    };

    const formattedTodayAppointments = todayBookings.map(mapAppointmentToPreview);
    const formattedUpcomingAppointments = upcomingBookings.map(mapAppointmentToPreview);

    res.json({
      success: true,
      data: {
        totalOPs,
        pendingOPs,
        completedOPs,
        upcomingOPs,
        labTests,
        revenueToday,
        revenueThisWeek,
        revenueThisMonth,
        revenueThisYear,
        revenueTrend: trendWeek,
        revenueTrends: {
          today: trendToday,
          week: trendWeek,
          month: trendMonth,
          year: trendYear
        },
        todayAppointments: formattedTodayAppointments,
        upcomingAppointments: formattedUpcomingAppointments,
        hospitalSharePercentage: hospitalShare,
        mediqueeCommissionPercentage: mediqueeCommission
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getHospitalRevenueAnalytics = async (req: Request, res: Response, next: NextFunction) => {
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
      select: { hospitalShare: true, businessType: true, name: true }
    });

    const hospitalShareRate = hospital?.hospitalShare ?? 80;
    const platformFeeRate = 100 - hospitalShareRate;

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const toIsoDateString = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    let range = ((req.query.range as string) || '').toLowerCase();
    const qStart = req.query.startDate as string | undefined;
    const qEnd = req.query.endDate as string | undefined;

    // Normalize preset synonyms
    if (range === 'last7') range = 'week';
    if (range === 'thismonth' || range === 'last30') range = 'month';

    // If range is not given, infer from dates or default to 'week'
    if (!range) {
      if (qStart && qEnd) {
        if (qStart === qEnd && qStart === toIsoDateString(now)) {
          range = 'today';
        } else {
          range = 'custom';
        }
      } else {
        range = 'week';
      }
    }

    let startDate: Date;
    let endDate: Date;
    let rangeLabel = '';

    type IntervalBucket = {
      label: string;
      date: string;
      fullDate?: string;
      revenue: number;
      hospitalShare: number;
      platformFee: number;
      matcher: (d: Date) => boolean;
    };

    const buckets: IntervalBucket[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    if (range === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      const todayStr = toIsoDateString(now);
      rangeLabel = `Today, ${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;

      // Hourly intervals: 09:00, 12:00, 15:00, 18:00, 21:00
      const hourlyConfig = [
        { label: '09:00', startH: 0, endH: 10, fullDate: `${todayStr} 09:00 (Morning)` },
        { label: '12:00', startH: 10, endH: 13, fullDate: `${todayStr} 12:00 (Noon)` },
        { label: '15:00', startH: 13, endH: 16, fullDate: `${todayStr} 15:00 (Afternoon)` },
        { label: '18:00', startH: 16, endH: 19, fullDate: `${todayStr} 18:00 (Evening)` },
        { label: '21:00', startH: 19, endH: 24, fullDate: `${todayStr} 21:00 (Night)` }
      ];

      for (const h of hourlyConfig) {
        buckets.push({
          label: h.label,
          date: `${todayStr} ${h.label}`,
          fullDate: h.fullDate,
          revenue: 0,
          hospitalShare: 0,
          platformFee: 0,
          matcher: (d: Date) => {
            const hVal = d.getHours();
            return hVal >= h.startH && hVal < h.endH;
          }
        });
      }
    } else if (range === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const totalDays = endDate.getDate();
      const monthShort = monthNames[now.getMonth()];
      rangeLabel = `1 ${monthShort} – ${totalDays} ${monthShort} ${now.getFullYear()}`;

      for (let day = 1; day <= totalDays; day++) {
        const d = new Date(now.getFullYear(), now.getMonth(), day);
        const iso = toIsoDateString(d);
        buckets.push({
          label: `${day} ${monthShort}`,
          date: iso,
          fullDate: `${day} ${monthShort} ${now.getFullYear()}`,
          revenue: 0,
          hospitalShare: 0,
          platformFee: 0,
          matcher: (itemDate: Date) => {
            return itemDate.getFullYear() === now.getFullYear() &&
              itemDate.getMonth() === now.getMonth() &&
              itemDate.getDate() === day;
          }
        });
      }
    } else if (range === 'custom' && qStart && qEnd) {
      const parseStart = (s: string) => {
        const parts = s.split(/[-T/]/).map(Number);
        if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
          return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
        }
        const d = new Date(s);
        d.setHours(0, 0, 0, 0);
        return d;
      };

      const parseEnd = (s: string) => {
        const parts = s.split(/[-T/]/).map(Number);
        if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
          return new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);
        }
        const d = new Date(s);
        d.setHours(23, 59, 59, 999);
        return d;
      };

      startDate = parseStart(qStart);
      endDate = parseEnd(qEnd);
      rangeLabel = `${startDate.getDate()} ${monthNames[startDate.getMonth()]} – ${endDate.getDate()} ${monthNames[endDate.getMonth()]} ${endDate.getFullYear()}`;

      const diffDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

      if (diffDays <= 1) {
        const dateStr = toIsoDateString(startDate);
        const hourlyConfig = [
          { label: '09:00', startH: 0, endH: 10 },
          { label: '12:00', startH: 10, endH: 13 },
          { label: '15:00', startH: 13, endH: 16 },
          { label: '18:00', startH: 16, endH: 19 },
          { label: '21:00', startH: 19, endH: 24 }
        ];
        for (const h of hourlyConfig) {
          buckets.push({
            label: h.label,
            date: `${dateStr} ${h.label}`,
            fullDate: `${dateStr} ${h.label}`,
            revenue: 0,
            hospitalShare: 0,
            platformFee: 0,
            matcher: (d: Date) => d.getHours() >= h.startH && d.getHours() < h.endH
          });
        }
      } else {
        const cappedDays = Math.min(diffDays, 60);
        for (let i = 0; i < cappedDays; i++) {
          const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
          const iso = toIsoDateString(d);
          const dayName = dayNames[d.getDay()];
          const monthShort = monthNames[d.getMonth()];
          buckets.push({
            label: `${dayName} ${d.getDate()}`,
            date: iso,
            fullDate: `${dayName}, ${d.getDate()} ${monthShort} ${d.getFullYear()}`,
            revenue: 0,
            hospitalShare: 0,
            platformFee: 0,
            matcher: (itemDate: Date) => {
              return itemDate.getFullYear() === d.getFullYear() &&
                itemDate.getMonth() === d.getMonth() &&
                itemDate.getDate() === d.getDate();
            }
          });
        }
      }
    } else {
      // Default: 'week' (Monday to Sunday)
      range = 'week';
      const dayOfWeek = now.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday, 0, 0, 0, 0);
      endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 6, 23, 59, 59, 999);
      rangeLabel = `${startDate.getDate()} ${monthNames[startDate.getMonth()]} – ${endDate.getDate()} ${monthNames[endDate.getMonth()]} ${endDate.getFullYear()}`;

      for (let i = 0; i < 7; i++) {
        const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
        const iso = toIsoDateString(d);
        const dayName = dayNames[d.getDay()];
        const monthShort = monthNames[d.getMonth()];
        buckets.push({
          label: `${dayName} ${d.getDate()}`,
          date: iso,
          fullDate: `${dayName}, ${d.getDate()} ${monthShort} ${d.getFullYear()}`,
          revenue: 0,
          hospitalShare: 0,
          platformFee: 0,
          matcher: (itemDate: Date) => {
            return itemDate.getFullYear() === d.getFullYear() &&
              itemDate.getMonth() === d.getMonth() &&
              itemDate.getDate() === d.getDate();
          }
        });
      }
    }

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'COMPLETED':
        case 'REPORT_READY':
          return 'text-emerald-700 bg-emerald-50 border-emerald-200';
        case 'IN_CONSULTATION':
        case 'IN_LAB_PROCESSING':
        case 'CONFIRMED':
        case 'ASSIGNED':
          return 'text-blue-700 bg-blue-50 border-blue-200';
        case 'WAITING':
        case 'PENDING':
        case 'REQUESTED':
        case 'SAMPLE_COLLECTED':
          return 'text-amber-700 bg-amber-50 border-amber-200';
        default:
          return 'text-gray-700 bg-gray-50 border-gray-200';
      }
    };

    const formatTxnDate = (d: Date) => {
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) + ' ' + d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    };

    // Helper to route revenue to the matching bucket or fallback bucket within interval
    const addToBucket = (date: Date, amount: number) => {
      if (!amount) return;
      const bucket = buckets.find(b => b.matcher(date));
      if (bucket) {
        bucket.revenue += amount;
      } else if (buckets.length > 0) {
        const iso = toIsoDateString(date);
        const isoBucket = buckets.find(b => b.date.startsWith(iso));
        if (isoBucket) {
          isoBucket.revenue += amount;
        } else {
          const t = date.getTime();
          let closest = buckets[0];
          let minDiff = Infinity;
          for (const b of buckets) {
            const bTime = new Date(b.date).getTime();
            const diff = Math.abs(t - bTime);
            if (diff < minDiff) {
              minDiff = diff;
              closest = b;
            }
          }
          closest.revenue += amount;
        }
      }
    };

    // Fetch matching real-time OP, Lab, and Home Nursing Bookings strictly within scheduled date range
    const [opBookings, labBookings, nursingBookings] = await Promise.all([
      prisma.oPBooking.findMany({
        where: {
          hospitalId,
          status: { not: 'CANCELLED' },
          appointmentDate: { gte: startDate, lte: endDate },
          isWalkIn: false,
          payoutEligible: true
        },
        select: {
          id: true,
          fee: true,
          opType: true,
          appointmentDate: true,
          patientName: true,
          status: true,
          hospitalAmount: true,
          mediqueeAmount: true,
          doctor: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } }
        },
        orderBy: { appointmentDate: 'desc' }
      }),
      prisma.labBooking.findMany({
        where: {
          hospitalId,
          status: { not: 'CANCELLED' },
          OR: [
            { createdAt: { gte: startDate, lte: endDate } },
            { collectionDate: { gte: startDate, lte: endDate } }
          ]
        },
        include: {
          patient: { select: { id: true, name: true, phone: true } },
          items: {
            include: {
              labTest: {
                include: {
                  platformTest: { select: { id: true, name: true } }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }).catch(() => []),
      prisma.homeNursingBooking.findMany({
        where: {
          hospitalId,
          status: { not: 'CANCELLED' },
          serviceDate: { gte: startDate, lte: endDate }
        },
        select: {
          id: true,
          bookingNumber: true,
          totalAmount: true,
          serviceDate: true,
          patientName: true,
          status: true,
          hospitalAmount: true,
          mediqueeAmount: true,
          service: { select: { id: true, name: true } },
          nurse: { select: { id: true, name: true } }
        },
        orderBy: { serviceDate: 'desc' }
      }).catch(() => [])
    ]);

    let opGross = 0, opCount = 0, opNet = 0, opCut = 0;
    let videoGross = 0, videoCount = 0, videoNet = 0, videoCut = 0;
    let nursingGross = 0, nursingCount = 0, nursingNet = 0, nursingCut = 0;
    let labGross = 0, labCount = 0, labNet = 0, labCut = 0;
    let sampleGross = 0, sampleCount = 0, sampleNet = 0, sampleCut = 0;

    const allTransactions: Array<{
      id: string;
      service: string;
      type: string;
      rawDate: Date;
      date: string;
      amount: number;
      gross: number;
      adminCommission: number;
      adminCut: number;
      hospitalPayout: number;
      netPayout: number;
      status: string;
      statusColor: string;
      patientName: string;
      info?: string;
      doctorName?: string;
      departmentName?: string;
      nurseName?: string;
    }> = [];

    // 1. OP & Video Consultations
    for (const b of opBookings) {
      const date = new Date(b.appointmentDate);
      const amount = Number(b.fee) || 0;
      const isVideo = (b.opType || '').toLowerCase().includes('video');
      const serviceName = isVideo ? 'Video Consultation' : 'OP Consultation';
      const serviceType = isVideo ? 'VIDEO_CONSULTATION' : 'OP';
      const net = b.hospitalAmount ?? Math.round(amount * (hospitalShareRate / 100));
      const cut = b.mediqueeAmount ?? (amount - net);

      if (isVideo) {
        videoGross += amount;
        videoCount += 1;
        videoNet += net;
        videoCut += cut;
      } else {
        opGross += amount;
        opCount += 1;
        opNet += net;
        opCut += cut;
      }

      addToBucket(date, amount);

      const docName = (b as any).doctor?.name;
      const deptName = (b as any).department?.name;
      const info = docName ? `Dr. ${docName}${deptName ? ` • ${deptName}` : ''}` : deptName;

      allTransactions.push({
        id: b.id.slice(0, 8).toUpperCase(),
        service: serviceName,
        type: serviceType,
        rawDate: date,
        date: formatTxnDate(date),
        amount,
        gross: amount,
        adminCommission: cut,
        adminCut: cut,
        hospitalPayout: net,
        netPayout: net,
        status: b.status,
        statusColor: getStatusColor(b.status),
        patientName: b.patientName || 'Patient',
        info: info || undefined,
        doctorName: docName || undefined,
        departmentName: deptName || undefined
      });
    }

    // 2. Lab & Home Sample Collection
    for (const b of labBookings) {
      const date = (b.createdAt && b.createdAt >= startDate && b.createdAt <= endDate)
        ? new Date(b.createdAt)
        : (b.collectionDate ? new Date(b.collectionDate) : new Date(b.createdAt));
      if (date < startDate || date > endDate) continue;

      const amount = Number((b as any).totalAmount || (b as any).price) || 0;
      const isSample = (b as any).bookingType === 'HOME_COLLECTION';
      const serviceName = isSample ? 'Home Sample Collection' : 'Lab Tests';
      const serviceType = isSample ? 'HOME_SAMPLE_COLLECTION' : 'LAB_TEST';
      const net = (b as any).hospitalAmount ?? Math.round(amount * (hospitalShareRate / 100));
      const cut = (b as any).mediqueeAmount ?? (amount - net);

      if (isSample) {
        sampleGross += amount;
        sampleCount += 1;
        sampleNet += net;
        sampleCut += cut;
      } else {
        labGross += amount;
        labCount += 1;
        labNet += net;
        labCut += cut;
      }

      addToBucket(date, amount);

      const testNames = ((b as any).items || [])
        .map((i: any) => i.labTest?.platformTest?.name)
        .filter(Boolean)
        .join(', ');

      const patientDisplayName = (b as any).patient?.name || 'Patient';
      const infoText = isSample
        ? (testNames ? `Home Collection • ${testNames}` : 'Home Sample Collection')
        : (testNames || 'Diagnostic Lab Test');

      allTransactions.push({
        id: b.id.slice(0, 8).toUpperCase(),
        service: serviceName,
        type: serviceType,
        rawDate: date,
        date: formatTxnDate(date),
        amount,
        gross: amount,
        adminCommission: cut,
        adminCut: cut,
        hospitalPayout: net,
        netPayout: net,
        status: b.status,
        statusColor: getStatusColor(b.status),
        patientName: patientDisplayName,
        info: infoText
      });
    }

    // 3. Home Nursing Bookings
    for (const b of nursingBookings) {
      const date = new Date(b.serviceDate);
      const amount = Number(b.totalAmount) || 0;
      const net = b.hospitalAmount ?? Math.round(amount * (hospitalShareRate / 100));
      const cut = b.mediqueeAmount ?? (amount - net);

      nursingGross += amount;
      nursingCount += 1;
      nursingNet += net;
      nursingCut += cut;

      addToBucket(date, amount);

      const nurseName = (b as any).nurse?.name;
      const sName = (b as any).service?.name;
      const nursingInfo = nurseName ? `Nurse: ${nurseName}${sName ? ` • ${sName}` : ''}` : (sName || 'Home Nursing Care');

      allTransactions.push({
        id: (b as any).bookingNumber || b.id.slice(0, 8).toUpperCase(),
        service: 'Home Nursing',
        type: 'HOME_NURSING',
        rawDate: date,
        date: formatTxnDate(date),
        amount,
        gross: amount,
        adminCommission: cut,
        adminCut: cut,
        hospitalPayout: net,
        netPayout: net,
        status: b.status,
        statusColor: getStatusColor(b.status),
        patientName: b.patientName || 'Patient',
        info: nursingInfo,
        nurseName: nurseName || undefined
      });
    }

    // Compute hospital share and platform fee for each bucket
    const chartData = buckets.map(b => {
      const hospShare = Math.round(b.revenue * (hospitalShareRate / 100));
      const platFee = b.revenue - hospShare;
      return {
        label: b.label,
        date: b.date,
        fullDate: b.fullDate,
        revenue: b.revenue,
        hospitalShare: hospShare,
        platformFee: platFee
      };
    });

    const totalGross = opGross + videoGross + nursingGross + labGross + sampleGross;
    const totalHospitalPayout = opNet + videoNet + nursingNet + labNet + sampleNet;
    const totalAdminCommission = opCut + videoCut + nursingCut + labCut + sampleCut;

    // Sort transactions by date descending
    allTransactions.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());

    // Payout trend format for Payouts screen
    const payoutTrend = chartData.map(b => ({
      name: b.label,
      value: b.hospitalShare
    }));

    // Service Breakdown Array
    const serviceBreakdown = [
      {
        service: 'OP Consultation',
        name: 'OP Consultation',
        key: 'op',
        count: opCount,
        gross: opGross,
        revenue: opGross,
        net: opNet,
        netPayout: opNet,
        hospitalPayout: opNet,
        adminCut: opCut,
        platformFee: opCut,
        adminCommission: opCut
      },
      {
        service: 'Video Consultation',
        name: 'Video Consultation',
        key: 'videoConsultation',
        count: videoCount,
        gross: videoGross,
        revenue: videoGross,
        net: videoNet,
        netPayout: videoNet,
        hospitalPayout: videoNet,
        adminCut: videoCut,
        platformFee: videoCut,
        adminCommission: videoCut
      },
      {
        service: 'Home Nursing',
        name: 'Home Nursing',
        key: 'homeNursing',
        count: nursingCount,
        gross: nursingGross,
        revenue: nursingGross,
        net: nursingNet,
        netPayout: nursingNet,
        hospitalPayout: nursingNet,
        adminCut: nursingCut,
        platformFee: nursingCut,
        adminCommission: nursingCut
      },
      {
        service: 'Lab Tests',
        name: 'Lab Tests',
        key: 'labTests',
        count: labCount,
        gross: labGross,
        revenue: labGross,
        net: labNet,
        netPayout: labNet,
        hospitalPayout: labNet,
        adminCut: labCut,
        platformFee: labCut,
        adminCommission: labCut
      },
      {
        service: 'Home Sample Collection',
        name: 'Home Sample Collection',
        key: 'homeSampleCollection',
        count: sampleCount,
        gross: sampleGross,
        revenue: sampleGross,
        net: sampleNet,
        netPayout: sampleNet,
        hospitalPayout: sampleNet,
        adminCut: sampleCut,
        platformFee: sampleCut,
        adminCommission: sampleCut
      }
    ];

    const byService = {
      op: serviceBreakdown[0],
      videoConsultation: serviceBreakdown[1],
      homeNursing: serviceBreakdown[2],
      labTests: serviceBreakdown[3],
      homeSampleCollection: serviceBreakdown[4]
    };

    // Calculate thisMonth and lastMonth KPI summaries
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [thisMonthOps, lastMonthOps, thisMonthNursing, lastMonthNursing, thisMonthLabs, lastMonthLabs] = await Promise.all([
      prisma.oPBooking.aggregate({
        where: { hospitalId, status: { not: 'CANCELLED' }, appointmentDate: { gte: thisMonthStart, lte: thisMonthEnd }, isWalkIn: false, payoutEligible: true },
        _sum: { fee: true }
      }).catch(() => ({ _sum: { fee: 0 } })),
      prisma.oPBooking.aggregate({
        where: { hospitalId, status: { not: 'CANCELLED' }, appointmentDate: { gte: lastMonthStart, lte: lastMonthEnd }, isWalkIn: false, payoutEligible: true },
        _sum: { fee: true }
      }).catch(() => ({ _sum: { fee: 0 } })),
      prisma.homeNursingBooking.aggregate({
        where: { hospitalId, status: { not: 'CANCELLED' }, serviceDate: { gte: thisMonthStart, lte: thisMonthEnd } },
        _sum: { totalAmount: true }
      }).catch(() => ({ _sum: { totalAmount: 0 } })),
      prisma.homeNursingBooking.aggregate({
        where: { hospitalId, status: { not: 'CANCELLED' }, serviceDate: { gte: lastMonthStart, lte: lastMonthEnd } },
        _sum: { totalAmount: true }
      }).catch(() => ({ _sum: { totalAmount: 0 } })),
      prisma.labBooking.aggregate({
        where: { hospitalId, status: { not: 'CANCELLED' }, createdAt: { gte: thisMonthStart, lte: thisMonthEnd } },
        _sum: { totalAmount: true }
      }).catch(() => ({ _sum: { totalAmount: 0 } })),
      prisma.labBooking.aggregate({
        where: { hospitalId, status: { not: 'CANCELLED' }, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
        _sum: { totalAmount: true }
      }).catch(() => ({ _sum: { totalAmount: 0 } }))
    ]);

    const thisMonthTotal = (thisMonthOps._sum?.fee || 0) + (thisMonthNursing._sum?.totalAmount || 0) + (thisMonthLabs._sum?.totalAmount || 0);
    const thisMonthHospitalPayout = Math.round(thisMonthTotal * (hospitalShareRate / 100));

    const lastMonthTotal = (lastMonthOps._sum?.fee || 0) + (lastMonthNursing._sum?.totalAmount || 0) + (lastMonthLabs._sum?.totalAmount || 0);
    const lastMonthHospitalPayout = Math.round(lastMonthTotal * (hospitalShareRate / 100));

    const totalTransactions = allTransactions.length;
    const averagePayout = totalTransactions > 0 ? Math.round(totalGross / totalTransactions) : 0;
    const averageHospitalPayout = totalTransactions > 0 ? Math.round(totalHospitalPayout / totalTransactions) : 0;

    res.json({
      success: true,
      data: {
        businessType: hospital?.businessType || 'HOSPITAL',
        hospitalName: hospital?.name,
        totalRevenue: totalGross,
        totalGross,
        totalPayout: totalGross,
        hospitalShare: totalHospitalPayout,
        netPayout: totalHospitalPayout,
        totalHospitalPayout,
        platformFee: totalAdminCommission,
        adminCut: totalAdminCommission,
        totalAdminCommission,
        hospitalSharePercent: hospitalShareRate,
        hospitalSharePercentage: hospitalShareRate,
        platformFeePercent: platformFeeRate,
        platformFeePercentage: platformFeeRate,
        hospitalShareRate: hospitalShareRate / 100,
        adminCommissionRate: platformFeeRate / 100,
        range,
        startDate: toIsoDateString(startDate),
        endDate: toIsoDateString(endDate),
        dateRange: {
          startDate: toIsoDateString(startDate),
          endDate: toIsoDateString(endDate),
          label: rangeLabel,
          range
        },
        chartData,
        trend: chartData,
        payoutTrend,
        serviceBreakdown,
        byService,
        transactions: allTransactions,
        dailyTransactions: allTransactions,
        recentTransactions: allTransactions,
        payoutSummary: {
          totalTransactions,
          averagePayout,
          averageHospitalPayout,
          thisMonth: thisMonthTotal,
          thisMonthHospitalPayout,
          lastMonth: lastMonthTotal,
          lastMonthHospitalPayout
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

