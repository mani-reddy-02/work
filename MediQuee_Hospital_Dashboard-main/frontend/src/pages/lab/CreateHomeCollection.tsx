import { useState } from "react"
import { ArrowLeft, Loader2, Home } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/context/ToastContext"
import { cn } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { ConfirmationSheet } from "@/components/ui/ConfirmationSheet"
import { ConditionSelector } from "@/components/shared/ConditionSelector"

const schema = z.object({
  patientName: z.string().min(2, "Name is required"),
  mobile: z.string().min(10, "Mobile is required"),
  address: z.string().min(5, "Address is required"),
  test: z.string().min(2, "Test is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
})
type FormValues = z.infer<typeof schema>

const inputClass = (err: boolean) => cn(
  "w-full px-4 py-3 bg-white border rounded-xl outline-none transition-all text-[15px] placeholder:text-[#98A2B3] shadow-sm",
  err ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-gray-200/60 focus:border-primary focus:ring-2 focus:ring-primary/20'
)

export function CreateHomeCollection() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange"
  })
  
  const selectedTest = watch("test");

  const onSubmit = async (_: FormValues) => {
    setIsSubmitting(true)
    await new Promise(r => setTimeout(r, 1500))
    setIsSubmitting(false)
    toast("Home collection scheduled", "success")
    navigate(-1)
  }

  const handleBack = () => isDirty ? setShowExitConfirm(true) : navigate(-1)

  return (
    <div className="flex flex-col bg-background min-h-screen w-full">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-4 md:pt-6 pb-3 md:pb-4 px-4 md:px-6 flex items-center gap-4 border-b border-gray-100/50">
        <button onClick={handleBack} className="p-2 -ml-2 text-[#172033] rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <h1 className="text-[18px] md:text-[22px] font-bold text-[#172033]">Schedule Home Collection</h1>
      </div>

      <div className="flex flex-col px-4 md:px-6 pt-6 md:pt-10 pb-28 gap-5 md:gap-8 max-w-xl mx-auto w-full">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 shadow-sm mx-auto mb-2">
          <Home className="w-8 h-8 md:w-10 md:h-10 text-amber-600" strokeWidth={1.5} />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 md:gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            {[
              { label: 'Patient Name', name: 'patientName', type: 'text', placeholder: 'e.g. Sunita Patel' },
              { label: 'Mobile Number', name: 'mobile', type: 'tel', placeholder: 'e.g. 9876543210' },
            ].map(f => (
              <div key={f.name} className="flex flex-col gap-1.5 md:gap-2">
                <label className="text-[13px] md:text-[14px] font-semibold text-[#172033]">{f.label} <span className="text-destructive">*</span></label>
                <input {...register(f.name as any)} type={f.type} placeholder={f.placeholder} className={inputClass(!!(errors as any)[f.name])} />
                {(errors as any)[f.name] && <span className="text-destructive text-[12px] font-medium">{(errors as any)[f.name].message}</span>}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5 md:gap-2">
            <label className="text-[13px] md:text-[14px] font-semibold text-[#172033]">Collection Address <span className="text-destructive">*</span></label>
            <input {...register('address')} type="text" placeholder="Full address with landmark" className={inputClass(!!errors.address)} />
            {errors.address && <span className="text-destructive text-[12px] font-medium">{errors.address.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5 md:gap-2">
            <label className="text-[13px] md:text-[14px] font-semibold text-[#172033]">Test Required <span className="text-destructive">*</span></label>
            <ConditionSelector 
              type="test" 
              value={selectedTest} 
              onChange={(val) => setValue("test", val, { shouldValidate: true })} 
              error={!!errors.test} 
            />
            {/* Hidden input to keep form integration intact */}
            <input type="hidden" {...register("test")} />
            {errors.test && <span className="text-destructive text-[12px] font-medium">{errors.test.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-6">
            <div className="flex flex-col gap-1.5 md:gap-2">
              <label className="text-[13px] md:text-[14px] font-semibold text-[#172033]">Date <span className="text-destructive">*</span></label>
              <input {...register("date")} type="date" className={inputClass(!!errors.date)} />
              {errors.date && <span className="text-destructive text-[12px] font-medium">{errors.date.message}</span>}
            </div>
            <div className="flex flex-col gap-1.5 md:gap-2">
              <label className="text-[13px] md:text-[14px] font-semibold text-[#172033]">Time <span className="text-destructive">*</span></label>
              <input {...register("time")} type="time" className={inputClass(!!errors.time)} />
              {errors.time && <span className="text-destructive text-[12px] font-medium">{errors.time.message}</span>}
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-background/95 backdrop-blur-md border-t border-gray-100/50 pb-safe z-20">
            <div className="flex gap-3 md:gap-4 max-w-xl mx-auto w-full">
              <button type="button" onClick={handleBack} className="flex-1 bg-white border border-gray-200/60 text-[#172033] font-semibold py-3.5 md:py-4 rounded-xl md:rounded-2xl shadow-sm hover:bg-gray-50 transition-colors">Back</button>
              <button type="submit" disabled={isSubmitting} className="flex-[2] bg-primary text-white font-semibold py-3.5 md:py-4 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 disabled:opacity-70 hover:bg-blue-700 active:bg-blue-800 transition-colors">
                {isSubmitting && <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />}
                {isSubmitting ? 'Scheduling…' : 'Schedule Collection'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <ConfirmationSheet isOpen={showExitConfirm} onClose={() => setShowExitConfirm(false)} title="Discard changes?" description="Your entered information will be lost." confirmLabel="Discard" cancelLabel="Keep Editing" isDestructive onConfirm={() => navigate(-1)} />
    </div>
  )
}
