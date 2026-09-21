import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, 
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  metadata?: any;
}

const Notifications: React.FC = () => {
  const { token } = useAdminAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLiveFeed = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const notifsRes = await fetch(`${API_BASE_URL}/notifications?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (notifsRes.ok) {
        const notifsJson = await notifsRes.json();
        setNotifications(notifsJson.data || []);
      }
    } catch (err) {
      console.error('Failed to load admin notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchLiveFeed();
    const interval = setInterval(fetchLiveFeed, 20000);
    return () => clearInterval(interval);
  }, [fetchLiveFeed]);

  const markAllAsRead = async () => {
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Alerts & Logs</h2>
          <p className="text-sm text-slate-500">Live feed of system notifications and important alerts.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchLiveFeed}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            title="Refresh Feed"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin text-blue-600' : ''} />
            Refresh
          </button>
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <CheckCircle size={16} />
            Mark all read
          </button>
        </div>
      </div>

      {/* System Notifications Feed */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No recent notifications found.
          </div>
        ) : (
          notifications.map(n => (
            <div 
              key={n.id} 
              className={`p-4 flex gap-4 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-blue-50/30' : ''}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                !n.read ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
              }`}>
                <Bell size={20} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                  <span className="text-xs text-slate-400 shrink-0">{formatDateTime(n.createdAt)}</span>
                </div>
                <p className="text-sm text-slate-600 mt-0.5">{n.message}</p>
              </div>

              {!n.read && (
                <div className="shrink-0 flex items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;

