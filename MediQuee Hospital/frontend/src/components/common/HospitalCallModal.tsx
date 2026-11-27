import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Phone,
  PhoneCall,
  PhoneForwarded,
  PhoneOff,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { initiatePatientCall, getCallStatus, maskPhoneNumber, registerCallIntent } from '../../services/callApi';

export interface HospitalCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId?: string;
  bookingType?: 'OP' | 'NURSING' | 'LAB_WALK_IN' | 'HOME_SAMPLE' | 'VIDEO';
  patientName?: string;
  patientPhone?: string;
  hospitalVirtualNumber?: string;
}

export type CallState =
  | 'idle'
  | 'initiating'
  | 'calling_staff'
  | 'connecting_patient'
  | 'connected'
  | 'completed'
  | 'failed';

export const HospitalCallModal: React.FC<HospitalCallModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  bookingType = 'OP',
  patientName = 'Patient',
  patientPhone,
  hospitalVirtualNumber = '08047290980',
}) => {
  const [callState, setCallState] = useState<CallState>('idle');
  const [activeCallSid, setActiveCallSid] = useState<string | null>(null);
  const [callError, setCallError] = useState<string | null>(null);
  const pollTimerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  const handleDialDirect = async () => {
    if (bookingId) {
      await Promise.race([
        registerCallIntent(bookingId, bookingType),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]).catch(() => {});
    }
    window.location.href = `tel:${hospitalVirtualNumber}`;
  };

  const handleStartCall = async () => {
    if (!bookingId) {
      setCallError('Booking reference not available');
      setCallState('failed');
      return;
    }

    setCallState('initiating');
    setCallError(null);

    try {
      const res = await initiatePatientCall(bookingId, bookingType);
      if (res.success && res.callSid) {
        setActiveCallSid(res.callSid);
        setCallState('calling_staff');

        let elapsedSeconds = 0;
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);

        pollTimerRef.current = setInterval(async () => {
          elapsedSeconds += 3;
          if (elapsedSeconds > 180) {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            return;
          }

          try {
            const statusRes = await getCallStatus(res.callSid!);
            if (statusRes.success && statusRes.data) {
              const st = statusRes.data.status;
              if (st === 'RINGING') {
                setCallState('connecting_patient');
              } else if (st === 'IN_PROGRESS') {
                setCallState('connected');
              } else if (st === 'COMPLETED') {
                setCallState('completed');
                if (pollTimerRef.current) clearInterval(pollTimerRef.current);
              } else if (['BUSY', 'NO_ANSWER', 'FAILED', 'CANCELED'].includes(st)) {
                setCallState('failed');
                setCallError(`Call ended: ${st.toLowerCase().replace('_', ' ')}`);
                if (pollTimerRef.current) clearInterval(pollTimerRef.current);
              }
            }
          } catch {
            // Non-fatal polling error
          }
        }, 3000);
      } else {
        setCallState('failed');
        setCallError(res.message || 'Unable to initiate call');
      }
    } catch (err: any) {
      setCallState('failed');
      setCallError(err.message || 'Call initiation failed');
    }
  };

  const handleClose = () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    setCallState('idle');
    setActiveCallSid(null);
    setCallError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-sm bg-surface text-foreground rounded-2xl shadow-2xl border border-border overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Call Patient</h3>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={['initiating', 'calling_staff', 'connecting_patient'].includes(callState)}
              className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5">
            {/* Target Patient Card */}
            <div className="p-3.5 rounded-xl bg-background/80 dark:bg-slate-800/70 border border-border mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Patient</span>
              <p className="text-sm font-bold text-foreground truncate">{patientName}</p>
              {patientPhone && (
                <p className="text-xs font-mono text-muted mt-0.5">
                  {maskPhoneNumber(patientPhone)}
                </p>
              )}
            </div>

            {/* State: IDLE */}
            {callState === 'idle' && (
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleDialDirect}
                  className="w-full py-3 bg-[#1769E0] hover:bg-[#1258be] text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-500/20 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call</span>
                </button>

                <button
                  type="button"
                  onClick={handleStartCall}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-foreground font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PhoneForwarded className="w-3.5 h-3.5 text-muted" />
                  <span>Call via Hospital Phone</span>
                </button>
              </div>
            )}

            {/* State: INITIATING */}
            {callState === 'initiating' && (
              <div className="py-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                  <RefreshCw className="w-7 h-7 animate-spin" />
                </div>
                <p className="text-sm font-bold text-foreground">Connecting call...</p>
              </div>
            )}

            {/* State: CALLING STAFF */}
            {callState === 'calling_staff' && (
              <div className="py-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto animate-pulse">
                  <Phone className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Ringing your phone...</p>
                  <p className="text-xs text-muted mt-1">Answer the incoming call to connect.</p>
                </div>
              </div>
            )}

            {/* State: CONNECTING PATIENT */}
            {callState === 'connecting_patient' && (
              <div className="py-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto animate-pulse">
                  <PhoneForwarded className="w-7 h-7" />
                </div>
                <p className="text-sm font-bold text-foreground">Connecting to {patientName}...</p>
              </div>
            )}

            {/* State: CONNECTED */}
            {callState === 'connected' && (
              <div className="py-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <PhoneCall className="w-7 h-7 animate-bounce" />
                </div>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Call Connected</p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-foreground font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            )}

            {/* State: COMPLETED */}
            {callState === 'completed' && (
              <div className="py-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <p className="text-sm font-bold text-foreground">Call Completed</p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-2.5 bg-primary hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}

            {/* State: FAILED */}
            {callState === 'failed' && (
              <div className="py-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                  <PhoneOff className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Call Ended or Failed</p>
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 leading-relaxed">
                    {callError || 'Unable to complete the call at this moment.'}
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 py-2.5 border border-border hover:bg-gray-100 dark:hover:bg-slate-800 text-foreground font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleDialDirect}
                    className="flex-1 py-2.5 bg-primary hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Call Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
