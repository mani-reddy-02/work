import { API_URL } from './apiConfig';

export interface DashboardAppointment {
  id: string;
  patientId?: string;
  date?: string;
  time: string;
  name: string;
  dept: string;
  doctor: string;
  status: string;
  statusColor: string;
  avatar: string;
}

export interface RevenueTrendItem {
  name: string;
  revenue: number;
}

export interface RevenueTrends {
  today: RevenueTrendItem[];
  week: RevenueTrendItem[];
  month: RevenueTrendItem[];
  year: RevenueTrendItem[];
}

export interface DashboardOverview {
  totalOPs: number;
  pendingOPs: number;
  completedOPs?: number;
  upcomingOPs?: number;
  labTests: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth?: number;
  revenueThisYear?: number;
  revenueTrend: RevenueTrendItem[];
  revenueTrends?: RevenueTrends;
  todayAppointments: DashboardAppointment[];
  upcomingAppointments?: DashboardAppointment[];
  hospitalSharePercentage?: number;
  mediqueeCommissionPercentage?: number;
}


function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('mediquee_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface RevenueChartPoint {
  label: string;
  date: string;
  fullDate?: string;
  revenue: number;
  hospitalShare: number;
  platformFee: number;
}

export interface ServiceBreakdownItem {
  service: string;
  name: string;
  key: string;
  count: number;
  gross: number;
  revenue: number;
  net: number;
  netPayout: number;
  hospitalPayout: number;
  adminCut: number;
  platformFee: number;
  adminCommission: number;
}

export interface ServicePayout {
  revenue: number;
  count: number;
  gross?: number;
  net?: number;
  adminCommission?: number;
  adminCut?: number;
  hospitalPayout?: number;
  netPayout?: number;
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
  gross?: number;
  adminCommission?: number;
  adminCut?: number;
  hospitalPayout?: number;
  netPayout?: number;
  status: string;
  statusColor: string;
  patientName: string;
  info?: string;
  doctorName?: string;
  departmentName?: string;
  nurseName?: string;
}

export interface RevenueAnalyticsResponse {
  totalRevenue: number;
  totalGross?: number;
  totalPayout?: number;
  hospitalShare: number;
  netPayout?: number;
  totalHospitalPayout?: number;
  platformFee: number;
  adminCut?: number;
  totalAdminCommission?: number;
  hospitalSharePercent?: number;
  hospitalSharePercentage: number;
  platformFeePercent?: number;
  platformFeePercentage: number;
  hospitalShareRate?: number;
  adminCommissionRate?: number;
  range: string;
  startDate: string;
  endDate: string;
  dateRange?: {
    startDate: string;
    endDate: string;
    label: string;
    range: string;
  };
  chartData: RevenueChartPoint[];
  trend?: RevenueChartPoint[];
  payoutTrend?: PayoutTrendItem[];
  serviceBreakdown?: ServiceBreakdownItem[];
  byService?: PayoutByService;
  transactions?: PayoutTransaction[];
  dailyTransactions?: PayoutTransaction[];
  recentTransactions?: PayoutTransaction[];
  payoutSummary?: PayoutSummary;
}

export const dashboardApi = {
  /**
   * GET /api/v1/hospital/dashboard/overview
   * Fetches real-time aggregate hospital overview metrics for today, week, month, and year.
   */
  async getOverview(): Promise<DashboardOverview> {
    const res = await fetch(`${API_URL}/api/v1/hospital/dashboard/overview`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to fetch dashboard overview');
    }

    const json = await res.json();
    return json.data;
  },

  /**
   * GET /api/v1/hospital/dashboard/revenue-analytics
   * Fetches aggregated completed OP & Lab booking revenue with zero-filled chart intervals.
   */
  async getRevenueAnalytics(params: {
    range?: 'today' | 'week' | 'month' | 'custom';
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<RevenueAnalyticsResponse> {
    const query = new URLSearchParams();
    if (params.range) query.set('range', params.range);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.status) query.set('status', params.status);

    const res = await fetch(`${API_URL}/api/v1/hospital/dashboard/revenue-analytics?${query.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to fetch revenue analytics');
    }

    const json = await res.json();
    return json.data;
  },
};

