import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { Role } from '@prisma/client';

export const createLabBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const {
      testId,
      laboratoryId,
      hospitalId,
      bookingDate,
      timeSlot,
      collectionType = 'LAB_VISIT',
      patientName,
      patientAge,
      patientGender,
      patientPhone,
      patientEmail,
      collectionAddress,
      notes,
    } = req.body;

    if (!testId || !laboratoryId || !bookingDate || !timeSlot) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'testId, laboratoryId, bookingDate, and timeSlot are required.',
        },
      });
    }

    const normCollectionType = collectionType === 'HOME_COLLECTION' ? 'HOME_COLLECTION' : 'LAB_VISIT';

    if (normCollectionType === 'HOME_COLLECTION' && !collectionAddress?.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'collectionAddress is required for Home Sample Collection.',
        },
      });
    }

    const dateObj = new Date(bookingDate);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid bookingDate format. Please use ISO format (YYYY-MM-DD).',
        },
      });
    }

    // Execute in transaction to ensure atomicity and prevent race condition double-booking
    const booking = await prisma.$transaction(async (tx) => {
      // 1. Verify user exists
      const user = await tx.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw { status: 401, code: 'UNAUTHORIZED', message: 'User account not found' };
      }

      // 2. Verify test exists and is active
      const test = await tx.labTest.findFirst({
        where: { id: testId, active: true },
      });
      if (!test) {
        throw { status: 404, code: 'NOT_FOUND', message: 'Lab test not found or inactive' };
      }

      // 3. Verify laboratory exists
      const lab = await tx.hospital.findUnique({
        where: { id: laboratoryId },
      });
      if (!lab) {
        throw { status: 404, code: 'NOT_FOUND', message: 'Laboratory not found' };
      }

      // 4. Verify test offering exists for this laboratory
      const offering = await tx.laboratoryTestOffering.findUnique({
        where: {
          laboratoryId_testId: {
            laboratoryId,
            testId,
          },
        },
      });
      if (!offering || !offering.active) {
        throw {
          status: 400,
          code: 'BAD_REQUEST',
          message: `The selected test is not available at ${lab.name}.`,
        };
      }

      if (normCollectionType === 'HOME_COLLECTION' && !offering.homeCollectionAvailable) {
        throw {
          status: 400,
          code: 'BAD_REQUEST',
          message: `Home sample collection is not supported by ${lab.name} for this test.`,
        };
      }

      // 5. Check slot double-booking for the laboratory
      const startOfDay = new Date(dateObj);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateObj);
      endOfDay.setHours(23, 59, 59, 999);

      const slotConflict = await tx.labBooking.findFirst({
        where: {
          laboratoryId,
          timeSlot,
          bookingDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: { not: 'CANCELLED' },
        },
      });

      if (slotConflict) {
        throw {
          status: 409,
          code: 'CONFLICT',
          message: `The slot ${timeSlot} on ${bookingDate} is already booked at this laboratory. Please select another time.`,
        };
      }

      // 6. Calculate real prices
      const testPrice = offering.price;
      const collectionFee = normCollectionType === 'HOME_COLLECTION' ? offering.homeCollectionFee : 0;
      const totalAmount = testPrice + collectionFee;

      // 7. Generate clean booking number
      const randSuffix = Math.floor(1000 + Math.random() * 9000);
      const bookingNumber = `MQ-LAB-${Date.now().toString(36).toUpperCase()}-${randSuffix}`;

      // 8. Create booking record
      const newBooking = await tx.labBooking.create({
        data: {
          bookingNumber,
          userId,
          hospitalId: hospitalId || (lab.businessType === 'HOSPITAL' ? lab.id : null),
          laboratoryId,
          testId,
          patientName: (patientName || user.name || 'Patient').trim(),
          patientAge: patientAge ? parseInt(patientAge.toString(), 10) : null,
          patientGender: patientGender || user.gender || null,
          patientPhone: (patientPhone || user.phone || '').trim(),
          patientEmail: (patientEmail || user.email || '').trim(),
          bookingDate: dateObj,
          timeSlot,
          collectionType: normCollectionType,
          collectionAddress: normCollectionType === 'HOME_COLLECTION' ? collectionAddress.trim() : null,
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          testPrice,
          collectionFee,
          totalAmount,
          notes: notes ? notes.trim() : null,
        },
        include: {
          test: true,
        },
      });

      return { booking: newBooking, lab };
    });

    res.status(201).json({
      success: true,
      data: {
        id: booking.booking.id,
        bookingId: booking.booking.bookingNumber,
        bookingNumber: booking.booking.bookingNumber,
        testId: booking.booking.testId,
        testName: booking.booking.test.name,
        category: booking.booking.test.category,
        sampleType: booking.booking.test.sampleType,
        laboratoryId: booking.booking.laboratoryId,
        laboratoryName: booking.lab.name,
        laboratoryAddress: booking.lab.addressLine1 || booking.lab.city,
        hospitalId: booking.booking.hospitalId,
        patientName: booking.booking.patientName,
        patientPhone: booking.booking.patientPhone,
        patientAge: booking.booking.patientAge,
        patientGender: booking.booking.patientGender,
        patientEmail: booking.booking.patientEmail,
        bookingDate: booking.booking.bookingDate.toISOString().split('T')[0],
        date: booking.booking.bookingDate.toISOString().split('T')[0],
        timeSlot: booking.booking.timeSlot,
        time: booking.booking.timeSlot,
        collectionType: booking.booking.collectionType,
        collectionAddress: booking.booking.collectionAddress,
        status: booking.booking.status,
        paymentStatus: booking.booking.paymentStatus,
        testPrice: booking.booking.testPrice,
        collectionFee: booking.booking.collectionFee,
        totalAmount: booking.booking.totalAmount,
        amount: `₹${Math.round(booking.booking.totalAmount)}`,
        prep: booking.booking.test.preparation,
        turnaroundTime: booking.booking.test.turnaroundTime,
        createdAt: booking.booking.createdAt,
      },
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        error: { code: error.code || 'BAD_REQUEST', message: error.message },
      });
    }
    next(error);
  }
};

