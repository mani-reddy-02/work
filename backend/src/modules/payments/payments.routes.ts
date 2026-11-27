import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../../middleware/auth';
import { 
  createPaymentOrder, 
  verifyPayment, 
  handleRazorpayWebhook, 
  getPaymentConfig,
  cancelPendingPayment
} from './payments.controller';

const router = Router();

const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    success: false,
    error: { code: 'TOO_MANY_REQUESTS', message: 'Too many payment requests. Please try again later.' }
  }
});

// Public payment gateway config
router.get('/config', getPaymentConfig);

// Authenticated payment order & booking confirmation routes (ownership verified in service layer)
router.post('/create-order', authenticate, paymentRateLimiter, createPaymentOrder);
router.post('/verify', authenticate, paymentRateLimiter, verifyPayment);
router.post('/cancel-pending', authenticate, paymentRateLimiter, cancelPendingPayment);

// Razorpay Asynchronous Webhook Endpoint (HMAC-SHA256 verified)
router.post('/webhook', handleRazorpayWebhook);

export default router;
