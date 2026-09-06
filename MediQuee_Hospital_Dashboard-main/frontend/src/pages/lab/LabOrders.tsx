import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Filter, ChevronRight, User, Calendar } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { StatusBadge } from "@/components/lab/LabUI"
import { cn } from "@/lib/utils"
import { ConditionLabel } from "@/components/shared/ConditionLabel"

const services = ['All', 'Blood', 'Urine', 'Pathology', 'Imaging']

const dates = ['Today', '14 Aug', '13 Aug', '12 Aug', '11 Aug', '10 Aug']


const allOrders = [
  { id: 'MQ-10284', patient: 'Ramesh Kumar', test: 'CBC + Lipid Profile', sample: 'Blood', time: '10:30 AM', amount: '₹850', status: 'processing' as const, service: 'Blood', type: 'In-Person' },
  { id: 'MQ-10285', patient: 'Priya Sharma', test: 'Thyroid Profile', sample: 'Blood', time: '11:15 AM', amount: '₹650', status: 'ready' as const, service: 'Blood', type: 'In-Person' },
  { id: 'MQ-10286', patient: 'Mohammed Ali', test: 'Urine Routine', sample: 'Urine', time: '12:00 PM', amount: '₹200', status: 'pending' as const, service: 'Urine', type: 'In-Person' },
  { id: 'MQ-10287', patient: 'Lakshmi Devi', test: 'HbA1c', sample: 'Blood', time: '1:30 PM', amount: '₹450', status: 'collected' as const, service: 'Blood', type: 'In-Person' },
  { id: 'MQ-10288', patient: 'Vijay Rajan', test: 'X-Ray Chest', sample: 'Imaging', time: '2:00 PM', amount: '₹350', status: 'pending' as const, service: 'Imaging', type: 'In-Person' },
  { id: 'MQ-10289', patient: 'Sunita Patel', test: 'Liver Function Test', sample: 'Blood', time: '3:00 PM', amount: '₹750', status: 'delivered' as const, service: 'Blood', type: 'In-Person' },
  { id: 'MQ-10290', patient: 'Arjun Mehta', test: 'Urine Culture', sample: 'Urine', time: '4:30 PM', amount: '₹300', status: 'processing' as const, service: 'Urine', type: 'In-Person' },
  { id: 'MQ-10291', patient: 'Kavya Nair', test: 'CBC', sample: 'Blood', time: '9:00 AM', amount: '₹300 + ₹100', status: 'collected' as const, service: 'Blood', type: 'Home Collection' },
]

export function LabOrders() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [activeService, setActiveService] = useState('All')
  const [activeDate, setActiveDate] = useState('Today')
  const [activeMainSection, setActiveMainSection] = useState<'In-Person' | 'Home Collection'>('In-Person')

  const filtered = allOrders.filter(o => {
    const matchMainSection = o.type === activeMainSection
    const matchService = activeService === 'All' || o.service === activeService
    const matchSearch = !search || o.patient.toLowerCase().includes(search.toLowerCase()) || o.test.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase())
    return matchMainSection && matchService && matchSearch
  })

  return (
    <div className="flex flex-col bg-background min-h-full w-full">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md px-4 md:px-6 pt-5 md:pt-6 pb-3 md:pb-4 border-b border-gray-100/50">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-[22px] md:text-[26px] font-bold text-[#172033]">Test Orders</h1>
          <button className="w-9 h-9 md:w-10 md:h-10 bg-white rounded-xl border border-gray-200/60 flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4 md:w-5 md:h-5 text-[#667085]" />
          </button>
        </div>
        
        {/* Main Sections */}
        <div className="flex bg-gray-100/80 p-1 rounded-xl mb-4 md:max-w-md">
          <button 
            onClick={() => setActiveMainSection('In-Person')}
            className={cn("flex-1 py-2 text-[13px] font-bold rounded-lg transition-all", activeMainSection === 'In-Person' ? "bg-white text-primary shadow-sm" : "text-[#667085] hover:text-[#172033]")}
          >
            In-Person
          </button>
          <button 
            onClick={() => setActiveMainSection('Home Collection')}
            className={cn("flex-1 py-2 text-[13px] font-bold rounded-lg transition-all", activeMainSection === 'Home Collection' ? "bg-white text-primary shadow-sm" : "text-[#667085] hover:text-[#172033]")}
          >
            Home Collection
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-[#98A2B3]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search patient, test, order ID…"
            className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-white border border-gray-200/60 rounded-xl text-[14px] md:text-[15px] text-[#172033] placeholder:text-[#98A2B3] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between px-4 md:px-6">
        {/* Service Filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none py-3 md:py-4 md:flex-wrap">
          {services.map(s => (
            <button
              key={s}
              onClick={() => setActiveService(s)}
              className={cn(
                "flex-shrink-0 px-4 py-2 md:px-5 md:py-2.5 rounded-xl text-[13px] md:text-[14px] font-semibold transition-colors border",
                activeService === s
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-white text-[#667085] border-gray-200/60 hover:bg-gray-50"
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-3 md:pb-0 md:py-4">
          {dates.map(d => (
            <button
              key={d}
              onClick={() => setActiveDate(d)}
              className={cn(
                "flex-shrink-0 px-4 py-2 md:px-5 md:py-2.5 rounded-xl text-[13px] md:text-[14px] font-semibold transition-colors border",
                activeDate === d
                  ? "bg-[#172033] text-white border-[#172033] shadow-sm"
                  : "bg-white text-[#667085] border-gray-200/60 hover:bg-gray-50"
              )}
            >
              {d}
            </button>
          ))}
          <button className="flex-shrink-0 w-9 h-9 md:w-[42px] md:h-[42px] bg-white rounded-xl border border-gray-200/60 flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors">
            <Calendar className="w-4 h-4 md:w-5 md:h-5 text-[#667085]" />
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="px-4 md:px-6 pb-4 md:pb-8">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
              <div className="w-14 h-14 md:w-20 md:h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-3 md:mb-5">
                <Search className="w-6 h-6 md:w-8 md:h-8 text-[#98A2B3]" />
              </div>
              <p className="text-[16px] md:text-[18px] font-semibold text-[#172033]">No orders found</p>
              <p className="text-[13px] md:text-[15px] text-[#667085] mt-1">Adjust your search or filter</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 w-full">
              {filtered.map((order, i) => (
                <motion.button
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => navigate(`/lab/order/${order.id}`)}
                  className="w-full bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3 active:scale-[0.98] transition-all hover:border-primary/20 hover:shadow-md text-left"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 md:w-6 md:h-6 text-primary" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[14px] md:text-[15px] font-semibold text-[#172033] truncate">{order.patient}</p>
                      <span className="text-[13px] md:text-[14px] font-bold text-[#172033] shrink-0">{order.amount}</span>
                    </div>
                    <ConditionLabel name={order.test} textClassName="text-[12px] md:text-[13px] text-[#667085]" iconClassName="w-4 h-4" />
                    <div className="flex items-center justify-between mt-1.5 md:mt-2">
                      <span className="text-[11px] md:text-[12px] text-[#98A2B3]">{order.id} · {order.time}</span>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#98A2B3] shrink-0 hidden md:block" />
                </motion.button>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
