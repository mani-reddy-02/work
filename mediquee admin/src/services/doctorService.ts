const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const doctorService = {
  getDoctors: async (token: string) => {
    return { success: true, data: [] };
  }
};
