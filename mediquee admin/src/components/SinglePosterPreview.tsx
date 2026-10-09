import React from 'react';
import { Hospital, Video, Sparkles, Activity, ShieldCheck, ArrowRight, TestTube, Home as HomeIcon, HeartPulse, Megaphone, Info } from 'lucide-react';

interface SinglePosterPreviewProps {
  poster: any;
}

const SinglePosterPreview: React.FC<SinglePosterPreviewProps> = ({ poster }) => {
  // We need to resolve the default templates if it's a default poster
  const DEFAULT_TEMPLATES: any = {
    'Book Now': {
      title: 'Book Now',
      subtitle: 'Doctor Appointments & Hospital Visits',
      description: 'Find verified doctors, book clinic visits & hospital appointments',
      cta: 'Book Now',
      color: 'bg-gradient-to-r from-[#0062e6] via-[#0070f3] to-[#70a6ff]', 
      icon: Hospital, 
      icon2: Hospital,
      hasDoctorImage: true,
    },
    'Video Consult': { 
      title: 'Book Video Consultation',
      subtitle: 'Instant Online Care with Top Doctors',
      description: 'Connect with certified specialists within 15 mins from home',
      cta: 'Consult Now',
      color: 'bg-gradient-to-r from-[#0055d4] via-[#0284c7] to-[#0ea5e9]', 
      icon: Video, 
      icon2: Sparkles,
      hasDoctorImage: false,
    },
    'Lab Tests': { 
      title: 'Book Lab Test',
      subtitle: 'Flat 20% OFF on Diagnostic Tests',
      description: 'Certified diagnostic packages with fast digital test reports',
      cta: 'Explore Tests',
      color: 'bg-gradient-to-r from-[#1d4ed8] via-[#2563eb] to-[#38bdf8]', 
      icon: TestTube, 
      icon2: ShieldCheck,
      hasDoctorImage: false,
    },
    'Home Services': { 
      title: 'Book Home Sample Collection',
      subtitle: 'Hassle-free Sample Pickup at Home',
      description: 'Safe & hygienic diagnostic sample collection at your doorstep',
      cta: 'Book Collection',
      color: 'bg-gradient-to-r from-[#0369a1] via-[#0284c7] to-[#14b8a6]', 
      icon: Activity, 
      icon2: HomeIcon,
      hasDoctorImage: false,
    },
    'Host Medical Camps': {
      type: 'dashboard',
      badge: 'Community Outreach',
      title: 'Host Medical Camps',
      description: "Expand your hospital's reach into rural & urban communities. MediQuee coordinates logistics, registrations & footfall.",
      cta: 'Book Camp Now',
      icon: HeartPulse,
      accentBg: 'from-blue-600 via-indigo-600 to-indigo-800',
      tagBg: 'bg-blue-500/30 text-blue-100 border border-blue-400/40',
      image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=2070&auto=format&fit=crop',
    },
    'Hospital Marketing': {
      type: 'dashboard',
      badge: 'Growth & Visibility',
      title: 'Hospital Marketing',
      description: 'Boost OPD footfall and regional branding with healthcare-tailored digital ads, social awareness & local SEO.',
      cta: 'Request Marketing',
      icon: Megaphone,
      accentBg: 'from-sky-600 via-blue-600 to-indigo-700',
      tagBg: 'bg-sky-500/30 text-sky-100 border border-sky-400/40',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
    },
    'Platform Support & Demo': {
      type: 'dashboard',
      badge: 'Hospital Intelligence',
      title: 'Platform Support & Demo',
      description: 'Discover intelligent queue management, EHR integrations, and submit direct inquiries to MediQuee Administration.',
      cta: 'Connect with Admin',
      icon: Info,
      accentBg: 'from-indigo-600 via-purple-600 to-purple-800',
      tagBg: 'bg-purple-500/30 text-purple-100 border border-purple-400/40',
      image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop',
    }
  };

  let slide = { ...poster };
  let isCustom = true;
  if (poster.isDefault && DEFAULT_TEMPLATES[poster.title]) {
    slide = { ...poster, ...DEFAULT_TEMPLATES[poster.title] };
    isCustom = false;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-sm min-h-[170px] md:min-h-[220px] w-full max-w-4xl pointer-events-none select-none">
      {isCustom ? (
        <div className={`w-full h-full min-h-[170px] md:min-h-[220px] relative overflow-hidden bg-slate-100 flex items-center justify-center`}>
          {slide.imageUrl ? (
            <img src={slide.imageUrl} alt={slide.title || "Poster"} className="w-full h-full object-cover absolute inset-0" />
          ) : (
            <span className="text-slate-400 font-medium text-sm">No Image Provided</span>
          )}
        </div>
      ) : slide.type === 'dashboard' ? (
        <div className={`w-full h-full min-h-[170px] md:min-h-[220px] bg-gradient-to-r ${slide.accentBg} p-3.5 sm:p-4.5 flex items-center justify-between gap-3 sm:gap-5 text-white relative`}>
            {/* Left Content Column */}
            <div className="flex flex-col justify-center flex-1 z-10 pr-1 pl-2 md:pl-4">
              {/* Category Tag */}
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1 ${slide.tagBg}`}>
                  <Sparkles className="w-3 h-3" />
                  {slide.badge}
                </span>
              </div>

              <h3 className="text-[16px] sm:text-[18px] md:text-[22px] font-bold tracking-tight leading-snug drop-shadow-sm">
                {slide.title}
              </h3>

              <p className="text-[12px] sm:text-[13px] md:text-[14px] text-blue-100/90 line-clamp-2 mt-1 leading-relaxed max-w-sm md:max-w-md">
                {slide.description}
              </p>

              <div className="mt-2.5 md:mt-4 flex items-center gap-2">
                <button 
                  className="bg-white hover:bg-slate-50 text-slate-900 text-[12px] md:text-[14px] font-bold px-3.5 md:px-5 py-1.5 md:py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <span>{slide.cta || slide.buttonText || 'Explore'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right Thumbnail & Icon Badge */}
            <div className="shrink-0 relative w-[95px] h-[95px] md:w-[130px] md:h-[130px] rounded-2xl overflow-hidden shadow-md border-2 border-white/20 mr-2 md:mr-4">
              <img 
                src={slide.image} 
                alt={slide.title}
                className="w-full h-full object-cover pointer-events-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-1.5 right-1.5 w-7 h-7 md:w-9 md:h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-sm border border-white/30">
                {React.createElement(slide.icon || Info, { className: "w-4 h-4 md:w-5 md:h-5" })}
              </div>
            </div>
        </div>
      ) : (
        <div className={`w-full h-full min-h-[170px] md:min-h-[220px] absolute inset-0 ${slide.color || 'bg-blue-600'} p-5 md:p-6 text-white flex items-center justify-between`}>
          {/* Text Content */}
          <div className="relative z-20 w-[62%] md:w-[54%] flex flex-col justify-center py-1">
            <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-xs text-white text-[9px] md:text-[11px] font-bold px-2 py-0.5 rounded-full w-fit mb-1.5 border border-white/25 uppercase tracking-wider">
              {React.createElement(slide.icon || Hospital, { className: "w-3 h-3" })} MediQuee
            </span>
            <h2 className="text-[19px] md:text-[26px] font-bold mb-1 leading-[1.2] tracking-tight text-white">
              {slide.title}
            </h2>
            <p className="text-[10.5px] md:text-[13px] text-white/90 mb-3.5 md:mb-4 max-w-[190px] md:max-w-[320px] leading-snug">
              {slide.description}
            </p>
            <button 
              className="bg-white text-slate-900 px-4 py-1.5 md:px-5 md:py-2 rounded-full text-[11px] md:text-[13px] font-bold flex items-center gap-1.5 w-fit shadow-sm"
            >
              <span>{slide.cta || slide.buttonText || 'Explore'}</span>
              <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
          </div>

          {/* Right Visual / Graphic */}
          {slide.hasDoctorImage ? (
            <div 
              className="absolute right-0 bottom-0 top-0 w-[50%] md:w-[45%] md:max-w-[380px] z-10"
              style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 18%)', maskImage: 'linear-gradient(to right, transparent, black 18%)' }}
            >
              <img 
                src="http://localhost:5173/images/doctor.jpg" 
                alt="Doctor" 
                className="w-full h-full object-cover object-top md:object-[center_top]"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          ) : (
            <div className="absolute right-3 md:right-8 top-1/2 -translate-y-1/2 flex items-center justify-center z-10">
              <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
                <div className="w-16 h-16 md:w-22 md:h-22 rounded-full bg-white/20 flex items-center justify-center">
                  {React.createElement(slide.icon || Hospital, { className: "w-8 h-8 md:w-11 md:h-11 text-white" })}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white/90 text-slate-900 text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                  {React.createElement(slide.icon2 || ShieldCheck, { className: "w-3 h-3 text-blue-600" })}
                  <span>Active</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SinglePosterPreview;
