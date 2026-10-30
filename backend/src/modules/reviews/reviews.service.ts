import { prisma } from '../../config/prisma';
import { 
  ReviewTargetType, 
  ReviewBookingType, 
  ReviewStatus, 
  ResponseStatus, 
  ReportStatus,
  SubmitReviewDto,
  EditReviewDto,
  ReviewInvitationDto,
  ReviewInvitationStatus
} from './reviews.types';
import { sendNotification } from '../notifications/notifications.service';

// Basic profanity / inappropriate content filter list
const BANNED_WORDS = [
  'scam', 'fraud', 'cheat', 'fake', 'bastard', 'idiot', 'stupid', 'abusive',
  'bullshit', 'asshole', 'fuck', 'shit', 'scammer'
];

export class ReviewsService {
  /**
   * Helper: Screen review text for abusive content or leaked personal phone/email
   */
  private screenContent(text?: string | null): { flagged: boolean; reason?: string } {
    if (!text) return { flagged: false };
    const lower = text.toLowerCase();

    // Check banned words
    for (const word of BANNED_WORDS) {
      if (new RegExp(`\\b${word}\\b`, 'i').test(lower)) {
        return { flagged: true, reason: `Contains potentially offensive language: "${word}"` };
      }
    }

    // Check phone number patterns (10 consecutive digits or spaced digits)
    if (/\b\d{5}\s*\d{5}\b|\b\d{10}\b/.test(text)) {
      return { flagged: true, reason: 'Contains personal contact phone number' };
    }

    // Check email pattern
    if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) {
      return { flagged: true, reason: 'Contains personal email address' };
    }

