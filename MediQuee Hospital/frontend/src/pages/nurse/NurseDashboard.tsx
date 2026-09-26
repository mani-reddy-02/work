import { motion } from "framer-motion"
import { MapPin, CheckCircle, Clock, ChevronRight, CalendarDays, Phone, Play, RefreshCw, AlertCircle } from "lucide-react"
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
      const res = await nurseApi.updateVisitStatus(visitId, targetStatus);
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

  const stats = [
    {
      title: "Visits Today",
      value: isLoading ? "..." : (data?.stats.visitsToday ?? 0),
      color: "text-[#0A1A3D] bg-surface border-border",
      onClick: () => navigate('/nurse/visits', { state: { tab: 'upcoming', filter: 'today' } }),
    },
    {
      title: "Upcoming",
      value: isLoading ? "..." : (data?.stats.upcoming ?? 0),
      color: "text-[#1B5DF1] bg-surface border-blue-100",
      onClick: () => navigate('/nurse/visits', { state: { tab: 'upcoming' } }),
    },
    {
      title: "In Progress",
      value: isLoading ? "..." : (data?.stats.inProgress ?? 0),
      color: "text-orange-600 bg-surface border-orange-100",
      onClick: () => navigate('/nurse/visits', { state: { tab: 'upcoming', filter: 'in_progress' } }),
    },
    {
      title: "Completed",
      value: isLoading ? "..." : (data?.stats.completed ?? 0),
      color: "text-emerald-600 bg-surface border-emerald-100",
      onClick: () => navigate('/nurse/visits', { state: { tab: 'history' } }),
    },
  ];

  const nextVisit = data?.nextVisit;
  const todayVisits = data?.todayVisits || [];

  return (
    <div className="flex flex-col bg-gray-50/30 min-h-screen pb-[100px]">
      
      {/* Header */}
      <div className="pt-8 pb-4 px-4 flex items-center justify-between">
        <div>
          <p className="text-muted text-[13px] font-medium mb-0.5">Welcome, {nurseName}</p>
          <h1 className="text-[22px] font-black text-[#0A1A3D] tracking-tight">Home Nursing</h1>
          <p className="text-[12px] text-muted/80 font-medium">{hospitalName}</p>
        </div>
        <button
          onClick={() => loadDashboard(true)}
          disabled={isRefreshing}
          className="p-2.5 rounded-xl border border-border bg-surface text-[#0A1A3D] hover:bg-gray-100 transition-colors shadow-sm disabled:opacity-50"
          title="Refresh Dashboard"
        >
          <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin text-[#1B5DF1]")} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 px-4 mb-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={stat.onClick}
            className={cn("p-4 rounded-[16px] border shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-center cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all", stat.color)}
          >
            <span className="text-[12px] font-bold opacity-80 uppercase tracking-wider mb-1">{stat.title}</span>
            <span className="text-[26px] font-black tracking-tight">{stat.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Next Visit Prominent Card */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-[13px] font-bold text-muted/80 uppercase tracking-wider">Next Visit</h3>
          {nextVisit && (
            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              {nextVisit.bookingNumber}
            </span>
          )}
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-[#1B5DF1] to-blue-700 rounded-[24px] p-5 text-white shadow-[0_8px_24px_rgba(27,93,241,0.25)] relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-surface/10 blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10">
            {isLoading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-white/80" />
                <p className="text-[13px] text-blue-100 font-medium">Checking live schedule...</p>
              </div>
            ) : nextVisit ? (
              <>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2 bg-surface/20 backdrop-blur-md px-3 py-1.5 rounded-xl font-bold text-[13px]">
                    <Clock className="w-4 h-4" /> {nextVisit.time}
                  </div>
                  <span className={cn(
                    "px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider rounded-lg backdrop-blur-md",
                    nextVisit.rawStatus === 'IN_PROGRESS' 
                      ? "bg-amber-400 text-amber-950 font-black animate-pulse" 
                      : nextVisit.rawStatus === 'COMPLETED'
                      ? "bg-emerald-400 text-emerald-950"
                      : "bg-surface/25 text-white"
                  )}>
                    {nextVisit.status}
                  </span>
                </div>

                <div className="mb-4">
                  <h4 className="font-black text-[22px] tracking-tight mb-1">{nextVisit.name}</h4>
                  <p className="text-blue-100 font-semibold text-[14px]">
                    {nextVisit.service}
                  </p>
                  {nextVisit.serviceCategory && (
                    <span className="text-[11px] font-medium text-blue-200/90 mt-0.5 inline-block">
                      Category: {nextVisit.serviceCategory}
                    </span>
                  )}
                </div>

                <div className="flex items-start gap-2 text-[13px] text-blue-100 mb-5 bg-black/15 p-3 rounded-xl">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{nextVisit.address}{nextVisit.city ? `, ${nextVisit.city}` : ''}</span>
                </div>

                {/* Direct Actions */}
                <div className="flex items-center gap-2.5">
                  <a
                    href={`tel:${nextVisit.patientPhone}`}
                    className="p-3 bg-white/15 hover:bg-white/25 text-white rounded-[16px] font-bold text-[14px] flex items-center justify-center gap-1.5 transition-colors"
                    title={`Call patient: ${nextVisit.patientPhone}`}
                  >
                    <Phone className="w-4 h-4" /> Call
                  </a>

                  {nextVisit.rawStatus === 'IN_PROGRESS' ? (
                    <button
                      onClick={() => handleUpdateStatus(nextVisit.id, 'COMPLETED')}
                      disabled={actionLoadingId === nextVisit.id}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-[16px] font-bold text-[14px] flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 transition-all disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {actionLoadingId === nextVisit.id ? "Completing..." : "Complete Service"}
                    </button>
                  ) : nextVisit.rawStatus === 'COMPLETED' ? (
                    <button
                      disabled
                      className="flex-1 bg-white/20 text-white py-3 rounded-[16px] font-bold text-[14px] flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-300" /> Finished
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(nextVisit.id, 'IN_PROGRESS')}
                      disabled={actionLoadingId === nextVisit.id}
                      className="flex-1 bg-surface text-[#1B5DF1] hover:bg-blue-50 py-3 rounded-[16px] font-bold text-[14px] flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 active:scale-98"
                    >
                      <Play className="w-4 h-4 fill-[#1B5DF1]" />
                      {actionLoadingId === nextVisit.id ? "Starting..." : "Start Visit"}
                    </button>
                  )}

                  <button
                    onClick={() => openVisitDetail(nextVisit)}
                    className="px-3.5 py-3 bg-surface/15 hover:bg-surface/25 text-white rounded-[16px] font-bold text-[13px] transition-colors"
                  >
                    Details
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-1.5 py-3">
                <h4 className="font-black text-[22px] tracking-tight">No Visit Scheduled</h4>
                <p className="text-blue-100 text-[14px]">You currently have no active or pending home nursing visits.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Today's Visits List */}
      <div className="px-4 flex flex-col gap-3">
        <div className="flex items-center justify-between px-1 mb-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-bold text-[#0A1A3D] uppercase tracking-wider">Today's Visits</h3>
            {todayVisits.length > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#1B5DF1]">
                {todayVisits.length}
              </span>
            )}
          </div>
          <button 
            onClick={() => navigate('/nurse/visits')}
            className="text-[#1B5DF1] text-[13px] font-bold flex items-center hover:underline"
          >
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex flex-col gap-2.5">
          {isLoading ? (
            <div className="bg-surface border border-border rounded-2xl p-6 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#1B5DF1]" />
              <span className="text-[13px] font-medium text-muted">Loading today's schedule...</span>
            </div>
          ) : todayVisits.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No Visits Today"
              description="You have no home nursing visits scheduled for today."
            />
          ) : todayVisits.map((visit, i) => (
            <motion.div 
              key={visit.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + (i * 0.05) }}
              onClick={() => openVisitDetail(visit)}
              className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer hover:border-[#1B5DF1]/40 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                <div className="flex items-center gap-2 text-[13px] font-bold text-[#0A1A3D]">
                  <Clock className="w-4 h-4 text-[#1B5DF1]" />
                  <span>{visit.time}</span>
                </div>
                <div>
                  {visit.rawStatus === 'COMPLETED' ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                      <CheckCircle className="w-3.5 h-3.5" /> Completed
                    </span>
                  ) : visit.rawStatus === 'IN_PROGRESS' ? (
                    <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-lg border border-orange-200 animate-pulse">
                      In Progress
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                      Assigned
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h4 className="font-bold text-[16px] text-[#0A1A3D] mb-0.5">{visit.name}</h4>
                  <p className="text-[13px] font-semibold text-[#1B5DF1]">{visit.service}</p>
                  <p className="text-[12px] text-muted flex items-center gap-1 mt-1 line-clamp-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{visit.address}</span>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                <a
                  href={`tel:${visit.patientPhone}`}
                  className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-border text-[#0A1A3D] rounded-xl text-[12px] font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-[#1B5DF1]" /> Call
                </a>

                {visit.rawStatus === 'IN_PROGRESS' ? (
                  <button
                    onClick={() => handleUpdateStatus(visit.id, 'COMPLETED')}
                    disabled={actionLoadingId === visit.id}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    {actionLoadingId === visit.id ? "Saving..." : "Complete Service"}
                  </button>
                ) : visit.rawStatus === 'COMPLETED' ? (
                  <span className="flex-1 text-center py-1.5 text-[12px] font-semibold text-emerald-600">
                    Service Finished
                  </span>
                ) : (
                  <button
                    onClick={() => handleUpdateStatus(visit.id, 'IN_PROGRESS')}
                    disabled={actionLoadingId === visit.id}
                    className="flex-1 py-1.5 bg-[#1B5DF1] hover:bg-blue-700 text-white rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    {actionLoadingId === visit.id ? "Starting..." : "Start Visit"}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
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
