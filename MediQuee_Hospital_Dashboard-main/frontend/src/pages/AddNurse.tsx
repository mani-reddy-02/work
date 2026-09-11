import { Camera, ArrowLeft, Loader2, Check } from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/context/ToastContext"
import { ConfirmationSheet } from "@/components/ui/ConfirmationSheet"

const nurseSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal('')),
  qualification: z.string().min(2, "Qualification is required"),
  experience: z.string().min(1, "Experience is required"),
  licenseNumber: z.string().min(4, "License number is required"),
  department: z.string().min(2, "Department is required"),
  shiftType: z.string().min(2, "Shift type is required"),
  homeNursing: z.boolean().optional(),
});

type NurseFormValues = z.infer<typeof nurseSchema>;

export function AddNurse() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const { register, handleSubmit, trigger, getValues, watch, setValue, formState: { errors, isDirty } } = useForm<NurseFormValues>({
    resolver: zodResolver(nurseSchema),
    mode: "onChange",
    defaultValues: {
      homeNursing: false
    }
  });

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (step === 1) fieldsToValidate = ["fullName", "mobile", "email"];
    if (step === 2) fieldsToValidate = ["qualification", "experience", "licenseNumber", "department"];
    if (step === 3) fieldsToValidate = ["shiftType", "homeNursing"];

    const isStepValid = await trigger(fieldsToValidate as any);
    if (isStepValid) {
      setStep(s => s + 1);
    }
  }

  const prevStep = () => {
    setStep(s => s - 1);
  }

  const onSubmit = async (_data: NurseFormValues) => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    toast("Nurse added successfully", "success");
    navigate(-1);
  }

  const handleBack = () => {
    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      navigate(-1);
    }
  }

  const values = getValues();
  const homeNursing = watch("homeNursing");

  return (
    <div className="flex flex-col bg-background min-h-screen">
      
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-4 pb-3 px-4 flex items-center gap-4 border-b border-gray-100/50 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <button onClick={handleBack} className="p-2 -ml-2 text-[#172033] interactive-element rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[18px] font-bold text-[#172033]">Add Nurse</h1>
      </div>

      <div className="flex flex-col px-4 pt-6 pb-28 overflow-y-auto w-full max-w-md mx-auto">
        
        {/* Progress Bar */}
        <div className="w-full flex items-center justify-between mb-8 px-2 relative">
          <div className="absolute top-4 left-[10%] right-[10%] h-[2px] bg-gray-200/60 -z-10 rounded-full" />
          <div className="absolute top-4 left-[10%] right-[10%] h-[2px] bg-primary -z-10 transition-all duration-300 rounded-full" style={{ width: `${((step - 1) / 3) * 100}%` }} />

          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 bg-background">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold border-2 transition-colors duration-300 shadow-sm",
                step >= i ? "bg-primary text-white border-primary" : "bg-white text-[#98A2B3] border-gray-200/80"
              )}>
                {i}
              </div>
              <span className={cn(
                "text-[10px] font-semibold whitespace-nowrap transition-colors",
                step >= i ? "text-primary" : "text-[#98A2B3]"
              )}>
                {i === 1 && "Personal"}
                {i === 2 && "Professional"}
                {i === 3 && "Availability"}
                {i === 4 && "Review"}
              </span>
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center border border-dashed border-primary/40 text-primary cursor-pointer hover:bg-blue-100 transition-colors interactive-element shadow-sm">
              <Camera className="w-7 h-7" strokeWidth={1.5} />
            </div>
            <span className="text-[13px] font-semibold text-primary cursor-pointer interactive-element px-3 py-1 rounded-full hover:bg-blue-50">Upload Photo</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-5">
          <AnimatePresence mode="wait">
            
            {/* Step 1: Personal Info */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-[#172033]">Full Name <span className="text-destructive">*</span></label>
                  <input 
                    {...register("fullName")}
                    type="text" 
                    placeholder="e.g. Sarah Smith" 
                    className={cn(
                      "px-4 py-3 bg-white border rounded-xl outline-none transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm",
                      errors.fullName ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-gray-200/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
                    )} 
                  />
                  {errors.fullName && <span className="text-destructive text-[12px] font-medium mt-0.5">{errors.fullName.message}</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-[#172033]">Mobile Number <span className="text-destructive">*</span></label>
                  <input 
                    {...register("mobile")}
                    type="tel" 
                    placeholder="e.g. 9876543210" 
                    className={cn(
                      "px-4 py-3 bg-white border rounded-xl outline-none transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm",
                      errors.mobile ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-gray-200/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
                    )} 
                  />
                  {errors.mobile && <span className="text-destructive text-[12px] font-medium mt-0.5">{errors.mobile.message}</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-[#172033]">Email Address</label>
                  <input 
                    {...register("email")}
                    type="email" 
                    placeholder="e.g. sarah@hospital.com" 
                    className={cn(
                      "px-4 py-3 bg-white border rounded-xl outline-none transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm",
                      errors.email ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-gray-200/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
                    )} 
                  />
                  {errors.email && <span className="text-destructive text-[12px] font-medium mt-0.5">{errors.email.message}</span>}
                </div>
              </motion.div>
            )}

            {/* Step 2: Professional Info */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-[#172033]">Qualification <span className="text-destructive">*</span></label>
                  <input 
                    {...register("qualification")}
                    type="text" 
                    placeholder="e.g. B.Sc Nursing" 
                    className={cn(
                      "px-4 py-3 bg-white border rounded-xl outline-none transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm",
                      errors.qualification ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-gray-200/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
                    )} 
                  />
                  {errors.qualification && <span className="text-destructive text-[12px] font-medium mt-0.5">{errors.qualification.message}</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-[#172033]">Experience (Years) <span className="text-destructive">*</span></label>
                  <input 
                    {...register("experience")}
                    type="number" 
                    placeholder="e.g. 3" 
                    className={cn(
                      "px-4 py-3 bg-white border rounded-xl outline-none transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm",
                      errors.experience ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-gray-200/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
                    )} 
                  />
                  {errors.experience && <span className="text-destructive text-[12px] font-medium mt-0.5">{errors.experience.message}</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-[#172033]">License Number <span className="text-destructive">*</span></label>
                  <input 
                    {...register("licenseNumber")}
                    type="text" 
                    placeholder="e.g. RN9876" 
                    className={cn(
                      "px-4 py-3 bg-white border rounded-xl outline-none transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm",
                      errors.licenseNumber ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-gray-200/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
                    )} 
                  />
                  {errors.licenseNumber && <span className="text-destructive text-[12px] font-medium mt-0.5">{errors.licenseNumber.message}</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-[#172033]">Department <span className="text-destructive">*</span></label>
                  <input 
                    {...register("department")}
                    type="text" 
                    placeholder="e.g. ICU" 
                    className={cn(
                      "px-4 py-3 bg-white border rounded-xl outline-none transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm",
                      errors.department ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-gray-200/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
                    )} 
                  />
                  {errors.department && <span className="text-destructive text-[12px] font-medium mt-0.5">{errors.department.message}</span>}
                </div>
              </motion.div>
            )}

            {/* Step 3: Availability */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex flex-col gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-[#172033]">Shift Type <span className="text-destructive">*</span></label>
                  <select 
                    {...register("shiftType")}
                    className={cn(
                      "px-4 py-3 bg-white border rounded-xl outline-none transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm appearance-none",
                      errors.shiftType ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-gray-200/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
                    )} 
                  >
                    <option value="">Select Shift</option>
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                    <option value="Rotational">Rotational</option>
                  </select>
                  {errors.shiftType && <span className="text-destructive text-[12px] font-medium mt-0.5">{errors.shiftType.message}</span>}
                </div>

                <div 
                  className="bg-white border border-gray-200/60 rounded-xl p-4 flex items-center justify-between shadow-sm cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setValue("homeNursing", !homeNursing, { shouldDirty: true })}
                >
                  <div className="flex flex-col">
                    <span className="text-[15px] font-semibold text-[#172033]">Home Nursing Services</span>
                    <span className="text-[13px] text-[#667085]">Available for home visits</span>
                  </div>
                  <div className={cn(
                    "w-6 h-6 rounded-md border flex items-center justify-center transition-colors",
                    homeNursing ? "bg-primary border-primary" : "bg-gray-50 border-gray-300"
                  )}>
                    {homeNursing && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex flex-col gap-4">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
                  <h3 className="font-bold text-[#172033] border-b border-gray-50 pb-2 text-[15px]">Personal Info</h3>
                  <div className="grid grid-cols-[100px_1fr] gap-y-2 text-[14px]">
                    <span className="text-[#667085]">Name</span>
                    <span className="font-semibold text-[#172033]">{values.fullName}</span>
                    <span className="text-[#667085]">Mobile</span>
                    <span className="font-semibold text-[#172033]">{values.mobile}</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
                  <h3 className="font-bold text-[#172033] border-b border-gray-50 pb-2 text-[15px]">Professional Info</h3>
                  <div className="grid grid-cols-[100px_1fr] gap-y-2 text-[14px]">
                    <span className="text-[#667085]">Qual.</span>
                    <span className="font-semibold text-[#172033]">{values.qualification}</span>
                    <span className="text-[#667085]">Exp.</span>
                    <span className="font-semibold text-[#172033]">{values.experience} years</span>
                    <span className="text-[#667085]">Dept.</span>
                    <span className="font-semibold text-[#172033]">{values.department}</span>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
                  <h3 className="font-bold text-[#172033] border-b border-gray-50 pb-2 text-[15px]">Availability</h3>
                  <div className="grid grid-cols-[100px_1fr] gap-y-2 text-[14px]">
                    <span className="text-[#667085]">Shift</span>
                    <span className="font-semibold text-[#172033]">{values.shiftType}</span>
                    <span className="text-[#667085]">Home</span>
                    <span className="font-semibold text-[#172033]">
                      {homeNursing ? (
                        <span className="text-success">Enabled</span>
                      ) : (
                        <span className="text-[#98A2B3]">Disabled</span>
                      )}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-gray-100/50 pb-safe z-20">
            <div className="flex gap-3 max-w-md mx-auto">
              {step > 1 && (
                <button 
                  type="button" 
                  onClick={prevStep}
                  disabled={isSubmitting}
                  className="flex-1 bg-white hover:bg-gray-50 border border-gray-200/60 text-[#172033] font-semibold py-3.5 rounded-xl transition-colors interactive-element shadow-sm"
                >
                  Back
                </button>
              )}
              
              {step < 4 ? (
                <button 
                  type="button" 
                  onClick={nextStep}
                  className="flex-[2] bg-primary hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-colors interactive-element shadow-sm"
                >
                  Next
                </button>
              ) : (
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-[2] bg-success hover:bg-green-600 text-white font-semibold py-3.5 rounded-xl transition-colors interactive-element shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isSubmitting ? 'Submitting...' : 'Submit Nurse'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      <ConfirmationSheet 
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        title="Discard changes?"
        description="Your entered information will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        isDestructive={true}
        onConfirm={() => navigate(-1)}
      />
    </div>
  )
}
