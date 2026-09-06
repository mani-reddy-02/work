import { ArrowLeft, FileSignature, CheckCircle2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"

export function EPrescriptionSettings() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/30 pb-12">
      <div className="sticky top-0 z-30 pt-4 pb-3 px-4 flex items-center gap-3 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </button>
        <h1 className="text-[20px] font-black text-[#0A1A3D] tracking-tight">E-Prescription Settings</h1>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4 border-b border-gray-50 pb-4">
            <div className="w-12 h-12 rounded-xl bg-[#EBF5FF] flex items-center justify-center shrink-0">
              <FileSignature className="w-6 h-6 text-[#1B5DF1]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0A1A3D]">Digital Signature</h2>
              <p className="text-sm text-gray-500 font-medium">Manage your e-prescribing signature</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="h-32 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
              <span className="font-dancing-script text-3xl text-[#0A1A3D] opacity-80">Jane Smith</span>
              <span className="text-xs font-bold uppercase mt-2 opacity-60">Current Signature</span>
            </div>
            <button className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors">
              Update Signature
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col gap-4">
          <h3 className="font-bold text-[#0A1A3D]">Preferences</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800">Save Favorite Medicines</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Quickly add frequently prescribed drugs</p>
            </div>
            <div className="w-12 h-6 bg-[#1B5DF1] rounded-full relative shadow-inner">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-gray-50">
            <div>
              <p className="font-semibold text-gray-800">Auto-add Generic Names</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Include generic equivalents in print</p>
            </div>
            <div className="w-12 h-6 bg-[#1B5DF1] rounded-full relative shadow-inner">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
        </motion.div>
        
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-2 w-full bg-[#1B5DF1] text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors">
          <CheckCircle2 className="w-5 h-5" /> Save Changes
        </motion.button>
      </div>
    </div>
  )
}
