import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Activity,
  Search,
  ChevronRight,
  Clock,
  MapPin,
  TestTube,
  Home,
  FileText,
  Droplet,
  Apple,
  ShieldAlert,
  Heart,
  CheckCircle,
  FileCheck,
  User,
  Calendar,
  Pipette,
  X,
  Building2,
  AlertCircle,
  RefreshCw,
  CreditCard,
  ShieldCheck,
  Check,
  Plus,
  Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../lib/profile';
import {
  labTestApi,
  type LabTestRecord,
  type LaboratoryRecord,
  type LabBookingRecord,
  labBookingApi
} from '../lib/labTestApi';
import { profileApi } from '../lib/profileApi';
import HowItWorks from '../components/HowItWorks';
import { getTestIcon, getHealthConcernIcon, parseDatePill } from '../lib/optimizedTestIcons';
import { useUIStore } from '../lib/uiStore';
import PrePaymentReviewsSummary from '../components/PrePaymentReviewsSummary';
import ProviderReviewsModal from '../components/ProviderReviewsModal';

const labBookingStepsData = [
  { id: '01', title: 'Select Test', desc: 'Browse or search diagnostic tests and health packages.', icon: TestTube },
  { id: '02', title: 'Select Lab', desc: 'Choose a verified certified laboratory near you.', icon: Building2 },
  { id: '03', title: 'Slot & Time Selection', desc: 'Pick a convenient date and time slot for your appointment.', icon: Calendar },
  { id: '04', title: 'Review', desc: 'Verify patient details, test summary, and price breakdown.', icon: FileText },
  { id: '05', title: 'Confirmation Booking', desc: 'Get your instant appointment reference and token details.', icon: CheckCircle }
];

const homeSampleStepsData = labBookingStepsData;

