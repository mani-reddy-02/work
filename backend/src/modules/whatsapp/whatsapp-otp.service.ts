import crypto from 'crypto';
import { prisma } from '../../config/prisma';
import { WhatsAppClient } from './whatsapp.client';
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
    const templateName = env.META_WA_TEMPLATE_NAME || 'otp_auth';

    // Dispatch via Meta WhatsApp Cloud API
    const sendResult = await WhatsAppClient.sendTemplateMessage({
      recipientPhone: cleanPhone,
      templateName,
      messageType: 'OTP',
      components: [
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
      ],
    });

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
  static async verifyOtp(rawPhone: string, code: string): Promise<{
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
    const isMatch = record.codeHash ? record.codeHash === inputHash : record.code === trimmedCode;

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

    // Mark as verified and invalidate immediately to prevent replay
    await prisma.whatsAppOtp.update({
      where: { id: record.id },
      data: {
        verified: true,
        expiresAt: new Date(),
      },
    });

    return { valid: true, message: 'OTP verified successfully' };
  }
}
