import { useState, useEffect, useRef } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import { 
  ArrowLeft, User, Phone, Mail, Upload, Eye, Share2, FlaskConical, 
  CheckCircle2, Loader2, MapPin, Calendar, Clock, Printer, Download, 
  ExternalLink, FileText, AlertCircle, Check, X, ChevronRight, Plus, 
  RefreshCw, Play, ShieldCheck, Copy, ChevronDown, CheckCircle
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { StatusBadge } from "@/components/lab/LabUI"
import { cn, formatPatientAddress } from "@/lib/utils"
import { labApi } from "@/services/labApi"
import { useToast } from "@/context/ToastContext"

export function LabOrderDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()

  const [booking, setBooking] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Status dropdown / selector
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)

  // Assign Phlebotomist Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [phlebName, setPhlebName] = useState('')
  const [phlebPhone, setPhlebPhone] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)

  // Inline Quick Upload Report Modal / State
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<{ name: string; type: string; size: string; base64: string } | null>(null)
  const [isUploadingReport, setIsUploadingReport] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fullscreen Report Viewer Modal
  const [reportViewerOpen, setReportViewerOpen] = useState(false)

  const fetchDetail = async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await labApi.getLabBookingById(id)
      if (res.success && res.data) {
        setBooking(res.data)
        if (res.data.phlebotomistName) setPhlebName(res.data.phlebotomistName)
        if (res.data.phlebotomistPhone) setPhlebPhone(res.data.phlebotomistPhone)
      } else {
        throw new Error(res.error?.message || "Order not found")
      }
    } catch (err: any) {
      console.error("Order detail error:", err)
      setError(err.message || "Order could not be retrieved")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
  }, [id])

  // Status update function
  const handleUpdateStatus = async (nextStatus: string, payload: any = {}) => {
    if (!id) return
    setIsUpdating(true)
    try {
      await labApi.updateLabBookingStatus(id, { status: nextStatus, ...payload })
      toast(`Order status changed to ${formatStatusLabel(nextStatus)}`, "success")
      setStatusDropdownOpen(false)
      fetchDetail()
    } catch (err: any) {
      toast(err.message || "Failed to update order status", "error")
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle Phlebotomist Assignment
  const handleAssignPhlebotomist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phlebName.trim()) {
      toast("Please enter technician name", "error")
      return
    }
    if (!phlebPhone.trim() || phlebPhone.trim().length < 10) {
      toast("Please enter a valid 10-digit phone number", "error")
      return
    }
    setIsAssigning(true)
    try {
      await labApi.updateLabBookingStatus(id!, {
        status: 'ASSIGNED',
        phlebotomistName: phlebName.trim(),
        phlebotomistPhone: phlebPhone.trim()
      })
      toast("Phlebotomist assigned successfully", "success")
      setAssignModalOpen(false)
      fetchDetail()
    } catch (err: any) {
      toast(err.message || "Failed to assign phlebotomist", "error")
    } finally {
      setIsAssigning(false)
    }
  }

  // Handle file select for report upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ['application/pdf', 'image/jpeg', 'image/png']
    if (!allowed.includes(file.type)) {
      toast('Invalid file format. Please upload PDF, JPG, or PNG.', 'error')
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      toast('File is too large. Maximum size is 15MB.', 'error')
      return
    }
    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
      : `${(file.size / 1024).toFixed(0)} KB`

    const reader = new FileReader()
    reader.onload = () => {
      setSelectedFile({
        name: file.name,
        type: file.type,
        size: sizeStr,
        base64: reader.result as string
      })
    }
    reader.readAsDataURL(file)
  }

  // Handle uploading diagnostic report
  const handleUploadReport = async () => {
    if (!id || !selectedFile) {
      toast("Please select a report file first", "error")
      return
    }
    setIsUploadingReport(true)
    try {
      await labApi.uploadReport(id, selectedFile)
      toast("Diagnostic report uploaded and attached successfully!", "success")
      setSelectedFile(null)
      setUploadModalOpen(false)
      fetchDetail()
    } catch (err: any) {
      toast(err.message || "Failed to upload report", "error")
    } finally {
      setIsUploadingReport(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast(`${label} copied to clipboard`, "info")
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <Loader2 className="w-9 h-9 text-primary animate-spin" />
        <p className="text-[14px] text-muted font-semibold">Loading complete order details...</p>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-2xl">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-[20px] font-bold text-foreground">Order Not Found</h2>
        <p className="text-[14px] text-muted max-w-sm">
          {error || "The requested diagnostic order could not be located in the database."}
        </p>
        <button
          onClick={() => navigate('/lab/orders')}
          className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-[14px] hover:bg-blue-700 transition-colors shadow-sm"
        >
          Return to Orders
        </button>
      </div>
    )
  }

  // Derive workflow stage
  const rawStatus = (booking.status || 'REQUESTED').toUpperCase()
  const isWaiting = ['REQUESTED', 'ASSIGNED', 'WAITING', 'PENDING'].includes(rawStatus)
  const isInConsult = ['SAMPLE_COLLECTED', 'IN_LAB_PROCESSING', 'IN_CONSULTATION', 'IN_CONSULT'].includes(rawStatus)
  const isCompleted = ['REPORT_READY', 'COMPLETED'].includes(rawStatus)
  const isCancelled = rawStatus === 'CANCELLED'

  // Current primary stage key for the 3 user requested stages
  const currentStage: 'waiting' | 'in_consult' | 'completed' | 'cancelled' = 
    isCancelled ? 'cancelled' :
    isCompleted ? 'completed' :
    isInConsult ? 'in_consult' : 'waiting'

  function formatStatusLabel(st: string) {
    switch (st.toUpperCase()) {
      case 'REQUESTED': return 'Waiting'
      case 'ASSIGNED': return 'Waiting (Assigned)'
      case 'WAITING': return 'Waiting'
      case 'SAMPLE_COLLECTED': return 'In Consult (Collected)'
      case 'IN_LAB_PROCESSING': return 'In Consult'
      case 'REPORT_READY': return 'Completed'
      case 'COMPLETED': return 'Completed'
      case 'CANCELLED': return 'Cancelled'
      default: return st.replace(/_/g, ' ')
    }
  }

  const patientName = booking.patient?.name || 'Walk-in Patient'
  const patientPhone = booking.patient?.phone || ''
  const patientEmail = booking.patient?.email || ''
  const patientGender = booking.patient?.gender || 'Not specified'
  const patientDob = booking.patient?.dob
  const isHomeBooking = booking.bookingType === 'HOME_COLLECTION'
  const patientAddress = formatPatientAddress(
    booking.collectionAddress || booking.patient?.address,
    isHomeBooking ? 'Home Address on file' : 'In-Person Lab / Clinic Walk-in'
  )

  // Tests list
  const testsList = booking.items?.map((it: any) => ({
    name: it.labTest?.platformTest?.name || 'Diagnostic Test',
    specimen: it.labTest?.platformTest?.specimenType || 'SAMPLE',
    department: it.labTest?.platformTest?.department?.name || 'Diagnostic Pathology',
    price: it.price || 0
  })) || []

  // Date and Time formatting
  const bookedDateStr = booking.createdAt 
    ? new Date(booking.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Today'
  const bookedTimeStr = booking.createdAt 
    ? new Date(booking.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : ''

  const collectionDateStr = booking.collectionDate
    ? new Date(booking.collectionDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : bookedDateStr

  // Report File handling
  const reportUrl = booking.reportUrl
    ? (booking.reportUrl.startsWith('http') ? booking.reportUrl : `http://localhost:5000${booking.reportUrl.startsWith('/') ? '' : '/'}${booking.reportUrl}`)
    : null
  const isReportPdf = reportUrl ? reportUrl.toLowerCase().includes('.pdf') : false

  return (
    <div className="flex flex-col bg-background min-h-screen text-foreground pb-20">
      
      {/* ── 1. Sticky Header with Breadcrumb & Quick Status Controls ────────── */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-border shadow-xs px-4 md:px-8 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button 
            onClick={() => navigate('/lab/orders')} 
            className="p-2 -ml-2 text-foreground/80 rounded-xl hover:bg-gray-100 hover:text-foreground transition-colors cursor-pointer"
            title="Back to Orders Queue"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 text-xs text-muted font-medium">
              <Link to="/lab/orders" className="hover:text-primary transition-colors">Orders</Link>
              <span>/</span>
              <span className="font-mono text-foreground font-semibold truncate max-w-[150px]">
                {booking.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <h1 className="text-[17px] md:text-[20px] font-black text-foreground truncate">
                Order #{booking.id.slice(0, 8).toUpperCase()}
              </h1>
              <span className={cn(
                "text-[10px] font-black uppercase px-2 py-0.5 rounded-md border tracking-wider",
                booking.bookingType === 'HOME_COLLECTION' 
                  ? "bg-teal-50 text-teal-700 border-teal-200" 
                  : "bg-blue-50 text-blue-700 border-blue-200"
              )}>
                {booking.bookingType === 'HOME_COLLECTION' ? 'Home Sample' : 'Walk-in'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls & Interactive Status Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Quick Print Order */}
          <button
            type="button"
            onClick={() => window.print()}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-surface hover:bg-gray-50 text-xs font-bold text-foreground transition-all active:scale-95 cursor-pointer"
            title="Print Order Summary"
          >
            <Printer className="w-4 h-4 text-muted" />
            <span>Print</span>
          </button>

          {/* Upload Report Button */}
          {reportUrl ? (
            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold transition-all active:scale-95 cursor-pointer"
              title="Replace / Re-upload Diagnostic Report"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Change Report</span>
              <span className="sm:hidden">Report</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-blue-700 shadow-xs active:scale-95 transition-all cursor-pointer"
              title="Upload Patient Report"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Report</span>
            </button>
          )}

          {/* Order Status Dropdown Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
              disabled={isUpdating}
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer border",
                currentStage === 'completed'
                  ? "bg-[#0A1A3D] text-white border-[#0A1A3D]"
                  : currentStage === 'in_consult'
                  ? "bg-blue-600 text-white border-blue-600"
                  : currentStage === 'cancelled'
                  ? "bg-red-50 text-red-600 border-red-200"
                  : "bg-amber-500 text-white border-amber-500"
              )}
            >
              {isUpdating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              )}
              <span className="uppercase tracking-wider">
                Status: {formatStatusLabel(rawStatus)}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>

            {statusDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-surface rounded-2xl shadow-xl border border-border py-1.5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-2 border-b border-border/60">
                  <p className="text-[10px] font-black uppercase text-muted tracking-wider">Change Order Status</p>
                </div>
                {[
                  { label: 'Waiting', sub: 'Sample awaited / Patient arrival', value: 'REQUESTED', icon: Clock, color: 'text-amber-600' },
                  { label: 'In Consult', sub: 'Sample in lab testing & analysis', value: 'IN_LAB_PROCESSING', icon: FlaskConical, color: 'text-blue-600' },
                  { label: 'Completed', sub: 'Report generated & certified', value: 'REPORT_READY', icon: CheckCircle2, color: 'text-emerald-600' },
                  { label: 'Cancelled', sub: 'Order discontinued', value: 'CANCELLED', icon: X, color: 'text-red-500' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleUpdateStatus(item.value)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-gray-50 flex items-start gap-2.5 transition-colors cursor-pointer"
                  >
                    <item.icon className={cn("w-4 h-4 mt-0.5 shrink-0", item.color)} />
                    <div>
                      <p className="text-xs font-bold text-foreground leading-tight">{item.label}</p>
                      <p className="text-[10px] text-muted leading-tight mt-0.5">{item.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Main Page Content Container ────────────────────────────────── */}
      <div className="max-w-7xl w-full mx-auto px-4 md:px-8 pt-6 flex flex-col gap-6">

        {/* ── Workflow Progress Stepper (Waiting -> In Consult -> Completed) ── */}
        <div className="bg-surface rounded-2xl border border-border p-4 md:p-6 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div>
              <h2 className="text-[15px] font-black text-foreground">Order Lifecycle Workflow</h2>
              <p className="text-xs text-muted mt-0.5">Track and update the live status of this diagnostic order</p>
            </div>
            
            {/* Quick 1-click status switch tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl">
              <button
                type="button"
                onClick={() => handleUpdateStatus('REQUESTED')}
                disabled={isUpdating}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  currentStage === 'waiting'
                    ? "bg-surface text-amber-700 shadow-xs"
                    : "text-muted hover:text-foreground"
                )}
              >
                1. Waiting
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus('IN_LAB_PROCESSING')}
                disabled={isUpdating}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  currentStage === 'in_consult'
                    ? "bg-primary text-white shadow-xs"
                    : "text-muted hover:text-foreground"
                )}
              >
                2. In Consult
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus('REPORT_READY')}
                disabled={isUpdating}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  currentStage === 'completed'
                    ? "bg-[#0A1A3D] text-white shadow-xs"
                    : "text-muted hover:text-foreground"
                )}
              >
                3. Completed
              </button>
            </div>
          </div>

          {/* Stepper Pipeline Visual */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            
            {/* Step 1: Waiting */}
            <div className={cn(
              "p-4 rounded-xl border transition-all flex flex-col gap-2 relative",
              currentStage === 'waiting'
                ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20 shadow-xs"
                : isCompleted || currentStage === 'in_consult'
                ? "bg-gray-50 border-gray-200 opacity-90"
                : "bg-surface border-border"
            )}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-700">Stage 1</span>
                {isCompleted || currentStage === 'in_consult' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : currentStage === 'waiting' ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                ) : null}
              </div>
              <h3 className="text-[15px] font-bold text-foreground">Waiting for Sample</h3>
              <p className="text-xs text-muted">
                {booking.bookingType === 'HOME_COLLECTION' 
                  ? 'Awaiting sample collection by assigned phlebotomist.'
                  : 'Patient will arrive at clinic laboratory for sample draw.'}
              </p>
              
              {currentStage === 'waiting' && (
                <div className="pt-2 mt-auto flex flex-wrap gap-2">
                  {booking.bookingType === 'HOME_COLLECTION' && !booking.phlebotomistName && (
                    <button
                      type="button"
                      onClick={() => setAssignModalOpen(true)}
                      className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all cursor-pointer"
                    >
                      Assign Phlebotomist
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('SAMPLE_COLLECTED')}
                    className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-all cursor-pointer"
                  >
                    Mark Sample Collected
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: In Consult */}
            <div className={cn(
              "p-4 rounded-xl border transition-all flex flex-col gap-2 relative",
              currentStage === 'in_consult'
                ? "bg-blue-50/70 border-blue-300 ring-2 ring-blue-400/20 shadow-xs"
                : isCompleted
                ? "bg-gray-50 border-gray-200 opacity-90"
                : "bg-surface border-border"
            )}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-700">Stage 2</span>
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : currentStage === 'in_consult' ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                ) : null}
              </div>
              <h3 className="text-[15px] font-bold text-foreground">In Consult / Testing</h3>
              <p className="text-xs text-muted">
                Specimen collected and currently undergoing laboratory analysis in pathology.
              </p>
              
              {currentStage === 'in_consult' && (
                <div className="pt-2 mt-auto flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setUploadModalOpen(true)}
                    className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload Report & Complete
                  </button>
                </div>
              )}
            </div>

            {/* Step 3: Completed */}
            <div className={cn(
              "p-4 rounded-xl border transition-all flex flex-col gap-2 relative",
              currentStage === 'completed'
                ? "bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/20 shadow-xs"
                : "bg-surface border-border"
            )}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700">Stage 3</span>
                {currentStage === 'completed' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <h3 className="text-[15px] font-bold text-foreground">Completed & Delivered</h3>
              <p className="text-xs text-muted">
                Test certified by pathologist. Diagnostic report is attached and viewable by patient.
              </p>
              
              {currentStage === 'completed' && (
                <div className="pt-2 mt-auto flex flex-wrap gap-2">
                  {reportUrl ? (
                    <button
                      type="button"
                      onClick={() => setReportViewerOpen(true)}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Full Report
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setUploadModalOpen(true)}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all cursor-pointer"
                    >
                      Attach Report PDF
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 3. Two Column Details Layout ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column (7 cols): Patient Details, Tests & Home Logistics */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Patient Information Card */}
            <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 bg-gray-50 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/80">Patient Details</h3>
                </div>
                <span className="text-[11px] font-mono text-muted font-bold">MQ-PAT-{booking.patientId?.slice(0, 6).toUpperCase()}</span>
              </div>

              <div className="p-5 flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-sm">
                    {patientName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-[18px] font-bold text-foreground truncate">{patientName}</h4>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-muted font-semibold">
                        {patientGender} {patientDob ? `• ${patientDob}` : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-2 flex-wrap text-xs text-muted">
                      {patientPhone && (
                        <a 
                          href={`tel:${patientPhone}`}
                          className="flex items-center gap-1.5 font-bold text-primary hover:underline"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{patientPhone}</span>
                        </a>
                      )}
                      {patientEmail && (
                        <a 
                          href={`mailto:${patientEmail}`}
                          className="flex items-center gap-1.5 font-medium text-foreground hover:text-primary transition-colors truncate max-w-[200px]"
                        >
                          <Mail className="w-3.5 h-3.5 text-muted" />
                          <span className="truncate">{patientEmail}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border/60">
                  <div className="flex flex-col gap-1 p-3 rounded-xl bg-gray-50 border border-border/60">
                    <span className="text-[11px] font-bold text-muted uppercase tracking-wide">Patient Address / Region</span>
                    <p className="text-xs font-semibold text-foreground flex items-start gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{patientAddress}</span>
                    </p>
                  </div>

                  <div className="flex flex-col gap-1 p-3 rounded-xl bg-gray-50 border border-border/60">
                    <span className="text-[11px] font-bold text-muted uppercase tracking-wide">Booking Reference</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs font-mono font-bold text-foreground truncate">{booking.id}</p>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(booking.id, "Order ID")}
                        className="text-muted hover:text-primary p-1 rounded transition-colors"
                        title="Copy Order ID"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ordered Diagnostic Tests Table */}
            <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 bg-gray-50 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/80">
                    Ordered Diagnostic Tests ({testsList.length})
                  </h3>
                </div>
                <span className="text-xs font-bold text-primary">Lab Catalog Examination</span>
              </div>

              <div className="divide-y divide-border/60">
                {testsList.map((test: any, idx: number) => (
                  <div key={idx} className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-primary font-bold shrink-0">
                        <FlaskConical className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h4 className="text-sm font-bold text-foreground truncate">{test.name}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-muted mt-0.5 flex-wrap">
                          <span className="font-semibold text-primary/90">{test.department}</span>
                          <span>•</span>
                          <span className="bg-gray-100 px-1.5 py-0.2 rounded font-mono text-[10px] text-foreground/80">
                            Specimen: {test.specimen}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-foreground">₹{test.price}</p>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Active Offering
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price & Billing Footer */}
              <div className="p-5 bg-gray-50 border-t border-border flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>Diagnostic Tests Subtotal:</span>
                  <span className="font-semibold text-foreground">₹{booking.testPrice || (booking.totalAmount - (booking.homeCollectionFee || 0))}</span>
                </div>
                {booking.homeCollectionFee > 0 && (
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>Home Sample Collection Fee:</span>
                    <span className="font-semibold text-teal-700">₹{booking.homeCollectionFee}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm font-black text-foreground pt-2 border-t border-border/60">
                  <span>Total Amount Paid:</span>
                  <span className="text-lg text-primary">₹{booking.totalAmount}</span>
                </div>
              </div>
            </div>

            {/* Home Collection Logistics (if applicable) */}
            {booking.bookingType === 'HOME_COLLECTION' && (
              <div className="bg-surface rounded-2xl border border-teal-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 bg-teal-50/70 border-b border-teal-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-700" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-teal-900">
                      Home Sample Collection Logistics
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded">
                    Doorstep Service
                  </span>
                </div>

                <div className="p-5 flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-muted uppercase">Sample Pickup Address</span>
                    <p className="text-sm font-semibold text-foreground p-3 rounded-xl bg-gray-50 border border-border">
                      {formatPatientAddress(booking.collectionAddress || booking.patient?.address, 'Home address on patient profile')}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-gray-50 border border-border flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-muted uppercase">Scheduled Date</span>
                      <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span>{collectionDateStr}</span>
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-50 border border-border flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-muted uppercase">Preferred Time Slot</span>
                      <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>{booking.collectionTimeSlot || 'Standard Morning (08:00 AM - 11:00 AM)'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Phlebotomist assignment block */}
                  <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/40 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold">
                        👤
                      </div>
                      <div>
                        <p className="text-xs font-bold text-teal-950 uppercase tracking-wide">Assigned Phlebotomist</p>
                        {booking.phlebotomistName ? (
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm font-bold text-foreground">{booking.phlebotomistName}</span>
                            {booking.phlebotomistPhone && (
                              <a href={`tel:${booking.phlebotomistPhone}`} className="text-xs font-semibold text-primary hover:underline">
                                ({booking.phlebotomistPhone})
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-amber-700">No technician assigned yet</span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setAssignModalOpen(true)}
                      className="px-3.5 py-1.5 bg-surface border border-teal-300 text-teal-800 text-xs font-bold rounded-xl hover:bg-teal-50 transition-all cursor-pointer shadow-2xs"
                    >
                      {booking.phlebotomistName ? 'Change Phlebotomist' : 'Assign Phlebotomist'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column (5 cols): Uploaded Diagnostic Reports & Document Viewer */}
          <div className="lg:col-span-5 flex flex-col gap-6">

            {/* ── Uploaded Reports Section (Lab Admin Can View Uploaded Reports) ── */}
            <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-3.5 bg-gray-50 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/80">Diagnostic Report</h3>
                </div>
                {reportUrl ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Report Ready
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    Upload Pending
                  </span>
                )}
              </div>

              <div className="p-5 flex flex-col gap-4">
                {reportUrl ? (
                  /* Report exists: Display report details and action buttons */
                  <div className="flex flex-col gap-4">
                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-foreground truncate max-w-[200px]">
                              Report_{booking.id.slice(0, 8).toUpperCase()}.pdf
                            </h4>
                            <p className="text-[11px] text-muted">
                              Uploaded & certified for patient download
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons for viewing/downloading report */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200/60">
                        <button
                          type="button"
                          onClick={() => setReportViewerOpen(true)}
                          className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                          title="Open embedded preview dialog"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Preview</span>
                        </button>
                        <a
                          href={reportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-surface border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold hover:bg-emerald-50 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                          title="Open PDF in new browser tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open Fullscreen</span>
                        </a>
                      </div>
                    </div>

                    {/* Embedded preview frame directly on page */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs font-bold text-muted px-1">
                        <span>Inline Report Preview</span>
                        <a href={reportUrl} download={`Lab_Report_${booking.id}.pdf`} className="text-primary hover:underline flex items-center gap-1 font-semibold">
                          <Download className="w-3 h-3" /> Download File
                        </a>
                      </div>

                      <div className="w-full h-[460px] rounded-2xl overflow-hidden border border-border bg-gray-50 relative shadow-inner">
                        {isReportPdf ? (
                          <iframe
                            src={`${reportUrl}#toolbar=1&navpanes=0`}
                            className="w-full h-full border-none"
                            title="Diagnostic Lab Report"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-3 overflow-auto">
                            <img
                              src={reportUrl}
                              alt="Diagnostic Report"
                              className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Re-upload button if mistake */}
                    <button
                      type="button"
                      onClick={() => setUploadModalOpen(true)}
                      className="w-full py-2.5 px-4 rounded-xl border border-dashed border-gray-300 hover:border-primary text-xs font-bold text-muted hover:text-primary transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-gray-50/50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Re-upload / Replace Report File</span>
                    </button>
                  </div>
                ) : (
                  /* Pending report: Show inline file upload dropzone directly with order & patient details */
                  <div className="flex flex-col gap-4">
                    <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 flex items-start gap-3">
                      <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wide">Report Upload Pending</h4>
                        <p className="text-xs text-amber-800 mt-0.5">
                          Order and patient information verified. Upload the finalized diagnostic report (PDF / Image) below to complete and deliver to patient.
                        </p>
                      </div>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept=".pdf,image/png,image/jpeg"
                      className="hidden"
                    />

                    {!selectedFile ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-primary/40 hover:border-primary rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center gap-3 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer group"
                      >
                        <div className="w-13 h-13 rounded-2xl bg-white shadow-xs flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-foreground">Click to Browse or Drop File</p>
                          <p className="text-xs text-muted mt-1">Supports PDF, JPG, PNG (Max 15MB)</p>
                        </div>
                        <span className="mt-1 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-xs pointer-events-none">
                          Select Report File
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center text-primary shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">{selectedFile.name}</p>
                              <p className="text-[11px] text-muted">{selectedFile.size} · Ready to submit</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedFile(null)}
                            className="p-1.5 text-muted hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            title="Remove file"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={isUploadingReport}
                          onClick={handleUploadReport}
                          className="w-full py-3 px-4 bg-primary text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          {isUploadingReport && <Loader2 className="w-4 h-4 animate-spin" />}
                          <span>Upload & Mark Report Completed</span>
                        </button>
                      </div>
                    )}

                    <div className="text-[11px] text-muted flex items-center justify-center gap-1.5 pt-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Certified report is automatically attached to patient records upon upload</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Timestamps & Audit Log */}
            <div className="bg-surface rounded-2xl border border-border p-5 shadow-sm flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Order Timeline</h3>
              <div className="flex flex-col gap-2.5 text-xs">
                <div className="flex items-center justify-between text-muted">
                  <span>Order Created:</span>
                  <span className="font-semibold text-foreground">{bookedDateStr} · {bookedTimeStr}</span>
                </div>
                <div className="flex items-center justify-between text-muted">
                  <span>Collection Date:</span>
                  <span className="font-semibold text-foreground">{collectionDateStr}</span>
                </div>
                {booking.sampleCollectedAt && (
                  <div className="flex items-center justify-between text-muted">
                    <span>Sample Collected:</span>
                    <span className="font-semibold text-foreground">
                      {new Date(booking.sampleCollectedAt).toLocaleString()}
                    </span>
                  </div>
                )}
                {booking.updatedAt && (
                  <div className="flex items-center justify-between text-muted">
                    <span>Last Updated:</span>
                    <span className="font-semibold text-foreground">
                      {new Date(booking.updatedAt).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── MODAL 1: Assign Phlebotomist Modal ─────────────────────────────── */}
      <AnimatePresence>
        {assignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setAssignModalOpen(false)} 
              className="absolute inset-0 bg-black/40 backdrop-blur-xs" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 15 }} 
              className="relative w-full max-w-md bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h3 className="text-[16px] font-bold text-foreground">Assign Phlebotomist</h3>
                <button 
                  onClick={() => setAssignModalOpen(false)} 
                  className="p-1.5 text-muted hover:text-foreground rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAssignPhlebotomist} className="p-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Technician / Phlebotomist Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={phlebName}
                    onChange={(e) => setPhlebName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Technician Contact Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phlebPhone}
                    onChange={(e) => setPhlebPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border mt-2">
                  <button
                    type="button"
                    onClick={() => setAssignModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-muted hover:text-foreground rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAssigning}
                    className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {isAssigning && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save & Assign</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 2: Inline Upload / Re-upload Diagnostic Report Modal ──────── */}
      <AnimatePresence>
        {uploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setUploadModalOpen(false)} 
              className="absolute inset-0 bg-black/40 backdrop-blur-xs" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 15 }} 
              className="relative w-full max-w-lg bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div>
                  <h3 className="text-[17px] font-bold text-foreground">Upload Diagnostic Report</h3>
                  <p className="text-xs text-muted mt-0.5">Attach laboratory test results for {patientName}</p>
                </div>
                <button 
                  onClick={() => setUploadModalOpen(false)} 
                  className="p-1.5 text-muted hover:text-foreground rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 flex flex-col gap-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".pdf,image/png,image/jpeg"
                  className="hidden"
                />

                {!selectedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-primary/40 hover:border-primary rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-xs flex items-center justify-center text-primary">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-foreground">Click to browse file</p>
                      <p className="text-xs text-muted mt-1">Supports PDF, JPG, PNG (Max 15MB)</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center text-primary shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{selectedFile.name}</p>
                        <p className="text-[11px] text-muted">{selectedFile.size}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="p-1.5 text-muted hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setUploadModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-muted hover:text-foreground rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!selectedFile || isUploadingReport}
                    onClick={handleUploadReport}
                    className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isUploadingReport && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Attach & Mark Ready</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 3: Fullscreen Report Viewer Dialog ────────────────────────── */}
      <AnimatePresence>
        {reportViewerOpen && reportUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setReportViewerOpen(false)} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="relative w-full max-w-5xl h-[88vh] bg-surface rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden"
            >
              <div className="p-4 bg-gray-50 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="text-sm font-bold text-foreground">
                    Report Preview - {patientName} (Order #{booking.id.slice(0, 8).toUpperCase()})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-muted hover:text-primary rounded-lg hover:bg-gray-100 transition-colors"
                    title="Open in new window"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => setReportViewerOpen(false)}
                    className="p-2 text-muted hover:text-foreground rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 w-full bg-gray-100 overflow-hidden">
                {isReportPdf ? (
                  <iframe
                    src={`${reportUrl}#toolbar=1`}
                    className="w-full h-full border-none"
                    title="Diagnostic Report Full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
                    <img
                      src={reportUrl}
                      alt="Diagnostic Report"
                      className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
