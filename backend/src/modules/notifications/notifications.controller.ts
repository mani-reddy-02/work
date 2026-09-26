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
  markAllAsRead as updateMarkAllAsRead
} from './notifications.service';

/**
 * GET /api/v1/notifications/stream
 * Real-time Server-Sent Events (SSE) stream.
 * Can be authenticated via Bearer token header or ?token= query parameter (for EventSource).
 */
export const streamNotifications = async (req: Request, res: Response) => {
  let userId: string | null = null;
  let hospitalId: string | null = null;

  try {
    const token = (typeof req.query.token === 'string' ? req.query.token : null) ||
      (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

    if (!token) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, hospitalId: true, role: true, active: true }
    });

    if (!user || !user.active) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or inactive account' } });
      return;
    }

    userId = user.id;
    // Nurses only receive notifications targeted directly to them, not generic hospital broadcasts
    hospitalId = user.role === Role.NURSE ? null : user.hospitalId;
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

  // Register client in stream manager
  notificationStreamManager.addClient(hospitalId, userId, res);

  // Send initial handshake and live unread count
  const initialUnread = await fetchUnreadCount({ hospitalId, userId });
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
    notificationStreamManager.removeClient(hospitalId, userId, res);
    res.end();
  });
};

/**
 * GET /api/v1/notifications
 * Retrieves paginated notifications for the authenticated user/hospital.
 */
export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isNurse = req.user?.role === Role.NURSE;
    const hospitalId = isNurse ? null : req.user?.hospitalId;
    const userId = req.user?.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    const unreadOnly = req.query.unread === 'true';

    const result = await fetchNotifications({
      hospitalId,
      userId,
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
 * Returns the current unread notifications count.
 */
export const getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isNurse = req.user?.role === Role.NURSE;
    const hospitalId = isNurse ? null : req.user?.hospitalId;
    const userId = req.user?.id;

    const count = await fetchUnreadCount({ hospitalId, userId });

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
 * Marks a specific notification as read.
 */
export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const isNurse = req.user?.role === Role.NURSE;
    const hospitalId = isNurse ? null : req.user?.hospitalId;

    await updateMarkAsRead(id as string, hospitalId);

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
 * Marks all notifications for the hospital as read.
 */
export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isNurse = req.user?.role === Role.NURSE;
    const hospitalId = isNurse ? null : req.user?.hospitalId;
    const userId = req.user?.id;

    await updateMarkAllAsRead({ hospitalId, userId });

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};
