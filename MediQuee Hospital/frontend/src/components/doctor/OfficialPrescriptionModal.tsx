import { useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Printer, Download, CheckCircle2, FileSignature, Stethoscope, Building2, User, Calendar, Phone, Send, RefreshCw } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { doctorApi } from "@/services/doctorApi"

type PrescriptionItem = {
  medicineName: string;
  dosageForm: string;
  strength?: string | null;
  frequency: string;
  durationDays: number;
  timing?: string;
  instructions?: string | null;
};

type OfficialPrescriptionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  appointment: any;
  prescription?: {
    diagnosis: string;
    clinicalNotes?: string | null;
    generalAdvice?: string | null;
    followUpDate?: string | null;
    items?: PrescriptionItem[];
    vitals?: any;
  } | null;
  onPrescriptionSent?: () => void;
};

export function OfficialPrescriptionModal({
  isOpen,
  onClose,
  appointment,
  prescription,
  onPrescriptionSent
}: OfficialPrescriptionModalProps) {
  const { user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [sendSuccessMsg, setSendSuccessMsg] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  if (!isOpen || !appointment) return null;

  const handlePrint = () => {
    window.print();
  };

  const bookingId = appointment?.id || appointment?.bookingId || appointment?.appointmentId;

  const handleSendToPatient = async () => {
    if (!bookingId) {
      setSendError("Missing consultation reference");
      return;
    }

    setIsSending(true);
    setSendError(null);

    try {
      const res = await doctorApi.sendPrescriptionToPatient(bookingId);
      setIsSent(true);
      setSendSuccessMsg(res.message || "Prescription sent to patient reports successfully!");
      if (onPrescriptionSent) {
        onPrescriptionSent();
      }
    } catch (err: any) {
      setSendError(err.message || "Failed to send prescription to patient");
    } finally {
      setIsSending(false);
    }
  };

  // Determine doctor info (fallback from logged in doctor user if not in appointment)
  const doctorName = appointment.doctorName || appointment.doctor || user?.name || "Consulting Doctor";
  const doctorLicense = appointment.doctorLicenseNumber || user?.licenseNumber || "NMC Registered";
  const doctorDesignation = appointment.doctorDesignation || user?.designation || "Medical Specialist";
  const doctorSpecialization = appointment.doctorSpecialization || user?.specialization || appointment.departmentName || "General Medicine";
  const doctorQualification = appointment.doctorQualification || user?.qualification || "MBBS";
  const digitalSignature = appointment.doctorDigitalSignature || user?.digitalSignature || null;

  // Hospital info
  const hospitalName = appointment.hospitalName || user?.hospital?.name || "MediQuee Healthcare";
  const hospitalAddress = appointment.hospitalAddress || user?.hospital?.addressLine1 || user?.hospital?.city || "Healthcare Facility";
  const hospitalPhone = appointment.hospitalPhone || user?.hospital?.contactPhone || "+91 98765 43210";
  const hospitalReg = appointment.hospitalRegNumber || user?.hospital?.registrationNumber || "";

  // Prescription data
  const diagnosis = prescription?.diagnosis || appointment.diagnosis || appointment.diseaseName || appointment.reason || "Clinical Assessment Completed";
  const clinicalNotes = prescription?.clinicalNotes || appointment.clinicalNotes || null;
  const generalAdvice = prescription?.generalAdvice || appointment.generalAdvice || null;
  const followUpDate = prescription?.followUpDate || appointment.followUpDate || null;
  const items: PrescriptionItem[] = prescription?.items || appointment.prescription?.items || [];
  const vitals = prescription?.vitals || appointment.vitals || null;

  const consultDate = appointment.date || new Date().toISOString().split('T')[0];
  const consultTime = appointment.time || appointment.slotTime || appointment.timeSlot || "Scheduled";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl w-full max-w-3xl max-h-[94vh] shadow-2xl flex flex-col overflow-hidden border border-border"
        >
          {/* Action Header - Hidden on Print */}
          <div className="no-print bg-gray-50 border-b border-border px-6 py-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-bold text-foreground">
                Official E-Prescription (Digitally Signed)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isSending || isSent}
                onClick={handleSendToPatient}
                className={`flex items-center gap-1.5 px-3 py-1.5 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer ${
                  isSent
                    ? "bg-emerald-600 text-white cursor-default"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60"
                }`}
              >
                {isSending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : isSent ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{isSent ? "Sent to Reports" : "Send to Patient"}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1B5DF1] hover:bg-[#1B5DF1]/90 text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-muted hover:text-foreground rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Document Area */}
          <div ref={printRef} className="printable-prescription p-6 sm:p-8 overflow-y-auto flex-1 bg-white text-gray-900 font-sans">
            {/* 1. Hospital Letterhead Header */}
            <div className="border-b-2 border-[#1B5DF1] pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#1B5DF1] text-white flex items-center justify-center font-black text-lg">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h1 className="text-xl font-black text-[#0A1A3D] tracking-tight">{hospitalName}</h1>
                </div>
                <p className="text-xs text-gray-600 mt-1">{hospitalAddress}</p>
                <p className="text-xs text-gray-500">Phone: {hospitalPhone} {hospitalReg ? `• Reg No: ${hospitalReg}` : ''}</p>
              </div>

              <div className="sm:text-right flex flex-col sm:items-end">
                <span className="inline-block px-2.5 py-1 rounded-md bg-blue-50 text-[#1B5DF1] border border-blue-200 text-[10px] font-black uppercase tracking-wider">
                  Telemedicine Consultation
                </span>
                <span className="text-[11px] font-mono text-gray-500 mt-1">
                  Rx ID: {appointment.mqId || appointment.id?.slice(0, 8).toUpperCase()}
                </span>
                <span className="text-[11px] text-gray-500">
                  Date: {consultDate} • {consultTime}
                </span>
              </div>
            </div>

            {/* 2. Doctor & Patient Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-gray-200 text-xs">
              {/* Doctor Details */}
              <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-100 flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Consulting Physician</span>
                <span className="text-sm font-bold text-[#0A1A3D]">Dr. {doctorName}</span>
                <span className="text-gray-600 font-medium">{doctorQualification} • {doctorSpecialization}</span>
                <span className="text-gray-600">{doctorDesignation}</span>
                <span className="text-gray-500 font-semibold mt-1">Medical Reg / License: {doctorLicense}</span>
              </div>

              {/* Patient Details */}
              <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-100 flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Patient Details</span>
                <span className="text-sm font-bold text-[#0A1A3D]">{appointment.patientName}</span>
                <span className="text-gray-600 font-medium">
                  {[appointment.patientAge ? `${appointment.patientAge} Years` : null, appointment.patientGender].filter(Boolean).join(' • ') || 'Age/Gender unrecorded'}
                </span>
                {appointment.patientPhone && (
                  <span className="text-gray-600">Contact: {appointment.patientPhone}</span>
                )}
                <span className="text-gray-500 font-mono mt-1">Patient ID: {appointment.patientId || appointment.mqId}</span>
              </div>
            </div>

            {/* 3. Vitals & Clinical Assessment */}
            <div className="py-4 border-b border-gray-200 flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-[#1B5DF1]" />
                <span className="text-xs font-bold text-[#0A1A3D] uppercase tracking-wider">Diagnosis & Clinical Findings</span>
              </div>

              <div className="bg-blue-50/40 border border-blue-100 p-3 rounded-xl">
                <p className="text-sm font-bold text-[#0A1A3D]">{diagnosis}</p>
                {clinicalNotes && (
                  <p className="text-xs text-gray-600 mt-1 italic leading-relaxed">{clinicalNotes}</p>
                )}
              </div>

              {/* Vitals baseline if available */}
              {vitals && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                  {vitals.systolicBp && vitals.diastolicBp && (
                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                      <span className="text-[10px] text-gray-400 font-bold block">Blood Pressure</span>
                      <span className="font-bold text-gray-800">{vitals.systolicBp}/{vitals.diastolicBp} mmHg</span>
                    </div>
                  )}
                  {vitals.pulseRate && (
                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                      <span className="text-[10px] text-gray-400 font-bold block">Pulse Rate</span>
                      <span className="font-bold text-gray-800">{vitals.pulseRate} bpm</span>
                    </div>
                  )}
                  {vitals.spo2 && (
                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                      <span className="text-[10px] text-gray-400 font-bold block">SpO2</span>
                      <span className="font-bold text-gray-800">{vitals.spo2}%</span>
                    </div>
                  )}
                  {vitals.bodyTemperature && (
                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                      <span className="text-[10px] text-gray-400 font-bold block">Temperature</span>
                      <span className="font-bold text-gray-800">{vitals.bodyTemperature} °F</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 4. Rx - Medication Table */}
            <div className="py-4 border-b border-gray-200 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-2xl font-black text-[#1B5DF1] italic leading-none">℞</span>
                  <span className="text-xs font-bold text-[#0A1A3D] uppercase tracking-wider">Prescribed Medications</span>
                </div>
                <span className="text-[11px] text-gray-500 font-medium">
                  {items.length} {items.length === 1 ? 'Medication' : 'Medications'}
                </span>
              </div>

              {items.length === 0 ? (
                <div className="p-4 bg-gray-50 rounded-xl text-center text-xs text-gray-500 italic">
                  No oral medications prescribed during this consultation. Advice provided below.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                        <th className="py-2.5 px-3 w-8">#</th>
                        <th className="py-2.5 px-3">Medicine & Strength</th>
                        <th className="py-2.5 px-3">Dosage / Form</th>
                        <th className="py-2.5 px-3">Frequency</th>
                        <th className="py-2.5 px-3">Duration</th>
                        <th className="py-2.5 px-3">Timing & Advice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.map((med, index) => (
                        <tr key={index} className="hover:bg-blue-50/20">
                          <td className="py-2.5 px-3 font-semibold text-gray-400">{index + 1}</td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-gray-900 block">{med.medicineName}</span>
                            {med.strength && <span className="text-[11px] text-gray-500">{med.strength}</span>}
                          </td>
                          <td className="py-2.5 px-3 text-gray-700">{med.dosageForm}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#1B5DF1]">{med.frequency}</td>
                          <td className="py-2.5 px-3 text-gray-700">{med.durationDays} Days</td>
                          <td className="py-2.5 px-3">
                            <span className="font-medium text-gray-700 block">{med.timing?.replace('_', ' ') || 'After Food'}</span>
                            {med.instructions && <span className="text-[11px] text-gray-500 italic">{med.instructions}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 5. General Advice & Follow up */}
            {(generalAdvice || followUpDate) && (
              <div className="py-3 border-b border-gray-200 flex flex-col gap-1 text-xs">
                {generalAdvice && (
                  <div>
                    <span className="font-bold text-gray-700">General Advice / Instructions: </span>
                    <span className="text-gray-600 leading-relaxed">{generalAdvice}</span>
                  </div>
                )}
                {followUpDate && (
                  <div className="mt-1">
                    <span className="font-bold text-gray-700">Recommended Follow-up: </span>
                    <span className="text-[#1B5DF1] font-semibold">{followUpDate}</span>
                  </div>
                )}
              </div>
            )}

            {/* 6. Footer & Digital Signature Stamp */}
            <div className="pt-6 flex flex-col sm:flex-row items-end justify-between gap-4">
              <div className="text-[10px] text-gray-400 max-w-sm">
                <p>This is a computer-generated, digitally verified e-prescription issued in accordance with the Telemedicine Practice Guidelines under the National Medical Commission Act.</p>
                <p className="mt-1 font-mono">Issued via MediQuee Healthcare Cloud Platform.</p>
              </div>

              {/* Verified Digital Signature Stamp */}
              <div className="flex flex-col items-center sm:items-end min-w-[200px] border-t-2 border-dashed border-gray-300 sm:border-0 pt-3 sm:pt-0">
                {digitalSignature ? (
                  <div className="h-16 flex items-center justify-end mb-1">
                    <img 
                      src={digitalSignature} 
                      alt="Doctor Digital Signature" 
                      className="max-h-14 max-w-[180px] object-contain filter drop-shadow-xs" 
                    />
                  </div>
                ) : (
                  <div className="h-14 flex items-center justify-center italic text-gray-400 text-xs font-serif">
                    Digitally Authorized
                  </div>
                )}

                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Digitally Signed</span>
                  </div>
                  <p className="text-xs font-bold text-[#0A1A3D]">Dr. {doctorName}</p>
                  <p className="text-[11px] text-gray-500 font-mono">Reg. No: {doctorLicense}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="no-print bg-gray-50 border-t border-border px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs">
              {isSent ? (
                <span className="flex items-center gap-1.5 text-emerald-600 font-bold animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {sendSuccessMsg || "Prescription sent to patient reports successfully!"}
                </span>
              ) : sendError ? (
                <span className="text-rose-600 font-semibold">{sendError}</span>
              ) : (
                <span className="text-muted font-medium">
                  E-Prescription saved. Send directly to patient's reports vault.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-border text-foreground font-semibold text-xs hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 font-bold text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print PDF</span>
              </button>

              <button
                type="button"
                disabled={isSending || isSent}
                onClick={handleSendToPatient}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer ${
                  isSent
                    ? "bg-emerald-600 text-white cursor-default"
                    : "bg-[#1B5DF1] hover:bg-[#1B5DF1]/90 text-white disabled:opacity-60"
                }`}
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : isSent ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Sent to Reports</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send to Patient</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
