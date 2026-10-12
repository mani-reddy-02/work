import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, 
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchLiveFeed = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const notifsRes = await fetch(`${API_BASE_URL}/notifications?limit=100`, {
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

  const term = search.trim().toLowerCase();
  const filteredNotifications = notifications.filter(n => {
    const matchesStatus = statusFilter === 'ALL' ? true : statusFilter === 'UNREAD' ? !n.read : n.read;
    const matchesSearch = !term || 
      n.title.toLowerCase().includes(term) || 
      n.message.toLowerCase().includes(term) ||
      (n.type && n.type.toLowerCase().includes(term));
    return matchesStatus && matchesSearch;
  });

  const totalResults = filteredNotifications.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const paginatedNotifications = filteredNotifications.slice((page - 1) * pageSize, page * pageSize);

  const hasActiveFilters = statusFilter !== 'ALL' || term.length > 0;

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setPage(1);
  };

  return (
    <div className="space-y-6 max-w-5xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Alerts & Logs</h2>
          <p className="text-sm text-slate-500">Live feed of system notifications, patient updates, and alerts.</p>
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

      {/* Controls: Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by title, message, or alert type..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50"
          />
          {search && (
            <button 
              onClick={() => { setSearch(''); setPage(1); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {(['ALL', 'UNREAD', 'READ'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setStatusFilter(tab);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === tab 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab === 'ALL' ? 'All Alerts' : tab === 'UNREAD' ? 'Unread' : 'Read'}
            </button>
          ))}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-medium transition-colors border border-rose-200"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* System Notifications Feed */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden divide-y divide-slate-100">
        {isLoading && notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center">
            <RefreshCw size={24} className="animate-spin text-blue-600 mb-2" />
            <p className="text-sm font-medium">Loading system notifications...</p>
          </div>
        ) : paginatedNotifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            {hasActiveFilters ? (
              <div>
                <p className="text-base font-medium text-slate-900 mb-1">No matching records found.</p>
                <p className="text-sm text-slate-400">Try changing your search or filters.</p>
                <button
                  onClick={handleClearFilters}
                  className="mt-3 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-medium rounded-lg"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No recent notifications found.</p>
            )}
          </div>
        ) : (
          paginatedNotifications.map(n => (
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
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                    {n.type && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                        {n.type}
                      </span>
                    )}
                  </div>
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

      {/* Pagination */}
      {totalResults > pageSize && (
        <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-sm text-slate-600">
          <div>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalResults)} of {totalResults} notifications
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
            >
              Previous
            </button>
            <span className="text-xs font-medium text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;

