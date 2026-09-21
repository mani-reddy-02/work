import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { 
  streamNotifications, 
  getNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead 
} from './notifications.controller';

const router = Router();

// Real-time SSE event stream (authenticated via Bearer header or ?token= query param)
router.get('/stream', streamNotifications);

// Protected REST operations
router.get('/', authenticate, getNotifications);
router.get('/unread-count', authenticate, getUnreadCount);
router.patch('/:id/read', authenticate, markAsRead);
router.post('/read-all', authenticate, markAllAsRead);

export default router;
