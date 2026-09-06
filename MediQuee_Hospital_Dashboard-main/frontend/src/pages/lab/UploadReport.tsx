import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Search, CheckCircle2, Upload, X, FileText, Image, File, Loader2, Check } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/context/ToastContext"
import { cn } from "@/lib/utils"
import { ConditionLabel } from "@/components/shared/ConditionLabel"

const mockOrderSearch = [
  { id: 'MQ-10284', patient: 'Ramesh Kumar', test: 'CBC + Lipid Profile', date: '14 Aug' },
  { id: 'MQ-10286', patient: 'Mohammed Ali', test: 'Urine Routine', date: '14 Aug' },
  { id: 'MQ-10279', patient: 'Meera Pillai', test: 'Thyroid TSH', date: '11 Aug' },
]

type UploadStep = 1 | 2 | 3 | 'success'

interface SelectedOrder { id: string; patient: string; test: string; date: string }
interface SelectedFile { name: string; type: string; size: string }

export function UploadReport() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<UploadStep>(1)
  const [query, setQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<SelectedOrder | null>(null)
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const results = mockOrderSearch.filter(o =>
    !query || o.patient.toLowerCase().includes(query.toLowerCase()) ||
    o.id.toLowerCase().includes(query.toLowerCase())
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ['application/pdf', 'image/jpeg', 'image/png']
    if (!allowed.includes(file.type)) {
      toast('Invalid file type. Use PDF, JPG, or PNG.', 'error'); return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast('File too large. Maximum size is 10MB.', 'error'); return
    }
    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
      : `${(file.size / 1024).toFixed(0)} KB`
    setSelectedFile({ name: file.name, type: file.type, size: sizeStr })
  }

  const handleUpload = async () => {
    setIsUploading(true)
    setUploadProgress(0)
    // Simulate upload progress
    for (let i = 0; i <= 100; i += 20) {
      await new Promise(r => setTimeout(r, 200))
      setUploadProgress(i)
    }
    setIsUploading(false)
    setStep('success')
  }

  const FileIcon = ({ type }: { type: string }) => {
    if (type === 'application/pdf') return <FileText className="w-5 h-5 text-red-500" />
    if (type.startsWith('image')) return <Image className="w-5 h-5 text-blue-500" />
    return <File className="w-5 h-5 text-gray-500" />
  }

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center gap-5">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center border-2 border-emerald-200">
          <Check className="w-10 h-10 text-emerald-600" strokeWidth={2.5} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <h2 className="text-[22px] font-bold text-[#172033]">Report Uploaded</h2>
          <p className="text-[14px] text-[#667085] mt-2">The report has been successfully attached to the order.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="flex flex-col gap-2 w-full">
          <button onClick={() => navigate(`/lab/report/${selectedOrder?.id}`)} className="w-full bg-primary text-white font-semibold py-3.5 rounded-xl">View Report</button>
          <button onClick={() => navigate('/lab/reports')} className="w-full bg-white border border-gray-200 text-[#172033] font-semibold py-3.5 rounded-xl">Done</button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-background min-h-screen w-full">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-4 md:pt-6 pb-3 md:pb-4 px-4 md:px-6 flex items-center gap-4 border-b border-gray-100/50">
        <button onClick={() => step === 1 ? navigate(-1) : setStep(s => (s as number) - 1 as UploadStep)} className="p-2 -ml-2 text-[#172033] rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <h1 className="text-[18px] md:text-[22px] font-bold text-[#172033]">Upload Report</h1>
        {/* Step indicator */}
        <div className="ml-auto flex items-center gap-1.5 md:gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className={cn("w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-colors", (step as number) >= i ? 'bg-primary' : 'bg-gray-200')} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1: Select Order */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4 md:gap-6 px-4 md:px-6 pt-6 md:pt-10 pb-28 w-full max-w-2xl mx-auto">
            <div>
              <h2 className="text-[17px] md:text-[20px] font-bold text-[#172033]">Select Test Order</h2>
              <p className="text-[13px] md:text-[15px] text-[#667085] mt-1 md:mt-2">Search by patient name, order ID, or phone</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-[#98A2B3]" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="e.g. Ramesh or MQ-10284"
                className="w-full pl-10 md:pl-12 pr-4 py-3 md:py-3.5 bg-white border border-gray-200/60 rounded-xl md:rounded-2xl text-[14px] md:text-[15px] text-[#172033] placeholder:text-[#98A2B3] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
              />
            </div>
            <div className="flex flex-col gap-2 md:gap-3">
              {results.map(o => (
                <button
                  key={o.id}
                  onClick={() => { setSelectedOrder(o); setStep(2) }}
                  className={cn(
                    "flex items-center gap-3 md:gap-4 p-4 md:p-5 rounded-2xl border text-left transition-all active:scale-[0.98] hover:shadow-md hover:border-primary/20",
                    selectedOrder?.id === o.id ? "bg-primary/5 border-primary shadow-sm" : "bg-white border-gray-200/60 shadow-sm"
                  )}
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 md:w-6 md:h-6 text-primary" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] md:text-[16px] font-semibold text-[#172033] truncate">{o.patient}</p>
                    <ConditionLabel name={o.test} textClassName="text-[12px] md:text-[14px] text-[#667085]" iconClassName="w-4 h-4" />
                    <p className="text-[11px] md:text-[13px] text-[#98A2B3] mt-0.5 md:mt-1">{o.id} · {o.date}</p>
                  </div>
                  {selectedOrder?.id === o.id && <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-primary shrink-0" />}
                </button>
              ))}
              {results.length === 0 && query && (
                <div className="text-center py-8 md:py-12 text-[#667085]">
                  <p className="font-semibold md:text-[18px]">No orders found</p>
                  <p className="text-[13px] md:text-[15px] mt-1">Try a different search term</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* STEP 2: Upload File */}
        {step === 2 && selectedOrder && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4 md:gap-6 px-4 md:px-6 pt-6 md:pt-10 pb-28 w-full max-w-2xl mx-auto">
            {/* Selected Order Summary */}
            <div className="bg-primary/5 border border-primary/15 rounded-2xl px-4 py-3 md:px-5 md:py-4">
              <p className="text-[12px] md:text-[13px] font-semibold text-primary mb-1">Selected Order</p>
              <p className="text-[15px] md:text-[18px] font-bold text-[#172033]">{selectedOrder.patient}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <ConditionLabel name={selectedOrder.test} textClassName="text-[13px] md:text-[15px] text-[#667085]" iconClassName="w-4 h-4" />
                <span className="text-[#667085]">· {selectedOrder.id}</span>
              </div>
            </div>

            <div>
              <h2 className="text-[17px] md:text-[20px] font-bold text-[#172033]">Upload Report File</h2>
              <p className="text-[13px] md:text-[15px] text-[#667085] mt-1 md:mt-2">Supported: PDF, JPG, PNG · Max 10MB</p>
            </div>

            {!selectedFile ? (
              <button
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center justify-center gap-3 md:gap-4 py-10 md:py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-white hover:border-primary/40 hover:bg-blue-50/30 transition-all active:scale-[0.98]"
              >
                <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
                  <Upload className="w-7 h-7 md:w-8 md:h-8 text-primary" strokeWidth={1.5} />
                </div>
                <div className="text-center">
                  <p className="text-[15px] md:text-[17px] font-semibold text-primary">Choose File</p>
                  <p className="text-[12px] md:text-[14px] text-[#667085] mt-0.5 md:mt-1">or drag and drop here</p>
                </div>
              </button>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200/60 p-4 md:p-5 flex items-center gap-3 md:gap-4 shadow-sm">
                <div className="w-11 h-11 md:w-14 md:h-14 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                  <FileIcon type={selectedFile.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] md:text-[16px] font-semibold text-[#172033] truncate">{selectedFile.name}</p>
                  <p className="text-[12px] md:text-[14px] text-[#667085]">{selectedFile.size}</p>
                </div>
                <button onClick={() => setSelectedFile(null)} className="p-1.5 md:p-2 rounded-full hover:bg-gray-100 text-[#667085] transition-colors">
                  <X className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            )}
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileSelect} />

            {selectedFile && (
              <button onClick={() => fileRef.current?.click()} className="text-[13px] md:text-[15px] text-primary font-semibold text-center hover:underline">Replace File</button>
            )}
          </motion.div>
        )}

        {/* STEP 3: Review */}
        {step === 3 && selectedOrder && selectedFile && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4 md:gap-6 px-4 md:px-6 pt-6 md:pt-10 pb-28 w-full max-w-2xl mx-auto">
            <div>
              <h2 className="text-[17px] md:text-[20px] font-bold text-[#172033]">Review & Upload</h2>
              <p className="text-[13px] md:text-[15px] text-[#667085] mt-1 md:mt-2">Confirm the details before uploading</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {[
                { label: 'Patient', value: selectedOrder.patient },
                { label: 'Test', value: selectedOrder.test },
                { label: 'Order ID', value: selectedOrder.id },
                { label: 'File', value: selectedFile.name },
                { label: 'Size', value: selectedFile.size },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between px-4 py-3 md:px-5 md:py-4 border-b border-gray-50 last:border-0">
                  <span className="text-[13px] md:text-[15px] text-[#667085]">{r.label}</span>
                  <span className="text-[14px] md:text-[16px] font-semibold text-[#172033] max-w-[60%] text-right truncate">{r.value}</span>
                </div>
              ))}
            </div>

            {isUploading && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-6 flex flex-col gap-2 md:gap-3">
                <div className="flex items-center justify-between text-[13px] md:text-[15px]">
                  <span className="text-[#667085] font-medium">Uploading…</span>
                  <span className="text-primary font-bold">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 md:h-3 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-background/95 backdrop-blur-md border-t border-gray-100/50 pb-safe z-20">
        <div className="flex gap-3 md:gap-4 max-w-2xl mx-auto w-full">
          {(step as number) > 1 && !isUploading && (
            <button
              onClick={() => setStep(s => (s as number) - 1 as UploadStep)}
              className="flex-1 bg-white border border-gray-200/60 text-[#172033] font-semibold py-3.5 md:py-4 rounded-xl md:rounded-2xl shadow-sm hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          )}
          {step === 1 && (
            <button
              disabled={!selectedOrder}
              onClick={() => setStep(2)}
              className="flex-[2] bg-primary text-white font-semibold py-3.5 md:py-4 rounded-xl md:rounded-2xl disabled:opacity-40 hover:bg-blue-700 active:bg-blue-800 transition-colors"
            >
              Next
            </button>
          )}
          {step === 2 && (
            <button
              disabled={!selectedFile}
              onClick={() => setStep(3)}
              className="flex-[2] bg-primary text-white font-semibold py-3.5 md:py-4 rounded-xl md:rounded-2xl disabled:opacity-40 hover:bg-blue-700 active:bg-blue-800 transition-colors"
            >
              Next
            </button>
          )}
          {step === 3 && (
            <button
              disabled={isUploading}
              onClick={handleUpload}
              className="flex-[2] bg-primary text-white font-semibold py-3.5 md:py-4 rounded-xl md:rounded-2xl disabled:opacity-70 flex items-center justify-center gap-2 hover:bg-blue-700 active:bg-blue-800 transition-colors"
            >
              {isUploading ? <><Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />Uploading…</> : <><Upload className="w-5 h-5 md:w-6 md:h-6" />Upload Report</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
