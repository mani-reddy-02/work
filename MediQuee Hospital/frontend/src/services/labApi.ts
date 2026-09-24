const API_BASE = 'http://localhost:5000/api/v1';

function getAuthToken(): string {
  return localStorage.getItem('mediquee_token') || localStorage.getItem('token') || '';
}

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const labApi = {
  // --- Reference APIs ---
  async getPlatformLabDepartments() {
    const res = await fetch(`${API_BASE}/reference/lab-departments`);
    if (!res.ok) throw new Error('Failed to fetch departments');
    return res.json();
  },

  async getPlatformLabTests(departmentId?: string, search?: string, homeCollectionOnly?: boolean) {
    const params = new URLSearchParams();
    if (departmentId) params.append('departmentId', departmentId);
    if (search) params.append('search', search);
    if (homeCollectionOnly) params.append('homeCollectionOnly', 'true');
    
    const url = `${API_BASE}/reference/lab-tests${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch platform tests');
    return res.json();
  },

  // --- License & Hospital Lab Management ---
  async uploadLicenseCertificate(file: File): Promise<{ fileUrl: string; fileName: string; size: number }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await fetch(`${API_BASE}/laboratories/upload-license`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              fileName: file.name,
              fileData: base64Data
            })
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data?.error?.message || data?.message || 'Failed to upload license certificate');
          }
          resolve(data.data);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read certificate file'));
      reader.readAsDataURL(file);
    });
  },

  async createHospitalLab(payload: {
    platformDepartmentId: string;
    labLicenseNumber: string;
    labLicenseDocumentUrl: string;
    licenseValidUntil?: string | null;
    email: string;
    password: string;
    phone: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/laboratories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data?.error?.message || data?.message || 'Failed to create laboratory');
    }
    return data.data;
  },

  // --- Hospital Lab APIs ---
  async getHospitalLabMenu() {
    const res = await fetch(`${API_BASE}/hospital/lab-tests`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch hospital tests');
    return res.json();
  },

  async saveHospitalLabTestsBatch(payload: any[]) {
    const res = await fetch(`${API_BASE}/hospital/lab-tests/batch`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data?.error?.message || 'Failed to save tests');
    return data;
  },

  async updateTestStatus(id: string, active: boolean) {
    const res = await fetch(`${API_BASE}/hospital/lab-tests/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ isActive: active })
    });
    if (!res.ok) throw new Error('Failed to update test status');
    return res.json();
  },

  async getLabBookings(filters?: { status?: string; bookingType?: string }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.bookingType) params.append('bookingType', filters.bookingType);

    const url = `${API_BASE}/lab-bookings/hospital${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch lab bookings');
    return res.json();
  },

  async updateLabBookingStatus(id: string, payload: { status: string; phlebotomistName?: string; phlebotomistPhone?: string; sampleCollectedAt?: string }) {
    const res = await fetch(`${API_BASE}/lab-bookings/hospital/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update booking status');
    return res.json();
  },

  // Stub for existing orders/reports in other parts of the app
  async createOrder(payload: unknown): Promise<{ id: string }> {
    throw new Error('BACKEND_MISSING: POST /api/lab/orders is not implemented.');
  },
  async uploadReport(orderId: string, payload: unknown): Promise<{ id: string }> {
    throw new Error('BACKEND_MISSING: POST /api/lab/orders/:id/report is not implemented.');
  },
  async createPackage(payload: unknown): Promise<{ id: string }> {
    throw new Error('BACKEND_MISSING: POST /api/lab/packages is not implemented.');
  },
  async createHomeCollection(payload: unknown): Promise<{ id: string }> {
    throw new Error('BACKEND_MISSING: POST /api/lab/home-collections is not implemented.');
  },
  async updateLabInfo(payload: unknown): Promise<void> {
    throw new Error('BACKEND_MISSING: PUT /api/lab/me is not implemented.');
  }
};
