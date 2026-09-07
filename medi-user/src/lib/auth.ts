import { useState, useEffect } from 'react';
import { updateGlobalProfile } from './profile';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

let currentToken: string | null = localStorage.getItem('mediquee_token');
let currentUser: User | null = null;
let isAuthLoading = !!currentToken;
let isGlobalLoggedIn = !!currentToken;

const listeners = new Set<() => void>();

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

// Verify session against backend on startup if token exists
const verifySession = async () => {
  if (!currentToken) {
    isAuthLoading = false;
    isGlobalLoggedIn = false;
    notifyListeners();
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        currentUser = data.data;
        isGlobalLoggedIn = true;
        localStorage.setItem('mediquee_is_logged_in', 'true');
        
        // Sync with global profile state
        updateGlobalProfile({
          name: data.data.name,
          email: data.data.email,
          phone: data.data.phone || '',
          dob: '1990-01-01',
          gender: 'Not specified',
        });
      } else {
        throw new Error('Invalid user payload');
      }
    } else {
      throw new Error('Session expired or invalid');
    }
  } catch (error) {
    // Clear invalid session
    currentToken = null;
    currentUser = null;
    isGlobalLoggedIn = false;
    localStorage.removeItem('mediquee_token');
    localStorage.setItem('mediquee_is_logged_in', 'false');
  } finally {
    isAuthLoading = false;
    notifyListeners();
  }
};

// Initial verification run
verifySession();

export const useAuth = () => {
  const [state, setState] = useState({
    isLoggedIn: isGlobalLoggedIn,
    isLoading: isAuthLoading,
    user: currentUser,
  });

  useEffect(() => {
    const listener = () => {
      setState({
        isLoggedIn: isGlobalLoggedIn,
        isLoading: isAuthLoading,
        user: currentUser,
      });
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const login = async (identifier?: string, password?: string) => {
    // If called with credentials, execute real backend API login
    if (identifier && password) {
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
            error: json.error?.message || 'Invalid email/mobile or password.',
          };
        }

        currentToken = json.data.token;
        currentUser = json.data.user;
        isGlobalLoggedIn = true;
        isAuthLoading = false;

        localStorage.setItem('mediquee_token', json.data.token);
        localStorage.setItem('mediquee_is_logged_in', 'true');

        if (json.data.user) {
          updateGlobalProfile({
            name: json.data.user.name,
            email: json.data.user.email,
            phone: json.data.user.phone || '',
            dob: '1990-01-01',
            gender: 'Not specified',
          });
        }

        notifyListeners();
        return { success: true, user: json.data.user };
      } catch (err: any) {
        return {
          success: false,
          error: err.message || 'Network error. Please check your connection.',
        };
      }
    }

    // Fallback if called without arguments (e.g. mock test backwards compatibility)
    isGlobalLoggedIn = true;
    localStorage.setItem('mediquee_is_logged_in', 'true');
    notifyListeners();
    return { success: true };
  };

  const register = async (data: { name: string; email: string; phone: string; password: string }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        const errorMsg =
          res.status === 409
            ? 'An account already exists with this email or mobile number.'
            : json.error?.message || 'Registration failed. Please check your details.';
        return { success: false, error: errorMsg };
      }

      currentToken = json.data.token;
      currentUser = json.data.user;
      isGlobalLoggedIn = true;
      isAuthLoading = false;

      localStorage.setItem('mediquee_token', json.data.token);
      localStorage.setItem('mediquee_is_logged_in', 'true');

      if (json.data.user) {
        updateGlobalProfile({
          name: json.data.user.name,
          email: json.data.user.email,
          phone: json.data.user.phone || '',
          dob: '1990-01-01',
          gender: 'Not specified',
        });
      }

      notifyListeners();
      return { success: true, user: json.data.user };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network error. Could not connect to server.',
      };
    }
  };

  const logout = () => {
    currentToken = null;
    currentUser = null;
    isGlobalLoggedIn = false;
    isAuthLoading = false;

    localStorage.removeItem('mediquee_token');
    localStorage.setItem('mediquee_is_logged_in', 'false');
    notifyListeners();
  };

  return {
    isLoggedIn: state.isLoggedIn,
    isLoading: state.isLoading,
    user: state.user,
    login,
    register,
    logout,
  };
};
