const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export type ReviewTargetType = 'HOSPITAL' | 'DOCTOR';
export type ReviewStatus = 'PUBLISHED' | 'HIDDEN';

export interface AdminReviewItem {
  id: string;
  bookingId: string;
  targetType: ReviewTargetType;
  serviceType: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  moderatedAt?: string | null;
  moderatedBy?: string | null;
  moderationNotes?: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    phone?: string | null;
  };
  hospital: {
    id: string;
    name: string;
    logoUrl?: string | null;
    city?: string | null;
  };
  doctor?: {
    id: string;
    name: string;
    avatar?: string | null;
    specialization?: string | null;
  } | null;
}

export interface AdminReviewStats {
  totalReviews: number;
  publishedReviews: number;
  hiddenReviews: number;
  overallAverage: number | null;
  hospital: {
    count: number;
    average: number | null;
  };
  doctor: {
    count: number;
    average: number | null;
  };
  ratingDistribution: Record<number, number>;
  serviceDistribution: Record<string, number>;
  recentReviews: AdminReviewItem[];
}

export interface FetchReviewsParams {
  search?: string;
  targetType?: string;
  serviceType?: string;
  status?: string;
  rating?: number;
  page?: number;
  limit?: number;
}

export const reviewService = {
  getAdminReviews: async (token: string, params: FetchReviewsParams = {}) => {
    try {
      const q = new URLSearchParams();
      if (params.search) q.append('search', params.search);
      if (params.targetType && params.targetType !== 'ALL') q.append('targetType', params.targetType);
      if (params.serviceType && params.serviceType !== 'ALL') q.append('serviceType', params.serviceType);
      if (params.status && params.status !== 'ALL') q.append('status', params.status);
      if (params.rating) q.append('rating', params.rating.toString());
      if (params.page) q.append('page', params.page.toString());
      if (params.limit) q.append('limit', params.limit.toString());

      const res = await fetch(`${API_BASE_URL}/reviews/admin?${q.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (err: any) {
      console.error('Error fetching admin reviews:', err);
      return { success: false, error: { message: err.message || 'Network Error' } };
    }
  },

  getAdminReviewStats: async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (err: any) {
      console.error('Error fetching admin review stats:', err);
      return { success: false, error: { message: err.message || 'Network Error' } };
    }
  },

  moderateReview: async (
    token: string,
    reviewId: string,
    status: ReviewStatus,
    moderationNotes?: string
  ) => {
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/admin/${reviewId}/moderation`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, moderationNotes })
      });
      return await res.json();
    } catch (err: any) {
      console.error('Error moderating review:', err);
      return { success: false, error: { message: err.message || 'Network Error' } };
    }
  }
};
