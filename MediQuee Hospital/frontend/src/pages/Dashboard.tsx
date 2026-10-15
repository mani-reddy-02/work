import { useState, useEffect, useCallback, useMemo } from "react"
import { 
  Clock, 
  Users, 
  IndianRupee, 
  Calendar, 
  FileText, 
  Stethoscope, 
  MoreVertical, 
  RefreshCw, 
  CheckCircle2, 
  ChevronRight, 
  Check, 
  X,
  TrendingUp
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import { useNavigate } from "react-router-dom"
import { PromoCarousel } from "../components/PromoCarousel"
import { EmptyState } from "../components/ui/EmptyState"
import { Skeleton } from "../components/ui/Skeleton"
import { useAuth } from "@/context/AuthContext"
import { useTranslation } from "react-i18next"
import { 
  dashboardApi, 
  type DashboardOverview, 
  type RevenueAnalyticsResponse 
} from "../services/dashboardApi"
import { cn } from "@/lib/utils"

type RevenueTimeframe = 'today' | 'week' | 'month' | 'custom';

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  // Overview metrics state
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Revenue analytics state
  const [timeframe, setTimeframe] = useState<RevenueTimeframe>('week');
  const [revenueAnalytics, setRevenueAnalytics] = useState<RevenueAnalyticsResponse | null>(null);
  const [isRevenueLoading, setIsRevenueLoading] = useState<boolean>(true);
  const [revenueError, setRevenueError] = useState<string | null>(null);

  // Custom date picker modal state
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [tempStart, setTempStart] = useState<string>('');
  const [tempEnd, setTempEnd] = useState<string>('');

  // Fetch standard overview counters (Live metrics)
  const fetchOverview = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const data = await dashboardApi.getOverview();
      setOverview(data);
    } catch (err: any) {
      console.error("Failed to load dashboard overview:", err);
      setError(err?.message || "Failed to load live metrics");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch dedicated revenue analytics based on range
  const fetchRevenueAnalytics = useCallback(async (
    range: RevenueTimeframe,
    sDate?: string,
    eDate?: string
  ) => {
    setIsRevenueLoading(true);
    setRevenueError(null);
    try {
      const data = await dashboardApi.getRevenueAnalytics({
        range,
        startDate: range === 'custom' ? sDate : undefined,
        endDate: range === 'custom' ? eDate : undefined
      });
      setRevenueAnalytics(data);
    } catch (err: any) {
      console.error("Failed to load revenue analytics:", err);
      setRevenueError(err?.message || "Failed to load revenue analytics");
    } finally {
      setIsRevenueLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(() => {
      fetchOverview(false);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchOverview]);

  useEffect(() => {
    if (timeframe !== 'custom') {
      fetchRevenueAnalytics(timeframe);
    } else if (customStartDate && customEndDate) {
      fetchRevenueAnalytics('custom', customStartDate, customEndDate);
    }
  }, [timeframe, customStartDate, customEndDate, fetchRevenueAnalytics]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatYAxisCurrency = (val: number) => {
    if (val === 0) return '₹0';
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`;
    return `₹${val}`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Quick action navigation
  const quickActions = [
    { icon: Calendar, label: t('appointments', 'Appts'), path: '/appointments', bg: 'bg-blue-50', text: 'text-primary' },
    { icon: IndianRupee, label: t('payout', 'Payout'), path: '/payouts', bg: 'bg-teal-50', text: 'text-teal-600' },
    { icon: Stethoscope, label: t('doctors', 'Doctors'), path: '/profile/staff/doctors', bg: 'bg-indigo-50', text: 'text-indigo-600' },
  ];

  // Active Date Range Badge string computation
  const activeDateRangeBadge = useMemo(() => {
    const now = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (timeframe === 'today') {
      return `Today, ${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    }

    if (timeframe === 'week') {
      const dayOfWeek = now.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
      return `${start.getDate()} ${monthNames[start.getMonth()]} – ${end.getDate()} ${monthNames[end.getMonth()]} ${end.getFullYear()}`;
    }

    if (timeframe === 'month') {
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return `1 ${monthNames[now.getMonth()]} – ${end.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    }

    if (timeframe === 'custom') {
      if (!customStartDate || !customEndDate) return "Custom Range";
      const s = new Date(customStartDate);
      const e = new Date(customEndDate);
      return `${s.getDate()} ${monthNames[s.getMonth()]} ${s.getFullYear()} – ${e.getDate()} ${monthNames[e.getMonth()]} ${e.getFullYear()}`;
    }

    return '';
  }, [timeframe, customStartDate, customEndDate]);

  // Handle switching timeframe filters
  const handleTimeframeSelect = (selected: RevenueTimeframe) => {
    if (selected === 'custom') {
      const todayStr = new Date().toISOString().split('T')[0];
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];

      setTempStart(customStartDate || weekAgoStr);
      setTempEnd(customEndDate || todayStr);
      setIsCustomModalOpen(true);
    } else {
      setTimeframe(selected);
    }
  };

  const handleApplyCustomDate = () => {
    if (tempStart && tempEnd && tempStart <= tempEnd) {
      setCustomStartDate(tempStart);
      setCustomEndDate(tempEnd);
      setTimeframe('custom');
      setIsCustomModalOpen(false);
    }
  };

  const handlePresetSelect = (daysAgo: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - daysAgo);

    setTempStart(start.toISOString().split('T')[0]);
    setTempEnd(end.toISOString().split('T')[0]);
  };

  const handleThisMonthPreset = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setTempStart(start.toISOString().split('T')[0]);
    setTempEnd(end.toISOString().split('T')[0]);
  };

  const todayAppointments = overview?.todayAppointments || [];
  const upcomingAppointments = overview?.upcomingAppointments || [];
  const [appointmentTab, setAppointmentTab] = useState<'today' | 'upcoming'>('today');

  useEffect(() => {
    if (overview && todayAppointments.length === 0 && upcomingAppointments.length > 0) {
      setAppointmentTab('upcoming');
    }
  }, [overview, todayAppointments.length, upcomingAppointments.length]);

  const activeAppointments = appointmentTab === 'today' ? todayAppointments : upcomingAppointments;

  const formatApptDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  const todayIso = new Date().toISOString().split('T')[0];
  const chartData = revenueAnalytics?.chartData || [];

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={container}
      className="flex flex-col gap-6 p-4 sm:p-6 pt-5 sm:pt-6 pb-32 sm:pb-36"
    >
      {/* Greeting & Refresh Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-semibold text-foreground">
            {getGreeting()} {user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
          </h1>
          <p className="text-[14px] text-muted">{t('dashboard_subtitle')}</p>
        </div>
        <button 
          onClick={() => {
            fetchOverview(true);
            if (timeframe === 'custom' && customStartDate && customEndDate) {
              fetchRevenueAnalytics('custom', customStartDate, customEndDate);
            } else {
              fetchRevenueAnalytics(timeframe);
            }
          }}
          disabled={isLoading || isRevenueLoading}
          aria-label="Refresh metrics"
          className="p-2.5 rounded-xl bg-surface border border-border shadow-sm text-muted hover:text-primary active:scale-95 transition-all mt-0.5 cursor-pointer"
          title="Refresh metrics"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading || isRevenueLoading ? 'animate-spin text-primary' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="bg-amber-50/80 border border-amber-200/60 text-amber-800 text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between">
          <span>Unable to refresh live metrics. Showing cached data.</span>
          <button onClick={() => fetchOverview(true)} className="font-semibold underline ml-2">Retry</button>
        </div>
      )}

      {/* Top Metric Tiles / KPI Cards with Balanced Height & Padding */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Total OPs */}
        <motion.div 
          variants={item}
          onClick={() => navigate('/appointments', { state: { date: todayIso, filter: 'ops' } })}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/appointments', { state: { date: todayIso, filter: 'ops' } }); }}
          className="bg-surface rounded-2xl p-5 sm:p-6 min-h-[125px] sm:min-h-[135px] shadow-sm border border-border/70 flex flex-col justify-between cursor-pointer hover:border-blue-300 hover:shadow-md transition-all active:scale-[0.98] group"
          title="View Today's OPs"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50/80 dark:bg-blue-900/30 text-primary rounded-xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[13px] sm:text-[14px] font-medium text-muted">{t('today_ops')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
          
          <div className="flex items-baseline gap-2 pt-2">
            {isLoading && !overview ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <span className="text-[26px] sm:text-[28px] font-bold text-foreground tracking-tight">
                  {overview?.totalOPs ?? 0}
                </span>
                {(overview?.upcomingOPs ?? 0) > 0 && (
                  <span className="text-[11px] font-semibold text-primary bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded-full border border-blue-200/50">
                    +{overview?.upcomingOPs} upcoming
                  </span>
                )}
              </>
            )}
          </div>
        </motion.div>

        {/* Card 2: Split Half: Pending & Completed OPs */}
        <motion.div 
          variants={item}
          className="bg-surface rounded-2xl p-4 sm:p-5 min-h-[125px] sm:min-h-[135px] shadow-sm border border-border/70 flex flex-col justify-between transition-all"
        >
          {/* Top Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-50/80 dark:bg-amber-900/30 text-amber-600 rounded-xl">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-[13px] sm:text-[14px] font-medium text-muted">OP Status</span>
            </div>
          </div>

          {/* Bottom Split Values: Pending & Completed */}
          <div className="grid grid-cols-2 divide-x divide-border pt-1">
            {/* Left Half: Pending OPs */}
            <div 
              onClick={(e) => {
                e.stopPropagation();
                navigate('/appointments', { state: { date: todayIso, status: 'WAITING' } });
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { 
                if (e.key === 'Enter' || e.key === ' ') {
                  navigate('/appointments', { state: { date: todayIso, status: 'WAITING' } }); 
                }
              }}
              className="flex flex-col pr-2 cursor-pointer group/pending min-w-0"
              title="View Pending OPs"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span className="text-[11px] sm:text-[12px] font-medium text-muted truncate">{t('pending')}</span>
              </div>
              <div className="pt-1">
                {isLoading && !overview ? (
                  <Skeleton className="h-8 w-10" />
                ) : (
                  <span className="text-[22px] sm:text-[24px] font-bold text-amber-600 tracking-tight">
                    {overview?.pendingOPs ?? 0}
                  </span>
                )}
              </div>
            </div>

            {/* Right Half: Completed OPs */}
            <div 
              onClick={(e) => {
                e.stopPropagation();
                navigate('/appointments', { state: { date: todayIso, status: 'COMPLETED' } });
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { 
                if (e.key === 'Enter' || e.key === ' ') {
                  navigate('/appointments', { state: { date: todayIso, status: 'COMPLETED' } }); 
                }
              }}
              className="flex flex-col pl-2.5 sm:pl-3 cursor-pointer group/completed min-w-0"
              title="View Completed OPs"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-[11px] sm:text-[12px] font-medium text-muted truncate">{t('completed')}</span>
              </div>
              <div className="pt-1">
                {isLoading && !overview ? (
                  <Skeleton className="h-8 w-10" />
                ) : (
                  <span className="text-[22px] sm:text-[24px] font-bold text-emerald-600 tracking-tight">
                    {overview?.completedOPs ?? Math.max(0, (overview?.totalOPs ?? 0) - (overview?.pendingOPs ?? 0))}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Card 3: Lab Tests */}
        <motion.div 
          variants={item}
          onClick={() => navigate('/appointments', { state: { filter: 'lab', date: todayIso } })}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/appointments', { state: { filter: 'lab', date: todayIso } }); }}
          className="bg-surface rounded-2xl p-5 sm:p-6 min-h-[125px] sm:min-h-[135px] shadow-sm border border-border/70 flex flex-col justify-between cursor-pointer hover:border-purple-300 hover:shadow-md transition-all active:scale-[0.98] group"
          title="View Lab Tests"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-50/80 dark:bg-purple-900/30 text-purple-600 rounded-xl group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 transition-colors">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-[13px] sm:text-[14px] font-medium text-muted">{t('lab_tests')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted/40 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="pt-2">
            {isLoading && !overview ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <span className="text-[26px] sm:text-[28px] font-bold text-foreground tracking-tight">
                {overview?.labTests ?? 0}
              </span>
            )}
          </div>
        </motion.div>

        {/* Card 4: Revenue Today */}
        <motion.div 
          variants={item}
          onClick={() => navigate('/payouts')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/payouts'); }}
          className="bg-surface rounded-2xl p-5 sm:p-6 min-h-[125px] sm:min-h-[135px] shadow-sm border border-border/70 flex flex-col justify-between cursor-pointer hover:border-teal-300 hover:shadow-md transition-all active:scale-[0.98] group"
          title="View Revenue & Payouts"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-teal-50/80 dark:bg-teal-900/30 text-teal-600 rounded-xl group-hover:bg-teal-100 dark:group-hover:bg-teal-900/50 transition-colors">
                <IndianRupee className="w-4 h-4" />
              </div>
              <span className="text-[13px] sm:text-[14px] font-medium text-muted">{t('revenue_today')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted/40 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="pt-2">
            {isLoading && !overview ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <span className="text-[24px] sm:text-[26px] font-bold text-foreground tracking-tight">
                {formatCurrency(overview?.revenueToday ?? 0)}
              </span>
            )}
          </div>
        </motion.div>
      </div>

      <PromoCarousel />

      {/* Revenue Section with Executive-Grade Area Chart & Interactive Date Filter */}
      <motion.div variants={item} className="bg-surface rounded-2xl border border-border/70 shadow-sm p-4 sm:p-6 flex flex-col gap-4">
        {/* Top Header: Title, Active Date Range Badge, and Filter Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3.5">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-[16px] font-bold text-foreground tracking-tight flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                {t('revenue', 'Revenue')}
              </h3>
              {/* Computed Active Date Range Badge */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50/80 dark:bg-blue-900/30 text-primary border border-blue-200/60 dark:border-blue-800/60 shadow-xs">
                <Calendar className="w-3 h-3 text-primary" />
                {activeDateRangeBadge}
              </span>
            </div>
            <span className="text-[12px] text-muted">Complete revenue across OP, Video, Lab & Home Services</span>
          </div>

          {/* Interactive Filter Pills */}
          <div className="flex items-center gap-1 bg-gray-100/80 dark:bg-slate-800/80 p-1 rounded-xl border border-border/80 self-start sm:self-auto overflow-x-auto max-w-full">
            {(['week', 'today', 'month', 'custom'] as const).map((key) => {
              const labels = {
                today: 'Today',
                week: 'This Week',
                month: 'This Month',
                custom: 'Custom'
              };
              const isActive = timeframe === key;
              return (
                <button
                  key={key}
                  onClick={() => handleTimeframeSelect(key)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all whitespace-nowrap cursor-pointer",
                    isActive
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted hover:text-foreground hover:bg-surface/80"
                  )}
                >
                  {labels[key]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Revenue Figure & Hospital/Platform Split Chips */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-1">
          <div className="flex flex-col">
            <span className="text-[12px] font-medium text-muted">Total Gross Revenue</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              {isRevenueLoading && !revenueAnalytics ? (
                <Skeleton className="h-9 w-28" />
              ) : (
                <span className="text-[28px] sm:text-[32px] font-bold text-foreground tracking-tight">
                  {formatCurrency(revenueAnalytics?.totalRevenue ?? 0)}
                </span>
              )}
              {isRevenueLoading && revenueAnalytics && (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary ml-1" />
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/50">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[12px] font-semibold text-emerald-800 dark:text-emerald-300">
                Hospital Share ({revenueAnalytics?.hospitalSharePercentage ?? 80}%):
              </span>
              <span className="text-[12px] font-bold text-emerald-700 dark:text-emerald-400">
                {formatCurrency(revenueAnalytics?.hospitalShare ?? 0)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/50">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[12px] font-semibold text-amber-800 dark:text-amber-300">
                Platform Fee ({revenueAnalytics?.platformFeePercentage ?? 20}%):
              </span>
              <span className="text-[12px] font-bold text-amber-700 dark:text-amber-400">
                {formatCurrency(revenueAnalytics?.platformFee ?? 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Executive-Grade Recharts Area Chart */}
        <div className="h-[260px] sm:h-[300px] w-full mt-2">
          {isRevenueLoading && !revenueAnalytics ? (
            <div className="h-full w-full flex items-center justify-center bg-surface/50 rounded-xl">
              <Skeleton className="h-full w-full rounded-xl" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={chartData} 
                margin={{ top: 12, right: 12, left: 0, bottom: 4 }}
              >
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1769E0" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#1769E0" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false} 
                  stroke="#E2E8F0" 
                  opacity={0.7} 
                />
                <XAxis 
                  dataKey="label" 
                  tickLine={false} 
                  axisLine={{ stroke: '#E2E8F0' }} 
                  tick={{ fill: '#64748B', fontSize: 11 }} 
                  dy={8}
                  interval={timeframe === 'month' ? 4 : 'preserveStartEnd'}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#64748B', fontSize: 11 }} 
                  tickFormatter={formatYAxisCurrency}
                  domain={[0, (dataMax: number) => (dataMax > 0 ? Math.ceil(dataMax * 1.15) : 500)]}
                  allowDataOverflow={false}
                  width={52}
                />
                <Tooltip 
                  content={
                    <CustomRevenueTooltip 
                      hospitalSharePct={revenueAnalytics?.hospitalSharePercentage ?? 80} 
                      platformFeePct={revenueAnalytics?.platformFeePercentage ?? 20} 
                      formatCurrency={formatCurrency}
                    />
                  } 
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#1769E0" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#revenueGradient)" 
                  activeDot={{ r: 6, fill: '#1769E0', stroke: '#ffffff', strokeWidth: 2 }}
                  isAnimationActive={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* Quick Access: Clean 3-Button Grid */}
      <motion.div variants={item} className="flex flex-col gap-3">
        <h3 className="text-[17px] font-semibold text-foreground px-1">{t('quick_access')}</h3>
        <div className="grid grid-cols-3 gap-3 px-1">
          {quickActions.map((action, idx) => (
            <button 
              key={idx} 
              onClick={() => navigate(action.path)} 
              className="flex flex-col items-center justify-center gap-2 py-3.5 px-2 bg-surface rounded-2xl border border-border/70 shadow-sm hover:border-blue-200 hover:shadow-md active:scale-95 transition-all group cursor-pointer"
              title={`Go to ${action.label}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${action.bg} ${action.bg.includes('dark:') ? '' : action.bg.replace('bg-', 'dark:bg-').replace('-50', '-900/20')} ${action.text} group-hover:scale-105 transition-transform`}>
                <action.icon className="w-5 h-5" strokeWidth={2.2} />
              </div>
              <span className="text-[12px] font-semibold text-foreground">{action.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Appointments Feed with Today vs Upcoming Toggle */}
      <motion.div variants={item} className="flex flex-col gap-3 mb-6">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAppointmentTab('today')}
              className={`text-[15px] font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                appointmentTab === 'today'
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted hover:text-foreground bg-gray-100/60 dark:bg-gray-800/60'
              }`}
            >
              {t('today')} ({todayAppointments.length})
            </button>
            <button
              onClick={() => setAppointmentTab('upcoming')}
              className={`text-[15px] font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                appointmentTab === 'upcoming'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted hover:text-foreground bg-gray-100/60 dark:bg-gray-800/60'
              }`}
            >
              {t('upcoming')} ({upcomingAppointments.length})
            </button>
          </div>
          <button 
            onClick={() => navigate('/appointments')} 
            className="text-[13px] font-semibold text-primary interactive-element hover:underline cursor-pointer"
          >
            {t('view_all')}
          </button>
        </div>

        <div className="bg-surface rounded-2xl border border-border/60 shadow-sm overflow-hidden">
          {isLoading && !overview ? (
            <div className="p-4 flex flex-col gap-3">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : activeAppointments.length > 0 ? (
            activeAppointments.map((appt) => (
              <div 
                key={appt.id} 
                onClick={() => {
                  if (appt.patientId) {
                    navigate(`/patients/${appt.patientId}`);
                  } else {
                    navigate('/appointments');
                  }
                }} 
                className="flex items-start gap-3 p-4 border-b border-border last:border-0 interactive-element transition-colors cursor-pointer hover:bg-gray-50/40 dark:hover:bg-gray-800/40"
              >
                <div className="flex flex-col items-center pt-1 min-w-[70px]">
                  <span className="text-[13px] font-bold text-foreground">{appt.time.split(' ')[0]}</span>
                  <span className="text-[10px] font-semibold text-muted">{appt.time.split(' ')[1]}</span>
                  {appt.date && (
                    <span className="text-[10px] font-bold text-primary bg-blue-50 px-1.5 py-0.5 rounded mt-1 text-center whitespace-nowrap">
                      {formatApptDate(appt.date)}
                    </span>
                  )}
                </div>

                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0">
                  <img src={appt.avatar} alt={appt.name} className="w-full h-full object-cover" />
                </div>

                <div className="flex flex-col flex-1">
                  <div className="flex justify-between items-start">
                    <span className="text-[15px] font-semibold text-foreground">{appt.name}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (appt.patientId) navigate(`/patients/${appt.patientId}`);
                        else navigate('/appointments');
                      }}
                      className="p-1 -mt-1 -mr-1 text-muted hover:text-foreground active:scale-95"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-[13px] font-medium text-muted mt-0.5">{appt.dept} &middot; {appt.doctor}</span>
                  <span className={`text-[12px] font-semibold mt-1.5 px-2 py-0.5 rounded-md inline-block w-fit ${appt.statusColor}`}>{appt.status}</span>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon={Calendar}
              title={appointmentTab === 'today' ? "No Consultations Today" : "No Upcoming Consultations"}
              description={
                appointmentTab === 'today' 
                  ? upcomingAppointments.length > 0 
                    ? `No appointments for today. You have ${upcomingAppointments.length} upcoming appointment(s).` 
                    : "Today's appointments will appear here once booked."
                  : "No upcoming consultations scheduled."
              }
            />
          )}
        </div>
      </motion.div>

      {/* Custom Date Range Popover / Modal */}
      <AnimatePresence>
        {isCustomModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-md p-5 flex flex-col gap-4 text-foreground"
            >
              <div className="flex items-center justify-between border-b border-border/70 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <h4 className="text-[16px] font-bold">Select Custom Range</h4>
                </div>
                <button
                  onClick={() => setIsCustomModalOpen(false)}
                  className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Quick Presets</span>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handlePresetSelect(7)}
                    className="px-2 py-1.5 text-[11px] font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-blue-50 hover:text-primary dark:hover:bg-blue-900/30 transition-all text-center"
                  >
                    Last 7D
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect(14)}
                    className="px-2 py-1.5 text-[11px] font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-blue-50 hover:text-primary dark:hover:bg-blue-900/30 transition-all text-center"
                  >
                    Last 14D
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect(30)}
                    className="px-2 py-1.5 text-[11px] font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-blue-50 hover:text-primary dark:hover:bg-blue-900/30 transition-all text-center"
                  >
                    Last 30D
                  </button>
                  <button
                    type="button"
                    onClick={handleThisMonthPreset}
                    className="px-2 py-1.5 text-[11px] font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-blue-50 hover:text-primary dark:hover:bg-blue-900/30 transition-all text-center"
                  >
                    Month
                  </button>
                </div>
              </div>

              {/* Date Inputs */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-foreground">Start Date</label>
                  <input
                    type="date"
                    value={tempStart}
                    onChange={(e) => setTempStart(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] bg-background border border-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-foreground">End Date</label>
                  <input
                    type="date"
                    value={tempEnd}
                    min={tempStart}
                    onChange={(e) => setTempEnd(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] bg-background border border-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="px-4 py-2 text-[13px] font-semibold text-muted hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!tempStart || !tempEnd || tempStart > tempEnd}
                  onClick={handleApplyCustomDate}
                  className="px-5 py-2 text-[13px] font-semibold bg-primary text-white rounded-xl shadow-xs hover:bg-primary/90 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                >
                  Apply Filter
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/**
 * Custom Floating Tooltip for Executive-Grade Area Chart
 */
function CustomRevenueTooltip({ active, payload, hospitalSharePct, platformFeePct, formatCurrency }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const rev = Number(data.revenue) || 0;
    const hospShare = data.hospitalShare ?? Math.round(rev * (hospitalSharePct / 100));
    const platFee = data.platformFee ?? (rev - hospShare);
    const dateLabel = data.fullDate || data.date || data.label;

    return (
      <div className="bg-surface/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-border/80 min-w-[210px] text-xs flex flex-col gap-2 z-50">
        <div className="flex items-center justify-between border-b border-border/60 pb-1.5 font-semibold text-foreground">
          <span>{dateLabel}</span>
        </div>
        <div className="flex items-center justify-between font-bold text-foreground text-sm pt-0.5">
          <span className="text-muted text-xs font-medium">Total Revenue:</span>
          <span className="text-primary font-bold text-sm">{formatCurrency(rev)}</span>
        </div>
        <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-medium pt-1 border-t border-border/40">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Hospital Share ({hospitalSharePct}%):
          </span>
          <span className="font-semibold">{formatCurrency(hospShare)}</span>
        </div>
        <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Platform Fee ({platformFeePct}%):
          </span>
          <span className="font-semibold">{formatCurrency(platFee)}</span>
        </div>
      </div>
    );
  }
  return null;
}
