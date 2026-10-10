export interface LiveKitTokenRequest {
  bookingId: string;
}

export interface VideoConsultationResponse {
  token: string;
  serverUrl: string;
  roomName: string;
  consultation: {
    id: string;
    bookingId: string;
    roomName: string;
    status: string;
    durationSeconds: number;
    startedAt: Date | null;
    endedAt: Date | null;
  };
  participant: {
    identity: string;
    name: string;
    role: string;
  };
  booking: {
    id: string;
    patientName: string;
    doctorName: string;
    doctorDesignation?: string | null;
    hospitalName: string;
    appointmentDate: Date;
    timeSlot?: string | null;
    status: string;
  };
}

export interface VideoConsultationStatusResponse {
  id: string;
  bookingId: string;
  roomName: string;
  status: string;
  scheduledDate: Date | null;
  startedAt: Date | null;
  endedAt: Date | null;
  durationSeconds: number;
  formattedDuration: string;
  patientJoinedAt: Date | null;
  doctorJoinedAt: Date | null;
  booking: {
    id: string;
    patientName: string;
    patientPhone?: string | null;
    doctorName: string;
    hospitalName: string;
    status: string;
    appointmentDate: Date;
    timeSlot?: string | null;
  };
}
