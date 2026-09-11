import { ArrowLeft, User, Camera, Save, Briefcase, Stethoscope, FileCheck, IndianRupee, Clock } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

export function ProfileEdit() {
  const navigate = useNavigate();
  const { role } = useAuth();
  
  const roleName = role === 'admin' ? 'Admin User' :
                   role === 'doctor' ? 'Dr. Sarah Smith' :
                   role === 'nurse' ? 'Nurse Jane Doe' :
                   role === 'receptionist' ? 'Alice Brown' :
                   'Lab Technician';

  const isDoctor = role === 'doctor';
  const primaryColor = isDoctor ? "bg-[#1B5DF1] hover:bg-[#1B5DF1]/90" : "bg-[#1A56DB] hover:bg-[#1A56DB]/90";
  const primaryText = isDoctor ? "text-[#1B5DF1]" : "text-[#1A56DB]";
  const primaryBgSoft = isDoctor ? "bg-[#1B5DF1]/10" : "bg-[#1A56DB]/10";

  return (
    <div className="flex flex-col bg-gray-50 min-h-[calc(100vh-80px)] pb-8">
      <div className="sticky top-0 z-30 bg-white pt-4 pb-3 px-4 border-b border-gray-100 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Edit Profile</h1>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-6">
        <div className="flex flex-col items-center gap-4 mt-2">
          <div className="relative">
            <div className={cn("w-24 h-24 rounded-full flex items-center justify-center border-2 border-white shadow-md overflow-hidden", primaryBgSoft, primaryText)}>
              <User className="w-10 h-10" />
            </div>
            <button className={cn("absolute bottom-0 right-0 w-8 h-8 text-white rounded-full flex items-center justify-center border-2 border-white transition-colors", primaryColor)}>
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-5">
          <h3 className="font-bold text-[#0A1A3D] border-b border-gray-100 pb-2">Basic Information</h3>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Full Name</label>
            <input type="text" defaultValue={roleName} className={cn("bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1", isDoctor ? "focus:border-[#1B5DF1] focus:ring-[#1B5DF1]" : "focus:border-[#1A56DB] focus:ring-[#1A56DB]")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Email Address</label>
            <input type="email" defaultValue="user@mediquee.com" className={cn("bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1", isDoctor ? "focus:border-[#1B5DF1] focus:ring-[#1B5DF1]" : "focus:border-[#1A56DB] focus:ring-[#1A56DB]")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Phone Number</label>
            <input type="tel" defaultValue="+91 9876543210" className={cn("bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1", isDoctor ? "focus:border-[#1B5DF1] focus:ring-[#1B5DF1]" : "focus:border-[#1A56DB] focus:ring-[#1A56DB]")} />
          </div>
        </div>

        {isDoctor && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-5">
            <h3 className="font-bold text-[#0A1A3D] border-b border-gray-100 pb-2">Professional Details</h3>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><FileCheck className="w-4 h-4 text-gray-400" /> License Number</label>
              <input type="text" defaultValue="MCI-12345" className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-1 focus:ring-[#1B5DF1]" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><Stethoscope className="w-4 h-4 text-gray-400" /> Specialization</label>
              <input type="text" defaultValue="Cardiology" className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-1 focus:ring-[#1B5DF1]" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-gray-400" /> Qualification</label>
              <input type="text" defaultValue="MBBS, MD (Cardiology)" className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-1 focus:ring-[#1B5DF1]" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-400" /> Experience (Years)</label>
              <input type="number" defaultValue="12" className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-1 focus:ring-[#1B5DF1]" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><IndianRupee className="w-4 h-4 text-gray-400" /> Consultation Fee</label>
              <input type="number" defaultValue="800" className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-1 focus:ring-[#1B5DF1]" />
            </div>
          </div>
        )}

        <button className={cn("text-white font-bold rounded-xl py-3.5 flex items-center justify-center gap-2 transition-colors mt-2 shadow-lg", primaryColor)}>
          <Save className="w-5 h-5" /> Save Changes
        </button>
      </div>
    </div>
  )
}
