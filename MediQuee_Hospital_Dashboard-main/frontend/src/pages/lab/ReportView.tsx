import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Download, Share2, User, FlaskConical, FileText } from "lucide-react"
import { motion } from "framer-motion"
import { StatusBadge } from "@/components/lab/LabUI"

const mockReports: Record<string, {
  id: string; patient: string; phone: string; test: string; date: string;
  reportDate: string; status: 'ready' | 'delivered'; filename: string
}> = {
  'MQ-10285': { id: 'MQ-10285', patient: 'Priya Sharma', phone: '+91 87654 32109', test: 'Thyroid Profile (T3, T4, TSH)', date: '14 Aug 2026', reportDate: '14 Aug 2026', status: 'ready', filename: 'Thyroid_Report_Priya.pdf' },
  'MQ-10283': { id: 'MQ-10283', patient: 'Arun Krishnan', phone: '+91 99887 76655', test: 'CBC + ESR', date: '13 Aug 2026', reportDate: '13 Aug 2026', status: 'delivered', filename: 'CBC_ESR_Arun.pdf' },
}

export function ReportView() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const report = mockReports[id ?? '']

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-[16px] font-semibold text-[#172033]">Report not found</p>
        <button onClick={() => navigate(-1)} className="text-primary font-semibold">Go Back</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-background min-h-screen w-full">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-4 md:pt-6 pb-3 md:pb-4 px-4 md:px-6 flex items-center gap-4 border-b border-gray-100/50">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[#172033] rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <h1 className="text-[18px] md:text-[22px] font-bold text-[#172033]">Report</h1>
        <div className="ml-auto flex items-center gap-2">
          <button className="p-2 text-[#667085] hover:text-[#172033] transition-colors"><Download className="w-5 h-5 md:w-6 md:h-6" /></button>
          <button className="p-2 text-[#667085] hover:text-[#172033] transition-colors"><Share2 className="w-5 h-5 md:w-6 md:h-6" /></button>
        </div>
      </div>

      <div className="px-4 md:px-6 pt-5 md:pt-8 pb-8 w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          {/* Left Column (Info) */}
          <div className="lg:col-span-4 flex flex-col gap-4 md:gap-6">
            {/* Status Banner */}
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 md:px-5 md:py-4">
              <div>
                <p className="text-[12px] md:text-[13px] font-semibold text-emerald-700">Report Status</p>
                <p className="text-[16px] md:text-[18px] font-bold text-emerald-700">Ready</p>
              </div>
              <StatusBadge status={report.status} size="md" />
            </motion.div>

            {/* Patient */}
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="text-[12px] md:text-[13px] font-bold text-[#667085] uppercase tracking-wide">Patient</p>
              </div>
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <User className="w-5 h-5 md:w-6 md:h-6 text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[15px] md:text-[16px] font-bold text-[#172033]">{report.patient}</p>
                  <p className="text-[13px] md:text-[14px] text-[#667085]">{report.phone}</p>
                </div>
              </div>
            </motion.div>

            {/* Test Info */}
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="text-[12px] md:text-[13px] font-bold text-[#667085] uppercase tracking-wide">Test Details</p>
              </div>
              <div className="px-4 py-3 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 md:w-10 md:h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <FlaskConical className="w-4 h-4 md:w-5 md:h-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <span className="text-[14px] md:text-[15px] font-semibold text-[#172033]">{report.test}</span>
                </div>
                {[{ label: 'Order ID', value: report.id }, { label: 'Test Date', value: report.date }, { label: 'Report Date', value: report.reportDate }].map(r => (
                  <div key={r.label} className="flex items-center justify-between border-t border-gray-50 pt-3">
                    <span className="text-[13px] md:text-[14px] text-[#667085]">{r.label}</span>
                    <span className="text-[14px] md:text-[15px] font-semibold text-[#172033]">{r.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column (Preview) */}
          <div className="lg:col-span-8 flex flex-col gap-4 md:gap-6">
            {/* Report File Details */}
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100">
                <FileText className="w-6 h-6 md:w-7 md:h-7 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] md:text-[15px] font-semibold text-[#172033] truncate">{report.filename}</p>
                <p className="text-[12px] md:text-[13px] text-[#667085]">PDF Report</p>
              </div>
              <button className="flex items-center gap-1.5 md:gap-2 bg-blue-50 text-primary text-[12px] md:text-[13px] font-semibold px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors">
                <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Download</span>
              </button>
            </motion.div>

            {/* PDF Preview Placeholder */}
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-center justify-center gap-3 text-center min-h-[300px] lg:h-full lg:min-h-[500px]">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                <FileText className="w-7 h-7 md:w-8 md:h-8 text-[#98A2B3]" />
              </div>
              <p className="text-[14px] md:text-[16px] font-semibold text-[#172033]">PDF Preview</p>
              <p className="text-[12px] md:text-[14px] text-[#667085]">Connect your PDF viewer API to enable inline preview</p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
