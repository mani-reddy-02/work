import { prisma } from '../../config/prisma';
import { WhatsAppClient } from './whatsapp.client';

export class WhatsAppNotificationService {
  /**
   * Helper to format date in Indian Standard Time (IST)
   */
  private static formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  /**
   * Helper to format friendly appointment reference
   */
  private static formatRef(id: string): string {
    return `OP-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
  }

  /**
   * 1. Send OP Appointment Confirmation to Patient & Hospital Staff
   */
  static async sendAppointmentConfirmation(bookingId: string) {
    try {
      const booking = await prisma.oPBooking.findUnique({
        where: { id: bookingId },
        include: {
          hospital: { select: { id: true, name: true, contactPhone: true } },
          doctor: { select: { id: true, name: true, phone: true, whatsappConsent: true } },
          department: { select: { id: true, name: true } },
          patient: { select: { id: true, name: true, phone: true, whatsappConsent: true } },
        },
      });

      if (!booking) return;

      const recipientPhone = booking.patientPhone || booking.patient?.phone;
      const patientConsent = booking.patient?.whatsappConsent !== false; // default true if not opted-out

      const patientName = booking.patientName || booking.patient?.name || 'Valued Patient';
      const appointmentRef = this.formatRef(booking.id);
      const hospitalName = booking.hospital?.name || 'MediQuee Hospital';
      const isVideo = (booking.opType || '').toLowerCase().includes('video');
      const doctorOrDept = booking.doctor?.name 
        ? `Dr. ${booking.doctor.name}${isVideo ? ' (Video Consultation)' : ''}` 
        : (booking.department?.name || (isVideo ? 'Video Consultation' : 'OP Consultation'));
      const dateStr = this.formatDate(booking.appointmentDate);
      const timeStr = booking.timeSlot || booking.slotTime || 'Scheduled Time';
      const statusStr = booking.status === 'WAITING' 
        ? (isVideo ? 'Confirmed (Video Consultation Ready)' : 'Confirmed (Token Waiting)') 
        : booking.status;

      // 1a. Send to Patient if consent given and phone present
      if (recipientPhone && patientConsent) {
        await WhatsAppClient.sendTemplateMessage({
          recipientPhone,
          templateName: 'op_appointment_confirmed',
          messageType: 'APPOINTMENT_CONFIRMATION',
          appointmentId: booking.id,
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: patientName },
                { type: 'text', text: appointmentRef },
                { type: 'text', text: hospitalName },
                { type: 'text', text: doctorOrDept },
                { type: 'text', text: dateStr },
                { type: 'text', text: timeStr },
                { type: 'text', text: statusStr },
              ],
            },
          ],
        });
      }

      // 1b. Send to Doctor / Hospital Staff if phone present & enabled
      if (booking.doctor?.phone && booking.doctor?.whatsappConsent !== false) {
        await WhatsAppClient.sendTemplateMessage({
          recipientPhone: booking.doctor.phone,
          templateName: 'staff_new_booking_alert',
          messageType: 'STAFF_ALERT',
          appointmentId: booking.id,
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: `Dr. ${booking.doctor.name}` },
                { type: 'text', text: patientName },
                { type: 'text', text: appointmentRef },
                { type: 'text', text: doctorOrDept },
                { type: 'text', text: dateStr },
                { type: 'text', text: timeStr },
              ],
            },
          ],
        });
      }
    } catch (err: any) {
      console.error('[WhatsAppNotificationService] Error in sendAppointmentConfirmation:', err.message);
    }
  }

  /**
   * 2. Send OP Appointment Cancellation to Patient
   */
  static async sendAppointmentCancellation(bookingId: string, reason?: string) {
    try {
      const booking = await prisma.oPBooking.findUnique({
        where: { id: bookingId },
        include: {
          hospital: { select: { name: true } },
          doctor: { select: { name: true } },
          department: { select: { name: true } },
          patient: { select: { whatsappConsent: true } },
        },
      });

      if (!booking) return;

      const recipientPhone = booking.patientPhone;
      if (!recipientPhone || booking.patient?.whatsappConsent === false) return;

      const patientName = booking.patientName || 'Valued Patient';
      const appointmentRef = this.formatRef(booking.id);
      const hospitalName = booking.hospital?.name || 'MediQuee Hospital';
      const doctorOrDept = booking.doctor?.name ? `Dr. ${booking.doctor.name}` : (booking.department?.name || 'OP Consultation');
      const dateStr = this.formatDate(booking.appointmentDate);
      const timeStr = booking.timeSlot || booking.slotTime || 'Scheduled Time';
      const safeReason = reason ? reason.trim().slice(0, 100) : 'Schedule updated or cancelled';

      await WhatsAppClient.sendTemplateMessage({
        recipientPhone,
        templateName: 'op_appointment_cancelled',
        messageType: 'APPOINTMENT_CANCELLED',
        appointmentId: booking.id,
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: patientName },
              { type: 'text', text: appointmentRef },
              { type: 'text', text: hospitalName },
              { type: 'text', text: doctorOrDept },
              { type: 'text', text: dateStr },
              { type: 'text', text: timeStr },
              { type: 'text', text: safeReason },
            ],
          },
        ],
      });
    } catch (err: any) {
      console.error('[WhatsAppNotificationService] Error in sendAppointmentCancellation:', err.message);
    }
  }

  /**
   * 3. Send OP Appointment Rescheduled to Patient
   */
  static async sendAppointmentRescheduled(bookingId: string, oldDate?: string, oldTime?: string) {
    try {
      const booking = await prisma.oPBooking.findUnique({
        where: { id: bookingId },
        include: {
          hospital: { select: { name: true } },
          doctor: { select: { name: true } },
          department: { select: { name: true } },
          patient: { select: { whatsappConsent: true } },
        },
      });

      if (!booking) return;

      const recipientPhone = booking.patientPhone;
      if (!recipientPhone || booking.patient?.whatsappConsent === false) return;

      const patientName = booking.patientName || 'Valued Patient';
      const appointmentRef = this.formatRef(booking.id);
      const hospitalName = booking.hospital?.name || 'MediQuee Hospital';
      const doctorOrDept = booking.doctor?.name ? `Dr. ${booking.doctor.name}` : (booking.department?.name || 'OP Consultation');
      const newDateStr = this.formatDate(booking.appointmentDate);
      const newTimeStr = booking.timeSlot || booking.slotTime || 'Scheduled Time';

      await WhatsAppClient.sendTemplateMessage({
        recipientPhone,
        templateName: 'op_appointment_rescheduled',
        messageType: 'APPOINTMENT_RESCHEDULED',
        appointmentId: booking.id,
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: patientName },
              { type: 'text', text: appointmentRef },
              { type: 'text', text: hospitalName },
              { type: 'text', text: doctorOrDept },
              { type: 'text', text: newDateStr },
              { type: 'text', text: newTimeStr },
            ],
          },
        ],
      });
    } catch (err: any) {
      console.error('[WhatsAppNotificationService] Error in sendAppointmentRescheduled:', err.message);
    }
  }

  /**
   * 4. Send OP Appointment Reminder to Patient
   */
  static async sendAppointmentReminder(bookingId: string, timingLabel: string) {
    try {
      const booking = await prisma.oPBooking.findUnique({
        where: { id: bookingId },
        include: {
          hospital: { select: { name: true } },
          doctor: { select: { name: true } },
          department: { select: { name: true } },
          patient: { select: { whatsappConsent: true } },
        },
      });

      if (!booking) return;

      const recipientPhone = booking.patientPhone;
      if (!recipientPhone || booking.patient?.whatsappConsent === false) return;

      const patientName = booking.patientName || 'Valued Patient';
      const appointmentRef = this.formatRef(booking.id);
      const hospitalName = booking.hospital?.name || 'MediQuee Hospital';
      const doctorOrDept = booking.doctor?.name ? `Dr. ${booking.doctor.name}` : (booking.department?.name || 'OP Consultation');
      const dateStr = this.formatDate(booking.appointmentDate);
      const timeStr = booking.timeSlot || booking.slotTime || 'Scheduled Time';

      await WhatsAppClient.sendTemplateMessage({
        recipientPhone,
        templateName: 'op_appointment_reminder',
        messageType: 'APPOINTMENT_REMINDER',
        appointmentId: booking.id,
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: patientName },
              { type: 'text', text: appointmentRef },
              { type: 'text', text: hospitalName },
              { type: 'text', text: doctorOrDept },
              { type: 'text', text: dateStr },
              { type: 'text', text: timeStr },
              { type: 'text', text: timingLabel },
            ],
          },
        ],
      });
    } catch (err: any) {
      console.error('[WhatsAppNotificationService] Error in sendAppointmentReminder:', err.message);
    }
  }

  /**
   * 5. Send Video Consultation Ready Notification
   * Reuses appointment workflow. Never sends credentials, API keys, or raw tokens.
   */
  static async sendVideoConsultationReadyNotification(bookingId: string) {
    try {
      const booking = await prisma.oPBooking.findUnique({
        where: { id: bookingId },
        include: {
          hospital: { select: { name: true } },
          doctor: { select: { name: true } },
          patient: { select: { whatsappConsent: true } },
        },
      });

      if (!booking) return;

      const recipientPhone = booking.patientPhone;
      if (!recipientPhone || booking.patient?.whatsappConsent === false) return;

      const patientName = booking.patientName || 'Valued Patient';
      const doctorName = booking.doctor?.name ? `Dr. ${booking.doctor.name}` : 'Your Doctor';
      const appointmentRef = this.formatRef(booking.id);

      await WhatsAppClient.sendTemplateMessage({
        recipientPhone,
        templateName: 'video_consultation_ready',
        messageType: 'APPOINTMENT_REMINDER',
        appointmentId: booking.id,
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: patientName },
              { type: 'text', text: doctorName },
              { type: 'text', text: appointmentRef },
              { type: 'text', text: 'Please open MediQuee and select Join Video Consultation' },
            ],
          },
        ],
      });
    } catch (err: any) {
      console.error('[WhatsAppNotificationService] Error in sendVideoConsultationReadyNotification:', err.message);
    }
  }
}

