import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permissions';
import { validateRequest } from '../../middleware/validate';
import { Role } from '@prisma/client';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from './departments.controller';
import { createDepartmentSchema, updateDepartmentSchema } from './departments.schema';

const router = Router();

// All department routes require authentication
router.use(authenticate);

router.get('/', getDepartments); // Read-only: any authenticated hospital user can view their departments
router.post('/', requirePermission('departments.create'), validateRequest(createDepartmentSchema), createDepartment);
router.patch('/:id', requirePermission('departments.update'), validateRequest(updateDepartmentSchema), updateDepartment);
router.delete('/:id', requirePermission('departments.delete'), deleteDepartment);

export default router;
