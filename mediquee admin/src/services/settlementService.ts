const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const settlementService = {
  getSettlements: async (token: string) => {
    return { success: true, data: [] };
  }
};
