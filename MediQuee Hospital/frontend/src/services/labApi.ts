import { API_BASE_URL as API_BASE } from './apiConfig';

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

  // --- Lab Availability Management ---
  async getAvailability() {
    const res = await fetch(`${API_BASE}/laboratories/me/availability`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to fetch lab availability');
    }
    return data.data;
  },

  async updateAvailability(schedules: any[]) {
    const res = await fetch(`${API_BASE}/laboratories/me/availability`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ schedules })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update lab availability');
    }
    return data.data;
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
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data?.error?.message || 'Failed to fetch hospital tests');
    return data;
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
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data?.error?.message || 'Failed to update test status');
    return data;
  },

  async getLabDashboard() {
    const res = await fetch(`${API_BASE}/lab-bookings/hospital/dashboard`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data?.error?.message || 'Failed to fetch lab dashboard data');
    return data;
  },

  async getLabBookingById(id: string) {
    const res = await fetch(`${API_BASE}/lab-bookings/${id}`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data?.error?.message || 'Failed to fetch lab booking details');
    return data;
  },

  async getLabBookings(filters?: { status?: string; bookingType?: string }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.bookingType) params.append('bookingType', filters.bookingType);

    const url = `${API_BASE}/lab-bookings/hospital${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data?.error?.message || 'Failed to fetch lab bookings');
    return data;
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

  async createOrder(payload: {
    patientName: string;
    mobile: string;
    email?: string;
    sampleType?: string;
    tests: string[];
    bookingType?: string;
    address?: string;
    collectionDate?: string;
    collectionTimeSlot?: string;
  }): Promise<{ id: string }> {
    const res = await fetch(`${API_BASE}/lab-bookings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        patientName: payload.patientName,
        mobile: payload.mobile,
        email: payload.email,
        items: payload.tests,
        bookingType: payload.bookingType || 'WALK_IN',
        collectionAddress: payload.address,
        collectionDate: payload.collectionDate,
        collectionTimeSlot: payload.collectionTimeSlot
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data?.error?.message || 'Failed to create order');
    }
    return data.data;
  },
  async uploadReport(orderId: string, payload: unknown): Promise<{ id: string }> {
    const res = await fetch(`${API_BASE}/lab-bookings/hospital/${orderId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status: 'REPORT_READY' })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data?.error?.message || 'Failed to update order to Report Ready');
    }
    return { id: orderId };
  },
  async createPackage(payload: unknown): Promise<{ id: string }> {
    throw new Error('Test packages are managed through the master platform catalog.');
  },
  async createHomeCollection(payload: {
    patientName: string;
    mobile: string;
    address: string;
    test: string;
    date: string;
    time: string;
  }): Promise<{ id: string }> {
    return this.createOrder({
      patientName: payload.patientName,
      mobile: payload.mobile,
      tests: [payload.test],
      bookingType: 'HOME_COLLECTION',
      address: payload.address,
      collectionDate: payload.date,
      collectionTimeSlot: payload.time
    });
  },
  async updateLabInfo(payload: unknown): Promise<void> {
    throw new Error('Lab information is managed by hospital administration.');
  }
};
