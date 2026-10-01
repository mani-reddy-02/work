import { cn } from "@/lib/utils"
import { 
  ChevronRight, 
  type LucideIcon, 
  FlaskConical, 
  Activity, 
  Droplets, 
  Shield, 
  Microscope, 
  HeartPulse, 
  Scan, 
  Stethoscope, 
  Radio, 
  Sparkles, 
  FileText 
} from "lucide-react"

const DEPARTMENT_ICON_MAP: Record<string, LucideIcon> = {
  Scan,
  FlaskConical,
  Activity,
  Droplets,
  Shield,
  Microscope,
  HeartPulse,
  Stethoscope,
  Radio,
  Sparkles,
  FileText,
}

export function LabDepartmentIcon({ 
  icon, 
  className = "w-5 h-5 text-primary" 
}: { 
  icon?: string | null
  className?: string 
}) {
  if (!icon) {
    return <FlaskConical className={className} strokeWidth={1.5} />
  }

  const IconComp = DEPARTMENT_ICON_MAP[icon]
  if (IconComp) {
    return <IconComp className={className} strokeWidth={1.5} />
  }

  const isEmoji = /\p{Extended_Pictographic}/u.test(icon)
  if (isEmoji) {
    return <span className={className} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
  }

  return <FlaskConical className={className} strokeWidth={1.5} />
}

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
  className?: string
}

const config: Record<string, { label: string; className: string }> = {
  pending:          { label: 'Pending',    className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  requested:        { label: 'Pending',    className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  assigned:         { label: 'Assigned',   className: 'bg-cyan-50 text-cyan-700 border border-cyan-200' },
  collected:        { label: 'Collected',  className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  sample_collected: { label: 'Collected',  className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  processing:       { label: 'Processing', className: 'bg-purple-50 text-purple-700 border border-purple-200' },
  in_lab_processing:{ label: 'Processing', className: 'bg-purple-50 text-purple-700 border border-purple-200' },
  ready:            { label: 'Completed',  className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  report_ready:     { label: 'Completed',  className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  completed:        { label: 'Completed',  className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  delivered:        { label: 'Delivered',  className: 'bg-gray-50 text-[#667085] border border-border' },
  cancelled:        { label: 'Cancelled',  className: 'bg-red-50 text-red-600 border border-red-200' },
}

export function StatusBadge({ status, size = 'sm', className }: StatusBadgeProps) {
  const key = (status || '').toLowerCase()
  const c = config[key] ?? config.pending
  return (
    <span className={cn(
      'rounded-full font-semibold inline-flex items-center justify-center',
      size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1',
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
  value: string | number
  trend?: string
  trendUp?: boolean
  iconBg?: string
  iconColor?: string
  onClick?: () => void
  className?: string
}

export function LabKpiCard({ 
  icon: Icon, 
  label, 
  value, 
  trend, 
  trendUp = true, 
  iconBg = 'bg-blue-50', 
  iconColor = 'text-primary',
  onClick,
  className
}: LabKpiCardProps) {
  const Component = onClick ? 'button' : 'div'
  return (
    <Component 
      {...(onClick ? { type: 'button', 'aria-label': `${label}: ${value}${trend ? `. ${trend}` : ''}` } : {})}
      onClick={onClick}
      className={cn(
        "group bg-surface rounded-2xl p-4 border border-border shadow-xs flex flex-col gap-2.5 text-left w-full transition-all",
        onClick && "cursor-pointer hover:border-primary/40 hover:shadow-sm active:scale-[0.98]",
        className
      )}
    >
      <div className="flex items-center justify-between w-full">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
          <Icon className={cn("w-4.5 h-4.5", iconColor)} strokeWidth={2} />
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-semibold inline-flex items-center gap-0.5 transition-colors",
            trendUp ? "text-emerald-700" : "text-amber-700"
          )}>
            <span>{trend}</span>
            {onClick && <ChevronRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />}
          </span>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-[#172033] leading-tight truncate">{value}</div>
        <div className="text-xs md:text-sm text-[#667085] font-medium mt-0.5 truncate">{label}</div>
      </div>
    </Component>
  )
}
