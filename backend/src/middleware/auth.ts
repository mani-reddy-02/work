import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface JwtPayload {
  userId: string;
}

// Track failed administrative authorization attempts for throttling
const failedAuthAttempts = new Map<string, { count: number; firstAttempt: number }>();

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required. Please log in again.' } });
    }

    const token = authHeader.split(' ')[1];
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch (jwtErr: any) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token. Please log in again.' } });
    }

    // Fetch user from database to ensure they still exist and get authoritative role/hospitalId
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        hospitalId: true,
        active: true,
        hospital: { select: { id: true, verificationStatus: true } }
      }
    });

    if (!user || !user.active) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User account is inactive or not found' } });
    }

    // Inspect hospital affiliation for hospital-scoped roles
    const userRoleStr = user.role as string;
    const isHospitalScopedRole = [
      'HOSPITAL_ADMIN',
      'DOCTOR',
      'RECEPTIONIST',
      'LAB_ADMIN',
      'PHARMACIST',
      'NURSE',
    ].includes(userRoleStr) || (user.hospitalId != null && userRoleStr !== 'SUPER_ADMIN' && userRoleStr !== 'PATIENT');

    if (isHospitalScopedRole && user.hospitalId) {
      const vStatus = user.hospital?.verificationStatus;
      
      // If hospital is explicitly cancelled or suspended
      if (!user.hospital || vStatus === 'CANCELLED') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Account suspended: affiliated hospital is inactive or unverified'
          }
        });
      }

      // If hospital is not approved yet (e.g. PENDING)
      const isApproved = vStatus === 'APPROVED' || vStatus === 'VERIFIED';
      if (!isApproved) {
        const path = (req.originalUrl || req.url || '').toLowerCase();
        const isSelfProfileOrDashboard = 
          req.method === 'GET' && (
            path.includes('/users/me') || 
            path.includes('/hospital/dashboard') ||
            path.includes('/notifications') ||
            path.includes('/hospital-profile')
          );

        const isAdmin = userRoleStr === 'HOSPITAL_ADMIN' || userRoleStr === 'LAB_ADMIN';

        if (!isAdmin || !isSelfProfileOrDashboard) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Hospital verification pending: All operational actions are restricted until verified by MediQuee Administration. Please contact 8331045500.'
            }
          });
        }
      }
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      // Throttle excessive failed administrative authorization attempts
      if (allowedRoles.includes(Role.SUPER_ADMIN)) {
        const clientKey = req.ip || req.user?.id || 'unknown';
        const now = Date.now();
        const entry = failedAuthAttempts.get(clientKey) || { count: 0, firstAttempt: now };
        if (now - entry.firstAttempt > 5 * 60 * 1000) {
          entry.count = 1;
          entry.firstAttempt = now;
        } else {
          entry.count += 1;
        }
        failedAuthAttempts.set(clientKey, entry);
        if (entry.count > 10) {
          return res.status(429).json({
            success: false,
            error: {
              code: 'TOO_MANY_REQUESTS',
              message: 'Too many unauthorized administrative attempts. Session temporarily throttled.'
            }
          });
        }
      }
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied: insufficient permissions' } });
    }
    next();
  };
};

export const optionalAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, phone: true, role: true, hospitalId: true, active: true }
      });

      if (user && user.active) {
        req.user = user;
      }
    }
  } catch (error) {
    // Optional auth ignores invalid or expired tokens and lets the request proceed anonymously
  }
  next();
};

