import { Video, Stethoscope, Megaphone, ChevronRight, Calendar, RefreshCw, CalendarClock, ChevronDown } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { EmptyState } from "@/components/ui/EmptyState"
import { useToast } from "@/context/ToastContext"
import { doctorApi, type DoctorPresenceStatus } from "@/services/doctorApi"

export function DoctorDashboard() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [presenceStatus, setPresenceStatus] = useState<DoctorPresenceStatus>('OFF_DUTY');
  const [isPresenceMenuOpen, setIsPresenceMenuOpen] = useState(false);
  const [isUpdatingPresence, setIsUpdatingPresence] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await doctorApi.getMyAppointments();
      setAppointments(data || []);
    } catch (err) {
      console.error("Failed to load doctor appointments:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    doctorApi.getDoctorPresence()
      .then(status => setPresenceStatus(status))
      .catch(err => console.error("Failed to load doctor presence:", err));
  }, [loadData]);

  const handlePresenceChange = async (newStatus: DoctorPresenceStatus) => {
    setIsUpdatingPresence(true);
    try {
      await doctorApi.updateDoctorPresence(newStatus);
      setPresenceStatus(newStatus);
      toast(`Presence status updated to ${newStatus.replace(/_/g, ' ')}`, "success");
    } catch (err: any) {
      toast(err.message || "Failed to update presence status", "error");
    } finally {
      setIsUpdatingPresence(false);
      setIsPresenceMenuOpen(false);
    }
  };

  // Normalized appointments
  const normalizedAppointments = (appointments || []).map(a => ({
    id: a.id || a.appointmentId,
    mqId: (a.id || a.appointmentId || '').slice(0, 8).toUpperCase() || 'OP',
    name: a.patientName || a.name || 'Patient',
    age: a.patientAge ?? a.age ?? '--',
    gender: a.patientGender || a.gender || 'Unknown',
    time: a.slotTime || a.timeSlot || a.time || '10:00 AM',
    period: (a.slotTime || a.timeSlot || a.time || '').toUpperCase().includes('PM') ? 'PM' : 'AM',
    type: a.diseaseName || a.opType || 'General OP',
    category: (a.opType || '').toLowerCase().includes('video') ? 'VIDEO' : 'OP',
    status: a.status || 'WAITING',
    date: a.date
  }));

  // Filter today's appointments
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = normalizedAppointments.filter(a => (a.date || '').startsWith(todayStr));
  const upcomingAppts = normalizedAppointments
    .filter(a => (a.date || '') > todayStr && a.status !== 'CANCELLED')
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const [scheduleTab, setScheduleTab] = useState<'today' | 'upcoming'>('today');

  useEffect(() => {
    if (todayAppts.length === 0 && upcomingAppts.length > 0) {
      setScheduleTab('upcoming');
    }
  }, [todayAppts.length, upcomingAppts.length]);

  // Current / next patient
  const inConsult = todayAppts.find(a => a.status === 'IN_CONSULTATION');
  const waitingFirst = todayAppts.find(a => a.status === 'WAITING' || a.status === 'PENDING');
  const nextPatient = inConsult || waitingFirst || null;
  const nextUpcoming = upcomingAppts[0] || null;

  // Stats
  const todayOPsCount = todayAppts.length;
  const pendingOPsCount = todayAppts.filter(a => a.status === 'WAITING' || a.status === 'PENDING' || a.status === 'IN_CONSULTATION').length;
  const completedCount = todayAppts.filter(a => a.status === 'COMPLETED').length;
  const videoCallsCount = todayAppts.filter(a => a.category === 'VIDEO').length;

  const todaySchedule = todayAppts.slice(0, 10);
  const displayedSchedule = scheduleTab === 'today' ? todaySchedule : upcomingAppts.slice(0, 10);
  const upcomingVideos = todayAppts.filter(a => a.category === 'VIDEO');

  const formatScheduleDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  const getStatusStyle = (status: string, category: string) => {
    if (category === 'VIDEO') return 'bg-indigo-50 text-indigo-600';
    switch (status) {
      case 'WAITING':
      case 'PENDING':
        return 'bg-[#EBF5FF] text-[#1B5DF1]';
      case 'UPCOMING':
        return 'bg-gray-100 text-gray-600';
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto md:max-w-none md:p-4 pb-12 bg-[#F7F8FA] min-h-full px-4 pt-4">
      
      {/* Compact Header Section with Presence Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-[#0A1A3D] text-[20px] font-black tracking-tight">
              Welcome back
            </h1>
            <span className="bg-[#EBF5FF] text-[#1B5DF1] text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              DOCTOR
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Presence Status Selector */}
          <div className="relative">
            <button
              onClick={() => setIsPresenceMenuOpen(!isPresenceMenuOpen)}
              disabled={isUpdatingPresence}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all active:scale-95 shadow-sm",
                presenceStatus === 'AVAILABLE_IN_OPD' ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" :
                presenceStatus === 'ON_BREAK' ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" :
                presenceStatus === 'IN_SURGERY' ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100" :
                "bg-gray-50 text-gray-600 border-border hover:bg-gray-100"
              )}
            >
              <span className={cn(
                "w-2 h-2 rounded-full",
                presenceStatus === 'AVAILABLE_IN_OPD' ? "bg-emerald-500 animate-pulse" :
                presenceStatus === 'ON_BREAK' ? "bg-amber-500" :
                presenceStatus === 'IN_SURGERY' ? "bg-indigo-500" :
                "bg-gray-400"
              )} />
              <span>
                {presenceStatus === 'AVAILABLE_IN_OPD' ? "In OPD" :
                 presenceStatus === 'ON_BREAK' ? "On Break" :
                 presenceStatus === 'IN_SURGERY' ? "In Surgery" :
                 "Off Duty"}
              </span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {isPresenceMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-44 bg-surface rounded-2xl shadow-xl border border-border py-1.5 z-50 overflow-hidden">
                {[
                  { status: 'AVAILABLE_IN_OPD', label: 'Available in OPD', color: 'bg-emerald-500' },
                  { status: 'ON_BREAK', label: 'On Break', color: 'bg-amber-500' },
                  { status: 'IN_SURGERY', label: 'In Surgery', color: 'bg-indigo-500' },
                  { status: 'OFF_DUTY', label: 'Off Duty', color: 'bg-gray-400' },
                ].map(opt => (
                  <button
                    key={opt.status}
                    onClick={() => handlePresenceChange(opt.status as DoctorPresenceStatus)}
                    className={cn(
                      "w-full text-left px-3.5 py-2.5 text-[12px] font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors",
                      presenceStatus === opt.status ? "text-[#1B5DF1] bg-[#EBF5FF]" : "text-[#0A1A3D]"
                    )}
                  >
                    <span className={cn("w-2 h-2 rounded-full", opt.color)} />
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2 rounded-xl bg-surface border border-border shadow-sm text-muted hover:text-[#1B5DF1] hover:border-[#1B5DF1]/30 transition-all active:scale-95 disabled:opacity-50"
            title="Refresh appointments"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin text-[#1B5DF1]")} />
          </button>
        </div>
      </div>

      {/* Doctor Availability Configuration Quick Action */}
      <div 
        onClick={() => navigate('/doctor/availability')}
        className="bg-surface border border-blue-100/80 hover:border-[#1B5DF1]/40 rounded-[20px] p-4 flex items-center justify-between cursor-pointer shadow-sm hover:shadow transition-all active:scale-[0.99]"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#EBF5FF] flex items-center justify-center shrink-0 text-[#1B5DF1]">
            <CalendarClock className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-[#0A1A3D] font-bold text-[15px]">Consultation Hours & Availability</h3>
            <p className="text-muted text-[12px] font-medium">Set your weekly schedule and slot durations</p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
          <ChevronRight className="w-4 h-4 text-muted/70" />
        </div>
      </div>

      {/* Current / Next Patient Contextual Card */}
      <div className="bg-gradient-to-br from-[#1B5DF1] to-[#1244B6] rounded-[24px] p-5 text-white shadow-[0_8px_24px_rgba(27,93,241,0.25)] flex flex-col gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-surface/10 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <span className="bg-surface/20 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest border border-white/10">
            {nextPatient ? (nextPatient.status === 'IN_CONSULTATION' ? 'NOW CONSULTING' : 'NEXT PATIENT TODAY') : nextUpcoming ? 'NEXT UPCOMING APPOINTMENT' : 'CONSULTATION DESK'}
          </span>
        </div>

        {nextPatient ? (
          <>
            <div className="relative z-10 flex flex-col gap-1">
              <h2 className="text-[22px] font-black tracking-tight text-white">{nextPatient.name}</h2>
              <div className="flex items-center gap-2 text-[13px] text-[#EBF5FF]/90 font-medium">
                <span>{nextPatient.age} yrs</span>
                <span className="w-1 h-1 rounded-full bg-surface/50"></span>
                <span>{nextPatient.gender}</span>
                <span className="w-1 h-1 rounded-full bg-surface/50"></span>
                <span>ID {nextPatient.mqId}</span>
              </div>
              <p className="text-[#EBF5FF] text-[13px] font-semibold mt-1">
                {nextPatient.time} · {nextPatient.type}
              </p>
            </div>

            <div className="relative z-10 flex gap-3 mt-2">
              <button
                onClick={() => navigate('/patients/' + (nextPatient.id || nextPatient.mqId))}
                className="flex-1 bg-surface/10 hover:bg-surface/20 border border-white/20 text-white font-bold py-3 rounded-[14px] transition-all active:scale-[0.98] text-[14px]"
              >
                Open Patient
              </button>
              <button
                onClick={() => navigate('/doctor/ops')}
                className="flex-1 bg-surface text-[#1B5DF1] font-bold py-3 rounded-[14px] shadow-sm transition-all active:scale-[0.98] text-[14px]"
              >
                Start Consult
              </button>
            </div>
          </>
        ) : nextUpcoming ? (
          <>
            <div className="relative z-10 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h2 className="text-[22px] font-black tracking-tight text-white">{nextUpcoming.name}</h2>
                <span className="bg-surface/20 text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
                  {formatScheduleDate(nextUpcoming.date)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[13px] text-[#EBF5FF]/90 font-medium">
                <span>{nextUpcoming.age} yrs</span>
                <span className="w-1 h-1 rounded-full bg-surface/50"></span>
                <span>{nextUpcoming.gender}</span>
                <span className="w-1 h-1 rounded-full bg-surface/50"></span>
                <span>ID {nextUpcoming.mqId}</span>
              </div>
              <p className="text-[#EBF5FF] text-[13px] font-semibold mt-1">
                {nextUpcoming.time} · {nextUpcoming.type}
              </p>
            </div>

            <div className="relative z-10 flex gap-3 mt-2">
              <button
                onClick={() => navigate('/patients/' + (nextUpcoming.id || nextUpcoming.mqId))}
                className="flex-1 bg-surface/10 hover:bg-surface/20 border border-white/20 text-white font-bold py-3 rounded-[14px] transition-all active:scale-[0.98] text-[14px]"
              >
                Open Patient
              </button>
              <button
                onClick={() => navigate('/doctor/ops')}
                className="flex-1 bg-surface text-[#1B5DF1] font-bold py-3 rounded-[14px] shadow-sm transition-all active:scale-[0.98] text-[14px]"
              >
                View in Schedule
              </button>
            </div>
          </>
        ) : (
          <div className="relative z-10 flex flex-col gap-1 py-2">
            <h2 className="text-[22px] font-black tracking-tight text-white">
              {isLoading ? "Loading..." : "No Active Consult"}
            </h2>
            <p className="text-[#EBF5FF]/90 text-[13px] font-medium">
              {isLoading ? "Fetching current consultations..." : "No patient currently scheduled or waiting."}
            </p>
          </div>
        )}
      </div>

      {/* Today's Overview (Grid) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface rounded-[20px] p-4 flex flex-col gap-1 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-border">
          <div className="flex items-baseline gap-2">
            <span className="text-[24px] font-black text-[#0A1A3D]">{isLoading ? "..." : todayOPsCount}</span>
            {upcomingAppts.length > 0 && (
              <span className="text-[10px] font-bold text-[#1B5DF1] bg-[#EBF5FF] px-2 py-0.5 rounded-full">
                +{upcomingAppts.length} upcoming
              </span>
            )}
          </div>
          <span className="text-[12px] font-bold text-muted">Today's OPs</span>
        </div>
        <div className="bg-surface rounded-[20px] p-4 flex flex-col gap-1 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-border">
          <span className="text-[24px] font-black text-[#1B5DF1]">{isLoading ? "..." : pendingOPsCount}</span>
          <span className="text-[12px] font-bold text-[#1B5DF1]">Pending OPs</span>
        </div>
        <div className="bg-surface rounded-[20px] p-4 flex flex-col gap-1 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-border">
          <span className="text-[24px] font-black text-emerald-500">{isLoading ? "..." : completedCount}</span>
          <span className="text-[12px] font-bold text-muted">Completed</span>
        </div>
        <div className="bg-surface rounded-[20px] p-4 flex flex-col gap-1 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-border">
          <span className="text-[24px] font-black text-indigo-500">{isLoading ? "..." : videoCallsCount}</span>
          <span className="text-[12px] font-bold text-muted">Video Calls</span>
        </div>
      </div>

      {/* Book Marketing Tile */}
      <div 
        onClick={() => navigate('/book-marketing')}
        className="mt-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[20px] p-6 md:p-8 flex items-center justify-between cursor-pointer shadow-[0_4px_12px_rgba(99,102,241,0.2)] hover:shadow-[0_4px_16px_rgba(99,102,241,0.3)] transition-all active:scale-[0.98] min-h-[110px]"
      >
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-surface/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
            <Megaphone className="w-7 h-7 md:w-8 md:h-8 text-white" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h3 className="text-white font-bold text-[18px] md:text-[20px]">Book Marketing</h3>
            <p className="text-indigo-100 text-[13px] md:text-[14px] font-medium leading-tight max-w-[200px]">Request admin for marketing support</p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-surface/10 flex items-center justify-center shrink-0">
          <ChevronRight className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Schedule Feed with Today vs Upcoming Toggle */}
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setScheduleTab('today')}
              className={`text-[14px] font-bold px-3 py-1.5 rounded-xl transition-all ${
                scheduleTab === 'today'
                  ? 'bg-[#0A1A3D] text-white shadow-sm'
                  : 'text-[#667085] hover:text-[#0A1A3D] bg-surface border border-border'
              }`}
            >
              Today ({todaySchedule.length})
            </button>
            <button
              onClick={() => setScheduleTab('upcoming')}
              className={`text-[14px] font-bold px-3 py-1.5 rounded-xl transition-all ${
                scheduleTab === 'upcoming'
                  ? 'bg-[#1B5DF1] text-white shadow-sm'
                  : 'text-[#667085] hover:text-[#0A1A3D] bg-surface border border-border'
              }`}
            >
              Upcoming ({upcomingAppts.length})
            </button>
          </div>
          <button 
            onClick={() => navigate('/doctor/ops')}
            className="text-[#1B5DF1] text-[13px] font-bold hover:underline"
          >
            View All
          </button>
        </div>
        
        <div className="flex flex-col bg-surface rounded-[24px] border border-border shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
          {displayedSchedule.length === 0 ? (
            <EmptyState 
              icon={Calendar} 
              title={scheduleTab === 'today' ? "No Consultations Today" : "No Upcoming Consultations"} 
              description={
                scheduleTab === 'today' 
                  ? upcomingAppts.length > 0 
                    ? `No consultations today. You have ${upcomingAppts.length} upcoming consultation(s).` 
                    : "Today's schedule will appear here once booked."
                  : "No upcoming consultations scheduled."
              } 
            />
          ) : displayedSchedule.map((patient, index) => (
            <div 
              key={patient.id} 
              onClick={() => navigate(patient.category === 'VIDEO' ? '/doctor/video-consultations' : '/doctor/ops')}
              className={cn(
                "p-4 flex items-start gap-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors",
                index !== displayedSchedule.length - 1 ? "border-b border-border" : ""
              )}
            >
              <div className="flex flex-col items-center min-w-[65px] pt-0.5">
                <span className="text-[14px] font-black text-[#0A1A3D]">{patient.time}</span>
                <span className="text-[10px] font-bold text-[#667085]">{patient.period}</span>
                {patient.date && (
                  <span className="text-[9px] font-bold text-[#1B5DF1] bg-[#EBF5FF] px-1.5 py-0.5 rounded mt-1 text-center whitespace-nowrap">
                    {formatScheduleDate(patient.date)}
                  </span>
                )}
              </div>
              
              <div className="flex flex-col flex-1">
                <span className="font-bold text-[#0A1A3D] text-[15px]">{patient.name}</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[12px] font-semibold text-muted flex items-center gap-1">
                    {patient.category === 'VIDEO' ? <Video className="w-3.5 h-3.5 text-indigo-500" /> : <Stethoscope className="w-3.5 h-3.5 text-[#1B5DF1]" />}
                    {patient.category}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span className="text-[12px] font-medium text-muted">{patient.type}</span>
                </div>
              </div>

              <div className="flex items-center">
                <span className={cn("text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md", getStatusStyle(patient.status, patient.category))}>
                  {patient.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Video Consultation Preview */}
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[17px] font-bold text-[#0A1A3D] tracking-tight">
            Video Consultations
          </h3>
          <button 
            onClick={() => navigate('/doctor/video-consultations')}
            className="text-indigo-600 text-[13px] font-bold"
          >
            View All
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {upcomingVideos.length === 0 ? (
            <EmptyState icon={Video} title="No Video Consultations" description="Upcoming video consultations will appear here once available." />
          ) : upcomingVideos.map((video) => (
            <div key={video.id} className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-[20px] flex items-center justify-between shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg shrink-0">
                  {video.name.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-black text-[#0A1A3D] flex items-center gap-1.5">
                    {video.time} <span className="text-muted/70 font-medium">·</span> {video.name}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[12px] font-medium text-muted">ID {video.mqId}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-[12px] font-medium text-muted">{video.type}</span>
                  </div>
                  <span className={cn(
                    "text-[12px] font-bold mt-1.5",
                    video.status.includes('Starts') ? "text-indigo-600" : "text-muted"
                  )}>
                    {video.status}
                  </span>
                </div>
              </div>

              {video.status.includes('Starts') && (
                <button 
                  onClick={() => navigate('/doctor/video-consultations')}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[13px] font-bold shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
                >
                  Join
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
