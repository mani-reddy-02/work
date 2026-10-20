import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowRight, Hospital, Stethoscope, Shield, Home as HomeIcon, 
  TestTube, Activity, Heart, Sparkles, Smile, Plus, Minus, Bot, 
  ShieldCheck, ChevronRight, AlertCircle, Video, CheckCircle2, X
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import UpcomingBookingTile from '../components/UpcomingBookingTile';
import { useNotifications } from '../lib/notifications';
import { opAppointmentApi } from '../lib/opAppointmentApi';
import { getDiseaseIconUrl } from '../utils/diseaseIcons';
import { useUIStore } from '../lib/uiStore';
import PosterCarousel from '../components/PosterCarousel';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const FALLBACK_SPECIALISTS = [
  { id: '1', name: 'General Physician', icon: 'Stethoscope', image: '/optimized/Fever.webp' },
  { id: '2', name: 'Pediatrics', icon: 'Smile', image: '/optimized/Pediatrics.webp' },
  { id: '3', name: 'Cardiology', icon: 'Heart', image: '/optimized/Cardiology.webp' },
  { id: '4', name: 'Dermatology', icon: 'Sparkles', image: '/optimized/Dermatology.webp' },
  { id: '5', name: 'Neurology', icon: 'Activity', image: '/optimized/Neurology.webp' },
  { id: '6', name: 'Orthopedics', icon: 'Shield', image: '/optimized/Orthopedics.webp' }
].map((s, idx) => ({
  ...s,
  bg: ['bg-red-50', 'bg-yellow-50', 'bg-blue-50', 'bg-green-50', 'bg-purple-50', 'bg-orange-50'][idx % 6]
}));

