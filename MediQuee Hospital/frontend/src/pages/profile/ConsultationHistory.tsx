import { useState, useEffect } from "react"
import { ArrowLeft, History, Calendar as CalendarIcon, Search, RefreshCw } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { EmptyState } from "@/components/ui/EmptyState"
import { doctorApi } from "@/services/doctorApi"
import { Skeleton } from "@/components/ui/Skeleton"

export function ConsultationHistory() {
  const navigate = useNavigate();

  const [history, setHistory] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const data = await doctorApi.getMyAppointments();
      setHistory(data || []);
    } catch (err) {
      console.error("Failed to fetch appointment history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredHistory = history.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (item.patientName && item.patientName.toLowerCase().includes(q)) ||
      (item.diseaseName && item.diseaseName.toLowerCase().includes(q)) ||
      (item.opType && item.opType.toLowerCase().includes(q)) ||
      (item.status && item.status.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col min-h-screen bg-background pb-12">
      <div className="sticky top-0 z-30 pt-4 pb-3 px-4 flex flex-col gap-4 bg-surface/90 backdrop-blur-xl border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-[20px] font-black text-foreground tracking-tight">Consultation History</h1>
          </div>
          <button 
            onClick={fetchHistory}
            className="p-2 text-muted hover:text-foreground rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted/70">
            <Search className="w-4 h-4" />
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search past consultations..." 
            className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-xl outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/10 text-sm font-medium"
          />
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-muted uppercase tracking-wider">
            All Consultations ({filteredHistory.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="w-full h-24 rounded-2xl" />
            <Skeleton className="w-full h-24 rounded-2xl" />
            <Skeleton className="w-full h-24 rounded-2xl" />
          </div>
        ) : filteredHistory.length === 0 ? (
          <EmptyState
            icon={History}
            title="No Consultations"
            description={searchQuery ? "No consultations matching your search." : "Past consultations will appear here once completed."}
          />
        ) : (
          filteredHistory.map((item, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.03 }}
              key={item.id} 
              className="bg-surface rounded-2xl p-4 border border-border shadow-sm flex flex-col gap-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-foreground text-base">{item.patientName || 'Anonymous Patient'}</h3>
                  <p className="text-xs font-medium text-muted mt-0.5">
                    {item.diseaseName || item.opType || 'General Consultation'}
                  </p>
                </div>
                <span className={cn(
                  "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md",
                  item.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                  item.status === 'IN_CONSULTATION' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                  item.status === 'WAITING' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                  'bg-gray-100 text-gray-600 border border-gray-200'
                )}>
                  {item.status}
                </span>
              </div>
              
              <div className="flex items-center gap-4 pt-3 border-t border-border text-xs font-medium text-muted">
                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-[#1B5DF1]" />
                  <span>{item.date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-[#1B5DF1]" />
                  <span>{item.slotTime || item.timeSlot || '—'}</span>
                </div>
                {item.patientAge && (
                  <span className="text-muted/80">Age: {item.patientAge}</span>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
