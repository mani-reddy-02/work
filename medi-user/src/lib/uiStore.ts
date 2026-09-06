import { useState, useEffect } from 'react';

const getStoredLocation = () => localStorage.getItem('mediquee_location') || 'Hyderabad, Telangana';

let listeners = new Set<() => void>();
let isMobileMenuOpen = false;
let isDesktopSidebarOpen = true;

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

export const setGlobalLocation = (location: string) => {
  localStorage.setItem('mediquee_location', location);
  notifyListeners();
};

export const setGlobalMobileMenu = (isOpen: boolean) => {
  isMobileMenuOpen = isOpen;
  notifyListeners();
};

export const setGlobalDesktopSidebar = (isOpen: boolean) => {
  isDesktopSidebarOpen = isOpen;
  notifyListeners();
};

export const useUIStore = () => {
  const [location, setLocation] = useState(getStoredLocation());
  const [isMenuOpen, setIsMenuOpen] = useState(isMobileMenuOpen);
  const [isDesktopOpen, setIsDesktopOpen] = useState(isDesktopSidebarOpen);

  useEffect(() => {
    const listener = () => {
      setLocation(getStoredLocation());
      setIsMenuOpen(isMobileMenuOpen);
      setIsDesktopOpen(isDesktopSidebarOpen);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return { 
    location, 
    setLocation: setGlobalLocation,
    isMobileMenuOpen: isMenuOpen,
    setMobileMenuOpen: setGlobalMobileMenu,
    isDesktopSidebarOpen: isDesktopOpen,
    setDesktopSidebarOpen: setGlobalDesktopSidebar,
    toggleDesktopSidebar: () => setGlobalDesktopSidebar(!isDesktopSidebarOpen)
  };
};
