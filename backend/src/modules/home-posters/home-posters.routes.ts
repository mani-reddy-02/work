import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { Role } from '@prisma/client';
import { 
  getAdminPosters, 
  getPublicPosters, 
  createPoster, 
  updatePoster, 
  updatePosterStatus, 
  deletePoster, 
  reorderPosters 
} from './home-posters.controller';

const router = Router();

// Public route for user app
router.get('/', getPublicPosters);

// Admin routes
router.get('/admin', authenticate, requireRole([Role.SUPER_ADMIN]), getAdminPosters);
router.post('/admin', authenticate, requireRole([Role.SUPER_ADMIN]), createPoster);
router.patch('/admin/order', authenticate, requireRole([Role.SUPER_ADMIN]), reorderPosters);
router.patch('/admin/:id', authenticate, requireRole([Role.SUPER_ADMIN]), updatePoster);
router.patch('/admin/:id/status', authenticate, requireRole([Role.SUPER_ADMIN]), updatePosterStatus);
router.delete('/admin/:id', authenticate, requireRole([Role.SUPER_ADMIN]), deletePoster);

export default router;
