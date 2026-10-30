import { apiFetch } from './api';

export interface RatingDimension {
  key: string;
  label: string;
}

export interface ExistingReview {
  id: string;
  rating: number;
  categoryRatings: Record<string, number>;
  title?: string | null;
  comment?: string | null;
  isAnonymous: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED' | 'UNDER_REVIEW' | 'REMOVED';
  rejectionReason?: string | null;
  createdAt: string;
  response?: string | null;
  canEdit: boolean;
}

export interface ReviewTarget {
  targetType: 'DOCTOR' | 'HOSPITAL' | 'LABORATORY';
  targetId: string;
  title: string;
  subtitle: string;
  avatar?: string | null;
  serviceTypeLabel: string;
  bookingId: string;
  bookingType: string;
  hospitalId?: string | null;
  doctorId?: string | null;
  dimensions: RatingDimension[];
  existingReview: ExistingReview | null;
  canReview: boolean;
}

export interface EligibilityResponse {
  bookingId: string;
  bookingType: string;
  serviceDate: string;
  patientName?: string;
  status: string;
  targets: ReviewTarget[];
}

export interface SubmitReviewPayload {
  bookingId: string;
  bookingType: string;
  targetType: 'DOCTOR' | 'HOSPITAL' | 'LABORATORY';
  targetId: string;
  rating: number;
  categoryRatings: Record<string, number>;
  title?: string;
  comment?: string;
  serviceSpecificFeedback?: Record<string, any>;
  isAnonymous?: boolean;
  guidelinesAcknowledged?: boolean;
}

export interface PublicReview {
  id: string;
  rating: number;
  categoryRatings: Record<string, number>;
  title?: string;
  comment?: string;
  isVerified: boolean;
  isAnonymous: boolean;
  displayName: string;
  publishedAt: string;
  bookingType: string;
  officialResponse?: {
    response: string;
    publishedAt: string;
  } | null;
}

export interface PublicReviewsResponse {
  reviews: PublicReview[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  aggregate: {
    averageRating: number;
    totalReviews: number;
    distribution: Record<number, number>;
    categoryAverages: Record<string, number> | null;
    positiveCount: number;
    neutralCount: number;
    negativeCount: number;
  };
}

export const reviewsApi = {
  /**
   * Get eligible review targets for a completed booking
   */
  async getEligibleTargets(bookingId: string): Promise<{ success: boolean; data?: EligibilityResponse; error?: string }> {
    try {
      const res = await apiFetch(`/reviews/eligible/${bookingId}`);
      return { success: true, data: res.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to fetch review targets' };
    }
  },

  /**
   * Submit a new review
   */
  async submitReview(payload: SubmitReviewPayload): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const res = await apiFetch('/reviews', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return { success: true, data: res.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to submit review' };
    }
  },

  /**
   * Edit a pending review
   */
  async editReview(reviewId: string, payload: Partial<SubmitReviewPayload>): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const res = await apiFetch(`/reviews/${reviewId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return { success: true, data: res.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to edit review' };
    }
  },

  /**
   * Get public reviews for a doctor, hospital, or laboratory
   */
  async getPublicReviews(targetType: 'DOCTOR' | 'HOSPITAL' | 'LABORATORY', targetId: string, page = 1, limit = 5, ratingFilter?: number): Promise<{ success: boolean; data?: PublicReviewsResponse; error?: string }> {
    try {
      let url = `/reviews/public?targetType=${targetType}&targetId=${targetId}&page=${page}&limit=${limit}`;
      if (ratingFilter) {
        url += `&rating=${ratingFilter}`;
      }
      const res = await apiFetch(url);
      return { success: true, data: res.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to fetch reviews' };
    }
  },

  /**
   * Get patient's own reviews
   */
  async getMyReviews(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const res = await apiFetch('/reviews/my');
      return { success: true, data: res.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to fetch your reviews' };
    }
  },
};
