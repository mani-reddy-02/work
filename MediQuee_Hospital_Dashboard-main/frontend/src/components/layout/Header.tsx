import { Bell } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import {} from "react"
import { cn } from "@/lib/utils"

export function Header() {
  const { role } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  
  const isDashboard = ['/dashboard', '/', '/doctor', '/nurse', '/receptionist', '/lab'].includes(location.pathname);

  const getScreenName = () => {
    const path = location.pathname.substring(1);
    if (!path) return '';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  const hideOnRoutes = ['/add-department', '/add-doctor', '/add-lab', '/add-nurse', '/add-receptionist'];
  if (hideOnRoutes.some(route => location.pathname.startsWith(route))) {
    return null;
  }

  let greeting = "";
  let subTitle = "";

  if (role === 'admin') {
    greeting = "City Care Hospital";
    subTitle = "HOSPITAL";
  } else if (role === 'doctor') {
    greeting = "Dr. Jane Smith";
    subTitle = "DOCTOR";
  } else if (role === 'nurse') {
    greeting = "Nurse User";
    subTitle = "NURSE";
  } else if (role === 'receptionist') {
    greeting = "Receptionist Name";
    subTitle = "RECEPTIONIST";
  } else if (role === 'lab') {
    greeting = "MediQuee Lab";
    subTitle = "LABORATORY";
  }

  const primaryColor = role === 'doctor' ? "text-[#1B5DF1]" : "text-[#1A56DB]";
  const primaryBg = role === 'doctor' ? "bg-[#1B5DF1]" : "bg-[#1A56DB]";

  return (
    <header className={cn("bg-white px-4 z-40 flex flex-col gap-3 shrink-0 relative", role === 'doctor' ? "pt-10 pb-1" : "pt-10 pb-3 border-b border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]")}>
      <div className="flex items-center justify-between">
        {isDashboard ? (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className="text-[#0A1A3D] font-bold text-[22px] flex items-center tracking-tight">
                MediQuee
              </div>
              <div className={cn("px-2.5 py-0.5 bg-[#EBF5FF] text-[10px] font-bold rounded-full uppercase tracking-wider", primaryColor)}>
                {subTitle}
              </div>
            </div>
            {role !== 'doctor' && (
              <div className="text-[13px] text-[#333333] font-semibold ml-0.5 mt-0.5">
                {greeting}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center w-full relative h-8">
            <h1 className="text-[17px] font-semibold text-[#0A1A3D]">{getScreenName()}</h1>
          </div>
        )}

        {isDashboard && (
          <div className="flex items-center gap-3 relative">
            <button onClick={() => navigate('/notifications')} className="relative p-1 text-gray-700 hover:text-[#0A1A3D] transition-colors interactive-element">
              <Bell className="w-6 h-6" strokeWidth={2} />
              <span className={cn("absolute top-0.5 right-1 w-3.5 h-3.5 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white", primaryBg)}>3</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
