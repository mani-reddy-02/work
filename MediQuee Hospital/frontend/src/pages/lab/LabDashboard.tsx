import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ClipboardList, 
  TestTube, 
  FileText, 
  IndianRupee, 
  ChevronRight, 
  User, 
  RefreshCw, 
  AlertCircle,
  Home,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  Calendar,
  X,
  Check
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { AreaChart, Area, Tooltip, ResponsiveContainer, XAxis, CartesianGrid } from "recharts"
import { LabKpiCard, StatusBadge } from "@/components/lab/LabUI"
import { EmptyState } from "@/components/ui/EmptyState"
import { Skeleton } from "@/components/ui/Skeleton"
import { PromoCarousel } from "@/components/PromoCarousel"
import { cn } from "@/lib/utils"
import { ConditionLabel } from "@/components/shared/ConditionLabel"
import { labApi } from "@/services/labApi"
import { LabOrderQuickModal } from "@/components/lab/LabOrderQuickModal"
import { useToast } from "@/context/ToastContext"

interface DashboardData {
  kpis: {
    totalOrders: number
    pendingTests: number
    completedTests?: number
    reportsReady: number
    todayRevenue: number
    weekRevenue: number
    monthRevenue: number
    totalRevenue?: number
  }
  testStatus?: {
    pending: number
    collected: number
    processing: number
    ready: number
    cancelled?: number
  }
  revenueSeries: {
    today: { t: string; v: number }[]
    week: { t: string; v: number }[]
    month: { t: string; v: number }[]
    custom?: { t: string; v: number; date?: string }[]
  }
  customRevenue?: number
  hospitalSharePercentage?: number
  platformFeePercentage?: number
  todayOrders: any[]
}

type RevenueTimeframe = 'today' | 'week' | 'month' | 'custom'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getFormattedDate() {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date())
}

