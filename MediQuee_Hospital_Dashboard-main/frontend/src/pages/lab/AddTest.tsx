import { useState } from "react"
import { ArrowLeft, Loader2, FlaskConical } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useToast } from "@/context/ToastContext"
import { ConfirmationSheet } from "@/components/ui/ConfirmationSheet"
import { cn } from "@/lib/utils"
import { ConditionSelector } from "@/components/shared/ConditionSelector"

const testSchema = z.object({
  name: z.string().min(2, "Test name is required"),
  category: z.string().min(1, "Category is required"),
  sampleType: z.string().min(1, "Sample type is required"),
  price: z.string().min(1, "Price is required"),
  turnaround: z.string().min(1, "Turnaround time is required"),
  description: z.string().optional(),
  status: z.enum(["active", "inactive"]),
})

type TestFormValues = z.infer<typeof testSchema>

const categories = ['Blood', 'Urine', 'Pathology', 'Imaging', 'Microbiology', 'Other']
const sampleTypes = ['Blood', 'Urine', 'Stool', 'Sputum', 'Swab', 'Tissue', 'Other']

const inputClass = (err: boolean) => cn(
  "w-full px-4 py-3 bg-white border rounded-xl outline-none transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm",
  err ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-gray-200/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
)

export function AddTest() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors, isDirty } } = useForm<TestFormValues>({
    resolver: zodResolver(testSchema),
    defaultValues: { status: 'active' },
    mode: "onChange"
  })
  
  const selectedName = watch("name");

  const onSubmit = async (_data: TestFormValues) => {
    setIsSubmitting(true)
    await new Promise(r => setTimeout(r, 1500))
    setIsSubmitting(false)
    toast("Test added successfully", "success")
    navigate(-1)
  }

  const handleBack = () => isDirty ? setShowExitConfirm(true) : navigate(-1)

  return (
    <div className="flex flex-col bg-background min-h-screen w-full">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-4 md:pt-6 pb-3 md:pb-4 px-4 md:px-6 flex items-center gap-4 border-b border-gray-100/50">
        <button onClick={handleBack} className="p-2 -ml-2 text-[#172033] rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <h1 className="text-[18px] md:text-[22px] font-bold text-[#172033]">Add Test</h1>
      </div>

      <div className="flex flex-col px-4 md:px-6 pt-6 md:pt-10 pb-28 gap-5 md:gap-8 max-w-xl mx-auto w-full">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm mx-auto mb-2">
          <FlaskConical className="w-8 h-8 md:w-10 md:h-10 text-primary" strokeWidth={1.5} />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 md:gap-6">
          <div className="flex flex-col gap-1.5 md:gap-2">
            <label className="text-[13px] md:text-[14px] font-semibold text-[#172033]">Test Name <span className="text-destructive">*</span></label>
            <ConditionSelector 
              type="test" 
              value={selectedName} 
              onChange={(val) => setValue("name", val, { shouldValidate: true })} 
              error={!!errors.name} 
            />
            {/* Hidden input to keep form integration intact */}
            <input type="hidden" {...register("name")} />
            {errors.name && <span className="text-destructive text-[12px] font-medium">{errors.name.message}</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            <div className="flex flex-col gap-1.5 md:gap-2">
              <label className="text-[13px] md:text-[14px] font-semibold text-[#172033]">Category <span className="text-destructive">*</span></label>
              <select {...register("category")} className={inputClass(!!errors.category)}>
                <option value="">Select Category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <span className="text-destructive text-[12px] font-medium">{errors.category.message}</span>}
            </div>

            <div className="flex flex-col gap-1.5 md:gap-2">
              <label className="text-[13px] md:text-[14px] font-semibold text-[#172033]">Sample Type <span className="text-destructive">*</span></label>
              <select {...register("sampleType")} className={inputClass(!!errors.sampleType)}>
                <option value="">Select Sample Type</option>
                {sampleTypes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.sampleType && <span className="text-destructive text-[12px] font-medium">{errors.sampleType.message}</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-6">
            <div className="flex flex-col gap-1.5 md:gap-2">
              <label className="text-[13px] md:text-[14px] font-semibold text-[#172033]">Price (₹) <span className="text-destructive">*</span></label>
              <input {...register("price")} type="number" placeholder="e.g. 350" className={inputClass(!!errors.price)} />
              {errors.price && <span className="text-destructive text-[12px] font-medium">{errors.price.message}</span>}
            </div>
            <div className="flex flex-col gap-1.5 md:gap-2">
              <label className="text-[13px] md:text-[14px] font-semibold text-[#172033]">TAT <span className="text-destructive">*</span></label>
              <input {...register("turnaround")} type="text" placeholder="e.g. 24 hrs" className={inputClass(!!errors.turnaround)} />
              {errors.turnaround && <span className="text-destructive text-[12px] font-medium">{errors.turnaround.message}</span>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 md:gap-2">
            <label className="text-[13px] md:text-[14px] font-semibold text-[#172033]">Description</label>
            <textarea {...register("description")} rows={3} placeholder="Brief description of this test…" className={cn(inputClass(false), "resize-none")} />
          </div>

          <div className="flex flex-col gap-2 md:gap-3">
            <label className="text-[13px] md:text-[14px] font-semibold text-[#172033]">Status</label>
            <div className="flex gap-4">
              {(['active', 'inactive'] as const).map(s => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <input {...register("status")} type="radio" value={s} className="accent-primary w-4 h-4 md:w-5 md:h-5" />
                  <span className="text-[14px] md:text-[15px] font-medium text-[#172033] capitalize">{s}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-background/95 backdrop-blur-md border-t border-gray-100/50 pb-safe z-20">
            <div className="flex gap-3 md:gap-4 max-w-xl mx-auto w-full">
              <button type="button" onClick={handleBack} className="flex-1 bg-white border border-gray-200/60 text-[#172033] font-semibold py-3.5 md:py-4 rounded-xl md:rounded-2xl shadow-sm hover:bg-gray-50 transition-colors">Back</button>
              <button type="submit" disabled={isSubmitting} className="flex-[2] bg-primary text-white font-semibold py-3.5 md:py-4 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 disabled:opacity-70 hover:bg-blue-700 active:bg-blue-800 transition-colors">
                {isSubmitting && <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />}
                {isSubmitting ? 'Saving…' : 'Save Test'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <ConfirmationSheet isOpen={showExitConfirm} onClose={() => setShowExitConfirm(false)} title="Discard changes?" description="Your entered information will be lost." confirmLabel="Discard" cancelLabel="Keep Editing" isDestructive onConfirm={() => navigate(-1)} />
    </div>
  )
}
