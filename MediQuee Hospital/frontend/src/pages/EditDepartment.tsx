import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Building2, ChevronDown, Loader2 } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import { useToast } from "@/context/ToastContext"
import { ConfirmationSheet } from "@/components/ui/ConfirmationSheet"
import { adminApi } from "@/services/adminApi"
import { cn } from "@/lib/utils"

const departmentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(2, "Code must be at least 2 characters"),
  description: z.string().optional(),
  status: z.enum(["active", "inactive"]),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

export function EditDepartment() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      status: "active"
    }
  });

  useEffect(() => {
    const fetchDepartment = async () => {
      try {
        const departments = await adminApi.getDepartments();
        const dept = departments.find(d => d.id === id);
        if (dept) {
          reset({
            name: dept.name,
            code: dept.code || '',
            description: dept.description || '',
            status: "active"
          });
        } else {
          toast('Department not found', 'error');
          navigate(-1);
        }
      } catch (error) {
        toast('Failed to load department', 'error');
        navigate(-1);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDepartment();
  }, [id, reset, navigate, toast]);

  const onSubmit = async (data: DepartmentFormValues) => {
    setIsSubmitting(true);
    try {
      await adminApi.updateDepartment(id!, data);
      toast('Department updated successfully', 'success');
      navigate(-1);
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to update department', "error");
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

  if (isLoading) {
    return (
      <div className="flex flex-col bg-background min-h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-background min-h-screen">
      
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-4 pb-3 px-4 flex items-center gap-4 border-b border-border/50 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <button onClick={handleBack} className="p-2 -ml-2 text-[#172033] interactive-element rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[18px] font-bold text-[#172033]">Edit Department</h1>
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
                "px-4 py-3 bg-surface border rounded-xl outline-none transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm",
                errors.name ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
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
                "px-4 py-3 bg-surface border rounded-xl outline-none transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm uppercase",
                errors.code ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
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
              className="px-4 py-3 bg-surface border border-border/60 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#172033]">Status</label>
            <div className="relative">
              <select {...register("status")} className="w-full px-4 py-3 bg-surface border border-border/60 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-[15px] appearance-none shadow-sm text-[#172033] font-medium">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#98A2B3]">
                <ChevronDown className="w-5 h-5" />
              </div>
            </div>
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
                disabled={isSubmitting || !isDirty}
                className="flex-[2] bg-primary hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3.5 rounded-xl transition-colors interactive-element flex items-center justify-center gap-2 shadow-sm disabled:opacity-70"
              >
                {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                {isSubmitting ? 'Updating...' : 'Update Department'}
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
