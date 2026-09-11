import { Calendar as CalendarIcon, Stethoscope, Video, Home, FlaskConical, TestTube, ArrowUp, IndianRupee, TrendingUp } from "lucide-react"
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts'
import { cn } from "@/lib/utils"

export function Payouts() {
  const payoutData = [
    { name: 'Mon', value: 45000 },
    { name: 'Tue', value: 52000 },
    { name: 'Wed', value: 38000 },
    { name: 'Thu', value: 65000 },
    { name: 'Fri', value: 48000 },
    { name: 'Sat', value: 72000 },
    { name: 'Sun', value: 85000 },
  ];

  const transactions = [
    { id: 'TXN-10245', service: 'OP', type: 'OP', icon: Stethoscope, date: '14 May · 09:00 AM', amount: '₹500', status: 'Paid', statusColor: 'bg-green-50 text-success border-green-100' },
    { id: 'TXN-10246', service: 'Video Consultation', type: 'Video', icon: Video, date: '14 May · 09:30 AM', amount: '₹300', status: 'Paid', statusColor: 'bg-green-50 text-success border-green-100' },
    { id: 'TXN-10247', service: 'Home Nursing', type: 'Nursing', icon: Home, date: '14 May · 10:00 AM', amount: '₹800', status: 'Pending', statusColor: 'bg-orange-50 text-warning border-orange-100' },
    { id: 'TXN-10248', service: 'Lab Tests', type: 'Lab', icon: FlaskConical, date: '14 May · 11:15 AM', amount: '₹1,200', status: 'Failed', statusColor: 'bg-red-50 text-destructive border-red-100' },
  ];

  return (
    <div className="flex flex-col bg-background min-h-full pb-6">
      
      {/* Sticky Top Controls */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-4 pb-3 px-4 flex justify-between items-center border-b border-gray-100/50 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <h1 className="text-[22px] font-semibold text-[#172033]">Payouts</h1>
        <button className="p-2 -mr-2 text-[#172033] interactive-element">
          <CalendarIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col gap-5 px-4 pt-4">
        
        {/* Date Range Selector */}
        <button className="flex items-center gap-2 bg-white rounded-xl px-3.5 py-2.5 shadow-sm border border-gray-200/60 w-max interactive-element active:scale-95 transition-transform">
          <CalendarIcon className="w-4 h-4 text-primary" />
          <span className="text-[13px] font-semibold text-[#172033]">01 May 2025 – 14 May 2025</span>
        </button>

        {/* Total Payout Summary */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-primary/20 relative overflow-hidden flex flex-col gap-1">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-primary pointer-events-none">
            <TrendingUp className="w-24 h-24 -mt-4 -mr-4" strokeWidth={1} />
          </div>
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center text-primary">
              <IndianRupee className="w-3.5 h-3.5" strokeWidth={2.5} />
            </div>
            <span className="text-[14px] font-semibold text-[#667085]">Total Payout</span>
          </div>
          <div className="text-[32px] font-bold text-[#172033] tracking-tight relative z-10 mt-1">
            ₹8,45,000
          </div>
          <div className="flex items-center text-[12px] font-semibold text-success bg-green-50 px-2.5 py-1 rounded-full w-max mt-2 relative z-10">
            <ArrowUp className="w-3.5 h-3.5 mr-1" />
            14.5% vs previous period
          </div>
        </div>

        {/* Payout by Service */}
        <div className="flex flex-col gap-3">
          <h3 className="text-[17px] font-semibold text-[#172033] px-1">Payout by Service</h3>
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
            
            <div className="flex items-center justify-between p-3.5 border-b border-gray-100 last:border-0 interactive-element active:bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center shrink-0">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <span className="text-[14px] font-semibold text-[#172033]">OP</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[14px] font-bold text-[#172033]">₹3,25,000</span>
                <span className="text-[11px] font-semibold text-[#667085]">38.46%</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 border-b border-gray-100 last:border-0 interactive-element active:bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#8B5CF6] flex items-center justify-center shrink-0">
                  <Video className="w-4 h-4" />
                </div>
                <span className="text-[14px] font-semibold text-[#172033]">Video Consultation</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[14px] font-bold text-[#172033]">₹1,25,000</span>
                <span className="text-[11px] font-semibold text-[#667085]">14.79%</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 border-b border-gray-100 last:border-0 interactive-element active:bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-50 text-success flex items-center justify-center shrink-0">
                  <Home className="w-4 h-4" />
                </div>
                <span className="text-[14px] font-semibold text-[#172033]">Home Nursing</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[14px] font-bold text-[#172033]">₹1,75,000</span>
                <span className="text-[11px] font-semibold text-[#667085]">20.71%</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 border-b border-gray-100 last:border-0 interactive-element active:bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-pink-50 text-[#ec4899] flex items-center justify-center shrink-0">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <span className="text-[14px] font-semibold text-[#172033]">Lab Tests</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[14px] font-bold text-[#172033]">₹1,45,000</span>
                <span className="text-[11px] font-semibold text-[#667085]">17.16%</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 border-b border-gray-100 last:border-0 interactive-element active:bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#f97316] flex items-center justify-center shrink-0">
                  <TestTube className="w-4 h-4" />
                </div>
                <span className="text-[14px] font-semibold text-[#172033] line-clamp-1">Home Sample Collection</span>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className="text-[14px] font-bold text-[#172033]">₹75,000</span>
                <span className="text-[11px] font-semibold text-[#667085]">8.88%</span>
              </div>
            </div>

          </div>
        </div>

        {/* Payout Summary KPI Grid */}
        <div className="flex flex-col gap-3">
          <h3 className="text-[17px] font-semibold text-[#172033] px-1">Payout Summary</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-gray-200/60 flex flex-col gap-1">
              <span className="text-[12px] font-semibold text-[#667085]">Total Transactions</span>
              <span className="text-[20px] font-bold text-[#172033]">2,456</span>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-gray-200/60 flex flex-col gap-1">
              <span className="text-[12px] font-semibold text-[#667085]">Average Payout</span>
              <span className="text-[20px] font-bold text-[#172033]">₹3,442</span>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-gray-200/60 flex flex-col gap-1">
              <span className="text-[12px] font-semibold text-[#667085]">This Month</span>
              <span className="text-[20px] font-bold text-[#172033]">₹8,45k</span>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-gray-200/60 flex flex-col gap-1">
              <span className="text-[12px] font-semibold text-[#667085]">Last Month</span>
              <span className="text-[20px] font-bold text-[#172033]">₹7,38k</span>
            </div>
          </div>
        </div>

        {/* Payout Trend Chart */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.02)] p-4 flex flex-col gap-4 mt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-[#172033]">Payout Trend</h3>
            <div className="flex gap-1 bg-gray-50 p-1 rounded-xl">
              <button className="px-3 py-1 rounded-lg text-[12px] font-semibold text-primary bg-white shadow-sm">Week</button>
              <button className="px-3 py-1 rounded-lg text-[12px] font-medium text-[#667085] hover:text-[#172033] interactive-element">Month</button>
              <button className="px-3 py-1 rounded-lg text-[12px] font-medium text-[#667085] hover:text-[#172033] interactive-element">Year</button>
            </div>
          </div>
          
          <div className="h-[140px] w-full mt-2 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={payoutData}>
                <defs>
                  <linearGradient id="colorPayout" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1769E0" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#1769E0" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px' }}
                  itemStyle={{ color: '#1769E0', fontWeight: '600' }}
                  cursor={{ stroke: '#E5E7EB', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area type="monotone" dataKey="value" stroke="#1769E0" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPayout)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Payouts List */}
        <div className="flex flex-col gap-3 mt-1">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[17px] font-semibold text-[#172033]">Recent Payouts</h3>
            <button className="text-[13px] font-semibold text-primary interactive-element">View All</button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
            {transactions.map((txn, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3.5 border-b border-gray-100 last:border-0 interactive-element active:bg-gray-50/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gray-50 text-[#667085] flex items-center justify-center shrink-0 border border-gray-100">
                  <txn.icon className="w-4 h-4" />
                </div>
                
                <div className="flex flex-col flex-1 gap-0.5">
                  <div className="flex justify-between items-start">
                    <span className="text-[14px] font-semibold text-[#172033]">{txn.service}</span>
                    <span className="text-[14px] font-bold text-[#172033]">{txn.amount}</span>
                  </div>
                  <span className="text-[12px] font-medium text-[#667085]">{txn.id}</span>
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
    </div>
  )
}
