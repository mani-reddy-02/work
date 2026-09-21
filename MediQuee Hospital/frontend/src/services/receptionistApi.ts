export type QueueStatus = 'ARRIVED' | 'WAITING' | 'CALLED' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED';

export interface QueueEntry {
  id: string;
  token: string;
  patientId: string;
  patientName: string;
  departmentId: string;
  departmentName: string;
  doctorId?: string;
  doctorName?: string;
  arrivalTime: string;
  status: QueueStatus;
  slotTime?: string;
  timeSlot?: string;
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
}

export interface CheckInRequest {
  patientId?: string; // If existing
  patientData?: { name: string; phone: string; age: number; gender: string }; // If new
  departmentId: string;
  doctorId?: string;
  opType: string;
  slotTime?: string;
  timeSlot?: string;
}

export interface BookAppointmentRequest {
  patientId?: string;
  patientData?: { name: string; phone: string; age: number; gender: string };
  departmentId: string;
  doctorId?: string;
  date: string;
  time: string;
  appointmentType: string;
}

// ----------------------------------------------------------------------------
// API SERVICE LAYER
// Uses the same auth token as adminApi (stored in localStorage by AuthContext).
// The backend extracts hospitalId from the JWT — multi-tenancy is enforced
// server-side, NOT client-side.
// ----------------------------------------------------------------------------

const API_URL = 'http://127.0.0.1:5000';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('mediquee_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const receptionistApi = {
  
  /**
   * POST /api/v1/hospital/bookings/walk-in
   * Registers a patient and adds them to the OP queue as a WAITING walk-in.
   * Maps the CheckInRequest to the backend walk-in schema.
   */
  async checkInPatient(request: CheckInRequest): Promise<{ token: string; queueId: string }> {
    // Build the walk-in payload from the check-in request
    const patientName = request.patientData?.name || 'Walk-In Patient';
    const patientPhone = request.patientData?.phone || undefined;
    const patientAge = request.patientData?.age || undefined;
    const patientGender = request.patientData?.gender || undefined;

    const res = await fetch(`${API_URL}/api/v1/hospital/bookings/walk-in`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        departmentId: request.departmentId,
        doctorId: request.doctorId,
        patientName,
        patientPhone,
        patientAge,
        patientGender,
        opType: request.opType || 'Normal',
        timeSlot: request.timeSlot || request.slotTime,
        slotTime: request.slotTime || request.timeSlot,
        fee: 0
      }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to check in patient');
    }
    const data = await res.json();
    // Return a token-like response from the booking ID
    return { token: `OP-${data.data.id.substring(0, 6).toUpperCase()}`, queueId: data.data.id };
  },

  /**
   * POST /api/v1/hospital/bookings/walk-in
   * Schedules an appointment with date and time slot.
   */
  async bookAppointment(request: BookAppointmentRequest): Promise<{ appointmentId: string }> {
    const patientName = request.patientData?.name || 'Appointment Patient';
    const patientPhone = request.patientData?.phone || undefined;
    const patientAge = request.patientData?.age || undefined;
    const patientGender = request.patientData?.gender || undefined;

    const res = await fetch(`${API_URL}/api/v1/hospital/bookings/walk-in`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        departmentId: request.departmentId,
        doctorId: request.doctorId,
        patientName,
        patientPhone,
        patientAge,
        patientGender,
        opType: request.appointmentType || 'Normal',
        appointmentDate: request.date,
        timeSlot: request.time,
        slotTime: request.time,
        fee: 0
      }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to book appointment');
    }

    const data = await res.json();
    return { appointmentId: data.data.id };
  },

  /**
   * GET /api/v1/hospital/bookings
   * Retrieves the active queue (today's bookings).
   */
  async getQueue(filters?: { departmentId?: string; date?: string; range?: string; status?: QueueStatus[] }): Promise<QueueEntry[]> {
    const params = new URLSearchParams();
    if (filters?.departmentId) params.append('departmentId', filters.departmentId);
    if (filters?.date) params.append('date', filters.date);
    if (filters?.range) params.append('range', filters.range);
    if (filters?.status && filters.status.length > 0) params.append('status', filters.status.join(','));

    const qs = params.toString();
    const url = `${API_URL}/api/v1/hospital/bookings${qs ? `?${qs}` : ''}`;

    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to fetch queue');
    }
    const data = await res.json();
    // Map OPBooking to QueueEntry format
    return (data.data || []).map((b: any) => ({
      id: b.id,
      token: `OP-${b.id.substring(0, 6).toUpperCase()}`,
      patientId: b.id,
      patientName: b.patientName,
      departmentId: b.departmentId,
      departmentName: b.department?.name || '',
      doctorId: b.doctorId,
      doctorName: b.doctor?.name || '',
      arrivalTime: b.appointmentDate,
      slotTime: b.slotTime || b.timeSlot,
      timeSlot: b.timeSlot || b.slotTime,
      status: b.status as QueueStatus,
    }));
  },

  /**
   * PATCH /api/v1/hospital/bookings/:id/status
   * Updates a queue entry's status.
   */
  async updateQueueStatus(queueId: string, newStatus: QueueStatus): Promise<QueueEntry> {
    const res = await fetch(`${API_URL}/api/v1/hospital/bookings/${queueId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error?.message || `Failed to update status to ${newStatus}`);
    }
    const data = await res.json();
    const b = data.data;
    return {
      id: b.id,
      token: `OP-${b.id.substring(0, 6).toUpperCase()}`,
      patientId: b.id,
      patientName: b.patientName,
      departmentId: b.departmentId,
      departmentName: b.department?.name || '',
      doctorId: b.doctorId,
      doctorName: b.doctor?.name || '',
      arrivalTime: b.appointmentDate,
      status: b.status as QueueStatus,
    };
  },

  /**
   * GET /api/patients/search?q=
   * Searches for existing patients by name or phone.
   * NOTE: Patient model does not exist yet — returns empty for now.
   */
  async searchPatients(query: string): Promise<Patient[]> {
    console.log('[API Call] GET /api/patients/search?q=' + query);
    return [];
  },

  /**
   * GET /api/v1/departments
   * Retrieves all hospital departments for the authenticated user's hospital.
   * Multi-tenancy: backend filters by hospitalId from the JWT token.
   */
  async getDepartments(): Promise<{ id: string; name: string }[]> {
    const res = await fetch(`${API_URL}/api/v1/departments`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to fetch departments');
    }
    const data = await res.json();
    return (data.data || []).map((d: any) => ({ id: d.id, name: d.name }));
  },

  /**
   * GET /api/v1/staff
   * Retrieves doctors for the authenticated user's hospital.
   * Multi-tenancy: backend filters by hospitalId from the JWT token.
   * We filter client-side for DOCTOR role since the staff endpoint returns all staff roles.
   */
  async getDoctors(departmentId?: string): Promise<{ id: string; name: string; departmentId: string }[]> {
    const res = await fetch(`${API_URL}/api/v1/staff`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to fetch doctors');
    }
    const data = await res.json();
    // Filter for DOCTORs only, and optionally by department
    return (data.data || [])
      .filter((s: any) => s.role === 'DOCTOR')
      .filter((s: any) => !departmentId || s.department?.id === departmentId)
      .map((s: any) => ({ id: s.id, name: s.name, departmentId: s.department?.id || '' }));
  }
};
