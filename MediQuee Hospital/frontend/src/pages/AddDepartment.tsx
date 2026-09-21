import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Building2, ChevronDown, Loader2, Search, Check } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/context/ToastContext"
import { ConfirmationSheet } from "@/components/ui/ConfirmationSheet"
import { adminApi } from "@/services/adminApi"
import { cn } from "@/lib/utils"

const departmentSchema = z.object({
  specialtyId: z.string().min(1, "Please select a specialty"),
  description: z.string().optional(),
  status: z.enum(["active", "inactive"]),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

export function AddDepartment() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [existingDepartments, setExistingDepartments] = useState<any[]>([]);
  const [isLoadingSpecialties, setIsLoadingSpecialties] = useState(true);
  const [specialtiesError, setSpecialtiesError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Filter specialties based on search query
  const filteredSpecialties = specialties.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [specs, depts] = await Promise.all([
          adminApi.getSpecialties(),
          adminApi.getDepartments().catch(() => [])
        ]);
        setSpecialties(specs);
        setExistingDepartments(depts || []);
      } catch (err) {
        setSpecialtiesError("Failed to load specialties");
      } finally {
        setIsLoadingSpecialties(false);
      }
    };
    fetchData();
  }, []);

  const { register, handleSubmit, setValue, formState: { errors, isDirty } } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      status: "active"
    }
  });

  const onSubmit = async (data: DepartmentFormValues) => {
    setIsSubmitting(true);
    try {
      await adminApi.createDepartment(data);
      toast('Department created successfully', 'success');
      navigate(-1);
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to create department', "error");
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
        <h1 className="text-[18px] font-bold text-[#172033]">Add Department</h1>
      </div>

      <div className="flex flex-col px-4 pt-6 pb-24 overflow-y-auto w-full max-w-md mx-auto">
        
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 border border-blue-100 shadow-sm mx-auto">
          <Building2 className="w-8 h-8 text-primary" strokeWidth={1.5} />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5 relative">
            <label className="text-[13px] font-semibold text-[#172033]">Platform Specialty <span className="text-destructive">*</span></label>
            
            {/* Custom Searchable Dropdown Trigger */}
            <div 
              className={cn(
                "w-full px-4 py-3 bg-surface border rounded-xl flex items-center justify-between cursor-pointer transition-all shadow-sm",
                errors.specialtyId ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-border/60 hover:border-gray-300',
                (isLoadingSpecialties || specialtiesError) && "opacity-70 bg-gray-50 cursor-not-allowed"
              )}
              onClick={() => {
                if (!isLoadingSpecialties && !specialtiesError) setIsDropdownOpen(!isDropdownOpen);
              }}
            >
              <span className={cn("text-[15px] truncate", !isDirty && !specialties.find(s => s.id === register("specialtyId").name) ? "text-[#98A2B3]" : "text-[#172033]")}>
                {isLoadingSpecialties ? "Loading specialties..." : 
                 specialtiesError ? "Failed to load specialties" :
                 (specialties.find(s => s.id === document.getElementsByName("specialtyId")[0]?.getAttribute("value"))?.name || 
                  specialties.find(s => s.id === (register("specialtyId") as any).value)?.name || // For initial render before selection
                  "Search and select a specialty...")}
              </span>
              {isLoadingSpecialties ? <Loader2 className="w-5 h-5 animate-spin text-[#98A2B3]" /> : <ChevronDown className="w-5 h-5 text-[#98A2B3]" />}
            </div>
            
            {/* Hidden actual input for react-hook-form */}
            <input type="hidden" {...register("specialtyId")} />

            {/* Dropdown Menu */}
            {isDropdownOpen && !isLoadingSpecialties && (
              <div className="absolute top-[100%] left-0 right-0 mt-2 bg-surface border border-border/60 rounded-xl shadow-lg z-50 overflow-hidden flex flex-col">
                <div className="flex items-center px-3 py-2.5 border-b border-border bg-gray-50/50">
                  <Search className="w-4 h-4 text-muted/70 mr-2" />
                  <input 
                    type="text"
                    placeholder="Search specialties..."
                    className="flex-1 bg-transparent outline-none text-[14px] text-[#172033] placeholder:text-muted/70"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="max-h-[250px] overflow-y-auto py-1">
                  {filteredSpecialties.length === 0 ? (
                    <div className="px-4 py-8 text-center text-[14px] text-muted">
                      No specialties found matching "{searchQuery}"
                    </div>
                  ) : (
                    filteredSpecialties.map((s) => {
                      const isAlreadyAdded = existingDepartments.some(
                        (d) => d.specialtyId === s.id || d.name?.toLowerCase() === s.name?.toLowerCase()
                      );

                      return (
                        <div 
                          key={s.id}
                          className={cn(
                            "px-4 py-2.5 flex items-center justify-between group transition-colors",
                            isAlreadyAdded 
                              ? "opacity-50 bg-gray-50/70 cursor-not-allowed" 
                              : "hover:bg-blue-50/50 cursor-pointer"
                          )}
                          onClick={() => {
                            if (isAlreadyAdded) {
                              toast(`'${s.name}' department is already added for your hospital.`, 'warning');
                              return;
                            }
                            setValue('specialtyId', s.id, { shouldValidate: true, shouldDirty: true });
                            document.getElementsByName("specialtyId")[0]?.setAttribute("value", s.id);
                            setIsDropdownOpen(false);
                            setSearchQuery("");
                          }}
                        >
                          <div className="flex flex-col pr-2">
                            <span className={cn(
                              "text-[14px] font-medium transition-colors",
                              isAlreadyAdded ? "text-muted" : "text-[#172033] group-hover:text-primary"
                            )}>
                              {s.name}
                            </span>
                            {s.description && <span className="text-[12px] text-muted line-clamp-1">{s.description}</span>}
                          </div>
                          {isAlreadyAdded && (
                            <span className="shrink-0 px-2 py-0.5 bg-gray-200/80 text-gray-600 text-[10px] font-bold uppercase rounded-md tracking-wider">
                              Already Added
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {errors.specialtyId && !specialtiesError && <span className="text-destructive text-[12px] font-medium mt-0.5">{errors.specialtyId.message}</span>}
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
                disabled={isSubmitting || isLoadingSpecialties || !!specialtiesError}
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
