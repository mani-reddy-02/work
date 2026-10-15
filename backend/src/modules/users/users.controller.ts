import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

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
        address: true,
        licenseNumber: true,
        qualification: true,
        specialization: true,
        experienceYears: true,
        consultationFee: true,
        bio: true,
        digitalSignature: true,
        prescriptionSettings: true,
        presenceStatus: true,
        hospitalId: true,
        departmentId: true,
        createdAt: true,
        active: true,
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
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
    }

    const isDoctor = user.role === Role.DOCTOR;
    
    // Resolve specialization: prefer user.specialization, fallback to department.name
    const resolvedSpecialization = user.specialization || user.department?.name || null;
    
    // Resolve designation: prefer user.designation, fallback to 'Consultant - <dept>' or 'Consultant Physician'
    const resolvedDesignation = user.designation || (isDoctor && user.department?.name ? `Consultant - ${user.department.name}` : (isDoctor ? 'Consultant Physician' : user.designation));

    // Resolve consultationFee: if null, check doctor's actual bookings in DB
    let resolvedConsultationFee = user.consultationFee;
    if (resolvedConsultationFee === null || resolvedConsultationFee === undefined) {
      const latestBooking = await prisma.oPBooking.findFirst({
        where: { doctorId: user.id },
        orderBy: { createdAt: 'desc' },
        select: { fee: true },
      });
      if (latestBooking?.fee) {
        resolvedConsultationFee = latestBooking.fee;
      }
    }

    // Build facility clinic address from hospital
    const hospitalFacilityAddress = user.hospital ? {
      type: 'Clinic / Work',
      street: [user.hospital.addressLine1, user.hospital.area].filter(Boolean).join(', '),
      city: user.hospital.city || '',
      state: user.hospital.state || '',
      pincode: user.hospital.pincode || '',
    } : null;

    // Resolve address: if user has no personal address set, fallback to hospital facility address
    let resolvedAddress = user.address;
    if (!resolvedAddress && hospitalFacilityAddress && (hospitalFacilityAddress.street || hospitalFacilityAddress.city)) {
      resolvedAddress = JSON.stringify([hospitalFacilityAddress]);
    }

    const mergedData = {
      ...user,
      specialization: resolvedSpecialization,
      designation: resolvedDesignation,
      consultationFee: resolvedConsultationFee,
      address: resolvedAddress,
      hospitalFacilityAddress,
    };

    res.json({ success: true, data: mergedData });
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const {
      name,
      email,
      phone,
      dob,
      gender,
      avatar,
      designation,
      address,
      licenseNumber,
      qualification,
      specialization,
      experienceYears,
      consultationFee,
      bio,
      digitalSignature,
      prescriptionSettings,
    } = req.body;

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
        ...(designation !== undefined && { designation }),
        ...(address !== undefined && { address }),
        ...(licenseNumber !== undefined && { licenseNumber }),
        ...(qualification !== undefined && { qualification }),
        ...(specialization !== undefined && { specialization }),
        ...(experienceYears !== undefined && { experienceYears: experienceYears === null ? null : Number(experienceYears) }),
        ...(consultationFee !== undefined && { consultationFee: consultationFee === null ? null : Number(consultationFee) }),
        ...(bio !== undefined && { bio }),
        ...(digitalSignature !== undefined && { digitalSignature }),
        ...(prescriptionSettings !== undefined && { prescriptionSettings }),
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
        address: true,
        licenseNumber: true,
        qualification: true,
        specialization: true,
        experienceYears: true,
        consultationFee: true,
        bio: true,
        digitalSignature: true,
        prescriptionSettings: true,
        presenceStatus: true,
        hospitalId: true,
        departmentId: true,
        createdAt: true,
        active: true,
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
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    const isDoctor = updatedUser.role === Role.DOCTOR;
    const resolvedSpecialization = updatedUser.specialization || updatedUser.department?.name || null;
    const resolvedDesignation = updatedUser.designation || (isDoctor && updatedUser.department?.name ? `Consultant - ${updatedUser.department.name}` : updatedUser.designation);

    const hospitalFacilityAddress = updatedUser.hospital ? {
      type: 'Clinic / Work',
      street: [updatedUser.hospital.addressLine1, updatedUser.hospital.area].filter(Boolean).join(', '),
      city: updatedUser.hospital.city || '',
      state: updatedUser.hospital.state || '',
      pincode: updatedUser.hospital.pincode || '',
    } : null;

    res.json({
      success: true,
      data: {
        ...updatedUser,
        specialization: resolvedSpecialization,
        designation: resolvedDesignation,
        hospitalFacilityAddress,
      },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Current and new password are required' } });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Incorrect current password' } });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};
