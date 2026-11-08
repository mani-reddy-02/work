import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, register, sendWhatsAppOtp, verifyWhatsAppOtp } from './auth.controller';
import { validateRequest } from '../../middleware/validate';
import { loginSchema, registerSchema, sendOtpSchema, verifyOtpSchema } from './auth.schema';
import { authenticate } from '../../middleware/auth';
import { getMe } from '../users/users.controller';

const router = Router();

// Strict rate limiter for authentication and OTP endpoints: max 10 requests per 15-minute window per IP
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts from this IP address. Please try again after 15 minutes.',
    },
  },
});

router.get('/me', authenticate, getMe);
router.post('/login', authRateLimiter, validateRequest(loginSchema), login);
router.post('/register', authRateLimiter, validateRequest(registerSchema), register);
router.post('/whatsapp/send-otp', authRateLimiter, validateRequest(sendOtpSchema), sendWhatsAppOtp);
router.post('/whatsapp/verify-otp', authRateLimiter, validateRequest(verifyOtpSchema), verifyWhatsAppOtp);

export default router;
