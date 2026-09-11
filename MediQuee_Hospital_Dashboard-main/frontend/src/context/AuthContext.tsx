import { createContext, useContext, useState, type ReactNode } from "react";

export type Role = 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'lab';

type AuthContextType = {
  isAuthenticated: boolean;
  role: Role;
  login: (role?: Role) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('auth') === 'true';
  });
  
  const [role, setRole] = useState<Role>(() => {
    return (localStorage.getItem('role') as Role) || 'admin';
  });

  const login = (selectedRole: Role = 'admin') => {
    setIsAuthenticated(true);
    setRole(selectedRole);
    localStorage.setItem('auth', 'true');
    localStorage.setItem('role', selectedRole);
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('auth');
    localStorage.removeItem('role');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, login, logout }}>
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

