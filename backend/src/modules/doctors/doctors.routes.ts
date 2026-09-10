import { Router } from 'express';
import { getDoctors, getDoctorById, getDoctorAvailability } from './doctors.controller';

const router = Router();

router.get('/', getDoctors);
router.get('/:id', getDoctorById);
router.get('/:id/availability', getDoctorAvailability);

export default router;
