import { Search, MapPin, Clock, CheckCircle, Phone, Calendar as CalendarIcon, Play, RefreshCw, ArrowLeft } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
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
  const navState = location.state as { tab?: 'upcoming' | 'history'; filter?: string } | null;
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>(navState?.tab || 'upcoming');
  const [statusFilter, setStatusFilter] = useState<string>(navState?.filter || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [upcomingVisits, setUpcomingVisits] = useState<NurseVisit[]>([]);
  const [historyVisits, setHistoryVisits] = useState<NurseVisit[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<NurseVisit | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadVisits = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await nurseApi.getVisits();
      setUpcomingVisits(res.upcoming || []);
      setHistoryVisits(res.history || []);
    } catch (err: any) {
      console.error("Failed to load nurse visits:", err);
      toast(err.message || "Failed to load home visits", "error");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    loadVisits();
  }, [loadVisits]);

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

  // Apply navigation state when arriving from dashboard stat cards
  useEffect(() => {
    if (navState?.tab) {
      setActiveTab(navState.tab);
    }
    if (navState?.filter) {
      setStatusFilter(navState.filter);
    }
    // Clear location state so re-renders don't re-apply
    if (navState) {
      window.history.replaceState({}, '');
    }
  }, [navState]);

  const displayedVisits = (activeTab === 'upcoming' ? upcomingVisits : historyVisits).filter(v => {
    // Apply status filter from dashboard navigation
    if (statusFilter === 'today') {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      if (v.date !== todayStr) return false;
    } else if (statusFilter === 'in_progress') {
      if (v.rawStatus !== 'IN_PROGRESS') return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      v.service.toLowerCase().includes(q) ||
      (v.address && v.address.toLowerCase().includes(q)) ||
      (v.city && v.city.toLowerCase().includes(q)) ||
      (v.bookingNumber && v.bookingNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col bg-gray-50/30 min-h-screen pb-[120px]">
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-xl pt-6 pb-4 px-4 flex flex-col gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted hover:text-foreground transition-colors rounded-xl hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-[22px] font-black text-[#0A1A3D] tracking-tight">Home Visits</h2>
              <p className="text-[12px] text-muted font-medium">Manage your assigned patient visits</p>
            </div>
          </div>
          <button
            onClick={() => loadVisits(true)}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl border border-border bg-surface text-[#0A1A3D] hover:bg-gray-100 transition-colors shadow-sm disabled:opacity-50"
            title="Refresh Visits"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin text-[#1B5DF1]")} />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted/70 group-focus-within:text-[#1B5DF1] transition-colors">
            <Search className="w-4 h-4" />
          </div>
          <input 
            type="text" 
            placeholder="Search patient, service, or location..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-border/60 rounded-2xl outline-none focus:border-[#1B5DF1] focus:bg-surface focus:ring-4 focus:ring-[#1B5DF1]/10 transition-all text-[14px] font-medium text-[#172033] placeholder:text-muted/70"
          />
        </div>

        {/* Tab switcher */}
        <div className="flex bg-gray-100/80 p-1 rounded-xl">
          <button 
            onClick={() => { setActiveTab('upcoming'); setStatusFilter(''); }}
            className={cn(
              "flex-1 py-2 text-[14px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
              activeTab === 'upcoming' ? "bg-surface text-[#1B5DF1] shadow-sm" : "text-[#667085] hover:text-[#172033]"
            )}
          >
            Upcoming
            {upcomingVisits.length > 0 && (
              <span className={cn(
                "text-[11px] px-1.5 py-0.2 rounded-full font-bold",
                activeTab === 'upcoming' ? "bg-blue-100 text-[#1B5DF1]" : "bg-gray-200 text-gray-700"
              )}>
                {upcomingVisits.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => { setActiveTab('history'); setStatusFilter(''); }}
            className={cn(
              "flex-1 py-2 text-[14px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
              activeTab === 'history' ? "bg-surface text-[#1B5DF1] shadow-sm" : "text-[#667085] hover:text-[#172033]"
            )}
          >
            History
            {historyVisits.length > 0 && (
              <span className={cn(
                "text-[11px] px-1.5 py-0.2 rounded-full font-bold",
                activeTab === 'history' ? "bg-blue-100 text-[#1B5DF1]" : "bg-gray-200 text-gray-700"
              )}>
                {historyVisits.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Visits List */}
      <div className="flex flex-col px-4 pt-5 gap-4">
        {/* Active filter indicator */}
        {statusFilter && (
          <div className="px-4 pt-3">
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100">
              <span className="text-[12px] font-bold text-blue-700">
                Filter: {statusFilter === 'today' ? "Today's visits only" : statusFilter === 'in_progress' ? 'In Progress only' : statusFilter}
              </span>
              <button
                onClick={() => setStatusFilter('')}
                className="ml-auto text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-100 px-2 py-0.5 rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="skeletons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-36 rounded-2xl bg-surface border border-border" />
              ))}
            </motion.div>
          ) : displayedVisits.length > 0 ? (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
              {activeTab === 'upcoming' ? displayedVisits.map((visit) => (
                <div 
                  key={visit.id} 
                  onClick={() => openVisitDetail(visit)}
                  className={cn(
                    "flex flex-col bg-surface border rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all cursor-pointer hover:shadow-md hover:border-[#1B5DF1]/30",
                    visit.rawStatus === 'IN_PROGRESS' 
                      ? "border-orange-300 ring-2 ring-orange-200/50" 
                      : "border-border/70"
                  )}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-[#667085]">
                      <CalendarIcon className="w-4 h-4 text-[#1B5DF1]" />
                      <span>{visit.date}, {visit.time}</span>
                    </div>
                    <span className={cn(
                      "px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg border",
                      visit.rawStatus === 'IN_PROGRESS' 
                        ? 'bg-orange-50 text-orange-600 border-orange-200 animate-pulse' 
                        : 'bg-[#EBF5FF] text-[#1B5DF1] border-[#1B5DF1]/20'
                    )}>
                      {visit.status}
                    </span>
                  </div>
                  
                  <div className="flex gap-3 mb-3">
                    <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold shrink-0 border border-blue-100 text-[16px]">
                      {visit.name.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <h4 className="font-bold text-[#172033] text-[16px] leading-tight">{visit.name}</h4>
                      <p className="text-[13px] font-semibold text-[#1B5DF1] mt-0.5">{visit.service}</p>
                      <p className="text-[11px] text-muted mt-0.5">Booking ID: {visit.bookingNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-[13px] text-[#667085] mb-4 bg-gray-50 p-2.5 rounded-xl">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-muted" />
                    <span>{visit.address}{visit.city ? `, ${visit.city}` : ''}</span>
                  </div>

                  {visit.notes && (
                    <div className="text-[12px] text-muted/90 bg-amber-50/60 border border-amber-100 rounded-xl p-2.5 mb-4">
                      <span className="font-bold text-amber-900">Notes:</span> {visit.notes}
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <a 
                      href={`tel:${visit.patientPhone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-surface border border-border text-[#172033] rounded-xl font-semibold hover:bg-gray-50 transition-colors text-[14px]"
                    >
                      <Phone className="w-4 h-4 text-[#1B5DF1]" /> Call
                    </a>

                    {visit.rawStatus === 'IN_PROGRESS' ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleUpdateStatus(visit.id, 'COMPLETED'); }}
                        disabled={actionLoadingId === visit.id}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors text-[14px] shadow-sm shadow-emerald-600/20 disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {actionLoadingId === visit.id ? "Saving..." : "Complete"}
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleUpdateStatus(visit.id, 'IN_PROGRESS'); }}
                        disabled={actionLoadingId === visit.id}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1B5DF1] text-white rounded-xl font-bold hover:bg-blue-700 transition-colors text-[14px] shadow-sm shadow-[#1B5DF1]/20 disabled:opacity-50"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        {actionLoadingId === visit.id ? "Starting..." : "Start Visit"}
                      </button>
                    )}
                  </div>
                </div>
              )) : displayedVisits.map((visit) => (
                <div key={visit.id} onClick={() => openVisitDetail(visit)} className="flex flex-col bg-surface border border-border/70 rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer hover:shadow-md hover:border-[#1B5DF1]/30 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-[#667085]">
                      <CalendarIcon className="w-4 h-4 text-emerald-600" />
                      <span>{visit.date}, {visit.time}</span>
                    </div>
                    <span className={cn(
                      "flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border",
                      visit.rawStatus === 'CANCELLED' 
                        ? "text-red-600 bg-red-50 border-red-100" 
                        : "text-emerald-600 bg-emerald-50 border-emerald-100"
                    )}>
                      <CheckCircle className="w-3 h-3" /> {visit.status}
                    </span>
                  </div>
                  
                  <div className="flex gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-muted font-bold shrink-0 border border-border">
                      {visit.name.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <h4 className="font-bold text-[#172033] text-[16px]">{visit.name}</h4>
                      <p className="text-[13px] font-medium text-[#667085]">{visit.service}</p>
                      <p className="text-[11px] text-muted">ID: {visit.bookingNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[12px] text-muted bg-gray-50 p-2.5 rounded-xl mt-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {visit.city || visit.address}
                    </span>
                    <span className="font-bold text-[#0A1A3D]">₹{visit.totalAmount}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12">
              <EmptyState 
                icon={activeTab === 'upcoming' ? Clock : CheckCircle}
                title={activeTab === 'upcoming' ? "No Upcoming Visits" : "No Visit History"}
                description={
                  searchQuery 
                    ? `No visits matching "${searchQuery}" found.` 
                    : activeTab === 'upcoming' 
                    ? "You don't have any upcoming home visits scheduled right now." 
                    : "No completed visits found in history."
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
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
