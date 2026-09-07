import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import { createWalkInBookingSchema, updateBookingStatusSchema } from './bookings.schema';
import { createWalkInBooking, getTodayBookings, updateBookingStatus } from './bookings.controller';

const router = Router();

// These routes require user to be authenticated and belong to a hospital
router.use(authenticate);
router.use(requireRole(['HOSPITAL_ADMIN', 'RECEPTIONIST']));

// GET today's bookings for the hospital
router.get('/', getTodayBookings);

// POST a new walk-in booking
router.post('/walk-in', validateRequest(createWalkInBookingSchema), createWalkInBooking);

// PATCH booking status
router.patch('/:id/status', validateRequest(updateBookingStatusSchema), updateBookingStatus);

export default router;
