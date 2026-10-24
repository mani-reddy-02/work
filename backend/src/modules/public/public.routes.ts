import { Router } from 'express';
import { getPublicHospitals, getPublicDepartments, getPublicDoctors, getLocationConfig } from './public.controller';

const router = Router();

router.get('/hospitals', getPublicHospitals);
router.get('/departments', getPublicDepartments);
router.get('/doctors', getPublicDoctors);
router.get('/location-config', getLocationConfig);

export default router;
