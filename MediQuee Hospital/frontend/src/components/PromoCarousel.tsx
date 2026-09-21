import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, HeartPulse, Megaphone, Info, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const slides = [
  {
    id: 1,
    badge: 'Community Outreach',
    title: 'Host Medical Camps',
    description: "Expand your hospital's reach into rural & urban communities. MediQuee coordinates logistics, registrations & footfall.",
    buttonText: 'Book Camp Now',
    icon: HeartPulse,
    accentBg: 'from-blue-600 via-indigo-600 to-indigo-800',
    tagBg: 'bg-blue-500/30 text-blue-100 border border-blue-400/40',
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=2070&auto=format&fit=crop',
    path: '/book-camp'
  },
  {
    id: 2,
    badge: 'Growth & Visibility',
    title: 'Hospital Marketing',
    description: 'Boost OPD footfall and regional branding with healthcare-tailored digital ads, social awareness & local SEO.',
    buttonText: 'Request Marketing',
    icon: Megaphone,
    accentBg: 'from-sky-600 via-blue-600 to-indigo-700',
    tagBg: 'bg-sky-500/30 text-sky-100 border border-sky-400/40',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
    path: '/book-marketing'
  },
  {
    id: 3,
    badge: 'Hospital Intelligence',
    title: 'Platform Support & Demo',
    description: 'Discover intelligent queue management, EHR integrations, and submit direct inquiries to MediQuee Administration.',
    buttonText: 'Connect with Admin',
    icon: Info,
    accentBg: 'from-indigo-600 via-purple-600 to-purple-800',
    tagBg: 'bg-purple-500/30 text-purple-100 border border-purple-400/40',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop',
    path: '/about'
  }
];

import { type Variants } from 'framer-motion';

const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 280 : -280,
    opacity: 0,
    scale: 0.96
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      x: { type: 'spring' as const, stiffness: 350, damping: 32 },
      opacity: { duration: 0.25 },
      scale: { duration: 0.25 }
    }
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 280 : -280,
    opacity: 0,
    scale: 0.96,
    transition: {
      x: { type: 'spring' as const, stiffness: 350, damping: 32 },
      opacity: { duration: 0.2 },
      scale: { duration: 0.2 }
    }
  })
};

export function PromoCarousel() {
  const navigate = useNavigate();
  const [[page, direction], setPage] = useState<[number, number]>([0, 0]);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const isDragging = useRef(false);

  const activeIndex = (page % slides.length + slides.length) % slides.length;

  const paginate = useCallback((newDirection: number) => {
    setPage(([prevPage]) => [prevPage + newDirection, newDirection]);
  }, []);

  const goToSlide = (targetIndex: number) => {
    const diff = targetIndex - activeIndex;
    if (diff === 0) return;
    setPage(([prevPage]) => [prevPage + diff, diff > 0 ? 1 : -1]);
  };

  // Auto-slide every 6 seconds, paused when touching/hovering
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      paginate(1);
    }, 6000);
    return () => clearInterval(timer);
  }, [paginate, isPaused]);

  // Touch Swipe Handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    isDragging.current = false;
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    if (touchStartX.current !== null && Math.abs(touchEndX.current - touchStartX.current) > 10) {
      isDragging.current = true;
    }
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const distance = touchStartX.current - touchEndX.current;
      const minSwipeDistance = 35; // easily triggered swipe threshold
      if (distance > minSwipeDistance) {
        // Swiped Left -> Next slide
        paginate(1);
      } else if (distance < -minSwipeDistance) {
        // Swiped Right -> Previous slide
        paginate(-1);
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const currentSlideData = slides[activeIndex];
  const IconComponent = currentSlideData.icon;

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(currentSlideData.path);
  };

  const handleCardClick = () => {
    if (isDragging.current) return;
    navigate(currentSlideData.path);
  };

  return (
    <div 
      className="relative w-full rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(23,105,224,0.18)] mb-3 select-none touch-pan-y"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative w-full overflow-hidden min-h-[148px] sm:min-h-[155px]">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={page}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragStart={() => {
              isDragging.current = true;
              setIsPaused(true);
            }}
            onDragEnd={(_, { offset, velocity }) => {
              setIsPaused(false);
              const swipe = offset.x;
              if (swipe < -40 || velocity.x < -300) {
                paginate(1);
              } else if (swipe > 40 || velocity.x > 300) {
                paginate(-1);
              }
              setTimeout(() => {
                isDragging.current = false;
              }, 150);
            }}
            onClick={handleCardClick}
            className={`w-full h-full bg-gradient-to-r ${currentSlideData.accentBg} p-3.5 sm:p-4.5 flex items-center justify-between gap-3 sm:gap-5 cursor-pointer text-white relative`}
          >
            {/* Background Pattern Accent */}
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-surface/5 skew-x-[-15deg] pointer-events-none" />

            {/* Left Content Column */}
            <div className="flex flex-col justify-center flex-1 z-10 pr-1">
              {/* Category Tag */}
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1 ${currentSlideData.tagBg}`}>
                  <Sparkles className="w-3 h-3" />
                  {currentSlideData.badge}
                </span>
                <span className="text-[10px] text-white/60 font-medium hidden xs:inline">
                  • Swipe on mobile
                </span>
              </div>

              {/* Title */}
              <h3 className="text-[16px] sm:text-[18px] font-bold tracking-tight leading-snug drop-shadow-sm">
                {currentSlideData.title}
              </h3>

              {/* Description */}
              <p className="text-[12px] sm:text-[13px] text-blue-100/90 line-clamp-2 mt-1 leading-relaxed max-w-sm">
                {currentSlideData.description}
              </p>

              {/* Action Button */}
              <div className="mt-2.5 flex items-center gap-2">
                <button 
                  onClick={handleActionClick}
                  className="bg-surface hover:bg-blue-50 text-indigo-900 text-[12px] font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <span>{currentSlideData.buttonText}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right Thumbnail & Icon Badge */}
            <div className="shrink-0 relative w-[95px] h-[95px] sm:w-[110px] sm:h-[110px] rounded-2xl overflow-hidden shadow-md border-2 border-white/20">
              <img 
                src={currentSlideData.image} 
                alt={currentSlideData.title}
                className="w-full h-full object-cover pointer-events-none"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-lg bg-surface/90 backdrop-blur-sm flex items-center justify-center text-indigo-700 shadow-sm">
                <IconComponent className="w-4 h-4" />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Quick Nav Chevron Arrows (visible on hover / desktop) */}
        <button
          onClick={(e) => { e.stopPropagation(); paginate(-1); }}
          className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/25 hover:bg-black/45 text-white backdrop-blur-md flex items-center justify-center opacity-70 hover:opacity-100 active:scale-90 transition-all"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); paginate(1); }}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/25 hover:bg-black/45 text-white backdrop-blur-md flex items-center justify-center opacity-70 hover:opacity-100 active:scale-90 transition-all"
          aria-label="Next slide"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Slide Navigation Dots & Indicators */}
      <div className="absolute bottom-1.5 left-0 right-0 flex items-center justify-center gap-1.5 z-20">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={(e) => { e.stopPropagation(); goToSlide(idx); }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              activeIndex === idx 
                ? 'w-5 bg-surface shadow-sm' 
                : 'w-1.5 bg-surface/40 hover:bg-surface/70'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

