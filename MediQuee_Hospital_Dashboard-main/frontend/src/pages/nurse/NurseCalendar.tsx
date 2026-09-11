import { useState } from "react"
import { Calendar as MapPin, ChevronLeft, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export function NurseCalendar() {
  const [_setCurrentDate] = useState(new Date('2026-05-14'));
  const [view, setView] = useState<'day' | 'week'>('day');

  const upcomingVisits = [
    { id: 1, name: "Sneha Patel", time: "11:00 AM", service: "Post-op Care", address: "123 Park Street, City", status: "Upcoming", color: "bg-blue-50 border-blue-200 text-blue-700" },
    { id: 2, name: "Arun Verma", time: "02:00 PM", service: "Wound Dressing", address: "45 Lake View Apts", status: "Upcoming", color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  ];

  return (
    <div className="flex flex-col bg-gray-50/30 min-h-screen pb-[120px]">
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl pt-6 pb-4 px-4 flex flex-col gap-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border-b border-gray-100">
        <h2 className="text-[22px] font-black text-[#0A1A3D] tracking-tight">Calendar</h2>
        
        <div className="flex bg-gray-100/80 p-1 rounded-xl">
          <button 
            onClick={() => setView('day')}
            className={cn("flex-1 py-2 text-[14px] font-bold rounded-lg transition-all", view === 'day' ? "bg-white text-[#1B5DF1] shadow-sm" : "text-[#667085] hover:text-[#172033]")}
          >
            Day
          </button>
          <button 
            onClick={() => setView('week')}
            className={cn("flex-1 py-2 text-[14px] font-bold rounded-lg transition-all", view === 'week' ? "bg-white text-[#1B5DF1] shadow-sm" : "text-[#667085] hover:text-[#172033]")}
          >
            Week
          </button>
        </div>

        <div className="flex items-center justify-between px-2">
          <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-[#172033]">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-[16px] text-[#172033]">
            14 May 2026
          </span>
          <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-[#172033]">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col px-4 pt-5 gap-4">
        {upcomingVisits.map((visit) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={visit.id} 
            className="flex gap-4"
          >
            <div className="flex flex-col items-center min-w-[60px] pt-1">
              <span className="text-[15px] font-black text-[#172033] leading-none">{visit.time.split(' ')[0]}</span>
              <span className="text-[12px] font-bold text-[#98A2B3] mt-1">{visit.time.split(' ')[1]}</span>
            </div>
            
            <div className={cn("flex-1 flex flex-col p-4 rounded-2xl border shadow-sm", visit.color)}>
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-[16px]">{visit.name}</h4>
              </div>
              <p className="text-[14px] font-medium opacity-90 mb-3">{visit.service}</p>
              
              <div className="flex items-start gap-1.5 text-[12px] font-medium opacity-80">
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{visit.address}</span>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Empty slots to show it's a calendar */}
        <div className="flex gap-4 mt-2">
          <div className="flex flex-col items-center min-w-[60px] pt-1">
            <span className="text-[15px] font-black text-[#98A2B3] leading-none opacity-50">04:00</span>
            <span className="text-[12px] font-bold text-[#98A2B3] mt-1 opacity-50">PM</span>
          </div>
          <div className="flex-1 flex flex-col p-4 rounded-2xl border border-dashed border-gray-200">
            <span className="text-[14px] font-medium text-gray-400 text-center py-2">No visits scheduled</span>
          </div>
        </div>
      </div>
    </div>
  )
}
