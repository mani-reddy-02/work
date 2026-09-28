import { motion, AnimatePresence } from "framer-motion"
import { X, User, Phone, MapPin, Calendar, Clock, DollarSign, FlaskConical, ChevronRight, CheckCircle2, Loader2, ArrowRight } from "lucide-react"
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
    const raw = (order.rawStatus || order.status || '').toUpperCase()
    if (raw === 'REQUESTED') {
      if (order.bookingType === 'HOME_COLLECTION') {
        return {
          label: 'Assign Phlebotomist',
          onClick: () => {
            onClose()
            navigate(`/lab/orders?status=REQUESTED`)
          }
        }
      }
      return {
        label: 'Mark Sample Collected',
        onClick: () => handleUpdateStatus('SAMPLE_COLLECTED')
      }
    }
    if (raw === 'ASSIGNED') {
      return {
        label: 'Mark Sample Collected',
        onClick: () => handleUpdateStatus('SAMPLE_COLLECTED')
      }
    }
    if (raw === 'SAMPLE_COLLECTED') {
      return {
        label: 'Start Lab Processing',
        onClick: () => handleUpdateStatus('IN_LAB_PROCESSING')
      }
    }
    if (raw === 'IN_LAB_PROCESSING') {
      return {
        label: 'Upload Report',
        onClick: () => {
          onClose()
          navigate(`/lab/upload-report?orderId=${order.id}`)
        }
      }
    }
    if (raw === 'REPORT_READY') {
      return {
        label: 'View Final Report',
        onClick: () => {
          onClose()
          navigate(`/lab/order/${order.id}`)
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
          className="fixed inset-0 bg-[#172033]/50 backdrop-blur-sm"
        />

        {/* Modal / Bottom Sheet */}
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 280 }}
          className="relative w-full max-w-lg bg-surface rounded-t-3xl sm:rounded-3xl shadow-2xl border border-border overflow-hidden z-10 max-h-[90vh] flex flex-col"
        >
          {/* Top Handle for mobile */}
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-primary uppercase tracking-wide">Order Details</p>
                <h3 className="text-[16px] font-bold text-[#172033]">
                  ID: {order.id?.slice(0, 8)?.toUpperCase()}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={order.status} />
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-[#667085] transition-colors"
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
                {order.patient?.charAt(0)?.toUpperCase() || 'P'}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[15px] font-bold text-[#172033] truncate">{order.patient}</h4>
                {order.phone && (
                  <a
                    href={`tel:${order.phone}`}
                    className="inline-flex items-center gap-1.5 text-[13px] text-primary hover:underline font-medium mt-0.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {order.phone}
                  </a>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="text-[16px] font-bold text-[#172033]">₹{order.totalAmount}</span>
                <p className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md mt-0.5">Paid</p>
              </div>
            </div>

            {/* Test Details */}
            <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2.5">
              <p className="text-[12px] font-bold text-[#667085] uppercase tracking-wider">Test Information</p>
              <div className="flex items-start gap-2.5">
                <FlaskConical className="w-4 h-4 text-primary mt-1 shrink-0" />
                <div>
                  <p className="text-[14px] font-bold text-[#172033] leading-snug">{order.test}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100">
                      Sample: {order.sample}
                    </span>
                    <span className="text-[11px] font-semibold bg-gray-100 text-[#475467] px-2 py-0.5 rounded-md">
                      {order.bookingType === 'HOME_COLLECTION' ? 'Home Collection' : 'Walk-in'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule & Location */}
            <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2.5">
              <p className="text-[12px] font-bold text-[#667085] uppercase tracking-wider">Schedule & Delivery</p>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#667085] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#98A2B3]" /> Order Time:
                </span>
                <span className="font-semibold text-[#172033]">{order.time}</span>
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
          </div>

          {/* Action Footer */}
          <div className="p-4 bg-gray-50 border-t border-border flex items-center gap-3">
            <button
              onClick={() => {
                onClose()
                navigate(`/lab/order/${order.id}`)
              }}
              className="flex-1 py-3 px-4 rounded-xl border border-border bg-surface text-[#172033] font-semibold text-[13px] hover:bg-gray-100 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
            >
              Full Order Details <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {action && (
              <button
                disabled={isUpdating}
                onClick={action.onClick}
                className="flex-1 py-3 px-4 rounded-xl bg-primary text-white font-semibold text-[13px] hover:bg-blue-700 active:bg-blue-800 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : action.label}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
