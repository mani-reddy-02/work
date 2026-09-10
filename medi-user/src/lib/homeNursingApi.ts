export interface NurseRecord {
  id: string;
  name: string;
  designation?: string;
  avatar?: string | null;
  phone?: string;
}

export interface NursingProviderRecord {
  id: string;
  offeringId?: string;
  name?: string;
  hospitalName: string;
  location: string;
  address: string;
  contactPhone?: string;
  logoUrl?: string | null;
  rating?: number;
  registered?: boolean;
  price: string;
  numericPrice: number;
  duration: string;
  serviceArea?: string;
  nurses?: NurseRecord[];
}

export interface NursingServiceRecord {
  id: string;
  name: string;
  code?: string;
  category: string;
  description: string;
  duration: string;
  basePrice: number;
  price: string;
  numericPrice: number;
  requirements?: string | null;
  iconUrl?: string | null;
  availableProvidersCount?: number;
  providers?: NursingProviderRecord[];
}

export interface NursingSlot {
  slot: string;
  available: boolean;
}

export interface NursingAvailability {
  date: string;
  availableDates: { label: string; date: string }[];
  slots: NursingSlot[];
  duration: string;
}

export interface CreateNursingBookingPayload {
  serviceId: string;
  hospitalId: string;
  nurseId?: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  patientAge?: number | string;
  patientGender?: string;
  serviceDate: string;
  timeSlot: string;
  address: string;
  city?: string;
  pincode?: string;
  notes?: string;
  paymentMethod?: string;
}

export interface HomeNursingBookingRecord {
  id: string;
  bookingNumber: string;
  serviceId: string;
  serviceName: string;
  serviceCategory?: string;
  serviceDescription?: string;
  requirements?: string | null;
  hospitalId: string;
  hospitalName: string;
  hospitalLocation?: string;
  hospitalAddress?: string;
  hospitalPhone?: string;
  nurseName?: string;
  nurseDesignation?: string;
  nursePhone?: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  patientAge?: number;
  patientGender?: string;
  date: string;
  timeSlot: string;
  duration?: string;
  address: string;
  city?: string;
  pincode?: string;
  notes?: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  totalAmount: number;
  amount: string;
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

export const homeNursingApi = {
  /**
   * Fetch active home nursing services with optional search and category filter.
   */
  async getServices(params?: {
    search?: string;
    category?: string;
    hospitalId?: string;
  }): Promise<{ success: boolean; data?: NursingServiceRecord[]; error?: string }> {
    try {
      const q = new URLSearchParams();
      if (params?.search) q.append('search', params.search);
      if (params?.category && params.category !== 'All Services' && params.category !== 'All') {
        q.append('category', params.category);
      }
      if (params?.hospitalId) q.append('hospitalId', params.hospitalId);

      const qs = q.toString() ? `?${q.toString()}` : '';
      const res = await fetch(`${API_BASE_URL}/home-nursing/services${qs}`, {
        headers: getAuthHeaders(),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to fetch nursing services' };
      }

      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error fetching nursing services' };
    }
  },

  /**
   * Fetch distinct categories of nursing services.
   */
  async getCategories(): Promise<{ success: boolean; data?: string[]; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/home-nursing/services/categories`, {
        headers: getAuthHeaders(),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to fetch categories' };
      }

      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error fetching categories' };
    }
  },

  /**
   * Fetch single service details with offerings.
   */
  async getServiceById(id: string): Promise<{ success: boolean; data?: NursingServiceRecord; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/home-nursing/services/${id}`, {
        headers: getAuthHeaders(),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to fetch service details' };
      }

      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error fetching service details' };
    }
  },

  /**
   * Fetch hospital providers offering this service.
   */
  async getServiceProviders(
    serviceId: string,
    search?: string
  ): Promise<{ success: boolean; data?: NursingProviderRecord[]; error?: string }> {
    try {
      const q = new URLSearchParams();
      if (search) q.append('search', search);

      const qs = q.toString() ? `?${q.toString()}` : '';
      const res = await fetch(`${API_BASE_URL}/home-nursing/services/${serviceId}/providers${qs}`, {
        headers: getAuthHeaders(),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to fetch service providers' };
      }

      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error fetching service providers' };
    }
  },

  /**
   * Fetch active nurses for a hospital.
   */
  async getHospitalNurses(hospitalId: string): Promise<{ success: boolean; data?: NurseRecord[]; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/home-nursing/hospitals/${hospitalId}/nurses`, {
        headers: getAuthHeaders(),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to fetch hospital nurses' };
      }

      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error fetching hospital nurses' };
    }
  },

  /**
   * Fetch availability for a service, hospital, and optional date/nurse.
   */
  async getAvailability(
    serviceId: string,
    hospitalId: string,
    date?: string,
    nurseId?: string
  ): Promise<{ success: boolean; data?: NursingAvailability; error?: string }> {
    try {
      const q = new URLSearchParams({ hospitalId });
      if (date) q.append('date', date);
      if (nurseId) q.append('nurseId', nurseId);

      const res = await fetch(`${API_BASE_URL}/home-nursing/services/${serviceId}/availability?${q.toString()}`, {
        headers: getAuthHeaders(),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to fetch availability' };
      }

      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error fetching availability' };
    }
  },

  /**
   * Create a home nursing booking (JWT authenticated).
   */
  async createBooking(
    payload: CreateNursingBookingPayload
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/home-nursing/bookings`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return {
          success: false,
          error: json.error?.message || 'Failed to create home nursing booking',
        };
      }

      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error creating booking' };
    }
  },

  /**
   * Fetch current authenticated user's home nursing bookings.
   */
  async getMyBookings(): Promise<{ success: boolean; data?: HomeNursingBookingRecord[]; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/home-nursing/bookings/my`, {
        headers: getAuthHeaders(),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to fetch nursing bookings' };
      }

      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error fetching nursing bookings' };
    }
  },

  /**
   * Fetch details of a single nursing booking.
   */
  async getBookingById(id: string): Promise<{ success: boolean; data?: HomeNursingBookingRecord; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/home-nursing/bookings/${id}`, {
        headers: getAuthHeaders(),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to fetch booking details' };
      }

      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error fetching booking details' };
    }
  },

  /**
   * Cancel a booking (if owned by user).
   */
  async cancelBooking(id: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/home-nursing/bookings/${id}/cancel`, {
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
