const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const financeService = {
  getTransactions: async (token: string, params?: { startDate?: string; endDate?: string }) => {
    try {
      const q = new URLSearchParams();
      if (params?.startDate) q.append('startDate', params.startDate);
      if (params?.endDate) q.append('endDate', params.endDate);
      const queryStr = q.toString() ? `?${q.toString()}` : '';

      const res = await fetch(`${API_BASE_URL}/admin/finance/transactions${queryStr}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, data: [] };
    }
  },
  getTransactionById: async (id: string, token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/finance/transactions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, message: 'Failed to fetch transaction' };
    }
  },
  getRevenueAnalytics: async (token: string, params?: { startDate?: string; endDate?: string }) => {
    try {
      const q = new URLSearchParams();
      if (params?.startDate) q.append('startDate', params.startDate);
      if (params?.endDate) q.append('endDate', params.endDate);
      const queryStr = q.toString() ? `?${q.toString()}` : '';

      const res = await fetch(`${API_BASE_URL}/admin/finance/revenue${queryStr}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, data: { kpis: {}, revenueByHospital: [], revenueByService: [] } };
    }
  },
  getSettlements: async (token: string, params?: { startDate?: string; endDate?: string }) => {
    try {
      const q = new URLSearchParams();
      if (params?.startDate) q.append('startDate', params.startDate);
      if (params?.endDate) q.append('endDate', params.endDate);
      const queryStr = q.toString() ? `?${q.toString()}` : '';

      const res = await fetch(`${API_BASE_URL}/admin/finance/settlements${queryStr}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, data: [] };
    }
  }
};
