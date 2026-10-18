import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowLeft, Search, FlaskConical, Edit2, ToggleLeft, ToggleRight, 
  Plus, FileText, Home, Trash2, X, Check, Loader2 
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/context/ToastContext"
import { labApi } from "@/services/labApi"
import { cn } from "@/lib/utils"
import { LabDepartmentIcon } from "@/components/lab/LabUI"
import { ConfirmationSheet } from "@/components/ui/ConfirmationSheet"

export function TestCatalog() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [tests, setTests] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  
  // Edit modal state
  const [editingTest, setEditingTest] = useState<any | null>(null)
  const [editPrice, setEditPrice] = useState('')
  const [editFee, setEditFee] = useState('')
  const [editTat, setEditTat] = useState('')
  const [editHomeAvailable, setEditHomeAvailable] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Delete state
  const [testToDelete, setTestToDelete] = useState<any | null>(null)

  useEffect(() => {
    fetchTests()
  }, [])

  const fetchTests = async () => {
    try {
      const res = await labApi.getHospitalLabMenu()
      setTests(res?.data || (Array.isArray(res) ? res : []))
    } catch (error) {
      toast("Failed to load catalog", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = tests.filter(t => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      t.platformTest?.name?.toLowerCase().includes(q) || 
      t.platformTest?.department?.name?.toLowerCase().includes(q) ||
      t.platformTest?.code?.toLowerCase().includes(q)
    )
  })

  const toggleStatus = async (id: string, active: boolean) => {
    try {
      await labApi.updateTestStatus(id, active)
      setTests(prev => prev.map(t => t.id === id ? { ...t, isActive: active } : t))
      toast(active ? "Test activated in catalog" : "Test paused in catalog", "success")
    } catch (error: any) {
      toast(error.message || 'Unable to update test status', "error")
    }
  }

  const openEditModal = (test: any) => {
    setEditingTest(test)
    setEditPrice(String(test.price || ''))
    setEditFee(String(test.homeCollectionFee || '0'))
    setEditTat(String(test.tatHours || '24'))
    setEditHomeAvailable(Boolean(test.isHomeCollectionAvailable))
  }

  const handleSaveEdit = async () => {
    if (!editingTest) return
    setIsSavingEdit(true)
    try {
      const priceNum = parseFloat(editPrice)
      const feeNum = parseFloat(editFee || '0')
      const tatNum = parseInt(editTat || '24')

      if (isNaN(priceNum) || priceNum <= 0) {
        toast("Please enter a valid price", "error")
        return
      }

      await labApi.saveHospitalLabTestsBatch([{
        platformTestId: editingTest.platformTestId,
        price: priceNum,
        tatHours: tatNum,
        isHomeCollectionAvailable: editHomeAvailable,
        homeCollectionFee: feeNum
      }])

      toast("Test offering updated in real time", "success")
      setEditingTest(null)
      await fetchTests()
    } catch (err: any) {
      toast(err.message || "Failed to update test", "error")
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleDeleteTest = async () => {
    if (!testToDelete) return
    try {
      await labApi.deleteTest(testToDelete.id)
      setTests(prev => prev.filter(t => t.id !== testToDelete.id))
      toast("Test removed from lab catalog", "success")
      setTestToDelete(null)
    } catch (err: any) {
      toast(err.message || "Failed to delete test offering", "error")
    }
  }

  return (
    <div className="flex flex-col bg-background min-h-screen w-full">
      {/* Sticky Top Header */}
      <div className="sticky top-0 z-30 bg-surface/98 backdrop-blur-md pt-4 md:pt-6 pb-3 md:pb-4 px-4 md:px-6 border-b border-border shadow-xs">
        <div className="flex items-center gap-4 mb-3 md:mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[#172033] dark:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <div>
            <h1 className="text-[18px] md:text-[22px] font-bold text-[#172033] dark:text-white">Diagnostic Test Catalog</h1>
            <p className="text-[11px] text-muted font-medium">Real-time test offerings synced with patient bookings</p>
          </div>
          <button onClick={() => navigate('/lab/add-test')} className="ml-auto flex items-center gap-1.5 md:gap-2 bg-primary text-white text-[13px] md:text-[14px] font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl shadow-xs hover:bg-blue-700 active:bg-blue-800 transition-colors cursor-pointer">
            <Plus className="w-4 h-4 md:w-5 md:h-5" />Add<span className="hidden sm:inline"> Tests</span>
          </button>
        </div>
        <div className="relative max-w-xl">
          <Search className="absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-[#98A2B3]" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search active tests by name, department, or test code…" 
            className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-surface border border-border rounded-xl md:rounded-2xl text-[14px] md:text-[15px] text-[#172033] dark:text-white placeholder:text-[#98A2B3] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-2xs transition-all" 
          />
        </div>
      </div>

      <div className="px-4 md:px-6 pt-4 md:pt-6 pb-20 w-full">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-16 md:py-24 text-center">
              <div className="w-14 h-14 md:w-20 md:h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-3 md:mb-5">
                <FlaskConical className="w-6 h-6 md:w-8 md:h-8 text-[#98A2B3]" />
              </div>
              <p className="text-[16px] md:text-[18px] font-semibold text-[#172033] dark:text-white">No Diagnostic Tests Found</p>
              <p className="text-[13px] md:text-[15px] text-[#667085] mt-1 md:mt-2">Add tests from platform catalog to start accepting orders</p>
              <button onClick={() => navigate('/lab/add-test')} className="mt-4 md:mt-6 bg-primary text-white font-semibold px-5 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-[14px] md:text-[15px] hover:bg-blue-700 transition-colors shadow-xs">
                Configure Lab Menu
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 md:gap-4 w-full">
              {filtered.map((test, i) => (
                <motion.div
                  key={test.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: i * 0.02 }}
                  className={cn(
                    "bg-surface rounded-2xl border shadow-xs p-4 md:p-5 transition-all hover:shadow-sm flex flex-col justify-between",
                    test.isActive ? "border-border" : "border-border opacity-70 bg-gray-50/40 dark:bg-gray-800/30"
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 md:gap-4">
                      <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-center shrink-0">
                          <LabDepartmentIcon icon={test.platformTest?.department?.icon} className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[14px] md:text-[16px] font-semibold text-[#172033] dark:text-white leading-snug truncate" title={test.platformTest?.name}>
                            {test.platformTest?.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[11px] md:text-[12px] font-medium bg-gray-100/80 dark:bg-gray-800 text-foreground/80 px-2 py-0.5 rounded-full border border-border truncate max-w-[130px]">
                              {test.platformTest?.department?.name}
                            </span>
                            <span className="text-[11px] md:text-[12px] text-[#98A2B3] flex items-center gap-1">
                              <FileText className="w-3 h-3" />{test.platformTest?.code}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Active toggle */}
                      <button 
                        onClick={() => toggleStatus(test.id, !test.isActive)} 
                        className="p-1 hover:opacity-80 transition-opacity cursor-pointer shrink-0"
                        title={test.isActive ? "Deactivate test" : "Activate test"}
                      >
                        {test.isActive
                          ? <ToggleRight className="w-7 h-7 md:w-8 md:h-8 text-primary" />
                          : <ToggleLeft className="w-7 h-7 md:w-8 md:h-8 text-[#98A2B3]" />
                        }
                      </button>
                    </div>
                    
                    {/* Tags */}
                    <div className="mt-4 flex flex-wrap gap-1.5 md:gap-2">
                      {test.isHomeCollectionAvailable && (
                        <span className="text-[11px] font-medium bg-green-50 text-green-700 border border-green-200 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                          <Home className="w-3 h-3" /> Home Collection
                        </span>
                      )}
                      {test.platformTest?.fastingRequired && (
                        <span className="text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-md">
                          Fasting Required
                        </span>
                      )}
                      <span className="text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-md">
                        TAT: {test.tatHours} hrs
                      </span>
                    </div>
                  </div>

                  {/* Pricing and Actions Bar */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/70">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-[#667085]">Patient Price</span>
                      <span className="text-[16px] md:text-[18px] font-bold text-[#172033] dark:text-white">₹{test.price}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(test)}
                        className="p-2 text-muted hover:text-primary hover:bg-primary/10 rounded-xl transition-colors cursor-pointer"
                        title="Edit Price & Settings"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setTestToDelete(test)}
                        className="p-2 text-muted hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors cursor-pointer"
                        title="Remove Test from Catalog"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Edit Test Pricing & Settings Modal */}
      <AnimatePresence>
        {editingTest && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-2xl md:rounded-3xl border border-border p-5 md:p-6 max-w-md w-full flex flex-col gap-4 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="font-bold text-[#172033] dark:text-white text-base">Edit Diagnostic Test</h3>
                  <p className="text-xs text-muted truncate max-w-xs">{editingTest.platformTest?.name}</p>
                </div>
                <button onClick={() => setEditingTest(null)} className="p-1 rounded-lg hover:bg-gray-100 text-muted">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-foreground">Patient Price (₹) *</label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={e => setEditPrice(e.target.value)}
                    className="px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm font-semibold text-foreground outline-none focus:border-primary"
                    placeholder="e.g. 500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-foreground">Turnaround Time (Hours) *</label>
                  <input
                    type="number"
                    value={editTat}
                    onChange={e => setEditTat(e.target.value)}
                    className="px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm font-semibold text-foreground outline-none focus:border-primary"
                    placeholder="e.g. 24"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl border border-border">
                  <div>
                    <p className="text-xs font-bold text-foreground">Home Sample Collection</p>
                    <p className="text-[11px] text-muted">Eligible for phlebotomist home visit</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditHomeAvailable(!editHomeAvailable)}
                    className={cn(
                      "w-6 h-6 rounded-md border flex items-center justify-center transition-all",
                      editHomeAvailable ? "bg-primary border-primary text-white" : "bg-white border-gray-300"
                    )}
                  >
                    {editHomeAvailable && <Check className="w-4 h-4" strokeWidth={3} />}
                  </button>
                </div>

                {editHomeAvailable && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-foreground">Home Collection Fee (₹)</label>
                    <input
                      type="number"
                      value={editFee}
                      onChange={e => setEditFee(e.target.value)}
                      className="px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm font-semibold text-foreground outline-none focus:border-primary"
                      placeholder="e.g. 150"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingTest(null)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-700 transition-colors disabled:opacity-70 shadow-xs cursor-pointer"
                >
                  {isSavingEdit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSavingEdit ? "Updating…" : "Update Test"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Test Confirmation Sheet */}
      <ConfirmationSheet
        isOpen={Boolean(testToDelete)}
        onClose={() => setTestToDelete(null)}
        title="Remove Test Offering?"
        description={`Are you sure you want to remove "${testToDelete?.platformTest?.name}" from your active lab menu? Patient apps will immediately cease offering this test for your lab.`}
        confirmLabel="Remove Test"
        cancelLabel="Keep in Menu"
        isDestructive
        onConfirm={handleDeleteTest}
      />
    </div>
  )
}
