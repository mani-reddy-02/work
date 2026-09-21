import { Router } from 'express';
import { getSpecialties, getLabDepartments, getPlatformLabTests } from './reference.controller';

const router = Router();

// Public route to get platform specialties and conditions
router.get('/specialties', getSpecialties);

router.get('/lab-departments', getLabDepartments);
router.get('/lab-tests', getPlatformLabTests);

export default router;
