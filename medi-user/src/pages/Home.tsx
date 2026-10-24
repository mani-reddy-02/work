import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowRight, Hospital, Stethoscope, Shield, Home as HomeIcon, 
  TestTube, Activity, Heart, Sparkles, Smile, Plus, Minus, Bot, 
  ShieldCheck, ChevronRight, AlertCircle, Video, CheckCircle2, X,
  MapPin, Building2, Navigation, Compass
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import UpcomingBookingTile from '../components/UpcomingBookingTile';
import { useNotifications } from '../lib/notifications';
import { opAppointmentApi } from '../lib/opAppointmentApi';
import { getDiseaseIconUrl } from '../utils/diseaseIcons';
import { getDepartmentImageUrl } from '../utils/departmentImages';
import { useUIStore } from '../lib/uiStore';
import PosterCarousel from '../components/PosterCarousel';
import { departmentApi, hospitalApi, laboratoryApi, type DepartmentRecord, type HospitalRecord, type LaboratoryRecord } from '../lib/hospitalApi';
import { cn } from '../lib/utils';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const FALLBACK_SPECIALISTS = [
  { id: '1', name: 'General Physician', icon: 'Stethoscope', image: '/images/departments/general-medicine.jpg' },
  { id: '2', name: 'Pediatrics', icon: 'Smile', image: '/images/departments/pediatrics.jpg' },
  { id: '3', name: 'Cardiology', icon: 'Heart', image: '/images/departments/cardiology.jpg' },
  { id: '4', name: 'Dermatology', icon: 'Sparkles', image: '/images/departments/dermatology.jpg' },
  { id: '5', name: 'Neurology', icon: 'Activity', image: '/images/departments/neurology.jpg' },
  { id: '6', name: 'Orthopedics', icon: 'Shield', image: '/images/departments/orthopedics.jpg' }
].map((s, idx) => ({
  ...s,
  bg: ['bg-red-50', 'bg-yellow-50', 'bg-blue-50', 'bg-green-50', 'bg-purple-50', 'bg-orange-50'][idx % 6]
}));

