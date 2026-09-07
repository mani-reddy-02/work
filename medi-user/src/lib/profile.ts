import { useState, useEffect } from 'react';
import { profileApi, type UserProfileData } from './profileApi';

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  avatar?: string;
}

const emptyProfile: UserProfile = {
  name: '',
  email: '',
  phone: '',
  dob: '',
  gender: '',
  avatar: '',
};

const getSavedProfile = (): UserProfile => {
  const saved = localStorage.getItem('mediquee_profile');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return emptyProfile;
    }
  }
  return emptyProfile;
};

let currentProfile: UserProfile = getSavedProfile();
let isProfileLoading = false;

const listeners = new Set<() => void>();

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

export const updateGlobalProfile = (newProfile: Partial<UserProfile>) => {
  currentProfile = { ...currentProfile, ...newProfile };
  localStorage.setItem('mediquee_profile', JSON.stringify(currentProfile));
  notifyListeners();
};

export const useProfile = () => {
  const [profile, setProfileState] = useState<UserProfile>(currentProfile);
  const [isLoading, setIsLoading] = useState<boolean>(isProfileLoading);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const listener = () => {
      setProfileState(currentProfile);
      setIsLoading(isProfileLoading);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  // Fetch current profile from backend if token exists
  useEffect(() => {
    const token = localStorage.getItem('mediquee_token');
    if (!token) return;

    let isMounted = true;
    const fetchLatest = async () => {
      isProfileLoading = true;
      notifyListeners();

      const res = await profileApi.getProfile();
      if (!isMounted) return;

      isProfileLoading = false;
      if (res.success && res.data) {
        updateGlobalProfile({
          name: res.data.name || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          dob: res.data.dob || '',
          gender: res.data.gender || '',
          avatar: res.data.avatar || '',
        });
        setError(null);
      } else if (res.error) {
        setError(res.error);
      }
      notifyListeners();
    };

    fetchLatest();
    return () => {
      isMounted = false;
    };
  }, []);

  const updateProfile = async (newProfile: Partial<UserProfile>) => {
    setIsLoading(true);
    setError(null);
    const res = await profileApi.updateProfile(newProfile);
    setIsLoading(false);

    if (res.success && res.data) {
      updateGlobalProfile({
        name: res.data.name,
        email: res.data.email,
        phone: res.data.phone || '',
        dob: res.data.dob || '',
        gender: res.data.gender || '',
        avatar: res.data.avatar || '',
      });
      return { success: true, data: res.data };
    } else {
      const err = res.error || 'Failed to update profile';
      setError(err);
      return { success: false, error: err };
    }
  };

  return {
    profile,
    updateProfile,
    isLoading,
    error,
  };
};
