import { Router } from 'express';
import { getSpecialties } from './reference.controller';

const router = Router();

// Public route to get platform specialties and conditions
router.get('/specialties', getSpecialties);

export default router;
