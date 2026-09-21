import { X, Calendar, User, Phone, CheckCircle, Play, FileText } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

export type AppointmentDetail = {
  id: string | number;
  patientName: string;
  patientPhone?: string;
  time: string;
  type: string;
  doctor: string;
  status: string;
  date?: string;
  notes?: string;
}

type AppointmentDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  appointment: AppointmentDetail | null;
  onUpdateStatus?: (id: string, status: string, notes?: string) => Promise<void>;
}

export function AppointmentDetailModal({ isOpen, onClose, appointment, onUpdateStatus }: AppointmentDetailModalProps) {
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen || !appointment) return null;

  const handleStatusChange = async (newStatus: string) => {
    if (!onUpdateStatus) return;
    setIsUpdating(true);
    try {
      await onUpdateStatus(String(appointment.id), newStatus, notes || undefined);
      onClose();
    } catch (err) {
      console.error("Failed to update status from modal:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-surface rounded-3xl w-full max-w-md p-6 relative z-10 shadow-2xl overflow-hidden"
        >
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl -z-10 translate-x-10 -translate-y-10" />

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-foreground">Consultation Details</h2>
            <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col gap-5">
            {/* Patient Info */}
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-border">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold">
                <User className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground text-lg truncate">{appointment.patientName}</h3>
                <div className="flex items-center gap-1.5 text-sm text-muted mt-1">
                  <Phone className="w-3.5 h-3.5" />
                  {appointment.patientPhone || 'No phone provided'}
                </div>
              </div>
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                {appointment.status}
              </span>
            </div>

            {/* Appointment Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-orange-50/70 border border-orange-100 p-3.5 rounded-2xl">
                <div className="text-orange-500 mb-1.5">
                  <Calendar className="w-4 h-4" />
                </div>
                <p className="text-[10px] text-orange-600/80 font-bold uppercase tracking-wider mb-0.5">Date & Time</p>
                <p className="font-bold text-foreground text-sm">{appointment.time}</p>
                <p className="text-xs text-muted mt-0.5">{appointment.date || 'Today'}</p>
              </div>
              
              <div className="bg-purple-50/70 border border-purple-100 p-3.5 rounded-2xl">
                <div className="text-purple-500 mb-1.5">
                  <User className="w-4 h-4" />
                </div>
                <p className="text-[10px] text-purple-600/80 font-bold uppercase tracking-wider mb-0.5">Assigned Doctor</p>
                <p className="font-bold text-foreground text-sm truncate">{appointment.doctor}</p>
                <p className="text-xs text-muted mt-0.5 truncate">{appointment.type}</p>
              </div>
            </div>

            {/* Consultation Notes / Clinical Findings */}
            <div>
              <label className="text-xs font-bold text-foreground/80 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Clinical Notes & Prescription
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter diagnosis, symptoms, or prescription advice..."
                rows={3}
                className="w-full bg-gray-50 border border-border text-foreground rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
              />
            </div>

            {/* Direct Link to Full Patient Record */}
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/patients/${appointment.id}`);
              }}
              className="w-full py-2.5 bg-blue-50/80 hover:bg-blue-100/80 text-[#1B5DF1] border border-blue-200/60 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-95"
            >
              <User className="w-4 h-4 text-[#1B5DF1]" />
              View Full Patient Profile & History
            </button>

            {/* Actions */}
            {onUpdateStatus && (
              <div className="flex flex-col gap-2.5 pt-2">
                {appointment.status !== 'IN_CONSULTATION' && appointment.status !== 'COMPLETED' && (
                  <button
                    disabled={isUpdating}
                    onClick={() => handleStatusChange('IN_CONSULTATION')}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Start Consultation
                  </button>
                )}

                {appointment.status !== 'COMPLETED' && (
                  <button
                    disabled={isUpdating}
                    onClick={() => handleStatusChange('COMPLETED')}
                    className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-200 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Complete Consultation
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
