import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { createAppointment, getAppointmentById, getMyAppointments } from './appointments.controller';

const router = Router();

// Protected by JWT authentication
router.use(authenticate);

router.post('/', createAppointment);
router.get('/my', getMyAppointments);
router.get('/:id', getAppointmentById);

export default router;
