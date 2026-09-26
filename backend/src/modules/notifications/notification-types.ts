/**
 * Canonical notification type constants used across the MediQuee platform.
 * Every sendNotification call should use one of these values as the `type` param.
 */
export const NotificationType = {
  // Account
  WELCOME: 'WELCOME',

  // Booking Confirmations
  BOOKING_CONFIRMED: 'BOOKING_CONFIRMED',
  VIDEO_BOOKING_CONFIRMED: 'VIDEO_BOOKING_CONFIRMED',
  LAB_BOOKING_CONFIRMED: 'LAB_BOOKING_CONFIRMED',
  HOME_SAMPLE_CONFIRMED: 'HOME_SAMPLE_CONFIRMED',
  HOME_NURSING_CONFIRMED: 'HOME_NURSING_CONFIRMED',

  // Appointment Lifecycle
  APPOINTMENT_REMINDER: 'APPOINTMENT_REMINDER',
  APPOINTMENT_STARTING: 'APPOINTMENT_STARTING',
  APPOINTMENT_COMPLETED: 'APPOINTMENT_COMPLETED',
  BOOKING_CANCELLED: 'BOOKING_CANCELLED',
  BOOKING_RESCHEDULED: 'BOOKING_RESCHEDULED',

  // Offers
  OFFER: 'OFFER',
  OFFER_EXPIRING: 'OFFER_EXPIRING',

  // Lab results
  LAB_REPORT_READY: 'LAB_REPORT_READY',

  // Hospital-staff facing (legacy compat)
  appointment: 'appointment',
  activity: 'activity',
  lab: 'lab',
} as const;

export type NotificationTypeValue = typeof NotificationType[keyof typeof NotificationType];
