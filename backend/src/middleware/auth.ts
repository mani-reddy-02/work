import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface JwtPayload {
  userId: string;
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No token provided' } });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // Fetch user from database to ensure they still exist and get authoritative role/hospitalId
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, hospitalId: true, active: true }
    });

    if (!user || !user.active) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User account is inactive or not found' } });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
  }
};

export const requireRole = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied: insufficient permissions' } });
    }
    next();
  };
};
