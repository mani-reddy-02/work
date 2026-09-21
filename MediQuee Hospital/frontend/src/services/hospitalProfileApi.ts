// ----------------------------------------------------------------------------
// HOSPITAL PROFILE & FACILITY METADATA API SERVICE LAYER
// ----------------------------------------------------------------------------

export interface HospitalVerificationDoc {
  id: string;
  documentType: string;
  fileUrl: string;
  createdAt: string;
}

export interface HospitalProfile {
  id: string;
  name: string;
  businessType: string;
  facilityType?: string | null;
  registrationNumber?: string | null;
  establishedYear?: string | null;
  logoUrl?: string | null;
  contactPhone?: string | null;
  phone?: string | null;
  contactEmail?: string | null;
  email?: string | null;
  website?: string | null;
  emergencyContact?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  area?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  address?: string | null;
  services?: string[];
  verificationStatus?: 'VERIFIED' | 'PENDING' | string;
  verifications?: HospitalVerificationDoc[];
  departmentsCount?: number;
  staffCount?: number;
  totalBookingsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateHospitalProfileDto {
  name?: string;
  facilityType?: string;
  registrationNumber?: string;
  establishedYear?: string;
  contactPhone?: string;
  phone?: string;
  contactEmail?: string;
  email?: string;
  website?: string;
  emergencyContact?: string;
  addressLine1?: string;
  addressLine2?: string;
  area?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  services?: string[];
}

export interface HospitalProfileResponse {
  success: boolean;
  data: HospitalProfile;
  message?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('mediquee_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const hospitalProfileApi = {
  /**
   * GET /api/v1/hospital/profile
   * Retrieves the authoritative profile of the authenticated hospital.
   */
  async getProfile(): Promise<HospitalProfile> {
    const res = await fetch(`${API_URL}/api/v1/hospital/profile`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to fetch hospital profile');
    }

    const json = await res.json();
    return json.data;
  },

  /**
   * PUT /api/v1/hospital/profile
   * Updates the authoritative profile of the authenticated hospital.
   */
  async updateProfile(data: UpdateHospitalProfileDto): Promise<HospitalProfile> {
    const res = await fetch(`${API_URL}/api/v1/hospital/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to update hospital profile');
    }

    const json = await res.json();
    return json.data;
  },
};
