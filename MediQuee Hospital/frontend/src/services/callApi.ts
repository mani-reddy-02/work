import { API_BASE_URL } from './apiConfig';

export interface InitiateCallResponse {
  success: boolean;
  callSid?: string;
  virtualNumber?: string;
  maskedFrom?: string;
  maskedTo?: string;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface CallStatusResponse {
  success: boolean;
  data?: {
    callSid: string;
    status: string;
    duration?: number;
    virtualNumber: string;
    direction: string;
  };
}

/**
 * Initiates an Exotel privacy-masked call to the patient from hospital staff.
 * Only sends bookingId and bookingType to the backend.
 * Destination phone numbers are strictly resolved server-side from verified DB records.
 */
export async function initiatePatientCall(
  bookingId: string,
  bookingType: string = 'OP'
): Promise<InitiateCallResponse> {
  const token = localStorage.getItem('mediquee_token');
  if (!token) {
    throw new Error('Authentication required. Please log in to initiate calls.');
  }

  const response = await fetch(`${API_BASE_URL}/exotel/calls/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      bookingId,
      bookingType,
      direction: 'HOSPITAL_TO_PATIENT',
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || data?.message || 'Failed to initiate call');
  }

  return data;
}

/**
 * Polls call session status by CallSid
 */
export async function getCallStatus(callSid: string): Promise<CallStatusResponse> {
  const token = localStorage.getItem('mediquee_token');
  const response = await fetch(`${API_BASE_URL}/exotel/status/${callSid}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Failed to fetch call status');
  }

  return data;
}

/**
 * Masks phone numbers to protect patient privacy on screen (e.g., •••• ••4550).
 */
export function maskPhoneNumber(phone?: string): string {
  if (!phone) return '•••• ••••';
  const clean = phone.replace(/[\s-]/g, '').trim();
  const digits = clean.replace(/\D/g, '');
  if (digits.length >= 4) {
    const last4 = digits.slice(-4);
    return `•••• ••${last4}`;
  }
  return '•••• ••••';
}
