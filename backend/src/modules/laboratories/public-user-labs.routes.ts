import { Router } from 'express';
import {
  getPublicLabTests,
  getPublicLabCategories,
  getEligibleLaboratories,
  getLaboratoryAvailability,
  getPublicLabTestById
} from './public-user-labs.controller';

const router = Router();

router.get('/', getPublicLabTests);
router.get('/categories', getPublicLabCategories);
router.get('/health-concerns', getPublicLabCategories); // Reusing for now
router.get('/laboratories/:laboratoryId/availability', getLaboratoryAvailability);
router.get('/:id', getPublicLabTestById);
router.get('/:id/laboratories', getEligibleLaboratories);

export default router;
