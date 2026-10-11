import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useAdminAuth } from '../../contexts/AuthContext';
import { CheckCircle2, XCircle, Building2, TestTube, MapPin, Calendar, ExternalLink, Percent, Save } from 'lucide-react';
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
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

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

  const [commissionAdmin, setCommissionAdmin] = useState<string>('20');
  const [commissionPartner, setCommissionPartner] = useState<string>('80');
  const [savingCommission, setSavingCommission] = useState(false);
  const [commissionSuccess, setCommissionSuccess] = useState<string | null>(null);
  const [commissionError, setCommissionError] = useState<string | null>(null);

  // When request is selected, initialize commission from saved hospitalShare
  useEffect(() => {
    if (selectedRequest) {
      const share = selectedRequest.hospitalShare !== undefined && selectedRequest.hospitalShare !== null
        ? Number(selectedRequest.hospitalShare)
        : 80;
      setCommissionPartner(share.toString());
      setCommissionAdmin((100 - share).toString());
      setCommissionSuccess(null);
      setCommissionError(null);
    }
  }, [selectedRequest]);

  const handleAdminCommInput = (val: string) => {
    setCommissionAdmin(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setCommissionPartner((100 - num).toString());
      setCommissionError(null);
    } else {
      setCommissionError('Percentages must be between 0 and 100');
    }
  };

  const handlePartnerShareInput = (val: string) => {
    setCommissionPartner(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setCommissionAdmin((100 - num).toString());
      setCommissionError(null);
    } else {
      setCommissionError('Percentages must be between 0 and 100');
    }
  };

  const handleSaveCommission = async () => {
    if (!selectedRequest || !token) return;
    const a = parseFloat(commissionAdmin);
    const p = parseFloat(commissionPartner);
    if (isNaN(a) || isNaN(p) || Math.round(a + p) !== 100 || a < 0 || p < 0) {
      setCommissionError('Admin commission and partner share must total exactly 100%.');
      return;
    }

    setSavingCommission(true);
    setCommissionError(null);
    setCommissionSuccess(null);
    try {
      const res = await adminService.updateVerificationStatus(token, selectedRequest.type, selectedRequest.id, {
        status: selectedRequest.verificationStatus || 'PENDING',
        hospitalSharePercentage: p
      });
      if (res.success) {
        setCommissionSuccess('Commission arrangement saved successfully!');
        showNotification('Commission arrangement saved successfully!', 'success');
        // Update local object so UI reflects saved rate immediately
        setSelectedRequest({
          ...selectedRequest,
          hospitalShare: p
        });
        fetchData();
      } else {
        setCommissionError(res.message || 'Failed to save commission arrangement.');
      }
    } catch (err: any) {
      setCommissionError(err.message || 'Error saving commission.');
    } finally {
      setSavingCommission(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest || !token) return;
    
    // Ensure valid commission
    const p = parseFloat(commissionPartner);
    if (isNaN(p) || p < 0 || p > 100) {
      showNotification('Please configure a valid commission arrangement before approval.', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await adminService.updateVerificationStatus(token, selectedRequest.type, selectedRequest.id, {
        status: 'APPROVED',
        hospitalSharePercentage: p
      });
      if (res.success) {
        showNotification(`${selectedRequest.type === 'hospital' ? 'Hospital' : 'Laboratory'} approved successfully!`, 'success');
        setSelectedRequest(null);
        fetchData();
      } else {
        showNotification(res.message || 'Failed to approve', 'error');
      }
    } catch (err) {
      showNotification('Error updating status', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedRequest || !token) return;
    if (!cancellationReason.trim()) {
      showNotification('Please provide a reason for cancelling this request.', 'error');
      return;
    }
    
    setIsProcessing(true);
    try {
      const res = await adminService.updateVerificationStatus(token, selectedRequest.type, selectedRequest.id, {
        status: 'CANCELLED',
        cancellationReason
      });
      if (res.success) {
        showNotification(`${selectedRequest.type === 'hospital' ? 'Hospital' : 'Laboratory'} request cancelled!`, 'success');
        setShowCancelModal(false);
        setCancellationReason('');
        setSelectedRequest(null);
        fetchData();
      } else {
        showNotification(res.message || 'Failed to cancel', 'error');
      }
    } catch (err) {
      showNotification('Error cancelling request', 'error');
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
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8 relative">
      {notification && (
        <div className={`fixed top-6 right-6 z-[60] p-4 rounded-xl shadow-xl flex items-center transition-all min-w-[300px] ${notification.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 mr-3 text-emerald-600" /> : <XCircle className="w-5 h-5 mr-3 text-red-600" />}
          <span className="font-semibold text-sm flex-1">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-4 text-slate-400 hover:text-slate-600">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

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
        {allRequests.slice(0, 5).map((req) => {
          const isConfigured = req.hospitalShare !== null && req.hospitalShare !== undefined;
          const adminPct = isConfigured ? (100 - Number(req.hospitalShare)) : null;
          const partnerPct = isConfigured ? Number(req.hospitalShare) : null;
          const partnerLabel = req.type === 'hospital' ? 'Hospital' : 'Lab';

          return (
            <div key={req.id} className="border border-slate-200 rounded-xl p-5 hover:border-blue-300 transition-colors bg-slate-50 flex flex-col justify-between">
              <div>
                <div className="flex items-center text-sm font-medium text-slate-500 mb-3">
                  {req.type === 'hospital' ? <Building2 className="w-4 h-4 mr-2 text-blue-500" /> : <TestTube className="w-4 h-4 mr-2 text-purple-500" />}
                  {req.type === 'hospital' ? '🏥 Hospital Verification' : '🧪 Laboratory Verification'}
                </div>
                
                <h4 className="font-bold text-slate-900 text-lg leading-tight mb-1 line-clamp-1">{req.name}</h4>
                <div className="flex items-center text-slate-600 text-sm mb-3">
                  <MapPin className="w-3.5 h-3.5 mr-1" />
                  <span className="line-clamp-1">{req.city || req.area || 'Location not specified'}</span>
                </div>
                
                <div className="bg-white border border-slate-100 rounded-lg p-3 text-xs text-slate-600 mb-3 space-y-1.5">
                  {req.type === 'lab' && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Type:</span>
                      <span className="font-medium text-slate-700">{req.label}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Request Date:</span>
                    <span className="font-medium text-slate-700">{format(new Date(req.createdAt), 'dd MMM yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Request Status:</span>
                    <span className="font-semibold text-amber-600">Pending Verification</span>
                  </div>
                </div>

                {/* Commission Arrangement Box */}
                <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-3 text-xs mb-4">
                  <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-blue-100">
                    <span className="font-bold text-blue-900">Commission Arrangement</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {isConfigured ? 'Configured' : 'Not configured'}
                    </span>
                  </div>
                  <div className="space-y-1 text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Admin Commission:</span>
                      <span className="font-bold text-slate-900">{isConfigured ? `${adminPct}%` : 'Not configured'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">{partnerLabel} Share:</span>
                      <span className="font-bold text-slate-900">{isConfigured ? `${partnerPct}%` : 'Not configured'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2 border-t border-slate-200/60">
                <button 
                  onClick={() => setSelectedRequest(req)}
                  className="flex-1 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all font-medium text-xs flex justify-center items-center shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  View Details
                </button>
                <button 
                  onClick={() => setSelectedRequest(req)}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium text-xs flex justify-center items-center shadow-sm"
                >
                  <Percent className="w-3.5 h-3.5 mr-1.5" />
                  Configure Commission
                </button>
              </div>
            </div>
          );
        })}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                    <div className="grid grid-cols-3"><dt className="text-slate-500">Status</dt><dd className="col-span-2 font-bold text-amber-600">PENDING VERIFICATION</dd></div>
                  </dl>
                </div>
                
                <div>
                  {selectedRequest.type === 'lab' && (
                    <>
                      <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2">Laboratory Details</h4>
                      <dl className="space-y-3 text-sm mb-6">
                        <div className="grid grid-cols-3"><dt className="text-slate-500">Lab Type</dt><dd className="col-span-2 font-medium text-slate-900">{selectedRequest.label}</dd></div>
                        <div className="grid grid-cols-3"><dt className="text-slate-500">Assoc. Hospital</dt><dd className="col-span-2 font-medium text-slate-900">
                          {selectedRequest.isStandalone ? 'Not Applicable (Standalone)' : (selectedRequest.hospital?.name || 'Unknown')}
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

              {/* Commission Configuration Section */}
              <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border border-blue-200/80 rounded-xl p-5 mb-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-blue-200/60 gap-2">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 flex items-center">
                      <Percent className="w-5 h-5 mr-2 text-blue-600" />
                      Commission Configuration
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Configure revenue-sharing arrangement at request time. This will be visible on the partner's portal before operating.
                    </p>
                  </div>
                  <span className={`self-start sm:self-auto px-2.5 py-1 rounded-full text-xs font-bold ${
                    selectedRequest.hospitalShare !== null && selectedRequest.hospitalShare !== undefined
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {selectedRequest.hospitalShare !== null && selectedRequest.hospitalShare !== undefined ? 'Configured' : 'Awaiting Configuration'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Admin Commission (%)
                    </label>
                    <div className="relative">
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={commissionAdmin}
                        onChange={(e) => handleAdminCommInput(e.target.value)}
                        placeholder="20"
                        className="w-full bg-white border border-slate-300 rounded-lg pl-3 pr-8 py-2.5 text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="absolute right-3 top-3 text-slate-400 text-sm font-bold">%</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Platform fee retained per eligible transaction</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      {selectedRequest.type === 'hospital' ? 'Hospital' : 'Lab'} Share (%)
                    </label>
                    <div className="relative">
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={commissionPartner}
                        onChange={(e) => handlePartnerShareInput(e.target.value)}
                        placeholder="80"
                        className="w-full bg-white border border-slate-300 rounded-lg pl-3 pr-8 py-2.5 text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="absolute right-3 top-3 text-slate-400 text-sm font-bold">%</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Payout share to {selectedRequest.type === 'hospital' ? 'Hospital' : 'Laboratory'}</p>
                  </div>
                </div>

                {commissionError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3 mb-3 flex items-center">
                    <XCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{commissionError}</span>
                  </div>
                )}

                {commissionSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg p-3 mb-3 flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{commissionSuccess}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-blue-100">
                  <div className="text-xs text-slate-600">
                    Total Revenue Share: <span className={`font-bold ${(parseFloat(commissionAdmin) + parseFloat(commissionPartner)) === 100 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {(parseFloat(commissionAdmin) || 0) + (parseFloat(commissionPartner) || 0)}%
                    </span> <span className="text-slate-400">(Admin + Partner must equal exactly 100%)</span>
                  </div>
                  <button
                    onClick={handleSaveCommission}
                    disabled={savingCommission || (parseFloat(commissionAdmin) + parseFloat(commissionPartner)) !== 100}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center shadow-sm"
                  >
                    {savingCommission ? (
                      <>
                        <span className="animate-spin mr-1.5">⏳</span>
                        Saving commission arrangement...
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5 mr-1.5" />
                        Save Commission Arrangement
                      </>
                    )}
                  </button>
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
                      Approve Request
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
