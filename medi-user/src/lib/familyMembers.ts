import { useState, useEffect, useCallback } from 'react';

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone?: string;
  bloodGroup?: string;
  createdAt?: string;
}

const EVENT_NAME = 'mediquee_family_updated';

const getStorageKey = (userId?: string): string => {
  if (userId) return `mediquee_family_members_${userId}`;
  try {
    const rawUser = localStorage.getItem('mediquee_user');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (parsed?.id) return `mediquee_family_members_${parsed.id}`;
    }
  } catch {
    // fallback
  }
  return 'mediquee_family_members_default';
};

export const getStoredFamilyMembers = (userId?: string): FamilyMember[] => {
  try {
    const key = getStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load family members from localStorage:', err);
    return [];
  }
};

export const saveStoredFamilyMember = (
  memberData: Omit<FamilyMember, 'id'>,
  id?: string,
  userId?: string
): FamilyMember => {
  const key = getStorageKey(userId);
  const current = getStoredFamilyMembers(userId);

  let updatedMember: FamilyMember;

  if (id) {
    // Update existing member
    updatedMember = {
      ...memberData,
      id,
      createdAt: current.find((m) => m.id === id)?.createdAt || new Date().toISOString(),
    };
    const nextList = current.map((m) => (m.id === id ? updatedMember : m));
    localStorage.setItem(key, JSON.stringify(nextList));
  } else {
    // Add new member
    updatedMember = {
      ...memberData,
      id: `fam_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    const nextList = [...current, updatedMember];
    localStorage.setItem(key, JSON.stringify(nextList));
  }

  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { key } }));
  return updatedMember;
};

export const deleteStoredFamilyMember = (id: string, userId?: string): boolean => {
  const key = getStorageKey(userId);
  const current = getStoredFamilyMembers(userId);
  const nextList = current.filter((m) => m.id !== id);
  localStorage.setItem(key, JSON.stringify(nextList));
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { key } }));
  return true;
};

export const useFamilyMembers = (userId?: string) => {
  const [members, setMembers] = useState<FamilyMember[]>(() => getStoredFamilyMembers(userId));
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(() => {
    setMembers(getStoredFamilyMembers(userId));
  }, [userId]);

  useEffect(() => {
    refresh();

    const handleCustomUpdate = () => {
      refresh();
    };

    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith('mediquee_family_members')) {
        refresh();
      }
    };

    window.addEventListener(EVENT_NAME, handleCustomUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(EVENT_NAME, handleCustomUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [userId, refresh]);

  const addMember = useCallback(
    (member: Omit<FamilyMember, 'id'>) => {
      const saved = saveStoredFamilyMember(member, undefined, userId);
      refresh();
      return saved;
    },
    [userId, refresh]
  );

  const updateMember = useCallback(
    (id: string, member: Omit<FamilyMember, 'id'>) => {
      const saved = saveStoredFamilyMember(member, id, userId);
      refresh();
      return saved;
    },
    [userId, refresh]
  );

  const deleteMember = useCallback(
    (id: string) => {
      const success = deleteStoredFamilyMember(id, userId);
      refresh();
      return success;
    },
    [userId, refresh]
  );

  return {
    members,
    isLoading,
    addMember,
    updateMember,
    deleteMember,
    refresh,
  };
};
