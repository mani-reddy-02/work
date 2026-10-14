import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { Role } from '@prisma/client';
import {
  getTransactions,
  getTransactionById,
  getRevenueAnalytics
} from './admin.finance.controller';
import {
  getSettlements,
  getSettlementById,
  generateSettlements,
  uploadSettlementAttachment,
  deleteSettlementAttachment,
  processManualPayout,
  getPayoutHistory,
  getPayoutRecordById
} from './admin.settlement.controller';

const router = Router();

// Protect admin finance routes with authentication and SUPER_ADMIN role
router.use(authenticate);
router.use(requireRole([Role.SUPER_ADMIN]));

router.get('/transactions', getTransactions);
router.get('/transactions/:id', getTransactionById);
router.get('/revenue', getRevenueAnalytics);

// Settlements & Payouts Workflow
router.get('/settlements', getSettlements);
router.post('/settlements/generate', generateSettlements);
router.get('/settlements/:id', getSettlementById);
router.post('/settlements/:id/attachments', uploadSettlementAttachment);
router.delete('/settlements/:id/attachments/:attachmentId', deleteSettlementAttachment);
router.post('/settlements/:id/payout', processManualPayout);

// Payout History
router.get('/payouts', getPayoutHistory);
router.get('/payouts/:id', getPayoutRecordById);

export default router;

