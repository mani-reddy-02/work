import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permissions';
import { validateRequest } from '../../middleware/validate';
import { Role } from '@prisma/client';
import { getStaff, createStaff, updateStaff, deactivateStaff } from './staff.controller';
import { createStaffSchema, updateStaffSchema } from './staff.schema';

const router = Router();

// All staff management routes require authentication
router.use(authenticate);

router.get('/', requirePermission('staff.view'), getStaff);
router.post('/', requirePermission('staff.create'), validateRequest(createStaffSchema), createStaff);
router.patch('/:id', requirePermission('staff.update'), validateRequest(updateStaffSchema), updateStaff);
router.delete('/:id', requirePermission('staff.delete'), deactivateStaff);

export default router;
