import { useState, useEffect } from "react"
import { ArrowLeft, Clock, Calendar as CalendarIcon, Save, RefreshCw, CheckCircle2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { doctorApi, type DayAvailability } from "@/services/doctorApi"
import { useToast } from "@/context/ToastContext"
import { Skeleton } from "@/components/ui/Skeleton"

const DEFAULT_DAYS = [
  { day: "Monday", active: true, opStartTime: "09:00", opEndTime: "17:00", videoStartTime: "17:00", videoEndTime: "19:00" },
  { day: "Tuesday", active: true, opStartTime: "09:00", opEndTime: "17:00", videoStartTime: "17:00", videoEndTime: "19:00" },
  { day: "Wednesday", active: true, opStartTime: "09:00", opEndTime: "17:00", videoStartTime: "17:00", videoEndTime: "19:00" },
  { day: "Thursday", active: true, opStartTime: "09:00", opEndTime: "17:00", videoStartTime: "17:00", videoEndTime: "19:00" },
  { day: "Friday", active: true, opStartTime: "09:00", opEndTime: "17:00", videoStartTime: "17:00", videoEndTime: "19:00" },
  { day: "Saturday", active: true, opStartTime: "09:00", opEndTime: "13:00", videoStartTime: "14:00", videoEndTime: "16:00" },
  { day: "Sunday", active: false, opStartTime: "09:00", opEndTime: "13:00", videoStartTime: "14:00", videoEndTime: "16:00" },
];

export function ClinicSchedule() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [schedule, setSchedule] = useState<DayAvailability[]>(DEFAULT_DAYS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const fetchSchedule = async () => {
    setIsLoading(true);
    try {
      const data = await doctorApi.getAvailability();
      if (data && data.length > 0) {
        // Merge with full 7-day array to ensure all days present
        const merged = DEFAULT_DAYS.map((def) => {
          const found = data.find((d: DayAvailability) => d.day.toLowerCase() === def.day.toLowerCase());
          return found || def;
        });
        setSchedule(merged);
      }
    } catch (err) {
      console.error("Failed to load doctor schedule:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const toggleDay = (dayName: string) => {
    setSchedule((prev) =>
      prev.map((d) => (d.day === dayName ? { ...d, active: !d.active } : d))
    );
  };

  const handleTimeChange = (dayName: string, field: 'opStartTime' | 'opEndTime', val: string) => {
    setSchedule((prev) =>
      prev.map((d) => (d.day === dayName ? { ...d, [field]: val } : d))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await doctorApi.updateAvailability(schedule);
      toast("Clinic schedule updated successfully", "success");
    } catch (err: any) {
      console.error("Failed to save schedule:", err);
      toast(err?.message || "Failed to save schedule.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-16">
      <div className="sticky top-0 z-30 pt-4 pb-3 px-4 flex items-center justify-between bg-surface/90 backdrop-blur-xl border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-[20px] font-black text-foreground tracking-tight">Clinic Schedule</h1>
            <p className="text-xs text-muted">Weekly consultation hours</p>
          </div>
        </div>

        <button 
          onClick={fetchSchedule}
          className="p-2 text-muted hover:text-foreground rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-4 max-w-2xl mx-auto w-full">
        <div className="bg-surface rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-[#1B5DF1] flex items-center justify-center shrink-0">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Weekly OPD Hours</h2>
              <p className="text-xs text-muted font-medium">Configure operating hours for appointments</p>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="w-full h-14 rounded-xl" />
              <Skeleton className="w-full h-14 rounded-xl" />
              <Skeleton className="w-full h-14 rounded-xl" />
              <Skeleton className="w-full h-14 rounded-xl" />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {schedule.map((day, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: i * 0.03 }}
                  key={day.day} 
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all ${
                    day.active 
                      ? 'border-blue-100 dark:border-blue-900/40 bg-blue-50/20 dark:bg-blue-900/10' 
                      : 'border-border bg-muted/5 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleDay(day.day)}
                      className={`w-11 h-6 rounded-full relative shadow-inner transition-colors cursor-pointer ${
                        day.active ? 'bg-[#1B5DF1]' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${
                        day.active ? 'right-1' : 'left-1'
                      }`} />
                    </button>
                    <span className={`font-semibold text-sm ${day.active ? 'text-foreground font-bold' : 'text-muted'}`}>
                      {day.day}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2 sm:mt-0">
                    {day.active ? (
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        <Clock className="w-3.5 h-3.5 text-[#1B5DF1]" />
                        <input
                          type="time"
                          value={day.opStartTime || "09:00"}
                          onChange={(e) => handleTimeChange(day.day, 'opStartTime', e.target.value)}
                          className="bg-surface border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:border-[#1B5DF1]"
                        />
                        <span className="text-muted">to</span>
                        <input
                          type="time"
                          value={day.opEndTime || "17:00"}
                          onChange={(e) => handleTimeChange(day.day, 'opEndTime', e.target.value)}
                          className="bg-surface border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:border-[#1B5DF1]"
                        />
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-muted uppercase tracking-wider">Closed</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-[#1B5DF1] text-white py-4 rounded-xl font-bold hover:bg-[#1B5DF1]/90 shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Saving Schedule...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Save Schedule</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
