import { Router } from 'express';
import {
  getLabTests,
  getTestCategories,
  getHealthConcerns,
  getLabTestById,
  getLaboratoriesForTest,
} from './lab-tests.controller';

const router = Router();

router.get('/', getLabTests);
router.get('/categories', getTestCategories);
router.get('/health-concerns', getHealthConcerns);
router.get('/:id', getLabTestById);
router.get('/:id/laboratories', getLaboratoriesForTest);

export default router;
