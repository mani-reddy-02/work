export interface UserProfileData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  dob?: string;
  gender?: string;
  avatar?: string;
  role?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const profileApi = {
  async getProfile(): Promise<{ success: boolean; data?: UserProfileData; error?: string }> {
    const token = localStorage.getItem('mediquee_token');
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return {
          success: false,
          error: json.error?.message || 'Failed to fetch user profile',
        };
      }

      return { success: true, data: json.data };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network error. Could not connect to server.',
      };
    }
  },

  async updateProfile(
    data: Partial<UserProfileData>
  ): Promise<{ success: boolean; data?: UserProfileData; error?: string }> {
    const token = localStorage.getItem('mediquee_token');
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        const message =
          res.status === 409
            ? json.error?.message || 'This email or mobile number is already in use.'
            : json.error?.message || 'Failed to update profile. Please verify your inputs.';
        return { success: false, error: message };
      }

      return { success: true, data: json.data };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network error. Could not save profile changes.',
      };
    }
  },
};
