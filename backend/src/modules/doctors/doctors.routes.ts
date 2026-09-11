import { Router } from 'express';
import { getDoctors, getDoctorById } from './doctors.controller';
import { 
  getMyDoctorSchedule, 
  updateMyDoctorSchedule, 
  getDoctorAvailableSlots 
} from './doctor-schedule.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

// Doctor schedule configuration routes (Protected for DOCTOR)
router.get('/schedule', authenticate, requireRole(['DOCTOR', 'SUPER_ADMIN']), getMyDoctorSchedule);
router.post('/schedule', authenticate, requireRole(['DOCTOR', 'SUPER_ADMIN']), updateMyDoctorSchedule);
router.put('/schedule', authenticate, requireRole(['DOCTOR', 'SUPER_ADMIN']), updateMyDoctorSchedule);

// Backward-compatible doctor availability endpoints
router.get('/me/availability', authenticate, requireRole(['DOCTOR', 'SUPER_ADMIN']), getMyDoctorSchedule);
router.put('/me/availability', authenticate, requireRole(['DOCTOR', 'SUPER_ADMIN']), updateMyDoctorSchedule);

// Public doctor discovery & dynamic slot query routes
router.get('/', getDoctors);
router.get('/:id/available-slots', getDoctorAvailableSlots);
router.get('/:id/availability', getDoctorAvailableSlots);
router.get('/:id', getDoctorById);

export default router;
