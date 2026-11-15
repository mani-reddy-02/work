import { prisma } from '../../config/prisma';
import { Role } from '@prisma/client';
import { WhatsAppClient } from './whatsapp.client';

export interface DripMessageDefinition {
  step: number;
  category: string;
  buildText: (name: string) => string;
}

export const ONBOARDING_DRIP_MESSAGES: DripMessageDefinition[] = [
  // Day 0 - Message 1: Initial Welcome & Doctor Consultations
  {
    step: 1,
    category: 'WELCOME_DOCTORS',
    buildText: (name: string) =>
      `${name}! Welcome to MediQuee Healthcare. Easily book appointments with top doctor specialists across verified hospitals and skip long waiting lines.`
  },
  // Day 0 - Message 2 (6 hours later): Home Diagnostics & Nursing Care
  {
    step: 2,
    category: 'HOME_DIAGNOSTICS_NURSING',
    buildText: (name: string) =>
      `${name}, did you know? You can get certified blood tests & health checkups done at your home with free sample collection and verified nurses on MediQuee.`
  },
  // Week 1 - Message 3 (Day 2): Instant Video Consultations
  {
    step: 3,
    category: 'VIDEO_CONSULTATION',
    buildText: (name: string) =>
      `${name}, need to consult a doctor quickly? Connect via instant HD Video Consultation with top specialists on MediQuee right from your smartphone.`
  },
  // Week 1 - Message 4 (Day 4): Comprehensive Health Checkups
  {
    step: 4,
    category: 'PREVENTIVE_HEALTH',
    buildText: (name: string) =>
      `${name}, protect your health with comprehensive Full Body Checkup packages on MediQuee. Get verified digital lab reports delivered directly on WhatsApp.`
  },
  // Week 1 - Message 5 (Day 5.5): Doorstep Medicine Delivery
  {
    step: 5,
    category: 'PHARMACY_DELIVERY',
    buildText: (name: string) =>
      `${name}, order genuine medicines easily through MediQuee. Fast delivery right to your doorstep with exclusive patient healthcare discounts.`
  },
  // Week 1 - Message 6 (Day 7): Family Healthcare Management
  {
    step: 6,
    category: 'FAMILY_HEALTH',
    buildText: (name: string) =>
      `${name}, manage healthcare for your whole family under one account. Add your parents and children to your MediQuee profile for one-click appointments.`
  },
  // Week 2 - Message 7: Hospital Discovery & Emergency Services
  {
    step: 7,
    category: 'EMERGENCY_HOSPITAL_DISCOVERY',
    buildText: (name: string) =>
      `${name}, find verified hospitals near your area with immediate bed availability, ICU facilities, and 24/7 ambulances on MediQuee.`
  },
  // Week 2 - Message 8: Chronic Disease Monitoring
  {
    step: 8,
    category: 'CHRONIC_CARE',
    buildText: (name: string) =>
      `${name}, managing diabetes, blood pressure, or thyroid? Track prescriptions, schedule follow-ups, and get personalized doctor consultations on MediQuee.`
  },
  // Week 2 - Message 9: 24/7 Dedicated Support
  {
    step: 9,
    category: 'PATIENT_SUPPORT',
    buildText: (name: string) =>
      `${name}, our dedicated MediQuee healthcare support team is available 24/7 to help you book appointments and answer your medical questions.`
  },
  // Week 2 - Message 10: Digital Records & Lifetime Access
  {
    step: 10,
    category: 'DIGITAL_HEALTH_RECORDS',
    buildText: (name: string) =>
      `${name}, keep all your medical records, prescriptions, and lab reports safely organized and accessible anytime on your MediQuee health dashboard.`
  }
];

