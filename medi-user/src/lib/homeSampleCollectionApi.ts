import type {
  LabTestRecord,
  LaboratoryRecord,
  LaboratoryAvailability,
  LabBookingRecord,
} from './labTestApi';

export type { LabTestRecord, LaboratoryRecord, LaboratoryAvailability, LabBookingRecord };

export interface CreateHomeSampleBookingPayload {
  testId: string;
  laboratoryId: string;
  hospitalId?: string;
  bookingDate: string;
  timeSlot: string;
  patientName: string;
  patientAge?: number | string;
  patientGender?: string;
  patientPhone: string;
  patientEmail?: string;
  collectionAddress: string;
  notes?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

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

export const homeSampleCollectionApi = {
  /**
   * Get tests available for home sample collection
   */
  async getTests(params?: {
    search?: string;
    category?: string;
    concern?: string;
    laboratoryId?: string;
    hospitalId?: string;
  }): Promise<{ success: boolean; data?: LabTestRecord[]; error?: string }> {
    try {
      const q = new URLSearchParams();
      if (params?.search) q.append('search', params.search);
      if (params?.category && params.category !== 'All Tests') q.append('category', params.category);
      if (params?.concern) q.append('concern', params.concern);
      if (params?.laboratoryId) q.append('laboratoryId', params.laboratoryId);
      if (params?.hospitalId) q.append('hospitalId', params.hospitalId);

      const qs = q.toString() ? `?${q.toString()}` : '';
      const res = await fetch(`${API_BASE_URL}/home-sample-collection/tests${qs}`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to load tests' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Unable to connect to the server' };
    }
  },

  /**
   * Get test categories
   */
  async getCategories(): Promise<{ success: boolean; data?: string[]; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/home-sample-collection/categories`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to load categories' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Unable to connect to the server' };
    }
  },

  /**
   * Get detailed test information including offerings
   */
  async getTestById(id: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/home-sample-collection/tests/${id}`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to load test details' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Unable to connect to the server' };
    }
  },

  /**
   * Get laboratories providing home sample collection for the specified test
   */
  async getEligibleLaboratories(
    testId: string,
    params?: { search?: string }
  ): Promise<{ success: boolean; data?: LaboratoryRecord[]; error?: string }> {
    try {
      const q = new URLSearchParams();
      if (params?.search) q.append('search', params.search);
      const qs = q.toString() ? `?${q.toString()}` : '';

      const res = await fetch(`${API_BASE_URL}/home-sample-collection/tests/${testId}/laboratories${qs}`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to load laboratories for test' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Unable to connect to the server' };
    }
  },

  /**
   * Get date/slot availability for home sample collection at a laboratory
   */
  async getAvailability(
    laboratoryId: string,
    date?: string
  ): Promise<{ success: boolean; data?: LaboratoryAvailability; error?: string }> {
    try {
      const qs = date ? `?date=${encodeURIComponent(date)}` : '';
      const res = await fetch(`${API_BASE_URL}/home-sample-collection/laboratories/${laboratoryId}/availability${qs}`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to load availability' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Unable to connect to the server' };
    }
  },

  /**
   * Create a home sample collection booking
   */
  async createBooking(
    payload: CreateHomeSampleBookingPayload
  ): Promise<{ success: boolean; data?: LabBookingRecord; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/home-sample-collection/bookings`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...payload,
          collectionType: 'HOME_COLLECTION',
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return {
          success: false,
          error: json.error?.message || 'Failed to create home sample collection booking',
        };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error creating booking' };
    }
  },

  /**
   * Get authenticated user's home sample collection bookings
   */
  async getMyBookings(): Promise<{ success: boolean; data?: LabBookingRecord[]; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/home-sample-collection/bookings/my`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to load home sample bookings' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error loading bookings' };
    }
  },

  /**
   * Get single home sample collection booking by ID
   */
  async getBookingById(id: string): Promise<{ success: boolean; data?: LabBookingRecord; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/home-sample-collection/bookings/${id}`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to load booking details' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error loading booking details' };
    }
  },

  /**
   * Cancel a home sample collection booking
   */
  async cancelBooking(id: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/home-sample-collection/bookings/${id}/cancel`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to cancel booking' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error cancelling booking' };
    }
  },
};
