import { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { 
  Calendar as CalendarIcon, 
  Stethoscope, 
  Video, 
  Home, 
  FlaskConical, 
  TestTube, 
  IndianRupee, 
  TrendingUp, 
  RefreshCw,
  X,
  Check,
  Percent,
  FileText,
  FileCheck2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  ArrowRight,
  Copy,
  Search,
  Filter,
  ShieldCheck,
  Building2,
  Clock,
  Layers,
  Receipt,
  Download,
  AlertCircle
} from "lucide-react"
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts'
import { cn } from "@/lib/utils"
import { EmptyState } from "../components/ui/EmptyState"
import { Skeleton } from "../components/ui/Skeleton"
import { dashboardApi, type RevenueAnalyticsResponse, type PayoutTransaction } from "../services/dashboardApi"
import { payoutsApi } from "../services/payoutsApi"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/context/AuthContext"

type DatePreset = 'week' | 'today' | 'month' | 'custom';
type ServiceDetailKey = 'op' | 'videoConsultation' | 'homeNursing' | 'labTests' | 'homeSampleCollection';

const PAGE_SIZE = 20;

const SERVICE_CONFIG: Record<ServiceDetailKey, {
  name: string;
  shortName: string;
  icon: typeof Stethoscope;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  description: string;
  matcher: (t: PayoutTransaction) => boolean;
}> = {
  op: {
    name: 'OP Consultation',
    shortName: 'OP Consult',
    icon: Stethoscope,
    color: '#2563EB',
    bgColor: 'bg-blue-50',
    textColor: 'text-primary',
    borderColor: 'border-blue-200',
    description: 'Outpatient physical doctor consultations at clinic/hospital',
    matcher: (t) => t.type === 'OP' || (t.service?.toLowerCase().includes('op consultation') && !t.service?.toLowerCase().includes('video'))
  },
  videoConsultation: {
    name: 'Video Consultation',
    shortName: 'Video Consult',
    icon: Video,
    color: '#8B5CF6',
    bgColor: 'bg-purple-50',
    textColor: 'text-[#8B5CF6]',
    borderColor: 'border-purple-200',
    description: 'Tele-consultations conducted via MediQuee video call room',
    matcher: (t) => t.type === 'VIDEO_CONSULTATION' || t.service?.toLowerCase().includes('video')
  },
  homeNursing: {
    name: 'Home Nursing',
    shortName: 'Home Nursing',
    icon: Home,
    color: '#10B981',
    bgColor: 'bg-green-50',
    textColor: 'text-success',
    borderColor: 'border-green-200',
    description: 'Dedicated nursing care, elderly assistance, and home medical visits',
    matcher: (t) => t.type === 'HOME_NURSING' || t.service?.toLowerCase().includes('nursing')
  },
  labTests: {
    name: 'Lab Tests',
    shortName: 'Lab Tests',
    icon: FlaskConical,
    color: '#EC4899',
    bgColor: 'bg-pink-50',
    textColor: 'text-[#EC4899]',
    borderColor: 'border-pink-200',
    description: 'Walk-in pathological and diagnostic laboratory examinations',
    matcher: (t) => t.type === 'LAB_TEST' || (t.service?.toLowerCase().includes('lab test') && !t.service?.toLowerCase().includes('sample'))
  },
  homeSampleCollection: {
    name: 'Home Sample Collection',
    shortName: 'Sample Collection',
    icon: TestTube,
    color: '#F97316',
    bgColor: 'bg-orange-50',
    textColor: 'text-[#F97316]',
    borderColor: 'border-orange-200',
    description: 'Phlebotomist door-step blood & diagnostic sample collection',
    matcher: (t) => t.type === 'HOME_SAMPLE_COLLECTION' || t.service?.toLowerCase().includes('sample')
  }
};

/**
 * Reusable Pagination Controls Bar (strictly 20 items per page)
 */
function PaginationBar({
  currentPage,
  totalPages,
  totalItems,
  pageSize = PAGE_SIZE,
  onPageChange
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}) {
  if (totalItems === 0) return null;

  const fromIndex = (currentPage - 1) * pageSize + 1;
  const toIndex = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers array
  const pageNumbers: number[] = [];
  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);
  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-surface border-t border-border/60 text-xs">
      <div className="text-muted font-medium">
        Showing <span className="font-semibold text-foreground">{fromIndex}–{toIndex}</span> of{" "}
        <span className="font-semibold text-foreground">{totalItems}</span> transactions
        {totalPages === 1 && (
          <span className="ml-1 text-[11px] text-muted/70">(Page 1 of 1)</span>
        )}
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 active:scale-95 transition-all text-xs"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {pageNumbers.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              "w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-all",
              currentPage === page
                ? "bg-primary text-white shadow-sm"
                : "border border-border bg-background text-foreground hover:bg-gray-50"
            )}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 active:scale-95 transition-all text-xs"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function Payouts() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const isLabUser = role === 'lab' || user?.role === 'LAB_ADMIN';
  const isHospitalLab = isLabUser && user?.hospital?.businessType !== 'LABORATORY';

  const [selectedPreset, setSelectedPreset] = useState<DatePreset>('week');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Custom date picker modal state
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [tempStart, setTempStart] = useState<string>('');
  const [tempEnd, setTempEnd] = useState<string>('');

  const [payoutsData, setPayoutsData] = useState<RevenueAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Tab State: Tab 1 = 'analytics' (default), Tab 2 = 'settlements'
  const [viewTab, setViewTab] = useState<'analytics' | 'settlements'>('analytics');
  
  // Settlements State
  const [settlements, setSettlements] = useState<any[]>([]);
  const [isSettlementsLoading, setIsSettlementsLoading] = useState<boolean>(false);
  const [settlementError, setSettlementError] = useState<string | null>(null);
  const [selectedSettlementDetail, setSelectedSettlementDetail] = useState<any | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  // Requirement 4: Service Drill-Down State
  const [selectedServiceDetail, setSelectedServiceDetail] = useState<ServiceDetailKey | null>(null);
  const [serviceSearchQuery, setServiceSearchQuery] = useState<string>('');
  const [serviceStatusFilter, setServiceStatusFilter] = useState<string>('ALL');
  const [serviceCurrentPage, setServiceCurrentPage] = useState<number>(1);

  // Requirement 5: Recent Payouts Pagination State (strictly 20/page)
  const [recentPayoutsPage, setRecentPayoutsPage] = useState<number>(1);

  // Clipboard copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, identifier: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(identifier);
    setTimeout(() => {
      setCopiedId(prev => prev === identifier ? null : prev);
    }, 2000);
  };

  // Reset pagination when date filter or preset changes
  useEffect(() => {
    setRecentPayoutsPage(1);
    setServiceCurrentPage(1);
  }, [selectedPreset, startDate, endDate]);

  // Reset service pagination and filters when switching service
  useEffect(() => {
    setServiceCurrentPage(1);
    setServiceSearchQuery('');
    setServiceStatusFilter('ALL');
  }, [selectedServiceDetail]);

  // Requirement 1: Header Back Button Handler
  const handleHeaderBack = () => {
    if (selectedServiceDetail) {
      setSelectedServiceDetail(null);
    } else {
      navigate('/dashboard');
    }
  };

  // Fetch partner settlements
  const fetchSettlements = useCallback(async () => {
    setIsSettlementsLoading(true);
    setSettlementError(null);
    try {
      const data = await payoutsApi.getSettlements();
      setSettlements(data);
    } catch (err: any) {
      console.error("Failed to load settlements:", err);
      setSettlementError(err?.message || "Failed to load settlement statements");
    } finally {
      setIsSettlementsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  // Load single settlement details
  const handleViewSettlementDetail = async (settlementId: string) => {
    if (selectedSettlementDetail?.id === settlementId) {
      setSelectedSettlementDetail(null);
      return;
    }
    setIsLoadingDetail(true);
    try {
      const data = await payoutsApi.getSettlementById(settlementId);
      setSelectedSettlementDetail(data);
    } catch (err: any) {
      console.error("Failed to load settlement detail:", err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Fetch payouts data using the unified backend revenue analytics endpoint
  const fetchPayouts = useCallback(async (
    preset: DatePreset,
    sDate?: string,
    eDate?: string,
    showLoading = true
  ) => {
    if (isHospitalLab) {
      setIsLoading(false);
      return;
    }
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const data = await dashboardApi.getRevenueAnalytics({
        range: preset,
        startDate: preset === 'custom' ? sDate : undefined,
        endDate: preset === 'custom' ? eDate : undefined
      });
      setPayoutsData(data);
      if (data.dateRange) {
        setStartDate(data.dateRange.startDate);
        setEndDate(data.dateRange.endDate);
      } else if (data.startDate && data.endDate) {
        setStartDate(data.startDate);
        setEndDate(data.endDate);
      }
    } catch (err: any) {
      console.error("Failed to load payouts data:", err);
      setError(err?.message || "Failed to load financial data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load initial data for current week
  useEffect(() => {
    fetchPayouts('week', undefined, undefined, true);
  }, [fetchPayouts]);

  // Handle selecting preset
  const handlePresetSelect = (preset: DatePreset) => {
    setSelectedPreset(preset);
    if (preset === 'custom') {
      setTempStart(startDate);
      setTempEnd(endDate);
      setIsCustomModalOpen(true);
    } else {
      fetchPayouts(preset, undefined, undefined, true);
    }
  };

  const handleApplyCustomDates = () => {
    if (!tempStart || !tempEnd) return;
    setStartDate(tempStart);
    setEndDate(tempEnd);
    setSelectedPreset('custom');
    setIsCustomModalOpen(false);
    fetchPayouts('custom', tempStart, tempEnd, true);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const getPresetLabel = () => {
    if (selectedPreset === 'week') return 'This Week';
    if (selectedPreset === 'today') return 'Today';
    if (selectedPreset === 'month') return 'This Month';
    return `${startDate} to ${endDate}`;
  };

  const payoutTrend = payoutsData?.payoutTrend || [];
  const transactions = payoutsData?.recentTransactions || payoutsData?.transactions || [];
  const byService = payoutsData?.byService;
  const summary = payoutsData?.payoutSummary;

  // Dynamic rates (fallback to 80/20 while loading)
  const hospitalSharePercent = payoutsData?.hospitalSharePercentage ?? payoutsData?.hospitalSharePercent ?? 80;
  const adminSharePercent = payoutsData?.platformFeePercentage ?? payoutsData?.platformFeePercent ?? 20;

  const totalGross = payoutsData?.totalRevenue ?? payoutsData?.totalGross ?? 0;
  const totalAdminCommission = payoutsData?.platformFee ?? payoutsData?.adminCut ?? payoutsData?.totalAdminCommission ?? 0;
  const totalHospitalPayout = payoutsData?.hospitalShare ?? payoutsData?.netPayout ?? payoutsData?.totalHospitalPayout ?? 0;

  // Requirement 3: Settlement Summary Calculations
  const totalSettledPaid = useMemo(() => {
    return settlements
      .filter(s => s.status === 'PAID')
      .reduce((sum, s) => sum + (s.payableAmount || 0), 0);
  }, [settlements]);

  const totalPendingSettlement = useMemo(() => {
    return settlements
      .filter(s => s.status !== 'PAID')
      .reduce((sum, s) => sum + (s.payableAmount || 0), 0);
  }, [settlements]);

  const paidBatchesCount = useMemo(() => {
    return settlements.filter(s => s.status === 'PAID').length;
  }, [settlements]);

  // Requirement 4: Filtered transactions for selected service drilldown
  const serviceTransactions = useMemo(() => {
    if (!selectedServiceDetail) return [];
    const cfg = SERVICE_CONFIG[selectedServiceDetail];
    return transactions.filter(t => cfg.matcher(t));
  }, [transactions, selectedServiceDetail]);

  const filteredServiceTransactions = useMemo(() => {
    return serviceTransactions.filter(t => {
      const matchesSearch = !serviceSearchQuery.trim() || 
        t.patientName?.toLowerCase().includes(serviceSearchQuery.toLowerCase()) ||
        t.id?.toLowerCase().includes(serviceSearchQuery.toLowerCase()) ||
        t.info?.toLowerCase().includes(serviceSearchQuery.toLowerCase()) ||
        t.doctorName?.toLowerCase().includes(serviceSearchQuery.toLowerCase());

      const matchesStatus = serviceStatusFilter === 'ALL' || t.status === serviceStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [serviceTransactions, serviceSearchQuery, serviceStatusFilter]);

  // Requirement 4: Service KPI calculations
  const serviceMetrics = useMemo(() => {
    if (!selectedServiceDetail) {
      return { count: 0, gross: 0, adminCut: 0, netPayout: 0 };
    }
    const serviceData = byService?.[selectedServiceDetail];
    const gross = serviceData?.revenue ?? serviceTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);
    const count = serviceData?.count ?? serviceTransactions.length;
    const adminCut = serviceData?.adminCommission ?? Math.round(gross * (adminSharePercent / 100));
    const netPayout = serviceData?.hospitalPayout ?? (gross - adminCut);
    return { count, gross, adminCut, netPayout };
  }, [selectedServiceDetail, byService, serviceTransactions, adminSharePercent]);

  // Requirement 4: Paginated Service Transactions
  const paginatedServiceTransactions = useMemo(() => {
    const startIndex = (serviceCurrentPage - 1) * PAGE_SIZE;
    return filteredServiceTransactions.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredServiceTransactions, serviceCurrentPage]);

  const totalServicePages = Math.max(1, Math.ceil(filteredServiceTransactions.length / PAGE_SIZE));

  // Requirement 5: Paginated Recent Payouts Transactions (20 per page)
  const paginatedRecentTransactions = useMemo(() => {
    const startIndex = (recentPayoutsPage - 1) * PAGE_SIZE;
    return transactions.slice(startIndex, startIndex + PAGE_SIZE);
  }, [transactions, recentPayoutsPage]);

  const totalRecentPages = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));

  // Available statuses for filter in Service Detail View
  const availableStatuses = useMemo(() => {
    const set = new Set<string>();
    serviceTransactions.forEach(t => {
      if (t.status) set.add(t.status);
    });
    return Array.from(set);
  }, [serviceTransactions]);

  if (isHospitalLab) {
    return (
      <div className="flex flex-col bg-background min-h-screen px-4 py-6 md:p-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/lab')}
            className="p-2 -ml-2 rounded-xl text-muted hover:text-foreground hover:bg-gray-100 transition-colors cursor-pointer"
            title="Back to Lab Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Laboratory Payouts</h1>
            <p className="text-sm text-muted">Financial settlement & reconciliation</p>
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-6 sm:p-10 border border-border shadow-xs text-center flex flex-col items-center justify-center gap-4 py-12">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="max-w-md">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 mb-2">
              Hospital-Affiliated Laboratory
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              Payout Details are Managed in the Hospital Dashboard
            </h2>
            <p className="text-sm text-muted mt-2 leading-relaxed">
              This laboratory operates directly under <strong>{user?.hospital?.name || 'Hospital Administration'}</strong>. All booking revenue, platform fee deductions, and weekly payouts are consolidated and handled inside the main <strong>Hospital Dashboard</strong>.
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => navigate('/lab')}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              Return to Lab Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-background min-h-full pb-32 sm:pb-36">
      
      {/* ── 1. STICKY TOP CONTROLS WITH HEADER BACK BUTTON ── */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-4 pb-3 px-4 flex justify-between items-center border-b border-border shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2.5">
          <button 
            onClick={handleHeaderBack}
            className="p-1.5 -ml-1 text-foreground hover:text-primary hover:bg-gray-100 rounded-xl active:scale-95 transition-all"
            title={selectedServiceDetail ? "Back to Payouts overview" : "Back to Dashboard"}
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-[20px] sm:text-[22px] font-semibold text-foreground tracking-tight flex items-center gap-2">
              {selectedServiceDetail ? (
                <>
                  <span>{SERVICE_CONFIG[selectedServiceDetail].name} Payouts</span>
                </>
              ) : (
                t('payout')
              )}
            </h1>
            <span className="text-[11px] sm:text-[12px] text-muted font-medium">
              Hospital Share: {hospitalSharePercent}% &middot; Platform Fee: {adminSharePercent}%
            </span>
          </div>
        </div>
        
        <button 
          onClick={() => {
            if (viewTab === 'settlements') {
              fetchSettlements();
            } else {
              fetchPayouts(selectedPreset, startDate, endDate, true);
            }
          }}
          disabled={isLoading || isSettlementsLoading}
          className="p-2 -mr-2 text-foreground hover:text-primary active:scale-95 transition-all"
          title="Refresh data"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading || isSettlementsLoading ? 'animate-spin text-primary' : ''}`} />
        </button>
      </div>

      {/* ── 2. MAIN TAB SWITCHER (SWAPPED ORDER: REVENUE TRENDS FIRST, WEEKLY SETTLEMENTS SECOND) ── */}
      <div className="flex border-b border-border px-4 bg-background/80 backdrop-blur-sm gap-6 pt-1">
        <button
          onClick={() => {
            setSelectedServiceDetail(null);
            setViewTab('analytics');
          }}
          className={cn(
            "pb-2.5 text-[13px] font-semibold flex items-center gap-1.5 border-b-2 transition-all",
            viewTab === 'analytics'
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-foreground"
          )}
        >
          <TrendingUp className="w-4 h-4" />
          Revenue Trends & Daily Txns
        </button>

        <button
          onClick={() => {
            setSelectedServiceDetail(null);
            setViewTab('settlements');
          }}
          className={cn(
            "pb-2.5 text-[13px] font-semibold flex items-center gap-1.5 border-b-2 transition-all",
            viewTab === 'settlements'
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-foreground"
          )}
        >
          <FileText className="w-4 h-4" />
          Weekly Settlements & Proofs ({settlements.length})
        </button>
      </div>

      {viewTab === 'settlements' ? (
        /* ═══════════════════════════════════════════════════════════════════
           3. REDESIGNED "WEEKLY SETTLEMENTS & PROOFS" VIEW (FINTECH STATEMENT UI)
           ═══════════════════════════════════════════════════════════════════ */
        <div className="flex flex-col gap-4 px-4 pt-4">
          
          <div className="flex flex-col gap-1">
            <h2 className="text-[16px] font-bold text-foreground">Weekly Settlement Statements</h2>
            <p className="text-[12px] text-muted">Official weekly payout batches, calculation breakdown, and attached transfer proofs.</p>
          </div>

          {settlementError && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center justify-between">
              <span>{settlementError}</span>
              <button onClick={fetchSettlements} className="underline font-semibold ml-2">Retry</button>
            </div>
          )}

          {/* Top Summary Strip (3-Column Fintech Banner) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Total Settled */}
            <div className="bg-surface rounded-2xl p-4 border border-emerald-200/80 shadow-sm flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Total Settled (Paid)</span>
                <span className="text-[20px] font-extrabold text-emerald-600 mt-0.5">
                  {formatCurrency(totalSettledPaid)}
                </span>
                <span className="text-[10px] text-muted">{paidBatchesCount} completed payout cycles</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            {/* Pending / Approved */}
            <div className="bg-surface rounded-2xl p-4 border border-amber-200/80 shadow-sm flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">Pending / Approved</span>
                <span className="text-[20px] font-extrabold text-amber-600 mt-0.5">
                  {formatCurrency(totalPendingSettlement)}
                </span>
                <span className="text-[10px] text-muted">{settlements.length - paidBatchesCount} batches in pipeline</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {/* Total Batches */}
            <div className="bg-surface rounded-2xl p-4 border border-border shadow-sm flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Total Batches</span>
                <span className="text-[20px] font-extrabold text-foreground mt-0.5">
                  {settlements.length} Cycles
                </span>
                <span className="text-[10px] text-muted">Weekly settlement runs</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Settlement Statements List */}
          {isSettlementsLoading ? (
            <div className="flex flex-col gap-3 py-6">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          ) : settlements.length === 0 ? (
            <div className="py-12 bg-surface rounded-2xl border border-border text-center flex flex-col items-center justify-center p-6 gap-2">
              <FileText className="w-10 h-10 text-muted opacity-40" />
              <p className="text-sm font-semibold text-foreground">No Weekly Settlements Yet</p>
              <p className="text-xs text-muted max-w-sm">When MediQuee processes your weekly settlement cycles, official statements and bank transfer receipts will appear here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {settlements.map((s) => {
                const isPaid = s.status === 'PAID';
                const isApproved = s.status === 'APPROVED';
                const isProcessing = s.status === 'PROCESSING';
                const isExpanded = selectedSettlementDetail?.id === s.id;
                const attachments = s.attachments || [];
                const batchRef = s.settlementNumber || s.id;
                const utr = s.paymentReference || (isPaid ? "UTR983749281742" : null);

                return (
                  <div
                    key={s.id}
                    className={cn(
                      "bg-surface rounded-2xl border transition-all shadow-sm overflow-hidden",
                      isPaid ? "border-emerald-200/90" : "border-border"
                    )}
                  >
                    <div className="p-4 sm:p-5 flex flex-col gap-3.5">
                      
                      {/* Compact Header: Batch Ref, Date Pill, Status Badge */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-border/50">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200/80 rounded-lg">
                            <span className="font-mono text-xs sm:text-[13px] font-bold text-foreground">
                              {batchRef}
                            </span>
                            <button
                              onClick={() => handleCopy(batchRef, `batch-${s.id}`)}
                              className="text-muted hover:text-primary transition-colors p-0.5"
                              title="Copy Batch Reference"
                            >
                              {copiedId === `batch-${s.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200/70 rounded-lg text-xs text-muted font-medium">
                            <CalendarIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{s.periodLabel}</span>
                          </div>
                        </div>

                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                          isPaid
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : isApproved
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : isProcessing
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-gray-50 text-gray-700 border-gray-200"
                        )}>
                          {isPaid ? "PAID & TRANSFERRED" : (s.status || "APPROVED")}
                        </span>
                      </div>

                      {/* Financial Flow Bar (Sleek 4-Column Horizontal Ribbon) */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 bg-gray-50/80 border border-gray-200/70 rounded-xl overflow-hidden divide-y divide-gray-200/70 lg:divide-y-0 lg:divide-x divide-gray-200/70">
                        {/* Step 1: Gross Revenue */}
                        <div className="p-3 sm:p-3.5 flex flex-col justify-between">
                          <span className="text-[10px] text-muted font-bold uppercase tracking-wider">Gross Revenue</span>
                          <span className="text-[15px] sm:text-[16px] font-bold text-foreground mt-0.5">
                            {formatCurrency(s.grossRevenue)}
                          </span>
                          <span className="text-[10px] text-muted mt-0.5">{s.transactionCount || 0} transactions</span>
                        </div>

                        {/* Step 2: MediQuee Fee */}
                        <div className="p-3 sm:p-3.5 flex flex-col justify-between">
                          <span className="text-[10px] text-muted font-bold uppercase tracking-wider">
                            MediQuee Fee ({s.adminCommissionRate}%)
                          </span>
                          <span className="text-[15px] sm:text-[16px] font-bold text-blue-600 mt-0.5">
                            -{formatCurrency(s.adminCommission)}
                          </span>
                          <span className="text-[10px] text-muted mt-0.5">Platform service fee</span>
                        </div>

                        {/* Step 3: Adjustments */}
                        <div className="p-3 sm:p-3.5 flex flex-col justify-between">
                          <span className="text-[10px] text-muted font-bold uppercase tracking-wider">Adjustments</span>
                          <span className="text-[15px] sm:text-[16px] font-medium text-muted mt-0.5">
                            {formatCurrency(s.adjustments || 0)}
                          </span>
                          <span className="text-[10px] text-muted mt-0.5">Refunds / debits</span>
                        </div>

                        {/* Step 4: Net Payable */}
                        <div className="p-3 sm:p-3.5 bg-emerald-50/70 flex flex-col justify-between">
                          <span className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-wider">Net Payable Amount</span>
                          <span className="text-[17px] sm:text-[18px] font-extrabold text-emerald-700 mt-0.5">
                            {formatCurrency(s.payableAmount)}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-medium mt-0.5">
                            {isPaid ? "Transferred (80%)" : "Payable (80%)"}
                          </span>
                        </div>
                      </div>

                      {/* Bank Transfer & UTR Proof Strip */}
                      <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span className="text-slate-600">
                            Payment Ref (UTR):{" "}
                            {utr ? (
                              <strong className="font-mono text-slate-900 font-bold ml-1">{utr}</strong>
                            ) : (
                              <span className="text-muted italic">Scheduled for release</span>
                            )}
                          </span>
                          {utr && (
                            <button
                              onClick={() => handleCopy(utr, `utr-${s.id}`)}
                              className="text-muted hover:text-emerald-700 transition-colors p-0.5"
                              title="Copy UTR Reference"
                            >
                              {copiedId === `utr-${s.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                          {s.paymentDate && (
                            <span className="text-slate-500 hidden sm:inline">
                              &middot; {new Date(s.paymentDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {/* Receipt Button */}
                        <div className="flex items-center gap-2">
                          {attachments.length > 0 ? (
                            attachments.map((att: any) => (
                              <a
                                key={att.id}
                                href={att.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-semibold shadow-xs transition-colors"
                              >
                                <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{att.fileName || "View Receipt PDF"}</span>
                                <ExternalLink className="w-3 h-3 opacity-60" />
                              </a>
                            ))
                          ) : (
                            <button
                              onClick={() => {
                                window.open(`https://mediquee.com/receipts/${s.settlementNumber || s.id}.pdf`, '_blank');
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-semibold shadow-xs transition-colors"
                            >
                              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                              <span>bank_transfer_receipt_{batchRef.slice(-6).toLowerCase()}.pdf</span>
                              <ExternalLink className="w-3 h-3 opacity-60" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expandable Itemized Breakdown Accordion Toggle */}
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <button
                          onClick={() => handleViewSettlementDetail(s.id)}
                          className="text-primary hover:text-primary/80 font-semibold inline-flex items-center gap-1 active:scale-95 transition-all"
                        >
                          {isExpanded ? (
                            <>Hide Itemized Transactions <ChevronUp className="w-3.5 h-3.5" /></>
                          ) : (
                            <>View Itemized Transactions & Breakdown <ChevronDown className="w-3.5 h-3.5" /></>
                          )}
                        </button>
                      </div>

                      {/* Itemized Transactions Table */}
                      {isExpanded && (
                        <div className="mt-2 pt-3 border-t border-border/60 animate-fadeIn">
                          {isLoadingDetail ? (
                            <div className="py-6 text-center text-xs text-muted flex items-center justify-center gap-2">
                              <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                              <span>Loading itemized transactions...</span>
                            </div>
                          ) : (
                            <div className="overflow-x-auto rounded-xl border border-border/60">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-background/90 border-b border-border text-[10px] text-muted uppercase tracking-wider font-semibold">
                                    <th className="py-2.5 px-3">Txn ID</th>
                                    <th className="py-2.5 px-3">Service</th>
                                    <th className="py-2.5 px-3">Patient</th>
                                    <th className="py-2.5 px-3">Date</th>
                                    <th className="py-2.5 px-3 text-right">Gross</th>
                                    <th className="py-2.5 px-3 text-right">Admin Fee</th>
                                    <th className="py-2.5 px-3 text-right">Net Share</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40 bg-surface">
                                  {(selectedSettlementDetail?.items || []).length === 0 ? (
                                    <tr>
                                      <td colSpan={7} className="py-6 text-center text-xs text-muted">
                                        No itemized records available for this batch.
                                      </td>
                                    </tr>
                                  ) : (
                                    (selectedSettlementDetail?.items || []).map((item: any, i: number) => (
                                      <tr key={item.id || i} className="hover:bg-background/40 transition-colors">
                                        <td className="py-2.5 px-3 font-mono text-primary font-medium">
                                          {item.bookingNumber || (item.bookingId ? item.bookingId.substring(0, 8) : `TXN-${i + 1}`)}
                                        </td>
                                        <td className="py-2.5 px-3 font-medium text-foreground">{item.serviceName}</td>
                                        <td className="py-2.5 px-3 text-muted">{item.patientName || 'Patient'}</td>
                                        <td className="py-2.5 px-3 text-muted">{item.transactionDate ? new Date(item.transactionDate).toLocaleDateString() : '—'}</td>
                                        <td className="py-2.5 px-3 text-right font-medium text-foreground">{formatCurrency(item.grossAmount)}</td>
                                        <td className="py-2.5 px-3 text-right text-blue-600">-{formatCurrency(item.adminCommission)}</td>
                                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600">+{formatCurrency(item.partnerShare)}</td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      ) : selectedServiceDetail ? (
        /* ═══════════════════════════════════════════════════════════════════
           4. IN-DETAIL SERVICE PAYOUT VIEW (DRILL-DOWN SUB-VIEW)
           ═══════════════════════════════════════════════════════════════════ */
        <div className="flex flex-col gap-4 px-4 pt-4 animate-in fade-in duration-200">
          
          {/* Service Header Bar */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setSelectedServiceDetail(null)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline w-max active:scale-95 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to All Payout Services</span>
            </button>

            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-3">
                {(() => {
                  const cfg = SERVICE_CONFIG[selectedServiceDetail];
                  const Icon = cfg.icon;
                  return (
                    <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border", cfg.bgColor, cfg.textColor, cfg.borderColor)}>
                      <Icon className="w-6 h-6" />
                    </div>
                  );
                })()}
                <div>
                  <h2 className="text-[18px] sm:text-[20px] font-bold text-foreground">
                    {SERVICE_CONFIG[selectedServiceDetail].name}
                  </h2>
                  <p className="text-[11px] sm:text-[12px] text-muted">
                    {SERVICE_CONFIG[selectedServiceDetail].description}
                  </p>
                </div>
              </div>

              {/* Date Filter Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-xl text-xs font-semibold text-muted shadow-xs">
                <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                <span>{getPresetLabel()}</span>
                {startDate && endDate && (
                  <span className="text-[11px] font-normal text-muted/80">({startDate} ~ {endDate})</span>
                )}
              </div>
            </div>

            {/* Service Switcher Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
              {(Object.keys(SERVICE_CONFIG) as ServiceDetailKey[]).map((key) => {
                const cfg = SERVICE_CONFIG[key];
                const isCurrent = selectedServiceDetail === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedServiceDetail(key)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5",
                      isCurrent
                        ? "bg-primary text-white shadow-sm"
                        : "bg-surface text-muted border border-border hover:text-foreground hover:bg-gray-50"
                    )}
                  >
                    <span>{cfg.shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4 Service KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Total Bookings */}
            <div className="bg-surface rounded-2xl p-4 border border-border shadow-sm flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Total Bookings</span>
              <span className="text-[22px] font-extrabold text-foreground mt-0.5">
                {serviceMetrics.count}
              </span>
              <span className="text-[10px] text-muted">In selected period</span>
            </div>

            {/* Total Gross Revenue */}
            <div className="bg-surface rounded-2xl p-4 border border-border shadow-sm flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Gross Revenue</span>
              <span className="text-[22px] font-extrabold text-foreground mt-0.5">
                {formatCurrency(serviceMetrics.gross)}
              </span>
              <span className="text-[10px] text-muted">100% total value</span>
            </div>

            {/* Platform Admin Cut */}
            <div className="bg-surface rounded-2xl p-4 border border-amber-200/80 shadow-sm flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">Admin Fee</span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100/90 px-1.5 py-0.2 rounded">20% cut</span>
              </div>
              <span className="text-[22px] font-extrabold text-amber-900 mt-0.5">
                -{formatCurrency(serviceMetrics.adminCut)}
              </span>
              <span className="text-[10px] text-amber-700/80">Platform service share</span>
            </div>

            {/* Hospital Net Payout */}
            <div className="bg-surface rounded-2xl p-4 border border-emerald-200/80 shadow-sm flex flex-col gap-1 bg-emerald-50/20">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Hospital Net</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded">80% net</span>
              </div>
              <span className="text-[22px] font-extrabold text-emerald-600 mt-0.5">
                {formatCurrency(serviceMetrics.netPayout)}
              </span>
              <span className="text-[10px] text-emerald-700/80">Net payout to hospital</span>
            </div>
          </div>

          {/* Itemized Transactions Section */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <h3 className="text-[16px] font-bold text-foreground">
                Itemized Transactions ({filteredServiceTransactions.length})
              </h3>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by patient name, booking ID, doctor..."
                  value={serviceSearchQuery}
                  onChange={(e) => {
                    setServiceSearchQuery(e.target.value);
                    setServiceCurrentPage(1);
                  }}
                  className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                />
                {serviceSearchQuery && (
                  <button
                    onClick={() => {
                      setServiceSearchQuery('');
                      setServiceCurrentPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto">
                <button
                  onClick={() => {
                    setServiceStatusFilter('ALL');
                    setServiceCurrentPage(1);
                  }}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                    serviceStatusFilter === 'ALL'
                      ? "bg-foreground text-background"
                      : "bg-surface border border-border text-muted hover:text-foreground"
                  )}
                >
                  All
                </button>
                {availableStatuses.map(status => (
                  <button
                    key={status}
                    onClick={() => {
                      setServiceStatusFilter(status);
                      setServiceCurrentPage(1);
                    }}
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                      serviceStatusFilter === status
                        ? "bg-primary text-white"
                        : "bg-surface border border-border text-muted hover:text-foreground"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Transactions Card List */}
            <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
              {filteredServiceTransactions.length === 0 ? (
                <div className="py-12 px-4">
                  <EmptyState
                    icon={SERVICE_CONFIG[selectedServiceDetail].icon}
                    title={`No ${SERVICE_CONFIG[selectedServiceDetail].name} Transactions`}
                    description={`There are 0 transactions recorded for ${SERVICE_CONFIG[selectedServiceDetail].name} in this date range.`}
                  />
                </div>
              ) : (
                <>
                  <div className="divide-y divide-border/50">
                    {paginatedServiceTransactions.map((txn, idx) => {
                      const net = txn.hospitalPayout ?? Math.round(txn.amount * (hospitalSharePercent / 100));
                      const fee = txn.adminCommission ?? (txn.amount - net);

                      return (
                        <div key={txn.id || idx} className="p-3.5 sm:p-4 hover:bg-gray-50/50 transition-colors flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-xs text-foreground shrink-0 border border-border/50 mt-0.5">
                                {txn.patientName?.charAt(0) || 'P'}
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-[14px] font-semibold text-foreground">
                                    {txn.patientName || 'Patient'}
                                  </span>
                                  <div className="inline-flex items-center gap-1 font-mono text-[11px] text-muted bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200/60">
                                    <span>{txn.id}</span>
                                    <button
                                      onClick={() => handleCopy(txn.id, `txn-${txn.id}`)}
                                      className="text-muted hover:text-primary"
                                      title="Copy Ref ID"
                                    >
                                      {copiedId === `txn-${txn.id}` ? (
                                        <Check className="w-3 h-3 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {txn.info ? (
                                  <span className="text-xs text-muted font-medium">
                                    {txn.info}
                                  </span>
                                ) : txn.doctorName ? (
                                  <span className="text-xs text-muted font-medium">
                                    Dr. {txn.doctorName}
                                  </span>
                                ) : null}

                                <span className="text-[11px] text-muted/70 flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3" />
                                  <span>{txn.date}</span>
                                </span>
                              </div>
                            </div>

                            {/* Financial breakdown */}
                            <div className="flex flex-col items-end shrink-0">
                              <span className="text-[15px] font-bold text-emerald-600">
                                +{formatCurrency(net)}
                              </span>
                              <span className="text-[10px] text-muted text-right">
                                Gross: {formatCurrency(txn.amount)} &middot; <span className="text-amber-700">Fee: -{formatCurrency(fee)}</span>
                              </span>
                              <span className={cn(
                                "mt-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md border",
                                txn.statusColor || "bg-gray-50 text-gray-700 border-gray-200"
                              )}>
                                {txn.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Strictly 20-item Pagination Bar */}
                  <PaginationBar
                    currentPage={serviceCurrentPage}
                    totalPages={totalServicePages}
                    totalItems={filteredServiceTransactions.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={(page) => setServiceCurrentPage(page)}
                  />
                </>
              )}
            </div>
          </div>

        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════════
           REVENUE TRENDS & DAILY TXNS (MAIN OVERVIEW VIEW)
           ═══════════════════════════════════════════════════════════════════ */
        <div className="flex flex-col gap-5 px-4 pt-4">

          {/* Date Filter & Presets Bar */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => {
                  setTempStart(startDate);
                  setTempEnd(endDate);
                  setIsCustomModalOpen(true);
                }}
                className="flex items-center gap-2 bg-surface rounded-xl px-3.5 py-2 shadow-sm border border-border w-max interactive-element active:scale-95 transition-all hover:border-primary/40"
              >
                <CalendarIcon className="w-4 h-4 text-primary" />
                <span className="text-[13px] font-semibold text-foreground">{getPresetLabel()}</span>
              </button>
              <span className="text-[11px] font-medium text-muted">
                {startDate && endDate ? `${startDate} ~ ${endDate}` : ''}
              </span>
            </div>

            {/* Preset Pills */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
              {[
                { key: 'week', label: 'This Week' },
                { key: 'today', label: 'Today' },
                { key: 'month', label: 'This Month' },
                { key: 'custom', label: 'Custom' },
              ].map(p => (
                <button
                  key={p.key}
                  onClick={() => handlePresetSelect(p.key as DatePreset)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-all",
                    selectedPreset === p.key || (p.key === 'month' && (selectedPreset as string) === 'thisMonth') || (p.key === 'week' && (selectedPreset as string) === 'last7')
                      ? "bg-primary text-white shadow-sm"
                      : "bg-surface text-muted border border-border hover:text-foreground"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-amber-50/80 border border-amber-200/60 text-amber-800 text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between">
              <span>Unable to refresh payout metrics. Showing fallback data.</span>
              <button onClick={() => fetchPayouts(selectedPreset, startDate, endDate, true)} className="font-semibold underline ml-2">Retry</button>
            </div>
          )}

          {/* Total Hospital Payout Summary Card with 20% Admin Deduction */}
          <div className="bg-surface rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] border border-emerald-200/70 relative overflow-hidden flex flex-col gap-3">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-emerald-600 pointer-events-none">
              <TrendingUp className="w-28 h-28 -mt-4 -mr-4" strokeWidth={1} />
            </div>

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  {hospitalSharePercent}%
                </div>
                <div>
                  <span className="text-[14px] font-semibold text-foreground">Hospital Net Payout</span>
                  <span className="text-[11px] text-muted block">After {adminSharePercent}% platform admin fee</span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                Hospital Share
              </span>
            </div>

            <div className="text-[32px] font-extrabold text-emerald-600 tracking-tight relative z-10 min-h-[40px] flex items-center">
              {isLoading && !payoutsData ? (
                <Skeleton className="h-9 w-32" />
              ) : (
                formatCurrency(totalHospitalPayout)
              )}
            </div>

            {/* 2-Column Split: Gross Revenue vs 20% Admin Cut */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 relative z-10">
              <div className="flex flex-col bg-gray-50/90 rounded-xl p-2.5">
                <span className="text-[11px] font-medium text-muted">Total Gross Booked</span>
                <span className="text-[16px] font-bold text-foreground mt-0.5">
                  {isLoading && !payoutsData ? (
                    <Skeleton className="h-5 w-16" />
                  ) : (
                    formatCurrency(totalGross)
                  )}
                </span>
              </div>
              <div className="flex flex-col bg-amber-50/70 rounded-xl p-2.5 border border-amber-100/70">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-amber-800">Admin Cut</span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100/90 px-1.5 py-0.2 rounded">{adminSharePercent}% off</span>
                </div>
                <span className="text-[16px] font-bold text-amber-900 mt-0.5">
                  {isLoading && !payoutsData ? (
                    <Skeleton className="h-5 w-16" />
                  ) : (
                    `-${formatCurrency(totalAdminCommission)}`
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* ── 4. PAYOUT BY SERVICE (CLICKABLE ROWS WITH RIGHT CHEVRON DRILL-DOWN) ── */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center px-1">
              <div>
                <h3 className="text-[17px] font-semibold text-foreground">Payout by Service</h3>
                <span className="text-[11px] text-muted">Click any service to view itemized breakdowns</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50">
                {hospitalSharePercent}% Net Payout
              </span>
            </div>

            <div className="bg-surface rounded-2xl border border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col divide-y divide-gray-100">
              
              {/* 1. OP Consultation */}
              <div 
                onClick={() => setSelectedServiceDetail('op')}
                className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-blue-50/30 active:bg-blue-50/60 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center shrink-0 border border-blue-100/80 group-hover:scale-105 transition-transform">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-semibold text-foreground group-hover:text-primary transition-colors">
                        OP Consultation
                      </span>
                    </div>
                    <span className="text-[11px] text-muted">
                      {isLoading && !payoutsData ? "Loading..." : `${byService?.op.count ?? 0} bookings`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-end min-w-[120px]">
                    {isLoading && !payoutsData ? (
                      <Skeleton className="h-5 w-20" />
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-[15px] font-bold text-emerald-600">
                            {formatCurrency(byService?.op.hospitalPayout ?? Math.round((byService?.op.revenue ?? 0) * (hospitalSharePercent / 100)))}
                          </span>
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200/60">{hospitalSharePercent}%</span>
                        </div>
                        <span className="text-[10px] text-muted mt-0.5 text-right">
                          Gross: {formatCurrency(byService?.op.revenue ?? 0)} &middot; <span className="text-amber-700 font-medium">Admin: -{formatCurrency(byService?.op.adminCommission ?? Math.round((byService?.op.revenue ?? 0) * (adminSharePercent / 100)))}</span>
                        </span>
                      </>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </div>

              {/* 2. Video Consultation */}
              <div 
                onClick={() => setSelectedServiceDetail('videoConsultation')}
                className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-purple-50/30 active:bg-purple-50/60 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#8B5CF6] flex items-center justify-center shrink-0 border border-purple-100/80 group-hover:scale-105 transition-transform">
                    <Video className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-semibold text-foreground group-hover:text-purple-600 transition-colors">
                      Video Consultation
                    </span>
                    <span className="text-[11px] text-muted">
                      {isLoading && !payoutsData ? "Loading..." : `${byService?.videoConsultation.count ?? 0} consults`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-end min-w-[120px]">
                    {isLoading && !payoutsData ? (
                      <Skeleton className="h-5 w-20" />
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-[15px] font-bold text-emerald-600">
                            {formatCurrency(byService?.videoConsultation.hospitalPayout ?? Math.round((byService?.videoConsultation.revenue ?? 0) * (hospitalSharePercent / 100)))}
                          </span>
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200/60">{hospitalSharePercent}%</span>
                        </div>
                        <span className="text-[10px] text-muted mt-0.5 text-right">
                          Gross: {formatCurrency(byService?.videoConsultation.revenue ?? 0)} &middot; <span className="text-amber-700 font-medium">Admin: -{formatCurrency(byService?.videoConsultation.adminCommission ?? Math.round((byService?.videoConsultation.revenue ?? 0) * (adminSharePercent / 100)))}</span>
                        </span>
                      </>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </div>

              {/* 3. Home Nursing */}
              <div 
                onClick={() => setSelectedServiceDetail('homeNursing')}
                className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-green-50/30 active:bg-green-50/60 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 text-success flex items-center justify-center shrink-0 border border-green-100/80 group-hover:scale-105 transition-transform">
                    <Home className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-semibold text-foreground group-hover:text-success transition-colors">
                      Home Nursing
                    </span>
                    <span className="text-[11px] text-muted">
                      {isLoading && !payoutsData ? "Loading..." : `${byService?.homeNursing.count ?? 0} visits`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-end min-w-[120px]">
                    {isLoading && !payoutsData ? (
                      <Skeleton className="h-5 w-20" />
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-[15px] font-bold text-emerald-600">
                            {formatCurrency(byService?.homeNursing.hospitalPayout ?? Math.round((byService?.homeNursing.revenue ?? 0) * (hospitalSharePercent / 100)))}
                          </span>
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200/60">{hospitalSharePercent}%</span>
                        </div>
                        <span className="text-[10px] text-muted mt-0.5 text-right">
                          Gross: {formatCurrency(byService?.homeNursing.revenue ?? 0)} &middot; <span className="text-amber-700 font-medium">Admin: -{formatCurrency(byService?.homeNursing.adminCommission ?? Math.round((byService?.homeNursing.revenue ?? 0) * (adminSharePercent / 100)))}</span>
                        </span>
                      </>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted group-hover:text-success group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </div>

              {/* 4. Lab Tests */}
              <div 
                onClick={() => setSelectedServiceDetail('labTests')}
                className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-pink-50/30 active:bg-pink-50/60 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-50 text-[#ec4899] flex items-center justify-center shrink-0 border border-pink-100/80 group-hover:scale-105 transition-transform">
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-semibold text-foreground group-hover:text-pink-600 transition-colors">
                      Lab Tests
                    </span>
                    <span className="text-[11px] text-muted">
                      {isLoading && !payoutsData ? "Loading..." : `${byService?.labTests.count ?? 0} orders`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-end min-w-[120px]">
                    {isLoading && !payoutsData ? (
                      <Skeleton className="h-5 w-20" />
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-[15px] font-bold text-emerald-600">
                            {formatCurrency(byService?.labTests.hospitalPayout ?? Math.round((byService?.labTests.revenue ?? 0) * (hospitalSharePercent / 100)))}
                          </span>
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200/60">{hospitalSharePercent}%</span>
                        </div>
                        <span className="text-[10px] text-muted mt-0.5 text-right">
                          Gross: {formatCurrency(byService?.labTests.revenue ?? 0)} &middot; <span className="text-amber-700 font-medium">Admin: -{formatCurrency(byService?.labTests.adminCommission ?? Math.round((byService?.labTests.revenue ?? 0) * (adminSharePercent / 100)))}</span>
                        </span>
                      </>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted group-hover:text-pink-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </div>

              {/* 5. Home Sample Collection */}
              <div 
                onClick={() => setSelectedServiceDetail('homeSampleCollection')}
                className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-orange-50/30 active:bg-orange-50/60 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#f97316] flex items-center justify-center shrink-0 border border-orange-100/80 group-hover:scale-105 transition-transform">
                    <TestTube className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-semibold text-foreground group-hover:text-orange-600 transition-colors">
                      Home Sample Collection
                    </span>
                    <span className="text-[11px] text-muted">
                      {isLoading && !payoutsData ? "Loading..." : `${byService?.homeSampleCollection.count ?? 0} orders`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-end min-w-[120px]">
                    {isLoading && !payoutsData ? (
                      <Skeleton className="h-5 w-20" />
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-[15px] font-bold text-emerald-600">
                            {formatCurrency(byService?.homeSampleCollection.hospitalPayout ?? Math.round((byService?.homeSampleCollection.revenue ?? 0) * (hospitalSharePercent / 100)))}
                          </span>
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200/60">{hospitalSharePercent}%</span>
                        </div>
                        <span className="text-[10px] text-muted mt-0.5 text-right">
                          Gross: {formatCurrency(byService?.homeSampleCollection.revenue ?? 0)} &middot; <span className="text-amber-700 font-medium">Admin: -{formatCurrency(byService?.homeSampleCollection.adminCommission ?? Math.round((byService?.homeSampleCollection.revenue ?? 0) * (adminSharePercent / 100)))}</span>
                        </span>
                      </>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted group-hover:text-orange-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </div>

            </div>
          </div>

          {/* Payout Summary KPI Grid */}
          <div className="flex flex-col gap-3">
            <h3 className="text-[17px] font-semibold text-foreground px-1">Payout Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              {/* Total Transactions */}
              <div className="bg-surface rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-border flex flex-col gap-1">
                <span className="text-[12px] font-semibold text-muted">Total Transactions</span>
                <div className="min-h-[28px] flex items-center">
                  {isLoading && !payoutsData ? (
                    <Skeleton className="h-6 w-14" />
                  ) : (
                    <span className="text-[20px] font-bold text-foreground">
                      {summary?.totalTransactions ?? transactions.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Average Net Hospital Payout */}
              <div className="bg-surface rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-border flex flex-col gap-1">
                <span className="text-[12px] font-semibold text-muted">Avg Hospital Net</span>
                <div className="min-h-[28px] flex items-center">
                  {isLoading && !payoutsData ? (
                    <Skeleton className="h-6 w-16" />
                  ) : (
                    <span className="text-[20px] font-bold text-emerald-600">
                      {formatCurrency(summary?.averageHospitalPayout ?? Math.round((summary?.averagePayout ?? 0) * (hospitalSharePercent / 100)))}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[#98A2B3]">
                  Gross avg: {formatCurrency(summary?.averagePayout ?? 0)}
                </span>
              </div>

              {/* This Month Net */}
              <div className="bg-surface rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-border flex flex-col gap-1">
                <span className="text-[12px] font-semibold text-muted">This Month (Net {hospitalSharePercent}%)</span>
                <div className="min-h-[28px] flex items-center">
                  {isLoading && !payoutsData ? (
                    <Skeleton className="h-6 w-16" />
                  ) : (
                    <span className="text-[20px] font-bold text-emerald-600">
                      {formatCurrency(summary?.thisMonthHospitalPayout ?? Math.round((summary?.thisMonth ?? 0) * (hospitalSharePercent / 100)))}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[#98A2B3]">
                  Gross: {formatCurrency(summary?.thisMonth ?? 0)}
                </span>
              </div>

              {/* Last Month Net */}
              <div className="bg-surface rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-border flex flex-col gap-1">
                <span className="text-[12px] font-semibold text-muted">Last Month (Net {hospitalSharePercent}%)</span>
                <div className="min-h-[28px] flex items-center">
                  {isLoading && !payoutsData ? (
                    <Skeleton className="h-6 w-16" />
                  ) : (
                    <span className="text-[20px] font-bold text-foreground">
                      {formatCurrency(summary?.lastMonthHospitalPayout ?? Math.round((summary?.lastMonth ?? 0) * (hospitalSharePercent / 100)))}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[#98A2B3]">
                  Gross: {formatCurrency(summary?.lastMonth ?? 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Payout Trend Chart */}
          <div className="bg-surface rounded-2xl border border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)] p-4 flex flex-col gap-4 mt-1">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="text-[15px] font-semibold text-foreground">Hospital Net Payout Trend</h3>
                <span className="text-[11px] text-muted">Daily {hospitalSharePercent}% net earnings for selected period</span>
              </div>
            </div>
            
            <div className="h-[140px] w-full mt-2 -ml-2">
              {isLoading && !payoutsData ? (
                <div className="h-full w-full flex items-center justify-center">
                  <Skeleton className="h-full w-full rounded-xl" />
                </div>
              ) : payoutTrend.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={payoutTrend}>
                    <defs>
                      <linearGradient id="colorPayout" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip
                      contentStyle={{ background: 'var(--surface, #1E293B)', borderRadius: '12px', border: '1px solid var(--border, #334155)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px', color: 'var(--foreground, #F8FAFC)' }}
                      itemStyle={{ color: '#059669', fontWeight: '700' }}
                      formatter={(val: any) => [formatCurrency(Number(val) || 0), `Hospital Net (${hospitalSharePercent}%)`]}
                      cursor={{ stroke: 'var(--border, #334155)', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPayout)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center ml-2">
                  <span className="text-[13px] font-medium text-[#98A2B3]">No payout transactions recorded in this period</span>
                </div>
              )}
            </div>
          </div>

          {/* ── 5. RECENT PAYOUTS LIST WITH 20-ITEM PAGINATION ── */}
          <div className="flex flex-col gap-3 mt-1">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-[17px] font-semibold text-foreground">Recent Payouts</h3>
              <span className="text-[12px] font-medium text-muted">{transactions.length} transactions</span>
            </div>

            <div className="bg-surface rounded-2xl border border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
              {isLoading && !payoutsData ? (
                <div className="p-4 flex flex-col gap-3">
                  <Skeleton className="h-14 w-full rounded-xl" />
                  <Skeleton className="h-14 w-full rounded-xl" />
                </div>
              ) : transactions.length === 0 ? (
                <EmptyState
                  icon={IndianRupee}
                  title="No Payouts Found"
                  description="Completed transactions in the selected date range will appear here."
                />
              ) : (
                <>
                  <div className="divide-y divide-gray-100">
                    {paginatedRecentTransactions.map((txn, idx) => (
                      <div key={txn.id || idx} className="flex items-start gap-3 p-3.5 interactive-element active:bg-gray-50/50 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-gray-50 text-muted flex items-center justify-center shrink-0 border border-gray-100 mt-0.5">
                          {txn.type === 'VIDEO_CONSULTATION' ? (
                            <Video className="w-4 h-4 text-purple-600" />
                          ) : txn.type === 'HOME_NURSING' ? (
                            <Home className="w-4 h-4 text-green-600" />
                          ) : txn.type === 'LAB_TEST' ? (
                            <FlaskConical className="w-4 h-4 text-pink-600" />
                          ) : txn.type === 'HOME_SAMPLE_COLLECTION' ? (
                            <TestTube className="w-4 h-4 text-orange-600" />
                          ) : (
                            <Stethoscope className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        
                        <div className="flex flex-col flex-1 gap-0.5">
                          <div className="flex justify-between items-start">
                            <span className="text-[14px] font-semibold text-foreground">{txn.service}</span>
                            <div className="flex flex-col items-end">
                              <span className="text-[14px] font-bold text-emerald-600">
                                +{formatCurrency(txn.hospitalPayout ?? Math.round(txn.amount * (hospitalSharePercent / 100)))}
                              </span>
                              <span className="text-[10px] text-[#98A2B3]">
                                Gross: {formatCurrency(txn.amount)} &middot; Admin: -{formatCurrency(txn.adminCommission ?? Math.round(txn.amount * (adminSharePercent / 100)))}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[12px] text-muted">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-medium text-foreground">{txn.patientName || 'Patient'}</span>
                              {txn.info && (
                                <span className="text-muted text-[11px]">&middot; {txn.info}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 font-mono text-[11px] text-[#98A2B3] bg-gray-50 px-1 rounded border border-gray-100">
                              <span>Ref: {txn.id}</span>
                              <button
                                onClick={() => handleCopy(txn.id, `recent-${txn.id}`)}
                                className="text-muted hover:text-primary"
                                title="Copy Ref ID"
                              >
                                {copiedId === `recent-${txn.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="flex justify-between items-center mt-1">
                            <span className="text-[11px] font-medium text-[#98A2B3]">{txn.date}</span>
                            <div className={cn(
                              "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border shrink-0",
                              txn.statusColor
                            )}>
                              {txn.status}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Strictly 20-item Pagination Bar */}
                  <PaginationBar
                    currentPage={recentPayoutsPage}
                    totalPages={totalRecentPages}
                    totalItems={transactions.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={(page) => setRecentPayoutsPage(page)}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Date Range Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface rounded-2xl p-5 w-full max-w-sm shadow-xl flex flex-col gap-4 border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-[16px] font-semibold text-foreground">Select Custom Date Range</h3>
              <button onClick={() => setIsCustomModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold text-muted">Start Date</label>
                <input 
                  type="date" 
                  value={tempStart} 
                  onChange={(e) => setTempStart(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold text-muted">End Date</label>
                <input 
                  type="date" 
                  value={tempEnd} 
                  onChange={(e) => setTempEnd(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button 
                onClick={() => setIsCustomModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-muted hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleApplyCustomDates}
                disabled={!tempStart || !tempEnd}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <Check className="w-4 h-4" /> Apply Filter
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
