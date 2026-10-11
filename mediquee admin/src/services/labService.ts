const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export interface LabOrderAnalytics {
  totalOrders: number;
  pending: number;
  sampleCollection: number;
  sampleCollected: number;
  labProcessing: number;
  reportUploadPending: number;
  completed: number;
  cancelled: number;
}

export interface LabBookingQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  bookingType?: string;
  hospitalId?: string;
  date?: string;
  place?: string;
  gender?: string;
}

export const labService = {
  getLabOrdersAnalytics: async (token: string, params?: { hospitalId?: string; date?: string; bookingType?: string; search?: string }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.hospitalId && params.hospitalId !== 'ALL') queryParams.append('hospitalId', params.hospitalId);
      if (params?.date) queryParams.append('date', params.date);
      if (params?.bookingType && params.bookingType !== 'ALL') queryParams.append('bookingType', params.bookingType);
      if (params?.search) queryParams.append('search', params.search);

      const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const res = await fetch(`${API_BASE_URL}/admin/lab-orders/analytics${qs}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (e: any) {
      console.error('Error fetching lab order analytics:', e);
      return { success: false, message: e.message || 'Failed to fetch analytics' };
    }
  },

  getLabBookings: async (token: string, params?: LabBookingQueryParams) => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.status && params.status !== 'ALL') queryParams.append('status', params.status);
      if (params?.bookingType && params.bookingType !== 'ALL') queryParams.append('bookingType', params.bookingType);
      if (params?.hospitalId && params.hospitalId !== 'ALL') queryParams.append('hospitalId', params.hospitalId);
      if (params?.date) queryParams.append('date', params.date);
      if (params?.place && params.place !== 'ALL') queryParams.append('place', params.place);
      if (params?.gender && params.gender !== 'ALL') queryParams.append('gender', params.gender);

      const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const res = await fetch(`${API_BASE_URL}/admin/lab-bookings${qs}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (e: any) {
      console.error('Error fetching lab bookings:', e);
      return { success: false, message: e.message || 'Failed to fetch lab bookings', data: [] };
    }
  },

  getLabBookingById: async (id: string, token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/lab-bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (e: any) {
      console.error('Error fetching lab booking details:', e);
      return { success: false, message: e.message || 'Failed to fetch lab booking' };
    }
  },

  updateLabBookingStatus: async (id: string, payload: string | { status: string; cancellationReason?: string; reason?: string; phlebotomistName?: string; phlebotomistPhone?: string; collectionDate?: string; collectionTimeSlot?: string }, token: string) => {
    try {
      const body = typeof payload === 'string' ? { status: payload } : payload;
      const res = await fetch(`${API_BASE_URL}/admin/lab-bookings/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      return await res.json();
    } catch (e: any) {
      console.error('Error updating status:', e);
      return { success: false, message: e.message || 'Failed to update lab booking status' };
    }
  },

  uploadLabReport: async (id: string, fileData: string, fileName: string, token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/lab-bookings/${id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ fileData, fileName })
      });
      return await res.json();
    } catch (e: any) {
      console.error('Error uploading report:', e);
      return { success: false, message: e.message || 'Failed to upload lab report' };
    }
  }
};
