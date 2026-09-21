export interface DayAvailability {
  day: string;
  active: boolean;
  opStartTime: string;
  opEndTime: string;
  videoStartTime: string;
  videoEndTime: string;
  slotDurationMinutes?: number;
}

export interface AvailableSlotsResponse {
  doctorId: string;
  doctorName: string;
  date: string;
  dayOfWeek: string;
  isAvailable: boolean;
  allSlots: string[];
  availableSlots: string[];
  bookedSlots: string[];
}

export type DosageTiming = 'BEFORE_FOOD' | 'AFTER_FOOD' | 'WITH_FOOD' | 'EMPTY_STOMACH';
export type DoctorPresenceStatus = 'AVAILABLE_IN_OPD' | 'ON_BREAK' | 'IN_SURGERY' | 'OFF_DUTY';

export interface ConsultationVitals {
  systolicBp?: number | null;
  diastolicBp?: number | null;
  pulseRate?: number | null;
  bodyTemperature?: number | null;
  respiratoryRate?: number | null;
  spo2?: number | null;
  weightKg?: number | null;
  heightCm?: number | null;
}

export interface PrescriptionItemPayload {
  medicineName: string;
  dosageForm: string;
  strength?: string | null;
  frequency: string;
  durationDays: number;
  timing: DosageTiming;
  instructions?: string | null;
}

export interface ConsultationPayload {
  diagnosis: string;
  clinicalNotes?: string | null;
  generalAdvice?: string | null;
  followUpDate?: string | null;
  vitals?: ConsultationVitals | null;
  prescriptions?: PrescriptionItemPayload[];
  labTestIds?: string[];
}

export interface RecordConsultationResponse {
  bookingId: string;
  prescriptionId: string;
  vitalsRecorded: boolean;
  prescriptionItemsCount: number;
  labOrdersCount: number;
  status: string;
}

export interface ClinicalHistoryItem {
  bookingId: string;
  date: string;
  time?: string;
  status: string;
  chiefComplaint?: string;
  opType?: string;
  doctor?: { id: string; name: string; designation?: string; avatar?: string };
  department?: { id: string; name: string };
  condition?: string;
  vitals?: {
    id: string;
    systolicBp?: number;
    diastolicBp?: number;
    pulseRate?: number;
    bodyTemperature?: number;
    spo2?: number;
    respiratoryRate?: number;
    weightKg?: number;
    heightCm?: number;
    recordedAt?: string;
  } | null;
  prescription?: {
    id: string;
    diagnosis: string;
    clinicalNotes?: string;
    generalAdvice?: string;
    followUpDate?: string;
    createdAt?: string;
    items: {
      id: string;
      medicineName: string;
      dosageForm: string;
      strength?: string;
      frequency: string;
      durationDays: number;
      timing: DosageTiming;
      instructions?: string;
    }[];
  } | null;
  labOrders: {
    id: string;
    testId: string;
    testName?: string;
    category?: string;
    sampleType?: string;
    notes?: string;
    createdAt?: string;
  }[];
}

export interface LabTestItem {
  id: string;
  name: string;
  category: string;
  price: number;
  sampleType?: string;
  description?: string;
  preparation?: string;
  turnaroundTime?: string;
}

const API_URL = 'http://127.0.0.1:5000';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('mediquee_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const doctorApi = {
  /**
   * GET /api/v1/doctor/schedule
   * Loads the doctor's weekly working schedule.
   */
  async getAvailability(): Promise<DayAvailability[]> {
    const res = await fetch(`${API_URL}/api/v1/doctor/schedule`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to fetch doctor schedule');
    }

    const json = await res.json();
    return json.data;
  },

  /**
   * POST /api/v1/doctor/schedule
   * Saves the doctor's weekly OP + video consultation working hours.
   */
  async updateAvailability(schedule: DayAvailability[]): Promise<void> {
    const res = await fetch(`${API_URL}/api/v1/doctor/schedule`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ schedule }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to save doctor schedule');
    }
  },

  /**
   * GET /api/v1/doctors/:id/available-slots
   * Fetches calculated open time slots for a doctor on a specific date.
   */
  async getAvailableSlots(doctorId: string, date: string, type = 'OP'): Promise<AvailableSlotsResponse> {
    const params = new URLSearchParams({ date, type });
    const res = await fetch(`${API_URL}/api/v1/doctors/${doctorId}/available-slots?${params.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to fetch available slots');
    }

    const json = await res.json();
    return json.data;
  },

  /**
   * GET /api/v1/appointments/my
   * Fetches the doctor's consultations and appointments.
   */
  async getMyAppointments(): Promise<any[]> {
    const res = await fetch(`${API_URL}/api/v1/appointments/my`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      return [];
    }

    const json = await res.json();
    return json.data || [];
  },

  /**
   * GET /api/v1/appointments/:id
   * Fetches full details for an appointment or patient booking.
   */
  async getAppointmentById(id: string): Promise<any> {
    const res = await fetch(`${API_URL}/api/v1/appointments/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to fetch appointment details');
    }

    const json = await res.json();
    return json.data;
  },

  /**
   * POST /api/v1/clinical/consultations/:bookingId/record
   * Atomically records diagnosis, vitals, e-prescriptions, and lab orders.
   */
  async recordConsultation(bookingId: string, payload: ConsultationPayload): Promise<RecordConsultationResponse> {
    const res = await fetch(`${API_URL}/api/v1/clinical/consultations/${bookingId}/record`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to record consultation');
    }

    const json = await res.json();
    return json.data;
  },

  /**
   * GET /api/v1/clinical/patient-history?phone=... or ?patientId=...
   * Fetches authentic longitudinal patient clinical history with past vitals and prescriptions.
   */
  async getPatientClinicalHistory(patientIdOrPhone: string): Promise<ClinicalHistoryItem[]> {
    const isPhone = /^(\+?91)?[6-9]\d{9}$/.test(patientIdOrPhone.replace(/[\s-]/g, '')) || /^\d{10}$/.test(patientIdOrPhone);
    const param = isPhone ? `phone=${encodeURIComponent(patientIdOrPhone)}` : `patientId=${encodeURIComponent(patientIdOrPhone)}`;

    const res = await fetch(`${API_URL}/api/v1/clinical/patient-history?${param}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to fetch patient history');
    }

    const json = await res.json();
    return json.data || [];
  },

  /**
   * GET /api/v1/clinical/presence
   * Retrieves the doctor's active operational presence status.
   */
  async getDoctorPresence(): Promise<DoctorPresenceStatus> {
    const res = await fetch(`${API_URL}/api/v1/clinical/presence`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      return 'OFF_DUTY';
    }

    const json = await res.json();
    return json.data?.presenceStatus || 'OFF_DUTY';
  },

  /**
   * PATCH /api/v1/clinical/presence
   * Updates the doctor's active operational presence status.
   */
  async updateDoctorPresence(presenceStatus: DoctorPresenceStatus): Promise<DoctorPresenceStatus> {
    const res = await fetch(`${API_URL}/api/v1/clinical/presence`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ presenceStatus }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to update presence status');
    }

    const json = await res.json();
    return json.data?.presenceStatus || presenceStatus;
  },

  /**
   * GET /api/v1/lab-tests
   * Fetches hospital diagnostic test offerings to populate lab investigation orders.
   */
  async getAvailableLabTests(): Promise<LabTestItem[]> {
    const res = await fetch(`${API_URL}/api/v1/lab-tests`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      return [];
    }

    const json = await res.json();
    return json.data || [];
  },
};
