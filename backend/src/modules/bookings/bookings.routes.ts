import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import { createWalkInBookingSchema, updateBookingStatusSchema } from './bookings.schema';
import { createWalkInBooking, getTodayBookings, updateBookingStatus } from './bookings.controller';
import { updateAppointmentVitals } from '../appointments/appointments.controller';

const router = Router();

// These routes require user to be authenticated and belong to a hospital
router.use(authenticate);

// GET today's bookings for the hospital (admins, receptionists, and doctors)
router.get('/', requireRole(['HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR']), getTodayBookings);

// POST a new walk-in booking (admins and receptionists only)
router.post('/walk-in', requireRole(['HOSPITAL_ADMIN', 'RECEPTIONIST']), validateRequest(createWalkInBookingSchema), createWalkInBooking);

// PATCH booking status (admins, receptionists, and doctors)
router.patch('/:id/status', requireRole(['HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR']), validateRequest(updateBookingStatusSchema), updateBookingStatus);

// PATCH booking vitals (admins, receptionists, and doctors)
router.patch('/:id/vitals', requireRole(['HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR']), updateAppointmentVitals);

export default router;
