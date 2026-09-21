import { 
  ArrowLeft, User, Phone, Calendar, Activity, Clock, FileCheck, 
  AlertCircle, HeartPulse, Thermometer, Droplets, Stethoscope, 
  ShieldCheck, Pill, FlaskConical, ChevronRight 
} from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { ConditionLabel } from "@/components/shared/ConditionLabel"
import { EmptyState } from "../components/ui/EmptyState"
import { Skeleton } from "../components/ui/Skeleton"
import { doctorApi, type ClinicalHistoryItem } from "@/services/doctorApi"

type PatientRecord = {
  id: string;
  fullId: string;
  name: string;
  age: string;
  gender: string;
  phone: string;
  lastVisit: string;
  condition: string;
  reason: string;
  doctor: string;
  department: string;
  time: string;
  date: string;
  status: string;
  hospitalName?: string;
  opType?: string;
};

type VisitHistoryItem = {
  id: string;
  date: string;
  time?: string;
  doctor: string;
  diagnosis: string;
  status: string;
  reason?: string;
};

export function PatientDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'reports'>('overview');

  const [patient, setPatient] = useState<PatientRecord | null>(null);
  const [visits, setVisits] = useState<VisitHistoryItem[]>([]);
  const [clinicalHistory, setClinicalHistory] = useState<ClinicalHistoryItem[]>([]);
  const [latestVitals, setLatestVitals] = useState<ClinicalHistoryItem['vitals'] | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadPatient() {
      if (!id) {
        setError("Invalid patient or appointment ID");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await doctorApi.getAppointmentById(id);
        if (!isMounted) return;

        if (!data) {
          setError("Patient record could not be found.");
          setIsLoading(false);
          return;
        }

        const ageStr = data.patientAge ? `${data.patientAge} yrs` : '--';
        const genderStr = data.patientGender || 'Unknown';
        const displayId = (data.id || id).substring(0, 8).toUpperCase();

        const formattedPatient: PatientRecord = {
          id: displayId,
          fullId: data.id || id,
          name: data.patientName || 'Patient',
          age: ageStr,
          gender: genderStr,
          phone: data.patientPhone || '',
          lastVisit: data.date ? new Date(data.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent',
          condition: data.diseaseName || data.reason || data.opType || 'General Consultation',
          reason: data.reason || data.diseaseName || 'Routine consultation',
          doctor: data.doctorName || 'Doctor',
          department: data.departmentName || 'General Medicine',
          time: data.timeSlot || data.slotTime || '10:00 AM',
          date: data.date || '',
          status: data.status || 'WAITING',
          hospitalName: data.hospitalName || 'MediQuee Hospital',
          opType: data.opType || 'OP Consultation'
        };

        setPatient(formattedPatient);

        // Fetch authentic longitudinal clinical history (vitals, prescriptions, lab orders)
        const patientPhone = data.patientPhone;
        const patientUserId = data.patientId;
        const searchIdentifier = patientPhone || patientUserId;

        if (searchIdentifier) {
          try {
            const history = await doctorApi.getPatientClinicalHistory(searchIdentifier);
            if (isMounted) {
              setClinicalHistory(history || []);
              
              // Find latest recorded vitals
              const foundWithVitals = (history || []).find(h => h.vitals && (
                h.vitals.systolicBp || h.vitals.pulseRate || h.vitals.bodyTemperature || h.vitals.spo2 || h.vitals.weightKg
              ));
              if (foundWithVitals) {
                setLatestVitals(foundWithVitals.vitals);
              }

              // Transform visits
              if (history && history.length > 0) {
                setVisits(history.map(h => ({
                  id: h.bookingId,
                  date: h.date,
                  time: h.time,
                  doctor: h.doctor?.name || formattedPatient.doctor,
                  diagnosis: h.prescription?.diagnosis || h.condition || formattedPatient.condition,
                  status: h.status,
                  reason: h.chiefComplaint
                })));
              } else if (data.pastVisits && data.pastVisits.length > 0) {
                setVisits(data.pastVisits);
              } else {
                setVisits([
                  {
                    id: data.id || id,
                    date: formattedPatient.lastVisit,
                    time: formattedPatient.time,
                    doctor: formattedPatient.doctor,
                    diagnosis: formattedPatient.condition,
                    status: formattedPatient.status,
                    reason: formattedPatient.reason
                  }
                ]);
              }
            }
          } catch (histErr) {
            console.warn("Could not load clinical history:", histErr);
          }
        }
      } catch (err: any) {
        console.error("Failed to load patient details:", err);
        if (isMounted) {
          setError(err.message || "Failed to load patient details.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadPatient();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col bg-[#F7F8FA] min-h-[calc(100vh-80px)] p-4 max-w-2xl mx-auto w-full gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="w-48 h-6 rounded-lg" />
        </div>
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-border flex flex-col items-center gap-4">
          <Skeleton className="w-24 h-24 rounded-full" />
          <Skeleton className="w-40 h-7 rounded-lg" />
          <Skeleton className="w-56 h-4 rounded-lg" />
        </div>
        <Skeleton className="w-full h-40 rounded-2xl" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="flex flex-col bg-[#F7F8FA] min-h-[calc(100vh-80px)]">
        <div className="bg-surface px-4 pt-4 pb-4 shadow-sm border-b border-border">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 text-foreground hover:bg-gray-100 rounded-full transition-colors flex items-center gap-2 text-sm font-semibold"
          >
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-surface rounded-3xl p-8 max-w-md w-full shadow-sm border border-border text-center flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Patient Unavailable</h2>
            <p className="text-sm text-muted leading-relaxed">
              {error || `Details for appointment #${id} could not be loaded.`}
            </p>
            <button
              onClick={() => navigate(-1)}
              className="mt-2 px-6 py-2.5 bg-[#1B5DF1] text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-colors shadow-sm"
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
        return <span className="bg-blue-50 text-[#1B5DF1] border border-blue-200 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">WAITING</span>;
      case 'IN_CONSULTATION':
        return <span className="bg-amber-50 text-amber-600 border border-amber-200 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">NOW CONSULTING</span>;
      case 'COMPLETED':
        return <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">COMPLETED</span>;
      default:
        return <span className="bg-gray-100 text-foreground/80 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">{status}</span>;
    }
  };

  // Collect all real prescriptions and lab orders
  const allPrescriptions = clinicalHistory.filter(h => h.prescription).map(h => ({
    bookingId: h.bookingId,
    date: h.date,
    doctor: h.doctor?.name || 'Doctor',
    prescription: h.prescription!
  }));

  const allLabOrders = clinicalHistory.flatMap(h => h.labOrders.map(lo => ({
    ...lo,
    bookingDate: h.date,
    doctorName: h.doctor?.name || 'Doctor'
  })));

  const totalReportsCount = allPrescriptions.length + allLabOrders.length;

  return (
    <div className="flex flex-col bg-[#F7F8FA] min-h-[calc(100vh-80px)] pb-24">
      
      {/* Top Section / Profile Card */}
      <div className="bg-surface px-4 pt-4 pb-6 rounded-b-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-b border-border z-10 relative">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 text-[#0A1A3D] hover:bg-gray-100 rounded-full transition-colors flex items-center gap-1.5"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-xs font-bold text-muted">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black text-[#1B5DF1] bg-[#EBF5FF] border border-[#1B5DF1]/20 px-3 py-1 rounded-full uppercase tracking-wider">
              ID: #{patient.id}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#1B5DF1] to-[#60A5FA] p-1 shadow-md mb-3 flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-surface flex items-center justify-center text-[#1B5DF1] font-black text-2xl">
              {patient.name.charAt(0).toUpperCase()}
            </div>
          </div>
          
          <h1 className="text-[22px] font-black tracking-tight text-[#0A1A3D]">{patient.name}</h1>
          <p className="text-xs font-semibold text-muted mt-0.5">
            {patient.age} • {patient.gender} {patient.phone ? `• ${patient.phone}` : ''}
          </p>

          <div className="flex items-center gap-2 mt-2">
            {getStatusBadge(patient.status)}
            <span className="bg-gray-100 text-foreground/80 text-xs font-semibold px-2.5 py-1 rounded-full">
              {patient.department}
            </span>
          </div>
          
          {/* Quick Action Buttons */}
          <div className="flex items-center gap-3 mt-4 w-full max-w-sm justify-center">
            {patient.phone ? (
              <a 
                href={`tel:${patient.phone}`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#EBF5FF] text-[#1B5DF1] hover:bg-blue-100 rounded-xl font-bold text-sm transition-all active:scale-95 border border-[#1B5DF1]/20"
              >
                <Phone className="w-4 h-4" /> Call ({patient.phone})
              </a>
            ) : (
              <button 
                disabled
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-muted/70 rounded-xl font-bold text-sm cursor-not-allowed"
              >
                <Phone className="w-4 h-4" /> No Phone
              </button>
            )}

            <button 
              onClick={() => navigate('/doctor/ops')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1B5DF1] text-white hover:bg-blue-700 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-sm"
            >
              <Stethoscope className="w-4 h-4" /> Go to OPs
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-3 sticky top-0 bg-[#F7F8FA] z-20">
        <div className="flex bg-surface rounded-2xl p-1 shadow-sm border border-border/70 max-w-lg mx-auto">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'overview' 
                ? 'bg-[#0A1A3D] text-white shadow-sm' 
                : 'text-muted hover:text-foreground'
            }`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'history' 
                ? 'bg-[#0A1A3D] text-white shadow-sm' 
                : 'text-muted hover:text-foreground'
            }`}
          >
            History ({visits.length})
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'reports' 
                ? 'bg-[#0A1A3D] text-white shadow-sm' 
                : 'text-muted hover:text-foreground'
            }`}
          >
            Clinical Records ({totalReportsCount})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 flex flex-col gap-4 max-w-lg mx-auto w-full">
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
            
            {/* Consultation Summary Card */}
            <div className="bg-surface p-5 rounded-[24px] shadow-sm border border-border flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-bold text-muted uppercase tracking-wider">Current Consultation</span>
                <span className="text-xs font-bold text-[#1B5DF1] bg-[#EBF5FF] px-2.5 py-0.5 rounded-md">
                  {patient.time}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted/70 font-semibold">Chief Complaint / Condition</span>
                <ConditionLabel name={patient.condition} textClassName="text-[17px] font-black text-[#0A1A3D]" />
                {patient.reason && patient.reason !== patient.condition && (
                  <p className="text-xs text-gray-600 mt-1 font-medium bg-gray-50 p-2.5 rounded-xl border border-border">
                    "{patient.reason}"
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-muted/70">Attending Doctor</span>
                  <span className="text-sm font-bold text-foreground">{patient.doctor}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-muted/70">Appointment Date</span>
                  <span className="text-sm font-bold text-foreground">{patient.lastVisit}</span>
                </div>
              </div>
            </div>

            {/* Authentic Clinical Vitals Baseline */}
            <div className="bg-surface p-5 rounded-[24px] shadow-sm border border-border flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm text-[#0A1A3D] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#1B5DF1]" /> Vitals Baseline
                </h3>
                {latestVitals?.recordedAt && (
                  <span className="text-[10px] font-bold text-muted/70">
                    Recorded {new Date(latestVitals.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>

              {latestVitals && (latestVitals.systolicBp || latestVitals.pulseRate || latestVitals.bodyTemperature || latestVitals.spo2 || latestVitals.weightKg) ? (
                <>
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {latestVitals.weightKg && (
                      <div className="bg-gray-50/70 p-3 rounded-xl flex flex-col items-center text-center">
                        <span className="text-[10px] font-bold text-muted/70 uppercase">Weight</span>
                        <span className="text-sm font-black text-foreground">{latestVitals.weightKg} kg</span>
                      </div>
                    )}
                    {latestVitals.heightCm && (
                      <div className="bg-gray-50/70 p-3 rounded-xl flex flex-col items-center text-center">
                        <span className="text-[10px] font-bold text-muted/70 uppercase">Height</span>
                        <span className="text-sm font-black text-foreground">{latestVitals.heightCm} cm</span>
                      </div>
                    )}
                    {latestVitals.respiratoryRate && (
                      <div className="bg-gray-50/70 p-3 rounded-xl flex flex-col items-center text-center">
                        <span className="text-[10px] font-bold text-muted/70 uppercase">Resp Rate</span>
                        <span className="text-sm font-black text-foreground">{latestVitals.respiratoryRate} /min</span>
                      </div>
                    )}
                  </div>

                  {/* Detailed Vitals Grid */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {latestVitals.systolicBp && latestVitals.diastolicBp ? (
                      <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-3">
                        <HeartPulse className="w-5 h-5 text-rose-500 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-muted/70 uppercase">Blood Pressure</span>
                          <span className="text-xs font-bold text-foreground">{latestVitals.systolicBp}/{latestVitals.diastolicBp} mmHg</span>
                        </div>
                      </div>
                    ) : null}

                    {latestVitals.bodyTemperature ? (
                      <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-3">
                        <Thermometer className="w-5 h-5 text-amber-500 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-muted/70 uppercase">Temperature</span>
                          <span className="text-xs font-bold text-foreground">{latestVitals.bodyTemperature} °F</span>
                        </div>
                      </div>
                    ) : null}

                    {latestVitals.pulseRate ? (
                      <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-3">
                        <Droplets className="w-5 h-5 text-blue-500 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-muted/70 uppercase">Pulse Rate</span>
                          <span className="text-xs font-bold text-foreground">{latestVitals.pulseRate} bpm</span>
                        </div>
                      </div>
                    ) : null}

                    {latestVitals.spo2 ? (
                      <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-muted/70 uppercase">SpO2</span>
                          <span className="text-xs font-bold text-foreground">{latestVitals.spo2}%</span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : (
                <div className="py-6 flex flex-col items-center text-center gap-2 bg-gray-50/50 rounded-2xl p-4">
                  <HeartPulse className="w-8 h-8 text-gray-300" />
                  <p className="text-xs font-bold text-gray-600">No Baseline Vitals Recorded</p>
                  <p className="text-[11px] text-muted/70 max-w-xs">
                    Vitals will appear here automatically once recorded during a consultation.
                  </p>
                </div>
              )}
            </div>
            
          </motion.div>
        )}

        {/* Tab B: History */}
        {activeTab === 'history' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
            {visits.length === 0 ? (
              <EmptyState icon={Clock} title="No Visit History" description="Past visits will appear here once available." />
            ) : visits.map((visit, i) => (
              <div key={i} className="bg-surface p-4 rounded-2xl shadow-sm border border-border flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-[#1B5DF1] flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <ConditionLabel name={visit.diagnosis} textClassName="font-bold text-foreground text-sm" />
                  {visit.reason && (
                    <p className="text-xs text-muted mt-0.5 italic">"{visit.reason}"</p>
                  )}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                    <span className="text-xs text-muted font-medium">{visit.doctor}</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                      {visit.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted/70 mt-1 font-medium">{visit.date} {visit.time ? `• ${visit.time}` : ''}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Tab C: Real Clinical Prescriptions & Ordered Lab Tests */}
        {activeTab === 'reports' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
            {totalReportsCount === 0 ? (
              <EmptyState 
                icon={FileCheck} 
                title="No Clinical Records Yet" 
                description="Prescriptions and diagnostic lab orders will appear here once issued by the doctor." 
              />
            ) : (
              <>
                {/* Prescriptions List */}
                {allPrescriptions.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold text-muted uppercase tracking-wider px-1">Issued Prescriptions</h3>
                    {allPrescriptions.map(rx => (
                      <div key={rx.prescription.id} className="bg-surface p-4 rounded-2xl shadow-sm border border-border flex flex-col gap-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm">
                              <Pill className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-foreground text-sm">{rx.prescription.diagnosis}</h4>
                              <p className="text-xs text-muted">{rx.doctor} • {rx.date}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg">
                            {rx.prescription.items.length} Medicines
                          </span>
                        </div>

                        {rx.prescription.clinicalNotes && (
                          <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-border">
                            Notes: {rx.prescription.clinicalNotes}
                          </p>
                        )}

                        <div className="flex flex-col gap-1.5 pt-1 border-t border-gray-50">
                          {rx.prescription.items.map(item => (
                            <div key={item.id} className="flex items-center justify-between text-xs py-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-foreground">{item.medicineName}</span>
                                {item.strength && <span className="text-muted/70">({item.strength})</span>}
                                <span className="text-[10px] text-muted bg-gray-100 px-1.5 py-0.5 rounded">{item.dosageForm}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted font-semibold">
                                <span>{item.frequency}</span>
                                <span>•</span>
                                <span>{item.durationDays}d</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Lab Investigation Orders */}
                {allLabOrders.length > 0 && (
                  <div className="flex flex-col gap-3 pt-2">
                    <h3 className="text-xs font-bold text-muted uppercase tracking-wider px-1">Prescribed Lab Tests</h3>
                    {allLabOrders.map(lo => (
                      <div key={lo.id} className="bg-surface p-4 rounded-2xl shadow-sm border border-border flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                          <FlaskConical className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-foreground text-sm">{lo.testName || 'Diagnostic Lab Investigation'}</h4>
                          <p className="text-xs text-muted">{lo.category || 'Lab'} • Ordered by {lo.doctorName} on {lo.bookingDate}</p>
                        </div>
                        <span className="text-[10px] font-bold bg-purple-50 text-purple-600 px-2.5 py-1 rounded-lg">
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

    </div>
  )
}
