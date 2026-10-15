import { 
  ArrowLeft, Phone, Calendar, Activity, Clock, FileCheck, 
  AlertCircle, HeartPulse, Thermometer, Droplets, Stethoscope, 
  ShieldCheck, Pill, FlaskConical, ChevronRight, RefreshCw, 
  Video, CheckCircle2, MessageSquare, Plus, Edit3, X, 
  FileText, Sparkles, User, BadgeCheck, Stethoscope as ConsultationIcon
} from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useCallback } from "react"
import { ConditionLabel } from "@/components/shared/ConditionLabel"
import { EmptyState } from "../components/ui/EmptyState"
import { Skeleton } from "../components/ui/Skeleton"
import { doctorApi, type ClinicalHistoryItem, type ConsultationVitals } from "@/services/doctorApi"

type PatientRecord = {
  id: string;
  fullId: string;
  name: string;
  age: number | null;
  gender: string | null;
  phone: string;
  lastVisit: string;
  condition: string;
  reason: string;
  doctor: string;
  doctorDesignation?: string;
  doctorSpecialization?: string;
  doctorAvatar?: string;
  department: string;
  time: string;
  date: string;
  status: string;
  fee: number;
  hospitalName?: string;
  opType?: string;
};

type VisitHistoryItem = {
  id: string;
  date: string;
  time?: string;
  doctor: string;
  department?: string;
  diagnosis: string;
  status: string;
  reason?: string;
  opType?: string;
  fee?: number;
  hasVitals?: boolean;
  vitals?: any;
  hasPrescription?: boolean;
  prescription?: any;
};

