import { useState, useEffect } from 'react';

const getIsLoggedIn = () => {
  return localStorage.getItem('mediquee_is_logged_in') === 'true';
};

const listeners = new Set<() => void>();

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

export const setGlobalLoggedIn = (value: boolean) => {
  localStorage.setItem('mediquee_is_logged_in', value ? 'true' : 'false');
  notifyListeners();
};

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(getIsLoggedIn());

  useEffect(() => {
    const listener = () => setIsLoggedIn(getIsLoggedIn());
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const login = () => {
    setGlobalLoggedIn(true);
  };

  const logout = () => {
    setGlobalLoggedIn(false);
  };

  return { isLoggedIn, login, logout };
};
