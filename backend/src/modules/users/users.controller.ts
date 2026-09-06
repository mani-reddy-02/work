import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        designation: true,
        hospitalId: true,
        hospital: {
          select: {
            id: true,
            name: true,
            businessType: true,
            facilityType: true,
            registrationNumber: true,
            contactPhone: true,
            contactEmail: true,
            addressLine1: true,
            area: true,
            city: true,
            state: true,
            pincode: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
