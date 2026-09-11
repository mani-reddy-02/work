import { NavLink, useLocation } from "react-router-dom"
import { LayoutGrid, ClipboardList, Plus, FileText, User } from "lucide-react"
import { cn } from "@/lib/utils"

const LAB_FORM_ROUTES = ['/lab/add-test', '/lab/create-order', '/lab/upload-report', '/lab/add-package', '/lab/home-collection/create']

export function LabBottomNav({ onQuickAdd }: { onQuickAdd: () => void }) {
  const location = useLocation()

  if (LAB_FORM_ROUTES.some(r => location.pathname.startsWith(r))) return null

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/85 backdrop-blur-xl border-t border-gray-200/50 pb-[env(safe-area-inset-bottom)] z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between px-6 pt-2 pb-2 h-[72px]">

        <NavLink
          to="/lab"
          end
          className={({ isActive }) =>
            cn("flex flex-col items-center justify-center gap-1 w-12 h-12 transition-colors",
              isActive ? "text-primary" : "text-[#98A2B3] hover:text-[#667085]")
          }
        >
          {({ isActive }) => (
            <>
              <LayoutGrid className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              <span className={cn("text-[10px]", isActive ? "font-semibold" : "font-medium")}>Home</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/lab/orders"
          className={({ isActive }) =>
            cn("flex flex-col items-center justify-center gap-1 w-12 h-12 transition-colors",
              isActive ? "text-primary" : "text-[#98A2B3] hover:text-[#667085]")
          }
        >
          {({ isActive }) => (
            <>
              <ClipboardList className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              <span className={cn("text-[10px]", isActive ? "font-semibold" : "font-medium")}>Orders</span>
            </>
          )}
        </NavLink>

        {/* FAB */}
        <div className="relative -top-7 px-2">
          <button
            onClick={onQuickAdd}
            className="w-[56px] h-[56px] bg-primary text-white rounded-full shadow-[0_8px_20px_rgba(23,105,224,0.30)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-7 h-7" strokeWidth={2.5} />
          </button>
        </div>

        <NavLink
          to="/lab/reports"
          className={({ isActive }) =>
            cn("flex flex-col items-center justify-center gap-1 w-12 h-12 transition-colors",
              isActive ? "text-primary" : "text-[#98A2B3] hover:text-[#667085]")
          }
        >
          {({ isActive }) => (
            <>
              <FileText className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              <span className={cn("text-[10px]", isActive ? "font-semibold" : "font-medium")}>Reports</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/lab/profile"
          className={({ isActive }) =>
            cn("flex flex-col items-center justify-center gap-1 w-12 h-12 transition-colors",
              isActive ? "text-primary" : "text-[#98A2B3] hover:text-[#667085]")
          }
        >
          {({ isActive }) => (
            <>
              <User className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              <span className={cn("text-[10px]", isActive ? "font-semibold" : "font-medium")}>Profile</span>
            </>
          )}
        </NavLink>

      </div>
    </div>
  )
}
