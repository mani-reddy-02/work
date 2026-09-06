import { X, Calendar, User, Phone, CheckCircle, CalendarDays, XCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type Appointment = {
  id: number;
  patientName: string;
  time: string;
  type: string;
  doctor: string;
  status: string;
}

type AppointmentDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}

export function AppointmentDetailModal({ isOpen, onClose, appointment }: AppointmentDetailModalProps) {
  if (!isOpen || !appointment) return null;

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
          className="bg-white rounded-3xl w-full max-w-md p-6 relative z-10 shadow-2xl overflow-hidden"
        >
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl -z-10 translate-x-10 -translate-y-10" />

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Appointment Details</h2>
            <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col gap-6">
            {/* Patient Info */}
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <User className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-800 text-lg truncate">{appointment.patientName}</h3>
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                  <Phone className="w-3.5 h-3.5" />
                  +91 98765 43210
                </div>
              </div>
            </div>

            {/* Appointment Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl">
                <div className="text-orange-500 mb-2">
                  <Calendar className="w-5 h-5" />
                </div>
                <p className="text-xs text-orange-600/70 font-semibold uppercase tracking-wider mb-1">Date & Time</p>
                <p className="font-bold text-gray-800 text-sm">{appointment.time}</p>
                <p className="text-xs text-gray-500 mt-0.5">Today</p>
              </div>
              
              <div className="bg-purple-50 border border-purple-100 p-4 rounded-2xl">
                <div className="text-purple-500 mb-2">
                  <User className="w-5 h-5" />
                </div>
                <p className="text-xs text-purple-600/70 font-semibold uppercase tracking-wider mb-1">Doctor</p>
                <p className="font-bold text-gray-800 text-sm truncate">{appointment.doctor}</p>
                <p className="text-xs text-gray-500 mt-0.5">{appointment.type}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 mt-2">
              <button className="w-full py-3.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors">
                <CheckCircle className="w-5 h-5" />
                Mark as Completed
              </button>
              
              <div className="flex gap-3">
                <button className="flex-1 py-3.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
                  <CalendarDays className="w-5 h-5" />
                  Reschedule
                </button>
                <button className="flex-1 py-3.5 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
                  <XCircle className="w-5 h-5" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
