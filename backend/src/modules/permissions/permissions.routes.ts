import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import { Role } from '@prisma/client';
import { getPermissions, updatePermissions } from './permissions.controller';
import { getPermissionsSchema, updatePermissionsSchema } from './permissions.schema';

const router = Router();

// Only HOSPITAL_ADMIN can manage permissions
router.use(authenticate);
router.use(requireRole([Role.HOSPITAL_ADMIN]));

router.get('/roles/:role', validateRequest(getPermissionsSchema), getPermissions);
router.put('/roles/:role', validateRequest(updatePermissionsSchema), updatePermissions);

export default router;
