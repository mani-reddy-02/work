import { Router } from 'express';
import { authenticate, requireRole, optionalAuthenticate } from '../../middleware/auth';
import { Role } from '@prisma/client';
import {
  getPublicInsurances,
  getAdminInsurances,
  getInsuranceStats,
  getInsuranceById,
  createInsurance,
  updateInsurance,
  deleteInsurance,
  selectInsurancePlan,
  getInsuranceLogs,
} from './insurance.controller';

const router = Router();

// Public User App endpoint
router.get('/', getPublicInsurances);
router.get('/stats', getInsuranceStats);
router.post('/:id/select', optionalAuthenticate, selectInsurancePlan);

// Super Admin Management endpoints
router.get('/admin', authenticate, requireRole([Role.SUPER_ADMIN]), getAdminInsurances);
router.get('/admin/stats', authenticate, requireRole([Role.SUPER_ADMIN]), getInsuranceStats);
router.get('/admin/logs', authenticate, requireRole([Role.SUPER_ADMIN]), getInsuranceLogs);
router.get('/admin/:id', authenticate, requireRole([Role.SUPER_ADMIN]), getInsuranceById);
router.post('/admin', authenticate, requireRole([Role.SUPER_ADMIN]), createInsurance);
router.patch('/admin/:id', authenticate, requireRole([Role.SUPER_ADMIN]), updateInsurance);
router.put('/admin/:id', authenticate, requireRole([Role.SUPER_ADMIN]), updateInsurance);
router.delete('/admin/:id', authenticate, requireRole([Role.SUPER_ADMIN]), deleteInsurance);

// General detail lookup
router.get('/:id', getInsuranceById);

export default router;