    return { flagged: false };
  }

  /**
   * 1. Get eligible review targets for a completed transaction
   */
  async getEligibleTargets(userId: string, bookingId: string) {
    // Check OP Booking
    const opBooking = await prisma.oPBooking.findUnique({
      where: { id: bookingId },
      include: {
        hospital: true,
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
            qualification: true,
            avatar: true,
            designation: true,
          }
        },
        videoConsultation: true,
      }
    });

    if (opBooking) {
      if (opBooking.patientId !== userId) {
        throw new Error('You are not authorized to review this appointment.');
      }
      if (opBooking.status !== 'COMPLETED') {
        throw new Error('Reviews can only be submitted for completed consultations.');
      }

      const isVideo = Boolean(opBooking.videoConsultation);
      const bookingType: ReviewBookingType = isVideo ? 'VIDEO_CONSULTATION' : 'OP_BOOKING';

      // Check existing reviews
      const existingReviews = await prisma.review.findMany({
        where: {
          bookingId: opBooking.id,
          userId,
        },
        include: {
          response: {
            where: { status: 'APPROVED' }
          }
        }
      });

      const doctorReview = existingReviews.find(r => r.targetType === 'DOCTOR' && r.targetId === opBooking.doctorId);
      const hospitalReview = existingReviews.find(r => r.targetType === 'HOSPITAL' && r.targetId === opBooking.hospitalId);

      const targets = [
        {
          targetType: 'DOCTOR' as ReviewTargetType,
          targetId: opBooking.doctorId,
          title: `Dr. ${opBooking.doctor.name}`,
          subtitle: opBooking.doctor.specialization || opBooking.doctor.designation || 'Doctor',
          avatar: opBooking.doctor.avatar,
          serviceTypeLabel: isVideo ? 'Video Consultation' : 'OP Consultation',
          bookingId: opBooking.id,
          bookingType,
          hospitalId: opBooking.hospitalId,
          doctorId: opBooking.doctorId,
          dimensions: [
            { key: 'medicalCommunication', label: 'Medical communication & explanation' },
            { key: 'professionalBehaviour', label: 'Professional behaviour' },
            { key: 'consultationExperience', label: 'Consultation experience' },
            { key: 'timeAndPunctuality', label: 'Time & punctuality' },
            { key: 'overallDoctorExperience', label: 'Overall doctor experience' },
          ],
          existingReview: doctorReview ? {
            id: doctorReview.id,
            rating: doctorReview.rating,
            categoryRatings: doctorReview.categoryRatings,
            title: doctorReview.title,
            comment: doctorReview.comment,
            isAnonymous: doctorReview.isAnonymous,
            status: doctorReview.status,
            rejectionReason: doctorReview.rejectionReason,
            createdAt: doctorReview.createdAt,
            response: doctorReview.response ? doctorReview.response.response : null,
            canEdit: ['PENDING', 'UNDER_REVIEW'].includes(doctorReview.status),
          } : null,
          canReview: !doctorReview,
        },
        {
          targetType: 'HOSPITAL' as ReviewTargetType,
          targetId: opBooking.hospitalId,
          title: opBooking.hospital.name,
          subtitle: `${opBooking.hospital.city || ''}${opBooking.hospital.state ? ', ' + opBooking.hospital.state : ''}`.trim() || 'Hospital',
          avatar: opBooking.hospital.logoUrl,
          serviceTypeLabel: 'Hospital Experience',
          bookingId: opBooking.id,
          bookingType,
          hospitalId: opBooking.hospitalId,
          dimensions: [
            { key: 'staffBehaviour', label: 'Staff behaviour' },
            { key: 'cleanlinessAndEnvironment', label: 'Cleanliness & environment' },
            { key: 'waitingTimeAndCoordination', label: 'Waiting time & coordination' },
            { key: 'facilitiesAndAccessibility', label: 'Facilities & accessibility' },
            { key: 'overallHospitalExperience', label: 'Overall hospital experience' },
          ],
          existingReview: hospitalReview ? {
            id: hospitalReview.id,
            rating: hospitalReview.rating,
            categoryRatings: hospitalReview.categoryRatings,
            title: hospitalReview.title,
            comment: hospitalReview.comment,
            isAnonymous: hospitalReview.isAnonymous,
            status: hospitalReview.status,
            rejectionReason: hospitalReview.rejectionReason,
            createdAt: hospitalReview.createdAt,
            response: hospitalReview.response ? hospitalReview.response.response : null,
            canEdit: ['PENDING', 'UNDER_REVIEW'].includes(hospitalReview.status),
          } : null,
          canReview: !hospitalReview,
        }
      ];

      return {
        bookingId: opBooking.id,
        bookingType,
        serviceDate: opBooking.appointmentDate,
        patientName: opBooking.patientName,
        status: opBooking.status,
        targets,
      };
    }

    // Check Lab Booking
    const labBooking = await prisma.labBooking.findUnique({
      where: { id: bookingId },
      include: {
        hospital: true,
        items: {
          include: {
            labTest: {
              include: {
                platformTest: true
              }
            }
          }
        }
      }
    });

    if (labBooking) {
      if (labBooking.patientId !== userId) {
        throw new Error('You are not authorized to review this lab order.');
      }
      if (labBooking.status !== 'COMPLETED') {
        throw new Error('Reviews can only be submitted for completed lab bookings.');
      }

      const isHomeSample = labBooking.bookingType === 'HOME_COLLECTION';
      const bookingType: ReviewBookingType = isHomeSample ? 'HOME_SAMPLE' : 'LAB_BOOKING';

      const existingReviews = await prisma.review.findMany({
        where: {
          bookingId: labBooking.id,
          userId,
        },
        include: {
          response: {
            where: { status: 'APPROVED' }
          }
        }
      });

      const labReview = existingReviews.find(r => r.targetType === 'LABORATORY');

      const testNames = labBooking.items.map(i => i.labTest.platformTest.name).slice(0, 2).join(', ');

      const targets = [
        {
          targetType: 'LABORATORY' as ReviewTargetType,
          targetId: labBooking.hospitalId,
          title: labBooking.hospital.name,
          subtitle: testNames ? `${isHomeSample ? 'Home Sample: ' : 'Lab Test: '}${testNames}` : (isHomeSample ? 'Home Sample Collection' : 'Diagnostic Laboratory'),
          avatar: labBooking.hospital.logoUrl,
          serviceTypeLabel: isHomeSample ? 'Home Sample Collection' : 'Lab Test',
          bookingId: labBooking.id,
          bookingType,
          hospitalId: labBooking.hospitalId,
          dimensions: [
            { key: 'sampleCollectionExperience', label: 'Sample collection experience' },
            { key: 'staffBehaviour', label: 'Staff behaviour' },
            { key: 'servicePunctuality', label: 'Service punctuality' },
            { key: 'reportDeliveryExperience', label: 'Report delivery experience' },
            { key: 'overallLaboratoryExperience', label: 'Overall laboratory experience' },
          ],
          existingReview: labReview ? {
            id: labReview.id,
            rating: labReview.rating,
            categoryRatings: labReview.categoryRatings,
            title: labReview.title,
            comment: labReview.comment,
            isAnonymous: labReview.isAnonymous,
            status: labReview.status,
            rejectionReason: labReview.rejectionReason,
            createdAt: labReview.createdAt,
            response: labReview.response ? labReview.response.response : null,
            canEdit: ['PENDING', 'UNDER_REVIEW'].includes(labReview.status),
          } : null,
          canReview: !labReview,
        }
      ];

      return {
        bookingId: labBooking.id,
        bookingType,
        serviceDate: labBooking.createdAt,
        status: labBooking.status,
        targets,
      };
    }

    // Check Home Nursing Booking
    const nursingBooking = await prisma.homeNursingBooking.findUnique({
      where: { id: bookingId },
      include: {
        hospital: true,
        service: true,
        nurse: {
          select: {
            id: true,
            name: true,
            avatar: true,
          }
        }
      }
    });

    if (nursingBooking) {
      if (nursingBooking.userId !== userId) {
        throw new Error('You are not authorized to review this home nursing booking.');
      }
      if (nursingBooking.status !== 'COMPLETED') {
        throw new Error('Reviews can only be submitted for completed nursing visits.');
      }

      const bookingType: ReviewBookingType = 'HOME_NURSING';
      const existingReviews = await prisma.review.findMany({
        where: {
          bookingId: nursingBooking.id,
          userId,
        },
        include: {
          response: {
            where: { status: 'APPROVED' }
          }
        }
      });

      const hospitalReview = existingReviews.find(r => r.targetType === 'HOSPITAL');

      const targets = [
        {
          targetType: 'HOSPITAL' as ReviewTargetType,
          targetId: nursingBooking.hospitalId,
          title: nursingBooking.hospital.name,
          subtitle: `Home Nursing: ${nursingBooking.service.name}`,
          avatar: nursingBooking.hospital.logoUrl,
          serviceTypeLabel: 'Home Nursing Service',
          bookingId: nursingBooking.id,
          bookingType,
          hospitalId: nursingBooking.hospitalId,
          dimensions: [
            { key: 'staffBehaviour', label: 'Nurse & staff behaviour' },
            { key: 'cleanlinessAndEnvironment', label: 'Safety & medical hygiene' },
            { key: 'waitingTimeAndCoordination', label: 'Punctuality & scheduling' },
            { key: 'facilitiesAndAccessibility', label: 'Care quality & equipment' },
            { key: 'overallHospitalExperience', label: 'Overall nursing experience' },
          ],
          existingReview: hospitalReview ? {
            id: hospitalReview.id,
            rating: hospitalReview.rating,
            categoryRatings: hospitalReview.categoryRatings,
            title: hospitalReview.title,
            comment: hospitalReview.comment,
            isAnonymous: hospitalReview.isAnonymous,
            status: hospitalReview.status,
            rejectionReason: hospitalReview.rejectionReason,
            createdAt: hospitalReview.createdAt,
            response: hospitalReview.response ? hospitalReview.response.response : null,
            canEdit: ['PENDING', 'UNDER_REVIEW'].includes(hospitalReview.status),
          } : null,
          canReview: !hospitalReview,
        }
      ];

      return {
        bookingId: nursingBooking.id,
        bookingType,
        serviceDate: nursingBooking.serviceDate,
        status: nursingBooking.status,
        targets,
      };
    }

    throw new Error('Booking record not found.');
  }

  /**
   * 1b. Get all pending review invitations for the authenticated user across all 5 services
   */
  async getPendingInvitations(userId: string, includePostponed = false): Promise<ReviewInvitationDto[]> {
    // 1. Completed OP & Video bookings
    const completedOpBookings = await prisma.oPBooking.findMany({
      where: {
        patientId: userId,
        status: 'COMPLETED',
      },
      include: {
        hospital: true,
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
            designation: true,
            avatar: true,
          }
        },
        videoConsultation: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // 2. Completed Lab bookings
    const completedLabBookings = await prisma.labBooking.findMany({
      where: {
        patientId: userId,
        status: 'COMPLETED',
      },
      include: {
        hospital: true,
        items: {
          include: {
            labTest: {
              include: {
                platformTest: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // 3. Completed Home Nursing bookings
    const completedNursingBookings = await prisma.homeNursingBooking.findMany({
      where: {
        userId,
        status: 'COMPLETED',
      },
      include: {
        hospital: true,
        service: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // 4. Fetch all existing reviews by this user to verify submission status
    const userReviews = await prisma.review.findMany({
      where: { userId },
      select: {
        id: true,
        bookingId: true,
        targetType: true,
        targetId: true,
        status: true,
      }
    });

    const reviewedKeys = new Set(
      userReviews.map(r => `${r.bookingId}_${r.targetType}_${r.targetId}`)
    );

    // 5. Build candidate invitations
    interface CandidateInv {
      bookingId: string;
      bookingType: ReviewBookingType;
      serviceTypeLabel: string;
      serviceDate: string;
      targetType: ReviewTargetType;
      targetId: string;
      targetTitle: string;
      targetSubtitle?: string | null;
      targetAvatar?: string | null;
      dimensions: { key: string; label: string }[];
    }

    const candidates: CandidateInv[] = [];

    // OP & Video
    for (const op of completedOpBookings) {
      const isVideo = Boolean(op.videoConsultation);
      const bType: ReviewBookingType = isVideo ? 'VIDEO_CONSULTATION' : 'OP_BOOKING';
      const sDate = op.appointmentDate
        ? (typeof op.appointmentDate === 'string' ? op.appointmentDate : (op.appointmentDate as Date).toISOString())
        : op.createdAt.toISOString();

      if (op.doctorId && op.doctor) {
        candidates.push({
          bookingId: op.id,
          bookingType: bType,
          serviceTypeLabel: isVideo ? 'Online Video Consultation' : 'In-Person OP Visit',
          serviceDate: sDate,
          targetType: 'DOCTOR',
          targetId: op.doctorId,
          targetTitle: `Dr. ${op.doctor.name.replace(/^Dr\.\s*/i, '')}`,
          targetSubtitle: op.doctor.specialization || op.doctor.designation || 'Specialist Doctor',
          targetAvatar: op.doctor.avatar,
          dimensions: [
            { key: 'medicalCommunication', label: 'Medical communication & explanation' },
            { key: 'professionalBehaviour', label: 'Professional behaviour' },
            { key: 'consultationExperience', label: 'Consultation experience' },
            { key: 'timeAndPunctuality', label: 'Time & punctuality' },
            { key: 'overallDoctorExperience', label: 'Overall doctor experience' },
          ],
        });
      }

      if (op.hospitalId && op.hospital) {
        candidates.push({
          bookingId: op.id,
          bookingType: bType,
          serviceTypeLabel: 'Hospital Experience',
          serviceDate: sDate,
          targetType: 'HOSPITAL',
          targetId: op.hospitalId,
          targetTitle: op.hospital.name,
          targetSubtitle: [op.hospital.area, op.hospital.city].filter(Boolean).join(', ') || 'Partner Hospital',
          targetAvatar: op.hospital.logoUrl,
          dimensions: [
            { key: 'staffBehaviour', label: 'Staff behaviour' },
            { key: 'cleanlinessAndEnvironment', label: 'Cleanliness & environment' },
            { key: 'waitingTimeAndCoordination', label: 'Waiting time & coordination' },
            { key: 'facilitiesAndAccessibility', label: 'Facilities & accessibility' },
            { key: 'overallHospitalExperience', label: 'Overall hospital experience' },
          ],
        });
      }
    }

    // Lab & Home Sample
    for (const lab of completedLabBookings) {
      const isHome = lab.bookingType === 'HOME_COLLECTION';
      const bType: ReviewBookingType = isHome ? 'HOME_SAMPLE' : 'LAB_BOOKING';
      const testNames = lab.items?.map(i => i.labTest?.platformTest?.name).filter(Boolean).slice(0, 2).join(', ');

      if (lab.hospitalId && lab.hospital) {
        candidates.push({
          bookingId: lab.id,
          bookingType: bType,
          serviceTypeLabel: isHome ? 'Home Sample Collection' : 'Diagnostic Lab Visit',
          serviceDate: lab.createdAt.toISOString(),
          targetType: 'LABORATORY',
          targetId: lab.hospitalId,
          targetTitle: lab.hospital.name,
          targetSubtitle: testNames ? `${isHome ? 'Home Sample: ' : 'Test: '}${testNames}` : (isHome ? 'Home Sample Collection' : 'Diagnostic Laboratory'),
          targetAvatar: lab.hospital.logoUrl,
          dimensions: [
            { key: 'sampleCollectionExperience', label: 'Sample collection experience' },
            { key: 'staffBehaviour', label: 'Staff behaviour' },
            { key: 'servicePunctuality', label: 'Service punctuality' },
            { key: 'reportDeliveryExperience', label: 'Report delivery experience' },
            { key: 'overallLaboratoryExperience', label: 'Overall laboratory experience' },
          ],
        });
      }
    }

    // Home Nursing
    for (const nursing of completedNursingBookings) {
      if (nursing.hospitalId && nursing.hospital) {
        candidates.push({
          bookingId: nursing.id,
          bookingType: 'HOME_NURSING',
          serviceTypeLabel: 'Home Nursing Care',
          serviceDate: nursing.serviceDate
            ? (typeof nursing.serviceDate === 'string' ? nursing.serviceDate : (nursing.serviceDate as Date).toISOString())
            : nursing.createdAt.toISOString(),
          targetType: 'HOSPITAL',
          targetId: nursing.hospitalId,
          targetTitle: nursing.hospital.name,
          targetSubtitle: `Home Nursing: ${nursing.service?.name || 'Healthcare Service'}`,
          targetAvatar: nursing.hospital.logoUrl,
          dimensions: [
            { key: 'staffBehaviour', label: 'Nurse & staff behaviour' },
            { key: 'cleanlinessAndEnvironment', label: 'Safety & medical hygiene' },
            { key: 'waitingTimeAndCoordination', label: 'Punctuality & scheduling' },
            { key: 'facilitiesAndAccessibility', label: 'Care quality & equipment' },
            { key: 'overallHospitalExperience', label: 'Overall nursing experience' },
          ],
        });
      }
    }

    // 6. Synchronize with review_invitations table
    const eligible: ReviewInvitationDto[] = [];
    const now = new Date();

    for (const cand of candidates) {
      const key = `${cand.bookingId}_${cand.targetType}_${cand.targetId}`;
      const isAlreadyReviewed = reviewedKeys.has(key);

      const record = await prisma.reviewInvitation.upsert({
        where: {
          userId_bookingId_targetType_targetId: {
            userId,
            bookingId: cand.bookingId,
            targetType: cand.targetType,
            targetId: cand.targetId,
          }
        },
        create: {
          userId,
          bookingId: cand.bookingId,
          bookingType: cand.bookingType,
          targetType: cand.targetType,
          targetId: cand.targetId,
          targetTitle: cand.targetTitle,
          targetSubtitle: cand.targetSubtitle,
          targetAvatar: cand.targetAvatar,
          serviceTypeLabel: cand.serviceTypeLabel,
          serviceDate: cand.serviceDate,
          status: isAlreadyReviewed ? 'SUBMITTED' : 'PENDING',
          submittedAt: isAlreadyReviewed ? now : null,
        },
        update: {
          ...(isAlreadyReviewed ? { status: 'SUBMITTED', submittedAt: now } : {}),
        }
      });

      // Filter out completed or dismissed
      if (record.status === 'SUBMITTED' || record.status === 'DISMISSED') {
        continue;
      }

      // Check postponed cooldown
      if (record.status === 'POSTPONED') {
        if (!includePostponed) {
          if (record.postponedUntil && record.postponedUntil > now) {
            continue; // Postponed cooldown active for popup
          }
        }
      }

      eligible.push({
        id: record.id,
        bookingId: record.bookingId,
        bookingType: record.bookingType as any,
        serviceTypeLabel: record.serviceTypeLabel,
        serviceDate: record.serviceDate,
        targetType: record.targetType as any,
        targetId: record.targetId,
        targetTitle: record.targetTitle,
        targetSubtitle: record.targetSubtitle,
        targetAvatar: record.targetAvatar,
        dimensions: cand.dimensions,
        status: record.status as any,
        postponedUntil: record.postponedUntil,
        canReview: true,
      });
    }

    return eligible;
  }

  /**
   * 1c. Postpone review invitation (user chose Maybe Later or closed popup)
   */
  async postponeInvitation(userId: string, data: { invitationId?: string; bookingId?: string; targetId?: string; hours?: number }) {
    const hours = data.hours || 24;
    const postponedUntil = new Date(Date.now() + hours * 3600 * 1000);

    if (data.invitationId) {
      const inv = await prisma.reviewInvitation.findUnique({
        where: { id: data.invitationId }
      });
      if (!inv || inv.userId !== userId) {
        throw new Error('Review invitation not found or unauthorized.');
      }
      return prisma.reviewInvitation.update({
        where: { id: data.invitationId },
        data: {
          status: 'POSTPONED',
          postponedUntil,
        }
      });
    }

    if (data.bookingId && data.targetId) {
      const inv = await prisma.reviewInvitation.findFirst({
        where: {
          userId,
          bookingId: data.bookingId,
          targetId: data.targetId,
        }
      });
      if (inv) {
        return prisma.reviewInvitation.update({
          where: { id: inv.id },
          data: {
            status: 'POSTPONED',
            postponedUntil,
          }
        });
      }
    }

    return { success: true, message: 'Invitation postponed successfully.' };
  }

  /**
   * 2. Submit Review
   */
  async submitReview(userId: string, data: SubmitReviewDto) {
    if (!data.rating || data.rating < 1 || data.rating > 5) {
      throw new Error('Overall rating must be between 1 and 5 stars.');
    }
    if (!data.bookingId || !data.targetType || !data.targetId) {
      throw new Error('Booking ID, target type, and target ID are required.');
    }

    // Verify eligibility
    const eligibility = await this.getEligibleTargets(userId, data.bookingId);
    const target = eligibility.targets.find(
      t => t.targetType === data.targetType && t.targetId === data.targetId
    );

    if (!target) {
      throw new Error('This target is not eligible for review on this transaction.');
    }
    if (!target.canReview) {
      throw new Error('You have already submitted a review for this target and booking.');
    }

    // Validate category dimensions
    const categoryRatings = data.categoryRatings || {};
    for (const dim of target.dimensions) {
      const val = categoryRatings[dim.key];
      if (val !== undefined && (val < 1 || val > 5)) {
        throw new Error(`Rating for ${dim.label} must be between 1 and 5.`);
      }
    }

    // Content screening for profanity & personal info
    const screenTitle = this.screenContent(data.title);
    const screenComment = this.screenContent(data.comment);
    let initialStatus: ReviewStatus = 'PENDING';
    let flagReason: string | undefined = undefined;

    if (screenTitle.flagged || screenComment.flagged) {
      initialStatus = 'FLAGGED';
      flagReason = screenTitle.reason || screenComment.reason;
    }

    const bookingType = data.bookingType || target.bookingType;

    // Create review
    const review = await prisma.review.create({
      data: {
        userId,
        targetType: data.targetType,
        targetId: data.targetId,
        bookingType,
        bookingId: data.bookingId,
        opBookingId: ['OP_BOOKING', 'VIDEO_CONSULTATION'].includes(bookingType) ? data.bookingId : null,
        labBookingId: ['LAB_BOOKING', 'HOME_SAMPLE'].includes(bookingType) ? data.bookingId : null,
        nursingBookingId: bookingType === 'HOME_NURSING' ? data.bookingId : null,
        hospitalId: (target as any).hospitalId || null,
        doctorId: (target as any).doctorId || null,
        rating: Math.round(data.rating),
        categoryRatings,
        title: data.title?.trim() || null,
        comment: data.comment?.trim() || null,
        serviceSpecificFeedback: data.serviceSpecificFeedback ? (data.serviceSpecificFeedback as any) : undefined,
        isAnonymous: Boolean(data.isAnonymous),
        isVerified: true,
        guidelinesAcknowledged: true,
        status: initialStatus,
        rejectionReason: flagReason,
      },
      include: {
        user: { select: { id: true, name: true } },
      }
    });

    // Send notifications
    try {
      // 1. Patient confirmation notification
      await sendNotification({
        userId,
        title: 'Review Submitted',
        message: initialStatus === 'FLAGGED'
          ? 'Your review has been submitted and is currently flagged for admin verification.'
          : 'Your review has been submitted successfully and is pending moderation approval.',
        type: 'review',
        metadata: { reviewId: review.id, targetType: data.targetType }
      });

      // 2. Platform Admin notification
      await sendNotification({
        title: initialStatus === 'FLAGGED' ? 'Flagged Review Needs Review' : 'New Review Awaiting Moderation',
        message: `${(review as any).user?.name || 'A patient'} submitted a ${data.rating}-star review for ${target.title}.`,
        type: 'review_moderation',
        targetRoles: ['SUPER_ADMIN'],
        metadata: { reviewId: review.id, targetType: data.targetType, initialStatus }
      });
    } catch (notifErr) {
      console.error('Failed to dispatch notification for review submission:', notifErr);
    }

    // Mark invitation as SUBMITTED in database
    try {
      await prisma.reviewInvitation.upsert({
        where: {
          userId_bookingId_targetType_targetId: {
            userId,
            bookingId: data.bookingId,
            targetType: data.targetType,
            targetId: data.targetId,
          }
        },
        create: {
          userId,
          bookingId: data.bookingId,
          bookingType,
          targetType: data.targetType,
          targetId: data.targetId,
          targetTitle: target.title,
          targetSubtitle: target.subtitle,
          targetAvatar: target.avatar,
          serviceTypeLabel: target.serviceTypeLabel,
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
        update: {
          status: 'SUBMITTED',
          submittedAt: new Date(),
        }
      });
    } catch (invErr) {
      console.error('Failed to update review invitation status on submit:', invErr);
    }

    return review;
  }

  /**
   * 3. Edit review (permitted only when pending or under review)
   */
  async editReview(userId: string, reviewId: string, data: EditReviewDto) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review) throw new Error('Review not found.');
    if (review.userId !== userId) throw new Error('You are not authorized to edit this review.');
    if (!['PENDING', 'UNDER_REVIEW', 'FLAGGED'].includes(review.status)) {
      throw new Error('Only reviews pending approval or under review can be edited.');
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: data.rating !== undefined ? Math.round(data.rating) : undefined,
        categoryRatings: data.categoryRatings !== undefined ? data.categoryRatings : undefined,
        title: data.title !== undefined ? data.title.trim() : undefined,
        comment: data.comment !== undefined ? data.comment.trim() : undefined,
        isAnonymous: data.isAnonymous !== undefined ? Boolean(data.isAnonymous) : undefined,
        status: 'PENDING',
        rejectionReason: null,
      }
    });

    return updated;
  }

  /**
   * 4. Get patient's own reviews
   */
  async getMyReviews(userId: string) {
    const reviews = await prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        hospital: { select: { id: true, name: true, logoUrl: true, city: true } },
        doctor: { select: { id: true, name: true, specialization: true, avatar: true } },
        response: {
          where: { status: 'APPROVED' },
          select: { id: true, response: true, createdAt: true }
        }
      }
    });

    return reviews;
  }

  /**
   * 5. Public Reviews Endpoint (only APPROVED / Published reviews)
   */
  async getPublicReviews(params: {
    targetType: ReviewTargetType;
    targetId: string;
    page?: number;
    limit?: number;
    ratingFilter?: number;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(params.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {
      targetType: params.targetType,
      targetId: params.targetId,
      status: 'APPROVED',
    };

    if (params.ratingFilter && params.ratingFilter >= 1 && params.ratingFilter <= 5) {
      where.rating = Number(params.ratingFilter);
    }

    const [reviews, totalCount, aggregate] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            }
          },
          response: {
            where: { status: 'APPROVED' },
            select: {
              id: true,
              response: true,
              status: true,
              createdAt: true,
            }
          }
        }
      }),
      prisma.review.count({ where }),
      prisma.reviewAggregate.findUnique({
        where: {
          targetType_targetId: {
            targetType: params.targetType,
            targetId: params.targetId,
          }
        }
      })
    ]);

    // Format reviews for privacy
    const formattedReviews = reviews.map(r => {
      let displayName = 'Verified Patient';
      if (!r.isAnonymous && r.user?.name) {
        const parts = r.user.name.trim().split(/\s+/);
        displayName = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
      }

      return {
        id: r.id,
        rating: r.rating,
        categoryRatings: r.categoryRatings,
        title: r.title,
        comment: r.comment,
        isVerified: r.isVerified,
        isAnonymous: r.isAnonymous,
        displayName,
        publishedAt: r.publishedAt || r.createdAt,
        bookingType: r.bookingType,
        officialResponse: r.response ? {
          response: r.response.response,
          status: r.response.status,
          publishedAt: r.response.createdAt,
        } : null,
        response: r.response ? {
          response: r.response.response,
          status: r.response.status,
          publishedAt: r.response.createdAt,
        } : null,
      };
    });

    return {
      reviews: formattedReviews,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
      aggregate: aggregate ? {
        averageRating: aggregate.averageRating,
        totalReviews: aggregate.totalReviews,
        distribution: {
          1: aggregate.oneStarCount,
          2: aggregate.twoStarCount,
          3: aggregate.threeStarCount,
          4: aggregate.fourStarCount,
          5: aggregate.fiveStarCount,
        },
        categoryAverages: aggregate.categoryAverages,
        positiveCount: aggregate.positiveCount,
        neutralCount: aggregate.neutralCount,
        negativeCount: aggregate.negativeCount,
      } : {
        averageRating: 0,
        totalReviews: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        categoryAverages: null,
        positiveCount: 0,
        neutralCount: 0,
        negativeCount: 0,
      }
    };
  }

  /**
   * 6. Provider Reviews Endpoint (Hospital Dashboard / Doctor View)
   */
  async getProviderReviews(user: { id: string; role: string; hospitalId?: string | null }, params: {
    targetType?: ReviewTargetType;
    doctorId?: string;
    status?: ReviewStatus;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(params.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    // Hospital Scope
    if (user.role === 'DOCTOR') {
      where.OR = [
        { targetType: 'DOCTOR', targetId: user.id },
        { doctorId: user.id }
      ];
    } else if (user.role === 'HOSPITAL_ADMIN' || user.role === 'LAB_ADMIN') {
      if (!user.hospitalId) {
        throw new Error('Hospital staff must be associated with a valid hospital.');
      }
      where.hospitalId = user.hospitalId;

      if (params.targetType) {
        where.targetType = params.targetType;
      }
      if (params.doctorId) {
        where.doctorId = params.doctorId;
      }
    } else if (user.role !== 'SUPER_ADMIN') {
      throw new Error('Unauthorized review access.');
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.search) {
      const term = params.search.trim();
      where.OR = [
        { comment: { contains: term, mode: 'insensitive' } },
        { title: { contains: term, mode: 'insensitive' } },
        { user: { name: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, phone: true } },
          doctor: { select: { id: true, name: true, specialization: true } },
          hospital: { select: { id: true, name: true } },
          response: true,
          reports: true,
        }
      }),
      prisma.review.count({ where })
    ]);

    const formatted = reviews.map(r => {
      const isAnon = r.isAnonymous;
      const patientDisplay = isAnon ? 'Anonymous Patient' : r.user?.name || 'Verified Patient';

      return {
        id: r.id,
        targetType: r.targetType,
        targetId: r.targetId,
        bookingType: r.bookingType,
        bookingId: r.bookingId,
        rating: r.rating,
        categoryRatings: r.categoryRatings,
        title: r.title,
        comment: r.comment,
        patientDisplay,
        isAnonymous: r.isAnonymous,
        isVerified: r.isVerified,
        status: r.status,
        rejectionReason: r.rejectionReason,
        createdAt: r.createdAt,
        publishedAt: r.publishedAt,
        doctor: r.doctor ? { id: r.doctor.id, name: r.doctor.name, specialization: r.doctor.specialization } : null,
        hospital: r.hospital ? { id: r.hospital.id, name: r.hospital.name } : null,
        response: r.response ? {
          id: r.response.id,
          response: r.response.response,
          status: r.response.status,
          rejectionReason: r.response.rejectionReason,
          createdAt: r.response.createdAt,
        } : null,
        reportCount: r.reports.length,
      };
    });

    return {
      reviews: formatted,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      }
    };
  }

  /**
   * 7. Hospital Review Analytics
   */
  async getHospitalReviewAnalytics(hospitalId: string, doctorId?: string) {
    const where: any = {
      hospitalId,
      status: 'APPROVED',
    };
    if (doctorId) {
      where.doctorId = doctorId;
    }

    const [
      publishedReviews,
      pendingCount,
      allHospitalReviews,
      pendingResponsesCount,
      reportedReviewsCount,
      doctorsList
    ] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { publishedAt: 'desc' }
      }),
      prisma.review.count({
        where: { hospitalId, status: 'PENDING' }
      }),
      prisma.review.findMany({
        where: { hospitalId },
        include: { response: true, reports: true }
      }),
      prisma.reviewResponse.count({
        where: {
          review: { hospitalId },
          status: 'PENDING'
        }
      }),
      prisma.reviewReport.count({
        where: {
          review: { hospitalId },
          status: 'PENDING'
        }
      }),
      prisma.user.findMany({
        where: { hospitalId, role: 'DOCTOR' },
        select: {
          id: true,
          name: true,
          specialization: true,
          rating: true,
          reviewCount: true,
          avatar: true,
        }
      })
    ]);

    const totalPublished = publishedReviews.length;
    let sum = 0;
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let positive = 0;
    let neutral = 0;
    let negative = 0;

    const dimensionSums: Record<string, { sum: number; count: number }> = {};

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    let newReviewsCount = 0;

    // Monthly trends map (last 6 months)
    const monthlyMap = new Map<string, { sum: number; count: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
      monthlyMap.set(label, { sum: 0, count: 0 });
    }

    publishedReviews.forEach(r => {
      sum += r.rating;
      const rounded = Math.min(5, Math.max(1, Math.round(r.rating)));
      distribution[rounded] = (distribution[rounded] || 0) + 1;

      if (r.rating >= 4) positive++;
      else if (r.rating === 3) neutral++;
      else negative++;

      if (r.publishedAt && r.publishedAt >= thirtyDaysAgo) {
        newReviewsCount++;
      }

      // Monthly Trend
      const rDate = r.publishedAt || r.createdAt;
      const mLabel = new Date(rDate).toLocaleString('en-IN', { month: 'short', year: '2-digit' });
      if (monthlyMap.has(mLabel)) {
        const item = monthlyMap.get(mLabel)!;
        item.sum += r.rating;
        item.count += 1;
      }

      // Dimension averages
      if (r.categoryRatings && typeof r.categoryRatings === 'object') {
        const cat = r.categoryRatings as Record<string, any>;
        Object.keys(cat).forEach(k => {
          const val = Number(cat[k]);
          if (!isNaN(val) && val > 0) {
            if (!dimensionSums[k]) dimensionSums[k] = { sum: 0, count: 0 };
            dimensionSums[k].sum += val;
            dimensionSums[k].count += 1;
          }
        });
      }
    });

    const averageRating = totalPublished > 0 ? Number((sum / totalPublished).toFixed(1)) : 0;

    const categoryAverages: Record<string, number> = {};
    Object.keys(dimensionSums).forEach(k => {
      categoryAverages[k] = Number((dimensionSums[k].sum / dimensionSums[k].count).toFixed(1));
    });

    // Reviews requiring response: published reviews that don't have an approved or pending response
    const reviewsRequiringResponse = allHospitalReviews.filter(
      r => r.status === 'APPROVED' && (!r.response || r.response.status === 'REJECTED')
    ).length;

    const monthlyTrends = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      averageRating: data.count > 0 ? Number((data.sum / data.count).toFixed(1)) : 0,
      reviewCount: data.count,
    }));

    // Doctor rating breakdown
    const doctorBreakdown = doctorsList.map(doc => {
      const docReviews = publishedReviews.filter(r => r.targetType === 'DOCTOR' && r.targetId === doc.id);
      const docSum = docReviews.reduce((acc, curr) => acc + curr.rating, 0);
      const docAvg = docReviews.length > 0 ? Number((docSum / docReviews.length).toFixed(1)) : null;

      return {
        id: doc.id,
        name: doc.name,
        specialization: doc.specialization,
        avatar: doc.avatar,
        averageRating: docAvg,
        reviewCount: docReviews.length,
      };
    });

    return {
      overallRating: averageRating,
      totalPublishedReviews: totalPublished,
      newReviewsCount,
      pendingModerationCount: pendingCount,
      reviewsRequiringResponse,
      pendingResponsesCount,
      reportedReviewsCount,
      distribution,
      sentimentDistribution: {
        positive,
        neutral,
        negative,
      },
      categoryAverages,
      monthlyTrends,
      doctorBreakdown,
    };
  }

  /**
   * 8. Submit Provider Response
   */
  async submitProviderResponse(
    user: { id: string; role: string; hospitalId?: string | null },
    reviewId: string,
    responseText: string
  ) {
    if (!responseText || !responseText.trim()) {
      throw new Error('Response text cannot be empty.');
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { response: true, hospital: true, doctor: true }
    });

    if (!review) throw new Error('Review not found.');

    // Permissions check
    if (user.role === 'DOCTOR') {
      if (review.doctorId !== user.id && review.targetId !== user.id) {
        throw new Error('Doctors can only respond to their own reviews.');
      }
    } else if (user.role === 'HOSPITAL_ADMIN' || user.role === 'LAB_ADMIN') {
      if (review.hospitalId !== user.hospitalId) {
        throw new Error('You are not authorized to respond on behalf of another hospital.');
      }
    } else if (user.role !== 'SUPER_ADMIN') {
      throw new Error('Unauthorized to submit review responses.');
    }

    if (review.response) {
      throw new Error('An official response has already been submitted for this review.');
    }

    // Screen response
    const screen = this.screenContent(responseText);
    if (screen.flagged) {
      throw new Error(`Your response cannot be submitted: ${screen.reason}`);
    }

    const responseRecord = await prisma.reviewResponse.create({
      data: {
        reviewId,
        responderId: user.id,
        response: responseText.trim(),
        status: 'PENDING',
      }
    });

    // Notify admin
    try {
      await sendNotification({
        title: 'Provider Response Awaiting Approval',
        message: `An official response was submitted for a review on ${review.targetType.toLowerCase()}.`,
        type: 'review_moderation',
        targetRoles: ['SUPER_ADMIN'],
        metadata: { responseId: responseRecord.id, reviewId }
      });
    } catch (err) {
      console.error('Failed to notify admin of provider response:', err);
    }

    return responseRecord;
  }

  /**
   * 9. Report Review
   */
  async reportReview(
    user: { id: string; role: string },
    reviewId: string,
    reason: string,
    details?: string
  ) {
    if (!reason || !reason.trim()) {
      throw new Error('Report reason is required.');
    }

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new Error('Review not found.');

    const report = await prisma.reviewReport.create({
      data: {
        reviewId,
        reporterId: user.id,
        reporterRole: user.role,
        reason: reason.trim(),
        details: details?.trim() || null,
        status: 'PENDING',
      }
    });

    // Notify admin
    try {
      await sendNotification({
        title: 'Review Reported for Investigation',
        message: `A ${user.role.toLowerCase()} reported review ${reviewId.slice(0, 8)}: "${reason}".`,
        type: 'review_moderation',
        targetRoles: ['SUPER_ADMIN'],
        metadata: { reportId: report.id, reviewId }
      });
    } catch (err) {
      console.error('Failed to notify admin of report:', err);
    }

    return report;
  }

  /**
   * 10. Admin: Get all reviews with filters, pagination, and search
   */
  async adminGetReviews(params: {
    targetType?: ReviewTargetType;
    status?: ReviewStatus;
    rating?: number;
    search?: string;
    hospitalId?: string;
    doctorId?: string;
    labId?: string;
    isVerified?: boolean;
    hasReports?: boolean;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 15));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.targetType) where.targetType = params.targetType;
    if (params.status) where.status = params.status;
    if (params.rating) where.rating = Number(params.rating);
    if (params.hospitalId) where.hospitalId = params.hospitalId;
    if (params.doctorId) where.doctorId = params.doctorId;
    if (params.labId) where.labId = params.labId;
    if (params.isVerified !== undefined) where.isVerified = Boolean(params.isVerified);

    if (params.hasReports) {
      where.reports = { some: {} };
    }

    if (params.fromDate || params.toDate) {
      where.createdAt = {};
      if (params.fromDate) where.createdAt.gte = new Date(params.fromDate);
      if (params.toDate) where.createdAt.lte = new Date(params.toDate);
    }

    if (params.search) {
      const term = params.search.trim();
      where.OR = [
        { comment: { contains: term, mode: 'insensitive' } },
        { title: { contains: term, mode: 'insensitive' } },
        { user: { name: { contains: term, mode: 'insensitive' } } },
        { hospital: { name: { contains: term, mode: 'insensitive' } } },
        { doctor: { name: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, phone: true, email: true } },
          hospital: { select: { id: true, name: true, city: true } },
          doctor: { select: { id: true, name: true, specialization: true } },
          response: {
            include: {
              responder: { select: { id: true, name: true, role: true } }
            }
          },
          reports: {
            include: {
              reporter: { select: { id: true, name: true, role: true } }
            }
          },
          moderationLogs: {
            orderBy: { createdAt: 'desc' },
            include: { admin: { select: { id: true, name: true } } }
          }
        }
      }),
      prisma.review.count({ where })
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      }
    };
  }

  /**
   * 11. Admin: Review Analytics Overview
   */
  async adminGetAnalytics() {
    const [
      totalReviews,
      publishedReviews,
      pendingReviews,
      rejectedReviews,
      flaggedReviews,
      reportedCount,
      allApproved,
      doctorAggregates,
      hospitalAggregates,
      labAggregates,
      pendingResponsesCount
    ] = await Promise.all([
      prisma.review.count(),
      prisma.review.count({ where: { status: 'APPROVED' } }),
      prisma.review.count({ where: { status: 'PENDING' } }),
      prisma.review.count({ where: { status: 'REJECTED' } }),
      prisma.review.count({ where: { status: 'FLAGGED' } }),
      prisma.reviewReport.count({ where: { status: 'PENDING' } }),
      prisma.review.findMany({
        where: { status: 'APPROVED' },
        select: { rating: true, targetType: true, publishedAt: true, createdAt: true }
      }),
      prisma.reviewAggregate.findMany({
        where: { targetType: 'DOCTOR' },
        take: 10,
        orderBy: { averageRating: 'desc' }
      }),
      prisma.reviewAggregate.findMany({
        where: { targetType: 'HOSPITAL' },
        take: 10,
        orderBy: { averageRating: 'desc' }
      }),
      prisma.reviewAggregate.findMany({
        where: { targetType: 'LABORATORY' },
        take: 10,
        orderBy: { averageRating: 'desc' }
      }),
      prisma.reviewResponse.count({ where: { status: 'PENDING' } })
    ]);

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let doctorSum = 0, doctorCount = 0;
    let hospitalSum = 0, hospitalCount = 0;
    let labSum = 0, labCount = 0;

    const now = new Date();
    const monthlyMap = new Map<string, { sum: number; count: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
      monthlyMap.set(label, { sum: 0, count: 0 });
    }

    allApproved.forEach(r => {
      const rounded = Math.min(5, Math.max(1, Math.round(r.rating)));
      distribution[rounded] = (distribution[rounded] || 0) + 1;

      if (r.targetType === 'DOCTOR') {
        doctorSum += r.rating;
        doctorCount++;
      } else if (r.targetType === 'HOSPITAL') {
        hospitalSum += r.rating;
        hospitalCount++;
      } else if (r.targetType === 'LABORATORY') {
        labSum += r.rating;
        labCount++;
      }

      const rDate = r.publishedAt || r.createdAt;
      const mLabel = new Date(rDate).toLocaleString('en-IN', { month: 'short', year: '2-digit' });
      if (monthlyMap.has(mLabel)) {
        const item = monthlyMap.get(mLabel)!;
        item.sum += r.rating;
        item.count += 1;
      }
    });

    const averageDoctorRating = doctorCount > 0 ? Number((doctorSum / doctorCount).toFixed(1)) : null;
    const averageHospitalRating = hospitalCount > 0 ? Number((hospitalSum / hospitalCount).toFixed(1)) : null;
    const averageLaboratoryRating = labCount > 0 ? Number((labSum / labCount).toFixed(1)) : null;

    const monthlyTrends = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      averageRating: data.count > 0 ? Number((data.sum / data.count).toFixed(1)) : 0,
      volume: data.count,
    }));

    return {
      metrics: {
        totalReviews,
        publishedReviews,
        pendingReviews,
        rejectedReviews,
        flaggedReviews,
        reportedReviews: reportedCount,
        moderationQueueCount: pendingReviews + flaggedReviews,
        pendingResponsesCount,
        averageDoctorRating,
        averageHospitalRating,
        averageLaboratoryRating,
      },
      distribution,
      monthlyTrends,
      topDoctors: doctorAggregates,
      topHospitals: hospitalAggregates,
      topLaboratories: labAggregates,
    };
  }

  /**
   * 12. Admin: Moderate Review (APPROVE, REJECT, FLAG, REMOVE)
   */
  async adminModerateReview(
    adminId: string,
    reviewId: string,
    action: 'APPROVE' | 'REJECT' | 'FLAG' | 'REMOVE',
    reason?: string
  ) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { user: true, hospital: true, doctor: true }
    });

    if (!review) throw new Error('Review not found.');

    if ((action === 'REJECT' || action === 'REMOVE') && (!reason || !reason.trim())) {
      throw new Error(`A valid reason is required to ${action.toLowerCase()} a review.`);
    }

    const previousStatus = review.status;
    let newStatus: ReviewStatus;
    let publishedAt = review.publishedAt;

    switch (action) {
      case 'APPROVE':
        newStatus = 'APPROVED';
        publishedAt = new Date();
        break;
      case 'REJECT':
        newStatus = 'REJECTED';
        break;
      case 'FLAG':
        newStatus = 'FLAGGED';
        break;
      case 'REMOVE':
        newStatus = 'REMOVED';
        break;
      default:
        throw new Error('Invalid moderation action.');
    }

    // Update review and log in transaction
    const updatedReview = await prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({
        where: { id: reviewId },
        data: {
          status: newStatus,
          rejectionReason: reason?.trim() || null,
          publishedAt,
          moderatedBy: adminId,
          moderatedAt: new Date(),
        }
      });

      await tx.reviewModerationLog.create({
        data: {
          reviewId,
          adminId,
          action,
          previousStatus,
          newStatus,
          reason: reason?.trim() || null,
        }
      });

      return updated;
    });

    // Centralized synchronization: recalculate aggregates immediately
    await this.recalculateAggregates(review.targetType, review.targetId, review.hospitalId);

    // Send notifications
    try {
      if (newStatus === 'APPROVED') {
        // Notify patient
        await sendNotification({
          userId: review.userId,
          title: 'Your Review is Published!',
          message: `Your ${review.rating}-star review has been approved and is now visible publicly.`,
          type: 'review',
          metadata: { reviewId: review.id, rating: review.rating }
        });

        // Notify Hospital
        if (review.hospitalId) {
          await sendNotification({
            hospitalId: review.hospitalId,
            title: 'New Published Review',
            message: `A new ${review.rating}-star review has been published for ${review.targetType.toLowerCase()}.`,
            type: 'review',
            targetRoles: ['HOSPITAL_ADMIN'],
            metadata: { reviewId: review.id, targetType: review.targetType }
          });
        }

        // Notify Doctor
        if (review.doctorId) {
          await sendNotification({
            userId: review.doctorId,
            hospitalId: review.hospitalId,
            title: 'New Patient Review Published',
            message: `A patient has published a ${review.rating}-star review for your consultation.`,
            type: 'review',
            targetRoles: ['DOCTOR'],
            metadata: { reviewId: review.id }
          });
        }
      } else if (newStatus === 'REJECTED' || newStatus === 'REMOVED') {
        await sendNotification({
          userId: review.userId,
          title: `Review ${newStatus === 'REJECTED' ? 'Not Approved' : 'Removed'}`,
          message: `Your review could not be published: ${reason}`,
          type: 'review',
          metadata: { reviewId: review.id, reason }
        });
      }
    } catch (notifErr) {
      console.error('Failed to dispatch moderation notification:', notifErr);
    }

    return updatedReview;
  }

  /**
   * 13. Admin: Moderate Provider Response (APPROVE, REJECT)
   */
  async adminModerateResponse(
    adminId: string,
    responseId: string,
    action: 'APPROVE' | 'REJECT',
    reason?: string
  ) {
    const response = await prisma.reviewResponse.findUnique({
      where: { id: responseId },
      include: {
        review: {
          include: { user: true }
        }
      }
    });

    if (!response) throw new Error('Response not found.');

    const newStatus: ResponseStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    const updated = await prisma.$transaction(async (tx) => {
      const resp = await tx.reviewResponse.update({
        where: { id: responseId },
        data: {
          status: newStatus,
          rejectionReason: reason?.trim() || null,
          moderatedBy: adminId,
          moderatedAt: new Date(),
        }
      });

      await tx.reviewModerationLog.create({
        data: {
          reviewId: response.reviewId,
          responseId,
          adminId,
          action: `RESPONSE_${action}`,
          previousStatus: response.status,
          newStatus,
          reason: reason?.trim() || null,
        }
      });

      return resp;
    });

    // Notify patient if approved
    if (newStatus === 'APPROVED' && response.review.userId) {
      try {
        await sendNotification({
          userId: response.review.userId,
          title: 'Provider Responded to Your Review',
          message: 'The healthcare provider has posted an official response to your review.',
          type: 'review',
          metadata: { reviewId: response.reviewId }
        });
      } catch (err) {
        console.error('Failed to notify patient of provider response:', err);
      }
    }

    return updated;
  }

  /**
   * 14. Admin: Resolve Review Report
   */
  async adminResolveReport(
    adminId: string,
    reportId: string,
    resolution: 'RESOLVED' | 'DISMISSED',
    notes?: string
  ) {
    const report = await prisma.reviewReport.findUnique({ where: { id: reportId } });
    if (!report) throw new Error('Report not found.');

    const updated = await prisma.reviewReport.update({
      where: { id: reportId },
      data: {
        status: resolution,
        resolvedBy: adminId,
        resolvedAt: new Date(),
        resolutionNotes: notes?.trim() || null,
      }
    });

    return updated;
  }

  /**
   * 15. Centralized Aggregation & Cross-Module Synchronization
   * Computes mathematical average and category distributions transactionally.
   * Updates ReviewAggregate and synchronization fields on Doctor, Hospital, or Lab.
   */
  async recalculateAggregates(
    targetType: ReviewTargetType,
    targetId: string,
    hospitalId?: string | null
  ) {
    // 1. Fetch all APPROVED reviews for this specific target
    const approvedReviews = await prisma.review.findMany({
      where: {
        targetType,
        targetId,
        status: 'APPROVED',
      }
    });

    const totalReviews = approvedReviews.length;
    let sum = 0;
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let positive = 0;
    let neutral = 0;
    let negative = 0;
    const dimensionSums: Record<string, { sum: number; count: number }> = {};

    approvedReviews.forEach(r => {
      sum += r.rating;
      const rounded = Math.min(5, Math.max(1, Math.round(r.rating)));
      distribution[rounded] = (distribution[rounded] || 0) + 1;

      if (r.rating >= 4) positive++;
      else if (r.rating === 3) neutral++;
      else negative++;

      if (r.categoryRatings && typeof r.categoryRatings === 'object') {
        const cat = r.categoryRatings as Record<string, any>;
        Object.keys(cat).forEach(k => {
          const val = Number(cat[k]);
          if (!isNaN(val) && val > 0) {
            if (!dimensionSums[k]) dimensionSums[k] = { sum: 0, count: 0 };
            dimensionSums[k].sum += val;
            dimensionSums[k].count += 1;
          }
        });
      }
    });

    const averageRating = totalReviews > 0 ? Number((sum / totalReviews).toFixed(1)) : 0;

    const categoryAverages: Record<string, number> = {};
    Object.keys(dimensionSums).forEach(k => {
      categoryAverages[k] = Number((dimensionSums[k].sum / dimensionSums[k].count).toFixed(1));
    });

    // 2. Transactionally update ReviewAggregate & target entity
    await prisma.$transaction(async (tx) => {
      // Upsert ReviewAggregate
      await tx.reviewAggregate.upsert({
        where: {
          targetType_targetId: {
            targetType,
            targetId,
          }
        },
        create: {
          targetType,
          targetId,
          hospitalId: hospitalId || null,
          averageRating,
          totalReviews,
          oneStarCount: distribution[1] || 0,
          twoStarCount: distribution[2] || 0,
          threeStarCount: distribution[3] || 0,
          fourStarCount: distribution[4] || 0,
          fiveStarCount: distribution[5] || 0,
          categoryAverages,
          positiveCount: positive,
          neutralCount: neutral,
          negativeCount: negative,
        },
        update: {
          averageRating,
          totalReviews,
          oneStarCount: distribution[1] || 0,
          twoStarCount: distribution[2] || 0,
          threeStarCount: distribution[3] || 0,
          fourStarCount: distribution[4] || 0,
          fiveStarCount: distribution[5] || 0,
          categoryAverages,
          positiveCount: positive,
          neutralCount: neutral,
          negativeCount: negative,
          hospitalId: hospitalId || undefined,
        }
      });

      // Synchronize entity table
      if (targetType === 'DOCTOR') {
        await tx.user.update({
          where: { id: targetId },
          data: {
            rating: totalReviews > 0 ? averageRating : null,
            reviewCount: totalReviews,
          }
        }).catch(() => null);
      } else if (targetType === 'HOSPITAL') {
        await tx.hospital.update({
          where: { id: targetId },
          data: {
            rating: totalReviews > 0 ? averageRating : null,
            reviewCount: totalReviews,
          }
        }).catch(() => null);
      } else if (targetType === 'LABORATORY') {
        // Try updating Lab, or Hospital if laboratory is registered as Hospital businessType
        await tx.lab.update({
          where: { id: targetId },
          data: {
            rating: totalReviews > 0 ? averageRating : null,
            reviewCount: totalReviews,
          }
        }).catch(async () => {
          await tx.hospital.update({
            where: { id: targetId },
            data: {
              rating: totalReviews > 0 ? averageRating : null,
              reviewCount: totalReviews,
            }
          }).catch(() => null);
        });
      }
    });

    return {
      averageRating,
      totalReviews,
      categoryAverages,
      distribution,
    };
  }
}

export default new ReviewsService();
