import { Router } from 'express';
import { getPublicHospitals, getPublicDepartments, getPublicDoctors, getLocationConfig, reverseGeocode } from './public.controller';

const router = Router();

router.get('/hospitals', getPublicHospitals);
router.get('/departments', getPublicDepartments);
router.get('/doctors', getPublicDoctors);
router.get('/location-config', getLocationConfig);
router.get('/reverse-geocode', reverseGeocode);

export default router;
