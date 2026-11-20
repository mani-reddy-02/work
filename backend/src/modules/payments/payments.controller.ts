import { Request, Response, NextFunction } from 'express';
import { PaymentsService, ServiceType } from './payments.service';
import { env } from '../../config/env';
import { isRazorpayConfigured } from './razorpay.client';

export const createPaymentOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serviceType, bookingId, notes } = req.body;

    if (!serviceType || !bookingId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required parameters: serviceType and bookingId are required.' }
      });
    }

    const validTypes: ServiceType[] = [
      'OP_BOOKING',
      'VIDEO_CONSULTATION',
      'LAB_BOOKING',
      'HOME_SAMPLE',
      'HOME_NURSING'
    ];

    if (!validTypes.includes(serviceType)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid serviceType. Allowed values: ${validTypes.join(', ')}` }
      });
    }

    const userId = req.user?.id || 'guest_user';

    const orderData = await PaymentsService.createOrder({
      serviceType,
      bookingId,
      userId,
      notes
    });

    return res.status(200).json({
      success: true,
      data: orderData
    });
  } catch (err: any) {
    next(err);
  }
};

export const verifyPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId, paymentId, signature, serviceType, bookingId } = req.body;

    if (!orderId || !paymentId || !signature || !serviceType || !bookingId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required payment verification parameters: orderId, paymentId, signature, serviceType, bookingId.' }
      });
    }

    const result = await PaymentsService.verifyPayment({
      orderId,
      paymentId,
      signature,
      serviceType,
      bookingId,
      userId: req.user?.id
    });

    return res.status(200).json({
      success: true,
      message: 'Payment verified and booking confirmed successfully.',
      data: result
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: { message: err.message || 'Payment verification failed' }
    });
  }
};

export const handleRazorpayWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = (req.headers['x-razorpay-signature'] as string) || '';
    const eventId = (req.headers['x-razorpay-event-id'] as string) || '';

    // Use rawBody captured by express.json verify hook, or fallback
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    if (!signature) {
      return res.status(400).json({ success: false, error: 'Missing x-razorpay-signature header' });
    }

    const result = await PaymentsService.processWebhookEvent(rawBody, signature, eventId);

    return res.status(200).json({
      success: true,
      status: 'ok',
      data: result
    });
  } catch (err: any) {
    console.error('[RazorpayWebhookError]', err.message);
    return res.status(400).json({
      success: false,
      error: err.message || 'Webhook verification failed'
    });
  }
};

export const getPaymentConfig = async (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    data: {
      keyId: env.RAZORPAY_KEY_ID || '',
      isConfigured: isRazorpayConfigured(),
      currency: 'INR'
    }
  });
};
