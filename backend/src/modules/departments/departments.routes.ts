import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permissions';
import { validateRequest } from '../../middleware/validate';
import { 
  getDepartments, 
  getDepartmentById, 
  getDepartmentDoctors, 
  createDepartment, 
  updateDepartment, 
  deleteDepartment 
} from './departments.controller';
import { createDepartmentSchema, updateDepartmentSchema } from './departments.schema';

const router = Router();

// Public discovery routes
router.get('/', getDepartments);
router.get('/:id', getDepartmentById);
router.get('/:id/doctors', getDepartmentDoctors);

// Protected hospital admin mutation routes
router.post('/', authenticate, requirePermission('departments.create'), validateRequest(createDepartmentSchema), createDepartment);
router.patch('/:id', authenticate, requirePermission('departments.update'), validateRequest(updateDepartmentSchema), updateDepartment);
router.delete('/:id', authenticate, requirePermission('departments.delete'), deleteDepartment);

export default router;
