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

/**
 * Pre-registers a call intent for direct inbound masked dialing.
 * Ensures that when the user's phone dials 08047290980, the call is
 * immediately connected to the target hospital without exposing numbers.
 */
export async function registerCallIntent(
  bookingId: string,
  bookingType: string = 'OP'
): Promise<{ success: boolean; virtualNumber: string; dialNumber?: string }> {
  const token = localStorage.getItem('mediquee_token');
  if (!token) return { success: false, virtualNumber: '080-472-90980', dialNumber: '08047290980' };

  try {
    const response = await fetch(`${API_BASE_URL}/exotel/calls/intent`, {
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
    return data?.data || { success: true, virtualNumber: '080-472-90980', dialNumber: '08047290980' };
  } catch {
    return { success: false, virtualNumber: '080-472-90980', dialNumber: '08047290980' };
  }
}
