import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { prisma } from '../../config/prisma';
import { Role } from '@prisma/client';
import { 
  notificationStreamManager, 
  getNotifications as fetchNotifications, 
  getUnreadCount as fetchUnreadCount,
  markAsRead as updateMarkAsRead,
  markAllAsRead as updateMarkAllAsRead,
  deleteAllNotifications as clearAllNotificationsService
} from './notifications.service';

/**
 * GET /api/v1/notifications/stream
 * Real-time Server-Sent Events (SSE) stream.
 * Authenticated via Bearer token header or ?token= query parameter (for EventSource).
 * Subscribes user with their verified role and hospital association.
 */
export const streamNotifications = async (req: Request, res: Response) => {
  let user: { id: string; role: Role; hospitalId: string | null } | null = null;

  try {
    const token = (typeof req.query.token === 'string' ? req.query.token : null) ||
      (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

    if (!token) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, hospitalId: true, role: true, active: true }
    });

    if (!dbUser || !dbUser.active) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or inactive account' } });
      return;
    }

    user = {
      id: dbUser.id,
      role: dbUser.role,
      hospitalId: dbUser.hospitalId
    };
  } catch (error) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
    return;
  }

  // Set standard SSE response headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering (Nginx, etc.)
  res.flushHeaders();

  // Register client with verified identity, role, and hospital
  notificationStreamManager.addClient({
    res,
    userId: user.id,
    role: user.role,
    hospitalId: user.hospitalId
  });

  // Send initial handshake and live unread count matching this user's role
  const initialUnread = await fetchUnreadCount({
    role: user.role,
    userId: user.id,
    hospitalId: user.hospitalId
  });

  res.write(`data: ${JSON.stringify({ type: 'HANDSHAKE', unreadCount: initialUnread, timestamp: new Date().toISOString() })}\n\n`);

  // Periodic heartbeat every 25 seconds to keep connection alive
  const pingInterval = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch (e) {
      clearInterval(pingInterval);
    }
  }, 25000);

  // Cleanup on connection disconnect
  req.on('close', () => {
    clearInterval(pingInterval);
    notificationStreamManager.removeClient(res);
    res.end();
  });
};

/**
 * GET /api/v1/notifications
 * Retrieves paginated notifications for the authenticated user based strictly on their role & hospital.
 */
export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    const unreadOnly = req.query.unread === 'true';

    const result = await fetchNotifications({
      role: user.role,
      userId: user.id,
      hospitalId: user.hospitalId,
      limit,
      offset,
      unreadOnly
    });

    res.json({
      success: true,
      data: result.items,
      total: result.total
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/notifications/unread-count
 * Returns the current unread notifications count for the authenticated user and role.
 */
export const getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    const count = await fetchUnreadCount({
      role: user.role,
      userId: user.id,
      hospitalId: user.hospitalId
    });

    res.json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/notifications/:id/read
 * Marks a specific notification as read, enforcing role and ownership authorization.
 */
export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    await updateMarkAsRead(id as string, {
      role: user.role,
      userId: user.id,
      hospitalId: user.hospitalId
    });

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/notifications/read-all
 * Marks all notifications for the authenticated user's role and hospital as read.
 */
export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    await updateMarkAllAsRead({
      role: user.role,
      userId: user.id,
      hospitalId: user.hospitalId
    });

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/notifications
 * Clears/deletes all notifications for the authenticated user's role and hospital.
 */
export const clearAllNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    await clearAllNotificationsService({
      role: user.role,
      userId: user.id,
      hospitalId: user.hospitalId
    });

    res.json({
      success: true,
      message: 'All notifications cleared successfully'
    });
  } catch (error) {
    next(error);
  }
};

