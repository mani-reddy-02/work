import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Search, Calendar, MapPin, Building2, Eye, Filter, RefreshCw } from 'lucide-react';
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
  updatedAt: string;
}

const RequestsHistory: React.FC = () => {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<CampRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [selectedRequest, setSelectedRequest] = useState<CampRequest | null>(null);

  const fetchHistory = useCallback(async (pageNum: number) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/camp-requests/history?page=${pageNum}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setHistory(json.data || []);
        if (json.pagination) {
          setTotalPages(json.pagination.totalPages);
          setTotalRecords(json.pagination.total);
        }
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchHistory(page);
  }, [fetchHistory, page]);

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const filteredHistory = history.filter(item => {
    if (!searchQuery) return true;
    const lowerQ = searchQuery.toLowerCase();
    return (
      item.campTitle.toLowerCase().includes(lowerQ) ||
      item.id.toLowerCase().includes(lowerQ) ||
      (item.hospital?.name || '').toLowerCase().includes(lowerQ) ||
      item.location.toLowerCase().includes(lowerQ)
    );
  });

  return (
    <div className="space-y-6 max-w-6xl pb-16 relative">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/admin/reports')}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Requests History</h2>
        </div>
        <p className="text-sm text-slate-500 ml-9">Admin / Reports / Requests History</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search request history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow bg-white"
          />
        </div>
        <button className="flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
          <Filter size={16} />
          Filters
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
              <tr>
                <th className="px-4 py-3 text-center w-12">S.No</th>
                <th className="px-4 py-3">Request ID</th>
                <th className="px-4 py-3">Camp Name</th>
                <th className="px-4 py-3">Organizer / Hospital</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Camp Date</th>
                <th className="px-4 py-3">Completed Date</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && history.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <RefreshCw size={24} className="animate-spin text-slate-400 mb-2" />
                      Loading request history...
                    </div>
                  </td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                    No Request History. Completed and closed camp requests will appear here.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-center text-slate-500 font-medium">
                      {(page - 1) * 20 + index + 1}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                      {item.id.substring(0, 8)}...
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {item.campTitle}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Building2 size={13} className="text-slate-400" />
                        {item.hospital?.name || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-slate-400" />
                        {item.location}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-400" />
                        {formatDateTime(item.expectedDate)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDateTime(item.updatedAt)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        item.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 
                        item.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => setSelectedRequest(item)}
                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 p-1.5 rounded-md transition-colors inline-flex items-center justify-center"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!isLoading && filteredHistory.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              Showing <span className="font-medium text-slate-900">{(page - 1) * 20 + 1}</span> to <span className="font-medium text-slate-900">{Math.min(page * 20, totalRecords)}</span> of <span className="font-medium text-slate-900">{totalRecords}</span>
            </div>
            <div className="flex gap-1">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 border border-slate-200 bg-white text-slate-600 rounded-md text-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = i + 1;
                // Simple logic for nearby pages if totalPages > 5
                if (totalPages > 5 && page > 3) p = page - 2 + i;
                if (p > totalPages) return null;
                return (
                  <button 
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1 border rounded-md text-sm transition-colors ${
                      page === p 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-medium' 
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                )
              })}
              <button 
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1 border border-slate-200 bg-white text-slate-600 rounded-md text-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden border border-slate-100 flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 z-10">
              <h3 className="font-bold text-lg text-slate-900">Request History Details</h3>
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
                      selectedRequest.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      selectedRequest.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      'bg-slate-50 text-slate-700 border border-slate-200'
                    }`}>
                      {selectedRequest.status}
                    </span>
                   {selectedRequest.status === 'COMPLETED' && (
                     <p className="text-xs text-slate-500 mt-2">Completed on: {formatDateTime(selectedRequest.updatedAt)}</p>
                   )}
                   {selectedRequest.status === 'REJECTED' && (
                     <p className="text-xs text-slate-500 mt-2">Rejected on: {formatDateTime(selectedRequest.updatedAt)}</p>
                   )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                   <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Organization Info</p>
                   <p className="text-sm font-medium text-slate-900">{selectedRequest.hospital?.name || 'Unknown'}</p>
                   <p className="text-xs text-slate-500 mt-1">{selectedRequest.hospital?.city}, {selectedRequest.hospital?.state}</p>
                   <p className="text-xs text-slate-500">{selectedRequest.hospital?.contactPhone}</p>
                   <p className="text-xs text-slate-500">{selectedRequest.hospital?.contactEmail}</p>
                </div>
                <div>
                   <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Camp Info</p>
                   <p className="text-sm font-medium text-slate-900">Date: {formatDateTime(selectedRequest.expectedDate)}</p>
                   <p className="text-sm text-slate-700 mt-1">Location: {selectedRequest.location}</p>
                   <p className="text-sm text-slate-700 mt-1">Target Patients: {selectedRequest.expectedPatients || 'N/A'}</p>
                   <p className="text-sm text-slate-700 mt-1">Specialties: {selectedRequest.specialties?.join(', ')}</p>
                </div>
              </div>

              {selectedRequest.notes && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Completion/Cancellation Notes</p>
                  <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-700">
                    {selectedRequest.notes}
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end sticky bottom-0 z-10">
              <button 
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestsHistory;
