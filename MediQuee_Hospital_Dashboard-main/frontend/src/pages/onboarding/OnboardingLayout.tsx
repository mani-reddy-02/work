import { type ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

interface OnboardingLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  isNextDisabled?: boolean;
  showBack?: boolean;
}

export function OnboardingLayout({
  children,
  currentStep,
  totalSteps,
  onBack,
  onNext,
  nextLabel = "Continue",
  isNextDisabled = false,
  showBack = true
}: OnboardingLayoutProps) {
  const progress = (currentStep / totalSteps) * 100;

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !isNextDisabled && onNext && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNextDisabled, onNext]);

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center lg:p-6">
      
      {/* Subtle Background Gradient for Mobile */}
      <div className="fixed top-0 left-0 w-full h-[300px] bg-gradient-to-b from-[#1769E0]/5 to-transparent pointer-events-none lg:hidden" />

      {/* Main Container */}
      <div className="w-full max-w-[1200px] flex bg-transparent lg:bg-white lg:shadow-2xl lg:shadow-black/5 lg:rounded-[40px] overflow-hidden min-h-screen lg:min-h-[800px] lg:h-[85vh]">
        
        {/* Left Branding Side (Desktop Only) */}
        <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-[#1769E0] to-[#0A4399] relative flex-col justify-between p-12 text-white overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/5 blur-[60px] rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />
          
          <div className="relative z-10">
            <h1 className="text-[32px] font-black tracking-tight mb-4 leading-tight">
              Join the future of healthcare.
            </h1>
            <p className="text-white/80 text-[16px] font-medium leading-relaxed max-w-sm">
              Register your facility on MediQuee to manage operations, scale your services, and provide premium care to patients.
            </p>
          </div>

          <div className="relative z-10 flex flex-col gap-8">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                  <span className="text-xl font-bold">1</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[15px]">Create Account</span>
                  <span className="text-white/70 text-[13px]">Set up your owner profile</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                  <span className="text-xl font-bold">2</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[15px]">Facility Details</span>
                  <span className="text-white/70 text-[13px]">Tell us about your operations</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                  <span className="text-xl font-bold">3</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[15px]">Verification</span>
                  <span className="text-white/70 text-[13px]">Upload required documents</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 pt-6 border-t border-white/10">
              <div className="flex -space-x-3">
                <div className="w-10 h-10 rounded-full border-2 border-[#0A4399] bg-white/20" />
                <div className="w-10 h-10 rounded-full border-2 border-[#0A4399] bg-white/30" />
                <div className="w-10 h-10 rounded-full border-2 border-[#0A4399] bg-white/40" />
              </div>
              <span className="text-[13px] font-semibold text-white/80">
                Join 500+ premium facilities
              </span>
            </div>
          </div>
        </div>
        
        {/* Right Form Side */}
        <div className="w-full lg:w-7/12 flex flex-col relative bg-white min-h-screen lg:min-h-0 md:my-8 md:min-h-[800px] md:h-auto md:rounded-[32px] lg:my-0 lg:rounded-none md:shadow-xl md:shadow-black/5 lg:shadow-none md:max-w-md md:mx-auto lg:max-w-none lg:mx-0 overflow-hidden">
          
          <div className="w-full lg:max-w-[480px] lg:mx-auto min-h-screen lg:min-h-0 flex flex-col relative h-full">
            {/* Header & Progress */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
              <div className="flex items-center justify-between px-4 h-14">
                {showBack && onBack ? (
                  <button 
                    onClick={onBack}
                    className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                    aria-label="Go back"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                ) : (
                  <div className="w-10 h-10 -ml-2" />
                )}
                
                <div className="flex flex-col items-center justify-center flex-1">
                  <span className="text-[15px] font-bold text-[#172033] tracking-tight lg:hidden">MediQuee</span>
                  <span className="text-[11px] font-semibold text-gray-500 mt-0.5">Step {currentStep} of {totalSteps}</span>
                </div>
                
                <div className="flex items-center justify-end -mr-2 min-w-[60px]">
                  <Link 
                    to="/login"
                    className="hidden lg:flex items-center justify-center text-[13px] font-bold text-[#1769E0] hover:text-[#0A4399] transition-colors bg-[#1769E0]/10 hover:bg-[#1769E0]/20 px-4 py-1.5 rounded-full"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
              
              <div className="w-full h-1 bg-gray-100">
                <motion.div 
                  className="h-full bg-[#1769E0]"
                  initial={{ width: `${((currentStep - 1) / totalSteps) * 100}%` }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                />
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col relative pb-32">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="flex-1 flex flex-col w-full h-full px-6 pt-8 pb-8"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Actions */}
            <div className="absolute bottom-0 left-0 right-0 p-4 px-6 bg-white border-t border-gray-100 pb-safe">
              <div className="flex gap-3">
                {showBack && onBack && (
                  <button
                    onClick={onBack}
                    className="flex-1 max-w-[120px] h-[52px] bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-[#172033] font-semibold rounded-2xl transition-colors flex items-center justify-center"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={onNext}
                  disabled={isNextDisabled}
                  className={`flex-1 h-[52px] font-bold rounded-2xl transition-all flex items-center justify-center gap-2 ${
                    isNextDisabled 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-[#1769E0] hover:bg-blue-700 active:scale-[0.98] text-white shadow-lg shadow-blue-500/25'
                  }`}
                >
                  {nextLabel}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
