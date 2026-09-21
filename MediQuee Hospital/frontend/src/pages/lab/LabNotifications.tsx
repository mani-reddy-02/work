import { motion } from "framer-motion"
import { ArrowLeft, Bell } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { EmptyState } from "@/components/ui/EmptyState"

// Notifications come from the backend. Empty until connected.
const notifications: {
  group: string;
  items: {
    icon: LucideIcon; color: string; bg: string;
    title: string; body: string; time: string; unread: boolean;
  }[];
}[] = []

export function LabNotifications() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col bg-background min-h-screen w-full">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-4 md:pt-6 pb-3 md:pb-4 px-4 md:px-6 flex items-center gap-4 border-b border-border/50">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[#172033] rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <h1 className="text-[18px] md:text-[22px] font-bold text-[#172033]">Notifications</h1>
        <button className="ml-auto text-[13px] md:text-[14px] text-primary font-semibold hover:underline">Mark all read</button>
      </div>

      <div className="flex flex-col gap-6 px-4 md:px-6 pt-5 md:pt-8 pb-6 max-w-3xl mx-auto w-full">
        {notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No Notifications"
            description="Lab notifications will appear here once available."
          />
        ) : notifications.map(group => (
          <motion.div key={group.group} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-[12px] md:text-[14px] font-bold text-[#98A2B3] uppercase tracking-widest mb-3 md:mb-4">{group.group}</p>
            <div className="flex flex-col gap-2 md:gap-3">
              {group.items.map((n, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className={`bg-surface rounded-2xl md:rounded-3xl border shadow-sm p-4 md:p-5 flex items-start gap-3 md:gap-4 transition-all hover:shadow-md cursor-pointer ${n.unread ? 'border-primary/20 bg-primary/[0.02]' : 'border-border'}`}>
                  <div className={`w-10 h-10 md:w-12 md:h-12 ${n.bg} rounded-xl md:rounded-2xl flex items-center justify-center shrink-0`}>
                    <n.icon className={`w-5 h-5 md:w-6 md:h-6 ${n.color}`} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[14px] md:text-[16px] font-semibold text-[#172033]">{n.title}</p>
                      <span className="text-[11px] md:text-[13px] font-medium text-[#98A2B3] shrink-0">{n.time}</span>
                    </div>
                    <p className="text-[12px] md:text-[14px] text-[#667085] mt-0.5 md:mt-1 leading-relaxed">{n.body}</p>
                  </div>
                  {n.unread && <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-primary shrink-0 mt-1.5 md:mt-2" />}
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
