const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const providerService = {
  getProviders: async (token: string) => {
    return { success: true, data: [] };
  },
  getLabTests: async (token: string) => {
    return { success: true, data: [] };
  }
};
