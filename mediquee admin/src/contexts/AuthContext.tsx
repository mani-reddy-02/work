import React, { createContext, useContext, useEffect, useState } from 'react';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  avatar?: string;
}

interface AuthContextType {
  adminUser: AdminUser | null;
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

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

  return (
    <AuthContext.Provider
      value={{
        adminUser,
        token,
        isLoggedIn: !!adminUser && !!token,
        isLoading,
        login,
        logout,
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
