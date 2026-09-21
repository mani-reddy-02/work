// ----------------------------------------------------------------------------
// USER ACCOUNT & PERSONAL PROFILE API SERVICE LAYER
// ----------------------------------------------------------------------------

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  designation?: string | null;
  avatar?: string | null;
  dob?: string | null;
  gender?: string | null;
  hospitalId?: string | null;
  createdAt?: string;
  hospital?: {
    id: string;
    name: string;
    businessType?: string;
    facilityType?: string;
    registrationNumber?: string;
    contactPhone?: string;
    contactEmail?: string;
    addressLine1?: string;
    city?: string;
    state?: string;
    pincode?: string;
  } | null;
}

export interface UpdateUserDto {
  name?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  avatar?: string;
}

export interface UserResponse {
  success: boolean;
  data: UserProfile;
  message?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api/v1';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('mediquee_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const userApi = {
  /**
   * GET /api/v1/users/me
   * Fetches the current authenticated user profile from PostgreSQL.
   */
  async getMe(): Promise<UserProfile> {
    const res = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to fetch user profile');
    }

    const json = await res.json();
    return json.data;
  },

  /**
   * PUT /api/v1/users/me
   * Updates the current authenticated user's name and contact number.
   */
  async updateMe(data: UpdateUserDto): Promise<UserProfile> {
    const res = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to update user profile');
    }

    const json = await res.json();
    return json.data;
  },
};
