const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const financeService = {
  getTransactions: async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/finance/transactions`, {
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
  getRevenueAnalytics: async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/finance/revenue`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, data: { kpis: {}, revenueByHospital: [], revenueByService: [] } };
    }
  },
  getSettlements: async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/finance/settlements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, data: [] };
    }
  }
};
