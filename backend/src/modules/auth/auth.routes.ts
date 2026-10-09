import { Router } from 'express';
import { login, register, sendWhatsAppOtp, verifyWhatsAppOtp } from './auth.controller';
import { validateRequest } from '../../middleware/validate';
import { loginSchema, registerSchema, sendOtpSchema, verifyOtpSchema } from './auth.schema';

const router = Router();

router.post('/login', validateRequest(loginSchema), login);
router.post('/register', validateRequest(registerSchema), register);
router.post('/whatsapp/send-otp', validateRequest(sendOtpSchema), sendWhatsAppOtp);
router.post('/whatsapp/verify-otp', validateRequest(verifyOtpSchema), verifyWhatsAppOtp);

export default router;
