import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Building2, ChevronDown, Loader2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/context/ToastContext"
import { ConfirmationSheet } from "@/components/ui/ConfirmationSheet"
import { cn } from "@/lib/utils"

const departmentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(2, "Code must be at least 2 characters"),
  description: z.string().optional(),
  status: z.enum(["active", "inactive"]),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

export function AddDepartment() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      status: "active"
    }
  });

  const onSubmit = async (_data: DepartmentFormValues) => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    toast("Department created successfully", "success");
    navigate(-1);
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
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-4 pb-3 px-4 flex items-center gap-4 border-b border-gray-100/50 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <button onClick={handleBack} className="p-2 -ml-2 text-[#172033] interactive-element rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[18px] font-bold text-[#172033]">Add Department</h1>
      </div>

      <div className="flex flex-col px-4 pt-6 pb-24 overflow-y-auto w-full max-w-md mx-auto">
        
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 border border-blue-100 shadow-sm mx-auto">
          <Building2 className="w-8 h-8 text-primary" strokeWidth={1.5} />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#172033]">Department Name <span className="text-destructive">*</span></label>
            <input 
              {...register("name")}
              type="text" 
              placeholder="e.g. Cardiology" 
              className={cn(
                "px-4 py-3 bg-white border rounded-xl outline-none transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm",
                errors.name ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-gray-200/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
              )}
            />
            {errors.name && <span className="text-destructive text-[12px] font-medium mt-0.5">{errors.name.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#172033]">Department Code <span className="text-destructive">*</span></label>
            <input 
              {...register("code")}
              type="text" 
              placeholder="e.g. CARD" 
              className={cn(
                "px-4 py-3 bg-white border rounded-xl outline-none transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm uppercase",
                errors.code ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-gray-200/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
              )}
            />
            {errors.code && <span className="text-destructive text-[12px] font-medium mt-0.5">{errors.code.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#172033]">Description</label>
            <textarea 
              {...register("description")}
              placeholder="Enter department description" 
              rows={4}
              className="px-4 py-3 bg-white border border-gray-200/60 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#172033]">Status</label>
            <div className="relative">
              <select {...register("status")} className="w-full px-4 py-3 bg-white border border-gray-200/60 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-[15px] appearance-none shadow-sm text-[#172033] font-medium">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#98A2B3]">
                <ChevronDown className="w-5 h-5" />
              </div>
            </div>
          </div>
          
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-gray-100/50 pb-safe z-20">
            <div className="flex gap-3 max-w-md mx-auto">
              <button 
                type="button" 
                onClick={handleBack}
                className="flex-1 bg-white hover:bg-gray-50 border border-gray-200/60 text-[#172033] font-semibold py-3.5 rounded-xl transition-colors interactive-element shadow-sm"
              >
                Back
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-[2] bg-primary hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3.5 rounded-xl transition-colors interactive-element flex items-center justify-center gap-2 shadow-sm disabled:opacity-70"
              >
                {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                {isSubmitting ? 'Creating...' : 'Create Department'}
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
