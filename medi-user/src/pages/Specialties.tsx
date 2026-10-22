import React, { useState, useEffect, useRef } from 'react';
import { departmentIcons, allIcons, getDiseaseIconUrl } from '../utils/diseaseIcons';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Search, Video, Clock, CheckCircle2, ChevronLeft, ChevronRight,
  MapPin, Phone, ShieldCheck, User, Activity, FileText, AlertCircle, 
  Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Info,
  ArrowLeft, Calendar, Building2, Stethoscope, CalendarClock, CalendarCheck, 
  ActivitySquare, Bot, X, Sparkles, Copy
} from 'lucide-react';
import HowItWorks from '../components/HowItWorks';
import KnowYourDiseaseModal from '../components/KnowYourDiseaseModal';
import { useAuth } from '../lib/auth';
import { opAppointmentApi, doctorApi, type DoctorRecord } from '../lib/opAppointmentApi';

// --- 5-STEP HOW IT WORKS DATA ---
const opBookingStepsData = [
  { id: '01', title: 'Select Disease', desc: 'Browse or search your specific health concern from verified specialties.', icon: ActivitySquare },
  { id: '02', title: 'Select Doctor', desc: 'Browse and choose an eligible specialist from accredited partner hospitals.', icon: Stethoscope },
  { id: '03', title: 'Slot Booking', desc: 'Select a convenient date and available in-person clinic consultation slot.', icon: CalendarClock },
  { id: '04', title: 'Review & Pay', desc: 'Verify consultation and patient details before confirming your booking.', icon: FileText },
  { id: '05', title: 'Confirmation', desc: 'Receive your instant appointment reference and token details.', icon: CalendarCheck }
];

const videoConsultationStepsData = [
  { id: '01', title: 'Select Disease', desc: 'Search or select your health symptom or medical concern.', icon: ActivitySquare },
  { id: '02', title: 'Select Doctor', desc: 'Choose a verified specialist doctor who supports video consultations.', icon: Stethoscope },
  { id: '03', title: 'Slot Booking', desc: 'Select an available date and remote video consultation time slot.', icon: CalendarClock },
  { id: '04', title: 'Review & Pay', desc: 'Review consultation details and verify patient information.', icon: FileText },
  { id: '05', title: 'Confirmation', desc: 'Get confirmed booking reference and scheduled video consultation access.', icon: Video }
];

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

const INITIAL_DATES = getUpcomingDates();

const getDiseasesForCategory = (catId: string, catName: string, rawConditions: any[] = [], categoryObj?: any) => {
  const backendMatches = rawConditions.filter(c => 
    c.specialtyId === catId || (c.specialtyName && c.specialtyName.toLowerCase().includes(catName.toLowerCase()))
  );

  const listToUse = backendMatches.length > 0 
    ? backendMatches 
    : (categoryObj?.conditions || []);

  return listToUse.map((bm: any, idx: number) => ({
    id: bm.id,
    name: bm.name,
    specialtyId: bm.specialtyId || catId,
    desc: bm.description || `Specialized clinical care and diagnosis for ${bm.name}.`,
    icon: Stethoscope,
    image: getDiseaseIconUrl(bm.name, bm.icon, catName),
    bg: ['bg-red-50', 'bg-blue-50', 'bg-emerald-50', 'bg-purple-50', 'bg-amber-50'][idx % 5],
    iconName: bm.icon || (departmentIcons[catName] ? departmentIcons[catName][0] : allIcons[0])
  }));
};

type ViewState = 
  | 'LANDING'              // Step 1: Browse Diseases
  | 'CATEGORICAL_DISEASES' // Step 1: Browse Category
  | 'DOCTOR_LIST'          // Step 2: Select Doctor
  | 'DOCTOR_PROFILE'       // Step 2 detail: Dedicated Doctor Profile
  | 'SELECT_SLOT'          // Step 3: Slot Booking
  | 'REVIEW_PAY'           // Step 4: Review & Pay
  | 'CONFIRMATION'         // Step 5: Confirmation
  | 'APPOINTMENT_STATUS'
  | 'VIDEO_UPCOMING'
  | 'VIDEO_CALL'
  | 'VIDEO_COMPLETED';

const FALLBACK_GENERAL_DISEASES = [
  { id: 'gen-1', name: 'Fever', icon: Activity, image: getDiseaseIconUrl('Fever'), bg: 'bg-rose-50' },
  { id: 'gen-2', name: 'Common Cold', icon: Activity, image: getDiseaseIconUrl('Common Cold'), bg: 'bg-sky-50' },
  { id: 'gen-3', name: 'Flu', icon: Activity, image: getDiseaseIconUrl('Flu'), bg: 'bg-emerald-50' },
  { id: 'gen-4', name: 'Cough', icon: Activity, image: getDiseaseIconUrl('Cough'), bg: 'bg-cyan-50' },
  { id: 'gen-5', name: 'Headache', icon: Activity, image: getDiseaseIconUrl('Headache'), bg: 'bg-pink-50' },
  { id: 'gen-6', name: 'Migraine', icon: Activity, image: getDiseaseIconUrl('Migraine'), bg: 'bg-purple-50' },
  { id: 'gen-7', name: 'Body Pain', icon: Activity, image: getDiseaseIconUrl('Body Pain'), bg: 'bg-slate-100' },
  { id: 'gen-8', name: 'Sore Throat', icon: Activity, image: getDiseaseIconUrl('Sore Throat'), bg: 'bg-amber-50' },
  { id: 'gen-9', name: 'Stomach Pain', icon: Activity, image: getDiseaseIconUrl('Stomach Pain'), bg: 'bg-amber-50' },
  { id: 'gen-10', name: 'Fatigue & Weakness', icon: Activity, image: getDiseaseIconUrl('Fatigue'), bg: 'bg-indigo-50' },
];

const FALLBACK_ADVANCED_DISEASES = [
  { id: 'adv-1', name: 'Chest Pain', icon: ShieldCheck, image: getDiseaseIconUrl('Chest Pain'), bg: 'bg-pink-50' },
  { id: 'adv-2', name: 'Shortness of Breath', icon: ShieldCheck, image: getDiseaseIconUrl('Shortness of Breath'), bg: 'bg-blue-50' },
  { id: 'adv-3', name: 'Diabetes Check', icon: ShieldCheck, image: getDiseaseIconUrl('Diabetes'), bg: 'bg-orange-50' },
  { id: 'adv-4', name: 'Hypertension Management', icon: ShieldCheck, image: getDiseaseIconUrl('Hypertension'), bg: 'bg-rose-50' },
  { id: 'adv-5', name: 'Kidney Health Screening', icon: ShieldCheck, image: getDiseaseIconUrl('Kidney Health'), bg: 'bg-cyan-50' },
  { id: 'adv-6', name: 'Thyroid Disorder', icon: ShieldCheck, image: getDiseaseIconUrl('Thyroid'), bg: 'bg-purple-50' },
  { id: 'adv-7', name: 'Chronic Joint Pain', icon: ShieldCheck, image: getDiseaseIconUrl('Joint Pain'), bg: 'bg-amber-50' },
  { id: 'adv-8', name: 'Severe Migraine', icon: ShieldCheck, image: getDiseaseIconUrl('Migraine'), bg: 'bg-indigo-50' },
  { id: 'adv-9', name: 'Liver Function Concern', icon: ShieldCheck, image: getDiseaseIconUrl('Liver'), bg: 'bg-emerald-50' },
];

const FALLBACK_CATEGORICAL_SPECIALTIES = [
  {
    id: 'cat-diet',
    name: 'Diet & Nutrition / Dietitian',
    desc: 'Diet and nutrition plans.',
    icon: Sparkles,
    bg: 'bg-emerald-50',
    conditions: [
      { id: 'c-d1', name: 'Weight Management', specialtyId: 'cat-diet' },
      { id: 'c-d2', name: 'Diabetes Nutrition', specialtyId: 'cat-diet' },
    ]
  },
  {
    id: 'cat-yoga',
    name: 'Yoga & Wellness',
    desc: 'Physical and mental well-being.',
    icon: Sparkles,
    bg: 'bg-cyan-50',
    conditions: [
      { id: 'c-y1', name: 'Stress & Anxiety Relief', specialtyId: 'cat-yoga' },
      { id: 'c-y2', name: 'Posture & Mobility', specialtyId: 'cat-yoga' },
    ]
  },
  {
    id: 'cat-1',
    name: 'Cardiology',
    desc: 'Heart and cardiovascular care',
    icon: Stethoscope,
    bg: 'bg-emerald-50',
    conditions: [
      { id: 'c-1', name: 'Hypertension / High BP', specialtyId: 'cat-1' },
      { id: 'c-2', name: 'Angina & Chest Discomfort', specialtyId: 'cat-1' },
    ]
  },
  {
    id: 'cat-2',
    name: 'Dermatology',
    desc: 'Skin and hair conditions',
    icon: Stethoscope,
    bg: 'bg-cyan-50',
    conditions: [
      { id: 'c-3', name: 'Acne', specialtyId: 'cat-2' },
      { id: 'c-4', name: 'Eczema', specialtyId: 'cat-2' },
    ]
  },
  {
    id: 'cat-3',
    name: 'Neurology',
    desc: 'Brain and nervous system care',
    icon: Stethoscope,
    bg: 'bg-purple-50',
    conditions: [
      { id: 'c-5', name: 'Migraine', specialtyId: 'cat-3' },
    ]
  },
  {
    id: 'cat-4',
    name: 'Orthopedics',
    desc: 'Bones, joints, and spine care',
    icon: Stethoscope,
    bg: 'bg-amber-50',
    conditions: [
      { id: 'c-6', name: 'Back Pain', specialtyId: 'cat-4' },
      { id: 'c-7', name: 'Arthritis', specialtyId: 'cat-4' },
    ]
  },
  {
    id: 'cat-5',
    name: 'Gastroenterology',
    desc: 'Digestive and liver health',
    icon: Stethoscope,
    bg: 'bg-rose-50',
    conditions: [
      { id: 'c-8', name: 'Acid Reflux / GERD', specialtyId: 'cat-5' },
    ]
  },
];

