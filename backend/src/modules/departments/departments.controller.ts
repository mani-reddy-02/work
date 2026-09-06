import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';

export const getDepartments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user!.hospitalId;
    if (!hospitalId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'User does not belong to a hospital' } });
    }

    const departments = await prisma.department.findMany({
      where: { hospitalId },
      orderBy: { name: 'asc' }
    });

    res.json({ success: true, data: departments });
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user!.hospitalId;
    if (!hospitalId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'User does not belong to a hospital' } });
    }

    const { name, code, description } = req.body;

    // Check for duplicate name in the same hospital
    const existing = await prisma.department.findFirst({
      where: { hospitalId, name }
    });

    if (existing) {
      return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Department name already exists in this hospital' } });
    }

    const department = await prisma.department.create({
      data: {
        name,
        code,
        description,
        hospitalId
      }
    });

    res.status(201).json({ success: true, data: department });
  } catch (error) {
    next(error);
  }
};

export const updateDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user!.hospitalId;
    if (!hospitalId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'User does not belong to a hospital' } });
    }

    const { id } = req.params;
    const { name, code, description } = req.body;

    const department = await prisma.department.findUnique({
      where: { id: id as string }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Department not found' } });
    }

    if (department.hospitalId !== hospitalId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Unauthorized to modify this department' } });
    }

    if (name && name !== department.name) {
      const existing = await prisma.department.findFirst({
        where: { hospitalId, name }
      });
      if (existing) {
        return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Department name already exists in this hospital' } });
      }
    }

    const updated = await prisma.department.update({
      where: { id: id as string },
      data: { name, code, description }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user!.hospitalId;
    if (!hospitalId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'User does not belong to a hospital' } });
    }

    const { id } = req.params;

    const department = await prisma.department.findUnique({
      where: { id: id as string }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Department not found' } });
    }

    if (department.hospitalId !== hospitalId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Unauthorized to delete this department' } });
    }

    // In a real system, you might check if there are users/staff assigned to this department
    // but right now there's no relation in Prisma schema between User and Department.

    await prisma.department.delete({
      where: { id: id as string }
    });

    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    next(error);
  }
};
