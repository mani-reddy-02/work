import { Response } from 'express';
import { prisma } from '../../config/prisma';
import { Role } from '@prisma/client';

export interface CreateNotificationParams {
  hospitalId?: string | null;
  userId?: string | null;
  title: string;
  message: string;
  type?: 'appointment' | 'department' | 'staff' | 'lab' | 'activity' | 'alert' | 'success' | string;
  metadata?: any;
  targetRoles?: (Role | string)[];
}

export interface StreamClient {
  res: Response;
  userId: string;
  role: Role;
  hospitalId: string | null;
}

/**
 * Core authorization evaluator: determines if a given notification is authorized
 * for a specific user based on their verified role, userId, and hospitalId.
 */
export function isNotificationAuthorizedForUser(
  notification: {
    hospitalId?: string | null;
    userId?: string | null;
    type?: string;
    title?: string;
    message?: string;
    metadata?: any;
  },
  userRole: Role | string,
  userId: string,
  userHospitalId?: string | null
): boolean {
  const role = userRole as Role;

  // 1. PATIENT: strictly their own notifications, never internal hospital operational alerts
  if (role === Role.PATIENT) {
    if (!notification.userId || notification.userId !== userId) {
      return false;
    }
    const notifType = (notification.type || '').toLowerCase();
    const title = (notification.title || '').toLowerCase();
    if (
      title.includes('new lab test order') ||
      title.includes('new op appointment') ||
      title.includes('walk-in op registered') ||
      title.includes('new home nursing booking') ||
      (notifType === 'lab' && !title.includes('report'))
    ) {
      return false;
    }
    return true;
  }

  // 2. SUPER_ADMIN: platform-wide administration
  if (role === Role.SUPER_ADMIN) {
    if (notification.userId === userId) return true;
    const notifType = (notification.type || '').toLowerCase();
    return ['marketing_request', 'camp_request', 'platform_inquiry'].includes(notifType);
  }

  // 3. HOSPITAL STAFF ROLES: Must belong to a hospital
  if (!userHospitalId) {
    return notification.userId === userId;
  }

  // Cross-hospital isolation: Never allow a user from Hospital A to receive Hospital B's alerts
  if (notification.hospitalId && notification.hospitalId !== userHospitalId) {
    return false;
  }

  // Check explicit targetRoles in metadata if provided
  const targetRoles: string[] = Array.isArray(notification.metadata?.targetRoles)
    ? notification.metadata.targetRoles
    : [];

  if (targetRoles.length > 0) {
    if (targetRoles.includes(role)) {
      // Doctor check: If role is DOCTOR, only the assigned doctor should see doctor appointments
      if (role === Role.DOCTOR && notification.userId && notification.userId !== userId) {
        return false;
      }
      return true;
    }
    if (notification.userId === userId) {
      return true;
    }
    return false;
  }

  // Fallback role resolution for existing notifications without metadata.targetRoles:
  const notifType = (notification.type || '').toLowerCase();
  const title = (notification.title || '').toLowerCase();

  // If directly addressed to this user
  if (notification.userId && notification.userId === userId) {
    return true;
  }

  // If addressed to another user
  if (notification.userId && notification.userId !== userId) {
    if (role === Role.HOSPITAL_ADMIN) {
      return Boolean(notification.hospitalId && notification.hospitalId === userHospitalId);
    }
    if (role === Role.RECEPTIONIST) {
      if (
        (notifType === 'appointment' || notifType === 'booking_cancelled' || title.includes('appointment')) &&
        !title.includes('nurse') && !title.includes('home visit')
      ) {
        return Boolean(notification.hospitalId && notification.hospitalId === userHospitalId);
      }
    }
    return false;
  }

  // Hospital-wide alerts (notification.userId is null/undefined):
  // A. LAB events -> LAB_ADMIN and HOSPITAL_ADMIN only
  const isLabEvent = notifType === 'lab' || title.includes('lab');
  if (isLabEvent) {
    return role === Role.LAB_ADMIN || role === Role.HOSPITAL_ADMIN;
  }

  // B. HOME NURSING events -> NURSE and HOSPITAL_ADMIN only
  const isNursingEvent = title.includes('home nursing') || title.includes('nurse') || title.includes('home visit') || notification.metadata?.type === 'HOME_NURSING';
  if (isNursingEvent) {
    return role === Role.NURSE || role === Role.HOSPITAL_ADMIN;
  }

  // C. RECEPTION / APPOINTMENT events -> RECEPTIONIST and HOSPITAL_ADMIN only
  const isAppointmentEvent = notifType === 'appointment' || notifType === 'booking_cancelled' || title.includes('appointment') || title.includes('walk-in') || title.includes('check-in');
  if (isAppointmentEvent) {
    return role === Role.RECEPTIONIST || role === Role.HOSPITAL_ADMIN;
  }

  // D. General hospital operational alerts
  if (role === Role.HOSPITAL_ADMIN) {
    return true;
  }

  return false;
}

/**
 * Builds a strict database-level Prisma WHERE clause for the authenticated user and role.
 */
