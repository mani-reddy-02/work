import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Loader2, User, FlaskConical, CheckCircle2, Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/context/ToastContext"
import { ConfirmationSheet } from "@/components/ui/ConfirmationSheet"
import { cn } from "@/lib/utils"
import { getConditionIconPath } from "@/components/shared/ConditionLabel"

const availableTests = [
  { id: 't1', name: 'CBC', price: 300 },
  { id: 't2', name: 'Lipid Profile', price: 550 },
  { id: 't3', name: 'Thyroid Profile', price: 650 },
  { id: 't4', name: 'HbA1c', price: 450 },
  { id: 't5', name: 'Liver Function Test', price: 750 },
  { id: 't6', name: 'Kidney Function Test', price: 700 },
  { id: 't7', name: 'Urine Routine', price: 200 },
  { id: 't8', name: 'Blood Sugar (FBS)', price: 150 },
]

type Step = 1 | 2 | 3

export function CreateOrder() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [step, setStep] = useState<Step>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  // Form data
  const [patientName, setPatientName] = useState('')
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [sampleType, setSampleType] = useState('')
  const [selectedTests, setSelectedTests] = useState<string[]>([])

  const handleBack = () => {
    if (patientName || mobile || selectedTests.length > 0) setShowExitConfirm(true)
    else navigate(-1)
  }

  const toggleTest = (id: string) =>
    setSelectedTests(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])

  const selectedTestObjs = availableTests.filter(t => selectedTests.includes(t.id))
  const total = selectedTestObjs.reduce((sum, t) => sum + t.price, 0)

  const nextStep = () => setStep(s => (s + 1) as Step)
  const prevStep = () => setStep(s => (s - 1) as Step)

  const onSubmit = async () => {
    setIsSubmitting(true)
    await new Promise(r => setTimeout(r, 1500))
    setIsSubmitting(false)
    toast("Order created successfully", "success")
    navigate('/lab/orders')
  }

  return (
    <div className="flex flex-col bg-background min-h-screen w-full">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-4 md:pt-6 pb-3 md:pb-4 px-4 md:px-6 flex items-center gap-4 border-b border-gray-100/50">
        <button onClick={step === 1 ? handleBack : prevStep} className="p-2 -ml-2 text-[#172033] rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <h1 className="text-[18px] md:text-[22px] font-bold text-[#172033]">Create Order</h1>
        <div className="ml-auto flex items-center gap-1.5 md:gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className={cn("w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-colors", step >= i ? 'bg-primary' : 'bg-gray-200')} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Patient Info */}
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-5 md:gap-8 px-4 md:px-6 pt-6 md:pt-10 pb-28 max-w-2xl mx-auto w-full">
            <div className="w-14 h-14 md:w-20 md:h-20 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 mx-auto">
              <User className="w-7 h-7 md:w-10 md:h-10 text-primary" strokeWidth={1.5} />
            </div>
            <h2 className="text-[16px] md:text-[20px] font-bold text-[#172033] text-center">Patient Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {[
                { label: 'Patient Name', value: patientName, set: setPatientName, type: 'text', placeholder: 'e.g. Ramesh Kumar', required: true },
                { label: 'Mobile Number', value: mobile, set: setMobile, type: 'tel', placeholder: 'e.g. 9876543210', required: true },
                { label: 'Email Address', value: email, set: setEmail, type: 'email', placeholder: 'e.g. patient@email.com', required: false },
                { label: 'Sample Type', value: sampleType, set: setSampleType, type: 'text', placeholder: 'e.g. Blood, Urine', required: false },
              ].map((f, i) => (
                <div key={f.label} className={cn("flex flex-col gap-1.5 md:gap-2", i === 0 || i === 1 ? 'md:col-span-1' : '')}>
                  <label className="text-[13px] md:text-[14px] font-semibold text-[#172033]">{f.label} {f.required && <span className="text-destructive">*</span>}</label>
                  <input
                    type={f.type} value={f.value} onChange={e => f.set(e.target.value)}
                    placeholder={f.placeholder}
                    className="px-4 py-3 md:px-5 md:py-3.5 bg-white border border-gray-200/60 rounded-xl md:rounded-2xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-[15px] md:text-[16px] placeholder:text-[#98A2B3] shadow-sm transition-all"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Select Tests */}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4 md:gap-6 px-4 md:px-6 pt-6 md:pt-10 pb-28 max-w-2xl mx-auto w-full">
            <div className="flex items-center gap-3 md:gap-4 bg-primary/5 border border-primary/15 rounded-2xl md:rounded-3xl px-4 py-3 md:px-6 md:py-5">
              <User className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              <div>
                <p className="text-[14px] md:text-[16px] font-bold text-[#172033]">{patientName}</p>
                <p className="text-[12px] md:text-[14px] text-[#667085]">{mobile}</p>
              </div>
            </div>
            <h2 className="text-[16px] md:text-[20px] font-bold text-[#172033]">Select Tests</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4">
              {availableTests.map(t => {
                const selected = selectedTests.includes(t.id)
                return (
                  <button
                    key={t.id}
                    onClick={() => toggleTest(t.id)}
                    className={cn(
                      "flex items-center gap-3 md:gap-4 p-4 md:p-5 rounded-2xl border text-left transition-all active:scale-[0.98] hover:shadow-md hover:border-primary/20",
                      selected ? "bg-primary/5 border-primary shadow-sm" : "bg-white border-gray-200/60 shadow-sm"
                    )}
                  >
                    <div className={cn("w-9 h-9 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-colors shrink-0 overflow-hidden", selected ? "bg-primary" : "bg-blue-50")}>
                      {getConditionIconPath(t.name) ? (
                        <img src={getConditionIconPath(t.name)!} alt={t.name} className="w-5 h-5 md:w-7 md:h-7 object-contain drop-shadow-sm mix-blend-multiply" style={selected ? { filter: 'brightness(0) invert(1)' } : {}} />
                      ) : (
                        <FlaskConical className={cn("w-4 h-4 md:w-6 md:h-6", selected ? "text-white" : "text-primary")} strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] md:text-[16px] font-semibold text-[#172033]">{t.name}</p>
                      <p className="text-[12px] md:text-[14px] text-[#667085]">₹{t.price}</p>
                    </div>
                    {selected
                      ? <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-primary shrink-0" />
                      : <Plus className="w-5 h-5 md:w-6 md:h-6 text-[#98A2B3] shrink-0" />
                    }
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4 md:gap-6 px-4 md:px-6 pt-6 md:pt-10 pb-28 max-w-2xl mx-auto w-full">
            <h2 className="text-[16px] md:text-[20px] font-bold text-[#172033]">Review Order</h2>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-50 bg-gray-50/50">
                <p className="text-[12px] md:text-[14px] font-bold text-[#667085] uppercase tracking-wide">Patient</p>
              </div>
              <div className="px-4 py-3 md:px-6 md:py-4 flex flex-col gap-2 md:gap-3">
                {[{ l: 'Name', v: patientName }, { l: 'Mobile', v: mobile }, sampleType ? { l: 'Sample', v: sampleType } : null].filter(Boolean).map(r => (
                  <div key={r!.l} className="flex justify-between">
                    <span className="text-[13px] md:text-[15px] text-[#667085]">{r!.l}</span>
                    <span className="text-[14px] md:text-[16px] font-semibold text-[#172033]">{r!.v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-50 bg-gray-50/50">
                <p className="text-[12px] md:text-[14px] font-bold text-[#667085] uppercase tracking-wide">Tests ({selectedTestObjs.length})</p>
              </div>
              <div className="px-4 py-3 md:px-6 md:py-4 flex flex-col gap-2 md:gap-3">
                {selectedTestObjs.map(t => (
                  <div key={t.id} className="flex justify-between">
                    <span className="text-[14px] md:text-[16px] font-semibold text-[#172033]">{t.name}</span>
                    <span className="text-[14px] md:text-[16px] text-[#667085]">₹{t.price}</span>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-3 flex justify-between mt-2">
                  <span className="text-[14px] md:text-[16px] font-bold text-[#172033]">Total</span>
                  <span className="text-[16px] md:text-[20px] font-bold text-primary">₹{total}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-background/95 backdrop-blur-md border-t border-gray-100/50 pb-safe z-20">
        <div className="flex gap-3 md:gap-4 max-w-2xl mx-auto w-full">
          {step > 1 && (
            <button onClick={prevStep} className="flex-1 bg-white border border-gray-200/60 text-[#172033] font-semibold py-3.5 md:py-4 rounded-xl md:rounded-2xl shadow-sm hover:bg-gray-50 transition-colors">Back</button>
          )}
          {step < 3 ? (
            <button
              disabled={step === 1 ? !patientName || !mobile : selectedTests.length === 0}
              onClick={nextStep}
              className="flex-[2] bg-primary text-white font-semibold py-3.5 md:py-4 rounded-xl md:rounded-2xl disabled:opacity-40 hover:bg-blue-700 active:bg-blue-800 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              disabled={isSubmitting}
              onClick={onSubmit}
              className="flex-[2] bg-emerald-600 text-white font-semibold py-3.5 md:py-4 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 disabled:opacity-70 hover:bg-emerald-700 active:bg-emerald-800 transition-colors"
            >
              {isSubmitting && <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />}
              {isSubmitting ? 'Creating…' : 'Create Order'}
            </button>
          )}
        </div>
      </div>

      <ConfirmationSheet isOpen={showExitConfirm} onClose={() => setShowExitConfirm(false)} title="Discard order?" description="Your entered information will be lost." confirmLabel="Discard" cancelLabel="Keep Editing" isDestructive onConfirm={() => navigate(-1)} />
    </div>
  )
}
