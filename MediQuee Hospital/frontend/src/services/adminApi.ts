// ----------------------------------------------------------------------------
// ADMIN / HOSPITAL API SERVICE LAYER
// ----------------------------------------------------------------------------

const API_URL = 'http://127.0.0.1:5000';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('mediquee_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface MarketingRequestInput {
  campaignType?: string;
  services?: string[];
  budget?: number | null;
  targetAudience?: string | null;
  preferredTime?: string | null;
  notes?: string | null;
}

export interface MarketingRequestRecord {
  id: string;
  hospitalId: string;
  campaignType: string;
  budget: number | null;
  targetAudience: string | null;
  notes: string | null;
  status: 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}

export interface CampRequestInput {
  campTitle?: string;
  location: string;
  expectedDate: string;
  specialties?: string[];
  speciality?: string | null;
  expectedPatients?: number | null;
  expectedFootfall?: string | null;
  notes?: string | null;
}

export interface MedicalCampRecord {
  id: string;
  hospitalId: string;
  campTitle: string;
  location: string;
  expectedDate: string;
  specialties: string[];
  expectedPatients: number | null;
  notes: string | null;
  status: 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}

export interface HospitalRequestsResponse {
  marketingRequests: MarketingRequestRecord[];
  campRequests: MedicalCampRecord[];
}

export const adminApi = {
  /**
   * GET /api/v1/reference/specialties
   * Fetch platform specialties
   */
  async getSpecialties(): Promise<any[]> {
    const res = await fetch(`${API_URL}/api/v1/reference/specialties`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to fetch specialties');
    }
    const data = await res.json();
    return data.data;
  },
  
  /**
   * GET /api/v1/reference/lab-departments
   * Fetch platform lab departments
   */
  async getPlatformLabDepartments(): Promise<any[]> {
    const res = await fetch(`${API_URL}/api/v1/reference/lab-departments`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to fetch lab departments');
    }
    const data = await res.json();
    return data.data;
  },
  /**
   * GET /api/v1/departments
   * Fetch hospital departments
   */
  async getDepartments(): Promise<any[]> {
    const res = await fetch(`${API_URL}/api/v1/departments`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'Failed to fetch departments');
    }
    const data = await res.json();
    return data.data;
  },

  /**
   * POST /api/v1/departments
   * Creates a hospital department.
   */
  async createDepartment(payload: unknown): Promise<{ id: string }> {
    const res = await fetch(`${API_URL}/api/v1/departments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'Failed to create department');
    }
    const data = await res.json();
    return data.data;
  },

  /**
   * PATCH /api/v1/departments/:id
   * Updates a hospital department.
   */
  async updateDepartment(id: string, payload: unknown): Promise<{ id: string }> {
    const res = await fetch(`${API_URL}/api/v1/departments/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'Failed to update department');
    }
    const data = await res.json();
    return data.data;
  },

  /**
   * DELETE /api/v1/departments/:id
   * Deletes a hospital department.
   */
  async deleteDepartment(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/api/v1/departments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'Failed to delete department');
    }
  },
  async getStaff(): Promise<any[]> {
    const res = await fetch(`${API_URL}/api/v1/staff`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'Failed to fetch staff');
    }
    const data = await res.json();
    return data.data;
  },

  async createStaff(payload: unknown): Promise<{ id: string }> {
    const res = await fetch(`${API_URL}/api/v1/staff`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'Failed to create staff');
    }
    const data = await res.json();
    return data.data;
  },

  async updateStaff(id: string, payload: unknown): Promise<{ id: string }> {
    const res = await fetch(`${API_URL}/api/v1/staff/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'Failed to update staff');
    }
    const data = await res.json();
    return data.data;
  },

  async deactivateStaff(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/api/v1/staff/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'Failed to deactivate staff');
    }
  },

  /**
   * POST /api/v1/hospital/marketing-requests
   * Submits a hospital marketing service enquiry.
   */
  async requestMarketing(payload: MarketingRequestInput): Promise<MarketingRequestRecord> {
    const res = await fetch(`${API_URL}/api/v1/hospital/marketing-requests`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error?.message || error.message || 'Failed to submit marketing request');
    }
    const data = await res.json();
    return data.data;
  },

  /**
   * POST /api/v1/hospital/camp-requests
   * Submits a community medical camp booking request.
   */
  async requestMedicalCamp(payload: CampRequestInput): Promise<MedicalCampRecord> {
    const res = await fetch(`${API_URL}/api/v1/hospital/camp-requests`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error?.message || error.message || 'Failed to submit medical camp request');
    }
    const data = await res.json();
    return data.data;
  },

  /**
   * POST /api/v1/hospital/inquiries
   * Submits a platform inquiry / demo request to Admin.
   */
  async requestInquiry(payload: { subject: string; message: string; contactPerson?: string; contactPhone?: string; contactEmail?: string }): Promise<any> {
    const res = await fetch(`${API_URL}/api/v1/hospital/inquiries`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error?.message || error.message || 'Failed to submit inquiry');
    }
    const data = await res.json();
    return data.data;
  },

  /**
   * GET /api/v1/hospital/requests
   * Retrieves hospital marketing and medical camp request history.
   */
  async getHospitalRequests(): Promise<HospitalRequestsResponse> {
    const res = await fetch(`${API_URL}/api/v1/hospital/requests`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error?.message || error.message || 'Failed to fetch hospital requests');
    }
    const data = await res.json();
    return data.data;
  },

  /**
   * GET /api/v1/permissions/roles/:role
   * Fetch permissions for a specific role
   */
  async getPermissions(role: string): Promise<any[]> {
    const res = await fetch(`${API_URL}/api/v1/permissions/roles/${role}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'Failed to fetch permissions');
    }
    const data = await res.json();
    return data.data;
  },

  /**
   * PUT /api/v1/permissions/roles/:role
   * Update permissions for a specific role
   */
  async updatePermissions(role: string, permissions: Record<string, boolean>): Promise<void> {
    const res = await fetch(`${API_URL}/api/v1/permissions/roles/${role}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ permissions }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'Failed to update permissions');
    }
  },

  /**
   * OP Bookings
   */
   async getTodayBookings(filters?: { date?: string; range?: string; doctorId?: string; departmentId?: string; status?: string }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.date) params.append('date', filters.date);
    if (filters?.range) params.append('range', filters.range);
    if (filters?.doctorId) params.append('doctorId', filters.doctorId);
    if (filters?.departmentId) params.append('departmentId', filters.departmentId);
    if (filters?.status) params.append('status', filters.status);

    const qs = params.toString();
    const url = `${API_URL}/api/v1/hospital/bookings${qs ? `?${qs}` : ''}`;

    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to fetch bookings');
    }
    const data = await res.json();
    return data.data;
  },

  async getBookings(filters?: { date?: string; range?: string; doctorId?: string; departmentId?: string; status?: string }): Promise<any[]> {
    return this.getTodayBookings(filters);
  },

  async createWalkInBooking(payload: { departmentId: string, doctorId: string, patientName: string, patientPhone?: string, fee: number }): Promise<any> {
    const res = await fetch(`${API_URL}/api/v1/hospital/bookings/walk-in`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to create walk-in booking');
    }
    const data = await res.json();
    return data.data;
  },

  async updateBookingStatus(id: string, status: string, notes?: string): Promise<any> {
    const res = await fetch(`${API_URL}/api/v1/hospital/bookings/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, notes, reason: notes }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to update booking status');
    }
    const data = await res.json();
    return data.data;
  }
};
