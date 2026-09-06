import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import { Role } from '@prisma/client';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from './departments.controller';
import { createDepartmentSchema, updateDepartmentSchema } from './departments.schema';

const router = Router();

// All department routes require authentication and HOSPITAL_ADMIN role
router.use(authenticate);
router.use(requireRole([Role.HOSPITAL_ADMIN]));

router.get('/', getDepartments);
router.post('/', validateRequest(createDepartmentSchema), createDepartment);
router.patch('/:id', validateRequest(updateDepartmentSchema), updateDepartment);
router.delete('/:id', deleteDepartment);

export default router;
