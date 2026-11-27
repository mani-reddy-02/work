import crypto from 'crypto';
import { prisma } from '../../config/prisma';
import { WhatsAppClient, WhatsAppTemplateComponent } from './whatsapp.client';
import { env } from '../../config/env';

export class WhatsAppOtpService {
  private static readonly OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
  private static readonly COOLDOWN_SECONDS = 60; // 60 seconds between resends
  private static readonly MAX_ATTEMPTS = 5; // Max invalid verification attempts

  /**
   * Generates a SHA-256 hash of the OTP string
   */
  private static hashOtp(code: string): string {
    return crypto.createHash('sha256').update(code.trim()).digest('hex');
  }

  private static safeHashEquals(a?: string | null, b?: string | null): boolean {
    if (!a || !b) return false;
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
  }

  /**
   * Requests and sends a secure WhatsApp OTP to the user's phone
   */
  static async requestOtp(rawPhone: string): Promise<{
    success: boolean;
    message: string;
    cooldownSeconds: number;
    configured: boolean;
    error?: string;
  }> {
    const cleanPhone = WhatsAppClient.normalizePhone(rawPhone);
    if (!cleanPhone || cleanPhone.length < 10) {
      throw new Error('Valid mobile number of at least 10 digits is required');
    }

    // Check resend cooldown
    const latestActive = await prisma.whatsAppOtp.findFirst({
      where: {
        phone: cleanPhone,
        verified: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (latestActive) {
      const elapsedSeconds = Math.floor((Date.now() - new Date(latestActive.lastResentAt || latestActive.createdAt).getTime()) / 1000);
      if (elapsedSeconds < this.COOLDOWN_SECONDS) {
        const remaining = this.COOLDOWN_SECONDS - elapsedSeconds;
        throw new Error(`Please wait ${remaining} seconds before requesting a new OTP.`);
      }
    }

    // Generate secure 6-digit cryptographic numeric code
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const codeHash = this.hashOtp(otpCode);
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MS);

    // Invalidate existing active OTPs for this phone
    await prisma.whatsAppOtp.updateMany({
      where: {
        phone: cleanPhone,
        verified: false,
      },
      data: {
        verified: true,
      },
    });

    // Store securely as hash
    await prisma.whatsAppOtp.create({
      data: {
        phone: cleanPhone,
        code: null, // Clear plain code; store only hash
        codeHash,
        expiresAt,
        verified: false,
        attempts: 0,
        lastResentAt: new Date(),
      },
    });

    // Template name for Meta authentication
    // Try crisp structured mediquee_welcome_update first unless explicitly overridden, falling back cleanly
    const templateName = env.META_WA_TEMPLATE_NAME || 'mediquee_welcome_update';

    let sendResult;
    if (templateName === 'mediquee_welcome_update') {
      sendResult = await WhatsAppClient.sendTemplateMessage({
        recipientPhone: cleanPhone,
        templateName: 'mediquee_welcome_update',
        languageCode: 'en',
        messageType: 'OTP',
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: 'Valued User' },
              { type: 'text', text: `Verification Code (OTP): ${otpCode}` },
              { type: 'text', text: 'Use this one-time password to sign in securely to MediQuee Healthcare. Valid for 5 minutes — please do not share it with anyone.' },
            ],
          },
        ],
      });

