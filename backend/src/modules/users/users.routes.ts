import { Router } from 'express';
import { getMe, updateMe } from './users.controller';
import { authenticate } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import { updateProfileSchema } from './users.schema';

const router = Router();

router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, validateRequest(updateProfileSchema), updateMe);

export default router;
