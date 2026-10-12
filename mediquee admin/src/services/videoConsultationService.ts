const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export interface VideoConsultationItem {
  id: string;
  consultationId: string;
  bookingId: string;
  patientName: string;
  patientPhone: string;
  patientAge?: number | null;
  patientGender?: string | null;
  doctorName: string;
  doctorSpecialization: string;
  hospitalName: string;
  hospitalCity: string;
  departmentName: string;
  date: string;
  timeSlot: string;
  scheduledDateTime: string;
  fee: number;
  consultationStatus: string;
  sessionStatus: string;
  roomName: string | null;
  durationSeconds: number;
  formattedDuration: string;
  startedAt: string | null;
  endedAt: string | null;
  patientJoinedAt?: string | null;
  doctorJoinedAt?: string | null;
  createdAt: string;
}

export interface VideoConsultationsResponse {
  success: boolean;
  data: VideoConsultationItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats: {
    total: number;
    pending: number;
    scheduled: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
  providerConfig: {
    isConfigured: boolean;
    message: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export const videoConsultationService = {
  getVideoConsultations: async (
    token: string,
    params?: { page?: number; limit?: number; status?: string; search?: string }
  ): Promise<VideoConsultationsResponse> => {
    try {
      const queryParams: Record<string, string> = {};
      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '' && val !== 'ALL') {
            queryParams[key] = String(val);
          }
        });
      }
      const qs = new URLSearchParams(queryParams).toString();
      const url = `${API_BASE_URL}/admin/video-consultations${qs ? '?' + qs : ''}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return await res.json();
    } catch (e: any) {
      console.error('Error fetching video consultations:', e);
      return {
        success: false,
        data: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 1 },
        stats: { total: 0, pending: 0, scheduled: 0, inProgress: 0, completed: 0, cancelled: 0 },
        providerConfig: { isConfigured: false, message: 'Could not connect to service' },
        error: { code: 'NETWORK_ERROR', message: e.message || 'Network error' },
      };
    }
  },

  getVideoConsultationById: async (id: string, token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/video-consultations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return await res.json();
    } catch (e: any) {
      console.error('Error fetching video consultation by id:', e);
      return { success: false, message: e.message || 'Failed to fetch details' };
    }
  },

  updateStatus: async (id: string, status: string, token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/video-consultations/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      return await res.json();
    } catch (e: any) {
      console.error('Error updating video consultation status:', e);
      return { success: false, message: e.message || 'Failed to update status' };
    }
  },
};
