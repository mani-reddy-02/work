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
      activeBookingsThisYear
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
      })
    ]);

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

    // 7. Real-Time Revenue Calculations (Day, Week, Month, Year)
    const activeBookingsToday = activeBookingsThisYear.filter(
      b => b.appointmentDate >= startOfDay && b.appointmentDate <= endOfDay
    );
    const activeBookingsThisWeek = activeBookingsThisYear.filter(
      b => b.appointmentDate >= startOfWeek && b.appointmentDate <= endOfWeek
    );
    const activeBookingsThisMonth = activeBookingsThisYear.filter(
      b => b.appointmentDate >= startOfMonth && b.appointmentDate <= endOfMonth
    );

    const revenueToday = activeBookingsToday.reduce((sum, b) => sum + (b.fee || 0), 0);
    const revenueThisWeek = activeBookingsThisWeek.reduce((sum, b) => sum + (b.fee || 0), 0);
    const revenueThisMonth = activeBookingsThisMonth.reduce((sum, b) => sum + (b.fee || 0), 0);
    const revenueThisYear = activeBookingsThisYear.reduce((sum, b) => sum + (b.fee || 0), 0);

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
        dept: b.department?.name || 'General',
        doctor: b.doctor?.name || 'Assigned Doctor',
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
        upcomingAppointments: formattedUpcomingAppointments
      }
    });
  } catch (error) {
    next(error);
  }
};