export function buildNotificationWhereClause(params: {
  role: Role;
  userId: string;
  hospitalId?: string | null;
  unreadOnly?: boolean;
}) {
  const { role, userId, hospitalId, unreadOnly } = params;
  const where: any = {};

  if (unreadOnly) {
    where.read = false;
  }

  switch (role) {
    case Role.PATIENT:
      where.userId = userId;
      where.NOT = [
        { type: 'lab', userId: null },
        { type: 'activity', userId: null },
        { title: { contains: 'New Lab Test Order' } },
        { title: { contains: 'New OP Appointment' } },
        { title: { contains: 'Walk-In OP Registered' } },
        { title: { contains: 'New Home Nursing Booking' } },
      ];
      break;

    case Role.RECEPTIONIST:
      if (!hospitalId) {
        where.userId = userId;
      } else {
        where.hospitalId = hospitalId;
        where.OR = [
          { userId },
          {
            AND: [
              {
                OR: [
                  { type: { in: ['appointment', 'BOOKING_CANCELLED', 'BOOKING_RESCHEDULED'] } },
                  { title: { contains: 'Appointment' } },
                  { title: { contains: 'Walk-In' } },
                  { title: { contains: 'Check-In' } },
                  { title: { contains: 'Token' } },
                ]
              },
              {
                NOT: [
                  { type: 'lab' },
                  { title: { contains: 'Lab' } },
                  { title: { contains: 'Home Nursing' } },
                  { title: { contains: 'Nurse' } },
                  { title: { contains: 'Home Visit' } },
                  { type: { in: ['marketing_request', 'camp_request', 'platform_inquiry'] } }
                ]
              }
            ]
          }
        ];
      }
      break;

    case Role.LAB_ADMIN:
      if (!hospitalId) {
        where.userId = userId;
      } else {
        where.hospitalId = hospitalId;
        where.OR = [
          { userId },
          {
            OR: [
              { type: 'lab' },
              { title: { contains: 'Lab Test' } }
            ],
            NOT: [
              { title: { contains: 'Appointment' } },
              { title: { contains: 'Home Nursing' } },
              { title: { contains: 'Nurse' } },
              { title: { contains: 'Home Visit' } },
              { type: { in: ['marketing_request', 'camp_request', 'platform_inquiry'] } }
            ]
          }
        ];
      }
      break;

    case Role.DOCTOR:
      where.userId = userId;
      if (hospitalId) {
        where.hospitalId = hospitalId;
      }
      break;

    case Role.NURSE:
      if (!hospitalId) {
        where.userId = userId;
      } else {
        where.hospitalId = hospitalId;
        where.OR = [
          { userId },
          {
            title: { contains: 'Home Nursing' },
            NOT: [
              { type: 'lab' },
              { title: { contains: 'Lab' } },
              { title: { contains: 'Appointment' } }
            ]
          },
          {
            title: { contains: 'Home Visit' }
          }
        ];
      }
      break;

    case Role.HOSPITAL_ADMIN:
      if (!hospitalId) {
        where.userId = userId;
      } else {
        where.hospitalId = hospitalId;
        where.OR = [
          { userId },
          { hospitalId, userId: null },
          {
            hospitalId,
            type: { in: ['appointment', 'lab', 'activity', 'success', 'BOOKING_CANCELLED', 'BOOKING_RESCHEDULED'] }
          }
        ];
      }
      break;

    case Role.SUPER_ADMIN:
      where.OR = [
        { userId },
        { type: { in: ['marketing_request', 'camp_request', 'platform_inquiry'] } }
      ];
      break;

    default:
      where.userId = userId;
      break;
  }

  return where;
}

class NotificationStreamManager {
  private clients = new Set<StreamClient>();

  addClient(client: StreamClient) {
    this.clients.add(client);
  }

  removeClient(res: Response) {
    for (const client of this.clients) {
      if (client.res === res) {
        this.clients.delete(client);
        break;
      }
    }
  }

  broadcast(notification: any) {
    const data = `data: ${JSON.stringify(notification)}\n\n`;

    for (const client of this.clients) {
      try {
        if (isNotificationAuthorizedForUser(notification, client.role, client.userId, client.hospitalId)) {
          client.res.write(data);
        }
      } catch (err) {
        this.clients.delete(client);
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
    const metadata = {
      ...(params.metadata || {}),
      ...(params.targetRoles && params.targetRoles.length > 0 ? { targetRoles: params.targetRoles } : {})
    };

    const notification = await prisma.notification.create({
      data: {
        hospitalId: params.hospitalId || null,
        userId: params.userId || null,
        title: params.title,
        message: params.message,
        type: params.type || 'appointment',
        metadata: Object.keys(metadata).length > 0 ? metadata : null,
        read: false
      }
    });

    // Broadcast over real-time SSE stream to authorized clients only
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
  role: Role;
  userId: string;
  hospitalId?: string | null;
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}) {
  const { role, userId, hospitalId, limit = 50, offset = 0, unreadOnly = false } = params;
  const where = buildNotificationWhereClause({ role, userId, hospitalId, unreadOnly });

  const [rawItems, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    }),
    prisma.notification.count({ where })
  ]);

  // Secondary security filter
  const items = rawItems.filter(item => isNotificationAuthorizedForUser(item, role, userId, hospitalId));

  return { items, total };
}

export async function getUnreadCount(params: {
  role: Role;
  userId: string;
  hospitalId?: string | null;
}) {
  const { role, userId, hospitalId } = params;
  const where = buildNotificationWhereClause({ role, userId, hospitalId, unreadOnly: true });

  return await prisma.notification.count({ where });
}

export async function markAsRead(
  id: string,
  params: { role: Role; userId: string; hospitalId?: string | null }
) {
  const { role, userId, hospitalId } = params;
  const where = buildNotificationWhereClause({ role, userId, hospitalId });
  where.id = id;

  return await prisma.notification.updateMany({
    where,
    data: { read: true }
  });
}

export async function markAllAsRead(params: {
  role: Role;
  userId: string;
  hospitalId?: string | null;
}) {
  const { role, userId, hospitalId } = params;
  const where = buildNotificationWhereClause({ role, userId, hospitalId, unreadOnly: true });

  return await prisma.notification.updateMany({
    where,
    data: { read: true }
  });
}
