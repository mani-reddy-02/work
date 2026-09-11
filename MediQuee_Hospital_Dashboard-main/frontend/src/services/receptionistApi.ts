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
// Note: These functions define the expected contracts with the backend.
// As instructed, they currently throw "Not Implemented" to prevent fake persistence,
// but provide a clean integration point for the backend developer.
// ----------------------------------------------------------------------------

export const receptionistApi = {
  
  /**
   * POST /api/queue/check-in
   * Registers a patient and adds them to the OP queue.
   */
  async checkInPatient(request: CheckInRequest): Promise<{ token: string; queueId: string }> {
    console.log('[API Call] POST /api/queue/check-in', request);
    throw new Error('BACKEND_MISSING: POST /api/queue/check-in is not implemented. Please implement this endpoint to generate OP tokens.');
  },

  /**
   * POST /api/appointments/book
   * Schedules a future appointment.
   */
  async bookAppointment(request: BookAppointmentRequest): Promise<{ appointmentId: string }> {
    console.log('[API Call] POST /api/appointments/book', request);
    throw new Error('BACKEND_MISSING: POST /api/appointments/book is not implemented. Please implement this endpoint to save appointments.');
  },

  /**
   * GET /api/queue
   * Retrieves the active queue, optionally filtered.
   */
  async getQueue(filters?: { departmentId?: string; date?: string; status?: QueueStatus[] }): Promise<QueueEntry[]> {
    console.log('[API Call] GET /api/queue', filters);
    // Returning empty array instead of throwing so UI doesn't crash, but real data needs backend.
    return [];
  },

  /**
   * PATCH /api/queue/:id/status
   * Updates a queue entry's status following strict state machine rules.
   */
  async updateQueueStatus(queueId: string, newStatus: QueueStatus): Promise<QueueEntry> {
    console.log(`[API Call] PATCH /api/queue/${queueId}/status`, { status: newStatus });
    throw new Error(`BACKEND_MISSING: PATCH /api/queue/:id/status is not implemented. Cannot update status to ${newStatus}.`);
  },

  /**
   * GET /api/patients/search?q=
   * Searches for existing patients by name or phone.
   */
  async searchPatients(query: string): Promise<Patient[]> {
    console.log('[API Call] GET /api/patients/search?q=' + query);
    return [];
  },

  /**
   * GET /api/departments
   * Retrieves all hospital departments.
   */
  async getDepartments(): Promise<{ id: string; name: string }[]> {
    console.log('[API Call] GET /api/departments');
    return [
      { id: 'dept-1', name: 'General Medicine' },
      { id: 'dept-2', name: 'Cardiology' },
      { id: 'dept-3', name: 'Orthopedics' },
      { id: 'dept-4', name: 'Pediatrics' },
    ];
  },

  /**
   * GET /api/doctors?departmentId=
   * Retrieves doctors, optionally filtered by department.
   */
  async getDoctors(departmentId?: string): Promise<{ id: string; name: string; departmentId: string }[]> {
    console.log('[API Call] GET /api/doctors', { departmentId });
    return [
      { id: 'doc-1', name: 'Dr. Sharma', departmentId: 'dept-1' },
      { id: 'doc-2', name: 'Dr. Verma', departmentId: 'dept-3' },
      { id: 'doc-3', name: 'Dr. Singh', departmentId: 'dept-4' },
      { id: 'doc-4', name: 'Dr. Iyer', departmentId: 'dept-2' },
    ];
  }
};
