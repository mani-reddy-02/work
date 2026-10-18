import { useState, useEffect, useCallback, useMemo } from "react"
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Clock, 
  ArrowLeft, 
  Phone, 
  Play, 
  CheckCircle, 
  ExternalLink, 
  Activity, 
  ChevronDown, 
  ChevronUp,
  SlidersHorizontal,
  Sun,
  Moon
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { EmptyState } from "@/components/ui/EmptyState"
import { cn } from "@/lib/utils"
import { nurseApi, type NurseVisit } from "@/services/nurseApi"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/context/ToastContext"
import { NurseVisitDetailModal } from "@/components/nurse/NurseVisitDetailModal"

export function NurseCalendar() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [view, setView] = useState<'day' | 'week' | 'month'>('day');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [allVisits, setAllVisits] = useState<NurseVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<NurseVisit | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [shiftFilter, setShiftFilter] = useState<'all' | 'day' | 'night'>('all');
  const [isMonthExpanded, setIsMonthExpanded] = useState(false);

  const loadVisits = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await nurseApi.getVisits();
      setAllVisits(res.all || []);
    } catch (err: any) {
      console.error("Failed to load visits for calendar:", err);
      toast(err.message || "Failed to load schedule", "error");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    loadVisits();
  }, [loadVisits]);

  // Helper: Format Date to YYYY-MM-DD in IST
  const toISODate = (d: Date) => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  };

  const todayISO = toISODate(new Date());
  const currentISO = toISODate(currentDate);

  // Helper: Start of current week (Monday)
  const getStartOfWeek = (d: Date) => {
    const copy = new Date(d);
    const day = copy.getDay();
    const diff = copy.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
    copy.setDate(diff);
    copy.setHours(0, 0, 0, 0);
    return copy;
  };

  // 7 days of the active week
  const weekDays = useMemo(() => {
    const start = getStartOfWeek(currentDate);
    return Array.from({ length: 7 }).map((_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      const iso = toISODate(day);
      return {
        dateObj: day,
        iso,
        dayName: day.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: day.getDate(),
        monthShort: day.toLocaleDateString('en-US', { month: 'short' }),
        isToday: iso === todayISO,
        isSelected: iso === currentISO,
      };
    });
  }, [currentDate, currentISO, todayISO]);

  // Map visits by date for fast lookup & indicator dots
  const visitsByDate = useMemo(() => {
    const map = new Map<string, NurseVisit[]>();
    allVisits.forEach(v => {
      const list = map.get(v.date) || [];
      list.push(v);
      map.set(v.date, list);
    });
    return map;
  }, [allVisits]);

  // Navigation handlers
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (view === 'day') {
      d.setDate(d.getDate() - 1);
    } else if (view === 'week') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setMonth(d.getMonth() - 1);
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (view === 'day') {
      d.setDate(d.getDate() + 1);
    } else if (view === 'week') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setMonth(d.getMonth() + 1);
    }
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Visits filtered by current active view & shift filter
  const displayedVisits = useMemo(() => {
    let list: NurseVisit[] = [];
    if (view === 'day') {
      list = allVisits.filter(v => v.date === currentISO);
    } else if (view === 'week') {
      const startISO = weekDays[0]?.iso;
      const endISO = weekDays[6]?.iso;
      list = allVisits.filter(v => v.date >= startISO && v.date <= endISO);
    } else {
      // Month
      const year = currentDate.getFullYear();
      const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
      const prefix = `${year}-${monthStr}`;
      list = allVisits.filter(v => v.date.startsWith(prefix));
    }

    if (shiftFilter === 'day') {
      list = list.filter(v => v.time.toLowerCase().includes('day') || v.time.includes('AM'));
    } else if (shiftFilter === 'night') {
      list = list.filter(v => v.time.toLowerCase().includes('night') || v.time.includes('PM'));
    }

    return list.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }, [allVisits, view, currentISO, weekDays, currentDate, shiftFilter]);

  // Visits for today
  const dayVisits = visitsByDate.get(currentISO) || [];

  const handleUpdateStatus = async (visitId: string, status: 'IN_PROGRESS' | 'COMPLETED') => {
    setActionLoadingId(visitId);
    try {
      await nurseApi.updateVisitStatus(visitId, status);
      toast(
        status === 'IN_PROGRESS' ? "Visit started! Status updated to In Progress." : "Home nursing service marked as Completed!",
        "success"
      );
      setIsModalOpen(false);
      setSelectedVisit(null);
      await loadVisits(true);
    } catch (err: any) {
      toast(err.message || "Failed to update visit status", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const openVisitDetail = (visit: NurseVisit) => {
    setSelectedVisit(visit);
    setIsModalOpen(true);
  };

  // Full Month Calendar Matrix for Month Picker
  const monthMatrix = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // Sunday: 0, Monday: 1
    const totalDays = new Date(year, month + 1, 0).getDate();

    const matrix: ({ dayNumber: number; iso: string; isCurrentMonth: boolean } | null)[] = [];
    // Leading empty slots (aligning with Monday start)
    const offset = (firstDay + 6) % 7;
    for (let i = 0; i < offset; i++) {
      matrix.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      matrix.push({
        dayNumber: d,
        iso: `${year}-${monthStr}-${dayStr}`,
        isCurrentMonth: true,
      });
    }
    return matrix;
  }, [currentDate]);

  return (
    <div className="flex flex-col bg-gray-50/30 min-h-screen pb-[120px]">
      
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-xl pt-5 pb-3 px-4 flex flex-col gap-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-b border-border">
        
        {/* Title row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => navigate('/nurse')} 
              className="p-2 -ml-2 text-muted hover:text-[#0A1A3D] transition-colors rounded-xl hover:bg-gray-100"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5 text-[#0A1A3D]" />
            </button>
            <div>
              <h1 className="text-[20px] font-black text-[#0A1A3D] tracking-tight">Duty Schedule</h1>
              <p className="text-[12px] text-muted font-medium">Calendar view of all patient visits & shifts</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToday}
              className="px-3 py-1.5 text-[12px] font-extrabold text-[#1769E0] bg-blue-50 border border-blue-200/80 rounded-xl hover:bg-blue-100 transition-colors shadow-sm"
            >
              Today
            </button>
            <button
              onClick={() => loadVisits(true)}
              disabled={isRefreshing}
              className="p-2 rounded-xl border border-border bg-surface text-[#0A1A3D] hover:bg-gray-100 transition-colors shadow-sm disabled:opacity-50"
              title="Refresh Schedule"
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin text-[#1769E0]")} />
            </button>
          </div>
        </div>

        {/* View Switcher (Day / Week / Month) */}
        <div className="flex bg-gray-100/90 p-1 rounded-2xl border border-border/40 shadow-inner">
          <button 
            onClick={() => setView('day')}
            className={cn(
              "flex-1 py-1.5 text-[13px] font-extrabold rounded-xl transition-all",
              view === 'day' 
                ? "bg-surface text-[#1769E0] shadow-sm font-black" 
                : "text-muted hover:text-[#0A1A3D]"
            )}
          >
            Day View
          </button>
          <button 
            onClick={() => setView('week')}
            className={cn(
              "flex-1 py-1.5 text-[13px] font-extrabold rounded-xl transition-all",
              view === 'week' 
                ? "bg-surface text-[#1769E0] shadow-sm font-black" 
                : "text-muted hover:text-[#0A1A3D]"
            )}
          >
            Week View
          </button>
          <button 
            onClick={() => setView('month')}
            className={cn(
              "flex-1 py-1.5 text-[13px] font-extrabold rounded-xl transition-all",
              view === 'month' 
                ? "bg-surface text-[#1769E0] shadow-sm font-black" 
                : "text-muted hover:text-[#0A1A3D]"
            )}
          >
            Month Grid
          </button>
        </div>

        {/* Date Navigator Bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-surface rounded-2xl border border-border shadow-sm">
          <button 
            onClick={handlePrev} 
            className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors text-[#0A1A3D]"
            title="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div 
            onClick={() => setIsMonthExpanded(prev => !prev)}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            title="Click to toggle month overview"
          >
            <CalendarIcon className="w-4 h-4 text-[#1769E0]" />
            <span className="font-black text-[14px] text-[#0A1A3D]">
              {view === 'day' 
                ? currentDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
                : view === 'week'
                ? `${weekDays[0]?.dayNumber} ${weekDays[0]?.monthShort} - ${weekDays[6]?.dayNumber} ${weekDays[6]?.monthShort} ${weekDays[6]?.dateObj.getFullYear()}`
                : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              }
            </span>
            <ChevronDown className={cn("w-3.5 h-3.5 text-muted transition-transform", isMonthExpanded && "rotate-180")} />
          </div>

          <button 
            onClick={handleNext} 
            className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors text-[#0A1A3D]"
            title="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive 7-Day Week Strip (Available in Day & Week views) */}
        {view !== 'month' && !isMonthExpanded && (
          <div className="grid grid-cols-7 gap-1.5 pt-1">
            {weekDays.map(d => {
              const dayVisitsList = visitsByDate.get(d.iso) || [];
              const count = dayVisitsList.length;
              const hasInProgress = dayVisitsList.some(v => v.rawStatus === 'IN_PROGRESS');
              const hasCompleted = dayVisitsList.some(v => v.rawStatus === 'COMPLETED');

              return (
                <button
                  key={d.iso}
                  onClick={() => {
                    setCurrentDate(d.dateObj);
                    if (view !== 'day') setView('day');
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 rounded-2xl transition-all border relative",
                    d.isSelected
                      ? "bg-[#1769E0] text-white border-[#1769E0] shadow-md shadow-[#1769E0]/20 scale-[1.02]"
                      : d.isToday
                      ? "bg-blue-50/70 border-blue-200 text-[#0A1A3D] hover:bg-blue-100/50"
                      : "bg-surface border-border/80 text-muted hover:bg-gray-50"
                  )}
                >
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    d.isSelected ? "text-blue-100" : "text-muted/80"
                  )}>
                    {d.dayName}
                  </span>
                  <span className={cn(
                    "text-[15px] font-black leading-tight mt-0.5",
                    d.isSelected ? "text-white" : "text-[#0A1A3D]"
                  )}>
                    {d.dayNumber}
                  </span>

                  {/* Visit Indicator Dots */}
                  <div className="h-1.5 flex items-center gap-0.5 mt-1">
                    {count > 0 && (
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        d.isSelected 
                          ? "bg-white" 
                          : hasInProgress 
                          ? "bg-amber-500 animate-pulse" 
                          : hasCompleted
                          ? "bg-emerald-500"
                          : "bg-[#1769E0]"
                      )}></span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Expandable Month Mini Grid */}
        <AnimatePresence>
          {(isMonthExpanded || view === 'month') && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-surface rounded-2xl p-3 border border-border overflow-hidden shadow-sm"
            >
              <div className="grid grid-cols-7 text-center pb-2 border-b border-border/50 text-[11px] font-extrabold text-muted uppercase">
                <span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span><span>Su</span>
              </div>
              <div className="grid grid-cols-7 gap-1 pt-2">
                {monthMatrix.map((item, idx) => {
                  if (!item) return <div key={idx} className="h-9" />;
                  const count = (visitsByDate.get(item.iso) || []).length;
                  const isSelected = item.iso === currentISO;
                  const isToday = item.iso === todayISO;

                  return (
                    <button
                      key={item.iso}
                      onClick={() => {
                        const [y, m, d] = item.iso.split('-').map(Number);
                        setCurrentDate(new Date(y, m - 1, d));
                        if (isMonthExpanded) setIsMonthExpanded(false);
                        setView('day');
                      }}
                      className={cn(
                        "h-9 rounded-xl flex flex-col items-center justify-center text-[12px] font-bold transition-all relative",
                        isSelected
                          ? "bg-[#1769E0] text-white shadow-sm"
                          : isToday
                          ? "bg-blue-50 text-[#1769E0] font-black border border-blue-200"
                          : "hover:bg-gray-100 text-[#0A1A3D]"
                      )}
                    >
                      <span>{item.dayNumber}</span>
                      {count > 0 && (
                        <span className={cn(
                          "w-1 h-1 rounded-full absolute bottom-1",
                          isSelected ? "bg-white" : "bg-[#1769E0]"
                        )}></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Schedule Content */}
      <div className="flex flex-col px-4 pt-4 gap-4">
        
        {/* Sub-Header Bar: Summary counter & Shift filter pills */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-black text-[#0A1A3D] uppercase tracking-wider">
              {view === 'day' 
                ? (currentISO === todayISO ? "Today's Schedule" : "Scheduled Visits")
                : view === 'week'
                ? "This Week's Schedule"
                : "Monthly Overview"
              }
            </h3>
            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-[#1769E0] border border-blue-100">
              {displayedVisits.length} {displayedVisits.length === 1 ? 'Visit' : 'Visits'}
            </span>
          </div>

          {/* Quick Shift Filter */}
          <div className="flex bg-surface border border-border rounded-xl p-0.5 shadow-sm text-[11px] font-bold">
            <button
              onClick={() => setShiftFilter('all')}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all",
                shiftFilter === 'all' ? "bg-[#1769E0] text-white font-extrabold" : "text-muted hover:text-[#0A1A3D]"
              )}
            >
              All
            </button>
            <button
              onClick={() => setShiftFilter('day')}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all flex items-center gap-1",
                shiftFilter === 'day' ? "bg-[#1769E0] text-white font-extrabold" : "text-muted hover:text-[#0A1A3D]"
              )}
            >
              <Sun className="w-3 h-3" /> Day
            </button>
            <button
              onClick={() => setShiftFilter('night')}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all flex items-center gap-1",
                shiftFilter === 'night' ? "bg-[#1769E0] text-white font-extrabold" : "text-muted hover:text-[#0A1A3D]"
              )}
            >
              <Moon className="w-3 h-3" /> Night
            </button>
          </div>
        </div>

        {/* Schedule List */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-[#1769E0]" />
              <p className="text-[13px] text-muted font-medium">Loading schedule...</p>
            </div>
          ) : displayedVisits.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12">
              <EmptyState
                icon={CalendarDays}
                title={view === 'day' ? "No Visits Scheduled for this Date" : "No Visits Found"}
                description={
                  view === 'day' 
                    ? `You don't have any home nursing visits scheduled for ${currentDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.`
                    : "No visits match the selected time period or shift filter."
                }
                actionLabel={currentISO !== todayISO ? "Go to Today's Schedule" : undefined}
                onAction={handleToday}
              />
            </motion.div>
          ) : (
            <motion.div key={currentISO + view + shiftFilter} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
              {displayedVisits.map((visit) => {
                const isInProgress = visit.rawStatus === 'IN_PROGRESS';
                const isCompleted = visit.rawStatus === 'COMPLETED';

                return (
                  <div
                    key={visit.id}
                    onClick={() => openVisitDetail(visit)}
                    className={cn(
                      "bg-surface border rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all cursor-pointer hover:shadow-md flex flex-col gap-3",
                      isInProgress 
                        ? "border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/15" 
                        : isCompleted
                        ? "border-border/60 hover:border-emerald-300"
                        : "border-border/80 hover:border-[#1769E0]/40"
                    )}
                  >
                    {/* Header: Date/Shift tag + Status pill */}
                    <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                      <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#0A1A3D]">
                        <Clock className="w-3.5 h-3.5 text-[#1769E0]" />
                        <span>{visit.date} • {visit.time}</span>
                      </div>
                      <span className={cn(
                        "px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider rounded-lg border",
                        isInProgress 
                          ? 'bg-amber-50 text-amber-700 border-amber-300 flex items-center gap-1.5 animate-pulse' 
                          : isCompleted
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1'
                          : 'bg-blue-50 text-[#1769E0] border-blue-100'
                      )}>
                        {isInProgress && <Activity className="w-3 h-3 text-amber-600 animate-spin" />}
                        {isCompleted && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                        {visit.status}
                      </span>
                    </div>

                    {/* Patient & Service Row */}
                    <div className="flex gap-3">
                      <div className={cn(
                        "w-11 h-11 rounded-2xl flex items-center justify-center font-black shrink-0 text-[16px] border",
                        isInProgress
                          ? "bg-amber-100 text-amber-900 border-amber-300"
                          : isCompleted
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-blue-50 text-[#1769E0] border-blue-100"
                      )}>
                        {visit.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-extrabold text-[#0A1A3D] text-[16px] truncate leading-tight">
                            {visit.name}
                          </h4>
                          <span className="text-[11px] font-mono font-semibold text-muted bg-gray-100 px-2 py-0.5 rounded-md shrink-0">
                            {visit.bookingNumber}
                          </span>
                        </div>
                        <p className="text-[13px] font-bold text-[#1769E0] mt-0.5 truncate">
                          {visit.service}
                        </p>
                        {visit.serviceCategory && (
                          <span className="text-[11px] font-medium text-muted">
                            Category: {visit.serviceCategory}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Address Block with Map Link */}
                    <div className="flex items-start justify-between gap-2 text-[12px] text-[#475467] bg-gray-50 p-2.5 rounded-xl border border-border/50">
                      <div className="flex items-start gap-1.5 flex-1">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#1769E0]" />
                        <span className="line-clamp-2 leading-relaxed">
                          {visit.address}{visit.city ? `, ${visit.city}` : ''}
                        </span>
                      </div>
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(`${visit.address} ${visit.city || ''}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[#1769E0] hover:underline flex items-center gap-0.5 shrink-0 font-bold text-[11px] pt-0.5"
                        title="Open in Maps"
                      >
                        Directions <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {/* Direct Action Buttons */}
                    <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                      <a 
                        href={`tel:${visit.patientPhone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-3.5 py-2 bg-gray-50 border border-border text-[#0A1A3D] rounded-xl font-bold hover:bg-gray-100 transition-colors text-[13px] flex items-center gap-1.5"
                        title={`Call ${visit.name}`}
                      >
                        <Phone className="w-3.5 h-3.5 text-[#1769E0]" /> Call
                      </a>

                      {isInProgress ? (
                        <div className="flex-1 py-1.5 text-center text-[11px] font-bold text-amber-800 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-center gap-1">
                          <Activity className="w-3 h-3 text-amber-600 animate-spin" />
                          <span>In Progress (User will complete)</span>
                        </div>
                      ) : isCompleted ? (
                        <div className="flex-1 py-1.5 text-center text-[12px] font-bold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Finished (₹{visit.totalAmount})
                        </div>
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleUpdateStatus(visit.id, 'IN_PROGRESS'); }}
                          disabled={actionLoadingId === visit.id}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#1769E0] hover:bg-blue-700 text-white rounded-xl font-bold transition-all text-[13px] shadow-sm shadow-[#1769E0]/20 disabled:opacity-50"
                        >
                          <Play className="w-4 h-4 fill-white" />
                          {actionLoadingId === visit.id ? "Starting..." : "Start Visit"}
                        </button>
                      )}

                      <button
                        onClick={(e) => { e.stopPropagation(); openVisitDetail(visit); }}
                        className="px-3 py-2 text-[12px] font-bold text-muted hover:text-[#0A1A3D] rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Visit Detail Modal */}
      <NurseVisitDetailModal
        visit={selectedVisit}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedVisit(null); }}
        onUpdateStatus={handleUpdateStatus}
        actionLoadingId={actionLoadingId}
      />
    </div>
  )
}
