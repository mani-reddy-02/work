import { Search, Filter, Calendar, ArrowLeft, Play, FileText, Plus, User, ChevronRight, X, Check, RotateCcw, SlidersHorizontal, Eye, Upload, Home, FlaskConical, Clock, MapPin, Loader2 } from "lucide-react"
import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate, useSearchParams, useLocation } from "react-router-dom"
import { LabOrderQuickModal } from "@/components/lab/LabOrderQuickModal"
import { Skeleton } from "@/components/ui/Skeleton"
import { EmptyState } from "@/components/ui/EmptyState"
import { cn } from "@/lib/utils"
import { labApi } from "@/services/labApi"
import { useToast } from "@/context/ToastContext"

export function LabOrders() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // Filter and Category States
  const [selectedFilter, setSelectedFilter] = useState(() => searchParams.get('type') || 'all')
  const [selectedDate, setSelectedDate] = useState(() => searchParams.get('date') || 'upcoming')
  const [selectedStatus, setSelectedStatus] = useState<string>(() => searchParams.get('status') || 'ALL')
  const [sortOrder, setSortOrder] = useState<'earliest' | 'latest'>('earliest')
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Assign Technician Modal State (for Home Collection)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [phlebName, setPhlebName] = useState('')
  const [phlebPhone, setPhlebPhone] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)

  const dateInputRef = useRef<HTMLInputElement>(null)

  const filterTypes = [
    { id: 'all', label: 'All' },
    { id: 'in_person', label: 'Walk-in Lab' },
    { id: 'home_sample', label: 'Home Sample Collection' },
    { id: 'blood', label: 'Blood Tests' },
    { id: 'pathology', label: 'Pathology & Biopsy' },
    { id: 'routine', label: 'Routine Diagnostics' },
  ]

  // Dynamic 14-day date strip starting from today
  const today = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const todayIso = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`

  const dates = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    const dayStr = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' })
    const dateStr = `${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}`
    return { iso, date: dateStr, day: dayStr }
  })

  const [orders, setOrders] = useState<any[]>([])

  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await labApi.getLabBookings()
      setOrders(res.data || [])
    } catch (error) {
      console.error("Failed to load lab bookings:", error)
      toast("Failed to load lab orders", "error")
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Helper to extract clean date and time info from booking
  const parseBookingDateTime = (b: any) => {
    const rawDate = b.collectionDate || b.createdAt
    const d = rawDate ? new Date(rawDate) : new Date()
    const isoDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

    let timeStr = '09:00'
    let period = 'AM'

    if (b.collectionTimeSlot) {
      const firstSlot = b.collectionTimeSlot.split('-')[0].trim()
      const parts = firstSlot.split(' ')
      timeStr = parts[0] || '09:00'
      period = parts[1] || 'AM'
    } else if (b.createdAt) {
      const timeFormatted = new Date(b.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      const parts = timeFormatted.split(' ')
      timeStr = parts[0] || '09:00'
      period = parts[1] || 'AM'
    }

    return { isoDate, timeStr, period }
  }

  // Normalized mapped orders for consistent UI rendering
  const mappedOrders = useMemo(() => {
    return orders.map((o: any) => {
      const { isoDate, timeStr, period } = parseBookingDateTime(o)
      const patientName = (typeof o.patient === 'object' && o.patient !== null ? o.patient?.name : o.patient) || 'Walk-in Patient'
      const patientPhone = (typeof o.patient === 'object' && o.patient !== null ? o.patient?.phone : o.phone) || ''
      const idDisplay = o.id ? `LB-${o.id.substring(0, 6).toUpperCase()}` : 'LB-000000'

      const testItems = (o.items || []).map((it: any) => it.labTest?.platformTest?.name || it.testName || 'Diagnostic Test')
      const testsSummary = testItems.join(' • ') || o.test || 'Diagnostic Test'
      const specimen = o.items?.[0]?.labTest?.platformTest?.specimenType || o.sample || 'Specimen'

      const isHome = o.bookingType === 'HOME_COLLECTION'

      const rawStatus = (o.status || 'PENDING').toUpperCase()
      let statusLabel = 'WAITING'
      if (rawStatus === 'REPORT_READY' || rawStatus === 'COMPLETED') statusLabel = 'COMPLETED'
      else if (rawStatus === 'IN_LAB_PROCESSING') statusLabel = 'IN PROCESSING'
      else if (rawStatus === 'SAMPLE_COLLECTED') statusLabel = 'SAMPLE COLLECTED'
      else if (rawStatus === 'ASSIGNED') statusLabel = 'ASSIGNED'
      else if (rawStatus === 'CANCELLED') statusLabel = 'CANCELLED'

      return {
        id: o.id,
        rawOrder: o,
        idDisplay,
        patientName,
        patientPhone,
        time: timeStr,
        period,
        date: isoDate,
        bookingType: o.bookingType || 'WALK_IN',
        isHome,
        testsSummary,
        specimen,
        totalAmount: o.totalAmount ?? 0,
        rawStatus,
        statusLabel,
        collectionAddress: o.collectionAddress,
        collectionTimeSlot: o.collectionTimeSlot,
        phlebotomistName: o.phlebotomistName,
        phlebotomistPhone: o.phlebotomistPhone,
        reportUrl: o.reportUrl
      }
    })
  }, [orders])

  // Base filtering across search query, top service filter, and date strip
  const baseFilteredOrders = useMemo(() => {
    return mappedOrders.filter(apt => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = apt.patientName.toLowerCase().includes(q)
        const matchPhone = apt.patientPhone.toLowerCase().includes(q)
        const matchId = apt.id.toLowerCase().includes(q) || apt.idDisplay.toLowerCase().includes(q)
        const matchTest = apt.testsSummary.toLowerCase().includes(q)
        if (!matchName && !matchPhone && !matchId && !matchTest) return false
      }

      // 2. Date Filter
      if (selectedDate !== 'upcoming') {
        if (apt.date !== selectedDate) return false
      }

      // 3. Category / Service Filter
      if (selectedFilter !== 'all') {
        if (selectedFilter === 'in_person' && apt.isHome) return false
        if (selectedFilter === 'home_sample' && !apt.isHome) return false

        const fullTestText = `${apt.testsSummary} ${apt.specimen}`.toLowerCase()
        if (selectedFilter === 'blood' && !/blood|serum|plasma|cbc|esr|sugar|glucose|lipid|lft|kft|hemoglobin|thyroid/i.test(fullTestText)) {
          return false
        }
        if (selectedFilter === 'pathology' && !/path|biopsy|urine|stool|tissue|culture|histology|cytology/i.test(fullTestText)) {
          return false
        }
        if (selectedFilter === 'routine' && /special|biopsy|genetic|imaging|ct|mri/i.test(fullTestText)) {
          return false
        }
      }

      return true
    })
  }, [mappedOrders, searchQuery, selectedDate, selectedFilter])

  // Summary counts matching the 4-box card in Pic 1
  const summaryCounts = useMemo(() => {
    return {
      total: baseFilteredOrders.length,
      waiting: baseFilteredOrders.filter(a => a.rawStatus === 'REQUESTED' || a.rawStatus === 'PENDING').length,
      inConsult: baseFilteredOrders.filter(a => a.rawStatus === 'ASSIGNED' || a.rawStatus === 'SAMPLE_COLLECTED' || a.rawStatus === 'IN_LAB_PROCESSING').length,
      completed: baseFilteredOrders.filter(a => a.rawStatus === 'REPORT_READY' || a.rawStatus === 'COMPLETED').length,
    }
  }, [baseFilteredOrders])

  // Final list filtered by status sub-filter if selected and sorted by time
  const filteredAppointments = useMemo(() => {
    return baseFilteredOrders
      .filter(apt => {
        if (selectedStatus === 'WAITING') {
          return apt.rawStatus === 'REQUESTED' || apt.rawStatus === 'PENDING'
        }
        if (selectedStatus === 'IN_CONSULTATION') {
          return apt.rawStatus === 'ASSIGNED' || apt.rawStatus === 'SAMPLE_COLLECTED' || apt.rawStatus === 'IN_LAB_PROCESSING'
        }
        if (selectedStatus === 'COMPLETED') {
          return apt.rawStatus === 'REPORT_READY' || apt.rawStatus === 'COMPLETED'
        }
        if (selectedStatus === 'CANCELLED') {
          return apt.rawStatus === 'CANCELLED'
        }
        return true // 'ALL'
      })
      .sort((a, b) => {
        if (sortOrder === 'latest') {
          return (b.time || '').localeCompare(a.time || '')
        }
        return (a.time || '').localeCompare(b.time || '')
      })
  }, [baseFilteredOrders, selectedStatus, sortOrder])

  const getCategoryLabel = (filterId: string) => {
    switch (filterId) {
      case 'in_person': return 'Walk-in Lab Orders'
      case 'home_sample': return 'Home Sample Collections'
      case 'blood': return 'Blood Test Orders'
      case 'pathology': return 'Pathology Test Orders'
      case 'routine': return 'Routine Diagnostic Orders'
      default: return 'Orders'
    }
  }

  const getSectionHeading = () => {
    const serviceText = getCategoryLabel(selectedFilter)
    if (selectedDate === 'upcoming') {
      return `Upcoming ${serviceText}`
    }
    if (selectedDate === todayIso) {
      return `Today's ${serviceText}`
    }
    const dateObj = dates.find(d => d.iso === selectedDate)
    const formattedDate = dateObj ? dateObj.date : selectedDate
    return `${serviceText} on ${formattedDate}`
  }

  const activeFiltersCount = (selectedFilter !== 'all' ? 1 : 0) + (selectedStatus !== 'ALL' ? 1 : 0) + (sortOrder !== 'earliest' ? 1 : 0)

  // Status update actions
  const updateStatus = async (id: string, newStatus: string, payload: any = {}) => {
    try {
      await labApi.updateLabBookingStatus(id, { status: newStatus, ...payload })
      toast(`Order marked as ${newStatus.replace(/_/g, ' ')}`, "success")
      setAssignModalOpen(false)
      fetchOrders()
    } catch (error: any) {
      toast(error.message || "Failed to update status", "error")
    }
  }

  const handleAction = (order: any) => {
    if (order.status === 'REQUESTED' || order.status === 'PENDING') {
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
      navigate(`/lab/upload-report?orderId=${order.id}`)
    }
  }

  return (
    <div className="flex flex-col bg-background min-h-full pb-16 transition-colors">
      
      {/* ── 1. Top Header Section (Aligned with Pic 1) ────────────────────── */}
      <div className="bg-surface pt-5 pb-3 px-4 flex flex-col gap-4 border-b border-border shadow-sm">
        
        {/* Header Block: Back Button, Title, Walk-in Registration Button */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/lab')} 
            className="p-2 -ml-2 text-foreground hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-[22px] font-black text-foreground tracking-tight">Orders</h1>
          </div>
          <button 
            onClick={() => navigate('/lab/create-order')}
            className="flex items-center gap-1.5 bg-[#1B5DF1] hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
            title="Register a new walk-in or home collection order"
          >
            <Plus className="w-4 h-4" />
            <span>Walk-in Registration</span>
          </button>
        </div>

        {/* Search Bar & Filter Button (Matching Pic 1) */}
        <div className="flex flex-col gap-4">
          <div className="relative group flex items-center">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted/70 group-focus-within:text-[#1B5DF1] transition-colors">
              <Search className="w-4 h-4" />
            </div>
            <input 
              type="text" 
              placeholder="Search by name, ID or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-24 py-3.5 bg-surface border border-border rounded-[16px] outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-[15px] font-medium text-foreground placeholder:text-muted shadow-sm"
            />
            <button 
              type="button"
              onClick={() => setIsFilterModalOpen(prev => !prev)}
              title="Open Filters"
              className={cn(
                "absolute right-2.5 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all text-xs font-bold active:scale-95 cursor-pointer",
                activeFiltersCount > 0 
                  ? "bg-[#1B5DF1] text-white shadow-sm" 
                  : "bg-gray-50 hover:bg-blue-50 text-[#1B5DF1] border border-border/80"
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-surface text-[#1B5DF1] text-[10px] flex items-center justify-center font-black">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category Filter Pills (Appropriate Lab Options) */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {filterTypes.map((type) => {
            const isActive = selectedFilter === type.id
            return (
              <button 
                key={type.id}
                onClick={() => setSelectedFilter(type.id)}
                className={cn(
                  "px-5 py-2 rounded-full flex-shrink-0 transition-all active:scale-95 font-bold text-[13px] cursor-pointer",
                  isActive ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-surface text-muted border border-border hover:bg-gray-50"
                )}
              >
                {type.label}
              </button>
            )
          })}
        </div>

        {/* 14-Day Date Strip & Interactive Calendar Picker */}
        <div className="flex items-center gap-2.5 mt-0.5">
          {/* Calendar Picker Trigger */}
          <div className="relative flex items-center">
            <input 
              type="date" 
              ref={dateInputRef}
              value={selectedDate !== 'upcoming' ? selectedDate : ''}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(e.target.value)
                }
              }}
              className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
              aria-label="Pick date from calendar"
            />
            <button 
              onClick={() => {
                if (dateInputRef.current) {
                  if ('showPicker' in HTMLInputElement.prototype && typeof (dateInputRef.current as any).showPicker === 'function') {
                    (dateInputRef.current as any).showPicker()
                  } else {
                    dateInputRef.current.focus()
                    dateInputRef.current.click()
                  }
                }
              }}
              title="Select custom date from calendar"
              className={cn(
                "flex items-center justify-center w-[52px] h-[52px] rounded-[16px] flex-shrink-0 active:scale-95 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)] border cursor-pointer",
                selectedDate !== 'upcoming' && !dates.some(d => d.iso === selectedDate)
                  ? "bg-[#1B5DF1] text-white border-[#1B5DF1] shadow-md shadow-[#1B5DF1]/20"
                  : "bg-surface border-border text-[#0A1A3D] hover:bg-gray-50 hover:border-gray-300"
              )}
            >
              <Calendar className={cn("w-5 h-5", selectedDate !== 'upcoming' && !dates.some(d => d.iso === selectedDate) ? "text-white" : "text-primary")} />
            </button>
          </div>

          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide py-1 flex-1">
            <button 
              onClick={() => setSelectedDate('upcoming')}
              className={cn(
                "flex flex-col items-center justify-center min-w-[76px] h-[52px] rounded-[16px] flex-shrink-0 transition-all active:scale-95 px-3 border cursor-pointer",
                selectedDate === 'upcoming' 
                  ? "bg-[#1B5DF1] text-white shadow-lg shadow-[#1B5DF1]/30 border-[#1B5DF1]" 
                  : "bg-surface border-border text-[#0A1A3D] hover:bg-gray-50"
              )}
            >
              <span className={cn("text-[13px] font-bold leading-tight", selectedDate === 'upcoming' ? "text-white" : "text-[#0A1A3D]")}>Upcoming</span>
              <span className={cn("text-[10px] font-semibold leading-tight", selectedDate === 'upcoming' ? "text-[#EBF5FF]" : "text-muted/70")}>All Dates</span>
            </button>

            {/* Custom picked date pill if outside standard 14 dates */}
            {selectedDate !== 'upcoming' && !dates.some(d => d.iso === selectedDate) && (
              <button 
                onClick={() => setSelectedDate(selectedDate)}
                className="flex flex-col items-center justify-center min-w-[76px] h-[52px] rounded-[16px] flex-shrink-0 transition-all active:scale-95 px-3 border bg-[#1B5DF1] text-white shadow-lg shadow-[#1B5DF1]/30 border-[#1B5DF1] cursor-pointer"
              >
                <span className="text-[12px] font-bold leading-tight truncate max-w-[80px]">
                  {new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                </span>
                <span className="text-[10px] font-semibold text-blue-100 leading-tight">Custom Date</span>
              </button>
            )}

            {dates.map((d) => {
              const isActive = selectedDate === d.iso
              return (
                <button 
                  key={d.iso}
                  onClick={() => setSelectedDate(d.iso)}
                  className={cn(
                    "flex flex-col items-center justify-center min-w-[56px] h-[52px] rounded-[16px] flex-shrink-0 transition-all active:scale-95 border cursor-pointer",
                    isActive 
                      ? "bg-[#1B5DF1] text-white shadow-lg shadow-[#1B5DF1]/30 border-[#1B5DF1]" 
                      : "bg-surface border-border text-muted hover:bg-gray-50"
                  )}
                >
                  <span className={cn("text-[13px] font-bold leading-tight", isActive ? "text-white" : "text-[#0A1A3D]")}>
                    {d.date.split(' ')[0]} {d.date.split(' ')[1]}
                  </span>
                  <span className={cn("text-[11px] font-semibold leading-tight", isActive ? "text-[#EBF5FF]" : "text-muted/70")}>
                    {d.day}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── 2. Content Body (Matching Pic 1) ──────────────────────────────── */}
      <div className="flex flex-col px-4 pt-5 gap-6">
        
        {/* Summary Block */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[15px] font-bold text-foreground">
              {getSectionHeading()}
            </h3>
            <span className="text-primary text-[13px] font-bold">
              {filteredAppointments.length} Orders
            </span>
          </div>

          {/* 4-Box Metric Strip */}
          <div className="bg-surface rounded-[20px] p-2 sm:p-3 flex items-center justify-between border border-border shadow-sm">
            {/* Total */}
            <button 
              onClick={() => setSelectedStatus('ALL')}
              className={cn(
                "flex flex-col items-center flex-1 py-1.5 px-2 rounded-xl transition-all active:scale-95 cursor-pointer",
                selectedStatus === 'ALL' ? "bg-blue-50/80 ring-1 ring-[#1B5DF1]/30 shadow-sm" : "hover:bg-gray-50"
              )}
              title="Show All Orders"
            >
              <span className={cn("text-[20px] sm:text-[22px] font-black", selectedStatus === 'ALL' ? "text-[#1B5DF1]" : "text-[#0A1A3D]")}>
                {summaryCounts.total}
              </span>
              <span className="text-[11px] font-bold text-muted">Total</span>
            </button>
            <div className="w-px h-8 bg-gray-100" />

            {/* Waiting (Pending) */}
            <button 
              onClick={() => setSelectedStatus('WAITING')}
              className={cn(
                "flex flex-col items-center flex-1 py-1.5 px-2 rounded-xl transition-all active:scale-95 cursor-pointer",
                selectedStatus === 'WAITING' ? "bg-amber-50/80 ring-1 ring-amber-400/40 shadow-sm" : "hover:bg-gray-50"
              )}
              title="Show Waiting / Pending Orders"
            >
              <span className={cn("text-[20px] sm:text-[22px] font-black", selectedStatus === 'WAITING' ? "text-amber-600" : "text-[#0A1A3D]")}>
                {summaryCounts.waiting}
              </span>
              <span className="text-[11px] font-bold text-muted">Waiting</span>
            </button>
            <div className="w-px h-8 bg-gray-100" />

            {/* In Consult / Processing */}
            <button 
              onClick={() => setSelectedStatus('IN_CONSULTATION')}
              className={cn(
                "flex flex-col items-center flex-1 py-1.5 px-2 rounded-xl transition-all active:scale-95 cursor-pointer",
                selectedStatus === 'IN_CONSULTATION' ? "bg-blue-50/80 ring-1 ring-blue-500/40 shadow-sm" : "hover:bg-gray-50"
              )}
              title="Show In Processing / In Lab Orders"
            >
              <span className={cn("text-[20px] sm:text-[22px] font-black", selectedStatus === 'IN_CONSULTATION' ? "text-blue-600" : "text-[#0A1A3D]")}>
                {summaryCounts.inConsult}
              </span>
              <span className="text-[11px] font-bold text-muted">In Consult</span>
            </button>
            <div className="w-px h-8 bg-gray-100" />

            {/* Completed */}
            <button 
              onClick={() => setSelectedStatus('COMPLETED')}
              className={cn(
                "flex flex-col items-center flex-1 py-1.5 px-2 rounded-xl transition-all active:scale-95 cursor-pointer",
                selectedStatus === 'COMPLETED' ? "bg-emerald-50/80 ring-1 ring-emerald-500/40 shadow-sm" : "hover:bg-gray-50"
              )}
              title="Show Completed / Report Ready Orders"
            >
              <span className={cn("text-[20px] sm:text-[22px] font-black", selectedStatus === 'COMPLETED' ? "text-emerald-600" : "text-[#0A1A3D]")}>
                {summaryCounts.completed}
              </span>
              <span className="text-[11px] font-bold text-muted">Completed</span>
            </button>
          </div>

          {selectedStatus !== 'ALL' && (
            <div className="flex items-center justify-between bg-blue-50/70 border border-blue-100/80 px-3.5 py-1.5 rounded-xl text-xs">
              <span className="font-semibold text-[#1B5DF1]">
                Filtered by status: <span className="uppercase">{selectedStatus === 'WAITING' ? 'Waiting / Pending' : selectedStatus === 'IN_CONSULTATION' ? 'In Consult / Processing' : selectedStatus}</span>
              </span>
              <button 
                onClick={() => setSelectedStatus('ALL')}
                className="text-[11px] font-bold text-muted hover:text-primary underline ml-2 cursor-pointer"
              >
                Reset to All
              </button>
            </div>
          )}
        </div>

        {/* ── 3. Order List (Matching Pic 1 Card Layout) ─────────────── */}
        <div className="flex flex-col gap-4">
          <h2 className="font-bold text-foreground text-[17px] px-1">Order List</h2>

          <div className="flex flex-col relative gap-3">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div key="skeletons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 rounded-2xl bg-surface border border-border" />
                  ))}
                </motion.div>
              ) : filteredAppointments.length > 0 ? (
                <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
                  {filteredAppointments.map((apt) => (
                    <div 
                      key={apt.id} 
                      onClick={() => {
                        setSelectedOrder(apt.rawOrder)
                        setIsDetailModalOpen(true)
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setSelectedOrder(apt.rawOrder)
                          setIsDetailModalOpen(true)
                        }
                      }}
                      className="flex flex-col bg-surface border border-border hover:border-primary/40 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
                      title="Click to view detailed order info"
                    >
                      <div className="flex gap-4">
                        {/* Left Column: Time & Date (Matching Pic 1) */}
                        <div className="flex flex-col items-center min-w-[65px] pt-1">
                          <span className="text-[16px] font-black text-foreground leading-none">{apt.time}</span>
                          <span className="text-[11px] font-bold text-muted mt-1">{apt.period}</span>
                          {apt.date && (
                            <span className="text-[10px] font-bold text-primary bg-blue-50 px-1.5 py-0.5 rounded mt-1.5 text-center whitespace-nowrap">
                              {apt.date}
                            </span>
                          )}
                        </div>
                        
                        {/* Middle Column: Details & Right: Status & Actions */}
                        <div className="flex flex-col flex-1 gap-1 border-l border-border pl-4">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex flex-col">
                              {/* Patient Name */}
                              <div className="flex items-center gap-2">
                                <span className="text-[16px] font-bold text-foreground group-hover:text-primary transition-colors">
                                  {apt.patientName}
                                </span>
                                <ChevronRight className="w-4 h-4 text-muted/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                              </div>
                              
                              {/* Badges Row */}
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className={cn(
                                  "text-[10px] font-bold px-2 py-0.5 rounded-md border tracking-tight",
                                  apt.isHome
                                    ? "bg-teal-50 text-teal-700 border-teal-200/80" 
                                    : "bg-amber-50 text-amber-700 border-amber-200/80"
                                )}>
                                  {apt.isHome ? 'Home Sample' : 'Walk-in Lab'}
                                </span>
                                <span className="text-[11px] font-semibold text-muted">
                                  ID: {apt.idDisplay}
                                </span>
                                <span className="text-[11px] text-muted">•</span>
                                <span className="text-[12px] font-medium text-foreground truncate max-w-xs md:max-w-lg">
                                  {apt.testsSummary}
                                </span>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <span className={cn(
                                "text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider",
                                apt.rawStatus === 'REPORT_READY' || apt.rawStatus === 'COMPLETED'
                                  ? "bg-[#0A1A3D] text-white shadow-xs"
                                  : apt.rawStatus === 'IN_LAB_PROCESSING' || apt.rawStatus === 'SAMPLE_COLLECTED'
                                  ? "bg-blue-50 text-blue-600 border border-blue-200"
                                  : apt.rawStatus === 'CANCELLED'
                                  ? "bg-red-50 text-red-600 border border-red-200"
                                  : "bg-amber-50 text-amber-600 border border-amber-200"
                              )}>
                                {apt.statusLabel}
                              </span>
                            </div>
                          </div>

                          {/* Bottom Row: Service Note & Action Buttons */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 mt-2 border-t border-border/60">
                            <div className="flex items-center gap-2 text-xs text-muted flex-wrap">
                              {apt.isHome ? (
                                <div className="flex items-center gap-1.5 text-teal-700">
                                  <Home className="w-3.5 h-3.5" />
                                  <span className="font-semibold">Home Sample Collection</span>
                                  {apt.collectionAddress && (
                                    <span className="text-muted truncate max-w-[200px] md:max-w-xs">• {apt.collectionAddress}</span>
                                  )}
                                  {apt.phlebotomistName && (
                                    <span className="bg-teal-50 px-2 py-0.5 rounded text-[11px] font-medium text-teal-800">
                                      👤 {apt.phlebotomistName}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-blue-700">
                                  <FlaskConical className="w-3.5 h-3.5" />
                                  <span className="font-semibold">In-Person Diagnostic Examination</span>
                                </div>
                              )}
                              <span className="font-bold text-primary ml-1">₹{apt.totalAmount}</span>
                            </div>

                            {/* Action Buttons: Patient View & Workflow Action */}
                            <div className="flex items-center gap-2 ml-auto">
                              {/* Patient View Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedOrder(apt.rawOrder)
                                  setIsDetailModalOpen(true)
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface hover:bg-gray-50 text-xs font-bold text-foreground transition-all active:scale-95 shadow-xs cursor-pointer"
                                title="View Patient Order Details"
                              >
                                <User className="w-3.5 h-3.5 text-primary" />
                                <span>Patient View</span>
                              </button>

                              {/* Contextual Lab Actions */}
                              {apt.rawStatus === 'REPORT_READY' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    navigate(`/lab/report/${apt.id}`)
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-all active:scale-95 cursor-pointer"
                                  title="View Uploaded Diagnostic Report"
                                >
                                  <Eye className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>View Report</span>
                                </button>
                              )}

                              {apt.rawStatus === 'IN_LAB_PROCESSING' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    navigate(`/lab/upload-report?orderId=${apt.id}`)
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-xs cursor-pointer"
                                  title="Upload Test Report PDF"
                                >
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>Upload Report</span>
                                </button>
                              )}

                              {apt.rawStatus === 'SAMPLE_COLLECTED' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleAction(apt.rawOrder)
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-xs cursor-pointer"
                                  title="Begin Lab Processing"
                                >
                                  <Play className="w-3.5 h-3.5" />
                                  <span>Start Processing</span>
                                </button>
                              )}

                              {(apt.rawStatus === 'REQUESTED' || apt.rawStatus === 'PENDING') && apt.isHome && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedOrderId(apt.id)
                                    setPhlebName('')
                                    setPhlebPhone('')
                                    setAssignModalOpen(true)
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-xs cursor-pointer"
                                  title="Assign Phlebotomist for Home Sample Collection"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Assign Technician</span>
                                </button>
                              )}

                              {(apt.rawStatus === 'REQUESTED' || apt.rawStatus === 'PENDING') && !apt.isHome && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleAction(apt.rawOrder)
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-xs cursor-pointer"
                                  title="Confirm Patient Sample Collected"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Mark Collected</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <EmptyState 
                  icon={Calendar}
                  title="No Orders Found" 
                  description="No laboratory orders match your selected category, status or date range."
                  actionLabel="Register New Order"
                  onAction={() => navigate('/lab/create-order')}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── 4. Filter Modal (Matching Appointments.tsx Theme) ────────────── */}
      <AnimatePresence>
        {isFilterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsFilterModalOpen(false)} 
              className="absolute inset-0 bg-[#0A1A3D]/40 backdrop-blur-xs" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 10 }} 
              className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl p-5 flex flex-col gap-5 z-10"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-primary" />
                  <h3 className="text-base font-bold text-foreground">Filter Orders</h3>
                </div>
                <button 
                  onClick={() => setIsFilterModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full text-muted/70 hover:text-foreground/80 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Filter */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'ALL', label: 'All Statuses' },
                    { id: 'WAITING', label: 'Waiting / Pending' },
                    { id: 'IN_CONSULTATION', label: 'In Lab / Processing' },
                    { id: 'COMPLETED', label: 'Completed / Ready' },
                    { id: 'CANCELLED', label: 'Cancelled' }
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setSelectedStatus(st.id)}
                      className={cn(
                        "px-3 py-2 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between border cursor-pointer",
                        selectedStatus === st.id
                          ? "bg-[#1B5DF1] text-white border-[#1B5DF1] shadow-sm"
                          : "bg-gray-50 hover:bg-gray-100 text-foreground/80 border-border"
                      )}
                    >
                      <span>{st.label}</span>
                      {selectedStatus === st.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Type Filter */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Service Type</label>
                <div className="flex flex-wrap gap-1.5">
                  {filterTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedFilter(type.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                        selectedFilter === type.id
                          ? "bg-[#1B5DF1] text-white border-[#1B5DF1]"
                          : "bg-gray-50 hover:bg-gray-100 text-foreground/80 border-border"
                      )}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Order */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Sort by Time</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSortOrder('earliest')}
                    className={cn(
                      "px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer",
                      sortOrder === 'earliest'
                        ? "bg-[#1B5DF1] text-white border-[#1B5DF1]"
                        : "bg-gray-50 hover:bg-gray-100 text-foreground/80 border-border"
                    )}
                  >
                    Earliest First
                  </button>
                  <button
                    onClick={() => setSortOrder('latest')}
                    className={cn(
                      "px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer",
                      sortOrder === 'latest'
                        ? "bg-[#1B5DF1] text-white border-[#1B5DF1]"
                        : "bg-gray-50 hover:bg-gray-100 text-foreground/80 border-border"
                    )}
                  >
                    Latest First
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-border gap-3">
                <button
                  onClick={() => {
                    setSelectedFilter('all')
                    setSelectedStatus('ALL')
                    setSortOrder('earliest')
                    setSearchQuery('')
                    setSelectedDate('upcoming')
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-muted hover:text-red-500 py-2 px-3 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset All
                </button>
                <button
                  onClick={() => setIsFilterModalOpen(false)}
                  className="px-5 py-2.5 bg-[#1B5DF1] text-white text-xs font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-[#1B5DF1]/20 transition-all cursor-pointer"
                >
                  Apply & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 5. Quick Details Modal ────────────────────────────────────────── */}
      <LabOrderQuickModal
        order={selectedOrder}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedOrder(null)
        }}
        onOrderUpdated={() => {
          fetchOrders()
        }}
      />

      {/* ── 6. Assign Phlebotomist Modal (for Home Sample Collection) ─────── */}
      <AnimatePresence>
        {assignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAssignModalOpen(false)} className="absolute inset-0 bg-[#172033]/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-surface rounded-2xl shadow-xl overflow-hidden border border-border">
              <div className="flex items-center justify-between p-4 md:p-5 border-b border-border">
                <h3 className="text-[16px] md:text-[18px] font-bold text-[#172033]">Assign Phlebotomist</h3>
                <button onClick={() => setAssignModalOpen(false)} className="p-2 -mr-2 text-[#98A2B3] hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 md:p-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-[#172033]">Technician Name <span className="text-destructive">*</span></label>
                  <input 
                    value={phlebName} 
                    onChange={e => setPhlebName(e.target.value)} 
                    placeholder="e.g. Ramesh Kumar" 
                    className="w-full px-3 py-2.5 bg-surface border border-border/60 rounded-xl text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-[#172033]">Phone Number <span className="text-destructive">*</span></label>
                  <input 
                    value={phlebPhone} 
                    onChange={e => setPhlebPhone(e.target.value)} 
                    placeholder="e.g. 9876543210" 
                    className="w-full px-3 py-2.5 bg-surface border border-border/60 rounded-xl text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" 
                  />
                </div>
              </div>
              <div className="p-4 md:p-5 bg-gray-50 border-t border-border flex gap-3">
                <button onClick={() => setAssignModalOpen(false)} className="flex-1 py-2.5 bg-surface border border-border text-[#172033] font-semibold rounded-xl text-[14px] cursor-pointer">
                  Cancel
                </button>
                <button 
                  disabled={!phlebName.trim() || !phlebPhone.trim() || isAssigning}
                  onClick={async () => {
                    setIsAssigning(true)
                    await updateStatus(selectedOrderId!, 'ASSIGNED', { phlebotomistName: phlebName, phlebotomistPhone: phlebPhone })
                    setIsAssigning(false)
                  }} 
                  className="flex-1 py-2.5 bg-primary text-white font-semibold rounded-xl text-[14px] disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer shadow-sm hover:bg-blue-700 transition-all"
                >
                  {isAssigning && <Loader2 className="w-4 h-4 animate-spin" />}
                  Assign Technician
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
