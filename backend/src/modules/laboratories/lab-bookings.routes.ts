import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  createLabBooking,
  getMyLabBookings,
  getLabBookingById,
  cancelLabBooking,
} from './lab-bookings.controller';

const router = Router();

// Enforce JWT authentication
router.use(authenticate);

router.post('/', createLabBooking);
router.get('/my', getMyLabBookings);
router.get('/:id', getLabBookingById);
router.patch('/:id/cancel', cancelLabBooking);

export default router;
