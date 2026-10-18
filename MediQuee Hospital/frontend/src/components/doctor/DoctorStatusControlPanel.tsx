import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Stethoscope, Clock, CheckCircle2, AlertTriangle, 
  RotateCcw, Search, ChevronRight, X, AlertCircle, 
  Sparkles, Calendar, Plus, RefreshCw, Power, ShieldAlert
} from "lucide-react"
import { receptionistApi, type DoctorStatusSummary } from "@/services/receptionistApi"
import { useToast } from "@/context/ToastContext"
import { cn } from "@/lib/utils"

interface DoctorStatusControlPanelProps {
  hospitalId?: string;
  onStatusChange?: () => void;
  className?: string;
}

const PRESET_HOURS = [
  { label: '1 Hour', hours: 1 },
  { label: '2 Hours', hours: 2 },
  { label: '3 Hours', hours: 3 },
  { label: '4 Hours', hours: 4 },
  { label: '6 Hours', hours: 6 },
  { label: 'Rest of Today', restOfToday: true },
];

const PRESET_REASONS = [
  'In Emergency Surgery',
  'On Ward Rounds',
  'Doctor Delayed',
  'In Clinical Meeting',
  'Personal Break'
];

export function DoctorStatusControlPanel({ hospitalId, onStatusChange, className }: DoctorStatusControlPanelProps) {
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<DoctorStatusSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'OFF_DUTY'>('ALL');

  // Pause modal state
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorStatusSummary | null>(null);
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [selectedPresetHours, setSelectedPresetHours] = useState<number | 'restOfToday'>(1);
  const [customHours, setCustomHours] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>('In Emergency Surgery');
  const [customReason, setCustomReason] = useState<string>('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Live seconds ticker for client-side countdown
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());

  const fetchStatuses = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await receptionistApi.getDoctorsStatus(hospitalId);
      setDoctors(data);
    } catch (err: any) {
      console.error("Failed to fetch doctor statuses:", err);
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    fetchStatuses();

    // 1-second ticker for smooth countdown
    const ticker = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 1000);

    // 10-second polling for multi-tab / cross-portal sync
    const pollInterval = setInterval(() => {
      fetchStatuses(true);
    }, 10000);

    return () => {
      clearInterval(ticker);
      clearInterval(pollInterval);
    };
  }, [fetchStatuses]);

  // Client-side auto-expiry trigger when timer hits 0
  const prevInactiveCountRef = useRef<number>(0);
  useEffect(() => {
    const inactiveDocs = doctors.filter(d => d.isTemporarilyInactive && d.inactiveUntil);
    const hasAnyExpired = inactiveDocs.some(d => {
      if (!d.inactiveUntil) return false;
      return new Date(d.inactiveUntil).getTime() <= nowTimestamp;
    });

    if (hasAnyExpired) {
      // Re-fetch immediately to let backend auto-heal and flip to Active!
      fetchStatuses(true);
      if (onStatusChange) onStatusChange();
    }
    prevInactiveCountRef.current = inactiveDocs.length;
  }, [nowTimestamp, doctors, fetchStatuses, onStatusChange]);

  const handleOpenPauseModal = (doc: DoctorStatusSummary) => {
    setSelectedDoctor(doc);
    setSelectedPresetHours(1);
    setIsCustom(false);
    setCustomHours('');
    setSelectedReason('In Emergency Surgery');
    setCustomReason('');
    setIsPauseModalOpen(true);
  };

  const handleConfirmPause = async () => {
    if (!selectedDoctor) return;
    setActionLoadingId(selectedDoctor.doctorId);
    try {
      let payload: any = { active: false };

      if (isCustom) {
        const parsed = parseFloat(customHours);
        if (isNaN(parsed) || parsed <= 0) {
          toast("Please enter a valid positive number of hours", "error");
          setActionLoadingId(null);
          return;
        }
        payload.durationHours = parsed;
      } else if (selectedPresetHours === 'restOfToday') {
        payload.restOfToday = true;
      } else {
        payload.durationHours = selectedPresetHours;
      }

      const finalReason = customReason.trim() ? customReason.trim() : selectedReason;
      payload.reason = finalReason;

      const res = await receptionistApi.updateDoctorActiveStatus(selectedDoctor.doctorId, payload);
      toast(res.message || "Doctor set to inactive successfully", "success");
      setIsPauseModalOpen(false);
      await fetchStatuses(true);
      if (onStatusChange) onStatusChange();
    } catch (err: any) {
      toast(err.message || "Failed to update doctor status", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReactivateImmediately = async (doc: DoctorStatusSummary) => {
    setActionLoadingId(doc.doctorId);
    try {
      const res = await receptionistApi.updateDoctorActiveStatus(doc.doctorId, { active: true });
      toast("Doctor reactivated! Available for OP & Video bookings.", "success");
      await fetchStatuses(true);
      if (onStatusChange) onStatusChange();
    } catch (err: any) {
      toast(err.message || "Failed to reactivate doctor", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleExtend = async (doc: DoctorStatusSummary, additionalHours: number) => {
    setActionLoadingId(doc.doctorId);
    try {
      const currentExpiry = doc.inactiveUntil ? new Date(doc.inactiveUntil).getTime() : Date.now();
      const baseTime = Math.max(Date.now(), currentExpiry);
      const newExpiry = new Date(baseTime + additionalHours * 3600 * 1000);

      const res = await receptionistApi.updateDoctorActiveStatus(doc.doctorId, {
        active: false,
        inactiveUntil: newExpiry.toISOString(),
        reason: doc.inactiveReason || 'Temporarily Inactive'
      });
      toast(`Extended inactive duration by ${additionalHours} hour(s)`, "success");
      await fetchStatuses(true);
      if (onStatusChange) onStatusChange();
    } catch (err: any) {
      toast(err.message || "Failed to extend duration", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Helper to format remaining time as HH:MM:SS
  const formatCountdown = (inactiveUntilStr: string | null) => {
    if (!inactiveUntilStr) return "00:00";
    const diffMs = new Date(inactiveUntilStr).getTime() - nowTimestamp;
    if (diffMs <= 0) return "Reactivating...";

    const totalSec = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    if (hours > 0) {
      return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
    }
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  };

  const filteredDoctors = useMemo(() => {
    return doctors.filter(doc => {
      const matchesSearch = 
        doc.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.departmentName && doc.departmentName.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (statusFilter === 'ACTIVE') return doc.effectiveStatus === 'ACTIVE';
      if (statusFilter === 'INACTIVE') return doc.effectiveStatus === 'TEMPORARILY_INACTIVE';
      if (statusFilter === 'OFF_DUTY') return doc.effectiveStatus === 'OFF_DUTY';
      return true;
    });
  }, [doctors, searchQuery, statusFilter]);

  const activeCount = doctors.filter(d => d.effectiveStatus === 'ACTIVE').length;
  const inactiveCount = doctors.filter(d => d.effectiveStatus === 'TEMPORARILY_INACTIVE').length;
  const offDutyCount = doctors.filter(d => d.effectiveStatus === 'OFF_DUTY').length;

  return (
    <div className={cn("bg-surface rounded-2xl border border-border shadow-sm p-5 md:p-6 flex flex-col gap-5", className)}>
      
      {/* Header with KPI Counts */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1769E0] flex items-center justify-center font-bold">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[17px] font-bold text-foreground">Doctor Availability & Status Override</h2>
              {refreshing && <RefreshCw className="w-3.5 h-3.5 text-muted animate-spin" />}
            </div>
            <p className="text-[12px] text-muted">
              Temporarily override doctor availability with auto-reactivation. Inactive doctors are hidden from patient OP & Video booking.
            </p>
          </div>
        </div>

        {/* Live Filter Pills */}
        <div className="flex items-center gap-1.5 bg-background p-1 rounded-xl border border-border self-start md:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
              statusFilter === 'ALL' 
                ? "bg-surface text-foreground shadow-sm" 
                : "text-muted hover:text-foreground"
            )}
          >
            All ({doctors.length})
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap",
              statusFilter === 'ACTIVE' 
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                : "text-muted hover:text-foreground"
            )}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Active ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('INACTIVE')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap",
              statusFilter === 'INACTIVE' 
                ? "bg-amber-50 text-amber-700 border border-amber-200" 
                : "text-muted hover:text-foreground"
            )}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Paused ({inactiveCount})
          </button>
          <button
            onClick={() => setStatusFilter('OFF_DUTY')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
              statusFilter === 'OFF_DUTY' 
                ? "bg-gray-100 text-gray-700" 
                : "text-muted hover:text-foreground"
            )}
          >
            Off Duty ({offDutyCount})
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search doctor by name, department, or specialization..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:border-[#1769E0]"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-sm text-muted">
          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
          Loading doctor availability...
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-border rounded-xl bg-background">
          <p className="text-sm font-semibold text-muted">No doctors found matching your filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDoctors.map(doc => {
            const isPaused = doc.isTemporarilyInactive;
            const isOff = doc.effectiveStatus === 'OFF_DUTY';
            const isActive = doc.effectiveStatus === 'ACTIVE';

            return (
              <div 
                key={doc.doctorId}
                className={cn(
                  "rounded-2xl border p-4.5 flex flex-col justify-between gap-4 transition-all relative overflow-hidden",
                  isPaused 
                    ? "bg-amber-50/40 border-amber-200/80 shadow-[0_4px_16px_rgba(245,158,11,0.08)]" 
                    : isOff 
                      ? "bg-gray-50/60 border-border text-muted opacity-85" 
                      : "bg-surface border-border hover:border-emerald-300 shadow-sm"
                )}
              >
                {/* Top Info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center overflow-hidden shrink-0">
                      {doc.avatar ? (
                        <img src={doc.avatar} alt={doc.doctorName} className="w-full h-full object-cover" />
                      ) : (
                        <Stethoscope className="w-6 h-6 text-muted/70" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-[15px] text-foreground leading-snug">
                        {doc.doctorName}
                      </h3>
                      <p className="text-[12px] font-medium text-muted">
                        {doc.departmentName || doc.specialization}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {isActive && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                      ACTIVE
                    </span>
                  )}
                  {isPaused && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                      <Clock className="w-3 h-3 text-amber-700" />
                      PAUSED
                    </span>
                  )}
                  {isOff && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-200 text-gray-700 shrink-0">
                      OFF DUTY
                    </span>
                  )}
                </div>

                {/* Middle Shift & Pause Detail */}
                <div className="bg-background/80 rounded-xl p-3 border border-border/80 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Today's Shift
                    </span>
                    <span className="font-semibold text-foreground">
                      {doc.isScheduledToday ? doc.todayShift : 'Off Duty'}
                    </span>
                  </div>

                  {isPaused && (
                    <div className="pt-2 border-t border-border/60 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-amber-800 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Auto-Reactivates
                        </span>
                        <span className="font-mono font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded text-[11px]">
                          {formatCountdown(doc.inactiveUntil)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted">
                        <span>Resumes at: <strong className="text-foreground">{doc.reactivateAtTime || 'Scheduled'}</strong></span>
                        {doc.inactiveReason && (
                          <span className="truncate max-w-[140px] text-amber-800 italic" title={doc.inactiveReason}>
                            "{doc.inactiveReason}"
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-1 flex items-center gap-2">
                  {isPaused ? (
                    <>
                      <button
                        onClick={() => handleReactivateImmediately(doc)}
                        disabled={actionLoadingId === doc.doctorId}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                      >
                        <Power className="w-3.5 h-3.5" />
                        Activate Now
                      </button>
                      <button
                        onClick={() => handleExtend(doc, 1)}
                        disabled={actionLoadingId === doc.doctorId}
                        className="py-2 px-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs flex items-center justify-center gap-1 transition-all border border-amber-300 disabled:opacity-50"
                        title="Extend pause by 1 hour"
                      >
                        +1h
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleOpenPauseModal(doc)}
                      disabled={actionLoadingId === doc.doctorId}
                      className={cn(
                        "w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all",
                        isOff 
                          ? "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200" 
                          : "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
                      )}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Set Inactive / Pause
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PAUSE MODAL */}
      <AnimatePresence>
        {isPauseModalOpen && selectedDoctor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-surface rounded-2xl border border-border shadow-2xl max-w-lg w-full p-6 flex flex-col gap-5 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">
                      Pause Doctor Availability
                    </h3>
                    <p className="text-xs text-muted">
                      Set <strong>{selectedDoctor.doctorName}</strong> to Inactive for a chosen duration.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPauseModalOpen(false)}
                  className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-background transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Notice Box */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  While inactive, this doctor will be <strong>strictly hidden from Patient OP & Video Consultation lists</strong>. 
                  When the timer expires, the doctor automatically reactivates according to their regular schedule.
                </span>
              </div>

              {/* Duration Options */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-foreground">
                  Select Inactive Duration:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_HOURS.map(p => {
                    const isSelected = !isCustom && (p.restOfToday ? selectedPresetHours === 'restOfToday' : selectedPresetHours === p.hours);
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          setIsCustom(false);
                          setSelectedPresetHours(p.restOfToday ? 'restOfToday' : (p.hours || 1));
                        }}
                        className={cn(
                          "py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center",
                          isSelected
                            ? "bg-[#1769E0] text-white border-[#1769E0] shadow-sm"
                            : "bg-background text-foreground border-border hover:bg-surface"
                        )}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Hours Button & Input */}
                <div className="mt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCustom(true)}
                    className={cn(
                      "py-2 px-3 rounded-xl text-xs font-bold border transition-all",
                      isCustom 
                        ? "bg-[#1769E0] text-white border-[#1769E0]" 
                        : "bg-background text-foreground border-border hover:bg-surface"
                    )}
                  >
                    Custom Hours
                  </button>
                  {isCustom && (
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="24"
                      placeholder="e.g. 1.5 or 5"
                      value={customHours}
                      onChange={(e) => setCustomHours(e.target.value)}
                      className="flex-1 bg-background border border-border rounded-xl px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:border-[#1769E0]"
                    />
                  )}
                </div>
              </div>

              {/* Reason Selector */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-foreground">
                  Reason for Pause (Optional):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_REASONS.map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setSelectedReason(r);
                        setCustomReason('');
                      }}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-medium border transition-all",
                        selectedReason === r && !customReason
                          ? "bg-amber-100 text-amber-900 border-amber-300 font-bold"
                          : "bg-background text-muted border-border hover:text-foreground"
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Or enter custom reason (e.g. Traffic delay / Emergency rounds)..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:border-[#1769E0]"
                />
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsPauseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-muted hover:text-foreground hover:bg-background transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPause}
                  disabled={actionLoadingId === selectedDoctor.doctorId}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {actionLoadingId === selectedDoctor.doctorId ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Setting Inactive...
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      Confirm Inactive
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
