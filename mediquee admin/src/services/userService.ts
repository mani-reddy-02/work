const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const userService = {
  getUsers: async (token: string, filters?: any) => {
    try {
      const params = new URLSearchParams();
      if (filters) {
        if (filters.role) params.append('role', filters.role);
        if (filters.gender) params.append('gender', filters.gender);
        if (filters.ageMin) params.append('ageMin', filters.ageMin);
        if (filters.ageMax) params.append('ageMax', filters.ageMax);
        if (filters.city) params.append('city', filters.city);
        if (filters.hospitalId) params.append('hospitalId', filters.hospitalId);
        if (filters.search) params.append('search', filters.search);
        if (filters.specialization) params.append('specialization', filters.specialization);
        if (filters.experienceMin) params.append('experienceMin', filters.experienceMin);
        if (filters.experienceMax) params.append('experienceMax', filters.experienceMax);
        if (filters.status) params.append('status', filters.status);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());
      }
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${API_BASE_URL}/admin/users${queryStr}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, data: [] };
    }
  },
  getUserById: async (token: string, id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, data: null };
    }
  },
  getPatientFilters: async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/patients/filters`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, data: { cities: [], hospitals: [] } };
    }
  },
  getNurseFilters: async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/nurses/filters`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, data: { hospitals: [] } };
    }
  },
  getReceptionistFilters: async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/receptionists/filters`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, data: { hospitals: [] } };
    }
  }
};
