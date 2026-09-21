import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { Role } from '@prisma/client';
import { getStats, getHospitals, getUsers } from './admin.controller';
import {
  getAllHospitalRequests,
  updateRequestStatus,
} from '../hospital-requests/hospital-requests.controller';

const router = Router();

// Protect all admin routes: must be authenticated and have SUPER_ADMIN role
router.use(authenticate);
router.use(requireRole([Role.SUPER_ADMIN]));

router.get('/stats', getStats);
router.get('/hospitals', getHospitals);
router.get('/users', getUsers);
router.get('/hospital-requests', getAllHospitalRequests);
router.patch('/hospital-requests/:type/:id/status', updateRequestStatus);

export default router;
