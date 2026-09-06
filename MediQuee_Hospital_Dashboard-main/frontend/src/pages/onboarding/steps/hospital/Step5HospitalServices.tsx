import { useFormContext } from "react-hook-form";
import { CheckCircle2, UserPlus, Video, Microscope, Syringe, Home } from "lucide-react";
import type { OnboardingFormValues } from "../../schema";

const HOSPITAL_SERVICES = [
  { id: "op_consultation", label: "OP Consultation", icon: UserPlus },
  { id: "video_consultation", label: "Video Consultation", icon: Video },
  { id: "lab_tests", label: "Laboratory Tests", icon: Microscope },
  { id: "home_sample", label: "Home Sample Collection", icon: Syringe },
  { id: "home_nursing", label: "Home Nursing", icon: Home },
];

export function Step5HospitalServices() {
  const { watch, setValue, formState: { errors } } = useFormContext<OnboardingFormValues>();
  const selectedServices = watch("hospitalServices.services") || [];
  const entityErrors = errors.hospitalServices;

  const toggleService = (id: string) => {
    if (selectedServices.includes(id)) {
      setValue("hospitalServices.services", selectedServices.filter(s => s !== id), { shouldValidate: true });
    } else {
      setValue("hospitalServices.services", [...selectedServices, id], { shouldValidate: true });
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex flex-col gap-1.5 mb-2">
        <h2 className="text-[22px] font-bold text-[#172033] tracking-tight">What services does your hospital provide?</h2>
        <p className="text-[14px] text-[#667085]">Select all services available at your hospital.</p>
      </div>

      <div className="flex flex-col gap-3">
        {HOSPITAL_SERVICES.map((service) => {
          const isSelected = selectedServices.includes(service.id);
          const Icon = service.icon;

          return (
            <button
              key={service.id}
              type="button"
              onClick={() => toggleService(service.id)}
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                isSelected 
                  ? 'border-[#1769E0] bg-[#1769E0]/5 shadow-sm shadow-[#1769E0]/10' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                isSelected ? 'bg-[#1769E0] text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 text-left">
                <span className={`text-[15px] font-bold transition-colors ${
                  isSelected ? 'text-[#1769E0]' : 'text-[#172033]'
                }`}>
                  {service.label}
                </span>
              </div>

              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                isSelected ? 'bg-[#1769E0] text-white' : 'border-2 border-gray-300'
              }`}>
                {isSelected && <CheckCircle2 className="w-4 h-4" />}
              </div>
            </button>
          );
        })}
      </div>

      {entityErrors?.services && (
        <span className="text-red-500 text-[13px] font-medium text-center mt-2">{entityErrors.services.message}</span>
      )}
    </div>
  );
}
