import { useFormContext } from "react-hook-form";
import { Building2, FileText, Phone, Mail, Globe, Calendar } from "lucide-react";
import type { OnboardingFormValues } from "../../schema";

export function Step3Hospital() {
  const { register, formState: { errors } } = useFormContext<OnboardingFormValues>();
  const entityErrors = errors.hospitalInfo;

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex flex-col gap-1.5 mb-2">
        <h2 className="text-[22px] font-bold text-[#172033] tracking-tight">Tell us about your hospital</h2>
        <p className="text-[14px] text-[#667085]">Provide basic details about your healthcare facility.</p>
      </div>

      <div className="flex flex-col gap-4">
        
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[#172033] ml-1">Hospital Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
              <Building2 className="w-5 h-5" />
            </div>
            <input 
              {...register("hospitalInfo.hospitalName")}
              type="text" 
              placeholder="e.g. City Care Hospital" 
              className={`w-full pl-11 pr-4 py-3.5 bg-white border ${entityErrors?.hospitalName ? 'border-red-500' : 'border-gray-200 focus:border-[#1769E0]'} rounded-2xl outline-none focus:ring-4 transition-all text-[15px] font-medium placeholder:text-gray-400`}
            />
          </div>
          {entityErrors?.hospitalName && <span className="text-red-500 text-[12px] ml-1 font-medium">{entityErrors.hospitalName.message}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[#172033] ml-1">Hospital Type</label>
          <select 
            {...register("hospitalInfo.hospitalType")}
            className={`w-full px-4 py-3.5 bg-white border ${entityErrors?.hospitalType ? 'border-red-500' : 'border-gray-200 focus:border-[#1769E0]'} rounded-2xl outline-none focus:ring-4 transition-all text-[15px] font-medium text-[#172033] appearance-none`}
          >
            <option value="">Select Hospital Type</option>
            <option value="General Hospital">General Hospital</option>
            <option value="Multi-Specialty Hospital">Multi-Specialty Hospital</option>
            <option value="Specialty Hospital">Specialty Hospital</option>
            <option value="Clinic / Hospital">Clinic / Hospital</option>
            <option value="Other">Other</option>
          </select>
          {entityErrors?.hospitalType && <span className="text-red-500 text-[12px] ml-1 font-medium">{entityErrors.hospitalType.message}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[#172033] ml-1">Registration Number</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
              <FileText className="w-5 h-5" />
            </div>
            <input 
              {...register("hospitalInfo.registrationNumber")}
              type="text" 
              placeholder="Registration No." 
              className={`w-full pl-11 pr-4 py-3.5 bg-white border ${entityErrors?.registrationNumber ? 'border-red-500' : 'border-gray-200 focus:border-[#1769E0]'} rounded-2xl outline-none focus:ring-4 transition-all text-[15px] font-medium placeholder:text-gray-400`}
            />
          </div>
          {entityErrors?.registrationNumber && <span className="text-red-500 text-[12px] ml-1 font-medium">{entityErrors.registrationNumber.message}</span>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#172033] ml-1">Phone Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                <Phone className="w-4 h-4" />
              </div>
              <input 
                {...register("hospitalInfo.hospitalPhone")}
                type="tel" 
                placeholder="Phone" 
                className={`w-full pl-9 pr-3 py-3.5 bg-white border ${entityErrors?.hospitalPhone ? 'border-red-500' : 'border-gray-200 focus:border-[#1769E0]'} rounded-2xl outline-none focus:ring-4 transition-all text-[14px] font-medium placeholder:text-gray-400`}
              />
            </div>
            {entityErrors?.hospitalPhone && <span className="text-red-500 text-[12px] ml-1 font-medium">{entityErrors.hospitalPhone.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#172033] ml-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                <Mail className="w-4 h-4" />
              </div>
              <input 
                {...register("hospitalInfo.hospitalEmail")}
                type="email" 
                placeholder="Email" 
                className={`w-full pl-9 pr-3 py-3.5 bg-white border ${entityErrors?.hospitalEmail ? 'border-red-500' : 'border-gray-200 focus:border-[#1769E0]'} rounded-2xl outline-none focus:ring-4 transition-all text-[14px] font-medium placeholder:text-gray-400`}
              />
            </div>
            {entityErrors?.hospitalEmail && <span className="text-red-500 text-[12px] ml-1 font-medium">{entityErrors.hospitalEmail.message}</span>}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[#172033] ml-1">Website (Optional)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
              <Globe className="w-5 h-5" />
            </div>
            <input 
              {...register("hospitalInfo.website")}
              type="url" 
              placeholder="https://example.com" 
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 focus:border-[#1769E0] rounded-2xl outline-none focus:ring-4 transition-all text-[15px] font-medium placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[#172033] ml-1">Established Year (Optional)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
              <Calendar className="w-5 h-5" />
            </div>
            <input 
              {...register("hospitalInfo.establishedYear")}
              type="number" 
              placeholder="e.g. 1995" 
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 focus:border-[#1769E0] rounded-2xl outline-none focus:ring-4 transition-all text-[15px] font-medium placeholder:text-gray-400"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
