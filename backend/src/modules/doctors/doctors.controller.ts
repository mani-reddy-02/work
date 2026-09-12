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

export const getDoctors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const departmentId = typeof req.query.departmentId === 'string' ? req.query.departmentId.trim() : '';
    const hospitalId = typeof req.query.hospitalId === 'string' ? req.query.hospitalId.trim() : '';
    const conditionId = typeof req.query.conditionId === 'string' ? req.query.conditionId.trim() : '';
    const specialtyId = typeof req.query.specialtyId === 'string' ? req.query.specialtyId.trim() : '';
    let targetSpecialtyId = specialtyId;

    if (conditionId && !targetSpecialtyId) {
      const condition = await prisma.platformCondition.findUnique({
        where: { id: conditionId },
        select: { specialtyId: true }
      });
      if (condition) {
        targetSpecialtyId = condition.specialtyId;
      }
    }

    const whereClause: any = {
      role: Role.DOCTOR,
      active: true
    };

    if (hospitalId) {
      whereClause.hospitalId = hospitalId;
    }

    if (departmentId) {
      whereClause.departmentId = departmentId;
    } else if (targetSpecialtyId) {
      whereClause.department = {
        specialtyId: targetSpecialtyId
      };
    }

    // Strict disease-driven filter: if conditionId was provided but no targetSpecialtyId was resolved, return empty array immediately or set impossible where clause
    if (conditionId && !targetSpecialtyId) {
      return res.json({ success: true, data: [] });
    }

    if (search) {
      whereClause.AND = [
        ...(whereClause.AND || []),
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { designation: { contains: search, mode: 'insensitive' } },
            { department: { name: { contains: search, mode: 'insensitive' } } },
            { hospital: { name: { contains: search, mode: 'insensitive' } } },
            { hospital: { city: { contains: search, mode: 'insensitive' } } }
          ]
        }
      ];
    }

    const doctors = await prisma.user.findMany({
      where: whereClause,
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
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: doctors.map(doc => ({
        id: doc.id,
        name: doc.name,
        specialization: doc.department?.name || doc.designation || 'Consultant Specialist',
        qualification: 'MBBS, MD',
        experience: '10+ Years',
        designation: doc.designation || 'Consultant Specialist',
        avatar: doc.avatar,
        hospitalId: doc.hospitalId,
        hospitalName: doc.hospital?.name || 'Hospital',
        hospitalAddress: doc.hospital?.addressLine1 || doc.hospital?.city || '',
        departmentId: doc.departmentId,
        department: doc.department?.name || 'General Medicine',
        consultInfo: `Specialist in ${doc.department?.name || 'General Care'} with extensive clinical experience in patient diagnostics and treatment.`,
        fees: '₹500',
        rating: 4.8
      }))
    });
  } catch (error) {
    next(error);
  }
};

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
