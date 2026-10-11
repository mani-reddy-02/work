import { useNavigate, useLocation, useOutletContext } from "react-router-dom"
import { ArrowLeft, Menu } from "lucide-react"

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
}: ReceptionistNavHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const outletCtx = useOutletContext<{ onToggleSidebar?: () => void } | null>();

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
    <div className="flex items-center justify-between gap-3 bg-surface/95 backdrop-blur-xl border-b border-border shadow-[0_2px_12px_rgba(0,0,0,0.02)] h-14 px-4 sticky top-0 z-30">
      {/* Top Bar with Back, Menu, Title, and Actions */}
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
          <h1 className="text-[17px] sm:text-[19px] font-black text-[#0A1A3D] tracking-tight truncate leading-tight">
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
  );
}
