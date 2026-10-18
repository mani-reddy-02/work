import { useState, useEffect, useRef } from 'react';
import { departmentIcons, allIcons, getDiseaseIconUrl } from '../utils/diseaseIcons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search, Hospital, Video, Clock, CheckCircle2, ChevronLeft, 
  MapPin, Phone, Star, ShieldCheck, User, Activity, FileText, AlertCircle, 
  Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Info,
  Thermometer, Brain, Droplet, Heart, Wind, Bone, Flame, Sparkles, Eye, Shield, ArrowLeft, Calendar,
  Building2, Stethoscope, CalendarClock, CalendarCheck, ActivitySquare, Bot, X
} from 'lucide-react';
import HowItWorks from '../components/HowItWorks';
import KnowYourDiseaseModal from '../components/KnowYourDiseaseModal';
import { useAuth } from '../lib/auth';
import { opAppointmentApi, doctorApi, hospitalApi } from '../lib/opAppointmentApi';

import {
  HeartIcon, KidneyIcon, SkinIcon, LiverIcon, BrainIcon, LungsIcon,
  VirusIcon, BoneIcon, StomachIcon, EyeIcon, ToothIcon, DropsIcon,
  RibbonIcon, EarIcon, FemaleIcon, MaleIcon, ChildIcon, PsychiatryIcon,
  ThermometerIcon, WindIcon, HeadacheIcon, PainIcon, JointIcon,
  SparklesIcon, IntestinesIcon, ThroatIcon, ShieldVirusIcon, VomitIcon
} from '../components/DiseaseIcons';

// --- MOCK DATA ---
const opBookingStepsData = [
  { id: '01', title: 'Search Hospital', desc: 'Find a suitable hospital based on your location or healthcare need.', icon: Search },
  { id: '02', title: 'Select Hospital', desc: 'Choose a hospital that provides the required healthcare service.', icon: Building2 },
  { id: '03', title: 'Choose Department', desc: 'Select the department related to your health concern.', icon: Activity },
  { id: '04', title: 'Select Doctor', desc: 'Choose an available doctor based on specialization and availability.', icon: Stethoscope },
  { id: '05', title: 'Select Date & Time', desc: 'Choose a convenient available appointment slot.', icon: CalendarClock },
  { id: '06', title: 'Confirm Appointment', desc: 'Review your appointment details and confirm your booking.', icon: CalendarCheck }
];

