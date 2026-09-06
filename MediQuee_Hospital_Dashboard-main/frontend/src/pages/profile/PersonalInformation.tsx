import { ArrowLeft, User, Phone, Mail, MapPin } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useAuth } from "@/context/AuthContext"

export function PersonalInformation() {
  const navigate = useNavigate();
  const { role } = useAuth();
  
  const isDoctor = role === 'doctor';
  const isNurse = role === 'nurse';
  const name = isDoctor ? "Dr. Jane Smith" : isNurse ? "Nurse Jane" : "Sarah Connor";
  const title = isDoctor ? "Senior Cardiologist" : isNurse ? "Home Care Nurse" : "Front Desk Receptionist";
  const email = isDoctor ? "jane.smith@mediquee.com" : isNurse ? "jane.nurse@mediquee.com" : "sarah.c@mediquee.com";
  const licenseType = isDoctor ? "Medical License" : isNurse ? "Nursing License" : "Employee ID";
  const licenseNo = isDoctor ? "MCI-123456" : isNurse ? "NCI-987654" : "EMP-456789";

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/30 pb-12">
      <div className="sticky top-0 z-30 pt-4 pb-3 px-4 flex items-center gap-3 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </button>
        <h1 className="text-[20px] font-black text-[#0A1A3D] tracking-tight">Personal Information</h1>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-[#1B5DF1] text-white flex items-center justify-center text-3xl font-black mb-4 border-4 border-blue-50">
            J
          </div>
          <h2 className="text-xl font-bold text-[#0A1A3D]">{name}</h2>
          <p className="text-gray-500 font-medium">{title}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</p>
              <p className="font-semibold text-[#0A1A3D]">{email}</p>
            </div>
          </div>
          <div className="p-4 border-b border-gray-50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phone Number</p>
              <p className="font-semibold text-[#0A1A3D]">+91 98765 43210</p>
            </div>
          </div>
          <div className="p-4 border-b border-gray-50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{licenseType}</p>
              <p className="font-semibold text-[#0A1A3D]">{licenseNo}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Address</p>
              <p className="font-semibold text-[#0A1A3D]">123 Health Ave, Mumbai, India</p>
            </div>
          </div>
        </motion.div>

        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-2 w-full bg-[#1B5DF1] text-white p-4 rounded-xl font-bold hover:bg-blue-700 transition-colors">
          Edit Information
        </motion.button>
      </div>
    </div>
  )
}
