import { API_URL } from './apiConfig';

export type QueueStatus = 'ARRIVED' | 'WAITING' | 'CALLED' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED';

export interface QueueEntry {
  id: string;
  token: string;
  tokenNumber?: number;
  isWalkIn?: boolean;
  place?: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  patientAge?: number;
  patientGender?: string;
  departmentId: string;
  departmentName: string;
  doctorId?: string;
  doctorName?: string;
  arrivalTime: string;
  status: QueueStatus;
  slotTime?: string;
  timeSlot?: string;
  opType?: string;
  reason?: string;
  fee?: number;
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  place?: string;
}

export interface CheckInRequest {
  patientId?: string; // If existing
  patientData?: {
    name: string;
    phone: string;
    age: number;
    gender: string;
    place?: string;
  };
  departmentId: string;
  doctorId?: string;
  opType?: string;
  slotTime?: string;
  timeSlot?: string;
  reason?: string;
  symptoms?: string;
  consultationFee?: number;
}

export interface BookAppointmentRequest {
  patientId?: string;
  patientData?: { name: string; phone: string; age: number; gender: string; place?: string };
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
  async checkInPatient(request: CheckInRequest): Promise<{ token: string; tokenNumber?: number; queueId: string }> {
    const patientName = request.patientData?.name || 'Walk-In Patient';
    const patientPhone = request.patientData?.phone || undefined;
    const patientAge = request.patientData?.age || undefined;
    const patientGender = request.patientData?.gender || undefined;
    const place = request.patientData?.place || undefined;

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
        place,
        opType: request.opType || 'Normal',
        reason: request.reason || request.symptoms,
        timeSlot: request.timeSlot || request.slotTime,
        slotTime: request.slotTime || request.timeSlot,
        consultationFee: request.consultationFee,
        fee: request.consultationFee || 0
      }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error?.message || error.message || 'Failed to check in patient');
    }
    const data = await res.json();
    const b = data.data;
    const tokenFormatted = b.token || (b.tokenNumber ? `Token #${String(b.tokenNumber).padStart(2, '0')}` : `OP-${b.id.substring(0, 6).toUpperCase()}`);
    return {
      token: tokenFormatted,
      tokenNumber: b.tokenNumber,
      queueId: b.id
    };
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
    params.append('type', 'OP');
    params.append('excludeVideo', 'true');

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
    
    // Receptionist Queue strictly displays OP consultations, excluding video consultations
    const isVideoBooking = (b: any) => {
      const op = (b.opType || '').toLowerCase();
      return (
        op.includes('video') ||
        op.includes('online') ||
        Boolean(b.videoConsultation)
      );
    };

    // Map OPBooking to QueueEntry format
    return (data.data || [])
      .filter((b: any) => !isVideoBooking(b))
      .map((b: any) => {
        const tokenNum = b.tokenNumber;
        const tokenStr = tokenNum
          ? `OP-${String(tokenNum).padStart(2, '0')}`
          : `OP-${b.id.substring(0, 6).toUpperCase()}`;
        return {
          id: b.id,
          token: tokenStr,
          tokenNumber: tokenNum,
          isWalkIn: b.isWalkIn,
          place: b.place || b.patient?.address || '',
          patientId: b.patientId || b.id,
          patientName: b.patientName,
          patientPhone: b.patientPhone,
          patientAge: b.patientAge,
          patientGender: b.patientGender,
          departmentId: b.departmentId,
          departmentName: b.department?.name || '',
          doctorId: b.doctorId,
          doctorName: b.doctor?.name || '',
          arrivalTime: b.appointmentDate,
          slotTime: b.slotTime || b.timeSlot,
          timeSlot: b.timeSlot || b.slotTime,
          opType: b.opType || (b.isWalkIn ? 'OP Walk-In' : 'OP Consultation'),
          reason: b.reason || b.condition?.name,
          status: b.status as QueueStatus,
          fee: b.fee
        };
      });
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
    const tokenNum = b.tokenNumber;
    const tokenStr = tokenNum
      ? `OP-${String(tokenNum).padStart(2, '0')}`
      : `OP-${b.id.substring(0, 6).toUpperCase()}`;
    return {
      id: b.id,
      token: tokenStr,
      tokenNumber: tokenNum,
      isWalkIn: b.isWalkIn,
      place: b.place || b.patient?.address || '',
      patientId: b.patientId || b.id,
      patientName: b.patientName,
      patientPhone: b.patientPhone,
      patientAge: b.patientAge,
      patientGender: b.patientGender,
      departmentId: b.departmentId,
      departmentName: b.department?.name || '',
      doctorId: b.doctorId,
      doctorName: b.doctor?.name || '',
      arrivalTime: b.appointmentDate,
      slotTime: b.slotTime || b.timeSlot,
      timeSlot: b.timeSlot || b.slotTime,
      opType: b.opType || (b.isWalkIn ? 'OP Walk-In' : 'OP Consultation'),
      reason: b.reason || b.condition?.name,
      status: b.status as QueueStatus,
      fee: b.fee
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
  async getDoctors(departmentId?: string): Promise<{ id: string; name: string; departmentId: string; consultationFee?: number; specialization?: string; avatar?: string }[]> {
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
      .map((s: any) => ({
        id: s.id,
        name: s.name,
        departmentId: s.department?.id || '',
        consultationFee: s.consultationFee || 500,
        specialization: s.specialization || '',
        avatar: s.avatar || ''
      }));
  },

  /**
   * GET /api/v1/doctors/status
   * Retrieves live doctor availability, today's schedule, and temporary override status.
   */
  async getDoctorsStatus(hospitalId?: string): Promise<DoctorStatusSummary[]> {
    const url = hospitalId 
      ? `${API_URL}/api/v1/doctors/hospital/${hospitalId}/status`
      : `${API_URL}/api/v1/doctors/status`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to fetch doctor status');
    }
    const data = await res.json();
    return data.data || [];
  },

  /**
   * PATCH /api/v1/doctors/:id/active-status
   * Sets doctor to inactive for X hours or reactivates immediately.
   */
  async updateDoctorActiveStatus(doctorId: string, payload: {
    active: boolean;
    durationHours?: number;
    durationMinutes?: number;
    restOfToday?: boolean;
    inactiveUntil?: string;
    reason?: string;
  }): Promise<{ success: boolean; data: DoctorStatusSummary; message?: string }> {
    const res = await fetch(`${API_URL}/api/v1/doctors/${doctorId}/active-status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error?.message || error.message || 'Failed to update doctor active status');
    }
    return await res.json();
  }
};
