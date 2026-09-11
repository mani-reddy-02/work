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

    // 3. Concurrent metrics queries strictly filtered by hospitalId
    const [
      totalOPs,
      pendingOPs,
      revenueTodayAgg,
      revenueThisWeekAgg,
      completedThisWeek,
      todayBookings,
      upcomingOPs,
      upcomingBookings
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

      // Sum of fees for COMPLETED OPBookings today
      prisma.oPBooking.aggregate({
        where: {
          hospitalId,
          appointmentDate: { gte: startOfDay, lte: endOfDay },
          status: 'COMPLETED'
        },
        _sum: {
          fee: true
        }
      }),

      // Sum of fees for COMPLETED OPBookings this week
      prisma.oPBooking.aggregate({
        where: {
          hospitalId,
          appointmentDate: { gte: startOfWeek, lte: endOfWeek },
          status: 'COMPLETED'
        },
        _sum: {
          fee: true
        }
      }),

      // Completed bookings this week for revenue trend calculation
      prisma.oPBooking.findMany({
        where: {
          hospitalId,
          appointmentDate: { gte: startOfWeek, lte: endOfWeek },
          status: 'COMPLETED'
        },
        select: {
          fee: true,
          appointmentDate: true
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

      // Count of upcoming OP bookings beyond today
      prisma.oPBooking.count({
        where: {
          hospitalId,
          appointmentDate: { gt: endOfDay },
          status: { not: 'CANCELLED' }
        }
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
      })
    ]);

    // 4. Lab Tests count (scoped to hospital, returns 0 safely if none)
    let labTests = 0;
    try {
      labTests = await prisma.labBooking.count({
        where: {
          hospitalId,
          bookingDate: { gte: startOfDay, lte: endOfDay },
          status: { not: 'CANCELLED' }
        }
      });
    } catch {
      labTests = 0;
    }

    const revenueToday = revenueTodayAgg._sum.fee ?? 0;
    const revenueThisWeek = revenueThisWeekAgg._sum.fee ?? 0;

    // 5. Build weekly trend array [Mon..Sun]
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dailyTotals: Record<string, number> = {
      Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0
    };

    for (const item of completedThisWeek) {
      const itemDate = new Date(item.appointmentDate);
      const dayIdx = itemDate.getDay(); // 0 is Sun
      const key = dayIdx === 0 ? 'Sun' : dayNames[dayIdx - 1];
      dailyTotals[key] = (dailyTotals[key] || 0) + (item.fee || 0);
    }

    const revenueTrend = dayNames.map(name => ({
      name,
      revenue: dailyTotals[name] || 0
    }));

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

    // 6. Format today's and upcoming appointments for preview
    const formattedTodayAppointments = todayBookings.map(mapAppointmentToPreview);
    const formattedUpcomingAppointments = upcomingBookings.map(mapAppointmentToPreview);

    res.json({
      success: true,
      data: {
        totalOPs,
        pendingOPs,
        upcomingOPs,
        labTests,
        revenueToday,
        revenueThisWeek,
        revenueTrend,
        todayAppointments: formattedTodayAppointments,
        upcomingAppointments: formattedUpcomingAppointments
      }
    });
  } catch (error) {
    next(error);
  }
};
