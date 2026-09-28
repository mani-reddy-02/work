import { NavLink, useLocation } from "react-router-dom"
import { LayoutGrid, ClipboardList, FileText, User, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export function LabSideNav({ onQuickAdd }: { onQuickAdd: () => void }) {
  const location = useLocation()

  return (
    <aside aria-label="Sidebar Navigation" className="hidden md:flex flex-col w-64 bg-surface border-r border-border h-screen sticky top-0 p-4 shrink-0 shadow-[1px_0_2px_rgba(0,0,0,0.02)] z-50">
      
      <div className="flex items-center gap-2 mb-6 px-3 pt-2">
        <img src={import.meta.env.BASE_URL + 'logo.png'} alt="MediQuee" className="h-8 w-auto object-contain" />
        <div className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wider border border-emerald-200/60">
          LAB
        </div>
      </div>

      {/* Main Navigation */}
      <nav aria-label="Main Navigation" className="flex flex-col gap-1.5">
        <NavLink 
          to="/lab" 
          end
          className={({ isActive }) => 
            cn("flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors font-medium text-sm", 
            isActive ? "bg-primary/10 text-primary font-semibold" : "text-[#667085] hover:bg-gray-50 hover:text-[#172033]")
          }
        >
          <LayoutGrid className="w-4.5 h-4.5" />
          <span>Home</span>
        </NavLink>

        <NavLink 
          to="/lab/orders" 
          className={({ isActive }) => 
            cn("flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors font-medium text-sm", 
            isActive || location.pathname.includes('/lab/order/') ? "bg-primary/10 text-primary font-semibold" : "text-[#667085] hover:bg-gray-50 hover:text-[#172033]")
          }
        >
          <ClipboardList className="w-4.5 h-4.5" />
          <span>Orders</span>
        </NavLink>

        <NavLink 
          to="/lab/reports" 
          className={({ isActive }) => 
            cn("flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors font-medium text-sm", 
            isActive || location.pathname.includes('/lab/report/') ? "bg-primary/10 text-primary font-semibold" : "text-[#667085] hover:bg-gray-50 hover:text-[#172033]")
          }
        >
          <FileText className="w-4.5 h-4.5" />
          <span>Reports</span>
        </NavLink>

        <NavLink 
          to="/lab/profile" 
          className={({ isActive }) => 
            cn("flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors font-medium text-sm", 
            isActive ? "bg-primary/10 text-primary font-semibold" : "text-[#667085] hover:bg-gray-50 hover:text-[#172033]")
          }
        >
          <User className="w-4.5 h-4.5" />
          <span>Profile</span>
        </NavLink>
      </nav>

      {/* Quick Action Button - Grouped cohesively below navigation */}
      <div className="mt-5 pt-4 border-t border-border/60">
        <button 
          type="button"
          onClick={onQuickAdd}
          aria-label="Quick Add"
          className="w-full bg-primary text-white py-2.5 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.99] transition-all font-semibold text-sm">
          <Plus className="w-4.5 h-4.5" />
          <span>Quick Add</span>
        </button>
      </div>
    </aside>
  )
}
