// ----------------------------------------------------------------------------
// AUTHENTICATION API SERVICE LAYER
// Note: These functions define the expected contracts with the backend.
// ----------------------------------------------------------------------------

import type { Role } from "@/context/AuthContext";

export type Session = {
  token: string;
  role: Role;
};

const API_BASE_URL = 'http://127.0.0.1:5000/api/v1';

export function normalizeRole(backendRole: string): Role {
  const role = (backendRole || '').toUpperCase();
  if (role === 'HOSPITAL_ADMIN' || role === 'SUPER_ADMIN') return 'admin';
  if (role === 'LAB_ADMIN') return 'lab';
  if (role === 'DOCTOR') return 'doctor';
  if (role === 'NURSE') return 'nurse';
  if (role === 'RECEPTIONIST') return 'receptionist';
  return role.toLowerCase() as Role;
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
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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
