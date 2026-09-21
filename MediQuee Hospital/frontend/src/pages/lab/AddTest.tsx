import { useState, useEffect } from "react"
import { ArrowLeft, Loader2, Search, Check, FileText, IndianRupee, Clock, Home } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/context/ToastContext"
import { labApi } from "@/services/labApi"
import { cn } from "@/lib/utils"

export function AddTest() {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [step, setStep] = useState(1) // 1: Department, 2: Tests, 3: Configure
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [departments, setDepartments] = useState<any[]>([])
  const [platformTests, setPlatformTests] = useState<any[]>([])
  
  // Selections
  const [selectedDeptId, setSelectedDeptId] = useState<string>('')
  const [selectedTestIds, setSelectedTestIds] = useState<Set<string>>(new Set())
  
  // Configurations: { platformTestId: { price, tatHours, isHomeCollectionAvailable, homeCollectionFee } }
  const [configs, setConfigs] = useState<Record<string, any>>({})

  // Fetch departments on mount
  useEffect(() => {
    labApi.getPlatformLabDepartments()
      .then(res => setDepartments(res.data))
      .catch(() => toast("Failed to load departments", "error"))
  }, [])

  // Fetch tests when department selected
  useEffect(() => {
    if (selectedDeptId) {
      labApi.getPlatformLabTests(selectedDeptId)
        .then(res => setPlatformTests(res.data))
        .catch(() => toast("Failed to load tests", "error"))
    }
  }, [selectedDeptId])

  const handleNext = () => {
    if (step === 1 && !selectedDeptId) {
      return toast("Please select a department", "error")
    }
    if (step === 2 && selectedTestIds.size === 0) {
      return toast("Please select at least one test", "error")
    }
    if (step === 2) {
      // Initialize configs for selected tests
      const newConfigs = { ...configs }
      selectedTestIds.forEach(id => {
        if (!newConfigs[id]) {
          newConfigs[id] = { price: '', tatHours: '24', isHomeCollectionAvailable: false, homeCollectionFee: '0' }
        }
      })
      setConfigs(newConfigs)
    }
    setStep(s => Math.min(s + 1, 3))
  }

  const handleBack = () => {
    if (step > 1) setStep(s => s - 1)
    else navigate(-1)
  }

  const toggleTest = (id: string) => {
    const newSet = new Set(selectedTestIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedTestIds(newSet)
  }

  const updateConfig = (id: string, field: string, value: any) => {
    setConfigs(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }))
  }

  const handleSubmit = async () => {
    // Validate configs
    const payload = []
    for (const id of selectedTestIds) {
      const cfg = configs[id]
      if (!cfg.price) return toast("Please enter price for all tests", "error")
      payload.push({
        platformTestId: id,
        price: Number(cfg.price),
        tatHours: Number(cfg.tatHours),
        isHomeCollectionAvailable: cfg.isHomeCollectionAvailable,
        homeCollectionFee: Number(cfg.homeCollectionFee || 0)
      })
    }

    setIsSubmitting(true)
    try {
      await labApi.saveHospitalLabTestsBatch(payload)
      toast("Tests added to catalog successfully", "success")
      navigate(-1)
    } catch (error: any) {
      toast(error.message || 'Failed to add tests', "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col bg-background min-h-screen w-full">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-4 md:pt-6 pb-3 md:pb-4 px-4 md:px-6 flex items-center gap-4 border-b border-border/50">
        <button onClick={handleBack} className="p-2 -ml-2 text-[#172033] rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-[18px] md:text-[22px] font-bold text-[#172033]">Configure Lab Menu</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn("text-[12px] font-medium transition-colors", step >= 1 ? "text-primary" : "text-muted/70")}>1. Department</span>
            <div className={cn("w-4 h-0.5 rounded-full transition-colors", step >= 2 ? "bg-primary" : "bg-gray-200")} />
            <span className={cn("text-[12px] font-medium transition-colors", step >= 2 ? "text-primary" : "text-muted/70")}>2. Select Tests</span>
            <div className={cn("w-4 h-0.5 rounded-full transition-colors", step >= 3 ? "bg-primary" : "bg-gray-200")} />
            <span className={cn("text-[12px] font-medium transition-colors", step >= 3 ? "text-primary" : "text-muted/70")}>3. Pricing & TAT</span>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 md:px-6 pt-6 pb-28 max-w-3xl mx-auto w-full">
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-[16px] md:text-[18px] font-semibold text-[#172033] mb-4">Select Department</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {departments.map(d => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDeptId(d.id)}
                  className={cn(
                    "flex flex-col items-start p-4 md:p-5 rounded-2xl border transition-all text-left w-full",
                    selectedDeptId === d.id 
                      ? "bg-primary/5 border-primary shadow-sm" 
                      : "bg-surface border-border/60 hover:border-primary/40 hover:shadow-sm"
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="text-[18px] md:text-[20px]">{d.icon || '🔬'}</span>
                    <div className={cn("w-5 h-5 rounded-full border flex items-center justify-center transition-colors", selectedDeptId === d.id ? "border-primary bg-primary" : "border-gray-300")}>
                      {selectedDeptId === d.id && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </div>
                  <h3 className="font-semibold text-[#172033] text-[15px]">{d.name}</h3>
                  <p className="text-[13px] text-[#667085] mt-1 line-clamp-2">{d.description}</p>
                  <span className="text-[12px] font-medium text-primary mt-3 bg-primary/10 px-2.5 py-1 rounded-md">{d.testCount} Standard Tests</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] md:text-[18px] font-semibold text-[#172033]">Select Master Tests</h2>
              <span className="text-[13px] font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">{selectedTestIds.size} Selected</span>
            </div>
            
            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#98A2B3]" />
              <input placeholder="Search platform tests..." className="w-full pl-10 pr-4 py-3 bg-surface border border-border/60 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm" />
            </div>

            <div className="space-y-3">
              {platformTests.map(t => (
                <button
                  key={t.id}
                  onClick={() => toggleTest(t.id)}
                  className={cn(
                    "flex items-center p-4 rounded-xl border transition-all text-left w-full gap-4",
                    selectedTestIds.has(t.id) 
                      ? "bg-primary/5 border-primary shadow-sm" 
                      : "bg-surface border-border/60 hover:border-primary/40 hover:shadow-sm"
                  )}
                >
                  <div className={cn("w-5 h-5 rounded flex-shrink-0 border flex items-center justify-center transition-colors", selectedTestIds.has(t.id) ? "border-primary bg-primary" : "border-gray-300")}>
                    {selectedTestIds.has(t.id) && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#172033] text-[15px] truncate">{t.name}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-[12px] font-medium text-[#667085] flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{t.code}</span>
                      <span className="text-[12px] font-medium text-[#667085]">Sample: {t.sampleType}</span>
                      {t.canBeCollectedAtHome && <span className="text-[11px] font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">Home Collection</span>}
                      {t.fastingRequired && <span className="text-[11px] font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100">Fasting Required</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-[16px] md:text-[18px] font-semibold text-[#172033] mb-4">Configure Pricing & TAT</h2>
            <div className="space-y-6">
              {Array.from(selectedTestIds).map(id => {
                const test = platformTests.find(t => t.id === id)
                if (!test) return null
                const cfg = configs[id]

                return (
                  <div key={id} className="bg-surface border border-border/60 rounded-2xl p-4 md:p-5 shadow-sm space-y-4">
                    <div>
                      <p className="font-semibold text-[#172033] text-[15px]">{test.name}</p>
                      <p className="text-[12px] text-[#667085] mt-1">{test.department?.name} • Code: {test.code}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[12px] font-medium text-[#667085] flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5" /> Price</label>
                        <input type="number" value={cfg.price} onChange={e => updateConfig(id, 'price', e.target.value)} placeholder="0.00" className="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg outline-none focus:border-primary focus:bg-surface transition-colors text-[14px]" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[12px] font-medium text-[#667085] flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> TAT (Hours)</label>
                        <input type="number" value={cfg.tatHours} onChange={e => updateConfig(id, 'tatHours', e.target.value)} placeholder="24" className="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg outline-none focus:border-primary focus:bg-surface transition-colors text-[14px]" />
                      </div>
                    </div>

                    <div className={cn("p-4 rounded-xl border", test.canBeCollectedAtHome ? "bg-green-50/50 border-green-100" : "bg-gray-50 border-border opacity-60")}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Home className={cn("w-4 h-4", test.canBeCollectedAtHome ? "text-green-600" : "text-muted")} />
                          <span className={cn("text-[13px] font-medium", test.canBeCollectedAtHome ? "text-green-800" : "text-gray-600")}>Home Collection</span>
                        </div>
                        {test.canBeCollectedAtHome && (
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={cfg.isHomeCollectionAvailable} onChange={e => updateConfig(id, 'isHomeCollectionAvailable', e.target.checked)} className="sr-only peer" />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                          </label>
                        )}
                        {!test.canBeCollectedAtHome && (
                          <span className="text-[11px] font-semibold text-muted bg-gray-200 px-2 py-0.5 rounded-full">Not Supported</span>
                        )}
                      </div>
                      
                      {cfg.isHomeCollectionAvailable && test.canBeCollectedAtHome && (
                        <div className="mt-3 space-y-1.5 animate-in fade-in slide-in-from-top-2">
                          <label className="text-[12px] font-medium text-green-800">Home Collection Fee (₹)</label>
                          <input type="number" value={cfg.homeCollectionFee} onChange={e => updateConfig(id, 'homeCollectionFee', e.target.value)} placeholder="e.g. 150" className="w-full px-3 py-2 bg-surface border border-green-200 focus:border-green-400 focus:ring-2 focus:ring-green-400/20 rounded-lg outline-none transition-colors text-[14px]" />
                        </div>
                      )}
                      {!test.canBeCollectedAtHome && (
                        <p className="text-[12px] text-muted mt-1">This diagnostic test requires hospital equipment and cannot be collected at home.</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-background/95 backdrop-blur-md border-t border-border/50 pb-safe z-20">
        <div className="flex gap-3 md:gap-4 max-w-3xl mx-auto w-full">
          {step < 3 ? (
            <button onClick={handleNext} className="w-full bg-primary text-white font-semibold py-3.5 md:py-4 rounded-xl md:rounded-2xl hover:bg-blue-700 transition-colors shadow-sm">
              Continue
            </button>
          ) : (
            <button disabled={isSubmitting} onClick={handleSubmit} className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3.5 md:py-4 rounded-xl md:rounded-2xl hover:bg-blue-700 disabled:opacity-70 transition-colors shadow-sm">
              {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
              {isSubmitting ? 'Saving Tests...' : 'Confirm & Save Tests'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
