const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const settlementService = {
  getSettlements: async (token: string) => {
    return { success: true, data: [] };
  }
};
