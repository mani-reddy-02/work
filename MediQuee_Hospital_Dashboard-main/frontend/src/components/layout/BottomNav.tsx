import { NavLink, useLocation } from "react-router-dom"
import { LayoutGrid, Calendar, IndianRupee, User, Plus, Home, Users, Stethoscope, Video, CalendarClock } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

export function BottomNav({ onQuickAdd }: { onQuickAdd: () => void }) {
  const location = useLocation()
  const { role } = useAuth()

  // Hide bottom nav on form pages that have their own fixed bottom buttons
  const hideOnRoutes = ['/add-department', '/add-doctor', '/add-lab', '/add-nurse', '/add-receptionist'];
  if (hideOnRoutes.some(route => location.pathname.startsWith(route))) {
    return null;
  }

  const getLinks = () => {
    switch (role) {
      case 'doctor':
        return [
          { to: '/doctor', icon: LayoutGrid, label: 'Home' },
          { to: '/doctor/ops', icon: Stethoscope, label: 'OPs' },
          { to: '/doctor/video-consultations', icon: Video, label: 'Video' },
          { to: '/doctor/availability', icon: CalendarClock, label: 'Availability' },
          { to: '/profile', icon: User, label: 'Profile' },
        ];
      case 'nurse':
        return [
          { to: '/nurse', icon: LayoutGrid, label: 'Home' },
          { to: '/nurse/visits', icon: Home, label: 'Visits' },
          { to: '/nurse/calendar', icon: Calendar, label: 'Calendar' },
          { to: '/profile', icon: User, label: 'Profile' },
        ];
      case 'receptionist':
        return [
          { to: '/receptionist', icon: LayoutGrid, label: 'Home' },
          { to: '/receptionist/queue', icon: Users, label: 'Queue' },
          { to: '/receptionist/appointments', icon: Calendar, label: 'Appointments' },
          { to: '/profile', icon: User, label: 'Profile' },
        ];
      case 'admin':
      default:
        return [
          { to: '/dashboard', icon: LayoutGrid, label: 'Home' },
          { to: '/appointments', icon: Calendar, label: 'Agenda' },
          { to: '/payouts', icon: IndianRupee, label: 'Payout' },
          { to: '/profile', icon: User, label: 'Profile' },
        ];
    }
  }

  const links = getLinks();
  const isAdmin = role === 'admin';
  const leftLinks = isAdmin ? links.slice(0, Math.ceil(links.length / 2)) : links;
  const rightLinks = isAdmin ? links.slice(Math.ceil(links.length / 2)) : [];

  const renderLink = (link: any) => {
    const Icon = link.icon;
    const isSpecialPath = link.to !== '/dashboard' && link.to !== '/doctor' && link.to !== '/nurse' && link.to !== '/receptionist';
    return (
      <NavLink 
        key={link.to}
        to={link.to} 
        className={({ isActive }) => {
          const active = isActive || (isSpecialPath && location.pathname.includes(link.to));
          return cn("flex flex-col items-center justify-center gap-1 w-12 h-12 transition-colors interactive-element relative", 
          active ? (role === 'doctor' ? "text-[#1B5DF1]" : "text-[#1A56DB]") : "text-gray-400 hover:text-[#0A1A3D]")
        }}
      >
        {({ isActive }) => {
          const active = isActive || (isSpecialPath && location.pathname.includes(link.to));
          return (
            <>
              {link.badge && (
                <span className={cn("absolute -top-1.5 -right-2 text-[8px] font-bold px-1.5 py-0.5 rounded-sm border", role === 'doctor' ? "bg-[#EBF5FF] text-[#1B5DF1] border-[#1B5DF1]/20" : "bg-[#EBF5FF] text-[#1A56DB] border-[#1A56DB]/20")}>
                  {link.badge}
                </span>
              )}
              <Icon className="w-6 h-6" strokeWidth={active ? 2.5 : 2} />
              <span className={cn("text-[10px]", active ? "font-semibold" : "font-medium")}>{link.label}</span>
            </>
          );
        }}
      </NavLink>
    );
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/85 backdrop-blur-xl border-t border-gray-200/50 pb-[env(safe-area-inset-bottom)] z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
      <div className={cn("flex items-center px-6 pt-2 pb-2 h-[72px]", isAdmin ? "justify-between" : "justify-around")}>
        
        {leftLinks.map(renderLink)}

        {/* FAB - Quick Add (Admin Only) */}
        {isAdmin && (
          <div className="relative -top-7 px-2">
            <button 
              onClick={onQuickAdd}
              className="w-[56px] h-[56px] bg-[#1A56DB] text-white rounded-full shadow-[0_8px_16px_rgba(26,86,219,0.25)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all interactive-element">
              <Plus className="w-7 h-7" strokeWidth={2.5} />
            </button>
          </div>
        )}

        {rightLinks.map(renderLink)}
      </div>
    </div>
  )
}

