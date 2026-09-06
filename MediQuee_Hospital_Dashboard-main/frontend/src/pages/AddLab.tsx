import { FlaskConical, Plus, ArrowLeft, Loader2, X } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/context/ToastContext"
import { ConfirmationSheet } from "@/components/ui/ConfirmationSheet"
import { cn } from "@/lib/utils"

const labSchema = z.object({
  name: z.string().min(2, "Laboratory Name must be at least 2 characters"),
  code: z.string().min(2, "Lab Code must be at least 2 characters"),
  phone: z.string().min(10, "Contact Number must be at least 10 digits"),
});

type LabFormValues = z.infer<typeof labSchema>;

export function AddLab() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<LabFormValues>({
    resolver: zodResolver(labSchema),
  });

  const onSubmit = async (_data: LabFormValues) => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    toast("Laboratory added successfully", "success");
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
        <h1 className="text-[18px] font-bold text-[#172033]">Add Laboratory</h1>
      </div>

      <div className="flex flex-col px-4 pt-6 pb-24 overflow-y-auto w-full max-w-md mx-auto">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 border border-blue-100 shadow-sm mx-auto">
          <FlaskConical className="w-8 h-8 text-primary" strokeWidth={1.5} />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#172033]">Laboratory Name <span className="text-destructive">*</span></label>
            <input 
              {...register("name")}
              type="text" 
              placeholder="e.g. Apollo Pathology" 
              className={cn(
                "px-4 py-3 bg-white border rounded-xl outline-none transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm",
                errors.name ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-gray-200/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
              )}
            />
            {errors.name && <span className="text-destructive text-[12px] font-medium mt-0.5">{errors.name.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#172033]">Lab Code <span className="text-destructive">*</span></label>
            <input 
              {...register("code")}
              type="text" 
              placeholder="e.g. LAB-01" 
              className={cn(
                "px-4 py-3 bg-white border rounded-xl outline-none transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm uppercase",
                errors.code ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-gray-200/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
              )}
            />
            {errors.code && <span className="text-destructive text-[12px] font-medium mt-0.5">{errors.code.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#172033]">Services Offered</label>
            <div className="border border-gray-200/60 rounded-xl p-4 flex flex-wrap gap-2 bg-white shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <span className="bg-blue-50 text-primary text-[13px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-blue-100">
                Blood Test <button type="button" className="hover:bg-blue-100 rounded-full p-0.5 transition-colors"><X className="w-3 h-3" /></button>
              </span>
              <span className="bg-blue-50 text-primary text-[13px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-blue-100">
                Urine Analysis <button type="button" className="hover:bg-blue-100 rounded-full p-0.5 transition-colors"><X className="w-3 h-3" /></button>
              </span>
              <button type="button" className="bg-gray-50 text-[#667085] text-[13px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-gray-200 hover:bg-gray-100 active:bg-gray-200 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Service
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#172033]">Contact Number <span className="text-destructive">*</span></label>
            <input 
              {...register("phone")}
              type="tel" 
              placeholder="e.g. 9876543210" 
              className={cn(
                "px-4 py-3 bg-white border rounded-xl outline-none transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm",
                errors.phone ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-gray-200/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
              )}
            />
            {errors.phone && <span className="text-destructive text-[12px] font-medium mt-0.5">{errors.phone.message}</span>}
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
