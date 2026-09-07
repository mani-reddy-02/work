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
        fee,
        status: 'WAITING',
        appointmentDate: new Date()
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

    // Get today's start and end dates
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await prisma.oPBooking.findMany({
      where: {
        hospitalId,
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        doctor: { select: { id: true, name: true, avatar: true } },
        department: { select: { id: true, name: true } }
      },
      orderBy: {
        createdAt: 'asc'
      }
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
