import { Response } from 'express';
import { prisma } from '../../config/prisma';

export interface CreateNotificationParams {
  hospitalId?: string | null;
  userId?: string | null;
  title: string;
  message: string;
  type?: 'appointment' | 'department' | 'staff' | 'lab' | 'activity' | 'alert' | 'success' | string;
  metadata?: any;
}

class NotificationStreamManager {
  // Map of hospitalId -> Set of active Express SSE Response objects
  private hospitalClients = new Map<string, Set<Response>>();
  // Map of userId -> Set of active Express SSE Response objects
  private userClients = new Map<string, Set<Response>>();

  addClient(hospitalId: string | null | undefined, userId: string | null | undefined, res: Response) {
    if (hospitalId) {
      if (!this.hospitalClients.has(hospitalId)) {
        this.hospitalClients.set(hospitalId, new Set());
      }
      this.hospitalClients.get(hospitalId)!.add(res);
    }

    if (userId) {
      if (!this.userClients.has(userId)) {
        this.userClients.set(userId, new Set());
      }
      this.userClients.get(userId)!.add(res);
    }
  }

  removeClient(hospitalId: string | null | undefined, userId: string | null | undefined, res: Response) {
    if (hospitalId && this.hospitalClients.has(hospitalId)) {
      const set = this.hospitalClients.get(hospitalId)!;
      set.delete(res);
      if (set.size === 0) {
        this.hospitalClients.delete(hospitalId);
      }
    }

    if (userId && this.userClients.has(userId)) {
      const set = this.userClients.get(userId)!;
      set.delete(res);
      if (set.size === 0) {
        this.userClients.delete(userId);
      }
    }
  }

  broadcast(notification: any) {
    const data = `data: ${JSON.stringify(notification)}\n\n`;
    const targetClients = new Set<Response>();

    if (notification.hospitalId && this.hospitalClients.has(notification.hospitalId)) {
      for (const res of this.hospitalClients.get(notification.hospitalId)!) {
        targetClients.add(res);
      }
    }

    if (notification.userId && this.userClients.has(notification.userId)) {
      for (const res of this.userClients.get(notification.userId)!) {
        targetClients.add(res);
      }
    }

    for (const res of targetClients) {
      try {
        res.write(data);
      } catch (err) {
        // Ignore dead socket writes; cleanup will happen on req close
      }
    }
  }
}

export const notificationStreamManager = new NotificationStreamManager();

/**
 * Persists a notification to the database and broadcasts it in real-time
 */
export async function sendNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        hospitalId: params.hospitalId || null,
        userId: params.userId || null,
        title: params.title,
        message: params.message,
        type: params.type || 'appointment',
        metadata: params.metadata || null,
        read: false
      }
    });

    // Broadcast over real-time SSE stream
    notificationStreamManager.broadcast({
      id: notification.id,
      hospitalId: notification.hospitalId,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      read: notification.read,
      metadata: notification.metadata,
      createdAt: notification.createdAt
    });

    return notification;
  } catch (error) {
    console.error('Failed to create and broadcast notification:', error);
    return null;
  }
}

export async function getNotifications(params: {
  hospitalId?: string | null;
  userId?: string | null;
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}) {
  const { hospitalId, userId, limit = 50, offset = 0, unreadOnly = false } = params;

  const where: any = {};
  if (hospitalId) {
    where.hospitalId = hospitalId;
  }
  if (userId) {
    where.OR = [
      { userId },
      ...(hospitalId ? [{ hospitalId, userId: null }] : [])
    ];
  }
  if (unreadOnly) {
    where.read = false;
  }

  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    }),
    prisma.notification.count({ where })
  ]);

  return { items, total };
}

export async function getUnreadCount(params: {
  hospitalId?: string | null;
  userId?: string | null;
}) {
  const { hospitalId, userId } = params;
  const where: any = { read: false };

  if (hospitalId) {
    where.hospitalId = hospitalId;
  }
  if (userId) {
    where.OR = [
      { userId, read: false },
      ...(hospitalId ? [{ hospitalId, userId: null, read: false }] : [])
    ];
  }

  return await prisma.notification.count({ where });
}

export async function markAsRead(id: string, hospitalId?: string | null) {
  const where: any = { id };
  if (hospitalId) {
    where.hospitalId = hospitalId;
  }

  return await prisma.notification.updateMany({
    where,
    data: { read: true }
  });
}

export async function markAllAsRead(params: { hospitalId?: string | null; userId?: string | null }) {
  const { hospitalId, userId } = params;
  const where: any = { read: false };

  if (hospitalId) {
    where.hospitalId = hospitalId;
  }
  if (userId) {
    where.userId = userId;
  }

  return await prisma.notification.updateMany({
    where,
    data: { read: true }
  });
}
