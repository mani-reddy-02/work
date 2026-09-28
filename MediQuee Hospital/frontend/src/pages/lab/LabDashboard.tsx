import { useState, useEffect, useCallback } from "react"
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
  ArrowUpRight
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { AreaChart, Area, Tooltip, ResponsiveContainer, XAxis } from "recharts"
import { LabKpiCard, StatusBadge } from "@/components/lab/LabUI"
import { EmptyState } from "@/components/ui/EmptyState"
import { cn } from "@/lib/utils"
import { ConditionLabel } from "@/components/shared/ConditionLabel"
import { labApi } from "@/services/labApi"
import { LabOrderQuickModal } from "@/components/lab/LabOrderQuickModal"
import { useToast } from "@/context/ToastContext"

interface DashboardData {
  kpis: {
    totalOrders: number
    pendingTests: number
    reportsReady: number
    todayRevenue: number
    weekRevenue: number
    monthRevenue: number
  }
  testStatus: {
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
  }
  todayOrders: any[]
}

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

  const [revPeriod, setRevPeriod] = useState<'today' | 'week' | 'month'>('today')
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Order modal state
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchDashboard = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true)
    setError(null)
    try {
      const res = await labApi.getLabDashboard()
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
  }, [toast])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const kpis = data?.kpis || {
    totalOrders: 0,
    pendingTests: 0,
    reportsReady: 0,
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0
  }

  const testStatusCounts = data?.testStatus || {
    pending: 0,
    collected: 0,
    processing: 0,
    ready: 0
  }

  const revenueSeries = data?.revenueSeries || {
    today: [],
    week: [],
    month: []
  }

  const activeSeries = revenueSeries[revPeriod] || []

  const activeRevenueDisplay = revPeriod === 'today'
    ? `₹${kpis.todayRevenue.toLocaleString()}`
    : revPeriod === 'week'
    ? `₹${kpis.weekRevenue.toLocaleString()}`
    : `₹${kpis.monthRevenue.toLocaleString()}`

  const testStatusPills = [
    {
      label: 'Pending',
      count: testStatusCounts.pending,
      filter: 'PENDING',
      bgClass: 'bg-amber-50 hover:bg-amber-100/80 border-amber-200 text-amber-800',
      badgeClass: 'bg-amber-100 text-amber-700'
    },
    {
      label: 'Collected',
      count: testStatusCounts.collected,
      filter: 'SAMPLE_COLLECTED',
      bgClass: 'bg-blue-50 hover:bg-blue-100/80 border-blue-200 text-blue-800',
      badgeClass: 'bg-blue-100 text-blue-700'
    },
    {
      label: 'Processing',
      count: testStatusCounts.processing,
      filter: 'IN_LAB_PROCESSING',
      bgClass: 'bg-purple-50 hover:bg-purple-100/80 border-purple-200 text-purple-800',
      badgeClass: 'bg-purple-100 text-purple-700'
    },
    {
      label: 'Ready',
      count: testStatusCounts.ready,
      filter: 'REPORT_READY',
      bgClass: 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200 text-emerald-800',
      badgeClass: 'bg-emerald-100 text-emerald-700'
    },
  ]

  const handleOrderClick = (order: any) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  return (
    <div className="flex flex-col gap-5 md:gap-7 px-4 md:px-0 pt-4 md:pt-2 pb-8 w-full">
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
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live DB
            </span>
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
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-surface hover:bg-gray-50 text-sm font-medium text-[#172033] active:scale-95 transition-all shadow-xs"
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

      {/* KPI Cards Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 8 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.05 }} 
        className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
      >
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
        <LabKpiCard
          icon={TestTube}
          label="Pending Tests"
          value={isLoading ? "..." : kpis.pendingTests}
          iconBg="bg-amber-50"
          iconColor="text-amber-700"
          trend="Needs action"
          trendUp={false}
          onClick={() => navigate('/lab/orders?status=PENDING')}
        />
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
        <LabKpiCard
          icon={IndianRupee}
          label="Today's Revenue"
          value={isLoading ? "..." : `₹${kpis.todayRevenue.toLocaleString()}`}
          iconBg="bg-purple-50"
          iconColor="text-purple-700"
          trend={`Week: ₹${kpis.weekRevenue.toLocaleString()}`}
          trendUp={true}
          onClick={() => {
            setRevPeriod('today')
            const chartEl = document.getElementById('lab-revenue-section')
            if (chartEl) chartEl.scrollIntoView({ behavior: 'smooth' })
          }}
        />
      </motion.div>

      {/* Test Status Breakdown Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 8 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.09 }}
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#172033]">Test Status</h2>
            <span className="text-xs font-medium text-[#667085]">
              (Click any status to filter orders)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {testStatusPills.map(s => (
            <button
              type="button"
              key={s.label}
              onClick={() => navigate(`/lab/orders?status=${s.filter}`)}
              className={cn(
                "group relative flex flex-col items-center justify-center gap-1.5 p-3.5 md:p-4 rounded-2xl border transition-all text-center active:scale-[0.97] hover:shadow-xs cursor-pointer",
                s.bgClass
              )}
            >
              <span className="text-2xl md:text-3xl font-extrabold leading-none tracking-tight">
                {isLoading ? "—" : s.count}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold">{s.label}</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Main Content Grid: Revenue Chart & Today's Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6 items-stretch">
        
        {/* Revenue Analytics Card */}
        <motion.div 
          id="lab-revenue-section"
          initial={{ opacity: 0, y: 8 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.12 }} 
          className="bg-surface rounded-2xl p-4 md:p-6 border border-border shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#172033]">
                  {revPeriod === 'today' ? "Today's Revenue" : revPeriod === 'week' ? "This Week's Revenue" : "This Month's Revenue"}
                </h2>
                <p className="text-2xl md:text-3xl font-extrabold text-[#172033] tracking-tight mt-0.5">
                  {isLoading ? "..." : activeRevenueDisplay}
                </p>
              </div>

              {/* Time Period Tabs */}
              <div className="flex bg-[#F1F3F5] rounded-xl p-1 gap-1 self-start sm:self-auto border border-border/40">
                {(['today', 'week', 'month'] as const).map(p => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setRevPeriod(p)}
                    className={cn(
                      "px-3 py-1.5 md:px-4 md:py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all capitalize",
                      revPeriod === p 
                        ? "bg-surface text-primary shadow-xs" 
                        : "text-[#667085] hover:text-[#172033]"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chart Area */}
          <div className="h-[180px] md:h-[220px] w-full mt-2">
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
                <AreaChart data={activeSeries} margin={{ top: 8, right: 6, bottom: 0, left: 6 }}>
                  <defs>
                    <linearGradient id="labRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1769E0" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#1769E0" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="t" 
                    tickLine={false} 
                    axisLine={{ stroke: '#E5E7EB' }} 
                    tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }}
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
                    fill="url(#labRevGrad)" 
                    dot={{ fill: '#1769E0', r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#1769E0', stroke: '#FFFFFF', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Today's Orders / Live Queue */}
        <motion.div 
          initial={{ opacity: 0, y: 8 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.15 }} 
          className="bg-surface rounded-2xl p-4 md:p-6 border border-border shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h2 className="text-lg font-bold text-[#172033]">Recent Orders</h2>
              <p className="text-xs text-[#667085]">
                {data?.todayOrders?.length || 0} active orders in laboratory queue
              </p>
            </div>
            <button 
              type="button"
              onClick={() => navigate('/lab/orders')} 
              className="text-sm text-primary font-semibold flex items-center gap-1 hover:underline active:scale-95 transition-all"
            >
              View Queue <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[340px] pr-1">
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
                  transition={{ delay: 0.04 * i }}
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

      </div>

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
