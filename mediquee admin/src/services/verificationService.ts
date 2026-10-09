const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const verificationService = {
  getVerificationRequests: async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/hospital-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, data: [] };
    }
  }
};
