import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../services/adminApi';
import { useAuth } from '../context/AuthContext';

function normalizeToBackendRole(frontendRole: string): string {
  const mapping: Record<string, string> = {
    admin: 'HOSPITAL_ADMIN',
    doctor: 'DOCTOR',
    nurse: 'NURSE',
    receptionist: 'RECEPTIONIST',
    lab: 'LAB_ADMIN',
  };
  return mapping[frontendRole] || frontendRole;
}

export function usePermissions() {
  const { user } = useAuth();

  const { data: permissions = [], isLoading, refetch } = useQuery({
    queryKey: ['permissions', user?.role],
    queryFn: () => adminApi.getPermissions(normalizeToBackendRole(user?.role || '')),
    enabled: !!user?.role,
    staleTime: 5 * 60 * 1000,
  });

  const hasPermission = (key: string) => {
    if (!user) return false;
    // HOSPITAL_ADMIN always has full access
    if (user.role === 'admin' || user.role === 'HOSPITAL_ADMIN') return true;
    
    const perm = permissions.find((p: any) => p.key === key);
    return perm ? perm.enabled : false;
  };

  return { permissions, isLoading, hasPermission, refetch };
}
