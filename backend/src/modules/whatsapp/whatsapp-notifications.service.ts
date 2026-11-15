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
  private static formatRef(id: string, prefix = 'OP'): string {
    return `${prefix}-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
  }

  /**
   * 1. Send OP / Video Consultation Confirmation to Patient & Doctor
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
      const patientConsent = booking.patient?.whatsappConsent !== false;

      const patientName = booking.patientName || booking.patient?.name || 'Valued Patient';
      const isVideo = (booking.opType || '').toLowerCase().includes('video');
      const appointmentRef = this.formatRef(booking.id, isVideo ? 'VID' : 'OP');
      const hospitalName = booking.hospital?.name || (isVideo ? 'MediQuee Telehealth' : 'MediQuee Care');
      const doctorOrDept = booking.doctor?.name 
        ? `Dr. ${booking.doctor.name}${isVideo ? ' (Online Video Consultation)' : ''}` 
        : (booking.department?.name || (isVideo ? 'Video Consultation' : 'OP Consultation'));
      const dateStr = this.formatDate(booking.appointmentDate);
      const timeStr = booking.timeSlot || booking.slotTime || 'Scheduled Time';
      const statusStr = isVideo ? 'Confirmed (Video Ready)' : 'Confirmed';

      // 1a. Send to Patient if phone present and consent given
      if (recipientPhone && patientConsent) {
        await WhatsAppClient.sendTemplateMessage({
          recipientPhone,
          templateName: 'op_appointment_confirmed',
          languageCode: 'en',
          messageType: isVideo ? 'VIDEO_BOOKING_CONFIRMATION' : 'APPOINTMENT_CONFIRMATION',
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

      // 1b. Send alert to Doctor / Staff
      if (booking.doctor?.phone && booking.doctor?.whatsappConsent !== false) {
        await WhatsAppClient.sendTemplateMessage({
          recipientPhone: booking.doctor.phone,
          templateName: 'staff_new_booking_alert',
          languageCode: 'en',
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
   * 2. Send Lab Test / Package Booking Confirmation to Patient
   */
  static async sendLabBookingConfirmation(labBookingId: string) {
    try {
      const booking = await prisma.labBooking.findUnique({
        where: { id: labBookingId },
        include: {
          hospital: { select: { id: true, name: true, contactPhone: true } },
          patient: { select: { id: true, name: true, phone: true, whatsappConsent: true } },
          items: {
            include: {
              labTest: {
                include: { platformTest: true }
              }
            }
          }
        }
      });

      if (!booking) return;

      const recipientPhone = booking.patient?.phone;
      if (!recipientPhone || booking.patient?.whatsappConsent === false) return;

      const patientName = booking.patient?.name || 'Valued Patient';
      const refCode = this.formatRef(booking.id, 'LAB');
      const providerName = booking.hospital?.name || 'MediQuee Diagnostics';
      
      const testNames = (booking.items || [])
        .map(i => i.labTest?.platformTest?.name || (i.labTest as any)?.customName || 'Diagnostic Test')
        .slice(0, 2)
        .join(', ');
      const isHome = booking.bookingType === 'HOME_COLLECTION';
      const serviceDesc = `${testNames || 'Lab Tests'} (${isHome ? 'Home Sample Collection' : 'Lab Visit'})`;
      
      const dateStr = booking.collectionDate ? this.formatDate(booking.collectionDate) : 'As Scheduled';
      const timeStr = booking.collectionTimeSlot || 'Scheduled Slot';
      const statusStr = 'Confirmed (Lab Order)';

      await WhatsAppClient.sendTemplateMessage({
        recipientPhone,
        templateName: 'op_appointment_confirmed',
        languageCode: 'en',
        messageType: 'LAB_BOOKING_CONFIRMATION',
        appointmentId: booking.id,
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: patientName },
              { type: 'text', text: refCode },
              { type: 'text', text: providerName },
              { type: 'text', text: serviceDesc },
              { type: 'text', text: dateStr },
              { type: 'text', text: timeStr },
              { type: 'text', text: statusStr },
            ],
          },
        ],
      });
    } catch (err: any) {
      console.error('[WhatsAppNotificationService] Error in sendLabBookingConfirmation:', err.message);
    }
  }

  /**
   * 3. Send Home Nursing Booking Confirmation to Patient
   */
  static async sendHomeNursingConfirmation(nursingBookingId: string) {
    try {
      const booking = await prisma.homeNursingBooking.findUnique({
        where: { id: nursingBookingId },
        include: {
          hospital: { select: { id: true, name: true, contactPhone: true } },
          service: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, phone: true, whatsappConsent: true } }
        }
      });

      if (!booking) return;

      const recipientPhone = booking.patientPhone || booking.user?.phone;
      if (!recipientPhone || booking.user?.whatsappConsent === false) return;

      const patientName = booking.patientName || booking.user?.name || 'Valued Patient';
      const refCode = this.formatRef(booking.bookingNumber || booking.id, 'HN');
      const providerName = booking.hospital?.name || 'MediQuee Home Care';
      const serviceDesc = `${booking.service?.name || 'Home Nursing'} (Home Visit)`;
      const dateStr = this.formatDate(booking.serviceDate);
      const timeStr = booking.timeSlot || 'Scheduled Slot';
      const statusStr = 'Confirmed (Home Visit)';

      await WhatsAppClient.sendTemplateMessage({
        recipientPhone,
        templateName: 'op_appointment_confirmed',
        languageCode: 'en',
        messageType: 'NURSING_BOOKING_CONFIRMATION',
        appointmentId: booking.id,
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: patientName },
              { type: 'text', text: refCode },
              { type: 'text', text: providerName },
              { type: 'text', text: serviceDesc },
              { type: 'text', text: dateStr },
              { type: 'text', text: timeStr },
              { type: 'text', text: statusStr },
            ],
          },
        ],
      });
    } catch (err: any) {
      console.error('[WhatsAppNotificationService] Error in sendHomeNursingConfirmation:', err.message);
    }
  }

  /**
   * 4. Send OP / Video Appointment 1-Hour Prior Reminder
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
      const isVideo = (booking.opType || '').toLowerCase().includes('video');
      const appointmentRef = this.formatRef(booking.id, isVideo ? 'VID' : 'OP');
      const hospitalName = booking.hospital?.name || (isVideo ? 'MediQuee Telehealth' : 'MediQuee Care');
      const doctorOrDept = booking.doctor?.name 
        ? `Dr. ${booking.doctor.name}${isVideo ? ' (Online Video Consultation)' : ''}` 
        : (booking.department?.name || (isVideo ? 'Video Consultation' : 'OP Consultation'));
      const dateStr = this.formatDate(booking.appointmentDate);
      const timeStr = booking.timeSlot || booking.slotTime || 'Scheduled Time';
      const statusLabel = timingLabel.toLowerCase().includes('hour') ? 'REMINDER: 1 Hour Left' : `REMINDER: ${timingLabel}`;

      await WhatsAppClient.sendTemplateMessage({
        recipientPhone,
        templateName: 'op_appointment_confirmed',
        languageCode: 'en',
        messageType: 'APPOINTMENT_REMINDER_1HOUR',
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
              { type: 'text', text: statusLabel },
            ],
          },
        ],
      });
    } catch (err: any) {
      console.error('[WhatsAppNotificationService] Error in sendAppointmentReminder:', err.message);
    }
  }

  /**
   * 5. Send Lab Booking 1-Hour Prior Reminder
   */
  static async sendLabBookingReminder(labBookingId: string, timingLabel: string) {
    try {
      const booking = await prisma.labBooking.findUnique({
        where: { id: labBookingId },
        include: {
          hospital: { select: { name: true } },
          patient: { select: { name: true, phone: true, whatsappConsent: true } },
          items: {
            include: { labTest: { include: { platformTest: true } } }
          }
        }
      });

      if (!booking || !booking.patient?.phone || booking.patient?.whatsappConsent === false) return;

      const patientName = booking.patient?.name || 'Valued Patient';
      const refCode = this.formatRef(booking.id, 'LAB');
      const providerName = booking.hospital?.name || 'MediQuee Diagnostics';
      const isHome = booking.bookingType === 'HOME_COLLECTION';
      const testNames = (booking.items || [])
        .map(i => i.labTest?.platformTest?.name || (i.labTest as any)?.customName || 'Diagnostic Test')
        .slice(0, 2)
        .join(', ');
      const serviceDesc = `${testNames || 'Lab Tests'} (${isHome ? 'Home Sample Collection' : 'Lab Visit'})`;
      const dateStr = booking.collectionDate ? this.formatDate(booking.collectionDate) : 'Today';
      const timeStr = booking.collectionTimeSlot || 'Scheduled Slot';
      const statusLabel = timingLabel.toLowerCase().includes('hour') ? 'REMINDER: 1 Hour Left' : `REMINDER: ${timingLabel}`;

      await WhatsAppClient.sendTemplateMessage({
        recipientPhone: booking.patient.phone,
        templateName: 'op_appointment_confirmed',
        languageCode: 'en',
        messageType: 'LAB_REMINDER_1HOUR',
        appointmentId: booking.id,
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: patientName },
              { type: 'text', text: refCode },
              { type: 'text', text: providerName },
              { type: 'text', text: serviceDesc },
              { type: 'text', text: dateStr },
              { type: 'text', text: timeStr },
              { type: 'text', text: statusLabel },
            ],
          },
        ],
      });
    } catch (err: any) {
      console.error('[WhatsAppNotificationService] Error in sendLabBookingReminder:', err.message);
    }
  }

  /**
   * 6. Send Home Nursing 1-Hour Prior Reminder
   */
  static async sendHomeNursingReminder(nursingBookingId: string, timingLabel: string) {
    try {
      const booking = await prisma.homeNursingBooking.findUnique({
        where: { id: nursingBookingId },
        include: {
          hospital: { select: { name: true } },
          service: { select: { name: true } },
          user: { select: { name: true, phone: true, whatsappConsent: true } }
        }
      });

      if (!booking) return;
      const recipientPhone = booking.patientPhone || booking.user?.phone;
      if (!recipientPhone || booking.user?.whatsappConsent === false) return;

      const patientName = booking.patientName || booking.user?.name || 'Valued Patient';
      const refCode = this.formatRef(booking.bookingNumber || booking.id, 'HN');
      const providerName = booking.hospital?.name || 'MediQuee Home Care';
      const serviceDesc = `${booking.service?.name || 'Home Nursing'} (Home Visit)`;
      const dateStr = this.formatDate(booking.serviceDate);
      const timeStr = booking.timeSlot || 'Scheduled Slot';
      const statusLabel = timingLabel.toLowerCase().includes('hour') ? 'REMINDER: 1 Hour Left' : `REMINDER: ${timingLabel}`;

      await WhatsAppClient.sendTemplateMessage({
        recipientPhone,
        templateName: 'op_appointment_confirmed',
        languageCode: 'en',
        messageType: 'NURSING_REMINDER_1HOUR',
        appointmentId: booking.id,
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: patientName },
              { type: 'text', text: refCode },
              { type: 'text', text: providerName },
              { type: 'text', text: serviceDesc },
              { type: 'text', text: dateStr },
              { type: 'text', text: timeStr },
              { type: 'text', text: statusLabel },
            ],
          },
        ],
      });
    } catch (err: any) {
      console.error('[WhatsAppNotificationService] Error in sendHomeNursingReminder:', err.message);
    }
  }

  /**
   * 7. Send Appointment Cancellation to Patient
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
        languageCode: 'en',
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
   * 8. Send Video Consultation Ready Notification
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
      const appointmentRef = this.formatRef(booking.id, 'VID');

      // Uses approved test_utility_template_check to notify patient with direct action instruction
      const readyMsg = `${patientName}! Dr. ${doctorName} is ready for your video consultation (Ref: ${appointmentRef}). Please open MediQuee and select Join Video Consultation now.`;
      await WhatsAppClient.sendTemplateMessage({
        recipientPhone,
        templateName: 'test_utility_template_check',
        languageCode: 'en_US',
        messageType: 'VIDEO_CALL_READY',
        appointmentId: booking.id,
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: readyMsg },
            ],
          },
        ],
      });
    } catch (err: any) {
      console.error('[WhatsAppNotificationService] Error in sendVideoConsultationReadyNotification:', err.message);
    }
  }

  /**
   * 9. Send OP Appointment Rescheduled to Patient
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
        languageCode: 'en',
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
}
