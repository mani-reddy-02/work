import { Router } from 'express';
import { getDiseases, getDiseaseById } from './diseases.controller';

const router = Router();

router.get('/', getDiseases);
router.get('/:id', getDiseaseById);

export default router;
