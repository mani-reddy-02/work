import { useState } from "react"
import { ArrowLeft, Loader2, FlaskConical, Check } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/context/ToastContext"
import { cn } from "@/lib/utils"

const inputClass = "w-full px-4 py-3 bg-white border border-gray-200/60 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-[15px] placeholder:text-[#98A2B3] shadow-sm transition-all"

export function LabInfo() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [homeCollection, setHomeCollection] = useState(true)

  const handleSave = async () => {
    setIsSubmitting(true)
    await new Promise(r => setTimeout(r, 1200))
    setIsSubmitting(false)
    toast("Lab information updated", "success")
  }

  return (
    <div className="flex flex-col bg-background min-h-screen w-full">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-4 md:pt-6 pb-3 md:pb-4 px-4 md:px-6 flex items-center gap-4 border-b border-gray-100/50">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[#172033] rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <h1 className="text-[18px] md:text-[22px] font-bold text-[#172033]">Lab Information</h1>
      </div>

      <div className="flex flex-col gap-5 md:gap-8 px-4 md:px-6 pt-6 md:pt-10 pb-28 max-w-2xl mx-auto w-full">
        {/* Logo placeholder */}
        <div className="flex flex-col items-center gap-2 md:gap-3">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-blue-500 to-primary rounded-2xl md:rounded-3xl flex items-center justify-center shadow-md">
            <FlaskConical className="w-10 h-10 md:w-12 md:h-12 text-white" strokeWidth={1.5} />
          </div>
          <button className="text-[13px] md:text-[15px] text-primary font-semibold hover:underline">Update Logo</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {[
            { label: 'Lab Name', defaultValue: 'City Care Diagnostics', type: 'text', fullWidth: true },
            { label: 'Phone', defaultValue: '+91 98765 43210', type: 'tel' },
            { label: 'Email', defaultValue: 'admin@citycarediag.com', type: 'email' },
            { label: 'Address', defaultValue: '42, MG Road, Banjara Hills, Hyderabad', type: 'text', fullWidth: true },
            { label: 'Operating Hours', defaultValue: '8:00 AM – 8:00 PM', type: 'text', fullWidth: true },
          ].map(f => (
            <div key={f.label} className={cn("flex flex-col gap-1.5 md:gap-2", f.fullWidth ? "md:col-span-2" : "")}>
              <label className="text-[13px] md:text-[14px] font-semibold text-[#172033]">{f.label}</label>
              <input type={f.type} defaultValue={f.defaultValue} className={cn(inputClass, "md:px-5 md:py-3.5 md:text-[16px] md:rounded-2xl")} />
            </div>
          ))}
        </div>

        {/* Home Collection toggle */}
        <div className="bg-white rounded-2xl md:rounded-3xl border border-gray-200/60 p-4 md:p-6 flex items-center justify-between shadow-sm mt-2">
          <div>
            <p className="text-[15px] md:text-[18px] font-semibold text-[#172033]">Home Collection</p>
            <p className="text-[12px] md:text-[14px] text-[#667085] mt-0.5">Accept home sample collection requests</p>
          </div>
          <button
            onClick={() => setHomeCollection(!homeCollection)}
            className={cn("w-6 h-6 md:w-8 md:h-8 rounded-md md:rounded-lg border flex items-center justify-center transition-all hover:opacity-80", homeCollection ? "bg-primary border-primary shadow-sm" : "bg-gray-50 border-gray-300")}
          >
            {homeCollection && <Check className="w-4 h-4 md:w-5 md:h-5 text-white" strokeWidth={3} />}
          </button>
        </div>

        {homeCollection && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            {[
              { label: 'Service Area', placeholder: 'e.g. Banjara Hills, Jubilee Hills', fullWidth: true },
              { label: 'Collection Fee (₹)', placeholder: 'e.g. 150' },
              { label: 'Available Time', placeholder: 'e.g. 7:00 AM – 12:00 PM' },
            ].map(f => (
              <div key={f.label} className={cn("flex flex-col gap-1.5 md:gap-2", f.fullWidth ? "md:col-span-2" : "")}>
                <label className="text-[13px] md:text-[14px] font-semibold text-[#172033]">{f.label}</label>
                <input type="text" placeholder={f.placeholder} className={cn(inputClass, "md:px-5 md:py-3.5 md:text-[16px] md:rounded-2xl")} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-background/95 backdrop-blur-md border-t border-gray-100/50 pb-safe z-20">
        <div className="flex gap-3 md:gap-4 max-w-2xl mx-auto w-full">
          <button onClick={() => navigate(-1)} className="flex-1 bg-white border border-gray-200/60 text-[#172033] font-semibold py-3.5 md:py-4 rounded-xl md:rounded-2xl shadow-sm hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={isSubmitting} className="flex-[2] bg-primary text-white font-semibold py-3.5 md:py-4 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 disabled:opacity-70 hover:bg-blue-700 active:bg-blue-800 transition-colors">
            {isSubmitting && <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />}
            {isSubmitting ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
