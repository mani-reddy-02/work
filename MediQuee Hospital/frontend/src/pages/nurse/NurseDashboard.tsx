import { motion } from "framer-motion"
import { 
  MapPin, 
  CheckCircle, 
  Clock, 
  ChevronRight, 
  CalendarDays, 
  Phone, 
  Play, 
  RefreshCw, 
  AlertCircle,
  Activity,
  ShieldCheck,
  ExternalLink,
  Building2,
  Sparkles,
  ArrowRight
} from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { EmptyState } from "@/components/ui/EmptyState"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { nurseApi, type NurseVisit, type NurseDashboardData } from "@/services/nurseApi"
import { NurseVisitDetailModal } from "@/components/nurse/NurseVisitDetailModal"

export function NurseDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data, setData] = useState<NurseDashboardData | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<NurseVisit | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [todayFilter, setTodayFilter] = useState<'all' | 'in_progress' | 'assigned' | 'completed'>('all');

  const loadDashboard = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await nurseApi.getDashboard();
      setData(res);
    } catch (err: any) {
      console.error("Failed to load nurse dashboard:", err);
      toast(err.message || "Failed to load nurse dashboard data", "error");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleUpdateStatus = async (visitId: string, targetStatus: 'IN_PROGRESS' | 'COMPLETED') => {
    setActionLoadingId(visitId);
    try {
      await nurseApi.updateVisitStatus(visitId, targetStatus);
      toast(
        targetStatus === 'IN_PROGRESS'
          ? "Visit started! Status updated to In Progress."
          : "Home nursing service marked as Completed!",
        "success"
      );
      // Refresh live state
      await loadDashboard(true);
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

  const nurseName = data?.nurse?.name || user?.name || "Nurse";
  const hospitalName = data?.nurse?.hospitalName || user?.hospital?.name || "MediQuee Partner Hospital";

  // Formatted date string in IST
  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date());

  const stats = [
    {
      title: "Visits Today",
      value: isLoading ? "..." : (data?.stats.visitsToday ?? 0),
      subtitle: "Scheduled / Active",
      icon: CalendarDays,
      iconColor: "text-[#1769E0]",
      iconBg: "bg-blue-50 border-blue-100",
      cardBg: "bg-surface hover:bg-blue-50/30 border-blue-100/80 shadow-[0_2px_8px_rgba(23,105,224,0.04)]",
      onClick: () => navigate('/nurse/visits', { state: { tab: 'today' } }),
    },
    {
      title: "Upcoming",
      value: isLoading ? "..." : (data?.stats.upcoming ?? 0),
      subtitle: "Future bookings",
      icon: Clock,
      iconColor: "text-indigo-600",
      iconBg: "bg-indigo-50 border-indigo-100",
      cardBg: "bg-surface hover:bg-indigo-50/30 border-indigo-100/80 shadow-[0_2px_8px_rgba(99,102,241,0.04)]",
      onClick: () => navigate('/nurse/visits', { state: { tab: 'upcoming' } }),
    },
    {
      title: "In Progress",
      value: isLoading ? "..." : (data?.stats.inProgress ?? 0),
      subtitle: "Active on field",
      icon: Activity,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50 border-amber-100",
      cardBg: "bg-surface hover:bg-amber-50/30 border-amber-200/80 shadow-[0_2px_8px_rgba(245,158,11,0.05)]",
      isPulse: (data?.stats.inProgress ?? 0) > 0,
      onClick: () => navigate('/nurse/visits', { state: { tab: 'in_progress' } }),
    },
    {
      title: "Completed",
      value: isLoading ? "..." : (data?.stats.completed ?? 0),
      subtitle: "Finished services",
      icon: CheckCircle,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50 border-emerald-100",
      cardBg: "bg-surface hover:bg-emerald-50/30 border-emerald-100/80 shadow-[0_2px_8px_rgba(16,185,129,0.04)]",
      onClick: () => navigate('/nurse/visits', { state: { tab: 'history' } }),
    },
  ];

  const nextVisit = data?.nextVisit;
  const todayVisits = data?.todayVisits || [];

  // Filter today's visits list based on toggle
  const filteredTodayVisits = todayVisits.filter(v => {
    if (todayFilter === 'in_progress') return v.rawStatus === 'IN_PROGRESS';
    if (todayFilter === 'assigned') return ['ASSIGNED', 'CONFIRMED'].includes(v.rawStatus);
    if (todayFilter === 'completed') return v.rawStatus === 'COMPLETED';
    return true;
  });

  return (
    <div className="flex flex-col bg-gray-50/30 min-h-screen pb-[120px]">
      
      {/* Top Header & Nurse Status Card */}
      <div className="pt-6 pb-4 px-4">
        <div className="bg-surface border border-border/80 rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1769E0] to-blue-700 text-white flex items-center justify-center font-black text-[18px] shadow-sm shadow-[#1769E0]/20 shrink-0">
              {nurseName.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-[17px] font-black text-[#0A1A3D] tracking-tight truncate">
                  {nurseName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  ON DUTY
                </span>
              </div>
              <p className="text-[12px] text-muted font-medium flex items-center gap-1 mt-0.5 truncate">
                <Building2 className="w-3.5 h-3.5 text-[#1769E0] shrink-0" />
                <span className="truncate">{hospitalName}</span>
              </p>
              <p className="text-[11px] text-muted/70 font-semibold mt-0.5">
                {todayFormatted}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => loadDashboard(true)}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl border border-border bg-gray-50/80 text-[#0A1A3D] hover:bg-gray-100 transition-colors shadow-sm disabled:opacity-50 shrink-0"
            title="Refresh Live Data"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin text-[#1769E0]")} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 px-4 mb-5">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={stat.onClick}
              className={cn(
                "p-3.5 rounded-2xl border transition-all cursor-pointer hover:-translate-y-0.5 active:scale-[0.98] flex flex-col justify-between relative overflow-hidden group",
                stat.cardBg
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={cn("w-8 h-8 rounded-xl border flex items-center justify-center shrink-0", stat.iconBg)}>
                  <Icon className={cn("w-4 h-4", stat.iconColor)} />
                </div>
                {stat.isPulse && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                )}
                <ChevronRight className="w-3.5 h-3.5 text-muted/50 group-hover:text-[#1769E0] group-hover:translate-x-0.5 transition-all" />
              </div>

              <div>
                <span className="text-[11px] font-bold text-muted/80 uppercase tracking-wider block mb-0.5">
                  {stat.title}
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-[24px] font-black tracking-tight text-[#0A1A3D]">
                    {stat.value}
                  </span>
                  <span className="text-[10px] font-semibold text-muted/70 truncate ml-1">
                    {stat.subtitle}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Active / Next Visit Hero Card */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#1769E0]"></span>
            <h3 className="text-[12px] font-black text-[#0A1A3D] uppercase tracking-wider">
              {nextVisit?.rawStatus === 'IN_PROGRESS' ? "Current In-Progress Visit" : "Next Scheduled Visit"}
            </h3>
          </div>
          {nextVisit && (
            <span className="text-[11px] font-mono font-bold text-[#1769E0] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
              {nextVisit.bookingNumber}
            </span>
          )}
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-[#1769E0] via-[#1B5DF1] to-[#124294] rounded-[24px] p-5 text-white shadow-[0_8px_24px_rgba(23,105,224,0.22)] relative overflow-hidden"
        >
          {/* Subtle Ambient Backing */}
          <div className="absolute top-0 right-0 -mr-12 -mt-12 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-40 h-40 rounded-full bg-blue-400/20 blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10">
            {isLoading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-white/80" />
                <p className="text-[13px] text-blue-100 font-medium">Checking live schedule...</p>
              </div>
            ) : nextVisit ? (
              <>
                {/* Time slot & status row */}
                <div className="flex justify-between items-center mb-3.5">
                  <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl font-bold text-[12px] shadow-sm">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{nextVisit.time}</span>
                  </div>
                  <span className={cn(
                    "px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider rounded-lg backdrop-blur-md shadow-sm border",
                    nextVisit.rawStatus === 'IN_PROGRESS' 
                      ? "bg-amber-400 text-amber-950 border-amber-300 animate-pulse flex items-center gap-1" 
                      : nextVisit.rawStatus === 'COMPLETED'
                      ? "bg-emerald-400 text-emerald-950 border-emerald-300"
                      : "bg-white/20 text-white border-white/20"
                  )}>
                    {nextVisit.rawStatus === 'IN_PROGRESS' && <Activity className="w-3 h-3" />}
                    {nextVisit.status}
                  </span>
                </div>

                {/* Patient Information */}
                <div className="mb-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-black text-[22px] tracking-tight leading-tight">
                      {nextVisit.name}
                    </h4>
                    {nextVisit.totalAmount > 0 && (
                      <span className="text-[13px] font-extrabold bg-white/15 px-2.5 py-0.5 rounded-lg text-white">
                        ₹{nextVisit.totalAmount}
                      </span>
                    )}
                  </div>
                  <p className="text-blue-100 font-bold text-[14px] mt-0.5">
                    {nextVisit.service}
                  </p>
                  {nextVisit.serviceCategory && (
                    <span className="text-[11px] font-medium text-blue-200/90 inline-block">
                      Category: {nextVisit.serviceCategory}
                    </span>
                  )}
                </div>

                {/* Address Box with Direct Google Maps Link */}
                <div className="flex items-start justify-between gap-2 text-[12px] text-blue-100 mb-4 bg-black/15 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
                  <div className="flex items-start gap-1.5 flex-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-300" />
                    <span className="line-clamp-2 leading-relaxed">
                      {nextVisit.address}{nextVisit.city ? `, ${nextVisit.city}` : ''}
                    </span>
                  </div>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(`${nextVisit.address} ${nextVisit.city || ''}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-colors"
                    title="Open in Google Maps"
                  >
                    Directions <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                {/* Patient instructions note if any */}
                {nextVisit.notes && (
                  <div className="text-[12px] text-amber-100 bg-amber-950/30 border border-amber-300/30 rounded-xl p-2.5 mb-4">
                    <span className="font-bold text-amber-300">Note:</span> {nextVisit.notes}
                  </div>
                )}

                {/* Direct Actions Bar */}
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${nextVisit.patientPhone}`}
                    className="px-3.5 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold text-[13px] flex items-center justify-center gap-1.5 transition-colors border border-white/10"
                    title={`Call patient: ${nextVisit.patientPhone}`}
                  >
                    <Phone className="w-4 h-4" /> Call
                  </a>

                  {nextVisit.rawStatus === 'IN_PROGRESS' ? (
                    <button
                      onClick={() => handleUpdateStatus(nextVisit.id, 'COMPLETED')}
                      disabled={actionLoadingId === nextVisit.id}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-extrabold text-[13px] flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/30 transition-all disabled:opacity-50 active:scale-[0.99]"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {actionLoadingId === nextVisit.id ? "Completing..." : "Complete Service"}
                    </button>
                  ) : nextVisit.rawStatus === 'COMPLETED' ? (
                    <div className="flex-1 bg-white/20 text-white py-3 rounded-xl font-bold text-[13px] flex items-center justify-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-300" /> Finished
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(nextVisit.id, 'IN_PROGRESS')}
                      disabled={actionLoadingId === nextVisit.id}
                      className="flex-1 bg-white hover:bg-blue-50 text-[#1769E0] py-3 rounded-xl font-black text-[13px] flex items-center justify-center gap-1.5 shadow-md shadow-black/10 transition-all disabled:opacity-50 active:scale-[0.99]"
                    >
                      <Play className="w-4 h-4 fill-[#1769E0]" />
                      {actionLoadingId === nextVisit.id ? "Starting..." : "Start Visit"}
                    </button>
                  )}

                  <button
                    onClick={() => openVisitDetail(nextVisit)}
                    className="px-3.5 py-3 bg-white/15 hover:bg-white/25 text-white rounded-xl font-bold text-[13px] transition-colors border border-white/10"
                  >
                    Details
                  </button>
                </div>
              </>
            ) : (
              <div className="py-6 flex flex-col items-center justify-center text-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-white mb-1">
                  <CheckCircle className="w-6 h-6 text-blue-200" />
                </div>
                <h4 className="font-black text-[19px] tracking-tight">All Caught Up!</h4>
                <p className="text-blue-100 text-[13px] max-w-[280px]">
                  You have no pending home nursing visits right now. Check upcoming bookings for future shifts.
                </p>
                <button
                  onClick={() => navigate('/nurse/visits', { state: { tab: 'upcoming' } })}
                  className="mt-2 px-4 py-2 bg-white text-[#1769E0] font-bold rounded-xl text-[12px] shadow-sm hover:bg-blue-50 transition-colors"
                >
                  View Upcoming Visits
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Today's Visits Section */}
      <div className="px-4 flex flex-col gap-3 mb-6">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-black text-[#0A1A3D] uppercase tracking-wider">
              Today's Schedule
            </h3>
            {todayVisits.length > 0 && (
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-[#1769E0]">
                {todayVisits.length}
              </span>
            )}
          </div>
          <button 
            onClick={() => navigate('/nurse/visits', { state: { tab: 'today' } })}
            className="text-[#1769E0] text-[13px] font-extrabold flex items-center gap-0.5 hover:underline"
          >
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Filter Bar for Today's Schedule (if items > 1) */}
        {todayVisits.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
            {[
              { id: 'all', label: `All (${todayVisits.length})` },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'assigned', label: 'Assigned' },
              { id: 'completed', label: 'Completed' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setTodayFilter(f.id as any)}
                className={cn(
                  "px-3 py-1 rounded-xl text-[12px] font-bold transition-all shrink-0",
                  todayFilter === f.id
                    ? "bg-[#1769E0] text-white shadow-sm"
                    : "bg-surface border border-border/70 text-muted hover:text-[#0A1A3D]"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
        
        <div className="flex flex-col gap-2.5">
          {isLoading ? (
            <div className="bg-surface border border-border rounded-2xl p-6 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#1769E0]" />
              <span className="text-[13px] font-medium text-muted">Loading today's schedule...</span>
            </div>
          ) : filteredTodayVisits.length === 0 ? (
            <div className="bg-surface border border-border/80 rounded-2xl p-6 text-center flex flex-col items-center justify-center">
              <CalendarDays className="w-8 h-8 text-muted/50 mb-1.5" />
              <h4 className="text-[15px] font-extrabold text-[#0A1A3D]">No Visits in this Category</h4>
              <p className="text-[12px] text-muted max-w-[260px] mt-0.5">
                {todayVisits.length === 0 
                  ? "You have no home nursing visits scheduled for today." 
                  : "No visits match the selected filter for today."}
              </p>
              {todayVisits.length > 0 && todayFilter !== 'all' && (
                <button
                  onClick={() => setTodayFilter('all')}
                  className="mt-2.5 text-[12px] font-bold text-[#1769E0] hover:underline"
                >
                  Show All Today ({todayVisits.length})
                </button>
              )}
            </div>
          ) : filteredTodayVisits.map((visit, i) => {
            const isInProgress = visit.rawStatus === 'IN_PROGRESS';
            const isCompleted = visit.rawStatus === 'COMPLETED';

            return (
              <motion.div 
                key={visit.id} 
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + (i * 0.04) }}
                onClick={() => openVisitDetail(visit)}
                className={cn(
                  "bg-surface border rounded-2xl p-4 flex flex-col gap-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] cursor-pointer hover:shadow-md transition-all",
                  isInProgress 
                    ? "border-amber-400/80 ring-2 ring-amber-400/20 bg-amber-50/15" 
                    : isCompleted
                    ? "border-border/60 hover:border-emerald-300"
                    : "border-border/80 hover:border-[#1769E0]/40"
                )}
              >
                {/* Top: Time & Status */}
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#0A1A3D]">
                    <Clock className="w-3.5 h-3.5 text-[#1769E0]" />
                    <span>{visit.time}</span>
                  </div>
                  <div>
                    {isCompleted ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                        <CheckCircle className="w-3 h-3 text-emerald-600" /> Completed
                      </span>
                    ) : isInProgress ? (
                      <span className="flex items-center gap-1 text-[11px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-300 animate-pulse">
                        <Activity className="w-3 h-3 text-amber-600 animate-spin" /> In Progress
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-[#1769E0] bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                        Scheduled
                      </span>
                    )}
                  </div>
                </div>

                {/* Patient and Service info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-[15px] text-[#0A1A3D] truncate">{visit.name}</h4>
                      <span className="text-[10px] font-mono text-muted bg-gray-100 px-1.5 py-0.2 rounded shrink-0">
                        {visit.bookingNumber}
                      </span>
                    </div>
                    <p className="text-[13px] font-bold text-[#1769E0] truncate mt-0.5">{visit.service}</p>
                    <p className="text-[11px] text-muted flex items-center gap-1 mt-1 line-clamp-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-muted/70" />
                      <span>{visit.address}{visit.city ? `, ${visit.city}` : ''}</span>
                    </p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                  <a
                    href={`tel:${visit.patientPhone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-border text-[#0A1A3D] rounded-xl text-[12px] font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#1769E0]" /> Call
                  </a>

                  {isInProgress ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUpdateStatus(visit.id, 'COMPLETED'); }}
                      disabled={actionLoadingId === visit.id}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm shadow-emerald-600/20"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {actionLoadingId === visit.id ? "Saving..." : "Complete Service"}
                    </button>
                  ) : isCompleted ? (
                    <span className="flex-1 text-center py-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-100">
                      Finished (₹{visit.totalAmount})
                    </span>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUpdateStatus(visit.id, 'IN_PROGRESS'); }}
                      disabled={actionLoadingId === visit.id}
                      className="flex-1 py-1.5 bg-[#1769E0] hover:bg-blue-700 text-white rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm shadow-[#1769E0]/20"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      {actionLoadingId === visit.id ? "Starting..." : "Start Visit"}
                    </button>
                  )}

                  <button
                    onClick={(e) => { e.stopPropagation(); openVisitDetail(visit); }}
                    className="px-2.5 py-1.5 text-[11px] font-bold text-muted hover:text-[#0A1A3D] rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    Details
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Duty Guidelines & Field Support Strip */}
      <div className="px-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50/60 border border-blue-100 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-[0_1px_4px_rgba(23,105,224,0.03)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-blue-200/80 text-[#1769E0] flex items-center justify-center shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-[#1769E0]" />
            </div>
            <div>
              <h5 className="text-[13px] font-extrabold text-[#0A1A3D]">Field Nurse Support</h5>
              <p className="text-[11px] text-muted font-medium">Need immediate hospital assistance or duty supplies?</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/nurse/visits')}
            className="px-3 py-2 bg-white hover:bg-blue-50 border border-blue-200 text-[#1769E0] font-extrabold text-[11px] rounded-xl transition-colors shadow-sm shrink-0 flex items-center gap-1"
          >
            All Visits <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

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
