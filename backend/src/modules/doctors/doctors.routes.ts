import { Router } from 'express';
import { getDoctorById, getDoctorAvailability } from './doctors.controller';

const router = Router();

router.get('/:id', getDoctorById);
router.get('/:id/availability', getDoctorAvailability);

export default router;
