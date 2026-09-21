import { Router } from 'express';
import { getMe, updateMe, changePassword } from './users.controller';
import { authenticate } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import { updateProfileSchema } from './users.schema';

const router = Router();

router.get('/me', authenticate, getMe);
router.put('/me', authenticate, validateRequest(updateProfileSchema), updateMe);
router.patch('/me', authenticate, validateRequest(updateProfileSchema), updateMe);
router.post('/change-password', authenticate, changePassword);

export default router;
