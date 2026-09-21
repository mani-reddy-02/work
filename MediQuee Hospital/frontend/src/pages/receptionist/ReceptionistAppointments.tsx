import { Search, Filter, Calendar } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Skeleton } from "@/components/ui/Skeleton"
import { EmptyState } from "@/components/ui/EmptyState"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"
import { receptionistApi } from "@/services/receptionistApi"

export function ReceptionistAppointments() {
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedDate, setSelectedDate] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [departmentsList, setDepartmentsList] = useState<{ id: string; name: string }[]>([]);
  const [queue, setQueue] = useState<any[]>([]);

  const navigate = useNavigate();

  // Dynamic 14-day date strip
  const today = new Date();
  const todayIso = today.toISOString().split('T')[0];
  const dates = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    const dayStr = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const dateStr = `${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}`;
    return { iso, date: dateStr, day: dayStr };
  });

  const fetchData = useCallback(async (targetDate: string) => {
    setIsLoading(true);
    try {
      const filters: any = {};
      if (targetDate === 'upcoming') {
        filters.range = 'upcoming';
      } else {
        filters.date = targetDate;
      }

      const [depts, queueData] = await Promise.all([
        receptionistApi.getDepartments().catch(() => []),
        receptionistApi.getQueue(filters).catch(() => [])
      ]);
      setDepartmentsList(depts);
      setQueue(queueData);
    } catch (err) {
      console.error("Error loading appointments:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate, fetchData]);

  const departments: { id: string; label: string; ops: string }[] = [
    { id: 'All', label: 'All Depts', ops: String(queue.length) },
    ...departmentsList.map(d => ({
      id: d.id,
      label: d.name,
      ops: String(queue.filter(q => q.departmentId === d.id).length)
    }))
  ];

  const appointmentsList = queue.map(q => ({
    id: q.id,
    token: q.token,
    patientName: q.patientName,
    time: q.slotTime || q.timeSlot || (q.arrivalTime ? new Date(q.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 AM'),
    slotTime: q.slotTime || q.timeSlot,
    date: q.arrivalTime ? new Date(q.arrivalTime).toISOString().split('T')[0] : '',
    department: q.departmentName,
    departmentId: q.departmentId,
    doctor: q.doctorName || 'Not Assigned',
    status: q.status
  }));

  const filteredAppointments = appointmentsList.filter(apt =>
    (selectedDept === 'All' || apt.departmentId === selectedDept || apt.department === selectedDept) &&
    (apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || apt.token.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-gray-100 text-foreground/80';
      case 'Checked In': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Waiting':
      case 'WAITING': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'In Consultation':
      case 'IN_CONSULTATION': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Completed':
      case 'COMPLETED': return 'bg-gray-900 text-white';
      case 'Cancelled':
      case 'CANCELLED': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-foreground/80';
    }
  };

  return (
    <div className="flex flex-col bg-gray-50/30 min-h-screen pb-[120px]">
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-xl pt-6 pb-4 px-4 flex flex-col gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] border-b border-border">
        <div className="flex flex-col gap-4">
          <h2 className="text-[22px] font-black text-[#0A1A3D] tracking-tight">Appointments</h2>
          
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted/70 group-focus-within:text-[#1B5DF1] transition-colors">
              <Search className="w-4 h-4" />
            </div>
            <input 
              type="text" 
              placeholder="Search patient or token..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-border/60 rounded-2xl outline-none focus:border-[#1B5DF1] focus:bg-surface focus:ring-4 focus:ring-[#1B5DF1]/10 transition-all text-[15px] font-medium text-[#172033] placeholder:text-muted/70"
            />
            <button className="absolute inset-y-0 right-4 flex items-center text-[#1B5DF1]">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Date Strip */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSelectedDate('upcoming')}
            title="View all upcoming appointments"
            className="flex items-center justify-center w-[52px] h-[52px] bg-surface border border-border text-[#0A1A3D] rounded-2xl flex-shrink-0 active:scale-95 transition-transform shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
          >
            <Calendar className="w-6 h-6 text-[#1B5DF1]" />
          </button>
          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide py-1 flex-1">
            <button 
              onClick={() => setSelectedDate('upcoming')}
              className={cn(
                "flex flex-col items-center justify-center min-w-[76px] h-[52px] rounded-2xl flex-shrink-0 transition-all active:scale-95 px-3 border",
                selectedDate === 'upcoming' 
                  ? "bg-[#1B5DF1] text-white shadow-lg shadow-[#1B5DF1]/30 border-[#1B5DF1]" 
                  : "bg-surface border-border text-[#172033] hover:bg-gray-50"
              )}
            >
              <span className={cn("text-[13px] font-bold leading-tight", selectedDate === 'upcoming' ? "text-white" : "text-[#172033]")}>Upcoming</span>
              <span className={cn("text-[10px] font-semibold leading-tight", selectedDate === 'upcoming' ? "text-[#EBF5FF]" : "text-[#98A2B3]")}>All Dates</span>
            </button>

            {dates.map((d) => {
              const isActive = selectedDate === d.iso;
              return (
                <button 
                  key={d.iso}
                  onClick={() => setSelectedDate(d.iso)}
                  className={cn(
                    "flex flex-col items-center justify-center min-w-[56px] h-[52px] rounded-2xl flex-shrink-0 transition-all active:scale-95 border",
                    isActive ? "bg-[#1B5DF1] text-white shadow-lg shadow-[#1B5DF1]/30 border-[#1B5DF1]" : "bg-surface border-border text-muted hover:border-gray-300"
                  )}
                >
                  <span className={cn("text-[13px] font-bold leading-tight", isActive ? "text-white" : "text-[#172033]")}>{d.date.split(' ')[0]} {d.date.split(' ')[1]}</span>
                  <span className={cn("text-[11px] font-semibold leading-tight", isActive ? "text-[#EBF5FF]" : "text-[#98A2B3]")}>{d.day}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Department Tiles */}
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
          {departments.map((dept) => {
            const isActive = selectedDept === dept.id;
            return (
              <button 
                key={dept.id}
                onClick={() => setSelectedDept(dept.id)}
                className={cn(
                  "flex flex-col gap-1 min-w-[120px] p-3 rounded-2xl flex-shrink-0 transition-all active:scale-95 text-left border",
                  isActive ? "bg-[#1B5DF1] text-white shadow-lg shadow-[#1B5DF1]/20 border-[#1B5DF1]" : "bg-surface text-[#172033] border-border/60 hover:border-gray-300"
                )}
              >
                <span className={cn("text-[13px] font-bold truncate", isActive ? "text-white" : "text-[#172033]")}>{dept.label}</span>
                <span className={cn("text-[11px] font-medium", isActive ? "text-[#EBF5FF]" : "text-[#667085]")}>{dept.ops} OPs</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col px-4 pt-5 gap-4">
        <h3 className="font-bold text-[#172033] text-[15px] px-1">{selectedDept === 'All' ? 'All Departments' : selectedDept}</h3>

        <div className="flex flex-col relative gap-3">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="skeletons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-28 rounded-2xl bg-surface border border-border" />
                ))}
              </motion.div>
            ) : filteredAppointments.length > 0 ? (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
                {filteredAppointments.map((apt) => (
                  <button 
                    key={apt.id} 
                    onClick={() => navigate('/receptionist/queue')}
                    className="flex flex-col bg-surface border border-border/60 rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] active:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14px] font-black text-[#172033]">{apt.token}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        <span className="text-[13px] font-semibold text-[#667085]">{apt.time}</span>
                        {apt.date && (
                          <span className="text-[10px] font-bold text-[#1B5DF1] bg-[#EBF5FF] px-1.5 py-0.5 rounded ml-1">
                            {apt.date}
                          </span>
                        )}
                      </div>
                      <span className={cn("px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border", getStatusColor(apt.status))}>
                        {apt.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[14px] shrink-0 border border-blue-100">
                        {apt.patientName.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[15px] font-bold text-[#172033]">{apt.patientName}</span>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[12px] font-medium text-[#667085]">
                          <span>{apt.doctor}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                          <span>{apt.department}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12">
                <EmptyState 
                  icon={Search}
                  title="No Appointments Found"
                  description="Try adjusting your filters or search query."
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
