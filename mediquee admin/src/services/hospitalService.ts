const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const hospitalService = {
  getHospitals: async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/hospitals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, data: [] };
    }
  },
  updateRevenueShare: async (token: string, hospitalId: string, hospitalSharePercentage: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/hospitals/${hospitalId}/revenue-share`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ hospitalSharePercentage })
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, message: 'Failed to update revenue share' };
    }
  },
  getHospitalById: async (token: string, id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/hospitals/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, data: null };
    }
  }
};

