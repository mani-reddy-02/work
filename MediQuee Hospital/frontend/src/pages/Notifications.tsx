import { 
  Bell, BellOff, ArrowLeft, Calendar, AlertCircle, Video, 
  Home, Activity, CheckCircle, FileText, CheckCheck, Volume2, 
  Building2, UserPlus, Loader2
} from "lucide-react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { EmptyState } from "../components/ui/EmptyState"
import { useNotifications } from "@/context/NotificationContext"
import { useTranslation } from "react-i18next"

function formatTimeAgo(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 45) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 172800) return "Yesterday";
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch (e) {
    return "Recently";
  }
}

export function Notifications() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    pushEnabled, 
    togglePushNotifications, 
    markAsRead, 
    markAllAsRead, 
    playChime 
  } = useNotifications();

  const getIconForType = (type: string) => {
    switch (type) {
      case 'appointment': return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'department': return <Building2 className="w-5 h-5 text-indigo-600" />;
      case 'staff': return <UserPlus className="w-5 h-5 text-purple-600" />;
      case 'alert': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'video': return <Video className="w-5 h-5 text-purple-600" />;
      case 'home': return <Home className="w-5 h-5 text-emerald-600" />;
      case 'activity': return <Activity className="w-5 h-5 text-orange-600" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'document': return <FileText className="w-5 h-5 text-indigo-600" />;
      default: return <Bell className="w-5 h-5 text-blue-600" />;
    }
  };

  const getBgForType = (type: string) => {
    switch (type) {
      case 'appointment': return "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30";
      case 'department': return "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30";
      case 'staff': return "bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-900/30";
      case 'alert': return "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30";
      case 'video': return "bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-900/30";
      case 'home': return "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30";
      case 'activity': return "bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/30";
      case 'success': return "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30";
      case 'document': return "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30";
      default: return "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30";
    }
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif.read) {
      await markAsRead(notif.id);
    }
    if (notif.type === 'appointment') {
      navigate('/appointments');
    } else if (notif.type === 'department') {
      navigate('/profile/departments');
    } else if (notif.type === 'staff') {
      navigate('/profile/staff');
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  const item = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex flex-col bg-background min-h-[calc(100vh-80px)] pb-24 transition-colors">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-4 pb-3 px-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">{t('notifications')}</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-black rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-primary text-xs font-semibold rounded-xl transition-colors active:scale-95"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>{t('mark_all_as_read')}</span>
          </button>
        )}
      </div>

      <div className="p-4 flex flex-col gap-6 max-w-2xl mx-auto w-full">
        
        {/* Push Notifications Toggle Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors shadow-sm ${pushEnabled ? 'bg-blue-600 text-white shadow-blue-600/20' : 'bg-gray-200 dark:bg-gray-700 text-muted'}`}>
              {pushEnabled ? <Bell className="w-5 h-5 animate-pulse" /> : <BellOff className="w-5 h-5" />}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-foreground text-[15px]">Push Notifications</span>
              <span className="text-xs text-muted">
                {pushEnabled ? "Active: alerts received even if tab/app is closed" : "Receive real-time alerts on your device"}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => playChime()}
              className="p-2 text-muted hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
              title="Test notification chime sound"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            <button 
              onClick={togglePushNotifications}
              type="button"
              className={`w-12 h-7 rounded-full p-1 transition-colors relative cursor-pointer ${pushEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
              title={pushEnabled ? "Turn off push notifications" : "Enable push notifications"}
            >
              <div className={`w-5 h-5 bg-surface rounded-full shadow-sm transition-transform ${pushEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </motion.div>

        {/* Notification History List */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-muted uppercase tracking-wider">Recent Activity</h2>
            <span className="text-xs text-muted">{notifications.length} alerts</span>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-2.5">
              {notifications.length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title="No Notifications"
                  description="Real-time alerts for new appointments, department updates, and staff additions will appear here automatically."
                />
              ) : notifications.map((notif) => (
                <motion.div 
                  key={notif.id} 
                  variants={item}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                    notif.read 
                      ? 'bg-surface border-border hover:border-gray-300 dark:hover:border-gray-600' 
                      : 'bg-blue-50/30 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 shadow-[0_2px_12px_rgba(23,105,224,0.06)]'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${getBgForType(notif.type)}`}>
                    {getIconForType(notif.type)}
                  </div>
                  <div className="flex flex-col flex-1 justify-center pr-3">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className={`text-[14px] leading-snug ${notif.read ? 'font-semibold text-foreground/80' : 'font-bold text-foreground'}`}>
                        {notif.title}
                      </span>
                      <span className="text-[11px] font-semibold text-muted whitespace-nowrap">
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>
                    <span className="text-xs text-muted leading-relaxed">{notif.message}</span>
                  </div>
                  {!notif.read && (
                    <div className="absolute top-4 right-3 w-2 h-2 bg-blue-600 rounded-full ring-4 ring-blue-100 dark:ring-blue-900/30" />
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

      </div>
    </div>
  )
}
