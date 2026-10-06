const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const appointmentService = {
  getAppointments: async (token: string, params?: Record<string, any>) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/appointments${params ? "?" + new URLSearchParams(params).toString() : ""}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, data: [] };
    }
  },
  getAppointmentById: async (id: string, token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/appointments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, message: 'Failed to fetch' };
    }
  },
  updateAppointmentStatus: async (id: string, status: string, token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/appointments/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, message: 'Failed to update status' };
    }
  }
};
