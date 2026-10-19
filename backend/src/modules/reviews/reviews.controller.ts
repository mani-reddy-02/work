import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';
import { createReviewSchema, moderateReviewSchema } from './reviews.schema';
import { ReviewTargetType, ReviewServiceType, ReviewStatus } from '@prisma/client';

const maskReviewerName = (fullName?: string | null) => {
  if (!fullName) return 'Verified Patient';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
};

// --------------------------------------------------------------------------
// 1. SUBMIT REVIEW (Patient authenticated)
// --------------------------------------------------------------------------
export const submitReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const validation = createReviewSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.error.issues[0]?.message || 'Invalid review data'
        }
      });
    }

    const { bookingId, serviceType, targetType, rating, comment } = validation.data;

    let targetHospitalId: string;
    let targetDoctorId: string | null = null;

    // 1. Validate Booking by Service Type
    if (serviceType === 'OP_CONSULTATION' || serviceType === 'VIDEO_CONSULTATION') {
      const opBooking = await prisma.oPBooking.findUnique({
        where: { id: bookingId },
        include: { doctor: true, hospital: true, videoConsultation: true }
      });

      if (!opBooking) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Consultation booking not found' }
        });
      }

      if (opBooking.patientId !== userId) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You can only review bookings registered to your account' }
        });
      }

      // Must be completed
      const isCompleted =
        opBooking.status === 'COMPLETED' ||
        (opBooking.videoConsultation && opBooking.videoConsultation.status === 'COMPLETED');

      if (!isCompleted) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NOT_COMPLETED',
            message: 'You can only review consultations that have been completed by the hospital or doctor'
          }
        });
      }

      if (targetType === 'DOCTOR') {
        if (!opBooking.doctorId) {
          return res.status(400).json({
            success: false,
            error: { code: 'BAD_REQUEST', message: 'Doctor association is missing from this consultation' }
          });
        }
        targetHospitalId = opBooking.hospitalId;
        targetDoctorId = opBooking.doctorId;
      } else {
        targetHospitalId = opBooking.hospitalId;
        targetDoctorId = null;
      }

    } else if (serviceType === 'LAB_TEST' || serviceType === 'HOME_SAMPLE_COLLECTION') {
      const labBooking = await prisma.labBooking.findUnique({
        where: { id: bookingId },
        include: { hospital: true }
      });

      if (!labBooking) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Laboratory booking not found' }
        });
      }

      if (labBooking.patientId !== userId) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You can only review laboratory bookings registered to your account' }
        });
      }

      if (labBooking.status !== 'COMPLETED') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NOT_COMPLETED',
            message: 'You can only review laboratory bookings after reports are ready and completed'
          }
        });
      }

      if (targetType === 'DOCTOR') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Individual doctor reviews are not supported for laboratory services. Please rate the hospital or laboratory provider.'
          }
        });
      }

      targetHospitalId = labBooking.hospitalId;
      targetDoctorId = null;

    } else if (serviceType === 'HOME_NURSING') {
      const nursingBooking = await prisma.homeNursingBooking.findUnique({
        where: { id: bookingId },
        include: { hospital: true }
      });

      if (!nursingBooking) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Home nursing booking not found' }
        });
      }

      if (nursingBooking.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You can only review home nursing bookings registered to your account' }
        });
      }

      if (nursingBooking.status !== 'COMPLETED') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NOT_COMPLETED',
            message: 'You can only review home nursing bookings that have been completed'
          }
        });
      }

      if (targetType === 'DOCTOR') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Individual doctor reviews are not supported for home nursing. Please rate the healthcare provider.'
          }
        });
      }

      targetHospitalId = nursingBooking.hospitalId;
      targetDoctorId = null;

    } else {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Unsupported service type' }
      });
    }

    // 2. Check for duplicate review
    const existingReview = await prisma.review.findUnique({
      where: {
        bookingId_targetType: {
          bookingId,
          targetType: targetType as ReviewTargetType
        }
      }
    });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_REVIEW',
          message: `You have already submitted a review for this ${targetType.toLowerCase()} on this booking.`
        }
      });
    }

    // 3. Create review
    const newReview = await prisma.review.create({
      data: {
        userId,
        bookingId,
        targetType: targetType as ReviewTargetType,
        serviceType: serviceType as ReviewServiceType,
        hospitalId: targetHospitalId,
        doctorId: targetDoctorId,
        rating,
        comment: comment?.trim() || null,
        status: ReviewStatus.PUBLISHED
      },
      include: {
        hospital: { select: { id: true, name: true, logoUrl: true } },
        doctor: { select: { id: true, name: true, avatar: true, specialization: true } },
        user: { select: { id: true, name: true } }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you! Your rating and review have been submitted successfully.',
      data: newReview
    });
  } catch (error) {
    next(error);
  }
};