const Home = () => {
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const { notifications, markAsRead } = useNotifications();
  const location = useLocation();
  const { userLocation, detectLocation, setNearbyRadiusKm } = useUIStore();
  const [showBookingPopup, setShowBookingPopup] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);
  const [hasUpcomingBooking, setHasUpcomingBooking] = useState(false);

  // Nearby discovery state
  const [nearbyHospitals, setNearbyHospitals] = useState<HospitalRecord[]>([]);
  const [nearbyLabs, setNearbyLabs] = useState<LaboratoryRecord[]>([]);
  const [isNearbyLoading, setIsNearbyLoading] = useState(false);
  const [nearbyFilter, setNearbyFilter] = useState<'ALL' | 'HOSPITALS' | 'LABS'>('ALL');

  const [topSpecialists, setTopSpecialists] = useState<any[]>(FALLBACK_SPECIALISTS);
  const [commonDiseases, setCommonDiseases] = useState<any[]>([]);
  const [isSpecialistsLoading, setIsSpecialistsLoading] = useState(false);
  const [specialistsError, setSpecialistsError] = useState(false);

  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(true);

  // Location detection: only request if idle, without repetitive re-requests
  useEffect(() => {
    if (userLocation.status === 'idle') {
      detectLocation(false);
    }
  }, [userLocation.status, detectLocation]);

  // Fetch genuine nearby hospitals and laboratories based on user coordinates and radius
  useEffect(() => {
    let mounted = true;
    setIsNearbyLoading(true);

    Promise.all([
      hospitalApi.getHospitals({
        lat: userLocation.latitude ?? undefined,
        lng: userLocation.longitude ?? undefined,
        radius: userLocation.radiusKm,
        nearbyOnly: true,
        businessType: 'HOSPITAL',
        service: 'op_consultation'
      }),
      laboratoryApi.getLaboratories({
        lat: userLocation.latitude ?? undefined,
        lng: userLocation.longitude ?? undefined,
        radius: userLocation.radiusKm,
        nearbyOnly: true
      })
    ]).then(([hospRes, labRes]) => {
      if (!mounted) return;
      if (hospRes.success && Array.isArray(hospRes.data)) {
        setNearbyHospitals(hospRes.data);
      } else {
        setNearbyHospitals([]);
      }
      if (labRes.success && Array.isArray(labRes.data)) {
        setNearbyLabs(labRes.data);
      } else {
        setNearbyLabs([]);
      }
    }).catch(() => {
      if (mounted) {
        setNearbyHospitals([]);
        setNearbyLabs([]);
      }
    }).finally(() => {
      if (mounted) setIsNearbyLoading(false);
    });

    return () => { mounted = false; };
  }, [userLocation.latitude, userLocation.longitude, userLocation.radiusKm]);

  useEffect(() => {
    let mounted = true;
    departmentApi.getDepartments({ hasDoctors: true })
      .then((res) => {
        if (!mounted) return;
        if (res.success && Array.isArray(res.data)) {
          // Display only departments actually configured and supported by eligible doctors
          const withDocs = res.data.filter((d: any) => (d.doctorCount ?? 0) > 0);
          setDepartments(withDocs);
        } else {
          setDepartments([]);
        }
      })
      .catch(() => {
        if (mounted) setDepartments([]);
      })
      .finally(() => {
        if (mounted) setIsDepartmentsLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;

    opAppointmentApi.fetchDiseases().then((res) => {
      if (mounted) {
        if (res.success && res.data) {
          if (res.data.categorical && res.data.categorical.length > 0) {
            const categorical = res.data.categorical.slice(0, 6).map((s: any, idx: number) => ({
              ...s,
              image: getDepartmentImageUrl(s.name, s.icon),
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


  const hospitalItems = nearbyHospitals.map(h => ({ ...h, kind: 'HOSPITAL' as const }));
  const labItems = nearbyLabs.map(l => ({ ...l, kind: 'LABORATORY' as const }));
  const allProviders = [...hospitalItems, ...labItems].sort((a, b) => {
    if (a.distance != null && b.distance != null) return a.distance - b.distance;
    if (a.distance != null) return -1;
    if (b.distance != null) return 1;
    return 0;
  });

  const displayedProviders = 
    nearbyFilter === 'HOSPITALS' ? hospitalItems :
    nearbyFilter === 'LABS' ? labItems : allProviders;

  return (
    <div className={`w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 overflow-x-hidden relative transition-all ${hasUpcomingBooking ? 'pb-32' : 'pb-8'}`}>

      {/* Booking Success Popup */}
      {showBookingPopup && (
        <div className="fixed bottom-20 left-4 right-4 md:bottom-8 md:left-auto md:w-96 md:right-8 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-white rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-green-100 flex items-start gap-3 relative">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1 pr-4">
              <h3 className="text-sm font-bold text-slate-800">
                {bookingData ? `${bookingData.serviceType} Confirmed!` : 'Booking Confirmed!'}
              </h3>
              {bookingData?.message ? (
                <div className="mt-1 space-y-0.5">
                  <p className="text-xs font-medium text-slate-700 leading-snug">{bookingData.message}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 mt-0.5">Your booking has been successfully scheduled. Check My Bookings for details.</p>
              )}
              <button 
                onClick={() => navigate('/bookings')}
                className="text-xs font-bold text-blue-600 mt-2 hover:text-blue-700 inline-block"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 1. FIRST LARGE BOOKING CAROUSEL */}
      <PosterCarousel module="HOME" />

      {/* Quick Services */}
      <section>
        <h2 className="text-base sm:text-lg md:text-xl font-bold mb-3 md:mb-4 text-slate-800">Quick Services</h2>
        
        {/* Primary Large Services */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
          <Link to="/specialties?type=hospital-op" className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 p-4 flex flex-col justify-between h-[120px] sm:h-[135px] hover:border-blue-200 hover:shadow-sm transition-all group">
            <div className="relative z-10">
              <h3 className="font-bold text-slate-900 text-base mb-1 group-hover:text-blue-600 transition-colors">OP Booking</h3>
              <p className="text-xs text-slate-500 font-medium">Book in-person hospital visits</p>
            </div>
            <div className="absolute bottom-0 right-0 w-16 h-16 bg-blue-50 rounded-tl-full flex items-end justify-end p-3 py-3.5 group-hover:bg-blue-100 transition-colors">
              <Hospital className="w-7 h-7 text-[#0055ff] -mb-0.5 -mr-0.5" />
            </div>
          </Link>
          
          <Link to="/specialties?type=doctor" className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 p-4 flex flex-col justify-between h-[120px] sm:h-[135px] hover:border-green-200 hover:shadow-sm transition-all group">
            <div className="relative z-10">
              <h3 className="font-bold text-slate-900 text-base mb-1 group-hover:text-emerald-600 transition-colors">Video Consultation</h3>
              <p className="text-xs text-slate-500 font-medium">Connect online with verified doctors</p>
            </div>
            <div className="absolute bottom-0 right-0 w-16 h-16 bg-green-50 rounded-tl-full flex items-end justify-end p-3 py-3.5 group-hover:bg-green-100 transition-colors">
              <Stethoscope className="w-7 h-7 text-green-600 -mb-0.5 -mr-0.5" />
            </div>
          </Link>
        </div>

        {/* Secondary Standard Services */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
            <Link to="/services/insurance" className="flex flex-col items-center p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-100 gap-2 hover:border-cyan-200 hover:shadow-sm transition-all text-center">
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-cyan-600" />
              </div>
              <span className="text-xs font-semibold text-slate-700 leading-tight">Insurances</span>
            </Link>
            <Link to="/services/home-nursing" className="flex flex-col items-center p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-100 gap-2 hover:border-pink-200 hover:shadow-sm transition-all text-center">
              <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center shrink-0">
                <HomeIcon className="w-6 h-6 text-pink-600" />
              </div>
              <span className="text-xs font-semibold text-slate-700 leading-tight">Home Nursing</span>
            </Link>
            <Link to="/services/lab-tests" className="flex flex-col items-center p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-100 gap-2 hover:border-indigo-200 hover:shadow-sm transition-all text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                <TestTube className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="text-xs font-semibold text-slate-700 leading-tight">Lab Tests</span>
            </Link>
            <Link to="/services/home-sample" className="flex flex-col items-center p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-100 gap-2 hover:border-orange-200 hover:shadow-sm transition-all text-center">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-xs font-semibold text-slate-700 leading-tight">Home Sample</span>
            </Link>
        </div>
      </section>

      {/* NEARBY HOSPITALS & LABORATORIES DISCOVERY */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-800">
                Nearby Hospitals & Laboratories
              </h2>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Within {userLocation.radiusKm} km
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Genuine accredited facilities near <span className="font-semibold text-slate-700">{userLocation.label}</span>
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs font-semibold">
            <button
              type="button"
              onClick={() => setNearbyFilter('ALL')}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all",
                nearbyFilter === 'ALL' ? "bg-white text-primary shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
              )}
            >
              All ({allProviders.length})
            </button>
            <button
              type="button"
              onClick={() => setNearbyFilter('HOSPITALS')}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all",
                nearbyFilter === 'HOSPITALS' ? "bg-white text-primary shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Hospitals ({hospitalItems.length})
            </button>
            <button
              type="button"
              onClick={() => setNearbyFilter('LABS')}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all",
                nearbyFilter === 'LABS' ? "bg-white text-primary shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Labs ({labItems.length})
            </button>
          </div>
        </div>

        {/* Location alert if permission denied */}
        {userLocation.status === 'denied' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Location permission denied. Showing providers near your manually selected location.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const btn = document.getElementById('desktop-location-selector') || document.getElementById('mobile-location-selector');
                btn?.click();
              }}
              className="font-bold underline text-amber-900 hover:text-amber-950 shrink-0 ml-2"
            >
              Change
            </button>
          </div>
        )}

        {isNearbyLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 h-36 animate-pulse flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
                  <div className="h-3 w-1/2 bg-slate-200 rounded"></div>
                </div>
                <div className="h-8 w-full bg-slate-100 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : displayedProviders.length === 0 ? (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Hospital className="w-6 h-6" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800">
              No eligible hospitals or laboratories found near your selected location.
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              We couldn't find accredited providers within {userLocation.radiusKm} km of {userLocation.label}. Try changing your location or expanding your search radius.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-4">
              <button
                type="button"
                onClick={() => {
                  const btn = document.getElementById('desktop-location-selector') || document.getElementById('mobile-location-selector');
                  btn?.click();
                }}
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/95 transition-all shadow-xs"
              >
                Change Location
              </button>
              {userLocation.radiusKm < 50 && (
                <button
                  type="button"
                  onClick={() => setNearbyRadiusKm(50)}
                  className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold hover:bg-blue-100 transition-all"
                >
                  Expand Radius (50 km)
                </button>
              )}
              {userLocation.radiusKm < 100 && userLocation.radiusKm >= 50 && (
                <button
                  type="button"
                  onClick={() => setNearbyRadiusKm(100)}
                  className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold hover:bg-blue-100 transition-all"
                >
                  Expand Radius (100 km)
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayedProviders.slice(0, 6).map((provider: any) => (
              <div
                key={`${provider.kind}-${provider.id}`}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                      provider.kind === 'HOSPITAL' 
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-purple-50 text-purple-700 border-purple-200"
                    )}>
                      {provider.kind === 'HOSPITAL' ? 'Hospital' : 'Diagnostic Lab'}
                    </span>
                    {provider.distanceText && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <MapPin className="w-3 h-3" />
                        {provider.distanceText}
                      </span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-sm line-clamp-1">
                    {provider.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{provider.address || provider.city || 'India'}</span>
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-600">
                    {provider.kind === 'HOSPITAL' 
                      ? `${provider.doctorCount || 'Active'} Doctors`
                      : 'NABL Certified Lab'}
                  </span>
                  <Link
                    to={provider.kind === 'HOSPITAL' ? '/specialties?type=hospital-op' : '/services/lab-tests'}
                    className="text-xs font-bold text-primary hover:text-blue-700 flex items-center gap-1"
                  >
                    <span>{provider.kind === 'HOSPITAL' ? 'Consult Doctor' : 'Book Tests'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2. BROWSE DEPARTMENTS — Direct Doctor Booking (Replaces Previous Emergency Tile) */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-800">Browse Departments</h2>
            <p className="text-xs text-slate-500">Direct doctor consultation by clinical specialty</p>
          </div>
          <Link 
            to="/departments" 
            className="text-[11px] text-blue-600 font-semibold cursor-pointer hover:underline flex items-center gap-0.5"
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isDepartmentsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3 md:gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-4 h-28 animate-pulse flex flex-col items-center justify-center">
                <div className="w-14 h-14 bg-slate-200 rounded-2xl mb-2"></div>
                <div className="h-3 w-16 bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : departments.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3 md:gap-4">
            {departments.slice(0, 5).map((dept) => {
              const imageUrl = getDepartmentImageUrl(dept.name, dept.icon);
              return (
                <Link
                  key={dept.id}
                  to={`/departments?dept=${encodeURIComponent(dept.id)}`}
                  className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-3.5 flex flex-col items-center text-center shadow-xs hover:shadow-md hover:border-blue-200 transition-all group"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden mb-2.5 shadow-xs border border-slate-100 group-hover:scale-105 group-hover:shadow-sm transition-all duration-300 bg-slate-50">
                    <img 
                      src={imageUrl} 
                      alt={dept.name} 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/departments/default.jpg';
                      }}
                    />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {dept.name}
                  </h4>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 p-5 text-center text-slate-500 text-xs">
            No departments currently configured with active doctors. Check back soon!
          </div>
        )}
      </section>

      <UpcomingBookingTile onLoad={handleUpcomingBookingLoad} />

      {/* Consult Top Specialists */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-800">Consult Top Specialists</h2>
          <Link 
            to="/specialties?type=doctor" 
            className="text-[11px] text-blue-600 font-semibold cursor-pointer hover:underline flex items-center gap-0.5"
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {isSpecialistsLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 sm:gap-3 md:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={`bg-white rounded-2xl border border-slate-100 p-3 sm:p-4 h-28 md:h-32 animate-pulse flex flex-col items-center justify-center ${i > 3 ? 'hidden sm:flex' : ''}`}>
                <div className="w-10 h-10 bg-slate-200 rounded-full mb-2"></div>
                <div className="h-2 w-16 bg-slate-200 rounded mb-2"></div>
                <div className="h-2 w-12 bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : specialistsError || topSpecialists.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center text-slate-500 text-xs">
            No specialists currently available. Check back later!
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 sm:gap-3 md:gap-4">
            {topSpecialists.map((specialist, idx) => (
              <Link 
                key={specialist.id} 
                to={`/specialties?type=doctor&category=${encodeURIComponent(specialist.name)}`} 
                className={`bg-white rounded-2xl border border-slate-100 p-3 sm:p-3.5 flex flex-col items-center text-center shadow-xs hover:shadow-md hover:border-blue-100 transition-all ${idx >= 3 ? 'hidden sm:flex' : ''}`}
              >
                  <div className="w-12 h-12 rounded-2xl overflow-hidden mb-2 shadow-xs border border-slate-100 flex items-center justify-center bg-slate-50">
                      {specialist.image ? (
                          <img 
                            src={specialist.image} 
                            alt={specialist.name} 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/departments/default.jpg';
                            }}
                          />
                      ) : (
                          <Stethoscope className="w-5 h-5 text-slate-400" />
                      )}
                  </div>
                  <h4 className="text-[11px] sm:text-xs font-bold text-slate-900 mb-0.5 line-clamp-1">{specialist.name}</h4>
                  <p className="text-[10px] text-emerald-600 font-bold">Video Call</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* MediAI Assistant */}
      <section className="mt-4 mb-2 cursor-pointer transition-transform active:scale-[0.99]" onClick={() => navigate('/ai')}>
        <div className="bg-[#1a1f2e] rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 sm:gap-4 shadow-md hover:shadow-lg transition-shadow">
          <div className="w-11 h-11 rounded-2xl bg-[#273041] flex items-center justify-center shrink-0">
              <Bot className="w-6 h-6 text-sky-400" />
          </div>
          <div className="min-w-0 flex-1">
              <h4 className="text-white text-sm sm:text-base font-bold mb-0.5 truncate">Chat with MediAI Assistant</h4>
              <p className="text-xs text-slate-400 truncate">Instant symptom checker & health recommendations</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-2">
        <h2 className="text-base sm:text-lg md:text-xl font-bold mb-3 text-slate-800">Frequently Asked Questions</h2>
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
