import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  HeartHandshake, Search, Filter, Calendar, Clock, 
  MapPin, Phone, User, CheckCircle2, AlertCircle, 
  RefreshCw, ExternalLink, ShieldCheck, CheckCheck
} from "lucide-react"
import { Skeleton } from "@/components/ui/Skeleton"
import { EmptyState } from "@/components/ui/EmptyState"
import { cn } from "@/lib/utils"
import { useToast } from "@/context/ToastContext"
import { nurseApi, type HospitalNursingBooking } from "@/services/nurseApi"
import { AssignNurseModal } from "@/components/appointments/AssignNurseModal"
import { ReceptionistNavHeader } from "@/components/layout/ReceptionistNavHeader"

export function ReceptionistHomeNursing() {
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bookings, setBookings] = useState<HospitalNursingBooking[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Nurse Assignment Modal state
  const [nurseAssignModalBooking, setNurseAssignModalBooking] = useState<{
    id: string;
    bookingNumber: string;
    patientName: string;
    patientPhone: string;
    serviceName: string;
    date: string;
    time: string;
    address: string;
    nurseId?: string | null;
    nurseName?: string | null;
  } | null>(null);

  // Normalized IST today
  const todayIST = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  // Dynamic 14-day date strip
  const dates = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(d);
      const dayStr = i === 0 ? 'Today' : i === 1 ? 'Tmrw' : d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Kolkata' });
      const dateStr = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
      return { iso, date: dateStr, day: dayStr };
    });
  }, []);

  const lastFetchRef = useRef<number>(0);

  // Fetch bookings from backend
  const fetchBookings = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const params: any = {};
      if (selectedDate !== 'all') {
        params.date = selectedDate;
      }
      if (selectedStatus !== 'ALL') {
        params.status = selectedStatus;
      }
      const data = await nurseApi.getHospitalBookings(params);
      setBookings(data || []);
    } catch (err: any) {
      console.error("Failed to load home nursing bookings:", err);
      if (!silent) {
        toast(err.message || "Failed to load home nursing bookings", "error");
      }
    } finally {
      if (!silent) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedDate, selectedStatus, toast]);

  // 12-second live polling + throttled window focus refresh
  useEffect(() => {
    fetchBookings();
    lastFetchRef.current = Date.now();

    const timer = setInterval(() => {
      fetchBookings(true);
      lastFetchRef.current = Date.now();
    }, 12000);

    const handleThrottledSync = () => {
      if (Date.now() - lastFetchRef.current > 8000) {
        fetchBookings(true);
        lastFetchRef.current = Date.now();
      }
    };

    const handleFocus = () => handleThrottledSync();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        handleThrottledSync();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchBookings]);

  // Explicit Manual "Complete" status transition handler
  const handleCompleteBooking = async (booking: HospitalNursingBooking) => {
    if (actionLoadingId) return;
    if (!window.confirm(`Mark home nursing service for ${booking.patientName} as COMPLETED?`)) {
      return;
    }

    setActionLoadingId(booking.id);
    try {
      await nurseApi.updateVisitStatus(booking.id, 'COMPLETED');
      toast(`Home nursing visit for ${booking.patientName} marked as COMPLETED!`, 'success');
      await fetchBookings(true);
    } catch (err: any) {
      toast(err.message || 'Failed to complete home nursing visit', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // KPI counts
  const totalCount = bookings.length;
  const pendingAssignmentCount = bookings.filter(b => !b.nurseId && b.status !== 'CANCELLED' && b.status !== 'COMPLETED').length;
  const activeCount = bookings.filter(b => (b.status === 'ASSIGNED' || b.status === 'IN_PROGRESS')).length;
  const completedCount = bookings.filter(b => b.status === 'COMPLETED').length;

  // Filtered by search
  const filteredBookings = useMemo(() => {
    if (!searchQuery.trim()) return bookings;
    const q = searchQuery.toLowerCase().trim();
    return bookings.filter(b => 
      b.patientName.toLowerCase().includes(q) ||
      b.bookingNumber.toLowerCase().includes(q) ||
      b.serviceName.toLowerCase().includes(q) ||
      (b.nurse?.name && b.nurse.name.toLowerCase().includes(q)) ||
      (b.patientPhone && b.patientPhone.includes(q)) ||
      (b.address && b.address.toLowerCase().includes(q))
    );
  }, [bookings, searchQuery]);

  const getStatusBadge = (status: string, hasNurse: boolean) => {
    switch (status) {
      case 'COMPLETED':
        return { label: 'Completed', bg: 'bg-slate-900 text-white border-slate-900' };
      case 'IN_PROGRESS':
        return { label: 'In Progress', bg: 'bg-blue-50 text-[#1B5DF1] border-blue-200' };
      case 'ASSIGNED':
        return { label: 'Nurse Assigned', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'CANCELLED':
        return { label: 'Cancelled', bg: 'bg-rose-50 text-rose-600 border-rose-200' };
      default:
        return hasNurse
          ? { label: 'Assigned', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
          : { label: 'Pending Nurse', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
  };

  return (
    <div className="flex flex-col bg-gray-50/30 min-h-screen pb-[120px]">
      {/* Top Header */}
      <ReceptionistNavHeader 
        title="Home Nursing" 
        subtitle="Staff Assignment & Manual Completion"
        backTo="/receptionist"
        rightActions={
          <button
            onClick={() => fetchBookings(true)}
            disabled={isRefreshing || isLoading}
            className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center text-gray-600 hover:text-[#1B5DF1] hover:bg-[#EBF5FF] transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Refresh bookings"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin text-[#1B5DF1]")} />
          </button>
        }
      />

      {/* Sticky Filter & Search Bar */}
      <div className="sticky top-14 z-20 bg-surface/95 backdrop-blur-xl pt-4 pb-4 px-4 flex flex-col gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border-b border-border">
        {/* Search */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted/70 group-focus-within:text-[#1B5DF1] transition-colors">
            <Search className="w-4 h-4" />
          </div>
          <input 
            type="text" 
            placeholder="Search by patient, nurse, service, or booking ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-border/60 rounded-2xl outline-none focus:border-[#1B5DF1] focus:bg-surface focus:ring-4 focus:ring-[#1B5DF1]/10 transition-all text-[14px] font-medium text-[#172033] placeholder:text-muted/70"
          />
        </div>

        {/* Date Strip */}
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setSelectedDate('upcoming')}
            className={cn(
              "flex flex-col items-center justify-center min-w-[76px] h-[50px] rounded-2xl flex-shrink-0 transition-all active:scale-95 px-3 border",
              selectedDate === 'upcoming' 
                ? "bg-[#1B5DF1] text-white shadow-lg shadow-[#1B5DF1]/30 border-[#1B5DF1]" 
                : "bg-surface border-border text-[#172033] hover:bg-gray-50"
            )}
          >
            <span className={cn("text-[13px] font-bold leading-tight", selectedDate === 'upcoming' ? "text-white" : "text-[#172033]")}>Upcoming</span>
            <span className={cn("text-[10px] font-semibold leading-tight", selectedDate === 'upcoming' ? "text-[#EBF5FF]" : "text-[#98A2B3]")}>All Active</span>
          </button>

          <button 
            onClick={() => setSelectedDate('all')}
            className={cn(
              "flex flex-col items-center justify-center min-w-[64px] h-[50px] rounded-2xl flex-shrink-0 transition-all active:scale-95 px-2 border",
              selectedDate === 'all' 
                ? "bg-[#1B5DF1] text-white shadow-lg shadow-[#1B5DF1]/30 border-[#1B5DF1]" 
                : "bg-surface border-border text-[#172033] hover:bg-gray-50"
            )}
          >
            <span className={cn("text-[13px] font-bold leading-tight", selectedDate === 'all' ? "text-white" : "text-[#172033]")}>All</span>
            <span className={cn("text-[10px] font-semibold leading-tight", selectedDate === 'all' ? "text-[#EBF5FF]" : "text-[#98A2B3]")}>History</span>
          </button>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1 flex-1">
            {dates.map((d) => {
              const isActive = selectedDate === d.iso;
              return (
                <button 
                  key={d.iso}
                  onClick={() => setSelectedDate(d.iso)}
                  className={cn(
                    "flex flex-col items-center justify-center min-w-[56px] h-[50px] rounded-2xl flex-shrink-0 transition-all active:scale-95 border",
                    isActive ? "bg-[#1B5DF1] text-white shadow-lg shadow-[#1B5DF1]/30 border-[#1B5DF1]" : "bg-surface border-border text-muted hover:border-gray-300"
                  )}
                >
                  <span className={cn("text-[13px] font-bold leading-tight", isActive ? "text-white" : "text-[#172033]")}>{d.date}</span>
                  <span className={cn("text-[11px] font-semibold leading-tight", isActive ? "text-[#EBF5FF]" : "text-[#98A2B3]")}>{d.day}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide -mx-4 px-4">
          {[
            { id: 'ALL', label: 'All Requests', count: totalCount },
            { id: 'PENDING_ASSIGNMENT', label: 'Need Nurse', count: pendingAssignmentCount, highlight: pendingAssignmentCount > 0 },
            { id: 'ASSIGNED', label: 'Nurse Assigned' },
            { id: 'IN_PROGRESS', label: 'In Progress' },
            { id: 'COMPLETED', label: 'Completed', count: completedCount },
          ].map((item) => {
            const isActive = selectedStatus === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedStatus(item.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-95",
                  isActive
                    ? "bg-[#0A1A3D] text-white border-[#0A1A3D] shadow-xs"
                    : item.highlight
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-surface text-muted border-border hover:bg-gray-100/60"
                )}
              >
                <span>{item.label}</span>
                {item.count !== undefined && (
                  <span className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-extrabold",
                    isActive 
                      ? "bg-white/20 text-white" 
                      : item.highlight 
                      ? "bg-amber-200/80 text-amber-900" 
                      : "bg-gray-100 text-gray-700"
                  )}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col px-4 pt-4 gap-4">
        {/* KPI Summary Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-surface rounded-2xl p-3 border border-border flex items-center justify-between shadow-xs">
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Total</span>
              <span className="text-[20px] font-black text-[#0A1A3D]">{isLoading ? "—" : totalCount}</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1B5DF1] flex items-center justify-center shrink-0">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>

          <div className={cn(
            "rounded-2xl p-3 border flex items-center justify-between shadow-xs",
            pendingAssignmentCount > 0 ? "bg-amber-50/70 border-amber-200" : "bg-surface border-border"
          )}>
            <div className="flex flex-col">
              <span className={cn("text-[10px] font-extrabold uppercase tracking-wider", pendingAssignmentCount > 0 ? "text-amber-800" : "text-muted")}>
                Need Nurse
              </span>
              <span className={cn("text-[20px] font-black", pendingAssignmentCount > 0 ? "text-amber-700" : "text-[#0A1A3D]")}>
                {isLoading ? "—" : pendingAssignmentCount}
              </span>
            </div>
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", pendingAssignmentCount > 0 ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-600")}>
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-surface rounded-2xl p-3 border border-border flex items-center justify-between shadow-xs">
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Active Visits</span>
              <span className="text-[20px] font-black text-[#1B5DF1]">{isLoading ? "—" : activeCount}</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1B5DF1] flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-surface rounded-2xl p-3 border border-border flex items-center justify-between shadow-xs">
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Completed</span>
              <span className="text-[20px] font-black text-emerald-600">{isLoading ? "—" : completedCount}</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="flex flex-col gap-3">
          <AnimatePresence mode="wait">
            {isLoading && bookings.length === 0 ? (
              <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-44 rounded-2xl bg-surface border border-border" />
                ))}
              </motion.div>
            ) : filteredBookings.length > 0 ? (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
                {filteredBookings.map((b) => {
                  const hasNurse = Boolean(b.nurseId && b.nurse?.name);
                  const badge = getStatusBadge(b.status, hasNurse);
                  const isCompleted = b.status === 'COMPLETED';
                  const isCancelled = b.status === 'CANCELLED';
                  const canComplete = !isCompleted && !isCancelled;

                  return (
                    <div 
                      key={b.id}
                      className="bg-surface rounded-2xl border border-border/80 p-4 shadow-sm hover:shadow-md transition-all flex flex-col gap-3.5"
                    >
                      {/* Top Header Row */}
                      <div className="flex items-start justify-between gap-3 border-b border-border/50 pb-3">
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[14px] font-black text-[#0A1A3D]">
                              {b.mqId}
                            </span>
                            <span className="text-[11px] font-mono text-muted bg-gray-100 px-2 py-0.5 rounded-md">
                              {b.bookingNumber}
                            </span>
                          </div>
                          <h4 className="text-[16px] font-extrabold text-[#0A1A3D] mt-1 truncate">
                            {b.patientName}
                          </h4>
                          {b.patientPhone && (
                            <a 
                              href={`tel:${b.patientPhone}`}
                              className="text-[12px] font-semibold text-[#1B5DF1] hover:underline flex items-center gap-1 mt-0.5"
                            >
                              <Phone className="w-3 h-3" />
                              {b.patientPhone}
                            </a>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className={cn("px-2.5 py-1 rounded-xl text-[11px] font-extrabold border uppercase tracking-wider", badge.bg)}>
                            {badge.label}
                          </span>
                          <span className="text-[14px] font-black text-[#0A1A3D]">
                            ₹{Math.round(b.totalAmount || 0)}
                          </span>
                        </div>
                      </div>

                      {/* Service & Visit Schedule Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px]">
                        <div className="flex items-center gap-2 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/60">
                          <HeartHandshake className="w-4 h-4 text-[#1B5DF1] shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="font-extrabold text-[#0A1A3D] truncate">{b.serviceName}</span>
                            <span className="text-[11px] text-muted truncate">{b.serviceCategory || 'Home Care Service'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-border/60">
                          <Calendar className="w-4 h-4 text-[#1B5DF1] shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="font-extrabold text-[#0A1A3D]">{b.serviceDate || 'Scheduled Date'}</span>
                            <span className="text-[11px] text-muted flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {b.timeSlot} {b.duration ? `(${b.duration})` : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Address Bar */}
                      <div className="flex items-start justify-between gap-2 text-[12px] text-gray-700 bg-gray-50/70 p-2.5 rounded-xl border border-border/50">
                        <div className="flex items-start gap-1.5 min-w-0 flex-1">
                          <MapPin className="w-3.5 h-3.5 text-[#1B5DF1] shrink-0 mt-0.5" />
                          <span className="leading-snug truncate">
                            {b.address}{b.city ? `, ${b.city}` : ''}
                          </span>
                        </div>
                        <a 
                          href={`https://maps.google.com/?q=${encodeURIComponent(`${b.address} ${b.city || ''}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#1B5DF1] hover:underline font-bold text-[11px] flex items-center gap-0.5 shrink-0"
                        >
                          Map <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {/* Assigned Nurse Card */}
                      <div className={cn(
                        "p-3 rounded-xl border flex items-center justify-between gap-3",
                        hasNurse 
                          ? "bg-emerald-50/40 border-emerald-200/80" 
                          : "bg-amber-50/60 border-amber-200"
                      )}>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center font-bold text-[13px] shrink-0",
                            hasNurse ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          )}>
                            {hasNurse ? (b.nurse?.name?.charAt(0) || 'N') : '!'}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted">
                              {hasNurse ? "Assigned Nurse" : "Nurse Status"}
                            </span>
                            <span className="text-[13px] font-extrabold text-[#0A1A3D] truncate">
                              {hasNurse ? b.nurse?.name : "No Nurse Assigned Yet"}
                            </span>
                            {hasNurse && b.nurse?.phone && (
                              <a href={`tel:${b.nurse.phone}`} className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 hover:underline">
                                <Phone className="w-3 h-3" /> {b.nurse.phone}
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Assign / Change Nurse Button */}
                        <button
                          onClick={() => {
                            setNurseAssignModalBooking({
                              id: b.id,
                              bookingNumber: b.bookingNumber || b.mqId,
                              patientName: b.patientName,
                              patientPhone: b.patientPhone,
                              serviceName: b.serviceName,
                              date: b.serviceDate,
                              time: b.timeSlot,
                              address: b.address,
                              nurseId: b.nurseId,
                              nurseName: b.nurse?.name,
                            });
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-xl font-bold text-[12px] transition-all shrink-0 cursor-pointer active:scale-95",
                            hasNurse
                              ? "bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 shadow-xs"
                              : "bg-[#1B5DF1] text-white hover:bg-blue-700 shadow-sm"
                          )}
                        >
                          {hasNurse ? "Reassign" : "Assign Nurse"}
                        </button>
                      </div>

                      {/* Action Footer with Explicit Complete Button */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                        <div className="text-[11px] text-muted font-medium">
                          Payment: <span className="font-bold text-gray-800 uppercase">{b.paymentStatus || 'PAID'}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {canComplete ? (
                            <button
                              onClick={() => handleCompleteBooking(b)}
                              disabled={actionLoadingId === b.id}
                              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                              title="Manually complete this home nursing service"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{actionLoadingId === b.id ? "Completing..." : "Complete Service"}</span>
                            </button>
                          ) : isCompleted ? (
                            <span className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold">
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> Finished
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12">
                <EmptyState 
                  icon={HeartHandshake}
                  title="No Home Nursing Bookings"
                  description="No home nursing requests match the selected filters."
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Assign Nurse Modal */}
      {nurseAssignModalBooking && (
        <AssignNurseModal 
          isOpen={true}
          onClose={() => setNurseAssignModalBooking(null)}
          onAssigned={() => {
            setNurseAssignModalBooking(null);
            fetchBookings(true);
          }}
          onSuccess={() => {
            setNurseAssignModalBooking(null);
            fetchBookings(true);
          }}
          booking={nurseAssignModalBooking}
        />
      )}
    </div>
  );
}