// --------------------------------------------------------------------------
// 2. GET BOOKING REVIEW STATUS (User authenticated)
// --------------------------------------------------------------------------
export const getBookingReviewStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const bookingId = String(req.params.bookingId);

    // Check existing reviews for this booking
    const reviews = await prisma.review.findMany({
      where: { bookingId, userId },
      include: {
        hospital: { select: { id: true, name: true, logoUrl: true } },
        doctor: { select: { id: true, name: true, avatar: true, specialization: true } }
      }
    });

    const hospitalReview = reviews.find((r) => r.targetType === 'HOSPITAL') || null;
    const doctorReview = reviews.find((r) => r.targetType === 'DOCTOR') || null;

    // Inspect booking to verify completion eligibility & get target details
    let isEligible = false;
    let serviceType: ReviewServiceType = ReviewServiceType.OP_CONSULTATION;
    let hospitalInfo: { id: string; name: string; logoUrl?: string | null } | null = null;
    let doctorInfo: { id: string; name: string; avatar?: string | null; specialization?: string | null } | null = null;

    // Check OP / Video
    const op = await prisma.oPBooking.findUnique({
      where: { id: bookingId },
      include: { doctor: true, hospital: true, videoConsultation: true }
    });

    if (op && op.patientId === userId) {
      serviceType = op.videoConsultation ? ReviewServiceType.VIDEO_CONSULTATION : ReviewServiceType.OP_CONSULTATION;
      isEligible = op.status === 'COMPLETED' || (op.videoConsultation?.status === 'COMPLETED');
      hospitalInfo = { id: op.hospital.id, name: op.hospital.name, logoUrl: op.hospital.logoUrl };
      if (op.doctor) {
        doctorInfo = {
          id: op.doctor.id,
          name: op.doctor.name,
          avatar: op.doctor.avatar,
          specialization: op.doctor.specialization
        };
      }
    } else {
      // Check Lab
      const lab = await prisma.labBooking.findUnique({
        where: { id: bookingId },
        include: { hospital: true }
      });

      if (lab && lab.patientId === userId) {
        serviceType = lab.bookingType === 'HOME_COLLECTION' ? ReviewServiceType.HOME_SAMPLE_COLLECTION : ReviewServiceType.LAB_TEST;
        isEligible = lab.status === 'COMPLETED';
        hospitalInfo = { id: lab.hospital.id, name: lab.hospital.name, logoUrl: lab.hospital.logoUrl };
      } else {
        // Check Nursing
        const nursing = await prisma.homeNursingBooking.findUnique({
          where: { id: bookingId },
          include: { hospital: true }
        });

        if (nursing && nursing.userId === userId) {
          serviceType = ReviewServiceType.HOME_NURSING;
          isEligible = nursing.status === 'COMPLETED';
          hospitalInfo = { id: nursing.hospital.id, name: nursing.hospital.name, logoUrl: nursing.hospital.logoUrl };
        }
      }
    }

    return res.json({
      success: true,
      data: {
        isEligible,
        serviceType,
        hospital: hospitalInfo,
        doctor: doctorInfo,
        hospitalReview,
        doctorReview
      }
    });
  } catch (error) {
    next(error);
  }
};

// --------------------------------------------------------------------------
// 3. GET MY REVIEWS (User authenticated)
// --------------------------------------------------------------------------
export const getMyReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const reviews = await prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        hospital: { select: { id: true, name: true, logoUrl: true } },
        doctor: { select: { id: true, name: true, avatar: true, specialization: true } }
      }
    });

    return res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// --------------------------------------------------------------------------
