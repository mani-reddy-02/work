import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  UserPlus, Clock, ArrowRight, Building, CheckCircle2, 
  Activity, PlaySquare, RefreshCw, Play, Check, Phone, 
  Stethoscope, Sparkles, AlertCircle, Copy, CheckCheck,
  Calendar, Layers, User, HeartHandshake
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { EmptyState } from "@/components/ui/EmptyState"
import { Skeleton } from "@/components/ui/Skeleton"
import { cn } from "@/lib/utils"
import { receptionistApi, type QueueEntry } from "@/services/receptionistApi"
import { nurseApi } from "@/services/nurseApi"
import { DoctorStatusControlPanel } from "@/components/doctor/DoctorStatusControlPanel"
import { useTranslation } from "react-i18next"
import { useToast } from "@/context/ToastContext"

export function ReceptionistDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [nursingPendingCount, setNursingPendingCount] = useState<number>(0);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);
  const lastFetchRef = useRef<number>(0);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const [depts, queueData, nursingData] = await Promise.all([
        receptionistApi.getDepartments().catch(() => []),
        receptionistApi.getQueue().catch(() => []),
        nurseApi.getHospitalBookings({ status: 'PENDING_ASSIGNMENT', date: 'upcoming' }).catch(() => []),
      ]);
      const opOnly = (queueData || []).filter(q => {
        const type = (q.opType || '').toLowerCase();
        return !type.includes('video') && !type.includes('online');
      });
      setDepartments(depts);
      setQueue(opOnly);
      const pendingNursing = (nursingData || []).filter((b: any) => !b.nurseId && b.status !== 'CANCELLED' && b.status !== 'COMPLETED');
      setNursingPendingCount(pendingNursing.length);
    } catch (err) {
      console.error("Error loading receptionist dashboard:", err);
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    lastFetchRef.current = Date.now();

    // 12-second gentle live polling
    const timer = setInterval(() => {
      loadData(true);
      lastFetchRef.current = Date.now();
    }, 12000);

    const handleThrottledSync = () => {
      if (Date.now() - lastFetchRef.current > 8000) {
        loadData(true);
        lastFetchRef.current = Date.now();
      }
    };

    const handleFocus = () => handleThrottledSync();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        handleThrottledSync();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadData]);

  // Derived counts for entire clinic
  const waitingCount = queue.filter(q => q.status === 'WAITING' || q.status === 'ARRIVED').length;
  const inConsultCount = queue.filter(q => q.status === 'IN_CONSULTATION').length;
  const completedCount = queue.filter(q => q.status === 'COMPLETED').length;

  const stats = [
    { title: t('status_waiting', 'Waiting'), value: loading ? "—" : waitingCount, icon: Clock, color: "text-orange-600 bg-orange-50 border-orange-100" },
    { title: t('status_in_consultation', 'In Consultation'), value: loading ? "—" : inConsultCount, icon: PlaySquare, color: "text-[#1769E0] bg-[#EBF5FF] border-[#1769E0]/20" },
    { title: t('status_completed', 'Completed'), value: loading ? "—" : completedCount, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
  ];

  // Filtered queue for Live Queue Control Tile
  const filteredQueue = useMemo(() => {
    if (selectedDeptId === 'all') return queue;
    return queue.filter(q => q.departmentId === selectedDeptId);
  }, [queue, selectedDeptId]);

  // Active in consultation and waiting patients for the selected filter
  const activeConsultations = useMemo(() => {
    return filteredQueue.filter(q => q.status === 'IN_CONSULTATION');
  }, [filteredQueue]);

  const waitingInQueue = useMemo(() => {
    return filteredQueue.filter(q => q.status === 'WAITING' || q.status === 'ARRIVED');
  }, [filteredQueue]);

  // Status transition handler (Start Consultation or Mark Completed)
  const handleStatusTransition = async (
    entry: QueueEntry, 
    newStatus: 'IN_CONSULTATION' | 'COMPLETED'
  ) => {
    if (actionLoadingId) return;
    setActionLoadingId(entry.id);

    // 1. Optimistic instant local state update
    setQueue(prevQueue =>
      prevQueue.map(item =>
        item.id === entry.id ? { ...item, status: newStatus } : item
      )
    );

    try {
      await receptionistApi.updateQueueStatus(entry.id, newStatus);
      if (newStatus === 'IN_CONSULTATION') {
        toast(`Consultation started for ${entry.patientName} with Dr. ${entry.doctorName || 'Doctor'}`, 'success');
      } else {
        toast(`Consultation marked completed for ${entry.patientName}`, 'success');
      }
    } catch (err: any) {
      console.error('Failed to update OP queue status:', err);
      toast(err?.message || 'Failed to update OP status', 'error');
      // Rollback on failure
      loadData(true);
    } finally {
      setActionLoadingId(null);
      loadData(true);
    }
  };

  const copyPhoneNumber = (id: string, phone?: string) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhoneId(id);
    toast(`Phone number ${phone} copied`, 'info');
    setTimeout(() => setCopiedPhoneId(null), 2000);
  };

  // Helper to format patient demographic info safely
  const formatDemographics = (age?: number, gender?: string) => {
    const parts: string[] = [];
    if (age && !isNaN(Number(age)) && Number(age) > 0) {
      parts.push(`${age} Yrs`);
    }
    if (gender && gender !== 'Unknown' && gender !== 'null' && gender.trim() !== '') {
      parts.push(gender);
    }
    return parts.length > 0 ? parts.join(' · ') : null;
  };

  const departmentQueues = departments.map(dept => {
    const deptItems = queue.filter(q => q.departmentId === dept.id);
    const waiting = deptItems.filter(q => q.status === 'WAITING' || q.status === 'ARRIVED');
    const inConsult = deptItems.filter(q => q.status === 'IN_CONSULTATION').length;
    const nextOp = waiting.length > 0 
      ? `${waiting[0].token}${waiting[0].patientName ? ` (${waiting[0].patientName.split(' ')[0]})` : ''}` 
      : "None";

    return {
      id: dept.id,
      name: dept.name,
      inConsult,
      waiting: waiting.length,
      nextOp,
    };
  });

  const getRushLevel = (count: number) => {
    if (count === 0) return { label: "Calm", text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" };
    if (count <= 3) return { label: "Low", text: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" };
    if (count <= 8) return { label: "Moderate", text: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" };
    return { label: "High Rush", text: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" };
  };

  const rush = getRushLevel(waitingCount);

  return (
    <div className="flex flex-col bg-gray-50/30 min-h-[calc(100vh-80px)] pb-24">
      {/* Dashboard Section Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-1">
        <div className="flex flex-col">
          <h1 className="text-[22px] font-black text-[#0A1A3D] tracking-tight">
            {t('patient_flow', 'Patient Flow')}
          </h1>
          <p className="text-[13px] font-medium text-muted/80">
            Manage live queues, appointments, and check-ins
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
            title="Refresh dashboard"
            aria-label="Refresh dashboard"
            className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center text-gray-600 hover:text-[#1769E0] hover:bg-[#EBF5FF] hover:border-[#1769E0]/30 transition-colors shadow-sm disabled:opacity-50 cursor-pointer active:scale-95"
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin text-[#1769E0]")} />
          </button>
          <button 
            onClick={() => navigate('/receptionist/check-in')}
            title="Check-In Patient"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1769E0] text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Check-In</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-5 p-4 pt-3">

        {/* Top 3 KPI Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          {loading && queue.length === 0 ? (
            <>
              <Skeleton className="h-24 rounded-2xl bg-surface border border-border" />
              <Skeleton className="h-24 rounded-2xl bg-surface border border-border" />
              <Skeleton className="h-24 rounded-2xl bg-surface border border-border" />
            </>
          ) : (
            stats.map((stat, i) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn("bg-surface p-3.5 rounded-2xl border shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center text-center gap-2", stat.color.split(' ')[2])}
              >
                <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0", stat.color.split(' ').slice(0,2).join(' '))}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <h3 className={cn("text-[20px] font-black leading-none", stat.color.split(' ')[0])}>{stat.value}</h3>
                  <p className="text-[10px] text-muted font-bold uppercase mt-1 tracking-wider">{stat.title}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Home Nursing Alert Card (Immediate Access for Receptionist) */}
        {nursingPendingCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-amber-50 via-orange-50/70 to-surface border border-amber-200/90 rounded-[20px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-black text-amber-950">
                    {nursingPendingCount} Home Nursing {nursingPendingCount === 1 ? 'Request Needs' : 'Requests Need'} Nurse Assignment
                  </span>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                </div>
                <p className="text-[12px] font-medium text-amber-800/80">
                  New home visit requests from patients ready for staff dispatch
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/receptionist/home-nursing')}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Assign Nurses</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* REQUIRED: PROMINENT LIVE QUEUE CONTROL TILE (ACTIVE & NEXT IN QUEUE)       */}
        {/* ========================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface rounded-[24px] border border-border shadow-sm overflow-hidden flex flex-col"
        >
          {/* Tile Header */}
          <div className="p-4 sm:p-5 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-50/30 via-surface to-slate-50/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200/80 text-[#1769E0] flex items-center justify-center shrink-0 shadow-xs">
                <PlaySquare className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h2 className="text-[16px] font-black text-[#0A1A3D] tracking-tight">
                    Active & Next in Queue
                  </h2>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live OPD Sync
                  </span>
                </div>
                <p className="text-[12px] font-medium text-muted">
                  Orchestrate patient flow and advance consultations in real-time
                </p>
              </div>
            </div>

            {/* Quick stats chips */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-[#1769E0] border border-blue-100 text-[11px] font-black">
                {inConsultCount} In Consult
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-black">
                {waitingCount} Waiting
              </span>
            </div>
          </div>

          {/* Department Filter Pills */}
          <div className="px-4 py-2.5 border-b border-border/50 bg-gray-50/40 flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSelectedDeptId('all')}
              className={cn(
                "px-3 py-1 rounded-full text-[12px] font-bold whitespace-nowrap transition-all border shrink-0 cursor-pointer",
                selectedDeptId === 'all'
                  ? "bg-[#0A1A3D] text-white border-[#0A1A3D] shadow-xs"
                  : "bg-surface text-muted border-border hover:bg-gray-100/60"
              )}
            >
              All Departments ({queue.filter(q => q.status === 'IN_CONSULTATION' || q.status === 'WAITING' || q.status === 'ARRIVED').length})
            </button>
            {departments.map(dept => {
              const count = queue.filter(
                q => q.departmentId === dept.id && (q.status === 'IN_CONSULTATION' || q.status === 'WAITING' || q.status === 'ARRIVED')
              ).length;
              return (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDeptId(dept.id)}
                  className={cn(
                    "px-3 py-1 rounded-full text-[12px] font-bold whitespace-nowrap transition-all border shrink-0 cursor-pointer flex items-center gap-1.5",
                    selectedDeptId === dept.id
                      ? "bg-[#0A1A3D] text-white border-[#0A1A3D] shadow-xs"
                      : "bg-surface text-muted border-border hover:bg-gray-100/60"
                  )}
                >
                  <span>{dept.name}</span>
                  {count > 0 && (
                    <span className={cn(
                      "px-1.5 py-0.2 rounded-full text-[10px] font-extrabold",
                      selectedDeptId === dept.id ? "bg-white/20 text-white" : "bg-blue-50 text-[#1769E0]"
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Cards Content */}
          <div className="p-4 sm:p-5 flex flex-col gap-4">
            {loading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-32 rounded-2xl bg-surface border border-border" />
                <Skeleton className="h-32 rounded-2xl bg-surface border border-border" />
              </div>
            ) : activeConsultations.length === 0 && waitingInQueue.length === 0 ? (
              /* Compact Clean Empty State */
              <div className="py-8 px-4 flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-border bg-gray-50/50 gap-2.5">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-[#1769E0] flex items-center justify-center border border-blue-100">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-[15px] font-bold text-[#0A1A3D]">
                  No Patients Currently Waiting in Queue
                </h4>
                <p className="text-[12px] text-muted max-w-sm">
                  {selectedDeptId === 'all' 
                    ? "All appointments and walk-in consultations for today are finished or clear."
                    : "No patients are waiting or in consultation for this department."}
                </p>
                <button
                  onClick={() => navigate('/receptionist/check-in')}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#1769E0] text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Check-In New Patient</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* 1. ACTIVE IN CONSULTATION CARD */}
                {activeConsultations.length > 0 ? (
                  activeConsultations.map(activeOp => {
                    const nextPatient = waitingInQueue[0];
                    const isUpdating = actionLoadingId === activeOp.id;
                    const demoText = formatDemographics(activeOp.patientAge, activeOp.patientGender);

                    return (
                      <motion.div
                        key={activeOp.id}
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="bg-gradient-to-br from-blue-50/50 via-surface to-indigo-50/30 rounded-2xl border-2 border-[#1769E0]/40 p-4 sm:p-4.5 flex flex-col justify-between shadow-sm relative overflow-hidden gap-3"
                      >
                        {/* Top Indicator Strip */}
                        <div className="flex items-center justify-between gap-2 border-b border-blue-100/80 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-[#1769E0] text-white font-mono font-black text-xs shadow-xs">
                              Token #{activeOp.token}
                            </span>
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100/80 text-[#1769E0] border border-blue-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#1769E0] animate-ping" />
                              IN CONSULTATION
                            </span>
                          </div>
                          
                          <span className="text-[11px] font-bold text-muted bg-surface/80 px-2 py-0.5 rounded-md border border-border/60">
                            {activeOp.timeSlot || activeOp.slotTime || 'Active'}
                          </span>
                        </div>

                        {/* Patient Core Info */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-baseline justify-between gap-2">
                            <h3 className="text-[17px] font-black text-[#0A1A3D] tracking-tight">
                              {activeOp.patientName}
                            </h3>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-50 text-[#1769E0] border border-blue-100 shrink-0">
                              {activeOp.opType || 'OP Walk-In'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted font-medium">
                            {activeOp.patientPhone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-muted/80" />
                                <a 
                                  href={`tel:${activeOp.patientPhone}`} 
                                  className="text-[#0A1A3D] font-bold hover:text-[#1769E0] hover:underline"
                                >
                                  {activeOp.patientPhone}
                                </a>
                                <button
                                  type="button"
                                  onClick={() => copyPhoneNumber(activeOp.id, activeOp.patientPhone)}
                                  title="Copy phone"
                                  className="p-1 hover:bg-blue-100 rounded text-muted hover:text-[#0A1A3D]"
                                >
                                  {copiedPhoneId === activeOp.id ? (
                                    <CheckCheck className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            )}
                            {demoText && (
                              <span className="font-semibold text-gray-600">
                                • {demoText}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Clinical Assignment Info */}
                        <div className="p-2.5 rounded-xl bg-surface/90 border border-border/80 flex flex-col gap-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#0A1A3D] flex items-center gap-1.5">
                              <Stethoscope className="w-3.5 h-3.5 text-[#1769E0]" />
                              Dr. {activeOp.doctorName || 'Attending Doctor'}
                            </span>
                            <span className="text-[11px] font-semibold text-muted bg-gray-100 px-2 py-0.5 rounded-md">
                              {activeOp.departmentName || 'General Medicine'}
                            </span>
                          </div>
                          {activeOp.reason && (
                            <p className="text-[11px] text-muted italic truncate">
                              Complaint: "{activeOp.reason}"
                            </p>
                          )}
                        </div>

                        {/* Bottom Actions & Up-Next preview */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
                          <div className="text-[11px] text-muted font-semibold truncate">
                            {nextPatient ? (
                              <span className="text-amber-800 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 inline-block truncate max-w-full">
                                Up Next: <strong className="font-extrabold">{nextPatient.patientName}</strong> ({nextPatient.token})
                              </span>
                            ) : (
                              <span className="text-gray-500 italic">No further waiting patients</span>
                            )}
                          </div>

                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleStatusTransition(activeOp, 'COMPLETED')}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                          >
                            {isUpdating ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>Mark Completed</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  /* If no active consultation, show ready-to-call slot */
                  <div className="bg-gray-50/50 rounded-2xl border border-dashed border-border p-4 flex flex-col items-center justify-center text-center gap-1.5 text-muted">
                    <PlaySquare className="w-6 h-6 text-muted/60" />
                    <span className="text-xs font-bold text-[#0A1A3D]">No Consultation Currently In Progress</span>
                    <p className="text-[11px] text-muted max-w-xs">
                      {waitingInQueue.length > 0
                        ? "Click 'Start Consultation' on the patient waiting below to begin."
                        : "Ready for upcoming patient check-ins."}
                    </p>
                  </div>
                )}

                {/* 2. NEXT IN QUEUE CARD */}
                {waitingInQueue.length > 0 ? (
                  (() => {
                    const nextOp = waitingInQueue[0];
                    const isUpdating = actionLoadingId === nextOp.id;
                    const demoText = formatDemographics(nextOp.patientAge, nextOp.patientGender);
                    const remainingWaiting = waitingInQueue.slice(1);

                    return (
                      <motion.div
                        key={nextOp.id}
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="bg-amber-50/25 rounded-2xl border-2 border-amber-300/80 p-4 sm:p-4.5 flex flex-col justify-between shadow-sm relative overflow-hidden gap-3"
                      >
                        {/* Top Indicator Strip */}
                        <div className="flex items-center justify-between gap-2 border-b border-amber-200/60 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-mono font-black text-xs shadow-xs">
                              Token #{nextOp.token}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                              NEXT IN QUEUE
                            </span>
                          </div>

                          <span className="text-[11px] font-bold text-muted bg-surface/80 px-2 py-0.5 rounded-md border border-border/60">
                            {nextOp.timeSlot || nextOp.slotTime || 'Ready'}
                          </span>
                        </div>

                        {/* Patient Core Info */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-baseline justify-between gap-2">
                            <h3 className="text-[17px] font-black text-[#0A1A3D] tracking-tight">
                              {nextOp.patientName}
                            </h3>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-100/60 text-amber-900 border border-amber-200 shrink-0">
                              {nextOp.opType || 'OP Walk-In'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted font-medium">
                            {nextOp.patientPhone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-muted/80" />
                                <a 
                                  href={`tel:${nextOp.patientPhone}`} 
                                  className="text-[#0A1A3D] font-bold hover:text-[#1769E0] hover:underline"
                                >
                                  {nextOp.patientPhone}
                                </a>
                                <button
                                  type="button"
                                  onClick={() => copyPhoneNumber(nextOp.id, nextOp.patientPhone)}
                                  title="Copy phone"
                                  className="p-1 hover:bg-amber-100 rounded text-muted hover:text-[#0A1A3D]"
                                >
                                  {copiedPhoneId === nextOp.id ? (
                                    <CheckCheck className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            )}
                            {demoText && (
                              <span className="font-semibold text-gray-600">
                                • {demoText}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Clinical Assignment Info */}
                        <div className="p-2.5 rounded-xl bg-surface/90 border border-border/80 flex flex-col gap-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#0A1A3D] flex items-center gap-1.5">
                              <Stethoscope className="w-3.5 h-3.5 text-amber-600" />
                              Dr. {nextOp.doctorName || 'Attending Doctor'}
                            </span>
                            <span className="text-[11px] font-semibold text-muted bg-gray-100 px-2 py-0.5 rounded-md">
                              {nextOp.departmentName || 'General Medicine'}
                            </span>
                          </div>
                          {nextOp.reason && (
                            <p className="text-[11px] text-muted italic truncate">
                              Complaint: "{nextOp.reason}"
                            </p>
                          )}
                        </div>

                        {/* Bottom Actions & Remaining queue strip */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
                          <div className="text-[11px] text-muted font-semibold truncate">
                            {remainingWaiting.length > 0 ? (
                              <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200 inline-block truncate max-w-full">
                                +{remainingWaiting.length} more waiting behind
                              </span>
                            ) : (
                              <span className="text-gray-500 italic">Last in line for this slot</span>
                            )}
                          </div>

                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleStatusTransition(nextOp, 'IN_CONSULTATION')}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#1769E0] hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-[#1769E0]/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                          >
                            {isUpdating ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-current" />
                            )}
                            <span>Start Consultation</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })()
                ) : (
                  /* If no waiting patients */
                  <div className="bg-gray-50/50 rounded-2xl border border-dashed border-border p-4 flex flex-col items-center justify-center text-center gap-1.5 text-muted">
                    <Clock className="w-6 h-6 text-muted/60" />
                    <span className="text-xs font-bold text-[#0A1A3D]">No Waiting Patients in Line</span>
                    <p className="text-[11px] text-muted max-w-xs">
                      All checked-in patients have already been called or completed.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* ========================================================================= */}
        {/* DOCTOR AVAILABILITY & STATUS OVERRIDE PANEL                               */}
        {/* ========================================================================= */}
        <DoctorStatusControlPanel onStatusChange={() => loadData(true)} />

        {/* ========================================================================= */}
        {/* DEPARTMENT QUEUES                                                         */}
        {/* ========================================================================= */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col gap-3 mt-1"
        >
          <div className="flex items-center justify-between px-1 mb-1">
            <h2 className="text-[14px] font-bold text-[#0A1A3D] uppercase tracking-wider">
              Department Queues
            </h2>
            <span className="text-[12px] font-semibold text-muted/70">
              {departments.length} {departments.length === 1 ? 'Department' : 'Departments'}
            </span>
          </div>
          
          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-28 rounded-[20px] bg-surface border border-border" />
                <Skeleton className="h-28 rounded-[20px] bg-surface border border-border" />
              </div>
            ) : departmentQueues.length === 0 ? (
              <EmptyState
                icon={Building}
                title="No Department Queues"
                description="No departments have been added to this hospital yet."
              />
            ) : departmentQueues.map(dept => (
              <button 
                key={dept.id} 
                onClick={() => navigate(`/receptionist/queue?dept=${dept.id}`)}
                className="flex flex-col p-4 bg-surface rounded-[20px] border border-border/60 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:border-[#1769E0]/30 active:scale-[0.98] transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#1769E0] shrink-0 border border-blue-100">
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
                      <span className="text-[10px] text-muted font-bold uppercase mb-1 tracking-wider">Waiting</span>
                      <span className="text-[15px] font-black text-orange-600">{dept.waiting}</span>
                    </div>
                    <div className="w-px h-8 bg-gray-200" />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted font-bold uppercase mb-1 tracking-wider">In Consult</span>
                      <span className="text-[15px] font-black text-[#1769E0]">{dept.inConsult}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-muted font-bold uppercase mb-1 tracking-wider">Next</span>
                      <span className="text-[15px] font-black text-[#0A1A3D]">{dept.nextOp}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center shadow-sm text-muted/70 group-hover:text-[#1769E0] group-hover:border-[#1769E0]/30 transition-colors">
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
          className="flex items-center justify-between bg-surface p-5 rounded-[20px] border border-border/60 shadow-[0_1px_2px_rgba(0,0,0,0.02)] mt-1"
        >
          <div className="flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center border", rush.bg, rush.border, rush.text)}>
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-muted text-[11px] font-bold uppercase tracking-wider mb-1">Hospital Rush</h2>
              <div className={cn("flex items-center gap-2 text-[16px] font-black", rush.text)}>
                {loading ? "—" : rush.label}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[20px] font-black text-[#0A1A3D]">{loading ? "—" : waitingCount}</span>
            <span className="text-[11px] font-bold text-muted/70 uppercase">Total Waiting</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
