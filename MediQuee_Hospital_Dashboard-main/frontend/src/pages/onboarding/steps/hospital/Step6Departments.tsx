import { useFormContext, useFieldArray } from "react-hook-form";
import { CheckCircle2, Plus, X } from "lucide-react";
import { useState } from "react";
import type { OnboardingFormValues } from "../../schema";

const SUGGESTED_DEPARTMENTS = [
  "General Medicine", "Cardiology", "Orthopedics", "Pediatrics",
  "Dermatology", "Gynecology", "Neurology", "ENT",
  "Ophthalmology", "Dentistry", "Psychiatry", "Radiology",
  "General Surgery", "Emergency"
];

export function Step6Departments() {
  const { watch, setValue, control, formState: { errors } } = useFormContext<OnboardingFormValues>();
  const selectedDepartments = watch("hospitalDepartments.departments") || [];
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "hospitalDepartments.customDepartments"
  });

  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customDept, setCustomDept] = useState({ name: "", code: "", description: "" });

  const toggleDept = (dept: string) => {
    if (selectedDepartments.includes(dept)) {
      setValue("hospitalDepartments.departments", selectedDepartments.filter(d => d !== dept), { shouldValidate: true });
    } else {
      setValue("hospitalDepartments.departments", [...selectedDepartments, dept], { shouldValidate: true });
    }
  };

  const addCustomDept = () => {
    if (customDept.name.trim().length > 1) {
      append(customDept);
      setCustomDept({ name: "", code: "", description: "" });
      setShowCustomForm(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex flex-col gap-1.5 mb-2">
        <h2 className="text-[22px] font-bold text-[#172033] tracking-tight">Which departments does your hospital have?</h2>
        <p className="text-[14px] text-[#667085]">Select from the suggested list or add your own.</p>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {SUGGESTED_DEPARTMENTS.map((dept) => {
          const isSelected = selectedDepartments.includes(dept);
          return (
            <button
              key={dept}
              type="button"
              onClick={() => toggleDept(dept)}
              className={`px-4 py-2 rounded-full border-2 text-[13px] font-bold transition-all flex items-center gap-2 ${
                isSelected 
                  ? 'border-[#1769E0] bg-[#1769E0]/5 text-[#1769E0]' 
                  : 'border-gray-200 bg-white text-[#667085] hover:border-gray-300'
              }`}
            >
              {isSelected && <CheckCircle2 className="w-4 h-4" />}
              {dept}
            </button>
          );
        })}
      </div>

      {fields.length > 0 && (
        <div className="flex flex-col gap-3 mt-2">
          <h3 className="text-[14px] font-bold text-[#172033]">Custom Departments</h3>
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="flex flex-col">
                <span className="text-[14px] font-bold text-[#172033]">{field.name}</span>
                {field.code && <span className="text-[12px] font-medium text-gray-500">Code: {field.code}</span>}
              </div>
              <button 
                type="button" 
                onClick={() => remove(index)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {!showCustomForm ? (
        <button
          type="button"
          onClick={() => setShowCustomForm(true)}
          className="flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-gray-300 rounded-2xl text-[#1769E0] font-bold text-[14px] hover:bg-blue-50/50 hover:border-[#1769E0]/50 transition-colors mt-2"
        >
          <Plus className="w-5 h-5" />
          Add Custom Department
        </button>
      ) : (
        <div className="flex flex-col gap-4 p-4 border border-gray-200 rounded-2xl bg-gray-50 mt-2">
          <h4 className="text-[14px] font-bold text-[#172033]">New Custom Department</h4>
          <input 
            type="text" 
            placeholder="Department Name" 
            value={customDept.name}
            onChange={(e) => setCustomDept({ ...customDept, name: e.target.value })}
            className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-[#1769E0] rounded-xl outline-none focus:ring-2 focus:ring-[#1769E0]/10 transition-all text-[14px] font-medium placeholder:text-gray-400"
          />
          <input 
            type="text" 
            placeholder="Department Code (Optional)" 
            value={customDept.code}
            onChange={(e) => setCustomDept({ ...customDept, code: e.target.value })}
            className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-[#1769E0] rounded-xl outline-none focus:ring-2 focus:ring-[#1769E0]/10 transition-all text-[14px] font-medium placeholder:text-gray-400"
          />
          <textarea 
            placeholder="Description (Optional)" 
            value={customDept.description}
            onChange={(e) => setCustomDept({ ...customDept, description: e.target.value })}
            className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-[#1769E0] rounded-xl outline-none focus:ring-2 focus:ring-[#1769E0]/10 transition-all text-[14px] font-medium placeholder:text-gray-400 resize-none h-20"
          />
          <div className="flex gap-2 justify-end">
            <button 
              type="button" 
              onClick={() => setShowCustomForm(false)}
              className="px-4 py-2 font-bold text-gray-500 hover:bg-gray-200 rounded-lg transition-colors text-[13px]"
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={addCustomDept}
              disabled={customDept.name.trim().length < 2}
              className="px-4 py-2 font-bold text-white bg-[#1769E0] disabled:bg-gray-300 rounded-lg transition-colors text-[13px]"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {errors.hospitalDepartments?.departments && (
        <span className="text-red-500 text-[13px] font-medium mt-2">{errors.hospitalDepartments.departments.message}</span>
      )}
    </div>
  );
}
