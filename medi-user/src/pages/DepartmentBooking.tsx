import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Building2, Stethoscope, Calendar, Clock, User, CheckCircle2, 
  ChevronRight, ArrowLeft, Phone, MapPin, Search, AlertCircle, 
  Info, ShieldCheck, Video, Activity, RefreshCw, X
} from 'lucide-react';
import { departmentApi, type DepartmentRecord } from '../lib/hospitalApi';
import { opAppointmentApi, type DoctorRecord } from '../lib/opAppointmentApi';
import { getDiseaseIconUrl } from '../utils/diseaseIcons';
import { getDepartmentImageUrl } from '../utils/departmentImages';
import { useAuth } from '../lib/auth';
import { useUIStore } from '../lib/uiStore';

export interface SlotDateOption {
  label: string;
  date: string;
  isoDate: string;
}

export const getUpcomingDates = (): SlotDateOption[] => {
  const dates: SlotDateOption[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const month = d.toLocaleString('en-US', { month: 'short' });
    const day = d.getDate();
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleString('en-US', { weekday: 'short' });
    dates.push({
      label,
      date: `${month} ${day}`,
      isoDate
    });
  }
  return dates;
};

const UPCOMING_DATES = getUpcomingDates();

type BookingStep = 
  | 'DEPARTMENT'
  | 'DOCTOR'
  | 'SLOT'
  | 'PATIENT_DETAILS'
  | 'REVIEW_PAY'
  | 'CONFIRMATION';

const STEPS_DATA = [
  { step: 'DEPARTMENT', number: '1', title: 'Department' },
  { step: 'DOCTOR', number: '2', title: 'Doctor' },
  { step: 'SLOT', number: '3', title: 'Available Slot' },
  { step: 'PATIENT_DETAILS', number: '4', title: 'Patient Details' },
  { step: 'REVIEW_PAY', number: '5', title: 'Review & Pay' },
  { step: 'CONFIRMATION', number: '6', title: 'Confirmation' },
];