      if (!sendResult.success && sendResult.configured) {
        sendResult = await WhatsAppClient.sendTemplateMessage({
          recipientPhone: cleanPhone,
          templateName: 'test_utility_template_check',
          languageCode: 'en_US',
          messageType: 'OTP',
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: `! Your MediQuee login OTP is ${otpCode}` },
              ],
            },
          ],
        });
      }
    } else {
      let components: WhatsAppTemplateComponent[] = [];
      let languageCode = 'en_US';

      if (templateName === 'test_utility_template_check') {
        languageCode = 'en_US';
        components = [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: `! Your MediQuee login OTP is ${otpCode}`,
              },
            ],
          },
        ];
      } else if (templateName === 'op_appointment_confirmed') {
        languageCode = 'en';
        components = [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: 'Valued User' },
              { type: 'text', text: `OTP: ${otpCode}` },
              { type: 'text', text: 'MediQuee Healthcare' },
              { type: 'text', text: 'Login Verification' },
              { type: 'text', text: 'Immediate' },
              { type: 'text', text: `Valid for 5 Mins (Code: ${otpCode})` },
              { type: 'text', text: `OTP: ${otpCode}` },
            ],
          },
        ];
      } else {
        languageCode = 'en';
        components = [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: otpCode,
              },
            ],
          },
          {
            type: 'button',
            sub_type: 'url',
            index: 0,
            parameters: [
              {
                type: 'text',
                text: otpCode,
              },
            ],
          },
        ];
      }

      sendResult = await WhatsAppClient.sendTemplateMessage({
        recipientPhone: cleanPhone,
        templateName,
        languageCode,
        messageType: 'OTP',
        components,
      });
    }

    if (!sendResult.configured) {
      return {
        success: false,
        configured: false,
        cooldownSeconds: this.COOLDOWN_SECONDS,
        message: 'Meta WhatsApp Cloud API is not configured on the server. Please configure WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.',
        error: sendResult.error,
      };
    }

    if (!sendResult.success) {
      return {
        success: false,
        configured: true,
        cooldownSeconds: this.COOLDOWN_SECONDS,
        message: 'Failed to deliver OTP via Meta WhatsApp Cloud API. Please check your number or try again.',
        error: sendResult.error,
      };
    }

    return {
      success: true,
      configured: true,
      cooldownSeconds: this.COOLDOWN_SECONDS,
      message: 'OTP sent to your WhatsApp number.',
    };
  }

  /**
   * Validates the OTP against the stored SHA-256 hash
   */
  static async verifyOtp(
    rawPhone: string,
    code: string,
    options?: { allowAlreadyVerified?: boolean }
  ): Promise<{
    valid: boolean;
    message: string;
  }> {
    const cleanPhone = WhatsAppClient.normalizePhone(rawPhone);
    const trimmedCode = (code || '').trim();

    if (!trimmedCode || trimmedCode.length < 4) {
      return { valid: false, message: 'Please enter a valid OTP code' };
    }

    const inputHash = this.hashOtp(trimmedCode);
    const now = new Date();

    // If allowAlreadyVerified is enabled, check if user recently verified this OTP (e.g. in Step 1)
    if (options?.allowAlreadyVerified) {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      const verifiedRecord = await prisma.whatsAppOtp.findFirst({
        where: {
          phone: cleanPhone,
          verified: true,
          createdAt: { gt: fifteenMinutesAgo },
          expiresAt: { not: new Date(0) }, // not already consumed
        },
        orderBy: { createdAt: 'desc' },
      });

      if (verifiedRecord) {
        const isMatch = verifiedRecord.codeHash
          ? this.safeHashEquals(verifiedRecord.codeHash, inputHash)
          : this.safeHashEquals(verifiedRecord.code, trimmedCode);
        if (isMatch) {
          return { valid: true, message: 'OTP verified successfully' };
        }
      }
    }

    const record = await prisma.whatsAppOtp.findFirst({
      where: {
        phone: cleanPhone,
        verified: false,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return { valid: false, message: 'No active OTP found or OTP has expired (5-minute limit). Please request a new code.' };
    }

    if (record.attempts >= this.MAX_ATTEMPTS) {
      // Invalidate record due to max attempts exceeded
      await prisma.whatsAppOtp.update({
        where: { id: record.id },
        data: { verified: true },
      });
      return { valid: false, message: 'Too many incorrect attempts. For security, this OTP has been locked. Please request a new OTP.' };
    }

    // Verify hash match (fallback to plain code match if migrating legacy record)
    const isMatch = record.codeHash
      ? this.safeHashEquals(record.codeHash, inputHash)
      : this.safeHashEquals(record.code, trimmedCode);

    if (!isMatch) {
      const nextAttempts = record.attempts + 1;
      await prisma.whatsAppOtp.update({
        where: { id: record.id },
        data: { attempts: nextAttempts },
      });
      const remaining = this.MAX_ATTEMPTS - nextAttempts;
      return {
        valid: false,
        message: remaining > 0
          ? `Invalid OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
          : 'Too many incorrect attempts. This OTP is now locked. Please request a new OTP.',
      };
    }

    // Mark as verified, keep valid for 15 minutes to allow profile completion step
    const validUntil = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.whatsAppOtp.update({
      where: { id: record.id },
      data: {
        verified: true,
        expiresAt: validUntil,
      },
    });

    return { valid: true, message: 'OTP verified successfully' };
  }

  /**
   * Consumes/invalidates all verified OTPs for this phone number after successful registration
   */
  static async consumeOtp(rawPhone: string): Promise<void> {
    const cleanPhone = WhatsAppClient.normalizePhone(rawPhone);
    await prisma.whatsAppOtp.updateMany({
      where: {
        phone: cleanPhone,
      },
      data: {
        verified: true,
        expiresAt: new Date(0),
      },
    });
  }
}
