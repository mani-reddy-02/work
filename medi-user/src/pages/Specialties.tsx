import { useState, useEffect } from 'react';
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

const getDiseasesForCategory = (catId: string, catName: string, rawConditions: any[] = []) => {
  // Return any diseases associated with this category/specialty in the backend
  const backendMatches = rawConditions.filter(c => 
    c.specialtyId === catId || (c.specialtyName && c.specialtyName.toLowerCase().includes(catName.toLowerCase()))
  );

  return backendMatches.map((bm, idx) => ({
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
  | 'REVIEW'
  | 'CONFIRMATION'
  | 'APPOINTMENT_STATUS'
  | 'VIDEO_UPCOMING'
  | 'VIDEO_CALL'
  | 'VIDEO_COMPLETED';

const Specialties = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = searchParams.get('type') || 'hospital-op';
  const isVideo = type === 'video-consult' || type === 'doctor';
  const { user } = useAuth();

  // State Management
  const [view, setView] = useState<ViewState>('LANDING');
  const [activeTab, setActiveTab] = useState('general');
  const [showAllGeneral, setShowAllGeneral] = useState(false);
  const [showAllAdvanced, setShowAllAdvanced] = useState(false);
  const [showAllCategorical, setShowAllCategorical] = useState(false);
  
  // Real Data State
  const [diseasesList, setDiseasesList] = useState({
    general: [] as any[],
    advanced: [] as any[],
    categorical: [] as any[],
    raw: [] as any[]
  });
  const [hospitalsList, setHospitalsList] = useState<any[]>([]);
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [allSlots, setAllSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [expiredSlots, setExpiredSlots] = useState<string[]>([]);
  const [isHospitalsLoading, setIsHospitalsLoading] = useState(false);
  const [isDoctorsLoading, setIsDoctorsLoading] = useState(false);
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
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

  // Know Your Disease AI Modal state
  const [showAiModal, setShowAiModal] = useState(false);

  // Fetch real diseases on mount
  useEffect(() => {
    let mounted = true;
    opAppointmentApi.fetchDiseases().then((res) => {
      if (mounted && res.success && res.data) {
        
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
      }
    }).catch(() => {});

    return () => { mounted = false; };
  }, []);

  // Fetch real hospitals when entering hospital view or changing search/disease
  useEffect(() => {
    if (view === 'HOSPITAL_RESULTS' || view === 'HOSPITAL_DETAILS') {
      let active = true;
      setHospitalsList([]);
      setIsHospitalsLoading(true);
      hospitalApi.getHospitals({ search: hospitalSearch, conditionId: selectedDisease?.id }).then((res) => {
        if (active) {
          setIsHospitalsLoading(false);
          if (res.success && res.data) {
            setHospitalsList(res.data);
          } else {
            setHospitalsList([]);
          }
        }
      }).catch(() => {
        if (active) {
          setIsHospitalsLoading(false);
          setHospitalsList([]);
        }
      });
      return () => { active = false; };
    }
  }, [view, hospitalSearch, selectedDisease]);

  // Fetch real doctors when entering doctor list
  useEffect(() => {
    if (view === 'DOCTOR_LIST' || view === 'DOCTOR_PROFILE' || (view === 'HOSPITAL_DETAILS' && selectedDisease)) {
      let active = true;
      setDoctorsList([]);
      setIsDoctorsLoading(true);
      if (selectedHospital?.id) {
        hospitalApi.getHospitalDoctors(selectedHospital.id, selectedDepartment || undefined, selectedDisease?.id).then((res) => {
          if (active) {
            setIsDoctorsLoading(false);
            if (res.success && res.data) {
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
      } else {
        doctorApi.getDoctors({
          search: hospitalSearch,
          departmentId: selectedDepartment || undefined,
          specialtyId: selectedDisease?.specialtyId,
          conditionId: selectedDisease?.id
        }).then((res) => {
          if (active) {
            setIsDoctorsLoading(false);
            if (res.success && res.data) {
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
      }
      return () => { active = false; };
    }
  }, [view, selectedHospital, selectedDepartment, hospitalSearch, selectedDisease]);

  // Fetch real availability when selecting slots
  useEffect(() => {
    if (view === 'SELECT_SLOT' && selectedDoctor?.id) {
      let active = true;
      setIsSlotsLoading(true);
      setAvailableSlots([]);
      setAllSlots([]);
      setBookedSlots([]);
      setExpiredSlots([]);
      const queryDate = selectedDateIso || new Date().toISOString().split('T')[0];
      const slotType = isVideo ? 'VIDEO' : 'OP';
      opAppointmentApi.fetchDoctorAvailability(selectedDoctor.id, queryDate, slotType).then((res) => {
        if (active) {
          setIsSlotsLoading(false);
          if (res.success && res.data) {
            setIsDoctorAvailable(res.data.isAvailable !== false);
            setAvailableSlots(res.data.availableSlots || []);
            setAllSlots(res.data.allSlots || []);
            setBookedSlots(res.data.bookedSlots || []);
            setExpiredSlots(res.data.expiredSlots || []);
          } else {
            setAvailableSlots([]);
            setAllSlots([]);
            setBookedSlots([]);
            setExpiredSlots([]);
            setIsDoctorAvailable(false);
          }
        }
      }).catch(() => {
        if (active) {
          setIsSlotsLoading(false);
          setAvailableSlots([]);
          setAllSlots([]);
          setBookedSlots([]);
          setExpiredSlots([]);
          setIsDoctorAvailable(false);
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
      const matchedCategory = diseasesList.categorical.find(
        c => c.name.toLowerCase() === categoryQuery.toLowerCase()
      );
      if (matchedCategory) {
        handleCategorySelect(matchedCategory);
      }
    }
  }, [searchParams, diseasesList.categorical]);

  // Reset state when tab changes
  useEffect(() => {
    setView('LANDING');
    setSelectedHospital(null);
    setSelectedDoctor(null);
    setSelectedDisease(null);
    setSelectedCategory(null);
    setCategoricalDiseaseSearch('');
    setDiseaseSearch('');
    setHospitalSearch('');
    setBookingError('');
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
        setView(selectedDisease ? 'HOSPITAL_DETAILS' : 'DOCTOR_LIST');
        break;
      case 'SELECT_SLOT':
        setView('DOCTOR_PROFILE');
        break;
      case 'REVIEW':
        setView('SELECT_SLOT');
        break;
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
      setBookingStatus('CONFIRMED');
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
      
      {!hasResults ? (
        <div className="text-center py-8">
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
                          ) : (
                              <item.icon className={`w-8 h-8`} />
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
                          ) : (
                              <item.icon className={`w-8 h-8`} />
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
                       ) : (
                           <cat.icon className={`w-8 h-8`} />
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
    
    const categoryDiseases = getDiseasesForCategory(selectedCategory.id, selectedCategory.name, diseasesList.raw);
    const query = categoricalDiseaseSearch.toLowerCase().trim();
    const filtered = query
      ? categoryDiseases.filter(d => (d?.name || (d as any)?.title || '').toLowerCase().includes(query) || (d?.desc && typeof d.desc === 'string' && d.desc.toLowerCase().includes(query)))
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

        {/* General Category Consultation Option */}
        <div 
          onClick={() => handleDiseaseSelect(selectedCategory)}
          className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border border-blue-200/70 hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-blue-600 flex items-center justify-center shrink-0 shadow-sm border border-blue-100 group-hover:scale-105 transition-transform overflow-hidden p-1">
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
                <Stethoscope className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                  General {selectedCategory.name} Consultation
                </h3>
                <span className="text-[10px] font-semibold text-blue-600 bg-white px-2 py-0.5 rounded-full border border-blue-100">
                  All Conditions
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Not sure of exact condition? Consult any {selectedCategory.name} specialist
              </p>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-blue-500 shrink-0 rotate-180 group-hover:translate-x-0.5 transition-transform" />
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
              {filtered.map((item) => {
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
                    onClick={() => { setSelectedDoctor(doc); setView('DOCTOR_PROFILE'); }}
                    className="w-full mt-4 py-2.5 rounded-xl bg-blue-50 text-blue-600 font-bold text-[12px]"
                  >
                    View Doctor
                  </button>
                </div>
              ))}
            </div>
          )}
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
                onClick={() => { setSelectedDoctor(doc); setView('DOCTOR_PROFILE'); }}
                className="w-full mt-4 py-2.5 rounded-xl bg-blue-50 text-blue-600 font-bold text-[12px]"
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

  const renderDoctorProfile = () => (
    <div className="px-4 py-6 max-w-md md:max-w-2xl mx-auto animate-in fade-in slide-in-from-right-4">
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-4 text-center">
        <div className="w-20 h-20 rounded-full bg-slate-100 mx-auto flex items-center justify-center mb-3 overflow-hidden">
          {selectedDoctor.avatar ? (
            <img src={selectedDoctor.avatar} alt={selectedDoctor.name} className="w-full h-full object-cover" />
          ) : (
            <User className="w-10 h-10 text-slate-400" />
          )}
        </div>
        <h2 className="font-bold text-slate-900 text-[18px] mb-0.5">{selectedDoctor.name}</h2>
        <p className="text-[12px] text-blue-600 font-medium mb-1">{selectedDoctor.specialization}</p>
        <p className="text-[11px] text-slate-500 mb-3">{selectedDoctor.qualification} • {selectedDoctor.experience}</p>
        
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-600 mb-4 bg-slate-50 py-2 rounded-xl">
          <span className="flex items-center gap-1"><Hospital className="w-4 h-4 text-blue-500" /> {selectedDoctor.hospitalName}</span>
          <span className="flex items-center gap-1"><Activity className="w-4 h-4 text-blue-500" /> {selectedDoctor.department}</span>
        </div>
        
        <p className="text-[11px] text-slate-600 text-left bg-blue-50/50 p-3 rounded-xl">
          <span className="font-bold block mb-1">Consultation Information:</span>
          {selectedDoctor.consultInfo}
        </p>
      </div>

      <h3 className="font-bold text-slate-800 text-[15px] mb-3">Availability</h3>
      <p className="text-[11px] text-slate-500 mb-4 flex items-center gap-1">
        <AlertCircle className="w-3.5 h-3.5" /> Select an available slot to proceed
      </p>

      <button 
        onClick={() => setView('SELECT_SLOT')}
        className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold text-[13px] shadow-sm"
      >
        {isVideo ? 'Book Video Consultation' : 'Book Appointment'}
      </button>
    </div>
  );

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

        <button 
          disabled={!selectedTime}
          onClick={() => setView('REVIEW')}
          className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold text-[13px] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    );
  };


  const renderReview = () => (
    <div className="px-4 py-6 max-w-md md:max-w-2xl mx-auto animate-in fade-in slide-in-from-right-4">
      <h2 className="text-[15px] font-bold text-slate-800 mb-4">Review {isVideo ? 'Video Consultation' : 'Appointment'}</h2>
      
      {bookingError && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{bookingError}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Patient</div>
            <div className="font-bold text-slate-900 text-[14px]">{user?.name || 'Patient'}</div>
            {user?.phone && <div className="text-[11px] text-slate-500">{user.phone}</div>}
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
            {isVideo ? 'Video Consultation' : 'OP Appointment'}
          </span>
        </div>
        
        <div className="p-4 border-b border-slate-100">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Doctor</div>
          <div className="font-bold text-slate-900 text-[14px]">{selectedDoctor.name}</div>
          <div className="text-[11px] text-blue-600">{selectedDoctor.specialization}</div>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Hospital</div>
            <div className="font-bold text-slate-800 text-[13px]">{selectedDoctor.hospitalName}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Department</div>
            <div className="font-bold text-slate-800 text-[13px]">{selectedDoctor.department}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Date</div>
              <div className="font-bold text-slate-800 text-[13px]">{selectedDate}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Time</div>
              <div className="font-bold text-slate-800 text-[13px]">{selectedTime}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button 
          onClick={() => setView('SELECT_SLOT')}
          className="flex-1 py-3.5 rounded-xl border border-blue-600 text-blue-600 font-bold text-[13px]"
        >
          Edit
        </button>
        <button 
          disabled={isSubmitting}
          onClick={confirmBooking}
          className="flex-1 py-3.5 rounded-xl bg-blue-600 text-white font-bold text-[13px] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
    </div>
  );

  const renderConfirmation = () => (
    <div className="px-4 py-8 text-center max-w-md md:max-w-xl mx-auto animate-in zoom-in-95 duration-500">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 relative">
        <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
        <CheckCircle2 className="w-10 h-10 text-green-500" />
      </div>
      
      <h2 className="text-[20px] font-bold text-slate-900 mb-2">
        {isVideo ? 'Video Consultation Scheduled' : 'Appointment Confirmed'}
      </h2>
      <p className="text-[12px] text-slate-500 mb-6 max-w-[250px] mx-auto">
        Your {isVideo ? 'consultation' : 'appointment'} has been successfully booked.
      </p>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-8 text-left mx-auto max-w-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <span className="text-[11px] text-slate-500 font-bold">Booking ID</span>
          <span className="text-[13px] font-bold text-slate-900">{bookingId}</span>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-[11px] text-slate-500">Status</span>
            <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">{isVideo ? 'Scheduled' : 'Confirmed'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[11px] text-slate-500">Doctor</span>
            <span className="text-[12px] font-bold text-slate-800">{selectedDoctor.name}</span>
          </div>
          {!isVideo && (
            <div className="flex justify-between">
              <span className="text-[11px] text-slate-500">Hospital</span>
              <span className="text-[12px] font-bold text-slate-800">{selectedDoctor.hospitalName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-[11px] text-slate-500">Date & Time</span>
            <span className="text-[12px] font-bold text-slate-800">{selectedDate}, {selectedTime}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button 
          onClick={() => setView(isVideo ? 'VIDEO_UPCOMING' : 'APPOINTMENT_STATUS')}
          className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold text-[13px] shadow-sm hover:bg-blue-700 transition-colors"
        >
          View {isVideo ? 'Consultation' : 'Appointment'}
        </button>
        <button 
          onClick={() => navigate('/bookings')}
          className="w-full py-3.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[13px] hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
        >
          <Calendar className="w-4 h-4" /> Go to My Bookings
        </button>
        <button 
          onClick={() => navigate('/', { state: { bookingSuccess: true, newBooking: { serviceType: isVideo ? 'Video Consultation' : 'OP Consultation', provider: 'Dr. ' + selectedDoctor.name, date: selectedDate, time: selectedTime, bookingId: bookingId } }, replace: true })}
          className="w-full py-3.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-[13px] hover:bg-slate-50 transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  );

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
             view === 'REVIEW' ? 'Review Details' :
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
        {view === 'REVIEW' && renderReview()}
        {view === 'CONFIRMATION' && renderConfirmation()}
        {view === 'APPOINTMENT_STATUS' && renderAppointmentStatus()}
        {view === 'VIDEO_UPCOMING' && renderVideoUpcoming()}
        {view === 'VIDEO_CALL' && renderVideoCall()}
        {view === 'VIDEO_COMPLETED' && renderVideoCompleted()}
      </div>

      {/* 3. "KNOW YOUR DISEASE" — FLOATING AI TILE */}
      <aside aria-label="Know Your Disease AI Guide" className="fixed bottom-24 right-4 md:right-8 z-30 max-w-[280px] sm:max-w-[320px] pointer-events-auto">
        <button
          type="button"
          onClick={() => setShowAiModal(true)}
          className="group w-full flex items-center gap-3 p-2.5 sm:p-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-2xl shadow-xl shadow-indigo-900/30 border border-indigo-500/40 hover:border-indigo-400 hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all text-left backdrop-blur-md"
        >
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-400"></span>
            </span>
          </div>
          
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-bold text-white tracking-tight leading-none truncate">
                Know Your Disease
              </span>
              <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300 shrink-0" />
            </div>
            <p className="text-[10px] text-slate-300 font-medium leading-tight mt-1 truncate">
              Not sure what you're experiencing? Get AI help
            </p>
          </div>
          
          <ChevronLeft className="w-4 h-4 text-slate-400 rotate-180 group-hover:text-white shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </aside>

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