const DepartmentBooking: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userLocation, setNearbyRadiusKm } = useUIStore();

  // Booking Flow State
  const [currentStep, setCurrentStep] = useState<BookingStep>('DEPARTMENT');
  
  // Data State
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(true);
  const [departmentSearch, setDepartmentSearch] = useState('');
  
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentRecord | null>(null);
  
  // Consultation Type: 'OP' (In-person) vs 'VIDEO' (Video Consultation)
  const [consultationType, setConsultationType] = useState<'OP' | 'VIDEO'>('OP');
  
  // Doctor Selection State
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [isDoctorsLoading, setIsDoctorsLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorRecord | null>(null);
  const [previewDoctor, setPreviewDoctor] = useState<DoctorRecord | null>(null);
  const [phoneAlertDoctorId, setPhoneAlertDoctorId] = useState<string | null>(null);

  // Slot Selection State
  const [selectedDate, setSelectedDate] = useState<SlotDateOption>(UPCOMING_DATES[0]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [slotError, setSlotError] = useState<string | null>(null);

  // Patient Details State
  const [patientName, setPatientName] = useState(user?.name || '');
  const [patientPhone, setPatientPhone] = useState(user?.phone || '');
  const [patientAge, setPatientAge] = useState<string>('');
  const [patientGender, setPatientGender] = useState<string>('Male');
  const [patientAddress, setPatientAddress] = useState<string>('');
  const [chiefComplaint, setChiefComplaint] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Review & Confirm State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmation, setBookingConfirmation] = useState<any>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // 1. Fetch Backend Configured Departments with Active Doctors
  useEffect(() => {
    let isMounted = true;
    setIsDepartmentsLoading(true);

    departmentApi.getDepartments({ hasDoctors: true })
      .then((res) => {
        if (!isMounted) return;
        if (res.success && Array.isArray(res.data)) {
          // Filter to only departments that genuinely have doctorCount > 0
          const validDepts = res.data.filter(d => (d.doctorCount ?? 0) > 0);
          setDepartments(validDepts);

          // Check if URL specifies a dept id or dept name
          const deptParam = searchParams.get('dept') || searchParams.get('departmentId') || searchParams.get('department');
          if (deptParam) {
            const matched = validDepts.find(d => 
              d.id === deptParam || 
              d.name.toLowerCase() === deptParam.toLowerCase()
            );
            if (matched) {
              handleSelectDepartment(matched);
            }
          }
        } else {
          setDepartments([]);
        }
      })
      .catch(() => {
        if (isMounted) setDepartments([]);
      })
      .finally(() => {
        if (isMounted) setIsDepartmentsLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  // Update user prefill if user loads later
  useEffect(() => {
    if (user) {
      if (!patientName && user.name) setPatientName(user.name);
      if (!patientPhone && user.phone) setPatientPhone(user.phone);
    }
  }, [user]);

  // Handle Department Selection
  const handleSelectDepartment = (dept: DepartmentRecord) => {
    setSelectedDepartment(dept);
    setSelectedDoctor(null);
    setSelectedSlot('');
    setCurrentStep('DOCTOR');
    loadDoctorsForDepartment(dept, consultationType);
  };

  // Load doctors for a department and consultation type
  const loadDoctorsForDepartment = async (dept: DepartmentRecord, type: 'OP' | 'VIDEO') => {
    setIsDoctorsLoading(true);
    setSubmissionError(null);
    try {
      const res = await departmentApi.getDepartmentDoctors(dept.id, {
        consultationType: type === 'VIDEO' ? 'video' : 'op',
        lat: userLocation.latitude ?? undefined,
        lng: userLocation.longitude ?? undefined,
        radius: userLocation.radiusKm,
        nearbyOnly: true
      });
      if (res.success && Array.isArray(res.data)) {
        setDoctors(res.data);
      } else {
        setDoctors([]);
      }
    } catch {
      setDoctors([]);
    } finally {
      setIsDoctorsLoading(false);
    }
  };

  // Handle Consultation Type change in Doctor Selection
  const handleConsultationTypeChange = (newType: 'OP' | 'VIDEO') => {
    setConsultationType(newType);
    if (selectedDepartment) {
      loadDoctorsForDepartment(selectedDepartment, newType);
    }
  };

  // Handle Doctor Selection
  const handleSelectDoctor = (doctor: DoctorRecord) => {
    setSelectedDoctor(doctor);
    setPreviewDoctor(null);
    setSelectedSlot('');
    setSlotError(null);
    setCurrentStep('SLOT');
    loadDoctorSlots(doctor.id, selectedDate.isoDate, consultationType);
  };

  // Load Doctor Available Slots
  const loadDoctorSlots = async (doctorId: string, dateIso: string, type: 'OP' | 'VIDEO') => {
    setSlotsLoading(true);
    setSlotError(null);
    try {
      const res = await opAppointmentApi.fetchDoctorAvailability(
        doctorId, 
        dateIso, 
        type === 'VIDEO' ? 'Video Consultation' : 'OP'
      );
      if (res.success && res.data) {
        setAvailableSlots(res.data.availableSlots || []);
        setBookedSlots(res.data.bookedSlots || []);
      } else {
        setAvailableSlots([]);
        setBookedSlots([]);
        if (res.error) setSlotError(res.error);
      }
    } catch (err: any) {
      setAvailableSlots([]);
      setBookedSlots([]);
      setSlotError(err.message || 'Unable to fetch slots');
    } finally {
      setSlotsLoading(false);
    }
  };

  // Handle Date Change
  const handleDateChange = (dateOption: SlotDateOption) => {
    setSelectedDate(dateOption);
    setSelectedSlot('');
    if (selectedDoctor) {
      loadDoctorSlots(selectedDoctor.id, dateOption.isoDate, consultationType);
    }
  };

  // Proceed from Slot to Patient Details
  const handleSlotNext = () => {
    if (!selectedSlot) {
      setSlotError('Please choose a consultation time slot to continue');
      return;
    }
    setSlotError(null);
    setCurrentStep('PATIENT_DETAILS');
  };

  // Validate and Proceed from Patient Details to Review & Pay
  const handlePatientDetailsNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setFormError('Patient full name is required');
      return;
    }
    if (!patientPhone.trim()) {
      setFormError('Contact phone number is required');
      return;
    }
    const ageNum = parseInt(patientAge, 10);
    if (isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
      setFormError('Please enter a valid age between 1 and 120');
      return;
    }
    setFormError(null);
    setCurrentStep('REVIEW_PAY');
  };

  // Handle Final Booking Submission (Review & Pay)
  const handleConfirmBooking = async () => {
    if (!selectedDoctor || !selectedDepartment || !selectedSlot) {
      setSubmissionError('Missing doctor, department, or slot details.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    // 1. Revalidate Availability before confirming to prevent double-booking
    try {
      const availRes = await opAppointmentApi.fetchDoctorAvailability(
        selectedDoctor.id,
        selectedDate.isoDate,
        consultationType === 'VIDEO' ? 'Video Consultation' : 'OP'
      );
      
      if (!availRes.success || !availRes.data?.availableSlots?.includes(selectedSlot)) {
        setSubmissionError('The selected time slot was just booked or is no longer available. Please select another slot.');
        setCurrentStep('SLOT');
        loadDoctorSlots(selectedDoctor.id, selectedDate.isoDate, consultationType);
        setIsSubmitting(false);
        return;
      }
    } catch {
      // Proceed to booking attempt if availability check fails with network hiccup
    }

    // 2. Submit booking to backend
    try {
      const payload = {
        hospitalId: selectedDoctor.hospitalId,
        doctorId: selectedDoctor.id,
        departmentId: selectedDepartment.id,
        date: selectedDate.isoDate,
        timeSlot: selectedSlot,
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        patientAge: parseInt(patientAge, 10) || undefined,
        patientGender,
        reason: chiefComplaint.trim() || `Consultation for ${selectedDepartment.name}`,
        opType: consultationType === 'VIDEO' ? 'Video Consultation' : 'Normal'
      };

      const res = await opAppointmentApi.createOpAppointment(payload);

      if (res.success && res.data) {
        setBookingConfirmation(res.data);
        setCurrentStep('CONFIRMATION');
      } else {
        const errorMsg = typeof res.error === 'object' ? res.error.message : (res.error || 'Failed to complete appointment booking');
        setSubmissionError(errorMsg);
      }
    } catch (err: any) {
      setSubmissionError(err.message || 'An unexpected error occurred while booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered departments list for search
  const filteredDepartments = departments.filter(d => 
    d.name.toLowerCase().includes(departmentSearch.toLowerCase()) ||
    (d.description && d.description.toLowerCase().includes(departmentSearch.toLowerCase()))
  );

  // Group available slots into time of day
  const morningSlots = availableSlots.filter(s => s.includes('AM') || s.startsWith('12:'));
  const afternoonEveningSlots = availableSlots.filter(s => s.includes('PM') && !s.startsWith('12:'));

  const feeAmount = typeof selectedDoctor?.consultationFee === 'number' 
    ? selectedDoctor.consultationFee 
    : 0;

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Header & Back navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {currentStep !== 'DEPARTMENT' && currentStep !== 'CONFIRMATION' && (
            <button
              onClick={() => {
                if (currentStep === 'DOCTOR') setCurrentStep('DEPARTMENT');
                else if (currentStep === 'SLOT') setCurrentStep('DOCTOR');
                else if (currentStep === 'PATIENT_DETAILS') setCurrentStep('SLOT');
                else if (currentStep === 'REVIEW_PAY') setCurrentStep('PATIENT_DETAILS');
              }}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {currentStep === 'DEPARTMENT' && 'Browse Departments'}
              {currentStep === 'DOCTOR' && `${selectedDepartment?.name || 'Department'} Doctors`}
              {currentStep === 'SLOT' && 'Choose Consultation Slot'}
              {currentStep === 'PATIENT_DETAILS' && 'Patient Details'}
              {currentStep === 'REVIEW_PAY' && 'Review & Confirm'}
              {currentStep === 'CONFIRMATION' && 'Booking Confirmed!'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {currentStep === 'DEPARTMENT' && 'Direct doctor booking by clinical department and specialty'}
              {currentStep === 'DOCTOR' && 'Select an eligible specialist doctor from accredited hospitals'}
              {currentStep === 'SLOT' && `Select available date and time with ${selectedDoctor?.name}`}
              {currentStep === 'PATIENT_DETAILS' && 'Provide patient information for the consultation record'}
              {currentStep === 'REVIEW_PAY' && 'Verify appointment summary and confirm booking'}
              {currentStep === 'CONFIRMATION' && 'Your appointment has been successfully scheduled'}
            </p>
          </div>
        </div>

        {currentStep !== 'CONFIRMATION' && (
          <Link
            to="/"
            className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200"
          >
            Cancel
          </Link>
        )}
      </div>

      {/* Progress Stepper */}
      {currentStep !== 'CONFIRMATION' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs">
          <div className="grid grid-cols-5 gap-1 sm:gap-2">
            {STEPS_DATA.slice(0, 5).map((s, idx) => {
              const stepIndex = STEPS_DATA.findIndex(item => item.step === currentStep);
              const isPast = idx < stepIndex;
              const isCurrent = idx === stepIndex;

              return (
                <div key={s.step} className="flex flex-col items-center text-center">
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCurrent ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-100' :
                    isPast ? 'bg-emerald-100 text-emerald-700' :
                    'bg-slate-100 text-slate-400'
                  }`}>
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : s.number}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-medium mt-1 truncate max-w-full ${
                    isCurrent ? 'text-blue-600 font-bold' :
                    isPast ? 'text-slate-700 font-semibold' :
                    'text-slate-400'
                  }`}>
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 1: BROWSE DEPARTMENTS */}
      {currentStep === 'DEPARTMENT' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search clinical departments (e.g. General Medicine, Cardiology, Gynecology)..."
              value={departmentSearch}
              onChange={(e) => setDepartmentSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Department Cards Grid */}
          {isDepartmentsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 h-32 animate-pulse flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-slate-200 rounded-2xl mb-2"></div>
                  <div className="h-3 w-20 bg-slate-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">No departments found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No active departments matching your search are currently configured with eligible doctors.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {filteredDepartments.map((dept) => {
                const imageUrl = getDepartmentImageUrl(dept.name, dept.icon);
                return (
                  <button
                    key={dept.id}
                    onClick={() => handleSelectDepartment(dept)}
                    className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col items-center text-center hover:border-blue-300 hover:shadow-md transition-all group cursor-pointer text-left focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden mb-3 shadow-xs border border-slate-100 group-hover:scale-105 group-hover:shadow-sm transition-all duration-300 bg-slate-50">
                      <img
                        src={imageUrl}
                        alt={dept.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/departments/default.jpg';
                        }}
                      />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {dept.name}
                    </h3>
                    {dept.hospitalName && (
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        {dept.hospitalName}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STEP 2: SELECT DOCTOR */}
      {currentStep === 'DOCTOR' && selectedDepartment && (
        <div className="space-y-4">
          {/* Selected Department Banner */}
          <div className="bg-blue-50/60 rounded-2xl border border-blue-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white shadow-xs shrink-0 overflow-hidden border border-slate-100">
                <img
                  src={getDepartmentImageUrl(selectedDepartment.name, selectedDepartment.icon)}
                  alt={selectedDepartment.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/departments/default.jpg';
                  }}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                    Department
                  </span>
                  <h2 className="text-base font-bold text-slate-900">{selectedDepartment.name}</h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing eligible doctors from accredited partner hospitals
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Consultation Type Selector */}
              <div className="inline-flex rounded-xl bg-white p-1 border border-blue-200">
                <button
                  type="button"
                  onClick={() => handleConsultationTypeChange('OP')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                    consultationType === 'OP' 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  In-Person OP
                </button>
                <button
                  type="button"
                  onClick={() => handleConsultationTypeChange('VIDEO')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                    consultationType === 'VIDEO' 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  Video Consult
                </button>
              </div>

              <button
                onClick={() => setCurrentStep('DEPARTMENT')}
                className="text-xs font-semibold text-blue-600 hover:underline px-2 py-1"
              >
                Change
              </button>
            </div>
          </div>

          {/* Doctor Cards List */}
          {isDoctorsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 h-36 animate-pulse flex gap-4">
                  <div className="w-16 h-16 bg-slate-200 rounded-full shrink-0"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : doctors.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 text-center space-y-3">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">
                No eligible hospitals or laboratories found near your selected location.
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No active specialists in {selectedDepartment.name} are currently found near <span className="font-semibold text-slate-700">{userLocation.label}</span> within {userLocation.radiusKm} km.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const btn = document.getElementById('desktop-location-selector') || document.getElementById('mobile-location-selector');
                    btn?.click();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-xs"
                >
                  Change Location
                </button>
                {userLocation.radiusKm < 50 && (
                  <button
                    type="button"
                    onClick={() => setNearbyRadiusKm(50)}
                    className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100"
                  >
                    Expand Radius (50 km)
                  </button>
                )}
                <button
                  onClick={() => handleConsultationTypeChange(consultationType === 'OP' ? 'VIDEO' : 'OP')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Switch to {consultationType === 'OP' ? 'Video Consultation' : 'In-Person OP'}
                </button>
                <button
                  onClick={() => setCurrentStep('DEPARTMENT')}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50"
                >
                  Browse Other Departments
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {doctors.map((doctor) => {
                const hasPhone = Boolean(doctor.hospitalPhone && doctor.hospitalPhone.trim());

                return (
                  <div
                    key={doctor.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-blue-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Doctor Info */}
                    <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {doctor.avatar ? (
                          <img
                            src={doctor.avatar}
                            alt={doctor.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <User className="w-8 h-8 text-blue-500" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-base">
                            {doctor.name}
                          </h3>
                          {doctor.qualification && doctor.qualification !== 'Not specified' && (
                            <span className="text-[11px] font-medium text-slate-500">
                              ({doctor.qualification})
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-blue-600 font-semibold mt-0.5">
                          {doctor.designation || doctor.specialization}
                          {doctor.experience && doctor.experience !== 'Not specified' && ` • ${doctor.experience}`}
                        </p>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5 flex-wrap">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-800">
                            {doctor.hospitalName}
                          </span>
                          {(doctor.hospitalAddress || doctor.hospitalCity) && (
                            <span className="text-slate-500">
                              • {[doctor.hospitalAddress, doctor.hospitalCity].filter(Boolean).join(', ')}
                            </span>
                          )}
                        </div>

                        {doctor.fees && (
                          <div className="mt-2 text-xs font-bold text-slate-900">
                            Consultation Fee: <span className="text-blue-600">{doctor.fees}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {/* Call Clinic Action */}
                        {hasPhone ? (
                          <a
                            href={`tel:${doctor.hospitalPhone}`}
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title={`Call clinic at ${doctor.hospitalPhone}`}
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-600" />
                            <span>Call Clinic</span>
                          </a>
                        ) : (
                          <div className="relative flex-1 sm:flex-initial">
                            <button
                              type="button"
                              onClick={() => {
                                setPhoneAlertDoctorId(doctor.id);
                                setTimeout(() => setPhoneAlertDoctorId(null), 3000);
                              }}
                              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Call Clinic</span>
                            </button>
                            {phoneAlertDoctorId === doctor.id && (
                              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2.5 rounded shadow-lg whitespace-nowrap z-20">
                                Contact number unavailable
                              </div>
                            )}
                          </div>
                        )}

                        {/* View Doctor Details Action */}
                        <button
                          type="button"
                          onClick={() => setPreviewDoctor(doctor)}
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                        >
                          <Info className="w-3.5 h-3.5" />
                          <span>View Doctor</span>
                        </button>
                      </div>

                      {/* Select Doctor / Book Slot Action */}
                      <button
                        type="button"
                        onClick={() => handleSelectDoctor(doctor)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
                      >
                        <span>Choose Slot</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STEP 3: CHOOSE DATE & TIME SLOT */}
      {currentStep === 'SLOT' && selectedDoctor && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-6">
          {/* Doctor Brief Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold shrink-0">
                {selectedDoctor.avatar ? (
                  <img
                    src={selectedDoctor.avatar}
                    alt={selectedDoctor.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <User className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{selectedDoctor.name}</h3>
                <p className="text-xs text-slate-500">
                  {selectedDoctor.department} • {selectedDoctor.hospitalName}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Consultation</span>
              <span className="text-xs font-bold text-blue-600">
                {consultationType === 'VIDEO' ? 'Video Call' : 'In-Person OP'}
              </span>
            </div>
          </div>

          {/* 1. Date Selector (7 upcoming days) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Select Appointment Date
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {UPCOMING_DATES.map((d) => {
                const isSelected = selectedDate.isoDate === d.isoDate;
                return (
                  <button
                    key={d.isoDate}
                    type="button"
                    onClick={() => handleDateChange(d)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs ring-2 ring-blue-100'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span className={`text-[10px] block font-medium ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                      {d.label}
                    </span>
                    <span className="text-xs font-bold block mt-0.5">
                      {d.date}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Available Slots Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Available Time Slots ({selectedDate.label}, {selectedDate.date})
              </label>
              {slotsLoading && (
                <span className="text-xs text-blue-600 flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Checking availability...
                </span>
              )}
            </div>

            {slotsLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="p-8 bg-slate-50 rounded-xl text-center space-y-2 border border-slate-100">
                <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">No slots available for this date</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  All consultation slots for {selectedDate.label} are either fully booked, past, or not scheduled. Please choose another date above.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {morningSlots.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Morning Sessions
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {morningSlots.map((slot) => {
                        const isSelected = selectedSlot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => {
                              setSelectedSlot(slot);
                              setSlotError(null);
                            }}
                            className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 border-blue-600 text-white shadow-xs ring-2 ring-blue-100'
                                : 'bg-white border-slate-200 hover:border-blue-300 text-slate-800 hover:bg-blue-50/40'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {afternoonEveningSlots.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Afternoon & Evening Sessions
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {afternoonEveningSlots.map((slot) => {
                        const isSelected = selectedSlot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => {
                              setSelectedSlot(slot);
                              setSlotError(null);
                            }}
                            className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 border-blue-600 text-white shadow-xs ring-2 ring-blue-100'
                                : 'bg-white border-slate-200 hover:border-blue-300 text-slate-800 hover:bg-blue-50/40'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {slotError && (
              <p className="text-xs text-rose-600 mt-2 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {slotError}
              </p>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep('DOCTOR')}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Back to Doctors
            </button>
            <button
              type="button"
              disabled={!selectedSlot}
              onClick={handleSlotNext}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedSlot
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>Continue to Patient Details</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: PATIENT DETAILS */}
      {currentStep === 'PATIENT_DETAILS' && selectedDoctor && (
        <form onSubmit={handlePatientDetailsNext} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-5">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Patient & Contact Information</h3>
            <p className="text-xs text-slate-500">
              Ensure accurate patient details for hospital registration and consultation prescription records.
            </p>
          </div>

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Patient Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contact Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Patient Age <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="120"
                required
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                placeholder="e.g. 35"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Biological Gender <span className="text-rose-500">*</span>
              </label>
              <select
                value={patientGender}
                onChange={(e) => setPatientGender(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              City / Residential Address
            </label>
            <input
              type="text"
              value={patientAddress}
              onChange={(e) => setPatientAddress(e.target.value)}
              placeholder="e.g. Banjara Hills, Hyderabad"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Reason for Visit / Primary Symptoms (Optional)
            </label>
            <textarea
              rows={3}
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="Briefly describe your symptoms or reason for consulting the specialist..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep('SLOT')}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Back to Slot Selection
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Continue to Review & Pay</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 5: REVIEW & PAY */}
      {currentStep === 'REVIEW_PAY' && selectedDoctor && selectedDepartment && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Appointment Review & Summary</h3>
            <p className="text-xs text-slate-500">
              Please inspect the booking parameters before confirming your appointment.
            </p>
          </div>

          {submissionError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Booking could not be completed</p>
                <p className="mt-0.5">{submissionError}</p>
              </div>
            </div>
          )}

          {/* Consultation Summary Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Consultation Details */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Doctor & Hospital
              </span>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                  {selectedDoctor.avatar ? (
                    <img src={selectedDoctor.avatar} alt={selectedDoctor.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{selectedDoctor.name}</h4>
                  <p className="text-xs text-blue-600 font-semibold">{selectedDoctor.designation || selectedDoctor.specialization}</p>
                  <p className="text-xs text-slate-500 font-medium">{selectedDepartment.name} Department</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold">{selectedDoctor.hospitalName}</span>
                </div>
                {selectedDoctor.hospitalAddress && (
                  <div className="flex items-start gap-2 text-slate-500 text-[11px] pl-5">
                    <span>{selectedDoctor.hospitalAddress}</span>
                  </div>
                )}
                {selectedDoctor.hospitalPhone && (
                  <div className="flex items-center gap-2 text-slate-500 text-[11px] pl-5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{selectedDoctor.hospitalPhone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Schedule & Patient Summary */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Schedule & Patient Details
              </span>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Consultation Type:</span>
                  <span className="font-bold text-blue-600">
                    {consultationType === 'VIDEO' ? 'Online Video Consultation' : 'In-Person Hospital OP'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Date:</span>
                  <span className="font-bold text-slate-900">{selectedDate.label}, {selectedDate.date} ({selectedDate.isoDate})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Time Slot:</span>
                  <span className="font-bold text-emerald-600">{selectedSlot}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Patient:</span>
                  <span className="font-bold text-slate-900">{patientName} ({patientAge} Yrs, {patientGender})</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Contact:</span>
                  <span className="font-bold text-slate-900">{patientPhone}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Payment & Fee Breakdown */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Fee Summary
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Doctor Consultation Fee</span>
                <span className="font-semibold">{feeAmount > 0 ? `₹${feeAmount}` : '₹0 (Free)'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Platform Convenience Fee</span>
                <span className="font-semibold text-emerald-600">FREE</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                <span>Total Amount Payable</span>
                <span className="text-blue-600">{feeAmount > 0 ? `₹${feeAmount}` : '₹0'}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setCurrentStep('PATIENT_DETAILS')}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Back to Patient Details
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirmBooking}
              className={`px-7 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                isSubmitting
                  ? 'bg-blue-400 text-white cursor-wait'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Securing Appointment...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm & Schedule Appointment</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: CONFIRMATION */}
      {currentStep === 'CONFIRMATION' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm text-center max-w-xl mx-auto space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 inline-block">
              Appointment Confirmed
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Booking Scheduled Successfully!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Your appointment is confirmed and recorded with the hospital clinic.
            </p>
          </div>

          {/* Booking Reference Card */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-left space-y-2.5 text-xs">
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Booking Reference:</span>
              <span className="font-mono font-bold text-blue-600">{bookingConfirmation?.id || 'OP-CONFIRMED'}</span>
            </div>
            {bookingConfirmation?.tokenNumber && (
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Token Number:</span>
                <span className="font-bold text-slate-900">Token #{bookingConfirmation.tokenNumber}</span>
              </div>
            )}
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Doctor:</span>
              <span className="font-semibold text-slate-800">{selectedDoctor?.name}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Department:</span>
              <span className="font-semibold text-slate-800">{selectedDepartment?.name}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Hospital:</span>
              <span className="font-semibold text-slate-800">{selectedDoctor?.hospitalName}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Date & Time:</span>
              <span className="font-bold text-emerald-600">{selectedDate.date} at {selectedSlot}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Patient:</span>
              <span className="font-semibold text-slate-800">{patientName}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => navigate('/bookings')}
              className="flex-1 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
            >
              View in My Bookings
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}

      {/* DOCTOR PREVIEW MODAL */}
      {previewDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 overflow-hidden shrink-0">
                  {previewDoctor.avatar ? (
                    <img src={previewDoctor.avatar} alt={previewDoctor.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{previewDoctor.name}</h3>
                  <p className="text-xs text-blue-600 font-semibold">{previewDoctor.designation || previewDoctor.specialization}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoctor(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              {/* Affiliated Hospital Info */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Affiliated Hospital</span>
                <p className="font-bold text-slate-800 text-sm">{previewDoctor.hospitalName}</p>
                {previewDoctor.hospitalAddress && (
                  <p className="text-slate-600 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{previewDoctor.hospitalAddress}</span>
                  </p>
                )}
                {previewDoctor.hospitalPhone && (
                  <p className="text-slate-600 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <a href={`tel:${previewDoctor.hospitalPhone}`} className="text-blue-600 font-semibold hover:underline">
                      {previewDoctor.hospitalPhone}
                    </a>
                  </p>
                )}
              </div>

              {/* Qualifications & Experience */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Qualification</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{previewDoctor.qualification || 'Not specified'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Experience</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{previewDoctor.experience || 'Not specified'}</span>
                </div>
              </div>

              {/* Bio & Clinical Profile */}
              {previewDoctor.bio && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">About Doctor</span>
                  <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {previewDoctor.bio}
                  </p>
                </div>
              )}

              {/* Consultation Fee */}
              <div className="flex justify-between items-center p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                <span className="font-semibold text-slate-700">Consultation Fee</span>
                <span className="font-bold text-blue-600 text-sm">{previewDoctor.fees || 'Free'}</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPreviewDoctor(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const doc = previewDoctor;
                  setPreviewDoctor(null);
                  handleSelectDoctor(doc);
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>Continue with this Doctor</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DepartmentBooking;
