const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export interface HospitalRecord {
  id: string;
  name: string;
  businessType?: string;
  facilityType?: string;
  registrationNumber?: string;
  logoUrl?: string;
  contactPhone?: string;
  contactEmail?: string;
  website?: string;
  addressLine1?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  address?: string;
  contact?: string;
  services?: string[];
  departments: string[];
  departmentList?: Array<{
    id: string;
    name: string;
    code?: string;
    description?: string;
    specialtyId?: string;
    specialty?: { id: string; name: string };
    doctorCount?: number;
  }>;
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

export interface DepartmentRecord {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  specialtyId: string;
  specialty?: { id: string; name: string; description?: string };
  hospitalId: string;
  hospitalName?: string;
  doctorCount?: number;
}

export interface LaboratoryRecord {
  id: string;
  name: string;
  businessType?: string;
  facilityType?: string;
  logoUrl?: string;
  contactPhone?: string;
  contactEmail?: string;
  addressLine1?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  location: string;
  address: string;
  services?: string[];
  rating: number;
  time: string;
  price: string;
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

export const hospitalApi = {
  async getHospitals(params?: {
    search?: string;
    conditionId?: string;
    specialtyId?: string;
    departmentId?: string;
    city?: string;
  }): Promise<{ success: boolean; data?: HospitalRecord[]; error?: string }> {
    try {
      const url = new URL(`${API_BASE_URL}/hospitals`);
      if (params?.search) url.searchParams.set('search', params.search);
      if (params?.conditionId) url.searchParams.set('conditionId', params.conditionId);
      if (params?.specialtyId) url.searchParams.set('specialtyId', params.specialtyId);
      if (params?.departmentId) url.searchParams.set('departmentId', params.departmentId);
      if (params?.city) url.searchParams.set('city', params.city);

      const res = await fetch(url.toString(), { headers: getAuthHeaders() });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to fetch hospitals' };
      }

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

  async getHospital(id: string): Promise<{ success: boolean; data?: HospitalRecord; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/hospitals/${id}`, { headers: getAuthHeaders() });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to fetch hospital details' };
      }

      const h = json.data;
      const hospital: HospitalRecord = {
        ...h,
        address: [h.addressLine1, h.area, h.city].filter(Boolean).join(', ') || h.city || 'India',
        contact: h.contactPhone || '+91 99999 99999',
        verified: true,
        description: h.description || `${h.name} is a premier healthcare facility offering advanced clinical care and specialized treatments.`
      };

      return { success: true, data: hospital };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  async getHospitalDepartments(hospitalId: string): Promise<{ success: boolean; data?: DepartmentRecord[]; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/hospitals/${hospitalId}/departments`, { headers: getAuthHeaders() });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to fetch hospital departments' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  async getHospitalDoctors(hospitalId: string, departmentId?: string): Promise<{ success: boolean; data?: DoctorRecord[]; error?: string }> {
    try {
      const url = new URL(`${API_BASE_URL}/hospitals/${hospitalId}/doctors`);
      if (departmentId) url.searchParams.set('departmentId', departmentId);

      const res = await fetch(url.toString(), { headers: getAuthHeaders() });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to fetch doctors' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  }
};

export const doctorApi = {
  async getDoctors(params?: {
    search?: string;
    departmentId?: string;
    hospitalId?: string;
    specialtyId?: string;
  }): Promise<{ success: boolean; data?: DoctorRecord[]; error?: string }> {
    try {
      const url = new URL(`${API_BASE_URL}/doctors`);
      if (params?.search) url.searchParams.set('search', params.search);
      if (params?.departmentId) url.searchParams.set('departmentId', params.departmentId);
      if (params?.hospitalId) url.searchParams.set('hospitalId', params.hospitalId);
      if (params?.specialtyId) url.searchParams.set('specialtyId', params.specialtyId);

      const res = await fetch(url.toString(), { headers: getAuthHeaders() });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to fetch doctors' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  async getDoctor(id: string): Promise<{ success: boolean; data?: DoctorRecord; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/doctors/${id}`, { headers: getAuthHeaders() });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to fetch doctor profile' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  async getAvailability(id: string, date?: string): Promise<{
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
      const url = new URL(`${API_BASE_URL}/doctors/${id}/availability`);
      if (date) url.searchParams.set('date', date);

      const res = await fetch(url.toString(), { headers: getAuthHeaders() });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to fetch doctor availability' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  }
};

export const departmentApi = {
  async getDepartments(params?: {
    hospitalId?: string;
    search?: string;
    specialtyId?: string;
  }): Promise<{ success: boolean; data?: DepartmentRecord[]; error?: string }> {
    try {
      const url = new URL(`${API_BASE_URL}/departments`);
      if (params?.hospitalId) url.searchParams.set('hospitalId', params.hospitalId);
      if (params?.search) url.searchParams.set('search', params.search);
      if (params?.specialtyId) url.searchParams.set('specialtyId', params.specialtyId);

      const res = await fetch(url.toString(), { headers: getAuthHeaders() });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to fetch departments' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  async getDepartment(id: string): Promise<{ success: boolean; data?: DepartmentRecord; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/departments/${id}`, { headers: getAuthHeaders() });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to fetch department' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  async getDepartmentDoctors(id: string): Promise<{ success: boolean; data?: DoctorRecord[]; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/departments/${id}/doctors`, { headers: getAuthHeaders() });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to fetch department doctors' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  }
};

export const laboratoryApi = {
  async getLaboratories(params?: {
    search?: string;
    hospitalId?: string;
    location?: string;
  }): Promise<{ success: boolean; data?: LaboratoryRecord[]; error?: string }> {
    try {
      const url = new URL(`${API_BASE_URL}/laboratories`);
      if (params?.search) url.searchParams.set('search', params.search);
      if (params?.hospitalId) url.searchParams.set('hospitalId', params.hospitalId);
      if (params?.location) url.searchParams.set('location', params.location);

      const res = await fetch(url.toString(), { headers: getAuthHeaders() });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to fetch laboratories' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  async getLaboratory(id: string): Promise<{ success: boolean; data?: LaboratoryRecord; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/laboratories/${id}`, { headers: getAuthHeaders() });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to fetch laboratory' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  }
};
