import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, User, Phone, Upload, Eye, Share2, FlaskConical, CheckCircle2, Loader2, MapPin, Calendar, Clock } from "lucide-react"
import { motion } from "framer-motion"
import { StatusBadge } from "@/components/lab/LabUI"
import { cn } from "@/lib/utils"
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

  const fetchDetail = async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await labApi.getLabBookingById(id)
      if (res.success && res.data) {
        setBooking(res.data)
      } else {
        throw new Error(res.error?.message || "Order not found")
      }
    } catch (err: any) {
      console.error("Order detail error:", err)
      setError(err.message || "Order not found")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
  }, [id])

  const updateStatus = async (nextStatus: string, payload: any = {}) => {
    if (!id) return
    setIsUpdating(true)
    try {
      await labApi.updateLabBookingStatus(id, { status: nextStatus, ...payload })
      toast(`Order updated to ${nextStatus.replace(/_/g, ' ')}`, "success")
      fetchDetail()
    } catch (err: any) {
      toast(err.message || "Failed to update order", "error")
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-[14px] text-[#667085] font-medium">Loading real order data...</p>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-2xl">!</div>
        <p className="text-[18px] font-bold text-[#172033]">Order Not Found</p>
        <p className="text-[14px] text-[#667085] max-w-sm">
          {error || "The requested lab order could not be located in the database."}
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

  const tests = booking.items?.map((it: any) => it.labTest?.platformTest?.name || 'Diagnostic Test') || ['Diagnostic Test']
  const sample = booking.items?.[0]?.labTest?.platformTest?.specimenType || 'SAMPLE'
  
  let sampleStatus: any = 'pending'
  if (booking.status === 'SAMPLE_COLLECTED') sampleStatus = 'collected'
  else if (booking.status === 'IN_LAB_PROCESSING') sampleStatus = 'processing'
  else if (booking.status === 'REPORT_READY') sampleStatus = 'ready'
  else if (booking.status === 'CANCELLED') sampleStatus = 'cancelled'

  const dateStr = booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today'
  const timeStr = booking.createdAt ? new Date(booking.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-[#F8FAFC]">
        <p className="text-[12px] font-bold text-[#667085] uppercase tracking-wide">{title}</p>
      </div>
      <div className="px-4 py-4 flex flex-col gap-3">{children}</div>
    </div>
  )

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-center justify-between text-[13px] md:text-[14px]">
      <span className="text-[#667085] font-medium">{label}</span>
      <span className="font-semibold text-[#172033]">{value}</span>
    </div>
  )

  return (
    <div className="flex flex-col bg-background min-h-screen">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-4 md:pt-6 pb-3 md:pb-4 px-4 md:px-6 flex items-center gap-3 border-b border-border/50">
        <button 
          onClick={() => navigate('/lab/orders')} 
          className="p-2 -ml-2 text-[#172033] rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <div>
          <h1 className="text-[18px] md:text-[22px] font-bold text-[#172033]">Order Details</h1>
          <p className="text-[11px] md:text-[12px] text-[#667085]">ID: {booking.id}</p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={sampleStatus} size="md" />
        </div>
      </div>

      <div className="flex flex-col gap-4 md:gap-6 px-4 md:px-6 pt-5 md:pt-7 pb-24 w-full max-w-5xl mx-auto">

        {/* Order Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 6 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-primary/5 border border-primary/20 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div>
            <p className="text-[12px] text-primary font-bold uppercase tracking-wider">Order Reference</p>
            <p className="text-[18px] md:text-[22px] font-black text-primary tracking-tight">
              {booking.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-[12px] text-[#667085] font-medium">Booked Date & Time</p>
            <p className="text-[14px] md:text-[15px] font-bold text-[#172033]">{dateStr} · {timeStr}</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          {/* Left Column */}
          <div className="lg:col-span-7 flex flex-col gap-4 md:gap-6">
            {/* Patient Information */}
            <Section title="Patient Information">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-primary text-[18px]">
                  {booking.patient?.name?.charAt(0)?.toUpperCase() || 'P'}
                </div>
                <div>
                  <p className="text-[16px] md:text-[17px] font-bold text-[#172033]">{booking.patient?.name || 'Walk-in Patient'}</p>
                  {booking.patient?.phone && (
                    <a href={`tel:${booking.patient.phone}`} className="flex items-center gap-1.5 mt-1 text-[13px] text-primary font-semibold hover:underline">
                      <Phone className="w-3.5 h-3.5" />
                      {booking.patient.phone}
                    </a>
                  )}
                </div>
              </div>
            </Section>

            {/* Test Catalog Offerings */}
            <Section title="Ordered Tests">
              {booking.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 border border-border/80">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-100/70 text-primary rounded-xl flex items-center justify-center shrink-0">
                      <FlaskConical className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[14px] font-bold text-[#172033]">
                        {item.labTest?.platformTest?.name || 'Test Offering'}
                      </span>
                      <p className="text-[11px] text-[#667085]">
                        Specimen: {item.labTest?.platformTest?.specimenType || 'SAMPLE'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[14px] font-bold text-[#172033]">₹{item.price}</span>
                </div>
              ))}
            </Section>

            {/* Payment & Charges */}
            <Section title="Payment & Pricing">
              <Row label="Booking Type" value={booking.bookingType === 'HOME_COLLECTION' ? 'Home Sample Collection' : 'Walk-in Diagnostic Test'} />
              {booking.homeCollectionFee > 0 && (
                <Row label="Home Collection Fee" value={`₹${booking.homeCollectionFee}`} />
              )}
              <Row label="Total Amount" value={<span className="text-[16px] md:text-[18px] font-extrabold text-primary">₹{booking.totalAmount}</span>} />
              <Row label="Payment Status" value={<span className="px-2 py-0.5 rounded-md text-[12px] font-bold bg-emerald-50 text-emerald-700">PAID (Online)</span>} />
            </Section>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-5 flex flex-col gap-4 md:gap-6">
            {/* Status & Processing */}
            <Section title="Sample & Report Status">
              <Row label="Sample Type" value={sample} />
              <Row label="Current Status" value={<StatusBadge status={sampleStatus} />} />
              <Row label="Report" value={
                booking.status === 'REPORT_READY'
                  ? <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />Ready</span>
                  : <span className="text-amber-600 font-semibold">In Progress</span>
              } />
            </Section>

            {/* Home Collection Details if applicable */}
            {booking.bookingType === 'HOME_COLLECTION' && (
              <Section title="Collection Logistics">
                {booking.collectionTimeSlot && (
                  <Row label="Selected Slot" value={booking.collectionTimeSlot} />
                )}
                {booking.collectionAddress && (
                  <div className="flex flex-col gap-1 pt-1">
                    <span className="text-[12px] text-[#667085] font-medium">Pickup Address:</span>
                    <p className="text-[13px] font-semibold text-[#172033] bg-gray-50 p-2.5 rounded-xl border border-border">
                      {booking.collectionAddress}
                    </p>
                  </div>
                )}
                {booking.phlebotomistName && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-col gap-1">
                    <p className="text-[12px] font-bold text-emerald-800">Assigned Technician</p>
                    <p className="text-[13px] font-semibold text-emerald-900">{booking.phlebotomistName}</p>
                    {booking.phlebotomistPhone && (
                      <p className="text-[12px] text-emerald-700 font-medium">Phone: {booking.phlebotomistPhone}</p>
                    )}
                  </div>
                )}
              </Section>
            )}

            {/* Workflow Progress Actions */}
            <div className="bg-surface rounded-2xl border border-border shadow-sm p-4 flex flex-col gap-3">
              <p className="text-[12px] font-bold text-[#667085] uppercase tracking-wide">Workflow Actions</p>

              {booking.status === 'REQUESTED' && (
                <button
                  disabled={isUpdating}
                  onClick={() => updateStatus('SAMPLE_COLLECTED')}
                  className="w-full py-3 px-4 bg-primary text-white font-bold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Mark Sample Collected"}
                </button>
              )}

              {booking.status === 'ASSIGNED' && (
                <button
                  disabled={isUpdating}
                  onClick={() => updateStatus('SAMPLE_COLLECTED')}
                  className="w-full py-3 px-4 bg-primary text-white font-bold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Mark Sample Collected"}
                </button>
              )}

              {booking.status === 'SAMPLE_COLLECTED' && (
                <button
                  disabled={isUpdating}
                  onClick={() => updateStatus('IN_LAB_PROCESSING')}
                  className="w-full py-3 px-4 bg-primary text-white font-bold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Lab Processing"}
                </button>
              )}

              {booking.status === 'IN_LAB_PROCESSING' && (
                <button
                  disabled={isUpdating}
                  onClick={() => updateStatus('REPORT_READY')}
                  className="w-full py-3 px-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Mark Report Ready"}
                </button>
              )}

              {booking.status === 'REPORT_READY' && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-[13px] font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  Report is completed and available for patient.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
