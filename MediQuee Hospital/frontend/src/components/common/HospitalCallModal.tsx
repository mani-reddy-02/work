import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Phone,
  PhoneCall,
  PhoneForwarded,
  PhoneOff,
  ShieldCheck,
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
      registerCallIntent(bookingId, bookingType).catch(() => {});
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
          className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">MediQuee Call Masking</h3>
                <p className="text-[11px] text-slate-500 font-medium">Privacy-Protected Exotel Connection</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={['initiating', 'calling_staff', 'connecting_patient'].includes(callState)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5">
            {/* Target Patient Card */}
            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100/80 mb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">Patient</span>
                <p className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{patientName}</p>
                <p className="text-xs font-mono text-slate-600 mt-0.5">
                  Phone: {maskPhoneNumber(patientPhone)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Caller ID</span>
                <p className="text-xs font-bold text-slate-900">{hospitalVirtualNumber}</p>
                <span className="inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 mt-0.5">
                  MASKED
                </span>
              </div>
            </div>

            {/* State: IDLE */}
            {callState === 'idle' && (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-600 leading-relaxed space-y-1.5">
                  <p className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-600" /> Two-Way Number Masking:
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Both your phone number and the patient's personal number are completely protected and masked via virtual number <strong className="text-slate-800">{hospitalVirtualNumber}</strong>.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={handleDialDirect}
                    className="w-full py-3 bg-[#1769E0] hover:bg-[#1258be] text-white font-extrabold rounded-xl text-sm transition-all shadow-md shadow-blue-500/20 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Phone className="w-4 h-4" />
                    Dial {hospitalVirtualNumber} Directly
                  </button>
                  <p className="text-[10px] text-center text-slate-400">
                    Opens your dialer. Automatically connects to {patientName} via masked line.
                  </p>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase">Or</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleStartCall}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <PhoneForwarded className="w-3.5 h-3.5 text-slate-500" />
                    Receive Call on Hospital Phone (Desktop Click-to-Call)
                  </button>
                </div>
              </div>
            )}

            {/* State: INITIATING */}
            {callState === 'initiating' && (
              <div className="py-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <RefreshCw className="w-7 h-7 animate-spin" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Dispatching call to Exotel...</p>
                  <p className="text-xs text-slate-500 mt-1">Please wait while the connection is established.</p>
                </div>
              </div>
            )}

            {/* State: CALLING STAFF (Leg 1) */}
            {callState === 'calling_staff' && (
              <div className="py-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto animate-pulse">
                  <Phone className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Ringing your phone...</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Your phone will ring from <span className="font-bold text-blue-600">{hospitalVirtualNumber}</span>.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Please answer the incoming call to connect to the patient.</p>
                </div>
              </div>
            )}

            {/* State: CONNECTING PATIENT (Leg 2) */}
            {callState === 'connecting_patient' && (
              <div className="py-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto animate-pulse">
                  <PhoneForwarded className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Hospital phone answered!</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Now ringing patient via <span className="font-bold">{hospitalVirtualNumber}</span>...
                  </p>
                </div>
              </div>
            )}

            {/* State: CONNECTED */}
            {callState === 'connected' && (
              <div className="py-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <PhoneCall className="w-7 h-7 animate-bounce" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-800">Call Connected</p>
                  <p className="text-xs text-slate-600 mt-1">
                    You are speaking with {patientName} via our secure masked line.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Keep in Background
                </button>
              </div>
            )}

            {/* State: COMPLETED */}
            {callState === 'completed' && (
              <div className="py-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Call Completed</p>
                  <p className="text-xs text-slate-500 mt-1">The call session has ended successfully.</p>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}

            {/* State: FAILED */}
            {callState === 'failed' && (
              <div className="py-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                  <PhoneOff className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Call Ended or Failed</p>
                  <p className="text-xs text-rose-600 mt-1 leading-relaxed">
                    {callError || 'Unable to complete the call at this moment.'}
                  </p>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={handleStartCall}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Retry Connection
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleDialDirect}
                    className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Dial Masked Line ({hospitalVirtualNumber}) Directly
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
