import React, { useRef, useState, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface HowItWorksStep {
  id: string; // E.g., '01', '02'
  title: string;
  desc: string;
  icon: LucideIcon;
}

interface HowItWorksProps {
  title: string;
  steps: HowItWorksStep[];
  className?: string;
}

export default function HowItWorks({ title, steps, className = '' }: HowItWorksProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-scroll logic
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let intervalId: ReturnType<typeof setInterval>;
    
    if (!isPaused) {
      intervalId = setInterval(() => {
        if (scrollContainer) {
          const isAtEnd = scrollContainer.scrollLeft + scrollContainer.clientWidth >= scrollContainer.scrollWidth - 10;
          
          if (isAtEnd) {
            scrollContainer.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            // Scroll by one card width (~148px)
            scrollContainer.scrollBy({ left: 148, behavior: 'smooth' });
          }
        }
      }, 3000); // Scroll every 3 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPaused]);

  return (
    <div className={`bg-white p-5 pt-6 text-center ${className}`}>
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="h-[1px] w-6 bg-blue-600/30"></div>
        <h2 className="font-bold text-slate-800 text-[14px]">{title}</h2>
        <div className="h-[1px] w-6 bg-blue-600/30"></div>
      </div>
      
      <div 
        ref={scrollRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="flex overflow-x-auto hide-scrollbar gap-2 pb-2 -mx-4 px-4 snap-x"
      >
        {steps.map((step) => (
          <div key={step.id} className="flex flex-col items-center bg-white border border-slate-100 shadow-sm rounded-xl p-3 shrink-0 w-[160px] sm:w-[150px] md:w-[140px] snap-center hover:shadow-md transition-shadow">
             
             {/* Number */}
             <span className="text-[14px] font-bold text-slate-300 mb-2 w-full text-center tracking-tight">
               {step.id}
             </span>
             
             {/* Icon Container */}
             <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-2.5 shrink-0 text-blue-600">
               <step.icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
             </div>
             
             {/* Title */}
             <h3 className="text-[11px] font-bold text-slate-800 mb-1 text-center w-full">
               {step.title}
             </h3>
             
             {/* Description */}
             <p className="text-[9px] text-slate-500 leading-snug text-center font-medium line-clamp-3">
               {step.desc}
             </p>
          </div>
        ))}
      </div>
    </div>
  );
}
