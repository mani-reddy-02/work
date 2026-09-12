import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';

export const createWalkInBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user!.hospitalId;
    if (!hospitalId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'User does not belong to a hospital' } });
    }

    const { departmentId, doctorId, patientName, patientPhone, patientAge, patientGender, opType, fee } = req.body;

    // Verify department belongs to hospital
    const department = await prisma.department.findFirst({
      where: { id: departmentId, hospitalId }
    });
    if (!department) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid department' } });
    }

    // Verify doctor belongs to hospital and is actually a doctor
    const doctor = await prisma.user.findFirst({
      where: { id: doctorId, hospitalId, role: 'DOCTOR' }
    });
    if (!doctor) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid doctor' } });
    }

    const assignedSlot = req.body.timeSlot || req.body.slotTime || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const apptDate = req.body.appointmentDate ? new Date(req.body.appointmentDate) : new Date();

    // Prevent double-booking for the specified slot if doctorId and slot are provided
    const startOfAppt = new Date(apptDate);
    startOfAppt.setHours(0, 0, 0, 0);
    const endOfAppt = new Date(apptDate);
    endOfAppt.setHours(23, 59, 59, 999);

    const existingBooking = await prisma.oPBooking.findFirst({
      where: {
        doctorId,
        appointmentDate: { gte: startOfAppt, lte: endOfAppt },
        timeSlot: assignedSlot,
        status: { notIn: ['COMPLETED', 'CANCELLED'] }
      }
    });

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'SLOT_ALREADY_BOOKED',
          message: `The selected time slot (${assignedSlot}) is already booked for this doctor.`
        }
      });
    }

    const booking = await prisma.oPBooking.create({
      data: {
        hospitalId,
        departmentId,
        doctorId,
        patientName,
        patientPhone,
        patientAge,
        patientGender,
        opType: opType || 'Normal',
        fee: fee || 0,
        timeSlot: assignedSlot,
        status: 'WAITING',
        appointmentDate: apptDate
      },
      include: {
        doctor: { select: { id: true, name: true, avatar: true } },
        department: { select: { id: true, name: true } }
      }
    });

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

export const getTodayBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user!.hospitalId;
    if (!hospitalId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'User does not belong to a hospital' } });
    }

    const { date, range, doctorId, departmentId, status } = req.query;

    const whereClause: any = {
      hospitalId
    };

    if (doctorId && typeof doctorId === 'string') {
      whereClause.doctorId = doctorId;
    }

    if (departmentId && typeof departmentId === 'string') {
      whereClause.departmentId = departmentId;
    }

    if (status && typeof status === 'string') {
      if (status.includes(',')) {
        whereClause.status = { in: status.split(',').map(s => s.trim()) };
      } else {
        whereClause.status = status;
      }
    }

    // Date filtering logic
    if (date && typeof date === 'string') {
      const targetDate = new Date(date);
      if (!isNaN(targetDate.getTime())) {
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        whereClause.appointmentDate = {
          gte: startOfDay,
          lte: endOfDay
        };
      }
    } else if (range === 'upcoming') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      whereClause.appointmentDate = {
        gte: todayStart
      };
      if (!whereClause.status) {
        whereClause.status = { not: 'CANCELLED' };
      }
    } else if (range === 'all') {
      // No date filter applied - all hospital appointments
    } else {
      // Default: today only
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      whereClause.appointmentDate = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    const bookings = await prisma.oPBooking.findMany({
      where: whereClause,
      include: {
        doctor: { select: { id: true, name: true, avatar: true, designation: true } },
        department: { select: { id: true, name: true } },
        condition: { select: { id: true, name: true } }
      },
      orderBy: [
        { appointmentDate: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

export const updateBookingStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user!.hospitalId;
    if (!hospitalId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'User does not belong to a hospital' } });
    }

    const bookingId = req.params.id as string;
    const { status } = req.body;

    const existing = await prisma.oPBooking.findFirst({
      where: { id: bookingId, hospitalId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } });
    }

    const updated = await prisma.oPBooking.update({
      where: { id: bookingId },
      data: { status },
      include: {
        doctor: { select: { id: true, name: true, avatar: true } },
        department: { select: { id: true, name: true } }
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};
