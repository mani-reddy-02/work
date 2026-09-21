import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, User, Phone, Calendar, HeartPulse, Activity, Stethoscope, 
  Plus, Trash2, CheckCircle2, Play, FlaskConical, AlertCircle, 
  Thermometer, Droplets, ShieldCheck, ChevronDown, ChevronUp, FileText
} from "lucide-react"
import { useToast } from "@/context/ToastContext"
import { 
  doctorApi, 
  type ConsultationPayload, 
  type PrescriptionItemPayload, 
  type DosageTiming, 
  type LabTestItem 
} from "@/services/doctorApi"
import { adminApi } from "@/services/adminApi"
import { cn } from "@/lib/utils"

export type DoctorAppointmentItem = {
  id: string;
  mqId?: string;
  patientName: string;
  patientPhone?: string;
  patientAge?: number | string;
  patientGender?: string;
  time?: string;
  period?: string;
  date?: string;
  type?: string;
  doctor?: string;
  status: string;
  reason?: string;
};

type DoctorConsultationWorkspaceProps = {
  isOpen: boolean;
  onClose: () => void;
  appointment: DoctorAppointmentItem | null;
  onConsultationCompleted?: () => void;
};

const FREQUENCY_OPTIONS = ['1-0-1', '1-0-0', '0-0-1', '1-1-1', 'SOS'];
const DOSAGE_FORMS = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops'];
const TIMING_OPTIONS: { value: DosageTiming; label: string }[] = [
  { value: 'AFTER_FOOD', label: 'After Food' },
  { value: 'BEFORE_FOOD', label: 'Before Food' },
  { value: 'WITH_FOOD', label: 'With Food' },
  { value: 'EMPTY_STOMACH', label: 'Empty Stomach' },
];

