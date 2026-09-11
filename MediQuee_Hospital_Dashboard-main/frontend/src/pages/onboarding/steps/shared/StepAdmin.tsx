import { useFormContext } from "react-hook-form";
import { User, Phone, Mail, Shield } from "lucide-react";
import type { OnboardingFormValues } from "../../schema";

export function StepAdmin() {
  const { register, watch, formState: { errors } } = useFormContext<OnboardingFormValues>();
  const isHospital = watch("businessType.businessType") === "hospital";
  
  const entityType = isHospital ? "Hospital" : "Laboratory";
  const fieldPrefix = isHospital ? "hospitalAdmin" : "labAdmin";
  const entityErrors = isHospital ? errors.hospitalAdmin : errors.labAdmin;

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex flex-col gap-1.5 mb-2">
        <h2 className="text-[22px] font-bold text-[#172033] tracking-tight">{entityType} administrator</h2>
        <p className="text-[14px] text-[#667085]">This user will manage the {entityType} Dashboard.</p>
      </div>

      <div className="flex flex-col gap-4">
        
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[#172033] ml-1">Admin / Owner Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
              <User className="w-5 h-5" />
            </div>
            <input 
              {...register(`${fieldPrefix}.adminName` as any)}
              type="text" 
              placeholder="Full Name" 
              className={`w-full pl-11 pr-4 py-3.5 bg-white border ${entityErrors?.adminName ? 'border-red-500' : 'border-gray-200 focus:border-[#1769E0]'} rounded-2xl outline-none focus:ring-4 transition-all text-[15px] font-medium placeholder:text-gray-400`}
            />
          </div>
          {entityErrors?.adminName && <span className="text-red-500 text-[12px] ml-1 font-medium">{entityErrors.adminName.message as string}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[#172033] ml-1">Role</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
              <Shield className="w-5 h-5" />
            </div>
            <select 
              {...register(`${fieldPrefix}.adminRole` as any)}
              className={`w-full pl-11 pr-4 py-3.5 bg-white border ${entityErrors?.adminRole ? 'border-red-500' : 'border-gray-200 focus:border-[#1769E0]'} rounded-2xl outline-none focus:ring-4 transition-all text-[15px] font-medium text-[#172033] appearance-none`}
            >
              <option value="">Select Role</option>
              {isHospital ? (
                <>
                  <option value="Hospital Owner">Hospital Owner</option>
                  <option value="Hospital Administrator">Hospital Administrator</option>
                  <option value="Authorized Representative">Authorized Representative</option>
                </>
              ) : (
                <>
                  <option value="Laboratory Owner">Laboratory Owner</option>
                  <option value="Laboratory Administrator">Laboratory Administrator</option>
                  <option value="Authorized Representative">Authorized Representative</option>
                </>
              )}
            </select>
          </div>
          {entityErrors?.adminRole && <span className="text-red-500 text-[12px] ml-1 font-medium">{entityErrors.adminRole.message as string}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[#172033] ml-1">Phone Number</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
              <Phone className="w-5 h-5" />
            </div>
            <input 
              {...register(`${fieldPrefix}.adminPhone` as any)}
              type="tel" 
              placeholder="Phone Number" 
              className={`w-full pl-11 pr-4 py-3.5 bg-white border ${entityErrors?.adminPhone ? 'border-red-500' : 'border-gray-200 focus:border-[#1769E0]'} rounded-2xl outline-none focus:ring-4 transition-all text-[15px] font-medium placeholder:text-gray-400`}
            />
          </div>
          {entityErrors?.adminPhone && <span className="text-red-500 text-[12px] ml-1 font-medium">{entityErrors.adminPhone.message as string}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[#172033] ml-1">Email Address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
              <Mail className="w-5 h-5" />
            </div>
            <input 
              {...register(`${fieldPrefix}.adminEmail` as any)}
              type="email" 
              placeholder="Email Address" 
              className={`w-full pl-11 pr-4 py-3.5 bg-white border ${entityErrors?.adminEmail ? 'border-red-500' : 'border-gray-200 focus:border-[#1769E0]'} rounded-2xl outline-none focus:ring-4 transition-all text-[15px] font-medium placeholder:text-gray-400`}
            />
          </div>
          {entityErrors?.adminEmail && <span className="text-red-500 text-[12px] ml-1 font-medium">{entityErrors.adminEmail.message as string}</span>}
        </div>

      </div>
    </div>
  );
}
