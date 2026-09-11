import { useFormContext } from "react-hook-form";
import { CheckCircle2, User, Building2, MapPin, Stethoscope, Microscope, Shield, FileText } from "lucide-react";
import type { OnboardingFormValues } from "../../schema";

interface StepReviewProps {
  onEditStep: (stepName: string) => void;
}

export function StepReview({ onEditStep }: StepReviewProps) {
  const { getValues } = useFormContext<OnboardingFormValues>();
  const values = getValues();
  const isHospital = values.businessType?.businessType === "hospital";
  const entityType = isHospital ? "Hospital" : "Laboratory";
  
  const entityInfo = isHospital ? values.hospitalInfo : values.labInfo;
  const entityLocation = isHospital ? values.hospitalLocation : values.labLocation;
  const entityServices = isHospital ? values.hospitalServices?.services : values.labServices?.services;
  const entityAdmin = isHospital ? values.hospitalAdmin : values.labAdmin;

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex flex-col gap-1.5 mb-4 text-center">
        <div className="w-16 h-16 bg-[#16A34A]/10 text-[#16A34A] rounded-full flex items-center justify-center mx-auto mb-2">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-[22px] font-bold text-[#172033] tracking-tight">Review & Confirm</h2>
        <p className="text-[14px] text-[#667085]">Please review your {entityType.toLowerCase()} registration details before submitting.</p>
      </div>

      <div className="flex flex-col gap-4">
        
        {/* Account Summary */}
        <div className="bg-white border border-gray-200 rounded-[20px] overflow-hidden">
          <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-[#1769E0]" />
              <h3 className="font-bold text-[#172033]">Account Details</h3>
            </div>
            <button type="button" onClick={() => onEditStep("account")} className="text-[12px] font-bold text-[#1769E0] hover:underline">Edit</button>
          </div>
          <div className="p-4 flex flex-col gap-2 text-[14px]">
            <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-semibold text-right">{values.account?.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-semibold text-right">{values.account?.email}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-semibold text-right">{values.account?.phone}</span></div>
          </div>
        </div>

        {/* Business Summary */}
        <div className="bg-white border border-gray-200 rounded-[20px] overflow-hidden">
          <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#1769E0]" />
              <h3 className="font-bold text-[#172033]">{entityType} Details</h3>
            </div>
            <button type="button" onClick={() => onEditStep("info")} className="text-[12px] font-bold text-[#1769E0] hover:underline">Edit</button>
          </div>
          <div className="p-4 flex flex-col gap-2 text-[14px]">
            <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-semibold text-right">{(entityInfo as any)?.hospitalName || (entityInfo as any)?.labName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-semibold text-right">{(entityInfo as any)?.hospitalType || (entityInfo as any)?.labType}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Reg No.</span><span className="font-semibold text-right">{entityInfo?.registrationNumber}</span></div>
          </div>
        </div>

        {/* Location Summary */}
        <div className="bg-white border border-gray-200 rounded-[20px] overflow-hidden">
          <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#1769E0]" />
              <h3 className="font-bold text-[#172033]">Location</h3>
            </div>
            <button type="button" onClick={() => onEditStep("location")} className="text-[12px] font-bold text-[#1769E0] hover:underline">Edit</button>
          </div>
          <div className="p-4 flex flex-col gap-2 text-[14px]">
            <div className="flex justify-between"><span className="text-gray-500">Address</span><span className="font-semibold text-right line-clamp-2 w-1/2">{entityLocation?.address1}, {entityLocation?.city}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Contact</span><span className="font-semibold text-right">{entityLocation?.contactNumber}</span></div>
          </div>
        </div>

        {/* Services Summary */}
        <div className="bg-white border border-gray-200 rounded-[20px] overflow-hidden">
          <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              {isHospital ? <Stethoscope className="w-5 h-5 text-[#1769E0]" /> : <Microscope className="w-5 h-5 text-[#1769E0]" />}
              <h3 className="font-bold text-[#172033]">Services</h3>
            </div>
            <button type="button" onClick={() => onEditStep("services")} className="text-[12px] font-bold text-[#1769E0] hover:underline">Edit</button>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {entityServices?.map(s => (
                <span key={s} className="px-2.5 py-1 bg-gray-100 text-gray-700 text-[12px] font-semibold rounded-lg">{s.replace('_', ' ')}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Departments Summary (Hospital Only) */}
        {isHospital && (
          <div className="bg-white border border-gray-200 rounded-[20px] overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#1769E0]" />
                <h3 className="font-bold text-[#172033]">Departments</h3>
              </div>
              <button type="button" onClick={() => onEditStep("departments")} className="text-[12px] font-bold text-[#1769E0] hover:underline">Edit</button>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {values.hospitalDepartments?.departments?.map(d => (
                  <span key={d} className="px-2.5 py-1 bg-gray-100 text-gray-700 text-[12px] font-semibold rounded-lg">{d}</span>
                ))}
                {values.hospitalDepartments?.customDepartments?.map(cd => (
                  <span key={cd.name} className="px-2.5 py-1 bg-gray-100 text-gray-700 text-[12px] font-semibold rounded-lg">{cd.name}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Verification Summary */}
        <div className="bg-white border border-gray-200 rounded-[20px] overflow-hidden">
          <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#1769E0]" />
              <h3 className="font-bold text-[#172033]">Documents</h3>
            </div>
            <button type="button" onClick={() => onEditStep("verification")} className="text-[12px] font-bold text-[#1769E0] hover:underline">Edit</button>
          </div>
          <div className="p-4">
             <div className="flex items-center gap-2 text-[#16A34A] text-[13px] font-bold">
               <CheckCircle2 className="w-4 h-4" />
               Documents Uploaded
             </div>
          </div>
        </div>

        {/* Admin Summary */}
        <div className="bg-white border border-gray-200 rounded-[20px] overflow-hidden">
          <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#1769E0]" />
              <h3 className="font-bold text-[#172033]">Administrator</h3>
            </div>
            <button type="button" onClick={() => onEditStep("admin")} className="text-[12px] font-bold text-[#1769E0] hover:underline">Edit</button>
          </div>
          <div className="p-4 flex flex-col gap-2 text-[14px]">
            <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-semibold text-right">{entityAdmin?.adminName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Role</span><span className="font-semibold text-right">{entityAdmin?.adminRole}</span></div>
          </div>
        </div>

      </div>
    </div>
  );
}
