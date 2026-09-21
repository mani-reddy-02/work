import { Search, Filter, Calendar, ArrowLeft, Play, FileText, Plus, User, ChevronRight, X, Check, RotateCcw, SlidersHorizontal } from "lucide-react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "@/context/AuthContext"
import { motion, AnimatePresence } from "framer-motion"
import { AppointmentDetailModal } from "../components/appointments/AppointmentDetailModal"
import { WalkInModal } from "../components/appointments/WalkInModal"
import { Skeleton } from "../components/ui/Skeleton"
import { EmptyState } from "../components/ui/EmptyState"
import { cn } from "@/lib/utils"
import { useNavigate, useLocation } from "react-router-dom"
import { adminApi } from "@/services/adminApi"
import { useTranslation } from "react-i18next"

export function Appointments() {
  const { t } = useTranslation();
  const location = useLocation();
  const locationState = location.state as { date?: string; status?: string; filter?: string } | undefined;

  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [selectedFilter, setSelectedFilter] = useState(() => locationState?.filter || 'ops');
  const [selectedDate, setSelectedDate] = useState(() => locationState?.date || 'upcoming');
  const [selectedStatus, setSelectedStatus] = useState<string>(() => locationState?.status || 'ALL');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'earliest' | 'latest'>('earliest');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const dateInputRef = useRef<HTMLInputElement>(null);

  const { role } = useAuth();
  const navigate = useNavigate();

  const filterTypes = [
    { id: 'ops', label: 'OPs' },
    { id: 'video', label: 'Video Consultation' },
    { id: 'lab', label: 'Lab' },
    { id: 'home_sample', label: 'Home Sample Collection' },
    { id: 'home_nursing', label: 'Home Nursing' },
  ];

  // Dynamic 14-day date strip starting from today
  const today = new Date();
  const todayIso = today.toISOString().split('T')[0];
  const dates = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    const dayStr = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const dateStr = `${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}`;
    return { iso, date: dateStr, day: dayStr };
  });

  // Appointment records
  type Appointment = {
    id: string; mqId: string; patientName: string; patientPhone?: string; time: string; period: string;
    date: string; type: string; doctor: string; status: string; avatar: string;
  };
  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>([]);
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);

  const fetchBookings = useCallback(async (targetDate: string) => {
    setIsLoading(true);
    try {
      const filters: any = {};
      if (targetDate === 'upcoming') {
        filters.range = 'upcoming';
      } else if (targetDate === 'all') {
        filters.range = 'all';
      } else {
        filters.date = targetDate;
      }
      const data = await adminApi.getBookings(filters);
      const mapped = (data || []).map((b: any) => {
        const timeStr = b.timeSlot || b.slotTime || new Date(b.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const parts = timeStr.trim().split(' ');
        return {
          id: b.id,
          mqId: `OP-${b.id.substring(0, 6).toUpperCase()}`,
          patientName: b.patientName || 'Patient',
          patientPhone: b.patientPhone,
          time: parts[0] || '10:00',
          period: parts[1] || 'AM',
          date: (b.appointmentDate || '').split('T')[0],
          type: b.opType || b.condition?.name || 'Walk-In',
          doctor: b.doctor?.name || 'Assigned Doctor',
          status: b.status || 'WAITING',
          avatar: b.doctor?.avatar || ''
        };
      });
      setAppointmentsList(mapped);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (location.state) {
      const state = location.state as { date?: string; status?: string; filter?: string };
      if (state.date) setSelectedDate(state.date);
      if (state.filter) setSelectedFilter(state.filter);
      if (state.status) setSelectedStatus(state.status);
    }
  }, [location.state]);

  useEffect(() => {
    fetchBookings(selectedDate);
  }, [selectedDate, fetchBookings]);

  const uniqueDoctors = Array.from(new Set(appointmentsList.map(a => a.doctor).filter(Boolean)));

  const activeFiltersCount = 
    (selectedFilter !== 'ops' ? 1 : 0) +
    (selectedStatus !== 'ALL' ? 1 : 0) +
    (selectedDoctor !== 'ALL' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const filteredAppointments = appointmentsList
    .filter(apt => {
      const matchesSearch =
        apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.mqId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (apt.patientPhone && apt.patientPhone.includes(searchQuery));
      
      if (!matchesSearch) return false;

      // Filter by status if selected
      if (selectedStatus === 'WAITING') {
        if (apt.status !== 'WAITING' && apt.status !== 'PENDING') return false;
      } else if (selectedStatus === 'IN_CONSULTATION') {
        if (apt.status !== 'IN_CONSULTATION') return false;
      } else if (selectedStatus === 'COMPLETED') {
        if (apt.status !== 'COMPLETED') return false;
      } else if (selectedStatus === 'CANCELLED') {
        if (apt.status !== 'CANCELLED') return false;
      }

      // Filter by doctor
      if (selectedDoctor !== 'ALL') {
        if (apt.doctor !== selectedDoctor) return false;
      }

      // Filter by service type if not default 'ops'
      if (selectedFilter === 'video') {
        if (!apt.type.toLowerCase().includes('video')) return false;
      } else if (selectedFilter === 'lab') {
        if (!apt.type.toLowerCase().includes('lab')) return false;
      } else if (selectedFilter === 'home_sample') {
        if (!apt.type.toLowerCase().includes('sample')) return false;
      } else if (selectedFilter === 'home_nursing') {
        if (!apt.type.toLowerCase().includes('nurs')) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortOrder === 'latest') {
        return (b.time || '').localeCompare(a.time || '');
      }
      return (a.time || '').localeCompare(b.time || '');
    });

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await adminApi.updateBookingStatus(id, newStatus);
      fetchBookings(selectedDate); // Refresh the list
    } catch (err) {
      console.error(err);
    }
    setActiveDropdown(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-emerald-50 text-emerald-500';
      case 'PENDING': return 'bg-[#EBF5FF] text-[#1B5DF1]';
      case 'IN_CONSULTATION': return 'bg-blue-50 text-blue-600';
      case 'COMPLETED': return 'bg-[#0A1A3D] text-white';
      case 'CANCELLED': return 'bg-red-50 text-red-500';
      case 'WAITING': return 'bg-amber-50 text-amber-500';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="flex flex-col bg-background min-h-full pb-8 transition-colors" onClick={() => setActiveDropdown(null)}>
      
      {/* Header Section (Not sticky so appointments get full viewport space on scroll) */}
      <div className="bg-surface pt-5 pb-3 px-4 flex flex-col gap-4 border-b border-border shadow-sm">
        
        {/* Header Block */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-[22px] font-black text-foreground tracking-tight">{t('appointments')}</h1>
          </div>
          <button 
            onClick={() => setIsWalkInModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#1B5DF1] hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors active:scale-95"
          >
            <Plus className="w-4 h-4" />
            {t('walk_in_registration', 'Walk-In')}
          </button>
        </div>

        {/* Search Bar & Filter Button */}
        <div className="flex flex-col gap-4">
          <div className="relative group flex items-center">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted/70 group-focus-within:text-[#1B5DF1] transition-colors">
              <Search className="w-4 h-4" />
            </div>
            <input 
              type="text" 
              placeholder={t('search_placeholder', 'Search by name, ID, or phone...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-24 py-3.5 bg-surface border border-border rounded-[16px] outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-[15px] font-medium text-foreground placeholder:text-muted shadow-sm"
            />
            <button 
              type="button"
              onClick={() => setIsFilterModalOpen(prev => !prev)}
              title={t('filter', 'Filters')}
              className={cn(
                "absolute right-2.5 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all text-xs font-bold active:scale-95",
                activeFiltersCount > 0 
                  ? "bg-[#1B5DF1] text-white shadow-sm" 
                  : "bg-gray-50 hover:bg-blue-50 text-[#1B5DF1] border border-border/80"
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{t('filter', 'Filters')}</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-surface text-[#1B5DF1] text-[10px] flex items-center justify-center font-black">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {filterTypes.map((type) => {
            const isActive = selectedFilter === type.id;
            return (
              <button 
                key={type.id}
                onClick={() => setSelectedFilter(type.id)}
                className={cn(
                  "px-5 py-2 rounded-full flex-shrink-0 transition-all active:scale-95 font-bold text-[13px]",
                  isActive ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-surface text-muted border border-border"
                )}
              >
                {type.label}
              </button>
            )
          })}
        </div>

        {/* Date Strip & Interactive Calendar Picker */}
        <div className="flex items-center gap-2.5 mt-0.5">
          {/* Calendar Picker Trigger */}
          <div className="relative flex items-center">
            <input 
              type="date" 
              ref={dateInputRef}
              value={selectedDate !== 'upcoming' && selectedDate !== 'all' ? selectedDate : ''}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(e.target.value);
                }
              }}
              className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
              aria-label="Pick date from calendar"
            />
            <button 
              onClick={() => {
                if (dateInputRef.current) {
                  if ('showPicker' in HTMLInputElement.prototype && typeof (dateInputRef.current as any).showPicker === 'function') {
                    (dateInputRef.current as any).showPicker();
                  } else {
                    dateInputRef.current.focus();
                    dateInputRef.current.click();
                  }
                }
              }}
              title="Select custom date from calendar"
              className={cn(
                "flex items-center justify-center w-[52px] h-[52px] rounded-[16px] flex-shrink-0 active:scale-95 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)] border",
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
                "flex flex-col items-center justify-center min-w-[76px] h-[52px] rounded-[16px] flex-shrink-0 transition-all active:scale-95 px-3 border",
                selectedDate === 'upcoming' 
                  ? "bg-[#1B5DF1] text-white shadow-lg shadow-[#1B5DF1]/30 border-[#1B5DF1]" 
                  : "bg-surface border-border text-[#0A1A3D] hover:bg-gray-50"
              )}
            >
              <span className={cn("text-[13px] font-bold leading-tight", selectedDate === 'upcoming' ? "text-white" : "text-[#0A1A3D]")}>Upcoming</span>
              <span className={cn("text-[10px] font-semibold leading-tight", selectedDate === 'upcoming' ? "text-[#EBF5FF]" : "text-muted/70")}>All Dates</span>
            </button>

            {/* Custom picked date pill if not in standard 14 dates */}
            {selectedDate !== 'upcoming' && !dates.some(d => d.iso === selectedDate) && (
              <button 
                onClick={() => setSelectedDate(selectedDate)}
                className="flex flex-col items-center justify-center min-w-[76px] h-[52px] rounded-[16px] flex-shrink-0 transition-all active:scale-95 px-3 border bg-[#1B5DF1] text-white shadow-lg shadow-[#1B5DF1]/30 border-[#1B5DF1]"
              >
                <span className="text-[12px] font-bold leading-tight truncate max-w-[80px]">
                  {new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                </span>
                <span className="text-[10px] font-semibold text-blue-100 leading-tight">Custom Date</span>
              </button>
            )}

            {dates.map((d) => {
              const isActive = selectedDate === d.iso;
              return (
                <button 
                  key={d.iso}
                  onClick={() => setSelectedDate(d.iso)}
                  className={cn(
                    "flex flex-col items-center justify-center min-w-[56px] h-[52px] rounded-[16px] flex-shrink-0 transition-all active:scale-95 border",
                    isActive 
                      ? "bg-[#1B5DF1] text-white shadow-lg shadow-[#1B5DF1]/30 border-[#1B5DF1]" 
                      : "bg-surface border-border text-muted hover:bg-gray-50"
                  )}
                >
                  <span className={cn("text-[13px] font-bold leading-tight", isActive ? "text-white" : "text-[#0A1A3D]")}>{d.date.split(' ')[0]} {d.date.split(' ')[1]}</span>
                  <span className={cn("text-[11px] font-semibold leading-tight", isActive ? "text-[#EBF5FF]" : "text-muted/70")}>{d.day}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col px-4 pt-5 gap-6">
        
        {/* Summary Block */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[15px] font-bold text-foreground">
              {selectedDate === 'upcoming' 
                ? 'Upcoming Consultations' 
                : selectedDate === todayIso 
                  ? "Today's Consultations" 
                  : `Consultations on ${dates.find(d => d.iso === selectedDate)?.date || selectedDate}`}
            </h3>
            <span className="text-primary text-[13px] font-bold">
              {filteredAppointments.length} Bookings
            </span>
          </div>

          <div className="bg-surface rounded-[20px] p-2 sm:p-3 flex items-center justify-between border border-border shadow-sm">
            <button 
              onClick={() => setSelectedStatus('ALL')}
              className={cn(
                "flex flex-col items-center flex-1 py-1.5 px-2 rounded-xl transition-all active:scale-95",
                selectedStatus === 'ALL' ? "bg-blue-50/80 ring-1 ring-[#1B5DF1]/30 shadow-sm" : "hover:bg-gray-50"
              )}
              title="Show All Appointments"
            >
              <span className={cn("text-[20px] sm:text-[22px] font-black", selectedStatus === 'ALL' ? "text-[#1B5DF1]" : "text-[#0A1A3D]")}>
                {appointmentsList.length}
              </span>
              <span className="text-[11px] font-bold text-muted">Total</span>
            </button>
            <div className="w-px h-8 bg-gray-100" />
            <button 
              onClick={() => setSelectedStatus('WAITING')}
              className={cn(
                "flex flex-col items-center flex-1 py-1.5 px-2 rounded-xl transition-all active:scale-95",
                selectedStatus === 'WAITING' ? "bg-amber-50/80 ring-1 ring-amber-400/40 shadow-sm" : "hover:bg-gray-50"
              )}
              title="Show Waiting / Pending Appointments"
            >
              <span className={cn("text-[20px] sm:text-[22px] font-black", selectedStatus === 'WAITING' ? "text-amber-600" : "text-[#0A1A3D]")}>
                {appointmentsList.filter(a => a.status === 'WAITING' || a.status === 'PENDING').length}
              </span>
              <span className="text-[11px] font-bold text-muted">Waiting</span>
            </button>
            <div className="w-px h-8 bg-gray-100" />
            <button 
              onClick={() => setSelectedStatus('IN_CONSULTATION')}
              className={cn(
                "flex flex-col items-center flex-1 py-1.5 px-2 rounded-xl transition-all active:scale-95",
                selectedStatus === 'IN_CONSULTATION' ? "bg-blue-50/80 ring-1 ring-blue-500/40 shadow-sm" : "hover:bg-gray-50"
              )}
              title="Show In Consultation Appointments"
            >
              <span className={cn("text-[20px] sm:text-[22px] font-black", selectedStatus === 'IN_CONSULTATION' ? "text-blue-600" : "text-[#0A1A3D]")}>
                {appointmentsList.filter(a => a.status === 'IN_CONSULTATION').length}
              </span>
              <span className="text-[11px] font-bold text-muted">In Consult</span>
            </button>
            <div className="w-px h-8 bg-gray-100" />
            <button 
              onClick={() => setSelectedStatus('COMPLETED')}
              className={cn(
                "flex flex-col items-center flex-1 py-1.5 px-2 rounded-xl transition-all active:scale-95",
                selectedStatus === 'COMPLETED' ? "bg-emerald-50/80 ring-1 ring-emerald-500/40 shadow-sm" : "hover:bg-gray-50"
              )}
              title="Show Completed Appointments"
            >
              <span className={cn("text-[20px] sm:text-[22px] font-black", selectedStatus === 'COMPLETED' ? "text-emerald-600" : "text-[#0A1A3D]")}>
                {appointmentsList.filter(a => a.status === 'COMPLETED').length}
              </span>
              <span className="text-[11px] font-bold text-muted">Completed</span>
            </button>
          </div>

          {selectedStatus !== 'ALL' && (
            <div className="flex items-center justify-between bg-blue-50/70 border border-blue-100/80 px-3.5 py-1.5 rounded-xl text-xs">
              <span className="font-semibold text-[#1B5DF1]">
                Filtered by status: <span className="uppercase">{selectedStatus === 'WAITING' ? 'Pending / Waiting' : selectedStatus}</span>
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

        {/* Appointment List */}
        <div className="flex flex-col gap-4">
          <h2 className="font-bold text-foreground text-[17px] px-1">Appointment List</h2>

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
                      onClick={() => navigate(`/patients/${apt.id}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          navigate(`/patients/${apt.id}`);
                        }
                      }}
                      className="flex flex-col bg-surface border border-border hover:border-primary/40 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
                      title="Click to view detailed patient profile"
                    >
                      <div className="flex gap-4">
                        {/* Time */}
                        <div className="flex flex-col items-center min-w-[60px] pt-1">
                          <span className="text-[16px] font-black text-foreground leading-none">{apt.time}</span>
                          <span className="text-[11px] font-bold text-muted mt-1">{apt.period}</span>
                          {apt.date && (
                            <span className="text-[10px] font-bold text-primary bg-blue-50 px-1.5 py-0.5 rounded mt-1.5 text-center whitespace-nowrap">
                              {apt.date}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-col flex-1 gap-1 border-l border-border pl-4">
                          {/* Info & Status */}
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="text-[16px] font-bold text-foreground group-hover:text-primary transition-colors">
                                  {apt.patientName}
                                </span>
                                <ChevronRight className="w-4 h-4 text-muted/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className="text-[12px] font-medium text-muted">ID: {apt.mqId}</span>
                                <span className="w-1 h-1 rounded-full bg-muted/40"></span>
                                <span className="text-[12px] font-medium text-muted">{apt.doctor}</span>
                                <span className="w-1 h-1 rounded-full bg-muted/40"></span>
                                <span className="text-[12px] font-medium text-muted">{apt.type}</span>
                              </div>
                            </div>
                            
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                              {role === 'doctor' ? (
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setActiveDropdown(activeDropdown === apt.id ? null : apt.id); 
                                  }}
                                  className={cn(
                                    "px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full shrink-0",
                                    getStatusColor(apt.status)
                                  )}
                                >
                                  {apt.status}
                                </button>
                              ) : (
                                <div className={cn(
                                  "px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full shrink-0",
                                  getStatusColor(apt.status)
                                )}>
                                  {apt.status}
                                </div>
                              )}

                              {activeDropdown === apt.id && (
                                <div className="absolute top-full right-0 mt-1 w-36 bg-surface rounded-xl shadow-xl border border-border py-1.5 z-50 overflow-hidden">
                                  {['PENDING', 'WAITING', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED'].map(status => (
                                    <button
                                      key={status}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateStatus(apt.id, status);
                                      }}
                                      className="w-full text-left px-4 py-2.5 text-[11px] font-bold uppercase text-[#0A1A3D] hover:bg-[#EBF5FF] hover:text-[#1B5DF1] transition-colors"
                                    >
                                      {status}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Footer Actions */}
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                            <div className="flex items-center gap-1.5 text-muted text-[12px] font-semibold">
                              <FileText className="w-3.5 h-3.5" />
                              <span>Consultation</span>
                            </div>
                            
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/patients/${apt.id}`);
                                }}
                                className="flex items-center gap-1.5 text-[#1B5DF1] font-bold text-[12px] sm:text-[13px] px-3.5 py-1.5 rounded-xl border border-[#1B5DF1]/20 hover:bg-[#EBF5FF] transition-colors active:scale-95"
                                title="View Detailed Patient Record"
                              >
                                <User className="w-3.5 h-3.5" />
                                Patient View
                              </button>

                              {apt.status !== 'CANCELLED' && role === 'doctor' && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedAppointment(apt);
                                  }}
                                  className="flex items-center gap-1.5 bg-[#1B5DF1] text-white font-bold text-[12px] sm:text-[13px] px-3.5 py-1.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-[#1B5DF1]/20 active:scale-95"
                                  title="Start Doctor Consultation"
                                >
                                  <Play className="w-3.5 h-3.5 fill-white" />
                                  Start
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
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12">
                  <EmptyState 
                    icon={Search}
                    title="No Patients Found"
                    description="Try adjusting your filters or search query."
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Filter Popover Modal */}
      <AnimatePresence>
        {isFilterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-surface rounded-3xl p-6 w-full max-w-md shadow-2xl border border-border flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-[#1B5DF1] rounded-xl">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0A1A3D]">Filter Appointments</h3>
                    <p className="text-xs text-muted">Refine the queue by status, service, or doctor</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsFilterModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full text-muted/70 hover:text-foreground/80 transition-colors"
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
                    { id: 'IN_CONSULTATION', label: 'In Consultation' },
                    { id: 'COMPLETED', label: 'Completed' },
                    { id: 'CANCELLED', label: 'Cancelled' }
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setSelectedStatus(st.id)}
                      className={cn(
                        "px-3 py-2 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between border",
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
                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
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

              {/* Doctor Filter */}
              {uniqueDoctors.length > 0 && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Assigned Doctor</label>
                  <select
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="w-full bg-gray-50 border border-border text-foreground text-sm font-medium rounded-xl p-2.5 outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/10"
                  >
                    <option value="ALL">All Doctors</option>
                    {uniqueDoctors.map((doc) => (
                      <option key={doc} value={doc}>{doc}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sort Order */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Sort by Time</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSortOrder('earliest')}
                    className={cn(
                      "px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center",
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
                      "px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center",
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
                    setSelectedFilter('ops');
                    setSelectedStatus('ALL');
                    setSelectedDoctor('ALL');
                    setSortOrder('earliest');
                    setSearchQuery('');
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-muted hover:text-red-500 py-2 px-3 rounded-xl hover:bg-red-50 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset All
                </button>
                <button
                  onClick={() => setIsFilterModalOpen(false)}
                  className="px-5 py-2.5 bg-[#1B5DF1] text-white text-xs font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-[#1B5DF1]/20 transition-all"
                >
                  Apply & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AppointmentDetailModal 
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        appointment={selectedAppointment}
        onUpdateStatus={updateStatus}
      />
      <WalkInModal 
        isOpen={isWalkInModalOpen}
        onClose={() => setIsWalkInModalOpen(false)}
        onSuccess={() => fetchBookings(selectedDate)}
      />
    </div>
  )
}
