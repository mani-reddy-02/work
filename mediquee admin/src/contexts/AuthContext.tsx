import React, { createContext, useContext, useEffect, useState } from 'react';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  avatar?: string | null;
  designation?: string | null;
  dob?: string | null;
  gender?: string | null;
  address?: string | null;
  bio?: string | null;
  createdAt?: string;
  active?: boolean;
}

interface AuthContextType {
  adminUser: AdminUser | null;
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setAdminUser: React.Dispatch<React.SetStateAction<AdminUser | null>>;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<AdminUser>) => Promise<{ success: boolean; error?: string; message?: string; data?: AdminUser }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string; message?: string }>;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('mediquee_admin_token'));
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = () => {
    setToken(null);
    setAdminUser(null);
    localStorage.removeItem('mediquee_admin_token');
  };

  const refreshProfile = async () => {
    const storedToken = token || localStorage.getItem('mediquee_admin_token');
    if (!storedToken) return;

    try {
      const res = await fetch(`${API_BASE_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setAdminUser(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to refresh admin profile:', err);
    }
  };

  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('mediquee_admin_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && json.data.role === 'SUPER_ADMIN') {
            setAdminUser(json.data);
            setToken(storedToken);
          } else {
            // Non-admin or invalid
            logout();
          }
        } else {
          logout();
        }
      } catch (err) {
        // Keep offline or clear
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = async (identifier: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return {
          success: false,
          error: json.error?.message || 'Invalid email or password',
        };
      }

      const user = json.data?.user;
      if (!user || user.role !== 'SUPER_ADMIN') {
        return {
          success: false,
          error: 'Access denied: You must be a Super Administrator to access the Admin Panel.',
        };
      }

      const receivedToken = json.data.token;
      localStorage.setItem('mediquee_admin_token', receivedToken);
      setToken(receivedToken);
      setAdminUser(user);

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network error. Could not reach authentication server.',
      };
    }
  };

  const updateProfile = async (data: Partial<AdminUser>) => {
    const activeToken = token || localStorage.getItem('mediquee_admin_token');
    if (!activeToken) {
      return { success: false, error: 'Authentication token missing. Please log in again.' };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return {
          success: false,
          error: json.error?.message || json.message || 'Failed to update profile',
        };
      }

      if (json.data) {
        setAdminUser(json.data);
      }

      return {
        success: true,
        data: json.data,
        message: json.message || 'Profile updated successfully',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network error while updating profile',
      };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const activeToken = token || localStorage.getItem('mediquee_admin_token');
    if (!activeToken) {
      return { success: false, error: 'Authentication token missing. Please log in again.' };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/users/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return {
          success: false,
          error: json.error?.message || json.message || 'Failed to change password',
        };
      }

      return {
        success: true,
        message: json.message || 'Password changed successfully',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network error while changing password',
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        adminUser,
        token,
        isLoggedIn: !!adminUser && !!token,
        isLoading,
        login,
        logout,
        setAdminUser,
        refreshProfile,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AuthProvider');
  }
  return context;
};

