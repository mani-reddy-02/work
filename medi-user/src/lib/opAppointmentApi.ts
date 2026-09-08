const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export interface DiseaseCondition {
  id: string;
  name: string;
  description?: string | null;
  specialtyId: string;
  specialtyName?: string;
  image?: string;
  icon?: any;
  bg?: string;
}

export interface CategoricalSpecialty {
  id: string;
  name: string;
  description?: string | null;
  conditions: DiseaseCondition[];
  icon?: any;
  bg?: string;
}

export interface HospitalRecord {
  id: string;
  name: string;
  businessType?: string;
  facilityType?: string;
  addressLine1?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  address?: string;
  contact?: string;
  contactPhone?: string;
  services?: string[];
  departments: string[];
  departmentList?: Array<{ id: string; name: string; code?: string; specialtyId?: string }>;
  verified?: boolean;
  description?: string;
  doctorCount?: number;
}

export interface DoctorRecord {
  id: string;
  name: string;
  specialization: string;
  qualification: string;
  experience: string;
  designation: string;
  avatar?: string | null;
  hospitalId: string;
  hospitalName: string;
  hospitalAddress?: string;
  departmentId?: string;
  department: string;
  consultInfo?: string;
  fees: string;
  rating: number;
}

export interface CreateAppointmentPayload {
  hospitalId: string;
  doctorId: string;
  departmentId?: string | null;
  diseaseId?: string | null;
  conditionId?: string | null;
  date: string;
  timeSlot: string;
  patientName?: string;
  patientPhone?: string;
  patientAge?: number;
  patientGender?: string;
  reason?: string;
  opType?: string;
}

export interface OpBookingRecord {
  id: string;
  appointmentId: string;
  hospitalId: string;
  hospitalName: string;
  hospitalAddress?: string;
  doctorId: string;
  doctorName: string;
  doctorDesignation?: string;
  doctorAvatar?: string | null;
  departmentId?: string;
  departmentName: string;
  conditionId?: string | null;
  diseaseName?: string | null;
  date: string;
  timeSlot: string;
  status: 'WAITING' | 'PENDING' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED' | string;
  opType: string;
  fee: number;
  reason?: string | null;
  createdAt: string;
  patientId?: string;
  patientName?: string;
  patientPhone?: string;
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

export const opAppointmentApi = {
  async fetchDiseases(search?: string): Promise<{
    success: boolean;
    data?: {
      total: number;
      conditions: DiseaseCondition[];
      general: DiseaseCondition[];
      advanced: DiseaseCondition[];
      categorical: CategoricalSpecialty[];
    };
    error?: string;
  }> {
    try {
      const url = new URL(`${API_BASE_URL}/diseases`);
      if (search) {
        url.searchParams.set('search', search);
      }
      const res = await fetch(url.toString(), {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to fetch diseases' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  async fetchHospitals(search?: string, conditionId?: string): Promise<{
    success: boolean;
    data?: HospitalRecord[];
    error?: string;
  }> {
    try {
      const url = new URL(`${API_BASE_URL}/hospitals`);
      if (search) url.searchParams.set('search', search);
      if (conditionId) url.searchParams.set('conditionId', conditionId);

      const res = await fetch(url.toString(), {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to fetch hospitals' };
      }

      // Format address and contact for consistent display
      const hospitals: HospitalRecord[] = (json.data || []).map((h: any) => ({
        ...h,
        address: [h.addressLine1, h.area, h.city].filter(Boolean).join(', ') || h.city || 'India',
        contact: h.contactPhone || '+91 99999 99999',
        verified: true,
        description: h.description || `${h.name} is a premier healthcare facility offering advanced clinical care and specialized treatments.`
      }));

      return { success: true, data: hospitals };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  async fetchHospitalDoctors(hospitalId: string, departmentId?: string): Promise<{
    success: boolean;
    data?: DoctorRecord[];
    error?: string;
  }> {
    try {
      const url = new URL(`${API_BASE_URL}/hospitals/${hospitalId}/doctors`);
      if (departmentId) url.searchParams.set('departmentId', departmentId);

      const res = await fetch(url.toString(), {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to fetch doctors' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  async fetchDoctorDetails(doctorId: string): Promise<{
    success: boolean;
    data?: DoctorRecord;
    error?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/doctors/${doctorId}`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to fetch doctor profile' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  async fetchDoctorAvailability(doctorId: string, date: string): Promise<{
    success: boolean;
    data?: {
      doctorId: string;
      doctorName: string;
      date: string;
      allSlots: string[];
      availableSlots: string[];
      bookedSlots: string[];
    };
    error?: string;
  }> {
    try {
      const url = new URL(`${API_BASE_URL}/doctors/${doctorId}/availability`);
      if (date) url.searchParams.set('date', date);

      const res = await fetch(url.toString(), {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to fetch doctor availability' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  async createOpAppointment(payload: CreateAppointmentPayload): Promise<{
    success: boolean;
    data?: any;
    error?: { code: string; message: string } | string;
    statusCode?: number;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/appointments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return {
          success: false,
          statusCode: res.status,
          error: json.error || { code: 'ERROR', message: 'Failed to create appointment' }
        };
      }
      return { success: true, data: json.data, statusCode: res.status };
    } catch (err: any) {
      return {
        success: false,
        statusCode: 500,
        error: { code: 'NETWORK_ERROR', message: err.message || 'Could not connect to server' }
      };
    }
  },

  async fetchAppointmentDetails(appointmentId: string): Promise<{
    success: boolean;
    data?: OpBookingRecord;
    error?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to fetch appointment' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  async fetchMyAppointments(): Promise<{
    success: boolean;
    data?: OpBookingRecord[];
    error?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/my`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to fetch appointments' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  }
};
