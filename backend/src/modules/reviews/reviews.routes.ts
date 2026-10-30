import { Router } from 'express';
import reviewsController from './reviews.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// ==========================================
// Public Endpoints
// ==========================================
router.get('/public', reviewsController.getPublicReviews);

// ==========================================
// Patient Review Submission Endpoints
// ==========================================
router.get('/eligible/:bookingId', authenticate, reviewsController.getEligibleTargets);
router.post('/', authenticate, reviewsController.submitReview);
router.put('/:id', authenticate, reviewsController.editReview);
router.get('/my', authenticate, reviewsController.getMyReviews);

// ==========================================
// Provider (Hospital / Doctor / Lab) Endpoints
// ==========================================
router.get(
  '/provider',
  authenticate,
  requireRole([Role.HOSPITAL_ADMIN, Role.DOCTOR, Role.LAB_ADMIN, Role.SUPER_ADMIN]),
  reviewsController.getProviderReviews
);

router.get(
  '/provider/analytics',
  authenticate,
  requireRole([Role.HOSPITAL_ADMIN, Role.DOCTOR, Role.LAB_ADMIN, Role.SUPER_ADMIN]),
  reviewsController.getHospitalAnalytics
);

router.post(
  '/:id/response',
  authenticate,
  requireRole([Role.HOSPITAL_ADMIN, Role.DOCTOR, Role.LAB_ADMIN, Role.SUPER_ADMIN]),
  reviewsController.submitProviderResponse
);

// Reporting (patient or provider)
router.post('/:id/report', authenticate, reviewsController.reportReview);

// ==========================================
// Admin Moderation Endpoints
// ==========================================
router.get(
  '/admin',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  reviewsController.adminGetReviews
);

router.get(
  '/admin/analytics',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  reviewsController.adminGetAnalytics
);

router.post(
  '/admin/:id/moderate',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  reviewsController.adminModerateReview
);

router.post(
  '/admin/responses/:id/moderate',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  reviewsController.adminModerateResponse
);

router.post(
  '/admin/reports/:id/resolve',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  reviewsController.adminResolveReport
);

export default router;
