import { Router } from 'express';
import {
  getLabTests,
  getTestCategories,
  getLabTestById,
  getLaboratoriesForTest,
} from './lab-tests.controller';

const router = Router();

router.get('/', getLabTests);
router.get('/categories', getTestCategories);
router.get('/:id', getLabTestById);
router.get('/:id/laboratories', getLaboratoriesForTest);

export default router;
