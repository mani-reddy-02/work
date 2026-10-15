import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { Role } from '@prisma/client';
import {
  getPublicFaqs,
  getAdminFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
  reorderFaqs
} from './faqs.controller';

const router = Router();

// Public route for User App
router.get('/', getPublicFaqs);

// Super Admin Management routes
router.get('/admin', authenticate, requireRole([Role.SUPER_ADMIN]), getAdminFaqs);
router.post('/admin', authenticate, requireRole([Role.SUPER_ADMIN]), createFaq);
router.patch('/admin/reorder', authenticate, requireRole([Role.SUPER_ADMIN]), reorderFaqs);
router.patch('/admin/:id', authenticate, requireRole([Role.SUPER_ADMIN]), updateFaq);
router.delete('/admin/:id', authenticate, requireRole([Role.SUPER_ADMIN]), deleteFaq);

export default router;
