import { Router } from 'express';
import { optionalAuthenticate } from '../../middleware/auth';
import { 
  createPaymentOrder, 
  verifyPayment, 
  handleRazorpayWebhook, 
  getPaymentConfig 
} from './payments.controller';

const router = Router();

// Public / Patient payment endpoints (supports authenticated patients or guest session)
router.get('/config', getPaymentConfig);
router.post('/create-order', optionalAuthenticate, createPaymentOrder);
router.post('/verify', optionalAuthenticate, verifyPayment);

// Razorpay Asynchronous Webhook Endpoint
router.post('/webhook', handleRazorpayWebhook);

export default router;
