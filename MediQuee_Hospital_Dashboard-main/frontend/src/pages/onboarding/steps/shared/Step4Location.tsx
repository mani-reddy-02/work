import { useFormContext } from "react-hook-form";
import { MapPin, Navigation } from "lucide-react";
import type { OnboardingFormValues } from "../../schema";

export function Step4Location() {
  const { register, watch, formState: { errors } } = useFormContext<OnboardingFormValues>();
  const isHospital = watch("businessType.businessType") === "hospital";
  const entityType = isHospital ? "hospital" : "laboratory";
  const fieldPrefix = isHospital ? "hospitalLocation" : "labLocation";

  const entityErrors = isHospital ? errors.hospitalLocation : errors.labLocation;

  const handleUseLocation = () => {
    // In a real app, this would use geolocation API and geocoding to fill the fields
    alert("Location access requested. (Mock implementation)");
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex flex-col gap-1.5 mb-2">
        <h2 className="text-[22px] font-bold text-[#172033] tracking-tight">Where is your {entityType} located?</h2>
        <p className="text-[14px] text-[#667085]">Provide the exact address of your facility.</p>
      </div>

      <button
        type="button"
        onClick={handleUseLocation}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-50 hover:bg-blue-100 text-[#1769E0] font-bold rounded-2xl transition-colors active:scale-[0.98]"
      >
        <Navigation className="w-5 h-5" />
        Use Current Location
      </button>

      <div className="flex flex-col gap-4">
        {/* Address Line 1 & 2 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[#172033] ml-1">Address Line 1</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
              <MapPin className="w-5 h-5" />
            </div>
            <input 
              {...register(`${fieldPrefix}.address1` as any)}
              type="text" 
              placeholder="Building, Street, etc." 
              className={`w-full pl-11 pr-4 py-3.5 bg-white border ${entityErrors?.address1 ? 'border-red-500' : 'border-gray-200 focus:border-[#1769E0]'} rounded-2xl outline-none focus:ring-4 transition-all text-[15px] font-medium placeholder:text-gray-400`}
            />
          </div>
          {entityErrors?.address1 && <span className="text-red-500 text-[12px] ml-1 font-medium">{entityErrors.address1.message as string}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[#172033] ml-1">Address Line 2 (Optional)</label>
          <input 
            {...register(`${fieldPrefix}.address2` as any)}
            type="text" 
            placeholder="Apartment, suite, unit, etc." 
            className="w-full px-4 py-3.5 bg-white border border-gray-200 focus:border-[#1769E0] rounded-2xl outline-none focus:ring-4 transition-all text-[15px] font-medium placeholder:text-gray-400"
          />
        </div>

        {/* Area & City */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#172033] ml-1">Area / Locality</label>
            <input 
              {...register(`${fieldPrefix}.area` as any)}
              type="text" 
              placeholder="Area" 
              className={`w-full px-4 py-3.5 bg-white border ${entityErrors?.area ? 'border-red-500' : 'border-gray-200 focus:border-[#1769E0]'} rounded-2xl outline-none focus:ring-4 transition-all text-[15px] font-medium placeholder:text-gray-400`}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#172033] ml-1">City</label>
            <input 
              {...register(`${fieldPrefix}.city` as any)}
              type="text" 
              placeholder="City" 
              className={`w-full px-4 py-3.5 bg-white border ${entityErrors?.city ? 'border-red-500' : 'border-gray-200 focus:border-[#1769E0]'} rounded-2xl outline-none focus:ring-4 transition-all text-[15px] font-medium placeholder:text-gray-400`}
            />
          </div>
        </div>

        {/* State, Country & Pincode */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#172033] ml-1">State</label>
            <input 
              {...register(`${fieldPrefix}.state` as any)}
              type="text" 
              placeholder="State" 
              className={`w-full px-4 py-3.5 bg-white border ${entityErrors?.state ? 'border-red-500' : 'border-gray-200 focus:border-[#1769E0]'} rounded-2xl outline-none focus:ring-4 transition-all text-[15px] font-medium placeholder:text-gray-400`}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#172033] ml-1">Pincode</label>
            <input 
              {...register(`${fieldPrefix}.pincode` as any)}
              type="text" 
              placeholder="000000" 
              className={`w-full px-4 py-3.5 bg-white border ${entityErrors?.pincode ? 'border-red-500' : 'border-gray-200 focus:border-[#1769E0]'} rounded-2xl outline-none focus:ring-4 transition-all text-[15px] font-medium placeholder:text-gray-400`}
            />
          </div>
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[#172033] ml-1">Country</label>
          <input 
            {...register(`${fieldPrefix}.country` as any)}
            type="text" 
            placeholder="Country" 
            className={`w-full px-4 py-3.5 bg-white border ${entityErrors?.country ? 'border-red-500' : 'border-gray-200 focus:border-[#1769E0]'} rounded-2xl outline-none focus:ring-4 transition-all text-[15px] font-medium placeholder:text-gray-400`}
          />
        </div>

        <hr className="my-2 border-gray-100" />

        {/* Contact Info */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[#172033] ml-1">Facility Contact Number</label>
          <input 
            {...register(`${fieldPrefix}.contactNumber` as any)}
            type="tel" 
            placeholder="Contact Number" 
            className={`w-full px-4 py-3.5 bg-white border ${entityErrors?.contactNumber ? 'border-red-500' : 'border-gray-200 focus:border-[#1769E0]'} rounded-2xl outline-none focus:ring-4 transition-all text-[15px] font-medium placeholder:text-gray-400`}
          />
          {entityErrors?.contactNumber && <span className="text-red-500 text-[12px] ml-1 font-medium">{entityErrors.contactNumber.message as string}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[#172033] ml-1">Facility Email</label>
          <input 
            {...register(`${fieldPrefix}.email` as any)}
            type="email" 
            placeholder="Facility Email" 
            className={`w-full px-4 py-3.5 bg-white border ${entityErrors?.email ? 'border-red-500' : 'border-gray-200 focus:border-[#1769E0]'} rounded-2xl outline-none focus:ring-4 transition-all text-[15px] font-medium placeholder:text-gray-400`}
          />
          {entityErrors?.email && <span className="text-red-500 text-[12px] ml-1 font-medium">{entityErrors.email.message as string}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[#172033] ml-1">Emergency Contact (Optional)</label>
          <input 
            {...register(`${fieldPrefix}.emergencyContact` as any)}
            type="tel" 
            placeholder="Emergency Number" 
            className="w-full px-4 py-3.5 bg-white border border-gray-200 focus:border-[#1769E0] rounded-2xl outline-none focus:ring-4 transition-all text-[15px] font-medium placeholder:text-gray-400"
          />
        </div>
      </div>
    </div>
  );
}
