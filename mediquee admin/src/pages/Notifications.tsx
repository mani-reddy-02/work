import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, 
  CheckCircle, 
  HeartPulse, 
  Megaphone, 
  MessageSquare, 
  Clock, 
  MapPin, 
  Building2, 
  RefreshCw, 
  CheckCircle2, 
  XCircle,
  ExternalLink
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

interface CampRequest {
  id: string;
  hospitalId: string;
  hospital?: { name: string; contactPhone?: string; contactEmail?: string; city?: string; state?: string };
  campTitle: string;
  location: string;
  expectedDate: string;
  specialties: string[];
  expectedPatients?: number | null;
  notes?: string | null;
  status: 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  createdAt: string;
}

interface MarketingRequest {
  id: string;
  hospitalId: string;
  hospital?: { name: string; contactPhone?: string; contactEmail?: string; city?: string; state?: string };
  campaignType: string;
  notes?: string | null;
  status: 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  createdAt: string;
}

const Notifications: React.FC = () => {
  const { token } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<'alerts' | 'requests'>('requests');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [camps, setCamps] = useState<CampRequest[]>([]);
  const [marketing, setMarketing] = useState<MarketingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchLiveFeed = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [notifsRes, reqsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/notifications?limit=50`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/admin/hospital-requests`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (notifsRes.ok) {
        const notifsJson = await notifsRes.json();
        setNotifications(notifsJson.data || []);
      }

      if (reqsRes.ok) {
        const reqsJson = await reqsRes.json();
        setCamps(reqsJson.data?.camps || []);
        setMarketing(reqsJson.data?.marketing || []);
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

  const handleUpdateStatus = async (type: 'camp' | 'marketing', id: string, newStatus: string) => {
    if (!token) return;
    setActionLoading(id);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/hospital-requests/${type}/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        if (type === 'camp') {
          setCamps(prev => prev.map(c => c.id === id ? { ...c, status: newStatus as any } : c));
        } else {
          setMarketing(prev => prev.map(m => m.id === id ? { ...m, status: newStatus as any } : m));
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setActionLoading(null);
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

  const totalPendingRequests = camps.filter(c => c.status === 'PENDING').length + 
                               marketing.filter(m => m.status === 'PENDING').length;

  return (
    <div className="space-y-6 max-w-5xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Hospital Submissions & Notifications</h2>
          <p className="text-sm text-slate-500">Incoming community medical camp bookings, marketing enquiries, and platform inquiries from hospitals.</p>
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
          {activeTab === 'alerts' && (
            <button 
              onClick={markAllAsRead}
              className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <CheckCircle size={16} />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 relative transition-colors flex items-center gap-2 ${
            activeTab === 'requests' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Hospital Submissions</span>
          {totalPendingRequests > 0 && (
            <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              {totalPendingRequests} New
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`pb-3 relative transition-colors flex items-center gap-2 ${
            activeTab === 'alerts' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>System Alerts & Logs</span>
          {notifications.filter(n => !n.read).length > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              {notifications.filter(n => !n.read).length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Hospital Requests (Medical Camps, Marketing, Inquiries) */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Medical Camps Section */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                  <HeartPulse size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Community Medical Camp Bookings</h3>
                  <p className="text-xs text-slate-500">Submitted by hospitals seeking logistical & footfall coordination</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-white border px-2.5 py-1 rounded-full shadow-2xs">
                {camps.length} Requests
              </span>
            </div>

            {camps.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No medical camp booking requests submitted yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {camps.map(camp => (
                  <div key={camp.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">{camp.campTitle}</span>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {camp.specialties?.join(', ') || 'General Medicine'}
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          camp.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          camp.status === 'REVIEWING' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          camp.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {camp.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span className="flex items-center gap-1 font-medium text-slate-800">
                          <Building2 size={13} className="text-slate-400" />
                          {camp.hospital?.name || 'Hospital ID: ' + camp.hospitalId}
                        </span>
                        {camp.hospital?.contactPhone && (
                          <span className="text-slate-500">Phone: {camp.hospital.contactPhone}</span>
                        )}
                        <span className="flex items-center gap-1 text-slate-500">
                          <MapPin size={13} className="text-slate-400" />
                          {camp.location}
                        </span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Clock size={13} className="text-slate-400" />
                          Expected: {new Date(camp.expectedDate).toLocaleDateString()}
                        </span>
                      </div>

                      {camp.notes && (
                        <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1 max-w-2xl">
                          {camp.notes}
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {camp.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus('camp', camp.id, 'APPROVED')}
                            disabled={actionLoading === camp.id}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-all"
                          >
                            <CheckCircle2 size={14} /> Approve & Coordinate
                          </button>
                          <button
                            onClick={() => handleUpdateStatus('camp', camp.id, 'REVIEWING')}
                            disabled={actionLoading === camp.id}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                          >
                            Mark Reviewing
                          </button>
                        </>
                      )}
                      {camp.status === 'REVIEWING' && (
                        <button
                          onClick={() => handleUpdateStatus('camp', camp.id, 'APPROVED')}
                          disabled={actionLoading === camp.id}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                        >
                          <CheckCircle2 size={14} /> Approve
                        </button>
                      )}
                      {camp.status === 'APPROVED' && (
                        <button
                          onClick={() => handleUpdateStatus('camp', camp.id, 'COMPLETED')}
                          disabled={actionLoading === camp.id}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Marketing & Platform Inquiries Section */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <Megaphone size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Marketing & Platform Enquiries</h3>
                  <p className="text-xs text-slate-500">Hospital marketing campaign requests & platform inquiries (Tile 2 & 3)</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-white border px-2.5 py-1 rounded-full shadow-2xs">
                {marketing.length} Requests
              </span>
            </div>

            {marketing.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No marketing or platform inquiries submitted yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {marketing.map(m => {
                  const isInquiry = m.campaignType.startsWith('PLATFORM_INQUIRY:');
                  return (
                    <div key={m.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-base">
                            {isInquiry ? m.campaignType.replace('PLATFORM_INQUIRY:', '').trim() : m.campaignType}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            isInquiry 
                              ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {isInquiry ? 'Platform Inquiry' : 'Marketing Enquiry'}
                          </span>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            m.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            m.status === 'REVIEWING' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {m.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                          <span className="flex items-center gap-1 font-medium text-slate-800">
                            <Building2 size={13} className="text-slate-400" />
                            {m.hospital?.name || 'Hospital ID: ' + m.hospitalId}
                          </span>
                          {m.hospital?.contactPhone && (
                            <span className="text-slate-500">Phone: {m.hospital.contactPhone}</span>
                          )}
                          <span className="text-slate-400">
                            Submitted: {formatDateTime(m.createdAt)}
                          </span>
                        </div>

                        {m.notes && (
                          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1 max-w-2xl whitespace-pre-wrap">
                            {m.notes}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {m.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus('marketing', m.id, 'APPROVED')}
                              disabled={actionLoading === m.id}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-all"
                            >
                              <CheckCircle2 size={14} /> Contacted & Approved
                            </button>
                            <button
                              onClick={() => handleUpdateStatus('marketing', m.id, 'REVIEWING')}
                              disabled={actionLoading === m.id}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                            >
                              Mark In-Touch
                            </button>
                          </>
                        )}
                        {m.status === 'REVIEWING' && (
                          <button
                            onClick={() => handleUpdateStatus('marketing', m.id, 'APPROVED')}
                            disabled={actionLoading === m.id}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                          >
                            Mark Completed
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: System Notifications Feed */}
      {activeTab === 'alerts' && (
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
                  n.type === 'camp_request' ? 'bg-indigo-100 text-indigo-600' :
                  n.type === 'marketing_request' ? 'bg-blue-100 text-blue-600' :
                  n.type === 'platform_inquiry' ? 'bg-purple-100 text-purple-600' :
                  !n.read ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  {n.type === 'camp_request' ? <HeartPulse size={20} /> :
                   n.type === 'marketing_request' ? <Megaphone size={20} /> :
                   n.type === 'platform_inquiry' ? <MessageSquare size={20} /> :
                   <Bell size={20} />}
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
      )}
    </div>
  );
};

export default Notifications;

