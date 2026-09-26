/**
 * Appointment Reminder Scheduler
 *
 * Runs every 5 minutes and checks for upcoming appointments that need reminders.
 * Generates APPOINTMENT_REMINDER and APPOINTMENT_STARTING notifications.
 *
 * Duplicate prevention: Uses metadata.reminderKey to ensure each reminder is sent exactly once.
 */
import { prisma } from '../../config/prisma';
import { sendNotification } from './notifications.service';
import { NotificationType } from './notification-types';

// Configurable reminder intervals in minutes
const REMINDER_INTERVALS = [
  { minutes: 1440, label: 'tomorrow', prefix: 'Reminder: Your' },        // 24 hours
  { minutes: 60,   label: 'in 1 hour', prefix: 'Your' },                 // 1 hour
  { minutes: 15,   label: 'in 15 minutes', prefix: 'Your' },             // 15 minutes
];

const SCHEDULER_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function formatDateIST(date: Date): string {
  return date.toLocaleDateString('en-US', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
  });
}

function parseSlotToMinutes(slot: string): number {
  const match = slot.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return -1;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

async function hasReminderBeenSent(reminderKey: string): Promise<boolean> {
  const existing = await prisma.notification.findFirst({
    where: {
      metadata: {
        path: ['reminderKey'],
        equals: reminderKey,
      },
    },
    select: { id: true },
  });
  return !!existing;
}

async function processOpReminders() {
  // Get IST now
  const serverTimeStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const now = new Date(serverTimeStr);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // Get upcoming OP bookings for today and tomorrow
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  const bookings = await prisma.oPBooking.findMany({
    where: {
      appointmentDate: { gte: today, lt: dayAfterTomorrow },
      status: { notIn: ['CANCELLED', 'COMPLETED'] },
      patientId: { not: null },
    },
    include: {
      doctor: { select: { name: true } },
      hospital: { select: { name: true } },
    },
  });

  for (const booking of bookings) {
    if (!booking.patientId) continue;

    const slotStr = booking.timeSlot || booking.slotTime || '';
    const slotMinutes = parseSlotToMinutes(slotStr);
    if (slotMinutes < 0) continue;

    const apptDate = new Date(booking.appointmentDate);
    const apptDateStr = `${apptDate.getFullYear()}-${String(apptDate.getMonth() + 1).padStart(2, '0')}-${String(apptDate.getDate()).padStart(2, '0')}`;
    const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Compute absolute minutes until appointment from IST now
    let minutesUntilAppt: number;
    if (apptDateStr === todayDateStr) {
      minutesUntilAppt = slotMinutes - nowMinutes;
    } else {
      // Tomorrow
      minutesUntilAppt = (24 * 60 - nowMinutes) + slotMinutes;
    }

    if (minutesUntilAppt < 0) continue; // Past appointment

    const isVideo = booking.opType?.toLowerCase().includes('video');
    const typeLabel = isVideo ? 'video consultation' : 'OP consultation';
    const doctorName = booking.doctor?.name || 'your doctor';
    const displayDate = formatDateIST(apptDate);

    // Check "APPOINTMENT_STARTING" (within 2 minutes of start)
    if (minutesUntilAppt <= 2 && minutesUntilAppt >= -5) {
      const reminderKey = `STARTING:${booking.id}`;
      if (!(await hasReminderBeenSent(reminderKey))) {
        await sendNotification({
          userId: booking.patientId,
          title: 'Appointment Starting',
          message: `Your ${typeLabel} with Dr. ${doctorName} is starting now.`,
          type: NotificationType.APPOINTMENT_STARTING,
          metadata: { bookingId: booking.id, reminderKey, serviceType: isVideo ? 'VIDEO' : 'OP' },
        });
      }
    }

    // Check configured reminder intervals
    for (const interval of REMINDER_INTERVALS) {
      // Fire reminder when within 5 min after the ideal window
      if (minutesUntilAppt <= interval.minutes && minutesUntilAppt > interval.minutes - 6) {
        const reminderKey = `REMINDER:${booking.id}:${interval.minutes}`;
        if (!(await hasReminderBeenSent(reminderKey))) {
          await sendNotification({
            userId: booking.patientId,
            title: 'Appointment Reminder',
            message: `${interval.prefix} ${typeLabel} with Dr. ${doctorName} ${interval.label === 'tomorrow' ? `is tomorrow at ${slotStr}` : `starts ${interval.label}`}.`,
            type: NotificationType.APPOINTMENT_REMINDER,
            metadata: { bookingId: booking.id, reminderKey, interval: interval.minutes },
          });
        }
      }
    }
  }
}

async function processHomeNursingReminders() {
  const serverTimeStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const now = new Date(serverTimeStr);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  const bookings = await prisma.homeNursingBooking.findMany({
    where: {
      serviceDate: { gte: today, lt: dayAfterTomorrow },
      status: { notIn: ['CANCELLED', 'COMPLETED'] },
    },
    include: {
      service: { select: { name: true } },
    },
  });

  for (const booking of bookings) {
    if (!booking.userId) continue;

    const slotMinutes = parseSlotToMinutes(booking.timeSlot || '');
    if (slotMinutes < 0) continue;

    const apptDate = new Date(booking.serviceDate);
    const apptDateStr = `${apptDate.getFullYear()}-${String(apptDate.getMonth() + 1).padStart(2, '0')}-${String(apptDate.getDate()).padStart(2, '0')}`;
    const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    let minutesUntilAppt: number;
    if (apptDateStr === todayDateStr) {
      minutesUntilAppt = slotMinutes - nowMinutes;
    } else {
      minutesUntilAppt = (24 * 60 - nowMinutes) + slotMinutes;
    }

    if (minutesUntilAppt < 0) continue;

    const serviceName = booking.service?.name || 'home nursing service';

    for (const interval of REMINDER_INTERVALS) {
      if (minutesUntilAppt <= interval.minutes && minutesUntilAppt > interval.minutes - 6) {
        const reminderKey = `REMINDER:NURSING:${booking.id}:${interval.minutes}`;
        if (!(await hasReminderBeenSent(reminderKey))) {
          await sendNotification({
            userId: booking.userId,
            title: 'Service Reminder',
            message: `Your ${serviceName} ${interval.label === 'tomorrow' ? `is tomorrow at ${booking.timeSlot}` : `starts ${interval.label}`}.`,
            type: NotificationType.APPOINTMENT_REMINDER,
            metadata: { bookingId: booking.id, reminderKey, interval: interval.minutes, serviceType: 'HOME_NURSING' },
          });
        }
      }
    }
  }
}

async function runSchedulerCycle() {
  try {
    await processOpReminders();
    await processHomeNursingReminders();
  } catch (error) {
    console.error('[REMINDER_SCHEDULER] Error during cycle:', error);
  }
}

let schedulerTimer: NodeJS.Timeout | null = null;

export function startReminderScheduler() {
  if (schedulerTimer) return;
  console.log('[REMINDER_SCHEDULER] Started — running every 5 minutes');
  // Run immediately on startup
  runSchedulerCycle();
  schedulerTimer = setInterval(runSchedulerCycle, SCHEDULER_INTERVAL_MS);
}

export function stopReminderScheduler() {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
    console.log('[REMINDER_SCHEDULER] Stopped');
  }
}
