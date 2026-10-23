const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export interface SettlementFilterParams {
  search?: string;
  partnerType?: string;
  status?: string;
  period?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PayoutFilterParams {
  search?: string;
  partnerType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ManualPayoutPayload {
  transferReference?: string;
  paymentDate?: string;
  paymentMethod?: string;
  amount?: number;
  notes?: string;
  proofAttachmentId?: string;
  proofFile?: {
    fileName: string;
    fileData: string;
    documentType?: string;
  };
  exceptionReason?: string;
}

export interface AttachmentUploadPayload {
  fileName: string;
  documentType: string;
  fileData: string;
}

export const settlementService = {
  /**
   * GET /api/v1/admin/finance/settlements
   */
  getSettlements: async (token: string, params?: SettlementFilterParams) => {
    try {
      const q = new URLSearchParams();
      if (params?.search) q.append('search', params.search);
      if (params?.partnerType && params.partnerType !== 'all') q.append('partnerType', params.partnerType);
      if (params?.status && params.status !== 'all') q.append('status', params.status);
      if (params?.period && params.period !== 'all') q.append('period', params.period);
      if (params?.startDate) q.append('startDate', params.startDate);
      if (params?.endDate) q.append('endDate', params.endDate);
      if (params?.page) q.append('page', String(params.page));
      if (params?.limit) q.append('limit', String(params.limit));

      const queryStr = q.toString() ? `?${q.toString()}` : '';
      const res = await fetch(`${API_BASE_URL}/admin/finance/settlements${queryStr}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (e) {
      console.error('getSettlements error:', e);
      return { success: false, data: [], pagination: { total: 0, totalPages: 1 } };
    }
  },

  /**
   * GET /api/v1/admin/finance/settlements/:id
   */
  getSettlementById: async (id: string, token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/finance/settlements/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (e) {
      console.error('getSettlementById error:', e);
      return { success: false, message: 'Failed to fetch settlement details' };
    }
  },

  /**
   * POST /api/v1/admin/finance/settlements/generate
   */
  generateWeeklySettlements: async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/finance/settlements/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      return await res.json();
    } catch (e) {
      console.error('generateWeeklySettlements error:', e);
      return { success: false, message: 'Failed to generate weekly settlements' };
    }
  },

  /**
   * POST /api/v1/admin/finance/settlements/:id/attachments
   */
  uploadAttachment: async (settlementId: string, payload: AttachmentUploadPayload, token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/finance/settlements/${settlementId}/attachments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e) {
      console.error('uploadAttachment error:', e);
      return { success: false, message: 'Failed to upload attachment' };
    }
  },

  /**
   * DELETE /api/v1/admin/finance/settlements/:id/attachments/:attachmentId
   */
  deleteAttachment: async (settlementId: string, attachmentId: string, token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/finance/settlements/${settlementId}/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (e) {
      console.error('deleteAttachment error:', e);
      return { success: false, message: 'Failed to delete attachment' };
    }
  },

  /**
   * POST /api/v1/admin/finance/settlements/:id/payout
   * Records manual payout outside the application
   */
  processManualPayout: async (settlementId: string, payload: ManualPayoutPayload, token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/finance/settlements/${settlementId}/payout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e: any) {
      console.error('processManualPayout error:', e);
      return { success: false, message: e?.message || 'Failed to record payout' };
    }
  },

  /**
   * GET /api/v1/admin/finance/payouts
   * Permanent payout history
   */
  getPayoutHistory: async (token: string, params?: PayoutFilterParams) => {
    try {
      const q = new URLSearchParams();
      if (params?.search) q.append('search', params.search);
      if (params?.partnerType && params.partnerType !== 'all') q.append('partnerType', params.partnerType);
      if (params?.status && params.status !== 'all') q.append('status', params.status);
      if (params?.startDate) q.append('startDate', params.startDate);
      if (params?.endDate) q.append('endDate', params.endDate);
      if (params?.page) q.append('page', String(params.page));
      if (params?.limit) q.append('limit', String(params.limit));

      const queryStr = q.toString() ? `?${q.toString()}` : '';
      const res = await fetch(`${API_BASE_URL}/admin/finance/payouts${queryStr}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (e) {
      console.error('getPayoutHistory error:', e);
      return { success: false, data: [], pagination: { total: 0, totalPages: 1 } };
    }
  },

  /**
   * GET /api/v1/admin/finance/payouts/:id
   */
  getPayoutRecordById: async (id: string, token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/finance/payouts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return await res.json();
    } catch (e) {
      console.error('getPayoutRecordById error:', e);
      return { success: false, message: 'Failed to fetch payout record' };
    }
  }
};
