import { Router } from 'express';
import { getHospitals, getHospitalById, getHospitalDoctors } from './hospitals.controller';

const router = Router();

router.get('/', getHospitals);
router.get('/:id', getHospitalById);
router.get('/:id/doctors', getHospitalDoctors);

export default router;
