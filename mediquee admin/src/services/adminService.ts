const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const adminService = {
  getPendingVerifications: async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/verifications/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (err) {
      console.error('Error fetching pending verifications:', err);
      return { success: false, message: 'Network Error' };
    }
  },

  updateVerificationStatus: async (token: string, type: string, id: string, payload: { status: string, cancellationReason?: string }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/verifications/${type}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err) {
      console.error('Error updating verification status:', err);
      return { success: false, message: 'Network Error' };
    }
  },

  getAdminDashboardStats: async (token: string, period?: string, serviceFilter?: string) => {
    try {
      const params = new URLSearchParams();
      if (period) params.append('period', period);
      if (serviceFilter) params.append('service', serviceFilter);
      
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${API_BASE_URL}/admin/stats${queryStr}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, data: null };
    }
  },
  getRevenueAnalytics: async (token: string) => {
    return { success: true, data: [] };
  }
};
