import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Search, Loader2 } from "lucide-react"
import { adminApi } from "@/services/adminApi"

interface WalkInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function WalkInModal({ isOpen, onClose, onSuccess }: WalkInModalProps) {
  const [departments, setDepartments] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [selectedDept, setSelectedDept] = useState("")
  const [selectedDoctor, setSelectedDoctor] = useState("")
  const [patientName, setPatientName] = useState("")
  const [patientPhone, setPatientPhone] = useState("")
  const [fee, setFee] = useState("")
  
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Fetch departments when modal opens
  useEffect(() => {
    if (isOpen) {
      loadDepartments()
      // Reset state
      setSelectedDept("")
      setSelectedDoctor("")
      setPatientName("")
      setPatientPhone("")
      setFee("")
      setError("")
    }
  }, [isOpen])

  const loadDepartments = async () => {
    setIsLoading(true)
    try {
      const data = await adminApi.getDepartments()
      setDepartments(data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch doctors when department is selected
  useEffect(() => {
    if (selectedDept) {
      loadDoctors()
    } else {
      setDoctors([])
    }
  }, [selectedDept])

  const loadDoctors = async () => {
    try {
      const data = await adminApi.getStaff()
      // Filter only doctors in this department
      const filtered = data.filter((s: any) => s.role === 'DOCTOR' && s.department?.id === selectedDept)
      setDoctors(filtered)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDept || !selectedDoctor || !patientName) {
      setError("Please fill all required fields")
      return
    }

    setIsSubmitting(true)
    setError("")
    try {
      await adminApi.createWalkInBooking({
        departmentId: selectedDept,
        doctorId: selectedDoctor,
        patientName,
        patientPhone: patientPhone || undefined,
        fee: Number(fee) || 0
      })
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to create booking")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-surface rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-border bg-gray-50/50">
              <h2 className="text-xl font-bold text-[#0A1A3D]">New Walk-In Booking</h2>
              <button onClick={onClose} className="p-2 bg-surface rounded-full text-muted/70 hover:text-gray-600 shadow-sm border border-border">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[70vh]">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-semibold text-center border border-red-100">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-foreground/80">Department *</label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3.5 text-[15px] font-medium outline-none focus:border-[#1B5DF1] focus:bg-surface transition-colors"
                  disabled={isLoading}
                >
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-foreground/80">Doctor *</label>
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3.5 text-[15px] font-medium outline-none focus:border-[#1B5DF1] focus:bg-surface transition-colors disabled:opacity-50"
                  disabled={!selectedDept || isLoading}
                >
                  <option value="">Select Doctor</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-foreground/80">Patient Name *</label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3.5 text-[15px] font-medium outline-none focus:border-[#1B5DF1] focus:bg-surface transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-foreground/80">Phone (Optional)</label>
                  <input
                    type="text"
                    placeholder="Mobile number"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full bg-gray-50 border border-border rounded-xl px-4 py-3.5 text-[15px] font-medium outline-none focus:border-[#1B5DF1] focus:bg-surface transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-foreground/80">Consultation Fee</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/70 font-bold">₹</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={fee}
                      onChange={(e) => setFee(e.target.value)}
                      className="w-full bg-gray-50 border border-border rounded-xl pl-8 pr-4 py-3.5 text-[15px] font-medium outline-none focus:border-[#1B5DF1] focus:bg-surface transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-border flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3.5 rounded-xl font-bold text-gray-600 bg-surface border border-border hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 rounded-xl font-bold text-white bg-[#1B5DF1] hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm Walk-In
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