// 4. GET HOSPITAL REVIEWS & RATING SUMMARY (Public)
// --------------------------------------------------------------------------
export const getHospitalReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = String(req.params.hospitalId);
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const ratingFilter = req.query.rating ? parseInt(req.query.rating as string) : undefined;
    const serviceTypeFilter = req.query.serviceType as ReviewServiceType | undefined;

    const baseWhere = {
      hospitalId,
      targetType: ReviewTargetType.HOSPITAL,
      status: ReviewStatus.PUBLISHED
    };

    // Calculate aggregated stats from PUBLISHED reviews only
    const aggregate = await prisma.review.aggregate({
      where: baseWhere,
      _avg: { rating: true },
      _count: { rating: true }
    });

    // Rating distribution
    const distribution = await prisma.review.groupBy({
      by: ['rating'],
      where: baseWhere,
      _count: { rating: true }
    });

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach((d) => {
      const cnt = (d._count && typeof d._count === 'object' && 'rating' in d._count) ? (d._count as any).rating : 0;
      ratingDistribution[d.rating] = cnt;
    });

    const filterWhere: any = { ...baseWhere };
    if (ratingFilter && ratingFilter >= 1 && ratingFilter <= 5) {
      filterWhere.rating = ratingFilter;
    }
    if (serviceTypeFilter) {
      filterWhere.serviceType = serviceTypeFilter;
    }

    const [totalMatching, reviews] = await Promise.all([
      prisma.review.count({ where: filterWhere }),
      prisma.review.findMany({
        where: filterWhere,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          rating: true,
          comment: true,
          serviceType: true,
          createdAt: true,
          user: { select: { name: true } }
        }
      })
    ]);

    const formattedReviews = reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      serviceType: r.serviceType,
      createdAt: r.createdAt,
      reviewerName: maskReviewerName(r.user?.name)
    }));

    return res.json({
      success: true,
      data: {
        summary: {
          averageRating: aggregate._avg?.rating ? Number(aggregate._avg.rating.toFixed(1)) : null,
          totalReviews: (aggregate._count as any)?.rating ?? 0,
          ratingDistribution
        },
        reviews: formattedReviews,
        pagination: {
          page,
          limit,
          totalItems: totalMatching,
          totalPages: Math.ceil(totalMatching / limit) || 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// --------------------------------------------------------------------------
// 5. GET DOCTOR REVIEWS & RATING SUMMARY (Public)
// --------------------------------------------------------------------------
export const getDoctorReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = String(req.params.doctorId);
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const ratingFilter = req.query.rating ? parseInt(req.query.rating as string) : undefined;

    const baseWhere = {
      doctorId,
      targetType: ReviewTargetType.DOCTOR,
      status: ReviewStatus.PUBLISHED
    };

    const aggregate = await prisma.review.aggregate({
      where: baseWhere,
      _avg: { rating: true },
      _count: { rating: true }
    });

    const distribution = await prisma.review.groupBy({
      by: ['rating'],
      where: baseWhere,
      _count: { rating: true }
    });

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach((d) => {
      const cnt = (d._count && typeof d._count === 'object' && 'rating' in d._count) ? (d._count as any).rating : 0;
      ratingDistribution[d.rating] = cnt;
    });

    const filterWhere: any = { ...baseWhere };
    if (ratingFilter && ratingFilter >= 1 && ratingFilter <= 5) {
      filterWhere.rating = ratingFilter;
    }

    const [totalMatching, reviews] = await Promise.all([
      prisma.review.count({ where: filterWhere }),
      prisma.review.findMany({
        where: filterWhere,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          rating: true,
          comment: true,
          serviceType: true,
          createdAt: true,
          user: { select: { name: true } }
        }
      })
    ]);

    const formattedReviews = reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      serviceType: r.serviceType,
      createdAt: r.createdAt,
      reviewerName: maskReviewerName(r.user?.name)
    }));

    return res.json({
      success: true,
      data: {
        summary: {
          averageRating: aggregate._avg?.rating ? Number(aggregate._avg.rating.toFixed(1)) : null,
          totalReviews: (aggregate._count as any)?.rating ?? 0,
          ratingDistribution
        },
        reviews: formattedReviews,
        pagination: {
          page,
          limit,
          totalItems: totalMatching,
          totalPages: Math.ceil(totalMatching / limit) || 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// --------------------------------------------------------------------------
// 6. HOSPITAL DASHBOARD REVIEWS (Hospital authenticated)
// --------------------------------------------------------------------------
export const getHospitalDashboardReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const hospitalId = user.role === 'SUPER_ADMIN' ? (req.query.hospitalId as string || user.hospitalId) : user.hospitalId;

    if (!hospitalId) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'No hospital association found for authenticated user' }
      });
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const targetTypeFilter = req.query.targetType as ReviewTargetType | 'ALL' | undefined;
    const serviceTypeFilter = req.query.serviceType as ReviewServiceType | undefined;
    const doctorIdFilter = req.query.doctorId as string | undefined;
    const ratingFilter = req.query.rating ? parseInt(req.query.rating as string) : undefined;

    // Hospital rating stats
    const hospitalStats = await prisma.review.aggregate({
      where: {
        hospitalId,
        targetType: ReviewTargetType.HOSPITAL,
        status: ReviewStatus.PUBLISHED
      },
      _avg: { rating: true },
      _count: { rating: true }
    });

    // Associated doctor ratings stats for this hospital
    const doctorStatsAgg = await prisma.review.groupBy({
      by: ['doctorId'],
      where: {
        hospitalId,
        targetType: ReviewTargetType.DOCTOR,
        doctorId: { not: null },
        status: ReviewStatus.PUBLISHED
      },
      _avg: { rating: true },
      _count: { rating: true }
    });

    // Fetch doctor info for the group
    const doctorIds = doctorStatsAgg.map((d) => d.doctorId!).filter(Boolean);
    const doctors = await prisma.user.findMany({
      where: { id: { in: doctorIds } },
      select: { id: true, name: true, avatar: true, specialization: true }
    });

    const doctorSummaries = doctorStatsAgg.map((d) => {
      const doc = doctors.find((item) => item.id === d.doctorId);
      return {
        doctorId: d.doctorId,
        doctorName: doc?.name || 'Unknown Doctor',
        avatar: doc?.avatar || null,
        specialization: doc?.specialization || null,
        averageRating: d._avg.rating ? Number(d._avg.rating.toFixed(1)) : null,
        totalReviews: d._count.rating
      };
    });

    // Filtered reviews query
    const whereClause: any = {
      hospitalId,
      status: ReviewStatus.PUBLISHED
    };

    if (targetTypeFilter && targetTypeFilter !== 'ALL') {
      whereClause.targetType = targetTypeFilter;
    }
    if (serviceTypeFilter) {
      whereClause.serviceType = serviceTypeFilter;
    }
    if (doctorIdFilter) {
      whereClause.doctorId = doctorIdFilter;
    }
    if (ratingFilter && ratingFilter >= 1 && ratingFilter <= 5) {
      whereClause.rating = ratingFilter;
    }

    const [totalItems, reviews] = await Promise.all([
      prisma.review.count({ where: whereClause }),
      prisma.review.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          doctor: { select: { id: true, name: true, avatar: true, specialization: true } },
          user: { select: { id: true, name: true } }
        }
      })
    ]);

    const formattedItems = reviews.map((r) => ({
      id: r.id,
      bookingId: r.bookingId,
      targetType: r.targetType,
      serviceType: r.serviceType,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      doctor: r.doctor,
      patientName: maskReviewerName(r.user?.name)
    }));

    return res.json({
      success: true,
      data: {
        summary: {
          hospital: {
            averageRating: hospitalStats._avg.rating ? Number(hospitalStats._avg.rating.toFixed(1)) : null,
            totalReviews: hospitalStats._count.rating
          },
          doctors: doctorSummaries
        },
        reviews: formattedItems,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages: Math.ceil(totalItems / limit) || 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// --------------------------------------------------------------------------
// 7. ADMIN REVIEWS LIST (Super Admin authenticated)
// --------------------------------------------------------------------------
export const getAdminReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 15));
    const search = (req.query.search as string || '').trim();
    const targetType = req.query.targetType as ReviewTargetType | 'ALL' | undefined;
    const serviceType = req.query.serviceType as ReviewServiceType | undefined;
    const status = req.query.status as ReviewStatus | 'ALL' | undefined;
    const rating = req.query.rating ? parseInt(req.query.rating as string) : undefined;
    const hospitalId = req.query.hospitalId as string | undefined;

    const where: any = {};

    if (targetType && targetType !== 'ALL') {
      where.targetType = targetType;
    }
    if (serviceType) {
      where.serviceType = serviceType;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (rating && rating >= 1 && rating <= 5) {
      where.rating = rating;
    }
    if (hospitalId) {
      where.hospitalId = hospitalId;
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { bookingId: { contains: search, mode: 'insensitive' } },
        { comment: { contains: search, mode: 'insensitive' } },
        { hospital: { name: { contains: search, mode: 'insensitive' } } },
        { doctor: { name: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [totalItems, reviews] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          hospital: { select: { id: true, name: true, logoUrl: true, city: true } },
          doctor: { select: { id: true, name: true, avatar: true, specialization: true } },
          user: { select: { id: true, name: true, phone: true } }
        }
      })
    ]);

    return res.json({
      success: true,
      data: {
        items: reviews,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages: Math.ceil(totalItems / limit) || 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// --------------------------------------------------------------------------
// 8. ADMIN REVIEWS STATS (Super Admin authenticated)
// --------------------------------------------------------------------------
export const getAdminReviewStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalCount,
      publishedCount,
      hiddenCount,
      publishedAgg,
      hospitalAgg,
      doctorAgg,
      starDistribution,
      serviceDistribution,
      recentReviews
    ] = await Promise.all([
      prisma.review.count(),
      prisma.review.count({ where: { status: ReviewStatus.PUBLISHED } }),
      prisma.review.count({ where: { status: ReviewStatus.HIDDEN } }),
      prisma.review.aggregate({
        where: { status: ReviewStatus.PUBLISHED },
        _avg: { rating: true },
        _count: { rating: true }
      }),
      prisma.review.aggregate({
        where: { targetType: ReviewTargetType.HOSPITAL, status: ReviewStatus.PUBLISHED },
        _avg: { rating: true },
        _count: { rating: true }
      }),
      prisma.review.aggregate({
        where: { targetType: ReviewTargetType.DOCTOR, status: ReviewStatus.PUBLISHED },
        _avg: { rating: true },
        _count: { rating: true }
      }),
      prisma.review.groupBy({
        by: ['rating'],
        where: { status: ReviewStatus.PUBLISHED },
        _count: { rating: true }
      }),
      prisma.review.groupBy({
        by: ['serviceType'],
        where: { status: ReviewStatus.PUBLISHED },
        _count: { rating: true }
      }),
      prisma.review.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          hospital: { select: { id: true, name: true } },
          doctor: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } }
        }
      })
    ]);

    const stars: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    starDistribution.forEach((s) => {
      stars[s.rating] = s._count.rating;
    });

    const services: Record<string, number> = {
      OP_CONSULTATION: 0,
      VIDEO_CONSULTATION: 0,
      LAB_TEST: 0,
      HOME_SAMPLE_COLLECTION: 0,
      HOME_NURSING: 0
    };
    serviceDistribution.forEach((s) => {
      services[s.serviceType] = s._count.rating;
    });

    return res.json({
      success: true,
      data: {
        totalReviews: totalCount,
        publishedReviews: publishedCount,
        hiddenReviews: hiddenCount,
        overallAverage: publishedAgg._avg.rating ? Number(publishedAgg._avg.rating.toFixed(1)) : null,
        hospital: {
          count: hospitalAgg._count.rating,
          average: hospitalAgg._avg.rating ? Number(hospitalAgg._avg.rating.toFixed(1)) : null
        },
        doctor: {
          count: doctorAgg._count.rating,
          average: doctorAgg._avg.rating ? Number(doctorAgg._avg.rating.toFixed(1)) : null
        },
        ratingDistribution: stars,
        serviceDistribution: services,
        recentReviews
      }
    });
  } catch (error) {
    next(error);
  }
};

// --------------------------------------------------------------------------
// 9. MODERATE REVIEW (Super Admin authenticated)
// --------------------------------------------------------------------------
export const moderateReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const adminUser = req.user!;
    const validation = moderateReviewSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.error.issues[0]?.message || 'Invalid moderation input'
        }
      });
    }

    const { status, moderationNotes } = validation.data;

    const existingReview = await prisma.review.findUnique({
      where: { id }
    });

    if (!existingReview) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Review not found' }
      });
    }

    const updated = await prisma.review.update({
      where: { id },
      data: {
        status: status as ReviewStatus,
        moderatedAt: new Date(),
        moderatedBy: adminUser.name || adminUser.id,
        moderationNotes: moderationNotes || null
      },
      include: {
        hospital: { select: { id: true, name: true } },
        doctor: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } }
      }
    });

    return res.json({
      success: true,
      message: `Review has been ${status === 'PUBLISHED' ? 'published' : 'hidden'} successfully.`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};
