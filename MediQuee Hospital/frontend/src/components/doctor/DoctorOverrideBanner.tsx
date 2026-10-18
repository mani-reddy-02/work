import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, Power, Clock, RefreshCw, CheckCircle2 } from "lucide-react"
import { doctorApi, type DoctorStatusSummary } from "@/services/doctorApi"
import { useToast } from "@/context/ToastContext"
import { cn } from "@/lib/utils"

interface DoctorOverrideBannerProps {
  onStatusChange?: () => void;
  className?: string;
}

export function DoctorOverrideBanner({ onStatusChange, className }: DoctorOverrideBannerProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<DoctorStatusSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());

  const fetchStatus = useCallback(async () => {
    try {
      const data = await doctorApi.getMyStatus();
      setStatus(data);
    } catch (err) {
      // Quiet fail if not doctor or network error
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    // 1-second ticker for countdown
    const ticker = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 1000);

    // 10-second sync
    const poll = setInterval(() => {
      fetchStatus();
    }, 10000);

    return () => {
      clearInterval(ticker);
      clearInterval(poll);
    };
  }, [fetchStatus]);

  // When timer hits 0, auto-refresh status
  useEffect(() => {
    if (status?.isTemporarilyInactive && status.inactiveUntil) {
      if (new Date(status.inactiveUntil).getTime() <= nowTimestamp) {
        fetchStatus();
        if (onStatusChange) onStatusChange();
      }
    }
  }, [nowTimestamp, status, fetchStatus, onStatusChange]);

  const handleResumeActive = async () => {
    if (!status?.doctorId) return;
    setLoading(true);
    try {
      await doctorApi.updateMyActiveStatus(status.doctorId, { active: true });
      toast("You are now Active! OP & Video consultation bookings are open.", "success");
      await fetchStatus();
      if (onStatusChange) onStatusChange();
    } catch (err: any) {
      toast(err.message || "Failed to resume active status", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!status || !status.isTemporarilyInactive) {
    return null;
  }

  // Calculate live countdown string
  const diffMs = status.inactiveUntil ? new Date(status.inactiveUntil).getTime() - nowTimestamp : 0;
  const totalSec = Math.max(0, Math.floor(diffMs / 1000));
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const countdownStr = hours > 0 
    ? `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
    : `${minutes}m ${String(seconds).padStart(2, '0')}s`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          "bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border-2 border-amber-400 rounded-2xl p-4 md:p-5 shadow-lg shadow-amber-500/5 flex flex-col md:flex-row md:items-center justify-between gap-4",
          className
        )}
      >
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-amber-950 text-sm md:text-base">
                Temporarily Set to Inactive {status.overrideUpdatedBy ? `by ${status.overrideUpdatedBy}` : ''}
              </span>
              <span className="font-mono text-xs font-black bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                Resumes in {countdownStr}
              </span>
            </div>
            <p className="text-xs text-amber-900/90 mt-1">
              You are currently <strong>hidden from Patient OP & Video Consultation bookings</strong> until{" "}
              <strong>{status.reactivateAtTime || 'timer expires'}</strong>.
              {status.inactiveReason && (
                <span className="ml-1 italic font-medium">
                  (Reason: "{status.inactiveReason}")
                </span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={handleResumeActive}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 whitespace-nowrap self-stretch md:self-auto disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Power className="w-4 h-4" />
          )}
          Resume / Go Active Now
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
