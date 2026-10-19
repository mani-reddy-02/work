import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import {
  submitReview,
  getBookingReviewStatus,
  getMyReviews,
  getHospitalReviews,
  getDoctorReviews,
  getHospitalDashboardReviews,
  getAdminReviews,
  getAdminReviewStats,
  moderateReview
} from './reviews.controller';

const router = Router();

// Public review retrieval & aggregation
router.get('/hospital/:hospitalId', getHospitalReviews);
router.get('/doctor/:doctorId', getDoctorReviews);

// Authenticated user (patient) review actions
router.post('/', authenticate, submitReview);
router.get('/booking/:bookingId', authenticate, getBookingReviewStatus);
router.get('/my-reviews', authenticate, getMyReviews);

// Hospital portal reviews (Authorized hospital admin & staff)
router.get(
  '/hospital-dashboard',
  authenticate,
  requireRole(['HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'SUPER_ADMIN']),
  getHospitalDashboardReviews
);

// Admin review management & moderation (Super Admin only)
router.get('/admin', authenticate, requireRole(['SUPER_ADMIN']), getAdminReviews);
router.get('/admin/stats', authenticate, requireRole(['SUPER_ADMIN']), getAdminReviewStats);
router.patch('/admin/:id/moderation', authenticate, requireRole(['SUPER_ADMIN']), moderateReview);

export default router;
