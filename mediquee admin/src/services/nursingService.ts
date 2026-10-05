const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const nursingService = {
  getHomeNursingBookings: async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/home-nursing`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, data: [] };
    }
  },
  getHomeNursingBookingById: async (id: string, token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/home-nursing/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, message: 'Failed to fetch home nursing booking' };
    }
  },
  updateHomeNursingBookingStatus: async (id: string, status: string, token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/home-nursing/${id}/status`, {
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
