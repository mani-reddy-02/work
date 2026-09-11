import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const slides = [
  {
    id: 2,
    title: 'Host Community Medical Camps',
    description: "Expand your hospital's reach. Let MediQuee manage the logistics. Schedule a camp today.",
    buttonText: 'Book Camp',
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=2070&auto=format&fit=crop',
    path: '/book-camp'
  },
  {
    id: 3,
    title: 'Hospital Marketing Services',
    description: 'Boost your visibility and patient footfall. Book our specialized marketing services tailored for hospitals.',
    buttonText: 'Book Marketing',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
    path: '/book-marketing'
  },
  {
    id: 1,
    title: 'Learn more about MediQuee',
    description: 'Discover how our platform can streamline your hospital operations and improve patient care.',
    buttonText: 'Learn More',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop',
    path: '/about'
  }
];

export function PromoCarousel() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div variants={item} className="relative w-full bg-[#1769E0] rounded-2xl overflow-hidden flex shadow-[0_4px_12px_rgba(23,105,224,0.15)] mb-2">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="flex w-full p-3 gap-4"
        >
          <div className="w-[120px] shrink-0 h-[120px]">
            <img 
              src={slides[currentSlide].image} 
              alt={slides[currentSlide].title}
              className="w-full h-full object-cover rounded-xl shadow-sm"
            />
          </div>
          <div className="flex flex-col justify-center text-white flex-1 pb-3 pr-2">
            <h3 className="text-[15px] md:text-[17px] font-semibold leading-tight mb-1.5">
              {slides[currentSlide].title}
            </h3>
            <p className="text-[12px] md:text-[13px] text-blue-100 line-clamp-3 mb-3 leading-snug pr-2">
              {slides[currentSlide].description}
            </p>
            <button 
              onClick={() => navigate(slides[currentSlide].path)}
              className="bg-white text-[#1769E0] text-[12px] font-semibold px-4 py-1.5 rounded-full w-max flex items-center gap-1 hover:bg-blue-50 transition-colors"
            >
              {slides[currentSlide].buttonText} <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10 pb-1">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              currentSlide === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/40'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </motion.div>
  );
}
