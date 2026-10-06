import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useAdminAuth } from '../../contexts/AuthContext';
import { CheckCircle2, XCircle, Building2, TestTube, MapPin, Calendar, ExternalLink } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Link } from 'react-router-dom';

const PendingVerifications: React.FC = () => {
  const { token } = useAdminAuth();
  const [data, setData] = useState<{hospitals: any[], standaloneLabs: any[], hospitalBasedLabs: any[]}>({
    hospitals: [], standaloneLabs: [], hospitalBasedLabs: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await adminService.getPendingVerifications(token);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError('Failed to load pending verifications');
      }
    } catch (err) {
      setError('Error fetching pending verifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleApprove = async () => {
    if (!selectedRequest || !token) return;
    if (!window.confirm(`Are you sure you want to approve this ${selectedRequest.type === 'hospital' ? 'hospital' : 'laboratory'}?`)) return;
    
    setIsProcessing(true);
    try {
      const res = await adminService.updateVerificationStatus(token, selectedRequest.type, selectedRequest.id, {
        status: 'APPROVED'
      });
      if (res.success) {
        setSelectedRequest(null);
        fetchData();
      } else {
        alert(res.message || 'Failed to approve');
      }
    } catch (err) {
      alert('Error updating status');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedRequest || !token) return;
    if (!cancellationReason.trim()) {
      alert('Please provide a reason for cancelling this request.');
      return;
    }
    
    setIsProcessing(true);
    try {
      const res = await adminService.updateVerificationStatus(token, selectedRequest.type, selectedRequest.id, {
        status: 'CANCELLED',
        cancellationReason
      });
      if (res.success) {
        setShowCancelModal(false);
        setCancellationReason('');
        setSelectedRequest(null);
        fetchData();
      } else {
        alert(res.message || 'Failed to cancel');
      }
    } catch (err) {
      alert('Error cancelling request');
    } finally {
      setIsProcessing(false);
    }
  };

  const allRequests = [
    ...data.hospitals.map(h => ({ ...h, type: 'hospital', label: 'Hospital' })),
    ...data.standaloneLabs.map(l => ({ ...l, type: 'lab', label: 'Standalone Laboratory', isStandalone: true })),
    ...data.hospitalBasedLabs.map(l => ({ ...l, type: 'lab', label: 'Hospital-Based Laboratory', isStandalone: false }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8 animate-pulse">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Pending Verification Requests</h3>
        <div className="text-slate-500">Loading requests...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Pending Verification Requests</h3>
        <div className="text-red-500 mb-2">{error}</div>
        <button onClick={fetchData} className="text-blue-600 font-medium hover:underline text-sm">Retry</button>
      </div>
    );
  }

  if (allRequests.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Pending Verification Requests</h3>
        <div className="flex items-center text-emerald-600 bg-emerald-50 p-4 rounded-lg">
          <CheckCircle2 className="w-5 h-5 mr-3" />
          <span className="font-medium">No pending hospital or laboratory verification requests.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 flex items-center">
            Pending Verification Requests
            <span className="ml-3 bg-amber-100 text-amber-700 py-1 px-3 rounded-full text-xs font-bold">
              {allRequests.length}
            </span>
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Hospitals: {data.hospitals.length} • Labs: {data.standaloneLabs.length + data.hospitalBasedLabs.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allRequests.slice(0, 5).map((req) => (
          <div key={req.id} className="border border-slate-200 rounded-xl p-5 hover:border-blue-300 transition-colors bg-slate-50">
            <div className="flex items-center text-sm font-medium text-slate-500 mb-3">
              {req.type === 'hospital' ? <Building2 className="w-4 h-4 mr-2 text-blue-500" /> : <TestTube className="w-4 h-4 mr-2 text-purple-500" />}
              {req.type === 'hospital' ? '🏥 Hospital Verification' : '🧪 Laboratory Verification'}
            </div>
            
            <h4 className="font-bold text-slate-900 text-lg leading-tight mb-1 line-clamp-1">{req.name}</h4>
            <div className="flex items-center text-slate-600 text-sm mb-3">
              <MapPin className="w-3.5 h-3.5 mr-1" />
              <span className="line-clamp-1">{req.city || req.area || 'Location not specified'}</span>
            </div>
            
            <div className="bg-white border border-slate-100 rounded-lg p-3 text-xs text-slate-600 mb-4 space-y-1.5">
              {req.type === 'lab' && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Type:</span>
                  <span className="font-medium text-slate-700">{req.label}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Submitted:</span>
                <span className="font-medium text-slate-700">{formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="font-medium text-amber-600">Pending</span>
              </div>
            </div>
            
            <button 
              onClick={() => setSelectedRequest(req)}
              className="w-full py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all font-medium text-sm flex justify-center items-center"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Details
            </button>
          </div>
        ))}
      </div>

      {allRequests.length > 5 && (
        <div className="mt-6 text-center">
          <Link to="/admin/verifications" className="text-blue-600 font-medium hover:underline text-sm inline-flex items-center">
            View All Pending Requests ({allRequests.length})
          </Link>
        </div>
      )}

      {/* Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10">
              <h3 className="text-xl font-bold text-slate-900">
                {selectedRequest.type === 'hospital' ? 'Hospital' : 'Laboratory'} Verification Request
              </h3>
              <button 
                onClick={() => { setSelectedRequest(null); setShowCancelModal(false); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2">Information</h4>
                  <dl className="space-y-3 text-sm">
                    <div className="grid grid-cols-3"><dt className="text-slate-500">Name</dt><dd className="col-span-2 font-medium text-slate-900">{selectedRequest.name}</dd></div>
                    <div className="grid grid-cols-3"><dt className="text-slate-500">Reg No.</dt><dd className="col-span-2 font-medium text-slate-900">{selectedRequest.registrationNumber || selectedRequest.labLicenseNumber || 'N/A'}</dd></div>
                    <div className="grid grid-cols-3"><dt className="text-slate-500">Contact</dt><dd className="col-span-2 font-medium text-slate-900">{selectedRequest.contactPhone || 'N/A'}</dd></div>
                    <div className="grid grid-cols-3"><dt className="text-slate-500">Email</dt><dd className="col-span-2 font-medium text-slate-900">{selectedRequest.contactEmail || selectedRequest.email || 'N/A'}</dd></div>
                    <div className="grid grid-cols-3"><dt className="text-slate-500">City</dt><dd className="col-span-2 font-medium text-slate-900">{selectedRequest.city || 'N/A'}</dd></div>
                    <div className="grid grid-cols-3"><dt className="text-slate-500">Address</dt><dd className="col-span-2 font-medium text-slate-900">{selectedRequest.addressLine1 || selectedRequest.address || 'N/A'}</dd></div>
                    <div className="grid grid-cols-3"><dt className="text-slate-500">Submitted</dt><dd className="col-span-2 font-medium text-slate-900">{format(new Date(selectedRequest.createdAt), 'dd MMM yyyy, h:mm a')}</dd></div>
                    <div className="grid grid-cols-3"><dt className="text-slate-500">Status</dt><dd className="col-span-2 font-bold text-amber-600">PENDING</dd></div>
                  </dl>
                </div>
                
                <div>
                  {selectedRequest.type === 'lab' && (
                    <>
                      <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2">Laboratory Details</h4>
                      <dl className="space-y-3 text-sm mb-6">
                        <div className="grid grid-cols-3"><dt className="text-slate-500">Lab Type</dt><dd className="col-span-2 font-medium text-slate-900">{selectedRequest.label}</dd></div>
                        <div className="grid grid-cols-3"><dt className="text-slate-500">Assoc. Hospital</dt><dd className="col-span-2 font-medium text-slate-900">
                          {selectedRequest.isStandalone ? 'Not Applicable' : (selectedRequest.hospital?.name || 'Unknown')}
                        </dd></div>
                      </dl>
                    </>
                  )}
                  
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2">Verification Documents</h4>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm">
                    {selectedRequest.labLicenseDocumentUrl ? (
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-700">License Document</span>
                        <a href={selectedRequest.labLicenseDocumentUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View / Preview</a>
                      </div>
                    ) : (
                      <div className="text-slate-500 italic">No verification documents submitted.</div>
                    )}
                  </div>
                </div>
              </div>
              
              {!showCancelModal ? (
                <div className="border-t pt-6 bg-slate-50 -mx-6 -mb-6 px-6 pb-6">
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 text-center">Verification Decision</h4>
                  <div className="flex justify-center gap-4">
                    <button 
                      onClick={handleApprove}
                      disabled={isProcessing}
                      className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center shadow-sm disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Approve
                    </button>
                    <button 
                      onClick={() => setShowCancelModal(true)}
                      disabled={isProcessing}
                      className="px-6 py-2.5 bg-white border border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors flex items-center shadow-sm disabled:opacity-50"
                    >
                      <XCircle className="w-5 h-5 mr-2" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t pt-6 bg-slate-50 -mx-6 -mb-6 px-6 pb-6">
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">Cancel Verification Request</h4>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reason for cancellation *</label>
                  <textarea 
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="Enter why this request is being rejected or cancelled..."
                    className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-red-500 focus:border-red-500 mb-4 h-24 resize-none"
                  />
                  <div className="flex justify-between items-center">
                    <button 
                      onClick={() => setShowCancelModal(false)}
                      disabled={isProcessing}
                      className="text-slate-600 font-medium hover:text-slate-900 text-sm"
                    >
                      Back
                    </button>
                    <button 
                      onClick={handleCancel}
                      disabled={isProcessing || !cancellationReason.trim()}
                      className="px-5 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel Request
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingVerifications;
