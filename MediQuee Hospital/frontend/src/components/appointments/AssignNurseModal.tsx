import { useState, useEffect } from "react"
import { X, User, Check, AlertCircle, RefreshCw, Calendar, MapPin, Phone } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/context/ToastContext"
import { nurseApi, type HospitalNurseStaff } from "@/services/nurseApi"

interface AssignNurseModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    bookingNumber: string;
    patientName: string;
    patientPhone?: string;
    serviceName: string;
    date: string;
    time: string;
    address?: string;
    nurseId?: string | null;
    nurseName?: string | null;
  } | null;
  onAssigned: () => void;
}

export function AssignNurseModal({ isOpen, onClose, booking, onAssigned }: AssignNurseModalProps) {
  const { toast } = useToast();
  const [nurses, setNurses] = useState<HospitalNurseStaff[]>([]);
  const [selectedNurseId, setSelectedNurseId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadNurses = async () => {
      setIsLoading(true);
      try {
        const staff = await nurseApi.getHospitalNurses();
        setNurses(staff);
        if (booking?.nurseId) {
          setSelectedNurseId(booking.nurseId);
        } else if (staff.length > 0) {
          setSelectedNurseId(staff[0].id);
        }
      } catch (err: any) {
        console.error("Failed to load hospital nurses:", err);
        toast(err.message || "Failed to load hospital nurses", "error");
      } finally {
        setIsLoading(false);
      }
    };

    loadNurses();
  }, [isOpen, booking, toast]);

  if (!isOpen || !booking) return null;

  const handleAssign = async () => {
    if (!selectedNurseId) {
      toast("Please select a nurse to assign", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      await nurseApi.assignNurse(booking.id, selectedNurseId);
      const selected = nurses.find(n => n.id === selectedNurseId);
      toast(`Successfully assigned ${selected?.name || 'Nurse'} to booking ${booking.bookingNumber}`, "success");
      onAssigned();
      onClose();
    } catch (err: any) {
      toast(err.message || "Failed to assign nurse", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="bg-surface rounded-3xl w-full max-w-lg p-6 relative z-10 shadow-2xl border border-border overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
            <div>
              <h2 className="text-[18px] font-black text-[#0A1A3D]">Assign Nurse to Visit</h2>
              <p className="text-[12px] text-muted">Home Nursing Request #{booking.bookingNumber}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full text-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Booking Summary Box */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 mb-5 flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-bold text-[#1B5DF1] uppercase tracking-wider">Patient</span>
                <h4 className="text-[15px] font-bold text-[#0A1A3D]">{booking.patientName}</h4>
              </div>
              <span className="text-[12px] font-bold text-[#1B5DF1] bg-surface px-2.5 py-1 rounded-lg border border-blue-100">
                {booking.serviceName}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted pt-1">
              <span className="flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#1B5DF1]" />
                {booking.date}, {booking.time}
              </span>
              {booking.patientPhone && (
                <span className="flex items-center gap-1 font-medium">
                  <Phone className="w-3.5 h-3.5 text-[#1B5DF1]" />
                  {booking.patientPhone}
                </span>
              )}
            </div>

            {booking.address && (
              <div className="text-[12px] text-muted flex items-start gap-1 pt-1 border-t border-blue-100/70">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-[#1B5DF1] mt-0.5" />
                <span className="line-clamp-2">{booking.address}</span>
              </div>
            )}
          </div>

          {/* Nurse Selection */}
          <div className="flex flex-col gap-2 mb-6">
            <label className="text-[13px] font-bold text-[#0A1A3D] flex items-center justify-between">
              <span>Select Available Hospital Nurse</span>
              <span className="text-[12px] text-muted font-normal">{nurses.length} registered</span>
            </label>

            {isLoading ? (
              <div className="py-8 flex items-center justify-center gap-2 text-[13px] text-muted">
                <RefreshCw className="w-4 h-4 animate-spin text-[#1B5DF1]" /> Loading staff...
              </div>
            ) : nurses.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-amber-800 text-[13px]">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>No active nurses found under this hospital. Please add a nurse under Staff Management first.</span>
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto flex flex-col gap-2 pr-1">
                {nurses.map((nurse) => {
                  const isSelected = selectedNurseId === nurse.id;
                  return (
                    <div
                      key={nurse.id}
                      onClick={() => setSelectedNurseId(nurse.id)}
                      className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? "border-[#1B5DF1] bg-blue-50/50 shadow-sm"
                          : "border-border hover:border-gray-300 bg-surface"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[14px] ${
                          isSelected ? "bg-[#1B5DF1] text-white" : "bg-gray-100 text-[#0A1A3D]"
                        }`}>
                          {nurse.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-[14px] text-[#0A1A3D]">{nurse.name}</h4>
                          <p className="text-[11px] text-muted">
                            {nurse.qualification || "Registered Nurse"} 
                            {nurse.experienceYears ? ` · ${nurse.experienceYears} yrs exp` : ''}
                          </p>
                          {nurse.phone && (
                            <p className="text-[11px] text-[#1B5DF1]">{nurse.phone}</p>
                          )}
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? "border-[#1B5DF1] bg-[#1B5DF1] text-white" : "border-gray-300"
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-border text-[#0A1A3D] font-bold text-[14px] rounded-2xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAssign}
              disabled={isSubmitting || nurses.length === 0 || !selectedNurseId}
              className="flex-1 py-3 bg-[#1B5DF1] hover:bg-blue-700 text-white font-bold text-[14px] rounded-2xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Confirm & Notify"
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
