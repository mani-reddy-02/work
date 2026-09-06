import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { Role } from '@prisma/client';

export const getPermissions = async (req: Request, res: Response) => {
  try {
    const role = req.params.role as Role;
    const hospitalId = req.user!.hospitalId;

    if (!hospitalId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'No hospital context' } });
    }

    if (role === Role.SUPER_ADMIN || role === Role.PATIENT) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_ROLE', message: 'Cannot manage permissions for this role' } });
    }

    // Ensure all global permissions have a RolePermission record for this hospital/role
    const allPermissions = await prisma.permission.findMany();
    
    // Auto-seed missing role permissions for this hospital/role
    for (const p of allPermissions) {
      // Determine sensible defaults if newly created
      let defaultEnabled = false;
      
      // Seed logic: Doctor defaults
      if (role === Role.DOCTOR) {
        if (p.key === 'dashboard.view' || p.key === 'appointments.view') defaultEnabled = true;
      }
      
      // Nurse defaults
      if (role === Role.NURSE) {
        if (p.key === 'dashboard.view' || p.key === 'appointments.view') defaultEnabled = true;
      }
      
      // Receptionist defaults
      if (role === Role.RECEPTIONIST) {
        if (['dashboard.view', 'appointments.view', 'appointments.create', 'appointments.update'].includes(p.key)) defaultEnabled = true;
      }

      // Lab Admin defaults
      if (role === Role.LAB_ADMIN) {
        if (['labs.view', 'labs.create', 'labs.update'].includes(p.key)) defaultEnabled = true;
      }

      await prisma.rolePermission.upsert({
        where: {
          hospitalId_role_permissionId: {
            hospitalId,
            role,
            permissionId: p.id
          }
        },
        update: {}, // do nothing if exists
        create: {
          hospitalId,
          role,
          permissionId: p.id,
          enabled: defaultEnabled
        }
      });
    }

    const rolePermissions = await prisma.rolePermission.findMany({
      where: { hospitalId, role },
      include: { permission: true }
    });

    const result = rolePermissions.map(rp => ({
      key: rp.permission.key,
      name: rp.permission.name,
      description: rp.permission.description,
      module: rp.permission.module,
      enabled: rp.enabled
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[getPermissions]', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch permissions' } });
  }
};

export const updatePermissions = async (req: Request, res: Response) => {
  try {
    const role = req.params.role as Role;
    const hospitalId = req.user!.hospitalId;
    const { permissions } = req.body;

    if (!hospitalId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'No hospital context' } });
    }

    if (role === Role.SUPER_ADMIN || role === Role.PATIENT) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_ROLE', message: 'Cannot manage permissions for this role' } });
    }

    // permissions is { "staff.create": true, "staff.view": false }
    for (const [key, enabled] of Object.entries(permissions)) {
      if (typeof enabled !== 'boolean') continue;

      const perm = await prisma.permission.findUnique({ where: { key } });
      if (!perm) continue; // ignore unknown permissions

      await prisma.rolePermission.upsert({
        where: {
          hospitalId_role_permissionId: {
            hospitalId,
            role,
            permissionId: perm.id
          }
        },
        update: { enabled },
        create: {
          hospitalId,
          role,
          permissionId: perm.id,
          enabled
        }
      });
    }

    res.json({ success: true, message: 'Permissions updated successfully' });
  } catch (error) {
    console.error('[updatePermissions]', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update permissions' } });
  }
};
