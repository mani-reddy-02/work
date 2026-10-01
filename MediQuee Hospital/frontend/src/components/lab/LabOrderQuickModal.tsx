import { motion, AnimatePresence } from "framer-motion"
import { X, User, Phone, MapPin, Calendar, Clock, FlaskConical, Loader2, ArrowRight, CheckCircle2, FileText, Eye, Upload } from "lucide-react"
import { StatusBadge } from "@/components/lab/LabUI"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { labApi } from "@/services/labApi"
import { useToast } from "@/context/ToastContext"

interface LabOrderQuickModalProps {
  order: any | null
  isOpen: boolean
  onClose: () => void
  onOrderUpdated?: () => void
}

export function LabOrderQuickModal({ order, isOpen, onClose, onOrderUpdated }: LabOrderQuickModalProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)

  if (!isOpen || !order) return null

  // Safe patient normalization
  const patientName = typeof order.patient === 'object' && order.patient !== null
    ? order.patient?.name || 'Walk-in Patient'
    : (typeof order.patient === 'string' && order.patient ? order.patient : 'Walk-in Patient')

  const patientPhone = typeof order.patient === 'object' && order.patient !== null
    ? order.patient?.phone || order.phone || ''
    : order.phone || ''

  // Safe test list normalization
  const testItems = Array.isArray(order.items) && order.items.length > 0
    ? order.items.map((it: any) => ({
        name: it.labTest?.platformTest?.name || it.testName || 'Diagnostic Test',
        sample: it.labTest?.platformTest?.specimenType || 'Specimen',
        price: it.price || it.labTest?.price || 0
      }))
    : [{
        name: order.test || 'Diagnostic Test',
        sample: order.sample || 'Standard Sample',
        price: order.totalAmount || order.price || 0
      }]

  const totalAmount = order.totalAmount ?? order.price ?? testItems.reduce((acc: number, t: any) => acc + (t.price || 0), 0)
  
  const rawStatus = (order.rawStatus || order.status || 'PENDING').toUpperCase()
  let badgeStatus: any = 'pending'
  if (rawStatus === 'SAMPLE_COLLECTED') badgeStatus = 'collected'
  else if (rawStatus === 'IN_LAB_PROCESSING') badgeStatus = 'processing'
  else if (rawStatus === 'REPORT_READY') badgeStatus = 'ready'
  else if (rawStatus === 'CANCELLED') badgeStatus = 'cancelled'

  const formattedTime = order.time || (order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today')
  const formattedDate = order.collectionDate 
    ? new Date(order.collectionDate).toLocaleDateString() 
    : (order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Today')

  const handleUpdateStatus = async (nextStatus: string, payload: any = {}) => {
    setIsUpdating(true)
    try {
      await labApi.updateLabBookingStatus(order.id, { status: nextStatus, ...payload })
      toast(`Order marked as ${nextStatus.replace(/_/g, ' ')}`, "success")
      onClose()
      if (onOrderUpdated) onOrderUpdated()
    } catch (err: any) {
      toast(err.message || "Failed to update status", "error")
    } finally {
      setIsUpdating(false)
    }
  }

  const getNextAction = () => {
    if (rawStatus === 'REQUESTED' || rawStatus === 'PENDING') {
      if (order.bookingType === 'HOME_COLLECTION') {
        return {
          label: 'Assign Technician',
          onClick: () => {
            onClose()
            navigate(`/lab/orders?status=PENDING`)
          }
        }
      }
      return {
        label: 'Mark Collected',
        onClick: () => handleUpdateStatus('SAMPLE_COLLECTED')
      }
    }
    if (rawStatus === 'ASSIGNED') {
      return {
        label: 'Mark Collected',
        onClick: () => handleUpdateStatus('SAMPLE_COLLECTED')
      }
    }
    if (rawStatus === 'SAMPLE_COLLECTED') {
      return {
        label: 'Start Processing',
        onClick: () => handleUpdateStatus('IN_LAB_PROCESSING')
      }
    }
    if (rawStatus === 'IN_LAB_PROCESSING') {
      return {
        label: 'Upload Report',
        onClick: () => {
          onClose()
          navigate(`/lab/upload-report?orderId=${order.id}`)
        }
      }
    }
    if (rawStatus === 'REPORT_READY') {
      return {
        label: 'View Report',
        onClick: () => {
          onClose()
          navigate(`/lab/report/${order.id}`)
        }
      }
    }
    return null
  }

  const action = getNextAction()

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#172033]/50 backdrop-blur-xs transition-opacity"
        />

        {/* Modal / Sheet Container */}
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="relative w-full max-w-lg bg-surface rounded-t-3xl sm:rounded-3xl shadow-2xl border border-border overflow-hidden z-10 max-h-[90vh] flex flex-col"
        >
          {/* Mobile Handle */}
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-primary uppercase tracking-wider">Order Details</p>
                <h3 className="text-[16px] font-bold text-[#172033]">
                  ID: {order.id?.slice(0, 8)?.toUpperCase()}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={badgeStatus} />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-[#667085] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-5 flex flex-col gap-4 overflow-y-auto">
            {/* Patient Info Card */}
            <div className="bg-[#F8FAFC] border border-border/70 rounded-2xl p-4 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-blue-100/80 text-primary flex items-center justify-center font-bold text-[18px] shrink-0">
                {patientName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[15px] font-bold text-[#172033] truncate">{patientName}</h4>
                {patientPhone ? (
                  <a
                    href={`tel:${patientPhone}`}
                    className="inline-flex items-center gap-1.5 text-[13px] text-primary hover:underline font-medium mt-0.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {patientPhone}
                  </a>
                ) : (
                  <span className="text-[12px] text-[#667085]">Phone not provided</span>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="text-[16px] font-bold text-primary">₹{totalAmount}</span>
                <p className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md mt-0.5">Paid</p>
              </div>
            </div>

            {/* Test Details */}
            <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2.5">
              <p className="text-[12px] font-bold text-[#667085] uppercase tracking-wider">Ordered Tests ({testItems.length})</p>
              <div className="flex flex-col gap-2">
                {testItems.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-gray-50/80 border border-border/60">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <FlaskConical className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-[#172033] truncate">{item.name}</p>
                        <p className="text-[11px] text-[#667085]">Specimen: {item.sample}</p>
                      </div>
                    </div>
                    {item.price > 0 && (
                      <span className="text-[13px] font-bold text-[#172033] shrink-0">₹{item.price}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule & Location */}
            <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2.5">
              <p className="text-[12px] font-bold text-[#667085] uppercase tracking-wider">Schedule & Delivery</p>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#667085] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#98A2B3]" /> Order Time:
                </span>
                <span className="font-semibold text-[#172033]">{formattedDate} · {formattedTime}</span>
              </div>
              {order.collectionTimeSlot && (
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#667085] flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#98A2B3]" /> Slot:
                  </span>
                  <span className="font-semibold text-[#172033]">{order.collectionTimeSlot}</span>
                </div>
              )}
              {order.collectionAddress && (
                <div className="pt-2 border-t border-gray-100 flex items-start gap-2 text-[13px]">
                  <MapPin className="w-4 h-4 text-[#98A2B3] shrink-0 mt-0.5" />
                  <span className="text-[#475467] leading-relaxed">{order.collectionAddress}</span>
                </div>
              )}
              {order.phlebotomistName && (
                <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-xl p-2.5 text-[12px] text-emerald-800 flex items-center justify-between">
                  <span className="font-medium">Technician: {order.phlebotomistName}</span>
                  {order.phlebotomistPhone && (
                    <a href={`tel:${order.phlebotomistPhone}`} className="font-bold underline text-emerald-900">
                      {order.phlebotomistPhone}
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Diagnostic Report Section for Completed Orders */}
            {rawStatus === 'REPORT_READY' && (
              <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Diagnostic Report Ready
                  </span>
                  <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Completed</span>
                </div>
                <p className="text-[13px] text-emerald-950 font-medium">
                  The examination report has been attached to this patient's order.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      navigate(`/lab/report/${order.id}`)
                    }}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Report
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      navigate(`/lab/upload-report?orderId=${order.id}`)
                    }}
                    className="flex-1 py-2 px-3 bg-surface border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Change or re-upload if any mistake happened"
                  >
                    <Upload className="w-3.5 h-3.5" /> Change / Re-upload
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="p-4 bg-gray-50 border-t border-border flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                onClose()
                navigate(`/lab/order/${order.id}`)
              }}
              className="flex-1 py-3 px-4 rounded-xl border border-border bg-surface text-[#172033] font-semibold text-[13px] hover:bg-gray-100 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Full Order Details <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {action && (
              <button
                type="button"
                disabled={isUpdating}
                onClick={action.onClick}
                className="flex-1 py-3 px-4 rounded-xl bg-primary text-white font-semibold text-[13px] hover:bg-blue-700 active:bg-blue-800 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                {action.label}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
