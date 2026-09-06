import { NavLink, useLocation } from "react-router-dom"
import { LayoutGrid, Calendar, IndianRupee, User, Plus, Video, Home, Users, Activity } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

export function SideNav({ onQuickAdd }: { onQuickAdd: () => void }) {
  const location = useLocation()
  const { role } = useAuth()

  const displayName = role === 'lab' ? 'MediQuee Lab' : 'MediQuee Hospital';

  const getLinks = () => {
    switch (role) {
      case 'doctor':
        return [
          { to: '/doctor', icon: LayoutGrid, label: 'Dashboard' },
          { to: '/appointments', icon: Calendar, label: "Today's OPs" },
          { to: '/video-consultations', icon: Video, label: 'Video Consults', badge: 'V2 Preview' },
          { to: '/profile', icon: User, label: 'Profile' },
        ];
      case 'nurse':
        return [
          { to: '/nurse', icon: LayoutGrid, label: 'Dashboard' },
          { to: '/nurse/visits', icon: Home, label: 'Visits' },
          { to: '/nurse/calendar', icon: Calendar, label: 'Calendar' },
          { to: '/profile', icon: User, label: 'Profile' },
        ];
      case 'receptionist':
        return [
          { to: '/receptionist', icon: LayoutGrid, label: 'Dashboard' },
          { to: '/receptionist/queue', icon: Users, label: 'Queue Management' },
          { to: '/receptionist/appointments', icon: Calendar, label: 'Appointments' },
          { to: '/profile', icon: User, label: 'Profile' },
        ];
      case 'admin':
      default:
        return [
          { to: '/dashboard', icon: LayoutGrid, label: 'Dashboard' },
          { to: '/appointments', icon: Calendar, label: 'Appointments' },
          { to: '/payouts', icon: IndianRupee, label: 'Payouts' },
          { to: '/profile', icon: User, label: 'Profile' },
        ];
    }
  }

  const links = getLinks();

  return (
    <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 h-screen sticky top-0 p-4 shrink-0 shadow-sm z-50">
      
      <div className="text-[#0A1A3D] font-bold text-xl flex items-center gap-2 mb-8 px-4 pt-4">
        <Activity className="w-8 h-8 text-[#1A56DB]" /> {displayName}
      </div>

      <nav className="flex flex-col gap-2 flex-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink 
              key={link.to}
              to={link.to} 
              className={({ isActive }) => 
                cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium relative", 
                isActive || (link.to !== '/dashboard' && link.to !== '/doctor' && link.to !== '/nurse' && link.to !== '/receptionist' && location.pathname.includes(link.to)) ? "bg-[#EBF5FF] text-[#1A56DB]" : "text-gray-600 hover:bg-gray-50 hover:text-[#0A1A3D]")
              }
            >
              <Icon className="w-5 h-5" />
              <span>{link.label}</span>
              {link.badge && (
                <span className="ml-auto bg-[#EBF5FF] text-[#1A56DB] text-[10px] font-bold px-2 py-0.5 rounded border border-[#1A56DB]/20">
                  {link.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Quick Add Button (Admin Only) */}
      {role === 'admin' ? (
        <div className="mt-auto mb-4">
          <button 
            onClick={onQuickAdd}
            className="w-full bg-[#1A56DB] text-white p-4 rounded-xl shadow-[0_8px_16px_rgba(26,86,219,0.25)] flex items-center justify-center gap-2 hover:bg-[#0A1A3D] transition-colors">
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Quick Add</span>
          </button>
        </div>
      ) : null}
    </div>
  )
}
