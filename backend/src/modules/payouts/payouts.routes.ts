import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { getHospitalPayouts, getPartnerSettlements, getPartnerSettlementById } from './payouts.controller';

const router = Router();

// Protect hospital payout analytics routes with authentication and partner admin roles
router.use(authenticate);
router.use(requireRole(['HOSPITAL_ADMIN', 'LAB_ADMIN', 'SUPER_ADMIN']));

// GET /api/v1/hospital/payouts & /api/v1/hospital/payouts/analytics
router.get('/', getHospitalPayouts);
router.get('/analytics', getHospitalPayouts);

// Partner Settlements
router.get('/settlements', getPartnerSettlements);
router.get('/settlements/:id', getPartnerSettlementById);

export default router;

