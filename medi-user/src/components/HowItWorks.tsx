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
          // Only auto-scroll if the container is actually scrollable
          if (scrollContainer.scrollWidth <= scrollContainer.clientWidth + 8) return;

          const isAtEnd = scrollContainer.scrollLeft + scrollContainer.clientWidth >= scrollContainer.scrollWidth - 10;
          
          if (isAtEnd) {
            scrollContainer.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            const firstChild = scrollContainer.firstElementChild as HTMLElement;
            const scrollAmount = firstChild ? firstChild.clientWidth + 12 : 160; // 12px is gap-3
            scrollContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
          }
        }
      }, 4000); // Standard slow scroll every 4 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPaused]);

  return (
    <div className={`bg-white p-4 sm:p-6 text-center ${className}`}>
      <div className="flex items-center justify-center gap-3 mb-4 sm:mb-6">
        <div className="h-[1px] w-6 sm:w-10 bg-blue-600/30"></div>
        <h2 className="font-bold text-slate-800 text-[14px] sm:text-[15px] md:text-base">{title}</h2>
        <div className="h-[1px] w-6 sm:w-10 bg-blue-600/30"></div>
      </div>
      
      <div 
        ref={scrollRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="flex overflow-x-auto md:grid md:overflow-visible hide-scrollbar gap-3 sm:gap-4 pb-2 px-1 snap-x justify-start md:justify-center"
        style={{
          gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`
        }}
      >
        {steps.map((step) => (
          <div 
            key={step.id} 
            className="snap-center shrink-0 w-[150px] sm:w-[170px] md:w-auto md:shrink md:flex-1 h-auto min-h-[175px] bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-100 shadow-xs flex flex-col items-center justify-start hover:shadow-md hover:border-blue-200 transition-all relative overflow-hidden group"
          >
             {/* Number */}
             <div className="absolute top-0 right-0 bg-blue-50 text-blue-600 font-black text-[10px] px-2 py-1 rounded-bl-xl border-b border-l border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
               {step.id}
             </div>
             
             {/* Icon Container */}
             <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5 mt-1 shrink-0 group-hover:scale-110 transition-transform">
               <step.icon className="w-5 h-5" strokeWidth={2} />
             </div>
             
             {/* Title */}
             <h3 className="font-bold text-slate-900 text-[12px] sm:text-[13px] md:text-sm mb-1 leading-tight text-center w-full">
               {step.title}
             </h3>
             
             {/* Description */}
             <p className="text-[10px] sm:text-[11px] text-slate-500 leading-relaxed text-center font-medium line-clamp-3">
               {step.desc}
             </p>
          </div>
        ))}
      </div>
    </div>
  );
}
