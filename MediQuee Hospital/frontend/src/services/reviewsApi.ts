import { API_BASE_URL } from './apiConfig';

export interface ProviderReviewItem {
  id: string;
  targetType: 'DOCTOR' | 'HOSPITAL' | 'LABORATORY';
  targetId: string;
  bookingType: string;
  bookingId: string;
  rating: number;
  categoryRatings: Record<string, number>;
  title?: string;
  comment?: string;
  patientDisplay: string;
  isAnonymous: boolean;
  isVerified: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED' | 'UNDER_REVIEW' | 'REMOVED';
  rejectionReason?: string;
  createdAt: string;
  publishedAt?: string;
  doctor?: {
    id: string;
    name: string;
    specialization?: string;
  };
  hospital?: {
    id: string;
    name: string;
  };
  response?: {
    id: string;
    response: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
    createdAt: string;
  };
  reportCount: number;
}

export interface ProviderReviewsResponse {
  reviews: ProviderReviewItem[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface DoctorReviewSummary {
  id: string;
  name: string;
  specialization?: string;
  avatar?: string;
  averageRating: number | null;
  reviewCount: number;
}

export interface HospitalReviewAnalytics {
  overallRating: number;
  totalPublishedReviews: number;
  newReviewsCount: number;
  pendingModerationCount: number;
  reviewsRequiringResponse: number;
  pendingResponsesCount: number;
  reportedReviewsCount: number;
  distribution: Record<number, number>;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  categoryAverages: Record<string, number>;
  monthlyTrends: Array<{
    month: string;
    averageRating: number;
    reviewCount: number;
  }>;
  doctorBreakdown: DoctorReviewSummary[];
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('mediquee_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const reviewsApi = {
  async getProviderReviews(params?: {
    targetType?: string;
    doctorId?: string;
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ProviderReviewsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.targetType) searchParams.append('targetType', params.targetType);
    if (params?.doctorId) searchParams.append('doctorId', params.doctorId);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.search) searchParams.append('search', params.search);

    const query = searchParams.toString();
    const url = `${API_BASE_URL}/reviews/provider${query ? `?${query}` : ''}`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to load reviews');
    }
    return json.data;
  },

  async getHospitalAnalytics(hospitalId?: string, doctorId?: string): Promise<HospitalReviewAnalytics> {
    const searchParams = new URLSearchParams();
    if (hospitalId) searchParams.append('hospitalId', hospitalId);
    if (doctorId) searchParams.append('doctorId', doctorId);

    const query = searchParams.toString();
    const url = `${API_BASE_URL}/reviews/provider/analytics${query ? `?${query}` : ''}`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to load review analytics');
    }
    return json.data;
  },

  async submitProviderResponse(reviewId: string, response: string): Promise<any> {
    const url = `${API_BASE_URL}/reviews/${reviewId}/response`;
    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ response }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to submit response');
    }
    return json.data;
  },

  async reportReview(reviewId: string, data: { reason: string; details?: string }): Promise<any> {
    const url = `${API_BASE_URL}/reviews/${reviewId}/report`;
    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to report review');
    }
    return json.data;
  },
};
