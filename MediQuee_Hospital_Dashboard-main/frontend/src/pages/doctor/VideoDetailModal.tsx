import { motion, AnimatePresence } from "framer-motion"
import { X, Video, Mic, Wifi, CheckCircle2, FileText, Activity } from "lucide-react"
import {} from "@/lib/utils"
import { useState } from "react"

export function VideoDetailModal({ isOpen, onClose, appointment }: { isOpen: boolean, onClose: () => void, appointment: any }) {
  const [checking, setChecking] = useState(true);

  if (isOpen && checking) {
    setTimeout(() => setChecking(false), 1500);
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-gray-100">
            <h2 className="text-[18px] font-black text-[#0A1A3D] tracking-tight">Consultation Details</h2>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 pb-safe">
            <div className="p-6 flex flex-col gap-6">
              
              {/* Patient Info */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-[18px] bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-2xl shadow-sm border border-indigo-100/50">
                  {appointment?.avatar || "P"}
                </div>
                <div className="flex flex-col">
                  <h3 className="text-xl font-bold text-[#0A1A3D]">{appointment?.patientName || "Patient Name"}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-[13px] font-semibold text-gray-500">ID: {appointment?.mqId || "2000"}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span className="text-[13px] font-semibold text-gray-500">32 yrs</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span className="text-[13px] font-semibold text-gray-500">Male</span>
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
                  <FileText className="w-4 h-4 text-gray-400" />
                  Reason for Consultation
                </h4>
                <p className="text-[14px] font-medium text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-[16px] border border-gray-100">
                  Follow up after prescribing new blood pressure medication last week. Patient reported mild dizziness.
                </p>
              </div>

              {/* Hardware Prep (if joining) */}
              {(appointment?.status === 'WAITING' || appointment?.status === 'IN PROGRESS') && (
                <div className="flex flex-col gap-3 mt-2">
                  <h4 className="text-[14px] font-bold text-[#0A1A3D] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-gray-400" />
                    System Check
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col items-center justify-center gap-2 p-3 rounded-[16px] border border-gray-100 bg-white shadow-sm">
                      <CameraCheck checking={checking} />
                      <span className="text-[11px] font-bold text-gray-500">Camera</span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2 p-3 rounded-[16px] border border-gray-100 bg-white shadow-sm">
                      <MicCheck checking={checking} />
                      <span className="text-[11px] font-bold text-gray-500">Mic</span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2 p-3 rounded-[16px] border border-gray-100 bg-white shadow-sm">
                      <WifiCheck checking={checking} />
                      <span className="text-[11px] font-bold text-gray-500">Network</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Action Footer */}
            <div className="p-6 pt-2 bg-white sticky bottom-0 border-t border-gray-50">
              {appointment?.status === 'WAITING' || appointment?.status === 'IN PROGRESS' ? (
                <button 
                  disabled={checking}
                  onClick={onClose}
                  className="w-full bg-[#1B5DF1] text-white py-4 rounded-[16px] font-bold text-[15px] shadow-[0_8px_20px_rgba(27,93,241,0.25)] flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  <Video className="w-5 h-5" />
                  {checking ? "Checking Systems..." : (appointment.status === 'IN PROGRESS' ? "Rejoin Video Call" : "Join Video Call")}
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

function CameraCheck({ checking }: { checking: boolean }) {
  if (checking) return <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />;
  return <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center"><CheckCircle2 className="w-5 h-5" /></div>;
}

function MicCheck({ checking }: { checking: boolean }) {
  if (checking) return <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />;
  return <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center"><Mic className="w-5 h-5" /></div>;
}

function WifiCheck({ checking }: { checking: boolean }) {
  if (checking) return <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />;
  return <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center"><Wifi className="w-5 h-5" /></div>;
}
