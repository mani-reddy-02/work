import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { sendNotification } from '../notifications/notifications.service';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads/icons');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export function processInsuranceIcon(iconData: string | undefined | null): string | undefined {
  if (!iconData) return undefined;
  const trimmed = iconData.trim();
  if (!trimmed) return undefined;

  // If already a hosted URL or relative uploads/icons path, keep it
  if (
    trimmed.startsWith('/uploads/') ||
    trimmed.startsWith('/icons/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://')
  ) {
    return trimmed;
  }

  // Handle base64 image data
  if (trimmed.startsWith('data:image')) {
    const matches = trimmed.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return undefined;
    const extension = matches[1].includes('jpeg') || matches[1].includes('jpg') ? 'jpg' : 'png';
    const fileBuffer = Buffer.from(matches[2], 'base64');
    const safeFileName = `${Date.now()}-insurance-icon.${extension}`;
    const filePath = path.join(UPLOADS_DIR, safeFileName);
    fs.writeFileSync(filePath, fileBuffer);
    return `/uploads/icons/${safeFileName}`;
  }

  return trimmed;
}

const urlRegex = /^https?:\/\/.+/i;

const insuranceInputSchema = z.object({
  title: z.string().trim().min(1, 'Insurance title is required').max(200, 'Title is too long'),
  icon: z.string().optional().nullable(),
  description: z.string().trim().min(1, 'Description is required'),
  successRate: z.coerce.number().min(0, 'Success rate must be at least 0%').max(100, 'Success rate cannot exceed 100%'),
  applicationUrl: z.string().trim().regex(urlRegex, 'Application URL must be a valid http or https URL'),
  isActive: z.boolean().optional().default(true),
});

/**
 * Public User endpoint - List active insurances
 */
export const getPublicInsurances = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search } = req.query;
    const where: any = { isActive: true };

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const insurances = await prisma.insurance.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: insurances,
      total: insurances.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin endpoint - List insurances with search, pagination, and stats
 */
