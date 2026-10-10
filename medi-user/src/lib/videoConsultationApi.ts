import { API_BASE_URL } from './apiConfig';

export interface VideoTokenResponse {
  token: string;
  serverUrl: string;
  roomName: string;
  consultation: {
    id: string;
    bookingId: string;
    roomName: string;
    status: string;
    durationSeconds: number;
    startedAt: string | null;
    endedAt: string | null;
  };
  participant: {
    identity: string;
    name: string;
    role: string;
  };
  booking: {
    id: string;
    patientName: string;
    doctorName: string;
    doctorDesignation?: string | null;
    hospitalName: string;
    appointmentDate: string;
    timeSlot?: string | null;
    status: string;
  };
}

export interface VideoStatusResponse {
  id: string;
  bookingId: string;
  roomName: string;
  status: string;
  scheduledDate: string | null;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number;
  formattedDuration: string;
  patientJoinedAt: string | null;
  doctorJoinedAt: string | null;
  booking: {
    id: string;
    patientName: string;
    patientPhone?: string | null;
    doctorName: string;
    hospitalName: string;
    status: string;
    appointmentDate: string;
    timeSlot?: string | null;
  };
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

export const videoConsultationApi = {
  /**
   * Check if LiveKit Cloud video consultation is configured
   */
  async checkConfiguration(): Promise<{
    success: boolean;
    isConfigured: boolean;
    serverUrl?: string | null;
    message?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/video/status`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && data.data) {
        return {
          success: true,
          isConfigured: data.data.isConfigured,
          serverUrl: data.data.serverUrl,
          message: data.data.message,
        };
      }
      return { success: false, isConfigured: false, message: 'Failed to verify video service' };
    } catch (err: any) {
      return { success: false, isConfigured: false, message: err.message };
    }
  },

  /**
   * Request LiveKit room access token for an eligible appointment
   */
  async getRoomToken(bookingId: string): Promise<{
    success: boolean;
    data?: VideoTokenResponse;
    error?: string;
    code?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/video/token`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data?.error?.message || 'Failed to generate video consultation token',
          code: data?.error?.code,
        };
      }
      return { success: true, data: data.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error connecting to video service' };
    }
  },

  /**
   * Retrieve video consultation status and elapsed duration
   */
  async getConsultationStatus(bookingId: string): Promise<{
    success: boolean;
    data?: VideoStatusResponse;
    error?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/video/status/${bookingId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data?.error?.message || 'Failed to fetch consultation status',
        };
      }
      return { success: true, data: data.data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * End the video call explicitly
   */
  async endCall(bookingId: string): Promise<{
    success: boolean;
    data?: VideoStatusResponse;
    error?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/video/end/${bookingId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data?.error?.message || 'Failed to finalize video consultation',
        };
      }
      return { success: true, data: data.data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Retrieve video consultation history
   */
  async getHistory(): Promise<{
    success: boolean;
    data?: VideoStatusResponse[];
    error?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/video/history`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data?.error?.message || 'Failed to fetch history' };
      }
      return { success: true, data: data.data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
};
