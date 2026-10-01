import { Bell, MapPin, ChevronDown, Menu } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { useNotifications } from "@/context/NotificationContext"

export function LabHeader({
  isSidebarOpen,
  onToggleSidebar
}: {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { unreadCount } = useNotifications()

  const labName = user?.hospital?.name || user?.name || "City Care Diagnostics"

  return (
    <header className="bg-surface px-4 pt-10 md:pt-3.5 pb-3 z-40 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      {/* Mobile Top Bar */}
      <div className="flex items-center justify-between md:hidden w-full">
        <div className="flex items-center gap-2">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-1.5 -ml-1 text-[#667085] hover:text-[#172033] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <img src={import.meta.env.BASE_URL + 'logo.png'} alt="MediQuee" className="h-7 w-auto object-contain" />
          <div className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-wider border border-emerald-200/60">
            LAB
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate('/lab/notifications')}
            className="relative p-2 text-[#667085] hover:text-[#172033] transition-colors md:hidden"
            aria-label="Notifications"
          >
            <Bell className="w-[22px] h-[22px]" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full border border-white" />
            )}
          </button>
        </div>
      </div>

      {/* Desktop Left: Menu Toggle + Logo + LAB Badge */}
      <div className="hidden md:flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? "Hide navigation menu" : "Show navigation menu"}
            title={isSidebarOpen ? "Hide navigation menu" : "Show navigation menu"}
            className="p-2 -ml-1 text-[#667085] hover:text-[#172033] hover:bg-gray-100 rounded-xl transition-colors active:scale-95 border border-border/60 shadow-xs flex items-center justify-center cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2">
          <img src={import.meta.env.BASE_URL + 'logo.png'} alt="MediQuee" className="h-7 w-auto object-contain" />
          <div className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wider border border-emerald-200/60">
            LAB
          </div>
        </div>
      </div>

      {/* Desktop Notification & Profile - Right Aligned */}
      <div className="hidden md:flex items-center gap-4">
        <button 
          onClick={() => navigate('/lab/profile')}
          className="flex items-center justify-between bg-[#F7F8FA] hover:bg-gray-100 rounded-xl px-3 py-2 active:scale-[0.98] transition-all border border-border/50 min-w-[200px]"
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-[18px] h-[18px] text-primary" />
            <span className="font-semibold text-[14px] text-[#172033]">{labName}</span>
          </div>
          <ChevronDown className="w-4 h-4 text-[#98A2B3]" />
        </button>
        <button
          onClick={() => navigate('/lab/notifications')}
          className="relative p-2 text-[#667085] hover:text-[#172033] transition-colors bg-gray-50 rounded-full border border-border hover:bg-gray-100"
          aria-label="Notifications"
        >
          <Bell className="w-[20px] h-[20px]" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full border border-white" />
          )}
        </button>
      </div>

      {/* Mobile Location / Lab Selector */}
      <button 
        onClick={() => navigate('/lab/profile')}
        className="md:hidden flex items-center justify-between w-full bg-[#F7F8FA] active:bg-gray-100 rounded-xl px-3 py-2.5 active:scale-[0.98] transition-transform border border-border/50"
      >
        <div className="flex items-center gap-2 truncate">
          <MapPin className="w-[18px] h-[18px] text-primary shrink-0" />
          <span className="font-semibold text-[14px] text-[#172033] truncate">{labName}</span>
        </div>
        <ChevronDown className="w-4 h-4 text-[#98A2B3] shrink-0" />
      </button>
    </header>
  )
}
