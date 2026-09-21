import { motion } from "framer-motion"
import { MapPin, CheckCircle, Clock, ChevronRight, CalendarDays } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { EmptyState } from "@/components/ui/EmptyState"
import { useNavigate } from "react-router-dom"

export function NurseDashboard() {
  const navigate = useNavigate();

  // Counters come from the backend. Unavailable until connected.
  const stats = [
    { title: "Visits Today", value: "—", color: "text-[#0A1A3D] bg-surface border-border" },
    { title: "Upcoming", value: "—", color: "text-[#1B5DF1] bg-surface border-blue-100" },
    { title: "In Progress", value: "—", color: "text-orange-600 bg-surface border-orange-100" },
    { title: "Completed", value: "—", color: "text-emerald-600 bg-surface border-emerald-100" },
  ];

  // Next assigned visit comes from the backend. Null until connected.
  const [nextVisit] = useState<{
    id: number; name: string; time: string; service: string; status: string; distance: string;
  } | null>(null);

  // Today's visit list comes from the backend. Empty until connected.
  const todayVisits: { id: number; name: string; time: string; service: string; status: string }[] = [];

  return (
    <div className="flex flex-col bg-gray-50/30 min-h-screen pb-[100px]">
      
      {/* Header */}
      <div className="pt-8 pb-4 px-4 flex items-center justify-between">
        <div>
          <p className="text-muted text-[14px] font-medium mb-1">Good Morning</p>
          <h1 className="text-[22px] font-black text-[#0A1A3D] tracking-tight">Home Nursing</h1>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 px-4 mb-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn("p-4 rounded-[16px] border shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-center", stat.color)}
          >
            <span className="text-[12px] font-bold opacity-80 uppercase tracking-wider mb-1">{stat.title}</span>
            <span className="text-[24px] font-black">{stat.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Next Visit Prominent Card */}
      <div className="px-4 mb-6">
        <h3 className="text-[14px] font-bold text-muted/70 uppercase tracking-wider mb-3 px-1">Next Visit</h3>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-[#1B5DF1] to-blue-700 rounded-[24px] p-5 text-white shadow-[0_8px_24px_rgba(27,93,241,0.25)] relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-surface/10 blur-2xl"></div>
          
          <div className="relative z-10">
            {nextVisit ? (
              <>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2 bg-surface/20 backdrop-blur-md px-3 py-1.5 rounded-xl font-bold text-[13px]">
                    <Clock className="w-4 h-4" /> {nextVisit.time}
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-surface/20 text-white">
                    {nextVisit.status}
                  </span>
                </div>

                <div className="mb-5">
                  <h4 className="font-black text-[24px] tracking-tight mb-1">{nextVisit.name}</h4>
                  <p className="text-blue-100 font-medium flex items-center gap-1.5">
                    {nextVisit.service}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-[13px] text-blue-100 mb-5 bg-black/10 p-2.5 rounded-xl inline-flex">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>{nextVisit.distance}</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/nurse/visits')}
                    className="flex-1 bg-surface text-[#1B5DF1] py-3 rounded-[16px] font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
                  >
                    View Visit
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-1 py-2">
                <h4 className="font-black text-[24px] tracking-tight">—</h4>
                <p className="text-blue-100 font-medium">No visit scheduled.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Today's Visits List */}
      <div className="px-4 flex flex-col gap-3">
        <div className="flex items-center justify-between px-1 mb-1">
          <h3 className="text-[14px] font-bold text-[#0A1A3D] uppercase tracking-wider">Today's Visits</h3>
          <button 
            onClick={() => navigate('/nurse/visits')}
            className="text-[#1B5DF1] text-[13px] font-bold flex items-center"
          >
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex flex-col gap-2">
          {todayVisits.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No Visits"
              description="Today's home nursing visits will appear here once available."
            />
          ) : todayVisits.map((visit, i) => (
            <motion.div 
              key={visit.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + (i * 0.1) }}
              className="bg-surface border border-border rounded-2xl p-3.5 flex items-center gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            >
              <div className="flex flex-col items-center min-w-[65px] border-r border-border pr-3">
                <span className="text-[14px] font-black text-[#0A1A3D] leading-none">{visit.time.split(' ')[0]}</span>
                <span className="text-[11px] font-bold text-muted/70 mt-1">{visit.time.split(' ')[1]}</span>
              </div>
              
              <div className="flex-1 flex flex-col justify-center">
                <h4 className="font-bold text-[15px] text-[#0A1A3D] mb-0.5">{visit.name}</h4>
                <p className="text-[12px] font-medium text-[#667085]">{visit.service}</p>
              </div>
              
              <div>
                {visit.status === 'Completed' ? (
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                ) : (
                  <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">Upcoming</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  )
}

