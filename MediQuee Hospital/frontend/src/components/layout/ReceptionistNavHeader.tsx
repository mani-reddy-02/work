import { useNavigate, useLocation, useOutletContext } from "react-router-dom"
import { ArrowLeft, Menu, LayoutGrid, Calendar, Users, UserPlus, CalendarClock } from "lucide-react"
import { cn } from "@/lib/utils"

interface ReceptionistNavHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
  rightActions?: React.ReactNode;
  showNavigationTabs?: boolean;
}

export function ReceptionistNavHeader({
  title,
  subtitle,
  backTo,
  rightActions,
  showNavigationTabs = true
}: ReceptionistNavHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const outletCtx = useOutletContext<{ onToggleSidebar?: () => void } | null>();

  const mainPages = [
    { to: '/receptionist', label: 'Dashboard', icon: LayoutGrid, exact: true },
    { to: '/receptionist/appointments', label: 'Appointments', icon: Calendar },
    { to: '/receptionist/queue', label: 'Live Queue', icon: Users },
    { to: '/receptionist/check-in', label: 'Check-In Patient', icon: UserPlus },
    { to: '/receptionist/book-appointment', label: 'Book Appointment', icon: CalendarClock },
  ];

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else if (location.pathname !== '/receptionist') {
      navigate('/receptionist');
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex flex-col gap-3 bg-surface/95 backdrop-blur-xl border-b border-border shadow-[0_2px_12px_rgba(0,0,0,0.02)] pt-3 pb-2.5 px-4 sticky top-0 z-30">
      {/* Top Bar with Back, Menu, Title, and Actions */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          {/* Back Button */}
          <button
            type="button"
            onClick={handleBack}
            className="p-2 -ml-1 text-[#0A1A3D] hover:text-[#1B5DF1] hover:bg-blue-50/80 rounded-xl transition-all active:scale-95 cursor-pointer flex-shrink-0"
            title="Back to Receptionist Dashboard"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Menu / Sidebar Toggle Button */}
          <button
            type="button"
            onClick={() => {
              if (outletCtx?.onToggleSidebar) {
                outletCtx.onToggleSidebar();
              }
            }}
            className="p-2 text-[#0A1A3D] hover:text-[#1B5DF1] hover:bg-blue-50/80 rounded-xl transition-all active:scale-95 cursor-pointer flex-shrink-0"
            title="Open Main Navigation Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Title & Subtitle */}
          <div className="flex flex-col min-w-0">
            <h1 className="text-[18px] sm:text-[21px] font-black text-[#0A1A3D] tracking-tight truncate leading-tight">
              {title}
            </h1>
            {subtitle && (
              <span className="text-[11px] font-semibold text-muted/80 truncate">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Right Actions Slot */}
        {rightActions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {rightActions}
          </div>
        )}
      </div>

      {/* Main Receptionist Pages Navigation Tabs */}
      {showNavigationTabs && (
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide py-0.5 -mx-4 px-4">
          {mainPages.map((page) => {
            const Icon = page.icon;
            const isActive = page.exact 
              ? location.pathname === page.to 
              : location.pathname.startsWith(page.to);

            return (
              <button
                key={page.to}
                type="button"
                onClick={() => navigate(page.to)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-[13px] font-bold whitespace-nowrap transition-all flex-shrink-0 cursor-pointer border active:scale-95",
                  isActive
                    ? "bg-[#1B5DF1] text-white border-[#1B5DF1] shadow-sm shadow-[#1B5DF1]/25 ring-2 ring-[#1B5DF1]/20"
                    : "bg-surface text-[#0A1A3D] border-border/80 hover:border-[#1B5DF1]/40 hover:text-[#1B5DF1] hover:bg-blue-50/40"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", isActive ? "text-white" : "text-muted")} />
                <span>{page.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
