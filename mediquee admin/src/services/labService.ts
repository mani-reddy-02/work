const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const labService = {
  getLabBookings: async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/lab-bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, data: [] };
    }
  },
  getLabBookingById: async (id: string, token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/lab-bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, message: 'Failed to fetch lab booking' };
    }
  },
  updateLabBookingStatus: async (id: string, status: string, token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/lab-bookings/${id}/status`, {
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
      return { success: false, message: 'Failed to update lab booking status' };
    }
  }
};