const videoConsultationStepsData = [
  { id: '01', title: 'Search Disease', desc: 'Search for your disease or health concern.', icon: Search },
  { id: '02', title: 'Select Disease', desc: 'Choose the condition that best matches your healthcare concern.', icon: ActivitySquare },
  { id: '03', title: 'Find Hospital', desc: 'View hospitals that provide care for the selected condition.', icon: Building2 },
  { id: '04', title: 'Choose Doctor', desc: 'Select a suitable doctor based on specialization and availability.', icon: Stethoscope },
  { id: '05', title: 'Book Consultation', desc: 'Choose an available consultation time and confirm your booking.', icon: CalendarClock },
  { id: '06', title: 'Start Video Consultation', desc: 'Join your scheduled consultation with the selected doctor.', icon: Video }
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

// Disease data loaded dynamically from API

const getDiseasesForCategory = (catId: string, catName: string, rawConditions: any[] = [], categoryObj?: any) => {
  // Return any diseases associated with this category/specialty in the backend
  const backendMatches = rawConditions.filter(c => 
    c.specialtyId === catId || (c.specialtyName && c.specialtyName.toLowerCase().includes(catName.toLowerCase()))
  );

  const listToUse = backendMatches.length > 0 
    ? backendMatches 
    : (categoryObj?.conditions || []);

  return listToUse.map((bm: any, idx: number) => ({
    id: bm.id,
    name: bm.name,
    desc: bm.description || `Specialized clinical care and diagnosis for ${bm.name}.`,
    icon: Stethoscope,
    image: getDiseaseIconUrl(bm.name, bm.icon, catName),
    bg: ['bg-red-50', 'bg-blue-50', 'bg-emerald-50', 'bg-purple-50', 'bg-amber-50'][idx % 5],
    iconName: bm.icon || (departmentIcons[catName] ? departmentIcons[catName][0] : allIcons[0])
  }));
};

type ViewState = 
  | 'LANDING'
  | 'CATEGORICAL_DISEASES'
  | 'HOSPITAL_RESULTS'
  | 'HOSPITAL_DETAILS'
  | 'DOCTOR_LIST'
  | 'DOCTOR_PROFILE'
  | 'SELECT_SLOT'
  | 'CONFIRMATION'
  | 'APPOINTMENT_STATUS'
  | 'VIDEO_UPCOMING'
  | 'VIDEO_CALL'
  | 'VIDEO_COMPLETED';

const FALLBACK_GENERAL_DISEASES = [
  { id: 'gen-1', name: 'Fever', icon: Activity, image: '/optimized/Blood Test.webp', bg: 'bg-red-50' },
  { id: 'gen-2', name: 'Cold & Cough', icon: Activity, image: '/optimized/Blood Test.webp', bg: 'bg-blue-50' },
  { id: 'gen-3', name: 'Headache', icon: Activity, image: '/optimized/Blood Test.webp', bg: 'bg-purple-50' },
  { id: 'gen-4', name: 'Stomach Pain', icon: Activity, image: '/optimized/Blood Test.webp', bg: 'bg-amber-50' },
  { id: 'gen-5', name: 'Body Pain', icon: Activity, image: '/optimized/Blood Test.webp', bg: 'bg-emerald-50' },
  { id: 'gen-6', name: 'Vomiting & Nausea', icon: Activity, image: '/optimized/Blood Test.webp', bg: 'bg-rose-50' },
  { id: 'gen-7', name: 'Diarrhea', icon: Activity, image: '/optimized/Blood Test.webp', bg: 'bg-orange-50' },
  { id: 'gen-8', name: 'Sore Throat', icon: Activity, image: '/optimized/Blood Test.webp', bg: 'bg-teal-50' },
  { id: 'gen-9', name: 'Fatigue & Weakness', icon: Activity, image: '/optimized/Blood Test.webp', bg: 'bg-indigo-50' },
  { id: 'gen-10', name: 'Eye Irritation', icon: Activity, image: '/optimized/Blood Test.webp', bg: 'bg-cyan-50' },
];

const FALLBACK_ADVANCED_DISEASES = [
  { id: 'adv-1', name: 'Chest Pain', icon: ShieldCheck, image: '/optimized/Blood Test.webp', bg: 'bg-pink-50' },
  { id: 'adv-2', name: 'Shortness of Breath', icon: ShieldCheck, image: '/optimized/Blood Test.webp', bg: 'bg-blue-50' },
  { id: 'adv-3', name: 'Diabetes Check', icon: ShieldCheck, image: '/optimized/Blood Test.webp', bg: 'bg-orange-50' },
  { id: 'adv-4', name: 'Hypertension Management', icon: ShieldCheck, image: '/optimized/Blood Test.webp', bg: 'bg-rose-50' },
  { id: 'adv-5', name: 'Kidney Health Screening', icon: ShieldCheck, image: '/optimized/Blood Test.webp', bg: 'bg-cyan-50' },
  { id: 'adv-6', name: 'Thyroid Disorder', icon: ShieldCheck, image: '/optimized/Blood Test.webp', bg: 'bg-purple-50' },
  { id: 'adv-7', name: 'Chronic Joint Pain', icon: ShieldCheck, image: '/optimized/Blood Test.webp', bg: 'bg-amber-50' },
  { id: 'adv-8', name: 'Severe Migraine', icon: ShieldCheck, image: '/optimized/Blood Test.webp', bg: 'bg-indigo-50' },
  { id: 'adv-9', name: 'Liver Function Concern', icon: ShieldCheck, image: '/optimized/Blood Test.webp', bg: 'bg-emerald-50' },
];

const FALLBACK_CATEGORICAL_SPECIALTIES = [
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

const FALLBACK_HOSPITALS = [
  {
    id: 'hosp-1',
    name: 'Apollo Hospitals',
    address: 'Road No. 72, Jubilee Hills, Hyderabad',
    contact: '+91 40 2360 7777',
    departments: ['General Medicine', 'Cardiology', 'Emergency Care'],
    services: ['op_consultation', 'video_consultation', 'emergency'],
    verified: true,
    description: 'Premier multi-specialty tertiary care hospital with world-class medical experts.'
  },
  {
    id: 'hosp-2',
    name: 'KIMS Hospitals',
    address: 'Minister Road, Secunderabad, Telangana',
    contact: '+91 40 4488 5000',
    departments: ['General Medicine', 'Neurology', 'Pediatrics'],
    services: ['op_consultation', 'video_consultation'],
    verified: true,
    description: 'Leading healthcare institute delivering comprehensive clinical services.'
  }
];

const FALLBACK_DOCTORS = [
  {
    id: 'doc-1',
    name: 'Dr. Sarah Jenkins',
    specialization: 'General Physician & Internal Medicine',
    qualification: 'MBBS, MD (General Medicine)',
    experience: '12 years',
    designation: 'Senior Consultant Physician',
    hospitalId: 'hosp-1',
    hospitalName: 'Apollo Hospitals',
    hospitalAddress: 'Road No. 72, Jubilee Hills, Hyderabad',
    departmentId: 'dept-gen',
    department: 'General Medicine',
    consultInfo: 'Expert in infectious diseases, chronic illness management, and adult primary care.',
    bio: 'Dr. Sarah Jenkins has over 12 years of experience in internal medicine and outpatient care with high patient satisfaction.',
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
  const type = searchParams.get('type') || 'hospital-op';
  const isVideo = type === 'video-consult' || type === 'doctor' || type === 'video';
  const { user } = useAuth();

  // State Management
  const [view, setView] = useState<ViewState>('LANDING');
  const [activeTab, setActiveTab] = useState('general');
  const [showAllGeneral, setShowAllGeneral] = useState(false);
  const [showAllAdvanced, setShowAllAdvanced] = useState(false);
  const [showAllCategorical, setShowAllCategorical] = useState(false);
  
  // Real Data State with resilient fallbacks
  const [diseasesList, setDiseasesList] = useState({
    general: FALLBACK_GENERAL_DISEASES as any[],
    advanced: FALLBACK_ADVANCED_DISEASES as any[],
    categorical: FALLBACK_CATEGORICAL_SPECIALTIES as any[],
    raw: [] as any[]
  });
  const [hospitalsList, setHospitalsList] = useState<any[]>(FALLBACK_HOSPITALS);
  const [doctorsList, setDoctorsList] = useState<any[]>(FALLBACK_DOCTORS);
  const [availableSlots, setAvailableSlots] = useState<string[]>(FALLBACK_SLOTS);
  const [allSlots, setAllSlots] = useState<string[]>(FALLBACK_SLOTS);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [expiredSlots, setExpiredSlots] = useState<string[]>([]);
  const [isHospitalsLoading, setIsHospitalsLoading] = useState(false);
  const [isDoctorsLoading, setIsDoctorsLoading] = useState(false);
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
  const [isDiseasesLoading, setIsDiseasesLoading] = useState(false);
  const [diseasesError, setDiseasesError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Selection State
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [diseaseSearch, setDiseaseSearch] = useState('');
  const [diseaseSearchMode, setDiseaseSearchMode] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedDisease, setSelectedDisease] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [categoricalDiseaseSearch, setCategoricalDiseaseSearch] = useState('');
  
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [upcomingDates] = useState<SlotDateOption[]>(INITIAL_DATES);
  const [selectedDate, setSelectedDate] = useState<string>(() => INITIAL_DATES[0]?.date || 'Today');
  const [selectedDateIso, setSelectedDateIso] = useState<string>(() => INITIAL_DATES[0]?.isoDate || new Date().toISOString().split('T')[0]);
  const [isDoctorAvailable, setIsDoctorAvailable] = useState<boolean>(true);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [reason, setReason] = useState('');
  
  // Booking State
  const [bookingId, setBookingId] = useState('');
  const [bookingStatus, setBookingStatus] = useState('PENDING'); // PENDING, CONFIRMED, COMPLETED, CANCELLED
  const [notification, setNotification] = useState('');
  
  // Video specific state
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  // Know Your Disease AI Modal and Tile -> 5s -> Hover -> Circle Popup state
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

  // Doctor Details & Profile Navigation state
  const [doctorSourceView, setDoctorSourceView] = useState<'DOCTOR_LIST' | 'HOSPITAL_DETAILS'>('DOCTOR_LIST');
  const [doctorFullProfile, setDoctorFullProfile] = useState<any>(null);
  const [isDoctorProfileLoading, setIsDoctorProfileLoading] = useState(false);

  // Full persisted booking data after confirmation
  const [confirmedBookingData, setConfirmedBookingData] = useState<any>(null);

  // Shows as Tile initially, then after 5s collapses to circle popup
  useEffect(() => {
    const isDiseaseSelectionScreen = view === 'LANDING' || view === 'CATEGORICAL_DISEASES';
    
    if (!isDiseaseSelectionScreen || hasDismissedAiPopup) {
      setIsAiPopupCollapsed(true);
      return;
    }

    // Start in full tile mode
    setIsAiPopupCollapsed(false);

    // After 5 seconds, collapse into circular floating popup
    const timer = setTimeout(() => {
      setIsAiPopupCollapsed(true);
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [view, hasDismissedAiPopup]);

  const handleDismissAiPopup = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasDismissedAiPopup(true);
    try {
      sessionStorage.setItem('mediquee_dismissed_ai_popup', 'true');
    } catch {}
  };

  // Fetch full doctor details using doctorApi when entering DOCTOR_PROFILE
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

  // Fetch real diseases on mount
  useEffect(() => {
    let mounted = true;
    setDiseasesError(false);
    opAppointmentApi.fetchDiseases().then((res) => {
      if (mounted) {
        if (res.success && res.data) {
          
          // Map general
          const general = (res.data.general || []).map((d: any, idx: number) => ({
            ...d,
            icon: Activity,
            image: getDiseaseIconUrl(d.name, d.icon),
            bg: ['bg-red-50', 'bg-blue-50', 'bg-emerald-50', 'bg-purple-50', 'bg-amber-50'][idx % 5]
          }));
          
          // Map advanced
          const advanced = (res.data.advanced || []).map((d: any, idx: number) => ({
            ...d,
            icon: ShieldCheck,
            image: getDiseaseIconUrl(d.name, d.icon),
            bg: ['bg-pink-50', 'bg-blue-50', 'bg-orange-50', 'bg-fuchsia-50', 'bg-rose-50'][idx % 5]
          }));
          
          // Map categorical
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
          setDiseasesError(false);
        }
        setIsDiseasesLoading(false);
      }
    }).catch(() => {
      if (mounted) {
        setIsDiseasesLoading(false);
      }
    });

    return () => { mounted = false; };
  }, []);

  // Fetch real hospitals when entering hospital view or changing search/disease
  useEffect(() => {
    if (view === 'HOSPITAL_RESULTS' || view === 'HOSPITAL_DETAILS') {
      let active = true;
      setIsHospitalsLoading(true);
      hospitalApi.getHospitals({ search: hospitalSearch, conditionId: selectedDisease?.id }).then((res) => {
        if (active) {
          setIsHospitalsLoading(false);
          if (res.success && res.data && res.data.length > 0) {
            setHospitalsList(res.data);
          } else if (res.success && res.data && res.data.length === 0 && hospitalSearch) {
            setHospitalsList([]);
          }
        }
      }).catch(() => {
        if (active) {
          setIsHospitalsLoading(false);
        }
      });
      return () => { active = false; };
    }
  }, [view, hospitalSearch, selectedDisease]);

  // Fetch real doctors when entering doctor list
  useEffect(() => {
    if (view === 'DOCTOR_LIST' || view === 'DOCTOR_PROFILE' || (view === 'HOSPITAL_DETAILS' && selectedDisease)) {
      let active = true;
      setIsDoctorsLoading(true);
      if (selectedHospital?.id) {
        hospitalApi.getHospitalDoctors(selectedHospital.id, selectedDepartment || undefined, selectedDisease?.id).then((res) => {
          if (active) {
            setIsDoctorsLoading(false);
            if (res.success && Array.isArray(res.data)) {
              setDoctorsList(res.data);
            }
          }
        }).catch(() => {
          if (active) {
            setIsDoctorsLoading(false);
          }
        });
      } else {
        doctorApi.getDoctors({
          search: hospitalSearch,
          departmentId: selectedDepartment || undefined,
          specialtyId: selectedDisease?.specialtyId,
          conditionId: selectedDisease?.id
        }).then((res) => {
          if (active) {
            setIsDoctorsLoading(false);
            if (res.success && Array.isArray(res.data)) {
              setDoctorsList(res.data);
            }
          }
        }).catch(() => {
          if (active) {
            setIsDoctorsLoading(false);
          }
        });
      }
      return () => { active = false; };
    }
  }, [view, selectedHospital, selectedDepartment, hospitalSearch, selectedDisease]);

  // Fetch real availability when selecting slots
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
            setAvailableSlots(res.data.availableSlots && res.data.availableSlots.length > 0 ? res.data.availableSlots : FALLBACK_SLOTS);
            setAllSlots(res.data.allSlots && res.data.allSlots.length > 0 ? res.data.allSlots : FALLBACK_SLOTS);
            setBookedSlots(res.data.bookedSlots || []);
            setExpiredSlots(res.data.expiredSlots || []);
          }
        }
      }).catch(() => {
        if (active) {
          setIsSlotsLoading(false);
        }
      });
      return () => { active = false; };
    }
  }, [view, selectedDoctor, selectedDateIso, isVideo]);

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
        icon: Stethoscope,
        image: getDiseaseIconUrl(concern.name)
      });
      setView('HOSPITAL_RESULTS');
    }
  };

  // Handle deep link to specific category
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

  // Reset state when tab changes
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
      setHospitalSearch('');
      setBookingError('');
    }
  }, [isVideo]);

  const handleBack = () => {
    setBookingError('');
    switch (view) {
      case 'CATEGORICAL_DISEASES':
        setView('LANDING');
        setSelectedCategory(null);
        setCategoricalDiseaseSearch('');
        break;
      case 'HOSPITAL_RESULTS':
      case 'DOCTOR_LIST':
        if (selectedDisease) {
           if (selectedCategory) {
             setView('CATEGORICAL_DISEASES');
           } else {
             setView('LANDING');
           }
           setSelectedDisease(null);
           setSelectedDepartment(null);
           setHospitalSearch('');
        } else {
           setView(selectedHospital ? 'HOSPITAL_DETAILS' : 'LANDING');
           if (!selectedHospital) {
               setSelectedDepartment(null);
           }
        }
        break;
      case 'HOSPITAL_DETAILS':
        setView('HOSPITAL_RESULTS');
        break;
      case 'DOCTOR_PROFILE':
        setView(doctorSourceView);
        break;
      case 'SELECT_SLOT':
        setView('DOCTOR_PROFILE');
        break;
      case 'CONFIRMATION':
      case 'APPOINTMENT_STATUS':
      case 'VIDEO_UPCOMING':
      case 'VIDEO_COMPLETED':
        setView('LANDING');
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
    setTimeout(() => setNotification(''), 4000);
  };

  const confirmBooking = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setBookingError('');

    try {
      const targetDate = selectedDateIso || new Date().toISOString().split('T')[0];
      const res = await opAppointmentApi.createOpAppointment({
        hospitalId: selectedHospital?.id || selectedDoctor?.hospitalId,
        doctorId: selectedDoctor?.id,
        departmentId: selectedDoctor?.departmentId,
        conditionId: selectedDisease?.id,
        date: targetDate,
        timeSlot: selectedTime || '10:00 AM',
        patientName: user?.name,
        patientPhone: user?.phone,
        reason: reason || (isVideo ? 'Video Consultation' : 'OP Consultation visit'),
        opType: isVideo ? 'Video Consultation' : 'Normal'
      });

      if (!res.success) {
        const errMsg = typeof res.error === 'object' ? res.error.message : (res.error || 'Failed to book appointment');
        setBookingError(errMsg);
        showNotification(errMsg);
        setIsSubmitting(false);
        // Refresh available slots for this doctor so the user sees updated availability
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
      showNotification(`Your appointment with Dr. ${selectedDoctor.name.split(' ')[1] || selectedDoctor.name} has been booked successfully.`);
    } catch (err: any) {
      setBookingError(err.message || 'Error booking appointment');
      showNotification(err.message || 'Error booking appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiseaseSelect = (disease: any) => {
    setSelectedDisease(disease);
    setView('HOSPITAL_RESULTS');
  };

  const handleCategorySelect = (category: any) => {
    setSelectedCategory(category);
    setCategoricalDiseaseSearch('');
    setView('CATEGORICAL_DISEASES');
  };

  // --- RENDERERS ---

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
        (d?.name || (d as any)?.title || '').toLowerCase().includes(query) || (d?.desc && typeof d.desc === 'string' && d.desc.toLowerCase().includes(query))
      );
    }

    const displayedGeneral = showAllGeneral || query ? filteredGeneral : filteredGeneral.slice(0, 8);
    const displayedAdvanced = showAllAdvanced || query ? filteredAdvanced : filteredAdvanced.slice(0, 8);
    const displayedCategorical = showAllCategorical || query ? filteredCategorical : filteredCategorical.slice(0, 4);

    const hasResults = filteredGeneral.length > 0 || filteredAdvanced.length > 0 || filteredCategorical.length > 0;

    return (
      <div className="bg-slate-50 p-4 py-5">
      {!diseaseSearchMode && <h2 className="text-[17px] font-bold text-slate-900 mb-1">Browse Diseases</h2>}
      {!diseaseSearchMode && <p className="text-[12px] text-slate-500 mb-4">
        {isVideo ? 'Select a disease to find available doctors' : 'Select a disease to find suitable hospitals'}
      </p>}

      {/* Disease Search Bar */}
      <div className="relative mb-6">
        {diseaseSearchMode ? (
          <button 
            onClick={() => { setDiseaseSearchMode(false); setDiseaseSearch(''); }}
            className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 hover:text-slate-800 z-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
        )}
        <input
          type="text"
          value={diseaseSearch}
          onChange={(e) => setDiseaseSearch(e.target.value)}
          onFocus={() => setDiseaseSearchMode(true)}
          placeholder="Search for a disease or condition..."
          className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm text-[13px] font-medium transition-all"
        />
        {diseaseSearch && (
          <button
            onClick={() => setDiseaseSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {isDiseasesLoading ? (
        <div className="text-center py-12">
           <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
           <p className="text-[13px] text-slate-500 font-medium">Loading diseases...</p>
        </div>
      ) : diseasesError ? (
        <div className="text-center py-12">
           <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
           <p className="text-[14px] text-slate-700 font-bold mb-1">Failed to load diseases</p>
           <p className="text-[13px] text-slate-500 mb-4">Please check your connection and try again.</p>
           <button onClick={() => window.location.reload()} className="px-5 py-2 bg-blue-600 text-white text-[13px] font-bold rounded-xl hover:bg-blue-700 shadow-sm">
             Retry
           </button>
        </div>
      ) : !hasResults ? (
        <div className="text-center py-12">
           <p className="text-[14px] text-slate-500 font-bold">No matching diseases found</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
         {/* Tabs */}
         <div className="flex border-b border-slate-100">
            <button 
              className={`flex-1 py-4 text-[13px] font-bold text-center border-b-[2.5px] transition-colors ${activeTab === 'general' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('general')}
            >
              General
            </button>
            <button 
              className={`flex-1 py-4 text-[13px] font-bold text-center border-b-[2.5px] transition-colors ${activeTab === 'advanced' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('advanced')}
            >
              Advanced
            </button>
         </div>
         
         {/* Tab Content */}
         <div className="p-4">
           {activeTab === 'general' && (
             <>
               <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-x-3 gap-y-4">
                 {displayedGeneral.map((item) => (
                    <div key={item.id} onClick={() => handleDiseaseSelect(item)} className="flex flex-col items-center bg-white rounded-2xl p-2 cursor-pointer border border-slate-50 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow h-[90px] justify-center">
                      <div className={`w-[54px] h-[54px] rounded-full ${item.bg} flex items-center justify-center mb-2 shadow-sm overflow-hidden p-1`}>
                          {item.image ? (
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                className="w-full h-full object-contain drop-shadow-sm mix-blend-multiply" 
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/optimized/Blood Test.webp';
                                }}
                              />
                          ) : item.icon ? (
                              <item.icon className={`w-8 h-8`} />
                          ) : (
                              <Activity className="w-8 h-8 text-blue-600" />
                          )}
                      </div>
                      <span className="text-[11px] font-bold text-center text-slate-800 leading-tight">
                          {item.name}
                      </span>
                    </div>
                 ))}
               </div>
               
               {!query && filteredGeneral.length > 8 && (
                 <div className="mt-5 flex justify-center">
                   <button 
                     onClick={() => setShowAllGeneral(!showAllGeneral)}
                     className="text-[12px] font-bold text-blue-600 flex items-center gap-1 hover:text-blue-700 transition-colors"
                   >
                     {showAllGeneral ? 'Show Less ↑' : 'See More Diseases →'}
                   </button>
                 </div>
               )}
             </>
           )}

           {activeTab === 'advanced' && (
             <>
               <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-x-3 gap-y-4">
                 {displayedAdvanced.map((item) => (
                    <div key={item.id} onClick={() => handleDiseaseSelect(item)} className="flex flex-col items-center bg-white rounded-2xl p-2 cursor-pointer border border-slate-50 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow h-[90px] justify-center">
                      <div className={`w-[54px] h-[54px] rounded-full ${item.bg} flex items-center justify-center mb-2 shadow-sm overflow-hidden p-1`}>
                          {item.image ? (
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                className="w-full h-full object-contain drop-shadow-sm mix-blend-multiply" 
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/optimized/Blood Test.webp';
                                }}
                              />
                          ) : item.icon ? (
                              <item.icon className={`w-8 h-8`} />
                          ) : (
                              <ShieldCheck className="w-8 h-8 text-indigo-600" />
                          )}
                      </div>
                      <span className="text-[11px] font-bold text-center text-slate-800 leading-tight">
                          {item.name}
                      </span>
                    </div>
                 ))}
               </div>

               {!query && filteredAdvanced.length > 8 && (
                 <div className="mt-5 flex justify-center">
                   <button 
                     onClick={() => setShowAllAdvanced(!showAllAdvanced)}
                     className="text-[12px] font-bold text-blue-600 flex items-center gap-1 hover:text-blue-700 transition-colors"
                   >
                     {showAllAdvanced ? 'Show Less ↑' : 'See More Diseases →'}
                   </button>
                 </div>
               )}
             </>
           )}
         </div>
      </div>

      <div>
         <h2 className="text-[17px] font-bold text-slate-900 mb-3">Categorical Diseases</h2>
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
           {displayedCategorical.map((cat) => (
              <div key={cat.id} onClick={() => handleCategorySelect(cat)} className="flex items-center justify-between bg-white rounded-2xl p-3 border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                 <div className="flex items-center gap-3">
                    <div className={`w-14 h-14 rounded-full ${cat.bg} flex items-center justify-center shrink-0 shadow-sm border border-slate-100/50 p-1.5`}>
                       {cat.image ? (
                           <img 
                             src={cat.image} 
                             alt={cat.name} 
                             className="w-full h-full object-contain drop-shadow-sm mix-blend-multiply" 
                             onError={(e) => {
                               (e.target as HTMLImageElement).src = '/optimized/Blood Test.webp';
                             }}
                           />
                       ) : cat.icon ? (
                           <cat.icon className={`w-8 h-8`} />
                       ) : (
                           <Stethoscope className="w-8 h-8 text-blue-600" />
                       )}
                    </div>
                    <div>
                       <h3 className="font-bold text-slate-900 text-[13px] mb-0.5">{cat.name}</h3>
                       <p className="text-[10px] text-slate-500 font-medium leading-tight whitespace-pre-line">{cat.desc}</p>
                    </div>
                 </div>
                 <ChevronLeft className="w-4 h-4 text-slate-400 shrink-0 rotate-180" />
              </div>
           ))}
         </div>
         
         {!query && filteredCategorical.length > 4 && (
           <div className="mt-4 mb-2 flex justify-center">
             <button 
               onClick={() => setShowAllCategorical(!showAllCategorical)}
               className="text-[12px] font-bold text-blue-600 flex items-center gap-1 hover:text-blue-700 transition-colors"
             >
               {showAllCategorical ? 'Show Less ↑' : 'See More Diseases →'}
             </button>
           </div>
         )}
      </div>
        </>
      )}
    </div>
  );
};

  const renderLanding = () => {
    return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!diseaseSearchMode && (
        <div className="bg-gradient-to-r from-[#0055ff] to-[#06b6d4] pt-5 pb-8 px-4 text-white rounded-b-3xl relative overflow-hidden">
          {isVideo && (
            <div className="absolute right-0 top-0 opacity-10">
              <Video className="w-32 h-32 -mr-6 -mt-4" strokeWidth={1} />
            </div>
          )}
          <div className="flex items-center gap-3 mb-1 relative z-10">
            <button onClick={() => navigate(-1)} className="p-1 hover:bg-white/20 rounded-full transition-colors -ml-1">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-[20px] font-bold">{isVideo ? 'Video Consultation' : 'Book an OP Appointment'}</h1>
          </div>
          <p className="text-[11px] text-blue-100 mb-5 max-w-[280px] relative z-10">
            {isVideo 
              ? 'Consult with a doctor online from wherever you are.' 
              : 'Find a hospital, choose a doctor, and book an available appointment.'}
          </p>
        </div>
      )}

      {!diseaseSearchMode && (
        <HowItWorks 
          title={isVideo ? "How Video Consultation Works" : "How OP Booking Works"}
          steps={isVideo ? videoConsultationStepsData : opBookingStepsData}
          className="shadow-sm -mt-2 relative z-20 rounded-t-3xl mb-2"
        />
      )}

      {renderDiseaseCategories()}
    </div>
  )};

  const renderCategoricalDiseases = () => {
    if (!selectedCategory) return null;
    
    const categoryDiseases = getDiseasesForCategory(selectedCategory.id, selectedCategory.name, diseasesList.raw, selectedCategory);
    const query = categoricalDiseaseSearch.toLowerCase().trim();
    const filtered = query
      ? categoryDiseases.filter((d: any) => (d?.name || (d as any)?.title || '').toLowerCase().includes(query) || (d?.desc && typeof d.desc === 'string' && d.desc.toLowerCase().includes(query)))
      : categoryDiseases;

    return (
      <div className="px-4 py-4 space-y-4 max-w-4xl mx-auto animate-in fade-in duration-200">
        {/* Category Header Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm flex items-start gap-4">
          <div className={`w-14 h-14 rounded-2xl ${selectedCategory.bg || 'bg-blue-50'} flex items-center justify-center shrink-0 shadow-sm border border-slate-100/60 p-1.5 overflow-hidden`}>
            {selectedCategory.image ? (
              <img 
                src={selectedCategory.image} 
                alt={selectedCategory.name} 
                className="w-full h-full object-contain drop-shadow-sm mix-blend-multiply" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/optimized/Blood Test.webp';
                }}
              />
            ) : selectedCategory.icon ? (
              <selectedCategory.icon className="w-8 h-8" />
            ) : (
              <Stethoscope className="w-8 h-8 text-primary" />
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
              {selectedCategory.desc || 'Select a specific health condition or concern to find specialized doctors and hospitals.'}
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
            className="w-full bg-white border border-slate-200 pl-10 pr-10 py-3 rounded-2xl text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
          />
          {categoricalDiseaseSearch && (
            <button
              onClick={() => setCategoricalDiseaseSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Specific Disease List */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Specific Conditions & Diagnoses
            </h3>
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((item: any) => {
                const ItemIcon = item.icon || Stethoscope;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleDiseaseSelect(item)}
                    className="flex items-start justify-between bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm cursor-pointer hover:border-blue-200 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-3 min-w-0 pr-2">
                      <div className={`w-11 h-11 rounded-xl ${item.bg || 'bg-blue-50'} flex items-center justify-center shrink-0 shadow-sm border border-slate-100 group-hover:scale-105 transition-transform p-1 overflow-hidden`}>
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-contain drop-shadow-sm mix-blend-multiply" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/optimized/Blood Test.webp';
                            }}
                          />
                        ) : (
                          <ItemIcon className="w-6 h-6 text-slate-700" />
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
                    <ChevronLeft className="w-4 h-4 text-slate-300 shrink-0 rotate-180 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all mt-1" />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No matching conditions found</p>
              <p className="text-xs text-slate-400 mt-1">Try a different search term or select general consultation above.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderHospitalResults = () => {
    const query = hospitalSearch.toLowerCase().trim();
    const hasSearch = query.length > 0;
    const showPopular = searchFocused && !hasSearch;
    
    let filteredHospitals = hospitalsList;
    
    if (query) {
      filteredHospitals = hospitalsList.filter(h => {
        const name = (h?.name || h?.hospitalName || h?.title || '').toLowerCase();
        const desc = (typeof h?.description === 'string' ? h.description : '').toLowerCase();
        const city = (typeof h?.city === 'string' ? h.city : '').toLowerCase();
        const loc = (typeof h?.location === 'string' ? h.location : '').toLowerCase();
        const depts = Array.isArray(h?.departments) 
          ? h.departments.some((d: any) => (typeof d === 'string' ? d : d?.name || '').toLowerCase().includes(query))
          : false;
        return name.includes(query) || desc.includes(query) || city.includes(query) || loc.includes(query) || depts;
      });
    }
    
    let title = selectedDisease 
      ? `Hospitals for ${selectedDisease.name}`
      : (query ? `Hospitals found for "${hospitalSearch}"` : `All Hospitals`);
      
    let subtitle = selectedDisease 
      ? 'Hospitals offering care for this condition' 
      : (query ? 'Select a hospital to view details' : 'Browse available hospitals');

    if (showPopular) {
      title = 'Popular Hospitals';
      subtitle = 'Top rated hospitals in your area';
    }

    return (
      <div className={`px-4 py-6 ${!hasSearch ? 'animate-in fade-in slide-in-from-right-4' : ''}`}>
        <div className="relative max-w-md md:max-w-xl mx-auto z-10 mb-6">
          {searchFocused ? (
            <button 
              onClick={() => { setSearchFocused(false); setHospitalSearch(''); }}
              className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 hover:text-slate-800 z-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
          )}
          <input 
            type="text" 
            value={hospitalSearch}
            onChange={(e) => setHospitalSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            className="block w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm text-[13px] font-medium" 
            placeholder={isVideo ? "Search hospital, doctor..." : "Search hospital by name, city, location..."}
          />
        </div>

        <h2 className="text-[16px] font-bold text-slate-800 mb-1">{title}</h2>
        <p className="text-[12px] text-slate-500 mb-4">{subtitle}</p>
        
        {isHospitalsLoading && (
          <div className="flex items-center justify-center py-6 text-blue-600 gap-2">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-semibold">Loading hospitals...</span>
          </div>
        )}

        {!isHospitalsLoading && filteredHospitals.length === 0 ? (
          <div className="text-center py-8">
             <p className="text-[14px] text-slate-500 font-bold">{hasSearch ? "No hospitals found matching your search" : "No hospitals found."}</p>
          </div>
        ) : (
        <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
          {filteredHospitals.map(hosp => (
            <div 
              key={hosp.id} 
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => { setSelectedHospital(hosp); setView(isVideo ? 'DOCTOR_LIST' : 'HOSPITAL_DETAILS'); }}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-900 text-[15px] flex items-center gap-1.5">
                  {hosp.name || hosp.hospitalName || hosp.title || 'Hospital'}
                  {hosp.verified && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mb-2 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-500" />
                {hosp.address}
              </p>
              <p className="text-[11px] text-slate-500 mb-3 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                {hosp.contact}
              </p>
              
              <div className="flex flex-wrap gap-1.5 mb-4">
                {(hosp.departments || []).slice(0, 3).map((dept: string) => (
                  <span key={dept} className="px-2 py-1 bg-slate-50 text-slate-600 text-[9px] rounded-md font-medium border border-slate-100">
                    {dept}
                  </span>
                ))}
              </div>

              <div className="w-full py-2.5 rounded-xl bg-blue-50 text-blue-600 font-bold text-[12px] text-center flex items-center justify-center pointer-events-none">
                {isVideo ? 'View Available Doctors' : 'View Hospital'}
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    );
  };

  const renderHospitalDetails = () => (
    <div className="px-4 py-6 animate-in fade-in slide-in-from-right-4">
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-4">
        <h2 className="font-bold text-slate-900 text-[18px] flex items-center gap-2 mb-2">
          {selectedHospital.name}
          {selectedHospital.verified && <ShieldCheck className="w-5 h-5 text-emerald-500" />}
        </h2>
        <p className="text-[12px] text-slate-600 mb-4">{selectedHospital.description}</p>
        
        <div className="space-y-2 mb-4">
          <p className="text-[11px] text-slate-500 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-500" />
            {selectedHospital.address}
          </p>
          <p className="text-[11px] text-slate-500 flex items-center gap-2">
            <Phone className="w-4 h-4 text-blue-500" />
            {selectedHospital.contact}
          </p>
        </div>

        {selectedHospital.services && selectedHospital.services.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Services & Facilities</h4>
            <div className="flex flex-wrap gap-1.5">
              {selectedHospital.services.map((srv: string) => (
                <span key={srv} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg capitalize">
                  {srv.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      {selectedDisease ? (
        <div className="mt-2">
          <h3 className="font-bold text-slate-800 text-[15px] mb-3">Doctors for {selectedDisease.name}</h3>
          
          {isDoctorsLoading ? (
            <div className="flex items-center justify-center py-6 text-blue-600 gap-2">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-semibold">Loading doctors...</span>
            </div>
          ) : (!doctorsList || doctorsList.length === 0) ? (
            <div className="text-center py-8 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <p className="text-[14px] text-slate-500 font-bold">No doctors found</p>
              <p className="text-[11px] text-slate-400 mt-1">No doctors are currently available for {selectedDisease.name} at this hospital.</p>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 mb-6">
              {doctorsList.map(doc => (
                <div key={doc.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                  <div className="flex gap-3">
                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {doc.avatar ? (
                        <img src={doc.avatar} alt={doc.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 text-[14px]">{doc.name}</h3>
                      <p className="text-[11px] text-blue-600 font-medium mb-0.5">{doc.specialization} • {doc.qualification}</p>
                      <p className="text-[10px] text-slate-500 mb-1">{doc.department}</p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" /> {doc.rating}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {doc.experience}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => { 
                      setSelectedDoctor(doc); 
                      setDoctorSourceView('HOSPITAL_DETAILS'); 
                      setView('DOCTOR_PROFILE'); 
                    }}
                    className="w-full mt-4 py-2.5 rounded-xl bg-blue-50 text-blue-600 font-bold text-[12px] hover:bg-blue-100 transition-colors"
                  >
                    View Doctor
                  </button>
                </div>
              ))}
            </div>
          )}
          <button 
            onClick={() => { setSelectedDepartment(null); setView('DOCTOR_LIST'); }}
            className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold text-[13px] shadow-sm hover:bg-blue-700 transition-colors"
          >
            View All Doctors
          </button>
        </div>
      ) : (
        <>
          <h3 className="font-bold text-slate-800 text-[15px] mb-3">Departments</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
            {(!selectedHospital.departments || selectedHospital.departments.length === 0) ? (
              <div className="col-span-2 text-center py-6 bg-white rounded-xl border border-slate-100 text-xs text-slate-400 font-medium">
                No departments currently listed for this hospital
              </div>
            ) : (
              selectedHospital.departments.map((dept: string) => (
                <div 
                  key={dept} 
                  onClick={() => { setSelectedDepartment(dept); setView('DOCTOR_LIST'); }}
                  className="bg-white rounded-xl p-4 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-300 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-800">{dept}</span>
                </div>
              ))
            )}
          </div>

          <button 
            onClick={() => { setSelectedDepartment(null); setView('DOCTOR_LIST'); }}
            className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold text-[13px] shadow-sm"
          >
            View All Doctors
          </button>
        </>
      )}
    </div>
  );

  const renderDoctorList = () => {
    // Filter doctors based on selected hospital/dept or search query
    let docs = doctorsList;
    if (!isVideo && selectedHospital) {
      docs = doctorsList.filter(d => d.hospitalId === selectedHospital.id);
      if (selectedDepartment) {
        const deptDocs = docs.filter(d => d.department === selectedDepartment || d.departmentId === selectedDepartment);
        if (deptDocs.length > 0) {
          docs = deptDocs;
        }
      }
      if (docs.length === 0) {
        docs = doctorsList.filter(d => d.hospitalId === selectedHospital.id);
      }
    }

    const title = isVideo 
      ? (selectedDisease ? `Available Doctors for ${selectedDisease.name}` : `Available Specialists Online`)
      : (selectedHospital ? `Doctors at ${selectedHospital.name}` : `Doctors for "${selectedDisease?.name || 'Selected Condition'}"`);

    return (
      <div className="px-4 py-6 animate-in fade-in slide-in-from-right-4">
        <h2 className="text-[15px] font-bold text-slate-800 mb-4">{title}</h2>

        {isDoctorsLoading && (
          <div className="flex items-center justify-center py-6 text-blue-600 gap-2">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-semibold">Loading doctors...</span>
          </div>
        )}

        {!isDoctorsLoading && docs.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <p className="text-[14px] text-slate-500 font-bold">No doctors found</p>
            <p className="text-[11px] text-slate-400 mt-1">No doctors are currently available for this selection.</p>
          </div>
        ) : (
        <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
          {docs.map(doc => (
            <div key={doc.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <div className="flex gap-3">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                  {doc.avatar ? (
                    <img src={doc.avatar} alt={doc.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 text-[14px]">{doc.name}</h3>
                  <p className="text-[11px] text-blue-600 font-medium mb-0.5">{doc.specialization} • {doc.qualification}</p>
                  <p className="text-[10px] text-slate-500 mb-1">{doc.hospitalName}</p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" /> {doc.rating}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {doc.experience}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => { 
                  setSelectedDoctor(doc); 
                  setDoctorSourceView('DOCTOR_LIST'); 
                  setView('DOCTOR_PROFILE'); 
                }}
                className="w-full mt-4 py-2.5 rounded-xl bg-blue-50 text-blue-600 font-bold text-[12px] hover:bg-blue-100 transition-colors"
              >
                View Doctor
              </button>
            </div>
          ))}
        </div>
        )}
      </div>
    );
  };

  const renderDoctorProfile = () => {
    const doc = doctorFullProfile || selectedDoctor;
    if (!doc) {
      return (
        <div className="px-4 py-12 text-center">
          <p className="text-slate-500 text-sm">No doctor selected</p>
          <button onClick={handleBack} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">
            Back to Doctors
          </button>
        </div>
      );
    }

    const hasVideoSchedule = doc.doctorSchedules?.some((s: any) => s.isAvailable && (s.videoStartTime || s.videoEndTime)) ?? true;
    const hasOpSchedule = doc.doctorSchedules?.some((s: any) => s.isAvailable && (s.startTime || s.endTime)) ?? true;

    return (
      <div className="px-4 py-6 max-w-md md:max-w-2xl mx-auto animate-in fade-in slide-in-from-right-4 space-y-4">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between pb-1">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Doctors
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

        {/* Hospital Affiliation & Department Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Hospital & Clinical Affiliation</h3>
          
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Hospital className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-slate-900 text-sm">{doc.hospitalName || 'MediQuee Partner Hospital'}</h4>
              {doc.hospitalAddress && doc.hospitalAddress !== 'Not specified' && (
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{doc.hospitalAddress}</span>
                </p>
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
        {/* Consultation Service & Fee */}
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
                <span className="text-xs font-bold block">In-Person OP Visit</span>
                <span className="text-[10px] text-slate-500 block">
                  {hasOpSchedule ? 'Hospital Clinic Visit' : 'Consultation supported'}
                </span>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white border border-blue-200 text-blue-700 shrink-0">
                At Hospital
              </span>
            </div>
          )}

          {/* Actual Fee Display if configured */}
          {doc.fees && doc.fees !== 'Not specified' && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <span className="font-semibold text-slate-600">Consultation Fee</span>
              <span className="font-extrabold text-slate-900 text-sm">{doc.fees}</span>
            </div>
          )}
        </div>

        {/* Doctor Biography / Clinical Information */}
        {(doc.bio || doc.consultInfo) && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-2 text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">About the Doctor</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {doc.bio || doc.consultInfo}
            </p>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <button 
            onClick={() => setView('SELECT_SLOT')}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>{isVideo ? 'Select Date & Slot • Book Video Consultation' : 'Select Date & Slot • Book Appointment'}</span>
            <ChevronLeft className="w-4 h-4 rotate-180" />
          </button>
        </div>
      </div>
    );
  };

  const renderSelectSlot = () => {
    return (
      <div className="px-4 py-6 max-w-md md:max-w-2xl mx-auto animate-in fade-in slide-in-from-right-4">
        <h2 className="text-[15px] font-bold text-slate-800 mb-4">Select {isVideo ? 'Consultation' : 'Appointment'} Date</h2>
        <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 hide-scrollbar mb-4">
          {upcomingDates.map((d) => (
            <div 
              key={d.isoDate}
              onClick={() => {
                setSelectedDate(d.date);
                setSelectedDateIso(d.isoDate);
                setSelectedTime('');
              }}
              className={`flex flex-col items-center justify-center shrink-0 w-[72px] h-[72px] rounded-2xl border transition-all cursor-pointer ${selectedDateIso === d.isoDate ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white'}`}
            >
              <span className={`text-[10px] font-medium mb-1 ${selectedDateIso === d.isoDate ? 'text-blue-600' : 'text-slate-500'}`}>{d.label}</span>
              <span className={`text-[13px] font-bold ${selectedDateIso === d.isoDate ? 'text-blue-700' : 'text-slate-800'}`}>{d.date}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-3 mt-6">
          <div>
            <h2 className="text-[15px] font-bold text-slate-800">
              {isVideo ? 'Available Video Consultation Slots' : 'Available Time Slots'}
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              {isVideo ? 'Doctor remote video consult hours' : 'In-person clinic physical visit hours'}
            </p>
          </div>
          {isSlotsLoading && <span className="text-[10px] text-blue-600 font-medium animate-pulse">Checking live availability...</span>}
        </div>

        {isSlotsLoading && allSlots.length === 0 ? (
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-11 rounded-xl bg-slate-100 animate-pulse border border-slate-200/50" />
            ))}
          </div>
        ) : !isDoctorAvailable || availableSlots.length === 0 ? (
          <div className="py-8 px-4 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 mb-8">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No Slots Available</p>
            <p className="text-xs text-slate-500 mt-1">
              {selectedDoctor?.name ? `Dr. ${selectedDoctor.name.replace(/^Dr\.\s*/i, '')}` : 'The doctor'} has no available slots on this day ({selectedDate}). Please select another date.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 mb-8">
            {availableSlots.map(time => {
              const isSelected = selectedTime === time;

              return (
                <div 
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`py-3 px-1 rounded-xl border text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                    isSelected ? 'border-blue-600 bg-blue-600 text-white shadow-md' :
                    'border-slate-200 bg-white text-slate-700 hover:border-blue-300'
                  }`}
                >
                  <span className="text-[12px] font-bold">{time}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Optional Reason for Consultation/Visit */}
        <div className="mb-6">
          <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
            Reason for {isVideo ? 'Consultation' : 'Visit'} <span className="text-[11px] font-normal text-slate-500">(Optional)</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full p-3.5 border border-slate-200 rounded-xl bg-white text-[13px] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none shadow-sm"
            placeholder={isVideo ? "Briefly describe what you would like to discuss (optional)..." : "Describe the reason for your visit (optional)..."}
          />
        </div>

        {/* Slot Conflict or Booking Error Banner */}
        {bookingError && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{bookingError}</span>
          </div>
        )}

        <button 
          disabled={!selectedTime || isSubmitting}
          onClick={confirmBooking}
          className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold text-[13px] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Confirming...</span>
            </>
          ) : (
            `Confirm ${isVideo ? 'Consultation' : 'Appointment'}`
          )}
        </button>
      </div>
    );
  };

  const renderConfirmation = () => {
    const diseaseName = confirmedBookingData?.diseaseName || selectedDisease?.name;
    const doctorName = confirmedBookingData?.doctorName || selectedDoctor?.name;
    const doctorAvatar = selectedDoctor?.avatar;
    const hospitalName = confirmedBookingData?.hospitalName || selectedDoctor?.hospitalName || selectedHospital?.name;
    const hospitalAddress = confirmedBookingData?.hospitalAddress || selectedDoctor?.hospitalAddress || selectedHospital?.address;
    const departmentName = confirmedBookingData?.departmentName || selectedDoctor?.department;
    const effectiveBookingId = confirmedBookingData?.id || confirmedBookingData?.appointmentId || bookingId;
    const statusLabel = confirmedBookingData?.status || 'CONFIRMED';
    const patientDisplayName = confirmedBookingData?.patientName || user?.name || 'Self';
    const patientPhone = confirmedBookingData?.patientPhone || user?.phone;
    const feeDisplay = confirmedBookingData?.fee !== undefined 
      ? `₹${confirmedBookingData.fee}` 
      : (selectedDoctor?.fees && selectedDoctor.fees !== 'Not specified' ? selectedDoctor.fees : '₹500');

    return (
      <div className="px-4 py-8 max-w-md md:max-w-xl mx-auto animate-in zoom-in-95 duration-500 text-center space-y-6">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto relative shadow-sm">
          <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-25"></div>
          <CheckCircle2 className="w-10 h-10 text-emerald-600 relative z-10" />
        </div>
        
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-1">
            {isVideo ? 'Video Consultation Confirmed' : 'Appointment Confirmed'}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Your {isVideo ? 'remote video consultation' : 'in-person hospital appointment'} is confirmed and recorded.
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
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider block">
                  Selected Health Concern / Disease
                </span>
                <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
                  {diseaseName || 'General Health Consultation'}
                </span>
              </div>
              <Activity className="w-5 h-5 text-blue-500 shrink-0" />
            </div>

            {/* Doctor Details */}
            <div className="flex items-start gap-3.5 pt-1">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                {doctorAvatar ? (
                  <img src={doctorAvatar} alt={doctorName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Assigned Doctor</span>
                <h3 className="font-bold text-slate-900 text-sm leading-snug">{doctorName}</h3>
                <p className="text-xs text-blue-600 font-medium">
                  {selectedDoctor?.specialization || departmentName || 'Specialist Doctor'}
                </p>
              </div>
            </div>

            {/* Hospital & Department */}
            <div className="pt-2 border-t border-slate-100 flex items-start gap-3">
              <Hospital className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">{hospitalName || 'Partner Hospital'}</span>
                {hospitalAddress && <span className="text-slate-500 text-[11px] block">{hospitalAddress}</span>}
                {departmentName && <span className="text-slate-400 text-[10px] block mt-0.5">Dept: {departmentName}</span>}
              </div>
            </div>

            {/* Date & Time Slot */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">Appointment Date</span>
                  <strong className="text-slate-800">{selectedDate}</strong>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">Time Slot</span>
                  <strong className="text-slate-800">{selectedTime || '10:00 AM'}</strong>
                </div>
              </div>
            </div>

            {/* Consultation Type & Patient Details */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Consultation Type</span>
                <strong className="text-slate-800">{isVideo ? 'Video Consultation' : 'In-Person OP Visit'}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Patient Name</span>
                <strong className="text-slate-800 truncate block">{patientDisplayName}</strong>
                {patientPhone && <span className="text-[10px] text-slate-400 font-mono block">{patientPhone}</span>}
              </div>
            </div>

            {/* Fee & Payment status */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Estimated Fee:</span>
              <div className="text-right">
                <span className="font-bold text-slate-900">{feeDisplay}</span>
                <span className="text-[10px] text-slate-400 block">
                  {isVideo ? 'Digital Consultation' : 'Pay at Hospital Desk'}
                </span>
              </div>
            </div>

            {/* Preparation / Next Steps */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-left text-xs text-slate-600 space-y-1">
              <span className="text-[11px] font-bold text-slate-800 block">Next Steps & Instructions:</span>
              {isVideo ? (
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Your secure video room is linked to this appointment. You can join directly from your booking details screen. Please make sure your camera and microphone permissions are enabled.
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Please arrive 15 minutes before your slot time with past medical records. Present your Booking Reference ID at the hospital OP counter.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button 
            onClick={() => navigate(`/booking/${effectiveBookingId}`)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {isVideo ? (
              <>
                <Video className="w-4 h-4 text-white" />
                <span>View Consultation</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 text-white" />
                <span>View Booking Details</span>
              </>
            )}
          </button>
          
          <button 
            onClick={() => navigate('/bookings')}
            className="w-full py-3.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Go to My Bookings</span>
          </button>

          <button 
            onClick={() => navigate('/')}
            className="w-full py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  };

  const renderAppointmentStatus = () => (
    <div className="px-4 py-6 max-w-md md:max-w-2xl mx-auto animate-in fade-in slide-in-from-right-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-bold text-slate-800">Appointment Details</h2>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
          bookingStatus === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
          bookingStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' :
          bookingStatus === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
          'bg-red-100 text-red-700'
        }`}>
          {bookingStatus}
        </span>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
            <User className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-[15px]">{selectedDoctor.name}</h3>
            <p className="text-[11px] text-blue-600 font-medium mb-1">{selectedDoctor.specialization}</p>
            <p className="text-[11px] text-slate-500">{selectedDoctor.hospitalName}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Date & Time</span>
            <span className="text-[12px] font-bold text-slate-800 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-blue-500" /> {selectedDate}, {selectedTime}</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Booking ID</span>
            <span className="text-[12px] font-bold text-slate-800">{bookingId}</span>
          </div>
        </div>
      </div>

      <h3 className="font-bold text-slate-800 text-[13px] mb-3">Appointment History</h3>
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-6 relative">
        <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-100"></div>
        
        <div className="flex gap-4 mb-6 relative">
          <div className="w-5 h-5 rounded-full bg-blue-500 border-4 border-white shadow-sm flex items-center justify-center shrink-0 z-10">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
          <div>
            <h4 className="text-[12px] font-bold text-slate-800">Appointment Booked</h4>
            <p className="text-[10px] text-slate-500">Your appointment request was placed.</p>
          </div>
        </div>
        
        <div className="flex gap-4 mb-6 relative">
          <div className={`w-5 h-5 rounded-full ${bookingStatus !== 'PENDING' ? 'bg-green-500' : 'bg-slate-200'} border-4 border-white shadow-sm flex items-center justify-center shrink-0 z-10`}>
            {bookingStatus !== 'PENDING' && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
          </div>
          <div>
            <h4 className={`text-[12px] font-bold ${bookingStatus !== 'PENDING' ? 'text-slate-800' : 'text-slate-400'}`}>Confirmed</h4>
            <p className="text-[10px] text-slate-500">Hospital has confirmed your slot.</p>
          </div>
        </div>

        <div className="flex gap-4 relative">
          <div className={`w-5 h-5 rounded-full ${bookingStatus === 'COMPLETED' ? 'bg-blue-500' : 'bg-slate-200'} border-4 border-white shadow-sm flex items-center justify-center shrink-0 z-10`}>
            {bookingStatus === 'COMPLETED' && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
          </div>
          <div>
            <h4 className={`text-[12px] font-bold ${bookingStatus === 'COMPLETED' ? 'text-slate-800' : 'text-slate-400'}`}>Completed</h4>
            <p className="text-[10px] text-slate-500">Visit was completed successfully.</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-3">
        <button 
          onClick={() => navigate('/bookings')}
          className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold text-[13px] shadow-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Calendar className="w-4 h-4" /> View in My Bookings
        </button>
        {bookingStatus !== 'CANCELLED' && bookingStatus !== 'COMPLETED' && (
          <button 
            onClick={() => {
              setBookingStatus('CANCELLED');
              showNotification('Appointment has been cancelled.');
            }}
            className="w-full py-3.5 rounded-xl border border-red-200 text-red-500 font-bold text-[13px] bg-red-50 hover:bg-red-100 transition-colors"
          >
            Cancel Appointment
          </button>
        )}
      </div>
    </div>
  );

  const renderVideoUpcoming = () => {
    // Demo interaction: wait 3 seconds then allow join
    const canJoin = isVideoActive;
    
    return (
      <div className="px-4 py-6 animate-in fade-in slide-in-from-right-4 text-center h-full flex flex-col justify-center min-h-[70vh]">
        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5 relative">
          <VideoIcon className="w-10 h-10 text-blue-500" />
          <div className="absolute top-0 right-0 w-6 h-6 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
        </div>
        
        <h2 className="text-[20px] font-bold text-slate-900 mb-1">Upcoming Consultation</h2>
        <p className="text-[13px] text-blue-600 font-medium mb-6">Dr. {selectedDoctor.name.split(' ')[1]}</p>
        
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mx-auto max-w-[280px] mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[11px] text-slate-500 font-bold">Consultation ID</span>
            <span className="text-[12px] font-bold text-slate-900">{bookingId}</span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-[11px] text-slate-500 font-bold">Date</span>
            <span className="text-[12px] font-bold text-slate-900">{selectedDate}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-slate-500 font-bold">Time</span>
            <span className="text-[12px] font-bold text-slate-900">{selectedTime}</span>
          </div>
        </div>

        {!canJoin ? (
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-600 px-4 py-2 rounded-full text-[12px] font-bold">
              <Clock className="w-4 h-4 animate-spin-slow" />
              Waiting for consultation time...
            </div>
            <p className="text-[10px] text-slate-400 mt-3 cursor-pointer underline" onClick={() => setIsVideoActive(true)}>
              (Demo: Click here to activate slot)
            </p>
          </div>
        ) : (
          <button 
            onClick={() => setView('VIDEO_CALL')}
            className="w-full py-4 rounded-xl bg-green-500 text-white font-bold text-[14px] shadow-md animate-in slide-in-from-bottom-2 flex items-center justify-center gap-2"
          >
            <VideoIcon className="w-5 h-5" /> Join Now
          </button>
        )}
      </div>
    );
  };

  const renderVideoCall = () => (
    <div className="fixed inset-0 z-50 bg-[#111827] flex flex-col animate-in fade-in">
      {/* Header */}
      <div className="p-4 flex items-center justify-between text-white bg-black/40 backdrop-blur-md absolute top-0 left-0 right-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-[13px]">{selectedDoctor.name}</h3>
            <p className="text-[10px] text-slate-300">00:14</p>
          </div>
        </div>
        <div className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 border border-red-500/30">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
          Recording
        </div>
      </div>

      {/* Main Video Area (Doctor) */}
      <div className="flex-1 relative flex items-center justify-center bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-slate-900/50"></div>
        <User className="w-32 h-32 text-slate-700 opacity-50" />
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-[12px]">
          Waiting for doctor's video...
        </div>
        
        {/* PIP (Patient) */}
        <div className="absolute bottom-4 right-4 w-28 h-36 bg-slate-800 rounded-xl border-2 border-white/10 shadow-xl overflow-hidden flex items-center justify-center">
          {camOn ? (
            <User className="w-12 h-12 text-slate-600" />
          ) : (
            <div className="bg-slate-900 w-full h-full flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-red-500" />
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-black/60 backdrop-blur-xl p-6 pb-10 flex items-center justify-center gap-6">
        <button 
          onClick={() => setMicOn(!micOn)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${micOn ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`}
        >
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
        <button 
          onClick={() => {
            setView('VIDEO_COMPLETED');
            setBookingStatus('COMPLETED');
          }}
          className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
        <button 
          onClick={() => setCamOn(!camOn)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${camOn ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`}
        >
          {camOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );

  const renderVideoCompleted = () => (
    <div className="px-4 py-8 animate-in fade-in slide-in-from-right-4 text-center h-full flex flex-col">
      <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-10 h-10 text-blue-500" />
      </div>
      
      <h2 className="text-[20px] font-bold text-slate-900 mb-2">Consultation Completed</h2>
      <p className="text-[12px] text-slate-500 mb-8 max-w-[250px] mx-auto">
        Your video consultation with Dr. {selectedDoctor.name.split(' ')[1]} has ended successfully.
      </p>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-8 text-left mx-auto max-w-sm w-full">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
               <User className="w-5 h-5 text-slate-400" />
             </div>
             <div>
               <div className="font-bold text-slate-800 text-[14px]">{selectedDoctor.name}</div>
               <div className="text-[11px] text-slate-500">Duration: 14 mins 32 secs</div>
             </div>
          </div>
          
          <div className="border-t border-slate-100 pt-4">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Consultation Details</div>
            <div className="flex justify-between mb-2">
              <span className="text-[12px] text-slate-600">Date</span>
              <span className="text-[12px] font-bold text-slate-800">{selectedDate}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-[12px] text-slate-600">Time</span>
              <span className="text-[12px] font-bold text-slate-800">{selectedTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[12px] text-slate-600">ID</span>
              <span className="text-[12px] font-bold text-slate-800">{bookingId}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 mt-auto">
        <button 
          onClick={() => showNotification("Demo: Prescription will be available shortly.")}
          className="w-full py-3.5 rounded-xl bg-blue-50 text-blue-600 font-bold text-[13px] flex items-center justify-center gap-2"
        >
          <FileText className="w-4 h-4" /> View Summary & Prescription
        </button>
        <button 
          onClick={() => setView('LANDING')}
          className="w-full py-3.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-[13px] hover:bg-slate-50"
        >
          Back to Appointments
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-x-hidden">
      
      {/* Dynamic Header */}
      {view !== 'LANDING' && view !== 'VIDEO_CALL' && (
        <div className="bg-white px-4 py-4 flex items-center gap-3 sticky top-0 z-20 border-b border-slate-100">
          <button 
            onClick={handleBack}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-[15px] font-bold text-slate-800">
            {view === 'CATEGORICAL_DISEASES' ? (selectedCategory?.name || 'Categorical Diseases') :
             view === 'HOSPITAL_RESULTS' ? 'Search Results' : 
             view === 'HOSPITAL_DETAILS' ? 'Hospital Details' :
             view === 'DOCTOR_LIST' ? 'Select Doctor' :
             view === 'DOCTOR_PROFILE' ? 'Doctor Profile' :
             view === 'SELECT_SLOT' ? 'Select Slot' :
             view === 'APPOINTMENT_STATUS' ? 'Status' :
             view === 'VIDEO_UPCOMING' ? 'Upcoming' :
             view === 'VIDEO_COMPLETED' ? 'Summary' :
             ''}
          </h2>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pb-24">
        {view === 'LANDING' && renderLanding()}
        {view === 'CATEGORICAL_DISEASES' && renderCategoricalDiseases()}
        {view === 'HOSPITAL_RESULTS' && renderHospitalResults()}
        {view === 'HOSPITAL_DETAILS' && renderHospitalDetails()}
        {view === 'DOCTOR_LIST' && renderDoctorList()}
        {view === 'DOCTOR_PROFILE' && renderDoctorProfile()}
        {view === 'SELECT_SLOT' && renderSelectSlot()}
        {view === 'CONFIRMATION' && renderConfirmation()}
        {view === 'APPOINTMENT_STATUS' && renderAppointmentStatus()}
        {view === 'VIDEO_UPCOMING' && renderVideoUpcoming()}
        {view === 'VIDEO_CALL' && renderVideoCall()}
        {view === 'VIDEO_COMPLETED' && renderVideoCompleted()}
      </div>

      {/* 1. "KNOW YOUR DISEASE" — TILE TO CIRCLE POPUP WITH 5S COLLAPSE & HOVER EXPANSION */}
      {!hasDismissedAiPopup && (view === 'LANDING' || view === 'CATEGORICAL_DISEASES') && (
        <aside
          aria-label="Know Your Disease AI Guide"
          className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40 pointer-events-auto"
          onMouseEnter={() => setIsAiHovered(true)}
          onMouseLeave={() => setIsAiHovered(false)}
        >
          <div className="relative">
            {/* Dismiss 'X' Button on top-right */}
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
              /* Full Expanded Tile (starts visible for 5s, also expands on hover) */
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
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-400"></span>
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
                
                <ChevronLeft className="w-4 h-4 text-slate-400 rotate-180 group-hover:text-white shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ) : (
              /* Compact Floating Circle Popup (after 5 seconds) */
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
        <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg text-[12px] font-medium flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
            {notification}
          </div>
        </div>
      )}
    </div>
  );
};

export default Specialties;
