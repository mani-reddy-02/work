import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, User, Eye, FileText } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { StatusBadge } from "@/components/lab/LabUI"
import { cn } from "@/lib/utils"

const summaryStats = [
  { label: 'Pending Upload', count: 12, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  { label: 'Ready', count: 86, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { label: 'Delivered', count: 64, color: 'text-[#667085]', bg: 'bg-gray-50', border: 'border-gray-200' },
]

const filters = ['All', 'Pending', 'Ready', 'Delivered']

const basePath = import.meta.env.BASE_URL;

const allReports = [
  { id: 'MQ-10285', patient: 'Priya Sharma', test: 'Thyroid Profile', date: '14 Aug', status: 'ready' as const, type: 'In-Person', icon: `${basePath}png/093-dna.png` },
  { id: 'MQ-10283', patient: 'Arun Krishnan', test: 'CBC + ESR', date: '13 Aug', status: 'delivered' as const, type: 'In-Person', icon: `${basePath}png/025-pcr-test.png` },
  { id: 'MQ-10282', patient: 'Sneha Gupta', test: 'Lipid Profile', date: '13 Aug', status: 'ready' as const, type: 'In-Person', icon: `${basePath}png/015-body-scan.png` },
  { id: 'MQ-10284', patient: 'Ramesh Kumar', test: 'CBC + Lipid Profile', date: '14 Aug', status: 'pending' as const, type: 'In-Person', icon: `${basePath}png/013-medical.png` },
  { id: 'MQ-10281', patient: 'Farida Begum', test: 'Kidney Function', date: '12 Aug', status: 'delivered' as const, type: 'In-Person', icon: `${basePath}png/006-kidney.png` },
  { id: 'MQ-10280', patient: 'Ravi Verma', test: 'HbA1c', date: '12 Aug', status: 'ready' as const, type: 'Home Collection', icon: `${basePath}png/050-bacteria.png` },
  { id: 'MQ-10279', patient: 'Meera Pillai', test: 'Thyroid TSH', date: '11 Aug', status: 'pending' as const, type: 'Home Collection', icon: `${basePath}png/093-dna.png` },
]

const filterMap: Record<string, string> = { 'Pending': 'pending', 'Ready': 'ready', 'Delivered': 'delivered' }

export function LabReports() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState('All')
  const [activeMainSection, setActiveMainSection] = useState<'In-Person' | 'Home Collection'>('In-Person')

  const filtered = allReports.filter(r => {
    const matchType = r.type === activeMainSection
    const matchStatus = activeFilter === 'All' || r.status === filterMap[activeFilter]
    return matchType && matchStatus
  })

  return (
    <div className="flex flex-col bg-background min-h-full w-full">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md px-4 md:px-6 pt-5 md:pt-6 pb-3 md:pb-4 border-b border-gray-100/50">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[22px] md:text-[26px] font-bold text-[#172033]">Reports</h1>
          <button
            onClick={() => navigate('/lab/upload-report')}
            className="flex items-center gap-1.5 md:gap-2 bg-primary text-white text-[13px] md:text-[14px] font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-colors"
          >
            <Upload className="w-4 h-4 md:w-5 md:h-5" />
            Upload
          </button>
        </div>
        
        {/* Main Sections */}
        <div className="flex bg-gray-100/80 p-1 rounded-xl max-w-md">
          <button 
            onClick={() => setActiveMainSection('In-Person')}
            className={cn("flex-1 py-2 text-[13px] font-bold rounded-lg transition-all", activeMainSection === 'In-Person' ? "bg-white text-primary shadow-sm" : "text-[#667085] hover:text-[#172033]")}
          >
            In-Person
          </button>
          <button 
            onClick={() => setActiveMainSection('Home Collection')}
            className={cn("flex-1 py-2 text-[13px] font-bold rounded-lg transition-all", activeMainSection === 'Home Collection' ? "bg-white text-primary shadow-sm" : "text-[#667085] hover:text-[#172033]")}
          >
            Home Collection
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:gap-6 px-4 md:px-6 pt-4 md:pt-6 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Summary Stats */}
          <div className="flex gap-3 w-full md:w-auto md:min-w-[450px]">
            {summaryStats.map(s => (
              <div key={s.label} className={cn("flex-1 flex flex-col items-center gap-1 py-3 md:py-4 rounded-2xl border bg-white shadow-sm", s.bg, s.border)}>
                <span className={cn("text-[22px] md:text-[28px] font-bold", s.color)}>{s.count}</span>
                <span className={cn("text-[11px] md:text-[13px] font-semibold text-center leading-tight", s.color)}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none w-full md:w-auto md:justify-end md:flex-wrap">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={cn(
                  "flex-shrink-0 px-4 py-2 md:px-5 md:py-2.5 rounded-xl text-[13px] md:text-[14px] font-semibold transition-colors border",
                  activeFilter === f ? "bg-primary text-white border-primary shadow-sm" : "bg-white text-[#667085] border-gray-200/60 hover:bg-gray-50"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Report List */}
        <div className="pb-4 md:pb-8 w-full">
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
                <div className="w-14 h-14 md:w-20 md:h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-3 md:mb-5">
                  <FileText className="w-6 h-6 md:w-8 md:h-8 text-[#98A2B3]" />
                </div>
                <p className="text-[16px] md:text-[18px] font-semibold text-[#172033]">No reports</p>
                <p className="text-[13px] md:text-[15px] text-[#667085] mt-1 md:mt-2">Uploaded reports will appear here</p>
                <button onClick={() => navigate('/lab/upload-report')} className="mt-4 md:mt-6 bg-primary text-white font-semibold px-5 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-[14px] md:text-[15px] hover:bg-blue-700 transition-colors">Upload Report</button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 w-full">
                {filtered.map((report, i) => (
                  <motion.div
                    key={report.id + report.patient}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-white rounded-2xl p-4 md:p-5 border border-gray-100 shadow-sm flex items-center gap-3 md:gap-4 hover:border-primary/20 hover:shadow-md transition-all"
                  >
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {report.icon ? (
                        <img src={report.icon} alt={report.test} className="w-6 h-6 md:w-7 md:h-7 object-contain drop-shadow-sm" />
                      ) : (
                        <User className="w-5 h-5 md:w-6 md:h-6 text-primary" strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] md:text-[15px] font-semibold text-[#172033] truncate">{report.patient}</p>
                      <p className="text-[12px] md:text-[13px] text-[#667085] truncate">{report.test}</p>
                      <div className="flex items-center gap-2 mt-1 md:mt-2">
                        <span className="text-[11px] md:text-[12px] text-[#98A2B3]">{report.id} · {report.date}</span>
                        <StatusBadge status={report.status} />
                      </div>
                    </div>
                    {report.status !== 'pending' ? (
                      <button
                        onClick={() => navigate(`/lab/report/${report.id}`)}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 bg-blue-50 text-primary text-[12px] md:text-[13px] font-semibold rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        View
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate('/lab/upload-report')}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 bg-amber-50 text-amber-700 text-[12px] md:text-[13px] font-semibold rounded-xl border border-amber-200 hover:bg-amber-100 transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        Upload
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
