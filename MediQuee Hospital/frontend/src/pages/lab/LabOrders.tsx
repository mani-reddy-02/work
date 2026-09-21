import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Filter, ChevronRight, User, Calendar, X, Loader2, Home, Check } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { StatusBadge } from "@/components/lab/LabUI"
import { cn } from "@/lib/utils"
import { labApi } from "@/services/labApi"
import { useToast } from "@/context/ToastContext"

const mainSections = ['All', 'In-Person', 'Home Collection'] as const;

export function LabOrders() {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [search, setSearch] = useState('')
  const [activeMainSection, setActiveMainSection] = useState<typeof mainSections[number]>('All')
  
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Phlebotomist Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [phlebName, setPhlebName] = useState('')
  const [phlebPhone, setPhlebPhone] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)

  const fetchOrders = async () => {
    setIsLoading(true)
    try {
      let bookingType = 'All'
      if (activeMainSection === 'In-Person') bookingType = 'WALK_IN'
      if (activeMainSection === 'Home Collection') bookingType = 'HOME_COLLECTION'

      const res = await labApi.getLabBookings({ bookingType })
      setOrders(res.data)
    } catch (error) {
      toast("Failed to load lab orders", "error")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [activeMainSection])

  const filtered = orders.filter(o => {
    const matchSearch = !search || 
      o.patient?.name?.toLowerCase().includes(search.toLowerCase()) || 
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.items.some((i: any) => i.labTest.platformTest.name.toLowerCase().includes(search.toLowerCase()))
    return matchSearch
  })

  const updateStatus = async (id: string, newStatus: string, payload: any = {}) => {
    try {
      await labApi.updateLabBookingStatus(id, { status: newStatus, ...payload })
      toast(`Order marked as ${newStatus.replace('_', ' ')}`, "success")
      setAssignModalOpen(false)
      fetchOrders()
    } catch (error: any) {
      toast(error.message || "Failed to update status", "error")
    }
  }

  const handleAction = (order: any) => {
    if (order.status === 'REQUESTED') {
      if (order.bookingType === 'HOME_COLLECTION') {
        setSelectedOrderId(order.id)
        setPhlebName('')
        setPhlebPhone('')
        setAssignModalOpen(true)
      } else {
        updateStatus(order.id, 'SAMPLE_COLLECTED')
      }
    } else if (order.status === 'ASSIGNED') {
      updateStatus(order.id, 'SAMPLE_COLLECTED')
    } else if (order.status === 'SAMPLE_COLLECTED') {
      updateStatus(order.id, 'IN_LAB_PROCESSING')
    } else if (order.status === 'IN_LAB_PROCESSING') {
      updateStatus(order.id, 'REPORT_READY')
    }
  }

  const getActionText = (order: any) => {
    if (order.status === 'REQUESTED') return order.bookingType === 'HOME_COLLECTION' ? 'Assign Technician' : 'Mark Collected'
    if (order.status === 'ASSIGNED') return 'Mark Collected'
    if (order.status === 'SAMPLE_COLLECTED') return 'Start Processing'
    if (order.status === 'IN_LAB_PROCESSING') return 'Upload Report'
    return null
  }

  return (
    <div className="flex flex-col bg-background min-h-full w-full">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md px-4 md:px-6 pt-5 md:pt-6 pb-3 md:pb-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-[22px] md:text-[26px] font-bold text-[#172033]">Lab Queue</h1>
          <button className="w-9 h-9 md:w-10 md:h-10 bg-surface rounded-xl border border-border/60 flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4 md:w-5 md:h-5 text-[#667085]" />
          </button>
        </div>
        
        {/* Main Sections */}
        <div className="flex bg-gray-100/80 p-1 rounded-xl mb-4 max-w-md">
          {mainSections.map(section => (
            <button 
              key={section}
              onClick={() => setActiveMainSection(section)}
              className={cn("flex-1 py-2 text-[13px] font-bold rounded-lg transition-all", activeMainSection === section ? "bg-surface text-primary shadow-sm" : "text-[#667085] hover:text-[#172033]")}
            >
              {section}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-[#98A2B3]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search patient, test, order ID…"
            className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-surface border border-border/60 rounded-xl text-[14px] md:text-[15px] text-[#172033] placeholder:text-[#98A2B3] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="px-4 md:px-6 pt-4 pb-4 md:pb-8">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
              <div className="w-14 h-14 md:w-20 md:h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-3 md:mb-5">
                <Search className="w-6 h-6 md:w-8 md:h-8 text-[#98A2B3]" />
              </div>
              <p className="text-[16px] md:text-[18px] font-semibold text-[#172033]">No orders found</p>
              <p className="text-[13px] md:text-[15px] text-[#667085] mt-1">Adjust your search or filter</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
              {filtered.map((order, i) => {
                const actionText = getActionText(order)
                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ delay: i * 0.04 }}
                    className="w-full bg-surface rounded-2xl border border-border shadow-sm transition-all hover:border-primary/20 hover:shadow-md flex flex-col overflow-hidden"
                  >
                    <div className="p-4 md:p-5 flex items-start gap-4 flex-1">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 md:w-6 md:h-6 text-primary" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[15px] md:text-[16px] font-semibold text-[#172033] truncate">{order.patient?.name}</p>
                          <span className="text-[14px] md:text-[15px] font-bold text-primary shrink-0">₹{order.totalAmount}</span>
                        </div>
                        <p className="text-[12px] md:text-[13px] text-[#667085]">{order.patient?.phone} • ID: {order.id.slice(0,8).toUpperCase()}</p>
                        
                        <div className="mt-3 space-y-1.5">
                          {order.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 bg-gray-50/80 p-2 rounded-lg border border-border">
                              <span className="text-[16px]">{item.labTest.platformTest.department?.icon || '🔬'}</span>
                              <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-semibold text-[#172033] truncate">{item.labTest.platformTest.name}</p>
                                <p className="text-[11px] text-[#667085]">Sample: {item.labTest.platformTest.specimenType}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50/50 p-4 border-t border-border">
                      {order.bookingType === 'HOME_COLLECTION' && (
                        <div className="mb-3 p-3 bg-green-50/50 rounded-xl border border-green-100">
                          <div className="flex items-center gap-2 mb-1">
                            <Home className="w-4 h-4 text-green-700" />
                            <span className="text-[13px] font-bold text-green-800">Home Collection Request</span>
                          </div>
                          <p className="text-[12px] text-green-700 font-medium">Slot: {new Date(order.collectionDate).toLocaleDateString()} • {order.collectionTimeSlot}</p>
                          <p className="text-[12px] text-green-600 truncate">{order.collectionAddress}</p>
                          {order.phlebotomistName && (
                            <p className="text-[12px] text-green-800 mt-2 font-medium bg-green-100 px-2 py-1 rounded-md w-fit">
                              Assigned: {order.phlebotomistName} ({order.phlebotomistPhone})
                            </p>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between gap-3">
                        <StatusBadge status={order.status} />
                        <div className="flex gap-2">
                          {actionText && (
                            <button onClick={() => handleAction(order)} className="px-3 py-1.5 md:px-4 md:py-2 bg-primary text-white text-[12px] md:text-[13px] font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                              {actionText}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Assign Technician Modal */}
      <AnimatePresence>
        {assignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAssignModalOpen(false)} className="absolute inset-0 bg-[#172033]/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-surface rounded-2xl shadow-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 md:p-5 border-b border-border">
                <h3 className="text-[16px] md:text-[18px] font-bold text-[#172033]">Assign Phlebotomist</h3>
                <button onClick={() => setAssignModalOpen(false)} className="p-2 -mr-2 text-[#98A2B3] hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-4 md:p-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-[#172033]">Technician Name <span className="text-destructive">*</span></label>
                  <input value={phlebName} onChange={e => setPhlebName(e.target.value)} placeholder="Enter name" className="w-full px-3 py-2.5 bg-surface border border-border/60 rounded-xl text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-[#172033]">Phone Number <span className="text-destructive">*</span></label>
                  <input value={phlebPhone} onChange={e => setPhlebPhone(e.target.value)} placeholder="Enter phone" className="w-full px-3 py-2.5 bg-surface border border-border/60 rounded-xl text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div className="p-4 md:p-5 bg-gray-50 border-t border-border flex gap-3">
                <button onClick={() => setAssignModalOpen(false)} className="flex-1 py-2.5 bg-surface border border-border text-[#172033] font-semibold rounded-xl text-[14px]">Cancel</button>
                <button 
                  disabled={!phlebName || !phlebPhone || isAssigning}
                  onClick={async () => {
                    setIsAssigning(true)
                    await updateStatus(selectedOrderId!, 'ASSIGNED', { phlebotomistName: phlebName, phlebotomistPhone: phlebPhone })
                    setIsAssigning(false)
                  }} 
                  className="flex-1 py-2.5 bg-primary text-white font-semibold rounded-xl text-[14px] disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isAssigning && <Loader2 className="w-4 h-4 animate-spin" />}
                  Assign
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
