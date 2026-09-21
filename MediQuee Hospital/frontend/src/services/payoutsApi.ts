export interface ServicePayout {
  revenue: number;           // Gross revenue
  count: number;
  adminCommission?: number;  // 20% platform cut
  hospitalPayout?: number;   // 80% net to hospital
}

export interface PayoutByService {
  op: ServicePayout;
  videoConsultation: ServicePayout;
  homeNursing: ServicePayout;
  labTests: ServicePayout;
  homeSampleCollection: ServicePayout;
}

export interface PayoutSummary {
  totalTransactions: number;
  averagePayout: number;
  averageHospitalPayout?: number;
  thisMonth: number;
  thisMonthHospitalPayout?: number;
  lastMonth: number;
  lastMonthHospitalPayout?: number;
}

export interface PayoutTrendItem {
  name: string;
  value: number;
}

export interface PayoutTransaction {
  id: string;
  service: string;
  type: string;
  date: string;
  amount: number;
  adminCommission?: number;
  hospitalPayout?: number;
  status: string;
  statusColor: string;
  patientName: string;
}

export interface PayoutsResponse {
  totalPayout: number;
  totalGross?: number;
  totalAdminCommission?: number;
  totalHospitalPayout?: number;
  adminCommissionRate?: number;
  hospitalShareRate?: number;
  byService: PayoutByService;
  payoutSummary: PayoutSummary;
  payoutTrend: PayoutTrendItem[];
  recentTransactions: PayoutTransaction[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

const API_URL = 'http://127.0.0.1:5000';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('mediquee_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const payoutsApi = {
  /**
   * GET /api/v1/hospital/payouts
   * Fetches real-time payout metrics, service breakdown, and transactions.
   */
  async getPayouts(startDate?: string, endDate?: string): Promise<PayoutsResponse> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_URL}/api/v1/hospital/payouts${query}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to fetch payouts');
    }

    const json = await res.json();
    return json.data;
  },
};
