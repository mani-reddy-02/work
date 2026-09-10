import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  TestTube,
  Search,
  Clock,
  Activity,
  Droplet,
  Heart,
  ChevronRight,
  Calendar,
  Hospital,
  FileText,
  CheckCircle,
  MapPin,
  Home,
  FileCheck,
  ShieldCheck,
  ShieldAlert,
  X,
  RefreshCw,
  AlertCircle,
  Check,
  CreditCard,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  labTestApi,
  labBookingApi,
  type LabTestRecord,
  type LaboratoryRecord,
  type LabBookingRecord,
  type LabSlot,
} from '../lib/labTestApi';
import { profileApi } from '../lib/profileApi';

// Icon mapping: test name (cleaned) -> optimized medical illustration
const testIconMap: Record<string, string> = {
  'Complete Blood Count (CBC)': '/optimized/Blood Test.webp',
  'Complete Blood\nCount (CBC)': '/optimized/Blood Test.webp',
  'Liver Function Test (LFT)': '/optimized/Liver Function Test.webp',
  'Liver Function\nTest (LFT)': '/optimized/Liver Function Test.webp',
  'Thyroid Profile (T3, T4, TSH)': '/optimized/Thyroid Disorder.webp',
  'Thyroid Profile\n(T3, T4, TSH)': '/optimized/Thyroid Disorder.webp',
  'Lipid Profile': '/optimized/Cholesterol Test.webp',
  'Blood Sugar Test (Fasting)': '/optimized/Blood Sugar Test.webp',
  'Blood Sugar Test': '/optimized/Blood Sugar Test.webp',
  'HbA1c Blood Test': '/optimized/Blood Sugar Test.webp',
  'HbA1c': '/optimized/Blood Sugar Test.webp',
  'Kidney Function Test (KFT)': '/optimized/Kidney Function Test.webp',
  'Kidney Function Test': '/optimized/Kidney Function Test.webp',
  'Vitamin D Test': '/optimized/Vitamin D Test.webp',
  'Vitamin D': '/optimized/Vitamin D Test.webp',
  'Vitamin B12 Test': '/optimized/Vitamin B12 Test.webp',
  'Vitamin B12': '/optimized/Vitamin B12 Test.webp',
  'Urine Routine & Microscopy': '/optimized/Urine Test.webp',
  'Urine Routine Examination': '/optimized/Urine Test.webp',
  'Urine Routine': '/optimized/Urine Test.webp',
  'Iron Profile Test': '/optimized/Blood Test.webp',
  'Iron Profile': '/optimized/Blood Test.webp',
  'Cardiac Risk Profile': '/optimized/Heart Disease.webp',
  'Cholesterol Test': '/optimized/Cholesterol Test.webp',
  'X-Ray Chest PA View': '/optimized/Blood Test.webp',
};

const healthConcernIconMap: Record<string, string> = {
  fever: '/optimized/Fever.webp',
  diabetes: '/optimized/Diabetes.webp',
  heart: '/optimized/Heart Disease.webp',
  thyroid: '/optimized/Thyroid Disorder.webp',
  liver: '/optimized/Fatty Liver Disease.webp',
  kidney: '/optimized/Kidney Disease.webp',
  vitamins: '/optimized/Vitamin Deficiency.webp',
  infection: '/optimized/Viral Infection.webp',
};

const getTestIcon = (name: string): string | null => {
  const cleanName = name.replace(/\n/g, ' ').trim();
  return testIconMap[name] || testIconMap[cleanName] || null;
};

const howItWorks = [
  { id: '01', title: 'Choose Test', desc: 'Select the health\ntest you need.', icon: TestTube },
  { id: '02', title: 'Select Lab', desc: 'Choose a suitable\nlaboratory for\nyour test.', icon: Hospital },
  { id: '03', title: 'Select Date & Time', desc: 'Choose a convenient\navailable slot.', icon: Calendar },
  { id: '04', title: 'Sample Collection', desc: 'Provide your sample\nat the selected\nlocation.', icon: MapPin },
  { id: '05', title: 'Lab Processing', desc: 'The laboratory\nprocesses and\nanalyzes sample.', icon: Search },
  { id: '06', title: 'Report Ready', desc: 'View your test report\nwhen it becomes\navailable.', icon: FileText },
];

