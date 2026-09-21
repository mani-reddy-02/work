import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { CreateMarketingRequestInput, CreateCampRequestInput } from './hospital-requests.schema';
import { sendNotification } from '../notifications/notifications.service';
import { Role } from '@prisma/client';

/**
 * POST /api/v1/hospital/marketing-requests
 * Submits a new marketing enquiry for the logged-in hospital and notifies Super Admin.
 */
export const createMarketingRequest = async (req: Request, res: Response, next: NextFunction) => {
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

    const input: CreateMarketingRequestInput = req.body;

    // Resolve campaignType: prefer explicit string or join array of services
    const campaignType = input.campaignType || 
      (input.services && input.services.length > 0 ? input.services.join(', ') : 'Hospital Marketing Enquiry');

    // Combine notes with preferredTime if present
    const noteParts: string[] = [];
    if (input.preferredTime) {
      noteParts.push(`Preferred Contact Time: ${input.preferredTime}`);
    }
    if (input.notes) {
      noteParts.push(input.notes);
    }
    const combinedNotes = noteParts.length > 0 ? noteParts.join(' | ') : null;

    const request = await prisma.marketingRequest.create({
      data: {
        hospitalId,
        campaignType,
        budget: input.budget !== undefined && input.budget !== null ? Number(input.budget) : null,
        targetAudience: input.targetAudience || null,
        notes: combinedNotes,
        status: 'PENDING',
      },
    });

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      select: { name: true, contactPhone: true, contactEmail: true },
    });

    // Notify all Super Admins in real time
    const superAdmins = await prisma.user.findMany({
      where: { role: Role.SUPER_ADMIN, active: true },
      select: { id: true },
    });

    for (const admin of superAdmins) {
      await sendNotification({
        userId: admin.id,
        title: `New Marketing Request: ${hospital?.name || 'Hospital'}`,
        message: `${hospital?.name || 'Hospital'} requested marketing services: "${campaignType}". Preferred time: ${input.preferredTime || 'Anytime'}.`,
        type: 'marketing_request',
        metadata: {
          requestId: request.id,
          hospitalId,
          hospitalName: hospital?.name,
          campaignType,
          preferredTime: input.preferredTime,
          services: input.services,
          createdAt: request.createdAt,
        },
      });
    }

    // Confirmation notification to the Hospital Admin
    await sendNotification({
      hospitalId,
      userId: req.user?.id,
      title: 'Marketing Request Submitted',
      message: `Your marketing enquiry for "${campaignType}" has been received by MediQuee Admin.`,
      type: 'success',
      metadata: { requestId: request.id, campaignType },
    });

    return res.status(201).json({
      success: true,
      data: request,
      message: 'Marketing request submitted successfully to Admin',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/hospital/camp-requests
 * Submits a new community medical camp request for the logged-in hospital and notifies Super Admin.
 */
export const createCampRequest = async (req: Request, res: Response, next: NextFunction) => {
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

    const input: CreateCampRequestInput = req.body;

    // Parse date
    const expectedDate = new Date(input.expectedDate);
    if (isNaN(expectedDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid expectedDate provided. Must be a valid date.',
        },
      });
    }

    // Resolve camp title
    const campTitle = input.campTitle || 
      (input.speciality ? `${input.speciality} Medical Camp` : 'Community Medical Camp');

    // Resolve specialties
    let specialties: string[] = [];
    if (Array.isArray(input.specialties) && input.specialties.length > 0) {
      specialties = input.specialties;
    } else if (input.speciality) {
      specialties = [input.speciality];
    } else {
      specialties = ['General Medicine'];
    }

    // Resolve expected patients
    let expectedPatients: number | null = null;
    if (input.expectedPatients !== undefined && input.expectedPatients !== null) {
      expectedPatients = Number(input.expectedPatients);
    } else if (input.expectedFootfall) {
      const match = input.expectedFootfall.match(/\d+/);
      if (match) {
        expectedPatients = parseInt(match[0], 10);
      }
    }

    // Combine notes with footfall text if present
    const noteParts: string[] = [];
    if (input.expectedFootfall) {
      noteParts.push(`Expected Footfall: ${input.expectedFootfall}`);
    }
    if (input.notes) {
      noteParts.push(input.notes);
    }
    const combinedNotes = noteParts.length > 0 ? noteParts.join(' | ') : null;

    const request = await prisma.medicalCampRequest.create({
      data: {
        hospitalId,
        campTitle,
        location: input.location,
        expectedDate,
        specialties,
        expectedPatients,
        notes: combinedNotes,
        status: 'PENDING',
      },
    });

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      select: { name: true, contactPhone: true, contactEmail: true },
    });

    // Notify all Super Admins in real time
    const superAdmins = await prisma.user.findMany({
      where: { role: Role.SUPER_ADMIN, active: true },
      select: { id: true },
    });

    for (const admin of superAdmins) {
      await sendNotification({
        userId: admin.id,
        title: `New Medical Camp Request: ${hospital?.name || 'Hospital'}`,
        message: `${hospital?.name || 'Hospital'} submitted "${campTitle}" at ${input.location} on ${expectedDate.toLocaleDateString()}. Expected: ${input.expectedFootfall || 'General'}.`,
        type: 'camp_request',
        metadata: {
          requestId: request.id,
          hospitalId,
          hospitalName: hospital?.name,
          campTitle,
          location: input.location,
          expectedDate: input.expectedDate,
          expectedFootfall: input.expectedFootfall,
          specialities: specialties,
          createdAt: request.createdAt,
        },
      });
    }

    // Confirmation notification to Hospital Admin
    await sendNotification({
      hospitalId,
      userId: req.user?.id,
      title: 'Medical Camp Request Submitted',
      message: `Your request for "${campTitle}" has been sent to MediQuee Admin. Logistics team will coordinate with you.`,
      type: 'success',
      metadata: { requestId: request.id, campTitle },
    });

    return res.status(201).json({
      success: true,
      data: request,
      message: 'Medical camp request submitted successfully to Admin',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/hospital/inquiries
 * Submits a hospital platform inquiry / demo request (Tile 3) and notifies Super Admin.
 */
export const createInquiryRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user?.hospitalId;
    if (!hospitalId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied: No hospital association found.' },
      });
    }

    const { subject, message, contactPerson, contactPhone, contactEmail } = req.body;
    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Subject and message are required.' },
      });
    }

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      select: { name: true, contactPhone: true, contactEmail: true },
    });

    const combinedNotes = [
      contactPerson ? `Contact Person: ${contactPerson}` : null,
      contactPhone ? `Phone: ${contactPhone}` : null,
      contactEmail ? `Email: ${contactEmail}` : null,
      `Message: ${message}`,
    ].filter(Boolean).join(' | ');

    const request = await prisma.marketingRequest.create({
      data: {
        hospitalId,
        campaignType: `PLATFORM_INQUIRY: ${subject}`,
        notes: combinedNotes,
        status: 'PENDING',
      },
    });

    const superAdmins = await prisma.user.findMany({
      where: { role: Role.SUPER_ADMIN, active: true },
      select: { id: true },
    });

    for (const admin of superAdmins) {
      await sendNotification({
        userId: admin.id,
        title: `Hospital Platform Inquiry: ${hospital?.name || 'Hospital'}`,
        message: `[${subject}] from ${contactPerson || hospital?.name}: "${message.slice(0, 120)}"`,
        type: 'platform_inquiry',
        metadata: {
          requestId: request.id,
          hospitalId,
          hospitalName: hospital?.name,
          subject,
          message,
          contactPerson,
          contactPhone: contactPhone || hospital?.contactPhone,
          createdAt: request.createdAt,
        },
      });
    }

    await sendNotification({
      hospitalId,
      userId: req.user?.id,
      title: 'Inquiry Sent to Admin',
      message: `Your inquiry regarding "${subject}" has been successfully forwarded to MediQuee Administration.`,
      type: 'success',
      metadata: { requestId: request.id, subject },
    });

    return res.status(201).json({
      success: true,
      data: request,
      message: 'Inquiry submitted to Admin successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/hospital/requests
 * Returns marketing and medical camp request history for the logged-in hospital.
 */
export const getMyRequests = async (req: Request, res: Response, next: NextFunction) => {
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

    const [marketingRequests, campRequests] = await Promise.all([
      prisma.marketingRequest.findMany({
        where: { hospitalId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.medicalCampRequest.findMany({
        where: { hospitalId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        marketingRequests,
        campRequests,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/hospital-requests
 * Returns all submitted hospital requests for Super Admin dashboard.
 */
export const getAllHospitalRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [camps, marketing] = await Promise.all([
      prisma.medicalCampRequest.findMany({
        include: {
          hospital: {
            select: { id: true, name: true, contactPhone: true, contactEmail: true, city: true, state: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.marketingRequest.findMany({
        include: {
          hospital: {
            select: { id: true, name: true, contactPhone: true, contactEmail: true, city: true, state: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        camps,
        marketing,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/admin/hospital-requests/:type/:id
 * Updates request status by Super Admin and notifies the hospital.
 */
export const updateRequestStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const type = String(req.params.type);
    const { status, notes } = req.body;

    let updated: any;
    if (type === 'camp') {
      updated = await prisma.medicalCampRequest.update({
        where: { id },
        data: { status: status as any, ...(notes ? { notes: notes as string } : {}) },
        include: { hospital: { select: { id: true, name: true } } },
      });
    } else {
      updated = await prisma.marketingRequest.update({
        where: { id },
        data: { status: status as any, ...(notes ? { notes: notes as string } : {}) },
        include: { hospital: { select: { id: true, name: true } } },
      });
    }

    // Notify hospital of status update
    await sendNotification({
      hospitalId: updated.hospitalId,
      title: `Request ${status}: ${type === 'camp' ? 'Medical Camp' : 'Service Request'}`,
      message: `Your ${type === 'camp' ? 'medical camp request' : 'enquiry'} has been updated to "${status}" by MediQuee Admin.`,
      type: status === 'APPROVED' ? 'success' : 'activity',
      metadata: { requestId: id, status, type },
    });

    return res.json({
      success: true,
      data: updated,
      message: `Request status updated to ${status}`,
    });
  } catch (error) {
    next(error);
  }
};
