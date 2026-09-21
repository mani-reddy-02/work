// ----------------------------------------------------------------------------
// SECURITY TRADEOFF NOTE:
// Currently, we are storing the JWT token in `localStorage`.
// Using `localStorage` is NOT secure against XSS (Cross-Site Scripting) attacks,
// because any JavaScript running on the page can access the token.
// For a production-grade application, an HTTP-only, Secure cookie should be
// used to store session tokens to mitigate XSS risks.
// However, given the current Vite + React SPA architecture without a BFF (Backend For Frontend),
// localStorage provides a necessary, scoped integration point. We will keep this implementation
// explicitly documented here rather than calling it secure.
// ----------------------------------------------------------------------------

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { authApi, normalizeRole } from "../services/authApi";

export type Role = 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'lab';

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  designation?: string;
  hospitalId: string;
  hospital?: {
    id: string;
    name: string;
    businessType: string;
    facilityType?: string;
    registrationNumber?: string;
    contactPhone?: string;
    contactEmail?: string;
    addressLine1?: string;
    area?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
};

type AuthContextType = {
  isAuthenticated: boolean;
  role: Role | null;
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (token: string, role: Role) => void;
  logout: () => void;
  updateUser: (updated: Partial<User>) => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [role, setRole] = useState<Role | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('mediquee_token'));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      const storedToken = localStorage.getItem('mediquee_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const fetchedUser = await authApi.getMe(storedToken);
        setToken(storedToken);
        // The backend determines the authoritative role
        const backendRole = normalizeRole(fetchedUser.role);
        setRole(backendRole);
        setUser(fetchedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Token validation failed:", error);
        logout(); // clear invalid state
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, []);

  const login = (newToken: string, newRole: Role) => {
    setIsAuthenticated(true);
    setRole(newRole);
    setToken(newToken);
    localStorage.setItem('mediquee_token', newToken);
    
    // Fetch user details proactively to avoid waiting for reload
    authApi.getMe(newToken).then(u => setUser(u)).catch(console.error);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setRole(null);
    setToken(null);
    setUser(null);
    localStorage.removeItem('mediquee_token');
  };

  const updateUser = (updated: Partial<User>) => {
    setUser((prev) => prev ? { ...prev, ...updated } : null);
  };

  const refreshUser = async () => {
    const storedToken = localStorage.getItem('mediquee_token');
    if (storedToken) {
      try {
        const fetched = await authApi.getMe(storedToken);
        setUser(fetched);
      } catch (err) {
        console.error("Failed to refresh user:", err);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, token, user, isLoading, login, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
