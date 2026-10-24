const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export interface AdminProfileData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  designation?: string | null;
  avatar?: string | null;
  dob?: string | null;
  gender?: string | null;
  address?: string | null;
  bio?: string | null;
  createdAt?: string;
  active?: boolean;
}

export interface PlatformSettingsData {
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  emergencyHelpline: string;
  operatingHours: string;
  requireHospitalVerification: boolean;
  requireDoctorVerification: boolean;
  requireLabVerification: boolean;
  defaultNearbyRadiusKm: number;
  strictRadiusFiltering: boolean;
  emailAlertOnHospitalRegistration: boolean;
  emailAlertOnDoctorRegistration: boolean;
  emailAlertOnHighPriorityRequest: boolean;
  dailyFinancialSummary: boolean;
}

const DEFAULT_SETTINGS: PlatformSettingsData = {
  platformName: 'MediQuee Healthcare Platform',
  supportEmail: 'support@mediquee.com',
  supportPhone: '+91 800-MEDIQUEE',
  emergencyHelpline: '+91 99999 99999',
  operatingHours: '24/7 Multi-Specialty Support',
  requireHospitalVerification: true,
  requireDoctorVerification: true,
  requireLabVerification: true,
  defaultNearbyRadiusKm: 25,
  strictRadiusFiltering: true,
  emailAlertOnHospitalRegistration: true,
  emailAlertOnDoctorRegistration: true,
  emailAlertOnHighPriorityRequest: true,
  dailyFinancialSummary: false,
};

export const profileService = {
  async getProfile(token: string): Promise<{ success: boolean; data?: AdminProfileData; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || 'Failed to fetch profile' };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error fetching profile' };
    }
  },

  async updateProfile(token: string, payload: Partial<AdminProfileData>): Promise<{ success: boolean; data?: AdminProfileData; error?: string; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || json.message || 'Failed to update profile' };
      }
      return { success: true, data: json.data, message: json.message || 'Profile updated successfully' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error updating profile' };
    }
  },

  async changePassword(token: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/users/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error?.message || json.message || 'Failed to change password' };
      }
      return { success: true, message: json.message || 'Password changed successfully' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error changing password' };
    }
  },

  getSettings(): PlatformSettingsData {
    try {
      const saved = localStorage.getItem('mediquee_platform_settings');
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      // fallback
    }
    return DEFAULT_SETTINGS;
  },

  saveSettings(settings: Partial<PlatformSettingsData>): PlatformSettingsData {
    const current = profileService.getSettings();
    const updated = { ...current, ...settings };
    try {
      localStorage.setItem('mediquee_platform_settings', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save settings to localStorage:', e);
    }
    return updated;
  }
};
