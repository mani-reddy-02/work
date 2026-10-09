import { Router, Request, Response } from 'express';
import { WhatsAppClient } from './whatsapp.client';
import { WhatsAppOtpService } from './whatsapp-otp.service';
import { env } from '../../config/env';

const router = Router();

/**
 * 1. Meta Webhook Verification Endpoint
 * Required by Meta during webhook subscription setup in Meta Developer App
 */
router.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'mediquee_wa_verify_token_secure';

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('[WhatsApp Webhook] Verification successful!');
    return res.status(200).send(challenge);
  }

  console.warn('[WhatsApp Webhook] Verification failed. Token mismatch.');
  return res.sendStatus(403);
});

/**
 * 2. Meta Webhook Event Delivery
 * Receives message delivery receipts (sent, delivered, read, failed) from Meta Cloud API
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
      const entries = body.entry || [];
      for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
          const value = change.value;
          if (value && value.statuses) {
            for (const statusObj of value.statuses) {
              const wamid = statusObj.id;
              const status = statusObj.status; // sent, delivered, read, failed
              let errorInfo: string | undefined;

              if (statusObj.errors && statusObj.errors.length > 0) {
                errorInfo = `${statusObj.errors[0].code}: ${statusObj.errors[0].title || statusObj.errors[0].message}`;
              }

              if (wamid && status) {
                await WhatsAppClient.updateDeliveryStatus(wamid, status, errorInfo);
              }
            }
          }
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    }

    return res.sendStatus(404);
  } catch (err: any) {
    console.error('[WhatsApp Webhook] Error processing event:', err.message);
    return res.status(200).send('EVENT_PROCESSED_WITH_ERROR');
  }
});

/**
 * 3. Configuration & Health Status
 * Reports whether Meta WhatsApp Cloud API is configured
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: WhatsAppClient.getStatus(),
  });
});

/**
 * 4. Send Authentication OTP
 */
router.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    const result = await WhatsAppOtpService.requestOtp(phone);

    if (!result.success) {
      return res.status(result.configured ? 502 : 503).json({
        success: false,
        error: {
          code: result.configured ? 'WHATSAPP_DELIVERY_FAILED' : 'WHATSAPP_NOT_CONFIGURED',
          message: result.message,
          details: result.error,
        },
      });
    }

    return res.json({
      success: true,
      data: {
        message: result.message,
        cooldownSeconds: result.cooldownSeconds,
      },
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: err.message || 'Failed to send OTP',
      },
    });
  }
});

/**
 * 5. Verify Authentication OTP
 */
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { phone, code } = req.body;
    const result = await WhatsAppOtpService.verifyOtp(phone, code);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OTP',
          message: result.message,
        },
      });
    }

    return res.json({
      success: true,
      data: {
        verified: true,
        message: result.message,
      },
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: err.message || 'Failed to verify OTP',
      },
    });
  }
});

export default router;
