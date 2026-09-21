import { motion, AnimatePresence } from "framer-motion"
import { X, Video, Mic, Wifi, Camera, FileText, Activity } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export function VideoDetailModal({ isOpen, onClose, appointment }: { isOpen: boolean, onClose: () => void, appointment: any }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-lg bg-surface rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-border">
            <h2 className="text-[18px] font-black text-[#0A1A3D] tracking-tight">Consultation Details</h2>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 text-muted flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 pb-safe">
            <div className="p-6 flex flex-col gap-6">
              
              {/* Patient Info */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-[18px] bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-2xl shadow-sm border border-indigo-100/50">
                  {appointment?.avatar || "—"}
                </div>
                <div className="flex flex-col">
                  <h3 className="text-xl font-bold text-[#0A1A3D]">{appointment?.patientName || "—"}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-[13px] font-semibold text-muted">ID: {appointment?.mqId || "—"}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span className="text-[13px] font-semibold text-muted">{appointment?.age ? `${appointment.age} yrs` : "—"}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span className="text-[13px] font-semibold text-muted">{appointment?.gender || "—"}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mt-2 bg-indigo-50 text-indigo-600 rounded-md text-[11px] font-bold uppercase tracking-wider w-fit">
                    <Video className="w-3 h-3" />
                    {appointment?.type || "Video Consult"}
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-gray-100" />

              {/* Consultation Context */}
              <div className="flex flex-col gap-3">
                <h4 className="text-[14px] font-bold text-[#0A1A3D] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted/70" />
                  Reason for Consultation
                </h4>
                <p className="text-[14px] font-medium text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-[16px] border border-border">
                  {appointment?.reason || "Reason for consultation will appear here once available."}
                </p>
              </div>

              {/* Hardware Prep (if joining) */}
              {(appointment?.status === 'WAITING' || appointment?.status === 'IN PROGRESS') && (
                <div className="flex flex-col gap-3 mt-2">
                  <h4 className="text-[14px] font-bold text-[#0A1A3D] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-muted/70" />
                    System Check
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col items-center justify-center gap-2 p-3 rounded-[16px] border border-border bg-surface shadow-sm">
                      <SystemCheckIcon icon={Camera} />
                      <span className="text-[11px] font-bold text-muted">Camera</span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2 p-3 rounded-[16px] border border-border bg-surface shadow-sm">
                      <SystemCheckIcon icon={Mic} />
                      <span className="text-[11px] font-bold text-muted">Mic</span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2 p-3 rounded-[16px] border border-border bg-surface shadow-sm">
                      <SystemCheckIcon icon={Wifi} />
                      <span className="text-[11px] font-bold text-muted">Network</span>
                    </div>
                  </div>
                  <span className="text-[12px] font-medium text-muted/70">System check unavailable.</span>
                </div>
              )}
            </div>

            {/* Sticky Action Footer */}
            <div className="p-6 pt-2 bg-surface sticky bottom-0 border-t border-gray-50">
              {appointment?.status === 'WAITING' || appointment?.status === 'IN PROGRESS' ? (
                <button
                  onClick={onClose}
                  className="w-full bg-[#1B5DF1] text-white py-4 rounded-[16px] font-bold text-[15px] shadow-[0_8px_20px_rgba(27,93,241,0.25)] flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  <Video className="w-5 h-5" />
                  {appointment.status === 'IN PROGRESS' ? "Rejoin Video Call" : "Join Video Call"}
                </button>
              ) : (
                <button 
                  onClick={onClose}
                  className="w-full bg-gray-100 text-gray-600 py-4 rounded-[16px] font-bold text-[15px] flex items-center justify-center transition-all active:scale-[0.98]"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function SystemCheckIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div className="w-8 h-8 rounded-full bg-gray-50 text-muted/70 flex items-center justify-center border border-border">
      <Icon className="w-5 h-5" />
    </div>
  );
}
