import { Router } from 'express';
import { 
  recordConsultation, 
  getPatientHistory, 
  updateDoctorPresence, 
  getDoctorPresence 
} from './clinical.controller';
import { 
  recordConsultationSchema, 
  updatePresenceSchema 
} from './clinical.schema';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';

const router = Router();

// Require authenticated DOCTOR or SUPER_ADMIN for all clinical consultation endpoints
router.use(authenticate, requireRole(['DOCTOR', 'SUPER_ADMIN']));

// 1. Consultation Recording & Completion
router.post('/consultations/:bookingId/record', validateRequest(recordConsultationSchema), recordConsultation);

// 2. Patient Longitudinal Clinical History
router.get('/patients/:patientId/history', getPatientHistory);
router.get('/patient-history', getPatientHistory);

// 3. Doctor Operational Presence Controls
router.get('/presence', getDoctorPresence);
router.patch('/presence', validateRequest(updatePresenceSchema), updateDoctorPresence);

export default router;
