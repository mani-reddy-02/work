import { ArrowLeft, Building2, MapPin, Phone, Mail } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"

export function HospitalInfo() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col bg-white min-h-[calc(100vh-80px)]">
      <div className="sticky top-0 z-30 bg-white pt-4 pb-3 px-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Hospital Information</h1>
      </div>

      <div className="p-4 flex flex-col gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <Building2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">City Care Hospital</h2>
          <p className="text-sm text-gray-500 font-medium">Registration No: CCH-2023-892</p>
        </motion.div>

        <div className="flex flex-col gap-4">
          <h3 className="font-semibold text-gray-900 px-1">Contact Details</h3>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50 flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900">Address</span>
                <span className="text-sm text-gray-600">123 Health Avenue, Medical District, City Center 400001</span>
              </div>
            </div>
            <div className="p-4 border-b border-gray-50 flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900">Phone</span>
                <span className="text-sm text-gray-600">+91 98765 43210</span>
              </div>
            </div>
            <div className="p-4 flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900">Email</span>
                <span className="text-sm text-gray-600">contact@citycare.com</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
