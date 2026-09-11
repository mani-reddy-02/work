import { useFormContext } from "react-hook-form";
import { CheckCircle2, TestTube } from "lucide-react";
import type { OnboardingFormValues } from "../../schema";

const LAB_SERVICES = [
  "Blood Tests", "Urine Tests", "Stool Tests", "Biochemistry", 
  "Hematology", "Microbiology", "Pathology", "Immunology", 
  "Serology", "Hormone Tests", "Clinical Chemistry", "Molecular Diagnostics", 
  "Genetic Testing", "Infectious Disease Testing", "Health Packages", "Home Sample Collection"
];

export function Step5LabServices() {
  const { watch, setValue, formState: { errors } } = useFormContext<OnboardingFormValues>();
  const selectedServices = watch("labServices.services") || [];
  const entityErrors = errors.labServices;

  const toggleService = (id: string) => {
    if (selectedServices.includes(id)) {
      setValue("labServices.services", selectedServices.filter(s => s !== id), { shouldValidate: true });
    } else {
      setValue("labServices.services", [...selectedServices, id], { shouldValidate: true });
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex flex-col gap-1.5 mb-2">
        <h2 className="text-[22px] font-bold text-[#172033] tracking-tight">What services does your laboratory provide?</h2>
        <p className="text-[14px] text-[#667085]">Select the diagnostic services available at your laboratory.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {LAB_SERVICES.map((service) => {
          const isSelected = selectedServices.includes(service);

          return (
            <button
              key={service}
              type="button"
              onClick={() => toggleService(service)}
              className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all relative min-h-[96px] ${
                isSelected 
                  ? 'border-[#1769E0] bg-[#1769E0]/5 shadow-sm shadow-[#1769E0]/10' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 text-[#1769E0]">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                isSelected ? 'bg-[#1769E0] text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                <TestTube className="w-4 h-4" />
              </div>
              <span className={`text-[12px] font-bold text-center leading-tight transition-colors ${
                isSelected ? 'text-[#1769E0]' : 'text-[#172033]'
              }`}>
                {service}
              </span>
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
