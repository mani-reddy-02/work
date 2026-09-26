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
} from './home-nursing.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

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

// Hospital Management endpoints (Authenticated)
router.get('/hospital/bookings', authenticate, getHospitalNursingBookings);
router.patch('/hospital/bookings/:id/assign', authenticate, assignNurseToBooking);
router.get('/hospital/nurses', authenticate, getHospitalNursesList);

// Protected patient booking endpoints
router.post('/bookings', authenticate, createNursingBooking);
router.get('/bookings/my', authenticate, getMyNursingBookings);
router.get('/bookings/:id', authenticate, getNursingBookingById);
router.patch('/bookings/:id/cancel', authenticate, cancelNursingBooking);

export default router;
