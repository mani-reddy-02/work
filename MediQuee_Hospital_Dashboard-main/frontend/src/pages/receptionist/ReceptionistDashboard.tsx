import { motion } from "framer-motion"
import { UserPlus, Clock, ArrowRight, Building, CheckCircle2, Activity, PlaySquare } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"

export function ReceptionistDashboard() {
  const navigate = useNavigate();

  const stats = [
    { title: "Waiting", value: "24", icon: Clock, color: "text-orange-600 bg-orange-50 border-orange-100" },
    { title: "In Consultation", value: "8", icon: PlaySquare, color: "text-[#1B5DF1] bg-[#EBF5FF] border-[#1B5DF1]/20" },
    { title: "Completed", value: "54", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
  ];

  const departmentQueues = [
    { id: 'dept-1', name: "General Medicine", waiting: 12, inConsult: 3, nextOp: "OP-104" },
    { id: 'dept-2', name: "Cardiology", waiting: 6, inConsult: 2, nextOp: "OP-087" },
    { id: 'dept-3', name: "Orthopedics", waiting: 9, inConsult: 1, nextOp: "OP-121" },
  ];

  const overallRush = "Medium"; 
  const waitingCount = 27;

  return (
    <div className="flex flex-col gap-5 p-4 pb-24 min-h-[calc(100vh-80px)] bg-gray-50/30">
      
      {/* Header */}
      <div className="flex items-center justify-between pt-2 pb-1">
        <div>
          <h1 className="text-[22px] font-black text-[#0A1A3D] tracking-tight">Patient Flow</h1>
          <p className="text-gray-500 text-[13px] font-medium mt-0.5">Manage queues and appointments.</p>
        </div>
        <button 
          onClick={() => navigate('/receptionist/check-in')}
          className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[#1B5DF1] hover:bg-[#EBF5FF] hover:border-[#1B5DF1]/30 transition-colors shadow-sm"
        >
          <UserPlus className="w-5 h-5" />
        </button>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn("bg-white p-3.5 rounded-2xl border shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center text-center gap-2", stat.color.split(' ')[2])}
          >
            <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0", stat.color.split(' ').slice(0,2).join(' '))}>
              <stat.icon className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <h3 className={cn("text-[20px] font-black leading-none", stat.color.split(' ')[0])}>{stat.value}</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-wider">{stat.title}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Department Queues */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col gap-3 mt-2"
      >
        <div className="flex items-center justify-between px-1 mb-1">
          <h2 className="text-[14px] font-bold text-[#0A1A3D] uppercase tracking-wider">Department Queues</h2>
        </div>
        
        <div className="flex flex-col gap-3">
          {departmentQueues.map(dept => (
            <button 
              key={dept.id} 
              onClick={() => navigate(`/receptionist/queue?dept=${dept.name}`)}
              className="flex flex-col p-4 bg-white rounded-[20px] border border-gray-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:border-[#1B5DF1]/30 active:scale-[0.98] transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#1B5DF1] shrink-0 border border-blue-100">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0A1A3D] text-[16px]">{dept.name}</h4>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                <div className="flex gap-5">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-bold uppercase mb-1 tracking-wider">Waiting</span>
                    <span className="text-[15px] font-black text-orange-600">{dept.waiting}</span>
                  </div>
                  <div className="w-px h-8 bg-gray-200" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-bold uppercase mb-1 tracking-wider">In Consult</span>
                    <span className="text-[15px] font-black text-[#1B5DF1]">{dept.inConsult}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-gray-500 font-bold uppercase mb-1 tracking-wider">Next</span>
                    <span className="text-[15px] font-black text-[#0A1A3D]">{dept.nextOp}</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm text-gray-400 group-hover:text-[#1B5DF1] group-hover:border-[#1B5DF1]/30 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Hospital Rush */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-between bg-white p-5 rounded-[20px] border border-gray-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.02)] mt-2"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-gray-500 text-[11px] font-bold uppercase tracking-wider mb-1">Hospital Rush</h2>
            <div className="flex items-center gap-2 text-[16px] font-black text-orange-600">
              {overallRush}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[20px] font-black text-[#0A1A3D]">{waitingCount}</span>
          <span className="text-[11px] font-bold text-gray-400 uppercase">Total Waiting</span>
        </div>
      </motion.div>

    </div>
  )
}
