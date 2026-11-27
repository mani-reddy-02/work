import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  healthEducationChat,
  symptomTriage,
  getSupportedDepartments,
  getHealthAiStatus
} from './health-ai.controller';

const router = Router();

const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 45,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    success: false,
    error: { code: 'TOO_MANY_REQUESTS', message: 'Too many AI assistant requests. Please wait a few minutes.' }
  }
});

// Public routes for patient health education and department navigation
router.get('/status', getHealthAiStatus);
router.get('/departments', getSupportedDepartments);
router.post('/chat', aiRateLimiter, healthEducationChat);
router.post('/triage', aiRateLimiter, symptomTriage);

export default router;
