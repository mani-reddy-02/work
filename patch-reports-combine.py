import os

reports_file = r'mediquee admin\src\pages\Reports.tsx'

reports_new = """import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download, HeartPulse, Building2, MapPin, RefreshCw, Clock, History } from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

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

const Reports: React.FC = () => {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const [camps, setCamps] = useState<CampRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Modal State
  const [selectedRequest, setSelectedRequest] = useState<CampRequest | null>(null);

  const fetchActiveCamps = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/camp-requests/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setCamps(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load active camp requests:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchActiveCamps();
    const interval = setInterval(fetchActiveCamps, 20000);
    return () => clearInterval(interval);
  }, [fetchActiveCamps]);

  const handleUpdateStatus = async (id: string, newStatus: string, notes?: string) => {
    if (!token) return;
    setActionLoading(id);
    try {
      const payload: any = { status: newStatus };
      if (notes) payload.notes = notes;

      const res = await fetch(`${API_BASE_URL}/admin/hospital-requests/camp/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // If completed or rejected, it moves to history
        if (newStatus === 'COMPLETED' || newStatus === 'REJECTED') {
           setCamps(prev => prev.filter(c => c.id !== id));
           if (selectedRequest?.id === id) setSelectedRequest(null);
        } else {
           setCamps(prev => prev.map(c => c.id === id ? { ...c, status: newStatus as any, ...(notes ? { notes } : {}) } : c));
           if (selectedRequest?.id === id) {
             setSelectedRequest(prev => prev ? { ...prev, status: newStatus as any, ...(notes ? { notes } : {}) } : null);
           }
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

  return (
    <div className="space-y-6 pb-16 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Reports & Analytics</h2>
          <p className="text-sm text-slate-500">Comprehensive insights and active camp requests management.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Download size={16} />
            Export PDF
          </button>
          <button 
            onClick={() => navigate('/admin/reports/requests-history')}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <History size={16} />
            Requests History
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Appointment Trends Bar Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Weekly Appointment Volume</h3>
          <div className="h-80">
            {false ? <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[]} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cancelled" name="Cancelled" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer> : <div className="flex items-center justify-center h-full text-sm text-slate-500">No data available yet.</div>}
          </div>
        </div>

        {/* ACTIVE CAMP REQUESTS */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mt-2">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                <HeartPulse size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">ACTIVE CAMP REQUESTS</h3>
                <p className="text-xs text-slate-500">Pending and Approved / Upcoming requests</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={fetchActiveCamps}
                disabled={isLoading}
                className="flex items-center justify-center p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                title="Refresh Requests"
              >
                <RefreshCw size={15} className={isLoading ? 'animate-spin text-blue-600' : ''} />
              </button>
              <span className="text-xs font-bold text-slate-500 bg-white border px-2.5 py-1 rounded-full shadow-2xs">
                {camps.length} Active
              </span>
            </div>
          </div>

          {camps.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No active camp requests found.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {camps.map(camp => (
                <div key={camp.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="space-y-1.5 flex-1 cursor-pointer" onClick={() => setSelectedRequest(camp)}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-base hover:text-blue-600 transition-colors">{camp.campTitle}</span>
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
                      <span className="flex items-center gap-1 text-slate-500">
                        <MapPin size={13} className="text-slate-400" />
                        {camp.location}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock size={13} className="text-slate-400" />
                        Expected: {formatDateTime(camp.expectedDate)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2 md:mt-0">
                    <button 
                      onClick={() => setSelectedRequest(camp)}
                      className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-md transition-colors"
                    >
                      View
                    </button>
                    {camp.status === 'PENDING' && (
                      <button 
                        onClick={() => handleUpdateStatus(camp.id, 'APPROVED')}
                        disabled={actionLoading === camp.id}
                        className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
                      >
                        {actionLoading === camp.id ? 'Approving...' : 'Approve'}
                      </button>
                    )}
                    {camp.status === 'APPROVED' && (
                      <button 
                        onClick={() => handleUpdateStatus(camp.id, 'COMPLETED')}
                        disabled={actionLoading === camp.id}
                        className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
                      >
                        {actionLoading === camp.id ? 'Completing...' : 'Mark as Completed'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Overlay */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden border border-slate-100 flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 z-10">
              <h3 className="font-bold text-lg text-slate-900">Camp Request Details</h3>
              <button 
                onClick={() => setSelectedRequest(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                   <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Request Info</p>
                   <p className="text-sm font-medium text-slate-900">{selectedRequest.campTitle}</p>
                   <p className="text-xs text-slate-500 mt-1">ID: {selectedRequest.id}</p>
                   <p className="text-xs text-slate-500">Submitted: {formatDateTime(selectedRequest.createdAt)}</p>
                </div>
                <div>
                   <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</p>
                   <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      selectedRequest.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      selectedRequest.status === 'REVIEWING' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      selectedRequest.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {selectedRequest.status}
                    </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                   <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Organization</p>
                   <p className="text-sm font-medium text-slate-900">{selectedRequest.hospital?.name || 'Unknown'}</p>
                   <p className="text-xs text-slate-500 mt-1">{selectedRequest.hospital?.city}, {selectedRequest.hospital?.state}</p>
                   <p className="text-xs text-slate-500">{selectedRequest.hospital?.contactPhone}</p>
                   <p className="text-xs text-slate-500">{selectedRequest.hospital?.contactEmail}</p>
                </div>
                <div>
                   <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Camp Details</p>
                   <p className="text-sm font-medium text-slate-900">Date: {formatDateTime(selectedRequest.expectedDate)}</p>
                   <p className="text-sm text-slate-700 mt-1">Location: {selectedRequest.location}</p>
                   <p className="text-sm text-slate-700 mt-1">Target Patients: {selectedRequest.expectedPatients || 'N/A'}</p>
                   <p className="text-sm text-slate-700 mt-1">Specialties: {selectedRequest.specialties?.join(', ')}</p>
                </div>
              </div>

              {selectedRequest.notes && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Notes</p>
                  <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-700">
                    {selectedRequest.notes}
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-wrap justify-end gap-2 sticky bottom-0 z-10">
              <button 
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
              >
                Close
              </button>
              
              {selectedRequest.status === 'PENDING' && (
                <>
                  <button 
                    onClick={() => {
                      const reason = window.prompt("Reason for rejection:");
                      if (reason !== null) {
                         handleUpdateStatus(selectedRequest.id, 'REJECTED', reason);
                      }
                    }}
                    disabled={actionLoading === selectedRequest.id}
                    className="px-4 py-2 text-sm font-bold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    Reject Request
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(selectedRequest.id, 'APPROVED')}
                    disabled={actionLoading === selectedRequest.id}
                    className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    {actionLoading === selectedRequest.id ? 'Approving...' : 'Approve Request'}
                  </button>
                </>
              )}

              {selectedRequest.status === 'APPROVED' && (
                <button 
                  onClick={() => {
                    if(window.confirm('Are you sure this camp has been completed?')) {
                      handleUpdateStatus(selectedRequest.id, 'COMPLETED');
                    }
                  }}
                  disabled={actionLoading === selectedRequest.id}
                  className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                >
                  {actionLoading === selectedRequest.id ? 'Completing...' : 'Mark as Completed'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
"""

with open(reports_file, 'w', encoding='utf-8') as f:
    f.write(reports_new)
print('Updated Reports.tsx successfully')
