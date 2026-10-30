const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export interface AdminReviewItem {
  id: string;
  userId: string;
  targetType: 'DOCTOR' | 'HOSPITAL' | 'LABORATORY';
  targetId: string;
  bookingType: string;
  bookingId: string;
  rating: number;
  categoryRatings: Record<string, number>;
  title?: string;
  comment?: string;
  isAnonymous: boolean;
  isVerified: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED' | 'UNDER_REVIEW' | 'REMOVED';
  rejectionReason?: string;
  publishedAt?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  };
  hospital?: {
    id: string;
    name: string;
    city?: string;
  };
  doctor?: {
    id: string;
    name: string;
    specialization?: string;
  };
  response?: {
    id: string;
    response: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
    createdAt: string;
    responder?: {
      id: string;
      name: string;
      role: string;
    };
  };
  reports: Array<{
    id: string;
    reason: string;
    details?: string;
    status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
    reporterRole: string;
    createdAt: string;
    reporter?: {
      id: string;
      name: string;
      role: string;
    };
  }>;
  moderationLogs: Array<{
    id: string;
    action: string;
    previousStatus?: string;
    newStatus: string;
    reason?: string;
    createdAt: string;
    admin: {
      id: string;
      name: string;
    };
  }>;
}

export interface AdminReviewsResponse {
  reviews: AdminReviewItem[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface AdminReviewAnalytics {
  metrics: {
    totalReviews: number;
    publishedReviews: number;
    pendingReviews: number;
    rejectedReviews: number;
    flaggedReviews: number;
    reportedReviews: number;
    moderationQueueCount: number;
    pendingResponsesCount: number;
    averageDoctorRating: number | null;
    averageHospitalRating: number | null;
    averageLaboratoryRating: number | null;
  };
  distribution: Record<number, number>;
  monthlyTrends: Array<{
    month: string;
    averageRating: number;
    volume: number;
  }>;
  topDoctors: any[];
  topHospitals: any[];
  topLaboratories: any[];
}

export const reviewService = {
  getAdminReviews: async (token: string, params?: {
    targetType?: string;
    status?: string;
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
  }): Promise<AdminReviewsResponse> => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.targetType) searchParams.append('targetType', params.targetType);
      if (params?.status) searchParams.append('status', params.status);
      if (params?.rating) searchParams.append('rating', String(params.rating));
      if (params?.search) searchParams.append('search', params.search);
      if (params?.hospitalId) searchParams.append('hospitalId', params.hospitalId);
      if (params?.doctorId) searchParams.append('doctorId', params.doctorId);
      if (params?.isVerified !== undefined) searchParams.append('isVerified', String(params.isVerified));
      if (params?.hasReports) searchParams.append('hasReports', 'true');
      if (params?.fromDate) searchParams.append('fromDate', params.fromDate);
      if (params?.toDate) searchParams.append('toDate', params.toDate);
      if (params?.page) searchParams.append('page', String(params.page));
      if (params?.limit) searchParams.append('limit', String(params.limit));

      const query = searchParams.toString();
      const res = await fetch(`${API_BASE_URL}/reviews/admin${query ? `?${query}` : ''}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to fetch reviews');
      }
      return json.data;
    } catch (e: any) {
      console.error('getAdminReviews error:', e);
      throw e;
    }
  },

  getAdminAnalytics: async (token: string): Promise<AdminReviewAnalytics> => {
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/admin/analytics`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to fetch review analytics');
      }
      return json.data;
    } catch (e: any) {
      console.error('getAdminAnalytics error:', e);
      throw e;
    }
  },

  moderateReview: async (token: string, reviewId: string, action: 'APPROVE' | 'REJECT' | 'FLAG' | 'REMOVE', reason?: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/admin/${reviewId}/moderate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action, reason })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || `Failed to ${action.toLowerCase()} review`);
      }
      return json;
    } catch (e: any) {
      console.error('moderateReview error:', e);
      throw e;
    }
  },

  moderateResponse: async (token: string, responseId: string, action: 'APPROVE' | 'REJECT', reason?: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/admin/responses/${responseId}/moderate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action, reason })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || `Failed to ${action.toLowerCase()} provider response`);
      }
      return json;
    } catch (e: any) {
      console.error('moderateResponse error:', e);
      throw e;
    }
  },

  resolveReport: async (token: string, reportId: string, resolution: 'RESOLVED' | 'DISMISSED', notes?: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/admin/reports/${reportId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ resolution, notes })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to update dispute report');
      }
      return json;
    } catch (e: any) {
      console.error('resolveReport error:', e);
      throw e;
    }
  }
};
