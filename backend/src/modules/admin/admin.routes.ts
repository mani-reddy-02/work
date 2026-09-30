import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { Role } from '@prisma/client';
import { getStats, getHospitals, getUsers, getAppointments } from './admin.controller';
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
router.get('/users', getUsers);
router.get('/appointments', getAppointments);
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
