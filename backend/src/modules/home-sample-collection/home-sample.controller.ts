import { Request, Response, NextFunction } from 'express';
import {
  getLabTests,
  getTestCategories,
  getLabTestById,
  getLaboratoriesForTest,
  getLaboratoryAvailability,
} from '../laboratories/lab-tests.controller';
import {
  createLabBooking,
  getMyLabBookings,
  getLabBookingById,
  cancelLabBooking,
} from '../laboratories/lab-bookings.controller';
import { prisma } from '../../config/prisma';

/**
 * Get tests available for home sample collection
 */
export const getHomeSampleTests = async (req: Request, res: Response, next: NextFunction) => {
  // Enforce home collection filter unless explicitly disabled
  if (req.query.homeCollectionOnly === undefined) {
    req.query.homeCollectionOnly = 'true';
  }
  return getLabTests(req, res, next);
};

/**
 * Get test categories
 */
export const getHomeSampleCategories = async (req: Request, res: Response, next: NextFunction) => {
  return getTestCategories(req, res, next);
};

/**
 * Get details of a specific test including offerings and eligible laboratories
 */
export const getHomeSampleTestById = async (req: Request, res: Response, next: NextFunction) => {
  return getLabTestById(req, res, next);
};

/**
 * Get laboratories providing home sample collection for a specific test
 */
export const getHomeSampleProvidersForTest = async (req: Request, res: Response, next: NextFunction) => {
  req.query.homeCollectionOnly = 'true';
  return getLaboratoriesForTest(req, res, next);
};

/**
 * Get collection slot availability for a laboratory
 */
export const getHomeSampleAvailability = async (req: Request, res: Response, next: NextFunction) => {
  return getLaboratoryAvailability(req, res, next);
};

/**
 * Create a home sample collection booking (enforces collectionType: 'HOME_COLLECTION')
 */
export const createHomeSampleBooking = async (req: Request, res: Response, next: NextFunction) => {
  req.body.collectionType = 'HOME_COLLECTION';
  return createLabBooking(req, res, next);
};

/**
 * Get authenticated user's home sample collection bookings
 */
export const getMyHomeSampleBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const bookings = await prisma.labBooking.findMany({
      where: {
        userId,
        collectionType: 'HOME_COLLECTION',
      },
      include: {
        test: true,
      },
      orderBy: { bookingDate: 'desc' },
    });

    const labIds = [...new Set(bookings.map((b) => b.laboratoryId))];
    const labs = await prisma.hospital.findMany({
      where: { id: { in: labIds } },
      select: {
        id: true,
        name: true,
        city: true,
        addressLine1: true,
        area: true,
        contactPhone: true,
      },
    });

    const labMap = new Map(labs.map((l) => [l.id, l]));

    const formatted = bookings.map((b) => {
      const lab = labMap.get(b.laboratoryId);
      return {
        id: b.id,
        bookingId: b.bookingNumber,
        bookingNumber: b.bookingNumber,
        type: 'home_sample_collection',
        testId: b.testId,
        testName: b.test.name,
        category: b.test.category,
        sampleType: b.test.sampleType,
        laboratoryId: b.laboratoryId,
        laboratoryName: lab?.name || 'Diagnostic Laboratory',
        laboratoryAddress: [lab?.addressLine1, lab?.area, lab?.city].filter(Boolean).join(', ') || lab?.city || '',
        hospitalId: b.hospitalId,
        patientName: b.patientName,
        patientPhone: b.patientPhone,
        date: b.bookingDate.toISOString().split('T')[0],
        bookingDate: b.bookingDate.toISOString().split('T')[0],
        timeSlot: b.timeSlot,
        time: b.timeSlot,
        collectionType: b.collectionType,
        collectionAddress: b.collectionAddress,
        status: b.status,
        paymentStatus: b.paymentStatus,
        testPrice: b.testPrice,
        collectionFee: b.collectionFee,
        totalAmount: b.totalAmount,
        amount: `₹${Math.round(b.totalAmount)}`,
        prep: b.test.preparation,
        turnaroundTime: b.test.turnaroundTime,
        createdAt: b.createdAt,
      };
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

/**
 * Get details of a single home sample booking by ID or bookingNumber
 */
export const getHomeSampleBookingById = async (req: Request, res: Response, next: NextFunction) => {
  return getLabBookingById(req, res, next);
};

/**
 * Cancel a home sample booking
 */
export const cancelHomeSampleBooking = async (req: Request, res: Response, next: NextFunction) => {
  return cancelLabBooking(req, res, next);
};
