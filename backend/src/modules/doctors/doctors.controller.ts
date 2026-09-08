import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { Role } from '@prisma/client';

const ALL_TIME_SLOTS = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM'
];

export const getDoctorById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const doctor = await prisma.user.findFirst({
      where: {
        id,
        role: Role.DOCTOR,
        active: true
      },
      select: {
        id: true,
        name: true,
        designation: true,
        avatar: true,
        dob: true,
        gender: true,
        hospitalId: true,
        departmentId: true,
        hospital: {
          select: {
            id: true,
            name: true,
            city: true,
            addressLine1: true,
            contactPhone: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            specialtyId: true,
            specialty: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Doctor not found or inactive' }
      });
    }

    res.json({
      success: true,
      data: {
        id: doctor.id,
        name: doctor.name,
        specialization: doctor.department?.name || doctor.designation || 'Consultant Specialist',
        qualification: 'MBBS, MD',
        experience: '10+ Years',
        designation: doctor.designation || 'Consultant Specialist',
        avatar: doctor.avatar,
        hospitalId: doctor.hospitalId,
        hospitalName: doctor.hospital?.name || 'Hospital',
        hospitalAddress: doctor.hospital?.addressLine1 || doctor.hospital?.city || '',
        departmentId: doctor.departmentId,
        department: doctor.department?.name || 'General Medicine',
        consultInfo: `Specialist in ${doctor.department?.name || 'General Care'} with extensive clinical experience in patient diagnostics and treatment.`,
        fees: '₹500',
        rating: 4.8
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getDoctorAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = req.params.id as string;
    const dateQuery = typeof req.query.date === 'string' ? req.query.date.trim() : '';

    const doctor = await prisma.user.findFirst({
      where: {
        id: doctorId,
        role: Role.DOCTOR,
        active: true
      },
      select: { id: true, name: true }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Doctor not found or inactive' }
      });
    }

    // Parse requested date or default to today
    let targetDate = new Date();
    if (dateQuery) {
      const parsed = new Date(dateQuery);
      if (!isNaN(parsed.getTime())) {
        targetDate = parsed;
      }
    }

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch existing active bookings for this doctor on this day
    const existingBookings = await prisma.oPBooking.findMany({
      where: {
        doctorId,
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          not: 'CANCELLED'
        }
      },
      select: {
        timeSlot: true,
        appointmentDate: true
      }
    });

    const bookedSlots = new Set<string>();
    for (const b of existingBookings) {
      if (b.timeSlot) {
        bookedSlots.add(b.timeSlot);
      }
    }

    const availableSlots = ALL_TIME_SLOTS.filter(slot => !bookedSlots.has(slot));

    res.json({
      success: true,
      data: {
        doctorId,
        doctorName: doctor.name,
        date: targetDate.toISOString().split('T')[0],
        allSlots: ALL_TIME_SLOTS,
        availableSlots,
        bookedSlots: Array.from(bookedSlots)
      }
    });
  } catch (error) {
    next(error);
  }
};
