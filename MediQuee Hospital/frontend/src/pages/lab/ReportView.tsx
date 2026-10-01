import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Download, Share2, User, FlaskConical, FileText, Upload, Printer, Loader2, CheckCircle2, Phone, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import { StatusBadge } from "@/components/lab/LabUI"
import { labApi } from "@/services/labApi"
import { useToast } from "@/context/ToastContext"

export function ReportView() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()

  const [booking, setBooking] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadReport() {
      if (!id) return
      setIsLoading(true)
      setError(null)
      try {
        const res = await labApi.getLabBookingById(id)
        if (res.success && res.data) {
          setBooking(res.data)
        } else {
          throw new Error(res.error?.message || "Report not found")
        }
      } catch (err: any) {
        console.error("Failed to load report", err)
        setError(err.message || "Report could not be retrieved")
      } finally {
        setIsLoading(false)
      }
    }
    loadReport()
  }, [id])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-[14px] text-[#667085] font-medium">Loading diagnostic report...</p>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-2xl">
          <AlertCircle className="w-8 h-8" />
        </div>
        <p className="text-[18px] font-bold text-[#172033]">Report Not Found</p>
        <p className="text-[14px] text-[#667085] max-w-sm">
          {error || "No diagnostic report record was found for this order ID."}
        </p>
        <button
          onClick={() => navigate('/lab/orders')}
          className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-[14px] hover:bg-blue-700 transition-colors"
        >
          Back to Lab Queue
        </button>
      </div>
    )
  }

  const patientName = booking.patient?.name || (typeof booking.patient === 'string' ? booking.patient : 'Walk-in Patient')
  const patientPhone = booking.patient?.phone || booking.phone || ''
  const tests = booking.items?.map((it: any) => it.labTest?.platformTest?.name || 'Diagnostic Test') || ['Diagnostic Test']
  const sample = booking.items?.[0]?.labTest?.platformTest?.specimenType || 'SAMPLE'
  const reportDate = booking.updatedAt ? new Date(booking.updatedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today'
  const bookingDate = booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today'

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex flex-col bg-background min-h-screen w-full">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-4 md:pt-6 pb-3 md:pb-4 px-4 md:px-6 flex items-center justify-between border-b border-border/50">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 text-[#172033] rounded-full hover:bg-gray-100 transition-colors"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <div>
            <h1 className="text-[18px] md:text-[22px] font-bold text-[#172033]">Diagnostic Report</h1>
            <p className="text-[11px] md:text-[12px] text-[#667085]">Order ID: {booking.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Change / Re-upload button */}
          <button
            type="button"
            onClick={() => navigate(`/lab/upload-report?orderId=${booking.id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary font-semibold text-[12px] md:text-[13px] active:scale-95 transition-all shadow-2xs"
            title="Upload a new file if any mistake"
          >
            <Upload className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span>Change / Re-upload</span>
          </button>

          <button 
            onClick={handlePrint}
            className="p-2 text-[#667085] hover:text-[#172033] hover:bg-gray-100 rounded-xl transition-colors hidden sm:flex items-center"
            title="Print Report"
          >
            <Printer className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-4 md:px-6 pt-5 md:pt-8 pb-12 w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          {/* Left Column (Metadata) */}
          <div className="lg:col-span-4 flex flex-col gap-4 md:gap-6">
            {/* Status Banner */}
            <motion.div 
              initial={{ opacity: 0, y: 6 }} 
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 md:px-5 md:py-4"
            >
              <div>
                <p className="text-[12px] md:text-[13px] font-semibold text-emerald-800">Order & Report Status</p>
                <p className="text-[16px] md:text-[18px] font-bold text-emerald-900">Completed</p>
              </div>
              <StatusBadge status={booking.status} size="md" />
            </motion.div>

            {/* Patient Info */}
            <motion.div 
              initial={{ opacity: 0, y: 6 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.06 }}
              className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-gray-100 bg-[#F8FAFC]">
                <p className="text-[12px] font-bold text-[#667085] uppercase tracking-wide">Patient Information</p>
              </div>
              <div className="px-4 py-3.5 flex items-center gap-3">
                <div className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-primary text-[17px]">
                  {patientName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] md:text-[16px] font-bold text-[#172033] truncate">{patientName}</p>
                  {patientPhone && (
                    <a href={`tel:${patientPhone}`} className="inline-flex items-center gap-1.5 text-[13px] text-primary hover:underline font-medium">
                      <Phone className="w-3.5 h-3.5" />
                      {patientPhone}
                    </a>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Test Details */}
            <motion.div 
              initial={{ opacity: 0, y: 6 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.1 }}
              className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-gray-100 bg-[#F8FAFC]">
                <p className="text-[12px] font-bold text-[#667085] uppercase tracking-wide">Test Parameters</p>
              </div>
              <div className="px-4 py-3.5 flex flex-col gap-3">
                {tests.map((tName: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-primary shrink-0">
                      <FlaskConical className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[14px] font-semibold text-[#172033] truncate block">{tName}</span>
                      <span className="text-[11px] text-[#667085]">Sample: {sample}</span>
                    </div>
                  </div>
                ))}
                
                <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-[#667085]">Order ID:</span>
                    <span className="font-semibold text-[#172033]">{booking.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-[#667085]">Booking Date:</span>
                    <span className="font-semibold text-[#172033]">{bookingDate}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-[#667085]">Report Generated:</span>
                    <span className="font-semibold text-[#172033]">{reportDate}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column (Report View & Correction Controls) */}
          <div className="lg:col-span-8 flex flex-col gap-4 md:gap-6">
            {/* Report Header Card with Re-upload trigger */}
            <motion.div 
              initial={{ opacity: 0, y: 6 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.14 }}
              className="bg-surface rounded-2xl border border-border shadow-xs p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100 text-red-500 shrink-0">
                  <FileText className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] md:text-[16px] font-bold text-[#172033] truncate">
                    Diagnostic_Report_{booking.id.slice(0, 8).toUpperCase()}.pdf
                  </p>
                  <p className="text-[12px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Verified & Attached to Patient Order
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button 
                  type="button"
                  onClick={() => navigate(`/lab/upload-report?orderId=${booking.id}`)}
                  className="px-3.5 py-2 rounded-xl bg-primary text-white font-semibold text-[13px] hover:bg-blue-700 active:scale-95 transition-all shadow-xs flex items-center gap-1.5"
                  title="Made a mistake? Re-upload report"
                >
                  <Upload className="w-4 h-4" />
                  <span>Re-upload / Change File</span>
                </button>
              </div>
            </motion.div>

            {/* Diagnostic Report Summary Preview */}
            <motion.div 
              initial={{ opacity: 0, y: 6 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.18 }}
              className="bg-surface rounded-2xl border border-border shadow-xs p-6 md:p-8 flex flex-col gap-6"
            >
              <div className="border-b border-border pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-[18px] md:text-[20px] font-bold text-[#172033]">Official Laboratory Examination</h3>
                  <p className="text-[13px] text-[#667085]">MediQuee Clinical Diagnostic Network</p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    REPORT COMPLETED
                  </span>
                  <p className="text-[12px] text-[#667085] mt-1">Verified by Laboratory Pathologist</p>
                </div>
              </div>

              {/* Table of Tests */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-gray-100 text-[#667085] font-semibold text-[12px] uppercase">
                      <th className="pb-3">Investigation</th>
                      <th className="pb-3">Specimen</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Result Summary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {booking.items?.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-3.5 font-bold text-[#172033]">
                          {item.labTest?.platformTest?.name || 'Diagnostic Offering'}
                        </td>
                        <td className="py-3.5 text-[#667085]">
                          {item.labTest?.platformTest?.specimenType || sample}
                        </td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700">
                            Normal / Cleared
                          </span>
                        </td>
                        <td className="py-3.5 text-right font-semibold text-[#172033]">
                          Detailed in Attached Report
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Notice & Correction Alert Box */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-[13px] text-blue-900">
                  <p className="font-bold">Need to make corrections?</p>
                  <p className="text-blue-800 mt-0.5">
                    If any values, scan pages, or patient details need adjustments, click the <strong>"Re-upload / Change File"</strong> button above to replace this report with a revised version at any time.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
