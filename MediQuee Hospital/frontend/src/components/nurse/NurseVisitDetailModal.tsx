import { X, MapPin, Phone, Clock, Calendar, CheckCircle, Play, FileText, IndianRupee, Copy, ExternalLink } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { type NurseVisit } from "@/services/nurseApi"
import { useToast } from "@/context/ToastContext"

interface NurseVisitDetailModalProps {
  visit: NurseVisit | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus?: (visitId: string, status: 'IN_PROGRESS' | 'COMPLETED') => Promise<void>;
  actionLoadingId?: string | null;
}

export function NurseVisitDetailModal({
  visit,
  isOpen,
  onClose,
  onUpdateStatus,
  actionLoadingId,
}: NurseVisitDetailModalProps) {
  const { toast } = useToast();

  if (!visit) return null;

  const handleCopyAddress = () => {
    const full = `${visit.address}${visit.city ? `, ${visit.city}` : ''}${visit.pincode ? ` - ${visit.pincode}` : ''}`;
    navigator.clipboard.writeText(full).then(() => {
      toast("Address copied to clipboard", "success");
    }).catch(() => {
      toast("Failed to copy address", "error");
    });
  };

  const handleOpenMap = () => {
    const query = encodeURIComponent(`${visit.address}${visit.city ? `, ${visit.city}` : ''}${visit.pincode ? ` ${visit.pincode}` : ''}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const statusColor = visit.rawStatus === 'IN_PROGRESS'
    ? "bg-orange-50 text-orange-700 border-orange-200"
    : visit.rawStatus === 'COMPLETED'
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : visit.rawStatus === 'CANCELLED'
    ? "bg-red-50 text-red-700 border-red-200"
    : "bg-blue-50 text-blue-700 border-blue-200";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-t-[28px] shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between px-5 pb-4 pt-2">
              <div>
                <h2 className="text-[20px] font-black text-[#0A1A3D] tracking-tight">Visit Details</h2>
                <p className="text-[12px] font-semibold text-blue-600 mt-0.5">{visit.bookingNumber}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-1 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status badge */}
            <div className="px-5 mb-4">
              <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold uppercase tracking-wider rounded-xl border", statusColor)}>
                {visit.rawStatus === 'IN_PROGRESS' && <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />}
                {visit.rawStatus === 'COMPLETED' && <CheckCircle className="w-3.5 h-3.5" />}
                {visit.status}
              </span>
            </div>

            {/* Patient info */}
            <div className="px-5 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-black text-[18px] shadow-md">
                  {visit.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-[18px] text-[#0A1A3D]">{visit.name}</h3>
                  <a
                    href={`tel:${visit.patientPhone}`}
                    className="text-[13px] font-semibold text-[#1B5DF1] hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" /> {visit.patientPhone}
                  </a>
                </div>
              </div>
            </div>

            {/* Service details */}
            <div className="mx-5 mb-4 bg-gray-50 rounded-2xl p-4 border border-border/60">
              <h4 className="text-[11px] font-bold text-muted/70 uppercase tracking-wider mb-2">Service</h4>
              <p className="font-bold text-[15px] text-[#0A1A3D] mb-1">{visit.service}</p>
              {visit.serviceCategory && (
                <p className="text-[12px] text-muted font-medium">Category: {visit.serviceCategory}</p>
              )}
            </div>

            {/* Date & Time */}
            <div className="mx-5 mb-4 grid grid-cols-2 gap-3">
              <div className="bg-blue-50/60 rounded-xl p-3 border border-blue-100/60">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600/80 uppercase tracking-wider mb-1">
                  <Calendar className="w-3.5 h-3.5" /> Date
                </div>
                <p className="font-bold text-[14px] text-[#0A1A3D]">{visit.date}</p>
              </div>
              <div className="bg-blue-50/60 rounded-xl p-3 border border-blue-100/60">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600/80 uppercase tracking-wider mb-1">
                  <Clock className="w-3.5 h-3.5" /> Time
                </div>
                <p className="font-bold text-[14px] text-[#0A1A3D]">{visit.time}</p>
              </div>
            </div>

            {/* Duration & Fee */}
            <div className="mx-5 mb-4 grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 border border-border/60">
                <p className="text-[11px] font-bold text-muted/70 uppercase tracking-wider mb-1">Duration</p>
                <p className="font-bold text-[14px] text-[#0A1A3D]">{visit.duration || "N/A"}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-border/60">
                <p className="text-[11px] font-bold text-muted/70 uppercase tracking-wider mb-1">Total Fee</p>
                <p className="font-bold text-[14px] text-[#0A1A3D] flex items-center gap-0.5">
                  <IndianRupee className="w-3.5 h-3.5" /> {visit.totalAmount}
                </p>
              </div>
            </div>

            {/* Address */}
            <div className="mx-5 mb-4 bg-gray-50 rounded-2xl p-4 border border-border/60">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[11px] font-bold text-muted/70 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Address
                </h4>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleCopyAddress}
                    className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-muted hover:text-[#0A1A3D]"
                    title="Copy address"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleOpenMap}
                    className="p-1.5 rounded-lg hover:bg-blue-100 transition-colors text-[#1B5DF1]"
                    title="Open in Google Maps"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-[14px] text-[#0A1A3D] font-medium leading-relaxed">
                {visit.address}
                {visit.city && <>, {visit.city}</>}
                {visit.pincode && <> - {visit.pincode}</>}
              </p>
            </div>

            {/* Notes */}
            {visit.notes && (
              <div className="mx-5 mb-4 bg-amber-50/70 rounded-2xl p-4 border border-amber-200/60">
                <h4 className="text-[11px] font-bold text-amber-800/70 uppercase tracking-wider flex items-center gap-1 mb-2">
                  <FileText className="w-3.5 h-3.5" /> Clinical Notes
                </h4>
                <p className="text-[13px] text-amber-900 font-medium leading-relaxed">{visit.notes}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="px-5 pb-8 pt-2 flex flex-col gap-2.5">
              {/* Call button */}
              <a
                href={`tel:${visit.patientPhone}`}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-50 hover:bg-gray-100 border border-border text-[#0A1A3D] rounded-2xl font-bold text-[14px] transition-colors active:scale-[0.98]"
              >
                <Phone className="w-4.5 h-4.5 text-[#1B5DF1]" /> Call Patient
              </a>

              {/* Status-dependent action button */}
              {visit.rawStatus === 'IN_PROGRESS' && onUpdateStatus && (
                <button
                  onClick={() => onUpdateStatus(visit.id, 'COMPLETED')}
                  disabled={actionLoadingId === visit.id}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-[14px] shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <CheckCircle className="w-4.5 h-4.5" />
                  {actionLoadingId === visit.id ? "Completing..." : "Complete Service"}
                </button>
              )}

              {visit.rawStatus !== 'IN_PROGRESS' && visit.rawStatus !== 'COMPLETED' && visit.rawStatus !== 'CANCELLED' && onUpdateStatus && (
                <button
                  onClick={() => onUpdateStatus(visit.id, 'IN_PROGRESS')}
                  disabled={actionLoadingId === visit.id}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#1B5DF1] hover:bg-blue-700 text-white rounded-2xl font-bold text-[14px] shadow-lg shadow-[#1B5DF1]/20 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <Play className="w-4.5 h-4.5 fill-white" />
                  {actionLoadingId === visit.id ? "Starting..." : "Start Visit"}
                </button>
              )}

              {visit.rawStatus === 'COMPLETED' && (
                <div className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl font-bold text-[14px]">
                  <CheckCircle className="w-4.5 h-4.5" /> Service Completed
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
