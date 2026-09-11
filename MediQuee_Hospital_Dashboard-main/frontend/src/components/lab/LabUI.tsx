import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface StatusBadgeProps {
  status: 'pending' | 'collected' | 'processing' | 'ready' | 'delivered' | 'cancelled'
  size?: 'sm' | 'md'
  className?: string
}

const config: Record<string, { label: string; className: string }> = {
  pending:    { label: 'Pending',    className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  collected:  { label: 'Collected',  className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  processing: { label: 'Processing', className: 'bg-purple-50 text-purple-700 border border-purple-200' },
  ready:      { label: 'Ready',      className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  delivered:  { label: 'Delivered',  className: 'bg-gray-50 text-gray-500 border border-gray-200' },
  cancelled:  { label: 'Cancelled',  className: 'bg-red-50 text-red-600 border border-red-200' },
}

export function StatusBadge({ status, size = 'sm', className }: StatusBadgeProps) {
  const c = config[status] ?? config.pending
  return (
    <span className={cn(
      'rounded-full font-semibold',
      size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-[13px] px-3 py-1',
      c.className,
      className
    )}>
      {c.label}
    </span>
  )
}

interface LabKpiCardProps {
  icon: LucideIcon
  label: string
  value: string
  trend: string
  trendUp?: boolean
  iconBg?: string
  iconColor?: string
}

export function LabKpiCard({ icon: Icon, label, value, trend, trendUp = true, iconBg = 'bg-blue-50', iconColor = 'text-primary' }: LabKpiCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", iconBg)}>
          <Icon className={cn("w-4 h-4", iconColor)} strokeWidth={2} />
        </div>
        <span className={cn("text-[11px] font-semibold", trendUp ? "text-emerald-600" : "text-red-500")}>{trend}</span>
      </div>
      <div>
        <div className="text-[22px] font-bold text-[#172033] leading-tight">{value}</div>
        <div className="text-[12px] text-[#667085] font-medium mt-0.5">{label}</div>
      </div>
    </div>
  )
}
