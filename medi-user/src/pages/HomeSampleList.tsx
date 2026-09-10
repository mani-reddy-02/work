import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  homeSampleCollectionApi,
  type LabTestRecord,
  type LaboratoryRecord,
  type LabBookingRecord,
} from '../lib/homeSampleCollectionApi';
import { profileApi } from '../lib/profileApi';

// Icon mapping: test name -> optimized medical illustration
const testIconMap: Record<string, string> = {
  'Complete Blood Count (CBC)': '/optimized/Blood Test.webp',
  'Blood Sugar Test (Fasting)': '/optimized/Blood Sugar Test.webp',
  'Lipid Profile': '/optimized/Cholesterol Test.webp',
  'Liver Function Test': '/optimized/Liver Function Test.webp',
  'Kidney Function Test': '/optimized/Kidney Function Test.webp',
  'Thyroid Profile': '/optimized/Thyroid Disorder.webp',
  'Vitamin B12': '/optimized/Vitamin B12 Test.webp',
  'Vitamin D': '/optimized/Vitamin D Test.webp',
  'HbA1c': '/optimized/Blood Sugar Test.webp',
  'Iron Profile': '/optimized/Blood Test.webp',
  'Post Meal Blood Sugar': '/optimized/Blood Sugar Test.webp',
  'Glucose Tolerance Test': '/optimized/Blood Sugar Test.webp',
  'Cardiac Risk Profile': '/optimized/Heart Disease.webp',
  'Troponin Test': '/optimized/Heart Disease.webp',
  'T3, T4, TSH': '/optimized/Thyroid Disorder.webp',
  'Bilirubin': '/optimized/Liver Function Test.webp',
  'SGOT & SGPT': '/optimized/Liver Function Test.webp',
  'Creatinine': '/optimized/Kidney Function Test.webp',
  'Urea': '/optimized/Kidney Function Test.webp',
  'Folate': '/optimized/Vitamin Deficiency.webp',
  'Master Health Checkup': '/optimized/Blood Test.webp',
  'Comprehensive Full Body': '/optimized/Blood Test.webp',
  'Thyroid Stimulating Hormone (TSH)': '/optimized/Thyroid Disorder.webp',
  'Testosterone Total': '/optimized/Blood Test.webp',
  'Widal Test': '/optimized/Typhoid Test.webp',
  'Dengue NS1 Antigen': '/optimized/Dengue Test.webp',
  'Urine Routine & Microscopy': '/optimized/Urine Test.webp',
  'Urine Culture': '/optimized/Urine Test.webp',
  'PSA (Prostate Specific Antigen)': '/optimized/Blood Test.webp',
  'CA 125': '/optimized/Blood Test.webp',
};

const healthConcernIconMap: Record<string, string> = {
  diabetes: '/optimized/Diabetes.webp',
  heart: '/optimized/Heart Disease.webp',
  thyroid: '/optimized/Thyroid Disorder.webp',
  liver: '/optimized/Fatty Liver Disease.webp',
  kidney: '/optimized/Kidney Disease.webp',
  fever: '/optimized/Fever.webp',
  vitamins: '/optimized/Vitamin Deficiency.webp',
};

const getTestIcon = (name: string): string | null => {
  return testIconMap[name] || null;
};

