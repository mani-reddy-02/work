import { useFormContext } from "react-hook-form";
import { Building2, Microscope, CheckCircle2 } from "lucide-react";
import type { OnboardingFormValues } from "../../schema";

export function Step2BusinessType() {
  const { watch, setValue } = useFormContext<OnboardingFormValues>();
  const selectedType = watch("businessType.businessType");

  const handleSelect = (type: "hospital" | "laboratory") => {
    setValue("businessType.businessType", type, { shouldValidate: true });
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex flex-col gap-1.5 mb-2">
        <h2 className="text-[22px] font-bold text-[#172033] tracking-tight">What are you registering?</h2>
        <p className="text-[14px] text-[#667085]">Select your facility type to tailor your onboarding experience.</p>
      </div>

      <div className="flex flex-col gap-4">
        
        {/* Hospital Option */}
        <button
          type="button"
          onClick={() => handleSelect("hospital")}
          className={`relative p-5 rounded-[20px] text-left transition-all duration-200 border-2 ${
            selectedType === 'hospital' 
              ? 'border-[#1769E0] bg-[#1769E0]/5 shadow-sm shadow-[#1769E0]/10' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          {selectedType === 'hospital' && (
            <div className="absolute top-4 right-4 text-[#1769E0]">
              <CheckCircle2 className="w-6 h-6 fill-[#1769E0]/20" />
            </div>
          )}
          
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
            selectedType === 'hospital' ? 'bg-[#1769E0] text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            <Building2 className="w-6 h-6" />
          </div>
          
          <h3 className={`text-[17px] font-bold mb-1.5 transition-colors ${
            selectedType === 'hospital' ? 'text-[#1769E0]' : 'text-[#172033]'
          }`}>
            HOSPITAL
          </h3>
          <p className="text-[13px] text-[#667085] leading-relaxed pr-6">
            Manage hospital operations, doctors, OPs, nursing, laboratories and patient services.
          </p>
        </button>

        {/* Laboratory Option */}
        <button
          type="button"
          onClick={() => handleSelect("laboratory")}
          className={`relative p-5 rounded-[20px] text-left transition-all duration-200 border-2 ${
            selectedType === 'laboratory' 
              ? 'border-[#1769E0] bg-[#1769E0]/5 shadow-sm shadow-[#1769E0]/10' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          {selectedType === 'laboratory' && (
            <div className="absolute top-4 right-4 text-[#1769E0]">
              <CheckCircle2 className="w-6 h-6 fill-[#1769E0]/20" />
            </div>
          )}
          
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
            selectedType === 'laboratory' ? 'bg-[#1769E0] text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            <Microscope className="w-6 h-6" />
          </div>
          
          <h3 className={`text-[17px] font-bold mb-1.5 transition-colors ${
            selectedType === 'laboratory' ? 'text-[#1769E0]' : 'text-[#172033]'
          }`}>
            LABORATORY
          </h3>
          <p className="text-[13px] text-[#667085] leading-relaxed pr-6">
            Manage diagnostic tests, lab orders, reports and home sample collection.
          </p>
        </button>

      </div>
      
      {/* Hidden input to trigger hook-form validation if needed */}
      <input type="hidden" {...useFormContext().register("businessType.businessType")} />
      
    </div>
  );
}
