import { prisma } from '../../config/prisma';
import { Role } from '@prisma/client';

/**
 * Automatically clears inactiveUntil & inactiveReason for any doctor whose
 * temporary override duration has expired (now >= inactiveUntil).
 */
export async function checkAndExpireDoctorOverrides(doctorId?: string): Promise<number> {
  try {
    const now = new Date();
    const whereClause: any = {
      role: Role.DOCTOR,
      inactiveUntil: {
        not: null,
        lte: now
      }
    };

    if (doctorId) {
      whereClause.id = doctorId;
    }

    const result = await prisma.user.updateMany({
      where: whereClause,
      data: {
        inactiveUntil: null,
        inactiveReason: null,
        overrideUpdatedBy: null
      }
    });

    return result.count;
  } catch (error) {
    console.error('Error auto-expiring doctor overrides:', error);
    return 0;
  }
}

/**
 * Background interval job to check and auto-expire temporary doctor overrides every 30 seconds.
 */
let autoExpireInterval: NodeJS.Timeout | null = null;
export function startDoctorOverrideAutoReactivationJob() {
  if (autoExpireInterval) return;
  autoExpireInterval = setInterval(async () => {
    await checkAndExpireDoctorOverrides();
  }, 30000);
  // Run once immediately on start
  checkAndExpireDoctorOverrides();
}

export interface DoctorStatusSummary {
  doctorId: string;
  doctorName: string;
  specialization: string;
  departmentId?: string | null;
  departmentName?: string | null;
  avatar?: string | null;
  baseActive: boolean;
  effectiveStatus: 'ACTIVE' | 'TEMPORARILY_INACTIVE' | 'OFF_DUTY';
  isTemporarilyInactive: boolean;
  inactiveUntil: string | null;
  inactiveReason: string | null;
  overrideUpdatedBy: string | null;
  remainingMinutes: number;
  reactivateAtTime: string | null;
  isScheduledToday: boolean;
  todayShift: string;
  todaySchedule: {
    day: string;
    isAvailable: boolean;
    startTime: string;
    endTime: string;
    videoStartTime?: string | null;
    videoEndTime?: string | null;
  } | null;
}

/**
 * Helper to compute a doctor's real-time effective status combining
 * primary schedule + receptionist temporary override.
 */
export function computeDoctorLiveStatus(doctor: any, now = new Date()): DoctorStatusSummary {
  // Use Asia/Kolkata timezone to get today's day of week
  const kolkataDay = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long'
  }).format(now);

  const schedules: any[] = doctor.doctorSchedules || [];
  const todaySched = schedules.find(
    (s: any) => s.dayOfWeek && s.dayOfWeek.toLowerCase() === kolkataDay.toLowerCase()
  );

  const isScheduledToday = Boolean(todaySched && todaySched.isAvailable);
  let todayShift = 'Not Scheduled';
  if (todaySched && todaySched.isAvailable) {
    todayShift = `${todaySched.startTime} - ${todaySched.endTime}`;
  }

  // Check temporary override
  const inactiveUntilDate = doctor.inactiveUntil ? new Date(doctor.inactiveUntil) : null;
  const isTemporarilyInactive = Boolean(
    inactiveUntilDate && inactiveUntilDate.getTime() > now.getTime()
  );

  let remainingMinutes = 0;
  let reactivateAtTime: string | null = null;

  if (isTemporarilyInactive && inactiveUntilDate) {
    remainingMinutes = Math.max(0, Math.ceil((inactiveUntilDate.getTime() - now.getTime()) / 60000));
    reactivateAtTime = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(inactiveUntilDate);
  }

  let effectiveStatus: 'ACTIVE' | 'TEMPORARILY_INACTIVE' | 'OFF_DUTY' = 'ACTIVE';
  if (!doctor.active) {
    effectiveStatus = 'OFF_DUTY';
  } else if (isTemporarilyInactive) {
    effectiveStatus = 'TEMPORARILY_INACTIVE';
  } else if (!isScheduledToday) {
    effectiveStatus = 'OFF_DUTY';
  }

  return {
    doctorId: doctor.id,
    doctorName: doctor.name,
    specialization: doctor.department?.name || doctor.specialization || doctor.designation || 'General',
    departmentId: doctor.departmentId || null,
    departmentName: doctor.department?.name || null,
    avatar: doctor.avatar || null,
    baseActive: Boolean(doctor.active),
    effectiveStatus,
    isTemporarilyInactive,
    inactiveUntil: isTemporarilyInactive && inactiveUntilDate ? inactiveUntilDate.toISOString() : null,
    inactiveReason: isTemporarilyInactive ? doctor.inactiveReason || null : null,
    overrideUpdatedBy: isTemporarilyInactive ? doctor.overrideUpdatedBy || null : null,
    remainingMinutes,
    reactivateAtTime,
    isScheduledToday,
    todayShift,
    todaySchedule: todaySched ? {
      day: todaySched.dayOfWeek,
      isAvailable: todaySched.isAvailable,
      startTime: todaySched.startTime,
      endTime: todaySched.endTime,
      videoStartTime: todaySched.videoStartTime,
      videoEndTime: todaySched.videoEndTime
    } : null
  };
}
