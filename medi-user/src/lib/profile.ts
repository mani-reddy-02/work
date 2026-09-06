import { useState, useEffect } from 'react';

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
}

const defaultProfile: UserProfile = {
  name: 'ABC',
  email: 'abc@gmail.com',
  phone: '+91 98765 43210',
  dob: '1990-01-01',
  gender: 'Male',
};

const getSavedProfile = (): UserProfile => {
  const saved = localStorage.getItem('mediquee_profile');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return defaultProfile;
    }
  }
  return defaultProfile;
};

const listeners = new Set<() => void>();

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

export const updateGlobalProfile = (newProfile: UserProfile) => {
  localStorage.setItem('mediquee_profile', JSON.stringify(newProfile));
  notifyListeners();
};

export const useProfile = () => {
  const [profile, setProfileState] = useState<UserProfile>(getSavedProfile());

  useEffect(() => {
    const listener = () => setProfileState(getSavedProfile());
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const updateProfile = (newProfile: UserProfile) => {
    updateGlobalProfile(newProfile);
  };

  return { profile, updateProfile };
};