export const getAdminInsurances = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = (req.query.search as string) || '';
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, totalMatching, totalAll] = await Promise.all([
      prisma.insurance.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.insurance.count({ where }),
      prisma.insurance.count(),
    ]);

    const totalPages = Math.ceil(totalMatching / limit) || 1;

    res.json({
      success: true,
      data: items,
      pagination: {
        total: totalMatching,
        page,
        limit,
        totalPages,
      },
      stats: {
        totalInsurances: totalAll,
        matchingInsurances: totalMatching,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Insurance stats
 */
export const getInsuranceStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const total = await prisma.insurance.count();
    const active = await prisma.insurance.count({ where: { isActive: true } });

    res.json({
      success: true,
      data: {
        totalInsurances: total,
        activeInsurances: active,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin endpoint - Get insurance by ID
 */
export const getInsuranceById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const insurance = await prisma.insurance.findUnique({
      where: { id },
    });

    if (!insurance) {
      return res.status(404).json({
        success: false,
        message: 'Insurance record not found',
      });
    }

    res.json({
      success: true,
      data: insurance,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin endpoint - Create Insurance
 */
export const createInsurance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = insuranceInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || 'Invalid input data',
        errors: parseResult.error.issues,
      });
    }

    const { title, icon, description, successRate, applicationUrl, isActive } = parseResult.data;

    // Check for exact duplicate title
    const existing = await prisma.insurance.findFirst({
      where: {
        title: { equals: title, mode: 'insensitive' },
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An insurance record with this title already exists',
      });
    }

    const processedIcon = processInsuranceIcon(icon);

    const insurance = await prisma.insurance.create({
      data: {
        title,
        icon: processedIcon || null,
        description,
        successRate,
        applicationUrl,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Insurance created successfully',
      data: insurance,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin endpoint - Update Insurance
 */
export const updateInsurance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.insurance.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Insurance record not found',
      });
    }

    const parseResult = insuranceInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || 'Invalid input data',
        errors: parseResult.error.issues,
      });
    }

    const { title, icon, description, successRate, applicationUrl, isActive } = parseResult.data;

    // Check for title clash with another record
    const titleClash = await prisma.insurance.findFirst({
      where: {
        title: { equals: title, mode: 'insensitive' },
        NOT: { id },
      },
    });

    if (titleClash) {
      return res.status(409).json({
        success: false,
        message: 'Another insurance record with this title already exists',
      });
    }

    let processedIcon = existing.icon;
    if (icon !== undefined) {
      processedIcon = processInsuranceIcon(icon) || null;
    }

    const updated = await prisma.insurance.update({
      where: { id },
      data: {
        title,
        icon: processedIcon,
        description,
        successRate,
        applicationUrl,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
    });

    res.json({
      success: true,
      message: 'Insurance updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin endpoint - Delete / Remove Insurance
 */
export const deleteInsurance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.insurance.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Insurance record not found',
      });
    }

    await prisma.insurance.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: `Insurance "${existing.title}" removed successfully`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * User endpoint - Notify admin when an authenticated user selects/clicks an insurance plan
 */
export const selectInsurancePlan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authUser = (req as any).user;
    const id = req.params.id as string;
    const plan = await prisma.insurance.findUnique({
      where: { id },
    });

    if (!plan || !plan.isActive) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Insurance plan not found or inactive' }
      });
    }

    let user: { id: string | null; name: string; phone: string | null; email: string | null } = {
      id: null,
      name: 'Guest Visitor',
      phone: null,
      email: null
    };

    if (authUser && authUser.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: authUser.id },
        select: { id: true, name: true, phone: true, email: true, role: true }
      });
      if (dbUser) {
        user = {
          id: dbUser.id,
          name: dbUser.name || 'User',
          phone: dbUser.phone || null,
          email: dbUser.email || null
        };
      }
    }

    // Deduplication rule: Check if this user clicked the same plan within the last 5 minutes (300,000ms)
    const deduplicationWindowMs = 5 * 60 * 1000;
    const cutoff = new Date(Date.now() - deduplicationWindowMs);
    const recentNotifs = await prisma.notification.findMany({
      where: {
        type: 'insurance_interest',
        createdAt: { gte: cutoff }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const duplicate = recentNotifs.find((n: any) => {
      const meta = n.metadata as any;
      if (!meta) return false;
      if (user.id) {
        return meta.userId === user.id && meta.planId === plan.id;
      }
      return meta.planId === plan.id && meta.userName === 'Guest Visitor';
    });

    if (duplicate) {
      return res.json({
        success: true,
        data: {
          notificationId: duplicate.id,
          deduplicated: true,
          message: 'Insurance plan interaction already recorded.'
        }
      });
    }

    const selectedAt = new Date().toISOString();
    const notifTitle = `Insurance Plan Opened: ${plan.title}`;
    const notifMessage = user.id
      ? `${user.name} (${user.phone || user.email || user.id}) opened and viewed insurance plan "${plan.title}".`
      : `A guest visitor opened and viewed insurance plan "${plan.title}".`;

    const notification = await sendNotification({
      title: notifTitle,
      message: notifMessage,
      type: 'insurance_interest',
      targetRoles: [Role.SUPER_ADMIN],
      metadata: {
        userId: user.id,
        userName: user.name,
        userRef: user.id || 'Guest',
        userPhone: user.phone,
        userEmail: user.email,
        planId: plan.id,
        planTitle: plan.title,
        selectedAt,
        link: '/admin/insurance',
        targetRoles: [Role.SUPER_ADMIN]
      }
    });

    if (!notification) {
      return res.status(500).json({
        success: false,
        error: { code: 'NOTIFICATION_FAILED', message: 'Failed to create insurance interaction notification' }
      });
    }

    res.json({
      success: true,
      data: {
        notificationId: notification.id,
        deduplicated: false,
        selectedAt,
        message: 'Admin notified of insurance plan interaction'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin endpoint - Get Insurance Inquiries & Alerts Logs
 */
export const getInsuranceLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = (req.query.search as string) || '';
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10) || 50));

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { type: 'insurance_interest' },
          { type: 'insurance_selection' },
          { type: 'insurance' }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    let items = notifications;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter((n: any) => {
        const titleMatch = n.title?.toLowerCase().includes(q);
        const msgMatch = n.message?.toLowerCase().includes(q);
        const meta = n.metadata as any;
        const userMatch =
          meta?.userName?.toLowerCase().includes(q) ||
          meta?.userPhone?.toLowerCase().includes(q) ||
          meta?.userEmail?.toLowerCase().includes(q) ||
          meta?.planTitle?.toLowerCase().includes(q);
        return titleMatch || msgMatch || userMatch;
      });
    }

    res.json({
      success: true,
      data: items,
      total: items.length
    });
  } catch (error) {
    next(error);
  }
};

