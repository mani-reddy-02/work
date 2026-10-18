import { Router } from 'express';
import { 
  getDoctors, 
  getDoctorById, 
  updateDoctorActiveStatus, 
  getHospitalDoctorsStatus, 
  getMyDoctorStatus 
} from './doctors.controller';
import { 
  getMyDoctorSchedule, 
  updateMyDoctorSchedule, 
  getDoctorAvailableSlots 
} from './doctor-schedule.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { getMe } from '../users/users.controller';

const router = Router();

// Profile alias endpoints
router.get('/profile', authenticate, getMe);
router.get('/me', authenticate, getMe);

// Doctor live override status & hospital doctor status list (BEFORE /:id)
router.get('/status/mine', authenticate, requireRole(['DOCTOR']), getMyDoctorStatus);
router.get('/status', authenticate, requireRole(['RECEPTIONIST', 'HOSPITAL_ADMIN', 'DOCTOR', 'SUPER_ADMIN']), getHospitalDoctorsStatus);
router.get('/hospital/:hospitalId/status', authenticate, requireRole(['RECEPTIONIST', 'HOSPITAL_ADMIN', 'DOCTOR', 'SUPER_ADMIN']), getHospitalDoctorsStatus);
router.patch('/:id/active-status', authenticate, requireRole(['RECEPTIONIST', 'HOSPITAL_ADMIN', 'DOCTOR', 'SUPER_ADMIN']), updateDoctorActiveStatus);
router.patch('/:id/override-status', authenticate, requireRole(['RECEPTIONIST', 'HOSPITAL_ADMIN', 'DOCTOR', 'SUPER_ADMIN']), updateDoctorActiveStatus);

// Doctor schedule configuration routes (Protected for DOCTOR)
router.get('/schedule', authenticate, requireRole(['DOCTOR', 'SUPER_ADMIN']), getMyDoctorSchedule);
router.post('/schedule', authenticate, requireRole(['DOCTOR', 'SUPER_ADMIN']), updateMyDoctorSchedule);
router.put('/schedule', authenticate, requireRole(['DOCTOR', 'SUPER_ADMIN']), updateMyDoctorSchedule);

// Backward-compatible doctor availability endpoints
router.get('/me/availability', authenticate, requireRole(['DOCTOR', 'SUPER_ADMIN']), getMyDoctorSchedule);
router.put('/me/availability', authenticate, requireRole(['DOCTOR', 'SUPER_ADMIN']), updateMyDoctorSchedule);

// Doctor presence status endpoints
import { updateDoctorPresence, getDoctorPresence } from '../clinical/clinical.controller';
import { updatePresenceSchema } from '../clinical/clinical.schema';
import { validateRequest } from '../../middleware/validate';
router.get('/presence', authenticate, requireRole(['DOCTOR', 'SUPER_ADMIN']), getDoctorPresence);
router.patch('/presence', authenticate, requireRole(['DOCTOR', 'SUPER_ADMIN']), validateRequest(updatePresenceSchema), updateDoctorPresence);

// Public doctor discovery & dynamic slot query routes
router.get('/', getDoctors);
router.get('/:id/available-slots', getDoctorAvailableSlots);
router.get('/:id/availability', getDoctorAvailableSlots);
router.get('/:id', getDoctorById);

export default router;
