import { Router } from 'express';
import { getHospitals, getHospitalById, getHospitalDoctors, getHospitalDepartments, getHospitalLaboratories } from './hospitals.controller';

const router = Router();

router.get('/', getHospitals);
router.get('/:id', getHospitalById);
router.get('/:id/departments', getHospitalDepartments);
router.get('/:id/doctors', getHospitalDoctors);
router.get('/:id/laboratories', getHospitalLaboratories);

export default router;
