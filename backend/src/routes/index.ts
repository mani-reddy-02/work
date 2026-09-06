import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import usersRoutes from '../modules/users/users.routes';
import { prisma } from '../config/prisma';

const router = Router();

// Health Checks
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is healthy' });
});

router.get('/health/db', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, message: 'Database is healthy' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database connection failed' });
  }
});

// API Routes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);

export default router;
