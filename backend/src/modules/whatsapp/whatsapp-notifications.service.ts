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
        if (!isVideo) {
          // In-person OP Appointment: Use dedicated mediquee_op_confirmed template
          const opResult = await WhatsAppClient.sendTemplateMessage({
            recipientPhone,
            templateName: 'mediquee_op_confirmed',
            languageCode: 'en',
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
                ],
              },
            ],
          });

          // Fallback to approved op_appointment_confirmed if template is pending review
          if (!opResult.success) {
            await WhatsAppClient.sendTemplateMessage({
              recipientPhone,
              templateName: 'op_appointment_confirmed',
              languageCode: 'en',
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
        } else {
          // Online Video Consultation: Use universal mediquee_service_confirmed template
          const vidResult = await WhatsAppClient.sendTemplateMessage({
            recipientPhone,
            templateName: 'mediquee_service_confirmed',
            languageCode: 'en',
            messageType: 'VIDEO_BOOKING_CONFIRMATION',
            appointmentId: booking.id,
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: patientName },
                  { type: 'text', text: 'online video consultation' },
                  { type: 'text', text: appointmentRef },
                  { type: 'text', text: hospitalName },
                  { type: 'text', text: doctorOrDept },
                  { type: 'text', text: dateStr },
                  { type: 'text', text: timeStr },
                  { type: 'text', text: 'Please join 5 minutes before your scheduled appointment from your MediQuee app.' },
                ],
              },
            ],
          });

          // Fallback if pending review
          if (!vidResult.success) {
            await WhatsAppClient.sendTemplateMessage({
              recipientPhone,
              templateName: 'op_appointment_confirmed',
              languageCode: 'en',
              messageType: 'VIDEO_BOOKING_CONFIRMATION',
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
        }
      }

      // 1b. Send alert to Doctor / Staff
      if (booking.doctor?.phone && booking.doctor?.whatsappConsent !== false) {
        const staffAlertResult = await WhatsAppClient.sendTemplateMessage({
          recipientPhone: booking.doctor.phone,
          templateName: 'mediquee_staff_booking_alert',
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

        if (!staffAlertResult.success) {
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
      const serviceType = isHome ? 'Home Sample Collection' : 'diagnostic lab test booking';
      const serviceDesc = testNames || 'Lab Diagnostic Tests';
      const instruction = isHome 
        ? 'Our certified phlebotomist will arrive for sample collection at your address.' 
        : 'Please arrive at the diagnostic center 10 minutes prior to your time slot.';
      
      const dateStr = booking.collectionDate ? this.formatDate(booking.collectionDate) : 'As Scheduled';
      const timeStr = booking.collectionTimeSlot || 'Scheduled Slot';

      // 1. Try universal service confirmation template
      const labResult = await WhatsAppClient.sendTemplateMessage({
        recipientPhone,
        templateName: 'mediquee_service_confirmed',
        languageCode: 'en',
        messageType: 'LAB_BOOKING_CONFIRMATION',
        appointmentId: booking.id,
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: patientName },
              { type: 'text', text: serviceType },
              { type: 'text', text: refCode },
              { type: 'text', text: providerName },
              { type: 'text', text: serviceDesc },
              { type: 'text', text: dateStr },
              { type: 'text', text: timeStr },
              { type: 'text', text: instruction },
            ],
          },
        ],
      });

      // 2. Fallback to op_appointment_confirmed if pending review
      if (!labResult.success) {
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
                { type: 'text', text: `${serviceDesc} (${isHome ? 'Home Sample Collection' : 'Lab Visit'})` },
                { type: 'text', text: dateStr },
                { type: 'text', text: timeStr },
                { type: 'text', text: 'Confirmed (Lab Order)' },
              ],
            },
          ],
        });
      }
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
      const serviceDesc = booking.service?.name || 'Home Nursing Care';
      const dateStr = this.formatDate(booking.serviceDate);
      const timeStr = booking.timeSlot || 'Scheduled Slot';
      const instruction = 'Our certified nursing staff will arrive at your address as scheduled.';

      // 1. Try universal service confirmation template
      const nursingResult = await WhatsAppClient.sendTemplateMessage({
        recipientPhone,
        templateName: 'mediquee_service_confirmed',
        languageCode: 'en',
        messageType: 'NURSING_BOOKING_CONFIRMATION',
        appointmentId: booking.id,
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: patientName },
              { type: 'text', text: 'home nursing service' },
              { type: 'text', text: refCode },
              { type: 'text', text: providerName },
              { type: 'text', text: serviceDesc },
              { type: 'text', text: dateStr },
              { type: 'text', text: timeStr },
              { type: 'text', text: instruction },
            ],
          },
        ],
      });

      // 2. Fallback to op_appointment_confirmed if pending review
      if (!nursingResult.success) {
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
                { type: 'text', text: `${serviceDesc} (Home Visit)` },
                { type: 'text', text: dateStr },
                { type: 'text', text: timeStr },
                { type: 'text', text: 'Confirmed (Home Visit)' },
              ],
            },
          ],
        });
      }
    } catch (err: any) {
      console.error('[WhatsAppNotificationService] Error in sendHomeNursingConfirmation:', err.message);
    }
  }

  /**
   * Helper to format clean human-friendly timing labels
   */
  private static formatReminderTiming(timingLabel: string): string {
    const t = timingLabel.trim().toLowerCase();
    if (t.includes('hour')) return 'in 1 Hour';
    if (t.includes('15')) return 'in 15 Minutes';
    if (t.includes('starting') || t.includes('now')) return 'Starting Now';
    if (t.includes('tomorrow')) return 'Tomorrow';
    return timingLabel;
  }

  /**
   * 4. Send OP / Video Appointment Reminder
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
      const cleanTiming = this.formatReminderTiming(timingLabel);
      const serviceLabel = isVideo ? 'online video consultation' : 'outpatient (OP) appointment';
      const instruction = isVideo
        ? 'Please open the MediQuee app and join 5 minutes before your scheduled session.'
        : cleanTiming === 'Starting Now'
          ? 'Your consultation is starting shortly. Please proceed to the doctor desk.'
          : 'Please arrive 15 minutes before your scheduled appointment for smooth check-in.';

      const reminderResult = await WhatsAppClient.sendTemplateMessage({
        recipientPhone,
        templateName: 'mediquee_appointment_reminder',
        languageCode: 'en',
        messageType: 'APPOINTMENT_REMINDER_1HOUR',
        appointmentId: booking.id,
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: patientName },
              { type: 'text', text: serviceLabel },
              { type: 'text', text: cleanTiming },
              { type: 'text', text: appointmentRef },
              { type: 'text', text: hospitalName },
              { type: 'text', text: doctorOrDept },
              { type: 'text', text: dateStr },
              { type: 'text', text: timeStr },
              { type: 'text', text: instruction },
            ],
          },
        ],
      });

      if (!reminderResult.success) {
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
      }
    } catch (err: any) {
      console.error('[WhatsAppNotificationService] Error in sendAppointmentReminder:', err.message);
    }
  }

  /**
   * 5. Send Lab Booking Reminder
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
      const serviceDesc = testNames || 'Diagnostic Lab Tests';
      const dateStr = booking.collectionDate ? this.formatDate(booking.collectionDate) : 'Today';
      const timeStr = booking.collectionTimeSlot || 'Scheduled Slot';
      const cleanTiming = this.formatReminderTiming(timingLabel);
      const serviceLabel = isHome ? 'home sample collection' : 'diagnostic lab test';
      const instruction = isHome
        ? 'Please keep your ID and test requirements ready; our certified phlebotomist will arrive shortly.'
        : 'Please arrive at the diagnostic center 10 minutes before your scheduled slot.';

      const labReminderRes = await WhatsAppClient.sendTemplateMessage({
        recipientPhone: booking.patient.phone,
        templateName: 'mediquee_appointment_reminder',
        languageCode: 'en',
        messageType: 'LAB_REMINDER_1HOUR',
        appointmentId: booking.id,
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: patientName },
              { type: 'text', text: serviceLabel },
              { type: 'text', text: cleanTiming },
              { type: 'text', text: refCode },
              { type: 'text', text: providerName },
              { type: 'text', text: serviceDesc },
              { type: 'text', text: dateStr },
              { type: 'text', text: timeStr },
              { type: 'text', text: instruction },
            ],
          },
        ],
      });

      if (!labReminderRes.success) {
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
                { type: 'text', text: `${serviceDesc} (${isHome ? 'Home Sample Collection' : 'Lab Visit'})` },
                { type: 'text', text: dateStr },
                { type: 'text', text: timeStr },
                { type: 'text', text: statusLabel },
              ],
            },
          ],
        });
      }
    } catch (err: any) {
      console.error('[WhatsAppNotificationService] Error in sendLabBookingReminder:', err.message);
    }
  }

  /**
   * 6. Send Home Nursing Reminder
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
      const serviceDesc = booking.service?.name || 'Home Nursing Care';
      const dateStr = this.formatDate(booking.serviceDate);
      const timeStr = booking.timeSlot || 'Scheduled Slot';
      const cleanTiming = this.formatReminderTiming(timingLabel);
      const instruction = 'Our certified nursing staff will arrive at your doorstep at the scheduled time.';

      const nursingReminderRes = await WhatsAppClient.sendTemplateMessage({
        recipientPhone,
        templateName: 'mediquee_appointment_reminder',
        languageCode: 'en',
        messageType: 'NURSING_REMINDER_1HOUR',
        appointmentId: booking.id,
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: patientName },
              { type: 'text', text: 'home nursing visit' },
              { type: 'text', text: cleanTiming },
              { type: 'text', text: refCode },
              { type: 'text', text: providerName },
              { type: 'text', text: serviceDesc },
              { type: 'text', text: dateStr },
              { type: 'text', text: timeStr },
              { type: 'text', text: instruction },
            ],
          },
        ],
      });

      if (!nursingReminderRes.success) {
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
                { type: 'text', text: `${serviceDesc} (Home Visit)` },
                { type: 'text', text: dateStr },
                { type: 'text', text: timeStr },
                { type: 'text', text: statusLabel },
              ],
            },
          ],
        });
      }
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
      const isVideo = (booking.opType || '').toLowerCase().includes('video');
      const appointmentRef = this.formatRef(booking.id, isVideo ? 'VID' : 'OP');
      const hospitalName = booking.hospital?.name || 'MediQuee Hospital';
      const doctorOrDept = booking.doctor?.name ? `Dr. ${booking.doctor.name}` : (booking.department?.name || 'OP Consultation');
      const dateStr = this.formatDate(booking.appointmentDate);
      const timeStr = booking.timeSlot || booking.slotTime || 'Scheduled Time';
      const safeReason = reason ? reason.trim().slice(0, 100) : 'Schedule updated or cancelled';
      const serviceLabel = isVideo ? 'online video consultation' : 'outpatient (OP) appointment';

      const cancelResult = await WhatsAppClient.sendTemplateMessage({
        recipientPhone,
        templateName: 'mediquee_booking_cancelled',
        languageCode: 'en',
        messageType: 'APPOINTMENT_CANCELLED',
        appointmentId: booking.id,
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: patientName },
              { type: 'text', text: serviceLabel },
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

      if (!cancelResult.success) {
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
      }
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
      const hospitalName = booking.hospital?.name || 'MediQuee Telehealth';
      const timeStr = booking.timeSlot || booking.slotTime || 'Now';

      const videoReadyRes = await WhatsAppClient.sendTemplateMessage({
        recipientPhone,
        templateName: 'mediquee_video_ready',
        languageCode: 'en',
        messageType: 'VIDEO_CALL_READY',
        appointmentId: booking.id,
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: patientName },
              { type: 'text', text: doctorName },
              { type: 'text', text: appointmentRef },
              { type: 'text', text: hospitalName },
              { type: 'text', text: timeStr },
            ],
          },
        ],
      });

      if (!videoReadyRes.success) {
        const readyMsg = `${patientName}! ${doctorName} is ready for your video consultation (Ref: ${appointmentRef}). Please open MediQuee and select Join Video Consultation now.`;
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
      }
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
      const isVideo = (booking.opType || '').toLowerCase().includes('video');
      const appointmentRef = this.formatRef(booking.id, isVideo ? 'VID' : 'OP');
      const hospitalName = booking.hospital?.name || 'MediQuee Hospital';
      const doctorOrDept = booking.doctor?.name ? `Dr. ${booking.doctor.name}` : (booking.department?.name || 'OP Consultation');
      const newDateStr = this.formatDate(booking.appointmentDate);
      const newTimeStr = booking.timeSlot || booking.slotTime || 'Scheduled Time';
      const serviceLabel = isVideo ? 'online video consultation' : 'outpatient (OP) appointment';

      const reschedRes = await WhatsAppClient.sendTemplateMessage({
        recipientPhone,
        templateName: 'mediquee_booking_rescheduled',
        languageCode: 'en',
        messageType: 'APPOINTMENT_RESCHEDULED',
        appointmentId: booking.id,
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: patientName },
              { type: 'text', text: serviceLabel },
              { type: 'text', text: appointmentRef },
              { type: 'text', text: hospitalName },
              { type: 'text', text: doctorOrDept },
              { type: 'text', text: newDateStr },
              { type: 'text', text: newTimeStr },
            ],
          },
        ],
      });

      if (!reschedRes.success) {
        await WhatsAppClient.sendTemplateMessage({
          recipientPhone,
          templateName: 'mediquee_op_confirmed',
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
                { type: 'text', text: `${doctorOrDept} (Rescheduled)` },
                { type: 'text', text: newDateStr },
                { type: 'text', text: newTimeStr },
              ],
            },
          ],
        });
      }
    } catch (err: any) {
      console.error('[WhatsAppNotificationService] Error in sendAppointmentRescheduled:', err.message);
    }
  }
}
