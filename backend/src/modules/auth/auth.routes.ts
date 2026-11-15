import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { 
  login, 
  register, 
  sendWhatsAppOtp, 
  verifyWhatsAppOtp,
  forgotPasswordSendOtp,
  forgotPasswordVerifyOtp,
  forgotPasswordReset
} from './auth.controller';
import { validateRequest } from '../../middleware/validate';
import { 
  loginSchema, 
  registerSchema, 
  sendOtpSchema, 
  verifyOtpSchema,
  forgotPasswordSendOtpSchema,
  forgotPasswordVerifyOtpSchema,
  forgotPasswordResetSchema
} from './auth.schema';
import { authenticate } from '../../middleware/auth';
import { getMe } from '../users/users.controller';

const router = Router();

// Rate limiter for authentication and OTP endpoints: max 60 requests per 15-minute window per IP
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60,
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

// Forgot Password via WhatsApp OTP routes
router.post('/forgot-password/send-otp', authRateLimiter, validateRequest(forgotPasswordSendOtpSchema), forgotPasswordSendOtp);
router.post('/forgot-password/verify-otp', authRateLimiter, validateRequest(forgotPasswordVerifyOtpSchema), forgotPasswordVerifyOtp);
router.post('/forgot-password/reset', authRateLimiter, validateRequest(forgotPasswordResetSchema), forgotPasswordReset);

export default router;
