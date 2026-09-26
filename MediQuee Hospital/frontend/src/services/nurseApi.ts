// ----------------------------------------------------------------------------
// NURSE & HOME NURSING API SERVICE
// Direct real-time database connection to Supabase backend
// ----------------------------------------------------------------------------

const API_BASE_URL = 'http://127.0.0.1:5000/api/v1';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('mediquee_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface NurseVisit {
  id: string;
  bookingNumber: string;
  name: string;
  patientPhone: string;
  patientEmail?: string | null;
  service: string;
  serviceCategory?: string;
  time: string;
  date: string;
  address: string;
  city?: string | null;
  pincode?: string | null;
  notes?: string | null;
  status: 'In Progress' | 'Completed' | 'Upcoming' | 'Assigned' | 'Cancelled';
  rawStatus: 'CONFIRMED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  duration: string;
  totalAmount: number;
  distance: string;
}

export interface NurseDashboardData {
  nurse: {
    id: string;
    name: string;
    email: string;
    hospitalName: string;
  };
  stats: {
    visitsToday: number;
    upcoming: number;
    inProgress: number;
    completed: number;
  };
  nextVisit: NurseVisit | null;
  todayVisits: NurseVisit[];
}

export interface HospitalNursingBooking {
  id: string;
  bookingNumber: string;
  mqId: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string | null;
  serviceName: string;
  serviceCategory?: string;
  serviceDate: string;
  timeSlot: string;
  duration?: string | null;
  address: string;
  city?: string | null;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  nurseId?: string | null;
  nurse?: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
  } | null;
  notes?: string | null;
  createdAt: string;
}

export interface HospitalNurseStaff {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  qualification?: string | null;
  specialization?: string | null;
  experienceYears?: number | null;
}

export const nurseApi = {
  /**
   * Fetch current authenticated nurse's live dashboard data:
   * Real stats, next scheduled/in-progress visit, and today's visits list.
   */
  async getDashboard(): Promise<NurseDashboardData> {
    const res = await fetch(`${API_BASE_URL}/home-nursing/nurse/dashboard`, {
      headers: getAuthHeaders(),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to load nurse dashboard');
    }

    return json.data;
  },

  /**
   * Fetch all assigned home visits separated into upcoming and history tabs.
   */
  async getVisits(params?: { search?: string; date?: string }): Promise<{
    upcoming: NurseVisit[];
    history: NurseVisit[];
    all: NurseVisit[];
  }> {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.date) q.append('date', params.date);

    const res = await fetch(`${API_BASE_URL}/home-nursing/nurse/visits?${q.toString()}`, {
      headers: getAuthHeaders(),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to load nurse visits');
    }

    return json.data;
  },

  /**
   * Update the visit status:
   * - IN_PROGRESS: Nurse arrives at patient home and starts procedure
   * - COMPLETED: Nurse finishes procedure (notifies hospital and user for feedback)
   */
  async updateVisitStatus(
    id: string,
    status: 'IN_PROGRESS' | 'COMPLETED' | 'ASSIGNED',
    notes?: string
  ): Promise<{ id: string; status: string; message: string }> {
    const res = await fetch(`${API_BASE_URL}/home-nursing/nurse/visits/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, notes }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to update visit status');
    }

    return json.data;
  },

  /**
   * Hospital: Fetch all Home Nursing requests booked by customers for this hospital.
   */
  async getHospitalBookings(filters?: {
    status?: string;
    date?: string;
    search?: string;
  }): Promise<HospitalNursingBooking[]> {
    const q = new URLSearchParams();
    if (filters?.status) q.append('status', filters.status);
    if (filters?.date) q.append('date', filters.date);
    if (filters?.search) q.append('search', filters.search);

    const res = await fetch(`${API_BASE_URL}/home-nursing/hospital/bookings?${q.toString()}`, {
      headers: getAuthHeaders(),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to load hospital home nursing bookings');
    }

    return json.data;
  },

  /**
   * Hospital: Assign an active nurse from the hospital to a home nursing booking.
   */
  async assignNurse(bookingId: string, nurseId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/home-nursing/hospital/bookings/${bookingId}/assign`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ nurseId }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to assign nurse');
    }

    return json.data;
  },

  /**
   * Hospital: List active nurses in this hospital for selection.
   */
  async getHospitalNurses(): Promise<HospitalNurseStaff[]> {
    const res = await fetch(`${API_BASE_URL}/home-nursing/hospital/nurses`, {
      headers: getAuthHeaders(),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to fetch hospital nurses');
    }

    return json.data;
  },
};
