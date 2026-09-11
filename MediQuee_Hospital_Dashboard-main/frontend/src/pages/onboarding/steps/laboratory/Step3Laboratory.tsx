import { useFormContext } from "react-hook-form";
import { Microscope, FileText, Phone, Mail, Globe, Calendar } from "lucide-react";
import type { OnboardingFormValues } from "../../schema";

export function Step3Laboratory() {
  const { register, formState: { errors } } = useFormContext<OnboardingFormValues>();
  const entityErrors = errors.labInfo;

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex flex-col gap-1.5 mb-2">
        <h2 className="text-[22px] font-bold text-[#172033] tracking-tight">Tell us about your laboratory</h2>
        <p className="text-[14px] text-[#667085]">Provide basic details about your diagnostic facility.</p>
      </div>

      <div className="flex flex-col gap-4">
        
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[#172033] ml-1">Laboratory Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
              <Microscope className="w-5 h-5" />
            </div>
            <input 
              {...register("labInfo.labName")}
              type="text" 
              placeholder="e.g. Accurate Diagnostics" 
              className={`w-full pl-11 pr-4 py-3.5 bg-white border ${entityErrors?.labName ? 'border-red-500' : 'border-gray-200 focus:border-[#1769E0]'} rounded-2xl outline-none focus:ring-4 transition-all text-[15px] font-medium placeholder:text-gray-400`}
            />
          </div>
          {entityErrors?.labName && <span className="text-red-500 text-[12px] ml-1 font-medium">{entityErrors.labName.message}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[#172033] ml-1">Laboratory Type</label>
          <select 
            {...register("labInfo.labType")}
            className={`w-full px-4 py-3.5 bg-white border ${entityErrors?.labType ? 'border-red-500' : 'border-gray-200 focus:border-[#1769E0]'} rounded-2xl outline-none focus:ring-4 transition-all text-[15px] font-medium text-[#172033] appearance-none`}
          >
            <option value="">Select Laboratory Type</option>
            <option value="Diagnostic Laboratory">Diagnostic Laboratory</option>
            <option value="Pathology Laboratory">Pathology Laboratory</option>
            <option value="Clinical Laboratory">Clinical Laboratory</option>
            <option value="Medical Testing Laboratory">Medical Testing Laboratory</option>
            <option value="Hospital Laboratory">Hospital Laboratory</option>
            <option value="Multi-Specialty Laboratory">Multi-Specialty Laboratory</option>
            <option value="Other">Other</option>
          </select>
          {entityErrors?.labType && <span className="text-red-500 text-[12px] ml-1 font-medium">{entityErrors.labType.message}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[#172033] ml-1">Registration Number</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
              <FileText className="w-5 h-5" />
            </div>
            <input 
              {...register("labInfo.registrationNumber")}
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
                {...register("labInfo.labPhone")}
                type="tel" 
                placeholder="Phone" 
                className={`w-full pl-9 pr-3 py-3.5 bg-white border ${entityErrors?.labPhone ? 'border-red-500' : 'border-gray-200 focus:border-[#1769E0]'} rounded-2xl outline-none focus:ring-4 transition-all text-[14px] font-medium placeholder:text-gray-400`}
              />
            </div>
            {entityErrors?.labPhone && <span className="text-red-500 text-[12px] ml-1 font-medium">{entityErrors.labPhone.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#172033] ml-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                <Mail className="w-4 h-4" />
              </div>
              <input 
                {...register("labInfo.labEmail")}
                type="email" 
                placeholder="Email" 
                className={`w-full pl-9 pr-3 py-3.5 bg-white border ${entityErrors?.labEmail ? 'border-red-500' : 'border-gray-200 focus:border-[#1769E0]'} rounded-2xl outline-none focus:ring-4 transition-all text-[14px] font-medium placeholder:text-gray-400`}
              />
            </div>
            {entityErrors?.labEmail && <span className="text-red-500 text-[12px] ml-1 font-medium">{entityErrors.labEmail.message}</span>}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[#172033] ml-1">Website (Optional)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
              <Globe className="w-5 h-5" />
            </div>
            <input 
              {...register("labInfo.website")}
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
              {...register("labInfo.establishedYear")}
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
