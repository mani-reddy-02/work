import { Bell, MapPin, ChevronDown } from "lucide-react"
import { useNavigate } from "react-router-dom"

export function LabHeader() {
  const navigate = useNavigate()

  return (
    <header className="bg-white px-4 pt-10 md:pt-4 pb-3 z-40 flex flex-col md:flex-row md:items-center gap-3 md:gap-6 shrink-0 border-b border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between md:hidden w-full">
        <div className="flex items-center gap-2">
          <div className="text-primary font-bold text-[20px] flex items-center tracking-tight">
            MediQuee
          </div>
          <div className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-wider border border-emerald-200/60">
            LAB
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate('/lab/notifications')}
            className="relative p-2 text-[#667085] hover:text-[#172033] transition-colors md:hidden"
          >
            <Bell className="w-[22px] h-[22px]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full border border-white" />
          </button>
        </div>
      </div>

      {/* Desktop Notification & Profile - Hidden on mobile, shown on desktop right aligned */}
      <div className="hidden md:flex flex-1 justify-end items-center gap-4">
        <button className="flex items-center justify-between bg-[#F7F8FA] rounded-xl px-3 py-2.5 active:scale-[0.98] transition-transform border border-gray-200/50 min-w-[200px]">
          <div className="flex items-center gap-2">
            <MapPin className="w-[18px] h-[18px] text-[#667085]" />
            <span className="font-semibold text-[14px] text-[#172033]">City Care Diagnostics</span>
          </div>
          <ChevronDown className="w-4 h-4 text-[#98A2B3]" />
        </button>
        <button
          onClick={() => navigate('/lab/notifications')}
          className="relative p-2 text-[#667085] hover:text-[#172033] transition-colors bg-gray-50 rounded-full border border-gray-100"
        >
          <Bell className="w-[20px] h-[20px]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full border border-white" />
        </button>
      </div>

      {/* Mobile Location Selector */}
      <button className="md:hidden flex items-center justify-between w-full bg-[#F7F8FA] rounded-xl px-3 py-2.5 active:scale-[0.98] transition-transform border border-gray-200/50">
        <div className="flex items-center gap-2">
          <MapPin className="w-[18px] h-[18px] text-[#667085]" />
          <span className="font-semibold text-[14px] text-[#172033]">City Care Diagnostics</span>
        </div>
        <ChevronDown className="w-4 h-4 text-[#98A2B3]" />
      </button>
    </header>
  )
}
