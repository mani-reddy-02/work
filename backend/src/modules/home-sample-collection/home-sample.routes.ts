import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import {
  getHomeSampleRequests,
  updateHomeSampleStatus,
  assignPhlebotomist
} from './home-sample.controller';

const router = Router();

router.use(authenticate);

router.get('/requests', requireRole(['HOSPITAL_ADMIN', 'SUPER_ADMIN']), getHomeSampleRequests);
router.patch('/requests/:id/status', requireRole(['HOSPITAL_ADMIN', 'SUPER_ADMIN']), updateHomeSampleStatus);
router.post('/requests/:id/assign', requireRole(['HOSPITAL_ADMIN', 'SUPER_ADMIN']), assignPhlebotomist);

export default router;
