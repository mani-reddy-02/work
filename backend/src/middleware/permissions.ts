import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { Role } from '@prisma/client';

export const requirePermission = (permissionKey: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      }

      if (!req.user.hospitalId) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied: No hospital context' } });
      }

      // Enforce the rule: Hospital Admin should have full management capability over their own hospital
      // and their ability to manage permissions must remain protected.
      if (req.user.role === Role.HOSPITAL_ADMIN) {
        return next();
      }

      // For all other roles, determine their authoritative role and hospitalId, 
      // and check the corresponding RolePermission from the database.
      const rolePermission = await prisma.rolePermission.findFirst({
        where: {
          hospitalId: req.user.hospitalId,
          role: req.user.role,
          permission: {
            key: permissionKey
          }
        }
      });

      if (!rolePermission || !rolePermission.enabled) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: `Access denied: missing permission '${permissionKey}'` } });
      }

      next();
    } catch (error) {
      console.error('[requirePermission] Error:', error);
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to verify permissions' } });
    }
  };
};
