import React, { useState, useEffect, useCallback } from 'react';
import { 
  HeartPulse, 
  Megaphone, 
  MessageSquare, 
  Clock, 
  MapPin, 
  Building2, 
  RefreshCw, 
  CheckCircle2, 
  X,
  Users
} from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

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
  doctorId?: string | null;
  doctorName?: string | null;
  campaignType: string;
  budget?: number | null;
  targetAudience?: string | null;
  notes?: string | null;
  status: 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  createdAt: string;
}

const Requests: React.FC = () => {
  const { token } = useAdminAuth();
  const [camps, setCamps] = useState<CampRequest[]>([]);
  const [marketing, setMarketing] = useState<MarketingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal State
  const [selectedRequest, setSelectedRequest] = useState<{ type: 'camp' | 'marketing'; data: any } | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/hospital-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setCamps(json.data?.camps || []);
        setMarketing(json.data?.marketing || []);
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 20000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

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
          if (selectedRequest?.data.id === id) {
            setSelectedRequest(prev => prev ? { ...prev, data: { ...prev.data, status: newStatus } } : null);
          }
        } else {
          setMarketing(prev => prev.map(m => m.id === id ? { ...m, status: newStatus as any } : m));
          if (selectedRequest?.data.id === id) {
            setSelectedRequest(prev => prev ? { ...prev, data: { ...prev.data, status: newStatus } } : null);
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
    <div className="space-y-6 max-w-5xl pb-16 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Requests</h2>
          <p className="text-sm text-slate-500">Manage incoming requests from hospitals (Medical Camps, Marketing, etc.)</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchRequests}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin text-blue-600' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Medical Camps Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <HeartPulse size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Medical Camp Requests</h3>
              <p className="text-xs text-slate-500">Submitted by hospitals for physical camps</p>
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
                <div className="space-y-1.5 flex-1 cursor-pointer" onClick={() => setSelectedRequest({ type: 'camp', data: camp })}>
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
                      Expected: {new Date(camp.expectedDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSelectedRequest({ type: 'camp', data: camp })}
                    className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-sm"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Marketing & Platform Inquiries Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mt-6">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Megaphone size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Marketing & Inquiries</h3>
              <p className="text-xs text-slate-500">Hospital marketing campaigns & general inquiries</p>
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
                  <div className="space-y-1.5 flex-1 cursor-pointer" onClick={() => setSelectedRequest({ type: 'marketing', data: m })}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-base hover:text-blue-600 transition-colors">
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
                      {m.doctorName && (
                        <span className="flex items-center gap-1 font-semibold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full text-xs">
                          <Users size={12} className="text-blue-500" />
                          Dr. {m.doctorName}
                        </span>
                      )}
                      <span className="text-slate-400">
                        Submitted: {formatDateTime(m.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedRequest({ type: 'marketing', data: m })}
                      className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-900">
                {selectedRequest.type === 'camp' ? 'Medical Camp Request Details' : 'Marketing/Inquiry Details'}
              </h3>
              <button 
                onClick={() => setSelectedRequest(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto">
              <div className="space-y-6">
                
                {/* Status & Basic Info */}
                <div className="flex items-center justify-between">
                  <div className={`text-sm font-bold px-3 py-1 rounded-full inline-block ${
                    selectedRequest.data.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                    selectedRequest.data.status === 'REVIEWING' ? 'bg-blue-100 text-blue-800' :
                    selectedRequest.data.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    Status: {selectedRequest.data.status}
                  </div>
                  <div className="text-sm text-slate-500">
                    Submitted: {formatDateTime(selectedRequest.data.createdAt)}
                  </div>
                </div>

                {/* Hospital Info */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Building2 size={16} className="text-blue-600" />
                    Hospital Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="block text-slate-500 text-xs mb-0.5">Name</span>
                      <span className="font-medium text-slate-900">{selectedRequest.data.hospital?.name || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="block text-slate-500 text-xs mb-0.5">Phone</span>
                      <span className="font-medium text-slate-900">{selectedRequest.data.hospital?.contactPhone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-slate-500 text-xs mb-0.5">Email</span>
                      <span className="font-medium text-slate-900">{selectedRequest.data.hospital?.contactEmail || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-slate-500 text-xs mb-0.5">Location</span>
                      <span className="font-medium text-slate-900">
                        {selectedRequest.data.hospital?.city ? `${selectedRequest.data.hospital.city}, ${selectedRequest.data.hospital.state}` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Request Specific Info */}
                {selectedRequest.type === 'camp' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <HeartPulse size={16} className="text-indigo-600" />
                      Camp Details
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="col-span-2">
                        <span className="block text-slate-500 text-xs mb-0.5">Camp Title</span>
                        <span className="font-medium text-slate-900 text-base">{selectedRequest.data.campTitle}</span>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="block text-slate-500 text-xs mb-0.5">Location</span>
                        <span className="font-medium text-slate-900 flex items-center gap-1">
                          <MapPin size={14} className="text-slate-400" /> {selectedRequest.data.location}
                        </span>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="block text-slate-500 text-xs mb-0.5">Expected Date</span>
                        <span className="font-medium text-slate-900 flex items-center gap-1">
                          <Clock size={14} className="text-slate-400" /> {new Date(selectedRequest.data.expectedDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-slate-500 text-xs mb-0.5">Specialties</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedRequest.data.specialties?.map((s: string) => (
                            <span key={s} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md border border-indigo-100">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-slate-500 text-xs mb-0.5">Expected Patients</span>
                        <span className="font-medium text-slate-900 flex items-center gap-1">
                          <Users size={14} className="text-slate-400" /> {selectedRequest.data.expectedPatients || 'Not specified'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedRequest.type === 'marketing' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Megaphone size={16} className="text-blue-600" />
                      Marketing / Campaign Details
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="col-span-2">
                        <span className="block text-slate-500 text-xs mb-0.5">Campaign Services</span>
                        <span className="font-semibold text-slate-900 text-base">
                          {selectedRequest.data.campaignType.replace('PLATFORM_INQUIRY:', '').trim()}
                        </span>
                      </div>
                      {selectedRequest.data.budget && (
                        <div>
                          <span className="block text-slate-500 text-xs mb-0.5">Estimated Budget</span>
                          <span className="font-medium text-slate-900">₹{Number(selectedRequest.data.budget).toLocaleString()} / month</span>
                        </div>
                      )}
                    </div>

                    {selectedRequest.data.doctorName && (
                      <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-100 space-y-2 mt-2">
                        <h5 className="text-xs font-bold text-blue-900 flex items-center gap-1.5 uppercase tracking-wide">
                          <Users size={14} className="text-blue-600" />
                          Requesting Doctor
                        </h5>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="block text-slate-500 text-xs">Doctor Name</span>
                            <span className="font-bold text-slate-900">Dr. {selectedRequest.data.doctorName}</span>
                          </div>
                          <div>
                            <span className="block text-slate-500 text-xs">Doctor ID</span>
                            <span className="font-mono text-xs text-slate-600 truncate block">{selectedRequest.data.doctorId || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                {selectedRequest.data.notes && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="block text-slate-500 text-xs font-semibold">Additional Notes / Message</span>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {selectedRequest.data.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              {selectedRequest.data.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(selectedRequest.type, selectedRequest.data.id, 'REVIEWING')}
                    disabled={actionLoading === selectedRequest.data.id}
                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors shadow-sm"
                  >
                    Mark Reviewing
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedRequest.type, selectedRequest.data.id, 'APPROVED')}
                    disabled={actionLoading === selectedRequest.data.id}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                  >
                    <CheckCircle2 size={16} /> 
                    {selectedRequest.type === 'camp' ? 'Approve Camp' : 'Mark as Contacted'}
                  </button>
                </>
              )}
              {selectedRequest.data.status === 'REVIEWING' && (
                <button
                  onClick={() => handleUpdateStatus(selectedRequest.type, selectedRequest.data.id, 'APPROVED')}
                  disabled={actionLoading === selectedRequest.data.id}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                >
                  <CheckCircle2 size={16} /> Approve
                </button>
              )}
              {selectedRequest.data.status === 'APPROVED' && (
                <button
                  onClick={() => handleUpdateStatus(selectedRequest.type, selectedRequest.data.id, 'COMPLETED')}
                  disabled={actionLoading === selectedRequest.data.id}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                >
                  Mark Completed
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Requests;
