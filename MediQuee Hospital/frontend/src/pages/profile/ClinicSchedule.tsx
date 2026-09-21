import { ArrowLeft, Clock, Calendar as CalendarIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"

export function ClinicSchedule() {
  const navigate = useNavigate();

  // Day names are static UI config. The saved weekly availability comes from the
  // backend and is unavailable until connected.
  const days = [
    { name: "Monday", active: false, times: "—" },
    { name: "Tuesday", active: false, times: "—" },
    { name: "Wednesday", active: false, times: "—" },
    { name: "Thursday", active: false, times: "—" },
    { name: "Friday", active: false, times: "—" },
    { name: "Saturday", active: false, times: "—" },
    { name: "Sunday", active: false, times: "—" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background/30 pb-12">
      <div className="sticky top-0 z-30 pt-4 pb-3 px-4 flex items-center gap-3 bg-surface/80 backdrop-blur-xl border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-background transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-[20px] font-black text-[#0A1A3D] tracking-tight">Clinic Schedule</h1>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <div className="bg-surface rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#EBF5FF] flex items-center justify-center shrink-0">
              <CalendarIcon className="w-6 h-6 text-[#1B5DF1]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0A1A3D]">Weekly Availability</h2>
              <p className="text-sm text-muted font-medium">Set your standard working hours</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            {days.map((day, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ delay: i * 0.05 }}
                key={day.name} 
                className="flex items-center justify-between p-3 rounded-xl border border-gray-50 bg-background/50"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-6 rounded-full relative shadow-inner ${day.active ? 'bg-[#1B5DF1]' : 'bg-gray-200'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-surface rounded-full transition-all ${day.active ? 'right-1' : 'left-1'}`}></div>
                  </div>
                  <span className={`font-semibold ${day.active ? 'text-[#0A1A3D]' : 'text-muted/70'}`}>{day.name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-bold text-muted">
                  {day.active && <Clock className="w-3.5 h-3.5" />}
                  <span>{day.times}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <button className="w-full bg-surface border border-border text-[#1B5DF1] py-4 rounded-xl font-bold hover:bg-background transition-colors">
          Manage Exceptions & Leaves
        </button>
      </div>
    </div>
  )
}
