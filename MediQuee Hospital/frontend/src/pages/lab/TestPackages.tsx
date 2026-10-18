import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowLeft, Loader2, Package, Plus, X, Check, 
  Trash2, Edit2, Sparkles, Tag, ShieldCheck 
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/context/ToastContext"
import { labApi } from "@/services/labApi"
import { cn } from "@/lib/utils"
import { ConfirmationSheet } from "@/components/ui/ConfirmationSheet"

export function TestPackages() {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [showAdd, setShowAdd] = useState(false)
  const [editingPackage, setEditingPackage] = useState<any | null>(null)
  
  const [pkgName, setPkgName] = useState('')
  const [pkgPrice, setPkgPrice] = useState('')
  const [selectedTests, setSelectedTests] = useState<string[]>([])
  const [availableTests, setAvailableTests] = useState<{ id: string; name: string; price: number }[]>([])
  
  const [existingPackages, setExistingPackages] = useState<{
    id: string; name: string; tests: string[];
    originalPrice: number; packagePrice: number; status: string;
  }[]>([])
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [packageToDelete, setPackageToDelete] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchPackagesAndTests = async () => {
    try {
      const res = await labApi.getHospitalLabMenu()
      if (res && res.data) {
        const formattedTests = res.data.map((t: any) => ({
          id: t.id,
          name: t.platformTest?.name || 'Unknown Test',
          price: t.price || 0
        }))
        setAvailableTests(formattedTests)
      }

      const pkgRes = await labApi.getHospitalLabPackages()
      if (pkgRes && pkgRes.data) {
        setExistingPackages(pkgRes.data)
      }
    } catch (error) {
      console.error("Failed to fetch lab tests or packages:", error)
      toast("Unable to sync packages from database", "error")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPackagesAndTests()
  }, [])

  const toggleTest = (id: string) =>
    setSelectedTests(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])

  const originalTotal = availableTests.filter(t => selectedTests.includes(t.id)).reduce((s, t) => s + t.price, 0)
  const discount = pkgPrice ? Math.max(0, originalTotal - parseInt(pkgPrice || '0')) : 0

  const handleOpenAdd = () => {
    setEditingPackage(null)
    setPkgName('')
    setPkgPrice('')
    setSelectedTests([])
    setShowAdd(true)
  }

  const handleOpenEdit = (pkg: any) => {
    setEditingPackage(pkg)
    setPkgName(pkg.name)
    setPkgPrice(String(pkg.packagePrice))
    // Match test names to IDs
    const matchedIds = availableTests
      .filter(t => pkg.tests.includes(t.name) || pkg.tests.includes(t.id))
      .map(t => t.id)
    setSelectedTests(matchedIds.length > 0 ? matchedIds : [])
    setShowAdd(true)
  }

  const handleSave = async () => {
    if (!pkgName || !pkgPrice) { 
      toast("Fill in package name and price", "error"); 
      return 
    }
    
    setIsSubmitting(true)
    try {
      const testsNames = availableTests.filter(t => selectedTests.includes(t.id)).map(t => t.name)
      const calculatedOriginalTotal = originalTotal > 0 ? originalTotal : parseInt(pkgPrice)

      if (editingPackage) {
        // Update existing package in database
        await labApi.updatePackage(editingPackage.id, {
          name: pkgName,
          originalPrice: calculatedOriginalTotal,
          packagePrice: parseInt(pkgPrice),
          tests: testsNames.length > 0 ? testsNames : editingPackage.tests
        })
        toast("Package updated successfully in database", "success")
      } else {
        if (selectedTests.length === 0) {
          toast("Please select at least one diagnostic test for this package", "error")
          setIsSubmitting(false)
          return
        }
        // Create new package in database
        await labApi.createPackage({ 
          name: pkgName, 
          originalPrice: calculatedOriginalTotal, 
          packagePrice: parseInt(pkgPrice), 
          tests: testsNames 
        })
        toast("Diagnostic package created successfully", "success")
      }
      
      await fetchPackagesAndTests()
      setShowAdd(false)
      setEditingPackage(null)
      setPkgName('')
      setPkgPrice('')
      setSelectedTests([])
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to save package', "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeletePackage = async () => {
    if (!packageToDelete) return
    try {
      await labApi.deletePackage(packageToDelete.id)
      setExistingPackages(prev => prev.filter(p => p.id !== packageToDelete.id))
      toast("Package deleted successfully from catalog", "success")
      setPackageToDelete(null)
    } catch (err: any) {
      toast(err.message || "Failed to delete package", "error")
    }
  }

  return (
    <div className="flex flex-col bg-background min-h-screen w-full">
      {/* Sticky Top Header */}
      <div className="sticky top-0 z-30 bg-surface/98 backdrop-blur-md pt-4 md:pt-6 pb-3 md:pb-4 px-4 md:px-6 flex items-center gap-4 border-b border-border shadow-xs">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[#172033] dark:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <div>
          <h1 className="text-[18px] md:text-[22px] font-bold text-[#172033] dark:text-white">Health Test Packages</h1>
          <p className="text-[11px] text-muted font-medium">Bundled diagnostic health checkups with direct DB synchronization</p>
        </div>
        <button 
          onClick={handleOpenAdd} 
          className="ml-auto flex items-center gap-1.5 md:gap-2 bg-primary text-white text-[13px] md:text-[14px] font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl shadow-xs hover:bg-blue-700 active:bg-blue-800 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5" />New<span className="hidden sm:inline"> Package</span>
        </button>
      </div>

      <div className="px-4 md:px-6 pt-5 md:pt-8 pb-20 w-full max-w-7xl mx-auto">
        {/* Add/Edit Package Form Modal / Inline */}
        <AnimatePresence>
          {showAdd && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className="bg-surface rounded-2xl md:rounded-3xl border border-primary/30 shadow-md p-5 md:p-7 flex flex-col gap-4 md:gap-6 mb-6 md:mb-8 max-w-3xl mx-auto"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                  <h3 className="text-[16px] md:text-[18px] font-bold text-[#172033] dark:text-white">
                    {editingPackage ? "Edit Diagnostic Package" : "Create New Health Package"}
                  </h3>
                </div>
                <button 
                  onClick={() => { setShowAdd(false); setEditingPackage(null) }} 
                  className="p-1.5 rounded-full hover:bg-gray-100 text-[#667085] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[#172033] dark:text-gray-200">Package Name <span className="text-destructive">*</span></label>
                <input 
                  value={pkgName} 
                  onChange={e => setPkgName(e.target.value)} 
                  placeholder="e.g. Master Health Checkup (Comprehensive)" 
                  className="px-4 py-3 bg-background border border-border rounded-xl text-[15px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-foreground" 
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-semibold text-[#172033] dark:text-gray-200">Include Diagnostic Tests <span className="text-destructive">*</span></label>
                  <span className="text-xs text-muted font-medium">{selectedTests.length} tests selected</span>
                </div>
                
                {availableTests.length === 0 ? (
                  <p className="text-[13px] text-muted p-3 bg-gray-50 rounded-xl">No active tests found in catalog. Add tests first.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
                    {availableTests.map(t => (
                      <button 
                        type="button"
                        key={t.id} 
                        onClick={() => toggleTest(t.id)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer",
                          selectedTests.includes(t.id) ? "bg-primary/10 border-primary text-primary" : "bg-background border-border hover:border-border/80"
                        )}
                      >
                        <div className={cn(
                          "w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0",
                          selectedTests.includes(t.id) ? "bg-primary border-primary" : "bg-surface border-gray-300"
                        )}>
                          {selectedTests.includes(t.id) && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                        </div>
                        <span className="flex-1 text-[13px] font-semibold text-foreground truncate">{t.name}</span>
                        <span className="text-[12px] font-bold text-muted shrink-0">₹{t.price}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedTests.length > 0 && (
                <div className="bg-gray-50/80 dark:bg-gray-800/40 rounded-xl p-3 flex justify-between text-[13px] border border-border/50">
                  <span className="text-muted font-medium">Individual Tests Total Price</span>
                  <span className="font-bold text-foreground">₹{originalTotal}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-[#172033] dark:text-gray-200">Package Offer Price (₹) <span className="text-destructive">*</span></label>
                <input 
                  value={pkgPrice} 
                  onChange={e => setPkgPrice(e.target.value)} 
                  type="number" 
                  placeholder="e.g. 999" 
                  className="px-4 py-3 bg-background border border-border rounded-xl text-[15px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-bold text-primary" 
                />
                {discount > 0 && (
                  <p className="text-[12px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" /> Patient saves ₹{discount} with this bundle
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAdd(false); setEditingPackage(null) }}
                  className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-muted hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleSave} 
                  disabled={isSubmitting} 
                  className="flex-[2] bg-primary text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-70 hover:bg-blue-700 active:bg-blue-800 transition-colors cursor-pointer shadow-xs"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isSubmitting ? 'Saving to Database…' : (editingPackage ? 'Update Package' : 'Publish Package')}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Existing Packages Grid */}
        {isLoading ? (
          <div className="flex justify-center p-16">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {existingPackages.map((pkg, i) => (
              <motion.div 
                key={pkg.id} 
                initial={{ opacity: 0, y: 6 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.05 }}
                className="bg-surface rounded-2xl md:rounded-3xl border border-border shadow-xs overflow-hidden flex flex-col justify-between hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div className="p-4 md:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                          <Package className="w-4 h-4" />
                        </div>
                        <p className="text-[15px] md:text-[17px] font-bold text-[#172033] dark:text-white leading-snug">{pkg.name}</p>
                      </div>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0">
                        Active
                      </span>
                    </div>

                    <p className="text-[12px] md:text-[13px] text-[#667085] mt-2.5 leading-relaxed line-clamp-2">
                      {Array.isArray(pkg.tests) ? pkg.tests.join(', ') : pkg.tests}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/60">
                    <div>
                      {pkg.originalPrice > pkg.packagePrice && (
                        <p className="text-[12px] text-[#98A2B3] line-through">₹{pkg.originalPrice}</p>
                      )}
                      <p className="text-[18px] md:text-[20px] font-black text-primary">₹{pkg.packagePrice}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(pkg)}
                        className="p-2 text-muted hover:text-primary hover:bg-primary/10 rounded-xl transition-colors cursor-pointer"
                        title="Edit Package"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPackageToDelete(pkg)}
                        className="p-2 text-muted hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors cursor-pointer"
                        title="Delete Package"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {pkg.originalPrice > pkg.packagePrice && (
                  <div className="bg-emerald-50/70 dark:bg-emerald-950/20 px-4 py-2 border-t border-emerald-100 flex items-center justify-between text-xs font-semibold text-emerald-700">
                    <span>Bundle Discount</span>
                    <span>Save ₹{pkg.originalPrice - pkg.packagePrice}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {existingPackages.length === 0 && !showAdd && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-3">
              <Package className="w-8 h-8 text-[#98A2B3]" />
            </div>
            <p className="text-[16px] md:text-[18px] font-bold text-[#172033] dark:text-white">No Diagnostic Packages Found</p>
            <p className="text-[13px] md:text-[14px] text-[#667085] mt-1">Create comprehensive health checkup packages to attract more patient bookings.</p>
            <button 
              onClick={handleOpenAdd} 
              className="mt-4 bg-primary text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
            >
              Create First Package
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Sheet */}
      <ConfirmationSheet
        isOpen={Boolean(packageToDelete)}
        onClose={() => setPackageToDelete(null)}
        title="Delete Test Package?"
        description={`Are you sure you want to delete "${packageToDelete?.name}"? It will immediately be removed from the patient app catalog.`}
        confirmLabel="Delete Package"
        cancelLabel="Keep Package"
        isDestructive
        onConfirm={handleDeletePackage}
      />
    </div>
  )
}
