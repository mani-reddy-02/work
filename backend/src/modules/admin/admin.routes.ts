import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { Role } from '@prisma/client';
import { getStats, getHospitals, getUsers } from './admin.controller';

const router = Router();

// Protect all admin routes: must be authenticated and have SUPER_ADMIN role
router.use(authenticate);
router.use(requireRole([Role.SUPER_ADMIN]));

router.get('/stats', getStats);
router.get('/hospitals', getHospitals);
router.get('/users', getUsers);

export default router;
