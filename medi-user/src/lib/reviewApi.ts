import { API_BASE_URL } from './apiConfig';

export type ReviewTargetType = 'HOSPITAL' | 'DOCTOR';

export type ReviewServiceType =
  | 'OP_CONSULTATION'
  | 'VIDEO_CONSULTATION'
  | 'LAB_TEST'
  | 'HOME_SAMPLE_COLLECTION'
  | 'HOME_NURSING';

export interface ReviewItem {
  id: string;
  bookingId?: string;
  targetType: ReviewTargetType;
  serviceType: ReviewServiceType;
  rating: number;
  comment: string | null;
  status?: string;
  createdAt: string;
  reviewerName?: string;
  hospital?: {
    id: string;
    name: string;
    logoUrl?: string | null;
  };
  doctor?: {
    id: string;
    name: string;
    avatar?: string | null;
    specialization?: string | null;
  } | null;
}

export interface ReviewSummary {
  averageRating: number | null;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}

export interface BookingReviewStatusResponse {
  isEligible: boolean;
  serviceType: ReviewServiceType;
  hospital: {
    id: string;
    name: string;
    logoUrl?: string | null;
  } | null;
  doctor: {
    id: string;
    name: string;
    avatar?: string | null;
    specialization?: string | null;
  } | null;
  hospitalReview: ReviewItem | null;
  doctorReview: ReviewItem | null;
}

export interface SubmitReviewPayload {
  bookingId: string;
  serviceType: ReviewServiceType;
  targetType: ReviewTargetType;
  rating: number;
  comment?: string;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('mediquee_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const reviewApi = {
  /**
   * Submit a verified rating and optional comment for a completed booking
   */
  async submitReview(payload: SubmitReviewPayload): Promise<{
    success: boolean;
    data?: ReviewItem;
    error?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return {
          success: false,
          error: json.error?.message || json.message || 'Failed to submit review',
        };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error while submitting review' };
    }
  },

  /**
   * Check review eligibility and existing reviews for a booking
   */
  async getBookingReviewStatus(bookingId: string): Promise<{
    success: boolean;
    data?: BookingReviewStatusResponse;
    error?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/booking/${bookingId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to fetch review status' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  /**
   * Fetch all reviews submitted by the current user
   */
  async getMyReviews(): Promise<{
    success: boolean;
    data?: ReviewItem[];
    error?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/my-reviews`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to fetch your reviews' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  /**
   * Public: Fetch hospital rating summary and published reviews
   */
  async getHospitalReviews(
    hospitalId: string,
    page: number = 1,
    limit: number = 10,
    rating?: number
  ): Promise<{
    success: boolean;
    data?: {
      summary: ReviewSummary;
      reviews: ReviewItem[];
      pagination: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
      };
    };
    error?: string;
  }> {
    try {
      const url = new URL(`${API_BASE_URL}/reviews/hospital/${hospitalId}`, window.location.origin);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('limit', limit.toString());
      if (rating) url.searchParams.set('rating', rating.toString());

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to fetch hospital reviews' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  /**
   * Public: Fetch doctor rating summary and published reviews
   */
  async getDoctorReviews(
    doctorId: string,
    page: number = 1,
    limit: number = 10,
    rating?: number
  ): Promise<{
    success: boolean;
    data?: {
      summary: ReviewSummary;
      reviews: ReviewItem[];
      pagination: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
      };
    };
    error?: string;
  }> {
    try {
      const url = new URL(`${API_BASE_URL}/reviews/doctor/${doctorId}`, window.location.origin);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('limit', limit.toString());
      if (rating) url.searchParams.set('rating', rating.toString());

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to fetch doctor reviews' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },
};