const FALLBACK_DOCTORS: DoctorRecord[] = [
  {
    id: 'doc-1',
    name: 'Dr. Sarah Jenkins',
    specialization: 'General Physician & Internal Medicine',
    qualification: 'MBBS, MD (General Medicine)',
    experience: '12+ Years Exp',
    designation: 'Senior Consultant Physician',
    hospitalId: 'hosp-1',
    hospitalName: 'Apollo Hospitals',
    hospitalAddress: 'Road No. 72, Jubilee Hills, Hyderabad',
    hospitalPhone: '+91 40 2360 7777',
    departmentId: 'dept-gen',
    department: 'General Medicine',
    consultInfo: 'Expert in infectious diseases, chronic illness management, and adult primary care.',
    bio: 'Dr. Sarah Jenkins has over 12 years of clinical experience in internal medicine and comprehensive outpatient diagnostic care.',
    fees: '₹ 500',
    consultationFee: 500,
    rating: 4.8
  }
];

const FALLBACK_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'
];

const Specialties = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const typeParam = searchParams.get('type') || 'hospital-op';
  const isVideo = typeParam === 'video-consult' || typeParam === 'doctor' || typeParam === 'video';
  const consultationTypeQuery = isVideo ? 'video' : 'op';
  const { user } = useAuth();

  // State Management
  const [view, setView] = useState<ViewState>('LANDING');
  const [activeTab, setActiveTab] = useState<'general' | 'advanced'>('general');
  const [showAllGeneral, setShowAllGeneral] = useState(false);
  const [showAllAdvanced, setShowAllAdvanced] = useState(false);
  const [showAllCategorical, setShowAllCategorical] = useState(false);
  
  // Real Data State
  const [diseasesList, setDiseasesList] = useState({
    general: FALLBACK_GENERAL_DISEASES as any[],
    advanced: FALLBACK_ADVANCED_DISEASES as any[],
    categorical: FALLBACK_CATEGORICAL_SPECIALTIES as any[],
    raw: [] as any[]
  });
  const [doctorsList, setDoctorsList] = useState<DoctorRecord[]>(FALLBACK_DOCTORS);
  const [availableSlots, setAvailableSlots] = useState<string[]>(FALLBACK_SLOTS);
  const [allSlots, setAllSlots] = useState<string[]>(FALLBACK_SLOTS);
  const [isDoctorsLoading, setIsDoctorsLoading] = useState(false);
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
  const [isDiseasesLoading, setIsDiseasesLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Search & Filter State
  const [diseaseSearch, setDiseaseSearch] = useState('');
  const [diseaseSearchMode] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [selectedDisease, setSelectedDisease] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [categoricalDiseaseSearch, setCategoricalDiseaseSearch] = useState('');
  
  // Selected Doctor, Hospital, Slot State
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorRecord | null>(null);
  const [upcomingDates] = useState<SlotDateOption[]>(INITIAL_DATES);
  const [selectedDate, setSelectedDate] = useState<string>(() => INITIAL_DATES[0]?.date || 'Today');
  const [selectedDateIso, setSelectedDateIso] = useState<string>(() => INITIAL_DATES[0]?.isoDate || new Date().toISOString().split('T')[0]);
  const [isDoctorAvailable, setIsDoctorAvailable] = useState<boolean>(true);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [reason, setReason] = useState('');

  // Patient Details for Step 4 (Review & Pay)
  const [patientName, setPatientName] = useState(() => user?.name || '');
  const [patientPhone, setPatientPhone] = useState(() => user?.phone || '');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('Male');
  
  // Booking Confirmation State
  const [bookingId, setBookingId] = useState('');
  const [bookingStatus, setBookingStatus] = useState('PENDING');
  const [notification, setNotification] = useState('');
  const [confirmedBookingData, setConfirmedBookingData] = useState<any>(null);
  
  // Video room state (for post-booking consultation room)
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  // Know Your Disease AI Modal
  const [showAiModal, setShowAiModal] = useState(false);
  const [isAiPopupCollapsed, setIsAiPopupCollapsed] = useState(false);
  const [isAiHovered, setIsAiHovered] = useState(false);
  const [hasDismissedAiPopup, setHasDismissedAiPopup] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('mediquee_dismissed_ai_popup') === 'true';
    } catch {
      return false;
    }
  });

  // Dedicated Doctor Profile State
  const [doctorFullProfile, setDoctorFullProfile] = useState<any>(null);
  const [isDoctorProfileLoading, setIsDoctorProfileLoading] = useState(false);

  // Sync patient name/phone when user profile is loaded
  useEffect(() => {
    if (user?.name && !patientName) setPatientName(user.name);
    if (user?.phone && !patientPhone) setPatientPhone(user.phone);
  }, [user]);

  // Step 1: AI helper button behavior
  useEffect(() => {
    const isDiseaseSelectionScreen = view === 'LANDING' || view === 'CATEGORICAL_DISEASES';
    if (!isDiseaseSelectionScreen || hasDismissedAiPopup) {
      setIsAiPopupCollapsed(true);
      return;
    }
    setIsAiPopupCollapsed(false);
    const timer = setTimeout(() => {
      setIsAiPopupCollapsed(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [view, hasDismissedAiPopup]);

  const handleDismissAiPopup = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasDismissedAiPopup(true);
    try {
      sessionStorage.setItem('mediquee_dismissed_ai_popup', 'true');
    } catch {}
  };

  // Fetch full doctor profile when entering DOCTOR_PROFILE view
  useEffect(() => {
    if (view === 'DOCTOR_PROFILE' && selectedDoctor?.id) {
      let isMounted = true;
      setIsDoctorProfileLoading(true);
      doctorApi.getDoctor(selectedDoctor.id).then((res) => {
        if (isMounted) {
          if (res.success && res.data) {
            setDoctorFullProfile(res.data);
          } else {
            setDoctorFullProfile(selectedDoctor);
          }
          setIsDoctorProfileLoading(false);
        }
      }).catch(() => {
        if (isMounted) {
          setDoctorFullProfile(selectedDoctor);
          setIsDoctorProfileLoading(false);
        }
      });
      return () => { isMounted = false; };
    }
  }, [view, selectedDoctor?.id]);

  // Fetch diseases from backend filtered by consultation type
  useEffect(() => {
    let mounted = true;
    setIsDiseasesLoading(true);
    opAppointmentApi.fetchDiseases(undefined, consultationTypeQuery).then((res) => {
      if (mounted) {
        if (res.success && res.data) {
          const general = (res.data.general || []).map((d: any, idx: number) => ({
            ...d,
            icon: Activity,
            image: getDiseaseIconUrl(d.name, d.icon),
            bg: ['bg-red-50', 'bg-blue-50', 'bg-emerald-50', 'bg-purple-50', 'bg-amber-50'][idx % 5]
          }));
          
          const advanced = (res.data.advanced || []).map((d: any, idx: number) => ({
            ...d,
            icon: ShieldCheck,
            image: getDiseaseIconUrl(d.name, d.icon),
            bg: ['bg-pink-50', 'bg-blue-50', 'bg-orange-50', 'bg-fuchsia-50', 'bg-rose-50'][idx % 5]
          }));
          
          const categorical = (res.data.categorical || []).map((s: any, idx: number) => ({
            ...s,
            desc: s.description || 'Specialized clinical care',
            icon: Stethoscope,
            image: getDiseaseIconUrl(s.name, s.icon),
            bg: ['bg-emerald-50', 'bg-cyan-50', 'bg-rose-50', 'bg-red-50', 'bg-purple-50'][idx % 5]
          }));

          setDiseasesList({
            general,
            advanced,
            categorical,
            raw: res.data.conditions || []
          });
        }
        setIsDiseasesLoading(false);
      }
    }).catch(() => {
      if (mounted) setIsDiseasesLoading(false);
    });

    return () => { mounted = false; };
  }, [consultationTypeQuery]);

  // Step 2: Fetch eligible doctors directly using selected disease and consultation type
  useEffect(() => {
    if (view === 'DOCTOR_LIST' || view === 'DOCTOR_PROFILE') {
      let active = true;
      setIsDoctorsLoading(true);

      doctorApi.getDoctors({
        search: doctorSearch,
        conditionId: selectedDisease?.id,
        specialtyId: selectedDisease?.specialtyId,
        consultationType: consultationTypeQuery,
        type: consultationTypeQuery
      }).then((res) => {
        if (active) {
          setIsDoctorsLoading(false);
          if (res.success && Array.isArray(res.data)) {
            setDoctorsList(res.data);
          } else {
            setDoctorsList([]);
          }
        }
      }).catch(() => {
        if (active) {
          setIsDoctorsLoading(false);
          setDoctorsList([]);
        }
      });
      return () => { active = false; };
    }
  }, [view, selectedDisease, doctorSearch, consultationTypeQuery]);

  // Step 3: Fetch real doctor availability when selecting slot
  useEffect(() => {
    if (view === 'SELECT_SLOT' && selectedDoctor?.id) {
      let active = true;
      setIsSlotsLoading(true);
      const queryDate = selectedDateIso || new Date().toISOString().split('T')[0];
      const slotType = isVideo ? 'VIDEO' : 'OP';

      opAppointmentApi.fetchDoctorAvailability(selectedDoctor.id, queryDate, slotType).then((res) => {
        if (active) {
          setIsSlotsLoading(false);
          if (res.success && res.data) {
            setIsDoctorAvailable(res.data.isAvailable !== false);
            setAllSlots(res.data.allSlots || []);
            setAvailableSlots(res.data.availableSlots || []);
          } else {
            setIsDoctorAvailable(true);
            setAllSlots(FALLBACK_SLOTS);
            setAvailableSlots(FALLBACK_SLOTS);
          }
        }
      }).catch(() => {
        if (active) {
          setIsSlotsLoading(false);
          setIsDoctorAvailable(true);
          setAllSlots(FALLBACK_SLOTS);
          setAvailableSlots(FALLBACK_SLOTS);
        }
      });
      return () => { active = false; };
    }
  }, [view, selectedDoctor, selectedDateIso, isVideo]);

  // Handle AI modal suggestion selection -> directly advance to Step 2
  const handleAiSelectConcern = (concern: any) => {
    const term = concern.diseaseSearchTerm || concern.name;
    const matched = diseasesList.general.find(d => d.name.toLowerCase().includes(term.toLowerCase())) ||
                    diseasesList.advanced.find(d => d.name.toLowerCase().includes(term.toLowerCase())) ||
                    diseasesList.categorical.find(d => d.name.toLowerCase().includes(term.toLowerCase()));

    if (matched) {
      handleDiseaseSelect(matched);
    } else {
      setSelectedDisease({
        id: concern.id,
        name: concern.name,
        specialtyId: concern.specialtyId,
        icon: Stethoscope,
        image: getDiseaseIconUrl(concern.name)
      });
      setSelectedDoctor(null);
      setSelectedTime('');
      setDoctorSearch('');
      setView('DOCTOR_LIST');
    }
  };

  // Deep link support for ?category=
  useEffect(() => {
    const categoryQuery = searchParams.get('category');
    if (categoryQuery && diseasesList.categorical.length > 0) {
      const trimmedQuery = categoryQuery.trim().toLowerCase();
      const matchedCategory = diseasesList.categorical.find(
        c => (c.name || '').trim().toLowerCase() === trimmedQuery ||
             (c.id || '') === categoryQuery ||
             (c.name || '').toLowerCase().includes(trimmedQuery) ||
             trimmedQuery.includes((c.name || '').toLowerCase())
      );
      if (matchedCategory) {
        setSelectedCategory(matchedCategory);
        setCategoricalDiseaseSearch('');
        setView('CATEGORICAL_DISEASES');
      }
    }
  }, [searchParams, diseasesList.categorical]);

  // Reset state when consultation mode changes (OP <-> Video)
  const prevIsVideoRef = useRef(isVideo);
  useEffect(() => {
    if (prevIsVideoRef.current !== isVideo) {
      prevIsVideoRef.current = isVideo;
      setView('LANDING');
      setSelectedHospital(null);
      setSelectedDoctor(null);
      setSelectedDisease(null);
      setSelectedCategory(null);
      setCategoricalDiseaseSearch('');
      setDiseaseSearch('');
      setDoctorSearch('');
      setBookingError('');
    }
  }, [isVideo]);

  // Backward navigation handler
  const handleBack = () => {
    setBookingError('');
    switch (view) {
      case 'CATEGORICAL_DISEASES':
        setView('LANDING');
        setSelectedCategory(null);
        break;
      case 'DOCTOR_LIST':
        setView(selectedCategory ? 'CATEGORICAL_DISEASES' : 'LANDING');
        break;
      case 'DOCTOR_PROFILE':
        setView('DOCTOR_LIST');
        break;
      case 'SELECT_SLOT':
        setView('DOCTOR_LIST');
        break;
      case 'REVIEW_PAY':
        setView('SELECT_SLOT');
        break;
      case 'CONFIRMATION':
      case 'APPOINTMENT_STATUS':
      case 'VIDEO_UPCOMING':
      case 'VIDEO_COMPLETED':
        setView('LANDING');
        setSelectedDisease(null);
        setSelectedDoctor(null);
        setSelectedTime('');
        break;
      default:
        if (window.history.state && window.history.state.idx > 0) {
          navigate(-1);
        } else {
          navigate('/');
        }
    }
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4500);
  };

  // Step 1: Select Disease -> Move directly to Step 2: Select Doctor
  const handleDiseaseSelect = (disease: any) => {
    setSelectedDisease(disease);
    setSelectedDoctor(null);
    setSelectedTime('');
    setDoctorSearch('');
    setBookingError('');
    setView('DOCTOR_LIST');
  };

  const handleCategorySelect = (category: any) => {
    setSelectedCategory(category);
    setCategoricalDiseaseSearch('');
    setView('CATEGORICAL_DISEASES');
  };

  // Step 4 -> 5: Confirm and persist booking
  const confirmBooking = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setBookingError('');

    try {
      const targetDate = selectedDateIso || new Date().toISOString().split('T')[0];
      const res = await opAppointmentApi.createOpAppointment({
        hospitalId: selectedDoctor?.hospitalId || selectedHospital?.id,
        doctorId: selectedDoctor?.id || '',
        departmentId: selectedDoctor?.departmentId,
        conditionId: selectedDisease?.id,
        date: targetDate,
        timeSlot: selectedTime || '10:00 AM',
        patientName: patientName || user?.name || 'Self',
        patientPhone: patientPhone || user?.phone || '9999999999',
        patientAge: patientAge ? Number(patientAge) : undefined,
        patientGender: patientGender || undefined,
        reason: reason || (isVideo ? 'Video Consultation' : 'OP Consultation visit'),
        opType: isVideo ? 'Video Consultation' : 'Normal'
      });

      if (!res.success) {
        const errMsg = typeof res.error === 'object' ? (res.error as any).message : (res.error || 'Failed to book appointment');
        setBookingError(errMsg);
        showNotification(errMsg);
        setIsSubmitting(false);

        // Revalidate doctor availability so stale slots are updated immediately
        if (selectedDoctor?.id) {
          const slotType = isVideo ? 'VIDEO' : 'OP';
          opAppointmentApi.fetchDoctorAvailability(selectedDoctor.id, targetDate, slotType).then(r => {
            if (r.success && r.data?.availableSlots) setAvailableSlots(r.data.availableSlots);
          }).catch(() => {});
        }
        return;
      }

      const realBookingId = res.data.id || res.data.appointmentId;
      setBookingId(realBookingId);
      setBookingStatus(res.data.status || 'CONFIRMED');
      setConfirmedBookingData(res.data);
      setView('CONFIRMATION');
      showNotification(`Appointment with ${selectedDoctor?.name || 'Doctor'} confirmed successfully.`);
    } catch (err: any) {
      setBookingError(err.message || 'Error booking appointment');
      showNotification(err.message || 'Error booking appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for Stepper Progress
  const getCurrentStepNumber = (): 1 | 2 | 3 | 4 | 5 => {
    if (view === 'LANDING' || view === 'CATEGORICAL_DISEASES') return 1;
    if (view === 'DOCTOR_LIST' || view === 'DOCTOR_PROFILE') return 2;
    if (view === 'SELECT_SLOT') return 3;
    if (view === 'REVIEW_PAY') return 4;
    return 5;
  };

  // --- STEPPER COMPONENT ---
  const renderStepper = () => {
    const currentStep = getCurrentStepNumber();
    const steps = [
      { num: 1, label: 'Disease' },
      { num: 2, label: 'Doctor' },
      { num: 3, label: 'Slot' },
      { num: 4, label: 'Review' },
      { num: 5, label: 'Confirm' },
    ];

    return (
      <div className="bg-white border-b border-slate-200/80 px-4 py-3 sticky top-[57px] z-10 shadow-2xs">
        <div className="w-full max-w-2xl lg:max-w-3xl mx-auto flex items-center justify-between">
          {steps.map((s, idx) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center flex-1 max-w-[68px] sm:max-w-[90px] md:max-w-[110px]">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      isCompleted
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-xs'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs mt-1 font-semibold truncate text-center ${
                      isCurrent
                        ? 'text-blue-600 font-bold'
                        : isCompleted
                        ? 'text-slate-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 sm:mx-2 transition-all duration-300 ${
                      currentStep > s.num ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  // --- STEP 1: SELECT DISEASE ---
  const renderDiseaseCategories = () => {
    const query = diseaseSearch.toLowerCase().trim();
    
    let filteredGeneral = diseasesList.general;
    let filteredAdvanced = diseasesList.advanced;
    let filteredCategorical = diseasesList.categorical;

    if (query) {
      filteredGeneral = diseasesList.general.filter(d => 
        (d?.name || (d as any)?.title || '').toLowerCase().includes(query)
      );
      filteredAdvanced = diseasesList.advanced.filter(d => 
        (d?.name || (d as any)?.title || '').toLowerCase().includes(query)
      );
      filteredCategorical = diseasesList.categorical.filter(d => 
        (d?.name || (d as any)?.title || '').toLowerCase().includes(query) || 
        (d?.desc && typeof d.desc === 'string' && d.desc.toLowerCase().includes(query))
      );
    }

    const currentList = activeTab === 'general' ? filteredGeneral : filteredAdvanced;
    const isExpanded = activeTab === 'general' ? showAllGeneral : showAllAdvanced;
    const displayedItems = isExpanded || query ? currentList : currentList.slice(0, 8);
    const displayedCategorical = showAllCategorical || query ? filteredCategorical : filteredCategorical.slice(0, 4);

    const hasResults = filteredGeneral.length > 0 || filteredAdvanced.length > 0 || filteredCategorical.length > 0;

    return (
      <div className="w-full space-y-6">
        {!diseaseSearchMode && (
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 mb-0.5">Select Disease or Health Concern</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {isVideo 
                ? 'Select a health condition to view verified doctors available for online video consultation' 
                : 'Choose your health condition to see available doctors at partner hospitals'}
            </p>
          </div>
        )}

        {/* Real-time Disease Search Bar */}
        <div className="relative w-full max-w-2xl mx-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={isVideo ? "Search symptoms, diseases (e.g. Fever, Diabetes)..." : "Search disease or concern (e.g. Fever, Joint Pain)..."}
            value={diseaseSearch}
            onChange={(e) => setDiseaseSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 pl-10 pr-10 py-3 rounded-2xl text-xs sm:text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm transition-all"
          />
          {diseaseSearch && (
            <button
              onClick={() => setDiseaseSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {isDiseasesLoading && (
          <div className="flex items-center justify-center py-10 text-blue-600 gap-2">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold">Loading verified disease conditions...</span>
          </div>
        )}

        {!isDiseasesLoading && !hasResults ? (
          <div className="text-center py-12 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm max-w-xl mx-auto">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-[14px] text-slate-700 font-bold">No matching conditions found</p>
            <p className="text-[12px] text-slate-400 mt-1">Try searching another medical symptom or choose a category below.</p>
          </div>
        ) : (
          <>
            {/* Top Card: General & Advanced Tabs with Responsive Disease Grid */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Tab Header: General | Advanced side by side */}
              <div className="flex border-b border-slate-100 bg-white">
                <button
                  type="button"
                  onClick={() => setActiveTab('general')}
                  className={`flex-1 py-3.5 sm:py-4 text-center font-bold text-sm sm:text-base transition-all relative ${
                    activeTab === 'general' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  General
                  <span className="sr-only">General Health Concerns</span>
                  {activeTab === 'general' && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-blue-600 rounded-full" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('advanced')}
                  className={`flex-1 py-3.5 sm:py-4 text-center font-bold text-sm sm:text-base transition-all relative ${
                    activeTab === 'advanced' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Advanced
                  <span className="sr-only">Advanced Specialties</span>
                  {activeTab === 'advanced' && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-blue-600 rounded-full" />
                  )}
                </button>
              </div>

              {/* Responsive diseases grid */}
              <div className="p-4 sm:p-6 lg:p-8">
                {displayedItems.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 sm:gap-4">
                    {displayedItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleDiseaseSelect(item)}
                        className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-100/80 shadow-2xs hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer flex flex-col items-center justify-center text-center group w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${item.bg || 'bg-slate-50'} flex items-center justify-center mb-2.5 p-2 shadow-2xs group-hover:scale-105 transition-transform overflow-hidden`}>
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-contain mix-blend-multiply"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = '/optimized/Blood Test.webp';
                              }}
                            />
                          ) : (
                            <Activity className="w-6 h-6 text-blue-600" />
                          )}
                        </div>
                        <span className="text-[12px] sm:text-[13px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-tight line-clamp-2">
                          {item.name}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No conditions found in this category.
                  </div>
                )}

                {/* See More Diseases */}
                {!query && currentList.length > 8 && (
                  <div className="mt-6 mb-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => activeTab === 'general' ? setShowAllGeneral(!showAllGeneral) : setShowAllAdvanced(!showAllAdvanced)}
                      className="text-[14px] font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors flex items-center justify-center gap-1 cursor-pointer py-1.5 px-4 rounded-xl hover:bg-blue-50"
                    >
                      {isExpanded ? 'Show Less ↑' : 'See More Diseases →'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Categorical Diseases Section */}
            {displayedCategorical.length > 0 && (
              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-900 mb-4">
                  Categorical Diseases
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {displayedCategorical.map((cat) => (
                    <div
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat)}
                      className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center justify-between hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 pr-2">
                        <div className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full ${cat.bg || 'bg-emerald-50'} flex items-center justify-center shrink-0 shadow-2xs border border-emerald-100/50 p-2 group-hover:scale-105 transition-transform`}>
                          {cat.image ? (
                            <img 
                              src={cat.image} 
                              alt={cat.name} 
                              className="w-full h-full object-contain mix-blend-multiply" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/optimized/Blood Test.webp';
                              }}
                            />
                          ) : (
                            <Sparkles className="w-6 h-6 text-teal-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm sm:text-[15px] mb-0.5 truncate group-hover:text-blue-600 transition-colors">
                            {cat.name}
                          </h4>
                          <p className="text-[11px] sm:text-xs text-slate-500 font-normal leading-tight truncate">
                            {cat.desc || 'Specialized clinical care'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  ))}
                </div>

                {!query && filteredCategorical.length > 4 && (
                  <div className="mt-5 mb-2 flex justify-center">
                    <button 
                      type="button"
                      onClick={() => setShowAllCategorical(!showAllCategorical)}
                      className="text-[14px] font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors py-2 px-4 rounded-xl hover:bg-blue-50"
                    >
                      {showAllCategorical ? 'Show Less ↑' : 'See More Categories →'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderLanding = () => {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {!diseaseSearchMode && (
          <div className="w-full bg-gradient-to-r from-[#0055ff] via-blue-600 to-[#06b6d4] p-5 sm:p-8 text-white rounded-2xl sm:rounded-3xl relative overflow-hidden shadow-lg shadow-blue-500/10">
            {isVideo ? (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
                <Video className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 text-white" strokeWidth={1.2} />
              </div>
            ) : (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
                <Building2 className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 text-white" strokeWidth={1.2} />
              </div>
            )}
            <div className="flex items-center gap-2.5 sm:gap-3 mb-2 relative z-10">
              <button 
                onClick={() => navigate(-1)} 
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors -ml-1 text-white"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
                {isVideo ? 'Video Consultation' : 'Book an OP Appointment'}
              </h1>
            </div>
            <p className="text-xs sm:text-sm md:text-base text-blue-100 max-w-2xl font-medium leading-relaxed pl-8 sm:pl-9 relative z-10">
              {isVideo 
                ? 'Select a health concern to connect with verified specialist doctors online.' 
                : 'Select your health condition to view eligible specialists across top partner hospitals.'}
            </p>
          </div>
        )}

        {!diseaseSearchMode && (
          <HowItWorks 
            title={isVideo ? "How Video Consultation Works" : "How OP Booking Works"}
            steps={isVideo ? videoConsultationStepsData : opBookingStepsData}
            className="w-full bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm"
          />
        )}

        {renderDiseaseCategories()}
      </div>
    );
  };

  const renderCategoricalDiseases = () => {
    if (!selectedCategory) return null;
    
    const categoryDiseases = getDiseasesForCategory(selectedCategory.id, selectedCategory.name, diseasesList.raw, selectedCategory);
    const query = categoricalDiseaseSearch.toLowerCase().trim();
    const filtered = query
      ? categoryDiseases.filter((d: any) => 
          (d?.name || (d as any)?.title || '').toLowerCase().includes(query) || 
          (d?.desc && typeof d.desc === 'string' && d.desc.toLowerCase().includes(query)))
      : categoryDiseases;

    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
        {/* Category Header Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm flex items-start gap-4">
          <div className={`w-14 h-14 rounded-2xl ${selectedCategory.bg || 'bg-blue-50'} flex items-center justify-center shrink-0 shadow-sm border border-slate-100/60 p-1.5 overflow-hidden`}>
            {selectedCategory.image ? (
              <img 
                src={selectedCategory.image} 
                alt={selectedCategory.name} 
                className="w-full h-full object-contain mix-blend-multiply" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/optimized/Blood Test.webp';
                }}
              />
            ) : (
              <Stethoscope className="w-8 h-8 text-blue-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                {isVideo ? 'Video Consultation' : 'OP Consultation'}
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                {filtered.length} {filtered.length === 1 ? 'condition' : 'conditions'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">{selectedCategory.name}</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
              {selectedCategory.desc || 'Select a specific health condition to view specialist doctors.'}
            </p>
          </div>
        </div>

        {/* Search within Category */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder={`Search within ${selectedCategory.name}...`}
            value={categoricalDiseaseSearch}
            onChange={(e) => setCategoricalDiseaseSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 pl-10 pr-10 py-3 rounded-2xl text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm transition-all"
          />
          {categoricalDiseaseSearch && (
            <button
              onClick={() => setCategoricalDiseaseSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Specific Condition List */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">
            Specific Conditions in {selectedCategory.name}
          </h3>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((item: any) => (
                <div
                  key={item.id}
                  onClick={() => handleDiseaseSelect(item)}
                  className="flex items-start justify-between bg-white rounded-2xl p-3.5 border border-slate-100 shadow-2xs cursor-pointer hover:border-blue-200 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start gap-3 min-w-0 pr-2">
                    <div className={`w-11 h-11 rounded-xl ${item.bg || 'bg-blue-50'} flex items-center justify-center shrink-0 shadow-2xs border border-slate-100 group-hover:scale-105 transition-transform p-1 overflow-hidden`}>
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-contain mix-blend-multiply" 
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = '/optimized/Blood Test.webp';
                          }}
                        />
                      ) : (
                        <Stethoscope className="w-6 h-6 text-slate-700" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-[13px] leading-tight mb-1 group-hover:text-blue-600 transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all mt-1" />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No matching conditions found</p>
              <p className="text-xs text-slate-400 mt-1">Try another search term or choose a general condition.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- STEP 2: SELECT DOCTOR ---
  const renderDoctorList = () => {
    let docs = doctorsList;
    if (doctorSearch.trim()) {
      const q = doctorSearch.toLowerCase().trim();
      docs = docs.filter(d => 
        (d.name || '').toLowerCase().includes(q) ||
        (d.specialization || '').toLowerCase().includes(q) ||
        (d.hospitalName || '').toLowerCase().includes(q) ||
        (d.hospitalAddress || '').toLowerCase().includes(q)
      );
    }

    const diseaseTitle = selectedDisease?.name || 'Selected Condition';

    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in slide-in-from-right-4">
        {/* Navigation & Context Header */}
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Disease Selection
          </button>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            Step 2 of 5
          </span>
        </div>

        <div className="mb-4">
          <h2 className="text-[18px] font-extrabold text-slate-900 leading-tight">
            Eligible Doctors for "{diseaseTitle}"
          </h2>
          <p className="text-[12px] text-slate-500 mt-0.5">
            {isVideo 
              ? 'Verified specialists available for online video consultation across accredited hospitals.'
              : 'Specialists available for in-person hospital visits across partner facilities.'}
          </p>
        </div>

        {/* Doctor Search & Hospital Filter */}
        <div className="relative mb-6">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter doctors by name, hospital, or city..."
            value={doctorSearch}
            onChange={(e) => setDoctorSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 pl-10 pr-10 py-3 rounded-2xl text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm transition-all"
          />
          {doctorSearch && (
            <button
              onClick={() => setDoctorSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {isDoctorsLoading && (
          <div className="flex items-center justify-center py-12 text-blue-600 gap-2">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold">Fetching eligible specialists from hospitals...</span>
          </div>
        )}

        {!isDoctorsLoading && docs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-[15px] text-slate-700 font-bold">No Eligible Doctors Found</p>
            <p className="text-[12px] text-slate-500 mt-1 max-w-sm mx-auto">
              There are currently no active doctors available for "{diseaseTitle}" under {isVideo ? 'Video Consultation' : 'OP Consultation'}.
            </p>
            <button
              onClick={handleBack}
              className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-xs"
            >
              Choose Different Disease
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {docs.map(doc => {
              const feeDisplay = doc.fees && doc.fees !== 'Not specified' 
                ? doc.fees 
                : (doc.consultationFee ? `₹${doc.consultationFee}` : '₹500');

              return (
                <div 
                  key={doc.id} 
                  className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between"
                >
                  {/* Top Section */}
                  <div>
                    <div className="flex items-start gap-3.5 mb-3">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border-2 border-white shadow-2xs ring-1 ring-slate-200">
                        {doc.avatar ? (
                          <img src={doc.avatar} alt={doc.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-tr from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold text-base">
                            {doc.name.replace(/^Dr\.\s*/i, '').charAt(0) || 'D'}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-extrabold text-slate-900 text-[14px] sm:text-[15px] leading-tight truncate">
                            {doc.name}
                          </h3>
                          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                        </div>

                        <p className="text-[12px] font-bold text-blue-600 truncate mt-0.5">
                          {doc.specialization}
                        </p>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium mt-1 flex-wrap">
                          {doc.qualification && doc.qualification !== 'Not specified' && (
                            <span className="truncate max-w-[130px]">{doc.qualification}</span>
                          )}
                          {doc.qualification && doc.experience && doc.experience !== 'Not specified' && (
                            <span>•</span>
                          )}
                          {doc.experience && doc.experience !== 'Not specified' && (
                            <span className="flex items-center gap-1 text-slate-600 font-semibold">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {doc.experience}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Information Section */}
                    <div className="bg-slate-50/90 rounded-2xl p-3 border border-slate-100 space-y-1.5 mb-3.5 text-xs">
                      {/* Hospital Affiliation & Location */}
                      <div className="flex items-start gap-1.5 text-slate-700">
                        <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-slate-800 text-[12px] block truncate">
                            {doc.hospitalName}
                          </span>
                          {doc.hospitalAddress && doc.hospitalAddress !== 'Not specified' && (
                            <span className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                              {doc.hospitalAddress}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Consultation Fee */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 text-[11px]">
                        <span className="text-slate-500 font-medium">Consultation Fee</span>
                        <span className="font-black text-slate-900 text-xs">
                          {feeDisplay}
                        </span>
                      </div>

                      {/* Genuine Availability Tag */}
                      <div className="flex items-center gap-1.5 pt-0.5 text-[10px] font-bold text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{isVideo ? 'Available for Online Video' : 'Available for In-Person OP'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: View Doctor & Call Clinic */}
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      {/* Secondary Action: Call Clinic */}
                      {doc.hospitalPhone ? (
                        <a
                          href={`tel:${doc.hospitalPhone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[11px] sm:text-xs transition-colors shadow-2xs"
                          title={`Call ${doc.hospitalName}: ${doc.hospitalPhone}`}
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Call Clinic</span>
                        </a>
                      ) : (
                        <button
                          disabled
                          type="button"
                          className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 font-medium text-[11px] sm:text-xs cursor-not-allowed"
                          title="Contact number unavailable"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-300" />
                          <span className="truncate">No Phone</span>
                        </button>
                      )}

                      {/* Primary Action: View Doctor */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDoctor(doc);
                          setView('DOCTOR_PROFILE');
                        }}
                        className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-blue-700 font-bold text-[11px] sm:text-xs transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <span>View Doctor</span>
                      </button>
                    </div>

                    {/* Book Slot CTA */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDoctor(doc);
                        setSelectedHospital({
                          id: doc.hospitalId,
                          name: doc.hospitalName,
                          address: doc.hospitalAddress,
                          contactPhone: doc.hospitalPhone
                        });
                        setSelectedTime('');
                        setView('SELECT_SLOT');
                      }}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <CalendarClock className="w-3.5 h-3.5" />
                      <span>Select & Book Slot</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // --- STEP 2 SUB-VIEW: DEDICATED DOCTOR PROFILE ---
  const renderDoctorProfile = () => {
    const doc = doctorFullProfile || selectedDoctor;
    if (!doc) {
      return (
        <div className="px-4 py-12 text-center max-w-md mx-auto">
          <p className="text-slate-500 text-sm">No doctor selected</p>
          <button onClick={handleBack} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">
            Back to Doctors
          </button>
        </div>
      );
    }

    const hasVideoSchedule = doc.doctorSchedules?.some((s: any) => s.isAvailable && (s.videoStartTime || s.videoEndTime)) ?? true;
    const hasOpSchedule = doc.doctorSchedules?.some((s: any) => s.isAvailable && (s.startTime || s.endTime)) ?? true;
    const feeDisplay = doc.fees && doc.fees !== 'Not specified' 
      ? doc.fees 
      : (doc.consultationFee ? `₹${doc.consultationFee}` : '₹500');

    return (
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-in fade-in slide-in-from-right-4 space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between pb-1">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Doctor List
          </button>
          {selectedDisease && (
            <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100 truncate max-w-[200px]">
              {selectedDisease.name}
            </span>
          )}
        </div>

        {isDoctorProfileLoading && (
          <div className="text-center py-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[11px] font-medium">
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Loading verified doctor profile...
            </div>
          </div>
        )}

        {/* Doctor Header Profile Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-sky-500/10 -z-0" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-white p-1 shadow-md mb-3 border-2 border-white overflow-hidden relative">
              {doc.avatar ? (
                <img src={doc.avatar} alt={doc.name} className="w-full h-full object-cover rounded-full" />
              ) : (
                <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                  <User className="w-12 h-12" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 justify-center">
              <h2 className="font-extrabold text-slate-900 text-lg md:text-xl">{doc.name}</h2>
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            </div>

            {doc.specialization && doc.specialization !== 'Not specified' && (
              <p className="text-xs font-bold text-blue-600 mt-0.5">{doc.specialization}</p>
            )}

            {doc.designation && doc.designation !== 'Not specified' && doc.designation !== doc.specialization && (
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">{doc.designation}</p>
            )}

            {/* Quick Metrics Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-[11px] font-semibold text-slate-600">
              {doc.qualification && doc.qualification !== 'Not specified' && (
                <span className="bg-slate-100 px-2.5 py-1 rounded-xl text-slate-700">
                  🎓 {doc.qualification}
                </span>
              )}
              {doc.experience && doc.experience !== 'Not specified' && (
                <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-xl border border-blue-100 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {doc.experience}
                </span>
              )}
              {doc.licenseNumber && (
                <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-xl border border-emerald-100">
                  Reg: {doc.licenseNumber}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Hospital Affiliation Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Hospital Affiliation</h3>
          
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-slate-900 text-sm">{doc.hospitalName || 'MediQuee Partner Hospital'}</h4>
              {doc.hospitalAddress && doc.hospitalAddress !== 'Not specified' && (
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{doc.hospitalAddress}</span>
                </p>
              )}
              {doc.hospitalPhone && (
                <div className="mt-2">
                  <a
                    href={`tel:${doc.hospitalPhone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 hover:bg-emerald-100 transition-colors"
                  >
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>Call Clinic: {doc.hospitalPhone}</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {doc.department && doc.department !== 'Not assigned' && (
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <Activity className="w-4 h-4 text-blue-500 shrink-0" />
              <span>Department: <strong className="text-slate-800">{doc.department}</strong></span>
            </div>
          )}
        </div>

        {/* Consultation Types Supported & Fee */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {isVideo ? 'Consultation Mode' : 'Consultation Service'}
          </h3>
          
          {isVideo ? (
            <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/70 text-indigo-900 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-indigo-600 text-white shadow-sm">
                <Video className="w-4 h-4" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <span className="text-xs font-bold block">Online Video Consultation</span>
                <span className="text-[10px] text-slate-500 block">
                  {hasVideoSchedule ? 'Supported & Available' : 'Consultation supported'}
                </span>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white border border-indigo-200 text-indigo-700 shrink-0">
                Online
              </span>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/70 text-blue-900 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-blue-600 text-white shadow-sm">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <span className="text-xs font-bold block">In-Person Hospital OP Visit</span>
                <span className="text-[10px] text-slate-500 block">
                  {hasOpSchedule ? 'Hospital Clinic Visit' : 'Consultation supported'}
                </span>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white border border-blue-200 text-blue-700 shrink-0">
                At Hospital
              </span>
            </div>
          )}

          {/* Actual Fee Display */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <span className="font-semibold text-slate-600">Consultation Fee</span>
            <span className="font-extrabold text-slate-900 text-sm">{feeDisplay}</span>
          </div>
        </div>

        {/* Doctor Biography */}
        {(doc.bio || doc.consultInfo) && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-2 text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">About the Doctor</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {doc.bio || doc.consultInfo}
            </p>
          </div>
        )}

        {/* Action Button: Continue Booking */}
        <div className="pt-2">
          <button 
            type="button"
            onClick={() => {
              setSelectedDoctor(doc);
              setSelectedHospital({
                id: doc.hospitalId,
                name: doc.hospitalName,
                address: doc.hospitalAddress,
                contactPhone: doc.hospitalPhone
              });
              setSelectedTime('');
              setView('SELECT_SLOT');
            }}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>Select This Doctor • Continue to Slot Booking</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // --- STEP 3: SLOT BOOKING ---
  const renderSelectSlot = () => {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-in fade-in slide-in-from-right-4 space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between pb-1">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Doctors
          </button>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            Step 3 of 5
          </span>
        </div>

        {/* Doctor Summary Header Tile */}
        {selectedDoctor && (
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
              {selectedDoctor.avatar ? (
                <img src={selectedDoctor.avatar} alt={selectedDoctor.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-slate-900 text-sm truncate">{selectedDoctor.name}</h3>
              <p className="text-[11px] text-blue-600 font-medium truncate">{selectedDoctor.specialization}</p>
              <p className="text-[10px] text-slate-500 truncate">{selectedDoctor.hospitalName}</p>
            </div>
            <span className="text-[11px] font-bold text-slate-900 shrink-0 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
              {selectedDoctor.fees && selectedDoctor.fees !== 'Not specified' ? selectedDoctor.fees : (selectedDoctor.consultationFee ? `₹${selectedDoctor.consultationFee}` : '₹500')}
            </span>
          </div>
        )}

        {/* Date Selector */}
        <div>
          <h2 className="text-[15px] font-bold text-slate-800 mb-2">Select Appointment Date</h2>
          <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 hide-scrollbar">
            {upcomingDates.map((d) => (
              <div 
                key={d.isoDate}
                onClick={() => {
                  setSelectedDate(d.date);
                  setSelectedDateIso(d.isoDate);
                  setSelectedTime('');
                }}
                className={`flex flex-col items-center justify-center shrink-0 w-[72px] h-[72px] rounded-2xl border transition-all cursor-pointer ${
                  selectedDateIso === d.isoDate 
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs' 
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <span className={`text-[10px] font-medium mb-1 ${selectedDateIso === d.isoDate ? 'text-blue-600' : 'text-slate-500'}`}>
                  {d.label}
                </span>
                <span className={`text-[13px] font-bold ${selectedDateIso === d.isoDate ? 'text-blue-700' : 'text-slate-800'}`}>
                  {d.date}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Time Slot Selection */}
        <div>
          <div className="flex items-center justify-between mb-2 mt-4">
            <div>
              <h3 className="text-[14px] font-bold text-slate-800">
                {isVideo ? 'Available Video Consultation Slots' : 'Available Time Slots'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {isVideo ? 'Remote online video hours' : 'In-person clinic physical visit hours'}
              </p>
            </div>
            {isSlotsLoading && (
              <span className="text-[10px] text-blue-600 font-medium animate-pulse">
                Checking live availability...
              </span>
            )}
          </div>

          {isSlotsLoading && allSlots.length === 0 ? (
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-11 rounded-xl bg-slate-100 animate-pulse border border-slate-200/50" />
              ))}
            </div>
          ) : !isDoctorAvailable || availableSlots.length === 0 ? (
            <div className="py-8 px-4 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 mb-6">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No Slots Available</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                {selectedDoctor?.name || 'The doctor'} has no open slots on {selectedDate}. Please select another date.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mb-6">
              {availableSlots.map(time => {
                const isSelected = selectedTime === time;
                return (
                  <div 
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`py-3 px-1 rounded-xl border text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-600 text-white shadow-md' 
                        : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'
                    }`}
                  >
                    <span className="text-[12px] font-bold">{time}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Optional Reason for Consultation/Visit */}
        <div>
          <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
            Reason for {isVideo ? 'Consultation' : 'Visit'} <span className="text-[11px] font-normal text-slate-500">(Optional)</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className="w-full p-3.5 border border-slate-200 rounded-xl bg-white text-[13px] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none shadow-xs"
            placeholder={isVideo ? "Briefly describe what you would like to discuss (optional)..." : "Describe the reason for your visit (optional)..."}
          />
        </div>

        {/* Error Banner */}
        {bookingError && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{bookingError}</span>
          </div>
        )}

        {/* Action Button: Advance to Step 4 (Review & Pay) */}
        <div className="pt-2">
          <button 
            type="button"
            disabled={!selectedTime || isSlotsLoading}
            onClick={() => setView('REVIEW_PAY')}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Proceed to Review & Pay</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // --- STEP 4: REVIEW & PAY ---
  const renderReviewAndPay = () => {
    const feeDisplay = selectedDoctor?.fees && selectedDoctor.fees !== 'Not specified'
      ? selectedDoctor.fees
      : (selectedDoctor?.consultationFee ? `₹${selectedDoctor.consultationFee}` : '₹500');

    return (
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-in fade-in slide-in-from-right-4 space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between pb-1">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Slot Selection
          </button>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            Step 4 of 5
          </span>
        </div>

        <div>
          <h2 className="text-lg md:text-xl font-extrabold text-slate-900">Review & Confirm</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Please verify your consultation details and patient information before confirming.
          </p>
        </div>

        {/* Selected Disease & Mode Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 text-white shadow-md flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-200 block">
              {isVideo ? 'Online Video Consultation' : 'In-Person Hospital OP Visit'}
            </span>
            <h3 className="font-extrabold text-base truncate mt-0.5">
              {selectedDisease?.name || 'Consultation Visit'}
            </h3>
            {selectedCategory?.name && (
              <span className="text-[11px] text-blue-100 block truncate">
                Department: {selectedCategory.name}
              </span>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0">
            {isVideo ? <Video className="w-5 h-5 text-white" /> : <Building2 className="w-5 h-5 text-white" />}
          </div>
        </div>

        {/* Doctor & Hospital Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3.5">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Doctor & Hospital Details
          </h3>
          <div className="flex items-start gap-3.5">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
              {selectedDoctor?.avatar ? (
                <img src={selectedDoctor.avatar} alt={selectedDoctor.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-slate-900 text-sm md:text-base truncate">
                  {selectedDoctor?.name}
                </h4>
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              </div>
              <p className="text-xs font-bold text-blue-600 truncate mt-0.5">
                {selectedDoctor?.specialization}
              </p>
              {selectedDoctor?.qualification && selectedDoctor.qualification !== 'Not specified' && (
                <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                  {selectedDoctor.qualification} {selectedDoctor.experience && selectedDoctor.experience !== 'Not specified' ? `• ${selectedDoctor.experience}` : ''}
                </p>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-start gap-2.5 text-xs text-slate-600">
            <Building2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <strong className="text-slate-800 font-bold block truncate">
                {selectedDoctor?.hospitalName || selectedHospital?.name || 'Partner Hospital'}
              </strong>
              {(selectedDoctor?.hospitalAddress || selectedHospital?.address) && (
                <span className="text-[11px] text-slate-500 block truncate">
                  {selectedDoctor?.hospitalAddress || selectedHospital?.address}
                </span>
              )}
              {selectedDoctor?.hospitalPhone && (
                <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  {selectedDoctor.hospitalPhone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Schedule & Appointment Time */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2.5">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Scheduled Date & Time
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Date</span>
                <span className="text-xs font-bold text-slate-800 truncate block">
                  {selectedDate}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Time Slot</span>
                <span className="text-xs font-bold text-slate-800 truncate block">
                  {selectedTime || '10:00 AM'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Patient Details Form (Review & Edit) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Patient Information
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">Verify or edit</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Patient Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Full name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Age <span className="text-[10px] text-slate-400">(Optional)</span>
              </label>
              <input
                type="number"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                placeholder="Years"
                min={0}
                max={120}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Gender <span className="text-[10px] text-slate-400">(Optional)</span>
              </label>
              <select
                value={patientGender}
                onChange={(e) => setPatientGender(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Reason / Medical Notes <span className="text-[10px] text-slate-400">(Optional)</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Any symptoms or concerns to note for the doctor..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Pricing & Payment Summary */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Payment & Fee Summary
          </h3>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Doctor Consultation Fee</span>
              <span className="font-bold text-slate-800">{feeDisplay}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Platform Booking Fee</span>
              <span className="font-bold text-emerald-600">FREE</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between text-sm">
              <span className="font-extrabold text-slate-900">Total Payable</span>
              <span className="font-black text-slate-900 text-base">{feeDisplay}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-bold text-blue-900">
                {isVideo ? 'Consultation Access Upon Confirmation' : 'Pay at Hospital Counter'}
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white text-blue-700 border border-blue-200">
              {isVideo ? 'Direct' : 'Pay Later'}
            </span>
          </div>
        </div>

        {/* Error Banner */}
        {bookingError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{bookingError}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2 space-y-2">
          <button
            type="button"
            disabled={isSubmitting || !patientName}
            onClick={confirmBooking}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Confirming Appointment...</span>
              </>
            ) : (
              <>
                <span>Confirm & Book Appointment</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={handleBack}
            className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
          >
            Back to Slot Selection
          </button>
        </div>
      </div>
    );
  };

  // --- STEP 5: CONFIRMATION ---
  const renderConfirmation = () => {
    const diseaseName = confirmedBookingData?.diseaseName || selectedDisease?.name;
    const doctorName = confirmedBookingData?.doctorName || selectedDoctor?.name;
    const doctorAvatar = selectedDoctor?.avatar;
    const hospitalName = confirmedBookingData?.hospitalName || selectedDoctor?.hospitalName || selectedHospital?.name;
    const hospitalAddress = confirmedBookingData?.hospitalAddress || selectedDoctor?.hospitalAddress || selectedHospital?.address;
    const departmentName = confirmedBookingData?.departmentName || selectedDoctor?.department;
    const effectiveBookingId = confirmedBookingData?.id || confirmedBookingData?.appointmentId || bookingId;
    const statusLabel = confirmedBookingData?.status || bookingStatus || 'CONFIRMED';
    const patientDisplayName = confirmedBookingData?.patientName || patientName || user?.name || 'Self';
    const feeDisplay = confirmedBookingData?.fee !== undefined 
      ? `₹${confirmedBookingData.fee}` 
      : (selectedDoctor?.fees && selectedDoctor.fees !== 'Not specified' ? selectedDoctor.fees : '₹500');

    return (
      <div className="w-full max-w-2xl lg:max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-in zoom-in-95 duration-500 text-center space-y-6">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto relative shadow-sm">
          <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-25" />
          <CheckCircle2 className="w-10 h-10 text-emerald-600 relative z-10" />
        </div>
        
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-1">
            {isVideo ? 'Video Consultation Confirmed' : 'Appointment Confirmed'}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Your {isVideo ? 'online video consultation' : 'in-person hospital appointment'} is confirmed and recorded.
          </p>
        </div>

        {/* Detailed Persisted Booking Summary Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-soft overflow-hidden text-left">
          {/* Header Bar */}
          <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50/40 border-b border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Booking Reference</span>
              <span className="text-xs font-mono font-bold text-slate-900">{effectiveBookingId}</span>
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {statusLabel}
            </span>
          </div>

          <div className="p-5 space-y-4">
            {/* Disease / Health Concern */}
            {diseaseName && (
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider block">
                    Selected Health Concern / Disease
                  </span>
                  <span className="text-sm font-black text-slate-900">{diseaseName}</span>
                </div>
                <Activity className="w-5 h-5 text-blue-500 shrink-0" />
              </div>
            )}

            {/* Doctor Info */}
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
                {doctorAvatar ? (
                  <img src={doctorAvatar} alt={doctorName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Attending Doctor
                </span>
                <h3 className="font-extrabold text-slate-900 text-sm md:text-base leading-snug">
                  {doctorName}
                </h3>
                {departmentName && (
                  <p className="text-xs text-blue-600 font-semibold">{departmentName}</p>
                )}
              </div>
            </div>

            {/* Hospital Info */}
            <div className="flex items-start gap-3.5 pt-2 border-t border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 text-blue-600">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Hospital Facility
                </span>
                <p className="font-bold text-slate-800 text-xs">{hospitalName}</p>
                {hospitalAddress && (
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{hospitalAddress}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Date, Time & Patient */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Date & Time</span>
                <span className="font-bold text-slate-800 text-[11px] block mt-0.5">
                  {selectedDate} • {selectedTime || '10:00 AM'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Patient</span>
                <span className="font-bold text-slate-800 text-[11px] block mt-0.5 truncate">
                  {patientDisplayName}
                </span>
              </div>
            </div>

            {/* Fee & Payment Status */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Total Consultation Fee</span>
              <span className="font-extrabold text-slate-900">{feeDisplay}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {effectiveBookingId && (
            <button 
              type="button"
              onClick={() => navigate(`/booking/${effectiveBookingId}`)}
              className="w-full py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>View Booking Details</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button 
              type="button"
              onClick={() => navigate('/bookings')}
              className="py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors"
            >
              My Bookings
            </button>
            <button 
              type="button"
              onClick={() => {
                setView('LANDING');
                setSelectedDisease(null);
                setSelectedDoctor(null);
                setSelectedTime('');
              }}
              className="py-3 rounded-xl border border-slate-200 text-blue-600 font-bold text-xs hover:bg-blue-50 transition-colors"
            >
              Book Another
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Status screens for video call room
  const renderAppointmentStatus = () => (
    <div className="px-4 py-8 text-center max-w-md mx-auto">
      <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
      <h2 className="text-lg font-bold text-slate-800">Appointment Status</h2>
      <p className="text-xs text-slate-500 mt-1">Status: {bookingStatus}</p>
      <button onClick={() => navigate('/bookings')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">
        View All Bookings
      </button>
    </div>
  );

  const renderVideoUpcoming = () => (
    <div className="px-4 py-8 text-center max-w-md mx-auto">
      <Video className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
      <h2 className="text-lg font-bold text-slate-800">Video Consultation Upcoming</h2>
      <p className="text-xs text-slate-500 mt-1">Scheduled for {selectedDate} at {selectedTime}</p>
      <button onClick={() => navigate('/bookings')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
        Go to My Bookings
      </button>
    </div>
  );

  const renderVideoCall = () => (
    <div className="bg-slate-900 fixed inset-0 z-50 flex flex-col">
      <div className="flex-1 relative flex items-center justify-center">
        <div className="w-32 h-32 rounded-full bg-slate-800 flex items-center justify-center text-white">
          <User className="w-16 h-16 text-slate-400" />
        </div>
        <div className="absolute top-4 left-4 bg-black/40 text-white px-3 py-1.5 rounded-full text-xs font-bold">
          Consultation in Progress
        </div>
      </div>
      <div className="p-6 bg-slate-950 flex justify-center gap-4">
        <button 
          onClick={() => setMicOn(!micOn)}
          className={`p-4 rounded-full ${micOn ? 'bg-slate-800 text-white' : 'bg-red-500 text-white'}`}
        >
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
        <button 
          onClick={() => setCamOn(!camOn)}
          className={`p-4 rounded-full ${camOn ? 'bg-slate-800 text-white' : 'bg-red-500 text-white'}`}
        >
          {camOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>
        <button 
          onClick={() => setView('VIDEO_COMPLETED')}
          className="p-4 rounded-full bg-red-600 text-white"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const renderVideoCompleted = () => (
    <div className="px-4 py-8 text-center max-w-md mx-auto space-y-4">
      <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
      <h2 className="text-xl font-bold text-slate-800">Consultation Completed</h2>
      <p className="text-xs text-slate-500">Your video consultation has concluded.</p>
      <button onClick={() => navigate('/bookings')} className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-bold">
        Back to Bookings
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-x-hidden min-h-screen">
      {/* Dynamic Header */}
      {view !== 'VIDEO_CALL' && (
        <div className="bg-white sticky top-0 z-30 border-b border-slate-200/80 shadow-2xs backdrop-blur-md bg-white/95">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {view !== 'LANDING' && (
                <button 
                  type="button"
                  onClick={handleBack}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
                  aria-label="Go back"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <div className="min-w-0">
                <h1 className="text-[15px] sm:text-base font-bold text-slate-900 leading-tight truncate">
                  {view === 'LANDING' ? (isVideo ? 'Video Consultation' : 'OP Consultation') :
                   view === 'CATEGORICAL_DISEASES' ? (selectedCategory?.name || 'Categorical Diseases') :
                   view === 'DOCTOR_LIST' ? 'Select Doctor' :
                   view === 'DOCTOR_PROFILE' ? 'Doctor Profile' :
                   view === 'SELECT_SLOT' ? 'Slot Booking' :
                   view === 'REVIEW_PAY' ? 'Review & Pay' :
                   view === 'CONFIRMATION' ? 'Booking Confirmed' :
                   view === 'APPOINTMENT_STATUS' ? 'Status' :
                   view === 'VIDEO_UPCOMING' ? 'Upcoming' :
                   view === 'VIDEO_COMPLETED' ? 'Summary' :
                   ''}
                </h1>
                {selectedDisease && view !== 'LANDING' && view !== 'CATEGORICAL_DISEASES' && (
                  <span className="text-[10px] sm:text-[11px] text-blue-600 font-bold block truncate max-w-[220px] sm:max-w-md">
                    Condition: {selectedDisease.name}
                  </span>
                )}
              </div>
            </div>

            <span className="text-[11px] sm:text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 shrink-0">
              {isVideo ? 'Online Video' : 'In-Person OP'}
            </span>
          </div>
        </div>
      )}

      {/* 5-Step Progress Stepper (Visible across all 5 steps) */}
      {view !== 'VIDEO_CALL' && view !== 'VIDEO_COMPLETED' && renderStepper()}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pb-24">
        {view === 'LANDING' && renderLanding()}
        {view === 'CATEGORICAL_DISEASES' && renderCategoricalDiseases()}
        {view === 'DOCTOR_LIST' && renderDoctorList()}
        {view === 'DOCTOR_PROFILE' && renderDoctorProfile()}
        {view === 'SELECT_SLOT' && renderSelectSlot()}
        {view === 'REVIEW_PAY' && renderReviewAndPay()}
        {view === 'CONFIRMATION' && renderConfirmation()}
        {view === 'APPOINTMENT_STATUS' && renderAppointmentStatus()}
        {view === 'VIDEO_UPCOMING' && renderVideoUpcoming()}
        {view === 'VIDEO_CALL' && renderVideoCall()}
        {view === 'VIDEO_COMPLETED' && renderVideoCompleted()}
      </div>

      {/* Know Your Disease AI helper button in Step 1 */}
      {!hasDismissedAiPopup && (view === 'LANDING' || view === 'CATEGORICAL_DISEASES') && (
        <aside
          aria-label="Know Your Disease AI Guide"
          className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40 pointer-events-auto"
          onMouseEnter={() => setIsAiHovered(true)}
          onMouseLeave={() => setIsAiHovered(false)}
        >
          <div className="relative">
            <button
              type="button"
              onClick={handleDismissAiPopup}
              title="Dismiss for this session"
              aria-label="Dismiss Know Your Disease popup"
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-900 text-white hover:bg-slate-800 rounded-full flex items-center justify-center shadow-md z-50 border border-white/60 transition-transform hover:scale-110 active:scale-95"
            >
              <X className="w-3 h-3" />
            </button>

            {(!isAiPopupCollapsed || isAiHovered) ? (
              <button
                type="button"
                onClick={() => setShowAiModal(true)}
                className="group flex items-center gap-3 p-2.5 sm:p-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-2xl shadow-xl shadow-indigo-900/35 border border-indigo-500/40 hover:border-indigo-400 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-left backdrop-blur-md max-w-[280px] sm:max-w-[320px] animate-in fade-in duration-300"
              >
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-400" />
                  </span>
                </div>
                
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-extrabold text-white tracking-tight leading-none truncate">
                      Know Your Disease
                    </span>
                    <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300 shrink-0 animate-pulse" />
                  </div>
                  <p className="text-[10px] text-slate-300 font-medium leading-tight mt-1 line-clamp-2">
                    Not sure what you're experiencing? Get instant AI guidance
                  </p>
                </div>
                
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowAiModal(true)}
                className="relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 text-white shadow-xl shadow-indigo-600/35 hover:shadow-indigo-600/50 hover:scale-105 active:scale-95 transition-all duration-300 flex flex-col items-center justify-center border-2 border-white/80 backdrop-blur-md animate-in fade-in zoom-in-75 duration-300"
                title="Know Your Disease - Get AI guidance"
              >
                <span className="absolute inset-0 rounded-full border border-sky-300 animate-ping opacity-30 pointer-events-none" />
                
                <div className="relative flex items-center justify-center">
                  <Bot className="w-6 h-6 md:w-7 md:h-7 text-white" />
                  <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300 absolute -top-1 -right-1.5 animate-pulse" />
                </div>
                <span className="text-[9px] font-black tracking-tight text-white/95 leading-none mt-0.5">
                  AI Help
                </span>
              </button>
            )}
          </div>
        </aside>
      )}

      {/* Know Your Disease AI Modal */}
      <KnowYourDiseaseModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onSelectConcern={handleAiSelectConcern}
        consultationType={isVideo ? 'doctor' : 'hospital-op'}
      />

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 max-w-md mx-auto">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-lg text-[12px] font-semibold flex items-center gap-2 border border-slate-800">
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{notification}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Specialties;
