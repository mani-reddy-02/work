import { useState, useEffect, useCallback } from 'react';
import {
  DEFAULT_RADIUS_KM,
  KNOWN_LOCALITIES,
  reverseGeocodeCoords,
  type LocalityItem,
} from './locationService';

export interface UserLocationState {
  label: string;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  locality: string | null;
  status: 'idle' | 'detecting' | 'detected' | 'denied' | 'unavailable' | 'manual';
  error: string | null;
  radiusKm: number;
}

const STORAGE_KEY = 'mediquee_location_state_v2';
const LEGACY_STORAGE_KEY = 'mediquee_location';

function getInitialLocationState(): UserLocationState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.label === 'string') {
        return {
          label: parsed.label || 'Hyderabad',
          latitude: parsed.latitude ?? 17.4018,
          longitude: parsed.longitude ?? 78.5602,
          city: parsed.city ?? 'Hyderabad',
          locality: parsed.locality ?? null,
          status: 'idle', // Start as idle to automatically request live location first
          error: null,
          radiusKm: parsed.radiusKm || DEFAULT_RADIUS_KM,
        };
      }
    }

    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy && legacy !== 'Select Location') {
      const match = KNOWN_LOCALITIES.find(
        (l) => l.name.toLowerCase() === legacy.toLowerCase() || l.city.toLowerCase() === legacy.toLowerCase()
      );
      if (match) {
        return {
          label: legacy,
          latitude: match.lat,
          longitude: match.lng,
          city: match.city,
          locality: match.locality || match.city,
          status: 'idle',
          error: null,
          radiusKm: DEFAULT_RADIUS_KM,
        };
      }
    }
  } catch (e) {
    // Ignore storage parse error
  }

  return {
    label: 'Hyderabad',
    latitude: 17.4018,
    longitude: 78.5602,
    city: 'Hyderabad',
    locality: 'Uppal',
    status: 'idle',
    error: null,
    radiusKm: DEFAULT_RADIUS_KM,
  };
}

let globalLocationState: UserLocationState = getInitialLocationState();
let isMobileMenuOpen = false;
let isDesktopSidebarOpen = false;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Error notifying UIStore listener:', e);
    }
  });
}

function persistLocationState(state: UserLocationState) {
  globalLocationState = state;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    localStorage.setItem(LEGACY_STORAGE_KEY, state.label);
  } catch (e) {
    // Ignore storage quota error
  }
  notifyListeners();
}

/**
 * Set manual location selection by name or locality object
 */
export const setGlobalManualLocation = (
  loc: string | { name: string; lat?: number | null; lng?: number | null; city?: string | null },
  latitude?: number | null,
  longitude?: number | null,
  city?: string | null
) => {
  if (typeof loc === 'string') {
    const trimmed = loc.trim();
    if (!trimmed || trimmed === 'Select Location') {
      persistLocationState({
        label: 'Select Location',
        latitude: null,
        longitude: null,
        city: null,
        locality: null,
        status: 'idle',
        error: null,
        radiusKm: globalLocationState.radiusKm || DEFAULT_RADIUS_KM,
      });
      return;
    }

    const match = KNOWN_LOCALITIES.find(
      (l) =>
        l.name.toLowerCase().includes(trimmed.toLowerCase()) ||
        trimmed.toLowerCase().includes(l.city.toLowerCase())
    );

    persistLocationState({
      label: trimmed,
      latitude: latitude !== undefined ? latitude : (match ? match.lat : null),
      longitude: longitude !== undefined ? longitude : (match ? match.lng : null),
      city: city !== undefined ? city : (match ? match.city : null),
      locality: match?.locality || null,
      status: 'manual',
      error: null,
      radiusKm: globalLocationState.radiusKm || DEFAULT_RADIUS_KM,
    });
    return;
  }

  persistLocationState({
    label: loc.name,
    latitude: loc.lat ?? null,
    longitude: loc.lng ?? null,
    city: loc.city ?? null,
    locality: null,
    status: 'manual',
    error: null,
    radiusKm: globalLocationState.radiusKm || DEFAULT_RADIUS_KM,
  });
};

/**
 * Update search radius (e.g. 25 km -> 50 km)
 */
export const setGlobalNearbyRadius = (radiusKm: number) => {
  const safeRadius = Math.max(1, Math.min(200, radiusKm));
  persistLocationState({
    ...globalLocationState,
    radiusKm: safeRadius,
  });
};

