import { Router } from 'express';
import { optionalAuthenticate } from '../../middleware/auth';
import { 
  createPaymentOrder, 
  verifyPayment, 
  handleRazorpayWebhook, 
  getPaymentConfig,
  cancelPendingPayment
} from './payments.controller';

const router = Router();

// Public / Patient payment endpoints (supports authenticated patients or guest session)
router.get('/config', getPaymentConfig);
router.post('/create-order', optionalAuthenticate, createPaymentOrder);
router.post('/verify', optionalAuthenticate, verifyPayment);
router.post('/cancel-pending', optionalAuthenticate, cancelPendingPayment);

// Razorpay Asynchronous Webhook Endpoint
router.post('/webhook', handleRazorpayWebhook);

export default router;
