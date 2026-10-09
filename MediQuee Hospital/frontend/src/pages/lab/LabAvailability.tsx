import { Save, Calendar, FlaskConical, Home, ArrowLeft } from "lucide-react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/context/ToastContext"
import { labApi } from "@/services/labApi"

export interface LabDayAvailability {
  dayOfWeek: string;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
  homeSampleStartTime: string;
  homeSampleEndTime: string;
}

export function LabAvailability() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const defaultSchedule: LabDayAvailability[] = [
    { dayOfWeek: "Monday", isAvailable: false, startTime: "09:00", endTime: "17:00", homeSampleStartTime: "10:00", homeSampleEndTime: "16:00" },
    { dayOfWeek: "Tuesday", isAvailable: false, startTime: "09:00", endTime: "17:00", homeSampleStartTime: "10:00", homeSampleEndTime: "16:00" },
    { dayOfWeek: "Wednesday", isAvailable: false, startTime: "09:00", endTime: "17:00", homeSampleStartTime: "10:00", homeSampleEndTime: "16:00" },
    { dayOfWeek: "Thursday", isAvailable: false, startTime: "09:00", endTime: "17:00", homeSampleStartTime: "10:00", homeSampleEndTime: "16:00" },
    { dayOfWeek: "Friday", isAvailable: false, startTime: "09:00", endTime: "17:00", homeSampleStartTime: "10:00", homeSampleEndTime: "16:00" },
    { dayOfWeek: "Saturday", isAvailable: false, startTime: "09:00", endTime: "17:00", homeSampleStartTime: "10:00", homeSampleEndTime: "16:00" },
    { dayOfWeek: "Sunday", isAvailable: false, startTime: "09:00", endTime: "17:00", homeSampleStartTime: "10:00", homeSampleEndTime: "16:00" },
  ];

  const [schedule, setSchedule] = useState<LabDayAvailability[]>(defaultSchedule);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    labApi.getAvailability()
      .then(data => {
        if (data && data.length > 0) {
          // merge fetched data with default schedule structure
          const merged = defaultSchedule.map(def => {
            const found = data.find((d: any) => d.dayOfWeek === def.dayOfWeek);
            return found ? { ...def, ...found } : def;
          });
          setSchedule(merged);
        }
      })
      .catch(err => {
        console.error("Failed to load lab availability:", err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const updateDay = (index: number, field: keyof LabDayAvailability, value: any) => {
    const newSchedule = [...schedule];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setSchedule(newSchedule);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await labApi.updateAvailability(schedule);
      toast("Working schedule saved successfully!", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to save availability', "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col bg-[#F7F8FA] min-h-full pb-20 max-w-7xl mx-auto w-full">
      
      {/* Header Section */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-xl pt-4 md:pt-5 pb-4 px-4 md:px-6 flex flex-col gap-4 border-b border-border shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[#0A1A3D] hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[17px] font-bold text-[#0A1A3D] tracking-tight">Availability</h1>
          <div className="w-9 h-9" /> {/* Spacer */}
        </div>
        <p className="text-[13px] font-medium text-muted">Set your working hours for physical lab tests and home sample collections.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 md:p-6">
        {schedule.map((slot, index) => (
          <div key={slot.dayOfWeek} className={`bg-surface rounded-[24px] border ${slot.isAvailable ? 'border-[#1B5DF1]/20 shadow-[0_4px_20px_rgba(27,93,241,0.05)]' : 'border-border shadow-sm'} p-5 transition-all`}>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center font-bold ${slot.isAvailable ? 'bg-[#EBF5FF] text-[#1B5DF1]' : 'bg-gray-100 text-muted/70'}`}>
                  <Calendar className="w-6 h-6" />
                </div>
                <span className={`font-black text-[18px] ${slot.isAvailable ? 'text-[#0A1A3D]' : 'text-muted/70'}`}>{slot.dayOfWeek}</span>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={slot.isAvailable}
                  onChange={(e) => updateDay(index, 'isAvailable', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B5DF1]"></div>
              </label>
            </div>

            {slot.isAvailable && (
              <div className="flex flex-col gap-4 pt-4 border-t border-border">
                
                {/* Lab Hours */}
                <div className="flex flex-col gap-2">
                  <h4 className="flex items-center gap-1.5 text-[12px] font-bold text-[#1B5DF1] uppercase tracking-wider">
                    <FlaskConical className="w-3.5 h-3.5" /> Physical Lab Hours
                  </h4>
                  <div className="flex items-center gap-3">
                    <input 
                      type="time" 
                      value={slot.startTime}
                      onChange={(e) => updateDay(index, 'startTime', e.target.value)}
                      className="flex-1 bg-gray-50 border border-border rounded-[12px] px-3 py-2.5 text-[14px] font-bold text-[#0A1A3D] focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/10" 
                    />
                    <span className="text-muted/70 font-bold text-[12px]">TO</span>
                    <input 
                      type="time" 
                      value={slot.endTime}
                      onChange={(e) => updateDay(index, 'endTime', e.target.value)}
                      className="flex-1 bg-gray-50 border border-border rounded-[12px] px-3 py-2.5 text-[14px] font-bold text-[#0A1A3D] focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/10" 
                    />
                  </div>
                </div>

                {/* Home Sample Hours */}
                <div className="flex flex-col gap-2 pt-3 border-t border-gray-50">
                  <h4 className="flex items-center gap-1.5 text-[12px] font-bold text-indigo-500 uppercase tracking-wider">
                    <Home className="w-3.5 h-3.5" /> Home Sample Hours
                  </h4>
                  <div className="flex items-center gap-3">
                    <input 
                      type="time" 
                      value={slot.homeSampleStartTime}
                      onChange={(e) => updateDay(index, 'homeSampleStartTime', e.target.value)}
                      className="flex-1 bg-gray-50 border border-border rounded-[12px] px-3 py-2.5 text-[14px] font-bold text-[#0A1A3D] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10" 
                    />
                    <span className="text-muted/70 font-bold text-[12px]">TO</span>
                    <input 
                      type="time" 
                      value={slot.homeSampleEndTime}
                      onChange={(e) => updateDay(index, 'homeSampleEndTime', e.target.value)}
                      className="flex-1 bg-gray-50 border border-border rounded-[12px] px-3 py-2.5 text-[14px] font-bold text-[#0A1A3D] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10" 
                    />
                  </div>
                </div>

              </div>
            )}
          </div>
        ))}
        
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="mt-2 flex items-center justify-center gap-2 py-4 rounded-[16px] font-bold text-[15px] text-white shadow-[0_8px_20px_rgba(27,93,241,0.25)] transition-all active:scale-[0.98] bg-[#1B5DF1] hover:bg-[#1B5DF1]/90 disabled:opacity-60"
        >
          <Save className="w-5 h-5" /> {isSaving ? "Saving..." : "Save Availability"}
        </button>
      </div>
    </div>
  )
}
