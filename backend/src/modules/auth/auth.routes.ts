import { Router } from 'express';
import { login, register } from './auth.controller';
import { validateRequest } from '../../middleware/validate';
import { loginSchema, registerSchema } from './auth.schema';

const router = Router();

router.post('/login', validateRequest(loginSchema), login);
router.post('/register', validateRequest(registerSchema), register);

export default router;
