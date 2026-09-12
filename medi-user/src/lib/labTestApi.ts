export interface LabTestRecord {
  id: string;
  name: string;
  code?: string;
  category: string;
  sampleType: string;
  sample: string;
  price: string;
  numericPrice: number;
  time: string;
  tat: string;
  parameters: number;
  parametersCount: number;
  desc: string;
  description: string;
  prep: string;
  preparation: string;
  concern: string;
  healthConcern: string;
  availableLabCount?: number;
  provider?: string;
  homeCollectionAvailable?: boolean;
  homeCollectionFee?: number;
}

export interface LaboratoryRecord {
  id: string;
  name: string;
  businessType?: string;
  facilityType?: string;
  logoUrl?: string;
  contactPhone?: string;
  contactEmail?: string;
  location: string;
  address: string;
  rating: number;
  time: string;
  price: string;
  numericPrice: number;
  homeCollectionAvailable?: boolean;
  homeCollectionFee?: number;
}

export interface LabSlot {
  slot: string;
  available: boolean;
}

export interface LaboratoryAvailability {
  laboratoryId: string;
  laboratoryName: string;
  availableDates: { label: string; date: string }[];
  selectedDate: string;
  slots: LabSlot[];
}

export interface CreateLabBookingPayload {
  testId: string;
  laboratoryId: string;
  hospitalId?: string;
  bookingDate: string;
  timeSlot: string;
  collectionType: 'LAB_VISIT' | 'HOME_COLLECTION';
  patientName: string;
  patientAge?: number | string;
  patientGender?: string;
  patientPhone: string;
  patientEmail?: string;
  collectionAddress?: string;
  notes?: string;
}

export interface LabBookingRecord {
  id: string;
  bookingId: string;
  bookingNumber: string;
  type: string;
  testId: string;
  testName: string;
  category: string;
  sampleType: string;
  laboratoryId: string;
  laboratoryName: string;
  laboratoryAddress: string;
  laboratoryPhone?: string;
  hospitalId?: string;
  patientName: string;
  patientPhone: string;
  patientAge?: number;
  patientGender?: string;
  patientEmail?: string;
  date: string;
  bookingDate: string;
  timeSlot: string;
  time: string;
  collectionType: string;
  collectionAddress?: string;
  status: string;
  paymentStatus: string;
  testPrice: number;
  collectionFee: number;
  totalAmount: number;
  amount: string;
  prep?: string;
  preparation?: string;
  turnaroundTime?: string;
  createdAt: string;
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

export const labTestApi = {
  async getLabTests(params?: {
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
      const res = await fetch(`${API_BASE_URL}/lab-tests${qs}`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to load lab tests' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Unable to connect to the server' };
    }
  },

  async getCategories(): Promise<{ success: boolean; data?: string[]; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/lab-tests/categories`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to load test categories' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Unable to connect to the server' };
    }
  },

  async getHealthConcerns(params?: { homeCollectionOnly?: boolean }): Promise<{ success: boolean; data?: string[]; error?: string }> {
    try {
      let qs = '';
      if (params?.homeCollectionOnly) qs = '?homeCollectionOnly=true';
      const res = await fetch(`${API_BASE_URL}/lab-tests/health-concerns${qs}`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to load health concerns' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Unable to connect to the server' };
    }
  },

  async getLabTestById(id: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/lab-tests/${id}`, {
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

  async getLaboratoriesForTest(
    testId: string,
    params?: { search?: string }
  ): Promise<{ success: boolean; data?: LaboratoryRecord[]; error?: string }> {
    try {
      const q = new URLSearchParams();
      if (params?.search) q.append('search', params.search);
      const qs = q.toString() ? `?${q.toString()}` : '';

      const res = await fetch(`${API_BASE_URL}/lab-tests/${testId}/laboratories${qs}`, {
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

  async getLaboratoryAvailability(
    laboratoryId: string,
    date?: string
  ): Promise<{ success: boolean; data?: LaboratoryAvailability; error?: string }> {
    try {
      const qs = date ? `?date=${encodeURIComponent(date)}` : '';
      const res = await fetch(`${API_BASE_URL}/laboratories/${laboratoryId}/availability${qs}`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to load laboratory availability' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Unable to connect to the server' };
    }
  },
};

export const labBookingApi = {
  async createLabBooking(
    payload: CreateLabBookingPayload
  ): Promise<{ success: boolean; data?: LabBookingRecord; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/lab-bookings`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return {
          success: false,
          error: json.error?.message || 'Failed to create lab booking',
        };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error creating lab booking' };
    }
  },

  async getMyLabBookings(): Promise<{ success: boolean; data?: LabBookingRecord[]; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/lab-bookings/my`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to fetch lab bookings' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error fetching lab bookings' };
    }
  },

  async getLabBookingById(id: string): Promise<{ success: boolean; data?: LabBookingRecord; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/lab-bookings/${id}`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to fetch lab booking details' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error fetching booking details' };
    }
  },
};