export function PatientDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'reports'>('overview');

  const [patient, setPatient] = useState<PatientRecord | null>(null);
  const [visits, setVisits] = useState<VisitHistoryItem[]>([]);
  const [clinicalHistory, setClinicalHistory] = useState<ClinicalHistoryItem[]>([]);
  const [latestVitals, setLatestVitals] = useState<ClinicalHistoryItem['vitals'] | null>(null);
  const [prescriptionsList, setPrescriptionsList] = useState<any[]>([]);
  const [labOrdersList, setLabOrdersList] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vitals recording modal state
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [isSavingVitals, setIsSavingVitals] = useState(false);
  const [vitalsForm, setVitalsForm] = useState<{
    systolicBp: string;
    diastolicBp: string;
    pulseRate: string;
    bodyTemperature: string;
    respiratoryRate: string;
    spo2: string;
    weightKg: string;
    heightCm: string;
  }>({
    systolicBp: '',
    diastolicBp: '',
    pulseRate: '',
    bodyTemperature: '',
    respiratoryRate: '',
    spo2: '',
    weightKg: '',
    heightCm: ''
  });

  // Status updating state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Selected visit for expanded modal/preview
  const [selectedVisit, setSelectedVisit] = useState<VisitHistoryItem | null>(null);

  const loadPatientData = useCallback(async (showLoading = true) => {
    if (!id) {
      setError("Invalid patient or appointment ID");
      setIsLoading(false);
      return;
    }

    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const data = await doctorApi.getAppointmentById(id);

      if (!data) {
        setError("Patient record could not be found.");
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      // Safe demographic parsing: never allow '--' or 'Unknown'
      const rawAge = data.patientAge;
      let parsedAge: number | null = null;
      if (typeof rawAge === 'number' && rawAge > 0 && rawAge < 125) {
        parsedAge = rawAge;
      } else if (rawAge && typeof rawAge === 'string') {
        const n = parseInt(rawAge.replace(/\D/g, ''), 10);
        if (!isNaN(n) && n > 0 && n < 125) parsedAge = n;
      }

      const rawGender = (data.patientGender || '').trim();
      let parsedGender: string | null = null;
      const lowerGender = rawGender.toLowerCase();
      if (lowerGender && !['unknown', '--', 'n/a', 'na', 'null', 'undefined', ''].includes(lowerGender)) {
        if (lowerGender.startsWith('m')) parsedGender = 'Male';
        else if (lowerGender.startsWith('f')) parsedGender = 'Female';
        else if (lowerGender.startsWith('o')) parsedGender = 'Other';
        else parsedGender = rawGender;
      }

      const displayId = (data.id || id).substring(0, 8).toUpperCase();

      const formattedPatient: PatientRecord = {
        id: displayId,
        fullId: data.id || id,
        name: data.patientName || 'Patient',
        age: parsedAge,
        gender: parsedGender,
        phone: data.patientPhone || '',
        lastVisit: data.date ? new Date(data.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent',
        condition: data.diseaseName || data.reason || data.opType || 'General Consultation',
        reason: data.reason || data.diseaseName || 'Routine consultation',
        doctor: data.doctorName || 'Doctor',
        doctorDesignation: data.doctorDesignation || '',
        doctorSpecialization: data.doctorSpecialization || '',
        doctorAvatar: data.doctorAvatar || '',
        department: data.departmentName || 'General Medicine',
        time: data.timeSlot || data.slotTime || '10:00 AM',
        date: data.date || '',
        status: data.status || 'WAITING',
        fee: data.fee || 0,
        hospitalName: data.hospitalName || 'MediQuee Hospital',
        opType: data.opType || 'OP Visit'
      };

      setPatient(formattedPatient);

      // Pre-populate vitals from appointment if present
      const initialVitals = data.vitals || data.latestVitals || null;
      if (initialVitals) {
        setLatestVitals(initialVitals);
      }

      // Prescriptions and lab orders returned by enhanced getAppointmentById
      if (data.prescriptions && Array.isArray(data.prescriptions)) {
        setPrescriptionsList(data.prescriptions);
      }
      if (data.doctorLabOrders && Array.isArray(data.doctorLabOrders)) {
        setLabOrdersList(data.doctorLabOrders);
      }

      // Populate visits from backend pastVisits
      if (data.pastVisits && Array.isArray(data.pastVisits) && data.pastVisits.length > 0) {
        setVisits(data.pastVisits);
      }

      // Fetch authentic longitudinal clinical history
      const patientPhone = data.patientPhone;
      const patientUserId = data.patientId;
      const searchIdentifier = patientPhone || patientUserId;

      if (searchIdentifier) {
        try {
          const history = await doctorApi.getPatientClinicalHistory(searchIdentifier);
          if (history && Array.isArray(history) && history.length > 0) {
            setClinicalHistory(history);

            // If not found earlier, find latest vitals
            if (!initialVitals) {
              const foundWithVitals = history.find(h => h.vitals && (
                h.vitals.systolicBp || h.vitals.pulseRate || h.vitals.bodyTemperature || h.vitals.spo2 || h.vitals.weightKg
              ));
              if (foundWithVitals) {
                setLatestVitals(foundWithVitals.vitals);
              }
            }

            // Sync visits if history is larger
            if (history.length >= (data.pastVisits?.length || 0)) {
              setVisits(history.map(h => ({
                id: h.bookingId,
                date: h.date,
                time: h.time,
                doctor: h.doctor?.name || formattedPatient.doctor,
                department: h.department?.name || formattedPatient.department,
                diagnosis: h.prescription?.diagnosis || h.condition || formattedPatient.condition,
                status: h.status,
                reason: h.chiefComplaint,
                opType: h.opType,
                hasVitals: !!h.vitals,
                vitals: h.vitals,
                hasPrescription: !!h.prescription,
                prescription: h.prescription
              })));
            }
          }
        } catch (histErr) {
          console.warn("Could not load secondary clinical history:", histErr);
        }
      }
    } catch (err: any) {
      console.error("Failed to load patient details:", err);
      setError(err.message || "Failed to load patient details.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    loadPatientData(true);

    // Live background polling every 25 seconds
    const interval = setInterval(() => {
      loadPatientData(false);
    }, 25000);

    return () => clearInterval(interval);
  }, [loadPatientData]);

  // Open modal with existing vitals loaded
  const handleOpenVitalsModal = () => {
    if (latestVitals) {
      setVitalsForm({
        systolicBp: latestVitals.systolicBp ? String(latestVitals.systolicBp) : '',
        diastolicBp: latestVitals.diastolicBp ? String(latestVitals.diastolicBp) : '',
        pulseRate: latestVitals.pulseRate ? String(latestVitals.pulseRate) : '',
        bodyTemperature: latestVitals.bodyTemperature ? String(latestVitals.bodyTemperature) : '',
        respiratoryRate: latestVitals.respiratoryRate ? String(latestVitals.respiratoryRate) : '',
        spo2: latestVitals.spo2 ? String(latestVitals.spo2) : '',
        weightKg: latestVitals.weightKg ? String(latestVitals.weightKg) : '',
        heightCm: latestVitals.heightCm ? String(latestVitals.heightCm) : ''
      });
    } else {
      setVitalsForm({
        systolicBp: '',
        diastolicBp: '',
        pulseRate: '',
        bodyTemperature: '',
        respiratoryRate: '',
        spo2: '',
        weightKg: '',
        heightCm: ''
      });
    }
    setIsVitalsModalOpen(true);
  };

  // Submit vitals to backend
  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient?.fullId) return;

    setIsSavingVitals(true);
    try {
      const payload: ConsultationVitals = {
        systolicBp: vitalsForm.systolicBp ? parseInt(vitalsForm.systolicBp, 10) : undefined,
        diastolicBp: vitalsForm.diastolicBp ? parseInt(vitalsForm.diastolicBp, 10) : undefined,
        pulseRate: vitalsForm.pulseRate ? parseInt(vitalsForm.pulseRate, 10) : undefined,
        bodyTemperature: vitalsForm.bodyTemperature ? parseFloat(vitalsForm.bodyTemperature) : undefined,
        respiratoryRate: vitalsForm.respiratoryRate ? parseInt(vitalsForm.respiratoryRate, 10) : undefined,
        spo2: vitalsForm.spo2 ? parseInt(vitalsForm.spo2, 10) : undefined,
        weightKg: vitalsForm.weightKg ? parseFloat(vitalsForm.weightKg) : undefined,
        heightCm: vitalsForm.heightCm ? parseFloat(vitalsForm.heightCm) : undefined
      };

      const savedVitals = await doctorApi.updateVitals(patient.fullId, payload);
      setLatestVitals(savedVitals);
      setIsVitalsModalOpen(false);
      // Refresh to keep history consistent
      loadPatientData(false);
    } catch (err: any) {
      alert(err?.message || "Failed to save patient vitals");
    } finally {
      setIsSavingVitals(false);
    }
  };

  // Quick Status Transition handler
  const handleUpdateStatus = async (newStatus: string) => {
    if (!patient?.fullId || isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    try {
      await doctorApi.updateStatus(patient.fullId, newStatus);
      setPatient(prev => prev ? { ...prev, status: newStatus } : null);
      loadPatientData(false);
    } catch (err: any) {
      alert(err?.message || "Failed to update appointment status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col bg-[#F8FAFC] min-h-[calc(100vh-80px)] p-4 max-w-2xl mx-auto w-full gap-4">
        <div className="flex items-center justify-between">
          <Skeleton className="w-24 h-8 rounded-xl" />
          <Skeleton className="w-28 h-6 rounded-full" />
        </div>
        <div className="bg-surface rounded-2xl p-5 shadow-sm border border-border flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-14 h-14 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="w-40 h-6 rounded-lg" />
              <Skeleton className="w-24 h-4 rounded-lg" />
            </div>
          </div>
          <Skeleton className="w-full h-10 rounded-xl" />
        </div>
        <Skeleton className="w-full h-44 rounded-2xl" />
        <Skeleton className="w-full h-44 rounded-2xl" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="flex flex-col bg-[#F8FAFC] min-h-[calc(100vh-80px)]">
        <div className="bg-surface px-4 py-3.5 shadow-sm border-b border-border">
          <button 
            onClick={() => navigate(-1)} 
            className="p-1.5 -ml-1 text-foreground hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 text-sm font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-primary" /> Back
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-surface rounded-2xl p-8 max-w-md w-full shadow-sm border border-border text-center flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Patient Record Unavailable</h2>
            <p className="text-xs text-muted leading-relaxed">
              {error || `Details for appointment #${id} could not be loaded.`}
            </p>
            <button
              onClick={() => navigate(-1)}
              className="mt-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-xl text-xs hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
            >
              Return to Previous Screen
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'WAITING':
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            WAITING
          </span>
        );
      case 'IN_CONSULTATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            IN CONSULTATION
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            COMPLETED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-foreground border border-border">
            {status}
          </span>
        );
    }
  };

  // Clean demographics pill list — NEVER includes '--' or 'Unknown'
  const demographicsPills: string[] = [];
  if (patient.age && patient.age > 0) {
    demographicsPills.push(`${patient.age} yrs`);
  }
  if (patient.gender) {
    demographicsPills.push(patient.gender);
  }
  if (patient.phone) {
    demographicsPills.push(patient.phone);
  }

  const isVideoConsult = (patient.opType || '').toLowerCase().includes('video');
  const cleanPhone = patient.phone.replace(/^(\+91|91)/, '').replace(/\D/g, '');

  // Consolidate all prescriptions across history
  const allPrescriptions = [
    ...prescriptionsList,
    ...clinicalHistory.filter(h => h.prescription).map(h => ({
      id: h.prescription!.id,
      bookingId: h.bookingId,
      date: h.date,
      doctor: h.doctor?.name || 'Doctor',
      diagnosis: h.prescription!.diagnosis,
      clinicalNotes: h.prescription!.clinicalNotes,
      generalAdvice: h.prescription!.generalAdvice,
      followUpDate: h.prescription!.followUpDate,
      items: h.prescription!.items || []
    }))
  ].filter((rx, index, self) => index === self.findIndex(r => r.id === rx.id));

  // Consolidate all lab orders across history
  const allLabOrders = [
    ...labOrdersList,
    ...clinicalHistory.flatMap(h => (h.labOrders || []).map(lo => ({
      id: lo.id,
      bookingId: h.bookingId,
      bookingDate: h.date,
      doctorName: h.doctor?.name || 'Doctor',
      testId: lo.testId,
      testName: lo.testName || 'Diagnostic Lab Investigation',
      category: lo.category || 'General Lab',
      createdAt: lo.createdAt
    })))
  ].filter((lo, index, self) => index === self.findIndex(l => l.id === lo.id));

  const totalReportsCount = allPrescriptions.length + allLabOrders.length;

  return (
    <div className="flex flex-col bg-[#F8FAFC] min-h-[calc(100vh-80px)] pb-28">
      
      {/* Executive Compact Clinical Header Card */}
      <div className="bg-surface px-4 pt-3.5 pb-4 border-b border-border shadow-xs sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex flex-col gap-3">
          
          {/* Top navigation row */}
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate(-1)} 
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-foreground hover:bg-gray-100 transition-colors cursor-pointer"
              title="Go back"
            >
              <ArrowLeft className="w-4 h-4 text-primary" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => loadPatientData(false)}
                disabled={isRefreshing}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-gray-100 transition-all cursor-pointer"
                title="Refresh patient chart"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
              </button>

              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                ID: #{patient.id}
              </span>
            </div>
          </div>

          {/* Compact Clinical Profile Header */}
          <div className="flex items-center gap-3.5">
            {/* Avatar with gradient ring */}
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 p-[2px] shadow-sm flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-surface flex items-center justify-center text-primary font-bold text-xl">
                  {patient.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-surface ${
                patient.status === 'COMPLETED' ? 'bg-emerald-500' :
                patient.status === 'IN_CONSULTATION' ? 'bg-amber-500' : 'bg-blue-500'
              }`} />
            </div>

            {/* Profile info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-[18px] sm:text-[20px] font-bold text-foreground tracking-tight truncate">
                {patient.name}
              </h1>

              {/* Clean Demographics Row — never shows '--' or 'Unknown' */}
              {demographicsPills.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-muted mt-0.5">
                  {demographicsPills.map((val, idx) => (
                    <span key={idx} className="flex items-center gap-1.5">
                      <span>{val}</span>
                      {idx < demographicsPills.length - 1 && <span className="text-muted/40">•</span>}
                    </span>
                  ))}
                </div>
              )}

              {/* Service & Status Badges */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {getStatusBadge(patient.status)}

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 text-foreground">
                  {patient.department}
                </span>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {isVideoConsult ? <Video className="w-3 h-3 text-indigo-600" /> : <Stethoscope className="w-3 h-3 text-indigo-600" />}
                  {patient.opType}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions Row: Call, WhatsApp, and Status Transition */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/60">
            {patient.phone ? (
              <a 
                href={`tel:${patient.phone}`}
                className="flex-1 min-w-[130px] flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-primary border border-blue-200/80 rounded-xl text-xs font-bold transition-all active:scale-95"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call ({patient.phone})</span>
              </a>
            ) : null}

            {cleanPhone ? (
              <a 
                href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Hello ${patient.name}, regarding your consultation at ${patient.hospitalName || 'MediQuee Hospital'}...`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-xl text-xs font-bold transition-all active:scale-95"
                title="Open WhatsApp chat"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </a>
            ) : null}

            {/* Quick Status Advance Control */}
            {patient.status === 'WAITING' && (
              <button
                onClick={() => handleUpdateStatus('IN_CONSULTATION')}
                disabled={isUpdatingStatus}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-xs cursor-pointer ml-auto"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Start Consult</span>
              </button>
            )}

            {patient.status === 'IN_CONSULTATION' && (
              <button
                onClick={() => handleUpdateStatus('COMPLETED')}
                disabled={isUpdatingStatus}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-xs cursor-pointer ml-auto"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Complete</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Tabs Bar */}
      <div className="px-4 py-2.5 sticky top-[138px] sm:top-[142px] bg-[#F8FAFC]/95 backdrop-blur-sm z-10 border-b border-border/50">
        <div className="flex bg-gray-100/80 p-1 rounded-xl max-w-2xl mx-auto border border-border/60">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'overview' 
                ? 'bg-surface text-primary shadow-xs' 
                : 'text-muted hover:text-foreground'
            }`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'history' 
                ? 'bg-surface text-primary shadow-xs' 
                : 'text-muted hover:text-foreground'
            }`}
          >
            History ({visits.length})
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'reports' 
                ? 'bg-surface text-primary shadow-xs' 
                : 'text-muted hover:text-foreground'
            }`}
          >
            Clinical Records ({totalReportsCount})
          </button>
        </div>
      </div>

      {/* Tab Content Body */}
      <div className="px-4 pt-3 flex flex-col gap-3.5 max-w-2xl mx-auto w-full">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3.5">
            
            {/* Card 1: Current Consultation Details */}
            <div className="bg-surface p-4 sm:p-5 rounded-2xl shadow-xs border border-border flex flex-col gap-3.5">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <ConsultationIcon className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">Current Consultation</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-primary bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200/60">
                    {patient.time}
                  </span>
                  <span className="text-xs font-medium text-muted">
                    {patient.lastVisit}
                  </span>
                </div>
              </div>

              {/* Chief Complaint / Condition */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-muted uppercase">Chief Complaint / Condition</span>
                <div className="p-2.5 bg-gray-50/80 rounded-xl border border-border/60 flex items-center gap-2">
                  <ConditionLabel name={patient.condition} textClassName="text-[15px] sm:text-[16px] font-bold text-foreground" />
                </div>
                {patient.reason && patient.reason !== patient.condition && (
                  <p className="text-xs text-muted font-medium bg-gray-50/50 p-2.5 rounded-xl border border-border/50 italic">
                    "{patient.reason}"
                  </p>
                )}
              </div>

              {/* Doctor, Department & Fee Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-border/60 text-xs">
                <div className="flex flex-col bg-gray-50/60 p-2.5 rounded-xl border border-border/40">
                  <span className="text-[10px] font-semibold text-muted uppercase">Attending Doctor</span>
                  <span className="font-bold text-foreground mt-0.5">{patient.doctor}</span>
                  {patient.doctorSpecialization && (
                    <span className="text-[11px] text-muted">{patient.doctorSpecialization}</span>
                  )}
                </div>

                <div className="flex flex-col bg-gray-50/60 p-2.5 rounded-xl border border-border/40">
                  <span className="text-[10px] font-semibold text-muted uppercase">Consultation Type</span>
                  <span className="font-bold text-foreground mt-0.5 flex items-center gap-1">
                    {isVideoConsult ? <Video className="w-3.5 h-3.5 text-primary" /> : <Stethoscope className="w-3.5 h-3.5 text-primary" />}
                    {patient.opType}
                  </span>
                  <span className="text-[11px] text-muted">{patient.department}</span>
                </div>

                <div className="col-span-2 sm:col-span-1 flex flex-col bg-gray-50/60 p-2.5 rounded-xl border border-border/40">
                  <span className="text-[10px] font-semibold text-muted uppercase">Consultation Fee</span>
                  <span className="font-bold text-foreground mt-0.5">₹{patient.fee}</span>
                  <span className="text-[11px] text-emerald-600 font-semibold">Included in Dashboard</span>
                </div>
              </div>
            </div>

            {/* Card 2: Vitals Baseline Card with Record/Edit Capability */}
            <div className="bg-surface p-4 sm:p-5 rounded-2xl shadow-xs border border-border flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-foreground">
                    Vitals Baseline
                  </h3>
                </div>

                <button
                  onClick={handleOpenVitalsModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary text-white hover:bg-blue-700 rounded-lg text-xs font-semibold transition-all active:scale-95 shadow-xs cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{latestVitals ? "Edit Vitals" : "+ Record Vitals"}</span>
                </button>
              </div>

              {latestVitals && (latestVitals.systolicBp || latestVitals.pulseRate || latestVitals.bodyTemperature || latestVitals.spo2 || latestVitals.weightKg || latestVitals.heightCm || latestVitals.respiratoryRate) ? (
                <div className="flex flex-col gap-3">
                  {/* Detailed Metric Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {/* Blood Pressure */}
                    {latestVitals.systolicBp ? (
                      <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-100 flex items-center gap-2.5">
                        <HeartPulse className="w-5 h-5 text-rose-500 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-rose-700/80 uppercase">Blood Pressure</span>
                          <span className="text-sm font-bold text-foreground">
                            {latestVitals.systolicBp}{latestVitals.diastolicBp ? `/${latestVitals.diastolicBp}` : ''} <span className="text-[10px] font-normal text-muted">mmHg</span>
                          </span>
                        </div>
                      </div>
                    ) : null}

                    {/* Pulse Rate */}
                    {latestVitals.pulseRate ? (
                      <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100 flex items-center gap-2.5">
                        <Droplets className="w-5 h-5 text-blue-500 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-blue-700/80 uppercase">Pulse Rate</span>
                          <span className="text-sm font-bold text-foreground">
                            {latestVitals.pulseRate} <span className="text-[10px] font-normal text-muted">bpm</span>
                          </span>
                        </div>
                      </div>
                    ) : null}

                    {/* Body Temperature */}
                    {latestVitals.bodyTemperature ? (
                      <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-100 flex items-center gap-2.5">
                        <Thermometer className="w-5 h-5 text-amber-500 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-amber-700/80 uppercase">Temperature</span>
                          <span className="text-sm font-bold text-foreground">
                            {latestVitals.bodyTemperature} <span className="text-[10px] font-normal text-muted">°F</span>
                          </span>
                        </div>
                      </div>
                    ) : null}

                    {/* SpO2 */}
                    {latestVitals.spo2 ? (
                      <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 flex items-center gap-2.5">
                        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-emerald-700/80 uppercase">SpO2 Oxygen</span>
                          <span className="text-sm font-bold text-foreground">
                            {latestVitals.spo2} <span className="text-[10px] font-normal text-muted">%</span>
                          </span>
                        </div>
                      </div>
                    ) : null}

                    {/* Weight */}
                    {latestVitals.weightKg ? (
                      <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-100 flex items-center gap-2.5">
                        <Activity className="w-5 h-5 text-purple-500 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-purple-700/80 uppercase">Weight</span>
                          <span className="text-sm font-bold text-foreground">
                            {latestVitals.weightKg} <span className="text-[10px] font-normal text-muted">kg</span>
                          </span>
                        </div>
                      </div>
                    ) : null}

                    {/* Height */}
                    {latestVitals.heightCm ? (
                      <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 flex items-center gap-2.5">
                        <User className="w-5 h-5 text-indigo-500 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-indigo-700/80 uppercase">Height</span>
                          <span className="text-sm font-bold text-foreground">
                            {latestVitals.heightCm} <span className="text-[10px] font-normal text-muted">cm</span>
                          </span>
                        </div>
                      </div>
                    ) : null}

                    {/* Respiratory Rate */}
                    {latestVitals.respiratoryRate ? (
                      <div className="p-3 bg-teal-50/50 dark:bg-teal-950/20 rounded-xl border border-teal-100 flex items-center gap-2.5">
                        <Activity className="w-5 h-5 text-teal-500 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-teal-700/80 uppercase">Resp. Rate</span>
                          <span className="text-sm font-bold text-foreground">
                            {latestVitals.respiratoryRate} <span className="text-[10px] font-normal text-muted">/min</span>
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {latestVitals.recordedAt && (
                    <span className="text-[10px] font-medium text-muted text-right">
                      Last recorded on {new Date(latestVitals.recordedAt).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              ) : (
                <div className="py-6 flex flex-col items-center text-center gap-2 bg-gray-50/60 rounded-xl p-4 border border-border/50">
                  <HeartPulse className="w-8 h-8 text-muted/40" />
                  <p className="text-xs font-bold text-foreground">No Baseline Vitals Recorded</p>
                  <p className="text-[11px] text-muted max-w-xs">
                    Vitals recorded by doctor or nurse appear here in real-time.
                  </p>
                  <button
                    onClick={handleOpenVitalsModal}
                    className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Record Baseline Vitals</span>
                  </button>
                </div>
              )}
            </div>

          </motion.div>
        )}

        {/* TAB 2: VISIT HISTORY */}
        {activeTab === 'history' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">
                All Consultations & Visits ({visits.length})
              </span>
              <span className="text-[11px] text-muted font-medium">Real-time database sync</span>
            </div>

            {visits.length === 0 ? (
              <EmptyState icon={Clock} title="No Visit History" description="Past visits for this patient will appear here." />
            ) : visits.map((visit, i) => (
              <div 
                key={visit.id || i}
                onClick={() => setSelectedVisit(selectedVisit?.id === visit.id ? null : visit)}
                className="bg-surface p-4 rounded-2xl shadow-xs border border-border flex flex-col gap-2.5 transition-all hover:border-primary/40 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      {visit.opType?.toLowerCase().includes('video') ? (
                        <Video className="w-5 h-5 text-indigo-600" />
                      ) : (
                        <Stethoscope className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <ConditionLabel name={visit.diagnosis} textClassName="font-bold text-foreground text-sm" />
                      {visit.reason && visit.reason !== visit.diagnosis && (
                        <p className="text-xs text-muted mt-0.5 italic">"{visit.reason}"</p>
                      )}
                      <p className="text-xs text-muted font-medium mt-1">
                        Dr. {visit.doctor} • {visit.department || 'General Medicine'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {getStatusBadge(visit.status)}
                    {visit.fee !== undefined && (
                      <span className="text-xs font-bold text-foreground">₹{visit.fee}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted border-t border-border/50 pt-2 mt-0.5">
                  <span className="flex items-center gap-1 font-medium">
                    <Calendar className="w-3 h-3 text-muted/70" />
                    {visit.date} {visit.time ? `• ${visit.time}` : ''}
                  </span>

                  <div className="flex items-center gap-2">
                    {visit.hasVitals && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-semibold">
                        <HeartPulse className="w-2.5 h-2.5" /> Vitals
                      </span>
                    )}
                    {visit.hasPrescription && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                        <Pill className="w-2.5 h-2.5" /> Rx
                      </span>
                    )}
                    <ChevronRight className={`w-3.5 h-3.5 text-muted/60 transition-transform ${selectedVisit?.id === visit.id ? 'rotate-90' : ''}`} />
                  </div>
                </div>

                {/* Expanded Details when clicked */}
                {selectedVisit?.id === visit.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2 border-t border-dashed border-border/70 flex flex-col gap-2 text-xs">
                    {visit.vitals && (
                      <div className="bg-gray-50 p-2.5 rounded-xl border border-border/50 flex flex-wrap gap-3">
                        <span className="font-bold text-foreground">Recorded Vitals:</span>
                        {visit.vitals.systolicBp && <span>BP: {visit.vitals.systolicBp}/{visit.vitals.diastolicBp} mmHg</span>}
                        {visit.vitals.pulseRate && <span>Pulse: {visit.vitals.pulseRate} bpm</span>}
                        {visit.vitals.bodyTemperature && <span>Temp: {visit.vitals.bodyTemperature} °F</span>}
                        {visit.vitals.spo2 && <span>SpO2: {visit.vitals.spo2}%</span>}
                      </div>
                    )}
                    {visit.prescription && (
                      <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 flex flex-col gap-1">
                        <span className="font-bold text-emerald-900">Diagnosis: {visit.prescription.diagnosis}</span>
                        {visit.prescription.clinicalNotes && (
                          <span className="text-emerald-800">Notes: {visit.prescription.clinicalNotes}</span>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {/* TAB 3: CLINICAL RECORDS */}
        {activeTab === 'reports' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
            {totalReportsCount === 0 ? (
              <EmptyState 
                icon={FileCheck} 
                title="No Clinical Records Yet" 
                description="Prescriptions and diagnostic lab orders will appear here once issued by the attending doctor." 
              />
            ) : (
              <>
                {/* Issued Prescriptions Section */}
                {allPrescriptions.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-xs font-bold text-muted uppercase tracking-wider">
                        Issued Prescriptions ({allPrescriptions.length})
                      </h3>
                      <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                        Digitally Signed
                      </span>
                    </div>

                    {allPrescriptions.map(rx => (
                      <div key={rx.id || rx.bookingId} className="bg-surface p-4 rounded-2xl shadow-xs border border-border flex flex-col gap-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                              <Pill className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-foreground text-sm">{rx.diagnosis}</h4>
                              <p className="text-xs text-muted">{rx.doctor} • {rx.date}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                            {rx.items?.length || 0} Medicines
                          </span>
                        </div>

                        {rx.clinicalNotes && (
                          <p className="text-xs text-gray-700 bg-gray-50/80 p-2.5 rounded-xl border border-border/60">
                            <b>Clinical Notes:</b> {rx.clinicalNotes}
                          </p>
                        )}

                        {rx.items && rx.items.length > 0 && (
                          <div className="flex flex-col gap-1.5 pt-1 border-t border-border/50">
                            {rx.items.map((item: any, idx: number) => (
                              <div key={item.id || idx} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 last:border-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-foreground">{item.medicineName}</span>
                                  {item.strength && <span className="text-muted text-[11px]">({item.strength})</span>}
                                  <span className="text-[10px] text-muted bg-gray-100 px-1.5 py-0.5 rounded">{item.dosageForm}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted font-medium text-[11px]">
                                  <span>{item.frequency}</span>
                                  <span>•</span>
                                  <span>{item.durationDays}d</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Lab Diagnostic Orders Section */}
                {allLabOrders.length > 0 && (
                  <div className="flex flex-col gap-3 pt-1">
                    <h3 className="text-xs font-bold text-muted uppercase tracking-wider px-1">
                      Ordered Diagnostic Lab Tests ({allLabOrders.length})
                    </h3>

                    {allLabOrders.map(lo => (
                      <div key={lo.id} className="bg-surface p-4 rounded-2xl shadow-xs border border-border flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                            <FlaskConical className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-foreground text-sm">{lo.testName}</h4>
                            <p className="text-xs text-muted">{lo.category || 'Diagnostic'} • Ordered by Dr. {lo.doctorName} on {lo.bookingDate}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/60 px-2 py-0.5 rounded-md shrink-0">
                          Prescribed
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* Record / Edit Vitals Modal */}
      <AnimatePresence>
        {isVitalsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-2xl p-5 max-w-md w-full shadow-xl border border-border flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <h3 className="text-base font-bold text-foreground">Record / Update Vitals</h3>
                </div>
                <button
                  onClick={() => setIsVitalsModalOpen(false)}
                  className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveVitals} className="flex flex-col gap-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Systolic BP (mmHg)</label>
                    <input
                      type="number"
                      placeholder="e.g. 120"
                      value={vitalsForm.systolicBp}
                      onChange={e => setVitalsForm(prev => ({ ...prev, systolicBp: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-border rounded-xl text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Diastolic BP (mmHg)</label>
                    <input
                      type="number"
                      placeholder="e.g. 80"
                      value={vitalsForm.diastolicBp}
                      onChange={e => setVitalsForm(prev => ({ ...prev, diastolicBp: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-border rounded-xl text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Pulse Rate (bpm)</label>
                    <input
                      type="number"
                      placeholder="e.g. 72"
                      value={vitalsForm.pulseRate}
                      onChange={e => setVitalsForm(prev => ({ ...prev, pulseRate: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-border rounded-xl text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Temperature (°F)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 98.6"
                      value={vitalsForm.bodyTemperature}
                      onChange={e => setVitalsForm(prev => ({ ...prev, bodyTemperature: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-border rounded-xl text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">SpO2 Oxygen (%)</label>
                    <input
                      type="number"
                      placeholder="e.g. 99"
                      value={vitalsForm.spo2}
                      onChange={e => setVitalsForm(prev => ({ ...prev, spo2: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-border rounded-xl text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Resp. Rate (/min)</label>
                    <input
                      type="number"
                      placeholder="e.g. 18"
                      value={vitalsForm.respiratoryRate}
                      onChange={e => setVitalsForm(prev => ({ ...prev, respiratoryRate: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-border rounded-xl text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 68"
                      value={vitalsForm.weightKg}
                      onChange={e => setVitalsForm(prev => ({ ...prev, weightKg: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-border rounded-xl text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Height (cm)</label>
                    <input
                      type="number"
                      placeholder="e.g. 172"
                      value={vitalsForm.heightCm}
                      onChange={e => setVitalsForm(prev => ({ ...prev, heightCm: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-border rounded-xl text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-1">
                  <button
                    type="button"
                    onClick={() => setIsVitalsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-foreground hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingVitals}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSavingVitals ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Save Vitals</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
