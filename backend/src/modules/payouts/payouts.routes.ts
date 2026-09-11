import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { getHospitalPayouts } from './payouts.controller';

const router = Router();

// Protect hospital payout analytics routes with authentication and admin roles
router.use(authenticate);
router.use(requireRole(['HOSPITAL_ADMIN', 'SUPER_ADMIN']));

// GET /api/v1/hospital/payouts
router.get('/', getHospitalPayouts);

export default router;
