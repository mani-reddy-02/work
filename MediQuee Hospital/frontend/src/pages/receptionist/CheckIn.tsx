import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Stethoscope, 
  Clock, 
  Sparkles,
  CreditCard,
  Building2,
  Check,
  RotateCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { receptionistApi, type QueueEntry } from '../../services/receptionistApi';
import { ReceptionistNavHeader } from '@/components/layout/ReceptionistNavHeader';
import { cn } from '@/lib/utils';

interface DoctorItem {
  id: string;
  name: string;
  departmentId: string;
  consultationFee?: number;
  specialization?: string;
  avatar?: string;
}

const COMMON_SYMPTOMS = [
  'Fever & Cold',
  'General Checkup',
  'Headache',
  'Stomach Pain',
  'BP / Sugar Check',
  'Follow-up'
];

export function CheckIn() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1: Patient Details Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    age: '',
    gender: 'Male',
    place: '',
  });

  // Inline Validation Touch State
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Step 2: Clinical & Doctor State
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [opType, setOpType] = useState('Normal');
  const [reason, setReason] = useState('');
  const [liveQueue, setLiveQueue] = useState<QueueEntry[]>([]);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    token: string;
    tokenNumber?: number;
    patientName: string;
    doctorName: string;
    departmentName: string;
    place: string;
    fee: number;
  } | null>(null);

  // Load departments, doctors, and live queue count on mount
  useEffect(() => {
    receptionistApi.getDepartments().then(setDepartments).catch(console.error);
    receptionistApi.getDoctors().then(setDoctors).catch(console.error);
    receptionistApi.getQueue().then(setLiveQueue).catch(console.error);
  }, []);

  // Update doctors list when department changes
  useEffect(() => {
    if (selectedDept) {
      receptionistApi.getDoctors(selectedDept).then(docs => {
        setDoctors(docs);
        // If current selected doctor isn't in this department, clear selection
        if (selectedDoctor && !docs.some(d => d.id === selectedDoctor)) {
          setSelectedDoctor('');
        }
      }).catch(console.error);
    } else {
      receptionistApi.getDoctors().then(setDoctors).catch(console.error);
    }
  }, [selectedDept]);

  // Compute live waiting counts per doctor
  const waitingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const q of liveQueue) {
      if (q.doctorId && (q.status === 'WAITING' || q.status === 'ARRIVED')) {
        counts[q.doctorId] = (counts[q.doctorId] || 0) + 1;
      }
    }
    return counts;
  }, [liveQueue]);

  // Validation Helpers
  const isNameValid = formData.name.trim().length >= 2;
  const isPhoneValid = /^\d{10}$/.test(formData.phone.trim());
  const isAgeValid = Number(formData.age) > 0 && Number(formData.age) <= 125;
  const isPlaceValid = formData.place.trim().length >= 2;
  const isStep1Valid = isNameValid && isPhoneValid && isAgeValid && isPlaceValid;

  // Selected doctor object & resolved consultation fee
  const activeDoctorObj = useMemo(() => {
    return doctors.find(d => d.id === selectedDoctor);
  }, [doctors, selectedDoctor]);

  const consultationFee = activeDoctorObj?.consultationFee ?? 500;

  // Next Token estimation for display preview
  const estimatedToken = useMemo(() => {
    if (!selectedDoctor) return 'Next in Queue';
    const doctorWaiting = waitingCounts[selectedDoctor] || 0;
    return `Token #${String(doctorWaiting + 1).padStart(2, '0')}`;
  }, [selectedDoctor, waitingCounts]);

  const handleNext = () => {
    if (step === 1) {
      setTouched({ name: true, phone: true, age: true, place: true });
      if (isStep1Valid) {
        setError(null);
        setStep(2);
      }
    } else if (step === 2) {
      if (selectedDept && selectedDoctor) {
        setError(null);
        setStep(3);
      } else {
        setError('Please select both a Department and an Available Doctor to continue.');
      }
    }
  };

  const handleSelectDoctor = (docId: string) => {
    setSelectedDoctor(docId);
    setError(null);
    const doc = doctors.find(d => d.id === docId);
    if (doc && doc.departmentId && (!selectedDept || selectedDept !== doc.departmentId)) {
      setSelectedDept(doc.departmentId);
    }
  };

  const handleSelectSymptom = (chip: string) => {
    if (reason.includes(chip)) {
      // Toggle off
      const updated = reason
        .split(',')
        .map(s => s.trim())
        .filter(s => s && s !== chip)
        .join(', ');
      setReason(updated);
    } else {
      // Append
      const updated = reason.trim() ? `${reason.trim()}, ${chip}` : chip;
      setReason(updated);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await receptionistApi.checkInPatient({
        patientData: {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          age: Number(formData.age),
          gender: formData.gender,
          place: formData.place.trim()
        },
        departmentId: selectedDept,
        doctorId: selectedDoctor,
        opType,
        reason: reason.trim() || undefined,
        consultationFee
      });

      const chosenDeptName = departments.find(d => d.id === selectedDept)?.name || 'General OP';
      const chosenDocName = activeDoctorObj?.name || 'Assigned Doctor';

      setSuccessData({
        token: res.token,
        tokenNumber: res.tokenNumber,
        patientName: formData.name.trim(),
        doctorName: chosenDocName,
        departmentName: chosenDeptName,
        place: formData.place.trim(),
        fee: consultationFee
      });
    } catch (err: any) {
      setError(err.message || 'Failed to check in patient. Please verify details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      phone: '',
      age: '',
      gender: 'Male',
      place: '',
    });
    setTouched({});
    setSelectedDept('');
    setSelectedDoctor('');
    setOpType('Normal');
    setReason('');
    setError(null);
    setSuccessData(null);
    setStep(1);
    // Refresh queue counts
    receptionistApi.getQueue().then(setLiveQueue).catch(console.error);
  };

  return (
    <div className="flex flex-col bg-slate-50/60 min-h-[calc(100vh-80px)] pb-28">
      {/* Header with Navigation */}
      <ReceptionistNavHeader 
        title="Check-In Patient" 
        subtitle={
          step === 1 
            ? "Step 1 of 3: Patient Details" 
            : step === 2 
            ? "Step 2 of 3: Clinical & Doctor Selection" 
            : "Step 3 of 3: Confirm & Generate Token"
        }
        backTo={step > 1 ? undefined : '/receptionist'}
      />

      <div className="max-w-2xl w-full mx-auto p-4 sm:p-6 flex flex-col flex-1">
        
        {/* Step Indicator Bar */}
        {!successData && (
          <div className="relative mb-8 px-4">
            <div className="flex items-center justify-between">
              {[
                { s: 1, label: 'Patient Details' },
                { s: 2, label: 'Doctor & OP' },
                { s: 3, label: 'Generate Token' }
              ].map(({ s, label }) => (
                <div key={s} className="flex flex-col items-center gap-1.5 z-10">
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all shadow-sm",
                    step === s 
                      ? "bg-blue-600 text-white ring-4 ring-blue-100" 
                      : step > s 
                      ? "bg-emerald-600 text-white" 
                      : "bg-white text-slate-400 border border-slate-200"
                  )}>
                    {step > s ? <Check className="w-4 h-4" /> : s}
                  </div>
                  <span className={cn(
                    "text-[11px] font-bold tracking-tight uppercase",
                    step === s ? "text-blue-600" : step > s ? "text-emerald-700" : "text-slate-400"
                  )}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
            {/* Progress line */}
            <div className="absolute left-10 right-10 top-4 h-0.5 bg-slate-200 -z-0">
              <div 
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
              />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          
          {/* STEP 1: PATIENT DETAILS */}
          {step === 1 && !successData && (
            <motion.div 
              key="step1" 
              initial={{ opacity: 0, y: 12 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -12 }} 
              className="flex flex-col gap-5"
            >
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm shadow-slate-200/50">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Walk-In Patient Registration</h2>
                      <p className="text-xs text-slate-500">Collect core patient demographics for OPD token queue</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                    Walk-In OPD
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="e.g. Ramesh Kumar"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        onBlur={() => setTouched(t => ({ ...t, name: true }))}
                        className={cn(
                          "w-full pl-10 pr-4 py-2.5 text-sm bg-white border rounded-xl outline-none transition-all font-medium",
                          touched.name && !isNameValid 
                            ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100" 
                            : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        )}
                      />
                    </div>
                    {touched.name && !isNameValid && (
                      <p className="text-[11px] text-red-500 mt-1 font-medium">Please enter a valid patient name (at least 2 letters).</p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-2.5 flex items-center gap-1 text-slate-400 border-r border-slate-200 pr-2">
                        <Phone className="w-4 h-4" />
                        <span className="text-xs font-bold text-slate-600">+91</span>
                      </div>
                      <input 
                        type="tel" 
                        maxLength={10}
                        placeholder="10-digit mobile number"
                        value={formData.phone}
                        onChange={e => {
                          const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setFormData({ ...formData, phone: digitsOnly });
                        }}
                        onBlur={() => setTouched(t => ({ ...t, phone: true }))}
                        className={cn(
                          "w-full pl-20 pr-4 py-2.5 text-sm bg-white border rounded-xl outline-none transition-all font-medium",
                          touched.phone && !isPhoneValid 
                            ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100" 
                            : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        )}
                      />
                    </div>
                    {touched.phone && !isPhoneValid && (
                      <p className="text-[11px] text-red-500 mt-1 font-medium">Must be a valid 10-digit phone number.</p>
                    )}
                  </div>

                  {/* Age & Gender Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Age */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                        Age (Years) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                        <input 
                          type="number" 
                          min={1} 
                          max={120} 
                          placeholder="e.g. 34"
                          value={formData.age}
                          onChange={e => setFormData({ ...formData, age: e.target.value })}
                          onBlur={() => setTouched(t => ({ ...t, age: true }))}
                          className={cn(
                            "w-full pl-10 pr-4 py-2.5 text-sm bg-white border rounded-xl outline-none transition-all font-medium",
                            touched.age && !isAgeValid 
                              ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100" 
                              : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          )}
                        />
                      </div>
                      {touched.age && !isAgeValid && (
                        <p className="text-[11px] text-red-500 mt-1 font-medium">Please enter a valid age between 1 and 125.</p>
                      )}
                    </div>

                    {/* Gender Selectable Pills */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Male', 'Female', 'Other'].map(g => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setFormData({ ...formData, gender: g })}
                            className={cn(
                              "py-2.5 text-xs font-bold rounded-xl border transition-all text-center",
                              formData.gender === g
                                ? "bg-blue-50 border-blue-600 text-blue-700 shadow-sm"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            )}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Place / Village / City */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                      Place / Village / City <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="e.g. Adoni, Yemmiganur, Kurnool, Hyderabad"
                        value={formData.place}
                        onChange={e => setFormData({ ...formData, place: e.target.value })}
                        onBlur={() => setTouched(t => ({ ...t, place: true }))}
                        className={cn(
                          "w-full pl-10 pr-4 py-2.5 text-sm bg-white border rounded-xl outline-none transition-all font-medium",
                          touched.place && !isPlaceValid 
                            ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100" 
                            : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        )}
                      />
                    </div>
                    {touched.place && !isPlaceValid && (
                      <p className="text-[11px] text-red-500 mt-1 font-medium">Please enter patient's town, village, or city.</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: CLINICAL & DOCTOR SELECTION */}
          {step === 2 && !successData && (
            <motion.div 
              key="step2" 
              initial={{ opacity: 0, y: 12 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -12 }} 
              className="flex flex-col gap-5"
            >
              {/* Department Selection Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm shadow-slate-200/50">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    1. Select Department <span className="text-red-500">*</span>
                  </label>
                  {selectedDept && (
                    <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      Selected
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {departments.map(dept => (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => setSelectedDept(dept.id)}
                      className={cn(
                        "p-3 rounded-xl border text-xs font-bold text-left transition-all",
                        selectedDept === dept.id
                          ? "bg-blue-50 border-blue-600 text-blue-700 shadow-sm"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/50"
                      )}
                    >
                      {dept.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Doctor Selection Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm shadow-slate-200/50">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                    2. Select Active Doctor <span className="text-red-500">*</span>
                  </label>
                  {activeDoctorObj && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                      Fee: ₹{consultationFee}
                    </span>
                  )}
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {doctors.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No active doctors found for this department.
                    </div>
                  ) : (
                    doctors.map(doc => {
                      const waitingCount = waitingCounts[doc.id] || 0;
                      const isSelected = selectedDoctor === doc.id;
                      return (
                        <div
                          key={doc.id}
                          onClick={() => handleSelectDoctor(doc.id)}
                          className={cn(
                            "p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all",
                            isSelected
                              ? "bg-blue-50/80 border-blue-600 shadow-sm ring-1 ring-blue-500"
                              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm",
                              isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                            )}>
                              {doc.name.replace(/^Dr\.\s*/i, '').charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-slate-900">{doc.name}</h4>
                              <p className="text-xs text-slate-500">
                                {doc.specialization || 'Consultant Physician'}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xs font-bold text-slate-900">
                              ₹{doc.consultationFee ?? 500}
                            </span>
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full",
                              waitingCount > 0 
                                ? "bg-amber-50 text-amber-700 border border-amber-200" 
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            )}>
                              {waitingCount > 0 ? `${waitingCount} Waiting` : 'Available Now'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Visit Type & Reason Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm shadow-slate-200/50">
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                  3. OP Type
                </label>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {['Normal', 'Emergency', 'Follow-up'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setOpType(type)}
                      className={cn(
                        "py-2.5 text-xs font-bold rounded-xl border transition-all text-center",
                        opType === type
                          ? "bg-blue-50 border-blue-600 text-blue-700 shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                  4. Chief Complaint / Reason for Visit (Optional)
                </label>
                {/* 1-click Quick Chips */}
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {COMMON_SYMPTOMS.map(chip => {
                    const isSelected = reason.includes(chip);
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => handleSelectSymptom(chip)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border",
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        )}
                      >
                        {chip}
                      </button>
                    );
                  })}
                </div>
                <input 
                  type="text"
                  placeholder="Or type reason / notes (e.g. Mild fever since 2 days)..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 p-3.5 rounded-xl text-xs font-bold border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 3: CONFIRM & GENERATE TOKEN */}
          {step === 3 && !successData && (
            <motion.div 
              key="step3" 
              initial={{ opacity: 0, y: 12 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -12 }} 
              className="flex flex-col gap-5"
            >
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm shadow-slate-200/50">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <h3 className="font-bold text-slate-900 text-base">Check-In Summary</h3>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                    Live Token Preview
                  </span>
                </div>

                {/* Patient Profile Snapshot */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Patient Profile</span>
                    <span className="text-xs font-bold text-slate-700">{formData.gender} • {formData.age} Yrs</span>
                  </div>
                  <h4 className="text-lg font-black text-slate-900">{formData.name}</h4>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-2">
                    <div className="flex items-center gap-1 font-medium">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>+91 {formData.phone}</span>
                    </div>
                    <div className="flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span className="font-bold text-slate-800">{formData.place}</span>
                    </div>
                  </div>
                </div>

                {/* Consultation & Doctor Allocation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Doctor</span>
                    <p className="font-bold text-sm text-slate-900 mt-0.5">{activeDoctorObj?.name || 'Doctor'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {departments.find(d => d.id === selectedDept)?.name}
                    </p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Queue Priority</span>
                    <p className="font-bold text-sm text-slate-900 mt-0.5">{opType} OP</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {reason || 'General Consultation'}
                    </p>
                  </div>
                </div>

                {/* Direct Counter Payment Card (0% Commission) */}
                <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-950">Reception Counter Collection</p>
                      <p className="text-[11px] text-emerald-700 font-medium">Direct Cash / Counter UPI • 0% Platform Commission</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">OP Fee</span>
                    <span className="text-lg font-black text-emerald-800">₹{consultationFee}</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 p-3.5 rounded-xl text-xs font-bold border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}
            </motion.div>
          )}

          {/* SUCCESS SCREEN */}
          {successData && (
            <motion.div 
              key="success" 
              initial={{ opacity: 0, scale: 0.96 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="flex flex-col items-center gap-5 py-4"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="text-center">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Patient Checked In!</h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Live Queue Token assigned and synchronized across Hospital screens
                </p>
              </div>

              {/* Big Token Display Card */}
              <div className="w-full bg-gradient-to-b from-blue-600 to-blue-700 rounded-3xl p-6 text-white text-center shadow-lg shadow-blue-500/20">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-200">
                  Assigned Queue Token
                </span>
                <h3 className="text-4xl sm:text-5xl font-black mt-2 tracking-tight text-white">
                  {successData.token}
                </h3>
                <div className="mt-4 pt-4 border-t border-blue-500/40 flex items-center justify-around text-xs text-blue-100">
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider opacity-75">Patient</span>
                    <span className="font-bold text-white text-sm">{successData.patientName}</span>
                  </div>
                  <div className="w-px h-8 bg-blue-500/40" />
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider opacity-75">From</span>
                    <span className="font-bold text-white text-sm">{successData.place}</span>
                  </div>
                </div>
              </div>

              {/* Doctor / OP Details */}
              <div className="w-full bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Doctor Assigned</span>
                  <span className="font-bold text-slate-800">{successData.doctorName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Department</span>
                  <span className="font-bold text-slate-800">{successData.departmentName}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">Fee Collected At Counter</span>
                  <span className="font-bold text-emerald-700">₹{successData.fee} (Direct Hospital Collection)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full flex flex-col sm:flex-row gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => navigate('/receptionist')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <Clock className="w-4 h-4" /> Go to Live Queue
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4 text-slate-400" /> Register Another Patient
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Sticky Bottom Actions */}
      {!successData && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 shadow-[0_-4px_16px_rgba(0,0,0,0.03)]">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={() => { setStep(s => s - 1); setError(null); }}
                className="px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-1.5 shrink-0"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}

            {step < 3 ? (
              <button 
                type="button"
                onClick={handleNext} 
                disabled={step === 1 ? !isStep1Valid : (!selectedDept || !selectedDoctor)}
                className="flex-1 bg-blue-600 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-blue-500/20"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="flex-1 bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-sm shadow-emerald-600/20"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Generating Queue Token...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Check-In Patient</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
