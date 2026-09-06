import { Router } from 'express';
import { getMe } from './users.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/me', authenticate, getMe);

export default router;
