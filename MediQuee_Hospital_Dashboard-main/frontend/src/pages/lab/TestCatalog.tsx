import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Search, FlaskConical, Edit2, ToggleLeft, ToggleRight, Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"

const basePath = import.meta.env.BASE_URL;

const initialTests = [
  { id: 't1', name: 'Complete Blood Count (CBC)', category: 'Blood', sample: 'Blood', price: 300, tat: '4 hrs', status: true, icon: `${basePath}png/025-pcr-test.png` },
  { id: 't2', name: 'Lipid Profile', category: 'Blood', sample: 'Blood', price: 550, tat: '6 hrs', status: true, icon: `${basePath}png/015-body-scan.png` },
  { id: 't3', name: 'Thyroid Profile (T3,T4,TSH)', category: 'Blood', sample: 'Blood', price: 650, tat: '24 hrs', status: true, icon: `${basePath}png/093-dna.png` },
  { id: 't4', name: 'HbA1c', category: 'Blood', sample: 'Blood', price: 450, tat: '24 hrs', status: true, icon: `${basePath}png/050-bacteria.png` },
  { id: 't5', name: 'Liver Function Test', category: 'Blood', sample: 'Blood', price: 750, tat: '6 hrs', status: true, icon: `${basePath}png/011-liver.png` },
  { id: 't6', name: 'Urine Routine Examination', category: 'Urine', sample: 'Urine', price: 200, tat: '2 hrs', status: false, icon: `${basePath}png/004-infection.png` },
  { id: 't7', name: 'X-Ray Chest PA View', category: 'Imaging', sample: 'Imaging', price: 350, tat: '1 hr', status: true, icon: `${basePath}png/008-lungs.png` },
]

const categoryColors: Record<string, string> = {
  Blood: 'bg-red-50 text-red-600 border-red-100',
  Urine: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  Pathology: 'bg-purple-50 text-purple-600 border-purple-100',
  Imaging: 'bg-blue-50 text-blue-600 border-blue-100',
}

export function TestCatalog() {
  const navigate = useNavigate()
  const [tests, setTests] = useState(initialTests)
  const [search, setSearch] = useState('')

  const filtered = tests.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase())
  )

  const toggleStatus = (id: string) =>
    setTests(prev => prev.map(t => t.id === id ? { ...t, status: !t.status } : t))

  return (
    <div className="flex flex-col bg-background min-h-screen w-full">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-4 md:pt-6 pb-3 md:pb-4 px-4 md:px-6 border-b border-gray-100/50">
        <div className="flex items-center gap-4 mb-3 md:mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[#172033] rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <h1 className="text-[18px] md:text-[22px] font-bold text-[#172033]">Test Catalog</h1>
          <button onClick={() => navigate('/lab/add-test')} className="ml-auto flex items-center gap-1.5 md:gap-2 bg-primary text-white text-[13px] md:text-[14px] font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-colors">
            <Plus className="w-4 h-4 md:w-5 md:h-5" />Add<span className="hidden sm:inline"> Test</span>
          </button>
        </div>
        <div className="relative max-w-xl">
          <Search className="absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-[#98A2B3]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tests…" className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-white border border-gray-200/60 rounded-xl md:rounded-2xl text-[14px] md:text-[15px] text-[#172033] placeholder:text-[#98A2B3] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm transition-all" />
        </div>
      </div>

      <div className="px-4 md:px-6 pt-4 md:pt-6 pb-4 md:pb-8 w-full">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-16 md:py-24 text-center">
              <div className="w-14 h-14 md:w-20 md:h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-3 md:mb-5">
                <FlaskConical className="w-6 h-6 md:w-8 md:h-8 text-[#98A2B3]" />
              </div>
              <p className="text-[16px] md:text-[18px] font-semibold text-[#172033]">No Tests Found</p>
              <p className="text-[13px] md:text-[15px] text-[#667085] mt-1 md:mt-2">Add tests to start accepting orders</p>
              <button onClick={() => navigate('/lab/add-test')} className="mt-4 md:mt-6 bg-primary text-white font-semibold px-5 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-[14px] md:text-[15px] hover:bg-blue-700 transition-colors">Add Test</button>
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
                  transition={{ delay: i * 0.04 }}
                  className={cn("bg-white rounded-2xl border shadow-sm p-4 md:p-5 transition-all hover:shadow-md", test.status ? "border-gray-100 hover:border-primary/20" : "border-gray-100 opacity-60")}
                >
                  <div className="flex items-start justify-between gap-2 md:gap-4">
                    <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                      <div className="w-9 h-9 md:w-12 md:h-12 bg-primary/5 rounded-xl border border-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                        {test.icon ? (
                          <img src={test.icon} alt={test.name} className="w-6 h-6 md:w-7 md:h-7 object-contain drop-shadow-sm" />
                        ) : (
                          <FlaskConical className="w-4 h-4 md:w-6 md:h-6 text-primary" strokeWidth={1.5} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] md:text-[16px] font-semibold text-[#172033] leading-snug truncate">{test.name}</p>
                        <div className="flex items-center gap-2 mt-1 md:mt-1.5 flex-wrap">
                          <span className={cn("text-[11px] md:text-[12px] font-semibold px-2 py-0.5 rounded-full border", categoryColors[test.category] ?? 'bg-gray-50 text-gray-600 border-gray-100')}>
                            {test.category}
                          </span>
                          <span className="text-[11px] md:text-[12px] text-[#98A2B3]">{test.sample} · {test.tat}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2 shrink-0">
                      <button onClick={() => {}} className="p-1.5 md:p-2 rounded-xl hover:bg-gray-100 text-[#667085] transition-colors">
                        <Edit2 className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                      <button onClick={() => toggleStatus(test.id)} className="p-1 hover:opacity-80 transition-opacity">
                        {test.status
                          ? <ToggleRight className="w-7 h-7 md:w-8 md:h-8 text-primary" />
                          : <ToggleLeft className="w-7 h-7 md:w-8 md:h-8 text-[#98A2B3]" />
                        }
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 md:mt-4 md:pt-4 border-t border-gray-50">
                    <span className="text-[12px] md:text-[14px] text-[#667085]">Price</span>
                    <span className="text-[16px] md:text-[18px] font-bold text-primary">₹{test.price}</span>
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
