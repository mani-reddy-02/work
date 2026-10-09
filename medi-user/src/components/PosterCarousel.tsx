import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hospital, Video, Sparkles, Activity, ShieldCheck, ArrowRight } from 'lucide-react';
import { TestTube, Home as HomeIcon } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

interface PosterCarouselProps {
  module: string;
}

const PosterCarousel: React.FC<PosterCarouselProps> = ({ module }) => {
  const navigate = useNavigate();
  const [posters, setPosters] = useState<any[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const dragDistance = useRef(0);

  useEffect(() => {
    fetch(`${API_BASE_URL}/home-posters?module=${module}`)
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
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
           };

           const mappedPosters = res.data.map((p: any) => {
             // For HOME module, we might have default templates. For others, likely purely custom images.
             if (p.isDefault && DEFAULT_TEMPLATES[p.title]) {
               return {
                 ...p,
                 ...DEFAULT_TEMPLATES[p.title],
                 path: p.buttonAction,
                 isCustom: false
               };
             }
             return {
               ...p,
               path: p.buttonAction,
               isCustom: true
             };
           });
           setPosters(mappedPosters);
        }
      })
      .catch(console.error);
  }, [module]);

  useEffect(() => {
    if (isPaused || isDragging.current || posters.length === 0) return;
    
    const timer = setInterval(() => {
      if (sliderRef.current) {
        const nextSlide = (activeSlide + 1) % posters.length;
        const scrollAmount = nextSlide * sliderRef.current.offsetWidth;
        sliderRef.current.scrollTo({
          left: scrollAmount,
          behavior: 'smooth'
        });
        setActiveSlide(nextSlide);
      }
    }, 4500);

    return () => clearInterval(timer);
  }, [activeSlide, isPaused, posters.length]);

  const handleScroll = () => {
    if (sliderRef.current && !isDragging.current) {
      const scrollPosition = sliderRef.current.scrollLeft;
      const width = sliderRef.current.offsetWidth;
      const newActive = Math.round(scrollPosition / width);
      if (newActive !== activeSlide && newActive >= 0 && newActive < posters.length) {
        setActiveSlide(newActive);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragDistance.current = 0;
    if (sliderRef.current) {
      startX.current = e.pageX - sliderRef.current.offsetLeft;
      scrollLeft.current = sliderRef.current.scrollLeft;
      sliderRef.current.style.scrollBehavior = 'auto';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX.current) * 2;
    sliderRef.current.scrollLeft = scrollLeft.current - walk;
    dragDistance.current = Math.abs(walk);
  };

  const handleMouseUpOrLeave = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (sliderRef.current) {
      sliderRef.current.style.scrollBehavior = 'smooth';
      const scrollPosition = sliderRef.current.scrollLeft;
      const width = sliderRef.current.offsetWidth;
      const idx = Math.round(scrollPosition / width);
      sliderRef.current.scrollTo({
        left: idx * width,
        behavior: 'smooth'
      });
      setActiveSlide(idx);
    }
  };

  if (posters.length === 0) return null;

  return (
    <div className="relative mb-6">
      <section 
        className="relative overflow-hidden rounded-2xl shadow-sm min-h-[170px] md:min-h-[220px]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => { setIsPaused(false); isDragging.current = false; }}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        aria-label="Poster Carousel"
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
          {posters.map((slide, idx) => {
            if (slide.isCustom) {
              return (
                <div 
                  key={slide.id || idx} 
                  onClick={() => {
                    if (dragDistance.current < 10 && slide.path) navigate(slide.path);
                  }}
                  className={`w-full flex-shrink-0 snap-center min-h-[170px] md:min-h-[220px] relative cursor-pointer overflow-hidden bg-slate-100 flex items-center justify-center`}
                >
                  {slide.imageUrl ? (
                    <img src={slide.imageUrl} alt={slide.title || "Poster"} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-400 font-medium text-sm">No Image Provided</span>
                  )}
                </div>
              );
            }

            const Icon1 = slide.icon || Hospital;
            const Icon2 = slide.icon2 || ShieldCheck;
            return (
              <div 
                key={slide.id || idx} 
                onClick={() => {
                  if (dragDistance.current < 10 && slide.path) navigate(slide.path);
                }}
                className={`w-full flex-shrink-0 snap-center ${slide.color || 'bg-blue-600'} min-h-[170px] md:min-h-[220px] p-5 md:p-6 text-white flex items-center justify-between relative cursor-pointer overflow-hidden`}
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
                      if (slide.path) navigate(slide.path);
                    }}
                    className="bg-white text-slate-900 px-4 py-1.5 md:px-5 md:py-2 rounded-full text-[11px] md:text-[13px] font-bold flex items-center gap-1.5 w-fit hover:bg-slate-50 transition-colors shadow-sm active:scale-95 pointer-events-auto"
                  >
                    <span>{slide.cta || slide.buttonText || 'Explore'}</span>
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
      </section>
      
      {/* Indicator Dots */}
      <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 md:gap-2 z-20">
        {posters.map((_, idx) => (
          <button
            key={idx}
            aria-label={`Go to slide ${idx + 1}`}
            onClick={() => {
              setActiveSlide(idx);
              if (sliderRef.current) {
                sliderRef.current.scrollTo({
                  left: idx * sliderRef.current.offsetWidth,
                  behavior: 'smooth'
                });
              }
            }}
            className={`h-1.5 md:h-2 rounded-full transition-all duration-300 ${
              activeSlide === idx ? 'bg-white w-4' : 'bg-white/50 w-1.5 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default PosterCarousel;
