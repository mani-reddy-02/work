import { Camera, ArrowLeft, Loader2, Clock, Search, ChevronDown } from "lucide-react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/context/ToastContext"
import { ConfirmationSheet } from "@/components/ui/ConfirmationSheet"
import { SuccessModal } from "@/components/ui/SuccessModal"
import { adminApi } from "@/services/adminApi"

const doctorSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  departmentId: z.string().uuid("Please select a valid department"),
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
  const [showSuccess, setShowSuccess] = useState(false);

  const { register, handleSubmit, trigger, getValues, setValue, watch, formState: { errors, isDirty } } = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorSchema),
    mode: "onChange",
  });
  
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Filter departments based on search query
  const filteredDepartments = departments.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (d.code && d.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    adminApi.getDepartments()
      .then(setDepartments)
      .catch(console.error)
      .finally(() => setIsLoadingDepartments(false));
  }, []);

  useEffect(() => {
    if (startTime && endTime) {
      setValue("shiftTiming", `${startTime} - ${endTime}`, { shouldValidate: true });
    }
  }, [startTime, endTime, setValue]);

  const selectedDept = watch("departmentId");
  const availableDays = watch("availableDays") || "";
  const daysList = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (step === 1) fieldsToValidate = ["fullName", "mobile", "email", "password"];
    if (step === 2) fieldsToValidate = ["departmentId", "experience", "licenseNumber", "consultationFee"];
    if (step === 3) fieldsToValidate = ["availableDays", "shiftTiming"];

    const isStepValid = await trigger(fieldsToValidate as any);
    if (isStepValid) {
      setStep(s => s + 1);
    }
  }

  const prevStep = () => {
    setStep(s => s - 1);
  }

  const onSubmit = async (data: DoctorFormValues) => {
    if (step !== 4) return;
    setIsSubmitting(true);
    try {
      await adminApi.createStaff({
        name: data.fullName,
        email: data.email,
        password: data.password,
        phone: data.mobile,
        avatar: photoPreview || undefined,
        role: 'DOCTOR',
        departmentId: data.departmentId
      });
      setShowSuccess(true);
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to add doctor', "error");
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-4 pb-3 px-4 flex items-center gap-4 border-b border-border/50 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
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
                step >= i ? "bg-primary text-white border-primary" : "bg-surface text-[#98A2B3] border-border/80"
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
          <div className="flex flex-col items-center gap-3 mb-8 relative">
            <input type="file" accept="image/*" id="photo-upload" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setPhotoPreview(reader.result as string);
                reader.readAsDataURL(file);
              }
            }} />
            <label htmlFor="photo-upload" className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center border border-dashed border-primary/40 text-primary cursor-pointer hover:bg-blue-100 transition-colors interactive-element shadow-sm overflow-hidden relative group">
              {photoPreview ? (
                <>
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </>
              ) : (
                <Camera className="w-7 h-7" strokeWidth={1.5} />
              )}
            </label>
            <label htmlFor="photo-upload" className="text-[13px] font-semibold text-primary cursor-pointer interactive-element px-3 py-1 rounded-full hover:bg-blue-50">
              {photoPreview ? 'Change Photo' : 'Upload Photo (Optional)'}
            </label>
          </div>
        )}

        <form 
          onSubmit={handleSubmit(onSubmit)} 
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (step < 4) nextStep();
            }
          }}
          className="w-full flex flex-col gap-5"
        >
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
                      "px-4 py-3 bg-surface border rounded-xl outline-none transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm",
                      errors.fullName ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
                    )}
                  />
                  {errors.fullName && <span className="text-destructive text-[12px] font-medium mt-0.5">{errors.fullName.message}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-[#172033]">Mobile Number <span className="text-destructive">*</span></label>
                  <input 
                    {...register("mobile")}
                    type="tel" 
                    placeholder="e.g. 8331045500" 
                    className={cn(
                      "px-4 py-3 bg-surface border rounded-xl outline-none transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm",
                      errors.mobile ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
                    )}
                  />
                  {errors.mobile && <span className="text-destructive text-[12px] font-medium mt-0.5">{errors.mobile.message}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-[#172033]">Email Address <span className="text-destructive">*</span></label>
                  <input 
                    {...register("email")}
                    type="email" 
                    placeholder="e.g. doctor@hospital.com" 
                    className={cn(
                      "px-4 py-3 bg-surface border rounded-xl outline-none transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm",
                      errors.email ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
                    )}
                  />
                  {errors.email && <span className="text-destructive text-[12px] font-medium mt-0.5">{errors.email.message}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-[#172033]">Password <span className="text-destructive">*</span></label>
                  <input 
                    {...register("password")}
                    type="password" 
                    placeholder="Create a password" 
                    className={cn(
                      "px-4 py-3 bg-surface border rounded-xl outline-none transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm",
                      errors.password ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
                    )}
                  />
                  {errors.password && <span className="text-destructive text-[12px] font-medium mt-0.5">{errors.password.message}</span>}
                </div>
              </motion.div>
            )}

            {/* Step 2: Professional Info */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-[13px] font-semibold text-[#172033]">Assign to Department <span className="text-destructive">*</span></label>
                  
                  {/* Custom Searchable Dropdown Trigger */}
                  <div 
                    className={cn(
                      "w-full px-4 py-3 bg-surface border rounded-xl flex items-center justify-between cursor-pointer transition-all shadow-sm",
                      errors.departmentId ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-border/60 hover:border-gray-300',
                      (isLoadingDepartments || departments.length === 0) && "opacity-70 bg-gray-50 cursor-not-allowed"
                    )}
                    onClick={() => {
                      if (!isLoadingDepartments && departments.length > 0) setIsDropdownOpen(!isDropdownOpen);
                    }}
                  >
                    <span className={cn("text-[15px] truncate", !isDirty && !departments.find(d => d.id === register("departmentId").name) ? "text-[#98A2B3]" : "text-[#172033]")}>
                      {isLoadingDepartments ? "Loading departments..." : 
                       departments.length === 0 ? "Please add a department first" :
                       (departments.find(d => d.id === document.getElementsByName("departmentId")[0]?.getAttribute("value"))?.name || 
                        departments.find(d => d.id === (register("departmentId") as any).value)?.name || // For initial render before selection
                        "Search and select department...")}
                    </span>
                    {isLoadingDepartments ? <Loader2 className="w-5 h-5 animate-spin text-[#98A2B3]" /> : <ChevronDown className="w-5 h-5 text-[#98A2B3]" />}
                  </div>
                  
                  {/* Hidden actual input for react-hook-form */}
                  <input type="hidden" {...register("departmentId")} />

                  {/* Dropdown Menu */}
                  {isDropdownOpen && !isLoadingDepartments && departments.length > 0 && (
                    <div className="absolute top-[100%] left-0 right-0 mt-2 bg-surface border border-border/60 rounded-xl shadow-lg z-50 overflow-hidden flex flex-col">
                      <div className="flex items-center px-3 py-2.5 border-b border-border bg-gray-50/50">
                        <Search className="w-4 h-4 text-muted/70 mr-2" />
                        <input 
                          type="text"
                          placeholder="Search departments..."
                          className="flex-1 bg-transparent outline-none text-[14px] text-[#172033] placeholder:text-muted/70"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="max-h-[250px] overflow-y-auto py-1">
                        {filteredDepartments.length === 0 ? (
                          <div className="px-4 py-8 text-center text-[14px] text-muted">
                            No departments found matching "{searchQuery}"
                          </div>
                        ) : (
                          filteredDepartments.map((dept) => (
                            <div 
                              key={dept.id}
                              className="px-4 py-2.5 hover:bg-blue-50/50 cursor-pointer flex items-center justify-between group transition-colors"
                              onClick={() => {
                                const event = { target: { name: 'departmentId', value: dept.id } };
                                register("departmentId").onChange(event);
                                document.getElementsByName("departmentId")[0]?.setAttribute("value", dept.id); // Update DOM value for display logic
                                setIsDropdownOpen(false);
                                setSearchQuery("");
                              }}
                            >
                              <div className="flex flex-col">
                                <span className="text-[14px] font-medium text-[#172033] group-hover:text-primary transition-colors">{dept.name}</span>
                                {dept.code && <span className="text-[12px] text-muted">{dept.code}</span>}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {errors.departmentId && <span className="text-destructive text-[12px] font-medium mt-0.5">{errors.departmentId.message}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-[#172033]">Experience (Years) <span className="text-destructive">*</span></label>
                  <input 
                    {...register("experience")}
                    type="number" 
                    placeholder="e.g. 5" 
                    className={cn(
                      "px-4 py-3 bg-surface border rounded-xl outline-none transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm",
                      errors.experience ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
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
                      "px-4 py-3 bg-surface border rounded-xl outline-none transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm",
                      errors.licenseNumber ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
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
                      "px-4 py-3 bg-surface border rounded-xl outline-none transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm",
                      errors.consultationFee ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
                    )}
                  />
                  {errors.consultationFee && <span className="text-destructive text-[12px] font-medium mt-0.5">{errors.consultationFee.message}</span>}
                </div>
              </motion.div>
            )}

            {/* Step 3: Availability */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-semibold text-[#172033]">Available Days <span className="text-destructive">*</span></label>
                  <div className="flex flex-wrap gap-2">
                    {daysList.map(day => {
                      const isSelected = availableDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const current = availableDays ? availableDays.split(',') : [];
                            const updated = isSelected ? current.filter(d => d !== day) : [...current, day];
                            setValue("availableDays", updated.join(','), { shouldValidate: true });
                          }}
                          className={cn(
                            "px-4 py-2 rounded-xl text-[14px] font-semibold border transition-all shadow-sm",
                            isSelected ? "bg-primary text-white border-primary" : "bg-surface text-[#667085] border-border hover:border-primary/50"
                          )}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                  {/* Hidden input for react-hook-form validation */}
                  <input type="hidden" {...register("availableDays")} />
                  {errors.availableDays && <span className="text-destructive text-[12px] font-medium mt-0.5">{errors.availableDays.message}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold text-[#172033]">Shift Timing <span className="text-destructive">*</span></label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <input 
                        type="time" 
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className={cn(
                          "w-full px-4 py-3 bg-surface border rounded-xl outline-none transition-all text-[15px] shadow-sm",
                          errors.shiftTiming ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
                        )}
                      />
                    </div>
                    <span className="text-[#667085] font-medium">to</span>
                    <div className="relative flex-1">
                      <input 
                        type="time" 
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className={cn(
                          "w-full px-4 py-3 bg-surface border rounded-xl outline-none transition-all text-[15px] shadow-sm",
                          errors.shiftTiming ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
                        )}
                      />
                    </div>
                  </div>
                  <input type="hidden" {...register("shiftTiming")} />
                  {errors.shiftTiming && <span className="text-destructive text-[12px] font-medium mt-0.5">{errors.shiftTiming.message}</span>}
                </div>
              </motion.div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex flex-col gap-4">
                <div className="bg-surface p-4 rounded-2xl border border-border shadow-sm flex flex-col gap-3">
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

                <div className="bg-surface p-4 rounded-2xl border border-border shadow-sm flex flex-col gap-3">
                  <h3 className="font-bold text-[#172033] border-b border-gray-50 pb-2 text-[15px]">Professional Info</h3>
                  <div className="grid grid-cols-[100px_1fr] gap-y-2 text-[14px]">
                    <span className="text-[#667085]">Department</span>
                    <span className="font-semibold text-[#172033]">{departments.find(d => d.id === values.departmentId)?.name || values.departmentId}</span>
                    <span className="text-[#667085]">Experience</span>
                    <span className="font-semibold text-[#172033]">{values.experience} years</span>
                    <span className="text-[#667085]">License</span>
                    <span className="font-semibold text-[#172033]">{values.licenseNumber}</span>
                    <span className="text-[#667085]">Fee</span>
                    <span className="font-semibold text-[#172033]">₹{values.consultationFee}</span>
                  </div>
                </div>

                <div className="bg-surface p-4 rounded-2xl border border-border shadow-sm flex flex-col gap-3">
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

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border/50 pb-safe z-20">
            <div className="flex gap-3 max-w-md mx-auto">
              {step > 1 && (
                <button 
                  type="button" 
                  onClick={prevStep}
                  disabled={isSubmitting}
                  className="flex-1 bg-surface hover:bg-gray-50 border border-border/60 text-[#172033] font-semibold py-3.5 rounded-xl transition-colors interactive-element shadow-sm"
                >
                  Back
                </button>
              )}
              
              {step < 4 ? (
                <button 
                  type="button" 
                  onClick={nextStep}
                  disabled={step === 2 && departments.length === 0}
                  className="flex-[2] bg-primary hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-colors interactive-element shadow-sm disabled:opacity-70 disabled:hover:bg-primary"
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

      <SuccessModal
        isOpen={showSuccess}
        title="Doctor Added"
        description={`${values.fullName} has been successfully added to your hospital staff.`}
        onClose={() => {
          setShowSuccess(false);
          navigate(-1);
        }}
      />
    </div>
  )
}
