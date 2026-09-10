import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  getHomeSampleTests,
  getHomeSampleCategories,
  getHomeSampleTestById,
  getHomeSampleProvidersForTest,
  getHomeSampleAvailability,
  createHomeSampleBooking,
  getMyHomeSampleBookings,
  getHomeSampleBookingById,
  cancelHomeSampleBooking,
} from './home-sample.controller';

const router = Router();

// Public test and provider discovery
router.get('/tests', getHomeSampleTests);
router.get('/categories', getHomeSampleCategories);
router.get('/tests/:id', getHomeSampleTestById);
router.get('/tests/:id/laboratories', getHomeSampleProvidersForTest);
router.get('/tests/:id/providers', getHomeSampleProvidersForTest);
router.get('/laboratories/:id/availability', getHomeSampleAvailability);
router.get('/availability', getHomeSampleAvailability);

// Authenticated booking operations
router.post('/bookings', authenticate, createHomeSampleBooking);
router.get('/bookings/my', authenticate, getMyHomeSampleBookings);
router.get('/bookings/:id', authenticate, getHomeSampleBookingById);
router.patch('/bookings/:id/cancel', authenticate, cancelHomeSampleBooking);

export default router;
