import { useState } from 'react';
import { ArrowLeft, TestTube, Search, Clock, Beaker, Activity, Droplet, Heart, ChevronRight, Calendar, Hospital, FileText, CheckCircle, MapPin, User, Download, Home, FileCheck, CheckSquare, ShieldCheck, FileClock, ShieldAlert, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Icon mapping: test name (cleaned) -> optimized medical illustration
const testIconMap: Record<string, string> = {
  'Complete Blood Count (CBC)': '/optimized/Blood Test.webp',
  'Complete Blood\nCount (CBC)': '/optimized/Blood Test.webp',
  'Liver Function Test (LFT)': '/optimized/Liver Function Test.webp',
  'Liver Function\nTest (LFT)': '/optimized/Liver Function Test.webp',
  'Thyroid Profile (T3, T4, TSH)': '/optimized/Thyroid Disorder.webp',
  'Thyroid Profile\n(T3, T4, TSH)': '/optimized/Thyroid Disorder.webp',
  'Lipid Profile': '/optimized/Cholesterol Test.webp',
  'Blood Sugar Test': '/optimized/Blood Sugar Test.webp',
  'HbA1c': '/optimized/Blood Sugar Test.webp',
  'Kidney Function Test': '/optimized/Kidney Function Test.webp',
  'Vitamin D': '/optimized/Vitamin D Test.webp',
  'Vitamin B12': '/optimized/Vitamin B12 Test.webp',
  'Urine Routine': '/optimized/Urine Test.webp',
  'Iron Profile': '/optimized/Blood Test.webp',
  'Cardiac Risk Profile': '/optimized/Heart Disease.webp',
  'Cholesterol Test': '/optimized/Cholesterol Test.webp',
};

const healthConcernIconMap: Record<string, string> = {
  'fever': '/optimized/Fever.webp',
  'diabetes': '/optimized/Diabetes.webp',
  'heart': '/optimized/Heart Disease.webp',
  'thyroid': '/optimized/Thyroid Disorder.webp',
  'liver': '/optimized/Fatty Liver Disease.webp',
  'kidney': '/optimized/Kidney Disease.webp',
  'vitamins': '/optimized/Vitamin Deficiency.webp',
  'infection': '/optimized/Viral Infection.webp',
};

const getTestIcon = (name: string): string | null => {
  const cleanName = name.replace(/\n/g, ' ');
  return testIconMap[name] || testIconMap[cleanName] || null;
};

const howItWorks = [
  { id: '01', title: 'Choose Test', desc: 'Select the health\\ntest you need.', icon: TestTube },
  { id: '02', title: 'Select Lab', desc: 'Choose a suitable\\nlaboratory for\\nyour test.', icon: Hospital },
  { id: '03', title: 'Select Date & Time', desc: 'Choose a convenient\\navailable slot.', icon: Calendar },
  { id: '04', title: 'Sample Collection', desc: 'Provide your sample\\nat the selected\\nlocation.', icon: MapPin },
  { id: '05', title: 'Lab Processing', desc: 'The laboratory\\nprocesses and\\nanalyzes sample.', icon: Search },
  { id: '06', title: 'Report Ready', desc: 'View your test report\\nwhen it becomes\\navailable.', icon: FileText },
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

const labTests = [
  { id: '1', name: 'Complete Blood\nCount (CBC)', provider: 'Apollo Diagnostics', price: '₹399', time: '12 Hours', parameters: 24, icon: TestTube, color: 'text-purple-600', bg: 'bg-purple-100', desc: 'A complete blood count (CBC) is a blood test used to evaluate your overall health and detect a wide range of disorders, including anemia, infection and leukemia.', prep: 'No special preparation required. Fasting is not needed.', category: 'Blood Tests', concern: 'fever' },
  { id: '2', name: 'Liver Function\nTest (LFT)', provider: 'Apollo Diagnostics', price: '₹499', time: '12 Hours', parameters: 11, icon: Activity, color: 'text-yellow-600', bg: 'bg-yellow-100', desc: 'Liver function tests are blood tests used to help diagnose and monitor liver disease or damage.', prep: '10-12 hours of fasting is required.', category: 'Liver', concern: 'liver' },
  { id: '3', name: 'Thyroid Profile\n(T3, T4, TSH)', provider: 'Apollo Diagnostics', price: '₹399', time: '12 Hours', parameters: 3, icon: Activity, color: 'text-green-600', bg: 'bg-green-100', desc: 'Thyroid tests measure how well your thyroid gland is working.', prep: 'No special preparation required.', category: 'Thyroid', concern: 'thyroid' },
  { id: '4', name: 'Lipid Profile', provider: 'Vijaya Diagnostic', price: '₹799', time: '12 Hours', parameters: 8, icon: Heart, color: 'text-rose-600', bg: 'bg-rose-100', desc: 'Measures cholesterol and triglycerides in the blood.', prep: '12 hours of fasting is required.', category: 'Heart', concern: 'heart' },
  { id: '5', name: 'Blood Sugar\nTest (Fasting)', provider: 'Apollo Diagnostics', price: '₹149', time: '6 Hours', parameters: 1, icon: Droplet, color: 'text-blue-600', bg: 'bg-blue-100', desc: 'Measures blood glucose after an overnight fast.', prep: '10-12 hours of fasting is required.', category: 'Diabetes', concern: 'diabetes' },
  { id: '6', name: 'Kidney Function\nTest (KFT)', provider: 'Apollo Diagnostics', price: '₹599', time: '12 Hours', parameters: 9, icon: Activity, color: 'text-purple-600', bg: 'bg-purple-100', desc: 'Assesses how well your kidneys are functioning.', prep: 'No special preparation required.', category: 'Kidney', concern: 'kidney' },
  { id: '7', name: 'Vitamin D\nTest', provider: 'PathCare Labs', price: '₹1199', time: '24 Hours', parameters: 1, icon: TestTube, color: 'text-orange-600', bg: 'bg-orange-100', desc: 'Measures the level of Vitamin D in your blood.', prep: 'No special preparation required.', category: 'Vitamins', concern: 'vitamins' },
  { id: '8', name: 'Vitamin B12\nTest', provider: 'Lucid Medical', price: '₹899', time: '24 Hours', parameters: 1, icon: TestTube, color: 'text-orange-600', bg: 'bg-orange-100', desc: 'Measures the level of Vitamin B12 in your blood.', prep: 'No special preparation required.', category: 'Vitamins', concern: 'vitamins' },
  { id: '9', name: 'HbA1c Blood\nTest', provider: 'Apollo Diagnostics', price: '₹399', time: '12 Hours', parameters: 2, icon: Droplet, color: 'text-blue-600', bg: 'bg-blue-100', desc: 'Measures average blood sugar levels over the past 3 months.', prep: 'No special preparation required.', category: 'Diabetes', concern: 'diabetes' },
  { id: '10', name: 'Urine Routine &\nMicroscopy', provider: 'Apollo Diagnostics', price: '₹199', time: '6 Hours', parameters: 18, icon: TestTube, color: 'text-yellow-600', bg: 'bg-yellow-100', desc: 'Examines physical, chemical, and microscopic properties of urine.', prep: 'First morning sample preferred.', category: 'Urine Tests', concern: 'kidney' },
  { id: '11', name: 'Cardiac Risk\nProfile', provider: 'Tenet Diagnostics', price: '₹1999', time: '24 Hours', parameters: 14, icon: Heart, color: 'text-rose-600', bg: 'bg-rose-100', desc: 'Comprehensive test panel assessing heart health risk factors.', prep: '12 hours of fasting is required.', category: 'Heart', concern: 'heart' },
  { id: '12', name: 'Iron Profile\nTest', provider: 'Tenet Diagnostics', price: '₹799', time: '12 Hours', parameters: 5, icon: TestTube, color: 'text-red-600', bg: 'bg-red-100', desc: 'Measures various iron levels to detect anemia and deficiency.', prep: 'No special preparation required.', category: 'Blood Tests', concern: 'fever' },
];

const diagnosticPackages = [
  { id: 'p1', name: 'Complete Health\\nCheckup', tests: '60 Tests', time: '24 Hours', price: '₹1199', icon: Heart, color: 'text-blue-600', bg: 'bg-blue-100', btnBg: 'bg-[#0055ff]', desc: 'Includes common blood, liver, kidney and vitamin tests.', prep: '10-12 hours of fasting is required.' },
  { id: 'p2', name: 'Diabetes Care\\nPackage', tests: '3 Tests', time: '24 Hours', price: '₹899', icon: Droplet, color: 'text-indigo-600', bg: 'bg-indigo-100', btnBg: 'bg-[#0055ff]', desc: 'Includes: Fasting Blood Sugar, HbA1c, Post Meal Blood Sugar.', prep: '10-12 hours of fasting is required.' },
  { id: 'p3', name: 'Heart Health\\nPackage', tests: '3 Tests', time: '24 Hours', price: '₹999', icon: Heart, color: 'text-rose-600', bg: 'bg-rose-100', btnBg: 'bg-[#0055ff]', desc: 'Includes: Lipid Profile, Cardiac Risk Profile, Cholesterol Test.', prep: '12 hours of fasting is required.' },
  { id: 'p4', name: 'Thyroid Package', tests: '3 Tests', time: '24 Hours', price: '₹499', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-100', btnBg: 'bg-[#0055ff]', desc: 'Includes: TSH, T3, T4.', prep: 'No fasting required.' },
  { id: 'p5', name: "Women's Health\\nPackage", tests: '32 Tests', time: '24 Hours', price: '₹1499', icon: Activity, color: 'text-pink-600', bg: 'bg-pink-100', btnBg: 'bg-[#0055ff]', desc: "Tailored health package addressing key aspects of women's health.", prep: '10-12 hours of fasting is required.' },
  { id: 'p6', name: 'Senior Citizen\\nHealth Package', tests: '40 Tests', time: '24 Hours', price: '₹1999', icon: Heart, color: 'text-blue-600', bg: 'bg-blue-100', btnBg: 'bg-[#0055ff]', desc: 'Comprehensive health monitoring tailored for senior citizens.', prep: '10-12 hours of fasting is required.' },
];

const mockLabs = [
  { id: 'l1', name: 'MediCare Diagnostics', location: 'Hyderabad, Telangana', rating: 4.8, time: 'Within 24 Hours', price: '₹500' },
  { id: 'l2', name: 'Apollo Diagnostics', location: 'Jubilee Hills, Hyderabad', rating: 4.9, time: 'Within 12 Hours', price: '₹550' },
  { id: 'l3', name: 'PathCare Labs', location: 'Madhapur, Hyderabad', rating: 4.6, time: 'Within 24 Hours', price: '₹450' }
];

const mockDates = ['Today', 'Tomorrow', '20 Aug', '21 Aug'];
const mockTimes = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '04:00 PM', '05:00 PM'];

const LabTestList = () => {
  const navigate = useNavigate();
  
  const [viewState, setViewState] = useState<'LIST' | 'CONCERN_RESULTS' | 'TEST_DETAIL' | 'LAB_SELECT' | 'DATE_TIME' | 'COLLECTION' | 'PATIENT' | 'REVIEW' | 'CONFIRMED' | 'STATUS'>('LIST');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('All Tests');
  const categoryTabs = ['All Tests', 'Blood Tests', 'Diabetes', 'Heart', 'Thyroid', 'Liver', 'Kidney', 'Vitamins', 'Hormones', 'Infection', 'Urine Tests', 'Cancer Screening'];
  const [showAllTests, setShowAllTests] = useState(false);
  const [showAllPackages, setShowAllPackages] = useState(false);
  const q = searchQuery.toLowerCase().trim();
  const [selectedConcern, setSelectedConcern] = useState<string | null>(null);
  
  const filteredByCategory = selectedTab === 'All Tests' ? labTests : labTests.filter(t => (t as any).category === selectedTab || ((t as any).categories && (t as any).categories.includes(selectedTab)));
  const filteredLabTests = q ? filteredByCategory.filter(t => 
    t.name.toLowerCase().includes(q) || 
    t.desc.toLowerCase().includes(q) ||
    (t as any).category?.toLowerCase().includes(q) ||
    (t as any).concern?.toLowerCase().includes(q)
  ) : filteredByCategory;
  const displayLabTests = (showAllTests || q) ? filteredLabTests : filteredLabTests.slice(0, 8);
  
  const filteredPackages = q ? diagnosticPackages.filter(p => p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)) : diagnosticPackages;

  const activeConcern = healthConcerns.find(c => c.id === selectedConcern);
  const concernTests = activeConcern ? labTests.filter(t => (t as any).concern === activeConcern.id || (t as any).category?.toLowerCase() === activeConcern.name.toLowerCase()) : [];

  const hasResults = filteredLabTests.length > 0 || filteredPackages.length > 0 || concernTests.length > 0;
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedLab, setSelectedLab] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [collectionMethod, setCollectionMethod] = useState<'HOME' | 'LAB' | null>(null);
  
  const [patientDetails, setPatientDetails] = useState({
    name: 'Mani Kanta',
    age: '30',
    gender: 'Male',
    phone: '9876543210',
    email: 'mani@example.com',
    address: 'Madhapur, Hyderabad, 500081'
  });

  const handleBookNow = (item: any) => {
    setSelectedItem(item);
    setViewState('TEST_DETAIL');
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
      case 'LAB_SELECT': setViewState('TEST_DETAIL'); break;
      case 'DATE_TIME': setViewState('LAB_SELECT'); break;
      case 'COLLECTION': setViewState('DATE_TIME'); break;
      case 'PATIENT': setViewState('COLLECTION'); break;
      case 'REVIEW': setViewState('PATIENT'); break;
      case 'CONFIRMED': setViewState('LIST'); break;
      case 'STATUS': setViewState('LIST'); break;
      default:
        if (window.history.state && window.history.state.idx > 0) {
          navigate(-1);
        } else {
          navigate('/');
        }
    }
  };

  const handlePatientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setPatientDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-x-hidden relative">      {/* Header */}
      <div className="bg-gradient-to-r from-[#0055ff] to-[#06b6d4] pt-4 pb-5 px-4 text-white shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={handleBack} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
             <h1 className="text-[17px] font-bold">Lab Tests</h1>
             {viewState !== 'LIST' && (
                <p className="text-[11px] text-blue-100 mt-0.5 capitalize">{viewState.replace('_', ' ').toLowerCase()}</p>
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
              <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
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
              {q && !hasResults ? (
                <div className="text-center py-8">
                  <p className="text-[14px] text-slate-500 font-bold">No matching tests found</p>
                </div>
              ) : (
                <>
                  {!q && (
                    <>
              {/* How it works? - TILE STYLE */}
              <div className="bg-white pt-6 pb-2 mb-2 shadow-sm overflow-hidden">
                <div className="flex items-center justify-center gap-3 mb-5">
                   <div className="h-[1px] w-6 bg-blue-600/30"></div>
                   <h2 className="font-bold text-slate-800 text-[15px]">How Lab Testing Works</h2>
                   <div className="h-[1px] w-6 bg-blue-600/30"></div>
                </div>
                
                <div className="relative group w-full">
                  <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4 pb-4 snap-x" style={{ scrollSnapType: 'x mandatory' }}>
                     {howItWorks.map((step) => (
                        <div key={step.id} className="snap-center shrink-0 w-[150px] bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col relative overflow-hidden">
                           <div className="absolute top-0 right-0 bg-blue-50 text-blue-600 font-black text-[10px] px-2 py-1 rounded-bl-xl border-b border-l border-blue-100">
                             {step.id}
                           </div>
                           <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                              <step.icon className="w-5 h-5" strokeWidth={2} />
                           </div>
                           <h3 className="font-bold text-slate-900 text-[13px] mb-1 leading-tight">{step.title}</h3>
                           <p className="text-[10px] text-slate-500 font-medium leading-relaxed whitespace-pre-line">{step.desc}</p>
                        </div>
                     ))}
                  </div>
                </div>
              </div>

              {/* Lab Tests - CIRCLE STYLE */}
              <div className="bg-white pt-5 pb-6 mb-2 shadow-sm">
                <div className="px-4 mb-4 flex items-center justify-between">
                  <h2 className="text-[16px] font-bold text-slate-800">Lab Tests</h2>
                  {filteredByCategory.length > 8 && (
                    <div onClick={() => setShowAllTests(!showAllTests)} className="flex items-center text-blue-600 cursor-pointer">
                      <span className="text-[11px] font-bold">{showAllTests ? 'Show Less' : 'View All'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
                
                {/* Category Tabs */}
                <div className="flex gap-2 overflow-x-auto hide-scrollbar px-4 mb-6 pb-1">
                   {categoryTabs.map(tab => (
                     <button 
                       key={tab} 
                       onClick={() => setSelectedTab(tab)}
                       className={`shrink-0 px-4 py-1.5 rounded-full text-[12px] font-bold transition-all ${selectedTab === tab ? 'bg-[#0055ff] text-white shadow-md shadow-blue-500/20' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
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
                     <div key={item.id} onClick={() => handleBookNow(item)} className="flex flex-col items-center gap-2 cursor-pointer group">
                       <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full ${(item as any).bg} flex items-center justify-center border border-slate-100 group-hover:shadow-lg group-hover:scale-110 transition-all duration-200 overflow-hidden`}>
                         {iconSrc ? (
                           <img src={iconSrc} alt={item.name.replace('\n', ' ')} className="w-10 h-10 md:w-12 md:h-12 object-contain" />
                         ) : (
                           <item.icon className={`w-6 h-6 md:w-7 md:h-7 ${(item as any).color}`} strokeWidth={1.5} />
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
              <div className="bg-white pt-5 pb-6 mb-2 shadow-sm">
                <div className="px-4 mb-4">
                  <h2 className="text-[16px] font-bold text-slate-800">Find Tests by Health Concern</h2>
                </div>
                 <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4 mb-5 pb-1">
                    {healthConcerns.map(concern => (
                      <div 
                        key={concern.id} 
                        onClick={() => { setSelectedConcern(concern.id); setViewState('CONCERN_RESULTS'); }}
                        className="flex flex-col items-center shrink-0 w-[72px] cursor-pointer group"
                      >
                        <div className={`w-14 h-14 rounded-full ${concern.bg} flex items-center justify-center mb-1.5 border border-slate-100 group-hover:shadow-lg group-hover:scale-110 transition-all duration-200 overflow-hidden`}>
                          {healthConcernIconMap[concern.id] ? (
                            <img src={healthConcernIconMap[concern.id]} alt={concern.name} className="w-10 h-10 object-contain" />
                          ) : (
                            <concern.icon className={`w-6 h-6 ${concern.color}`} />
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-slate-700 text-center">{concern.name}</span>
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
                  <h2 className="text-[15px] font-bold text-slate-800">{q ? 'Matching Packages' : 'Diagnostic Packages'}</h2>
                  {!q && (
                    <button 
                      onClick={() => setShowAllPackages(!showAllPackages)} 
                      className="flex items-center text-blue-600 cursor-pointer hover:text-blue-700 transition-colors"
                    >
                      <span className="text-[11px] font-bold">{showAllPackages ? 'Show Less' : 'View All'}</span>
                      <ChevronRight className={`w-4 h-4 transition-transform ${showAllPackages ? '-rotate-90' : ''}`} />
                    </button>
                  )}
                </div>
                <div className={showAllPackages ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 px-4" : "flex overflow-x-auto hide-scrollbar gap-3 pb-2 px-4"}>
                  {filteredPackages.map((item) => (
                     <div key={item.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm min-w-[210px] max-w-[240px] shrink-0 flex flex-col justify-between overflow-hidden hover:shadow-md transition-shadow">
                       <div className={`h-1.5 w-full bg-gradient-to-r ${(item as any).color === 'text-blue-600' ? 'from-blue-500 to-blue-400' : (item as any).color === 'text-rose-600' ? 'from-rose-500 to-rose-400' : (item as any).color === 'text-indigo-600' ? 'from-indigo-500 to-indigo-400' : (item as any).color === 'text-emerald-600' ? 'from-emerald-500 to-emerald-400' : (item as any).color === 'text-pink-600' ? 'from-pink-500 to-pink-400' : 'from-blue-500 to-cyan-400'}`}></div>
                       <div className="p-3.5">
                       <div className="mb-3">
                         <div className="flex items-start gap-2.5 mb-2">
                             <div className={`w-10 h-10 rounded-xl ${(item as any).bg} ${(item as any).color} flex items-center justify-center shrink-0`}>
                               <item.icon className="w-5 h-5" strokeWidth={2} />
                             </div>
                             <div>
                                 <h3 className="font-bold text-slate-900 text-[12px] leading-tight mb-0.5 whitespace-pre-line">{item.name}</h3>
                                 <p className="text-[9px] text-slate-500 font-medium">({(item as any).tests})</p>
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
                         <button onClick={() => handleBookNow(item)} className="flex-1 bg-slate-50 text-slate-700 border border-slate-200 py-1.5 rounded-lg text-[10px] font-bold hover:bg-slate-100 transition-colors">
                            View
                         </button>
                         <button onClick={() => handleBookNow(item)} className={`flex-1 text-white py-1.5 rounded-lg text-[10px] font-bold ${(item as any).btnBg} hover:opacity-90 transition-opacity shadow-sm`}>
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
           </div>
        )}
        {/* VIEW: CONCERN_RESULTS */}
        {viewState === 'CONCERN_RESULTS' && activeConcern && (
           <div className="animate-in fade-in duration-300 px-4 pt-4 pb-6">
             <div className="flex items-center gap-3 mb-6">
               <div className={`w-12 h-12 rounded-full ${activeConcern.bg} flex items-center justify-center shrink-0 shadow-sm border border-slate-100`}>
                 <activeConcern.icon className={`w-6 h-6 ${activeConcern.color}`} />
               </div>
               <div>
                 <h2 className="text-[18px] font-bold text-slate-800 leading-tight">{activeConcern.name} Tests</h2>
                 <p className="text-[12px] text-slate-500">Find and book relevant tests</p>
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
               {concernTests.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.desc.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                 <div className="text-center py-8">
                   <p className="text-[14px] text-slate-500 font-bold">No tests found matching your search</p>
                 </div>
               ) : (
                 concernTests.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.desc.toLowerCase().includes(searchQuery.toLowerCase())).map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-12 h-12 rounded-xl ${(item as any).bg} ${(item as any).color} flex items-center justify-center shrink-0 overflow-hidden`}>
                          {getTestIcon(item.name) ? (
                            <img src={getTestIcon(item.name)!} alt={item.name.replace('\n', ' ')} className="w-9 h-9 object-contain" />
                          ) : (
                            <item.icon className="w-6 h-6" strokeWidth={2} />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-[14px] leading-tight mb-1 whitespace-pre-line">{item.name}</h3>
                          <p className="text-[11px] text-slate-500 font-medium">{(item as any).provider}</p>
                        </div>
                      </div>
                      <div>
                        <div className="flex flex-col gap-1.5 mb-3 border-t border-b border-slate-100 py-2 mt-1">
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                             <Clock className="w-4 h-4 text-slate-400" />
                             <span>{item.time}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[16px] font-black text-blue-600">{item.price}</span>
                          <button onClick={() => handleBookNow(item)} className="bg-[#0055ff] text-white px-5 py-2 rounded-xl text-[12px] font-bold shadow-md shadow-blue-500/20 hover:bg-blue-600 transition-colors shrink-0">
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

        {/* BOOKING FLOW VIEWS */}
        <div className="px-4 pt-6 max-w-md mx-auto space-y-6">

          {/* VIEW: TEST DETAIL */}
          {viewState === 'TEST_DETAIL' && (
             <section className="animate-in fade-in duration-300">
                 <h2 className="text-[18px] font-black text-slate-900 mb-4">Select Lab Test</h2>
                 
                 <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 bg-blue-50 rounded-bl-3xl text-blue-600">
                       <TestTube className="w-6 h-6" />
                    </div>
                    
                    <h3 className="font-bold text-slate-900 text-[16px] mb-2 pr-10 whitespace-pre-line">{selectedItem?.name}</h3>
                    <p className="text-[12px] text-slate-600 mb-4 font-medium leading-relaxed">{selectedItem?.desc}</p>
                    
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                       <div className="flex items-start gap-3">
                          <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                             <p className="text-[11px] font-bold text-slate-700">Estimated Report Time</p>
                             <p className="text-[11px] text-slate-500">Results typically ready in {selectedItem?.time}</p>
                          </div>
                       </div>
                       <div className="flex items-start gap-3">
                          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                             <p className="text-[11px] font-bold text-slate-700">Preparation</p>
                             <p className="text-[11px] text-slate-500">{selectedItem?.prep}</p>
                          </div>
                       </div>
                    </div>
                    
                    <div className="mt-6 flex items-center justify-between">
                       <span className="text-[20px] font-black text-blue-600">{selectedItem?.price}</span>
                       <button onClick={() => setViewState('LAB_SELECT')} className="bg-[#0055ff] text-white px-6 py-2.5 rounded-xl text-[13px] font-bold shadow-md shadow-blue-500/20 hover:bg-blue-600 transition-colors">
                          Continue
                       </button>
                    </div>
                 </div>
             </section>
          )}

          {/* VIEW: LAB SELECT */}
          {viewState === 'LAB_SELECT' && (
             <section className="animate-in fade-in zoom-in-95 duration-300">
                 <h2 className="text-[18px] font-black text-slate-900 mb-4">Select Laboratory</h2>
                 <p className="text-[12px] text-slate-500 mb-4 font-medium">Available labs for <span className="font-bold text-slate-700 whitespace-pre-line">{selectedItem?.name}</span></p>

                 <div className="space-y-3">
                    {mockLabs.map(lab => (
                       <div key={lab.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                             <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                   <Hospital className="w-5 h-5" />
                                </div>
                                <div>
                                   <h3 className="font-bold text-slate-900 text-[14px] leading-tight mb-1">{lab.name}</h3>
                                   <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                                      <MapPin className="w-3 h-3" /> {lab.location}
                                   </p>
                                </div>
                             </div>
                             <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-md text-[11px] font-bold">
                                <span>★</span> <span>{lab.rating}</span>
                             </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium mt-3 pb-3 border-b border-slate-100">
                             <Clock className="w-3 h-3 text-slate-400" /> Report: {lab.time}
                          </div>
                          
                          <div className="mt-3 flex items-center justify-between">
                             <span className="text-[16px] font-black text-blue-600">{lab.price}</span>
                             <button onClick={() => { setSelectedLab(lab); setViewState('DATE_TIME'); }} className="bg-white text-blue-600 border border-blue-200 px-5 py-2 rounded-xl text-[12px] font-bold hover:bg-blue-50 transition-colors">
                                Select Lab
                             </button>
                          </div>
                       </div>
                    ))}
                 </div>
             </section>
          )}

          {/* VIEW: DATE_TIME */}
          {viewState === 'DATE_TIME' && (
             <section className="animate-in fade-in zoom-in-95 duration-300">
                 <h2 className="text-[18px] font-black text-slate-900 mb-4">Choose Date & Time</h2>
                 
                 <div className="mb-6">
                    <h3 className="text-[13px] font-bold text-slate-800 mb-3">Available Dates</h3>
                    <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                       {mockDates.map(date => (
                          <button key={date} onClick={() => setSelectedDate(date)} className={`shrink-0 px-5 py-2.5 rounded-xl text-[12px] font-bold border transition-colors ${selectedDate === date ? 'bg-[#0055ff] border-[#0055ff] text-white shadow-md shadow-blue-500/20' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                             {date}
                          </button>
                       ))}
                    </div>
                 </div>

                 {selectedDate && (
                    <div className="mb-6 animate-in slide-in-from-top-2 duration-200">
                       <h3 className="text-[13px] font-bold text-slate-800 mb-3">Available Collection Slots</h3>
                       <div className="grid grid-cols-3 gap-2">
                          {mockTimes.map(time => (
                             <button key={time} onClick={() => setSelectedTime(time)} className={`px-2 py-2.5 rounded-xl text-[11px] font-bold border transition-colors ${selectedTime === time ? 'bg-[#0055ff] border-[#0055ff] text-white shadow-md shadow-blue-500/20' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                                {time}
                             </button>
                          ))}
                       </div>
                    </div>
                 )}

                 <button disabled={!selectedDate || !selectedTime} onClick={() => setViewState('COLLECTION')} className="w-full mt-4 flex items-center justify-center bg-[#0055ff] text-white py-3.5 rounded-xl text-[13px] font-bold disabled:opacity-50 hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30">
                    Continue
                 </button>
             </section>
          )}

          {/* VIEW: COLLECTION */}
          {viewState === 'COLLECTION' && (
             <section className="animate-in fade-in zoom-in-95 duration-300">
                 <h2 className="text-[18px] font-black text-slate-900 mb-4">Sample Collection</h2>
                 <p className="text-[12px] text-slate-500 mb-6 font-medium">How would you like to provide the sample?</p>
                 
                 <div className="space-y-4">
                    <button onClick={() => setCollectionMethod('LAB')} className={`w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition-all ${collectionMethod === 'LAB' ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${collectionMethod === 'LAB' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          <Hospital className="w-5 h-5" />
                       </div>
                       <div>
                          <h3 className="font-bold text-[14px] text-slate-900 mb-1">Visit Laboratory</h3>
                          <p className="text-[11px] text-slate-500 font-medium">Visit the selected laboratory for sample collection.</p>
                       </div>
                    </button>
                    
                    <button onClick={() => setCollectionMethod('HOME')} className={`w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition-all ${collectionMethod === 'HOME' ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${collectionMethod === 'HOME' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          <Home className="w-5 h-5" />
                       </div>
                       <div>
                          <h3 className="font-bold text-[14px] text-slate-900 mb-1">Home Sample Collection</h3>
                          <p className="text-[11px] text-slate-500 font-medium">A sample collection professional visits your home.</p>
                       </div>
                    </button>
                 </div>

                 <button disabled={!collectionMethod} onClick={() => setViewState('PATIENT')} className="w-full mt-8 flex items-center justify-center bg-[#0055ff] text-white py-3.5 rounded-xl text-[13px] font-bold disabled:opacity-50 hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30">
                    Continue
                 </button>
             </section>
          )}

          {/* VIEW: PATIENT */}
          {viewState === 'PATIENT' && (
             <section className="animate-in fade-in zoom-in-95 duration-300">
                 <h2 className="text-[18px] font-black text-slate-900 mb-4">Patient Details</h2>
                 <form onSubmit={(e) => { e.preventDefault(); setViewState('REVIEW'); }} className="space-y-4">
                    <div>
                       <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Patient Name</label>
                       <input name="name" value={patientDetails.name} onChange={handlePatientChange} required type="text" className="w-full border border-slate-200 rounded-xl p-3 text-[13px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Age</label>
                          <input name="age" value={patientDetails.age} onChange={handlePatientChange} required type="number" className="w-full border border-slate-200 rounded-xl p-3 text-[13px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                       </div>
                       <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Gender</label>
                          <select name="gender" value={patientDetails.gender} onChange={handlePatientChange as any} required className="w-full border border-slate-200 rounded-xl p-3 text-[13px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                             <option value="Male">Male</option>
                             <option value="Female">Female</option>
                             <option value="Other">Other</option>
                          </select>
                       </div>
                    </div>
                    <div>
                       <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Phone Number</label>
                       <input name="phone" value={patientDetails.phone} onChange={handlePatientChange} required type="tel" className="w-full border border-slate-200 rounded-xl p-3 text-[13px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                    </div>
                    <div>
                       <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Email</label>
                       <input name="email" value={patientDetails.email} onChange={handlePatientChange} type="email" className="w-full border border-slate-200 rounded-xl p-3 text-[13px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                    </div>
                    
                    {collectionMethod === 'HOME' && (
                       <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Collection Address</label>
                          <textarea name="address" value={patientDetails.address} onChange={handlePatientChange} required rows={3} className="w-full border border-slate-200 rounded-xl p-3 text-[13px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"></textarea>
                       </div>
                    )}

                    <button type="submit" className="w-full mt-4 flex items-center justify-center bg-[#0055ff] text-white py-3.5 rounded-xl text-[13px] font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30">
                       Continue
                    </button>
                 </form>
             </section>
          )}

          {/* VIEW: REVIEW */}
          {viewState === 'REVIEW' && (
             <section className="animate-in fade-in zoom-in-95 duration-300">
                 <h2 className="text-[18px] font-black text-slate-900 mb-4">Review Your Booking</h2>
                 
                 <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 mb-6">
                    <div>
                       <p className="text-[11px] font-bold text-slate-500 mb-0.5">Test</p>
                       <p className="text-[13px] font-black text-slate-800 whitespace-pre-line">{selectedItem?.name}</p>
                    </div>
                    <div className="border-t border-slate-100 pt-3">
                       <p className="text-[11px] font-bold text-slate-500 mb-0.5">Laboratory</p>
                       <p className="text-[13px] font-bold text-slate-800">{selectedLab?.name}</p>
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
                       <p className="text-[11px] font-bold text-slate-500 mb-0.5">Collection</p>
                       <p className="text-[13px] font-bold text-slate-800">{collectionMethod === 'HOME' ? 'Home Sample Collection' : 'Visit Laboratory'}</p>
                    </div>
                    <div className="border-t border-slate-100 pt-3">
                       <p className="text-[11px] font-bold text-slate-500 mb-0.5">Patient</p>
                       <p className="text-[13px] font-bold text-slate-800">{patientDetails.name}</p>
                    </div>
                    {collectionMethod === 'HOME' && (
                       <div className="border-t border-slate-100 pt-3">
                          <p className="text-[11px] font-bold text-slate-500 mb-0.5">Address</p>
                          <p className="text-[13px] font-bold text-slate-800 leading-tight">{patientDetails.address}</p>
                       </div>
                    )}
                 </div>

                 <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 flex items-center justify-between mb-6">
                    <span className="text-[14px] font-bold text-blue-900">Test Amount</span>
                    <span className="text-[18px] font-black text-blue-700">{selectedLab?.price}</span>
                 </div>
                 
                 <div className="space-y-3">
                    <button onClick={() => setViewState('CONFIRMED')} className="w-full flex items-center justify-center bg-[#0055ff] text-white py-3.5 rounded-xl text-[13px] font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30">
                       Confirm Booking
                    </button>
                    <button onClick={() => setViewState('PATIENT')} className="w-full flex items-center justify-center bg-white text-slate-700 border border-slate-200 py-3.5 rounded-xl text-[13px] font-bold hover:bg-slate-50 transition-colors">
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
                 <h2 className="text-[20px] font-black text-slate-900 mb-2">Booking Confirmed</h2>
                 <p className="text-[12px] text-slate-500 font-medium mb-6">Your lab test has been booked successfully.</p>
                 
                 <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-left mb-6">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
                       <span className="text-[11px] font-bold text-slate-500">Booking ID</span>
                       <span className="text-[13px] font-black text-slate-900">MQ-LAB-001</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
                       <span className="text-[11px] font-bold text-slate-500">Status</span>
                       <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md text-[10px] font-bold">Confirmed</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
                       <span className="text-[11px] font-bold text-slate-500">Patient</span>
                       <span className="text-[13px] font-bold text-slate-800">{patientDetails.name}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
                       <span className="text-[11px] font-bold text-slate-500">Date & Time</span>
                       <span className="text-[13px] font-bold text-slate-800">{selectedDate}, {selectedTime}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
                       <span className="text-[11px] font-bold text-slate-500">Payment Status</span>
                       <span className="text-[13px] font-bold text-slate-800">Pending</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[11px] font-bold text-slate-500">Amount</span>
                       <span className="text-[15px] font-black text-blue-600">{selectedLab?.price}</span>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <button onClick={() => setViewState('STATUS')} className="w-full flex items-center justify-center bg-[#0055ff] text-white py-3.5 rounded-xl text-[13px] font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30">
                       View Booking
                    </button>
                    <button onClick={() => setViewState('LIST')} className="w-full flex items-center justify-center bg-white text-slate-700 border border-slate-200 py-3.5 rounded-xl text-[13px] font-bold hover:bg-slate-50 transition-colors">
                       Back to Lab Tests
                    </button>
                 </div>
             </section>
          )}

          {/* VIEW: STATUS */}
          {viewState === 'STATUS' && (
             <section className="animate-in fade-in zoom-in-95 duration-300">
                <h2 className="text-[18px] font-black text-slate-900 mb-4">Lab Test Booking Status</h2>
                
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
                            <span className="text-[13px] font-bold text-slate-900">Sample Collection</span>
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
                   <h3 className="text-[14px] font-bold text-blue-900 mb-1">Reports Not Ready</h3>
                   <p className="text-[11px] text-blue-700/80 mb-4">Your reports will be available here once laboratory processing is completed.</p>
                   
                   <div className="flex gap-3 w-full">
                      <button disabled className="flex-1 flex items-center justify-center gap-2 bg-[#0055ff] text-white py-2.5 rounded-xl text-[12px] font-bold disabled:opacity-50 transition-colors">
                         View Report
                      </button>
                      <button disabled className="flex-1 flex items-center justify-center gap-2 bg-white text-[#0055ff] border border-blue-200 py-2.5 rounded-xl text-[12px] font-bold disabled:opacity-50 transition-colors">
                         <Download className="w-4 h-4" /> Download
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
