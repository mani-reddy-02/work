import { Search, MapPin, Clock, CheckCircle, Phone, Calendar as CalendarIcon, Play } from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Skeleton } from "@/components/ui/Skeleton"
import { EmptyState } from "@/components/ui/EmptyState"
import { cn } from "@/lib/utils"

export function NurseVisits() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading] = useState(false);

  // Home visit records come from the backend. Empty until connected.
  const upcomingVisits: {
    id: number; name: string; time: string; date: string; service: string;
    address: string; status: string; distance: string;
  }[] = [];

  const historyVisits: {
    id: number; name: string; time: string; date: string; service: string; status: string;
  }[] = [];

  const displayedVisits = activeTab === 'upcoming'
    ? upcomingVisits.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : historyVisits.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col bg-gray-50/30 min-h-screen pb-[120px]">
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-xl pt-6 pb-4 px-4 flex flex-col gap-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border-b border-border">
        <h2 className="text-[22px] font-black text-[#0A1A3D] tracking-tight">Home Visits</h2>
        
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted/70 group-focus-within:text-[#1B5DF1] transition-colors">
            <Search className="w-4 h-4" />
          </div>
          <input 
            type="text" 
            placeholder="Search patient or service..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-border/60 rounded-2xl outline-none focus:border-[#1B5DF1] focus:bg-surface focus:ring-4 focus:ring-[#1B5DF1]/10 transition-all text-[15px] font-medium text-[#172033] placeholder:text-muted/70"
          />
        </div>

        <div className="flex bg-gray-100/80 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('upcoming')}
            className={cn("flex-1 py-2 text-[14px] font-bold rounded-lg transition-all", activeTab === 'upcoming' ? "bg-surface text-[#1B5DF1] shadow-sm" : "text-[#667085] hover:text-[#172033]")}
          >
            Upcoming
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={cn("flex-1 py-2 text-[14px] font-bold rounded-lg transition-all", activeTab === 'history' ? "bg-surface text-[#1B5DF1] shadow-sm" : "text-[#667085] hover:text-[#172033]")}
          >
            History
          </button>
        </div>
      </div>

      <div className="flex flex-col px-4 pt-5 gap-4">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="skeletons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-2xl bg-surface border border-border" />
              ))}
            </motion.div>
          ) : displayedVisits.length > 0 ? (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
              {activeTab === 'upcoming' ? displayedVisits.map((visit: any) => (
                <div key={visit.id} className={cn("flex flex-col bg-surface border rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]", visit.status === 'Next' ? "border-[#1B5DF1]/30 shadow-[#1B5DF1]/5" : "border-border/60")}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-[#667085]">
                      <CalendarIcon className="w-4 h-4" />
                      <span>{visit.date}, {visit.time}</span>
                    </div>
                    <span className={cn("px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border", visit.status === 'Next' ? 'bg-[#EBF5FF] text-[#1B5DF1] border-[#1B5DF1]/20' : 'bg-gray-50 text-foreground/80 border-border')}>
                      {visit.status}
                    </span>
                  </div>
                  
                  <div className="flex gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold shrink-0 border border-blue-100">
                      {visit.name.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <h4 className="font-bold text-[#172033] text-[16px]">{visit.name}</h4>
                      <p className="text-[14px] font-medium text-[#1B5DF1]">{visit.service}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-[13px] text-[#667085] mb-4 bg-gray-50 p-2.5 rounded-xl">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{visit.address} <span className="font-semibold text-muted/70">({visit.distance})</span></span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-surface border border-border text-[#172033] rounded-xl font-semibold hover:bg-gray-50 transition-colors text-[14px]">
                      <Phone className="w-4 h-4" /> Call
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1B5DF1] text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors text-[14px] shadow-sm shadow-[#1B5DF1]/20">
                      <Play className="w-4 h-4 fill-white" /> Start
                    </button>
                  </div>
                </div>
              )) : displayedVisits.map((visit: any) => (
                <div key={visit.id} className="flex flex-col bg-surface border border-border/60 rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-[#667085]">
                      <CalendarIcon className="w-4 h-4" />
                      <span>{visit.date}, {visit.time}</span>
                    </div>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                      <CheckCircle className="w-3 h-3" /> Completed
                    </span>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-muted font-bold shrink-0 border border-border">
                      {visit.name.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <h4 className="font-bold text-[#172033] text-[16px]">{visit.name}</h4>
                      <p className="text-[13px] font-medium text-[#667085]">{visit.service}</p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12">
              <EmptyState 
                icon={activeTab === 'upcoming' ? Clock : CheckCircle}
                title={activeTab === 'upcoming' ? "No Upcoming Visits" : "No Visit History"}
                description={activeTab === 'upcoming' ? "You don't have any upcoming home visits scheduled." : "No completed visits found."}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
