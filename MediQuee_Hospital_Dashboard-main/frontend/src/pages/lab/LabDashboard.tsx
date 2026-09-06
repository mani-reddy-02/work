import { useState } from "react"
import { motion } from "framer-motion"
import { ClipboardList, TestTube, FileText, IndianRupee, ChevronRight, User } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { AreaChart, Area, Tooltip, ResponsiveContainer } from "recharts"
import { LabKpiCard, StatusBadge } from "@/components/lab/LabUI"
import { cn } from "@/lib/utils"
import { ConditionLabel } from "@/components/shared/ConditionLabel"

const revenueData = {
  today: [
    { t: '8am', v: 2200 }, { t: '10am', v: 4500 }, { t: '12pm', v: 6800 },
    { t: '2pm', v: 9100 }, { t: '4pm', v: 12400 }, { t: '6pm', v: 15800 }, { t: 'Now', v: 24500 },
  ],
  week: [
    { t: 'Mon', v: 18000 }, { t: 'Tue', v: 22500 }, { t: 'Wed', v: 19000 },
    { t: 'Thu', v: 28000 }, { t: 'Fri', v: 31000 }, { t: 'Sat', v: 24500 },
  ],
  month: [
    { t: 'W1', v: 95000 }, { t: 'W2', v: 112000 }, { t: 'W3', v: 88000 }, { t: 'W4', v: 142000 },
  ],
}

const todayOrders = [
  { id: 'MQ-10284', patient: 'Ramesh Kumar', test: 'CBC + Lipid Profile', sample: 'Blood', time: '10:30 AM', status: 'processing' as const },
  { id: 'MQ-10285', patient: 'Priya Sharma', test: 'Thyroid Profile', sample: 'Blood', time: '11:15 AM', status: 'ready' as const },
  { id: 'MQ-10286', patient: 'Mohammed Ali', test: 'Urine Routine', sample: 'Urine', time: '12:00 PM', status: 'pending' as const },
  { id: 'MQ-10287', patient: 'Lakshmi Devi', test: 'Blood Sugar (HbA1c)', sample: 'Blood', time: '1:30 PM', status: 'collected' as const },
]

const testStatus = [
  { label: 'Pending', count: 18, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { label: 'Collected', count: 24, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { label: 'Processing', count: 32, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { label: 'Ready', count: 12, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function LabDashboard() {
  const navigate = useNavigate()
  const [revPeriod, setRevPeriod] = useState<'today' | 'week' | 'month'>('today')

  return (
    <div className="flex flex-col gap-5 md:gap-8 px-4 md:px-0 pt-5 pb-4 w-full">

      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <p className="text-[22px] md:text-[28px] font-bold text-[#172033]">{getGreeting()}, MediQuee Lab 👋</p>
        <p className="text-[14px] md:text-[16px] text-[#667085] mt-0.5 md:mt-1">Here's what's happening at your lab today.</p>
      </motion.div>

      {/* KPI Grid */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <LabKpiCard icon={ClipboardList} label="Total Orders" value="128" trend="↑ 12%" iconBg="bg-blue-50" iconColor="text-primary" />
        <LabKpiCard icon={TestTube} label="Pending Tests" value="18" trend="↑ 8%" iconBg="bg-amber-50" iconColor="text-amber-600" />
        <LabKpiCard icon={FileText} label="Reports Ready" value="86" trend="↑ 10%" iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <LabKpiCard icon={IndianRupee} label="Today's Revenue" value="₹24,500" trend="↑ 15%" iconBg="bg-purple-50" iconColor="text-purple-600" />
      </motion.div>

      {/* Test Status */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[17px] md:text-[19px] font-bold text-[#172033]">Test Status</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none -mx-0 md:flex-wrap md:overflow-visible">
          {testStatus.map(s => (
            <div key={s.label} className={cn("flex-shrink-0 md:flex-1 md:min-w-[150px] flex flex-col items-center gap-1 px-5 py-3 md:py-4 rounded-2xl border bg-white", s.color)}>
              <span className="text-[22px] md:text-[26px] font-bold">{s.count}</span>
              <span className="text-[12px] md:text-[14px] font-semibold whitespace-nowrap">{s.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Main Content Grid (Chart + Orders) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        {/* Revenue Chart */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }} className="bg-white rounded-2xl p-4 md:p-6 border border-gray-100 shadow-sm flex flex-col h-full">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-[13px] md:text-[14px] text-[#667085] font-medium">Revenue</p>
              <p className="text-[24px] md:text-[32px] font-bold text-[#172033]">₹24,500</p>
              <p className="text-[12px] md:text-[13px] text-emerald-600 font-semibold mt-0.5">↑ 15% vs previous period</p>
            </div>
            <div className="flex bg-[#F7F8FA] rounded-xl p-1 gap-1 shrink-0 self-start">
              {(['today', 'week', 'month'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setRevPeriod(p)}
                  className={cn(
                    "px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[12px] md:text-[13px] font-semibold transition-colors capitalize",
                    revPeriod === p ? "bg-white text-primary shadow-sm" : "text-[#667085] hover:bg-gray-100"
                  )}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[90px] md:h-[200px] mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData[revPeriod]} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1769E0" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1769E0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 12 }}
                  formatter={(v: any) => [`₹${v.toLocaleString()}`, 'Revenue']}
                  labelStyle={{ color: '#667085' }}
                />
                <Area type="monotone" dataKey="v" stroke="#1769E0" strokeWidth={2} fill="url(#revGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Today's Orders */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="bg-white rounded-2xl p-4 md:p-6 border border-gray-100 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[17px] md:text-[19px] font-bold text-[#172033]">Today's Orders</h2>
            <button onClick={() => navigate('/lab/orders')} className="text-[13px] md:text-[14px] text-primary font-semibold flex items-center gap-0.5 hover:underline">
              View All <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-2 md:gap-3 flex-1 overflow-y-auto">
            {todayOrders.map((order, i) => (
              <motion.button
                key={order.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 + i * 0.05 }}
                onClick={() => navigate(`/lab/order/${order.id}`)}
                className="w-full bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3 active:scale-[0.98] transition-all hover:border-primary/20 hover:shadow-md text-left"
              >
                {/* Avatar */}
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 md:w-6 md:h-6 text-primary" strokeWidth={1.5} />
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] md:text-[15px] font-semibold text-[#172033] truncate">{order.patient}</p>
                  <ConditionLabel name={order.test} textClassName="text-[12px] md:text-[13px] text-[#667085]" iconClassName="w-4 h-4" />
                  <p className="text-[11px] md:text-[12px] text-[#98A2B3] mt-0.5">{order.sample} · {order.time}</p>
                </div>
                <StatusBadge status={order.status} />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

    </div>
  )
}
