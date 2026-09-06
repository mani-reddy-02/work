import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Hospital, Stethoscope, Shield, Home as HomeIcon, 
  TestTube, Activity, Heart, Sparkles, Smile, Plus, Minus, Bot, 
  ShieldCheck, ChevronRight, PhoneCall, AlertCircle, Video 
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

const Home = () => {
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const dragDistance = useRef(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isEmergencyHighlighted, setIsEmergencyHighlighted] = useState(true);

  // Trigger Emergency tile highlight on every load/open, automatically clearing after noticeable pulse
  useEffect(() => {
    setIsEmergencyHighlighted(true);
    const timer = setTimeout(() => {
      setIsEmergencyHighlighted(false);
    }, 5500);
    return () => clearTimeout(timer);
  }, []);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const BOOKING_SLIDES = [
    { 
      title: 'Book Now', 
      subtitle: 'Doctor Appointments & Hospital Visits',
      description: 'Find verified doctors, book clinic visits & hospital appointments',
      cta: 'Book Now',
      color: 'bg-gradient-to-r from-[#0062e6] via-[#0070f3] to-[#70a6ff]', 
      icon: Hospital, 
      icon2: Stethoscope,
      path: '/services',
      hasDoctorImage: true,
    },
    { 
      title: 'Book Video Consultation', 
      subtitle: 'Instant Online Care with Top Doctors',
      description: 'Connect with certified specialists within 15 mins from home',
      cta: 'Consult Now',
      color: 'bg-gradient-to-r from-[#0055d4] via-[#0284c7] to-[#0ea5e9]', 
      icon: Video, 
      icon2: Sparkles,
      path: '/specialties?type=doctor',
      hasDoctorImage: false,
    },
    { 
      title: 'Book Lab Test', 
      subtitle: 'Flat 20% OFF on Diagnostic Tests',
      description: 'Certified diagnostic packages with fast digital test reports',
      cta: 'Explore Tests',
      color: 'bg-gradient-to-r from-[#1d4ed8] via-[#2563eb] to-[#38bdf8]', 
      icon: TestTube, 
      icon2: ShieldCheck,
      path: '/services/lab-tests',
      hasDoctorImage: false,
    },
    { 
      title: 'Book Home Sample Collection', 
      subtitle: 'Hassle-free Sample Pickup at Home',
      description: 'Safe & hygienic diagnostic sample collection at your doorstep',
      cta: 'Book Collection',
      color: 'bg-gradient-to-r from-[#0369a1] via-[#0284c7] to-[#14b8a6]', 
      icon: Activity, 
      icon2: HomeIcon,
      path: '/services/home-sample',
      hasDoctorImage: false,
    },
  ];

  // Auto-scroll logic for Booking Carousel
  useEffect(() => {
    if (isPaused || isDragging.current) return;
    
    const interval = setInterval(() => {
      if (sliderRef.current) {
        const nextSlide = (activeSlide + 1) % BOOKING_SLIDES.length;
        sliderRef.current.scrollTo({
          left: nextSlide * sliderRef.current.offsetWidth,
          behavior: 'smooth'
        });
        setActiveSlide(nextSlide);
      }
    }, 3500);
    
    return () => clearInterval(interval);
  }, [activeSlide, isPaused, BOOKING_SLIDES.length]);

  // Handle native scroll updates (e.g. from swiping on mobile)
  const handleScroll = () => {
    if (sliderRef.current) {
      const slideWidth = sliderRef.current.offsetWidth;
      const newActive = Math.round(sliderRef.current.scrollLeft / slideWidth);
      if (newActive !== activeSlide && newActive >= 0 && newActive < BOOKING_SLIDES.length) {
        setActiveSlide(newActive);
      }
    }
  };

  const goToSlide = (idx: number) => {
    if (sliderRef.current) {
      sliderRef.current.scrollTo({
        left: idx * sliderRef.current.offsetWidth,
        behavior: 'smooth'
      });
      setActiveSlide(idx);
    }
  };

  // Mouse drag functionality for Desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    isDragging.current = true;
    dragDistance.current = 0;
    setIsPaused(true);
    startX.current = e.pageX - sliderRef.current.offsetLeft;
    scrollLeft.current = sliderRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    dragDistance.current = Math.abs(x - startX.current);
    sliderRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
    setIsPaused(false);
  };

  const FAQ_ITEMS = [
    { q: 'How do I book a video consultation?', a: 'Choose Video Consultation, select a doctor, choose an available slot and confirm your consultation.' },
    { q: 'Are lab samples collected from home?', a: 'Home sample collection can be selected where the service is available.' },
    { q: 'How does cashless insurance work?', a: 'Cashless treatment is available at eligible network hospitals according to the applicable insurance policy terms.' }
  ];

  return (
    <div className="p-4 space-y-5 pb-8 overflow-x-hidden">
      {/* 1. FIRST LARGE BOOKING CAROUSEL */}
      <section 
        className="relative overflow-hidden rounded-2xl shadow-sm min-h-[170px] md:min-h-[220px]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => { setIsPaused(false); isDragging.current = false; }}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        aria-label="Booking Carousel"
      >
        <div 
          ref={sliderRef}
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory cursor-grab active:cursor-grabbing w-full select-none"
        >
          {BOOKING_SLIDES.map((slide, idx) => {
            const Icon1 = slide.icon;
            const Icon2 = slide.icon2;
            return (
              <div 
                key={idx} 
                onClick={() => {
                  if (dragDistance.current < 10) navigate(slide.path);
                }}
                className={`w-full flex-shrink-0 snap-center ${slide.color} min-h-[170px] md:min-h-[220px] p-5 md:p-6 text-white flex items-center justify-between relative cursor-pointer overflow-hidden`}
              >
                {/* Text Content */}
                <div className="relative z-20 w-[62%] md:w-[54%] flex flex-col justify-center py-1">
                  <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-xs text-white text-[9px] md:text-[11px] font-bold px-2 py-0.5 rounded-full w-fit mb-1.5 border border-white/25 uppercase tracking-wider">
                    <Icon1 className="w-3 h-3" /> MediQuee
                  </span>
                  <h2 className="text-[19px] md:text-[26px] font-bold mb-1 leading-[1.2] tracking-tight text-white">
                    {slide.title}
                  </h2>
                  <p className="text-[10.5px] md:text-[13px] text-white/90 mb-3.5 md:mb-4 max-w-[190px] md:max-w-[320px] leading-snug">
                    {slide.description}
                  </p>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(slide.path);
                    }}
                    className="bg-white text-slate-900 px-4 py-1.5 md:px-5 md:py-2 rounded-full text-[11px] md:text-[13px] font-bold flex items-center gap-1.5 w-fit hover:bg-slate-50 transition-colors shadow-sm active:scale-95 pointer-events-auto"
                  >
                    <span>{slide.cta}</span>
                    <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                </div>

                {/* Right Visual / Graphic */}
                {slide.hasDoctorImage ? (
                  <div 
                    className="absolute right-0 bottom-0 top-0 w-[50%] md:w-[45%] md:max-w-[380px] z-10 pointer-events-none"
                    style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 18%)', maskImage: 'linear-gradient(to right, transparent, black 18%)' }}
                  >
                    <img 
                      src="/images/doctor.jpg" 
                      alt="Doctor" 
                      className="w-full h-full object-cover object-top md:object-[center_top]"
                    />
                  </div>
                ) : (
                  <div className="absolute right-3 md:right-8 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10">
                    <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
                      <div className="w-16 h-16 md:w-22 md:h-22 rounded-full bg-white/20 flex items-center justify-center">
                        <Icon1 className="w-8 h-8 md:w-11 md:h-11 text-white" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-white/90 text-slate-900 text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                        <Icon2 className="w-3 h-3 text-blue-600" />
                        <span>Active</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Pagination Dots */}
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {BOOKING_SLIDES.map((_, idx) => (
            <button 
              key={idx} 
              type="button"
              aria-label={`Go to slide ${idx + 1}`}
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(idx);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                activeSlide === idx ? 'bg-white w-4' : 'bg-white/50 w-1.5 hover:bg-white/80'
              }`} 
            />
          ))}
        </div>
      </section>

      {/* Quick Services - Reverted to Original */}
      <section>
        <h2 className="text-[15px] font-bold mb-3 text-slate-800">Quick Services</h2>
        
        {/* Primary Large Services */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Link to="/specialties?type=hospital-op" className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 p-3.5 flex flex-col justify-between h-[115px] hover:border-blue-200 transition-colors">
            <div className="relative z-10">
              <h3 className="font-bold text-slate-800 text-[15px] mb-0.5">OP Booking</h3>
              <p className="text-[11px] text-slate-400">Book hospital visits</p>
            </div>
            <div className="absolute bottom-0 right-0 w-14 h-14 bg-blue-50 rounded-tl-full flex items-end justify-end p-3 py-3.5">
              <Hospital className="w-6 h-6 text-[#0055ff] -mb-0.5 -mr-0.5" />
            </div>
          </Link>
          
          <Link to="/specialties?type=doctor" className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 p-3.5 flex flex-col justify-between h-[115px] hover:border-green-200 transition-colors">
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
        <div className="grid grid-cols-4 gap-2">
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

      {/* 1. EMERGENCY TILE — Directly below Quick Services */}
      <section>
        <div
          onClick={() => navigate('/ambulance')}
          className={`relative overflow-hidden bg-gradient-to-r from-red-500 via-rose-500 to-red-600 rounded-2xl p-4 text-white shadow-md cursor-pointer transition-all duration-300 hover:shadow-lg hover:brightness-105 active:scale-[0.99] border-2 ${
            isEmergencyHighlighted ? 'emergency-highlight border-red-200' : 'border-red-400/40'
          }`}
          role="button"
          tabIndex={0}
          aria-label="Emergency medical assistance"
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/ambulance'); }}
        >
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                  <PhoneCall className="w-6 h-6 text-white animate-pulse" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-[16px] text-white tracking-tight">Emergency</h3>
                  <span className="bg-white/20 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-white/25">
                    24/7 Available
                  </span>
                </div>
                <p className="text-[11px] text-red-50 mt-0.5 font-medium leading-snug">
                  Immediate ambulance dispatch & emergency care assistance
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 bg-white text-red-600 px-3.5 py-2 rounded-xl text-[11px] font-bold shadow-sm shrink-0 hover:bg-red-50 transition-colors ml-2">
              <span>Get Help</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10 pointer-events-none">
            <AlertCircle className="w-28 h-28 text-white" />
          </div>
        </div>
      </section>

      {/* Consult Top Specialists */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-bold text-slate-800">Consult Top Specialists</h2>
          <Link 
            to="/specialties?type=doctor" 
            className="text-[11px] text-blue-600 font-semibold cursor-pointer hover:underline flex items-center gap-0.5"
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2">
            <Link to="/specialties?type=doctor" className="bg-white rounded-xl border border-slate-100 p-3 flex flex-col items-center text-center shadow-sm hover:shadow-md hover:border-blue-100 transition-all">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-2">
                    <Heart className="w-5 h-5 text-red-400" />
                </div>
                <h4 className="text-[10px] font-bold text-slate-800 mb-0.5">Cardiologist</h4>
                <p className="text-[9px] text-emerald-500 font-bold">Video Call</p>
            </Link>
            <Link to="/specialties?type=doctor" className="bg-white rounded-xl border border-slate-100 p-3 flex flex-col items-center text-center shadow-sm hover:shadow-md hover:border-blue-100 transition-all">
                <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center mb-2">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                </div>
                <h4 className="text-[10px] font-bold text-slate-800 mb-0.5">Dermatologist</h4>
                <p className="text-[9px] text-emerald-500 font-bold">Video Call</p>
            </Link>
            <Link to="/specialties?type=doctor" className="bg-white rounded-xl border border-slate-100 p-3 flex flex-col items-center text-center shadow-sm hover:shadow-md hover:border-blue-100 transition-all">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-2">
                    <Smile className="w-5 h-5 text-blue-500" />
                </div>
                <h4 className="text-[10px] font-bold text-slate-800 mb-0.5">Pediatrician</h4>
                <p className="text-[9px] text-emerald-500 font-bold">Video Call</p>
            </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-2">
        <h2 className="text-[15px] font-bold mb-3 text-slate-800">Frequently Asked Questions</h2>
        <div className="space-y-2">
            {FAQ_ITEMS.map((item, i) => (
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

      {/* MediAI Assistant */}
      <div className="bg-[#1a1f2e] rounded-2xl p-4 flex items-center gap-3 shadow-md">
        <div className="w-10 h-10 rounded-full bg-[#273041] flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-sky-400" />
        </div>
        <div>
            <h4 className="text-white text-[12px] font-bold mb-0.5">Chat with MediAI Assistant</h4>
            <p className="text-[9px] text-slate-400">Instant symptom checker & health recommendations</p>
        </div>
      </div>
      
    </div>
  );
};

export default Home;