export function DoctorConsultationWorkspace({
  isOpen,
  onClose,
  appointment,
  onConsultationCompleted,
}: DoctorConsultationWorkspaceProps) {
  const { toast } = useToast();

  // Consultation state
  const [currentStatus, setCurrentStatus] = useState<string>('WAITING');
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [generalAdvice, setGeneralAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  // Vitals state
  const [isVitalsOpen, setIsVitalsOpen] = useState(true);
  const [systolicBp, setSystolicBp] = useState<string>('');
  const [diastolicBp, setDiastolicBp] = useState<string>('');
  const [pulseRate, setPulseRate] = useState<string>('');
  const [bodyTemperature, setBodyTemperature] = useState<string>('');
  const [spo2, setSpo2] = useState<string>('');
  const [respiratoryRate, setRespiratoryRate] = useState<string>('');
  const [weightKg, setWeightKg] = useState<string>('');
  const [heightCm, setHeightCm] = useState<string>('');

  // Prescriptions state
  const [prescriptions, setPrescriptions] = useState<PrescriptionItemPayload[]>([
    {
      medicineName: '',
      dosageForm: 'Tablet',
      strength: '',
      frequency: '1-0-1',
      durationDays: 5,
      timing: 'AFTER_FOOD',
      instructions: '',
    },
  ]);

  // Lab Tests state
  const [availableLabTests, setAvailableLabTests] = useState<LabTestItem[]>([]);
  const [selectedLabTestIds, setSelectedLabTestIds] = useState<string[]>([]);
  const [isLabDropdownOpen, setIsLabDropdownOpen] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load available lab tests & reset state when appointment changes
  useEffect(() => {
    if (isOpen && appointment) {
      setCurrentStatus(appointment.status || 'WAITING');
      setDiagnosis('');
      setClinicalNotes('');
      setGeneralAdvice('');
      setFollowUpDate('');
      setSystolicBp('');
      setDiastolicBp('');
      setPulseRate('');
      setBodyTemperature('');
      setSpo2('');
      setRespiratoryRate('');
      setWeightKg('');
      setHeightCm('');
      setPrescriptions([
        {
          medicineName: '',
          dosageForm: 'Tablet',
          strength: '',
          frequency: '1-0-1',
          durationDays: 5,
          timing: 'AFTER_FOOD',
          instructions: '',
        },
      ]);
      setSelectedLabTestIds([]);
      setValidationError(null);

      // Fetch lab tests catalog
      doctorApi.getAvailableLabTests()
        .then(tests => setAvailableLabTests(tests))
        .catch(err => console.error("Failed to load lab tests:", err));
    }
  }, [isOpen, appointment]);

  if (!isOpen || !appointment) return null;

  const handleStartConsultation = async () => {
    try {
      await adminApi.updateBookingStatus(appointment.id, 'IN_CONSULTATION');
      setCurrentStatus('IN_CONSULTATION');
      toast("Consultation started", "success");
    } catch (err: any) {
      toast(err.message || "Failed to start consultation", "error");
    }
  };

  const handleAddMedication = () => {
    setPrescriptions(prev => [
      ...prev,
      {
        medicineName: '',
        dosageForm: 'Tablet',
        strength: '',
        frequency: '1-0-1',
        durationDays: 5,
        timing: 'AFTER_FOOD',
        instructions: '',
      },
    ]);
  };

  const handleRemoveMedication = (index: number) => {
    setPrescriptions(prev => prev.filter((_, i) => i !== index));
  };

  const handleMedicationChange = (index: number, field: keyof PrescriptionItemPayload, value: any) => {
    setPrescriptions(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const toggleLabTest = (testId: string) => {
    setSelectedLabTestIds(prev => 
      prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId]
    );
  };

  const handleSubmit = async () => {
    setValidationError(null);

    // Validate diagnosis
    if (!diagnosis.trim() || diagnosis.trim().length < 3) {
      setValidationError("Please enter a clinical diagnosis (at least 3 characters).");
      return;
    }

    // Filter valid prescriptions
    const validPrescriptions = prescriptions
      .filter(p => p.medicineName.trim().length > 0)
      .map(p => ({
        ...p,
        medicineName: p.medicineName.trim(),
        durationDays: Number(p.durationDays) || 1,
      }));

    // Build vitals payload
    const vitalsPayload = {
      systolicBp: systolicBp ? parseInt(systolicBp, 10) : null,
      diastolicBp: diastolicBp ? parseInt(diastolicBp, 10) : null,
      pulseRate: pulseRate ? parseInt(pulseRate, 10) : null,
      bodyTemperature: bodyTemperature ? parseFloat(bodyTemperature) : null,
      spo2: spo2 ? parseInt(spo2, 10) : null,
      respiratoryRate: respiratoryRate ? parseInt(respiratoryRate, 10) : null,
      weightKg: weightKg ? parseFloat(weightKg) : null,
      heightCm: heightCm ? parseFloat(heightCm) : null,
    };

    const hasVitals = Object.values(vitalsPayload).some(v => v !== null && !isNaN(v as number));

    const payload: ConsultationPayload = {
      diagnosis: diagnosis.trim(),
      clinicalNotes: clinicalNotes.trim() || null,
      generalAdvice: generalAdvice.trim() || null,
      followUpDate: followUpDate || null,
      vitals: hasVitals ? vitalsPayload : null,
      prescriptions: validPrescriptions,
      labTestIds: selectedLabTestIds,
    };

    setIsSubmitting(true);
    try {
      await doctorApi.recordConsultation(appointment.id, payload);
      toast("Consultation & Prescription saved successfully!", "success");
      if (onConsultationCompleted) {
        onConsultationCompleted();
      }
      onClose();
    } catch (err: any) {
      console.error("Consultation completion failed:", err);
      toast(err.message || "Failed to complete consultation", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Workspace Container */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-[#F7F8FA] rounded-[28px] w-full max-w-4xl max-h-[92vh] relative z-10 shadow-2xl flex flex-col overflow-hidden border border-border"
        >
          {/* Top Bar / Header */}
          <div className="bg-surface px-6 py-4 flex items-center justify-between border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EBF5FF] text-[#1B5DF1] flex items-center justify-center font-bold">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[18px] font-black text-[#0A1A3D] tracking-tight">Clinical Consultation</h2>
                  <span className={cn(
                    "px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full",
                    currentStatus === 'IN_CONSULTATION' ? "bg-blue-50 text-blue-600 border border-blue-200" :
                    currentStatus === 'COMPLETED' ? "bg-emerald-50 text-emerald-600" :
                    "bg-[#EBF5FF] text-[#1B5DF1]"
                  )}>
                    {currentStatus.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-[12px] font-medium text-muted">Record diagnosis, vitals baseline, and prescription</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Clinical Workspace Body */}
          <div className="overflow-y-auto flex-1 p-4 sm:p-6 flex flex-col gap-5">

            {/* A. Patient Banner & Chief Complaint */}
            <div className="bg-surface p-5 rounded-[22px] shadow-sm border border-border flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#1B5DF1] to-[#60A5FA] flex items-center justify-center text-white font-black text-lg">
                    {appointment.patientName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-[17px] font-bold text-[#0A1A3D]">{appointment.patientName}</h3>
                    <div className="flex items-center gap-2 text-[12px] text-muted font-medium">
                      <span>{appointment.patientAge || '--'} yrs</span>
                      <span>•</span>
                      <span>{appointment.patientGender || 'Unknown'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-muted/70" />
                        {appointment.patientPhone || 'No phone'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold bg-gray-50 text-gray-600 px-3 py-1.5 rounded-xl border border-border">
                    ID: #{appointment.mqId || appointment.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span className="text-[11px] font-bold bg-[#EBF5FF] text-[#1B5DF1] px-3 py-1.5 rounded-xl">
                    {appointment.time || '10:00 AM'}
                  </span>
                </div>
              </div>

              {/* Immutable Chief Complaint */}
              <div className="flex flex-col gap-1 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted/70">Chief Complaint (Patient / Reception Reason)</span>
                <p className="text-[14px] font-semibold text-[#0A1A3D] bg-gray-50 p-3.5 rounded-xl border border-border leading-relaxed">
                  "{appointment.reason || appointment.type || 'General Consultation'}"
                </p>
              </div>
            </div>

            {/* B. Patient Vitals Input Card */}
            <div className="bg-surface rounded-[22px] shadow-sm border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setIsVitalsOpen(!isVitalsOpen)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                    <HeartPulse className="w-4 h-4" />
                  </div>
                  <h4 className="text-[15px] font-bold text-[#0A1A3D]">Patient Vitals Baseline</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-muted/70">
                    {isVitalsOpen ? "Collapse" : "Expand"}
                  </span>
                  {isVitalsOpen ? <ChevronUp className="w-4 h-4 text-muted/70" /> : <ChevronDown className="w-4 h-4 text-muted/70" />}
                </div>
              </button>

              {isVitalsOpen && (
                <div className="p-5 pt-1 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50/30">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-muted">BP Systolic (mmHg)</label>
                    <input
                      type="number"
                      placeholder="e.g. 120"
                      value={systolicBp}
                      onChange={e => setSystolicBp(e.target.value)}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-[14px] font-bold text-[#0A1A3D] outline-none focus:border-[#1B5DF1]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-muted">BP Diastolic (mmHg)</label>
                    <input
                      type="number"
                      placeholder="e.g. 80"
                      value={diastolicBp}
                      onChange={e => setDiastolicBp(e.target.value)}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-[14px] font-bold text-[#0A1A3D] outline-none focus:border-[#1B5DF1]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-muted">Pulse (bpm)</label>
                    <input
                      type="number"
                      placeholder="e.g. 74"
                      value={pulseRate}
                      onChange={e => setPulseRate(e.target.value)}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-[14px] font-bold text-[#0A1A3D] outline-none focus:border-[#1B5DF1]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-muted">Temp (°F)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 98.6"
                      value={bodyTemperature}
                      onChange={e => setBodyTemperature(e.target.value)}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-[14px] font-bold text-[#0A1A3D] outline-none focus:border-[#1B5DF1]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-muted">SpO2 (%)</label>
                    <input
                      type="number"
                      placeholder="e.g. 98"
                      value={spo2}
                      onChange={e => setSpo2(e.target.value)}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-[14px] font-bold text-[#0A1A3D] outline-none focus:border-[#1B5DF1]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-muted">Resp Rate (/min)</label>
                    <input
                      type="number"
                      placeholder="e.g. 18"
                      value={respiratoryRate}
                      onChange={e => setRespiratoryRate(e.target.value)}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-[14px] font-bold text-[#0A1A3D] outline-none focus:border-[#1B5DF1]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-muted">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 68.0"
                      value={weightKg}
                      onChange={e => setWeightKg(e.target.value)}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-[14px] font-bold text-[#0A1A3D] outline-none focus:border-[#1B5DF1]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-muted">Height (cm)</label>
                    <input
                      type="number"
                      placeholder="e.g. 170"
                      value={heightCm}
                      onChange={e => setHeightCm(e.target.value)}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-[14px] font-bold text-[#0A1A3D] outline-none focus:border-[#1B5DF1]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* C. Clinical Diagnosis & Examination Notes */}
            <div className="bg-surface p-5 rounded-[22px] shadow-sm border border-border flex flex-col gap-4">
              <div className="flex items-center gap-2.5 border-b border-border pb-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1B5DF1] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <h4 className="text-[15px] font-bold text-[#0A1A3D]">Diagnosis & Clinical Findings</h4>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#0A1A3D]">
                  Clinical Diagnosis <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acute Viral Bronchitis, Type 2 Diabetes Mellitus"
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-border rounded-xl text-[14px] font-semibold text-[#0A1A3D] outline-none focus:border-[#1B5DF1] focus:bg-surface transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-bold text-foreground/80">Clinical Examination & Symptoms</label>
                  <textarea
                    rows={3}
                    placeholder="Findings on auscultation, throat inspection, symptom duration..."
                    value={clinicalNotes}
                    onChange={e => setClinicalNotes(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-border rounded-xl text-[13px] text-foreground outline-none focus:border-[#1B5DF1] focus:bg-surface resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-bold text-foreground/80">General Advice & Lifestyle</label>
                  <textarea
                    rows={3}
                    placeholder="Dietary precautions, steam inhalation, rest instructions..."
                    value={generalAdvice}
                    onChange={e => setGeneralAdvice(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-border rounded-xl text-[13px] text-foreground outline-none focus:border-[#1B5DF1] focus:bg-surface resize-none"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                <label className="text-[12px] font-bold text-foreground/80 sm:w-36">Recommended Follow-up</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={e => setFollowUpDate(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-border rounded-xl text-[13px] font-semibold text-[#0A1A3D] outline-none focus:border-[#1B5DF1]"
                />
              </div>
            </div>

            {/* D. Electronic Prescription (Rx) Dynamic Builder */}
            <div className="bg-surface p-5 rounded-[22px] shadow-sm border border-border flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm">
                    Rx
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-[#0A1A3D]">Medications & E-Prescription</h4>
                    <p className="text-[11px] text-muted/70 font-medium">Add medications with discrete dosage and frequency</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddMedication}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EBF5FF] text-[#1B5DF1] rounded-xl font-bold text-[12px] hover:bg-blue-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Medicine
                </button>
              </div>

              {prescriptions.map((rx, idx) => (
                <div key={idx} className="p-4 bg-gray-50/60 rounded-2xl border border-border/60 flex flex-col gap-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-[#1B5DF1] tracking-wider">
                      Medicine #{idx + 1}
                    </span>
                    {prescriptions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(idx)}
                        className="p-1 text-muted/70 hover:text-red-500 transition-colors"
                        title="Remove medicine"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label className="text-[11px] font-bold text-muted">Medicine / Brand Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Augmentin 625 Duo, Pan-D, Allegra"
                        value={rx.medicineName}
                        onChange={e => handleMedicationChange(idx, 'medicineName', e.target.value)}
                        className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-[13px] font-bold text-[#0A1A3D] outline-none focus:border-[#1B5DF1]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-muted">Dosage Form</label>
                      <select
                        value={rx.dosageForm}
                        onChange={e => handleMedicationChange(idx, 'dosageForm', e.target.value)}
                        className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-[13px] font-bold text-[#0A1A3D] outline-none focus:border-[#1B5DF1]"
                      >
                        {DOSAGE_FORMS.map(df => (
                          <option key={df} value={df}>{df}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-muted">Strength</label>
                      <input
                        type="text"
                        placeholder="e.g. 500mg, 10ml"
                        value={rx.strength || ''}
                        onChange={e => handleMedicationChange(idx, 'strength', e.target.value)}
                        className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-[13px] font-semibold text-[#0A1A3D] outline-none focus:border-[#1B5DF1]"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-muted">Frequency</label>
                      <select
                        value={rx.frequency}
                        onChange={e => handleMedicationChange(idx, 'frequency', e.target.value)}
                        className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-[13px] font-bold text-[#0A1A3D] outline-none focus:border-[#1B5DF1]"
                      >
                        {FREQUENCY_OPTIONS.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-muted">Duration (Days)</label>
                      <input
                        type="number"
                        min={1}
                        value={rx.durationDays}
                        onChange={e => handleMedicationChange(idx, 'durationDays', e.target.value)}
                        className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-[13px] font-bold text-[#0A1A3D] outline-none focus:border-[#1B5DF1]"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-muted">Timing</label>
                      <select
                        value={rx.timing}
                        onChange={e => handleMedicationChange(idx, 'timing', e.target.value as DosageTiming)}
                        className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-[13px] font-bold text-[#0A1A3D] outline-none focus:border-[#1B5DF1]"
                      >
                        {TIMING_OPTIONS.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-muted">Special Instructions</label>
                    <input
                      type="text"
                      placeholder="e.g. Take with warm water at bedtime, do not skip doses"
                      value={rx.instructions || ''}
                      onChange={e => handleMedicationChange(idx, 'instructions', e.target.value)}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-[12px] font-medium text-foreground/80 outline-none focus:border-[#1B5DF1]"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* E. Diagnostic Lab Orders Selector */}
            <div className="bg-surface p-5 rounded-[22px] shadow-sm border border-border flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <FlaskConical className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-[#0A1A3D]">Prescribe Diagnostic Lab Tests</h4>
                    <p className="text-[11px] text-muted/70 font-medium">Order blood work or investigations directly for this patient</p>
                  </div>
                </div>
                <span className="text-[12px] font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg">
                  {selectedLabTestIds.length} Selected
                </span>
              </div>

              {availableLabTests.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {availableLabTests.map(test => {
                    const isSelected = selectedLabTestIds.includes(test.id);
                    return (
                      <div
                        key={test.id}
                        onClick={() => toggleLabTest(test.id)}
                        className={cn(
                          "p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all select-none",
                          isSelected
                            ? "bg-purple-50/70 border-purple-300 text-purple-900"
                            : "bg-gray-50 border-border text-foreground/80 hover:bg-gray-100"
                        )}
                      >
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold">{test.name}</span>
                          <span className="text-[11px] text-muted/70">{test.category} • ₹{test.price}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[13px] text-muted/70 italic">No hospital lab tests configured.</p>
              )}
            </div>

            {/* Validation Error Display */}
            {validationError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-red-600 text-[13px] font-bold">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}
          </div>

          {/* Sticky Action Footer */}
          <div className="bg-surface px-6 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {currentStatus !== 'IN_CONSULTATION' && currentStatus !== 'COMPLETED' && (
                <button
                  type="button"
                  onClick={handleStartConsultation}
                  className="flex-1 sm:flex-none px-5 py-3 bg-blue-50 hover:bg-blue-100 text-[#1B5DF1] rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Play className="w-4 h-4 fill-[#1B5DF1]" /> Start Consultation
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none px-5 py-3 bg-gray-100 hover:bg-gray-200 text-foreground/80 rounded-xl font-bold text-[14px] transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none px-6 py-3 bg-[#1B5DF1] hover:bg-blue-700 text-white rounded-xl font-bold text-[14px] shadow-md shadow-[#1B5DF1]/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSubmitting ? "Submitting..." : "Save & Complete Visit"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
