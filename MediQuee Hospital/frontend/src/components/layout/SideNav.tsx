import { NavLink, useLocation } from "react-router-dom"
import { LayoutGrid, Calendar, IndianRupee, User, Plus, Video, Home, Users, Activity, X } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

export function SideNav({ 
  onQuickAdd,
  isOpen,
  onClose
}: { 
  onQuickAdd: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const location = useLocation()
  const { role } = useAuth()
  const { t } = useTranslation()

  const displayName = role === 'lab' ? 'MediQuee Lab' : 'MediQuee Hospital';

  const getLinks = () => {
    switch (role) {
      case 'doctor':
        return [
          { to: '/doctor', icon: LayoutGrid, label: t('dashboard') },
          { to: '/appointments', icon: Calendar, label: t('appointments') },
          { to: '/video-consultations', icon: Video, label: 'Video Consults', badge: 'V2 Preview' },
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
          { to: '/receptionist/queue', icon: Users, label: 'Queue Management' },
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

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 hidden md:block backdrop-blur-sm transition-opacity" 
          onClick={onClose}
        />
      )}
      <div className={cn(
        "hidden md:flex flex-col w-[280px] bg-surface border-r border-border h-screen fixed top-0 left-0 p-4 shadow-2xl z-50 transition-transform duration-300 ease-[0.22,1,0.36,1]",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        
        <div className="flex items-center justify-between mb-8 px-4 pt-4">
          <div className="flex items-center">
            <img src={import.meta.env.BASE_URL + 'logo.png'} alt="MediQuee" className="h-9 w-auto object-contain" />
          </div>
          <button onClick={onClose} className="p-2 -mr-2 text-muted hover:text-foreground transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
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
                isActive || (link.to !== '/dashboard' && link.to !== '/doctor' && link.to !== '/nurse' && link.to !== '/receptionist' && location.pathname.includes(link.to)) ? "bg-primary/10 text-primary" : "text-muted hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-foreground")
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
            className="w-full bg-primary text-primary-foreground p-4 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors">
            <Plus className="w-5 h-5" />
            <span className="font-semibold">{t('quick_add')}</span>
          </button>
        </div>
      ) : null}
      </div>
    </>
  )
}
