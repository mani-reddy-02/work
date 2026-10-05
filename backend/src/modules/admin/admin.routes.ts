import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { Role } from '@prisma/client';
import { getStats, getHospitals, getUsers, getAppointments, updateHospitalRevenueShare, getUserById, getHospitalById, getAppointmentById, updateAppointmentStatus, getLabBookings, getLabBookingById, updateLabBookingStatus, getHomeNursingBookings, getHomeNursingBookingById, updateHomeNursingBookingStatus } from './admin.controller';
import {
  getAllHospitalRequests,
  updateRequestStatus,
} from '../hospital-requests/hospital-requests.controller';

import {
  getAdminDepartments,
  getAdminDepartmentById,
  createAdminDepartment,
  updateAdminDepartment,
  createAdminDisease,
  updateAdminDisease,
  deleteAdminDisease
} from './admin-departments.controller';

const router = Router();

// Protect all admin routes: must be authenticated and have SUPER_ADMIN role
router.use(authenticate);
router.use(requireRole([Role.SUPER_ADMIN]));

router.get('/stats', getStats);
router.get('/hospitals', getHospitals);
router.get('/hospitals/:id', getHospitalById);
router.patch('/hospitals/:hospitalId/revenue-share', updateHospitalRevenueShare);
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.get('/appointments', getAppointments);
router.get('/appointments/:id', getAppointmentById);
router.patch('/appointments/:id/status', updateAppointmentStatus);

router.get('/lab-bookings', getLabBookings);
router.get('/lab-bookings/:id', getLabBookingById);
router.patch('/lab-bookings/:id/status', updateLabBookingStatus);

router.get('/home-nursing', getHomeNursingBookings);
router.get('/home-nursing/:id', getHomeNursingBookingById);
router.patch('/home-nursing/:id/status', updateHomeNursingBookingStatus);
router.get('/hospital-requests', getAllHospitalRequests);
router.patch('/hospital-requests/:type/:id/status', updateRequestStatus);

// Department & Disease Management Routes
router.post('/departments', createAdminDepartment);
router.patch('/departments/:id', updateAdminDepartment);
router.get('/departments', getAdminDepartments);
router.get('/departments/:id', getAdminDepartmentById);
router.post('/departments/:id/diseases', createAdminDisease);
router.patch('/diseases/:diseaseId', updateAdminDisease);
router.delete('/diseases/:diseaseId', deleteAdminDisease);

export default router;
