import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Search, FlaskConical, Edit2, ToggleLeft, ToggleRight, Plus, FileText, Home } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/context/ToastContext"
import { labApi } from "@/services/labApi"
import { cn } from "@/lib/utils"

export function TestCatalog() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [tests, setTests] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTests()
  }, [])

  const fetchTests = async () => {
    try {
      const res = await labApi.getHospitalLabMenu()
      setTests(res.data)
    } catch (error) {
      toast("Failed to load catalog", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = tests.filter(t => {
    if (!search) return true
    const q = search.toLowerCase()
    return t.platformTest?.name?.toLowerCase().includes(q) || t.platformTest?.department?.name?.toLowerCase().includes(q)
  })

  const toggleStatus = async (id: string, active: boolean) => {
    try {
      await labApi.updateTestStatus(id, active)
      setTests(prev => prev.map(t => t.id === id ? { ...t, isActive: active } : t))
    } catch (error: any) {
      toast(error.message || 'Unable to update test status', "error")
    }
  }

  return (
    <div className="flex flex-col bg-background min-h-screen w-full">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-4 md:pt-6 pb-3 md:pb-4 px-4 md:px-6 border-b border-border/50">
        <div className="flex items-center gap-4 mb-3 md:mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[#172033] rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <h1 className="text-[18px] md:text-[22px] font-bold text-[#172033]">Lab Catalog</h1>
          <button onClick={() => navigate('/lab/add-test')} className="ml-auto flex items-center gap-1.5 md:gap-2 bg-primary text-white text-[13px] md:text-[14px] font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-colors">
            <Plus className="w-4 h-4 md:w-5 md:h-5" />Add<span className="hidden sm:inline"> Tests</span>
          </button>
        </div>
        <div className="relative max-w-xl">
          <Search className="absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-[#98A2B3]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tests…" className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-surface border border-border/60 rounded-xl md:rounded-2xl text-[14px] md:text-[15px] text-[#172033] placeholder:text-[#98A2B3] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm transition-all" />
        </div>
      </div>

      <div className="px-4 md:px-6 pt-4 md:pt-6 pb-4 md:pb-8 w-full">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-16 md:py-24 text-center">
              <div className="w-14 h-14 md:w-20 md:h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-3 md:mb-5">
                <FlaskConical className="w-6 h-6 md:w-8 md:h-8 text-[#98A2B3]" />
              </div>
              <p className="text-[16px] md:text-[18px] font-semibold text-[#172033]">No Tests Found</p>
              <p className="text-[13px] md:text-[15px] text-[#667085] mt-1 md:mt-2">Add tests from platform catalog to start accepting orders</p>
              <button onClick={() => navigate('/lab/add-test')} className="mt-4 md:mt-6 bg-primary text-white font-semibold px-5 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-[14px] md:text-[15px] hover:bg-blue-700 transition-colors">Configure Lab Menu</button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 w-full">
              {filtered.map((test, i) => (
                <motion.div
                  key={test.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: i * 0.02 }}
                  className={cn("bg-surface rounded-2xl border shadow-sm p-4 md:p-5 transition-all hover:shadow-md", test.isActive ? "border-border" : "border-border opacity-60")}
                >
                  <div className="flex items-start justify-between gap-2 md:gap-4">
                    <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/5 rounded-xl border border-primary/10 flex items-center justify-center shrink-0">
                        {test.platformTest?.department?.icon ? (
                          <span className="text-[18px] md:text-[20px]">{test.platformTest.department.icon}</span>
                        ) : (
                          <FlaskConical className="w-5 h-5 md:w-6 md:h-6 text-primary" strokeWidth={1.5} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] md:text-[16px] font-semibold text-[#172033] leading-snug truncate" title={test.platformTest?.name}>{test.platformTest?.name}</p>
                        <div className="flex items-center gap-2 mt-1 md:mt-1.5 flex-wrap">
                          <span className="text-[11px] md:text-[12px] font-medium bg-gray-50 text-foreground/80 px-2 py-0.5 rounded-full border border-border truncate max-w-[120px]">
                            {test.platformTest?.department?.name}
                          </span>
                          <span className="text-[11px] md:text-[12px] text-[#98A2B3] flex items-center gap-1"><FileText className="w-3 h-3" />{test.platformTest?.code}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2 shrink-0">
                      <button onClick={() => toggleStatus(test.id, !test.isActive)} className="p-1 hover:opacity-80 transition-opacity">
                        {test.isActive
                          ? <ToggleRight className="w-7 h-7 md:w-8 md:h-8 text-primary" />
                          : <ToggleLeft className="w-7 h-7 md:w-8 md:h-8 text-[#98A2B3]" />
                        }
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    {test.isHomeCollectionAvailable && <span className="text-[11px] font-medium bg-green-50 text-green-700 px-2.5 py-1 rounded-md border border-green-100 flex items-center gap-1.5"><Home className="w-3.5 h-3.5" />Home Collection</span>}
                    {test.platformTest?.fastingRequired && <span className="text-[11px] font-medium bg-amber-50 text-amber-700 px-2.5 py-1 rounded-md border border-amber-100">Fasting Required</span>}
                    <span className="text-[11px] font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-100">TAT: {test.tatHours} hrs</span>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 md:pt-4 border-t border-border">
                    <div className="flex flex-col">
                      <span className="text-[11px] md:text-[12px] text-[#667085]">Patient Price</span>
                      <span className="text-[16px] md:text-[18px] font-bold text-[#172033]">₹{test.price}</span>
                    </div>
                    {test.isHomeCollectionAvailable && (
                      <div className="flex flex-col items-end">
                        <span className="text-[11px] md:text-[12px] text-[#667085]">Collection Fee</span>
                        <span className="text-[14px] md:text-[15px] font-semibold text-green-700">+₹{test.homeCollectionFee}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
