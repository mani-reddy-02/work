import { NavLink, useLocation } from "react-router-dom"
import { LayoutGrid, Calendar, IndianRupee, User, Plus, Home, Users, Stethoscope, Video, CalendarClock } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

export function BottomNav({ onQuickAdd }: { onQuickAdd: () => void }) {
  const location = useLocation()
  const { role } = useAuth()
  const { t } = useTranslation()

  // Hide bottom nav on form pages that have their own fixed bottom buttons
  const hideOnRoutes = ['/add-department', '/edit-department', '/add-doctor', '/add-lab', '/add-nurse', '/add-receptionist'];
  if (hideOnRoutes.some(route => location.pathname.startsWith(route))) {
    return null;
  }

  const getLinks = () => {
    switch (role) {
      case 'doctor':
        return [
          { to: '/doctor', icon: LayoutGrid, label: t('dashboard') },
          { to: '/doctor/ops', icon: Stethoscope, label: 'OPs' },
          { to: '/doctor/video-consultations', icon: Video, label: 'Video' },
          { to: '/doctor/availability', icon: CalendarClock, label: 'Availability' },
          { to: '/profile', icon: User, label: t('profile') },
        ];
      case 'nurse':
        return [
          { to: '/nurse', icon: LayoutGrid, label: t('dashboard') },
          { to: '/nurse/visits', icon: Home, label: 'Visits' },
          { to: '/nurse/calendar', icon: Calendar, label: 'Calendar' },
          { to: '/profile', icon: User, label: t('profile') },
        ];
      case 'receptionist':
        return [
          { to: '/receptionist', icon: LayoutGrid, label: t('dashboard') },
          { to: '/receptionist/queue', icon: Users, label: 'Queue' },
          { to: '/receptionist/appointments', icon: Calendar, label: t('appointments') },
          { to: '/profile', icon: User, label: t('profile') },
        ];
      case 'admin':
      default:
        return [
          { to: '/dashboard', icon: LayoutGrid, label: t('dashboard') },
          { to: '/appointments', icon: Calendar, label: t('appointments') },
          { to: '/payouts', icon: IndianRupee, label: t('payout') },
          { to: '/profile', icon: User, label: t('profile') },
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
          active ? (role === 'doctor' ? "text-primary" : "text-primary") : "text-muted hover:text-foreground")
        }}
      >
        {({ isActive }) => {
          const active = isActive || (isSpecialPath && location.pathname.includes(link.to));
          return (
            <>
              {link.badge && (
                <span className={cn("absolute -top-1.5 -right-2 text-[8px] font-bold px-1.5 py-0.5 rounded-sm border bg-primary/10 text-primary border-primary/20")}>
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
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-xl border-t border-border/50 pb-[env(safe-area-inset-bottom)] z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
      <div className={cn("flex items-center px-6 pt-2 pb-2 h-[72px]", isAdmin ? "justify-between" : "justify-around")}>
        
        {leftLinks.map(renderLink)}

        {/* FAB - Quick Add (Admin Only) */}
        {isAdmin && (
          <div className="relative -top-7 px-2">
            <button 
              onClick={onQuickAdd}
              className="w-[56px] h-[56px] bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all interactive-element">
              <Plus className="w-7 h-7" strokeWidth={2.5} />
            </button>
          </div>
        )}

        {rightLinks.map(renderLink)}
      </div>
    </div>
  )
}

