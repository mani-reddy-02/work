import { 
  Search, Filter, Calendar, ArrowLeft, Play, FileText, X, RotateCcw,
  CheckCircle2, Check, User, Phone, Clock, CalendarDays, History
} from "lucide-react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "@/context/AuthContext"
import { motion, AnimatePresence } from "framer-motion"
import { Skeleton } from "../../components/ui/Skeleton"
import { EmptyState } from "../../components/ui/EmptyState"
import { cn } from "@/lib/utils"
import { useNavigate, useLocation } from "react-router-dom"
import { doctorApi } from "@/services/doctorApi"
import { adminApi } from "@/services/adminApi"

// OP appointment records type
export type DoctorAppointment = {
  id: string; 
  mqId: string; 
  patientName: string; 
  patientPhone?: string; 
  patientAge?: number | string;
  patientGender?: string;
  reason?: string;
  time: string; 
  period: string;
  date: string; 
  type: string; 
  opType: string;
  diseaseName?: string;
  doctor: string; 
  status: string; 
  rawStatus: string;
  avatar: string;
};

export function DoctorOPs() {
  const location = useLocation();
  const locationState = location.state as { date?: string; status?: string; filter?: string } | undefined;

  const [selectedPatient, setSelectedPatient] = useState<DoctorAppointment | null>(null);
  const [patientFullDetails, setPatientFullDetails] = useState<any>(null);
  const [patientDetailsLoading, setPatientDetailsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(() => locationState?.filter || 'all');
  const [selectedDate, setSelectedDate] = useState(() => locationState?.date || 'upcoming');
  const [selectedStatus, setSelectedStatus] = useState<string>(() => locationState?.status || 'ALL');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<'all' | 'am' | 'pm'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const dateInputRef = useRef<HTMLInputElement>(null);
  const { role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (locationState) {
      if (locationState.date) setSelectedDate(locationState.date);
      if (locationState.filter) setSelectedFilter(locationState.filter);
      if (locationState.status) setSelectedStatus(locationState.status);
    }
  }, [locationState]);

  const filterTypes = [
    { id: 'all', label: 'All' },
    { id: 'opd', label: 'OPD' },
    { id: 'followup', label: 'Follow Up' },
    { id: 'new', label: 'New Patient' },
    { id: 'video', label: 'Video Call' },
  ];

  // Dynamic 14-day date strip
  const formatLocalDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  const todayIso = formatLocalDate(today);
  const dates = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = formatLocalDate(d);
    const dayStr = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const dateStr = `${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}`;
    return { iso, date: dateStr, day: dayStr };
  });

  const [appointmentsList, setAppointmentsList] = useState<DoctorAppointment[]>([]);

  const openPatientProfile = async (apt: DoctorAppointment) => {
    setSelectedPatient(apt);
    setPatientFullDetails(null);
    setPatientDetailsLoading(true);
    try {
      const details = await doctorApi.getAppointmentById(apt.id);
      setPatientFullDetails(details);
    } catch (err) {
      console.warn("Could not load extended patient details:", err);
    } finally {
      setPatientDetailsLoading(false);
    }
  };

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await doctorApi.getMyAppointments();
      const mapped: DoctorAppointment[] = (data || []).map((a: any) => {
        const timeStr = a.slotTime || a.timeSlot || '10:00 AM';
        const parts = timeStr.trim().split(' ');
        const opTypeStr = a.opType || 'OPD';
        const diseaseStr = a.diseaseName || '';
        return {
          id: a.id || a.appointmentId,
          mqId: (a.id || a.appointmentId || '').slice(0, 8).toUpperCase() || 'OP',
          patientName: a.patientName || a.name || 'Patient',
          patientPhone: a.patientPhone,
          patientAge: a.patientAge ?? a.age,
          patientGender: a.patientGender || a.gender,
          reason: a.reason,
          time: parts[0] || '10:00',
          period: parts[1] || (timeStr.toUpperCase().includes('PM') ? 'PM' : 'AM'),
          date: (a.date || '').split('T')[0],
          opType: opTypeStr,
          diseaseName: diseaseStr,
          type: opTypeStr === 'OPD' && diseaseStr ? diseaseStr : (opTypeStr || 'General OP'),
          doctor: a.doctorName || 'Doctor',
          status: a.status || 'WAITING',
          rawStatus: a.status || 'WAITING',
          avatar: a.doctorAvatar || ''
        };
      });
      setAppointmentsList(mapped);
    } catch (err) {
      console.error("Failed to load doctor appointments:", err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // 4-second live polling interval
    const interval = setInterval(() => {
      loadData(true);
    }, 4000);

    const handleFocus = () => loadData(true);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadData]);

  // Check if selected date is custom outside default 14-day strip
  const isCustomDate = selectedDate !== 'upcoming' && selectedDate !== 'all' && !dates.some(d => d.iso === selectedDate);

  // Date filtering
  const dateFilteredAppointments = appointmentsList.filter(apt => {
    if (selectedDate === 'upcoming') {
      return apt.date >= todayIso || apt.status === 'IN_CONSULTATION' || apt.status === 'WAITING';
    }
    if (selectedDate === 'all') {
      return true;
    }
    return apt.date === selectedDate;
  });

  // Calculate counts for the selected date view
  const totalInDate = dateFilteredAppointments.length;
  const pendingInDate = dateFilteredAppointments.filter(a => a.status === 'WAITING' || a.status === 'PENDING').length;
  const inConsultInDate = dateFilteredAppointments.filter(a => a.status === 'IN_CONSULTATION' || a.status === 'IN PROGRESS').length;
  const completedInDate = dateFilteredAppointments.filter(a => a.status === 'COMPLETED').length;

  // Tab, status, time & search filtering
  const filteredAppointments = dateFilteredAppointments.filter(apt => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      apt.patientName.toLowerCase().includes(q) ||
      apt.mqId.toLowerCase().includes(q) ||
      (apt.type && apt.type.toLowerCase().includes(q)) ||
      (apt.reason && apt.reason.toLowerCase().includes(q));
    
    if (!matchesSearch) return false;

    // Filter by Type
    const opTypeLower = (apt.opType || '').toLowerCase();
    const typeLower = (apt.type || '').toLowerCase();
    const reasonLower = (apt.reason || '').toLowerCase();
    const diseaseLower = (apt.diseaseName || '').toLowerCase();
    const combinedType = `${opTypeLower} ${typeLower} ${reasonLower} ${diseaseLower}`;

    if (selectedFilter === 'opd') {
      const isVideo = combinedType.includes('video');
      const isFollow = combinedType.includes('follow');
      const isNew = combinedType.includes('new');
      if (isVideo || isFollow || isNew) return false;
    } else if (selectedFilter === 'followup') {
      if (!combinedType.includes('follow')) return false;
    } else if (selectedFilter === 'new') {
      if (!combinedType.includes('new')) return false;
    } else if (selectedFilter === 'video') {
      if (!combinedType.includes('video')) return false;
    }

    // Filter by Status
    if (selectedStatus !== 'ALL') {
      if (selectedStatus === 'PENDING') {
        if (apt.status !== 'WAITING' && apt.status !== 'PENDING') return false;
      } else if (selectedStatus === 'IN_CONSULTATION') {
        if (apt.status !== 'IN_CONSULTATION' && apt.status !== 'IN PROGRESS') return false;
      } else if (selectedStatus === 'COMPLETED') {
        if (apt.status !== 'COMPLETED') return false;
      } else if (selectedStatus === 'CANCELLED') {
        if (apt.status !== 'CANCELLED') return false;
      } else if (apt.status !== selectedStatus) {
        return false;
      }
    }

    // Filter by Time Period
    if (selectedTimePeriod === 'am' && apt.period !== 'AM') return false;
    if (selectedTimePeriod === 'pm' && apt.period !== 'PM') return false;

    return true;
  });

  // Chronological queue ordering: in-consultation first, then today's waiting, then upcoming dates
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    // 1. In consultation is always pinned to top
    const aInConsult = a.status === 'IN_CONSULTATION' || a.status === 'IN PROGRESS';
    const bInConsult = b.status === 'IN_CONSULTATION' || b.status === 'IN PROGRESS';
    if (aInConsult && !bInConsult) return -1;
    if (bInConsult && !aInConsult) return 1;

    // 2. Date sort: earlier dates first
    const dateComp = (a.date || '').localeCompare(b.date || '');
    if (dateComp !== 0) return dateComp;

    // 3. Waiting / Pending before Completed / Cancelled
    const aWaiting = a.status === 'WAITING' || a.status === 'PENDING';
    const bWaiting = b.status === 'WAITING' || b.status === 'PENDING';
    if (aWaiting && !bWaiting) return -1;
    if (bWaiting && !aWaiting) return 1;

    // 4. Time slot sort (morning to evening)
    const parseTimeMinutes = (timeStr: string, periodStr: string) => {
      const [h, m] = (timeStr || '10:00').split(':').map(n => parseInt(n, 10) || 0);
      let hour = h;
      if (periodStr === 'PM' && hour < 12) hour += 12;
      if (periodStr === 'AM' && hour === 12) hour = 0;
      return hour * 60 + m;
    };
    return parseTimeMinutes(a.time, a.period) - parseTimeMinutes(b.time, b.period);
  });

  const updateStatus = async (id: string, newStatus: string, notes?: string) => {
    // Immediate optimistic update
    setAppointmentsList(prev => prev.map(a => a.id === id ? { ...a, status: newStatus, rawStatus: newStatus } : a));
    setSelectedPatient(prev => prev && prev.id === id ? { ...prev, status: newStatus, rawStatus: newStatus } : prev);
    setActiveDropdown(null);

    try {
      await adminApi.updateBookingStatus(id, newStatus, notes);
    } catch (err) {
      console.error("Failed to update status:", err);
      loadData(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-emerald-50 text-emerald-500';
      case 'PENDING': return 'bg-[#EBF5FF] text-[#1B5DF1]';
      case 'IN_CONSULTATION': return 'bg-blue-50 text-blue-600 border border-blue-200';
      case 'COMPLETED': return 'bg-[#0A1A3D] text-white';
      case 'CANCELLED': return 'bg-red-50 text-red-500';
      case 'WAITING': return 'bg-amber-50 text-amber-500';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="flex flex-col bg-gray-50/30 min-h-full pb-8 w-full max-w-7xl mx-auto" onClick={() => setActiveDropdown(null)}>
      
      {/* Header Section */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-xl pt-4 md:pt-5 pb-4 px-4 md:px-6 flex flex-col gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[#0A1A3D] hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-[22px] font-black text-[#0A1A3D] tracking-tight">OP Consultations</h1>
            <span className="text-[13px] font-bold text-muted">Today</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col gap-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted/70 group-focus-within:text-[#1B5DF1] transition-colors">
              <Search className="w-4 h-4" />
            </div>
            <input 
              type="text" 
              placeholder="Search by name or ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-12 py-3.5 bg-surface border border-border rounded-[16px] outline-none focus:border-[#1B5DF1] focus:ring-4 focus:ring-[#1B5DF1]/10 transition-all text-[15px] font-medium text-[#0A1A3D] placeholder:text-muted/70 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
            />
            <button 
              type="button"
              onClick={() => setIsFilterModalOpen(prev => !prev)}
              className={cn(
                "absolute inset-y-0 right-3.5 my-auto flex items-center justify-center w-8 h-8 rounded-xl transition-all cursor-pointer",
                (selectedFilter !== 'all' || selectedStatus !== 'ALL' || selectedTimePeriod !== 'all')
                  ? "text-white bg-[#1B5DF1] shadow-xs"
                  : "text-[#1B5DF1] hover:bg-blue-50/60"
              )}
              title="Open filter menu"
            >
              <Filter className="w-4 h-4" />
              {(selectedFilter !== 'all' || selectedStatus !== 'ALL' || selectedTimePeriod !== 'all') && (
                <span className="w-2 h-2 bg-amber-400 rounded-full absolute top-1 right-1"></span>
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
                  "px-5 py-2 rounded-full flex-shrink-0 transition-all active:scale-95 font-bold text-[13px] cursor-pointer",
                  isActive ? "bg-[#1B5DF1] text-white shadow-md shadow-[#1B5DF1]/20" : "bg-surface text-[#667085] border border-border hover:bg-gray-50"
                )}
              >
                {type.label}
              </button>
            )
          })}
        </div>

        {/* Date Strip */}
        <div className="flex items-center gap-2.5 mt-1">
          {/* Calendar Picker Trigger */}
          <div className="relative">
            <input 
              ref={dateInputRef}
              type="date"
              value={selectedDate !== 'upcoming' && selectedDate !== 'all' ? selectedDate : todayIso}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(e.target.value);
                  setIsCalendarOpen(false);
                }
              }}
              className="sr-only"
            />
            <button 
              type="button"
              onClick={() => {
                if (dateInputRef.current && typeof dateInputRef.current.showPicker === 'function') {
                  try {
                    dateInputRef.current.showPicker();
                  } catch {
                    setIsCalendarOpen(prev => !prev);
                  }
                } else {
                  setIsCalendarOpen(prev => !prev);
                }
              }}
              title="Pick a specific date from calendar"
              className={cn(
                "flex items-center justify-center w-[52px] h-[52px] rounded-[16px] flex-shrink-0 active:scale-95 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)] border cursor-pointer",
                isCustomDate 
                  ? "bg-[#1B5DF1] text-white border-[#1B5DF1] shadow-md shadow-[#1B5DF1]/20 ring-2 ring-[#1B5DF1]/30" 
                  : "bg-surface border-border text-[#1B5DF1] hover:bg-blue-50/50 hover:border-[#1B5DF1]/30"
              )}
            >
              <Calendar className={cn("w-6 h-6", isCustomDate ? "text-white" : "text-[#1B5DF1]")} />
            </button>
          </div>

          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide py-1 flex-1">
            {/* If a custom date outside the 14 days was chosen, show it first */}
            {isCustomDate && (
              <button 
                onClick={() => setSelectedDate(selectedDate)}
                className="flex flex-col items-center justify-center min-w-[76px] h-[52px] rounded-[16px] flex-shrink-0 transition-all active:scale-95 px-3 border bg-[#1B5DF1] text-white shadow-lg shadow-[#1B5DF1]/30 border-[#1B5DF1] cursor-pointer"
              >
                <span className="text-[13px] font-bold leading-tight text-white">{selectedDate}</span>
                <span className="text-[10px] font-semibold leading-tight text-[#EBF5FF]">Selected</span>
              </button>
            )}
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

      <div className="flex flex-col px-4 md:px-6 pt-5 gap-6">
        
        {/* Summary Block */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[15px] font-bold text-[#0A1A3D]">
              {selectedDate === 'upcoming' 
                ? 'Upcoming Consultations' 
                : selectedDate === todayIso 
                  ? "Today's Consultations" 
                  : `Consultations on ${dates.find(d => d.iso === selectedDate)?.date || selectedDate}`}
            </h3>
            <span className="text-[#1B5DF1] text-[13px] font-bold">
              {sortedAppointments.length} Consultations
            </span>
          </div>

          <div className="bg-surface rounded-[20px] p-2 sm:p-3 flex items-center justify-between border border-border shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <button 
              onClick={() => setSelectedStatus('ALL')}
              className={cn(
                "flex flex-col items-center flex-1 py-2 px-1 rounded-xl transition-all cursor-pointer",
                selectedStatus === 'ALL' ? "bg-gray-100 dark:bg-gray-800 shadow-xs" : "hover:bg-gray-50"
              )}
              title="Click to view all consultations"
            >
              <span className="text-[22px] font-black text-[#0A1A3D]">{totalInDate}</span>
              <span className="text-[11px] font-bold text-muted">Total</span>
            </button>
            <div className="w-px h-10 bg-gray-100" />
            <button 
              onClick={() => setSelectedStatus(selectedStatus === 'PENDING' ? 'ALL' : 'PENDING')}
              className={cn(
                "flex flex-col items-center flex-1 py-2 px-1 rounded-xl transition-all cursor-pointer",
                selectedStatus === 'PENDING' ? "bg-[#EBF5FF] text-[#1B5DF1] ring-1 ring-[#1B5DF1]/30 shadow-xs" : "hover:bg-blue-50/50"
              )}
              title="Click to filter pending consultations"
            >
              <span className="text-[22px] font-black text-[#1B5DF1]">{pendingInDate}</span>
              <span className="text-[11px] font-bold text-[#1B5DF1]">Pending</span>
            </button>
            <div className="w-px h-10 bg-gray-100" />
            <button 
              onClick={() => setSelectedStatus(selectedStatus === 'IN_CONSULTATION' ? 'ALL' : 'IN_CONSULTATION')}
              className={cn(
                "flex flex-col items-center flex-1 py-2 px-1 rounded-xl transition-all cursor-pointer",
                selectedStatus === 'IN_CONSULTATION' ? "bg-blue-50 text-blue-700 ring-1 ring-blue-500/30 shadow-xs" : "hover:bg-blue-50/50"
              )}
              title="Click to filter consultations in progress"
            >
              <span className="text-[22px] font-black text-blue-600">{inConsultInDate}</span>
              <span className="text-[11px] font-bold text-muted">In Progress</span>
            </button>
            <div className="w-px h-10 bg-gray-100" />
            <button 
              onClick={() => setSelectedStatus(selectedStatus === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
              className={cn(
                "flex flex-col items-center flex-1 py-2 px-1 rounded-xl transition-all cursor-pointer",
                selectedStatus === 'COMPLETED' ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/30 shadow-xs" : "hover:bg-emerald-50/50"
              )}
              title="Click to filter completed consultations"
            >
              <span className="text-[22px] font-black text-emerald-600">{completedInDate}</span>
              <span className="text-[11px] font-bold text-muted">Completed</span>
            </button>
          </div>
        </div>

        {/* Appointment List */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-[#0A1A3D] text-[17px]">Appointment List</h2>
              {selectedStatus !== 'ALL' && (
                <span className="text-[11px] font-bold bg-[#EBF5FF] text-[#1B5DF1] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  Filtered: {selectedStatus}
                  <button onClick={() => setSelectedStatus('ALL')} className="hover:text-black ml-1 text-sm font-black">×</button>
                </span>
              )}
              {selectedFilter !== 'all' && (
                <span className="text-[11px] font-bold bg-gray-100 text-[#0A1A3D] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  Type: {filterTypes.find(f => f.id === selectedFilter)?.label || selectedFilter}
                  <button onClick={() => setSelectedFilter('all')} className="hover:text-black ml-1 text-sm font-black">×</button>
                </span>
              )}
            </div>
            {(selectedStatus !== 'ALL' || selectedFilter !== 'all') && (
              <button 
                onClick={() => { setSelectedStatus('ALL'); setSelectedFilter('all'); }}
                className="text-[12px] font-bold text-[#1B5DF1] hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="flex flex-col relative gap-3">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div key="skeletons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-32 rounded-2xl bg-surface border border-border" />
                  ))}
                </motion.div>
              ) : sortedAppointments.length > 0 ? (
                <motion.div key="list" initial={{ opacity: 1 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">                  {sortedAppointments.map((apt) => (
                    <div 
                      key={apt.id} 
                      onClick={() => openPatientProfile(apt)}
                      className="flex flex-col bg-surface border border-border hover:border-[#1B5DF1]/40 rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex gap-4">
                        {/* Time & Date */}
                        <div className="flex flex-col items-center min-w-[60px] pt-1">
                          <span className="text-[16px] font-black text-[#0A1A3D] leading-none">{apt.time}</span>
                          <span className="text-[11px] font-bold text-muted/70 mt-1">{apt.period}</span>
                          {apt.date && (
                            <span className="text-[9px] font-bold text-[#1B5DF1] bg-[#EBF5FF] px-1.5 py-0.5 rounded mt-1.5 text-center whitespace-nowrap">
                              {apt.date}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-col flex-1 gap-1 border-l border-border pl-4">
                          {/* Info & Status */}
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                              <span className="text-[16px] font-bold text-[#0A1A3D] group-hover:text-[#1B5DF1] transition-colors">{apt.patientName}</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[12px] font-medium text-muted">ID: {apt.mqId}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span className="text-[12px] font-medium text-muted">{apt.type}</span>
                              </div>
                            </div>
                            
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                              {role === 'doctor' ? (
                                <button 
                                  onClick={() => setActiveDropdown(activeDropdown === apt.id ? null : apt.id)}
                                  className={cn(
                                    "px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full shrink-0",
                                    getStatusColor(apt.status)
                                  )}
                                >
                                  {apt.status.replace('_', ' ')}
                                </button>
                              ) : (
                                <div className={cn(
                                  "px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full shrink-0",
                                  getStatusColor(apt.status)
                                )}>
                                  {apt.status.replace('_', ' ')}
                                </div>
                              )}

                              {activeDropdown === apt.id && (
                                <div className="absolute top-full right-0 mt-1 w-44 bg-surface rounded-xl shadow-xl border border-border py-1.5 z-50 overflow-hidden">
                                  {['WAITING', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED'].map(status => (
                                    <button
                                      key={status}
                                      onClick={() => updateStatus(apt.id, status)}
                                      className="w-full text-left px-4 py-2.5 text-[11px] font-bold uppercase text-[#0A1A3D] hover:bg-[#EBF5FF] hover:text-[#1B5DF1] transition-colors cursor-pointer"
                                    >
                                      {status.replace('_', ' ')}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Footer Actions */}
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                            <div className="flex items-center gap-1.5 text-muted text-[12px] font-semibold">
                              <User className="w-3.5 h-3.5 text-[#1B5DF1]" />
                              <span className="text-[12px] font-bold text-muted group-hover:text-[#1B5DF1] transition-colors">Patient Profile</span>
                            </div>
                            
                            {/* Action Button: Start if Waiting, Completed if In Consultation */}
                            <div onClick={(e) => e.stopPropagation()}>
                              {apt.status === 'WAITING' || apt.status === 'PENDING' ? (
                                <button 
                                  onClick={() => updateStatus(apt.id, 'IN_CONSULTATION')}
                                  className="flex items-center gap-1.5 text-white bg-[#1B5DF1] hover:bg-blue-600 font-bold text-[13px] px-3.5 py-1.5 rounded-lg shadow-sm shadow-[#1B5DF1]/20 transition-all active:scale-95 cursor-pointer"
                                >
                                  <Play className="w-3.5 h-3.5 fill-white" />
                                  Start
                                </button>
                              ) : apt.status === 'IN_CONSULTATION' || apt.status === 'IN PROGRESS' ? (
                                <button 
                                  onClick={() => updateStatus(apt.id, 'COMPLETED')}
                                  className="flex items-center gap-1.5 text-white bg-emerald-600 hover:bg-emerald-700 font-bold text-[13px] px-3.5 py-1.5 rounded-lg shadow-sm shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Completed
                                </button>
                              ) : apt.status === 'COMPLETED' ? (
                                <div className="flex items-center gap-1 text-emerald-600 font-bold text-[12px] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                  Completed
                                </div>
                              ) : (
                                <div className="px-3 py-1 rounded-lg bg-gray-50 border border-border text-muted/70 text-[12px] font-bold">
                                  Cancelled
                                </div>
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
                    description="Try adjusting your date, search query, or filters."
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Calendar Picker Modal */}
      <AnimatePresence>
        {isCalendarOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-border rounded-3xl p-6 shadow-2xl max-w-sm w-full flex flex-col gap-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#1B5DF1]" />
                  <h3 className="text-[17px] font-bold text-[#0A1A3D]">Select Date</h3>
                </div>
                <button 
                  onClick={() => setIsCalendarOpen(false)}
                  className="p-1 text-muted hover:text-[#0A1A3D] rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Jump Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => { setSelectedDate(todayIso); setIsCalendarOpen(false); }}
                  className={cn(
                    "py-2.5 px-3 rounded-xl font-bold text-[13px] border transition-all text-center cursor-pointer",
                    selectedDate === todayIso ? "bg-[#1B5DF1] text-white border-[#1B5DF1]" : "bg-gray-50 hover:bg-gray-100 border-border text-[#0A1A3D]"
                  )}
                >
                  Today ({dates[0]?.date || 'Today'})
                </button>
                <button 
                  onClick={() => { setSelectedDate(dates[1]?.iso || todayIso); setIsCalendarOpen(false); }}
                  className={cn(
                    "py-2.5 px-3 rounded-xl font-bold text-[13px] border transition-all text-center cursor-pointer",
                    selectedDate === dates[1]?.iso ? "bg-[#1B5DF1] text-white border-[#1B5DF1]" : "bg-gray-50 hover:bg-gray-100 border-border text-[#0A1A3D]"
                  )}
                >
                  Tomorrow ({dates[1]?.date || 'Tomorrow'})
                </button>
                <button 
                  onClick={() => { setSelectedDate('upcoming'); setIsCalendarOpen(false); }}
                  className={cn(
                    "py-2.5 px-3 rounded-xl font-bold text-[13px] border transition-all text-center cursor-pointer",
                    selectedDate === 'upcoming' ? "bg-[#1B5DF1] text-white border-[#1B5DF1]" : "bg-gray-50 hover:bg-gray-100 border-border text-[#0A1A3D]"
                  )}
                >
                  All Upcoming
                </button>
                <button 
                  onClick={() => { setSelectedDate('all'); setIsCalendarOpen(false); }}
                  className={cn(
                    "py-2.5 px-3 rounded-xl font-bold text-[13px] border transition-all text-center cursor-pointer",
                    selectedDate === 'all' ? "bg-[#1B5DF1] text-white border-[#1B5DF1]" : "bg-gray-50 hover:bg-gray-100 border-border text-[#0A1A3D]"
                  )}
                >
                  All Dates
                </button>
              </div>

              {/* Custom Date Input */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-border">
                <label className="text-[12px] font-bold text-muted uppercase tracking-wider">
                  Pick Specific Date
                </label>
                <input 
                  type="date"
                  value={selectedDate !== 'upcoming' && selectedDate !== 'all' ? selectedDate : todayIso}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(e.target.value);
                      setIsCalendarOpen(false);
                    }
                  }}
                  className="w-full px-4 py-3 bg-gray-50 border border-border rounded-xl text-[14px] font-semibold text-[#0A1A3D] focus:outline-none focus:border-[#1B5DF1]"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Advanced Filter Modal */}
      <AnimatePresence>
        {isFilterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-border rounded-3xl p-6 shadow-2xl max-w-md w-full flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-[#1B5DF1]" />
                  <h3 className="text-[17px] font-bold text-[#0A1A3D]">Filter Consultations</h3>
                </div>
                <button 
                  onClick={() => setIsFilterModalOpen(false)}
                  className="p-1 text-muted hover:text-[#0A1A3D] rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Filter */}
              <div className="flex flex-col gap-2">
                <span className="text-[12px] font-bold text-muted uppercase tracking-wider">Status</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'ALL', label: 'All Statuses' },
                    { id: 'PENDING', label: 'Waiting / Pending' },
                    { id: 'IN_CONSULTATION', label: 'In Consultation' },
                    { id: 'COMPLETED', label: 'Completed' },
                    { id: 'CANCELLED', label: 'Cancelled' },
                  ].map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStatus(s.id)}
                      className={cn(
                        "px-3.5 py-1.5 rounded-xl font-bold text-[12px] border transition-all cursor-pointer",
                        selectedStatus === s.id ? "bg-[#1B5DF1] text-white border-[#1B5DF1]" : "bg-gray-50 border-border text-[#0A1A3D] hover:bg-gray-100"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Consultation Type Filter */}
              <div className="flex flex-col gap-2">
                <span className="text-[12px] font-bold text-muted uppercase tracking-wider">Consultation Type</span>
                <div className="flex flex-wrap gap-2">
                  {filterTypes.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedFilter(t.id)}
                      className={cn(
                        "px-3.5 py-1.5 rounded-xl font-bold text-[12px] border transition-all cursor-pointer",
                        selectedFilter === t.id ? "bg-[#1B5DF1] text-white border-[#1B5DF1]" : "bg-gray-50 border-border text-[#0A1A3D] hover:bg-gray-100"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time of Day */}
              <div className="flex flex-col gap-2">
                <span className="text-[12px] font-bold text-muted uppercase tracking-wider">Time Slot</span>
                <div className="flex gap-2">
                  {[
                    { id: 'all', label: 'All Times' },
                    { id: 'am', label: 'Morning (AM)' },
                    { id: 'pm', label: 'Afternoon / Evening (PM)' },
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedTimePeriod(p.id as any)}
                      className={cn(
                        "flex-1 py-2 rounded-xl font-bold text-[12px] border transition-all text-center cursor-pointer",
                        selectedTimePeriod === p.id ? "bg-[#1B5DF1] text-white border-[#1B5DF1]" : "bg-gray-50 border-border text-[#0A1A3D] hover:bg-gray-100"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-border mt-2">
                <button
                  onClick={() => {
                    setSelectedFilter('all');
                    setSelectedStatus('ALL');
                    setSelectedTimePeriod('all');
                  }}
                  className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl border border-border text-muted font-bold text-[13px] hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
                <button
                  onClick={() => setIsFilterModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#1B5DF1] text-white font-bold text-[14px] shadow-md shadow-[#1B5DF1]/20 hover:bg-blue-600 transition-colors cursor-pointer"
                >
                  Apply Filters ({sortedAppointments.length} Found)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Patient Profile Modal */}
      <AnimatePresence>
        {selectedPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-surface border border-border rounded-3xl p-6 shadow-2xl max-w-lg w-full flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1B5DF1] to-blue-500 flex items-center justify-center text-white font-black text-xl shadow-md shadow-[#1B5DF1]/20">
                    {selectedPatient.patientName?.[0]?.toUpperCase() || 'P'}
                  </div>
                  <div>
                    <h3 className="text-[18px] font-black text-[#0A1A3D] leading-tight">{selectedPatient.patientName}</h3>
                    <p className="text-[12px] font-semibold text-muted mt-0.5">ID: #{selectedPatient.mqId} • OP Consultation</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedPatient(null)} 
                  className="p-2 text-muted hover:text-[#0A1A3D] hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Banner */}
              <div className="flex items-center justify-between bg-gray-50/80 rounded-2xl p-3.5 border border-border">
                <span className="text-[12px] font-bold text-muted">Consultation Status</span>
                <span className={cn(
                  "px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full",
                  getStatusColor(selectedPatient.status)
                )}>
                  {selectedPatient.status.replace('_', ' ')}
                </span>
              </div>

              {/* Patient Core Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface rounded-2xl p-3.5 border border-border flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-[#1B5DF1]">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-muted">Age / Gender</p>
                    <p className="text-[13px] font-bold text-[#0A1A3D]">
                      {selectedPatient.patientAge ? `${selectedPatient.patientAge} Yrs` : 'Age N/A'} • {selectedPatient.patientGender || 'Not Specified'}
                    </p>
                  </div>
                </div>

                <div className="bg-surface rounded-2xl p-3.5 border border-border flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-muted">Phone Number</p>
                    <p className="text-[13px] font-bold text-[#0A1A3D]">
                      {selectedPatient.patientPhone || patientFullDetails?.patientPhone || 'Not provided'}
                    </p>
                  </div>
                </div>

                <div className="bg-surface rounded-2xl p-3.5 border border-border flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-muted">Slot Time</p>
                    <p className="text-[13px] font-bold text-[#0A1A3D]">
                      {selectedPatient.time} {selectedPatient.period}
                    </p>
                  </div>
                </div>

                <div className="bg-surface rounded-2xl p-3.5 border border-border flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-muted">Date & Type</p>
                    <p className="text-[13px] font-bold text-[#0A1A3D]">
                      {selectedPatient.date} • {selectedPatient.type}
                    </p>
                  </div>
                </div>
              </div>

              {/* Chief Complaint / Reason */}
              <div className="bg-surface rounded-2xl p-4 border border-border flex flex-col gap-2">
                <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Chief Complaint / Reason</span>
                <p className="text-[13px] font-medium text-[#0A1A3D] bg-gray-50 rounded-xl p-3 border border-gray-100">
                  {selectedPatient.reason || patientFullDetails?.reason 
                    ? `"${selectedPatient.reason || patientFullDetails?.reason}"` 
                    : 'General consultation requested'}
                </p>
              </div>

              {/* Past Visits / History */}
              {patientDetailsLoading ? (
                <div className="flex items-center justify-center py-3">
                  <span className="text-xs font-bold text-muted animate-pulse">Loading patient history...</span>
                </div>
              ) : patientFullDetails?.pastVisits && patientFullDetails.pastVisits.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-[#1B5DF1]" />
                    Previous Consultations ({patientFullDetails.pastVisits.length})
                  </span>
                  <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {patientFullDetails.pastVisits.map((visit: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                        <div>
                          <p className="font-bold text-[#0A1A3D]">{visit.diagnosis || 'OP Visit'}</p>
                          <p className="text-[11px] text-muted">Dr. {visit.doctor} • {visit.date}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-border">
                          {visit.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Modal Actions */}
              <div className="flex items-center justify-between gap-3 border-t border-border pt-4 mt-2">
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="py-3 px-5 rounded-xl border border-border text-muted font-bold text-[13px] hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Close
                </button>

                {selectedPatient.status === 'WAITING' || selectedPatient.status === 'PENDING' ? (
                  <button
                    onClick={() => updateStatus(selectedPatient.id, 'IN_CONSULTATION')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#1B5DF1] hover:bg-blue-600 text-white font-bold text-[14px] shadow-lg shadow-[#1B5DF1]/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Start Consultation
                  </button>
                ) : selectedPatient.status === 'IN_CONSULTATION' || selectedPatient.status === 'IN PROGRESS' ? (
                  <button
                    onClick={() => updateStatus(selectedPatient.id, 'COMPLETED')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[14px] shadow-lg shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Complete Consultation
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-[13px] bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl">
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    Consultation Completed
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