const healthConcerns = [
  { id: 'diabetes', name: 'Diabetes', icon: Droplet, color: 'text-indigo-500', bg: 'bg-indigo-100' },
  { id: 'heart', name: 'Heart', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-100' },
  { id: 'thyroid', name: 'Thyroid', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-100' },
  { id: 'liver', name: 'Liver', icon: Activity, color: 'text-yellow-500', bg: 'bg-yellow-100' },
  { id: 'kidney', name: 'Kidney', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-100' },
  { id: 'fever', name: 'Fever', icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-100' },
  { id: 'vitamins', name: 'Vitamins', icon: Apple, color: 'text-orange-500', bg: 'bg-orange-100' },
];

// Initial fallback tests to ensure instant synchronous test rendering
const initialTests: any[] = [];

const diagnosticPackages: any[] = [];

type ViewState =
  | 'LIST'
  | 'CONCERN_RESULTS'
  | 'TEST_DETAIL'
  | 'LAB_SELECT'
  | 'HOME_COLLECTION'
  | 'PATIENT'
  | 'DATE_TIME'
  | 'REVIEW'
  | 'PAYMENT'
  | 'CONFIRMED'
  | 'STATUS';

const LabTestList = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { userLocation, setNearbyRadiusKm } = useUIStore();
  
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isOtherAddress, setIsOtherAddress] = useState(false);

  const handleAddressSelected = (addr: any) => {
    setPatientDetails(prev => ({ ...prev, address: `${addr.street}, ${addr.city}, ${addr.state ? addr.state + ' ' : ''}${addr.pincode}` }));
  };

  useEffect(() => {
    if (profile?.address) {
      try {
        const parsed = JSON.parse(profile.address);
        if (Array.isArray(parsed)) {
          setSavedAddresses(parsed);
          if (parsed.length > 0 && !selectedAddressId && !isOtherAddress) {
            setSelectedAddressId(parsed[0].id);
            handleAddressSelected(parsed[0]);
          }
        }
      } catch (e) {}
    } else {
      setSavedAddresses([]);
    }
  }, [profile.address]);

  const [viewState, setViewState] = useState<ViewState>('LIST');
  const [showAll, setShowAll] = useState(false);
  const [showAllPackages, setShowAllPackages] = useState(false);
  const [tests, setTests] = useState<any[]>(initialTests);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState(false);
  
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState('All Tests');
  const [selectedConcern, setSelectedConcern] = useState<string | null>(null);
  const [categoryTabs, setCategoryTabs] = useState<string[]>([
    'All Tests',
    'Blood Tests',
    'Diabetes',
    'Heart',
    'Thyroid',
    'Liver',
    'Kidney',
    'Vitamins',
  ]);
  const [dynamicHealthConcerns, setDynamicHealthConcerns] = useState<string[]>([
    'Diabetes',
    'Heart',
    'Thyroid',
    'Liver',
    'Kidney',
    'Fever',
    'Vitamins',
  ]);

  // Laboratories for selected test
  const [laboratories, setLaboratories] = useState<LaboratoryRecord[]>([]);
  const [selectedLab, setSelectedLab] = useState<LaboratoryRecord | null>(null);
  const [labSearchQuery, setLabSearchQuery] = useState('');
  const [isLoadingLabs, setIsLoadingLabs] = useState(false);
  const [labError, setLabError] = useState<string | null>(null);
  const [reviewModalLab, setReviewModalLab] = useState<LaboratoryRecord | null>(null);

  // Patient details state
  const [patientDetails, setPatientDetails] = useState({
    name: 'Mani Kanta',
    age: '30',
    gender: 'Male',
    phone: '9876543210',
    email: '',
    address: 'Madhapur, Hyderabad, 500081',
  });

  // Standard 7-day booking horizon independent from slot availability
  const getStandardBookingDates = (count = 7): { label: string; date: string }[] => {
    const dates = [];
    const now = new Date();
    for (let i = 0; i < count; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      let label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      if (i === 0) label = 'Today';
      else if (i === 1) label = 'Tomorrow';

      dates.push({
        label,
        date: isoDate
      });
    }
    return dates;
  };

  // Date & Time availability
  const [availableDates, setAvailableDates] = useState<{ label: string; date: string }[]>(() => getStandardBookingDates(7));
  const [availableSlots, setAvailableSlots] = useState<{ slot: string; available: boolean }[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = getStandardBookingDates(7);
    return d.length > 0 ? d[0].date : '';
  });
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  const slotRequestSeqRef = useRef<number>(0);

  // Booking & payment state
  const [paymentMethod, setPaymentMethod] = useState<'ONLINE'>('ONLINE');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [createdBooking, setCreatedBooking] = useState<LabBookingRecord | null>(null);

  // Load real tests from backend on mount
  const loadInitialData = async () => {
    try {
      const [testsRes, catsRes, concernsRes] = await Promise.all([
        labTestApi.getLabTests(),
        labTestApi.getCategories(),
        labTestApi.getHealthConcerns()
      ]);

      if (testsRes.success && testsRes.data && testsRes.data.length > 0) {
        // Merge database tests with styling metadata
        const mapped = testsRes.data.map((t) => ({
          ...t,
          collection: t.homeCollectionAvailable ? 'Free laboratory visit' : 'Lab Visit Only',
          fasting: t.preparation?.toLowerCase().includes('fasting') ? 'Fasting Required' : 'No Fasting',
        }));
        setTests(mapped);
      }
      if (catsRes.success && catsRes.data && catsRes.data.length > 0) {
        setCategoryTabs(catsRes.data);
      }
      if (concernsRes.success && concernsRes.data && concernsRes.data.length > 0) {
        setDynamicHealthConcerns(concernsRes.data);
      }
    } catch {
      // Fallback to initial tests on network error
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Real Backend Search
  useEffect(() => {
    let active = true;
    if (!debouncedSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const search = async () => {
      setIsSearching(true);
      try {
        const res = await labTestApi.getLabTests({ search: debouncedSearchQuery.trim() });
        if (active && res.success && res.data) {
          const mapped = res.data.map((t) => ({
            ...t,
            collection: t.homeCollectionAvailable ? 'Free laboratory visit' : 'Lab Visit Only',
            fasting: t.preparation?.toLowerCase().includes('fasting') ? 'Fasting Required' : 'No Fasting',
          }));
          setSearchResults(mapped);
        }
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        if (active) setIsSearching(false);
      }
    };
    search();
    return () => {
      active = false;
    };
  }, [debouncedSearchQuery]);

  // Pre-load user profile if authenticated
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileRes = await profileApi.getProfile();
        if (profileRes.success && profileRes.data) {
          setPatientDetails((prev) => ({
            ...prev,
            name: profileRes.data?.name || prev.name,
            phone: profileRes.data?.phone || prev.phone,
            email: profileRes.data?.email || prev.email,
            gender: profileRes.data?.gender || prev.gender,
          }));
        }
      } catch {
        // Non-critical, preserve defaults
      }
    };
    loadProfile();
  }, []);

  // Load eligible laboratories when moving to HOME_COLLECTION
  const loadEligibleLaboratories = async (testId: string) => {
    setIsLoadingLabs(true);
    setLabError(null);
    try {
      const res = await labTestApi.getLaboratoriesForTest(testId, {
        lat: userLocation.latitude ?? undefined,
        lng: userLocation.longitude ?? undefined,
        radius: userLocation.radiusKm,
        nearbyOnly: true
      });
      if (res.success && res.data && res.data.length > 0) {
        setLaboratories(res.data);
        setSelectedLab(res.data[0]);
      } else {
        setLaboratories([]);
        setSelectedLab(null);
        setLabError(res.error || 'No eligible hospitals or laboratories found near your selected location.');
      }
    } catch {
      setLabError('Unable to load laboratories. Please try again.');
    } finally {
      setIsLoadingLabs(false);
    }
  };

  // Reload laboratories if user updates location while viewing lab list
  useEffect(() => {
    if ((viewState === 'HOME_COLLECTION' || viewState === 'LAB_SELECT') && selectedItem?.id) {
      loadEligibleLaboratories(selectedItem.id);
    }
  }, [userLocation.latitude, userLocation.longitude, userLocation.radiusKm]);

  // Load slots dynamically when lab or date changes
  const loadSlots = async (labId: string, dateStr: string) => {
    const reqSeq = ++slotRequestSeqRef.current;
    setIsLoadingSlots(true);
    setSlotError(null);
    try {
      const res = await labTestApi.getLaboratoryAvailability(labId, dateStr);
      if (reqSeq !== slotRequestSeqRef.current) {
        return; // Discard stale response
      }
      if (res.success && res.data) {
        setAvailableSlots(res.data.slots || []);
        if (res.data.availableDates && res.data.availableDates.length >= 7) {
          setAvailableDates(res.data.availableDates);
        }
      } else {
        setAvailableSlots([]);
        setSlotError(res.error || 'Failed to load time slots');
      }
    } catch (err: any) {
      if (reqSeq === slotRequestSeqRef.current) {
        setAvailableSlots([]);
        setSlotError(err.message || 'Unable to connect to laboratory service');
      }
    } finally {
      if (reqSeq === slotRequestSeqRef.current) {
        setIsLoadingSlots(false);
      }
    }
  };

  const handleDateChange = (newDate: string) => {
    if (newDate === selectedDate) return;
    setSelectedDate(newDate);
    setSelectedTime(''); // Clear slot when date changes
    if (selectedLab) {
      loadSlots(selectedLab.id, newDate);
    }
  };

  const q = debouncedSearchQuery.toLowerCase().trim();
  const sourceTests = q ? searchResults : tests;

  const filteredByCategory =
    selectedTab === 'All Tests'
      ? sourceTests
      : sourceTests.filter(
          (t) =>
            (t?.category || '').toLowerCase() === selectedTab.toLowerCase() ||
            ((t as any)?.categories && (t as any)?.categories.includes(selectedTab))
        );

  const filteredByConcern =
    !selectedConcern || selectedConcern === 'all'
      ? filteredByCategory
      : filteredByCategory.filter(
          (t) =>
            (t?.concern || '').toLowerCase() === selectedConcern.toLowerCase() ||
            (t?.category || '').toLowerCase() === selectedConcern.toLowerCase() ||
            (t?.healthConcern || '').toLowerCase() === selectedConcern.toLowerCase()
        );

  const filteredTests = filteredByConcern;

  const allPackages = sourceTests.filter((t) => (t?.category || '').toLowerCase().includes('package'));
  const allNonPackages = filteredTests.filter((t) => !(t?.category || '').toLowerCase().includes('package'));

  const filteredPackages = allPackages;

  const displayedTests = showAll || q ? allNonPackages : allNonPackages.slice(0, 8);
  const hasResults = displayedTests.length > 0 || filteredPackages.length > 0;

  const handleSelectTest = (item: any) => {
    setSelectedItem(item);
    setSelectedLab(null);
    setSelectedTime('');
    if (item?.id) {
      loadEligibleLaboratories(item.id);
    }
    setViewState('LAB_SELECT');
  };

  const handleProceedToLabSelect = () => {
    if (selectedItem?.id) {
      loadEligibleLaboratories(selectedItem.id);
    }
    setViewState('LAB_SELECT');
  };

  const handleProceedToDateTime = () => {
    if (!selectedLab) {
      alert('Please select a laboratory.');
      return;
    }
    const targetDate = selectedDate || availableDates[0]?.date || '';
    if (!selectedDate && targetDate) {
      setSelectedDate(targetDate);
    }
    setSelectedTime('');
    if (selectedLab && targetDate) {
      loadSlots(selectedLab.id, targetDate);
    }
    setViewState('DATE_TIME');
  };

  const handleProceedToPatient = () => {
    handleProceedToDateTime();
  };

  const handleProceedToReview = () => {
    if (!selectedDate || !selectedTime) {
      alert('Please select visit date and time slot.');
      return;
    }
    setViewState('REVIEW');
  };

  const handleProceedToPayment = () => {
    handleProceedToReview();
  };

  // Submit real booking
  const handleConfirmAndPay = async () => {
    if (!selectedItem || !selectedLab) return;

    if (!patientDetails.name.trim() || !patientDetails.phone.trim()) {
      setBookingError('Please provide patient name and contact phone number.');
      return;
    }

    setIsSubmittingBooking(true);
    setBookingError(null);

    const token = localStorage.getItem('mediquee_token');
    if (!token) {
      setIsSubmittingBooking(false);
      setBookingError('Please log in to complete your laboratory visit booking.');
      return;
    }

    try {
      const res = await labBookingApi.createLabBooking({
        testId: selectedItem.id,
        laboratoryId: selectedLab.id,
        bookingDate: selectedDate,
        timeSlot: selectedTime,
        collectionType: 'LAB_VISIT',
        patientName: patientDetails.name.trim(),
        patientAge: patientDetails.age ? parseInt(patientDetails.age, 10) : undefined,
        patientGender: patientDetails.gender,
        patientPhone: patientDetails.phone.trim(),
        patientEmail: patientDetails.email?.trim() || undefined,
      });

      if (!res.success || !res.data) {
        if (res.error?.includes('conflict') || res.error?.includes('already booked')) {
          setBookingError('The selected time slot is no longer available. Please choose another slot.');
          setViewState('DATE_TIME');
          loadSlots(selectedLab.id, selectedDate);
        } else {
          setBookingError(res.error || 'Failed to confirm booking. Please try again.');
        }
        setIsSubmittingBooking(false);
        return;
      }

      setCreatedBooking(res.data);
      setViewState('CONFIRMED');
    } catch (err: any) {
      setBookingError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleBack = () => {
    switch (viewState) {
      case 'LIST':
        navigate(-1);
        break;
      case 'CONCERN_RESULTS':
        setViewState('LIST');
        setSelectedConcern(null);
        setSearchQuery('');
        break;
      case 'HOME_COLLECTION':
      case 'LAB_SELECT':
        if (selectedConcern) {
          setViewState('CONCERN_RESULTS');
        } else {
          setViewState('LIST');
        }
        break;
      case 'PATIENT':
        setViewState('LAB_SELECT');
        break;
      case 'DATE_TIME':
        setViewState('LAB_SELECT');
        break;
      case 'REVIEW':
      case 'PAYMENT':
        setViewState('DATE_TIME');
        break;
      case 'CONFIRMED':
        setViewState('LIST');
        break;
      case 'STATUS':
        setViewState('CONFIRMED');
        break;
      default:
        navigate(-1);
    }
  };

  // Helper for Stepper Progress
  const getCurrentStepNumber = (): 1 | 2 | 3 | 4 | 5 => {
    if (viewState === 'LIST' || viewState === 'CONCERN_RESULTS' || (viewState as string) === 'TEST_DETAIL') return 1;
    if (viewState === 'LAB_SELECT' || viewState === 'HOME_COLLECTION') return 2;
    if (viewState === 'DATE_TIME') return 3;
    if (viewState === 'REVIEW' || viewState === 'PAYMENT' || viewState === 'PATIENT') return 4;
    return 5;
  };

  const renderStepper = () => {
    const currentStep = getCurrentStepNumber();
    const steps = [
      { num: 1, label: 'Test' },
      { num: 2, label: 'Lab' },
      { num: 3, label: 'Slot' },
      { num: 4, label: 'Review' },
      { num: 5, label: 'Confirm' },
    ];

    return (
      <div className="bg-white border-b border-slate-200/80 px-4 py-3 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-md md:max-w-xl mx-auto flex items-center justify-between">
          {steps.map((s, idx) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center flex-1 max-w-[62px]">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      isCompleted
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-xs'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : s.num}
                  </div>
                  <span
                    className={`text-[10px] mt-1 font-semibold truncate text-center ${
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
                    className={`flex-1 h-0.5 mx-1 transition-all duration-300 ${
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

  const handlePatientChange = (e: any) => {
    setPatientDetails((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Price calculations
  const effectiveTestPrice = selectedLab ? selectedLab.numericPrice : (selectedItem?.numericPrice || 0);
  const effectiveCollectionFee = selectedLab ? selectedLab.homeCollectionFee || 0 : 0;
  const effectiveTotal = effectiveTestPrice + effectiveCollectionFee;

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-x-hidden">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Header */}
      <div className="bg-gradient-to-r from-[#0055ff] to-[#06b6d4] pt-4 pb-5 px-4 text-white shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={handleBack} className="p-1.5 hover:bg-white/20 rounded-full transition-colors" aria-label="Go back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[17px] font-bold truncate">
              {viewState === 'LIST' ? 'Laboratory Visit' :
               viewState === 'CONCERN_RESULTS' ? (selectedConcern ? `${selectedConcern} Tests` : 'Concern Tests') :
               viewState === 'TEST_DETAIL' ? 'Select Test' :
               viewState === 'LAB_SELECT' ? 'Select Lab' :
               viewState === 'DATE_TIME' ? 'Slot & Time Selection' :
               viewState === 'REVIEW' || viewState === 'PAYMENT' ? 'Review & Pay' :
               viewState === 'CONFIRMED' ? 'Confirmation Booking' :
               viewState === 'STATUS' ? 'Sample Status' :
               'Laboratory Visit'}
            </h1>
            {viewState !== 'LIST' && selectedItem?.name && (
              <p className="text-[11px] text-blue-100 mt-0.5 truncate max-w-xs">
                Test: {selectedItem.name}
              </p>
            )}
          </div>
        </div>

        {viewState === 'LIST' && (
          <div className="relative max-w-md md:max-w-xl mx-auto">
            {searchMode ? (
              <button 
                onClick={() => { setSearchMode(false); setSearchQuery(''); }}
                className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 hover:text-slate-800 z-10"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : (
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
            )}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchMode(true)}
              className="block w-full pl-10 pr-10 py-2.5 border-0 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-white/50 shadow-lg text-[13px] font-medium"
              placeholder="Search tests, packages, health concerns..."
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
              >
                <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 5-Step Progress Stepper (Visible across booking steps) */}
      {viewState !== 'STATUS' && renderStepper()}

      <div className="flex-1 overflow-y-auto pb-24">
        {/* VIEW: LIST */}
        {viewState === 'LIST' && (
          <div>
            {q && isSearching ? (
              <div className="bg-white p-8 rounded-2xl mx-4 my-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm font-bold text-slate-800">Searching Tests...</p>
                <p className="text-xs text-slate-400 mt-1">Fetching from MediQuee...</p>
              </div>
            ) : q && !hasResults ? (
              <div className="text-center py-8">
                <p className="text-[14px] text-slate-500 font-bold">No matching tests found</p>
              </div>
            ) : (
              <>
                    {/* EXTRAS - ONLY WHEN NOT SEARCHING */}
                    {!q && (
                      <>
                        {/* How it works Marquee */}
                        <HowItWorks title="How laboratory visit Works" steps={homeSampleStepsData} className="pt-6 pb-2 mb-2 shadow-sm" />
                      </>
                    )}

                    {/* SINGLE TESTS SECTION */}
                    {displayedTests.length > 0 ? (
                      <div className="bg-white pt-5 pb-6 mb-2 shadow-sm">
                        <div className="px-4 flex items-center justify-between mb-4">
                          <div>
                            <h2 className="text-[16px] font-bold text-slate-800 uppercase tracking-tight">Single Tests</h2>
                          </div>
                          {filteredByCategory.length > 8 && (
                            <div
                              onClick={() => setShowAll(!showAll)}
                              className="flex items-center text-blue-600 cursor-pointer"
                            >
                              <span className="text-[11px] font-bold">
                                {showAll ? 'Show Less' : 'View All'}
                              </span>
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-y-5 gap-x-3 px-4 relative">
                          {displayedTests.map((item) => {
                            const displayName = item?.name || (item as any)?.testName || (item as any)?.title || 'Test';
                            const iconSrc = getTestIcon(displayName);
                            return (
                              <div
                                key={item.id}
                                onClick={() => handleSelectTest(item)}
                                className="flex flex-col items-center gap-2 cursor-pointer group"
                              >
                                <div
                                  className={`w-14 h-14 md:w-16 md:h-16 rounded-full ${
                                    (item as any).bg || 'bg-orange-50'
                                  } flex items-center justify-center border border-slate-100 group-hover:shadow-lg group-hover:scale-110 transition-all duration-200 overflow-hidden`}
                                >
                                  {iconSrc ? (
                                    <img
                                      src={iconSrc}
                                      alt={displayName.replace(/\n/g, ' ')}
                                      className="w-10 h-10 md:w-12 md:h-12 object-contain"
                                    />
                                  ) : item.icon ? (
                                    <item.icon
                                      className={`w-6 h-6 md:w-7 md:h-7 ${
                                        (item as any).color || 'text-orange-500'
                                      }`}
                                      strokeWidth={1.5}
                                    />
                                  ) : (
                                    <TestTube
                                      className="w-6 h-6 md:w-7 md:h-7 text-orange-500"
                                      strokeWidth={1.5}
                                    />
                                  )}
                                </div>
                                <span className="text-[10px] md:text-[11px] font-bold text-slate-800 text-center leading-tight">
                                  {displayName.replace(/\n/g, ' ')}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white p-6 mb-2 shadow-sm text-center">
                        <p className="text-[14px] text-slate-500 font-bold">No single tests available.</p>
                      </div>
                    )}

                    {/* HEALTH CONCERNS - ONLY WHEN NOT SEARCHING */}
                    {!q && dynamicHealthConcerns.length > 0 && (
                      <div className="bg-white p-4 py-5 mb-2 shadow-sm">
                        <h2 className="text-[16px] font-bold text-slate-800 mb-4">
                          Find Tests by Health Concern
                        </h2>
                        <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-2 mb-2 px-1">
                          {dynamicHealthConcerns.map((concernStr) => {
                            const staticMatch = healthConcerns.find(
                              (c) => c.id.toLowerCase() === concernStr.toLowerCase() || c.name.toLowerCase() === concernStr.toLowerCase()
                            );
                            const bg = staticMatch?.bg || 'bg-blue-50';
                            const iconUrl = getHealthConcernIcon(concernStr);
                            
                            return (
                              <div
                                key={concernStr}
                                onClick={() => {
                                  setSelectedConcern(concernStr);
                                  setViewState('CONCERN_RESULTS');
                                }}
                                className="flex flex-col items-center shrink-0 w-[72px] cursor-pointer group"
                              >
                                <div
                                  className={`w-14 h-14 rounded-full ${bg} flex items-center justify-center mb-1.5 border border-slate-100 group-hover:shadow-lg group-hover:scale-110 transition-all duration-200 overflow-hidden`}
                                >
                                  <img
                                    src={iconUrl}
                                    alt={concernStr}
                                    className="w-9 h-9 object-contain"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).src = '/optimized/Blood Test.webp';
                                    }}
                                  />
                                </div>
                                <span className="text-[11px] font-bold text-center text-slate-700">
                                  {concernStr}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* PACKAGES SECTION */}
                    {filteredPackages.length > 0 ? (
                      <div className="pt-5 pb-6 bg-white shadow-sm mb-2">
                        <div className="flex items-center justify-between mb-4 px-4">
                          <h2 className="text-[16px] font-bold text-slate-800 uppercase tracking-tight">
                            Packages
                          </h2>
                          {filteredPackages.length > 4 && (
                            <button
                              onClick={() => setShowAllPackages(!showAllPackages)}
                              className="flex items-center text-blue-600 cursor-pointer hover:text-blue-700 transition-colors"
                            >
                              <span className="text-[11px] font-bold">
                                {showAllPackages ? 'Show Less' : 'View All'}
                              </span>
                              <ChevronRight
                                className={`w-4 h-4 transition-transform ${
                                  showAllPackages ? '-rotate-90' : ''
                                }`}
                              />
                            </button>
                          )}
                        </div>
                        <div
                          className={
                            showAllPackages
                              ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 px-4'
                              : 'flex overflow-x-auto hide-scrollbar gap-3 pb-2 px-4'
                          }
                        >
                          {filteredPackages.map((item) => (
                            <div
                              key={item.id}
                              className="bg-white rounded-2xl border border-slate-100 shadow-sm min-w-[210px] max-w-[240px] shrink-0 flex flex-col justify-between overflow-hidden hover:shadow-md transition-shadow"
                            >
                              <div
                                className={`h-1.5 w-full bg-gradient-to-r ${
                                  (item as any).color === 'text-blue-600'
                                    ? 'from-blue-500 to-blue-400'
                                    : (item as any).color === 'text-rose-600'
                                    ? 'from-rose-500 to-rose-400'
                                    : (item as any).color === 'text-indigo-600'
                                    ? 'from-indigo-500 to-indigo-400'
                                    : 'from-blue-500 to-cyan-400'
                                }`}
                              ></div>
                              <div className="p-3.5">
                                <div className="mb-3">
                                  <div className="flex items-start gap-2.5 mb-2">
                                    <div
                                      className={`w-10 h-10 rounded-xl ${
                                        (item as any).bg || 'bg-blue-50'
                                      } flex items-center justify-center shrink-0 overflow-hidden`}
                                    >
                                      <img
                                        src={getTestIcon(item.name, item.category || 'package')}
                                        alt={item.name}
                                        className="w-8 h-8 object-contain"
                                        onError={(e) => {
                                          (e.currentTarget as HTMLImageElement).src = '/optimized/Blood Test.webp';
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <h3 className="font-bold text-slate-900 text-[12px] leading-tight mb-0.5 whitespace-pre-line">
                                        {item.name}
                                      </h3>
                                      <p className="text-[9px] text-slate-500 font-medium">
                                        ({(item as any).tests || 'Comprehensive Tests'})
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-medium mb-3">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Results in {(item as any).time || '24 hrs'}</span>
                                </div>
                                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                                  <button
                                    onClick={() => handleSelectTest(item)}
                                    className="flex-1 bg-slate-50 text-slate-700 border border-slate-200 py-1.5 rounded-lg text-[10px] font-bold hover:bg-slate-100 transition-colors"
                                  >
                                    View Package
                                  </button>
                                  <button
                                    onClick={() => handleSelectTest(item)}
                                    className={`flex-1 text-white py-1.5 rounded-lg text-[10px] font-bold ${
                                      (item as any).btnBg || 'bg-[#0055ff]'
                                    } hover:opacity-90 transition-opacity shadow-sm`}
                                  >
                                    Book Package
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white p-6 mb-2 shadow-sm text-center">
                        <p className="text-[14px] text-slate-500 font-bold">No packages available.</p>
                      </div>
                    )}
              </>
            )}
          </div>
        )}

        {/* VIEW: CONCERN_RESULTS */}
        {viewState === 'CONCERN_RESULTS' && (
          <div className="bg-white p-4 py-5 shadow-sm min-h-screen">
            <div className="flex items-center gap-3 mb-6">
              {(() => {
                const currentConcern = healthConcerns.find(
                  (c) =>
                    c.id.toLowerCase() === (selectedConcern || '').toLowerCase() ||
                    c.name.toLowerCase() === (selectedConcern || '').toLowerCase()
                );
                const concernTitle = currentConcern?.name || selectedConcern || 'Tests';
                return (
                  <>
                    <div
                      className={`w-12 h-12 rounded-full ${
                        currentConcern?.bg || 'bg-blue-100'
                      } flex items-center justify-center shrink-0 overflow-hidden`}
                    >
                      <img
                        src={getHealthConcernIcon(selectedConcern || '')}
                        alt={concernTitle}
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/optimized/Blood Test.webp';
                        }}
                      />
                    </div>
                    <div>
                      <h2 className="text-[18px] font-black text-slate-900">
                        {concernTitle}
                      </h2>
                      <p className="text-[12px] text-slate-500 font-medium">Available tests and packages</p>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="relative max-w-md md:max-w-xl mx-auto mb-6">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${
                  (() => {
                    const match = healthConcerns.find(
                      (c) =>
                        c.id.toLowerCase() === (selectedConcern || '').toLowerCase() ||
                        c.name.toLowerCase() === (selectedConcern || '').toLowerCase()
                    );
                    return match?.name || selectedConcern || 'tests';
                  })()
                } tests...`}
                className="block w-full pl-12 pr-4 py-3 rounded-2xl bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 shadow-sm text-[13px] border border-slate-200"
              />
            </div>

            <div className="max-w-md md:max-w-5xl mx-auto space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
              {filteredTests.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={`w-12 h-12 rounded-xl ${
                        (item as any).bg || 'bg-orange-50'
                      } flex items-center justify-center shrink-0 overflow-hidden`}
                    >
                      <img
                        src={getTestIcon(item.name, item.category)}
                        alt={item.name}
                        className="w-9 h-9 object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/optimized/Blood Test.webp';
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800 leading-tight mb-1">{item.name}</h3>
                      <p className="text-sm text-slate-500 font-medium">
                        {item.provider || item.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 py-3 border-t border-b border-slate-50 mb-3">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{item.fasting || 'No Fasting'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                      <MapPin className="w-4 h-4 text-emerald-500" />
                      <span>{item.collection || 'Free laboratory visit'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => handleSelectTest(item)}
                      className="bg-[#0055ff] hover:bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors shadow-md shadow-blue-500/20 shrink-0"
                    >
                      Book
                    </button>
                  </div>
                </div>
              ))}

              {filteredTests.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-[14px] text-slate-500 font-bold">No tests found for this category</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BOOKING FLOW STEPS CONTAINER */}
        <div className="px-4 pt-4 max-w-md md:max-w-2xl mx-auto space-y-4">
          {/* VIEW: LAB_SELECT (Step 2) */}
          {viewState === 'LAB_SELECT' && (
            <section className="animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between pb-1 mb-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Tests
                </button>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  Step 2 of 5
                </span>
              </div>

              <h2 className="text-[18px] font-black text-slate-900 mb-2">Select Diagnostic Laboratory</h2>
              <p className="text-[12px] text-slate-500 font-medium mb-4">
                Choose a certified laboratory providing laboratory visit for this test.
              </p>

              {/* Lab search filter */}
              <div className="relative mb-4">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={labSearchQuery}
                  onChange={(e) => setLabSearchQuery(e.target.value)}
                  placeholder="Filter laboratories..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {isLoadingLabs ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center space-y-3">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">Checking eligible laboratories...</p>
                </div>
              ) : labError || laboratories.length === 0 ? (
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 text-center space-y-3 shadow-xs">
                  <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-800">
                    No eligible hospitals or laboratories found near your selected location.
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    We couldn't find accredited laboratories offering this test near <span className="font-semibold text-slate-700">{userLocation.label}</span> within {userLocation.radiusKm} km.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const btn = document.getElementById('desktop-location-selector') || document.getElementById('mobile-location-selector');
                        btn?.click();
                      }}
                      className="px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-xs"
                    >
                      Change Location
                    </button>
                    {userLocation.radiusKm < 50 && (
                      <button
                        type="button"
                        onClick={() => setNearbyRadiusKm(50)}
                        className="px-3.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100"
                      >
                        Expand Radius (50 km)
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => selectedItem?.id && loadEligibleLaboratories(selectedItem.id)}
                      className="px-3.5 py-1.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  {laboratories
                    .filter((l) =>
                      labSearchQuery
                        ? l.name.toLowerCase().includes(labSearchQuery.toLowerCase()) ||
                          l.location?.toLowerCase().includes(labSearchQuery.toLowerCase())
                        : true
                    )
                    .map((lab) => {
                      const isSelected = selectedLab?.id === lab.id;
                      return (
                        <div
                          key={lab.id}
                          onClick={() => {
                            setSelectedLab(lab);
                            setSelectedTime('');
                          }}
                          className={`bg-white p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                            isSelected
                              ? 'border-[#0055ff] shadow-md shadow-blue-500/10'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-0 right-0 bg-[#0055ff] text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">
                              Selected
                            </div>
                          )}
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                              <Building2 className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="text-[13px] font-bold text-slate-900 leading-tight">
                                  {lab.name}
                                </h3>
                                {lab.distanceText && (
                                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px] flex items-center gap-0.5 shrink-0">
                                    <MapPin className="w-3 h-3 text-emerald-600" />
                                    {lab.distanceText}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                {lab.location || lab.address || 'NABL Certified Lab'}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                {lab.rating ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setReviewModalLab(lab);
                                    }}
                                    className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 border border-amber-200/90 px-2 py-0.5 rounded-lg text-[11px] font-bold text-amber-900 transition-colors cursor-pointer"
                                    title="Click to view lab reviews"
                                  >
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                    <span>{Number(lab.rating).toFixed(1)}</span>
                                    <span className="text-amber-700 font-medium">({lab.reviewCount || 1} {lab.reviewCount === 1 ? 'review' : 'reviews'})</span>
                                  </button>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-medium bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 rounded-md">
                                    <Star className="w-3 h-3 text-slate-300" />
                                    <span>No reviews yet</span>
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-2 text-[11px] flex-wrap">
                                <span className="font-black text-blue-600">{lab.price}</span>
                                <span className="text-slate-400">•</span>
                                <span className="font-semibold text-emerald-600">
                                  {lab.homeCollectionFee && lab.homeCollectionFee > 0
                                    ? `₹${lab.homeCollectionFee} Home Fee`
                                    : 'Free laboratory visit'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              <div className="space-y-3">
                <button
                  disabled={!selectedLab || isLoadingLabs}
                  onClick={handleProceedToDateTime}
                  className="w-full flex items-center justify-center gap-2 bg-[#0055ff] text-white py-3.5 rounded-xl text-[13px] font-bold disabled:opacity-50 hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
                >
                  <span>Continue to Date & Slot</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full flex items-center justify-center bg-white text-slate-700 border border-slate-200 py-3.5 rounded-xl text-[13px] font-bold hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
              </div>
            </section>
          )}

          {/* VIEW: DATE_TIME (Step 3) */}
          {viewState === 'DATE_TIME' && (
            <section className="animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between pb-1 mb-3">
                <button
                  type="button"
                  onClick={() => setViewState('LAB_SELECT')}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Lab Selection
                </button>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  Step 3 of 5
                </span>
              </div>

              <h2 className="text-[18px] font-black text-slate-900 mb-1">Choose Visit Date & Slot</h2>
              <p className="text-[12px] text-slate-500 font-medium mb-6">
                Select your preferred date and time slot for your laboratory visit at{' '}
                <span className="font-bold text-slate-700">{selectedLab?.name || 'your chosen laboratory'}</span>.
              </p>

              {/* Date selection */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <h3 className="text-[13px] font-bold text-slate-800">Available Dates</h3>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar snap-x">
                  {availableDates.map((d) => {
                    const isSelected = selectedDate === d.date;
                    const { tag, dayNumber, monthName, isToday, isTomorrow } = parseDatePill(d);
                    
                    return (
                      <button
                        key={d.date}
                        type="button"
                        onClick={() => handleDateChange(d.date)}
                        className={`shrink-0 min-w-[84px] h-[92px] px-2.5 py-2 rounded-2xl flex flex-col items-center justify-between border transition-all duration-200 snap-center select-none shadow-sm ${
                          isSelected
                            ? 'bg-[#0055ff] border-[#0055ff] text-white shadow-lg shadow-blue-500/25 scale-105 ring-2 ring-blue-400/30'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:shadow-md'
                        }`}
                      >
                        <span
                          className={`text-[10px] font-extrabold uppercase tracking-tight truncate max-w-full px-1 ${
                            isSelected
                              ? 'text-blue-100'
                              : isToday || isTomorrow
                              ? 'text-blue-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {tag}
                        </span>
                        <span
                          className={`text-[20px] font-black leading-none my-0.5 ${
                            isSelected ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {dayNumber}
                        </span>
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wider ${
                            isSelected ? 'text-blue-100' : 'text-slate-400'
                          }`}
                        >
                          {monthName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slot selection */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <h3 className="text-[13px] font-bold text-slate-800">Available Time Slots</h3>
                </div>
                {isLoadingSlots ? (
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-11 rounded-xl bg-slate-100 animate-pulse border border-slate-200/50" />
                      ))}
                    </div>
                  </div>
                ) : slotError ? (
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-center shadow-sm">
                    <AlertCircle className="w-6 h-6 text-rose-500 mx-auto mb-2" />
                    <p className="text-xs font-bold text-rose-800">{slotError}</p>
                    <button
                      type="button"
                      onClick={() => selectedLab && loadSlots(selectedLab.id, selectedDate)}
                      className="mt-3 px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    {availableSlots.filter(s => s.available).length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {availableSlots.filter(s => s.available).map((s) => {
                          const isSelected = selectedTime === s.slot;
                          return (
                            <button
                              key={s.slot}
                              type="button"
                              onClick={() => setSelectedTime(s.slot)}
                              className={`px-3 py-3 rounded-xl text-[12px] font-bold border transition-all duration-150 flex items-center justify-center text-center leading-tight shadow-sm ${
                                isSelected
                                  ? 'bg-blue-50 border-[#0055ff] text-[#0055ff] ring-2 ring-blue-500/20 shadow-blue-500/10'
                                  : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50'
                              }`}
                            >
                              {s.slot}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center py-8 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-2.5 shadow-sm border border-slate-100">
                          <Clock className="w-5 h-5 text-slate-400" />
                        </div>
                        <p className="text-slate-800 font-bold text-sm">
                          No available time slots for this date. Please select another date.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedDate && selectedTime && (
                <div className="flex items-center gap-2 p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-[12px] font-bold text-blue-800 mb-6">
                  <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Selected Slot: <span className="font-extrabold">{selectedDate}</span> at <span className="font-extrabold">{selectedTime}</span>
                  </span>
                </div>
              )}

              <div className="space-y-3 mt-4">
                <button
                  disabled={!selectedDate || !selectedTime || isLoadingSlots}
                  onClick={handleProceedToReview}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[13px] font-bold transition-all duration-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed bg-[#0055ff] text-white hover:bg-blue-600 shadow-lg shadow-blue-500/30 disabled:shadow-none"
                >
                  <span>Continue to Review</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewState('LAB_SELECT')}
                  className="w-full flex items-center justify-center bg-white text-slate-700 border border-slate-200 py-3.5 rounded-xl text-[13px] font-bold hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
              </div>
            </section>
          )}

          {/* VIEW: REVIEW & PAY (Step 4) */}
          {(viewState === 'REVIEW' || viewState === 'PAYMENT') && (
            <section className="animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between pb-1 mb-3">
                <button
                  type="button"
                  onClick={() => setViewState('DATE_TIME')}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Slot Selection
                </button>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  Step 4 of 5
                </span>
              </div>

              <div className="mb-4">
                <h2 className="text-[18px] font-black text-slate-900">Review Your Booking</h2>
                <p className="text-[12px] text-slate-500 font-medium mt-0.5">
                  Please verify your test booking details and patient information before confirming.
                </p>
              </div>

              {bookingError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-[13px] font-medium mb-5 flex items-start gap-3 shadow-sm">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <span className="leading-snug">{bookingError}</span>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-5 overflow-hidden">
                <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src={getTestIcon(selectedItem?.name, selectedItem?.category)}
                      alt={selectedItem?.name}
                      className="w-9 h-9 object-contain"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/optimized/Blood Test.webp';
                      }}
                    />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 mb-0.5 tracking-wide uppercase">Selected Test</p>
                    <p className="text-[14px] font-black text-slate-900">{selectedItem?.name}</p>
                    <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-emerald-600 bg-emerald-50 w-max px-2 py-1 rounded-md border border-emerald-100">
                      <Home className="w-3 h-3" />
                      Laboratory Visit
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 mb-0.5 tracking-wide uppercase">Laboratory Partner</p>
                      <p className="text-[13px] font-bold text-slate-800">{selectedLab?.name}</p>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5">{selectedLab?.address || selectedLab?.location}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 mb-0.5 tracking-wide uppercase">Scheduled Date & Slot</p>
                      <p className="text-[13px] font-bold text-slate-800">
                        {selectedDate} <span className="text-slate-300 mx-1">•</span> {selectedTime}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient Details Form (Review & Edit) */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-5 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-700">Patient Details</h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Verify or edit</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Patient Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      name="name"
                      value={patientDetails.name}
                      onChange={handlePatientChange}
                      required
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Contact Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      name="phone"
                      value={patientDetails.phone}
                      onChange={handlePatientChange}
                      required
                      type="tel"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="10-digit mobile number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Age <span className="text-[10px] text-slate-400">(Optional)</span>
                    </label>
                    <input
                      name="age"
                      value={patientDetails.age}
                      onChange={handlePatientChange}
                      type="number"
                      min={0}
                      max={120}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="e.g. 30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Gender <span className="text-[10px] text-slate-400">(Optional)</span>
                    </label>
                    <select
                      name="gender"
                      value={patientDetails.gender}
                      onChange={handlePatientChange as any}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Email <span className="text-[10px] text-slate-400">(Optional)</span>
                  </label>
                  <input
                    name="email"
                    value={patientDetails.email}
                    onChange={handlePatientChange}
                    type="email"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              {/* Laboratory Reviews & Ratings Section (Pre-Payment Review Stage) */}
              {selectedLab && (
                <div className="mb-5">
                  <PrePaymentReviewsSummary
                    targetType="LABORATORY"
                    targetId={selectedLab.id}
                    providerName={selectedLab.name}
                    rating={selectedLab.rating}
                    reviewCount={selectedLab.reviewCount}
                    defaultVisibleCount={2}
                  />
                </div>
              )}

              {/* Price Breakdown */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 opacity-50 pointer-events-none"></div>
                <h3 className="font-black text-slate-900 text-[14px] mb-4 flex items-center gap-2 relative z-10">
                  <FileCheck className="w-4 h-4 text-blue-600" /> Payment Summary
                </h3>
                <div className="space-y-3 relative z-10">
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="font-medium text-slate-600">Diagnostic Test Price</span>
                    <span className="font-bold text-slate-800">₹{effectiveTestPrice}</span>
                  </div>
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="font-medium text-slate-600 flex items-center gap-1.5">
                      Laboratory Visit Fee
                    </span>
                    <span className="font-bold text-slate-800">
                      {effectiveCollectionFee > 0 ? `₹${effectiveCollectionFee}` : 'Free'}
                    </span>
                  </div>
                  <div className="h-[1px] w-full border-t border-dashed border-slate-200 my-2"></div>
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="block text-[11px] font-bold text-slate-400 mb-0.5 uppercase tracking-wide">Total Payable</span>
                    </div>
                    <span className="text-blue-600 font-black text-[20px] tracking-tight">₹{effectiveTotal}</span>
                  </div>
                </div>
              </div>

              {/* Payment Mode Selection — Online Payment Only */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2 mb-6">
                <h3 className="font-bold text-slate-800 text-xs mb-2">Payment Mode</h3>
                <div className="p-3.5 rounded-xl border border-blue-600 bg-blue-50 text-blue-800 flex items-center justify-between text-xs font-bold shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Pay Online (UPI / Credit & Debit Card / NetBanking)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider">
                    Secured
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  disabled={isSubmittingBooking}
                  onClick={handleConfirmAndPay}
                  className="w-full flex items-center justify-center bg-[#0055ff] text-white py-3.5 rounded-xl text-[13px] font-bold hover:bg-blue-600 disabled:opacity-50 transition-colors shadow-lg shadow-blue-500/30 gap-2"
                >
                  {isSubmittingBooking ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating Real Booking...</span>
                    </>
                  ) : (
                    <span>Confirm & Pay (₹{effectiveTotal})</span>
                  )}
                </button>
                <button
                  disabled={isSubmittingBooking}
                  onClick={() => setViewState('DATE_TIME')}
                  className="w-full flex items-center justify-center bg-white text-slate-700 border border-slate-200 py-3.5 rounded-xl text-[13px] font-bold hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
              </div>
            </section>
          )}

          {/* VIEW: CONFIRMED (Step 5) */}
          {viewState === 'CONFIRMED' && (
            <section className="animate-in fade-in zoom-in-95 duration-300 text-center pt-2">
              <div className="flex items-center justify-end pb-1 mb-3">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                  Step 5 of 5: Confirmed
                </span>
              </div>
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-white shadow-sm">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-[20px] font-black text-slate-900 mb-2">Booking Confirmed</h2>
              <p className="text-[12px] text-slate-500 font-medium mb-6">
                Your laboratory visit has been scheduled successfully.
              </p>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-left mb-6 space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-400">Booking ID</span>
                  <span className="font-mono font-black text-slate-900">
                    {createdBooking?.bookingNumber || 'MQ-HSC-001'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-400">Status</span>
                  <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-md font-bold">
                    {createdBooking?.status || 'CONFIRMED'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-400">Test</span>
                  <span className="font-bold text-slate-800">
                    {createdBooking?.testName || selectedItem?.name}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-400">Laboratory</span>
                  <span className="font-bold text-slate-800">
                    {createdBooking?.laboratoryName || selectedLab?.name}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-400">Patient</span>
                  <span className="font-bold text-slate-800">
                    {createdBooking?.patientName || patientDetails.name}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-400">Collection Date & Time</span>
                  <span className="font-bold text-slate-800">
                    {createdBooking?.date || selectedDate}, {createdBooking?.timeSlot || selectedTime}
                  </span>
                </div>
                <div className="flex justify-between items-start pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-400">Address</span>
                  <span className="font-medium text-slate-800 text-right max-w-[200px]">
                    {createdBooking?.collectionAddress || patientDetails.address}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-400">Payment Status</span>
                  <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md font-bold">
                    {createdBooking?.paymentStatus || 'PAID'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="font-bold text-slate-700">Total Amount</span>
                  <span className="text-[16px] font-black text-blue-600">
                    {createdBooking?.amount || `₹${effectiveTotal}`}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigate('/my-bookings')}
                  className="w-full flex items-center justify-center bg-[#0055ff] text-white py-3.5 rounded-xl text-[13px] font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
                >
                  View in My Bookings
                </button>
                {createdBooking?.id && (
                  <button
                    onClick={() => navigate(`/booking/${createdBooking.id}`)}
                    className="w-full flex items-center justify-center bg-slate-100 text-slate-800 py-3.5 rounded-xl text-[13px] font-bold hover:bg-slate-200 transition-colors"
                  >
                    View Booking Details
                  </button>
                )}
                <button
                  onClick={() => setViewState('STATUS')}
                  className="w-full flex items-center justify-center bg-white text-blue-600 border border-blue-200 py-3 rounded-xl text-[13px] font-bold hover:bg-blue-50 transition-colors"
                >
                  Track Sample Status
                </button>
                <button
                  onClick={() => navigate('/?bookingSuccess=true')}
                  className="w-full flex items-center justify-center bg-white text-slate-700 border border-slate-200 py-3 rounded-xl text-[13px] font-bold hover:bg-slate-50 transition-colors"
                >
                  Back to Home
                </button>
              </div>
            </section>
          )}

          {/* VIEW: STATUS */}
          {viewState === 'STATUS' && (
            <section className="animate-in fade-in zoom-in-95 duration-300">
              <h2 className="text-[18px] font-black text-slate-900 mb-4">laboratory visit Status</h2>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative pl-10 mb-6">
                <div className="absolute left-[26px] top-8 bottom-8 w-0.5 bg-slate-100"></div>
                <div className="absolute left-[26px] top-8 h-1/4 w-0.5 bg-emerald-500"></div>

                <div className="flex flex-col gap-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 -ml-[1.5rem] ring-4 ring-white">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-[13px] font-bold text-slate-900">Booking Confirmed</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-5 h-5 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shrink-0 -ml-[1.5rem] ring-4 ring-white"></div>
                    <span className="text-[13px] font-medium text-slate-400">technician Assigned</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-5 h-5 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shrink-0 -ml-[1.5rem] ring-4 ring-white"></div>
                    <span className="text-[13px] font-medium text-slate-400">Sample Collected</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-5 h-5 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shrink-0 -ml-[1.5rem] ring-4 ring-white"></div>
                    <span className="text-[13px] font-medium text-slate-400">Laboratory Processing</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-5 h-5 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shrink-0 -ml-[1.5rem] ring-4 ring-white"></div>
                    <span className="text-[13px] font-medium text-slate-400">Report Ready</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 flex flex-col items-center justify-center text-center mb-4">
                <FileCheck className="w-8 h-8 text-blue-500 mb-2" />
                <h3 className="text-[14px] font-bold text-blue-900 mb-1">Reports in Progress</h3>
                <p className="text-[11px] text-blue-700/80 mb-4">
                  Your laboratory reports will be accessible online once sample testing is finalized.
                </p>
              </div>

              <button
                onClick={() => setViewState('LIST')}
                className="w-full flex items-center justify-center bg-[#0055ff] text-white py-3.5 rounded-xl text-[13px] font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
              >
                Back to laboratory visit
              </button>
            </section>
          )}
        </div>
      </div>

      {reviewModalLab && (
        <ProviderReviewsModal
          isOpen={!!reviewModalLab}
          onClose={() => setReviewModalLab(null)}
          targetType="LABORATORY"
          targetId={reviewModalLab.id}
          providerName={reviewModalLab.name}
          onSelectProvider={() => {
            setSelectedLab(reviewModalLab);
            setSelectedTime('');
            setReviewModalLab(null);
          }}
        />
      )}
    </div>
  );
};

export default LabTestList;
