import { Router } from 'express';
import {
  healthEducationChat,
  symptomTriage,
  getSupportedDepartments,
  getHealthAiStatus
} from './health-ai.controller';

const router = Router();

// Public routes for patient health education and department navigation
router.get('/status', getHealthAiStatus);
router.get('/departments', getSupportedDepartments);
router.post('/chat', healthEducationChat);
router.post('/triage', symptomTriage);

export default router;
