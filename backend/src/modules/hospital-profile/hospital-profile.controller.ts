import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { updateHospitalProfileSchema } from './hospital-profile.schema';

/**
 * Format a Hospital record into the authoritative profile response structure
 */
function formatHospitalProfile(h: any) {
  const fullAddress = [h.addressLine1, h.addressLine2, h.area, h.city, h.state, h.pincode]
    .filter(Boolean)
    .join(', ');

  const verificationStatus = (h.verifications && h.verifications.length > 0) ? 'VERIFIED' : 'PENDING';

  return {
    id: h.id,
    name: h.name,
    businessType: h.businessType,
    facilityType: h.facilityType || null,
    registrationNumber: h.registrationNumber || null,
    establishedYear: h.establishedYear || null,
    logoUrl: h.logoUrl || null,
    contactPhone: h.contactPhone || null,
    phone: h.contactPhone || null,
    contactEmail: h.contactEmail || null,
    email: h.contactEmail || null,
    website: h.website || null,
    emergencyContact: h.emergencyContact || null,
    addressLine1: h.addressLine1 || null,
    addressLine2: h.addressLine2 || null,
    area: h.area || null,
    city: h.city || null,
    state: h.state || null,
    country: h.country || null,
    pincode: h.pincode || null,
    address: fullAddress || h.addressLine1 || null,
    services: h.services || [],
    verificationStatus,
    verifications: (h.verifications || []).map((v: any) => ({
      id: v.id,
      documentType: v.documentType,
      fileUrl: v.fileUrl,
      createdAt: v.createdAt,
    })),
    departmentsCount: h._count?.departments ?? 0,
    staffCount: h._count?.users ?? 0,
    totalBookingsCount: h._count?.opBookings ?? 0,
    createdAt: h.createdAt,
    updatedAt: h.updatedAt,
  };
}

/**
 * GET /api/v1/hospital/profile
 * Retrieves the authentic profile for the authenticated hospital tenant.
 */
export const getHospitalProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user?.hospitalId;

    if (!hospitalId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied: No hospital association found for this account.',
        },
      });
    }

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      include: {
        verifications: {
          select: { id: true, documentType: true, fileUrl: true, createdAt: true },
        },
        _count: {
          select: {
            departments: true,
            users: { where: { active: true } },
            opBookings: true,
          },
        },
      },
    });

    if (!hospital) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Hospital profile not found.',
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: formatHospitalProfile(hospital),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/hospital/profile
 * Updates the authentic profile for the authenticated hospital tenant.
 * Rejects parameter manipulation to protect multi-tenant isolation.
 */
export const updateHospitalProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user?.hospitalId;

    if (!hospitalId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied: No hospital association found for this account.',
        },
      });
    }

    // Explicitly reject tampering attempts to supply external hospitalId
    if (req.body.hospitalId && req.body.hospitalId !== hospitalId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Tenant violation: You cannot update another facility profile.',
        },
      });
    }

    const parseResult = updateHospitalProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: parseResult.error.issues,
        },
      });
    }

    const validated = parseResult.data;

    // Map input fields (supporting both canonical and alias names)
    const updatePayload: Record<string, any> = {};

    if (validated.name !== undefined) updatePayload.name = validated.name.trim();
    if (validated.facilityType !== undefined) updatePayload.facilityType = validated.facilityType ? validated.facilityType.trim() : null;
    if (validated.registrationNumber !== undefined) updatePayload.registrationNumber = validated.registrationNumber ? validated.registrationNumber.trim() : null;
    if (validated.establishedYear !== undefined) updatePayload.establishedYear = validated.establishedYear ? validated.establishedYear.trim() : null;

    // Contact fields
    const phoneVal = validated.contactPhone ?? validated.phone;
    if (phoneVal !== undefined) updatePayload.contactPhone = phoneVal ? phoneVal.trim() : null;

    const emailVal = validated.contactEmail ?? validated.email;
    if (emailVal !== undefined) updatePayload.contactEmail = emailVal ? emailVal.trim().toLowerCase() : null;

    if (validated.website !== undefined) updatePayload.website = validated.website ? validated.website.trim() : null;
    if (validated.emergencyContact !== undefined) updatePayload.emergencyContact = validated.emergencyContact ? validated.emergencyContact.trim() : null;

    // Address fields
    const addrVal = validated.addressLine1 ?? validated.address;
    if (addrVal !== undefined) updatePayload.addressLine1 = addrVal ? addrVal.trim() : null;
    if (validated.addressLine2 !== undefined) updatePayload.addressLine2 = validated.addressLine2 ? validated.addressLine2.trim() : null;
    if (validated.area !== undefined) updatePayload.area = validated.area ? validated.area.trim() : null;
    if (validated.city !== undefined) updatePayload.city = validated.city ? validated.city.trim() : null;
    if (validated.state !== undefined) updatePayload.state = validated.state ? validated.state.trim() : null;
    if (validated.country !== undefined) updatePayload.country = validated.country ? validated.country.trim() : null;
    if (validated.pincode !== undefined) updatePayload.pincode = validated.pincode ? validated.pincode.trim() : null;

    // Clinical services
    if (validated.services !== undefined) updatePayload.services = validated.services;

    const updated = await prisma.hospital.update({
      where: { id: hospitalId },
      data: updatePayload,
      include: {
        verifications: {
          select: { id: true, documentType: true, fileUrl: true, createdAt: true },
        },
        _count: {
          select: {
            departments: true,
            users: { where: { active: true } },
            opBookings: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: formatHospitalProfile(updated),
      message: 'Profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
};
