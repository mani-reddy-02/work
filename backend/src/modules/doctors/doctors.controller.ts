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
        specialization: true,
        qualification: true,
        experienceYears: true,
        consultationFee: true,
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
        specialization: doc.department?.name || doc.specialization || doc.designation || 'Not specified',
        qualification: doc.qualification || 'Not specified',
        experience: doc.experienceYears ? `${doc.experienceYears}+ Years` : 'Not specified',
        designation: doc.designation || 'Not specified',
        avatar: doc.avatar,
        hospitalId: doc.hospitalId,
        hospitalName: doc.hospital?.name || 'Not assigned',
        hospitalAddress: doc.hospital?.addressLine1 || doc.hospital?.city || 'Not specified',
        departmentId: doc.departmentId,
        department: doc.department?.name || 'Not assigned',
        consultInfo: `Specialist in ${doc.department?.name || 'their field'} with extensive clinical experience in patient diagnostics and treatment.`,
        fees: doc.consultationFee ? `₹${doc.consultationFee}` : 'Not specified',
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
        specialization: true,
        qualification: true,
        experienceYears: true,
        consultationFee: true,
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
        specialization: doctor.department?.name || doctor.specialization || doctor.designation || 'Not specified',
        qualification: doctor.qualification || 'Not specified',
        experience: doctor.experienceYears ? `${doctor.experienceYears}+ Years` : 'Not specified',
        designation: doctor.designation || 'Not specified',
        avatar: doctor.avatar,
        hospitalId: doctor.hospitalId,
        hospitalName: doctor.hospital?.name || 'Not assigned',
        hospitalAddress: doctor.hospital?.addressLine1 || doctor.hospital?.city || 'Not specified',
        departmentId: doctor.departmentId,
        department: doctor.department?.name || 'Not assigned',
        consultInfo: `Specialist in ${doctor.department?.name || 'their field'} with extensive clinical experience in patient diagnostics and treatment.`,
        fees: doctor.consultationFee ? `₹${doctor.consultationFee}` : 'Not specified',
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
    const opType = typeof req.query.opType === 'string' ? req.query.opType.trim().toUpperCase() : 'OP';

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
    
    const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Fetch Doctor Schedule
    const schedule = await prisma.doctorSchedule.findFirst({
      where: {
        doctorId,
        dayOfWeek: { equals: dayName, mode: 'insensitive' }
      }
    });
    
    if (!schedule || !schedule.isAvailable) {
      return res.json({
        success: true,
        data: {
          doctorId,
          doctorName: doctor.name,
          date: targetDate.toISOString().split('T')[0],
          allSlots: [],
          availableSlots: [],
          bookedSlots: [],
          isAvailable: false
        }
      });
    }
    
    const isVideoReq = opType === 'VIDEO' || opType === 'VIDEO CONSULTATION' || opType === 'VIDEO_CONSULTATION';
    const startBound = isVideoReq && schedule.videoStartTime ? schedule.videoStartTime : schedule.startTime;
    const endBound = isVideoReq && schedule.videoEndTime ? schedule.videoEndTime : schedule.endTime;
    
    // Generate slots
    const allSlots: string[] = [];
    const slotDuration = schedule.slotDurationMinutes || 30; // fallback to 30 min if not set
    
    const [startH, startM] = startBound.split(':').map(Number);
    const [endH, endM] = endBound.split(':').map(Number);
    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    while (currentMinutes + slotDuration <= endMinutes) {
      const h = Math.floor(currentMinutes / 60);
      const m = currentMinutes % 60;
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 === 0 ? 12 : h % 12;
      const displayM = m.toString().padStart(2, '0');
      const displayHStr = displayH.toString().padStart(2, '0');
      
      allSlots.push(`${displayHStr}:${displayM} ${period}`);
      currentMinutes += slotDuration;
    }

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

    const now = new Date();
    const isToday = targetDate.toDateString() === now.toDateString();
    let currentKolkataTimeInMinutes = 0;
    
    if (isToday) {
      const kolkataTime = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
      }).format(now);
      const [h, m] = kolkataTime.split(':').map(Number);
      currentKolkataTimeInMinutes = h * 60 + m;
    }

    const availableSlots = allSlots.filter(slot => {
      if (bookedSlots.has(slot)) return false;
      if (isToday) {
        const match = slot.match(/(\d+):(\d+)\s+(AM|PM)/i);
        if (match) {
          let h = parseInt(match[1]);
          const m = parseInt(match[2]);
          const period = match[3].toUpperCase();
          if (period === 'PM' && h !== 12) h += 12;
          if (period === 'AM' && h === 12) h = 0;
          const slotMinutes = h * 60 + m;
          // Hide slot if its start time has already passed
          if (slotMinutes <= currentKolkataTimeInMinutes) return false;
        }
      }
      return true;
    });

    res.json({
      success: true,
      data: {
        doctorId,
        doctorName: doctor.name,
        date: targetDate.toISOString().split('T')[0],
        allSlots,
        availableSlots,
        bookedSlots: Array.from(bookedSlots),
        isAvailable: availableSlots.length > 0
      }
    });
  } catch (error) {
    next(error);
  }
};
