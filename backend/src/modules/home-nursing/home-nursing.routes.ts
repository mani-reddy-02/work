import { Router } from 'express';
import {
  getNursingServices,
  getNursingCategories,
  getNursingServiceById,
  getNursingServiceProviders,
  getHospitalNurses,
  getNursingAvailability,
  createNursingBooking,
  getMyNursingBookings,
  getNursingBookingById,
  cancelNursingBooking,
  getNurseDashboard,
  getNurseVisits,
  updateNurseVisitStatus,
  getHospitalNursingBookings,
  assignNurseToBooking,
  getHospitalNursesList,
  getAdminNursingStats,
  getAdminNursingServices,
  createAdminNursingService,
  updateAdminNursingService,
  deleteAdminNursingService,
  getHospitalServiceOfferings,
  toggleHospitalServiceOffering,
  saveHospitalServiceOfferings,
  deleteHospitalServiceOffering,
} from './home-nursing.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Admin Management endpoints (Authenticated & Super Admin)
router.get('/admin/stats', authenticate, requireRole([Role.SUPER_ADMIN]), getAdminNursingStats);
router.get('/admin/services', authenticate, requireRole([Role.SUPER_ADMIN]), getAdminNursingServices);
router.post('/admin/services', authenticate, requireRole([Role.SUPER_ADMIN]), createAdminNursingService);
router.patch('/admin/services/:id', authenticate, requireRole([Role.SUPER_ADMIN]), updateAdminNursingService);
router.delete('/admin/services/:id', authenticate, requireRole([Role.SUPER_ADMIN]), deleteAdminNursingService);

// Hospital Offerings endpoints (Authenticated Hospital Admin & Super Admin)
router.get('/hospital/offerings', authenticate, requireRole([Role.HOSPITAL_ADMIN, Role.SUPER_ADMIN]), getHospitalServiceOfferings);
router.get('/hospital/services-offered', authenticate, requireRole([Role.HOSPITAL_ADMIN, Role.SUPER_ADMIN]), getHospitalServiceOfferings);
router.post('/hospital/offerings/toggle', authenticate, requireRole([Role.HOSPITAL_ADMIN, Role.SUPER_ADMIN]), toggleHospitalServiceOffering);
router.post('/hospital/services-offered/toggle', authenticate, requireRole([Role.HOSPITAL_ADMIN, Role.SUPER_ADMIN]), toggleHospitalServiceOffering);
router.post('/hospital/offerings/save', authenticate, requireRole([Role.HOSPITAL_ADMIN, Role.SUPER_ADMIN]), saveHospitalServiceOfferings);
router.delete('/hospital/offerings/:serviceId', authenticate, requireRole([Role.HOSPITAL_ADMIN, Role.SUPER_ADMIN]), deleteHospitalServiceOffering);

// Public discovery endpoints
router.get('/services', getNursingServices);
router.get('/services/categories', getNursingCategories);
router.get('/services/:id', getNursingServiceById);
router.get('/services/:id/providers', getNursingServiceProviders);
router.get('/services/:id/availability', getNursingAvailability);
router.get('/hospitals/:id/nurses', getHospitalNurses);

// Nurse Dashboard & Visits endpoints (Authenticated)
router.get('/nurse/dashboard', authenticate, getNurseDashboard);
router.get('/nurse/visits', authenticate, getNurseVisits);
router.patch('/nurse/visits/:id/status', authenticate, updateNurseVisitStatus);

// Hospital Management endpoints (Authenticated Hospital Admin & Receptionist)
router.get('/hospital/bookings', authenticate, getHospitalNursingBookings);
router.patch('/hospital/bookings/:id/assign', authenticate, assignNurseToBooking);
router.patch('/hospital/bookings/:id/status', authenticate, updateNurseVisitStatus);
router.get('/hospital/nurses', authenticate, getHospitalNursesList);

// Protected patient booking endpoints
router.post('/bookings', authenticate, createNursingBooking);
router.get('/bookings/my', authenticate, getMyNursingBookings);
router.get('/bookings/:id', authenticate, getNursingBookingById);
router.patch('/bookings/:id/status', authenticate, updateNurseVisitStatus);
router.patch('/bookings/:id/cancel', authenticate, cancelNursingBooking);

export default router;