const Home = () => {
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const { notifications, markAsRead } = useNotifications();
  const location = useLocation();
  const { location: currentLocation, setLocation: setCurrentLocation } = useUIStore();
  const [showBookingPopup, setShowBookingPopup] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);
  const [hasUpcomingBooking, setHasUpcomingBooking] = useState(false);

  const [topSpecialists, setTopSpecialists] = useState<any[]>(FALLBACK_SPECIALISTS);
  const [commonDiseases, setCommonDiseases] = useState<any[]>([]);
  const [isSpecialistsLoading, setIsSpecialistsLoading] = useState(false);
  const [specialistsError, setSpecialistsError] = useState(false);

  useEffect(() => {
    let mounted = true;

    opAppointmentApi.fetchDiseases().then((res) => {
      if (mounted) {
        if (res.success && res.data) {
          if (res.data.categorical && res.data.categorical.length > 0) {
            const categorical = res.data.categorical.slice(0, 6).map((s: any, idx: number) => ({
              ...s,
              image: getDiseaseIconUrl(s.name, s.icon),
              bg: ['bg-red-50', 'bg-yellow-50', 'bg-blue-50', 'bg-green-50', 'bg-purple-50', 'bg-orange-50'][idx % 6]
            }));
            setTopSpecialists(categorical);
          } else {
            setTopSpecialists(FALLBACK_SPECIALISTS);
          }
          
          if (res.data.general && res.data.general.length > 0) {
            const general = res.data.general.slice(0, 8).map((d: any, idx: number) => ({
              ...d,
              image: getDiseaseIconUrl(d.name, d.icon),
              bg: ['bg-pink-50', 'bg-cyan-50', 'bg-indigo-50', 'bg-teal-50', 'bg-rose-50', 'bg-sky-50', 'bg-emerald-50', 'bg-amber-50'][idx % 8]
            }));
            setCommonDiseases(general);
          }
          setSpecialistsError(false);
        } else {
          setTopSpecialists(FALLBACK_SPECIALISTS);
          setSpecialistsError(false);
        }
        setIsSpecialistsLoading(false);
      }
    }).catch(() => {
      if (mounted) {
        setTopSpecialists(FALLBACK_SPECIALISTS);
        setSpecialistsError(false);
        setIsSpecialistsLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  const handleUpcomingBookingLoad = (hasBooking: boolean, data?: any) => {
    setHasUpcomingBooking(hasBooking);
  };

  useEffect(() => {
    // Check for real-time BOOKING_CONFIRMED notifications
    const recentBookingNotification = notifications.find(n => 
      n.type === 'BOOKING_CONFIRMED' && 
      !n.read && 
      (new Date().getTime() - new Date(n.createdAt).getTime() < 60000) // Within last 60 seconds
    );

    if (recentBookingNotification) {
      setBookingData({
        serviceType: recentBookingNotification.metadata?.type === 'VIDEO' ? 'Video Consultation' : 
                     recentBookingNotification.metadata?.type === 'OP' ? 'OP Consultation' : 
                     recentBookingNotification.metadata?.type === 'LAB' ? 'Lab Test' : 
                     recentBookingNotification.metadata?.type === 'HOME_SAMPLE' ? 'Home Sample Collection' : 'Home Nursing',
        message: recentBookingNotification.message,
        bookingId: recentBookingNotification.metadata?.bookingId,
        notificationId: recentBookingNotification.id
      });
      setShowBookingPopup(true);
      
      const timer = setTimeout(() => {
        setShowBookingPopup(false);
        markAsRead(recentBookingNotification.id);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  // Geolocation logic
  useEffect(() => {
    if (currentLocation === 'Select Location' || !currentLocation) {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              // Reverse geocode using Nominatim API (OpenStreetMap)
              const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`);
              const data = await response.json();
              if (data && data.address) {
                const cityOrTown = data.address.city || data.address.town || data.address.village || data.address.county || data.name;
                const state = data.address.state || '';
                if (cityOrTown) {
                  setCurrentLocation(`${cityOrTown}${state ? `, ${state}` : ''}`);
                } else {
                  setCurrentLocation('Location Found');
                }
              } else {
                setCurrentLocation('Select Location');
              }
            } catch (error) {
              console.error("Error reverse geocoding:", error);
              setCurrentLocation('Select Location');
            }
          },
          (error) => {
            console.error("Geolocation error:", error);
            // On permission denied or error, keep it as Select Location
            setCurrentLocation('Select Location');
          },
          { timeout: 10000, maximumAge: 60000 }
        );
      }
    }
  }, [currentLocation, setCurrentLocation]);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  // Poster logic moved to PosterCarousel


  const FALLBACK_FAQS = [
    { q: 'How do I book a video consultation?', a: 'Choose Video Consultation, select a doctor, choose an available slot and confirm your consultation.' },
    { q: 'Are lab samples collected from home?', a: 'Home sample collection can be selected where the service is available.' },
    { q: 'How does cashless insurance work?', a: 'Cashless treatment is available at eligible network hospitals according to the applicable insurance policy terms.' }
  ];

  const [faqs, setFaqs] = useState<{ q: string; a: string }[]>(FALLBACK_FAQS);

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/faqs`)
      .then(res => res.json())
      .then(data => {
        if (active && data.success && Array.isArray(data.data) && data.data.length > 0) {
          setFaqs(data.data.slice(0, 5).map((item: any) => ({
            q: item.question,
            a: item.answer
          })));
        }
      })
      .catch((err) => {
        console.warn('Could not load dynamic FAQs, using fallbacks:', err);
      });
    return () => { active = false; };
  }, []);


  return (
    <div className={`p-4 md:p-6 lg:p-8 space-y-5 md:space-y-6 overflow-x-hidden relative transition-all max-w-5xl md:mx-auto ${hasUpcomingBooking ? 'pb-32' : 'pb-8'}`}>

      {/* Booking Success Popup */}
      {showBookingPopup && (
        <div className="fixed bottom-20 left-4 right-4 md:bottom-8 md:left-auto md:w-96 md:right-8 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-white rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-green-100 flex items-start gap-3 relative">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1 pr-4">
              <h3 className="text-[14px] font-bold text-slate-800">
                {bookingData ? `${bookingData.serviceType} Confirmed!` : 'Booking Confirmed!'}
              </h3>
              {bookingData?.message ? (
                <div className="mt-1 space-y-0.5">
                  <p className="text-[12px] font-medium text-slate-700 leading-snug">{bookingData.message}</p>
                </div>
              ) : (
                <p className="text-[12px] text-slate-500 mt-0.5">Your booking has been successfully scheduled. Check My Bookings for details.</p>
              )}
              <button 
                onClick={() => navigate('/bookings')}
                className="text-[12px] font-bold text-blue-600 mt-2 hover:text-blue-700 inline-block"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 1. FIRST LARGE BOOKING CAROUSEL */}
      <PosterCarousel module="HOME" />

      {/* Quick Services - Reverted to Original */}
      <section>
        <h2 className="text-[15px] md:text-[18px] lg:text-[20px] font-bold mb-3 md:mb-4 text-slate-800">Quick Services</h2>
        
        {/* Primary Large Services */}
        <div className="grid grid-cols-2 gap-3 mb-3 md:gap-4 md:mb-4">
          <Link to="/specialties?type=hospital-op" className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 p-3.5 flex flex-col justify-between h-[115px] md:h-[130px] hover:border-blue-200 transition-colors">
            <div className="relative z-10">
              <h3 className="font-bold text-slate-800 text-[15px] mb-0.5">OP Booking</h3>
              <p className="text-[11px] text-slate-400">Book hospital visits</p>
            </div>
            <div className="absolute bottom-0 right-0 w-14 h-14 bg-blue-50 rounded-tl-full flex items-end justify-end p-3 py-3.5">
              <Hospital className="w-6 h-6 text-[#0055ff] -mb-0.5 -mr-0.5" />
            </div>
          </Link>
          
          <Link to="/specialties?type=doctor" className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 p-3.5 flex flex-col justify-between h-[115px] md:h-[130px] hover:border-green-200 transition-colors">
            <div className="relative z-10">
              <h3 className="font-bold text-slate-800 text-[15px] mb-0.5">Video Consultation</h3>
              <p className="text-[11px] text-slate-400">Online doctors</p>
            </div>
            <div className="absolute bottom-0 right-0 w-14 h-14 bg-green-50 rounded-tl-full flex items-end justify-end p-3 py-3.5">
              <Stethoscope className="w-6 h-6 text-green-500 -mb-0.5 -mr-0.5" />
            </div>
          </Link>
        </div>

        {/* Secondary Standard Services */}
        <div className="grid grid-cols-4 gap-2 md:gap-3">
            <Link to="/services/insurance" className="flex flex-col items-center p-3 py-3.5 bg-white rounded-xl border border-slate-100 gap-1.5 hover:border-cyan-200 transition-colors">
              <div className="w-12 h-12 rounded-full bg-cyan-50 flex items-center justify-center mb-1">
                <Shield className="w-6 h-6 text-cyan-400" />
              </div>
              <span className="text-[10.5px] font-medium text-center text-slate-600 leading-tight">Insurances</span>
            </Link>
            <Link to="/services/home-nursing" className="flex flex-col items-center p-3 py-3.5 bg-white rounded-xl border border-slate-100 gap-1.5 hover:border-pink-200 transition-colors">
              <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center mb-1">
                <HomeIcon className="w-6 h-6 text-pink-500" />
              </div>
              <span className="text-[10.5px] font-medium text-center text-slate-600 leading-tight">Home Nursing</span>
            </Link>
            <Link to="/services/lab-tests" className="flex flex-col items-center p-3 py-3.5 bg-white rounded-xl border border-slate-100 gap-1.5 hover:border-indigo-200 transition-colors">
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-1">
                <TestTube className="w-6 h-6 text-indigo-500" />
              </div>
              <span className="text-[10.5px] font-medium text-center text-slate-600 leading-tight">Lab Tests</span>
            </Link>
            <Link to="/services/home-sample" className="flex flex-col items-center p-3 py-3.5 bg-white rounded-xl border border-slate-100 gap-1.5 hover:border-orange-200 transition-colors">
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center mb-1">
                <Activity className="w-6 h-6 text-orange-400" />
              </div>
              <span className="text-[10.5px] font-medium text-center text-slate-600 leading-tight">Home Sample</span>
            </Link>
        </div>
      </section>

      <UpcomingBookingTile onLoad={handleUpcomingBookingLoad} />

      {/* Consult Top Specialists */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] md:text-[18px] lg:text-[20px] font-bold text-slate-800">Consult Top Specialists</h2>
          <Link 
            to="/specialties?type=doctor" 
            className="text-[11px] text-blue-600 font-semibold cursor-pointer hover:underline flex items-center gap-0.5"
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {isSpecialistsLoading ? (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={`bg-white rounded-xl border border-slate-100 p-3 h-28 md:h-32 animate-pulse flex flex-col items-center justify-center ${i > 3 ? 'hidden md:flex' : ''}`}>
                <div className="w-10 h-10 bg-slate-200 rounded-full mb-2"></div>
                <div className="h-2 w-16 bg-slate-200 rounded mb-2"></div>
                <div className="h-2 w-12 bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : specialistsError || topSpecialists.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 p-5 text-center text-slate-500 text-xs">
            No specialists currently available. Check back later!
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
            {topSpecialists.map((specialist, idx) => (
              <Link 
                key={specialist.id} 
                to={`/specialties?type=doctor&category=${encodeURIComponent(specialist.name)}`} 
                className={`bg-white rounded-xl border border-slate-100 p-3 flex flex-col items-center text-center shadow-sm hover:shadow-md hover:border-blue-100 transition-all ${idx >= 3 ? 'hidden md:flex' : ''}`}
              >
                  <div className={`w-10 h-10 rounded-full ${specialist.bg} flex items-center justify-center mb-2 overflow-hidden p-1`}>
                      {specialist.image ? (
                          <img 
                            src={specialist.image} 
                            alt={specialist.name} 
                            className="w-full h-full object-contain mix-blend-multiply" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/optimized/Blood Test.webp';
                            }}
                          />
                      ) : (
                          <Stethoscope className="w-5 h-5 text-slate-400" />
                      )}
                  </div>
                  <h4 className="text-[10px] font-bold text-slate-800 mb-0.5 line-clamp-1">{specialist.name}</h4>
                  <p className="text-[9px] text-emerald-500 font-bold">Video Call</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* MediAI Assistant */}
      <section className="mt-4 mb-2 cursor-pointer transition-transform active:scale-95" onClick={() => navigate('/ai')}>
        <div className="bg-[#1a1f2e] rounded-2xl p-4 flex items-center gap-3 shadow-md hover:shadow-lg transition-shadow">
          <div className="w-10 h-10 rounded-full bg-[#273041] flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-sky-400" />
          </div>
          <div>
              <h4 className="text-white text-[12px] font-bold mb-0.5">Chat with MediAI Assistant</h4>
              <p className="text-[9px] text-slate-400">Instant symptom checker & health recommendations</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-2">
        <h2 className="text-[15px] font-bold mb-3 text-slate-800">Frequently Asked Questions</h2>
        <div className="space-y-2">
            {faqs.map((item, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100">
                    <div onClick={() => toggleFaq(i)} className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                        <span className={`text-[12px] font-bold ${expandedFaq === i ? 'text-blue-600' : 'text-slate-700'}`}>{item.q}</span>
                        {expandedFaq === i ? <Minus className="w-4 h-4 text-blue-600 shrink-0" /> : <Plus className="w-4 h-4 text-slate-400 shrink-0" />}
                    </div>
                    {expandedFaq === i && (
                        <div className="px-3.5 pb-3.5 text-[11px] text-slate-500 font-medium leading-relaxed border-t border-slate-50 pt-2 animate-in slide-in-from-top-2 duration-200">
                            {item.a}
                        </div>
                    )}
                </div>
            ))}
        </div>
      </section>
      
    </div>
  );
};

export default Home;
