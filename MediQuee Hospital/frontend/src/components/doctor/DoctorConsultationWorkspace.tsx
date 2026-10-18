import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, User, Phone, Calendar, HeartPulse, Activity, Stethoscope, 
  Plus, Trash2, CheckCircle2, Play, FlaskConical, AlertCircle, 
  Thermometer, Droplets, ShieldCheck, ChevronDown, ChevronUp, FileText,
  Sparkles, Check, Building2
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
import { OfficialPrescriptionModal } from "./OfficialPrescriptionModal"

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

const COMMON_MEDICINES_CATALOG = [
  "Paracetamol 650mg",
  "Dolo 650",
  "Pantoprazole 40mg",
  "Pan-D (Pantoprazole + Domperidone)",
  "Amoxicillin 500mg",
  "Augmentin 625 Duo (Amoxyclav)",
  "Azithromycin 500mg",
  "Cetirizine 10mg",
  "Levocetirizine 5mg",
  "Montair-LC (Montelukast + Levocet)",
  "Metformin 500mg",
  "Amlodipine 5mg",
  "Telmisartan 40mg",
  "Ibuprofen 400mg",
  "Combiflam",
  "Omeprazole 20mg",
  "Ciprofloxacin 500mg",
  "Ofloxacin 200mg",
  "Cough Syrup 100ml",
  "ORS Oral Rehydration Salts",
  "Vitamin C 500mg (Limcee)",
  "Zinc 50mg (Zincovit)",
  "B-Complex Capsule (Becosules)",
  "Ranitidine 150mg"
];

const FREQUENCY_PILLS = [
  { value: '1-0-1', label: '1-0-1 (M-N)' },
  { value: '1-1-1', label: '1-1-1 (3x)' },
  { value: '1-0-0', label: '1-0-0 (M)' },
  { value: '0-0-1', label: '0-0-1 (N)' },
  { value: 'SOS', label: 'SOS' },
];

const TIMING_PILLS: { value: DosageTiming; label: string }[] = [
  { value: 'AFTER_FOOD', label: 'After Food' },
  { value: 'BEFORE_FOOD', label: 'Before Food' },
  { value: 'WITH_FOOD', label: 'With Food' },
];

const DURATION_PILLS = [
  { days: 3, label: '3 Days' },
  { days: 5, label: '5 Days' },
  { days: 7, label: '7 Days' },
  { days: 10, label: '10 Days' },
  { days: 15, label: '15 Days' },
  { days: 30, label: '1 Month' },
];

const QUICK_DIAGNOSES = [
  'Viral Fever',
  'Acute Bronchitis',
  'Gastroenteritis / Dyspepsia',
  'Hypertension Follow-up',
  'Type 2 Diabetes Mellitus',
  'Migraine / Tension Headache',
  'Allergic Rhinitis / Sinusitis',
  'Upper RTI'
];

const GENERAL_ADVICE_PRESETS = [
  '+ Drink plenty of warm water',
  '+ Adequate rest for 3 days',
  '+ Avoid oily & spicy food',
  '+ Steam inhalation twice daily',
  '+ Monitor temperature every 6 hours'
];

const FOLLOWUP_TIMEFRAMES = [
  { days: 1, label: 'Immediate / Tomorrow' },
  { days: 3, label: 'After 3 Days' },
  { days: 5, label: 'After 5 Days' },
  { days: 7, label: 'After 1 Week' },
  { days: 14, label: 'After 2 Weeks' },
];

const PHYSICAL_FOLLOWUP_REASONS = [
  'Physical Examination Required',
  'Lab Report Review',
  'Wound / Dressing Check',
  'Routine Checkup',
];

