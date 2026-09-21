import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  createLabBooking,
  getMyLabBookings,
  getHospitalLabBookings,
  getLabBookingById,
  cancelLabBooking,
  updateLabBookingStatus
} from './lab-bookings.controller';

const router = Router();

// Enforce JWT authentication
router.use(authenticate);

router.post('/', createLabBooking);
router.get('/my', getMyLabBookings);
router.get('/hospital', getHospitalLabBookings);
router.get('/:id', getLabBookingById);
router.patch('/hospital/:id/status', updateLabBookingStatus);
router.patch('/:id/cancel', cancelLabBooking);

export default router;
