const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const departmentService = {
  getDepartments: async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/departments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, data: [] };
    }
  },
  getDepartmentById: async (token: string, id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/departments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, data: null };
    }
  },
  createDepartment: async (token: string, name: string, description?: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/departments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, description })
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, error: { message: 'Network error' } };
    }
  },
  updateDepartment: async (token: string, id: string, data: { name?: string, description?: string, status?: string }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/departments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, error: { message: 'Network error' } };
    }
  },
  createDisease: async (token: string, departmentId: string, name: string, description?: string, icon?: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/departments/${departmentId}/diseases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, description, icon })
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false };
    }
  },
  updateDisease: async (token: string, diseaseId: string, data: { name?: string, description?: string, isActive?: boolean, icon?: string }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/diseases/${diseaseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false };
    }
  },
  deleteDisease: async (token: string, diseaseId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/diseases/${diseaseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false };
    }
  }
};
