import { Router } from 'express';
import { getPublicHospitals, getPublicDepartments, getPublicDoctors } from './public.controller';

const router = Router();

router.get('/hospitals', getPublicHospitals);
router.get('/departments', getPublicDepartments);
router.get('/doctors', getPublicDoctors);

export default router;
