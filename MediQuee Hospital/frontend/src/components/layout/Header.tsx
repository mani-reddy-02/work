import { Bell, Menu, Building2 } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { useNotifications } from "@/context/NotificationContext"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

export function Header({ 
  isSidebarOpen, 
  onToggleSidebar 
}: { 
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}) {
  const { role, user } = useAuth()
  const { unreadCount } = useNotifications()
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()

  const isDashboard = ['/dashboard', '/', '/doctor', '/nurse', '/receptionist', '/lab'].includes(location.pathname);

  // Only show top global header on main dashboards. Sub-pages render their own header with back arrow.
  if (!isDashboard) {
    return null;
  }

  let greeting = "—";
  let subTitle = "";

  if (role === 'admin') {
    greeting = user?.hospital?.name || user?.name || "—";
    subTitle = "HOSPITAL";
  } else if (role === 'doctor') {
    greeting = user?.name ? `Dr. ${user.name}` : "—";
    subTitle = "DOCTOR";
  } else if (role === 'nurse') {
    greeting = user?.name || "—";
    subTitle = "NURSE";
  } else if (role === 'receptionist') {
    greeting = user?.name || "—";
    subTitle = "RECEPTIONIST";
  } else if (role === 'lab') {
    greeting = user?.hospital?.name || user?.name || "—";
    subTitle = "LABORATORY";
  }

  const primaryColor = role === 'doctor' ? "text-[#1B5DF1]" : "text-[#1A56DB]";
  const primaryBg = role === 'doctor' ? "bg-[#1B5DF1]" : "bg-[#1A56DB]";

  return (
    <header className="bg-surface px-3 sm:px-5 py-2.5 sm:py-3 border-b border-border shadow-xs z-40 shrink-0 relative transition-all">
      <div className="flex items-center justify-between gap-2 w-full">
        {/* Left Side: Navigation toggle, Brand, Role Badge & Facility Name */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button 
            onClick={onToggleSidebar}
            className="p-1.5 -ml-1 text-slate-700 dark:text-slate-200 hover:text-foreground transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0 cursor-pointer"
            title="Open Navigation Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <div className="flex items-center gap-1.5 shrink-0">
            <img 
              src={import.meta.env.BASE_URL + 'logo.png'} 
              alt="MediQuee" 
              className="h-6 sm:h-7 w-auto object-contain" 
            />
          </div>

          <div className={cn("px-2 py-0.5 bg-primary/10 text-[10px] font-extrabold rounded-full uppercase tracking-wider shrink-0", primaryColor)}>
            {subTitle}
          </div>

          {greeting && greeting !== "—" && (
            <div className="flex items-center gap-1.5 pl-2 sm:pl-3 border-l border-border min-w-0">
              {(role === 'admin' || role === 'lab') && (
                <Building2 className="w-3.5 h-3.5 text-primary shrink-0 hidden sm:block" />
              )}
              <span 
                className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-[280px] md:max-w-[420px]"
                title={greeting}
              >
                {greeting}
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Notifications */}
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => navigate('/notifications')} 
            className="relative p-1.5 text-slate-700 dark:text-slate-200 hover:text-foreground transition-colors interactive-element rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 group cursor-pointer"
            title={t('notifications')}
            aria-label={t('notifications')}
          >
            <Bell className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-105 transition-transform" strokeWidth={2} />
            {unreadCount > 0 && (
              <span className={cn(
                "absolute top-0.5 right-0.5 min-w-[16px] h-[16px] px-1 text-primary-foreground text-[9px] font-black flex items-center justify-center rounded-full border-2 border-surface shadow-xs animate-pulse",
                primaryBg
              )}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
