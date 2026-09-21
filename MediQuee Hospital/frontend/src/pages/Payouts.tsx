import { useState, useEffect, useCallback } from "react"
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
  Percent
} from "lucide-react"
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts'
import { cn } from "@/lib/utils"
import { EmptyState } from "../components/ui/EmptyState"
import { Skeleton } from "../components/ui/Skeleton"
import { payoutsApi, type PayoutsResponse } from "../services/payoutsApi"
import { useTranslation } from "react-i18next"

type DatePreset = 'thisMonth' | 'today' | 'last7' | 'last30' | 'custom';

export function Payouts() {
  const { t } = useTranslation();
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>('thisMonth');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Custom date picker modal state
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [tempStart, setTempStart] = useState<string>('');
  const [tempEnd, setTempEnd] = useState<string>('');

  const [payoutsData, setPayoutsData] = useState<PayoutsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to calculate preset dates safely without UTC day-shifts
  const calculatePresetDates = useCallback((preset: DatePreset) => {
    const now = new Date();
    const toYMD = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === 'today') {
      const todayStr = toYMD(now);
      return { start: todayStr, end: todayStr };
    }
    if (preset === 'last7') {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      return { start: toYMD(sevenDaysAgo), end: toYMD(now) };
    }
    if (preset === 'last30') {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return { start: toYMD(thirtyDaysAgo), end: toYMD(now) };
    }
    // Default: 'thisMonth'
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start: toYMD(startOfMonth), end: toYMD(endOfMonth) };
  }, []);

  // Fetch payouts data
  const fetchPayouts = useCallback(async (start?: string, end?: string, showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const data = await payoutsApi.getPayouts(start || undefined, end || undefined);
      setPayoutsData(data);
    } catch (err: any) {
      console.error("Failed to load payouts data:", err);
      setError(err?.message || "Failed to load financial data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load initial data for current month
  useEffect(() => {
    const { start, end } = calculatePresetDates('thisMonth');
    setStartDate(start);
    setEndDate(end);
    fetchPayouts(start, end, true);
  }, [calculatePresetDates, fetchPayouts]);

  // Handle selecting preset
  const handlePresetSelect = (preset: DatePreset) => {
    setSelectedPreset(preset);
    if (preset === 'custom') {
      setTempStart(startDate);
      setTempEnd(endDate);
      setIsCustomModalOpen(true);
    } else {
      const { start, end } = calculatePresetDates(preset);
      setStartDate(start);
      setEndDate(end);
      fetchPayouts(start, end, true);
    }
  };

  const handleApplyCustomDates = () => {
    if (!tempStart || !tempEnd) return;
    setStartDate(tempStart);
    setEndDate(tempEnd);
    setIsCustomModalOpen(false);
    fetchPayouts(tempStart, tempEnd, true);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const getPresetLabel = () => {
    if (selectedPreset === 'thisMonth') return 'This Month';
    if (selectedPreset === 'today') return 'Today';
    if (selectedPreset === 'last7') return 'Last 7 Days';
    if (selectedPreset === 'last30') return 'Last 30 Days';
    return `${startDate} to ${endDate}`;
  };

  const payoutTrend = payoutsData?.payoutTrend || [];
  const transactions = payoutsData?.recentTransactions || [];
  const byService = payoutsData?.byService;
  const summary = payoutsData?.payoutSummary;

  // 20% Admin deduction calculations
  const totalGross = payoutsData?.totalGross ?? payoutsData?.totalPayout ?? 0;
  const totalAdminCommission = payoutsData?.totalAdminCommission ?? Math.round(totalGross * 0.20);
  const totalHospitalPayout = payoutsData?.totalHospitalPayout ?? (totalGross - totalAdminCommission);

  return (
    <div className="flex flex-col bg-background min-h-full pb-32 sm:pb-36">
      
      {/* Sticky Top Controls */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-4 pb-3 px-4 flex justify-between items-center border-b border-border shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div>
          <h1 className="text-[22px] font-semibold text-foreground">{t('payout')}</h1>
          <span className="text-[12px] text-muted font-medium">Hospital Share: 80% &middot; Platform Fee: 20%</span>
        </div>
        <button 
          onClick={() => fetchPayouts(startDate, endDate, true)}
          disabled={isLoading}
          className="p-2 -mr-2 text-foreground hover:text-primary active:scale-95 transition-all"
          title="Refresh data"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin text-primary' : ''}`} />
        </button>
      </div>

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
              { key: 'thisMonth', label: 'This Month' },
              { key: 'today', label: 'Today' },
              { key: 'last7', label: 'Last 7 Days' },
              { key: 'last30', label: 'Last 30 Days' },
              { key: 'custom', label: 'Custom' },
            ].map(p => (
              <button
                key={p.key}
                onClick={() => handlePresetSelect(p.key as DatePreset)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-all",
                  selectedPreset === p.key
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
            <button onClick={() => fetchPayouts(startDate, endDate, true)} className="font-semibold underline ml-2">Retry</button>
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
                80%
              </div>
              <div>
                <span className="text-[14px] font-semibold text-foreground">Hospital Net Payout</span>
                <span className="text-[11px] text-muted block">After 20% platform admin fee</span>
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
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100/90 px-1.5 py-0.2 rounded">20% off</span>
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

        {/* Payout by Service with 20% Admin Deduction */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[17px] font-semibold text-foreground">Payout by Service</h3>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50">
              80% Net Payout
            </span>
          </div>

          <div className="bg-surface rounded-2xl border border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
            
            {/* 1. OP */}
            <div className="flex items-center justify-between p-3.5 border-b border-gray-100 last:border-0 interactive-element active:bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center shrink-0">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-semibold text-foreground">OP Consultation</span>
                  <span className="text-[11px] text-muted">
                    {isLoading && !payoutsData ? "Loading..." : `${byService?.op.count ?? 0} bookings`}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end min-w-[120px]">
                {isLoading && !payoutsData ? (
                  <Skeleton className="h-5 w-20" />
                ) : (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[15px] font-bold text-emerald-600">
                        {formatCurrency(byService?.op.hospitalPayout ?? Math.round((byService?.op.revenue ?? 0) * 0.8))}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200/60">80%</span>
                    </div>
                    <span className="text-[10px] text-muted mt-0.5 text-right">
                      Gross: {formatCurrency(byService?.op.revenue ?? 0)} &middot; <span className="text-amber-700 font-medium">Admin: -{formatCurrency(byService?.op.adminCommission ?? Math.round((byService?.op.revenue ?? 0) * 0.2))}</span>
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* 2. Video Consultation */}
            <div className="flex items-center justify-between p-3.5 border-b border-gray-100 last:border-0 interactive-element active:bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#8B5CF6] flex items-center justify-center shrink-0">
                  <Video className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-semibold text-foreground">Video Consultation</span>
                  <span className="text-[11px] text-muted">
                    {isLoading && !payoutsData ? "Loading..." : `${byService?.videoConsultation.count ?? 0} consults`}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end min-w-[120px]">
                {isLoading && !payoutsData ? (
                  <Skeleton className="h-5 w-20" />
                ) : (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[15px] font-bold text-emerald-600">
                        {formatCurrency(byService?.videoConsultation.hospitalPayout ?? Math.round((byService?.videoConsultation.revenue ?? 0) * 0.8))}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200/60">80%</span>
                    </div>
                    <span className="text-[10px] text-muted mt-0.5 text-right">
                      Gross: {formatCurrency(byService?.videoConsultation.revenue ?? 0)} &middot; <span className="text-amber-700 font-medium">Admin: -{formatCurrency(byService?.videoConsultation.adminCommission ?? Math.round((byService?.videoConsultation.revenue ?? 0) * 0.2))}</span>
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* 3. Home Nursing */}
            <div className="flex items-center justify-between p-3.5 border-b border-gray-100 last:border-0 interactive-element active:bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 text-success flex items-center justify-center shrink-0">
                  <Home className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-semibold text-foreground">Home Nursing</span>
                  <span className="text-[11px] text-muted">
                    {isLoading && !payoutsData ? "Loading..." : `${byService?.homeNursing.count ?? 0} visits`}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end min-w-[120px]">
                {isLoading && !payoutsData ? (
                  <Skeleton className="h-5 w-20" />
                ) : (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[15px] font-bold text-emerald-600">
                        {formatCurrency(byService?.homeNursing.hospitalPayout ?? Math.round((byService?.homeNursing.revenue ?? 0) * 0.8))}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200/60">80%</span>
                    </div>
                    <span className="text-[10px] text-muted mt-0.5 text-right">
                      Gross: {formatCurrency(byService?.homeNursing.revenue ?? 0)} &middot; <span className="text-amber-700 font-medium">Admin: -{formatCurrency(byService?.homeNursing.adminCommission ?? Math.round((byService?.homeNursing.revenue ?? 0) * 0.2))}</span>
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* 4. Lab Tests */}
            <div className="flex items-center justify-between p-3.5 border-b border-gray-100 last:border-0 interactive-element active:bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-50 text-[#ec4899] flex items-center justify-center shrink-0">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-semibold text-foreground">Lab Tests</span>
                  <span className="text-[11px] text-muted">
                    {isLoading && !payoutsData ? "Loading..." : `${byService?.labTests.count ?? 0} orders`}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end min-w-[120px]">
                {isLoading && !payoutsData ? (
                  <Skeleton className="h-5 w-20" />
                ) : (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[15px] font-bold text-emerald-600">
                        {formatCurrency(byService?.labTests.hospitalPayout ?? Math.round((byService?.labTests.revenue ?? 0) * 0.8))}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200/60">80%</span>
                    </div>
                    <span className="text-[10px] text-muted mt-0.5 text-right">
                      Gross: {formatCurrency(byService?.labTests.revenue ?? 0)} &middot; <span className="text-amber-700 font-medium">Admin: -{formatCurrency(byService?.labTests.adminCommission ?? Math.round((byService?.labTests.revenue ?? 0) * 0.2))}</span>
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* 5. Home Sample Collection */}
            <div className="flex items-center justify-between p-3.5 border-b border-gray-100 last:border-0 interactive-element active:bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#f97316] flex items-center justify-center shrink-0">
                  <TestTube className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-semibold text-foreground line-clamp-1">Home Sample Collection</span>
                  <span className="text-[11px] text-muted">
                    {isLoading && !payoutsData ? "Loading..." : `${byService?.homeSampleCollection.count ?? 0} orders`}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end min-w-[120px]">
                {isLoading && !payoutsData ? (
                  <Skeleton className="h-5 w-20" />
                ) : (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[15px] font-bold text-emerald-600">
                        {formatCurrency(byService?.homeSampleCollection.hospitalPayout ?? Math.round((byService?.homeSampleCollection.revenue ?? 0) * 0.8))}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200/60">80%</span>
                    </div>
                    <span className="text-[10px] text-muted mt-0.5 text-right">
                      Gross: {formatCurrency(byService?.homeSampleCollection.revenue ?? 0)} &middot; <span className="text-amber-700 font-medium">Admin: -{formatCurrency(byService?.homeSampleCollection.adminCommission ?? Math.round((byService?.homeSampleCollection.revenue ?? 0) * 0.2))}</span>
                    </span>
                  </>
                )}
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
                    {summary?.totalTransactions ?? 0}
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
                    {formatCurrency(summary?.averageHospitalPayout ?? Math.round((summary?.averagePayout ?? 0) * 0.8))}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-[#98A2B3]">
                Gross avg: {formatCurrency(summary?.averagePayout ?? 0)}
              </span>
            </div>

            {/* This Month Net */}
            <div className="bg-surface rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-border flex flex-col gap-1">
              <span className="text-[12px] font-semibold text-muted">This Month (Net 80%)</span>
              <div className="min-h-[28px] flex items-center">
                {isLoading && !payoutsData ? (
                  <Skeleton className="h-6 w-16" />
                ) : (
                  <span className="text-[20px] font-bold text-emerald-600">
                    {formatCurrency(summary?.thisMonthHospitalPayout ?? Math.round((summary?.thisMonth ?? 0) * 0.8))}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-[#98A2B3]">
                Gross: {formatCurrency(summary?.thisMonth ?? 0)}
              </span>
            </div>

            {/* Last Month Net */}
            <div className="bg-surface rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-border flex flex-col gap-1">
              <span className="text-[12px] font-semibold text-muted">Last Month (Net 80%)</span>
              <div className="min-h-[28px] flex items-center">
                {isLoading && !payoutsData ? (
                  <Skeleton className="h-6 w-16" />
                ) : (
                  <span className="text-[20px] font-bold text-foreground">
                    {formatCurrency(summary?.lastMonthHospitalPayout ?? Math.round((summary?.lastMonth ?? 0) * 0.8))}
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
              <span className="text-[11px] text-muted">Daily 80% net earnings for selected period</span>
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
                    formatter={(val: any) => [formatCurrency(Number(val) || 0), 'Hospital Net (80%)']}
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

        {/* Recent Payouts List */}
        <div className="flex flex-col gap-3 mt-1">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[17px] font-semibold text-foreground">Recent Payouts</h3>
            <span className="text-[12px] font-medium text-muted">{transactions.length} transactions</span>
          </div>

          <div className="bg-surface rounded-2xl border border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
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
            ) : transactions.map((txn, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3.5 border-b border-gray-100 last:border-0 interactive-element active:bg-gray-50/50 transition-colors">
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
                        +{formatCurrency(txn.hospitalPayout ?? Math.round(txn.amount * 0.8))}
                      </span>
                      <span className="text-[10px] text-[#98A2B3]">
                        Gross: {formatCurrency(txn.amount)} &middot; Admin: -{formatCurrency(txn.adminCommission ?? Math.round(txn.amount * 0.2))}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[12px] text-muted">
                    <span>{txn.patientName || 'Patient'}</span>
                    <span className="text-[11px] text-[#98A2B3]">Ref: {txn.id}</span>
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
        </div>
        
      </div>

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
