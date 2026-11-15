/**
 * Appointment Reminder & WhatsApp Lifecycle Scheduler
 *
 * Runs every 5 minutes and checks:
 * 1. Upcoming appointments (OP, Video, Lab, Home Nursing) that need reminders (including 1-hour prior).
 * 2. Inactive registered patients who haven't booked any service:
 *    - On registration day: 2 messages spaced by 6 hours
 *    - Weekly: 4 messages with distinct healthcare features
 *
 * Duplicate prevention: Uses metadata.reminderKey and whatsAppMessageLog to ensure each message is sent exactly once.
 */
import { prisma } from '../../config/prisma';
import { sendNotification } from './notifications.service';
import { NotificationType } from './notification-types';

// Configurable reminder intervals in minutes
const REMINDER_INTERVALS = [
  { minutes: 1440, label: 'tomorrow', prefix: 'Reminder: Your' },        // 24 hours
  { minutes: 60,   label: 'in 1 hour', prefix: 'Your' },                 // 1 hour prior
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
  const serverTimeStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const now = new Date(serverTimeStr);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // Get upcoming OP and Video bookings for today and tomorrow
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

    let minutesUntilAppt: number;
    if (apptDateStr === todayDateStr) {
      minutesUntilAppt = slotMinutes - nowMinutes;
    } else {
      minutesUntilAppt = (24 * 60 - nowMinutes) + slotMinutes;
    }

    if (minutesUntilAppt < 0) continue; // Past appointment

    const isVideo = booking.opType?.toLowerCase().includes('video');
    const typeLabel = isVideo ? 'video consultation' : 'OP consultation';
    const doctorName = booking.doctor?.name || 'your doctor';

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

        // WhatsApp starting reminder
        import('../whatsapp/whatsapp-notifications.service').then(({ WhatsAppNotificationService }) => {
          WhatsAppNotificationService.sendAppointmentReminder(booking.id, 'starting now').catch(console.error);
        }).catch(console.error);
      }
    }

    // Check reminder intervals (including 1 hour prior)
    for (const interval of REMINDER_INTERVALS) {
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

          // Meta WhatsApp appointment reminder (1-hour prior or scheduled timing)
          import('../whatsapp/whatsapp-notifications.service').then(({ WhatsAppNotificationService }) => {
            WhatsAppNotificationService.sendAppointmentReminder(booking.id, interval.label).catch(console.error);
          }).catch(console.error);
        }
      }
    }
  }
}

async function processLabReminders() {
  const serverTimeStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const now = new Date(serverTimeStr);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  const bookings = await prisma.labBooking.findMany({
    where: {
      collectionDate: { gte: today, lt: dayAfterTomorrow },
      status: { notIn: ['CANCELLED', 'COMPLETED'] },
    },
    include: {
      items: { include: { labTest: { include: { platformTest: true } } } },
      hospital: { select: { name: true } },
    },
  });

  for (const booking of bookings) {
    if (!booking.patientId || !booking.collectionDate) continue;

    const slotMinutes = parseSlotToMinutes(booking.collectionTimeSlot || '');
    if (slotMinutes < 0) continue;

    const apptDate = new Date(booking.collectionDate);
    const apptDateStr = `${apptDate.getFullYear()}-${String(apptDate.getMonth() + 1).padStart(2, '0')}-${String(apptDate.getDate()).padStart(2, '0')}`;
    const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    let minutesUntilAppt: number;
    if (apptDateStr === todayDateStr) {
      minutesUntilAppt = slotMinutes - nowMinutes;
    } else {
      minutesUntilAppt = (24 * 60 - nowMinutes) + slotMinutes;
    }

    if (minutesUntilAppt < 0) continue;

    for (const interval of REMINDER_INTERVALS) {
      if (minutesUntilAppt <= interval.minutes && minutesUntilAppt > interval.minutes - 6) {
        const reminderKey = `REMINDER:LAB:${booking.id}:${interval.minutes}`;
        if (!(await hasReminderBeenSent(reminderKey))) {
          await sendNotification({
            userId: booking.patientId,
            title: 'Lab Service Reminder',
            message: `Your lab test service is scheduled ${interval.label === 'tomorrow' ? `tomorrow at ${booking.collectionTimeSlot}` : interval.label}.`,
            type: NotificationType.APPOINTMENT_REMINDER,
            metadata: { bookingId: booking.id, reminderKey, interval: interval.minutes, serviceType: 'LAB' },
          });

          // Meta WhatsApp lab reminder (1-hour prior)
          import('../whatsapp/whatsapp-notifications.service').then(({ WhatsAppNotificationService }) => {
            WhatsAppNotificationService.sendLabBookingReminder(booking.id, interval.label).catch(console.error);
          }).catch(console.error);
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

          // Meta WhatsApp home nursing reminder (1-hour prior)
          import('../whatsapp/whatsapp-notifications.service').then(({ WhatsAppNotificationService }) => {
            WhatsAppNotificationService.sendHomeNursingReminder(booking.id, interval.label).catch(console.error);
          }).catch(console.error);
        }
      }
    }
  }
}

async function runSchedulerCycle() {
  try {
    // 1. Process 1-hour prior & scheduled reminders for all booked services
    await processOpReminders();
    await processLabReminders();
    await processHomeNursingReminders();

    // 2. Process Inactive Patient Drip notifications
    // (Registration day: 2 msgs separated by 6 hours; Weekly: 4 msgs)
    const { WhatsAppDripService } = await import('../whatsapp/whatsapp-drip.service');
    await WhatsAppDripService.processInactivePatientDrips();
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
