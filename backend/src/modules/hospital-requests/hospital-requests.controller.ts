import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { CreateMarketingRequestInput, CreateCampRequestInput } from './hospital-requests.schema';

/**
 * POST /api/v1/hospital/marketing-requests
 * Submits a new marketing enquiry for the logged-in hospital.
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

    return res.status(201).json({
      success: true,
      data: request,
      message: 'Marketing request submitted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/hospital/camp-requests
 * Submits a new community medical camp request for the logged-in hospital.
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

    return res.status(201).json({
      success: true,
      data: request,
      message: 'Medical camp request submitted successfully',
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
