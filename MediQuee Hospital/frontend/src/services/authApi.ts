// ----------------------------------------------------------------------------
// AUTHENTICATION API SERVICE LAYER
// Note: These functions define the expected contracts with the backend.
// ----------------------------------------------------------------------------

import type { Role } from "@/context/AuthContext";

export type Session = {
  token: string;
  role: Role;
};

import { API_BASE_URL } from './apiConfig';

export function normalizeRole(backendRole: string): Role {
  const role = (backendRole || '').toUpperCase();
  if (role === 'HOSPITAL_ADMIN' || role === 'SUPER_ADMIN') return 'admin';
  if (role === 'LAB_ADMIN') return 'lab';
  if (role === 'DOCTOR') return 'doctor';
  if (role === 'NURSE') return 'nurse';
  if (role === 'RECEPTIONIST') return 'receptionist';
  return role.toLowerCase() as Role;
}

async function serializeVerificationPayload(payload: any): Promise<any> {
  if (!payload || typeof payload !== 'object') return payload;
  const clone = { ...payload };

  const convertFile = (file: any): Promise<{ fileName: string; fileData: string; mimeType: string } | any> => {
    if (typeof window !== 'undefined' && file instanceof File) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            fileName: file.name,
            fileData: reader.result as string,
            mimeType: file.type || 'application/octet-stream',
          });
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    }
    return Promise.resolve(file);
  };

  if (clone.hospitalVerification && typeof clone.hospitalVerification === 'object') {
    const serializedHosp: Record<string, any> = {};
    for (const [key, val] of Object.entries(clone.hospitalVerification)) {
      if (val) {
        serializedHosp[key] = await convertFile(val);
      }
    }
    clone.hospitalVerification = serializedHosp;
  }

  if (clone.labVerification && typeof clone.labVerification === 'object') {
    const serializedLab: Record<string, any> = {};
    for (const [key, val] of Object.entries(clone.labVerification)) {
      if (val) {
        serializedLab[key] = await convertFile(val);
      }
    }
    clone.labVerification = serializedLab;
  }

  return clone;
}

export const authApi = {
  /**
   * POST /api/v1/auth/login
   * Authenticates a user with credentials and returns the issued session.
   * The role MUST come from the backend — it is never chosen on the client.
   */
  async login(payload: { email: string; password: string; role?: string }): Promise<Session> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error?.message || errData?.message || 'Login failed');
      }
      if (response.status === 502 || response.status === 503 || response.status === 504) {
        throw new Error(`Backend server is currently unavailable (${response.status} Bad Gateway). Please ensure the backend service is running.`);
      }
      throw new Error(`Server error (${response.status}). Please try again later.`);
    }

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Login failed');
    }

    return {
      token: data.data.token,
      role: normalizeRole(data.data.role),
    };
  },

  /**
   * POST /api/v1/auth/register
   * Submits a facility registration.
   */
  async register(payload: unknown): Promise<Session & { id: string }> {
    const serializedPayload = await serializeVerificationPayload(payload);

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serializedPayload),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Registration failed');
    }

    return { 
      id: data.data.hospitalId,
      token: data.data.token,
      role: normalizeRole(data.data.role)
    };
  },
  
  /**
   * GET /api/v1/users/me
   * Fetches the current user profile using the JWT.
   */
  async getMe(token: string) {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to fetch user profile');
    }

    return data.data;
  }
};
