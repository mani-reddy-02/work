import { Save, Calendar, Video, Stethoscope, ArrowLeft } from "lucide-react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/context/ToastContext"
import { doctorApi, type DayAvailability } from "@/services/doctorApi"

export function ClinicSchedule() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [schedule, setSchedule] = useState<DayAvailability[]>([
    { day: "Monday", active: false, opStartTime: "09:00", opEndTime: "13:00", videoStartTime: "14:00", videoEndTime: "18:00" },
    { day: "Tuesday", active: false, opStartTime: "09:00", opEndTime: "13:00", videoStartTime: "14:00", videoEndTime: "18:00" },
    { day: "Wednesday", active: false, opStartTime: "09:00", opEndTime: "13:00", videoStartTime: "14:00", videoEndTime: "18:00" },
    { day: "Thursday", active: false, opStartTime: "09:00", opEndTime: "13:00", videoStartTime: "14:00", videoEndTime: "18:00" },
    { day: "Friday", active: false, opStartTime: "09:00", opEndTime: "13:00", videoStartTime: "14:00", videoEndTime: "18:00" },
    { day: "Saturday", active: false, opStartTime: "09:00", opEndTime: "13:00", videoStartTime: "14:00", videoEndTime: "18:00" },
    { day: "Sunday", active: false, opStartTime: "09:00", opEndTime: "13:00", videoStartTime: "14:00", videoEndTime: "18:00" },
  ]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    doctorApi.getAvailability()
      .then(data => {
        if (data && data.length > 0) {
          setSchedule(data);
        }
      })
      .catch(err => {
        console.error("Failed to load doctor availability:", err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const updateDay = (index: number, field: keyof DayAvailability, value: any) => {
    const newSchedule = [...schedule];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setSchedule(newSchedule);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await doctorApi.updateAvailability(schedule);
      toast("Working schedule saved successfully!", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to save availability', "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col bg-gray-50/30 min-h-screen pb-24 transition-colors">
      
      {/* Top Header */}
      <div className="sticky top-0 z-30 pt-4 pb-3 px-4 sm:px-6 flex items-center justify-between bg-surface/95 backdrop-blur-xl border-b border-border shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 rounded-xl text-muted hover:text-[#0A1A3D] hover:bg-gray-100 transition-colors cursor-pointer"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-[#0A1A3D]" />
          </button>
          <div>
            <h1 className="text-[19px] font-black text-[#0A1A3D] tracking-tight">Clinic Schedule</h1>
            <p className="text-[12px] text-muted font-medium">Set your working hours for physical and remote consultations</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1B5DF1] hover:bg-[#1255b8] active:scale-95 text-white text-sm font-bold rounded-xl shadow-sm transition-all disabled:opacity-60 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? "Saving..." : "Save Schedule"}</span>
        </button>
      </div>

      {/* Main Content - Centered, comfortable max-width for both Desktop and Mobile */}
      <div className="p-4 sm:p-6 flex flex-col gap-4 max-w-2xl mx-auto w-full">
        
        {schedule.map((slot, index) => (
          <div 
            key={slot.day} 
            className={`bg-surface rounded-[24px] border ${slot.active ? 'border-[#1B5DF1]/20 shadow-[0_4px_20px_rgba(27,93,241,0.05)]' : 'border-border shadow-xs'} p-5 transition-all`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center font-bold ${slot.active ? 'bg-[#EBF5FF] text-[#1B5DF1]' : 'bg-gray-100 text-muted/70'}`}>
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <span className={`font-black text-[18px] block ${slot.active ? 'text-[#0A1A3D]' : 'text-muted/70'}`}>{slot.day}</span>
                  {!slot.active && (
                    <span className="text-[11px] font-semibold text-muted/60">Day off · Unavailable</span>
                  )}
                </div>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={slot.active}
                  onChange={(e) => updateDay(index, 'active', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B5DF1]"></div>
              </label>
            </div>

            {slot.active && (
              <div className="flex flex-col gap-4 pt-4 border-t border-border">
                
                {/* Physical OP Hours */}
                <div className="flex flex-col gap-2">
                  <h4 className="flex items-center gap-1.5 text-[12px] font-bold text-[#1B5DF1] uppercase tracking-wider">
                    <Stethoscope className="w-3.5 h-3.5" /> Physical OP Hours
                  </h4>
                  <div className="flex items-center gap-3">
                    <input 
                      type="time" 
                      value={slot.opStartTime}
                      onChange={(e) => updateDay(index, 'opStartTime', e.target.value)}
                      className="flex-1 bg-gray-50 border border-border rounded-[12px] px-3 py-2.5 text-[14px] font-bold text-[#0A1A3D] focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/10" 
                    />
                    <span className="text-muted/70 font-bold text-[12px]">TO</span>
                    <input 
                      type="time" 
                      value={slot.opEndTime}
                      onChange={(e) => updateDay(index, 'opEndTime', e.target.value)}
                      className="flex-1 bg-gray-50 border border-border rounded-[12px] px-3 py-2.5 text-[14px] font-bold text-[#0A1A3D] focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/10" 
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
                      className="flex-1 bg-gray-50 border border-border rounded-[12px] px-3 py-2.5 text-[14px] font-bold text-[#0A1A3D] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10" 
                    />
                    <span className="text-muted/70 font-bold text-[12px]">TO</span>
                    <input 
                      type="time" 
                      value={slot.videoEndTime}
                      onChange={(e) => updateDay(index, 'videoEndTime', e.target.value)}
                      className="flex-1 bg-gray-50 border border-border rounded-[12px] px-3 py-2.5 text-[14px] font-bold text-[#0A1A3D] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10" 
                    />
                  </div>
                </div>

              </div>
            )}
          </div>
        ))}

        {/* Bottom Save Button */}
        <div className="pt-2 pb-6">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-[16px] font-bold text-[15px] text-white shadow-[0_8px_20px_rgba(27,93,241,0.25)] transition-all active:scale-[0.98] bg-[#1B5DF1] hover:bg-[#1B5DF1]/90 disabled:opacity-60 cursor-pointer"
          >
            <Save className="w-5 h-5" />
            <span>{isSaving ? "Saving..." : "Save Schedule"}</span>
          </button>
        </div>

      </div>

    </div>
  )
}
