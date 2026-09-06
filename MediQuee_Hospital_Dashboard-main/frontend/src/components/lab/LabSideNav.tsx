import { NavLink, useLocation } from "react-router-dom"
import { LayoutGrid, ClipboardList, FileText, User, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export function LabSideNav({ onQuickAdd }: { onQuickAdd: () => void }) {
  const location = useLocation()

  return (
    <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 h-screen sticky top-0 p-4 shrink-0 shadow-[1px_0_2px_rgba(0,0,0,0.02)] z-50">
      
      <div className="flex items-center gap-2 mb-8 px-4 pt-4">
        <div className="text-primary font-bold text-xl flex items-center tracking-tight">
          MediQuee
        </div>
        <div className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-wider border border-emerald-200/60">
          LAB
        </div>
      </div>

      <nav className="flex flex-col gap-2 flex-1">
        <NavLink 
          to="/lab" 
          end
          className={({ isActive }) => 
            cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium", 
            isActive ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-50")
          }
        >
          <LayoutGrid className="w-5 h-5" />
          <span>Home</span>
        </NavLink>

        <NavLink 
          to="/lab/orders" 
          className={({ isActive }) => 
            cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium", 
            isActive || location.pathname.includes('/lab/order/') ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-50")
          }
        >
          <ClipboardList className="w-5 h-5" />
          <span>Orders</span>
        </NavLink>

        <NavLink 
          to="/lab/reports" 
          className={({ isActive }) => 
            cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium", 
            isActive || location.pathname.includes('/lab/report/') ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-50")
          }
        >
          <FileText className="w-5 h-5" />
          <span>Reports</span>
        </NavLink>

        <NavLink 
          to="/lab/profile" 
          className={({ isActive }) => 
            cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium", 
            isActive ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-50")
          }
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </NavLink>
      </nav>

      {/* Quick Add Button */}
      <div className="mt-auto mb-4">
        <button 
          onClick={onQuickAdd}
          className="w-full bg-primary text-white p-4 rounded-xl shadow-md flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors">
          <Plus className="w-5 h-5" />
          <span className="font-semibold">Quick Add</span>
        </button>
      </div>
    </div>
  )
}
