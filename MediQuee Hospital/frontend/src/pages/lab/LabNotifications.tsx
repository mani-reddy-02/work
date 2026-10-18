import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowLeft, Bell, Check, CheckCheck, FlaskConical, Home, 
  FileText, Clock, Volume2, VolumeX, Shield, AlertCircle, 
  ChevronRight, RefreshCw, Loader2 
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useNotifications } from "@/context/NotificationContext"
import { EmptyState } from "@/components/ui/EmptyState"
import { cn } from "@/lib/utils"

export function LabNotifications() {
  const navigate = useNavigate()
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAllAsRead, 
    pushEnabled, 
    togglePushNotifications,
    refreshNotifications 
  } = useNotifications()

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'orders' | 'reports'>('all')
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('mediquee_sound_alerts') !== 'false'
  })

  const handleToggleSound = () => {
    const nextVal = !soundEnabled
    setSoundEnabled(nextVal)
    localStorage.setItem('mediquee_sound_alerts', String(nextVal))
  }

  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)

      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays === 1) return 'Yesterday'
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    } catch {
      return 'Recently'
    }
  }

  const getNotificationIcon = (type: string, message: string) => {
    const lowerMsg = (message || '').toLowerCase()
    const lowerType = (type || '').toLowerCase()

    if (lowerMsg.includes('home') || lowerMsg.includes('sample') || lowerType.includes('home')) {
      return { icon: Home, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30' }
    }
    if (lowerMsg.includes('report') || lowerType.includes('report')) {
      return { icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30' }
    }
    if (lowerMsg.includes('test') || lowerMsg.includes('order') || lowerType.includes('order')) {
      return { icon: FlaskConical, color: 'text-primary', bg: 'bg-blue-50 dark:bg-blue-900/30' }
    }
    return { icon: Bell, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/30' }
  }

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (activeFilter === 'unread') return !n.read
      if (activeFilter === 'orders') {
        const text = (n.title + ' ' + n.message).toLowerCase()
        return text.includes('order') || text.includes('sample') || text.includes('test')
      }
      if (activeFilter === 'reports') {
        const text = (n.title + ' ' + n.message).toLowerCase()
        return text.includes('report')
      }
      return true
    })
  }, [notifications, activeFilter])

  const handleNotificationClick = async (n: any) => {
    if (!n.read) {
      await markAsRead(n.id)
    }
    // Deep-link to lab order details if bookingId or orderId is in metadata
    const bookingId = n.metadata?.bookingId || n.metadata?.orderId || n.metadata?.labBookingId
    if (bookingId) {
      navigate(`/lab/orders/${bookingId}`)
    }
  }

  return (
    <div className="flex flex-col bg-background min-h-screen w-full relative">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-surface/98 backdrop-blur-md pt-4 md:pt-6 pb-3 md:pb-4 px-4 md:px-6 flex items-center justify-between border-b border-border shadow-xs">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 text-[#172033] dark:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[18px] md:text-[22px] font-bold text-[#172033] dark:text-white">Lab Notifications</h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary text-white">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted font-medium">Real-time alerts for sample collections, orders & reports</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => refreshNotifications()}
            className="p-2 text-muted hover:text-foreground rounded-xl hover:bg-gray-100 transition-colors"
            title="Refresh notifications"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {unreadCount > 0 && (
            <button 
              onClick={() => markAllAsRead()}
              className="text-[12px] md:text-[13px] text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>
      </header>

      {/* Preferences & Quick Filter Bar */}
      <div className="px-4 md:px-6 pt-4 pb-2 max-w-3xl mx-auto w-full flex flex-col gap-3">
        {/* Preference Toggles Card */}
        <div className="bg-surface rounded-2xl border border-border p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleSound}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer",
                soundEnabled ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-gray-100 text-gray-600 border-gray-200"
              )}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 text-gray-500" />}
              <span>{soundEnabled ? "Order Chimes ON" : "Muted"}</span>
            </button>

            <button
              onClick={() => togglePushNotifications()}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer",
                pushEnabled ? "bg-blue-50 text-blue-800 border-blue-200" : "bg-gray-100 text-gray-600 border-gray-200"
              )}
            >
              <Bell className="w-3.5 h-3.5 text-primary" />
              <span>{pushEnabled ? "Push Alerts Active" : "Enable Push"}</span>
            </button>
          </div>

          <span className="text-[11px] text-muted">Auto-refreshes via live stream</span>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: `All (${notifications.length})` },
            { id: 'unread', label: `Unread (${unreadCount})` },
            { id: 'orders', label: 'Sample Orders' },
            { id: 'reports', label: 'Reports' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer",
                activeFilter === tab.id
                  ? "bg-primary text-white shadow-2xs"
                  : "bg-surface text-muted hover:text-foreground border border-border"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex flex-col gap-2.5 px-4 md:px-6 pt-2 pb-24 max-w-3xl mx-auto w-full">
        {isLoading ? (
          <div className="flex justify-center p-16">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-border p-10 text-center flex flex-col items-center my-6">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
              <Bell className="w-7 h-7 text-[#98A2B3]" />
            </div>
            <h3 className="text-base font-bold text-foreground">No Notifications</h3>
            <p className="text-xs text-muted mt-1 max-w-xs">
              {activeFilter === 'unread' 
                ? "You are all caught up! No unread notifications found."
                : "New home collection requests, sample assignments, and report status alerts will appear here in real time."}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredNotifications.map((n, i) => {
              const { icon: Icon, color, bg } = getNotificationIcon(n.type, n.message)
              return (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    "bg-surface rounded-2xl border p-4 md:p-4.5 flex items-start gap-3.5 transition-all hover:shadow-xs cursor-pointer select-none",
                    n.read 
                      ? "border-border opacity-85" 
                      : "border-primary/30 bg-primary/[0.02] shadow-2xs"
                  )}
                >
                  <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shrink-0 border border-black/5`}>
                    <Icon className={`w-5 h-5 ${color}`} strokeWidth={1.8} />
                  </div>

                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-[14px] md:text-[15px] font-semibold text-[#172033] dark:text-white leading-tight", !n.read && "font-bold text-primary")}>
                        {n.title}
                      </p>
                      <span className="text-[11px] font-medium text-[#98A2B3] shrink-0">
                        {formatTimestamp(n.createdAt)}
                      </span>
                    </div>

                    <p className="text-[12px] md:text-[13px] text-[#667085] dark:text-gray-300 mt-1 leading-relaxed">
                      {n.message}
                    </p>

                    {n.metadata?.patientName && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50 text-[11px] text-muted">
                        <span>Patient: <strong className="text-foreground">{n.metadata.patientName}</strong></span>
                        {n.metadata.bookingType && (
                          <span>• Type: <strong className="text-foreground">{n.metadata.bookingType}</strong></span>
                        )}
                      </div>
                    )}
                  </div>

                  {!n.read && (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-2 shadow-xs" title="Unread" />
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
