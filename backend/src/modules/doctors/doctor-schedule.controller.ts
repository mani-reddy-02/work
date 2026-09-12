import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { Role } from '@prisma/client';

const DEFAULT_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const ALL_FALLBACK_SLOTS = [
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

export function generateSlots(startTimeStr: string, endTimeStr: string, intervalMinutes: number = 15): string[] {
  if (!startTimeStr || !endTimeStr) return [];
  const slots: string[] = [];
  const [startH, startM] = (startTimeStr || '09:00').split(':').map(Number);
  const [endH, endM] = (endTimeStr || '13:00').split(':').map(Number);

  let cur = startH * 60 + (startM || 0);
  const end = endH * 60 + (endM || 0);

  if (cur >= end || intervalMinutes <= 0) return [];

  while (cur < end) {
    const h = Math.floor(cur / 60);
    const m = cur % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const pad = (n: number) => n.toString().padStart(2, '0');
    slots.push(`${pad(displayH)}:${pad(m)} ${period}`);
    cur += intervalMinutes;
  }
  return slots;
}

/**
 * GET /api/v1/doctor/schedule
 * Returns the authenticated doctor's full weekly availability schedule.
 */
export const getMyDoctorSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = req.user?.id;
    if (!doctorId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const savedSchedules = await prisma.doctorSchedule.findMany({
      where: { doctorId }
    });

    const scheduleMap = new Map(savedSchedules.map(s => [s.dayOfWeek.toLowerCase(), s]));

    const fullSchedule = DEFAULT_DAYS.map(day => {
      const match = scheduleMap.get(day.toLowerCase());
      if (match) {
        return {
          day,
          active: match.isAvailable,
          opStartTime: match.startTime,
          opEndTime: match.endTime,
          videoStartTime: match.videoStartTime || '14:00',
          videoEndTime: match.videoEndTime || '18:00',
          slotDurationMinutes: match.slotDurationMinutes
        };
      }
      return {
        day,
        active: false,
        opStartTime: '09:00',
        opEndTime: '13:00',
        videoStartTime: '14:00',
        videoEndTime: '18:00',
        slotDurationMinutes: 15
      };
    });

    res.json({ success: true, data: fullSchedule });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/doctor/schedule
 * Saves / updates the doctor's weekly availability schedule.
 */
export const updateMyDoctorSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = req.user?.id;
    const hospitalId = req.user?.hospitalId;

    if (!doctorId || !hospitalId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Doctor must be affiliated with a hospital' }
      });
    }

    const rawSchedule = req.body.schedule || req.body;
    if (!Array.isArray(rawSchedule)) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Schedule must be an array of day objects' }
      });
    }

    await prisma.$transaction(
      rawSchedule.map(item => {
        const day = item.day || item.dayOfWeek;
        const active = Boolean(item.active ?? item.isAvailable ?? false);
        const opStartTime = item.opStartTime || item.startTime || '09:00';
        const opEndTime = item.opEndTime || item.endTime || '13:00';
        const videoStartTime = item.videoStartTime || '14:00';
        const videoEndTime = item.videoEndTime || '18:00';
        const slotDuration = Number(item.slotDurationMinutes) || 15;

        return prisma.doctorSchedule.upsert({
          where: {
            doctorId_dayOfWeek: {
              doctorId,
              dayOfWeek: day
            }
          },
          update: {
            isAvailable: active,
            startTime: opStartTime,
            endTime: opEndTime,
            videoStartTime,
            videoEndTime,
            slotDurationMinutes: slotDuration
          },
          create: {
            doctorId,
            hospitalId,
            dayOfWeek: day,
            isAvailable: active,
            startTime: opStartTime,
            endTime: opEndTime,
            videoStartTime,
            videoEndTime,
            slotDurationMinutes: slotDuration
          }
        });
      })
    );

    res.json({ success: true, message: 'Doctor schedule saved successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/doctors/:id/available-slots
 * Computes open, unbooked time slots for a specific doctor on a given date.
 */
export const getDoctorAvailableSlots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = req.params.id as string;
    const dateQuery = typeof req.query.date === 'string' ? req.query.date.trim() : '';
    const typeQuery = typeof req.query.type === 'string' ? req.query.type.trim().toUpperCase() : 'OP';

    const doctor = await prisma.user.findFirst({
      where: {
        id: doctorId,
        role: Role.DOCTOR,
        active: true
      },
      select: {
        id: true,
        name: true,
        hospitalId: true
      }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Doctor not found or inactive' }
      });
    }

    // Parse requested date (defaults to today) in local timezone to avoid UTC boundary shifts
    let targetDate = new Date();
    if (dateQuery) {
      const parts = dateQuery.split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        targetDate = new Date(parts[0], parts[1] - 1, parts[2]);
      } else {
        const parsed = new Date(dateQuery);
        if (!isNaN(parsed.getTime())) {
          targetDate = parsed;
        }
      }
    }

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Identify day of the week
    const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' });

    // Look up doctor's schedule for this day
    const schedule = await prisma.doctorSchedule.findFirst({
      where: {
        doctorId,
        dayOfWeek: { equals: dayName, mode: 'insensitive' }
      }
    });

    // Check if the doctor has customized ANY schedule records
    const doctorHasAnySchedule = await prisma.doctorSchedule.count({
      where: { doctorId }
    });

    let allSlots: string[] = [];
    let isAvailable = true;

    if (schedule) {
      if (!schedule.isAvailable) {
        isAvailable = false;
        allSlots = [];
      } else {
        const isVideo = typeQuery.includes('VIDEO');
        const start = isVideo && schedule.videoStartTime ? schedule.videoStartTime : schedule.startTime;
        const end = isVideo && schedule.videoEndTime ? schedule.videoEndTime : schedule.endTime;
        allSlots = generateSlots(start, end, schedule.slotDurationMinutes || 15);
      }
    } else {
      // No schedule found and no fallback allowed for strict booking
      isAvailable = false;
      allSlots = [];
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
        timeSlot: true
      }
    });

    const bookedSlots = new Set<string>();
    for (const b of existingBookings) {
      const slot = b.timeSlot;
      if (slot) {
        bookedSlots.add(slot);
      }
    }

    const availableSlots = isAvailable ? allSlots.filter(slot => !bookedSlots.has(slot)) : [];

    res.json({
      success: true,
      data: {
        doctorId,
        doctorName: doctor.name,
        date: targetDate.toISOString().split('T')[0],
        dayOfWeek: dayName,
        isAvailable,
        allSlots,
        availableSlots,
        bookedSlots: Array.from(bookedSlots)
      }
    });
  } catch (error) {
    next(error);
  }
};
