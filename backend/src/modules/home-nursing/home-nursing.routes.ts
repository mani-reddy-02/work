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

// Protected patient booking endpoints
router.post('/bookings', authenticate, createNursingBooking);
router.get('/bookings/my', authenticate, getMyNursingBookings);
router.get('/bookings/:id', authenticate, getNursingBookingById);
router.patch('/bookings/:id/cancel', authenticate, cancelNursingBooking);

export default router;
