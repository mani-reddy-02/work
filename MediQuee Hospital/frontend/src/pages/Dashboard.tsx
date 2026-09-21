import { useState, useEffect, useCallback, useRef } from "react"
import { Clock, Users, IndianRupee, Calendar, FileText, ChevronDown, Stethoscope, MoreVertical, RefreshCw, CheckCircle2, ChevronRight, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts'
import { useNavigate } from "react-router-dom"
import { PromoCarousel } from "../components/PromoCarousel"
import { EmptyState } from "../components/ui/EmptyState"
import { Skeleton } from "../components/ui/Skeleton"
import { useAuth } from "../context/AuthContext"
import { useTranslation } from "react-i18next"
import { dashboardApi, type DashboardOverview } from "../services/dashboardApi"

type RevenueTimeframe = 'today' | 'week' | 'month' | 'year';

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Revenue timeframe filter state
  const [timeframe, setTimeframe] = useState<RevenueTimeframe>('week');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  useEffect(() => {
    fetchOverview();

    // Auto-refresh every 30 seconds for live counters
    const interval = setInterval(() => {
      fetchOverview(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchOverview]);

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Remaining quick actions after removing OP Mgt and Reports
  const quickActions = [
    { icon: Calendar, label: t('appointments', 'Appts'), path: '/appointments', bg: 'bg-blue-50', text: 'text-primary' },
    { icon: IndianRupee, label: t('payout', 'Payout'), path: '/payouts', bg: 'bg-teal-50', text: 'text-teal-600' },
    { icon: Stethoscope, label: t('doctors', 'Doctors'), path: '/profile/staff/doctors', bg: 'bg-indigo-50', text: 'text-indigo-600' },
  ];

  const timeframeConfig: Record<RevenueTimeframe, { label: string; subtitle: string; emptyText: string }> = {
    today: { label: 'Today', subtitle: 'Today', emptyText: 'No revenue recorded today' },
    week: { label: 'Week', subtitle: 'This Week', emptyText: 'No revenue recorded this week' },
    month: { label: 'Month', subtitle: 'This Month', emptyText: 'No revenue recorded this month' },
    year: { label: 'Year', subtitle: 'This Year', emptyText: 'No revenue recorded this year' },
  };

  const getRevenueForTimeframe = () => {
    if (!overview) return 0;
    switch (timeframe) {
      case 'today':
        return overview.revenueToday ?? 0;
      case 'week':
        return overview.revenueThisWeek ?? 0;
      case 'month':
        return overview.revenueThisMonth ?? 0;
      case 'year':
        return overview.revenueThisYear ?? 0;
      default:
        return overview.revenueThisWeek ?? 0;
    }
  };

  const revenueData = overview?.revenueTrends?.[timeframe] || (timeframe === 'week' ? overview?.revenueTrend || [] : []);

  const todayAppointments = overview?.todayAppointments || [];
  const upcomingAppointments = overview?.upcomingAppointments || [];
  const [appointmentTab, setAppointmentTab] = useState<'today' | 'upcoming'>('today');

  // If today has no appointments, but upcoming has appointments, default to upcoming so user immediately sees bookings
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

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={container}
      className="flex flex-col gap-6 p-4 pt-2 pb-32 sm:pb-36"
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
          onClick={() => fetchOverview(true)}
          disabled={isLoading}
          aria-label="Refresh metrics"
          className="p-2 rounded-xl bg-surface border border-border shadow-sm text-muted hover:text-primary active:scale-95 transition-all mt-0.5"
          title="Refresh metrics"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-primary' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="bg-amber-50/80 border border-amber-200/60 text-amber-800 text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between">
          <span>Unable to refresh live metrics. Showing cached or fallback data.</span>
          <button onClick={() => fetchOverview(true)} className="font-semibold underline ml-2">Retry</button>
        </div>
      )}

      {/* Today's Overview (2x2 Grid) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card 1: Total OPs */}
        <motion.div 
          variants={item}
          onClick={() => navigate('/appointments', { state: { date: todayIso, filter: 'ops' } })}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/appointments', { state: { date: todayIso, filter: 'ops' } }); }}
          className="bg-surface rounded-2xl p-4 shadow-sm border border-border/60 flex flex-col justify-between gap-3 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all active:scale-[0.98] group"
          title="View Today's OPs"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50/50 dark:bg-blue-900/20 text-primary rounded-lg group-hover:bg-blue-100/80 dark:group-hover:bg-blue-900/40 transition-colors">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[13px] font-medium text-muted">{t('today_ops')}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-muted/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="flex flex-col min-h-[32px] justify-center">
            {isLoading && !overview ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-[24px] font-semibold text-foreground tracking-tight">
                  {overview?.totalOPs ?? 0}
                </span>
                {(overview?.upcomingOPs ?? 0) > 0 && (
                  <span className="text-[11px] font-semibold text-primary bg-blue-50 px-2 py-0.5 rounded-full">
                    +{overview?.upcomingOPs} upcoming
                  </span>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Card 2: Pending & Completed OPs (Split Half) */}
        <motion.div 
          variants={item}
          className="bg-surface rounded-2xl p-3 sm:p-4 shadow-sm border border-border/60 flex flex-col justify-between transition-all group"
        >
          <div className="grid grid-cols-2 divide-x divide-border h-full">
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
              className="flex flex-col justify-between pr-2.5 sm:pr-3 cursor-pointer group/pending hover:bg-amber-50/40 dark:hover:bg-amber-900/10 -my-1 -ml-1 py-1 pl-1 rounded-xl transition-all active:scale-[0.97]"
              title="View Pending OPs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 bg-amber-50/50 dark:bg-amber-900/20 text-amber-600 rounded-lg group-hover/pending:bg-amber-100/80 transition-colors">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] sm:text-[12px] font-medium text-muted truncate">{t('pending')}</span>
                </div>
                <ChevronRight className="w-3 h-3 text-muted/50 group-hover/pending:text-amber-600 group-hover/pending:translate-x-0.5 transition-all hidden sm:block" />
              </div>
              <div className="flex flex-col min-h-[32px] justify-center mt-1">
                {isLoading && !overview ? (
                  <Skeleton className="h-7 w-10" />
                ) : (
                  <span className="text-[20px] sm:text-[22px] font-semibold text-foreground tracking-tight">
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
              className="flex flex-col justify-between pl-2.5 sm:pl-3 cursor-pointer group/completed hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10 -my-1 -mr-1 py-1 pr-1 rounded-xl transition-all active:scale-[0.97]"
              title="View Completed OPs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg group-hover/completed:bg-emerald-100/80 transition-colors">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] sm:text-[12px] font-medium text-muted truncate">{t('completed')}</span>
                </div>
                <ChevronRight className="w-3 h-3 text-muted/50 group-hover/completed:text-emerald-600 group-hover/completed:translate-x-0.5 transition-all hidden sm:block" />
              </div>
              <div className="flex flex-col min-h-[32px] justify-center mt-1">
                {isLoading && !overview ? (
                  <Skeleton className="h-7 w-10" />
                ) : (
                  <span className="text-[20px] sm:text-[22px] font-semibold text-emerald-600 tracking-tight">
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
          className="bg-surface rounded-2xl p-4 shadow-sm border border-border/60 flex flex-col justify-between gap-3 cursor-pointer hover:border-purple-200 hover:shadow-md transition-all active:scale-[0.98] group"
          title="View Lab Tests"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-50/50 dark:bg-purple-900/20 text-info rounded-lg group-hover:bg-purple-100/80 transition-colors">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-[13px] font-medium text-muted">{t('lab_tests')}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-muted/50 group-hover:text-info group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="flex flex-col min-h-[32px] justify-center">
            {isLoading && !overview ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <span className="text-[24px] font-semibold text-foreground tracking-tight">
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
          className="bg-surface rounded-2xl p-4 shadow-sm border border-border/60 flex flex-col justify-between gap-3 cursor-pointer hover:border-teal-200 hover:shadow-md transition-all active:scale-[0.98] group"
          title="View Revenue & Payouts"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-teal-50/50 dark:bg-teal-900/20 text-teal-600 rounded-lg group-hover:bg-teal-100/80 transition-colors">
                <IndianRupee className="w-4 h-4" />
              </div>
              <span className="text-[13px] font-medium text-muted">{t('revenue_today')}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-muted/50 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="flex flex-col min-h-[32px] justify-center">
            {isLoading && !overview ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <span className="text-[24px] font-semibold text-foreground tracking-tight">
                {formatCurrency(overview?.revenueToday ?? 0)}
              </span>
            )}
          </div>
        </motion.div>
      </div>

      <PromoCarousel />

      {/* Revenue Trend Section with Working Timeframe Filter */}
      <motion.div variants={item} className="bg-surface rounded-2xl border border-border/60 shadow-sm p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between relative">
          <div className="flex flex-col">
            <h3 className="text-[15px] font-semibold text-foreground">{t('revenue')}</h3>
            <span className="text-[12px] font-medium text-muted">{timeframeConfig[timeframe].subtitle}</span>
          </div>

          {/* Interactive Timeframe Filter Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(prev => !prev)}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-foreground bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 px-3 py-1.5 rounded-xl border border-border shadow-sm transition-all"
              title="Change timeframe"
            >
              <span>{timeframeConfig[timeframe].label}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-1.5 w-36 bg-surface rounded-xl shadow-lg border border-border py-1 z-30 overflow-hidden"
                >
                  {(['today', 'week', 'month', 'year'] as const).map((tVal) => (
                    <button
                      key={tVal}
                      onClick={() => {
                        setTimeframe(tVal);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-[13px] flex items-center justify-between transition-colors ${
                        timeframe === tVal 
                          ? 'bg-blue-50/70 dark:bg-blue-900/30 text-primary font-bold' 
                          : 'text-foreground hover:bg-gray-50 dark:hover:bg-gray-800 font-medium'
                      }`}
                    >
                      <span>{timeframeConfig[tVal].label}</span>
                      {timeframe === tVal && <Check className="w-3.5 h-3.5 text-primary" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        <div className="flex items-end justify-between">
          <div className="flex flex-col min-h-[32px] justify-center">
            {isLoading && !overview ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <span className="text-[24px] font-semibold text-foreground tracking-tight">
                {formatCurrency(getRevenueForTimeframe())}
              </span>
            )}
          </div>
        </div>

        <div className="h-[120px] w-full mt-2 -ml-2">
          {isLoading && !overview ? (
            <div className="h-full w-full flex items-center justify-center">
              <Skeleton className="h-full w-full rounded-xl" />
            </div>
          ) : revenueData.some(d => d.revenue > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1769E0" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#1769E0" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{ background: 'var(--surface, #1E293B)', borderRadius: '12px', border: '1px solid var(--border, #334155)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px', color: 'var(--foreground, #F8FAFC)' }}
                  itemStyle={{ color: '#1769E0', fontWeight: '600' }}
                  formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Revenue']}
                  cursor={{ stroke: 'var(--border, #334155)', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#1769E0" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center ml-2">
              <span className="text-[13px] font-medium text-[#98A2B3]">{timeframeConfig[timeframe].emptyText}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick Access: Clean 3-Button Grid (OP Mgt & Reports removed, Doctors -> /profile/staff/doctors) */}
      <motion.div variants={item} className="flex flex-col gap-3">
        <h3 className="text-[17px] font-semibold text-foreground px-1">{t('quick_access')}</h3>
        <div className="grid grid-cols-3 gap-3 px-1">
          {quickActions.map((action, idx) => (
            <button 
              key={idx} 
              onClick={() => navigate(action.path)} 
              className="flex flex-col items-center justify-center gap-2 py-3.5 px-2 bg-surface rounded-2xl border border-border/70 shadow-sm hover:border-blue-200 hover:shadow-md active:scale-95 transition-all group"
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
              className={`text-[15px] font-bold px-3 py-1.5 rounded-xl transition-all ${
                appointmentTab === 'today'
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted hover:text-foreground bg-gray-100/60 dark:bg-gray-800/60'
              }`}
            >
              {t('today')} ({todayAppointments.length})
            </button>
            <button
              onClick={() => setAppointmentTab('upcoming')}
              className={`text-[15px] font-bold px-3 py-1.5 rounded-xl transition-all ${
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
            className="text-[13px] font-semibold text-primary interactive-element hover:underline"
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
      
    </motion.div>
  )
}
