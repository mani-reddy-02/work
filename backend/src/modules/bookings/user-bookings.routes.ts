import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { getNearestUpcomingBooking } from './user-bookings.controller';

const router = Router();

router.use(authenticate);

router.get('/upcoming', getNearestUpcomingBooking);

export default router;