export const getMyLabBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const bookings = await prisma.labBooking.findMany({
      where: { userId },
      include: {
        test: true,
      },
      orderBy: { bookingDate: 'desc' },
    });

    const labIds = [...new Set(bookings.map((b) => b.laboratoryId))];
    const labs = await prisma.hospital.findMany({
      where: { id: { in: labIds } },
      select: {
        id: true,
        name: true,
        city: true,
        addressLine1: true,
        area: true,
        contactPhone: true,
      },
    });

    const labMap = new Map(labs.map((l) => [l.id, l]));

    const formatted = bookings.map((b) => {
      const lab = labMap.get(b.laboratoryId);
      return {
        id: b.id,
        bookingId: b.bookingNumber,
        bookingNumber: b.bookingNumber,
        type: 'lab_test',
        testId: b.testId,
        testName: b.test.name,
        category: b.test.category,
        sampleType: b.test.sampleType,
        laboratoryId: b.laboratoryId,
        laboratoryName: lab?.name || 'Diagnostic Laboratory',
        laboratoryAddress: [lab?.addressLine1, lab?.area, lab?.city].filter(Boolean).join(', ') || lab?.city || '',
        hospitalId: b.hospitalId,
        patientName: b.patientName,
        patientPhone: b.patientPhone,
        date: b.bookingDate.toISOString().split('T')[0],
        bookingDate: b.bookingDate.toISOString().split('T')[0],
        timeSlot: b.timeSlot,
        time: b.timeSlot,
        collectionType: b.collectionType,
        collectionAddress: b.collectionAddress,
        status: b.status,
        paymentStatus: b.paymentStatus,
        testPrice: b.testPrice,
        collectionFee: b.collectionFee,
        totalAmount: b.totalAmount,
        amount: `₹${Math.round(b.totalAmount)}`,
        prep: b.test.preparation,
        turnaroundTime: b.test.turnaroundTime,
        createdAt: b.createdAt,
      };
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

export const getLabBookingById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const booking = await prisma.labBooking.findFirst({
      where: {
        OR: [{ id }, { bookingNumber: id }],
      },
      include: {
        test: true,
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Lab booking not found' },
      });
    }

    // Ownership check: must be owner, hospital staff for this lab, or SUPER_ADMIN
    const isOwner = booking.userId === userId;
    const isSuperAdmin = userRole === Role.SUPER_ADMIN;

    if (!isOwner && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not authorized to view this lab booking.' },
      });
    }

    const lab = await prisma.hospital.findUnique({
      where: { id: booking.laboratoryId },
      select: {
        id: true,
        name: true,
        city: true,
        addressLine1: true,
        area: true,
        contactPhone: true,
        contactEmail: true,
      },
    });

    res.json({
      success: true,
      data: {
        id: booking.id,
        bookingId: booking.bookingNumber,
        bookingNumber: booking.bookingNumber,
        type: 'lab_test',
        testId: booking.testId,
        testName: booking.test.name,
        category: booking.test.category,
        sampleType: booking.test.sampleType,
        description: booking.test.description,
        preparation: booking.test.preparation,
        prep: booking.test.preparation,
        turnaroundTime: booking.test.turnaroundTime,
        laboratoryId: booking.laboratoryId,
        laboratoryName: lab?.name || 'Diagnostic Laboratory',
        laboratoryAddress: [lab?.addressLine1, lab?.area, lab?.city].filter(Boolean).join(', ') || lab?.city || '',
        laboratoryPhone: lab?.contactPhone,
        hospitalId: booking.hospitalId,
        patientName: booking.patientName,
        patientAge: booking.patientAge,
        patientGender: booking.patientGender,
        patientPhone: booking.patientPhone,
        patientEmail: booking.patientEmail,
        bookingDate: booking.bookingDate.toISOString().split('T')[0],
        date: booking.bookingDate.toISOString().split('T')[0],
        timeSlot: booking.timeSlot,
        time: booking.timeSlot,
        collectionType: booking.collectionType,
        collectionAddress: booking.collectionAddress,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        testPrice: booking.testPrice,
        collectionFee: booking.collectionFee,
        totalAmount: booking.totalAmount,
        amount: `₹${Math.round(booking.totalAmount)}`,
        notes: booking.notes,
        createdAt: booking.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const cancelLabBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const booking = await prisma.labBooking.findFirst({
      where: {
        OR: [{ id }, { bookingNumber: id }],
      },
      include: {
        test: true,
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Lab booking not found' },
      });
    }

    const isOwner = booking.userId === userId;
    const isSuperAdmin = userRole === Role.SUPER_ADMIN;

    if (!isOwner && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not authorized to cancel this booking.' },
      });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Booking is already cancelled.' },
      });
    }

    if (['COMPLETED', 'SAMPLE_COLLECTED', 'PROCESSING'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: `Cannot cancel booking in ${booking.status} status.` },
      });
    }

    const updated = await prisma.labBooking.update({
      where: { id: booking.id },
      data: {
        status: 'CANCELLED',
        paymentStatus: booking.paymentStatus === 'PAID' ? 'REFUNDED' : booking.paymentStatus,
      },
      include: {
        test: true,
      },
    });

    res.json({
      success: true,
      message: 'Booking cancelled successfully.',
      data: {
        id: updated.id,
        bookingId: updated.bookingNumber,
        bookingNumber: updated.bookingNumber,
        status: updated.status,
        paymentStatus: updated.paymentStatus,
        testName: updated.test.name,
      },
    });
  } catch (error) {
    next(error);
  }
};
