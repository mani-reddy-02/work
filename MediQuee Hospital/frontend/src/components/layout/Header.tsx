import { Bell, Menu } from "lucide-react"
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

  const getScreenName = () => {
    const path = location.pathname.substring(1);
    if (!path) return '';
    // Normalize path for translation keys (e.g. 'appointments', 'payouts' -> 'payout')
    const key = path === 'payouts' ? 'payout' : path.replace('-', '_');
    const translated = t(key);
    return translated !== key ? translated : path.charAt(0).toUpperCase() + path.slice(1);
  };

  const hideOnRoutes = ['/add-department', '/edit-department', '/add-doctor', '/add-lab', '/add-nurse', '/add-receptionist', '/edit-staff'];
  if (hideOnRoutes.some(route => location.pathname.startsWith(route))) {
    return null;
  }

  // Role labels are static config. The account/facility name comes from the
  // backend and is unavailable until connected.
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
    <header className={cn("bg-surface px-4 z-40 flex flex-col gap-3 shrink-0 relative", role === 'doctor' ? "pt-10 pb-1" : "pt-10 pb-3 border-b border-border shadow-sm")}>
      <div className="flex items-center justify-between">
        {isDashboard ? (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <button 
                onClick={onToggleSidebar}
                className="hidden md:flex p-1 -ml-1 text-muted hover:text-foreground transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 mr-1"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-1.5">
                <img src={import.meta.env.BASE_URL + 'logo.png'} alt="MediQuee" className="h-7 md:h-8 w-auto object-contain" />
              </div>
              <div className={cn("px-2.5 py-0.5 bg-primary/10 text-[10px] font-bold rounded-full uppercase tracking-wider", primaryColor)}>
                {subTitle}
              </div>
            </div>
            {role !== 'doctor' && (
              <div className="text-[13px] text-muted-foreground font-semibold ml-0.5 mt-0.5 opacity-80">
                {greeting}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center w-full relative h-8">
            <button 
              onClick={onToggleSidebar}
              className="hidden md:flex absolute left-0 p-1 -ml-1 text-muted hover:text-foreground transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-[17px] font-semibold text-foreground">{getScreenName()}</h1>
          </div>
        )}

        {isDashboard && (
          <div className="flex items-center gap-3 relative">
            <button 
              onClick={() => navigate('/notifications')} 
              className="relative p-1 text-muted hover:text-foreground transition-colors interactive-element group"
              title={t('notifications')}
            >
              <Bell className="w-6 h-6 group-hover:scale-105 transition-transform" strokeWidth={2} />
              {unreadCount > 0 && (
                <span className={cn(
                  "absolute -top-0.5 -right-1 min-w-[18px] h-[18px] px-1 text-primary-foreground text-[9px] font-black flex items-center justify-center rounded-full border-2 border-surface shadow-sm animate-pulse",
                  primaryBg
                )}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
