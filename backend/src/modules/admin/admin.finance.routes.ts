import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { Role } from '@prisma/client';
import {
  getTransactions,
  getTransactionById,
  getRevenueAnalytics,
  getSettlements
} from './admin.finance.controller';

const router = Router();

// Protect admin finance routes with authentication and SUPER_ADMIN role
router.use(authenticate);
router.use(requireRole([Role.SUPER_ADMIN]));

router.get('/transactions', getTransactions);
router.get('/transactions/:id', getTransactionById);
router.get('/revenue', getRevenueAnalytics);
router.get('/settlements', getSettlements);

export default router;
