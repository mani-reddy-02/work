import { Request, Response } from 'express';
import reviewsService from './reviews.service';
import { ReviewTargetType, ReviewStatus } from './reviews.types';

export class ReviewsController {
  /**
   * GET /api/v1/reviews/eligible/:bookingId
   * Fetch eligible review targets for a completed transaction
   */
  async getEligibleTargets(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { bookingId } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const result = await reviewsService.getEligibleTargets(userId, bookingId);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message || 'Failed to fetch review targets' });
    }
  }

  /**
   * GET /api/v1/reviews/pending-invitations
   * Fetch queued completed bookings eligible for post-service review popup
   */
  async getPendingInvitations(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const includePostponed = req.query.includePostponed === 'true';
      const invitations = await reviewsService.getPendingInvitations(userId, includePostponed);
      return res.json({ success: true, data: invitations });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message || 'Failed to fetch pending invitations' });
    }
  }

  /**
   * POST /api/v1/reviews/postpone
   * Postpone review invitation (e.g. user clicked Maybe Later or closed popup)
   */
  async postponeInvitation(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const { invitationId, bookingId, targetId, hours } = req.body || {};
      const id = req.params.id || invitationId;

      const result = await reviewsService.postponeInvitation(userId, {
        invitationId: id,
        bookingId,
        targetId,
        hours: hours ? Number(hours) : 24,
      });

      return res.json({
        success: true,
        message: 'Review invitation postponed successfully.',
        data: result,
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message || 'Failed to postpone invitation' });
    }
  }

  /**
   * POST /api/v1/reviews
   * Submit a new patient review
   */
  async submitReview(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const result = await reviewsService.submitReview(userId, req.body);
      return res.status(201).json({
        success: true,
        message: 'Review submitted successfully and is pending approval.',
        data: result
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message || 'Failed to submit review' });
    }
  }

  /**
   * PUT /api/v1/reviews/:id
   * Edit a pending review
   */
  async editReview(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const result = await reviewsService.editReview(userId, id, req.body);
      return res.json({
        success: true,
        message: 'Review updated successfully and resubmitted for moderation.',
        data: result
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message || 'Failed to edit review' });
    }
  }

  /**
   * GET /api/v1/reviews/my
   * Get authenticated user's submitted reviews
   */
  async getMyReviews(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const reviews = await reviewsService.getMyReviews(userId);
      return res.json({ success: true, data: reviews });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message || 'Failed to fetch your reviews' });
    }
  }

  /**
   * GET /api/v1/reviews/public
   * Public reviews list and aggregate metrics for doctor/hospital/lab profile
   */
  async getPublicReviews(req: Request, res: Response) {
    try {
      const { targetType, targetId, page, limit, rating } = req.query;

      if (!targetType || !targetId) {
        return res.status(400).json({
          success: false,
          message: 'targetType (DOCTOR, HOSPITAL, LABORATORY) and targetId are required.'
        });
      }

      const result = await reviewsService.getPublicReviews({
        targetType: targetType as ReviewTargetType,
        targetId: String(targetId),
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        ratingFilter: rating ? Number(rating) : undefined,
      });

      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message || 'Failed to fetch public reviews' });
    }
  }

  /**
   * GET /api/v1/reviews/provider
   * Reviews for authorized hospital or doctor
   */
  async getProviderReviews(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const { targetType, doctorId, status, page, limit, search } = req.query;

      const result = await reviewsService.getProviderReviews(user, {
        targetType: targetType as ReviewTargetType,
        doctorId: doctorId ? String(doctorId) : undefined,
        status: status as ReviewStatus,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search ? String(search) : undefined,
      });

      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message || 'Failed to fetch provider reviews' });
    }
  }

  /**
   * GET /api/v1/reviews/provider/analytics
   * Real review statistics and distributions for Hospital/Doctor
   */
  async getHospitalAnalytics(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const hospitalId = user.hospitalId || (req.query.hospitalId as string);
      const doctorId = user.role === 'DOCTOR' ? user.id : (req.query.doctorId as string);

      if (!hospitalId && !doctorId) {
        return res.status(400).json({ success: false, message: 'Hospital or Doctor context is required.' });
      }

      const result = await reviewsService.getHospitalReviewAnalytics(hospitalId, doctorId);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message || 'Failed to fetch analytics' });
    }
  }

  /**
   * POST /api/v1/reviews/:id/response
   * Submit an official response to a review
   */
  async submitProviderResponse(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { response } = req.body;

      if (!user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const result = await reviewsService.submitProviderResponse(user, id, response);
      return res.status(201).json({
        success: true,
        message: 'Response submitted successfully and is awaiting admin approval.',
        data: result
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message || 'Failed to submit response' });
    }
  }

  /**
   * POST /api/v1/reviews/:id/report
   * Report an inappropriate review or dispute
   */
  async reportReview(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { reason, details } = req.body;

      if (!user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const result = await reviewsService.reportReview(user, id, reason, details);
      return res.status(201).json({
        success: true,
        message: 'Report submitted successfully for admin investigation.',
        data: result
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message || 'Failed to report review' });
    }
  }

  /**
   * GET /api/v1/reviews/admin
   * Admin reviews table with filters, search, and pagination
   */
  async adminGetReviews(req: Request, res: Response) {
    try {
      const {
        targetType,
        status,
        rating,
        search,
        hospitalId,
        doctorId,
        labId,
        isVerified,
        hasReports,
        fromDate,
        toDate,
        page,
        limit
      } = req.query;

      const result = await reviewsService.adminGetReviews({
        targetType: targetType as ReviewTargetType,
        status: status as ReviewStatus,
        rating: rating ? Number(rating) : undefined,
        search: search ? String(search) : undefined,
        hospitalId: hospitalId ? String(hospitalId) : undefined,
        doctorId: doctorId ? String(doctorId) : undefined,
        labId: labId ? String(labId) : undefined,
        isVerified: isVerified !== undefined ? isVerified === 'true' : undefined,
        hasReports: hasReports === 'true',
        fromDate: fromDate ? String(fromDate) : undefined,
        toDate: toDate ? String(toDate) : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message || 'Failed to fetch admin reviews' });
    }
  }

  /**
   * GET /api/v1/reviews/admin/analytics
   * Platform-wide review analytics for Admin Panel
   */
  async adminGetAnalytics(req: Request, res: Response) {
    try {
      const result = await reviewsService.adminGetAnalytics();
      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message || 'Failed to fetch admin analytics' });
    }
  }

  /**
   * POST /api/v1/reviews/admin/:id/moderate
   * Admin moderate review action: APPROVE, REJECT, FLAG, REMOVE
   */
  async adminModerateReview(req: Request, res: Response) {
    try {
      const adminId = (req as any).user?.id;
      const { id } = req.params;
      const { action, reason } = req.body;

      if (!adminId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const result = await reviewsService.adminModerateReview(adminId, id, action, reason);
      return res.json({
        success: true,
        message: `Review ${action.toLowerCase()}d successfully.`,
        data: result
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message || 'Failed to moderate review' });
    }
  }

  /**
   * POST /api/v1/reviews/admin/responses/:id/moderate
   * Admin moderate provider response: APPROVE, REJECT
   */
  async adminModerateResponse(req: Request, res: Response) {
    try {
      const adminId = (req as any).user?.id;
      const { id } = req.params;
      const { action, reason } = req.body;

      if (!adminId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const result = await reviewsService.adminModerateResponse(adminId, id, action, reason);
      return res.json({
        success: true,
        message: `Provider response ${action.toLowerCase()}d successfully.`,
        data: result
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message || 'Failed to moderate response' });
    }
  }

  /**
   * POST /api/v1/reviews/admin/reports/:id/resolve
   * Admin resolve reported review: RESOLVED, DISMISSED
   */
  async adminResolveReport(req: Request, res: Response) {
    try {
      const adminId = (req as any).user?.id;
      const { id } = req.params;
      const { resolution, notes } = req.body;

      if (!adminId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const result = await reviewsService.adminResolveReport(adminId, id, resolution, notes);
      return res.json({
        success: true,
        message: `Report marked as ${resolution.toLowerCase()}.`,
        data: result
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message || 'Failed to resolve report' });
    }
  }
}

export default new ReviewsController();