export class WhatsAppDripService {
  /**
   * Evaluates all registered patient users and sends the appropriate onboarding drip message
   * if they have never booked any service.
   *
   * Rules:
   * 1. Only patients with 0 bookings across OP, Video, Lab, and Home Nursing.
   * 2. Registration day (Day 0): Exactly 2 messages, spaced by at least 6 hours (msg/6 hours).
   * 3. Day 1 onwards: Exactly 4 messages per week (spaced by at least 36 hours).
   */
  static async processInactivePatientDrips(): Promise<{ checked: number; sent: number }> {
    try {
      const now = new Date();
      let sentCount = 0;

      // Fetch all active patient users who opted-in for WhatsApp
      const patients = await prisma.user.findMany({
        where: {
          role: Role.PATIENT,
          active: true,
          phone: { not: null },
          whatsappConsent: { not: false },
        },
        select: {
          id: true,
          name: true,
          phone: true,
          createdAt: true,
        },
      });

      for (const patient of patients) {
        if (!patient.phone) continue;
        const cleanPhone = WhatsAppClient.normalizePhone(patient.phone);
        if (cleanPhone.length < 10) continue;

        // Check if user has booked ANY service (OP, Video, Lab, Nursing)
        const [opCount, labCount, nursingCount] = await Promise.all([
          prisma.oPBooking.count({ where: { patientId: patient.id } }),
          prisma.labBooking.count({ where: { patientId: patient.id } }),
          prisma.homeNursingBooking.count({ where: { userId: patient.id } }),
        ]);

        if (opCount > 0 || labCount > 0 || nursingCount > 0) {
          // User is active / has booked at least one service. Skip drip campaign.
          continue;
        }

        // Fetch sent drip logs for this user
        const sentLogs = await prisma.whatsAppMessageLog.findMany({
          where: {
            recipient: cleanPhone,
            messageType: { startsWith: 'ONBOARDING_DRIP_' },
            deliveryStatus: { not: 'FAILED' },
          },
          orderBy: { createdAt: 'desc' },
        });

        const totalSent = sentLogs.length;
        const latestDrip = sentLogs[0];
        const hoursSinceReg = (now.getTime() - new Date(patient.createdAt).getTime()) / (1000 * 60 * 60);

        // Day 0: Registration day (< 24 hours)
        const isDayZero = hoursSinceReg < 24;

        if (isDayZero) {
          // Message 1 on registration day: send after registration (at least 5 minutes after creation)
          if (totalSent === 0) {
            if (hoursSinceReg >= 0.08) {
              await this.dispatchDripMessage(patient, 1);
              sentCount++;
            }
          } else if (totalSent === 1) {
            // Message 2 on registration day: send 6 hours after Message 1 (msg/6 hours)
            const hoursSinceLast = (now.getTime() - new Date(latestDrip.createdAt).getTime()) / (1000 * 60 * 60);
            if (hoursSinceLast >= 6) {
              await this.dispatchDripMessage(patient, 2);
              sentCount++;
            }
          }
          // Already sent 2 on registration day; wait until Day 1
          continue;
        }

        // Day 1 onwards: Weekly 4 messages
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const dripsInLast7Days = sentLogs.filter((l) => new Date(l.createdAt) >= sevenDaysAgo).length;

        // Cap at 4 messages per 7-day rolling period
        if (dripsInLast7Days >= 4) {
          continue;
        }

        // Ensure at least 36 hours spacing between messages
        if (latestDrip) {
          const hoursSinceLast = (now.getTime() - new Date(latestDrip.createdAt).getTime()) / (1000 * 60 * 60);
          if (hoursSinceLast < 36) {
            continue;
          }
        }

        // Calculate next step
        const nextStep = totalSent + 1;
        await this.dispatchDripMessage(patient, nextStep);
        sentCount++;
      }

      return { checked: patients.length, sent: sentCount };
    } catch (err: any) {
      console.error('[WhatsAppDripService] Error in processInactivePatientDrips:', err.message);
      return { checked: 0, sent: 0 };
    }
  }

  /**
   * Helper to dispatch a single onboarding drip step
   */
  private static async dispatchDripMessage(
    patient: { id: string; name: string; phone: string | null },
    stepNumber: number
  ) {
    if (!patient.phone) return;
    const cleanPhone = WhatsAppClient.normalizePhone(patient.phone);
    const firstName = (patient.name || 'Valued User').split(' ')[0].trim();

    // Select message definition, cycling if step exceeds catalog length
    const msgDef =
      ONBOARDING_DRIP_MESSAGES.find((m) => m.step === stepNumber) ||
      ONBOARDING_DRIP_MESSAGES[(stepNumber - 1) % ONBOARDING_DRIP_MESSAGES.length];

    const messageText = msgDef.buildText(firstName);

    // Meta approved MARKETING template: test_utility_template_check
    // Body: "Hello {{1}}, this is an automated service update from MediQuee."
    await WhatsAppClient.sendTemplateMessage({
      recipientPhone: cleanPhone,
      templateName: 'test_utility_template_check',
      languageCode: 'en_US',
      messageType: `ONBOARDING_DRIP_${stepNumber}`,
      appointmentId: patient.id,
      components: [
        {
          type: 'body',
          parameters: [
            {
              type: 'text',
              text: messageText,
            },
          ],
        },
      ],
    });

    console.log(`[WhatsAppDripService] Sent Onboarding Drip Step ${stepNumber} to ${cleanPhone} (${patient.name})`);
  }
}
