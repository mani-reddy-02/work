import { FlaskConical, Plus, ArrowLeft, Loader2, X } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/context/ToastContext"
import { ConfirmationSheet } from "@/components/ui/ConfirmationSheet"
import { adminApi } from "@/services/adminApi"
import { cn } from "@/lib/utils"

const labSchema = z.object({
  platformDepartmentId: z.string().min(1, "Please select a laboratory department"),
  email: z.string().email("Valid email address required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().min(10, "Contact Number must be at least 10 digits"),
});

type LabFormValues = z.infer<typeof labSchema>;

export function AddLab() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [platformDepartments, setPlatformDepartments] = useState<any[]>([]);

  useState(() => {
    adminApi.getPlatformLabDepartments().then(setPlatformDepartments).catch(console.error);
  });

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<LabFormValues>({
    resolver: zodResolver(labSchema),
  });

  const onSubmit = async (data: LabFormValues) => {
    setIsSubmitting(true);
    try {
      const selectedDept = platformDepartments.find(d => d.id === data.platformDepartmentId);
      
      await adminApi.createStaff({
        name: `${selectedDept?.name || 'Laboratory'} Admin`,
        email: data.email,
        password: data.password,
        phone: data.phone,
        role: 'LAB_ADMIN',
      });

      navigate(-1);
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to add laboratory', "error");
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

  return (
    <div className="flex flex-col bg-background min-h-screen">
      
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-4 pb-3 px-4 flex items-center gap-4 border-b border-border/50 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <button onClick={handleBack} className="p-2 -ml-2 text-[#172033] interactive-element rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[18px] font-bold text-[#172033]">Add Laboratory</h1>
      </div>

      <div className="flex flex-col px-4 pt-6 pb-24 overflow-y-auto w-full max-w-md mx-auto">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 border border-blue-100 shadow-sm mx-auto">
          <FlaskConical className="w-8 h-8 text-primary" strokeWidth={1.5} />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#172033]">Laboratory Department <span className="text-destructive">*</span></label>
            <select
              {...register("platformDepartmentId")}
              className={cn(
                "px-4 py-3 bg-surface border rounded-xl outline-none transition-all text-[15px] shadow-sm appearance-none",
                errors.platformDepartmentId ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
              )}
            >
              <option value="">Select Platform Laboratory</option>
              {platformDepartments.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
            {errors.platformDepartmentId && <span className="text-destructive text-[12px] font-medium mt-0.5">{errors.platformDepartmentId.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#172033]">Email Address <span className="text-destructive">*</span></label>
            <input 
              {...register("email")}
              type="email" 
              placeholder="e.g. lab@hospital.com" 
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
              type="text" 
              placeholder="Create a password" 
              className={cn(
                "px-4 py-3 bg-surface border rounded-xl outline-none transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm",
                errors.password ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
              )}
            />
            {errors.password && <span className="text-destructive text-[12px] font-medium mt-0.5">{errors.password.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#172033]">Contact Number <span className="text-destructive">*</span></label>
            <input 
              {...register("phone")}
              type="tel" 
              placeholder="e.g. 8331045500" 
              className={cn(
                "px-4 py-3 bg-surface border rounded-xl outline-none transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm",
                errors.phone ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
              )}
            />
            {errors.phone && <span className="text-destructive text-[12px] font-medium mt-0.5">{errors.phone.message}</span>}
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border/50 pb-safe z-20">
            <div className="flex gap-3 max-w-md mx-auto">
              <button 
                type="button" 
                onClick={handleBack}
                className="flex-1 bg-surface hover:bg-gray-50 border border-border/60 text-[#172033] font-semibold py-3.5 rounded-xl transition-colors interactive-element shadow-sm"
              >
                Back
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-[2] bg-primary hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3.5 rounded-xl transition-colors interactive-element flex items-center justify-center gap-2 shadow-sm disabled:opacity-70"
              >
                {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                {isSubmitting ? 'Creating...' : 'Create Laboratory'}
              </button>
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
