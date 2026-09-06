import { ArrowLeft, History, Calendar as CalendarIcon, Search } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export function ConsultationHistory() {
  const navigate = useNavigate();

  const history = [
    { id: 1, date: "12 May 2025", time: "09:30 AM", patient: "Rahul Sharma", type: "Follow Up", status: "Completed" },
    { id: 2, date: "12 May 2025", time: "10:15 AM", patient: "Priya Singh", type: "New Patient", status: "Completed" },
    { id: 3, date: "11 May 2025", time: "02:00 PM", patient: "Amit Kumar", type: "Video Consult", status: "Completed" },
    { id: 4, date: "10 May 2025", time: "11:30 AM", patient: "Sunita Devi", type: "Follow Up", status: "Cancelled" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/30 pb-12">
      <div className="sticky top-0 z-30 pt-4 pb-3 px-4 flex flex-col gap-4 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
          <h1 className="text-[20px] font-black text-[#0A1A3D] tracking-tight">Consultation History</h1>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input 
            type="text" 
            placeholder="Search past consultations..." 
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/10 text-sm font-medium"
          />
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Recent Consultations</h2>
          <button className="text-xs font-bold text-[#1B5DF1] flex items-center gap-1">
            <CalendarIcon className="w-3.5 h-3.5" /> Filter Date
          </button>
        </div>

        {history.map((item, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.05 }}
            key={item.id} 
            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col gap-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-[#0A1A3D]">{item.patient}</h3>
                <p className="text-xs font-medium text-gray-500 mt-0.5">{item.type}</p>
              </div>
              <span className={cn(
                "px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md",
                item.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              )}>
                {item.status}
              </span>
            </div>
            
            <div className="flex items-center gap-4 pt-3 border-t border-gray-50">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                <CalendarIcon className="w-3.5 h-3.5" />
                {item.date}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
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