export function DoctorConsultationWorkspace({
  isOpen,
  onClose,
  appointment,
  onConsultationCompleted,
}: DoctorConsultationWorkspaceProps) {
  const { toast } = useToast();

  const [currentStatus, setCurrentStatus] = useState<string>('WAITING');
  const [diagnosis, setDiagnosis] = useState('');
  const [generalAdvice, setGeneralAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [suggestPhysicalFollowUp, setSuggestPhysicalFollowUp] = useState<boolean>(false);
  const [physicalFollowUpReason, setPhysicalFollowUpReason] = useState<string>('Physical Examination Required');
  const [completedPrescription, setCompletedPrescription] = useState<any | null>(null);

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

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Helper for applying timeframe pills to date input
  const applyFollowUpDays = (days: number) => {
    const target = new Date();
    target.setDate(target.getDate() + days);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    setFollowUpDate(`${yyyy}-${mm}-${dd}`);
  };

  // Helper for quick-appending advice chips
  const handleAdviceChipClick = (chipText: string) => {
    const cleanText = chipText.replace(/^\+\s*/, '').trim();
    setGeneralAdvice(prev => {
      if (!prev || !prev.trim()) return cleanText;
      if (prev.includes(cleanText)) return prev;
      return `${prev.trim()}\n• ${cleanText}`;
    });
  };

  // Load available lab tests & reset/preload state when appointment changes
  useEffect(() => {
    if (isOpen && appointment) {
      setCurrentStatus(appointment.status || 'WAITING');

      // 1. Initial preload from appointment props
      const initialDiag = (appointment as any).diagnosis || (appointment as any).diseaseName || appointment.reason || '';
      setDiagnosis(initialDiag);
      setGeneralAdvice((appointment as any).generalAdvice || '');
      setFollowUpDate((appointment as any).followUpDate ? (appointment as any).followUpDate.split('T')[0] : '');
      setSuggestPhysicalFollowUp(Boolean((appointment as any).suggestPhysicalFollowUp || (appointment as any).prescription?.suggestPhysicalFollowUp));
      setPhysicalFollowUpReason((appointment as any).physicalFollowUpReason || (appointment as any).prescription?.physicalFollowUpReason || 'Physical Examination Required');

      const existingItems = (appointment as any).prescription?.items;
      if (Array.isArray(existingItems) && existingItems.length > 0) {
        setPrescriptions(existingItems.map((item: any) => ({
          medicineName: item.medicineName || '',
          dosageForm: item.dosageForm || 'Tablet',
          strength: item.strength || '',
          frequency: item.frequency || '1-0-1',
          durationDays: item.durationDays || 5,
          timing: (item.timing as DosageTiming) || 'AFTER_FOOD',
          instructions: item.instructions || '',
        })));
      } else {
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
      }

      // Initial Vitals from props if present
      const vit = (appointment as any).vitals;
      if (vit) {
        setSystolicBp(vit.systolicBp != null ? String(vit.systolicBp) : '');
        setDiastolicBp(vit.diastolicBp != null ? String(vit.diastolicBp) : '');
        setPulseRate(vit.pulseRate != null ? String(vit.pulseRate) : '');
        setBodyTemperature(vit.bodyTemperature != null ? String(vit.bodyTemperature) : '');
        setSpo2(vit.spo2 != null ? String(vit.spo2) : '');
        setRespiratoryRate(vit.respiratoryRate != null ? String(vit.respiratoryRate) : '');
        setWeightKg(vit.weightKg != null ? String(vit.weightKg) : '');
        setHeightCm(vit.heightCm != null ? String(vit.heightCm) : '');
      } else {
        setSystolicBp('');
        setDiastolicBp('');
        setPulseRate('');
        setBodyTemperature('');
        setSpo2('');
        setRespiratoryRate('');
        setWeightKg('');
        setHeightCm('');
      }

      setSelectedLabTestIds([]);
      setValidationError(null);

      // 2. Fetch full appointment details asynchronously to ensure fresh database values
      if (appointment.id) {
        doctorApi.getAppointmentById(appointment.id).then((fullData: any) => {
          if (!fullData) return;
          if (fullData.status) setCurrentStatus(fullData.status);

          if (fullData.prescription) {
            if (fullData.prescription.diagnosis) setDiagnosis(fullData.prescription.diagnosis);
            if (fullData.prescription.generalAdvice) setGeneralAdvice(fullData.prescription.generalAdvice);
            if (fullData.prescription.followUpDate) {
              setFollowUpDate(fullData.prescription.followUpDate.split('T')[0]);
            }
            if (fullData.prescription.suggestPhysicalFollowUp != null) {
              setSuggestPhysicalFollowUp(Boolean(fullData.prescription.suggestPhysicalFollowUp));
            }
            if (fullData.prescription.physicalFollowUpReason) {
              setPhysicalFollowUpReason(fullData.prescription.physicalFollowUpReason);
            }
            if (Array.isArray(fullData.prescription.items) && fullData.prescription.items.length > 0) {
              setPrescriptions(fullData.prescription.items.map((item: any) => ({
                medicineName: item.medicineName || '',
                dosageForm: item.dosageForm || 'Tablet',
                strength: item.strength || '',
                frequency: item.frequency || '1-0-1',
                durationDays: item.durationDays || 5,
                timing: (item.timing as DosageTiming) || 'AFTER_FOOD',
                instructions: item.instructions || '',
              })));
            }
          } else if (fullData.diseaseName || fullData.reason) {
            setDiagnosis(prev => prev || fullData.diseaseName || fullData.reason || '');
          }

          if (fullData.vitals) {
            if (fullData.vitals.systolicBp != null) setSystolicBp(String(fullData.vitals.systolicBp));
            if (fullData.vitals.diastolicBp != null) setDiastolicBp(String(fullData.vitals.diastolicBp));
            if (fullData.vitals.pulseRate != null) setPulseRate(String(fullData.vitals.pulseRate));
            if (fullData.vitals.bodyTemperature != null) setBodyTemperature(String(fullData.vitals.bodyTemperature));
            if (fullData.vitals.spo2 != null) setSpo2(String(fullData.vitals.spo2));
            if (fullData.vitals.respiratoryRate != null) setRespiratoryRate(String(fullData.vitals.respiratoryRate));
            if (fullData.vitals.weightKg != null) setWeightKg(String(fullData.vitals.weightKg));
            if (fullData.vitals.heightCm != null) setHeightCm(String(fullData.vitals.heightCm));
          }
        }).catch((err: any) => {
          console.error("Failed to load appointment details for consultation workspace:", err);
        });
      }

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
      clinicalNotes: null, // Removed clinical examination box per redesign
      generalAdvice: generalAdvice.trim() || null,
      followUpDate: followUpDate || null,
      suggestPhysicalFollowUp: suggestPhysicalFollowUp,
      physicalFollowUpReason: suggestPhysicalFollowUp ? (physicalFollowUpReason.trim() || 'Physical Examination Required') : null,
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
      setCompletedPrescription({
        diagnosis: payload.diagnosis,
        clinicalNotes: null,
        generalAdvice: payload.generalAdvice,
        followUpDate: payload.followUpDate,
        suggestPhysicalFollowUp: payload.suggestPhysicalFollowUp,
        physicalFollowUpReason: payload.physicalFollowUpReason,
        items: payload.prescriptions,
        vitals: payload.vitals,
      });
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

        {/* Global Datalist for Fast Medicine Autocomplete */}
        <datalist id="common-medicines-catalog">
          {COMMON_MEDICINES_CATALOG.map((med, idx) => (
            <option key={idx} value={med} />
          ))}
        </datalist>
        
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
                <p className="text-[12px] font-medium text-muted">High-speed e-prescription and clinical consultation workflow</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-muted hover:text-foreground rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Form Body */}
          <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
            {/* Validation Error Banner */}
            {validationError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* A. Patient Summary Banner */}
            <div className="bg-surface p-4 rounded-2xl border border-border flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#1B5DF1] text-white flex items-center justify-center font-black text-lg">
                  {appointment.patientName[0]?.toUpperCase() || 'P'}
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#0A1A3D]">{appointment.patientName}</h3>
                  <div className="flex items-center gap-2 text-[12px] font-medium text-muted mt-0.5">
                    <span>ID: {appointment.mqId || appointment.id.slice(0, 8)}</span>
                    <span>•</span>
                    <span>{[appointment.patientAge ? `${appointment.patientAge} Yrs` : null, appointment.patientGender].filter(Boolean).join(' / ') || 'Age/Gender N/A'}</span>
                    {appointment.patientPhone && (
                      <>
                        <span>•</span>
                        <span>{appointment.patientPhone}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold bg-[#EBF5FF] text-[#1B5DF1] px-3 py-1.5 rounded-xl border border-blue-100">
                  {appointment.type || 'General Consultation'}
                </span>
                <span className="text-[11px] font-bold bg-gray-50 text-foreground/80 px-3 py-1.5 rounded-xl border border-border">
                  {appointment.time || 'Today'}
                </span>
              </div>
            </div>

            {/* B. Patient Vitals Baseline (Collapsible) */}
            <div className="bg-surface p-5 rounded-[22px] shadow-sm border border-border flex flex-col gap-3">
              <div 
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => setIsVitalsOpen(prev => !prev)}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                    <HeartPulse className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-[#0A1A3D]">Patient Vitals Baseline</h4>
                    <p className="text-[11px] text-muted/70 font-medium">Recorded clinical indicators for this visit</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="p-1.5 text-muted hover:text-[#0A1A3D] rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {isVitalsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {isVitalsOpen && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border">
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

            {/* C. MEDICATIONS & E-PRESCRIPTION (FIRST SECTION - TOP OF FORM) */}
            <div className="bg-surface p-5 rounded-[22px] shadow-sm border border-border flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm">
                    Rx
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-[#0A1A3D]">Medications & E-Prescription</h4>
                    <p className="text-[11px] text-muted/70 font-medium">Quick-enter medications with 1-click frequency, timing, and duration pills</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddMedication}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EBF5FF] text-[#1B5DF1] rounded-xl font-bold text-[12px] hover:bg-blue-100 transition-colors cursor-pointer active:scale-95 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Medicine
                </button>
              </div>

              {/* Quick Add Common Medicines Strip */}
              <div className="flex flex-col gap-1.5 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#1B5DF1]" />
                  Quick Add Common Medicines:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { name: 'Paracetamol 650mg', form: 'Tablet', strength: '650mg', freq: '1-0-1', days: 3, timing: 'AFTER_FOOD', inst: 'Take after meals for fever/pain' },
                    { name: 'Pantoprazole 40mg', form: 'Tablet', strength: '40mg', freq: '1-0-0', days: 5, timing: 'EMPTY_STOMACH', inst: 'Take before breakfast' },
                    { name: 'Cetirizine 10mg', form: 'Tablet', strength: '10mg', freq: '0-0-1', days: 5, timing: 'AFTER_FOOD', inst: 'Take at night for allergy' },
                    { name: 'Amoxicillin 500mg', form: 'Capsule', strength: '500mg', freq: '1-0-1', days: 5, timing: 'AFTER_FOOD', inst: 'Complete full 5-day course' },
                    { name: 'Azithromycin 500mg', form: 'Tablet', strength: '500mg', freq: '1-0-0', days: 3, timing: 'AFTER_FOOD', inst: 'Once daily after food' },
                    { name: 'Cough Syrup 100ml', form: 'Syrup', strength: '100ml', freq: '1-1-1', days: 5, timing: 'AFTER_FOOD', inst: '5ml thrice daily' },
                    { name: 'ORS Sachet', form: 'Powder', strength: '1 Sachet', freq: 'SOS', days: 3, timing: 'WITH_FOOD', inst: 'Dissolve in 1L clean water' },
                  ].map((med, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setPrescriptions(prev => {
                          const hasEmpty = prev.length === 1 && !prev[0].medicineName.trim();
                          const newMed: PrescriptionItemPayload = {
                            medicineName: med.name,
                            dosageForm: med.form,
                            strength: med.strength,
                            frequency: med.freq,
                            durationDays: med.days,
                            timing: med.timing as DosageTiming,
                            instructions: med.inst,
                          };
                          return hasEmpty ? [newMed] : [...prev, newMed];
                        });
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-blue-100 text-[#1B5DF1] border border-blue-200 rounded-lg text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
                    >
                      + {med.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Medicine Dynamic Rows */}
              <div className="flex flex-col gap-3">
                {prescriptions.map((rx, idx) => (
                  <div key={idx} className="p-3.5 bg-gray-50/70 hover:bg-gray-50 rounded-2xl border border-border/80 flex flex-col gap-3 relative transition-colors">
                    {/* Row Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#1B5DF1] text-white flex items-center justify-center text-[10px] font-black">
                          {idx + 1}
                        </span>
                        <span className="text-[12px] font-black uppercase text-[#1B5DF1] tracking-wider">
                          Medicine #{idx + 1}
                        </span>
                      </div>
                      {prescriptions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedication(idx)}
                          className="p-1 text-muted/70 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remove medicine"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Inputs: Name, Dosage Form, Strength */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <div className="sm:col-span-6 flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-muted">Medicine / Drug Name</label>
                        <input
                          type="text"
                          list="common-medicines-catalog"
                          placeholder="Type or pick medicine (e.g. Dolo 650, Augmentin 625 Duo)"
                          value={rx.medicineName}
                          onChange={e => handleMedicationChange(idx, 'medicineName', e.target.value)}
                          className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-[13px] font-bold text-[#0A1A3D] outline-none focus:border-[#1B5DF1] shadow-2xs"
                        />
                      </div>

                      <div className="sm:col-span-3 flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-muted">Dosage Form</label>
                        <select
                          value={rx.dosageForm}
                          onChange={e => handleMedicationChange(idx, 'dosageForm', e.target.value)}
                          className="w-full px-2.5 py-2 bg-surface border border-border rounded-xl text-[12px] font-bold text-[#0A1A3D] outline-none focus:border-[#1B5DF1] shadow-2xs cursor-pointer"
                        >
                          {DOSAGE_FORMS.map(df => (
                            <option key={df} value={df}>{df}</option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-3 flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-muted">Strength (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. 650mg, 500mg"
                          value={rx.strength || ''}
                          onChange={e => handleMedicationChange(idx, 'strength', e.target.value)}
                          className="w-full px-2.5 py-2 bg-surface border border-border rounded-xl text-[12px] font-semibold text-[#0A1A3D] outline-none focus:border-[#1B5DF1] shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* One-Click Quick Pills: Frequency, Timing, Duration */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 pt-1 border-t border-border/40">
                      {/* Frequency Pills */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-black uppercase text-muted tracking-wider">
                          Frequency:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {FREQUENCY_PILLS.map(fp => {
                            const isSelected = rx.frequency === fp.value;
                            return (
                              <button
                                key={fp.value}
                                type="button"
                                onClick={() => handleMedicationChange(idx, 'frequency', fp.value)}
                                className={cn(
                                  "px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border",
                                  isSelected
                                    ? "bg-[#1B5DF1] text-white border-[#1B5DF1] shadow-xs"
                                    : "bg-surface hover:bg-blue-50 text-[#0A1A3D] border-border hover:border-blue-200"
                                )}
                              >
                                {fp.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Timing Pills */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-black uppercase text-muted tracking-wider">
                          Timing:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {TIMING_PILLS.map(tp => {
                            const isSelected = rx.timing === tp.value;
                            return (
                              <button
                                key={tp.value}
                                type="button"
                                onClick={() => handleMedicationChange(idx, 'timing', tp.value)}
                                className={cn(
                                  "px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border",
                                  isSelected
                                    ? "bg-[#1B5DF1] text-white border-[#1B5DF1] shadow-xs"
                                    : "bg-surface hover:bg-blue-50 text-[#0A1A3D] border-border hover:border-blue-200"
                                )}
                              >
                                {tp.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Duration Pills + Input */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-muted tracking-wider">
                            Duration:
                          </span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={1}
                              value={rx.durationDays}
                              onChange={e => handleMedicationChange(idx, 'durationDays', Number(e.target.value) || 1)}
                              className="w-12 px-1.5 py-0.5 bg-surface border border-border rounded text-[11px] font-bold text-center text-[#0A1A3D] outline-none focus:border-[#1B5DF1]"
                            />
                            <span className="text-[10px] font-bold text-muted">Days</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {DURATION_PILLS.map(dp => {
                            const isSelected = Number(rx.durationDays) === dp.days;
                            return (
                              <button
                                key={dp.days}
                                type="button"
                                onClick={() => handleMedicationChange(idx, 'durationDays', dp.days)}
                                className={cn(
                                  "px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border",
                                  isSelected
                                    ? "bg-[#1B5DF1] text-white border-[#1B5DF1] shadow-xs"
                                    : "bg-surface hover:bg-blue-50 text-[#0A1A3D] border-border hover:border-blue-200"
                                )}
                              >
                                {dp.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Special Instructions */}
                    <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                      <label className="text-[10px] font-bold text-muted whitespace-nowrap">Special Instructions:</label>
                      <input
                        type="text"
                        placeholder="e.g. Take with warm water, avoid skipping dose, SOS if temperature > 100°F"
                        value={rx.instructions || ''}
                        onChange={e => handleMedicationChange(idx, 'instructions', e.target.value)}
                        className="flex-1 px-2.5 py-1.5 bg-surface border border-border rounded-lg text-[11px] font-medium text-foreground/80 outline-none focus:border-[#1B5DF1]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* D. DIAGNOSIS & CLINICAL FINDINGS (SECOND SECTION - BELOW MEDICATIONS) */}
            <div className="bg-surface p-5 rounded-[22px] shadow-sm border border-border flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1B5DF1] flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-[#0A1A3D]">Diagnosis & Clinical Findings</h4>
                    <p className="text-[11px] text-muted/70 font-medium">Record clinical assessment, advice, and follow-up guidance</p>
                  </div>
                </div>
              </div>

              {/* Clinical Diagnosis with 1-click Quick Fill Chips */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-bold text-[#0A1A3D]">
                    Clinical Diagnosis <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-muted font-semibold">1-click to auto-fill</span>
                </div>

                <input
                  type="text"
                  placeholder="e.g. Acute Viral Bronchitis, Type 2 Diabetes Mellitus"
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-border rounded-xl text-[14px] font-semibold text-[#0A1A3D] outline-none focus:border-[#1B5DF1] focus:bg-surface transition-all shadow-2xs"
                />

                {/* Quick Diagnosis Chips */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {QUICK_DIAGNOSES.map((diag, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setDiagnosis(diag)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border",
                        diagnosis === diag
                          ? "bg-[#1B5DF1] text-white border-[#1B5DF1] shadow-2xs"
                          : "bg-gray-50 hover:bg-blue-50 text-slate-700 border-border hover:border-blue-200"
                      )}
                    >
                      {diag}
                    </button>
                  ))}
                </div>
              </div>

              {/* General Advice & Lifestyle (Full width, Clinical Examination removed!) */}
              <div className="flex flex-col gap-2 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-bold text-[#0A1A3D]">
                    General Advice & Lifestyle
                  </label>
                  <span className="text-[10px] text-muted font-semibold">Click chips below to quick-append instructions</span>
                </div>

                {/* Quick Insert Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {GENERAL_ADVICE_PRESETS.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleAdviceChipClick(preset)}
                      className="px-2.5 py-1 bg-amber-50/70 hover:bg-amber-100/80 text-amber-900 border border-amber-200/80 rounded-lg text-[11px] font-bold shadow-2xs transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={3}
                  placeholder="Dietary precautions, steam inhalation, rest instructions, warning signs to watch for..."
                  value={generalAdvice}
                  onChange={e => setGeneralAdvice(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-border rounded-xl text-[13px] text-foreground outline-none focus:border-[#1B5DF1] focus:bg-surface resize-none shadow-2xs leading-relaxed"
                />
              </div>

              {/* Follow-up Section with Physical Follow-up Toggle and One-tap Timeframe Pills */}
              <div className="flex flex-col gap-3 pt-3 border-t border-border/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Suggest Physical Follow-up Toggle Card */}
                  <div 
                    onClick={() => setSuggestPhysicalFollowUp(prev => !prev)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none",
                      suggestPhysicalFollowUp
                        ? "bg-blue-50/80 border-[#1B5DF1] shadow-xs"
                        : "bg-gray-50/70 hover:bg-gray-100/60 border-border"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-md flex items-center justify-center transition-colors",
                      suggestPhysicalFollowUp ? "bg-[#1B5DF1] text-white" : "border-2 border-slate-300 bg-white"
                    )}>
                      {suggestPhysicalFollowUp && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div>
                      <span className="text-[13px] font-bold text-[#0A1A3D] block">
                        Suggest Physical Follow-up (In-Person OP Visit)
                      </span>
                      <span className="text-[11px] text-muted">
                        Doctor recommends patient visit hospital OP clinic for direct examination
                      </span>
                    </div>
                  </div>

                  {/* Recommended Follow-up Date Input */}
                  <div className="flex items-center gap-2 shrink-0">
                    <label className="text-[12px] font-bold text-foreground/80 whitespace-nowrap">
                      Follow-up Date:
                    </label>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={e => setFollowUpDate(e.target.value)}
                      className="px-3 py-2 bg-gray-50 border border-border rounded-xl text-[13px] font-bold text-[#0A1A3D] outline-none focus:border-[#1B5DF1] shadow-2xs"
                    />
                  </div>
                </div>

                {/* One-tap Quick Follow-up Timeframe Pills */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-[11px] font-bold text-muted whitespace-nowrap">
                    ⚡ Quick Timeframe:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {FOLLOWUP_TIMEFRAMES.map((tf, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => applyFollowUpDays(tf.days)}
                        className="px-2.5 py-1 bg-white hover:bg-blue-50 text-[#1B5DF1] border border-blue-200 rounded-lg text-[11px] font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
                      >
                        {tf.label}
                      </button>
                    ))}
                    {followUpDate && (
                      <button
                        type="button"
                        onClick={() => setFollowUpDate('')}
                        className="px-2 py-1 text-muted hover:text-red-500 text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        Clear Date
                      </button>
                    )}
                  </div>
                </div>

                {/* When Suggest Physical Follow-up is ON: Follow-up Reason Selection */}
                {suggestPhysicalFollowUp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl flex flex-col gap-2"
                  >
                    <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#1B5DF1]" />
                      Follow-up In-Person Visit Reason / Note:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {PHYSICAL_FOLLOWUP_REASONS.map((reason, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setPhysicalFollowUpReason(reason)}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border",
                            physicalFollowUpReason === reason
                              ? "bg-[#1B5DF1] text-white border-[#1B5DF1] shadow-2xs"
                              : "bg-white hover:bg-blue-100 text-[#0A1A3D] border-blue-200"
                          )}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Custom follow-up reason or instructions for hospital visit..."
                      value={physicalFollowUpReason}
                      onChange={e => setPhysicalFollowUpReason(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-[12px] font-semibold text-[#0A1A3D] outline-none focus:border-[#1B5DF1]"
                    />
                  </motion.div>
                )}
              </div>
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
                          "p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all",
                          isSelected
                            ? "bg-purple-50/80 border-purple-300 text-purple-900 shadow-xs"
                            : "bg-surface hover:bg-gray-50 border-border text-foreground"
                        )}
                      >
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold leading-tight">{test.name}</span>
                          <span className="text-[11px] text-muted">{test.specimenType}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-mono font-bold text-foreground">₹{test.price}</span>
                          <div className={cn(
                            "w-4 h-4 rounded-full border flex items-center justify-center",
                            isSelected ? "bg-purple-600 border-purple-600 text-white" : "border-gray-300"
                          )}>
                            {isSelected && <span className="text-[9px] font-black">✓</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted italic">No catalog lab tests available</p>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-surface px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border shrink-0">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {currentStatus !== 'IN_CONSULTATION' && currentStatus !== 'COMPLETED' && (
                <button
                  type="button"
                  onClick={handleStartConsultation}
                  className="flex-1 sm:flex-none px-5 py-3 bg-blue-50 hover:bg-blue-100 text-[#1B5DF1] rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
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
                className="flex-1 sm:flex-none px-5 py-3 bg-gray-100 hover:bg-gray-200 text-foreground/80 rounded-xl font-bold text-[14px] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none px-6 py-3 bg-[#1B5DF1] hover:bg-blue-700 text-white rounded-xl font-bold text-[14px] shadow-md shadow-[#1B5DF1]/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSubmitting ? "Submitting..." : "Save & Complete Visit"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {completedPrescription && (
        <OfficialPrescriptionModal
          isOpen={!!completedPrescription}
          onClose={() => {
            setCompletedPrescription(null);
            onClose();
          }}
          appointment={appointment}
          prescription={completedPrescription}
        />
      )}
    </AnimatePresence>
  );
}