/**
 * Trigger GPS location detection with device permission check
 */
export const triggerGlobalLocationDetection = async (force: boolean = false): Promise<void> => {
  // If already detecting, skip
  if (globalLocationState.status === 'detecting') {
    return;
  }

  // If already denied and not forced by user click, do not repeatedly nag
  if (!force && globalLocationState.status === 'denied') {
    return;
  }

  // If already detected and not forced, keep existing detected state
  if (!force && globalLocationState.status === 'detected' && globalLocationState.latitude != null) {
    return;
  }

  if (!('geolocation' in navigator)) {
    persistLocationState({
      ...globalLocationState,
      status: 'unavailable',
      error: 'Geolocation is not supported by your browser. Please select location manually.',
    });
    return;
  }

  persistLocationState({
    ...globalLocationState,
    status: 'detecting',
    error: null,
  });

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const resolved = await reverseGeocodeCoords(latitude, longitude);

          persistLocationState({
            label: resolved.label,
            latitude,
            longitude,
            city: resolved.city,
            locality: resolved.locality,
            status: 'detected',
            error: null,
            radiusKm: globalLocationState.radiusKm || DEFAULT_RADIUS_KM,
          });
        } catch (err: any) {
          persistLocationState({
            label: 'Location Detected',
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            city: 'Hyderabad',
            locality: null,
            status: 'detected',
            error: null,
            radiusKm: globalLocationState.radiusKm || DEFAULT_RADIUS_KM,
          });
        }
        resolve();
      },
      (error) => {
        let status: UserLocationState['status'] = 'unavailable';
        let errorMessage = 'Unable to determine your location. Please select manually.';

        if (error.code === error.PERMISSION_DENIED) {
          status = 'denied';
          errorMessage = 'Location permission denied. Please select your location manually.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          status = 'unavailable';
          errorMessage = 'Location signal unavailable. Please select your location manually.';
        } else if (error.code === error.TIMEOUT) {
          status = 'unavailable';
          errorMessage = 'Location detection timed out. Please retry or select manually.';
        }

        persistLocationState({
          ...globalLocationState,
          status,
          error: errorMessage,
        });
        resolve();
      },
      {
        timeout: 15000,
        maximumAge: 0,
        enableHighAccuracy: true,
      }
    );
  });
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
  const [userLocation, setUserLocation] = useState<UserLocationState>(globalLocationState);
  const [isMenuOpen, setIsMenuOpen] = useState(isMobileMenuOpen);
  const [isDesktopOpen, setIsDesktopOpen] = useState(isDesktopSidebarOpen);

  useEffect(() => {
    const listener = () => {
      setUserLocation(globalLocationState);
      setIsMenuOpen(isMobileMenuOpen);
      setIsDesktopOpen(isDesktopSidebarOpen);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const detectLocation = useCallback((force: boolean = false) => {
    return triggerGlobalLocationDetection(force);
  }, []);

  return {
    // Current location string for seamless backward compatibility
    location: userLocation.label,
    setLocation: setGlobalManualLocation,

    // Rich location state and controls
    userLocation,
    nearbyRadiusKm: userLocation.radiusKm,
    detectLocation,
    setManualLocation: setGlobalManualLocation,
    setNearbyRadiusKm: setGlobalNearbyRadius,
    retryLocationDetection: () => triggerGlobalLocationDetection(true),
    clearLocation: () =>
      persistLocationState({
        label: 'Select Location',
        latitude: null,
        longitude: null,
        city: null,
        locality: null,
        status: 'idle',
        error: null,
        radiusKm: DEFAULT_RADIUS_KM,
      }),

    // UI Menu Controls
    isMobileMenuOpen: isMenuOpen,
    setMobileMenuOpen: setGlobalMobileMenu,
    isDesktopSidebarOpen: isDesktopOpen,
    setDesktopSidebarOpen: setGlobalDesktopSidebar,
    toggleDesktopSidebar: () => setGlobalDesktopSidebar(!isDesktopSidebarOpen),
  };
};

// Automatically take live location first on initial module load in browser
if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
  const isTest = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE === 'test';
  if (!isTest) {
    setTimeout(() => {
      triggerGlobalLocationDetection(false).catch(() => {});
    }, 100);
  }
}
