import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { sendNotification } from '../notifications/notifications.service';
import { LabBookingType, LabBookingStatus } from '@prisma/client';

export const createLabBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.body.hospitalId || (req as any).user?.hospitalId;
    let patientId = req.body.patientId;

    if (!patientId && (req.body.mobile || req.body.phone)) {
      const rawPhone = String(req.body.mobile || req.body.phone).trim();
      let patient = await prisma.user.findFirst({ where: { phone: rawPhone } });
      if (!patient) {
        const defaultPasswordHash = await bcrypt.hash('123456', 10);
        patient = await prisma.user.create({
          data: {
            phone: rawPhone,
            name: req.body.patientName || 'Walk-in Patient',
            email: req.body.email || null,
            passwordHash: defaultPasswordHash,
            role: 'PATIENT',
            active: true
          }
        });
      }
      patientId = patient.id;
    } else if (!patientId && (req as any).user?.role === 'PATIENT') {
      patientId = (req as any).user.id;
    }

    const bookingType = req.body.bookingType || 'WALK_IN';
    const items = req.body.items || req.body.tests;
    const { 
      collectionAddress, 
      collectionDate, 
      collectionTimeSlot 
    } = req.body;

    if (!hospitalId || !patientId || !items || !items.length) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'Missing required fields: hospital, patient, or tests' } });
    }

    if (bookingType === 'HOME_COLLECTION' && (!collectionAddress || !collectionDate || !collectionTimeSlot)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'Home collection requires address, date, and slot' } });
    }

    const booking = await prisma.$transaction(async (tx) => {
      // 1. Validate tests and calculate totals
      let totalAmount = 0;
      let totalHomeCollectionFee = 0;
      const validItems = [];

      for (const testId of items) {
        const labTest = await tx.labTest.findUnique({
          where: { id: testId },
          include: { platformTest: true }
        });

        if (!labTest || labTest.hospitalId !== hospitalId || !labTest.isActive) {
          throw new Error(`Test ${testId} is not available at this hospital`);
        }

        if (bookingType === 'HOME_COLLECTION') {
          if (!labTest.isHomeCollectionAvailable || !labTest.platformTest.canBeCollectedAtHome) {
            throw new Error(`Test ${labTest.platformTest.name} cannot be collected at home`);
          }
          totalHomeCollectionFee += labTest.homeCollectionFee;
        }

        totalAmount += labTest.price;
        validItems.push({
          labTestId: labTest.id,
          price: labTest.price
        });
      }

      // Add home collection fee to total amount
      if (bookingType === 'HOME_COLLECTION') {
        totalAmount += totalHomeCollectionFee;
        
        // Validate IST Time to prevent booking past slots today
        const serverTimeStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
        const serverNow = new Date(serverTimeStr);
        const pad = (n: number) => n.toString().padStart(2, '0');
        const serverTodayStr = `${serverNow.getFullYear()}-${pad(serverNow.getMonth() + 1)}-${pad(serverNow.getDate())}`;

        const collectionDateStr = typeof collectionDate === 'string' ? collectionDate.split('T')[0] : '';

        if (collectionDateStr === serverTodayStr && collectionTimeSlot) {
           const match = collectionTimeSlot.match(/(\d+):(\d+)\s+(AM|PM)/i);
           if (match) {
             let h = parseInt(match[1], 10);
             const m = parseInt(match[2], 10);
             const ampm = match[3].toUpperCase();
             if (ampm === 'PM' && h !== 12) h += 12;
             if (ampm === 'AM' && h === 12) h = 0;
             const slotMinutes = h * 60 + m;
             const currentMinutes = serverNow.getHours() * 60 + serverNow.getMinutes();
             if (slotMinutes <= currentMinutes) {
               throw new Error('INVALID_TIME_SLOT: This time slot has already passed in IST time. Please select an upcoming slot.');
             }
           }
        }

        // Check for double booking conflict
        const dateObj = new Date(collectionDate);
        const nextDay = new Date(dateObj);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const conflict = await tx.labBooking.findFirst({
          where: {
            hospitalId,
            bookingType: 'HOME_COLLECTION',
            collectionDate: {
              gte: dateObj,
              lt: nextDay,
            },
            collectionTimeSlot,
            status: { notIn: ['CANCELLED'] }
          }
        });
        
        if (conflict) {
          throw new Error('SLOT_CONFLICT: The selected time slot is already booked.');
        }
      }

      const hospitalConfig = await tx.hospital.findUnique({ where: { id: hospitalId }, select: { hospitalShare: true } });
      const hospitalSharePct = hospitalConfig?.hospitalShare ?? 80.0;
      const mediqueeCommissionPct = 100.0 - hospitalSharePct;
      const hospitalAmt = totalAmount * (hospitalSharePct / 100);
      const mediqueeAmt = totalAmount * (mediqueeCommissionPct / 100);

      // 2. Create the booking
      const newBooking = await tx.labBooking.create({
        data: {
          hospitalId,
          patientId,
          bookingType: bookingType as LabBookingType,
          status: 'REQUESTED' as LabBookingStatus,
          totalAmount,
          homeCollectionFee: bookingType === 'HOME_COLLECTION' ? totalHomeCollectionFee : 0,
          collectionAddress: bookingType === 'HOME_COLLECTION' ? collectionAddress : null,
          collectionDate: bookingType === 'HOME_COLLECTION' ? new Date(collectionDate) : null,
          collectionTimeSlot: bookingType === 'HOME_COLLECTION' ? collectionTimeSlot : null,
          hospitalSharePercentage: hospitalSharePct,
          mediqueeCommissionPercentage: mediqueeCommissionPct,
          hospitalAmount: hospitalAmt,
          mediqueeAmount: mediqueeAmt,
          items: {
            create: validItems
          }
        },
        include: {
          items: { include: { labTest: { include: { platformTest: true } } } },
          patient: true
        }
      });

      return newBooking;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    });

    // Fire notification to hospital
    await sendNotification({
      hospitalId,
      title: `New Lab Test Order`,
      message: `New ${bookingType === 'HOME_COLLECTION' ? 'Home Collection' : 'Walk-in'} order placed by ${booking.patient?.name || 'Patient'}`,
      type: 'lab',
      metadata: { bookingId: booking.id }
    });

    // Fire notification to patient
    const displayDate = booking.collectionDate 
      ? new Date(booking.collectionDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
      : 'shortly';
    const timeText = booking.collectionTimeSlot ? ` at ${booking.collectionTimeSlot}` : '';
    const isHome = booking.bookingType === 'HOME_COLLECTION';

    await sendNotification({
      hospitalId: null, // Patient notification
      userId: booking.patientId,
      title: 'Booking Confirmed',
      message: `Your ${isHome ? 'Home Sample Collection' : 'Lab Test'} booking is confirmed for ${displayDate}${timeText}.`,
      type: 'BOOKING_CONFIRMED',
      metadata: { bookingId: booking.id, type: isHome ? 'HOME_SAMPLE' : 'LAB' }
    });

    res.status(201).json({ success: true, data: booking });
  } catch (error: any) {
    if (error.message && error.message.includes('not available') || error.message && error.message.includes('cannot be collected')) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: error.message } });
    }
    if (error.message?.startsWith('SLOT_CONFLICT')) {
      return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: error.message.replace('SLOT_CONFLICT: ', '') } });
    }
    if (error.message?.startsWith('INVALID_TIME_SLOT')) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_TIME_SLOT', message: error.message.replace('INVALID_TIME_SLOT: ', '') } });
    }
    next(error);
  }
};

