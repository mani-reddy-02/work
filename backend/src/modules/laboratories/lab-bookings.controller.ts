import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { Prisma } from '@prisma/client';
import { sendNotification } from '../notifications/notifications.service';
import { LabBookingType, LabBookingStatus } from '@prisma/client';

export const createLabBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      hospitalId, 
      patientId, 
      bookingType, 
      items, // array of testId
      collectionAddress, 
      collectionDate, 
      collectionTimeSlot 
    } = req.body;

    if (!hospitalId || !patientId || !bookingType || !items || !items.length) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'Missing required fields' } });
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

export const getHospitalLabBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = (req as any).user.hospitalId;
    if (!hospitalId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'User is not associated with a hospital' } });
    }

    const { status, bookingType } = req.query;
    const where: any = { hospitalId };

    if (status && status !== 'All') where.status = status as string;
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
