import { prisma } from '../../config/prisma';
import { env } from '../../config/env';

export interface WhatsAppTemplateComponent {
  type: 'header' | 'body' | 'button';
  sub_type?: 'url' | 'quick_reply';
  index?: string | number;
  parameters: Array<{
    type: 'text' | 'currency' | 'date_time' | 'image' | 'document';
    text?: string;
    [key: string]: any;
  }>;
}

export interface WhatsAppSendResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
  configured: boolean;
}

export class WhatsAppClient {
  private static getApiConfig() {
    const accessToken = env.WHATSAPP_ACCESS_TOKEN || env.META_WA_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID || env.META_WA_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID;
    const businessAccountId = env.WHATSAPP_BUSINESS_ACCOUNT_ID || process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
    const apiVersion = env.WHATSAPP_API_VERSION || 'v21.0';

    const isConfigured = !!(accessToken && phoneNumberId);

    return {
      accessToken,
      phoneNumberId,
      businessAccountId,
      apiVersion,
      isConfigured,
    };
  }

  /**
   * Check if Meta WhatsApp Cloud API credentials are fully configured
   */
  static isConfigured(): boolean {
    return this.getApiConfig().isConfigured;
  }

  /**
   * Get public configuration status (never exposing tokens)
   */
  static getStatus() {
    const config = this.getApiConfig();
    return {
      configured: config.isConfigured,
      apiVersion: config.apiVersion,
      hasPhoneNumberId: !!config.phoneNumberId,
      hasAccessToken: !!config.accessToken,
      hasBusinessAccountId: !!config.businessAccountId,
    };
  }

  /**
   * Normalizes phone number to digits-only E.164 without '+'
   * Defaults 10-digit Indian numbers with '91'
   */
  static normalizePhone(rawPhone: string): string {
    const digits = rawPhone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `91${digits}`;
    }
    if (digits.length === 11 && digits.startsWith('0')) {
      return `91${digits.slice(1)}`;
    }
    return digits;
  }

  /**
   * Sends an approved Meta WhatsApp template message with retry handling and DB logging
   */
  static async sendTemplateMessage(params: {
    recipientPhone: string;
    templateName: string;
    components: WhatsAppTemplateComponent[];
    languageCode?: string;
    appointmentId?: string | null;
    messageType: string;
  }): Promise<WhatsAppSendResult> {
    const { recipientPhone, templateName, components, languageCode = 'en', appointmentId, messageType } = params;
    const cleanPhone = this.normalizePhone(recipientPhone);
    const config = this.getApiConfig();

    if (!config.isConfigured) {
      const errorMsg = 'Meta WhatsApp Cloud API is not configured. Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID in environment.';
      console.warn(`[WhatsAppClient] Delivery aborted: ${errorMsg}`);

      // Log failure in database
      await prisma.whatsAppMessageLog.create({
        data: {
          messageType,
          recipient: cleanPhone,
          appointmentId: appointmentId || null,
          deliveryStatus: 'FAILED',
          errorDetails: 'Configuration missing: WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set',
          attempts: 0,
        },
      }).catch(console.error);

      return {
        success: false,
        configured: false,
        error: errorMsg,
      };
    }

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanPhone,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
        components,
      },
    };

    const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;
    let attempt = 0;
    const maxRetries = 2;
    let lastError = '';
    let providerMessageId: string | undefined;

    while (attempt <= maxRetries) {
      attempt++;
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const resData = (await response.json()) as any;

        if (response.ok && resData.messages?.[0]?.id) {
          providerMessageId = resData.messages[0].id;

          // Record successful dispatch
          await prisma.whatsAppMessageLog.create({
            data: {
              messageType,
              recipient: cleanPhone,
              appointmentId: appointmentId || null,
              providerMessageId,
              deliveryStatus: 'SENT',
              attempts: attempt,
            },
          });

          return {
            success: true,
            configured: true,
            providerMessageId,
          };
        } else {
          const metaError = resData.error;
          lastError = metaError ? `Meta API Error (${metaError.code || response.status}): ${metaError.message}` : `HTTP ${response.status}`;
          console.error(`[WhatsAppClient] Attempt ${attempt} failed:`, lastError);

          // If client error (4xx) other than rate limit (429), don't retry
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            break;
          }
        }
      } catch (networkErr: any) {
        lastError = `Network error: ${networkErr.message}`;
        console.error(`[WhatsAppClient] Attempt ${attempt} network error:`, lastError);
      }

      // Backoff before retry if attempts remain
      if (attempt <= maxRetries) {
        await new Promise((res) => setTimeout(res, attempt * 1000));
      }
    }

    // Log final failure in database
    await prisma.whatsAppMessageLog.create({
      data: {
        messageType,
        recipient: cleanPhone,
        appointmentId: appointmentId || null,
        deliveryStatus: 'FAILED',
        errorDetails: lastError.slice(0, 500),
        attempts: attempt,
      },
    }).catch(console.error);

    return {
      success: false,
      configured: true,
      error: lastError,
    };
  }

  /**
   * Updates message delivery status from incoming Meta Webhook event
   */
  static async updateDeliveryStatus(wamid: string, status: string, errorInfo?: string) {
    try {
      const normalizedStatus = status.toUpperCase(); // SENT, DELIVERED, READ, FAILED
      await prisma.whatsAppMessageLog.updateMany({
        where: { providerMessageId: wamid },
        data: {
          deliveryStatus: normalizedStatus,
          ...(errorInfo ? { errorDetails: errorInfo } : {}),
        },
      });
    } catch (err) {
      console.error('[WhatsAppClient] Error updating delivery status from webhook:', err);
    }
  }
}
