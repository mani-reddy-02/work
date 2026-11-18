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

export async function initiateHospitalCall(
  bookingId: string,
  bookingType: string = 'OP'
): Promise<InitiateCallResponse> {
  const token = localStorage.getItem('mediquee_token');
  if (!token) {
    throw new Error('Please log in to initiate a call');
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
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || data?.message || 'Failed to initiate call');
  }

  return data;
}

export async function getCallStatus(callSid: string): Promise<CallStatusResponse> {
  const token = localStorage.getItem('mediquee_token');
  const response = await fetch(`${API_BASE_URL}/exotel/status/${callSid}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
}
