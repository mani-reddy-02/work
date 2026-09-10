import { Router } from 'express';
import { getLaboratories, getLaboratoryById, getLaboratoryTests } from './laboratories.controller';
import { getLaboratoryAvailability } from './lab-tests.controller';

const router = Router();

router.get('/', getLaboratories);
router.get('/:id', getLaboratoryById);
router.get('/:id/tests', getLaboratoryTests);
router.get('/:id/availability', getLaboratoryAvailability);

export default router;
