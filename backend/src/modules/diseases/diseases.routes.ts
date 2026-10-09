import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permissions';
import { getDiseases, getDiseaseById, createDisease, updateDisease, deleteDisease } from './diseases.controller';

const router = Router();

router.get('/', getDiseases);
router.get('/:id', getDiseaseById);
router.post('/', authenticate, requirePermission('departments.create'), createDisease);
router.patch('/:id', authenticate, requirePermission('departments.update'), updateDisease);
router.delete('/:id', authenticate, requirePermission('departments.delete'), deleteDisease);

export default router;
