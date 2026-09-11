import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Plus, MapPin, Clock, User, Home } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { StatusBadge } from "@/components/lab/LabUI"
import { cn } from "@/lib/utils"

const mockRequests = [
  { id: 'HC-001', patient: 'Sunita Patel', address: '42, MG Road, Banjara Hills', test: 'CBC + Thyroid', date: 'Today', time: '9:00 AM', status: 'pending' as const, fee: '₹150' },
  { id: 'HC-002', patient: 'Rahul Sharma', address: '8/B, Jubilee Hills, Near Park', test: 'Lipid Profile', date: 'Today', time: '11:00 AM', status: 'collected' as const, fee: '₹150' },
  { id: 'HC-003', patient: 'Anita Rao', address: '15, Film Nagar, Hyderabad', test: 'Urine Routine', date: 'Tomorrow', time: '8:30 AM', status: 'pending' as const, fee: '₹150' },
]

const filters = ['All', 'Pending', 'Collected', 'Completed']
const filterMap: Record<string, string> = { 'Pending': 'pending', 'Collected': 'collected', 'Completed': 'delivered' }

export function HomeCollection() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState('All')

  const filtered = activeFilter === 'All' ? mockRequests : mockRequests.filter(r => r.status === filterMap[activeFilter])

  return (
    <div className="flex flex-col bg-background min-h-screen w-full">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-4 md:pt-6 pb-3 md:pb-4 px-4 md:px-6 flex items-center gap-4 border-b border-gray-100/50">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[#172033] rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <h1 className="text-[18px] md:text-[22px] font-bold text-[#172033]">Home Collection</h1>
        <button onClick={() => navigate('/lab/home-collection/create')} className="ml-auto flex items-center gap-1.5 md:gap-2 bg-primary text-white text-[13px] md:text-[14px] font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-colors">
          <Plus className="w-4 h-4 md:w-5 md:h-5" />New<span className="hidden sm:inline"> Request</span>
        </button>
      </div>

      <div className="flex flex-col gap-4 md:gap-6 px-4 md:px-6 pt-5 md:pt-8 w-full max-w-7xl mx-auto">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 max-w-3xl">
          {[
            { label: "Today's", count: 2, color: 'text-primary', bg: 'bg-blue-50', border: 'border-blue-200' },
            { label: 'Scheduled', count: 1, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
            { label: 'Completed', count: 4, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          ].map(s => (
            <div key={s.label} className={cn("flex flex-col items-center py-3 md:py-4 rounded-2xl md:rounded-3xl border transition-all hover:shadow-sm", s.bg, s.border)}>
              <span className={cn("text-[22px] md:text-[28px] font-bold", s.color)}>{s.count}</span>
              <span className={cn("text-[11px] md:text-[13px] font-semibold mt-0.5", s.color)}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={cn(
                "flex-shrink-0 px-4 py-2 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl text-[13px] md:text-[14px] font-semibold transition-all border",
                activeFilter === f ? "bg-primary text-white border-primary shadow-sm" : "bg-white text-[#667085] border-gray-200/60 hover:bg-gray-50"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Request List */}
        <div className="pb-4 md:pb-8">
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-16 md:py-24 text-center">
                <div className="w-14 h-14 md:w-20 md:h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-3 md:mb-5"><Home className="w-6 h-6 md:w-8 md:h-8 text-[#98A2B3]" /></div>
                <p className="text-[16px] md:text-[18px] font-semibold text-[#172033]">No Collection Requests</p>
                <p className="text-[13px] md:text-[15px] text-[#667085] mt-1 md:mt-2">Scheduled collections will appear here</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 w-full">
                {filtered.map((req, i) => (
                  <motion.div
                    key={req.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5 flex flex-col gap-3 md:gap-4 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 md:w-6 md:h-6 text-primary" strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-[14px] md:text-[16px] font-bold text-[#172033]">{req.patient}</p>
                          <p className="text-[12px] md:text-[14px] text-[#667085]">{req.test}</p>
                        </div>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                    <div className="flex flex-col gap-1.5 md:gap-2 pl-1">
                      <div className="flex items-center gap-2 text-[12px] md:text-[14px] text-[#667085]">
                        <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                        <span className="truncate">{req.address}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[12px] md:text-[14px] text-[#667085]">
                          <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          {req.date} · {req.time}
                        </div>
                        <span className="text-[12px] md:text-[14px] font-semibold text-primary bg-primary/5 px-2 py-1 rounded-lg">{req.fee}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
