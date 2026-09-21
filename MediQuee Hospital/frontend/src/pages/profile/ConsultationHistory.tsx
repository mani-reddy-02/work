import { ArrowLeft, History, Calendar as CalendarIcon, Search } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { EmptyState } from "@/components/ui/EmptyState"

export function ConsultationHistory() {
  const navigate = useNavigate();

  // Consultation records come from the backend. Empty until connected.
  const history: { id: number; date: string; time: string; patient: string; type: string; status: string }[] = [];

  return (
    <div className="flex flex-col min-h-screen bg-background/30 pb-12">
      <div className="sticky top-0 z-30 pt-4 pb-3 px-4 flex flex-col gap-4 bg-surface/80 backdrop-blur-xl border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-background transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-[20px] font-black text-[#0A1A3D] tracking-tight">Consultation History</h1>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted/70">
            <Search className="w-4 h-4" />
          </div>
          <input 
            type="text" 
            placeholder="Search past consultations..." 
            className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-xl outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/10 text-sm font-medium"
          />
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-muted uppercase tracking-wider">Recent Consultations</h2>
          <button className="text-xs font-bold text-[#1B5DF1] flex items-center gap-1">
            <CalendarIcon className="w-3.5 h-3.5" /> Filter Date
          </button>
        </div>

        {history.length === 0 ? (
          <EmptyState
            icon={History}
            title="No Consultations"
            description="Past consultations will appear here once available."
          />
        ) : history.map((item, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.05 }}
            key={item.id} 
            className="bg-surface rounded-2xl p-4 border border-border shadow-sm flex flex-col gap-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-[#0A1A3D]">{item.patient}</h3>
                <p className="text-xs font-medium text-muted mt-0.5">{item.type}</p>
              </div>
              <span className={cn(
                "px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md",
                item.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              )}>
                {item.status}
              </span>
            </div>
            
            <div className="flex items-center gap-4 pt-3 border-t border-gray-50">
              <div className="flex items-center gap-1.5 text-xs font-bold text-muted/70">
                <CalendarIcon className="w-3.5 h-3.5" />
                {item.date}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-muted/70">
                <History className="w-3.5 h-3.5" />
                {item.time}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
