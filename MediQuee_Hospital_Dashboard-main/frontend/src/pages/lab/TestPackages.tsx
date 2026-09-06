import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Loader2, Package, Plus, X, Check } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/context/ToastContext"
import { cn } from "@/lib/utils"

const availableTests = [
  { id: 't1', name: 'CBC', price: 300 },
  { id: 't2', name: 'Lipid Profile', price: 550 },
  { id: 't3', name: 'Thyroid Profile', price: 650 },
  { id: 't4', name: 'HbA1c', price: 450 },
  { id: 't5', name: 'Liver Function Test', price: 750 },
  { id: 't6', name: 'Kidney Function Test', price: 700 },
  { id: 't7', name: 'Blood Sugar (FBS)', price: 150 },
]

const existingPackages = [
  { id: 'p1', name: 'Basic Health Package', tests: ['CBC', 'Blood Sugar (FBS)', 'Lipid Profile', 'Thyroid Profile'], originalPrice: 1450, packagePrice: 1199, status: 'active' },
  { id: 'p2', name: 'Diabetes Panel', tests: ['HbA1c', 'Blood Sugar (FBS)', 'Kidney Function Test'], originalPrice: 1300, packagePrice: 999, status: 'active' },
]

export function TestPackages() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [showAdd, setShowAdd] = useState(false)
  const [pkgName, setPkgName] = useState('')
  const [pkgPrice, setPkgPrice] = useState('')
  const [selectedTests, setSelectedTests] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleTest = (id: string) =>
    setSelectedTests(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])

  const originalTotal = availableTests.filter(t => selectedTests.includes(t.id)).reduce((s, t) => s + t.price, 0)
  const discount = pkgPrice ? Math.max(0, originalTotal - parseInt(pkgPrice || '0')) : 0

  const handleSave = async () => {
    if (!pkgName || !pkgPrice || selectedTests.length === 0) { toast("Fill all required fields", "error"); return }
    setIsSubmitting(true)
    await new Promise(r => setTimeout(r, 1200))
    setIsSubmitting(false)
    toast("Package created successfully", "success")
    setShowAdd(false)
    setPkgName(''); setPkgPrice(''); setSelectedTests([])
  }

  return (
    <div className="flex flex-col bg-background min-h-screen w-full">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-4 md:pt-6 pb-3 md:pb-4 px-4 md:px-6 flex items-center gap-4 border-b border-gray-100/50">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[#172033] rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <h1 className="text-[18px] md:text-[22px] font-bold text-[#172033]">Test Packages</h1>
        <button onClick={() => setShowAdd(true)} className="ml-auto flex items-center gap-1.5 md:gap-2 bg-primary text-white text-[13px] md:text-[14px] font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-colors">
          <Plus className="w-4 h-4 md:w-5 md:h-5" />New<span className="hidden sm:inline"> Package</span>
        </button>
      </div>

      <div className="px-4 md:px-6 pt-5 md:pt-8 pb-4 md:pb-8 w-full max-w-7xl mx-auto">
        {/* Add Package Form */}
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl md:rounded-3xl border border-primary/20 shadow-sm p-4 md:p-6 lg:p-8 flex flex-col gap-4 md:gap-6 mb-6 md:mb-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] md:text-[18px] font-bold text-[#172033]">New Package</h3>
              <button onClick={() => setShowAdd(false)} className="p-1.5 md:p-2 rounded-full hover:bg-gray-100 text-[#667085] transition-colors"><X className="w-4 h-4 md:w-5 md:h-5" /></button>
            </div>

            <div className="flex flex-col gap-1.5 md:gap-2">
              <label className="text-[13px] md:text-[14px] font-semibold text-[#172033]">Package Name <span className="text-destructive">*</span></label>
              <input value={pkgName} onChange={e => setPkgName(e.target.value)} placeholder="e.g. Basic Health Package" className="px-4 md:px-5 py-3 md:py-3.5 bg-[#F7F8FA] border border-gray-200/60 rounded-xl md:rounded-2xl text-[15px] md:text-[16px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>

            <div className="flex flex-col gap-2 md:gap-3">
              <label className="text-[13px] md:text-[14px] font-semibold text-[#172033]">Select Tests <span className="text-destructive">*</span></label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                {availableTests.map(t => (
                  <button key={t.id} onClick={() => toggleTest(t.id)}
                    className={cn("flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl border text-left transition-all hover:border-primary/40", selectedTests.includes(t.id) ? "bg-primary/5 border-primary shadow-sm" : "bg-[#F7F8FA] border-gray-200/60")}>
                    <div className={cn("w-5 h-5 md:w-6 md:h-6 rounded-md md:rounded-lg border flex items-center justify-center transition-colors", selectedTests.includes(t.id) ? "bg-primary border-primary" : "bg-white border-gray-300")}>
                      {selectedTests.includes(t.id) && <Check className="w-3 h-3 md:w-4 md:h-4 text-white" strokeWidth={3} />}
                    </div>
                    <span className="flex-1 text-[14px] md:text-[15px] font-medium text-[#172033]">{t.name}</span>
                    <span className="text-[13px] md:text-[14px] text-[#667085]">₹{t.price}</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedTests.length > 0 && (
              <div className="bg-[#F7F8FA] rounded-xl md:rounded-2xl p-3 md:p-4 flex justify-between text-[13px] md:text-[15px]">
                <span className="text-[#667085]">Individual Total</span>
                <span className="font-bold text-[#172033]">₹{originalTotal}</span>
              </div>
            )}

            <div className="flex flex-col gap-1.5 md:gap-2">
              <label className="text-[13px] md:text-[14px] font-semibold text-[#172033]">Package Price (₹) <span className="text-destructive">*</span></label>
              <input value={pkgPrice} onChange={e => setPkgPrice(e.target.value)} type="number" placeholder="e.g. 999" className="px-4 md:px-5 py-3 md:py-3.5 bg-[#F7F8FA] border border-gray-200/60 rounded-xl md:rounded-2xl text-[15px] md:text-[16px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
              {discount > 0 && <p className="text-[12px] md:text-[14px] text-emerald-600 font-semibold mt-1">Customer saves ₹{discount}</p>}
            </div>

            <button onClick={handleSave} disabled={isSubmitting} className="bg-primary text-white font-semibold py-3.5 md:py-4 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 disabled:opacity-70 hover:bg-blue-700 active:bg-blue-800 transition-colors mt-2">
              {isSubmitting && <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />}
              {isSubmitting ? 'Saving…' : 'Create Package'}
            </button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 w-full">
          {existingPackages.map((pkg, i) => (
            <motion.div key={pkg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:border-primary/20 hover:shadow-md transition-all">
              <div className="px-4 md:px-5 pt-4 md:pt-5 pb-3 md:pb-4 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[15px] md:text-[17px] font-bold text-[#172033] leading-snug">{pkg.name}</p>
                    <p className="text-[12px] md:text-[14px] text-[#667085] mt-1 leading-relaxed">{pkg.tests.join(', ')}</p>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 text-[11px] md:text-[12px] font-semibold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full border border-emerald-200 shrink-0">Active</span>
                </div>
              </div>
              <div className="border-t border-gray-50 px-4 md:px-5 py-3 md:py-4 flex items-center justify-between bg-gray-50/50">
                <div>
                  <p className="text-[13px] md:text-[14px] text-[#98A2B3] line-through">₹{pkg.originalPrice}</p>
                  <p className="text-[18px] md:text-[20px] font-bold text-primary">₹{pkg.packagePrice}</p>
                </div>
                <p className="text-[12px] md:text-[14px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Save ₹{pkg.originalPrice - pkg.packagePrice}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {existingPackages.length === 0 && !showAdd && (
          <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
            <div className="w-14 h-14 md:w-20 md:h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-3 md:mb-5">
              <Package className="w-6 h-6 md:w-8 md:h-8 text-[#98A2B3]" />
            </div>
            <p className="text-[16px] md:text-[18px] font-semibold text-[#172033]">No Packages</p>
            <p className="text-[13px] md:text-[15px] text-[#667085] mt-1 md:mt-2">Bundle tests into packages for patients</p>
          </div>
        )}
      </div>
    </div>
  )
}
