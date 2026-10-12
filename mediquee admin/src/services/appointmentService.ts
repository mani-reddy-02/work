const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const appointmentService = {
  getAppointments: async (token: string, params?: Record<string, any>) => {
    try {
      let queryString = '';
      if (params) {
        const cleanedParams: Record<string, string> = {};
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '' && val !== 'undefined' && val !== 'null') {
            cleanedParams[key] = String(val);
          }
        });
        const query = new URLSearchParams(cleanedParams).toString();
        if (query) queryString = `?${query}`;
      }
      const res = await fetch(`${API_BASE_URL}/admin/appointments${queryString}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (e) {
      console.error('Error fetching appointments:', e);
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
