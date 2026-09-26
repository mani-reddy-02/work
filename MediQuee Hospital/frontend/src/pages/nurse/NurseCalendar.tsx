import { useState, useEffect, useCallback } from "react"
import { Calendar as CalendarIcon, MapPin, CalendarDays, ChevronLeft, ChevronRight, RefreshCw, Clock, ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"
import { EmptyState } from "@/components/ui/EmptyState"
import { cn } from "@/lib/utils"
import { nurseApi, type NurseVisit } from "@/services/nurseApi"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/context/ToastContext"
import { NurseVisitDetailModal } from "@/components/nurse/NurseVisitDetailModal"

export function NurseCalendar() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [view, setView] = useState<'day' | 'week'>('day');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [allVisits, setAllVisits] = useState<NurseVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState<NurseVisit | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadVisits = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await nurseApi.getVisits();
      setAllVisits(res.all || []);
    } catch (err) {
      console.error("Failed to load visits for calendar:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVisits();
  }, [loadVisits]);

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (view === 'day') {
      d.setDate(d.getDate() - 1);
    } else {
      d.setDate(d.getDate() - 7);
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (view === 'day') {
      d.setDate(d.getDate() + 1);
    } else {
      d.setDate(d.getDate() + 7);
    }
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const toISODate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Filter visits for current view
  const currentISODate = toISODate(currentDate);

  const displayedVisits = allVisits.filter(v => {
    if (view === 'day') {
      return v.date === currentISODate;
    } else {
      // Week view: check if v.date is within 7 days from start of week
      const startOfWeek = new Date(currentDate);
      const dayOfWeek = startOfWeek.getDay();
      startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek); // Sunday
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6); // Saturday
      return v.date >= toISODate(startOfWeek) && v.date <= toISODate(endOfWeek);
    }
  });

  const openVisitDetail = (visit: NurseVisit) => {
    setSelectedVisit(visit);
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (visitId: string, status: 'IN_PROGRESS' | 'COMPLETED') => {
    setActionLoadingId(visitId);
    try {
      await nurseApi.updateVisitStatus(visitId, status);
      toast(
        status === 'IN_PROGRESS' ? "Visit started!" : "Service completed!",
        "success"
      );
      setIsModalOpen(false);
      setSelectedVisit(null);
      await loadVisits();
    } catch (err: any) {
      toast(err.message || "Failed to update status", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="flex flex-col bg-gray-50/30 min-h-screen pb-[120px]">
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-xl pt-6 pb-4 px-4 flex flex-col gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted hover:text-foreground transition-colors rounded-xl hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-[22px] font-black text-[#0A1A3D] tracking-tight">Schedule</h2>
          </div>
          <button
            onClick={handleToday}
            className="text-[12px] font-bold text-[#1B5DF1] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
          >
            Today
          </button>
        </div>
        
        {/* View toggle */}
        <div className="flex bg-gray-100/80 p-1 rounded-xl">
          <button 
            onClick={() => setView('day')}
            className={cn("flex-1 py-2 text-[14px] font-bold rounded-lg transition-all", view === 'day' ? "bg-surface text-[#1B5DF1] shadow-sm" : "text-[#667085] hover:text-[#172033]")}
          >
            Day View
          </button>
          <button 
            onClick={() => setView('week')}
            className={cn("flex-1 py-2 text-[14px] font-bold rounded-lg transition-all", view === 'week' ? "bg-surface text-[#1B5DF1] shadow-sm" : "text-[#667085] hover:text-[#172033]")}
          >
            Week View
          </button>
        </div>

        {/* Date navigator */}
        <div className="flex items-center justify-between px-2 bg-gray-50 p-2 rounded-xl border border-border/60">
          <button 
            onClick={handlePrev} 
            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-[#172033]"
            title="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5 font-bold text-[15px] text-[#172033]">
            <CalendarIcon className="w-4 h-4 text-[#1B5DF1]" />
            <span>
              {view === 'day' 
                ? currentDate.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
                : `Week of ${currentDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`
              }
            </span>
          </div>
          <button 
            onClick={handleNext} 
            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-[#172033]"
            title="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Schedule Content */}
      <div className="flex flex-col px-4 pt-5 gap-3.5">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-[#1B5DF1]" />
            <p className="text-[13px] text-muted font-medium">Loading schedule...</p>
          </div>
        ) : displayedVisits.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={view === 'day' ? "No Visits for this Day" : "No Visits this Week"}
            description={
              view === 'day' 
                ? `You don't have any home nursing visits scheduled for ${currentDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}.`
                : "No visits scheduled for this selected week."
            }
          />
        ) : displayedVisits.map((visit) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={visit.id}
            onClick={() => openVisitDetail(visit)}
            className="flex gap-3 bg-surface border border-border/70 rounded-2xl p-3.5 shadow-sm hover:border-[#1B5DF1]/40 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex flex-col items-center justify-center min-w-[70px] border-r border-border pr-3">
              <Clock className="w-3.5 h-3.5 text-[#1B5DF1] mb-1" />
              <span className="text-[13px] font-black text-[#172033] leading-none text-center">
                {visit.time.split(' ')[0]}
              </span>
              <span className="text-[10px] font-bold text-[#98A2B3] mt-0.5">
                {visit.time.split(' ').slice(1).join(' ')}
              </span>
              {view === 'week' && (
                <span className="text-[10px] font-semibold text-[#1B5DF1] mt-1 bg-blue-50 px-1.5 rounded">
                  {visit.date.split('-').slice(1).join('/')}
                </span>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <div className="flex justify-between items-start mb-0.5">
                <h4 className="font-bold text-[15px] text-[#0A1A3D]">{visit.name}</h4>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider",
                  visit.rawStatus === 'COMPLETED' ? "bg-emerald-50 text-emerald-600" :
                  visit.rawStatus === 'IN_PROGRESS' ? "bg-orange-50 text-orange-600 animate-pulse" :
                  "bg-blue-50 text-blue-600"
                )}>
                  {visit.status}
                </span>
              </div>
              <p className="text-[13px] font-semibold text-[#1B5DF1] mb-1.5">{visit.service}</p>

              <div className="flex items-center gap-1.5 text-[12px] text-muted line-clamp-1">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>{visit.address}</span>
              </div>
            </div>
          </motion.div>
        ))}
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
