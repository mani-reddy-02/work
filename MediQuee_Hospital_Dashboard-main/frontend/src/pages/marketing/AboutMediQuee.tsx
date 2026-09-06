import { ArrowLeft, Stethoscope, Users, Building2, ShieldCheck, Activity } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"

export function AboutMediQuee() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col bg-white min-h-[calc(100vh-80px)] pb-24">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-blue-600 to-indigo-800 text-white rounded-b-[40px] shadow-lg pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="relative z-10">
          <div className="pt-4 pb-3 px-4 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </div>
          <div className="px-6 pt-4 pb-2">
            <h1 className="text-3xl font-bold mb-2">About MediQuee</h1>
            <p className="text-blue-100 text-sm leading-relaxed">
              Transforming healthcare delivery with next-generation smart hospital management.
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-6 relative z-20 flex flex-col gap-6">
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 shadow-xl shadow-blue-900/5 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" /> Our Mission
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            At MediQuee, our mission is to empower hospitals with cutting-edge technology that bridges the gap between healthcare providers and patients. We streamline daily operations, enabling doctors and staff to focus on what truly matters: saving lives and improving patient outcomes.
          </p>
        </motion.div>

        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold text-gray-900 px-2">Key Features</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex flex-col gap-3">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Patient Care</h4>
                <p className="text-xs text-gray-500 mt-1">Seamless queue & appointment management.</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex flex-col gap-3">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Facility Admin</h4>
                <p className="text-xs text-gray-500 mt-1">Comprehensive departmental tracking.</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="bg-purple-50/50 border border-purple-100 rounded-2xl p-4 flex flex-col gap-3">
              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Telemedicine</h4>
                <p className="text-xs text-gray-500 mt-1">Integrated high-quality video consults.</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4 flex flex-col gap-3">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Data Security</h4>
                <p className="text-xs text-gray-500 mt-1">Enterprise-grade encryption and privacy.</p>
              </div>
            </motion.div>
          </div>
        </div>

      </div>
    </div>
  )
}