const healthConcerns = [
  { id: 'fever', name: 'Fever', icon: Activity, color: 'text-red-500', bg: 'bg-red-50' },
  { id: 'diabetes', name: 'Diabetes', icon: Droplet, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'heart', name: 'Heart', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
  { id: 'thyroid', name: 'Thyroid', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 'liver', name: 'Liver', icon: Activity, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { id: 'kidney', name: 'Kidney', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: 'vitamins', name: 'Vitamins', icon: TestTube, color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'infection', name: 'Infection', icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-50' },
];

const diagnosticPackages = [
  { id: 'p1', name: 'Complete Health\nCheckup', tests: '60 Tests', time: '24 Hours', price: '₹1199', icon: Heart, color: 'text-blue-600', bg: 'bg-blue-100', btnBg: 'bg-[#0055ff]', desc: 'Includes common blood, liver, kidney and vitamin tests.', prep: '10-12 hours of fasting is required.' },
  { id: 'p2', name: 'Diabetes Care\nPackage', tests: '3 Tests', time: '24 Hours', price: '₹899', icon: Droplet, color: 'text-indigo-600', bg: 'bg-indigo-100', btnBg: 'bg-[#0055ff]', desc: 'Includes: Fasting Blood Sugar, HbA1c, Post Meal Blood Sugar.', prep: '10-12 hours of fasting is required.' },
  { id: 'p3', name: 'Heart Health\nPackage', tests: '3 Tests', time: '24 Hours', price: '₹999', icon: Heart, color: 'text-rose-600', bg: 'bg-rose-100', btnBg: 'bg-[#0055ff]', desc: 'Includes: Lipid Profile, Cardiac Risk Profile, Cholesterol Test.', prep: '12 hours of fasting is required.' },
  { id: 'p4', name: 'Thyroid Package', tests: '3 Tests', time: '24 Hours', price: '₹499', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-100', btnBg: 'bg-[#0055ff]', desc: 'Includes: TSH, T3, T4.', prep: 'No fasting required.' },
  { id: 'p5', name: "Women's Health\nPackage", tests: '32 Tests', time: '24 Hours', price: '₹1499', icon: Activity, color: 'text-pink-600', bg: 'bg-pink-100', btnBg: 'bg-[#0055ff]', desc: "Tailored health package addressing key aspects of women's health.", prep: '10-12 hours of fasting is required.' },
  { id: 'p6', name: 'Senior Citizen\nHealth Package', tests: '40 Tests', time: '24 Hours', price: '₹1999', icon: Heart, color: 'text-blue-600', bg: 'bg-blue-100', btnBg: 'bg-[#0055ff]', desc: 'Comprehensive health monitoring tailored for senior citizens.', prep: '10-12 hours of fasting is required.' },
];

const DEFAULT_LAB_TESTS: LabTestRecord[] = [
  { id: '1', name: 'Complete Blood\nCount (CBC)', code: 'CBC', category: 'Blood Tests', concern: 'fever', price: '₹350', time: '12 Hours', desc: 'A complete blood count used to evaluate overall health.', prep: 'No special preparation required.', sampleType: 'Blood' },
  { id: '2', name: 'Liver Function\nTest (LFT)', code: 'LFT', category: 'Liver', concern: 'liver', price: '₹550', time: '12 Hours', desc: 'Evaluates liver function and detects liver inflammation.', prep: '10-12 hours fasting required.', sampleType: 'Blood' },
  { id: '3', name: 'Thyroid Profile\n(T3, T4, TSH)', code: 'THYROID', category: 'Thyroid', concern: 'thyroid', price: '₹450', time: '12 Hours', desc: 'Measures thyroid hormones to check gland function.', prep: 'No fasting required.', sampleType: 'Blood' },
  { id: '4', name: 'Lipid Profile', code: 'LIPID', category: 'Heart', concern: 'heart', price: '₹600', time: '12 Hours', desc: 'Measures cholesterol and triglyceride levels.', prep: '12 hours fasting required.', sampleType: 'Blood' },
  { id: '5', name: 'Blood Sugar Fasting\n(FBS)', code: 'FBS', category: 'Diabetes', concern: 'diabetes', price: '₹120', time: '6 Hours', desc: 'Measures fasting blood glucose level.', prep: '8-10 hours fasting required.', sampleType: 'Blood' },
  { id: '6', name: 'Kidney Function\nTest (KFT)', code: 'KFT', category: 'Kidney', concern: 'kidney', price: '₹500', time: '12 Hours', desc: 'Evaluates kidney function and health.', prep: 'No fasting required.', sampleType: 'Blood' },
  { id: '7', name: 'Vitamin D\n(25-OH)', code: 'VITD', category: 'Vitamins', concern: 'vitamins', price: '₹950', time: '24 Hours', desc: 'Measures 25-hydroxyvitamin D level.', prep: 'No fasting required.', sampleType: 'Blood' },
  { id: '8', name: 'Vitamin B12', code: 'VITB12', category: 'Vitamins', concern: 'vitamins', price: '₹750', time: '24 Hours', desc: 'Measures cobalamin level in blood.', prep: 'No fasting required.', sampleType: 'Blood' },
  { id: '9', name: 'HbA1c\n(Glycated Hb)', code: 'HBA1C', category: 'Diabetes', concern: 'diabetes', price: '₹400', time: '12 Hours', desc: 'Monitors average blood sugar over 3 months.', prep: 'No fasting required.', sampleType: 'Blood' },
  { id: '10', name: 'Urine Routine &\nMicroscopy', code: 'URINE', category: 'Urine Tests', concern: 'kidney', price: '₹180', time: '6 Hours', desc: 'Examines physical, chemical, and microscopic urine aspects.', prep: 'Morning first urine sample preferred.', sampleType: 'Urine' },
  { id: '11', name: 'Cardiac Risk\nProfile', code: 'CARDIAC', category: 'Heart', concern: 'heart', price: '₹1500', time: '24 Hours', desc: 'Assessment of cardiovascular disease risk markers.', prep: '12 hours fasting required.', sampleType: 'Blood' },
  { id: '12', name: 'Iron Profile', code: 'IRON', category: 'Blood Tests', concern: 'fever', price: '₹650', time: '12 Hours', desc: 'Assesses iron deficiency and iron metabolism.', prep: '10-12 hours fasting required.', sampleType: 'Blood' },
] as any as LabTestRecord[];

const LabTestList = () => {
  const navigate = useNavigate();

  const [viewState, setViewState] = useState<
    'LIST' | 'CONCERN_RESULTS' | 'TEST_DETAIL' | 'LAB_SELECT' | 'DATE_TIME' | 'COLLECTION' | 'PATIENT' | 'REVIEW' | 'CONFIRMED' | 'STATUS'
  >('LIST');

  // Search & Categories
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('All Tests');
  const [categoryTabs, setCategoryTabs] = useState<string[]>([
    'All Tests',
    'Blood Tests',
    'Diabetes',
    'Heart',
    'Thyroid',
    'Liver',
    'Kidney',
    'Vitamins',
    'Urine Tests',
    'Imaging',
  ]);
  const [showAllTests, setShowAllTests] = useState(false);
  const [showAllPackages, setShowAllPackages] = useState(false);
  const [selectedConcern, setSelectedConcern] = useState<string | null>(null);

  // Real Database Lab Tests state (defaults to catalog, enhanced with live data)
  const [dbTests, setDbTests] = useState<LabTestRecord[]>(DEFAULT_LAB_TESTS);
  const [isTestsLoading, setIsTestsLoading] = useState(false);
  const [testsError, setTestsError] = useState<string | null>(null);

  // Workflow Selection State
  const [selectedItem, setSelectedItem] = useState<LabTestRecord | any>(null);
  const [selectedLab, setSelectedLab] = useState<LaboratoryRecord | any>(null);
  const [labsList, setLabsList] = useState<LaboratoryRecord[]>([]);
  const [isLabsLoading, setIsLabsLoading] = useState(false);
  const [labSearchQuery, setLabSearchQuery] = useState('');

  // Date & Availability State
  const [availableDates, setAvailableDates] = useState<{ label: string; date: string }[]>([]);
  const [availableSlots, setAvailableSlots] = useState<LabSlot[]>([]);
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Collection & Patient Details
  const [collectionMethod, setCollectionMethod] = useState<'HOME' | 'LAB' | null>('LAB');
  const [patientDetails, setPatientDetails] = useState({
    name: '',
    age: '28',
    gender: 'Male',
    phone: '',
    email: '',
    address: 'Madhapur, Hyderabad, Telangana',
  });

  // Booking Execution & State
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<LabBookingRecord | null>(null);

  // Load Real Tests & Categories on Mount
  const loadInitialData = async () => {
    setIsTestsLoading(true);
    setTestsError(null);
    try {
      const [testsRes, catsRes] = await Promise.all([
        labTestApi.getLabTests(),
        labTestApi.getCategories(),
      ]);

      if (testsRes.success && testsRes.data && testsRes.data.length > 0) {
        setDbTests(testsRes.data);
      } else if (!testsRes.success) {
        setTestsError(testsRes.error || 'Failed to load tests');
      }

      if (catsRes.success && catsRes.data && catsRes.data.length > 0) {
        setCategoryTabs(catsRes.data);
      }
    } catch (err: any) {
      setTestsError(err.message || 'Unable to connect to the server');
    } finally {
      setIsTestsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Pre-fill Authenticated User Profile
  useEffect(() => {
    profileApi.getProfile().then((res) => {
      if (res.success && res.data) {
        setPatientDetails((prev) => ({
          ...prev,
          name: res.data?.name || prev.name,
          phone: res.data?.phone || prev.phone,
          email: res.data?.email || prev.email,
          gender: res.data?.gender || prev.gender,
        }));
      }
    });
  }, []);

  // Fetch Laboratories when in LAB_SELECT
  useEffect(() => {
    if (viewState === 'LAB_SELECT' && selectedItem?.id) {
      let active = true;
      setIsLabsLoading(true);

      labTestApi
        .getLaboratoriesForTest(selectedItem.id, { search: labSearchQuery })
        .then((res) => {
          if (active) {
            setIsLabsLoading(false);
            if (res.success && res.data) {
              setLabsList(res.data);
            }
          }
        })
        .catch(() => {
          if (active) setIsLabsLoading(false);
        });

      return () => {
        active = false;
      };
    }
  }, [viewState, selectedItem, labSearchQuery]);

  // Fetch Availability when selectedLab or selectedDate changes
  useEffect(() => {
    if (viewState === 'DATE_TIME' && selectedLab?.id) {
      let active = true;
      setIsSlotsLoading(true);

      labTestApi
        .getLaboratoryAvailability(selectedLab.id, selectedDate)
        .then((res) => {
          if (active) {
            setIsSlotsLoading(false);
            if (res.success && res.data) {
              setAvailableDates(res.data.availableDates || []);
              setAvailableSlots(res.data.slots || []);
              if (!selectedDate && res.data.availableDates?.length > 0) {
                setSelectedDate(res.data.availableDates[0].date);
              }
            }
          }
        })
        .catch(() => {
          if (active) setIsSlotsLoading(false);
        });

      return () => {
        active = false;
      };
    }
  }, [viewState, selectedLab, selectedDate]);

  // Filtering
  const q = searchQuery.toLowerCase().trim();
  const filteredByCategory =
    selectedTab === 'All Tests'
      ? dbTests
      : dbTests.filter(
          (t) =>
            t.category.toLowerCase() === selectedTab.toLowerCase() ||
            (t as any).categories?.includes(selectedTab)
        );

  const filteredLabTests = q
    ? filteredByCategory.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.desc.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.concern?.toLowerCase().includes(q)
      )
    : filteredByCategory;

  const displayLabTests = showAllTests || q ? filteredLabTests : filteredLabTests.slice(0, 8);
  const filteredPackages = q
    ? diagnosticPackages.filter(
        (p) => p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
      )
    : diagnosticPackages;

  const activeConcern = healthConcerns.find((c) => c.id === selectedConcern);
  const concernTests = activeConcern
    ? dbTests.filter(
        (t) =>
          t.concern?.toLowerCase() === activeConcern.id.toLowerCase() ||
          t.category.toLowerCase() === activeConcern.name.toLowerCase()
      )
    : [];

  const hasResults =
    filteredLabTests.length > 0 || filteredPackages.length > 0 || concernTests.length > 0;

  const handleBookNow = (item: any) => {
    setSelectedItem(item);
    setViewState('TEST_DETAIL');
  };

  const handlePatientChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setPatientDetails((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Execute Real Database Booking
  const handleConfirmBooking = async () => {
    if (!selectedItem?.id || !selectedLab?.id || !selectedDate || !selectedTime) {
      setBookingError('Please complete all booking steps.');
      return;
    }

    setIsBookingSubmitting(true);
    setBookingError(null);

    try {
      const res = await labBookingApi.createLabBooking({
        testId: selectedItem.id,
        laboratoryId: selectedLab.id,
        hospitalId: selectedLab.hospitalId,
        bookingDate: selectedDate,
        timeSlot: selectedTime,
        collectionType: collectionMethod === 'HOME' ? 'HOME_COLLECTION' : 'LAB_VISIT',
        patientName: patientDetails.name || 'Patient',
        patientPhone: patientDetails.phone || '9876543210',
        patientAge: patientDetails.age ? parseInt(patientDetails.age, 10) : 30,
        patientGender: patientDetails.gender || 'Male',
        patientEmail: patientDetails.email || undefined,
        collectionAddress: collectionMethod === 'HOME' ? patientDetails.address : undefined,
      });

      if (!res.success || !res.data) {
        setBookingError(res.error || 'Failed to confirm lab booking. Please try again.');
        setIsBookingSubmitting(false);
      } else {
        setConfirmedBooking(res.data);
        setIsBookingSubmitting(false);
        setViewState('CONFIRMED');
      }
    } catch (err: any) {
      setBookingError(err.message || 'An error occurred while confirming booking.');
      setIsBookingSubmitting(false);
    }
  };

  const handleBack = () => {
    switch (viewState) {
      case 'LIST':
        if (window.history.state && window.history.state.idx > 0) {
          navigate(-1);
        } else {
          navigate('/');
        }
        break;
      case 'CONCERN_RESULTS':
        setViewState('LIST');
        setSelectedConcern(null);
        setSearchQuery('');
        break;
      case 'TEST_DETAIL':
        if (selectedConcern) {
          setViewState('CONCERN_RESULTS');
        } else {
          setViewState('LIST');
        }
        break;
      case 'LAB_SELECT':
        setViewState('TEST_DETAIL');
        break;
      case 'DATE_TIME':
        setViewState('LAB_SELECT');
        break;
      case 'COLLECTION':
        setViewState('DATE_TIME');
        break;
      case 'PATIENT':
        setViewState('COLLECTION');
        break;
      case 'REVIEW':
        setViewState('PATIENT');
        break;
      case 'CONFIRMED':
        setViewState('LIST');
        break;
      case 'STATUS':
        setViewState('LIST');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-x-hidden relative min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0055ff] to-[#06b6d4] pt-4 pb-5 px-4 text-white shrink-0 shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={handleBack}
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-[17px] font-bold">Lab Tests</h1>
            {viewState !== 'LIST' && (
              <p className="text-[11px] text-blue-100 mt-0.5 capitalize">
                {viewState.replace('_', ' ').toLowerCase()}
              </p>
            )}
          </div>
        </div>
        {viewState === 'LIST' && (
          <div className="relative max-w-md mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-10 py-2.5 border-0 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-white/50 shadow-lg text-[13px] font-medium"
              placeholder="Search tests, packages, health concerns..."
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
                aria-label="Clear search"
              >
                <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* VIEW: LIST */}
        {viewState === 'LIST' && (
          <div className="-mt-2">
            {/* Loading State when tests not yet loaded */}
            {isTestsLoading && dbTests.length === 0 && (
              <div className="bg-white p-8 rounded-2xl mx-4 my-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm font-bold text-slate-800">Loading Real Lab Tests...</p>
                <p className="text-xs text-slate-400 mt-1">Connecting to shared MediQuee database</p>
              </div>
            )}

            {/* Error State */}
            {testsError && dbTests.length === 0 && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mx-4 my-6 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <div>
                    <p className="font-bold">Unable to load lab tests</p>
                    <p className="text-[11px] text-red-600">{testsError}</p>
                  </div>
                </div>
                <button
                  onClick={loadInitialData}
                  className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-xl font-bold transition-colors shrink-0"
                >
                  Retry
                </button>
              </div>
            )}

            {(!isTestsLoading || dbTests.length > 0) && (
              <>
                {q && !hasResults ? (
                  <div className="text-center py-12 px-4 bg-white rounded-2xl mx-4 my-6 border border-slate-100 shadow-sm">
                    <TestTube className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-[15px] text-slate-700 font-bold">No matching tests found</p>
                    <p className="text-xs text-slate-400 mt-1">Try searching by test name, category, or health concern.</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors"
                    >
                      Clear Search
                    </button>
                  </div>
                ) : (
                  <>
                    {!q && (
                      <>
                        {/* How it works? */}
                        <div className="bg-white pt-6 pb-2 mb-2 shadow-sm overflow-hidden">
                          <div className="flex items-center justify-center gap-3 mb-5">
                            <div className="h-[1px] w-6 bg-blue-600/30"></div>
                            <h2 className="font-bold text-slate-800 text-[15px]">How Lab Testing Works</h2>
                            <div className="h-[1px] w-6 bg-blue-600/30"></div>
                          </div>

                          <div className="relative group w-full">
                            <div
                              className="flex gap-3 overflow-x-auto hide-scrollbar px-4 pb-4 snap-x"
                              style={{ scrollSnapType: 'x mandatory' }}
                            >
                              {howItWorks.map((step) => (
                                <div
                                  key={step.id}
                                  className="snap-center shrink-0 w-[150px] bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col relative overflow-hidden"
                                >
                                  <div className="absolute top-0 right-0 bg-blue-50 text-blue-600 font-black text-[10px] px-2 py-1 rounded-bl-xl border-b border-l border-blue-100">
                                    {step.id}
                                  </div>
                                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                                    <step.icon className="w-5 h-5" strokeWidth={2} />
                                  </div>
                                  <h3 className="font-bold text-slate-900 text-[13px] mb-1 leading-tight">
                                    {step.title}
                                  </h3>
                                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed whitespace-pre-line">
                                    {step.desc}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Lab Tests - CIRCLE STYLE */}
                        <div className="bg-white pt-5 pb-6 mb-2 shadow-sm">
                          <div className="px-4 mb-4 flex items-center justify-between">
                            <div>
                              <h2 className="text-[16px] font-bold text-slate-800">Lab Tests</h2>
                              <p className="text-[11px] text-slate-400 font-medium">Real tests from MediQuee Diagnostic Network</p>
                            </div>
                            {filteredByCategory.length > 8 && (
                              <button
                                onClick={() => setShowAllTests(!showAllTests)}
                                className="flex items-center text-blue-600 cursor-pointer hover:text-blue-700 transition-colors"
                              >
                                <span className="text-[11px] font-bold">
                                  {showAllTests ? 'Show Less' : `View All (${filteredByCategory.length})`}
                                </span>
                                <ChevronRight className="w-4 h-4 ml-0.5" />
                              </button>
                            )}
                          </div>

                          {/* Category Tabs */}
                          <div className="flex gap-2 overflow-x-auto hide-scrollbar px-4 mb-6 pb-1">
                            {categoryTabs.map((tab) => (
                              <button
                                key={tab}
                                onClick={() => setSelectedTab(tab)}
                                className={`shrink-0 px-4 py-1.5 rounded-full text-[12px] font-bold transition-all ${
                                  selectedTab === tab
                                    ? 'bg-[#0055ff] text-white shadow-md shadow-blue-500/20'
                                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {tab}
                              </button>
                            ))}
                          </div>

                          {/* 4x2 Circular Grid */}
                          <div className="grid grid-cols-4 gap-y-5 gap-x-2 px-4 relative">
                            {displayLabTests.map((item) => {
                              const iconSrc = getTestIcon(item.name);
                              return (
                                <div
                                  key={item.id}
                                  onClick={() => handleBookNow(item)}
                                  className="flex flex-col items-center gap-2 cursor-pointer group"
                                >
                                  <div
                                    className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-blue-50 flex items-center justify-center border border-slate-100 group-hover:shadow-lg group-hover:scale-110 transition-all duration-200 overflow-hidden"
                                  >
                                    {iconSrc ? (
                                      <img
                                        src={iconSrc}
                                        alt={item.name.replace('\n', ' ')}
                                        className="w-10 h-10 md:w-12 md:h-12 object-contain"
                                      />
                                    ) : (
                                      <TestTube className="w-6 h-6 text-blue-600" strokeWidth={1.5} />
                                    )}
                                  </div>
                                  <span className="text-[10px] md:text-[11px] font-bold text-slate-800 text-center leading-tight">
                                    {item.name.replace('\n', ' ')}
                                  </span>
                                  <span className="text-[10px] font-bold text-blue-600 -mt-1">
                                    {item.price}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Find Tests by Health Concern */}
                        <div className="bg-white pt-5 pb-6 mb-2 shadow-sm">
                          <div className="px-4 mb-4">
                            <h2 className="text-[16px] font-bold text-slate-800">Find Tests by Health Concern</h2>
                          </div>
                          <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4 mb-5 pb-1">
                            {healthConcerns.map((concern) => (
                              <div
                                key={concern.id}
                                onClick={() => {
                                  setSelectedConcern(concern.id);
                                  setViewState('CONCERN_RESULTS');
                                }}
                                className="flex flex-col items-center shrink-0 w-[72px] cursor-pointer group"
                              >
                                <div
                                  className={`w-14 h-14 rounded-full ${concern.bg} flex items-center justify-center mb-1.5 border border-slate-100 group-hover:shadow-lg group-hover:scale-110 transition-all duration-200 overflow-hidden`}
                                >
                                  {healthConcernIconMap[concern.id] ? (
                                    <img
                                      src={healthConcernIconMap[concern.id]}
                                      alt={concern.name}
                                      className="w-10 h-10 object-contain"
                                    />
                                  ) : (
                                    <concern.icon className={`w-6 h-6 ${concern.color}`} />
                                  )}
                                </div>
                                <span className="text-[11px] font-bold text-slate-700 text-center">
                                  {concern.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Diagnostic Packages */}
                    {filteredPackages.length > 0 && (
                      <div className="pt-5 pb-6 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-4 px-4">
                          <h2 className="text-[15px] font-bold text-slate-800">
                            {q ? 'Matching Packages' : 'Diagnostic Packages'}
                          </h2>
                          {!q && (
                            <button
                              onClick={() => setShowAllPackages(!showAllPackages)}
                              className="flex items-center text-blue-600 cursor-pointer hover:text-blue-700 transition-colors"
                            >
                              <span className="text-[11px] font-bold">
                                {showAllPackages ? 'Show Less' : 'View All'}
                              </span>
                              <ChevronRight
                                className={`w-4 h-4 transition-transform ${showAllPackages ? '-rotate-90' : ''}`}
                              />
                            </button>
                          )}
                        </div>
                        <div
                          className={
                            showAllPackages
                              ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 px-4'
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
                                      className={`w-10 h-10 rounded-xl ${(item as any).bg} ${(item as any).color} flex items-center justify-center shrink-0`}
                                    >
                                      <item.icon className="w-5 h-5" strokeWidth={2} />
                                    </div>
                                    <div>
                                      <h3 className="font-bold text-slate-900 text-[12px] leading-tight mb-0.5 whitespace-pre-line">
                                        {item.name}
                                      </h3>
                                      <p className="text-[9px] text-slate-500 font-medium">
                                        ({(item as any).tests})
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-medium mb-3">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Results in {item.time}</span>
                                </div>
                                <div className="flex items-center justify-between mt-auto">
                                  <span className="text-[16px] font-black text-blue-600">{item.price}</span>
                                </div>
                                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                                  <button
                                    onClick={() => handleBookNow(item)}
                                    className="flex-1 bg-slate-50 text-slate-700 border border-slate-200 py-1.5 rounded-lg text-[10px] font-bold hover:bg-slate-100 transition-colors"
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={() => handleBookNow(item)}
                                    className={`flex-1 text-white py-1.5 rounded-lg text-[10px] font-bold ${
                                      (item as any).btnBg || 'bg-[#0055ff]'
                                    } hover:opacity-90 transition-opacity shadow-sm`}
                                  >
                                    Book
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* VIEW: CONCERN_RESULTS */}
        {viewState === 'CONCERN_RESULTS' && activeConcern && (
          <div className="animate-in fade-in duration-300 px-4 pt-4 pb-6">
            <div className="flex items-center gap-3 mb-6">
              <div
                className={`w-12 h-12 rounded-full ${activeConcern.bg} flex items-center justify-center shrink-0 shadow-sm border border-slate-100`}
              >
                <activeConcern.icon className={`w-6 h-6 ${activeConcern.color}`} />
              </div>
              <div>
                <h2 className="text-[18px] font-bold text-slate-800 leading-tight">
                  {activeConcern.name} Tests
                </h2>
                <p className="text-[12px] text-slate-500">Real database tests for this condition</p>
              </div>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm text-[13px] font-medium"
                placeholder={`Search ${activeConcern.name} tests...`}
              />
            </div>

            <div className="space-y-3">
              {concernTests.filter(
                (t) =>
                  t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  t.desc.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 ? (
                <div className="text-center py-8 bg-white rounded-2xl p-6 border border-slate-100">
                  <p className="text-[14px] text-slate-500 font-bold">No tests found matching your search</p>
                </div>
              ) : (
                concernTests
                  .filter(
                    (t) =>
                      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      t.desc.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 overflow-hidden">
                          {getTestIcon(item.name) ? (
                            <img
                              src={getTestIcon(item.name)!}
                              alt={item.name.replace('\n', ' ')}
                              className="w-9 h-9 object-contain"
                            />
                          ) : (
                            <TestTube className="w-6 h-6" strokeWidth={2} />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-[14px] leading-tight mb-1 whitespace-pre-line">
                            {item.name}
                          </h3>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {item.category} · {item.sampleType || 'Blood'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <div className="flex flex-col gap-1.5 mb-3 border-t border-b border-slate-100 py-2 mt-1">
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span>Report within {item.time}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[16px] font-black text-blue-600">{item.price}</span>
                          <button
                            onClick={() => handleBookNow(item)}
                            className="bg-[#0055ff] text-white px-5 py-2 rounded-xl text-[12px] font-bold shadow-md shadow-blue-500/20 hover:bg-blue-600 transition-colors shrink-0"
                          >
                            Book Now
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* BOOKING FLOW CONTAINER */}
        <div className="px-4 pt-6 max-w-md mx-auto space-y-6">
          {/* VIEW: TEST DETAIL */}
          {viewState === 'TEST_DETAIL' && (
            <section className="animate-in fade-in duration-300">
              <h2 className="text-[18px] font-black text-slate-900 mb-4">Test Details</h2>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 bg-blue-50 rounded-bl-3xl text-blue-600">
                  <TestTube className="w-6 h-6" />
                </div>

                <h3 className="font-bold text-slate-900 text-[17px] mb-2 pr-10 whitespace-pre-line">
                  {selectedItem?.name}
                </h3>
                <p className="text-[12px] text-slate-600 mb-4 font-medium leading-relaxed">
                  {selectedItem?.desc || selectedItem?.description}
                </p>

                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-slate-700">Estimated Report Time</p>
                      <p className="text-[11px] text-slate-500">
                        Results typically ready in {selectedItem?.time || selectedItem?.tat || '12 Hours'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <TestTube className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-slate-700">Sample Type</p>
                      <p className="text-[11px] text-slate-500">{selectedItem?.sampleType || selectedItem?.sample || 'Blood'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-slate-700">Preparation Instructions</p>
                      <p className="text-[11px] text-slate-500">
                        {selectedItem?.prep || selectedItem?.preparation || 'No special preparation required.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">Starting From</span>
                    <span className="text-[22px] font-black text-blue-600">{selectedItem?.price}</span>
                  </div>
                  <button
                    onClick={() => setViewState('LAB_SELECT')}
                    className="bg-[#0055ff] text-white px-6 py-2.5 rounded-xl text-[13px] font-bold shadow-md shadow-blue-500/20 hover:bg-blue-600 transition-colors"
                  >
                    Select Laboratory
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* VIEW: LAB SELECT */}
          {viewState === 'LAB_SELECT' && (
            <section className="animate-in fade-in zoom-in-95 duration-300">
              <h2 className="text-[18px] font-black text-slate-900 mb-1">Select Laboratory</h2>
              <p className="text-[12px] text-slate-500 mb-4 font-medium">
                Verified labs offering <span className="font-bold text-slate-700">{selectedItem?.name}</span>
              </p>

              {/* Lab Search */}
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={labSearchQuery}
                  onChange={(e) => setLabSearchQuery(e.target.value)}
                  placeholder="Search lab by name, location..."
                  className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
                />
                {labSearchQuery && (
                  <button
                    onClick={() => setLabSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label="Clear lab search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {isLabsLoading && (
                <div className="flex items-center justify-center py-8 text-blue-600 gap-2">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-semibold">Loading available laboratories...</span>
                </div>
              )}

              {!isLabsLoading && labsList.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <p className="text-[14px] text-slate-500 font-bold">No laboratories available for this test</p>
                  <p className="text-[11px] text-slate-400 mt-1">Try clearing your search query to see all labs.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {labsList.map((lab) => (
                    <div
                      key={lab.id}
                      className={`bg-white p-4 rounded-2xl border transition-all shadow-sm ${
                        selectedLab?.id === lab.id ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 overflow-hidden">
                            {lab.logoUrl ? (
                              <img src={lab.logoUrl} alt={lab.name} className="w-full h-full object-cover" />
                            ) : (
                              <Hospital className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-[14px] leading-tight mb-1">{lab.name}</h3>
                            <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                              <MapPin className="w-3 h-3 shrink-0" /> {lab.address || lab.location || 'Location available'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md text-[11px] font-bold shrink-0">
                          <span>★</span> <span>{lab.rating || 4.8}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium mt-3 pb-3 border-b border-slate-100">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> {lab.time || 'Within 24 Hours'}
                        </span>
                        {lab.homeCollectionAvailable && (
                          <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                            Home Collection Available
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Test Fee</span>
                          <span className="text-[17px] font-black text-blue-600">{lab.price}</span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedLab(lab);
                            setViewState('DATE_TIME');
                          }}
                          className="bg-[#0055ff] text-white px-5 py-2 rounded-xl text-[12px] font-bold hover:bg-blue-600 shadow-md shadow-blue-500/20 transition-colors"
                        >
                          Select Lab
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* VIEW: DATE_TIME */}
          {viewState === 'DATE_TIME' && (
            <section className="animate-in fade-in zoom-in-95 duration-300">
              <h2 className="text-[18px] font-black text-slate-900 mb-1">Choose Date & Time</h2>
              <p className="text-[12px] text-slate-500 mb-4 font-medium">
                Live availability at <span className="font-bold text-slate-700">{selectedLab?.name}</span>
              </p>

              <div className="mb-6">
                <h3 className="text-[13px] font-bold text-slate-800 mb-3">Available Dates</h3>
                <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                  {availableDates.map((d) => (
                    <button
                      key={d.date}
                      onClick={() => setSelectedDate(d.date)}
                      className={`shrink-0 px-5 py-2.5 rounded-xl text-[12px] font-bold border transition-colors ${
                        selectedDate === d.date
                          ? 'bg-[#0055ff] border-[#0055ff] text-white shadow-md shadow-blue-500/20'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {isSlotsLoading ? (
                <div className="flex items-center justify-center py-6 text-blue-600 gap-2">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-semibold">Checking slot availability...</span>
                </div>
              ) : (
                <div className="mb-6 animate-in slide-in-from-top-2 duration-200">
                  <h3 className="text-[13px] font-bold text-slate-800 mb-3">Available Collection Slots</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((s) => (
                      <button
                        key={s.slot}
                        disabled={!s.available}
                        onClick={() => setSelectedTime(s.slot)}
                        className={`px-2 py-2.5 rounded-xl text-[11px] font-bold border transition-colors ${
                          !s.available
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through'
                            : selectedTime === s.slot
                            ? 'bg-[#0055ff] border-[#0055ff] text-white shadow-md shadow-blue-500/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {s.slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                disabled={!selectedDate || !selectedTime}
                onClick={() => setViewState('COLLECTION')}
                className="w-full mt-4 flex items-center justify-center bg-[#0055ff] text-white py-3.5 rounded-xl text-[13px] font-bold disabled:opacity-50 hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
              >
                Continue
              </button>
            </section>
          )}

          {/* VIEW: COLLECTION */}
          {viewState === 'COLLECTION' && (
            <section className="animate-in fade-in zoom-in-95 duration-300">
              <h2 className="text-[18px] font-black text-slate-900 mb-1">Sample Collection</h2>
              <p className="text-[12px] text-slate-500 mb-6 font-medium">How would you like to provide the sample?</p>

              <div className="space-y-4">
                <button
                  onClick={() => setCollectionMethod('LAB')}
                  className={`w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition-all ${
                    collectionMethod === 'LAB'
                      ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      collectionMethod === 'LAB' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <Hospital className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[14px] text-slate-900 mb-1">Visit Laboratory</h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Visit {selectedLab?.name} directly at your chosen time.
                    </p>
                  </div>
                </button>

                <button
                  disabled={selectedLab?.homeCollectionAvailable === false}
                  onClick={() => setCollectionMethod('HOME')}
                  className={`w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition-all ${
                    selectedLab?.homeCollectionAvailable === false
                      ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200'
                      : collectionMethod === 'HOME'
                      ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      collectionMethod === 'HOME' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <Home className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[14px] text-slate-900 mb-0.5">Home Sample Collection</h3>
                      {selectedLab?.homeCollectionFee === 0 && (
                        <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.2 rounded-full">
                          FREE
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      A certified phlebotomist will collect the sample from your doorstep.
                    </p>
                  </div>
                </button>
              </div>

              <button
                disabled={!collectionMethod}
                onClick={() => setViewState('PATIENT')}
                className="w-full mt-8 flex items-center justify-center bg-[#0055ff] text-white py-3.5 rounded-xl text-[13px] font-bold disabled:opacity-50 hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
              >
                Continue to Patient Details
              </button>
            </section>
          )}

          {/* VIEW: PATIENT */}
          {viewState === 'PATIENT' && (
            <section className="animate-in fade-in zoom-in-95 duration-300">
              <h2 className="text-[18px] font-black text-slate-900 mb-1">Patient Details</h2>
              <p className="text-[12px] text-slate-500 mb-4 font-medium">Confirm details for the diagnostic report</p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setViewState('REVIEW');
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Patient Full Name *</label>
                  <input
                    name="name"
                    value={patientDetails.name}
                    onChange={handlePatientChange}
                    required
                    type="text"
                    placeholder="Enter patient name"
                    className="w-full border border-slate-200 rounded-xl p-3 text-[13px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Age *</label>
                    <input
                      name="age"
                      value={patientDetails.age}
                      onChange={handlePatientChange}
                      required
                      type="number"
                      placeholder="Age"
                      className="w-full border border-slate-200 rounded-xl p-3 text-[13px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Gender *</label>
                    <select
                      name="gender"
                      value={patientDetails.gender}
                      onChange={handlePatientChange}
                      required
                      className="w-full border border-slate-200 rounded-xl p-3 text-[13px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Phone Number *</label>
                  <input
                    name="phone"
                    value={patientDetails.phone}
                    onChange={handlePatientChange}
                    required
                    type="tel"
                    placeholder="10-digit mobile number"
                    className="w-full border border-slate-200 rounded-xl p-3 text-[13px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Email Address</label>
                  <input
                    name="email"
                    value={patientDetails.email}
                    onChange={handlePatientChange}
                    type="email"
                    placeholder="For digital report delivery"
                    className="w-full border border-slate-200 rounded-xl p-3 text-[13px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                {collectionMethod === 'HOME' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Sample Collection Address *</label>
                    <textarea
                      name="address"
                      value={patientDetails.address}
                      onChange={handlePatientChange}
                      required
                      rows={3}
                      placeholder="Enter full home address with landmark"
                      className="w-full border border-slate-200 rounded-xl p-3 text-[13px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    ></textarea>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full mt-4 flex items-center justify-center bg-[#0055ff] text-white py-3.5 rounded-xl text-[13px] font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
                >
                  Continue to Booking Review
                </button>
              </form>
            </section>
          )}

          {/* VIEW: REVIEW */}
          {viewState === 'REVIEW' && (
            <section className="animate-in fade-in zoom-in-95 duration-300">
              <h2 className="text-[18px] font-black text-slate-900 mb-4">Review Your Booking</h2>

              {bookingError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-4 text-xs flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <span>{bookingError}</span>
                </div>
              )}

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 mb-6">
                <div>
                  <p className="text-[11px] font-bold text-slate-500 mb-0.5">Test</p>
                  <p className="text-[14px] font-black text-slate-800 whitespace-pre-line">{selectedItem?.name}</p>
                </div>
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-[11px] font-bold text-slate-500 mb-0.5">Laboratory</p>
                  <p className="text-[13px] font-bold text-slate-800">{selectedLab?.name}</p>
                  <p className="text-[11px] text-slate-500">{selectedLab?.address || selectedLab?.location}</p>
                </div>
                <div className="border-t border-slate-100 pt-3 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 mb-0.5">Date</p>
                    <p className="text-[13px] font-bold text-slate-800">{selectedDate}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 mb-0.5">Time</p>
                    <p className="text-[13px] font-bold text-slate-800">{selectedTime}</p>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-[11px] font-bold text-slate-500 mb-0.5">Collection Type</p>
                  <p className="text-[13px] font-bold text-slate-800">
                    {collectionMethod === 'HOME' ? 'Home Sample Collection' : 'Visit Laboratory'}
                  </p>
                </div>
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-[11px] font-bold text-slate-500 mb-0.5">Patient Details</p>
                  <p className="text-[13px] font-bold text-slate-800">
                    {patientDetails.name} ({patientDetails.age} y, {patientDetails.gender})
                  </p>
                  <p className="text-[11px] text-slate-500">Phone: {patientDetails.phone}</p>
                </div>
                {collectionMethod === 'HOME' && (
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-[11px] font-bold text-slate-500 mb-0.5">Collection Address</p>
                    <p className="text-[13px] font-bold text-slate-800 leading-tight">{patientDetails.address}</p>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 space-y-2 mb-6">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Lab Test Fee</span>
                  <span className="font-bold text-slate-900">{selectedLab?.price}</span>
                </div>
                {collectionMethod === 'HOME' && (
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Home Collection Charge</span>
                    <span className="font-bold text-slate-900">
                      {selectedLab?.homeCollectionFee ? `₹${selectedLab.homeCollectionFee}` : 'FREE'}
                    </span>
                  </div>
                )}
                <div className="border-t border-blue-200/60 pt-2 mt-2 flex justify-between items-center">
                  <span className="text-[14px] font-bold text-blue-950">Total Payable Amount</span>
                  <span className="text-[20px] font-black text-blue-700">
                    {selectedLab?.price}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  disabled={isBookingSubmitting}
                  onClick={handleConfirmBooking}
                  className="w-full flex items-center justify-center gap-2 bg-[#0055ff] text-white py-3.5 rounded-xl text-[13px] font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-60"
                >
                  {isBookingSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Confirming with Database...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Confirm & Pay</span>
                    </>
                  )}
                </button>
                <button
                  disabled={isBookingSubmitting}
                  onClick={() => setViewState('PATIENT')}
                  className="w-full flex items-center justify-center bg-white text-slate-700 border border-slate-200 py-3 rounded-xl text-[13px] font-bold hover:bg-slate-50 transition-colors"
                >
                  Back / Edit
                </button>
              </div>
            </section>
          )}

          {/* VIEW: CONFIRMED */}
          {viewState === 'CONFIRMED' && (
            <section className="animate-in fade-in zoom-in-95 duration-300 text-center pt-4">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-white shadow-sm">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-[20px] font-black text-slate-900 mb-1">Lab Booking Confirmed!</h2>
              <p className="text-[12px] text-slate-500 font-medium mb-6">
                Your diagnostic test appointment is securely registered in the database.
              </p>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-left mb-6">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
                  <span className="text-[11px] font-bold text-slate-500">Booking Number</span>
                  <span className="text-[13px] font-black text-blue-600 font-mono">
                    {confirmedBooking?.bookingNumber || 'MQ-LAB-CONFIRMED'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
                  <span className="text-[11px] font-bold text-slate-500">Test</span>
                  <span className="text-[13px] font-bold text-slate-800">{selectedItem?.name}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
                  <span className="text-[11px] font-bold text-slate-500">Laboratory</span>
                  <span className="text-[13px] font-bold text-slate-800">{selectedLab?.name}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
                  <span className="text-[11px] font-bold text-slate-500">Patient</span>
                  <span className="text-[13px] font-bold text-slate-800">{patientDetails.name}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
                  <span className="text-[11px] font-bold text-slate-500">Date & Slot</span>
                  <span className="text-[13px] font-bold text-slate-800">
                    {selectedDate}, {selectedTime}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
                  <span className="text-[11px] font-bold text-slate-500">Collection Type</span>
                  <span className="text-[12px] font-semibold text-slate-800">
                    {collectionMethod === 'HOME' ? 'Home Sample Collection' : 'Visit Laboratory'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
                  <span className="text-[11px] font-bold text-slate-500">Payment Status</span>
                  <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] font-bold">
                    PAID
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-500">Total Paid</span>
                  <span className="text-[16px] font-black text-blue-600">
                    {confirmedBooking?.amount || selectedLab?.price}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setViewState('STATUS')}
                  className="w-full flex items-center justify-center bg-[#0055ff] text-white py-3.5 rounded-xl text-[13px] font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
                >
                  Track Test Status
                </button>
                <button
                  onClick={() => navigate('/my-bookings')}
                  className="w-full flex items-center justify-center bg-blue-50 text-[#0055ff] py-3 rounded-xl text-[13px] font-bold hover:bg-blue-100 transition-colors"
                >
                  Go to My Bookings
                </button>
                <button
                  onClick={() => {
                    setViewState('LIST');
                    setSelectedItem(null);
                    setSelectedLab(null);
                    setConfirmedBooking(null);
                  }}
                  className="w-full flex items-center justify-center bg-white text-slate-700 border border-slate-200 py-3 rounded-xl text-[13px] font-bold hover:bg-slate-50 transition-colors"
                >
                  Back to Lab Tests
                </button>
              </div>
            </section>
          )}

          {/* VIEW: STATUS */}
          {viewState === 'STATUS' && (
            <section className="animate-in fade-in zoom-in-95 duration-300">
              <h2 className="text-[18px] font-black text-slate-900 mb-1">Lab Test Booking Status</h2>
              <p className="text-xs text-slate-500 mb-4 font-mono">
                Booking ID: {confirmedBooking?.bookingNumber || 'MQ-LAB-RECORD'}
              </p>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative pl-10 mb-6">
                <div className="absolute left-[26px] top-8 bottom-8 w-0.5 bg-slate-100"></div>
                <div className="absolute left-[26px] top-8 h-1/2 w-0.5 bg-emerald-500"></div>

                <div className="flex flex-col gap-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 -ml-[1.5rem] ring-4 ring-white">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-[13px] font-bold text-slate-900">Booking Confirmed</span>
                  </div>

                  {collectionMethod === 'HOME' ? (
                    <>
                      <div className="flex items-center gap-4">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 -ml-[1.5rem] ring-4 ring-white">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-[13px] font-bold text-slate-900">Agent Assigned</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 -ml-[1.5rem] ring-4 ring-white">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-[13px] font-bold text-slate-900">Sample Collected</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 -ml-[1.5rem] ring-4 ring-white">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-[13px] font-bold text-slate-900">Sample Collection (Slot: {selectedTime})</span>
                    </div>
                  )}

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

              <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 flex flex-col items-center justify-center text-center">
                <FileCheck className="w-8 h-8 text-blue-500 mb-2" />
                <h3 className="text-[14px] font-bold text-blue-900 mb-1">Reports In Progress</h3>
                <p className="text-[11px] text-blue-700/80 mb-4">
                  {selectedLab?.name} will upload your test results within{' '}
                  {selectedItem?.time || '24 Hours'}.
                </p>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => navigate('/my-bookings')}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#0055ff] text-white py-2.5 rounded-xl text-[12px] font-bold transition-colors"
                  >
                    View in My Bookings
                  </button>
                  <button
                    onClick={() => {
                      setViewState('LIST');
                      setSelectedItem(null);
                      setSelectedLab(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-white text-[#0055ff] border border-blue-200 py-2.5 rounded-xl text-[12px] font-bold transition-colors"
                  >
                    Back to Tests
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabTestList;
