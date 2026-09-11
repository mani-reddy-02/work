import { motion } from "framer-motion"
import { MapPin, CheckCircle, Clock, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

export function NurseDashboard() {
  const navigate = useNavigate();

  const stats = [
    { title: "Visits Today", value: "6", color: "text-[#0A1A3D] bg-white border-gray-200" },
    { title: "Upcoming", value: "2", color: "text-[#1B5DF1] bg-white border-blue-100" },
    { title: "In Progress", value: "1", color: "text-orange-600 bg-white border-orange-100" },
    { title: "Completed", value: "3", color: "text-emerald-600 bg-white border-emerald-100" },
  ];

  const todayVisits = [
    { id: 1, name: "Ramesh Kumar", time: "10:30 AM", service: "Post-op Care", status: "Upcoming" },
    { id: 2, name: "Priya Sharma", time: "12:00 PM", service: "Injection / Dressing", status: "Completed" },
    { id: 3, name: "Mohammed Ali", time: "02:30 PM", service: "Home Care", status: "Upcoming" },
  ];

  return (
    <div className="flex flex-col bg-gray-50/30 min-h-screen pb-[100px]">
      
      {/* Header */}
      <div className="pt-8 pb-4 px-4 flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-[14px] font-medium mb-1">Good Morning, Nurse Jane</p>
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
        <h3 className="text-[14px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Next Visit</h3>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-[#1B5DF1] to-blue-700 rounded-[24px] p-5 text-white shadow-[0_8px_24px_rgba(27,93,241,0.25)] relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-white/10 blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl font-bold text-[13px]">
                <Clock className="w-4 h-4" /> 10:30 AM
              </div>
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-white/20 text-white">
                Upcoming
              </span>
            </div>
            
            <div className="mb-5">
              <h4 className="font-black text-[24px] tracking-tight mb-1">Ramesh Kumar</h4>
              <p className="text-blue-100 font-medium flex items-center gap-1.5">
                Post-operative Care
              </p>
            </div>
            
            <div className="flex items-center gap-2 text-[13px] text-blue-100 mb-5 bg-black/10 p-2.5 rounded-xl inline-flex">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>2.4 km away</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/nurse/visits')}
                className="flex-1 bg-white text-[#1B5DF1] py-3 rounded-[16px] font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
              >
                View Visit
              </button>
            </div>
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
          {todayVisits.map((visit, i) => (
            <motion.div 
              key={visit.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + (i * 0.1) }}
              className="bg-white border border-gray-100 rounded-2xl p-3.5 flex items-center gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            >
              <div className="flex flex-col items-center min-w-[65px] border-r border-gray-100 pr-3">
                <span className="text-[14px] font-black text-[#0A1A3D] leading-none">{visit.time.split(' ')[0]}</span>
                <span className="text-[11px] font-bold text-gray-400 mt-1">{visit.time.split(' ')[1]}</span>
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

