import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCheck, BellRing, Calendar, Video, FlaskConical, Stethoscope, FileText } from 'lucide-react';
import { useNotifications, type AppNotification } from '../lib/notifications';
import { cn } from '../lib/utils';

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [tab, setTab] = useState<'all' | 'unread'>('all');

  const filteredNotifications = tab === 'all' 
    ? notifications 
    : notifications.filter(n => !n.read);

  const handleNotificationClick = (n: AppNotification) => {
    markAsRead(n.id);
    navigate(n.route);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment': return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'video': return <Video className="w-5 h-5 text-indigo-500" />;
      case 'lab': return <FlaskConical className="w-5 h-5 text-green-500" />;
      case 'nursing': return <Stethoscope className="w-5 h-5 text-purple-500" />;
      case 'report': return <FileText className="w-5 h-5 text-orange-500" />;
      default: return <BellRing className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full flex flex-col min-h-[calc(100vh-64px)] md:px-4 md:py-6 bg-slate-50 md:bg-transparent">
      {/* Header */}
      <div className="bg-white sticky top-0 z-20 px-4 py-4 border-b border-slate-100 flex items-center justify-between shadow-sm md:rounded-t-2xl md:border">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate(-1)} 
            className="p-1 -ml-1 text-slate-600 hover:text-primary transition-colors rounded-full hover:bg-slate-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Notifications</h1>
        </div>
        
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Mark all as read</span>
            <span className="sm:hidden">Mark all read</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white px-4 border-b border-slate-100 md:border-x">
        <div className="flex gap-6">
          <button
            onClick={() => setTab('all')}
            className={cn(
              "pb-3 pt-4 text-sm font-semibold transition-colors relative",
              tab === 'all' ? "text-primary" : "text-slate-500 hover:text-slate-700"
            )}
          >
            All
            {tab === 'all' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setTab('unread')}
            className={cn(
              "pb-3 pt-4 text-sm font-semibold transition-colors relative flex items-center gap-2",
              tab === 'unread' ? "text-primary" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Unread
            {unreadCount > 0 && (
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px] leading-none",
                tab === 'unread' ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-600"
              )}>
                {unreadCount}
              </span>
            )}
            {tab === 'unread' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
            )}
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div className="flex-1 bg-slate-50 p-4 md:p-6 md:bg-white md:border-x md:border-b md:rounded-b-2xl">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <BellRing className="w-8 h-8 text-blue-200" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">
              {tab === 'all' ? "No notifications" : "No unread notifications"}
            </h3>
            <p className="text-slate-500 mt-1 max-w-[250px]">
              {tab === 'all' 
                ? "You're all caught up. We'll notify you when something arrives." 
                : "You have read all your notifications."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredNotifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-xl text-left transition-all border shadow-sm w-full",
                  notification.read 
                    ? "bg-white border-slate-200 hover:border-slate-300 shadow-slate-100/50" 
                    : "bg-blue-50/40 border-blue-100 hover:border-blue-200 shadow-blue-100/20"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                  notification.read ? "bg-slate-100" : "bg-white shadow-sm"
                )}>
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    )}
                    <h3 className={cn(
                      "text-base truncate",
                      notification.read ? "font-medium text-slate-700" : "font-semibold text-slate-900"
                    )}>
                      {notification.title}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 mb-2 leading-relaxed">
                    {notification.message}
                  </p>
                  <p className="text-xs text-slate-400 font-medium">
                    {notification.time}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