export function LabDashboard() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [timeframe, setTimeframe] = useState<RevenueTimeframe>('today')
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Custom date picker modal state
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false)
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')
  const [tempStart, setTempStart] = useState<string>('')
  const [tempEnd, setTempEnd] = useState<string>('')

  // Order modal state
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchDashboard = useCallback(async (showRefreshing = false, customS?: string, customE?: string) => {
    if (showRefreshing) setIsRefreshing(true)
    setError(null)
    try {
      const res = await labApi.getLabDashboard({
        range: timeframe,
        startDate: customS || customStartDate,
        endDate: customE || customEndDate,
      })
      if (res.success && res.data) {
        setData(res.data)
      } else {
        throw new Error(res.error?.message || "Failed to load dashboard")
      }
    } catch (err: any) {
      console.error("Dashboard error:", err)
      setError(err.message || "Failed to load dashboard data")
      toast("Unable to sync lab dashboard data", "error")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [timeframe, customStartDate, customEndDate, toast])

  useEffect(() => {
    if (timeframe !== 'custom') {
      fetchDashboard()
    } else if (customStartDate && customEndDate) {
      fetchDashboard(false, customStartDate, customEndDate)
    }
  }, [timeframe, customStartDate, customEndDate, fetchDashboard])

  const kpis = data?.kpis || {
    totalOrders: 0,
    pendingTests: 0,
    completedTests: 0,
    reportsReady: 0,
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    totalRevenue: 0
  }

  // Active Date Range Badge string computation
  const activeDateRangeBadge = useMemo(() => {
    const now = new Date()
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    if (timeframe === 'today') {
      return `Today, ${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`
    }

    if (timeframe === 'week') {
      const dayOfWeek = now.getDay()
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday)
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6)
      return `${start.getDate()} ${monthNames[start.getMonth()]} – ${end.getDate()} ${monthNames[end.getMonth()]} ${end.getFullYear()}`
    }

    if (timeframe === 'month') {
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return `1 ${monthNames[now.getMonth()]} – ${end.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`
    }

    if (timeframe === 'custom') {
      if (!customStartDate || !customEndDate) return "Custom Range"
      const s = new Date(customStartDate)
      const e = new Date(customEndDate)
      return `${s.getDate()} ${monthNames[s.getMonth()]} ${s.getFullYear()} – ${e.getDate()} ${monthNames[e.getMonth()]} ${e.getFullYear()}`
    }

    return ''
  }, [timeframe, customStartDate, customEndDate])

  // Handle switching timeframe filters
  const handleTimeframeSelect = (selected: RevenueTimeframe) => {
    if (selected === 'custom') {
      const todayStr = new Date().toISOString().split('T')[0]
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const weekAgoStr = weekAgo.toISOString().split('T')[0]

      setTempStart(customStartDate || weekAgoStr)
      setTempEnd(customEndDate || todayStr)
      setIsCustomModalOpen(true)
    } else {
      setTimeframe(selected)
    }
  }

  const handleApplyCustomDate = () => {
    if (tempStart && tempEnd && tempStart <= tempEnd) {
      setCustomStartDate(tempStart)
      setCustomEndDate(tempEnd)
      setTimeframe('custom')
      setIsCustomModalOpen(false)
    }
  }

  const handlePresetSelect = (daysAgo: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - daysAgo)

    setTempStart(start.toISOString().split('T')[0])
    setTempEnd(end.toISOString().split('T')[0])
  }

  const handleThisMonthPreset = () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    setTempStart(start.toISOString().split('T')[0])
    setTempEnd(end.toISOString().split('T')[0])
  }

  // Active Series and Revenue calculations
  const revenueSeries = data?.revenueSeries || {
    today: [],
    week: [],
    month: [],
    custom: []
  }

  const activeSeries = revenueSeries[timeframe] || []

  const selectedPeriodRevenue = timeframe === 'today'
    ? kpis.todayRevenue
    : timeframe === 'week'
    ? kpis.weekRevenue
    : timeframe === 'month'
    ? kpis.monthRevenue
    : (data?.customRevenue ?? activeSeries.reduce((acc, it) => acc + (it.v || 0), 0))

  const hospitalSharePercent = data?.hospitalSharePercentage ?? 80
  const platformFeePercent = data?.platformFeePercentage ?? 20
  const labShareAmount = Math.round((selectedPeriodRevenue * hospitalSharePercent) / 100)
  const platformFeeAmount = selectedPeriodRevenue - labShareAmount

  const handleOrderClick = (order: any) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  // Quick action navigation items
  const quickAccessItems = [
    {
      label: 'Orders',
      subtext: 'Manage test requests & lab queue',
      path: '/lab/orders',
      icon: ClipboardList,
      bg: 'bg-blue-50',
      text: 'text-primary'
    },
    {
      label: 'Payout',
      subtext: 'Track settlements & lab revenue shares',
      path: '/lab/payouts',
      icon: IndianRupee,
      bg: 'bg-emerald-50',
      text: 'text-emerald-600'
    },
    {
      label: 'Reports',
      subtext: 'Issue & upload diagnostic test reports',
      path: '/lab/reports',
      icon: FileText,
      bg: 'bg-purple-50',
      text: 'text-purple-600'
    }
  ]

  return (
    <div className="flex flex-col gap-6 md:gap-7 px-4 md:px-0 pt-4 md:pt-2 pb-16 w-full max-w-7xl mx-auto">
      {/* Top Greeting & Live Pulse Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 6 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-4 md:p-5 rounded-2xl border border-border shadow-xs"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-[#172033]">
              {getGreeting()} 👋
            </h1>
          </div>
          <p className="text-sm text-[#667085] mt-0.5">
            {getFormattedDate()} · Here's your real-time laboratory activity.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => fetchDashboard(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-surface hover:bg-gray-50 text-sm font-medium text-[#172033] active:scale-95 transition-all shadow-xs cursor-pointer"
            title="Refresh Real-time Data"
          >
            <RefreshCw className={cn("w-4 h-4 text-primary", isRefreshing && "animate-spin")} />
            <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
          </button>
        </div>
      </motion.div>

      {/* Error state alert if fetch failed */}
      {error && !data && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-red-700">
          <div className="flex items-center gap-2.5 text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>Failed to sync with live laboratory database.</span>
          </div>
          <button
            type="button"
            onClick={() => fetchDashboard()}
            className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── 1. Top KPI Cards Grid ────────────────────────────────────────── */}
      <motion.div 
        initial={{ opacity: 0, y: 8 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.05 }} 
        className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4"
      >
        {/* Card 1: Total Orders */}
        <LabKpiCard
          icon={ClipboardList}
          label="Total Orders"
          value={isLoading ? "..." : kpis.totalOrders}
          iconBg="bg-blue-50"
          iconColor="text-primary"
          trend="View all"
          trendUp={true}
          onClick={() => navigate('/lab/orders')}
        />

        {/* Card 2: Split Half: Pending & Completed Tests */}
        <motion.div 
          className="bg-surface rounded-2xl p-4 sm:p-5 min-h-[125px] sm:min-h-[135px] shadow-sm border border-border/70 flex flex-col justify-between transition-all"
        >
          {/* Top Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-xl">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-[13px] sm:text-[14px] font-medium text-muted">Test Status</span>
            </div>
          </div>

          {/* Bottom Split Values: Pending & Completed */}
          <div className="grid grid-cols-2 divide-x divide-border pt-1">
            {/* Left Half: Pending */}
            <div 
              onClick={() => navigate('/lab/orders?status=PENDING')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/lab/orders?status=PENDING'); }}
              className="flex flex-col pr-2 cursor-pointer group/pending min-w-0"
              title="View Pending Tests"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span className="text-[11px] sm:text-[12px] font-medium text-muted truncate">Pending</span>
              </div>
              <div className="pt-1">
                {isLoading ? (
                  <Skeleton className="h-8 w-10" />
                ) : (
                  <span className="text-[22px] sm:text-[24px] font-bold text-amber-600 tracking-tight">
                    {kpis.pendingTests ?? 0}
                  </span>
                )}
              </div>
            </div>

            {/* Right Half: Completed */}
            <div 
              onClick={() => navigate('/lab/orders?status=REPORT_READY')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/lab/orders?status=REPORT_READY'); }}
              className="flex flex-col pl-2.5 sm:pl-3 cursor-pointer group/completed min-w-0"
              title="View Completed Tests"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-[11px] sm:text-[12px] font-medium text-muted truncate">Completed</span>
              </div>
              <div className="pt-1">
                {isLoading ? (
                  <Skeleton className="h-8 w-10" />
                ) : (
                  <span className="text-[22px] sm:text-[24px] font-bold text-emerald-600 tracking-tight">
                    {kpis.completedTests ?? kpis.reportsReady ?? 0}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Card 3: Reports Ready */}
        <LabKpiCard
          icon={FileText}
          label="Reports Ready"
          value={isLoading ? "..." : kpis.reportsReady}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-700"
          trend="Completed"
          trendUp={true}
          onClick={() => navigate('/lab/orders?status=REPORT_READY')}
        />

        {/* Card 4: Total Revenue */}
        <LabKpiCard
          icon={IndianRupee}
          label="Total Revenue"
          value={isLoading ? "..." : `₹${(kpis.totalRevenue ?? (kpis.todayRevenue + kpis.weekRevenue)).toLocaleString()}`}
          iconBg="bg-purple-50"
          iconColor="text-purple-700"
          trend={`Today: ₹${kpis.todayRevenue.toLocaleString()}`}
          trendUp={true}
          onClick={() => {
            const chartEl = document.getElementById('lab-revenue-section')
            if (chartEl) chartEl.scrollIntoView({ behavior: 'smooth' })
          }}
        />
      </motion.div>

      {/* ── 2. Marketing Slides (Replaces Test Status) ───────────────────── */}
      <motion.div 
        initial={{ opacity: 0, y: 8 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.08 }}
        className="w-full"
      >
        <PromoCarousel module="LABS" />
      </motion.div>

      {/* ── 3. Full-Screen Revenue Section (Hospital Style with Custom Range) ── */}
      <motion.div 
        id="lab-revenue-section"
        initial={{ opacity: 0, y: 8 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.11 }} 
        className="bg-surface rounded-2xl border border-border/70 shadow-sm p-4 sm:p-6 flex flex-col gap-4 w-full"
      >
        {/* Top Header: Title, Active Date Range Badge, and Filter Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3.5">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-[17px] font-bold text-foreground tracking-tight flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Revenue
              </h3>
              {/* Computed Active Date Range Badge */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-primary border border-blue-200/60 shadow-xs">
                <Calendar className="w-3 h-3 text-primary" />
                {activeDateRangeBadge}
              </span>
            </div>
            <span className="text-[12px] text-muted">Complete laboratory diagnostic test & home collection revenue</span>
          </div>

          {/* Interactive Filter Pills: Today, Week, Month, Custom */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-border/80 self-start sm:self-auto overflow-x-auto max-w-full">
            {(['today', 'week', 'month', 'custom'] as const).map((key) => {
              const labels = {
                today: 'Today',
                week: 'This Week',
                month: 'This Month',
                custom: 'Custom'
              }
              const isActive = timeframe === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleTimeframeSelect(key)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all whitespace-nowrap cursor-pointer",
                    isActive
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted hover:text-foreground hover:bg-surface/80"
                  )}
                >
                  {labels[key]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Revenue Figure & Split Breakdown Chips */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-1">
          <div className="flex flex-col">
            <span className="text-[12px] font-medium text-muted">Total Gross Revenue</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              {isLoading ? (
                <Skeleton className="h-9 w-28" />
              ) : (
                <span className="text-[28px] sm:text-[32px] font-bold text-foreground tracking-tight">
                  ₹{selectedPeriodRevenue.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/70">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[12px] font-semibold text-emerald-800">
                Lab Share ({hospitalSharePercent}%):
              </span>
              <span className="text-[12px] font-bold text-emerald-700">
                ₹{labShareAmount.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/70">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[12px] font-semibold text-amber-800">
                Platform Fee ({platformFeePercent}%):
              </span>
              <span className="text-[12px] font-bold text-amber-700">
                ₹{platformFeeAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Full-Width Recharts Area Chart */}
        <div className="h-[250px] sm:h-[300px] w-full mt-2">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center text-sm text-[#98A2B3]">
              <RefreshCw className="w-5 h-5 animate-spin text-primary mr-2" />
              Loading revenue stream...
            </div>
          ) : activeSeries.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-sm font-medium text-[#98A2B3]">
              No revenue recorded for this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeSeries} margin={{ top: 12, right: 12, bottom: 4, left: 4 }}>
                <defs>
                  <linearGradient id="labFullRevGrad" x1="0" y1="0" x2="0" y2="1">
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
                  dataKey="t" 
                  tickLine={false} 
                  axisLine={{ stroke: '#E5E7EB' }} 
                  tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                />
                <Tooltip
                  contentStyle={{ 
                    background: '#1E293B', 
                    border: '1px solid #334155', 
                    borderRadius: 12, 
                    fontSize: 12, 
                    color: '#F8FAFC',
                    padding: '8px 12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, 'Revenue']}
                  labelStyle={{ color: '#94A3B8', fontWeight: 600, marginBottom: 2 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="v" 
                  stroke="#1769E0" 
                  strokeWidth={2.5} 
                  fill="url(#labFullRevGrad)" 
                  dot={{ fill: '#1769E0', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#1769E0', stroke: '#FFFFFF', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* ── 4. Quick Access Tiles (Orders, Payout, Reports) ───────────────── */}
      <motion.div 
        initial={{ opacity: 0, y: 8 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.14 }}
        className="flex flex-col gap-3 w-full"
      >
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-[17px] font-bold text-[#172033]">Quick Access</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {quickAccessItems.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => navigate(item.path)}
              className="flex items-center gap-3.5 p-4 bg-surface rounded-2xl border border-border/70 shadow-xs hover:border-primary/40 hover:shadow-md active:scale-[0.98] transition-all text-left group cursor-pointer"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${item.bg} ${item.text} group-hover:scale-105 transition-transform`}>
                <item.icon className="w-5 h-5" strokeWidth={2.2} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[14px] font-bold text-foreground block group-hover:text-primary transition-colors">
                  {item.label}
                </span>
                <span className="text-xs text-muted block truncate mt-0.5">
                  {item.subtext}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── 5. Recent Orders Full-Width List ──────────────────────────────── */}
      <motion.div 
        initial={{ opacity: 0, y: 8 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.17 }} 
        className="bg-surface rounded-2xl p-4 md:p-6 border border-border shadow-xs flex flex-col gap-4 w-full"
      >
        <div className="flex items-center justify-between border-b border-border/50 pb-3.5">
          <div>
            <h2 className="text-lg font-bold text-[#172033]">Recent Orders</h2>
            <p className="text-xs text-[#667085] mt-0.5">
              {data?.todayOrders?.length || 0} active orders in laboratory queue
            </p>
          </div>
          <button 
            type="button"
            onClick={() => navigate('/lab/orders')} 
            className="text-sm text-primary font-semibold flex items-center gap-1 hover:underline active:scale-95 transition-all cursor-pointer"
          >
            View Queue <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {isLoading ? (
            <div className="flex flex-col gap-3 py-6 items-center justify-center text-[13px] text-[#98A2B3]">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              Loading orders from live queue...
            </div>
          ) : (!data?.todayOrders || data.todayOrders.length === 0) ? (
            <EmptyState
              icon={ClipboardList}
              title="No Orders Available"
              description="Live lab test bookings will appear here once booked by patients or doctors."
            />
          ) : (
            data.todayOrders.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * i }}
                onClick={() => handleOrderClick(order)}
                className="w-full bg-[#FAFAFC] hover:bg-white rounded-xl p-3.5 border border-border/80 shadow-2xs flex items-center gap-3.5 active:scale-[0.98] transition-all hover:border-primary/40 hover:shadow-sm text-left cursor-pointer group"
              >
                {/* Patient Avatar */}
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-blue-50 border border-blue-100/80 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
                  {order.patient?.charAt(0)?.toUpperCase() || 'P'}
                </div>

                {/* Info Column */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-[#172033] truncate group-hover:text-primary transition-colors">
                      {order.patient}
                    </p>
                    <span className="text-sm font-bold text-[#172033] shrink-0">
                      ₹{order.totalAmount}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-0.5 truncate">
                    <ConditionLabel 
                      name={order.test} 
                      textClassName="text-xs text-[#667085] font-medium" 
                      iconClassName="w-3.5 h-3.5 text-primary" 
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-xs text-[#667085]">
                    <span className="font-semibold text-primary bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">
                      {order.sample}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3.5 h-3.5 text-[#98A2B3]" /> {order.time}
                    </span>
                    {order.bookingType === 'HOME_COLLECTION' && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-emerald-700 font-semibold">
                          <Home className="w-3.5 h-3.5 text-emerald-600" /> Home
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Status Badge & Arrow */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <StatusBadge status={order.status} />
                  <ChevronRight className="w-4 h-4 text-[#98A2B3] group-hover:text-primary group-hover:translate-x-0.5 transition-all hidden sm:block" aria-hidden="true" />
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* ── Custom Date Range Picker Modal ──────────────────────────────── */}
      <AnimatePresence>
        {isCustomModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-border flex flex-col gap-4 animate-in fade-in"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h3 className="text-base font-bold text-foreground">Select Custom Date Range</h3>
                <button 
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 text-muted hover:text-foreground cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Presets */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handlePresetSelect(7)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-foreground transition-colors cursor-pointer"
                >
                  Last 7 Days
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetSelect(14)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-foreground transition-colors cursor-pointer"
                >
                  Last 14 Days
                </button>
                <button
                  type="button"
                  onClick={handleThisMonthPreset}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-foreground transition-colors cursor-pointer"
                >
                  This Month
                </button>
              </div>

              {/* Date Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Start Date</label>
                  <input
                    type="date"
                    value={tempStart}
                    onChange={(e) => setTempStart(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">End Date</label>
                  <input
                    type="date"
                    value={tempEnd}
                    onChange={(e) => setTempEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-xl text-sm font-semibold text-muted hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyCustomDate}
                  className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
                >
                  Apply Range
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Detail Bottom Sheet / Modal */}
      <LabOrderQuickModal
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onOrderUpdated={() => fetchDashboard(true)}
      />
    </div>
  )
}
