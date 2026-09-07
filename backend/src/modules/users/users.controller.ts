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
        avatar: true,
        dob: true,
        gender: true,
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

export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { name, email, phone, dob, gender, avatar } = req.body;

    // Check for duplicate email or phone if being updated
    if (email || phone) {
      const conflict = await prisma.user.findFirst({
        where: {
          id: { not: userId },
          OR: [
            ...(email ? [{ email }] : []),
            ...(phone ? [{ phone }] : []),
          ],
        },
      });

      if (conflict) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'CONFLICT_ERROR',
            message:
              conflict.email === email
                ? 'This email is already associated with another account.'
                : 'This mobile number is already associated with another account.',
          },
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(dob !== undefined && { dob }),
        ...(gender !== undefined && { gender }),
        ...(avatar !== undefined && { avatar }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        designation: true,
        avatar: true,
        dob: true,
        gender: true,
        hospitalId: true,
      },
    });

    res.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
