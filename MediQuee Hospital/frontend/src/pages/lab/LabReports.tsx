import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Upload, User, Eye, FileText, CheckCircle2, Clock, 
  Search, ArrowRight, ChevronRight, FlaskConical, 
  Calendar, Home, Phone, Filter, ShieldCheck, Download,
  ExternalLink, AlertCircle
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { labApi } from "@/services/labApi"

interface ReportItem {
  id: string
  idDisplay: string
  patient: string
  patientPhone?: string
  test: string
  testsCount: number
  date: string
  rawDate: Date
  rawStatus: string
  isUploaded: boolean
  isPending: boolean
  reportUrl?: string | null
  type: 'In-Person' | 'Home Collection'
  specimen: string
  totalAmount: number
  address?: string
}

export function LabReports() {
  const navigate = useNavigate()
  
  // Active Filters
  const [activeFilter, setActiveFilter] = useState<'All' | 'Pending' | 'Uploaded'>('All')
  const [activeMainSection, setActiveMainSection] = useState<'All' | 'In-Person' | 'Home Collection'>('In-Person')
  const [searchQuery, setSearchQuery] = useState('')
  const [allReports, setAllReports] = useState<ReportItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadReports() {
      try {
        setIsLoading(true)
        const res = await labApi.getLabBookings()
        const items: ReportItem[] = (res?.data || []).map((b: any) => {
          const rawSt = (b.status || 'REQUESTED').toUpperCase()
          const hasReport = Boolean(b.reportUrl)
          const isUploaded = rawSt === 'REPORT_READY' || rawSt === 'COMPLETED' || hasReport
          const isPending = !isUploaded && rawSt !== 'CANCELLED'

          const tests = b.items?.map((it: any) => it.labTest?.platformTest?.name || 'Diagnostic Test') || ['Diagnostic Test']
          const specimen = b.items?.[0]?.labTest?.platformTest?.specimenType || 'SAMPLE'

          return {
            id: b.id,
            idDisplay: b.id.slice(0, 8).toUpperCase(),
            patient: b.patient?.name || (typeof b.patient === 'string' ? b.patient : 'Walk-in Patient'),
            patientPhone: b.patient?.phone || b.phone || '',
            test: tests.join(', '),
            testsCount: tests.length,
            date: b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today',
            rawDate: b.createdAt ? new Date(b.createdAt) : new Date(),
            rawStatus: rawSt,
            isUploaded,
            isPending,
            reportUrl: b.reportUrl,
            type: b.bookingType === 'HOME_COLLECTION' ? 'Home Collection' : 'In-Person',
            specimen,
            totalAmount: b.totalAmount || 0,
            address: b.collectionAddress
          }
        })
        setAllReports(items)
      } catch (err) {
        console.error("Failed to load reports", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadReports()
  }, [])

  // Calculate the 2 core counts: Pending and Uploaded
  const pendingCount = useMemo(() => {
    return allReports.filter(r => r.isPending).length
  }, [allReports])

  const uploadedCount = useMemo(() => {
    return allReports.filter(r => r.isUploaded).length
  }, [allReports])

  // Filter pipeline
  const filteredReports = useMemo(() => {
    return allReports.filter(r => {
      // 1. Service mode filter
      if (activeMainSection !== 'All' && r.type !== activeMainSection) {
        return false
      }

      // 2. Status tile filter (Pending vs Uploaded)
      if (activeFilter === 'Pending' && !r.isPending) {
        return false
      }
      if (activeFilter === 'Uploaded' && !r.isUploaded) {
        return false
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchPatient = r.patient.toLowerCase().includes(q)
        const matchId = r.id.toLowerCase().includes(q) || r.idDisplay.toLowerCase().includes(q)
        const matchTest = r.test.toLowerCase().includes(q)
        const matchPhone = (r.patientPhone || '').toLowerCase().includes(q)
        if (!matchPatient && !matchId && !matchTest && !matchPhone) return false
      }

      return true
    })
  }, [allReports, activeMainSection, activeFilter, searchQuery])

  return (
    <div className="flex flex-col bg-background min-h-screen text-foreground pb-20">
      
      {/* ── 1. Top Header ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-border shadow-xs px-4 md:px-8 pt-5 pb-4">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <h1 className="text-[22px] md:text-[26px] font-black text-foreground tracking-tight">Reports</h1>
            <p className="text-xs text-muted mt-0.5">Manage diagnostic examination reports and verified patient test deliverables</p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/lab/upload-report')}
            className="flex items-center gap-2 bg-primary text-white text-xs md:text-sm font-bold px-4 py-2.5 rounded-xl md:rounded-2xl shadow-sm hover:bg-blue-700 active:scale-95 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Report</span>
          </button>
        </div>
        
        {/* Collection Type Selector Pills */}
        <div className="flex items-center justify-between gap-4 flex-wrap pt-1">
          <div className="flex bg-gray-100 p-1 rounded-xl max-w-sm">
            <button 
              type="button"
              onClick={() => setActiveMainSection('In-Person')}
              className={cn(
                "px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                activeMainSection === 'In-Person' 
                  ? "bg-surface text-primary shadow-xs font-black" 
                  : "text-muted hover:text-foreground"
              )}
            >
              In-Person Lab
            </button>
            <button 
              type="button"
              onClick={() => setActiveMainSection('Home Collection')}
              className={cn(
                "px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                activeMainSection === 'Home Collection' 
                  ? "bg-surface text-primary shadow-xs font-black" 
                  : "text-muted hover:text-foreground"
              )}
            >
              Home Collection
            </button>
            <button 
              type="button"
              onClick={() => setActiveMainSection('All')}
              className={cn(
                "px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                activeMainSection === 'All' 
                  ? "bg-surface text-primary shadow-xs font-black" 
                  : "text-muted hover:text-foreground"
              )}
            >
              All Modes
            </button>
          </div>

          {/* Search bar inside header */}
          <div className="relative flex-1 max-w-md min-w-[240px]">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by patient, test, or ID..."
              className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-border bg-surface text-xs text-foreground placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl w-full mx-auto px-4 md:px-8 pt-6 flex flex-col gap-6">

        {/* ── 2. The 3 Core Tiles: Total Orders, Pending, Uploaded (Headline with numbers only) ─ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Tile 1: Total Orders */}
          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setActiveFilter('All')}
            className={cn(
              "rounded-2xl border p-4 md:p-5 flex items-center justify-between transition-all cursor-pointer shadow-xs",
              activeFilter === 'All'
                ? "bg-blue-50 border-blue-400 ring-2 ring-blue-400/30 shadow-md"
                : "bg-surface border-border hover:bg-gray-50/80 hover:border-gray-300"
            )}
          >
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-muted">
                Total Orders
              </span>
              <span className="text-3xl md:text-4xl font-black text-foreground">
                {isLoading ? '...' : allReports.length}
              </span>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-primary flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
              <FileText className="w-6 h-6" />
            </div>
          </motion.div>

          {/* Tile 2: Pending */}
          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setActiveFilter(activeFilter === 'Pending' ? 'All' : 'Pending')}
            className={cn(
              "rounded-2xl border p-4 md:p-5 flex items-center justify-between transition-all cursor-pointer shadow-xs",
              activeFilter === 'Pending'
                ? "bg-amber-100/70 border-amber-400 ring-2 ring-amber-400/30 shadow-md"
                : "bg-amber-50/60 border-amber-200/80 hover:bg-amber-50 hover:border-amber-300"
            )}
          >
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-amber-700">
                Pending Reports
              </span>
              <span className="text-3xl md:text-4xl font-black text-amber-800">
                {isLoading ? '...' : pendingCount}
              </span>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-amber-200/60 text-amber-800 flex items-center justify-center shrink-0 border border-amber-300/50 shadow-2xs">
              <Clock className="w-6 h-6" />
            </div>
          </motion.div>

          {/* Tile 3: Uploaded */}
          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setActiveFilter(activeFilter === 'Uploaded' ? 'All' : 'Uploaded')}
            className={cn(
              "rounded-2xl border p-4 md:p-5 flex items-center justify-between transition-all cursor-pointer shadow-xs",
              activeFilter === 'Uploaded'
                ? "bg-emerald-100/70 border-emerald-400 ring-2 ring-emerald-400/30 shadow-md"
                : "bg-emerald-50/60 border-emerald-200/80 hover:bg-emerald-50 hover:border-emerald-300"
            )}
          >
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
                Uploaded Reports
              </span>
              <span className="text-3xl md:text-4xl font-black text-emerald-800">
                {isLoading ? '...' : uploadedCount}
              </span>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-emerald-200/60 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-300/50 shadow-2xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </motion.div>
        </div>

        {/* ── 3. Filter Bar & Quick Counters ───────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 flex-wrap border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Filter By:</span>
            <div className="flex items-center gap-1.5">
              {(['All', 'Pending', 'Uploaded'] as const).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setActiveFilter(f)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                    activeFilter === f
                      ? "bg-[#1B5DF1] text-white border-[#1B5DF1] shadow-xs"
                      : "bg-surface border-border text-foreground/80 hover:bg-gray-50"
                  )}
                >
                  {f === 'All' ? `All (${allReports.length})` : f === 'Pending' ? `Pending (${pendingCount})` : `Uploaded (${uploadedCount})`}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs text-muted font-semibold">
            Showing <strong className="text-foreground">{filteredReports.length}</strong> items in list format
          </span>
        </div>

        {/* ── 4. All Items in List Format (Exact User Requirement) ─────────── */}
        <div className="w-full">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-24 rounded-2xl bg-surface border border-border animate-pulse" />
                ))}
              </div>
            ) : filteredReports.length === 0 ? (
              <motion.div 
                key="empty" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="flex flex-col items-center justify-center py-16 text-center bg-surface rounded-2xl border border-border p-6"
              >
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-3 text-muted">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-foreground">No reports match your filters</h3>
                <p className="text-xs text-muted max-w-xs mt-1">
                  Try changing your service mode or status filter to see diagnostic orders.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter('All')
                    setActiveMainSection('All')
                    setSearchQuery('')
                  }}
                  className="mt-4 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all cursor-pointer"
                >
                  Reset All Filters
                </button>
              </motion.div>
            ) : (
              <div className="flex flex-col gap-3 w-full">
                {filteredReports.map((report, idx) => (
                  <motion.div
                    key={report.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ delay: idx * 0.02 }}
                    onClick={() => {
                      // Opens in separate full page with all details
                      if (report.isUploaded) {
                        navigate(`/lab/report/${report.id}`)
                      } else {
                        navigate(`/lab/order/${report.id}`)
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        if (report.isUploaded) {
                          navigate(`/lab/report/${report.id}`)
                        } else {
                          navigate(`/lab/order/${report.id}`)
                        }
                      }
                    }}
                    className="bg-surface rounded-2xl p-4 md:p-5 border border-border hover:border-primary/50 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group active:scale-[0.995]"
                    title="Click to open report details in full page"
                  >
                    
                    {/* Left & Middle Column */}
                    <div className="flex items-start md:items-center gap-3.5 flex-1 min-w-0">
                      
                      {/* Avatar initials container */}
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shrink-0 border transition-transform group-hover:scale-105 shadow-2xs",
                        report.isUploaded
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-blue-50 text-primary border-blue-200"
                      )}>
                        {report.patient.charAt(0).toUpperCase()}
                      </div>

                      {/* Patient & Test Details */}
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[15px] font-bold text-foreground group-hover:text-primary transition-colors">
                            {report.patient}
                          </span>
                          <span className={cn(
                            "text-[10px] font-black uppercase px-2 py-0.5 rounded-md border",
                            report.type === 'Home Collection'
                              ? "bg-teal-50 text-teal-700 border-teal-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          )}>
                            {report.type}
                          </span>
                          <span className="text-[11px] font-mono text-muted font-semibold">
                            ID: {report.idDisplay}
                          </span>
                        </div>

                        {/* Diagnostic Tests Line */}
                        <div className="flex items-center gap-2 mt-1 flex-wrap text-xs">
                          <span className="font-bold text-foreground/90 truncate max-w-sm md:max-w-md">
                            {report.test}
                          </span>
                          <span className="text-muted">•</span>
                          <span className="text-muted text-[11px] bg-gray-100 px-1.5 py-0.5 rounded font-medium">
                            Specimen: {report.specimen}
                          </span>
                          {report.patientPhone && (
                            <>
                              <span className="text-muted">•</span>
                              <span className="text-muted text-[11px] font-medium">
                                📞 {report.patientPhone}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Date & Location Note */}
                        <div className="flex items-center gap-2 text-[11px] text-muted mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-primary" />
                            {report.date}
                          </span>
                          {report.address && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[200px] md:max-w-sm">
                                📍 {report.address}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Status Badge & Open Actions */}
                    <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/60">
                      
                      {/* Status Badge */}
                      <div>
                        {report.isUploaded ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Uploaded</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Pending Upload</span>
                          </span>
                        )}
                      </div>

                      {/* Action Buttons to open full page with all details */}
                      <div className="flex items-center gap-2">
                        {report.isUploaded ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/lab/report/${report.id}`)
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 text-primary border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100 active:scale-95 transition-all shadow-2xs cursor-pointer"
                            title="Open Diagnostic Report page"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Report</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/lab/order/${report.id}`)
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold hover:bg-amber-100 active:scale-95 transition-all shadow-2xs cursor-pointer"
                            title="Upload Diagnostic Report with Order & Patient Details"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload Report</span>
                          </button>
                        )}

                        {/* Full Order Details Link */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/lab/order/${report.id}`)
                          }}
                          className="p-2 text-muted hover:text-foreground rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                          title="Open Complete Order & Patient Details"
                        >
                          <ChevronRight className="w-4 h-4 text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </button>
                      </div>

                    </div>
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
