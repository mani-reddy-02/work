import { dashboardApi, type RevenueAnalyticsResponse, type ServicePayout, type PayoutByService, type PayoutSummary, type PayoutTrendItem, type PayoutTransaction } from './dashboardApi';
import { API_URL } from './apiConfig';

export type { ServicePayout, PayoutByService, PayoutSummary, PayoutTrendItem, PayoutTransaction };
export type PayoutsResponse = RevenueAnalyticsResponse;


function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('mediquee_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const payoutsApi = {
  /**
   * GET /api/v1/hospital/dashboard/revenue-analytics
   * Fetches real-time payout metrics, service breakdown, and transactions using unified endpoint.
   */
  async getPayouts(
    paramsOrStart?: { range?: 'today' | 'week' | 'month' | 'custom'; startDate?: string; endDate?: string } | string,
    endDate?: string
  ): Promise<PayoutsResponse> {
    if (typeof paramsOrStart === 'string') {
      return dashboardApi.getRevenueAnalytics({
        range: 'custom',
        startDate: paramsOrStart,
        endDate: endDate
      });
    }
    return dashboardApi.getRevenueAnalytics(paramsOrStart || { range: 'week' });
  },

  /**
   * GET /api/v1/hospital/payouts/settlements
   * Fetches partner's weekly settlements, breakdowns, payment reference & proofs
   */
  async getSettlements(): Promise<any[]> {
    const res = await fetch(`${API_URL}/api/v1/hospital/payouts/settlements`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to fetch settlements');
    }

    const json = await res.json();
    return json.data || [];
  },

  /**
   * GET /api/v1/hospital/payouts/settlements/:id
   */
  async getSettlementById(id: string): Promise<any> {
    const res = await fetch(`${API_URL}/api/v1/hospital/payouts/settlements/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to fetch settlement details');
    }

    const json = await res.json();
    return json.data;
  }
};

