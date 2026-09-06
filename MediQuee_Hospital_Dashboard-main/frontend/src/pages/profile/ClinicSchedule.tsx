import { ArrowLeft, Clock, Calendar as CalendarIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"

export function ClinicSchedule() {
  const navigate = useNavigate();

  const days = [
    { name: "Monday", active: true, times: "09:00 AM - 05:00 PM" },
    { name: "Tuesday", active: true, times: "09:00 AM - 05:00 PM" },
    { name: "Wednesday", active: true, times: "09:00 AM - 05:00 PM" },
    { name: "Thursday", active: true, times: "09:00 AM - 01:00 PM" },
    { name: "Friday", active: true, times: "09:00 AM - 05:00 PM" },
    { name: "Saturday", active: false, times: "Off" },
    { name: "Sunday", active: false, times: "Off" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/30 pb-12">
      <div className="sticky top-0 z-30 pt-4 pb-3 px-4 flex items-center gap-3 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </button>
        <h1 className="text-[20px] font-black text-[#0A1A3D] tracking-tight">Clinic Schedule</h1>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#EBF5FF] flex items-center justify-center shrink-0">
              <CalendarIcon className="w-6 h-6 text-[#1B5DF1]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0A1A3D]">Weekly Availability</h2>
              <p className="text-sm text-gray-500 font-medium">Set your standard working hours</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            {days.map((day, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ delay: i * 0.05 }}
                key={day.name} 
                className="flex items-center justify-between p-3 rounded-xl border border-gray-50 bg-gray-50/50"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-6 rounded-full relative shadow-inner ${day.active ? 'bg-[#1B5DF1]' : 'bg-gray-200'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${day.active ? 'right-1' : 'left-1'}`}></div>
                  </div>
                  <span className={`font-semibold ${day.active ? 'text-[#0A1A3D]' : 'text-gray-400'}`}>{day.name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-bold text-gray-500">
                  {day.active && <Clock className="w-3.5 h-3.5" />}
                  <span>{day.times}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <button className="w-full bg-white border border-gray-200 text-[#1B5DF1] py-4 rounded-xl font-bold hover:bg-gray-50 transition-colors">
          Manage Exceptions & Leaves
        </button>
      </div>
    </div>
  )
}
