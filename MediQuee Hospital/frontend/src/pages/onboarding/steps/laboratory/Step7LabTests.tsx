import { useFormContext, useFieldArray } from "react-hook-form";
import { CheckCircle2, Plus, X } from "lucide-react";
import { useState } from "react";
import type { OnboardingFormValues } from "../../schema";

const SUGGESTED_TESTS = [
  "Complete Blood Count (CBC)", "Lipid Profile", "Liver Function Test (LFT)", "Kidney Function Test (KFT)",
  "Thyroid Profile", "Blood Sugar (Fasting & PP)", "HbA1c", "Urine Routine",
  "Vitamin D", "Vitamin B12", "Iron Profile", "Calcium"
];

export function Step7LabTests() {
  const { watch, setValue, control, formState: { errors } } = useFormContext<OnboardingFormValues>();
  const selectedTests = watch("labTests.tests") || [];
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "labTests.customTests"
  });

  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customTest, setCustomTest] = useState({ name: "", code: "", description: "" });

  const toggleTest = (test: string) => {
    if (selectedTests.includes(test)) {
      setValue("labTests.tests", selectedTests.filter(t => t !== test), { shouldValidate: true });
    } else {
      setValue("labTests.tests", [...selectedTests, test], { shouldValidate: true });
    }
  };

  const addCustomTest = () => {
    if (customTest.name.trim().length > 1) {
      append(customTest);
      setCustomTest({ name: "", code: "", description: "" });
      setShowCustomForm(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex flex-col gap-1.5 mb-2">
        <h2 className="text-[22px] font-bold text-[#172033] tracking-tight">Which tests does your laboratory offer?</h2>
        <p className="text-[14px] text-[#667085]">Select from the suggested list or add your own.</p>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {SUGGESTED_TESTS.map((test) => {
          const isSelected = selectedTests.includes(test);
          return (
            <button
              key={test}
              type="button"
              onClick={() => toggleTest(test)}
              className={`px-4 py-2 rounded-full border-2 text-[13px] font-bold transition-all flex items-center gap-2 ${
                isSelected 
                  ? 'border-[#1769E0] bg-[#1769E0]/5 text-[#1769E0]' 
                  : 'border-border bg-surface text-[#667085] hover:border-gray-300'
              }`}
            >
              {isSelected && <CheckCircle2 className="w-4 h-4" />}
              {test}
            </button>
          );
        })}
      </div>

      {fields.length > 0 && (
        <div className="flex flex-col gap-3 mt-2">
          <h3 className="text-[14px] font-bold text-[#172033]">Custom Tests</h3>
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center justify-between p-3 bg-gray-50 border border-border rounded-xl">
              <div className="flex flex-col">
                <span className="text-[14px] font-bold text-[#172033]">{field.name}</span>
                {field.code && <span className="text-[12px] font-medium text-muted">Code: {field.code}</span>}
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
          Add Custom Test
        </button>
      ) : (
        <div className="flex flex-col gap-4 p-4 border border-border rounded-2xl bg-gray-50 mt-2">
          <h4 className="text-[14px] font-bold text-[#172033]">New Custom Test</h4>
          <input 
            type="text" 
            placeholder="Test Name" 
            value={customTest.name}
            onChange={(e) => setCustomTest({ ...customTest, name: e.target.value })}
            className="w-full px-4 py-3 bg-surface border border-border focus:border-[#1769E0] rounded-xl outline-none focus:ring-2 focus:ring-[#1769E0]/10 transition-all text-[14px] font-medium placeholder:text-muted/70"
          />
          <input 
            type="text" 
            placeholder="Test Code (Optional)" 
            value={customTest.code}
            onChange={(e) => setCustomTest({ ...customTest, code: e.target.value })}
            className="w-full px-4 py-3 bg-surface border border-border focus:border-[#1769E0] rounded-xl outline-none focus:ring-2 focus:ring-[#1769E0]/10 transition-all text-[14px] font-medium placeholder:text-muted/70"
          />
          <textarea 
            placeholder="Description (Optional)" 
            value={customTest.description}
            onChange={(e) => setCustomTest({ ...customTest, description: e.target.value })}
            className="w-full px-4 py-3 bg-surface border border-border focus:border-[#1769E0] rounded-xl outline-none focus:ring-2 focus:ring-[#1769E0]/10 transition-all text-[14px] font-medium placeholder:text-muted/70 resize-none h-20"
          />
          <div className="flex gap-2 justify-end">
            <button 
              type="button" 
              onClick={() => setShowCustomForm(false)}
              className="px-4 py-2 font-bold text-muted hover:bg-gray-200 rounded-lg transition-colors text-[13px]"
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={addCustomTest}
              disabled={customTest.name.trim().length < 2}
              className="px-4 py-2 font-bold text-white bg-[#1769E0] disabled:bg-gray-300 rounded-lg transition-colors text-[13px]"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {errors.labTests?.tests && (
        <span className="text-red-500 text-[13px] font-medium mt-2">{errors.labTests.tests.message}</span>
      )}
    </div>
  );
}
