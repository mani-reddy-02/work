import { Camera, ArrowLeft, Loader2 } from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/context/ToastContext"
import { ConfirmationSheet } from "@/components/ui/ConfirmationSheet"
import { ConditionSelector } from "@/components/shared/ConditionSelector"

const doctorSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal('')),
  specialization: z.string().min(2, "Specialization is required"),
  experience: z.string().min(1, "Experience is required"),
  licenseNumber: z.string().min(4, "License number is required"),
  consultationFee: z.string().min(1, "Consultation fee is required"),
  availableDays: z.string().min(2, "Available days are required"),
  shiftTiming: z.string().min(2, "Shift timing is required"),
});

type DoctorFormValues = z.infer<typeof doctorSchema>;



export function AddDoctor() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const { register, handleSubmit, trigger, getValues, setValue, watch, formState: { errors, isDirty } } = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorSchema),
    mode: "onChange",
  });
  
  const selectedSpec = watch("specialization");

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (step === 1) fieldsToValidate = ["fullName", "mobile", "email"];
    if (step === 2) fieldsToValidate = ["specialization", "experience", "licenseNumber", "consultationFee"];
    if (step === 3) fieldsToValidate = ["availableDays", "shiftTiming"];

    const isStepValid = await trigger(fieldsToValidate as any);
    if (isStepValid) {
      setStep(s => s + 1);
    }
  }

  const prevStep = () => {
    setStep(s => s - 1);
  }

  const onSubmit = async (_data: DoctorFormValues) => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    toast("Doctor added successfully", "success");
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

  return (
    <div className="flex flex-col bg-background min-h-screen">
      
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-4 pb-3 px-4 flex items-center gap-4 border-b border-gray-100/50 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <button onClick={handleBack} className="p-2 -ml-2 text-[#172033] interactive-element rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[18px] font-bold text-[#172033]">Add Doctor</h1>
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
                    placeholder="e.g. Dr. John Doe" 
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
                    placeholder="e.g. doctor@hospital.com" 
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
                <div className="flex flex-col gap-3">
                  <label className="text-[13px] font-semibold text-[#172033]">Specialization <span className="text-destructive">*</span></label>
                  <ConditionSelector 
                    type="specialization" 
                    value={selectedSpec} 
                    onChange={(val) => setValue("specialization", val, { shouldValidate: true })} 
                    error={!!errors.specialization}
                  />
                  {/* Hidden input to keep form integration intact */}
                  <input type="hidden" {...register("specialization")} />
                  {errors.specialization && <span className="text-destructive text-[12px] font-medium mt-0.5">{errors.specialization.message}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-[#172033]">Experience (Years) <span className="text-destructive">*</span></label>
                  <input 
                    {...register("experience")}
                    type="number" 
                    placeholder="e.g. 5" 
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
                    placeholder="e.g. MD12345" 
                    className={cn(
                      "px-4 py-3 bg-white border rounded-xl outline-none transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm",
                      errors.licenseNumber ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-gray-200/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
                    )}
                  />
                  {errors.licenseNumber && <span className="text-destructive text-[12px] font-medium mt-0.5">{errors.licenseNumber.message}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-[#172033]">Consultation Fee (₹) <span className="text-destructive">*</span></label>
                  <input 
                    {...register("consultationFee")}
                    type="number" 
                    placeholder="e.g. 500" 
                    className={cn(
                      "px-4 py-3 bg-white border rounded-xl outline-none transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm",
                      errors.consultationFee ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-gray-200/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
                    )}
                  />
                  {errors.consultationFee && <span className="text-destructive text-[12px] font-medium mt-0.5">{errors.consultationFee.message}</span>}
                </div>
              </motion.div>
            )}

            {/* Step 3: Availability */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-[#172033]">Available Days <span className="text-destructive">*</span></label>
                  <input 
                    {...register("availableDays")}
                    type="text" 
                    placeholder="e.g. Mon, Wed, Fri" 
                    className={cn(
                      "px-4 py-3 bg-white border rounded-xl outline-none transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm",
                      errors.availableDays ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-gray-200/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
                    )}
                  />
                  {errors.availableDays && <span className="text-destructive text-[12px] font-medium mt-0.5">{errors.availableDays.message}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-[#172033]">Shift Timing <span className="text-destructive">*</span></label>
                  <input 
                    {...register("shiftTiming")}
                    type="text" 
                    placeholder="e.g. 09:00 AM - 05:00 PM" 
                    className={cn(
                      "px-4 py-3 bg-white border rounded-xl outline-none transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm",
                      errors.shiftTiming ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-gray-200/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
                    )}
                  />
                  {errors.shiftTiming && <span className="text-destructive text-[12px] font-medium mt-0.5">{errors.shiftTiming.message}</span>}
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
                    <span className="text-[#667085]">Email</span>
                    <span className="font-semibold text-[#172033] truncate">{values.email || 'N/A'}</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
                  <h3 className="font-bold text-[#172033] border-b border-gray-50 pb-2 text-[15px]">Professional Info</h3>
                  <div className="grid grid-cols-[100px_1fr] gap-y-2 text-[14px]">
                    <span className="text-[#667085]">Specialization</span>
                    <span className="font-semibold text-[#172033]">{values.specialization}</span>
                    <span className="text-[#667085]">Experience</span>
                    <span className="font-semibold text-[#172033]">{values.experience} years</span>
                    <span className="text-[#667085]">License</span>
                    <span className="font-semibold text-[#172033]">{values.licenseNumber}</span>
                    <span className="text-[#667085]">Fee</span>
                    <span className="font-semibold text-[#172033]">₹{values.consultationFee}</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
                  <h3 className="font-bold text-[#172033] border-b border-gray-50 pb-2 text-[15px]">Availability</h3>
                  <div className="grid grid-cols-[100px_1fr] gap-y-2 text-[14px]">
                    <span className="text-[#667085]">Days</span>
                    <span className="font-semibold text-[#172033]">{values.availableDays}</span>
                    <span className="text-[#667085]">Timing</span>
                    <span className="font-semibold text-[#172033]">{values.shiftTiming}</span>
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
                  className="flex-[2] bg-success hover:bg-green-600 text-white font-semibold py-3.5 rounded-xl transition-colors interactive-element shadow-sm flex justify-center items-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isSubmitting ? 'Submitting...' : 'Submit Doctor'}
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
