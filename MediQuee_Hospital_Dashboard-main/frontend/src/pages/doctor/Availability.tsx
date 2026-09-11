import { Save, Calendar, CheckCircle2, Video, Stethoscope, ArrowLeft } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {} from "@/lib/utils"

interface DayAvailability {
  day: string;
  active: boolean;
  opStartTime: string;
  opEndTime: string;
  videoStartTime: string;
  videoEndTime: string;
}

export function Availability() {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<DayAvailability[]>([
    { day: "Monday", active: true, opStartTime: "09:00", opEndTime: "13:00", videoStartTime: "15:00", videoEndTime: "18:00" },
    { day: "Tuesday", active: true, opStartTime: "09:00", opEndTime: "13:00", videoStartTime: "15:00", videoEndTime: "18:00" },
    { day: "Wednesday", active: true, opStartTime: "09:00", opEndTime: "13:00", videoStartTime: "15:00", videoEndTime: "18:00" },
    { day: "Thursday", active: true, opStartTime: "09:00", opEndTime: "13:00", videoStartTime: "15:00", videoEndTime: "18:00" },
    { day: "Friday", active: true, opStartTime: "09:00", opEndTime: "13:00", videoStartTime: "15:00", videoEndTime: "18:00" },
    { day: "Saturday", active: false, opStartTime: "09:00", opEndTime: "13:00", videoStartTime: "15:00", videoEndTime: "18:00" },
    { day: "Sunday", active: false, opStartTime: "09:00", opEndTime: "13:00", videoStartTime: "15:00", videoEndTime: "18:00" },
  ]);

  const [saved, setSaved] = useState(false);

  const updateDay = (index: number, field: keyof DayAvailability, value: any) => {
    const newSchedule = [...schedule];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setSchedule(newSchedule);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col bg-[#F7F8FA] min-h-full pb-20">
      
      {/* Header Section */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl pt-6 pb-4 px-4 flex flex-col gap-4 border-b border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[#0A1A3D] hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[17px] font-bold text-[#0A1A3D] tracking-tight">Availability</h1>
          <div className="w-9 h-9" /> {/* Spacer */}
        </div>
        <p className="text-[13px] font-medium text-gray-500">Set your working hours for physical and remote consultations.</p>
      </div>

      <div className="flex flex-col gap-4 p-4">
        {schedule.map((slot, index) => (
          <div key={slot.day} className={`bg-white rounded-[24px] border ${slot.active ? 'border-[#1B5DF1]/20 shadow-[0_4px_20px_rgba(27,93,241,0.05)]' : 'border-gray-100 shadow-sm'} p-5 transition-all`}>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center font-bold ${slot.active ? 'bg-[#EBF5FF] text-[#1B5DF1]' : 'bg-gray-100 text-gray-400'}`}>
                  <Calendar className="w-6 h-6" />
                </div>
                <span className={`font-black text-[18px] ${slot.active ? 'text-[#0A1A3D]' : 'text-gray-400'}`}>{slot.day}</span>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={slot.active}
                  onChange={(e) => updateDay(index, 'active', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B5DF1]"></div>
              </label>
            </div>

            {slot.active && (
              <div className="flex flex-col gap-4 pt-4 border-t border-gray-100">
                
                {/* OP Hours */}
                <div className="flex flex-col gap-2">
                  <h4 className="flex items-center gap-1.5 text-[12px] font-bold text-[#1B5DF1] uppercase tracking-wider">
                    <Stethoscope className="w-3.5 h-3.5" /> Physical OP Hours
                  </h4>
                  <div className="flex items-center gap-3">
                    <input 
                      type="time" 
                      value={slot.opStartTime}
                      onChange={(e) => updateDay(index, 'opStartTime', e.target.value)}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-[12px] px-3 py-2.5 text-[14px] font-bold text-[#0A1A3D] focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/10" 
                    />
                    <span className="text-gray-400 font-bold text-[12px]">TO</span>
                    <input 
                      type="time" 
                      value={slot.opEndTime}
                      onChange={(e) => updateDay(index, 'opEndTime', e.target.value)}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-[12px] px-3 py-2.5 text-[14px] font-bold text-[#0A1A3D] focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/10" 
                    />
                  </div>
                </div>

                {/* Video Hours */}
                <div className="flex flex-col gap-2 pt-3 border-t border-gray-50">
                  <h4 className="flex items-center gap-1.5 text-[12px] font-bold text-indigo-500 uppercase tracking-wider">
                    <Video className="w-3.5 h-3.5" /> Video Consult Hours
                  </h4>
                  <div className="flex items-center gap-3">
                    <input 
                      type="time" 
                      value={slot.videoStartTime}
                      onChange={(e) => updateDay(index, 'videoStartTime', e.target.value)}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-[12px] px-3 py-2.5 text-[14px] font-bold text-[#0A1A3D] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10" 
                    />
                    <span className="text-gray-400 font-bold text-[12px]">TO</span>
                    <input 
                      type="time" 
                      value={slot.videoEndTime}
                      onChange={(e) => updateDay(index, 'videoEndTime', e.target.value)}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-[12px] px-3 py-2.5 text-[14px] font-bold text-[#0A1A3D] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10" 
                    />
                  </div>
                </div>

              </div>
            )}
          </div>
        ))}
        
        <button 
          onClick={handleSave}
          className={`mt-2 flex items-center justify-center gap-2 py-4 rounded-[16px] font-bold text-[15px] text-white shadow-[0_8px_20px_rgba(27,93,241,0.25)] transition-all active:scale-[0.98] ${saved ? 'bg-emerald-500 shadow-[0_8px_20px_rgba(16,185,129,0.25)]' : 'bg-[#1B5DF1] hover:bg-[#1B5DF1]/90'}`}
        >
          {saved ? (
            <><CheckCircle2 className="w-5 h-5" /> Saved Successfully</>
          ) : (
            <><Save className="w-5 h-5" /> Save Availability</>
          )}
        </button>
      </div>
    </div>
  )
}