export const getHospitalLabDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = (req as any).user.hospitalId;
    if (!hospitalId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'User is not associated with a hospital' } });
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - 6);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now);
    startOfMonth.setDate(startOfMonth.getDate() - 29);
    startOfMonth.setHours(0, 0, 0, 0);

    const allBookings = await prisma.labBooking.findMany({
      where: { hospitalId },
      include: {
        items: {
          include: {
            labTest: {
              include: {
                platformTest: {
                  include: { department: true }
                }
              }
            }
          }
        },
        patient: { select: { id: true, name: true, phone: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalOrders = allBookings.length;
    let pendingTests = 0;
    let collectedCount = 0;
    let processingCount = 0;
    let reportsReady = 0;
    let cancelledCount = 0;

    let todayRevenue = 0;
    let weekRevenue = 0;
    let monthRevenue = 0;

    const todayBuckets: Record<string, number> = {
      '08:00': 0,
      '10:00': 0,
      '12:00': 0,
      '14:00': 0,
      '16:00': 0,
      '18:00': 0,
      '20:00': 0
    };

    const weekDaysMap: Record<string, number> = {};
    const weekDaysList: { key: string; label: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayKey = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      weekDaysMap[dayKey] = 0;
      weekDaysList.push({ key: dayKey, label: dayLabel });
    }

    const monthBuckets = [
      { label: 'Week 1', start: 29, end: 22, v: 0 },
      { label: 'Week 2', start: 21, end: 15, v: 0 },
      { label: 'Week 3', start: 14, end: 8, v: 0 },
      { label: 'Week 4', start: 7, end: 0, v: 0 },
    ];

    for (const b of allBookings) {
      const bTime = new Date(b.createdAt);
      const isNotCancelled = b.status !== 'CANCELLED';

      if (b.status === 'REQUESTED' || b.status === 'ASSIGNED') {
        pendingTests++;
      } else if (b.status === 'SAMPLE_COLLECTED') {
        collectedCount++;
      } else if (b.status === 'IN_LAB_PROCESSING') {
        processingCount++;
      } else if (b.status === 'REPORT_READY') {
        reportsReady++;
      } else if (b.status === 'CANCELLED') {
        cancelledCount++;
      }

      if (isNotCancelled) {
        if (bTime >= startOfToday) {
          todayRevenue += b.totalAmount;
          const hour = bTime.getHours();
          if (hour <= 8) todayBuckets['08:00'] += b.totalAmount;
          else if (hour <= 10) todayBuckets['10:00'] += b.totalAmount;
          else if (hour <= 12) todayBuckets['12:00'] += b.totalAmount;
          else if (hour <= 14) todayBuckets['14:00'] += b.totalAmount;
          else if (hour <= 16) todayBuckets['16:00'] += b.totalAmount;
          else if (hour <= 18) todayBuckets['18:00'] += b.totalAmount;
          else todayBuckets['20:00'] += b.totalAmount;
        }

        if (bTime >= startOfWeek) {
          weekRevenue += b.totalAmount;
          const dayKey = bTime.toISOString().split('T')[0];
          if (weekDaysMap[dayKey] !== undefined) {
            weekDaysMap[dayKey] += b.totalAmount;
          }
        }

        if (bTime >= startOfMonth) {
          monthRevenue += b.totalAmount;
          const diffDays = Math.floor((now.getTime() - bTime.getTime()) / (1000 * 60 * 60 * 24));
          for (const mb of monthBuckets) {
            if (diffDays <= mb.start && diffDays >= mb.end) {
              mb.v += b.totalAmount;
              break;
            }
          }
        }
      }
    }

    const todaySeries = Object.entries(todayBuckets).map(([t, v]) => ({ t, v }));
    const weekSeries = weekDaysList.map(item => ({ t: item.label, v: weekDaysMap[item.key] || 0 }));
    const monthSeries = monthBuckets.map(item => ({ t: item.label, v: item.v }));

    const formatBookingItem = (b: any) => {
      const tests = b.items.map((it: any) => it.labTest.platformTest.name).join(', ') || 'Diagnostic Test';
      const sample = b.items[0]?.labTest.platformTest.specimenType || 'SAMPLE';
      const timeStr = new Date(b.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      
      let statusNorm = 'pending';
      if (b.status === 'SAMPLE_COLLECTED') statusNorm = 'collected';
      else if (b.status === 'IN_LAB_PROCESSING') statusNorm = 'processing';
      else if (b.status === 'REPORT_READY') statusNorm = 'ready';
      else if (b.status === 'CANCELLED') statusNorm = 'cancelled';

      return {
        id: b.id,
        patient: b.patient?.name || 'Walk-in Patient',
        phone: b.patient?.phone || '',
        test: tests,
        sample: sample,
        time: timeStr,
        rawStatus: b.status,
        status: statusNorm,
        totalAmount: b.totalAmount,
        bookingType: b.bookingType,
        collectionAddress: b.collectionAddress,
        collectionDate: b.collectionDate,
        collectionTimeSlot: b.collectionTimeSlot,
        phlebotomistName: b.phlebotomistName,
        phlebotomistPhone: b.phlebotomistPhone
      };
    };

    const todayFiltered = allBookings.filter(b => new Date(b.createdAt) >= startOfToday);
    const todayOrders = (todayFiltered.length > 0 ? todayFiltered : allBookings.slice(0, 10)).map(formatBookingItem);

    res.json({
      success: true,
      data: {
        kpis: {
          totalOrders,
          pendingTests,
          reportsReady,
          todayRevenue,
          weekRevenue,
          monthRevenue
        },
        testStatus: {
          pending: pendingTests,
          collected: collectedCount,
          processing: processingCount,
          ready: reportsReady,
          cancelled: cancelledCount
        },
        revenueSeries: {
          today: todaySeries,
          week: weekSeries,
          month: monthSeries
        },
        todayOrders
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getHospitalLabBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = (req as any).user.hospitalId;
    if (!hospitalId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'User is not associated with a hospital' } });
    }

    const { status, bookingType } = req.query;
    const where: any = { hospitalId };

    if (status && status !== 'All') {
      const s = (status as string).toUpperCase();
      if (s === 'PENDING') {
        where.status = { in: ['REQUESTED', 'ASSIGNED'] };
      } else if (s === 'COLLECTED') {
        where.status = 'SAMPLE_COLLECTED';
      } else if (s === 'PROCESSING') {
        where.status = 'IN_LAB_PROCESSING';
      } else if (s === 'READY') {
        where.status = 'REPORT_READY';
      } else {
        where.status = status as string;
      }
    }

    if (bookingType && bookingType !== 'All') where.bookingType = bookingType as string;

    const bookings = await prisma.labBooking.findMany({
      where,
      include: {
        items: { include: { labTest: { include: { platformTest: { include: { department: true } } } } } },
        patient: { select: { id: true, name: true, phone: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

export const updateLabBookingStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = (req as any).user.hospitalId;
    const { id } = req.params;
    const { status, phlebotomistName, phlebotomistPhone, sampleCollectedAt } = req.body;

    const booking = await prisma.labBooking.findFirst({ where: { id: id as string, hospitalId: hospitalId as string } });
    if (!booking) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } });
    }

    const data: any = { status };

    if (status === 'ASSIGNED') {
      if (phlebotomistName) data.phlebotomistName = phlebotomistName;
      if (phlebotomistPhone) data.phlebotomistPhone = phlebotomistPhone;
    } else if (status === 'SAMPLE_COLLECTED') {
      if (sampleCollectedAt) data.sampleCollectedAt = new Date(sampleCollectedAt);
      else data.sampleCollectedAt = new Date();
    }

    const updated = await prisma.labBooking.update({
      where: { id: id as string },
      data,
      include: { patient: true }
    });

    if (status === 'REPORT_READY') {
      await sendNotification({
        userId: updated.patientId,
        title: 'Lab Report Ready',
        message: 'Your lab test report is ready for download',
        type: 'lab',
        metadata: { bookingId: updated.id }
      });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const getMyLabBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const bookings = await prisma.labBooking.findMany({
      where: { patientId: userId },
      include: {
        items: { include: { labTest: { include: { platformTest: true } } } },
        hospital: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

export const getLabBookingById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const hospitalId = (req as any).user?.hospitalId;

    const where: any = { id: id as string };
    if (hospitalId) where.hospitalId = hospitalId;
    else if (userId) where.patientId = userId;

    const booking = await prisma.labBooking.findFirst({
      where,
      include: {
        items: { include: { labTest: { include: { platformTest: true } } } },
        patient: { select: { id: true, name: true, phone: true } },
        hospital: { select: { id: true, name: true } }
      }
    });

    if (!booking) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

export const cancelLabBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const hospitalId = (req as any).user?.hospitalId;

    const where: any = { id: id as string };
    if (hospitalId) where.hospitalId = hospitalId;
    else if (userId) where.patientId = userId;

    const booking = await prisma.labBooking.findFirst({ where });
    if (!booking) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } });
    }

    const updated = await prisma.labBooking.update({
      where: { id: id as string },
      data: { status: 'CANCELLED' }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};
