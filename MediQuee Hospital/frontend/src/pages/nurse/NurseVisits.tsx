import { 
  Search, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Phone, 
  Calendar as CalendarIcon, 
  Play, 
  RefreshCw, 
  ArrowLeft, 
  ExternalLink, 
  Activity, 
  Filter, 
  X, 
  SlidersHorizontal, 
  RotateCcw, 
  ChevronRight,
  AlertCircle
} from "lucide-react"
import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Skeleton } from "@/components/ui/Skeleton"
import { EmptyState } from "@/components/ui/EmptyState"
import { cn } from "@/lib/utils"
import { useToast } from "@/context/ToastContext"
import { nurseApi, type NurseVisit } from "@/services/nurseApi"
import { useLocation, useNavigate } from "react-router-dom"
import { NurseVisitDetailModal } from "@/components/nurse/NurseVisitDetailModal"

export function NurseVisits() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { 
    date?: string; 
    status?: string; 
    filter?: string; 
    tab?: string;
  } | undefined;

  // Normalized IST Today
  const getTodayIST = () => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  };

  const todayIST = getTodayIST();

  // Dynamic 14-day date strip starting from today (matching OP in Appointments.tsx)
  const dates = Array.from({ length: 14 }).map((_, i) => {
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

  // Initial States from navigation or defaults
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (locationState?.date) return locationState.date;
    if (locationState?.tab === 'today' || locationState?.filter === 'today') return todayIST;
    if (locationState?.tab === 'upcoming' || locationState?.tab === 'in_progress') return 'upcoming';
    if (locationState?.tab === 'history') return 'all';
    return todayIST;
  });

  const [selectedStatus, setSelectedStatus] = useState<string>(() => {
    if (locationState?.status) return locationState.status;
    if (locationState?.tab === 'in_progress' || locationState?.filter === 'in_progress') return 'IN_PROGRESS';
    if (locationState?.tab === 'history') return 'COMPLETED';
    return 'ALL';
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedShift, setSelectedShift] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'earliest' | 'latest' | 'name'>('earliest');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [allVisits, setAllVisits] = useState<NurseVisit[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<NurseVisit | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const dateInputRef = useRef<HTMLInputElement>(null);

  const lastFetchRef = useRef<number>(0);

  const loadVisits = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await nurseApi.getVisits();
      setAllVisits(res.all || []);
    } catch (err: any) {
      console.error("Failed to load nurse visits:", err);
      if (!silent) {
        toast(err.message || "Failed to load home visits", "error");
      }
    } finally {
      if (!silent) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    loadVisits();
    lastFetchRef.current = Date.now();

    // 12-second gentle live polling
    const timer = setInterval(() => {
      loadVisits(true);
      lastFetchRef.current = Date.now();
    }, 12000);

    const handleThrottledSync = () => {
      if (Date.now() - lastFetchRef.current > 8000) {
        loadVisits(true);
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
  }, [loadVisits]);

  // Sync state if arrived from navigation
  useEffect(() => {
    if (location.state) {
      const s = location.state as { date?: string; status?: string; filter?: string; tab?: string };
      if (s.date) setSelectedDate(s.date);
      else if (s.tab === 'today' || s.filter === 'today') setSelectedDate(todayIST);
      else if (s.tab === 'upcoming' || s.tab === 'in_progress') setSelectedDate('upcoming');
      else if (s.tab === 'history') setSelectedDate('all');

      if (s.status) setSelectedStatus(s.status);
      else if (s.tab === 'in_progress' || s.filter === 'in_progress') setSelectedStatus('IN_PROGRESS');
      else if (s.tab === 'history') setSelectedStatus('COMPLETED');

      window.history.replaceState({}, '');
    }
  }, [location.state, todayIST]);

  const handleUpdateStatus = async (visitId: string, targetStatus: 'IN_PROGRESS' | 'COMPLETED') => {
    setActionLoadingId(visitId);
    try {
      await nurseApi.updateVisitStatus(visitId, targetStatus);
      toast(
        targetStatus === 'IN_PROGRESS'
          ? "Visit started! Status updated to In Progress."
          : "Home nursing service completed successfully!",
        "success"
      );
      await loadVisits(true);
    } catch (err: any) {
      toast(err.message || "Failed to update visit status", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleModalUpdateStatus = async (visitId: string, status: 'IN_PROGRESS' | 'COMPLETED') => {
    await handleUpdateStatus(visitId, status);
    setIsModalOpen(false);
    setSelectedVisit(null);
  };

  const openVisitDetail = (visit: NurseVisit) => {
    setSelectedVisit(visit);
    setIsModalOpen(true);
  };

  // Extract unique categories for filter modal
  const uniqueCategories = Array.from(
    new Set(allVisits.map(v => v.serviceCategory || v.service).filter(Boolean))
  );

  // Status mapping helpers
  const isPendingStatus = (v: NurseVisit) =>
    ['ASSIGNED', 'CONFIRMED'].includes(v.rawStatus) || (v.status === 'Upcoming' || v.status === 'Assigned');

  const isInProgressStatus = (v: NurseVisit) =>
    v.rawStatus === 'IN_PROGRESS' || v.status === 'In Progress';

  const isCompletedStatus = (v: NurseVisit) =>
    v.rawStatus === 'COMPLETED' || v.status === 'Completed';

  // Base visits filtered by Date Selection
  const dateFilteredVisits = allVisits.filter(v => {
    if (selectedDate === 'upcoming') {
      return v.date >= todayIST || v.rawStatus === 'IN_PROGRESS';
    }
    if (selectedDate === 'all') {
      return true;
    }
    // Specific date match (or if today is selected, also include active in-progress visits)
    return v.date === selectedDate || (selectedDate === todayIST && v.rawStatus === 'IN_PROGRESS');
  });

  // Calculate dynamic tile counters strictly for the active date selection
  const tilesSummary = {
    total: dateFilteredVisits.length,
    pending: dateFilteredVisits.filter(isPendingStatus).length,
    inProgress: dateFilteredVisits.filter(isInProgressStatus).length,
    completed: dateFilteredVisits.filter(isCompletedStatus).length,
  };

  // Final filtered list applying Status Tile, Search, Category, Shift & Sorting
  const filteredVisits = dateFilteredVisits
    .filter(v => {
      // 1. Status Filter (from Tiles or Modal)
      if (selectedStatus === 'PENDING') {
        if (!isPendingStatus(v)) return false;
      } else if (selectedStatus === 'IN_PROGRESS') {
        if (!isInProgressStatus(v)) return false;
      } else if (selectedStatus === 'COMPLETED') {
        if (!isCompletedStatus(v)) return false;
      } else if (selectedStatus === 'CANCELLED') {
        if (v.rawStatus !== 'CANCELLED') return false;
      }

      // 2. Service Category Filter
      if (selectedCategory !== 'ALL') {
        const cat = v.serviceCategory || v.service;
        if (cat !== selectedCategory) return false;
      }

      // 3. Shift Filter
      if (selectedShift !== 'ALL') {
        if (!v.time.toLowerCase().includes(selectedShift.toLowerCase())) return false;
      }

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          v.name.toLowerCase().includes(q) ||
          v.service.toLowerCase().includes(q) ||
          (v.serviceCategory && v.serviceCategory.toLowerCase().includes(q)) ||
          (v.patientPhone && v.patientPhone.includes(q)) ||
          (v.address && v.address.toLowerCase().includes(q)) ||
          (v.city && v.city.toLowerCase().includes(q)) ||
          (v.bookingNumber && v.bookingNumber.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortOrder === 'latest') {
        return (b.date + b.time).localeCompare(a.date + a.time);
      }
      if (sortOrder === 'name') {
        return a.name.localeCompare(b.name);
      }
      return (a.date + a.time).localeCompare(b.date + b.time);
    });

  // Active filters count for filter button badge
  const activeFiltersCount =
    (selectedStatus !== 'ALL' ? 1 : 0) +
    (selectedCategory !== 'ALL' ? 1 : 0) +
    (selectedShift !== 'ALL' ? 1 : 0) +
    (sortOrder !== 'earliest' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const getDateHeaderLabel = () => {
    if (selectedDate === 'upcoming') return "Upcoming Visits (All Dates)";
    if (selectedDate === 'all') return "All Assigned Visits";
    if (selectedDate === todayIST) return "Today's Visits";
    const d = dates.find(x => x.iso === selectedDate);
    if (d) return `Visits on ${d.date} (${d.day})`;
    return `Visits on ${selectedDate}`;
  };

  return (
    <div className="flex flex-col bg-gray-50/30 min-h-screen pb-[120px]">
      
      {/* Top Header & Search Bar */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-xl pt-5 pb-3 px-4 flex flex-col gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-b border-border">
        
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
              <h1 className="text-[20px] font-black text-[#0A1A3D] tracking-tight">Home Visits</h1>
              <p className="text-[12px] text-muted font-medium">Manage and service your assigned patient visits</p>
            </div>
          </div>
          <button
            onClick={() => loadVisits(true)}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl border border-border bg-surface text-[#0A1A3D] hover:bg-gray-100 transition-colors shadow-sm disabled:opacity-50"
            title="Refresh Visits"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin text-[#1769E0]")} />
          </button>
        </div>

        {/* Search Bar + More Filters Button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 group flex items-center">
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-muted/70 group-focus-within:text-[#1769E0] transition-colors">
              <Search className="w-4 h-4" />
            </div>
            <input 
              type="text" 
              placeholder="Search patient, service, booking ID, location..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-gray-50 border border-border/80 rounded-xl outline-none focus:border-[#1769E0] focus:bg-surface focus:ring-4 focus:ring-[#1769E0]/10 transition-all text-[13px] font-medium text-[#172033] placeholder:text-muted/70 shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-2.5 flex items-center text-[12px] text-muted hover:text-[#0A1A3D]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setIsFilterModalOpen(true)}
            className={cn(
              "px-3 py-2.5 rounded-xl flex items-center gap-1.5 transition-all text-[13px] font-extrabold border shadow-sm shrink-0",
              activeFiltersCount > 0
                ? "bg-[#1769E0] text-white border-[#1769E0]"
                : "bg-surface border-border text-[#0A1A3D] hover:bg-gray-50"
            )}
            title="More Filters"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-[#1769E0] text-[10px] flex items-center justify-center font-black">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Date Wise Horizontal Picker (Matching OP in Appointments.tsx) */}
        <div className="flex items-center gap-2 pt-0.5">
          {/* Calendar Icon Button with Native Picker */}
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
                "flex items-center justify-center w-[48px] h-[48px] rounded-2xl flex-shrink-0 active:scale-95 transition-all shadow-sm border",
                selectedDate !== 'upcoming' && selectedDate !== 'all' && !dates.some(d => d.iso === selectedDate)
                  ? "bg-[#1769E0] text-white border-[#1769E0] shadow-md shadow-[#1769E0]/20"
                  : "bg-surface border-border text-[#0A1A3D] hover:bg-gray-50 hover:border-gray-300"
              )}
            >
              <CalendarIcon className={cn("w-4 h-4", selectedDate !== 'upcoming' && selectedDate !== 'all' && !dates.some(d => d.iso === selectedDate) ? "text-white" : "text-[#1769E0]")} />
            </button>
          </div>

          {/* Horizontal scrollable date pills */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-0.5 flex-1">
            <button 
              onClick={() => setSelectedDate('upcoming')}
              className={cn(
                "flex flex-col items-center justify-center min-w-[70px] h-[48px] rounded-2xl flex-shrink-0 transition-all active:scale-95 px-2.5 border",
                selectedDate === 'upcoming' 
                  ? "bg-[#1769E0] text-white shadow-md shadow-[#1769E0]/20 border-[#1769E0]" 
                  : "bg-surface border-border text-[#0A1A3D] hover:bg-gray-50"
              )}
            >
              <span className={cn("text-[12px] font-extrabold leading-tight", selectedDate === 'upcoming' ? "text-white" : "text-[#0A1A3D]")}>
                Upcoming
              </span>
              <span className={cn("text-[10px] font-semibold leading-tight", selectedDate === 'upcoming' ? "text-blue-100" : "text-muted/70")}>
                All Dates
              </span>
            </button>

            {/* Custom picked date pill if not in 14-day list */}
            {selectedDate !== 'upcoming' && selectedDate !== 'all' && !dates.some(d => d.iso === selectedDate) && (
              <button 
                onClick={() => setSelectedDate(selectedDate)}
                className="flex flex-col items-center justify-center min-w-[70px] h-[48px] rounded-2xl flex-shrink-0 transition-all active:scale-95 px-2.5 border bg-[#1769E0] text-white shadow-md shadow-[#1769E0]/20 border-[#1769E0]"
              >
                <span className="text-[12px] font-extrabold leading-tight truncate max-w-[75px]">
                  {selectedDate}
                </span>
                <span className="text-[10px] font-semibold text-blue-100 leading-tight">Custom</span>
              </button>
            )}

            {dates.map((d) => {
              const isActive = selectedDate === d.iso;
              return (
                <button 
                  key={d.iso}
                  onClick={() => setSelectedDate(d.iso)}
                  className={cn(
                    "flex flex-col items-center justify-center min-w-[54px] h-[48px] rounded-2xl flex-shrink-0 transition-all active:scale-95 border",
                    isActive 
                      ? "bg-[#1769E0] text-white shadow-md shadow-[#1769E0]/20 border-[#1769E0]" 
                      : "bg-surface border-border text-muted hover:bg-gray-50"
                  )}
                >
                  <span className={cn("text-[12px] font-black leading-tight", isActive ? "text-white" : "text-[#0A1A3D]")}>
                    {d.date}
                  </span>
                  <span className={cn("text-[10px] font-bold leading-tight", isActive ? "text-blue-100" : "text-muted/70")}>
                    {d.day}
                  </span>
                </button>
              )
            })}

            <button 
              onClick={() => setSelectedDate('all')}
              className={cn(
                "flex flex-col items-center justify-center min-w-[60px] h-[48px] rounded-2xl flex-shrink-0 transition-all active:scale-95 px-2.5 border",
                selectedDate === 'all' 
                  ? "bg-[#1769E0] text-white shadow-md shadow-[#1769E0]/20 border-[#1769E0]" 
                  : "bg-surface border-border text-[#0A1A3D] hover:bg-gray-50"
              )}
            >
              <span className={cn("text-[12px] font-extrabold leading-tight", selectedDate === 'all' ? "text-white" : "text-[#0A1A3D]")}>
                All
              </span>
              <span className={cn("text-[10px] font-semibold leading-tight", selectedDate === 'all' ? "text-blue-100" : "text-muted/70")}>
                History
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col px-4 pt-4 gap-4">
        
        {/* Status Summary Tiles Block (Total, Pending, In Progress, Completed) */}
        <div className="flex flex-col gap-2.5">
          <div className="bg-surface rounded-2xl p-2 sm:p-2.5 flex items-center justify-between border border-border shadow-sm">
            
            {/* Tile 1: Total */}
            <button 
              onClick={() => setSelectedStatus('ALL')}
              className={cn(
                "flex flex-col items-center flex-1 py-1.5 px-1.5 rounded-xl transition-all active:scale-95",
                selectedStatus === 'ALL' 
                  ? "bg-blue-50/90 ring-1 ring-[#1769E0]/30 shadow-sm" 
                  : "hover:bg-gray-50"
              )}
              title="Show All Visits for this Date"
            >
              <span className={cn("text-[18px] sm:text-[20px] font-black", selectedStatus === 'ALL' ? "text-[#1769E0]" : "text-[#0A1A3D]")}>
                {tilesSummary.total}
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Total</span>
            </button>

            <div className="w-px h-7 bg-gray-100" />

            {/* Tile 2: Pending / Scheduled */}
            <button 
              onClick={() => setSelectedStatus('PENDING')}
              className={cn(
                "flex flex-col items-center flex-1 py-1.5 px-1.5 rounded-xl transition-all active:scale-95",
                selectedStatus === 'PENDING' 
                  ? "bg-blue-50/90 ring-1 ring-blue-500/40 shadow-sm" 
                  : "hover:bg-gray-50"
              )}
              title="Show Pending / Scheduled Visits"
            >
              <span className={cn("text-[18px] sm:text-[20px] font-black", selectedStatus === 'PENDING' ? "text-[#1769E0]" : "text-[#0A1A3D]")}>
                {tilesSummary.pending}
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Pending</span>
            </button>

            <div className="w-px h-7 bg-gray-100" />

            {/* Tile 3: In Progress */}
            <button 
              onClick={() => setSelectedStatus('IN_PROGRESS')}
              className={cn(
                "flex flex-col items-center flex-1 py-1.5 px-1.5 rounded-xl transition-all active:scale-95 relative",
                selectedStatus === 'IN_PROGRESS' 
                  ? "bg-amber-50/90 ring-1 ring-amber-400/50 shadow-sm" 
                  : "hover:bg-gray-50"
              )}
              title="Show In Progress Visits"
            >
              {tilesSummary.inProgress > 0 && (
                <span className="absolute top-1 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              )}
              <span className={cn("text-[18px] sm:text-[20px] font-black", selectedStatus === 'IN_PROGRESS' ? "text-amber-600" : "text-[#0A1A3D]")}>
                {tilesSummary.inProgress}
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted">In Progress</span>
            </button>

            <div className="w-px h-7 bg-gray-100" />

            {/* Tile 4: Completed */}
            <button 
              onClick={() => setSelectedStatus('COMPLETED')}
              className={cn(
                "flex flex-col items-center flex-1 py-1.5 px-1.5 rounded-xl transition-all active:scale-95",
                selectedStatus === 'COMPLETED' 
                  ? "bg-emerald-50/90 ring-1 ring-emerald-500/40 shadow-sm" 
                  : "hover:bg-gray-50"
              )}
              title="Show Completed Visits"
            >
              <span className={cn("text-[18px] sm:text-[20px] font-black", selectedStatus === 'COMPLETED' ? "text-emerald-600" : "text-[#0A1A3D]")}>
                {tilesSummary.completed}
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Completed</span>
            </button>
          </div>

          {/* Active Filter Pill / Reset Bar */}
          {(selectedStatus !== 'ALL' || selectedCategory !== 'ALL' || selectedShift !== 'ALL' || searchQuery.trim()) && (
            <div className="flex items-center justify-between bg-blue-50/80 border border-blue-100 px-3.5 py-1.5 rounded-xl text-xs">
              <div className="flex items-center gap-1.5 text-[#1769E0] font-bold truncate">
                <span>Filter:</span>
                {selectedStatus !== 'ALL' && (
                  <span className="bg-white px-2 py-0.5 rounded-md border border-blue-200">
                    {selectedStatus === 'PENDING' ? 'Pending' : selectedStatus === 'IN_PROGRESS' ? 'In Progress' : selectedStatus}
                  </span>
                )}
                {selectedCategory !== 'ALL' && (
                  <span className="bg-white px-2 py-0.5 rounded-md border border-blue-200 truncate max-w-[120px]">
                    {selectedCategory}
                  </span>
                )}
                {selectedShift !== 'ALL' && (
                  <span className="bg-white px-2 py-0.5 rounded-md border border-blue-200">
                    {selectedShift}
                  </span>
                )}
              </div>
              <button 
                onClick={() => {
                  setSelectedStatus('ALL');
                  setSelectedCategory('ALL');
                  setSelectedShift('ALL');
                  setSearchQuery('');
                }}
                className="text-[11px] font-extrabold text-[#1769E0] hover:text-blue-800 underline ml-2 shrink-0 cursor-pointer"
              >
                Reset to All
              </button>
            </div>
          )}
        </div>

        {/* Section Heading & Counter */}
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[14px] font-black text-[#0A1A3D] uppercase tracking-wider">
            {getDateHeaderLabel()}
          </h2>
          <span className="text-[12px] font-extrabold text-[#1769E0]">
            {filteredVisits.length} {filteredVisits.length === 1 ? 'Visit' : 'Visits'}
          </span>
        </div>

        {/* Visits Cards List */}
        <AnimatePresence mode="wait">
          {isLoading && allVisits.length === 0 ? (
            <motion.div key="skeletons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-44 rounded-2xl bg-surface border border-border" />
              ))}
            </motion.div>
          ) : filteredVisits.length > 0 ? (
            <motion.div key={selectedDate + selectedStatus + selectedCategory + searchQuery} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
              {filteredVisits.map((visit) => {
                const isInProgress = visit.rawStatus === 'IN_PROGRESS';
                const isCompleted = visit.rawStatus === 'COMPLETED';
                const isCancelled = visit.rawStatus === 'CANCELLED';

                return (
                  <div 
                    key={visit.id} 
                    onClick={() => openVisitDetail(visit)}
                    className={cn(
                      "flex flex-col bg-surface border rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all cursor-pointer hover:shadow-md",
                      isInProgress 
                        ? "border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/15 hover:border-amber-500" 
                        : isCompleted
                        ? "border-border/60 hover:border-emerald-300"
                        : "border-border/80 hover:border-[#1769E0]/40"
                    )}
                  >
                    {/* Top Row: Date, Shift & Status Badge */}
                    <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-border/50">
                      <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#64748B]">
                        <CalendarIcon className="w-3.5 h-3.5 text-[#1769E0]" />
                        <span>{visit.date}, {visit.time}</span>
                      </div>
                      <span className={cn(
                        "px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider rounded-lg border",
                        isInProgress 
                          ? 'bg-amber-50 text-amber-700 border-amber-300 flex items-center gap-1.5 animate-pulse' 
                          : isCompleted
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1'
                          : isCancelled
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-blue-50 text-[#1769E0] border-blue-100'
                      )}>
                        {isInProgress && <Activity className="w-3 h-3 text-amber-600 animate-spin" />}
                        {isCompleted && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                        {visit.status}
                      </span>
                    </div>
                    
                    {/* Patient & Service Information */}
                    <div className="flex gap-3 mb-3">
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
                          <span className="text-[11px] font-medium text-[#64748B]">
                            Category: {visit.serviceCategory}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Address Block with Google Maps Quick Link */}
                    <div className="flex items-start justify-between gap-2 text-[12px] text-[#475467] mb-3 bg-gray-50 p-2.5 rounded-xl border border-border/50">
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
                        Map <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {/* Patient Notes if any */}
                    {visit.notes && (
                      <div className="text-[12px] text-muted/90 bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 mb-3">
                        <span className="font-bold text-amber-950">Patient Instructions:</span> {visit.notes}
                      </div>
                    )}

                    {/* Direct Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                      <a 
                        href={`tel:${visit.patientPhone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-3.5 py-2.5 bg-gray-50 border border-border text-[#0A1A3D] rounded-xl font-bold hover:bg-gray-100 transition-colors text-[13px] flex items-center gap-1.5"
                        title={`Call ${visit.name}`}
                      >
                        <Phone className="w-3.5 h-3.5 text-[#1769E0]" /> Call
                      </a>

                      {isInProgress ? (
                        <div className="flex-1 py-2 text-center text-[12px] font-bold text-amber-800 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                          <span>Service in Progress (User will complete)</span>
                        </div>
                      ) : isCompleted ? (
                        <div className="flex-1 py-2 text-center text-[12px] font-bold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Finished (₹{visit.totalAmount})
                        </div>
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleUpdateStatus(visit.id, 'IN_PROGRESS'); }}
                          disabled={actionLoadingId === visit.id}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#1769E0] hover:bg-blue-700 text-white rounded-xl font-bold transition-all text-[13px] shadow-sm shadow-[#1769E0]/20 disabled:opacity-50 cursor-pointer"
                        >
                          <Play className="w-4 h-4 fill-white" />
                          {actionLoadingId === visit.id ? "Starting..." : "Start Visit"}
                        </button>
                      )}

                      <button
                        onClick={(e) => { e.stopPropagation(); openVisitDetail(visit); }}
                        className="px-3 py-2.5 text-[12px] font-bold text-[#64748B] hover:text-[#0A1A3D] rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12">
              <EmptyState 
                icon={selectedStatus === 'COMPLETED' ? CheckCircle : Clock}
                title="No Visits Found"
                description={
                  searchQuery 
                    ? `No visits matching "${searchQuery}" found for this filter.` 
                    : selectedDate === todayIST
                    ? "You have no visits scheduled or in-progress for today."
                    : "No home nursing visits found for the selected date and filters."
                }
                actionLabel={
                  selectedDate !== 'upcoming' || selectedStatus !== 'ALL' || searchQuery
                    ? "Show All Upcoming Visits"
                    : undefined
                }
                onAction={() => {
                  setSelectedDate('upcoming');
                  setSelectedStatus('ALL');
                  setSelectedCategory('ALL');
                  setSelectedShift('ALL');
                  setSearchQuery('');
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Filter Modal / Bottom Sheet */}
      <AnimatePresence>
        {isFilterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-surface w-full max-w-md rounded-t-[28px] sm:rounded-2xl p-5 shadow-2xl border border-border flex flex-col gap-5 max-h-[85vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#1769E0]" />
                  <h3 className="font-black text-[17px] text-[#0A1A3D]">Filter Home Visits</h3>
                </div>
                <button
                  onClick={() => setIsFilterModalOpen(false)}
                  className="p-1.5 text-muted hover:text-[#0A1A3D] rounded-xl hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Filter */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-extrabold text-muted uppercase tracking-wider">
                  Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'ALL', label: 'All Statuses' },
                    { id: 'PENDING', label: 'Pending / Scheduled' },
                    { id: 'IN_PROGRESS', label: 'In Progress' },
                    { id: 'COMPLETED', label: 'Completed' },
                  ].map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStatus(s.id)}
                      className={cn(
                        "py-2 px-3 rounded-xl text-[12px] font-bold border transition-all text-center",
                        selectedStatus === s.id
                          ? "bg-[#1769E0] text-white border-[#1769E0] shadow-sm"
                          : "bg-gray-50 hover:bg-gray-100 text-[#0A1A3D] border-border"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Category Filter */}
              {uniqueCategories.length > 0 && (
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-extrabold text-muted uppercase tracking-wider">
                    Service Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-gray-50 border border-border text-[#0A1A3D] text-[13px] font-medium rounded-xl p-2.5 outline-none focus:border-[#1769E0]"
                  >
                    <option value="ALL">All Nursing Services</option>
                    {uniqueCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Shift / Time Slot Filter */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-extrabold text-muted uppercase tracking-wider">
                  Shift Timing
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'ALL', label: 'All Shifts' },
                    { id: 'Day Shift', label: 'Day Shift' },
                    { id: 'Night Shift', label: 'Night Shift' },
                  ].map(sh => (
                    <button
                      key={sh.id}
                      onClick={() => setSelectedShift(sh.id)}
                      className={cn(
                        "py-2 px-2 rounded-xl text-[12px] font-bold border transition-all text-center",
                        selectedShift === sh.id
                          ? "bg-[#1769E0] text-white border-[#1769E0] shadow-sm"
                          : "bg-gray-50 hover:bg-gray-100 text-[#0A1A3D] border-border"
                      )}
                    >
                      {sh.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Order */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-extrabold text-muted uppercase tracking-wider">
                  Sort Order
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'earliest', label: 'Earliest' },
                    { id: 'latest', label: 'Latest' },
                    { id: 'name', label: 'Name A-Z' },
                  ].map(so => (
                    <button
                      key={so.id}
                      onClick={() => setSortOrder(so.id as any)}
                      className={cn(
                        "py-2 px-2 rounded-xl text-[12px] font-bold border transition-all text-center",
                        sortOrder === so.id
                          ? "bg-[#1769E0] text-white border-[#1769E0] shadow-sm"
                          : "bg-gray-50 hover:bg-gray-100 text-[#0A1A3D] border-border"
                      )}
                    >
                      {so.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-border gap-3">
                <button
                  onClick={() => {
                    setSelectedStatus('ALL');
                    setSelectedCategory('ALL');
                    setSelectedShift('ALL');
                    setSortOrder('earliest');
                    setSearchQuery('');
                  }}
                  className="flex items-center gap-1.5 text-[12px] font-bold text-muted hover:text-red-500 py-2 px-3 rounded-xl hover:bg-red-50 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset All
                </button>
                <button
                  onClick={() => setIsFilterModalOpen(false)}
                  className="px-5 py-2.5 bg-[#1769E0] text-white text-[13px] font-extrabold rounded-xl hover:bg-blue-700 shadow-md shadow-[#1769E0]/20 transition-all"
                >
                  Apply & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Visit Detail Modal */}
      <NurseVisitDetailModal
        visit={selectedVisit}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedVisit(null); }}
        onUpdateStatus={handleModalUpdateStatus}
        actionLoadingId={actionLoadingId}
      />
    </div>
  )
}
