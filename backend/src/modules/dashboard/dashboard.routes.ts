import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { getHospitalDashboardOverview, getHospitalRevenueAnalytics } from './dashboard.controller';

const router = Router();

// Protect all hospital dashboard routes with authentication and staff roles
router.use(authenticate);
router.use(requireRole(['HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'SUPER_ADMIN']));

// GET /api/v1/hospital/dashboard/overview
router.get('/overview', getHospitalDashboardOverview);

// GET /api/v1/hospital/dashboard/revenue-analytics
router.get('/revenue-analytics', getHospitalRevenueAnalytics);

export default router;