const homeSampleStepsData = [
  { id: '01', title: 'Select Test', desc: 'Choose the test you want to book.', icon: TestTube },
  { id: '02', title: 'Choose Home Collection', desc: 'Select home sample collection where available.', icon: Home },
  { id: '03', title: 'Enter Patient Details', desc: 'Provide the required patient information.', icon: User },
  { id: '04', title: 'Choose Date & Time', desc: 'Select a convenient collection slot.', icon: Calendar },
  { id: '05', title: 'Sample Collection', desc: 'A sample is collected according to the selected service.', icon: Pipette },
  { id: '06', title: 'Report Ready', desc: 'Access the report when processing is complete.', icon: FileText },
];

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
const initialTests = [
  { id: '1', name: 'Complete Blood Count (CBC)', category: 'Blood Tests', concern: 'fever', provider: 'Lucid Medical', price: '₹350', numericPrice: 350, collection: 'Free Home Collection', fasting: 'No Fasting', desc: 'A complete blood count used to evaluate your overall health.', icon: TestTube, color: 'text-red-500', bg: 'bg-red-50' },
  { id: '2', name: 'Blood Sugar Test (Fasting)', category: 'Diabetes', concern: 'diabetes', provider: 'Apollo Diagnostics', price: '₹150', numericPrice: 150, collection: 'Free Home Collection', fasting: '10-12 Hrs Fasting', desc: 'Measures blood glucose after an overnight fast.', icon: Droplet, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { id: '3', name: 'Lipid Profile', category: 'Heart', concern: 'heart', provider: 'Vijaya Diagnostic', price: '₹899', numericPrice: 899, collection: 'Free Home Collection', fasting: '12 Hrs Fasting', desc: 'Measures cholesterol and triglycerides in the blood.', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
  { id: '4', name: 'Liver Function Test', category: 'Liver', concern: 'liver', provider: 'Tenet Diagnostics', price: '₹750', numericPrice: 750, collection: 'Free Home Collection', fasting: 'No Fasting', desc: 'Evaluates the health and function of your liver.', icon: Activity, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { id: '5', name: 'Kidney Function Test', category: 'Kidney', concern: 'kidney', provider: 'Apollo Diagnostics', price: '₹600', numericPrice: 600, collection: 'Free Home Collection', fasting: 'No Fasting', desc: 'Assesses how well your kidneys are working.', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: '6', name: 'Thyroid Profile', category: 'Thyroid', concern: 'thyroid', provider: 'Tenet Diagnostics', price: '₹450', numericPrice: 450, collection: 'Free Home Collection', fasting: 'No Fasting', desc: 'Measures thyroid hormones to check gland function.', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: '7', name: 'Vitamin B12', category: 'Vitamins', concern: 'vitamins', provider: 'Lucid Medical', price: '₹950', numericPrice: 950, collection: 'Free Home Collection', fasting: 'No Fasting', desc: 'Measures the level of Vitamin B12 in blood.', icon: Apple, color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: '8', name: 'Vitamin D', category: 'Vitamins', concern: 'vitamins', provider: 'Vijaya Diagnostic', price: '₹1200', numericPrice: 1200, collection: 'Free Home Collection', fasting: 'No Fasting', desc: 'Measures the level of Vitamin D in blood.', icon: Apple, color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: '9', name: 'HbA1c', category: 'Diabetes', concern: 'diabetes', provider: 'Apollo Diagnostics', price: '₹400', numericPrice: 400, collection: 'Free Home Collection', fasting: 'No Fasting', desc: 'Measures average blood sugar over the past 3 months.', icon: Droplet, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { id: '10', name: 'Iron Profile', category: 'Blood Tests', concern: 'fever', provider: 'Tenet Diagnostics', price: '₹850', numericPrice: 850, collection: 'Free Home Collection', fasting: 'No Fasting', desc: 'Measures various markers of iron in the blood.', icon: TestTube, color: 'text-red-500', bg: 'bg-red-50' },
  { id: '11', name: 'Post Meal Blood Sugar', category: 'Diabetes', concern: 'diabetes', provider: 'Lucid Medical', price: '₹150', numericPrice: 150, collection: 'Free Home Collection', fasting: 'Post Meal', desc: 'Measures blood glucose 2 hours after eating.', icon: Droplet, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { id: '12', name: 'Glucose Tolerance Test', category: 'Diabetes', concern: 'diabetes', provider: 'Apollo Diagnostics', price: '₹550', numericPrice: 550, collection: 'Free Home Collection', fasting: 'Fasting Required', desc: 'Checks how your body processes sugar.', icon: Droplet, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { id: '13', name: 'Cardiac Risk Profile', category: 'Heart', concern: 'heart', provider: 'Tenet Diagnostics', price: '₹2200', numericPrice: 2200, collection: 'Free Home Collection', fasting: '12 Hrs Fasting', desc: 'Comprehensive test for assessing heart disease risk.', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
  { id: '14', name: 'Troponin Test', category: 'Heart', concern: 'heart', provider: 'Vijaya Diagnostic', price: '₹1500', numericPrice: 1500, collection: 'Free Home Collection', fasting: 'No Fasting', desc: 'Measures troponin levels to detect heart injury.', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
  { id: '15', name: 'T3, T4, TSH', category: 'Thyroid', concern: 'thyroid', provider: 'Apollo Diagnostics', price: '₹500', numericPrice: 500, collection: 'Free Home Collection', fasting: 'No Fasting', desc: 'Complete thyroid hormone panel.', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: '16', name: 'Bilirubin', category: 'Liver', concern: 'liver', provider: 'Lucid Medical', price: '₹300', numericPrice: 300, collection: 'Free Home Collection', fasting: 'No Fasting', desc: 'Measures bilirubin levels to check liver health.', icon: Activity, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { id: '17', name: 'SGOT & SGPT', category: 'Liver', concern: 'liver', provider: 'Tenet Diagnostics', price: '₹400', numericPrice: 400, collection: 'Free Home Collection', fasting: 'No Fasting', desc: 'Measures liver enzymes to detect liver damage.', icon: Activity, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { id: '18', name: 'Creatinine', category: 'Kidney', concern: 'kidney', provider: 'Vijaya Diagnostic', price: '₹250', numericPrice: 250, collection: 'Free Home Collection', fasting: 'No Fasting', desc: 'Measures creatinine levels to assess kidney function.', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: '19', name: 'Urea', category: 'Kidney', concern: 'kidney', provider: 'Apollo Diagnostics', price: '₹200', numericPrice: 200, collection: 'Free Home Collection', fasting: 'No Fasting', desc: 'Measures urea nitrogen in the blood.', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: '20', name: 'Folate', category: 'Vitamins', concern: 'vitamins', provider: 'Tenet Diagnostics', price: '₹800', numericPrice: 800, collection: 'Free Home Collection', fasting: 'No Fasting', desc: 'Measures the level of folate (folic acid) in blood.', icon: Apple, color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: '21', name: 'Master Health Checkup', category: 'Packages', concern: 'general', provider: 'Apollo Diagnostics', price: '₹2499', numericPrice: 2499, collection: 'Free Home Collection', fasting: '10-12 Hrs Fasting', desc: 'Comprehensive full body health checkup.', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: '22', name: 'Comprehensive Full Body', category: 'Packages', concern: 'general', provider: 'Tenet Diagnostics', price: '₹1999', numericPrice: 1999, collection: 'Free Home Collection', fasting: '12 Hrs Fasting', desc: 'Detailed assessment of all major body systems.', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: '23', name: 'Thyroid Stimulating Hormone (TSH)', category: 'Hormones', concern: 'thyroid', provider: 'Lucid Medical', price: '₹400', numericPrice: 400, collection: 'Free Home Collection', fasting: 'No Fasting', desc: 'Measures TSH levels to evaluate thyroid function.', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: '24', name: 'Testosterone Total', category: 'Hormones', concern: 'general', provider: 'Apollo Diagnostics', price: '₹750', numericPrice: 750, collection: 'Free Home Collection', fasting: 'Morning Sample Preferred', desc: 'Measures testosterone levels in the blood.', icon: Activity, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { id: '25', name: 'Widal Test', category: 'Infection', concern: 'fever', provider: 'Vijaya Diagnostic', price: '₹350', numericPrice: 350, collection: 'Free Home Collection', fasting: 'No Fasting', desc: 'Used for the diagnosis of Typhoid fever.', icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-50' },
  { id: '26', name: 'Dengue NS1 Antigen', category: 'Infection', concern: 'fever', provider: 'Tenet Diagnostics', price: '₹850', numericPrice: 850, collection: 'Free Home Collection', fasting: 'No Fasting', desc: 'Detects the presence of dengue virus.', icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-50' },
  { id: '27', name: 'Urine Routine & Microscopy', category: 'Urine Tests', concern: 'kidney', provider: 'Apollo Diagnostics', price: '₹200', numericPrice: 200, collection: 'Free Home Collection', fasting: 'No Fasting', desc: 'Examines physical, chemical, and microscopic properties of urine.', icon: TestTube, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { id: '28', name: 'Urine Culture', category: 'Urine Tests', concern: 'kidney', provider: 'Lucid Medical', price: '₹600', numericPrice: 600, collection: 'Free Home Collection', fasting: 'Sterile Container', desc: 'Checks for bacteria or yeast causing infection.', icon: TestTube, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { id: '29', name: 'PSA (Prostate Specific Antigen)', category: 'Cancer Screening', concern: 'general', provider: 'Tenet Diagnostics', price: '₹950', numericPrice: 950, collection: 'Free Home Collection', fasting: 'No Fasting', desc: 'Screens for prostate cancer in men.', icon: Activity, color: 'text-slate-500', bg: 'bg-slate-50' },
  { id: '30', name: 'CA 125', category: 'Cancer Screening', concern: 'general', provider: 'Vijaya Diagnostic', price: '₹1400', numericPrice: 1400, collection: 'Free Home Collection', fasting: 'No Fasting', desc: 'Tumor marker primarily used to monitor ovarian cancer.', icon: Activity, color: 'text-slate-500', bg: 'bg-slate-50' },
];

const diagnosticPackages = [
  { id: 'p1', name: 'Complete Health\nCheckup', tests: '60 Tests', time: '24 Hours', price: '₹1199', icon: Heart, color: 'text-blue-600', bg: 'bg-blue-100', btnBg: 'bg-[#0055ff]', desc: 'A collection of common health screening tests.', prep: '10-12 hours of fasting is required.' },
  { id: 'p2', name: 'Diabetes Care\nPackage', tests: '3 Tests', time: '24 Hours', price: '₹899', icon: Droplet, color: 'text-indigo-600', bg: 'bg-indigo-100', btnBg: 'bg-[#0055ff]', desc: 'Includes: Fasting Blood Sugar, HbA1c, Post Meal Blood Sugar.', prep: '10-12 hours of fasting is required.' },
  { id: 'p3', name: 'Heart Health\nPackage', tests: '3 Tests', time: '24 Hours', price: '₹999', icon: Heart, color: 'text-rose-600', bg: 'bg-rose-100', btnBg: 'bg-[#0055ff]', desc: 'Includes: Lipid Profile, Cardiac Risk Profile, Cholesterol Test.', prep: '12 hours of fasting is required.' },
  { id: 'p4', name: 'Thyroid Package', tests: '3 Tests', time: '24 Hours', price: '₹499', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-100', btnBg: 'bg-[#0055ff]', desc: 'Includes: TSH, T3, T4.', prep: 'No fasting required.' },
  { id: 'p5', name: "Vitamin Health\nPackage", tests: '3 Tests', time: '24 Hours', price: '₹1499', icon: Apple, color: 'text-orange-600', bg: 'bg-orange-100', btnBg: 'bg-[#0055ff]', desc: 'Includes: Vitamin D, Vitamin B12, Folate.', prep: '10-12 hours of fasting is required.' },
];

type ViewState =
  | 'LIST'
  | 'CONCERN_RESULTS'
  | 'TEST_DETAIL'
  | 'HOME_COLLECTION'
  | 'PATIENT'
  | 'DATE_TIME'
  | 'REVIEW'
  | 'CONFIRMED'
  | 'STATUS';

const HomeSampleList = () => {
  const navigate = useNavigate();

  const [viewState, setViewState] = useState<ViewState>('LIST');
  const [showAll, setShowAll] = useState(false);
  const [showAllPackages, setShowAllPackages] = useState(false);
  const [tests, setTests] = useState<any[]>(initialTests);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('All Tests');
  const [selectedConcern, setSelectedConcern] = useState<string | null>(null);

  // Laboratories for selected test
  const [laboratories, setLaboratories] = useState<LaboratoryRecord[]>([]);
  const [selectedLab, setSelectedLab] = useState<LaboratoryRecord | null>(null);
  const [labSearchQuery, setLabSearchQuery] = useState('');
  const [isLoadingLabs, setIsLoadingLabs] = useState(false);
  const [labError, setLabError] = useState<string | null>(null);

  // Patient details state
  const [patientDetails, setPatientDetails] = useState({
    name: 'Mani Kanta',
    age: '30',
    gender: 'Male',
    phone: '9876543210',
    email: '',
    address: 'Madhapur, Hyderabad, 500081',
  });

  // Date & Time availability
  const [availableDates, setAvailableDates] = useState<{ label: string; date: string }[]>([]);
  const [availableSlots, setAvailableSlots] = useState<{ slot: string; available: boolean }[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Booking & payment state
  const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'COD'>('ONLINE');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [createdBooking, setCreatedBooking] = useState<LabBookingRecord | null>(null);

  // Load real tests from backend on mount
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await homeSampleCollectionApi.getTests();
        if (res.success && res.data && res.data.length > 0) {
          // Merge database tests with styling metadata
          const mapped = res.data.map((t) => ({
            ...t,
            collection: t.homeCollectionAvailable ? 'Free Home Collection' : 'Lab Visit Only',
            fasting: t.preparation?.toLowerCase().includes('fasting') ? 'Fasting Required' : 'No Fasting',
          }));
          setTests(mapped);
        }
      } catch {
        // Fallback to initial tests on network error
      }
    };
    fetchTests();
  }, []);

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
      const res = await homeSampleCollectionApi.getEligibleLaboratories(testId);
      if (res.success && res.data && res.data.length > 0) {
        setLaboratories(res.data);
        setSelectedLab(res.data[0]);
      } else {
        setLaboratories([]);
        setSelectedLab(null);
        setLabError(res.error || 'No laboratories currently offer Home Sample Collection for this test.');
      }
    } catch {
      setLabError('Unable to load laboratories. Please try again.');
    } finally {
      setIsLoadingLabs(false);
    }
  };

  // Load slots when lab or date changes
  const loadSlots = async (labId: string, dateStr?: string) => {
    setIsLoadingSlots(true);
    try {
      const res = await homeSampleCollectionApi.getAvailability(labId, dateStr);
      if (res.success && res.data) {
        setAvailableDates(res.data.availableDates || []);
        setAvailableSlots(res.data.slots || []);
        if (!selectedDate && res.data.availableDates && res.data.availableDates.length > 0) {
          setSelectedDate(res.data.availableDates[0].date);
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const q = searchQuery.toLowerCase().trim();
  const filteredByCategory =
    selectedTab === 'All Tests'
      ? tests
      : tests.filter(
          (t) =>
            t.category === selectedTab ||
            ((t as any).categories && (t as any).categories.includes(selectedTab))
        );
  const filteredByConcern =
    !selectedConcern || selectedConcern === 'all'
      ? filteredByCategory
      : filteredByCategory.filter(
          (t) =>
            t.concern === selectedConcern ||
            t.category?.toLowerCase() === selectedConcern.toLowerCase() ||
            t.healthConcern?.toLowerCase() === selectedConcern.toLowerCase()
        );

  const filteredTests = q
    ? filteredByConcern.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q) ||
          t.concern?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      )
    : filteredByConcern;

  const filteredPackages = q
    ? diagnosticPackages.filter(
        (p) => p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
      )
    : diagnosticPackages;

  const hasResults = filteredTests.length > 0 || filteredPackages.length > 0;
  const displayedTests = showAll || q ? filteredTests : filteredTests.slice(0, 8);

  const handleSelectTest = (item: any) => {
    setSelectedItem(item);
    setViewState('TEST_DETAIL');
  };

  const handleProceedToHomeCollection = () => {
    if (selectedItem?.id) {
      loadEligibleLaboratories(selectedItem.id);
    }
    setViewState('HOME_COLLECTION');
  };

  const handleProceedToPatient = () => {
    if (!selectedLab) {
      alert('Please select a laboratory providing home collection.');
      return;
    }
    setViewState('PATIENT');
  };

  const handleProceedToDateTime = () => {
    if (!patientDetails.name.trim() || !patientDetails.phone.trim() || !patientDetails.address.trim()) {
      alert('Please provide patient name, phone number, and doorstep collection address.');
      return;
    }
    if (selectedLab) {
      loadSlots(selectedLab.id, selectedDate);
    }
    setViewState('DATE_TIME');
  };

  const handleProceedToReview = () => {
    if (!selectedDate || !selectedTime) {
      alert('Please select collection date and time slot.');
      return;
    }
    setViewState('REVIEW');
  };

  // Submit real booking
  const handleConfirmAndPay = async () => {
    if (!selectedItem || !selectedLab) return;
    setIsSubmittingBooking(true);
    setBookingError(null);

    const token = localStorage.getItem('mediquee_token');
    if (!token) {
      setIsSubmittingBooking(false);
      setBookingError('Please log in to complete your Home Sample Collection booking.');
      return;
    }

    try {
      const res = await homeSampleCollectionApi.createBooking({
        testId: selectedItem.id,
        laboratoryId: selectedLab.id,
        bookingDate: selectedDate,
        timeSlot: selectedTime,
        patientName: patientDetails.name.trim(),
        patientAge: patientDetails.age ? parseInt(patientDetails.age, 10) : undefined,
        patientGender: patientDetails.gender,
        patientPhone: patientDetails.phone.trim(),
        patientEmail: patientDetails.email?.trim() || undefined,
        collectionAddress: patientDetails.address.trim(),
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
      case 'TEST_DETAIL':
        if (selectedConcern) {
          setViewState('CONCERN_RESULTS');
        } else {
          setViewState('LIST');
        }
        break;
      case 'HOME_COLLECTION':
        setViewState('TEST_DETAIL');
        break;
      case 'PATIENT':
        setViewState('HOME_COLLECTION');
        break;
      case 'DATE_TIME':
        setViewState('PATIENT');
        break;
      case 'REVIEW':
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

  const handlePatientChange = (e: any) => {
    setPatientDetails((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Price calculations
  const effectiveTestPrice = selectedLab ? selectedLab.numericPrice : selectedItem?.numericPrice || 499;
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
          <div className="flex-1">
            <h1 className="text-[17px] font-bold">Home Sample Collection</h1>
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
          <div>
            {q && !hasResults ? (
              <div className="text-center py-8">
                <p className="text-[14px] text-slate-500 font-bold">No matching tests found</p>
              </div>
            ) : (
              <>
                {!q && (
                  <>
                    {/* How it works Marquee */}
                    <div className="bg-white pt-6 pb-2 mb-2 shadow-sm overflow-hidden">
                      <div className="flex items-center justify-center gap-3 mb-5">
                        <div className="h-[1px] w-6 bg-blue-600/30"></div>
                        <h2 className="font-bold text-slate-800 text-[15px]">
                          How Home Sample Collection Works
                        </h2>
                        <div className="h-[1px] w-6 bg-blue-600/30"></div>
                      </div>

                      <div className="relative group w-full overflow-hidden">
                        <div
                          className="flex gap-3 hide-scrollbar px-4 pb-4 w-max animate-marquee"
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          {[...homeSampleStepsData, ...homeSampleStepsData].map((step, index) => (
                            <div
                              key={step.id + '-' + index}
                              className="shrink-0 w-[150px] bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col relative overflow-hidden"
                              style={{ whiteSpace: 'normal' }}
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
                                {step.desc.replace(/\n/g, ' ')}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Lab Tests - Circular Grid */}
                    <div className="bg-white pt-5 pb-6 mb-2 shadow-sm">
                      <div className="px-4 mb-4 flex items-center justify-between">
                        <h2 className="text-[16px] font-bold text-slate-800">Lab Tests</h2>
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

                      <div className="grid grid-cols-4 gap-y-5 gap-x-2 px-4 relative">
                        {displayedTests.map((item) => {
                          const iconSrc = getTestIcon(item.name);
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
                                    alt={item.name}
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
                                {item.name.replace('\n', ' ')}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Find Tests by Health Concern */}
                    <div className="bg-white p-4 py-5 mb-2 shadow-sm">
                      <h2 className="text-[16px] font-bold text-slate-800 mb-4">
                        Find Tests by Health Concern
                      </h2>
                      <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-2 mb-2 px-1">
                        {healthConcerns.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              setSelectedConcern(item.id);
                              setViewState('CONCERN_RESULTS');
                            }}
                            className="flex flex-col items-center shrink-0 w-[72px] cursor-pointer group"
                          >
                            <div
                              className={`w-14 h-14 rounded-full ${item.bg} flex items-center justify-center mb-1.5 border border-slate-100 group-hover:shadow-lg group-hover:scale-110 transition-all duration-200 overflow-hidden`}
                            >
                              <img
                                src={healthConcernIconMap[item.id]}
                                alt={item.name}
                                className="w-9 h-9 object-contain"
                              />
                            </div>
                            <span className="text-[11px] font-bold text-center text-slate-700">
                              {item.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Search Results */}
                {q && filteredTests.length > 0 && (
                  <div className="bg-white p-4 py-5 mb-2 shadow-sm">
                    <h2 className="text-[16px] font-bold text-slate-800 mb-4">Matching Tests</h2>
                    <div className="max-w-md mx-auto space-y-4">
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
                              {getTestIcon(item.name) ? (
                                <img
                                  src={getTestIcon(item.name)!}
                                  alt={item.name}
                                  className="w-9 h-9 object-contain"
                                />
                              ) : (
                                <Activity className="w-6 h-6 text-orange-500" />
                              )}
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
                              <span>{item.collection || 'Free Home Collection'}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-slate-800">{item.price}</span>
                            <button
                              onClick={() => handleSelectTest(item)}
                              className="bg-[#0055ff] hover:bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors shadow-md shadow-blue-500/20 shrink-0"
                            >
                              Book
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Diagnostic Packages */}
                {filteredPackages.length > 0 && (
                  <div className="pt-5 pb-6 bg-white shadow-sm mb-2">
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
                              item.color === 'text-blue-600'
                                ? 'from-blue-500 to-blue-400'
                                : item.color === 'text-rose-600'
                                ? 'from-rose-500 to-rose-400'
                                : item.color === 'text-indigo-600'
                                ? 'from-indigo-500 to-indigo-400'
                                : item.color === 'text-emerald-600'
                                ? 'from-emerald-500 to-emerald-400'
                                : item.color === 'text-orange-600'
                                ? 'from-orange-500 to-orange-400'
                                : 'from-blue-500 to-cyan-400'
                            }`}
                          ></div>
                          <div className="p-3.5">
                            <div className="mb-3">
                              <div className="flex items-start gap-2.5 mb-2">
                                <div
                                  className={`w-10 h-10 rounded-xl ${item.bg} ${item.color} flex items-center justify-center shrink-0`}
                                >
                                  <item.icon className="w-5 h-5" strokeWidth={2} />
                                </div>
                                <div>
                                  <h3 className="font-bold text-slate-900 text-[12px] leading-tight mb-0.5 whitespace-pre-line">
                                    {item.name}
                                  </h3>
                                  <p className="text-[9px] text-slate-500 font-medium">({item.tests})</p>
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
                                onClick={() => handleSelectTest(item)}
                                className="flex-1 bg-slate-50 text-slate-700 border border-slate-200 py-1.5 rounded-lg text-[10px] font-bold hover:bg-slate-100 transition-colors"
                              >
                                View Package
                              </button>
                              <button
                                onClick={() => handleSelectTest(item)}
                                className={`flex-1 text-white py-1.5 rounded-lg text-[10px] font-bold ${item.btnBg} hover:opacity-90 transition-opacity shadow-sm`}
                              >
                                Book Package
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
          </div>
        )}

        {/* VIEW: CONCERN_RESULTS */}
        {viewState === 'CONCERN_RESULTS' && (
          <div className="bg-white p-4 py-5 shadow-sm min-h-screen">
            <div className="flex items-center gap-3 mb-6">
              <div
                className={`w-12 h-12 rounded-full ${
                  healthConcerns.find((c) => c.id === selectedConcern)?.bg || 'bg-blue-100'
                } flex items-center justify-center shrink-0`}
              >
                {(() => {
                  const Icon = healthConcerns.find((c) => c.id === selectedConcern)?.icon || TestTube;
                  return (
                    <Icon
                      className={`w-6 h-6 ${
                        healthConcerns.find((c) => c.id === selectedConcern)?.color || 'text-blue-500'
                      }`}
                    />
                  );
                })()}
              </div>
              <div>
                <h2 className="text-[18px] font-black text-slate-900">
                  {healthConcerns.find((c) => c.id === selectedConcern)?.name || 'Tests'}
                </h2>
                <p className="text-[12px] text-slate-500 font-medium">Available tests and packages</p>
              </div>
            </div>

            <div className="relative max-w-md mx-auto mb-6">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${
                  selectedConcern ? healthConcerns.find((c) => c.id === selectedConcern)?.name || 'tests' : 'tests'
                } tests...`}
                className="block w-full pl-12 pr-4 py-3 rounded-2xl bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 shadow-sm text-[13px] border border-slate-200"
              />
            </div>

            <div className="max-w-md mx-auto space-y-4">
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
                      {getTestIcon(item.name) ? (
                        <img
                          src={getTestIcon(item.name)!}
                          alt={item.name}
                          className="w-9 h-9 object-contain"
                        />
                      ) : item.icon ? (
                        <item.icon className={`w-6 h-6 ${(item as any).color || 'text-orange-500'}`} />
                      ) : (
                        <TestTube className="w-6 h-6 text-orange-500" />
                      )}
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
                      <span>{item.collection || 'Free Home Collection'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-slate-800">{item.price}</span>
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
        <div className="px-4 pt-4 max-w-md mx-auto space-y-4">
          {['TEST_DETAIL', 'HOME_COLLECTION', 'PATIENT', 'DATE_TIME', 'REVIEW'].includes(viewState) && (
            <div className="flex items-center justify-between px-2 mb-2 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
              {['Test', 'Lab', 'Patient', 'Date & Time', 'Review', 'Confirm'].map((step, idx) => {
                const isActive =
                  (viewState === 'TEST_DETAIL' && idx === 0) ||
                  (viewState === 'HOME_COLLECTION' && idx === 1) ||
                  (viewState === 'PATIENT' && idx === 2) ||
                  (viewState === 'DATE_TIME' && idx === 3) ||
                  (viewState === 'REVIEW' && idx === 4) ||
                  (viewState === 'CONFIRMED' && idx === 5);

                return (
                  <div key={step} className="flex flex-col items-center flex-1">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 ${
                        isActive
                          ? 'bg-[#0055ff] text-white shadow-md'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span
                      className={`text-[9px] font-bold text-center ${
                        isActive ? 'text-[#0055ff]' : 'text-slate-400'
                      }`}
                    >
                      {step.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW: TEST_DETAIL */}
          {viewState === 'TEST_DETAIL' && selectedItem && (
            <section className="animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-6">
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className={`w-14 h-14 rounded-xl ${
                      (selectedItem as any)?.bg || 'bg-blue-50'
                    } flex items-center justify-center shrink-0 overflow-hidden`}
                  >
                    {getTestIcon(selectedItem.name) ? (
                      <img
                        src={getTestIcon(selectedItem.name)!}
                        alt={selectedItem.name}
                        className="w-10 h-10 object-contain"
                      />
                    ) : selectedItem.icon ? (
                      <selectedItem.icon className="w-7 h-7 text-blue-500" />
                    ) : (
                      <TestTube className="w-7 h-7 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-[18px] font-black text-slate-900 leading-tight mb-1">
                      {selectedItem.name}
                    </h2>
                    <p className="text-[12px] text-slate-500 font-medium">
                      {selectedItem.category} • {selectedItem.sampleType || 'Blood Sample'}
                    </p>
                  </div>
                </div>

                <p className="text-[12px] text-slate-600 font-medium mb-4 leading-relaxed">
                  {selectedItem.desc || selectedItem.description || 'Standard diagnostic laboratory investigation.'}
                </p>

                <div className="flex flex-col gap-2 py-3 border-t border-b border-slate-100 mb-4 text-[12px]">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Report Time: {selectedItem.time || selectedItem.tat || '12-24 Hours'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                    <span>
                      Preparation: {selectedItem.prep || selectedItem.preparation || 'No special fasting required.'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-bold text-emerald-600">
                    <Home className="w-4 h-4 text-emerald-500" />
                    <span>Doorstep Home Sample Collection Available</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-slate-500">Starting Price</span>
                  <span className="text-[20px] font-black text-blue-600">{selectedItem.price}</span>
                </div>
              </div>

              <button
                onClick={handleProceedToHomeCollection}
                className="w-full flex items-center justify-center bg-[#0055ff] text-white py-3.5 rounded-xl text-[13px] font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
              >
                Select Laboratory & Continue
              </button>
            </section>
          )}

          {/* VIEW: HOME_COLLECTION (Select Laboratory Offering Home Collection) */}
          {viewState === 'HOME_COLLECTION' && (
            <section className="animate-in fade-in zoom-in-95 duration-300">
              <h2 className="text-[18px] font-black text-slate-900 mb-2">Select Diagnostic Laboratory</h2>
              <p className="text-[12px] text-slate-500 font-medium mb-4">
                Choose a certified laboratory providing home collection for this test.
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
              ) : labError ? (
                <div className="bg-white p-6 rounded-2xl border border-amber-200 text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                  <p className="text-xs text-slate-700 font-bold">{labError}</p>
                  <button
                    onClick={() => selectedItem?.id && loadEligibleLaboratories(selectedItem.id)}
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    Retry
                  </button>
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
                          onClick={() => setSelectedLab(lab)}
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
                              <h3 className="text-[13px] font-bold text-slate-900 leading-tight">
                                {lab.name}
                              </h3>
                              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                {lab.location || lab.address || 'NABL Certified Lab'}
                              </p>
                              <div className="flex items-center gap-3 mt-2 text-[11px]">
                                <span className="font-black text-blue-600">{lab.price}</span>
                                <span className="text-slate-400">•</span>
                                <span className="font-semibold text-emerald-600">
                                  {lab.homeCollectionFee && lab.homeCollectionFee > 0
                                    ? `₹${lab.homeCollectionFee} Home Fee`
                                    : 'Free Home Collection'}
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
                  onClick={handleProceedToPatient}
                  className="w-full flex items-center justify-center bg-[#0055ff] text-white py-3.5 rounded-xl text-[13px] font-bold disabled:opacity-50 hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
                >
                  Continue to Patient Details
                </button>
                <button
                  onClick={() => setViewState('TEST_DETAIL')}
                  className="w-full flex items-center justify-center bg-white text-slate-700 border border-slate-200 py-3.5 rounded-xl text-[13px] font-bold hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
              </div>
            </section>
          )}

          {/* VIEW: PATIENT */}
          {viewState === 'PATIENT' && (
            <section className="animate-in fade-in zoom-in-95 duration-300">
              <h2 className="text-[18px] font-black text-slate-900 mb-1">Patient & Collection Address</h2>
              <p className="text-[12px] text-slate-500 font-medium mb-4">
                Sample will be collected at this location by a certified phlebotomist.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleProceedToDateTime();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                    Patient Name *
                  </label>
                  <input
                    name="name"
                    value={patientDetails.name}
                    onChange={handlePatientChange}
                    required
                    type="text"
                    className="w-full border border-slate-200 rounded-xl p-3 text-[13px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Enter full name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Age</label>
                    <input
                      name="age"
                      value={patientDetails.age}
                      onChange={handlePatientChange}
                      type="number"
                      className="w-full border border-slate-200 rounded-xl p-3 text-[13px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="e.g. 30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Gender</label>
                    <select
                      name="gender"
                      value={patientDetails.gender}
                      onChange={handlePatientChange as any}
                      className="w-full border border-slate-200 rounded-xl p-3 text-[13px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                    Contact Phone Number *
                  </label>
                  <input
                    name="phone"
                    value={patientDetails.phone}
                    onChange={handlePatientChange}
                    required
                    type="tel"
                    className="w-full border border-slate-200 rounded-xl p-3 text-[13px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="10-digit mobile number"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Email</label>
                  <input
                    name="email"
                    value={patientDetails.email}
                    onChange={handlePatientChange}
                    type="email"
                    className="w-full border border-slate-200 rounded-xl p-3 text-[13px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="name@example.com"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                    Doorstep Home Collection Address *
                  </label>
                  <textarea
                    name="address"
                    value={patientDetails.address}
                    onChange={handlePatientChange}
                    required
                    rows={3}
                    className="w-full border border-slate-200 rounded-xl p-3 text-[13px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    placeholder="House/Flat No., Building Name, Street, Area, City, PIN Code"
                  ></textarea>
                </div>

                <div className="space-y-3 mt-4">
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center bg-[#0055ff] text-white py-3.5 rounded-xl text-[13px] font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
                  >
                    Continue to Schedule Slot
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewState('HOME_COLLECTION')}
                    className="w-full flex items-center justify-center bg-white text-slate-700 border border-slate-200 py-3.5 rounded-xl text-[13px] font-bold hover:bg-slate-50 transition-colors"
                  >
                    Back
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* VIEW: DATE_TIME */}
          {viewState === 'DATE_TIME' && (
            <section className="animate-in fade-in zoom-in-95 duration-300">
              <h2 className="text-[18px] font-black text-slate-900 mb-1">Choose Collection Date & Slot</h2>
              <p className="text-[12px] text-slate-500 font-medium mb-4">
                Select when our phlebotomist should arrive at your doorstep.
              </p>

              {/* Date selection */}
              <div className="mb-6">
                <h3 className="text-[13px] font-bold text-slate-800 mb-3">Available Dates</h3>
                <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                  {availableDates.map((d) => {
                    const isSelected = selectedDate === d.date;
                    return (
                      <button
                        key={d.date}
                        onClick={() => {
                          setSelectedDate(d.date);
                          if (selectedLab) loadSlots(selectedLab.id, d.date);
                        }}
                        className={`shrink-0 px-4 py-2.5 rounded-xl text-[12px] font-bold border transition-colors ${
                          isSelected
                            ? 'bg-[#0055ff] border-[#0055ff] text-white shadow-md shadow-blue-500/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slot selection */}
              <div className="mb-6">
                <h3 className="text-[13px] font-bold text-slate-800 mb-3">Available Time Slots</h3>
                {isLoadingSlots ? (
                  <div className="text-center py-6">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-slate-400 mt-2">Checking available slots...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((s) => {
                      const isSelected = selectedTime === s.slot;
                      return (
                        <button
                          key={s.slot}
                          disabled={!s.available}
                          onClick={() => setSelectedTime(s.slot)}
                          className={`px-2 py-2.5 rounded-xl text-[11px] font-bold border transition-colors ${
                            !s.available
                              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through'
                              : isSelected
                              ? 'bg-[#0055ff] border-[#0055ff] text-white shadow-md shadow-blue-500/20'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {s.slot}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-3 mt-4">
                <button
                  disabled={!selectedDate || !selectedTime}
                  onClick={handleProceedToReview}
                  className="w-full flex items-center justify-center bg-[#0055ff] text-white py-3.5 rounded-xl text-[13px] font-bold disabled:opacity-50 hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
                >
                  Review Booking
                </button>
                <button
                  onClick={() => setViewState('PATIENT')}
                  className="w-full flex items-center justify-center bg-white text-slate-700 border border-slate-200 py-3.5 rounded-xl text-[13px] font-bold hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
              </div>
            </section>
          )}

          {/* VIEW: REVIEW */}
          {viewState === 'REVIEW' && (
            <section className="animate-in fade-in zoom-in-95 duration-300">
              <h2 className="text-[18px] font-black text-slate-900 mb-4">Review Your Booking</h2>

              {bookingError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-medium mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{bookingError}</span>
                </div>
              )}

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 mb-4">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 mb-0.5">Test</p>
                  <p className="text-[13px] font-black text-slate-800">{selectedItem?.name}</p>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <p className="text-[11px] font-bold text-slate-400 mb-0.5">Laboratory Provider</p>
                  <p className="text-[13px] font-bold text-slate-800">{selectedLab?.name}</p>
                  <p className="text-[11px] text-slate-500">{selectedLab?.address || selectedLab?.location}</p>
                </div>

                <div className="border-t border-slate-100 pt-3 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 mb-0.5">Date</p>
                    <p className="text-[13px] font-bold text-slate-800">{selectedDate}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 mb-0.5">Time Slot</p>
                    <p className="text-[13px] font-bold text-slate-800">{selectedTime}</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <p className="text-[11px] font-bold text-slate-400 mb-0.5">Patient</p>
                  <p className="text-[13px] font-bold text-slate-800">
                    {patientDetails.name} ({patientDetails.gender}, {patientDetails.age} yrs)
                  </p>
                  <p className="text-[11px] text-slate-500">Phone: {patientDetails.phone}</p>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <p className="text-[11px] font-bold text-slate-400 mb-0.5">Doorstep Collection Address</p>
                  <p className="text-[13px] font-medium text-slate-800 leading-tight">
                    {patientDetails.address}
                  </p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 mb-4 text-xs">
                <h3 className="font-bold text-slate-800 text-[13px] mb-2">Price Breakdown</h3>
                <div className="flex justify-between text-slate-600">
                  <span>Diagnostic Test Price</span>
                  <span className="font-semibold text-slate-800">₹{effectiveTestPrice}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Home Collection Fee</span>
                  <span className="font-semibold text-slate-800">
                    {effectiveCollectionFee > 0 ? `₹${effectiveCollectionFee}` : 'Free'}
                  </span>
                </div>
                <div className="border-t border-slate-100 pt-2 flex justify-between text-sm font-black text-slate-900">
                  <span>Total Amount</span>
                  <span className="text-blue-600 text-[16px]">₹{effectiveTotal}</span>
                </div>
              </div>

              {/* Payment Mode Selection */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2 mb-6">
                <h3 className="font-bold text-slate-800 text-xs mb-2">Select Payment Mode</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('ONLINE')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2 text-xs font-bold transition-colors ${
                      paymentMethod === 'ONLINE'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span>Pay Online (UPI / Card)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('COD')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2 text-xs font-bold transition-colors ${
                      paymentMethod === 'COD'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Home className="w-4 h-4 text-emerald-600" />
                    <span>Pay on Collection</span>
                  </button>
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
                    <span>Confirm & Book (₹{effectiveTotal})</span>
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

          {/* VIEW: CONFIRMED */}
          {viewState === 'CONFIRMED' && (
            <section className="animate-in fade-in zoom-in-95 duration-300 text-center pt-4">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-white shadow-sm">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-[20px] font-black text-slate-900 mb-2">Booking Confirmed</h2>
              <p className="text-[12px] text-slate-500 font-medium mb-6">
                Your home collection has been scheduled successfully.
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
                  onClick={() => setViewState('LIST')}
                  className="w-full flex items-center justify-center bg-white text-slate-700 border border-slate-200 py-3 rounded-xl text-[13px] font-bold hover:bg-slate-50 transition-colors"
                >
                  Back to Home Sample Collection
                </button>
              </div>
            </section>
          )}

          {/* VIEW: STATUS */}
          {viewState === 'STATUS' && (
            <section className="animate-in fade-in zoom-in-95 duration-300">
              <h2 className="text-[18px] font-black text-slate-900 mb-4">Home Collection Status</h2>

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
                    <span className="text-[13px] font-medium text-slate-400">Phlebotomist Assigned</span>
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
                Back to Home Sample Collection
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeSampleList;
