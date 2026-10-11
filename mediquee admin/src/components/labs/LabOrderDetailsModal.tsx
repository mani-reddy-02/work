import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, MapPin, User, Building2, FlaskConical, 
  FileText, CheckCircle2, AlertCircle, XCircle, Upload, Download, 
  ArrowRight, ShieldAlert, Phone, FileCheck, RefreshCw, Calendar, Clock
} from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import { labService } from '../../services/labService';

interface LabOrderDetailsModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated: () => void;
  token: string | null;
}

export const LabOrderDetailsModal: React.FC<LabOrderDetailsModalProps> = ({
  orderId,
  isOpen,
  onClose,
  onOrderUpdated,
  token
}) => {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Scheduling inputs
  const [phlebName, setPhlebName] = useState('');
  const [phlebPhone, setPhlebPhone] = useState('');
  const [schedDate, setSchedDate] = useState('');
  const [schedSlot, setSchedSlot] = useState('');
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  // Cancellation inputs
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Report upload inputs
  const [selectedFile, setSelectedFile] = useState<{ name: string; base64: string } | null>(null);
  const [uploadingReport, setUploadingReport] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!orderId || !token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await labService.getLabBookingById(orderId, token);
      if (res.success && res.data) {
        setOrder(res.data);
        if (res.data.phlebotomistName) setPhlebName(res.data.phlebotomistName);
        if (res.data.phlebotomistPhone) setPhlebPhone(res.data.phlebotomistPhone);
        if (res.data.collectionDate) setSchedDate(res.data.collectionDate.split('T')[0]);
        if (res.data.collectionTimeSlot) setSchedSlot(res.data.collectionTimeSlot);
      } else {
        setError(res.message || 'Failed to fetch order details');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderId, token]);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrder();
      setActionError(null);
      setActionSuccess(null);
      setShowScheduleForm(false);
      setShowCancelModal(false);
      setSelectedFile(null);
    } else {
      setOrder(null);
    }
  }, [isOpen, orderId, fetchOrder]);

  if (!isOpen) return null;

  const handleStatusTransition = async (targetStatus: string, extraData?: any) => {
    if (!orderId || !token) return;
    try {
      setActionLoading(true);
      setActionError(null);
      setActionSuccess(null);

      const payload = {
        status: targetStatus,
        ...extraData
      };

      const res = await labService.updateLabBookingStatus(orderId, payload, token);
      if (res.success) {
        setActionSuccess(`Order status successfully updated to ${targetStatus}`);
        setShowScheduleForm(false);
        setShowCancelModal(false);
        await fetchOrder();
        onOrderUpdated();
      } else {
        setActionError(res.message || 'Failed to update order status');
      }
    } catch (e: any) {
      setActionError(e.message || 'Error executing status transition');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowed.includes(file.type)) {
      setActionError('Invalid file type. Please upload a PDF, JPG, or PNG document.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setActionError('File size exceeds the 10MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFile({
        name: file.name,
        base64: reader.result as string
      });
      setActionError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadReport = async () => {
    if (!orderId || !token || !selectedFile) return;
    try {
      setUploadingReport(true);
      setActionError(null);
      setActionSuccess(null);

      const res = await labService.uploadLabReport(orderId, selectedFile.base64, selectedFile.name, token);
      if (res.success) {
        setActionSuccess('Test report uploaded successfully and order marked as Completed.');
        setSelectedFile(null);
        await fetchOrder();
        onOrderUpdated();
      } else {
        setActionError(res.message || 'Failed to upload report');
      }
    } catch (e: any) {
      setActionError(e.message || 'Error uploading file');
    } finally {
      setUploadingReport(false);
    }
  };

  const handleConfirmCancel = () => {
    if (!cancelReason.trim()) {
      setActionError('Please provide a specific reason for cancelling this order.');
      return;
    }
    handleStatusTransition('CANCELLED', { cancellationReason: cancelReason.trim() });
  };

  // Status mapping
  const currentStatus = order?.status || 'REQUESTED';
  const isHomeCollection = order?.bookingType === 'HOME_COLLECTION';
  const isTerminal = ['CANCELLED', 'COMPLETED'].includes(currentStatus) || (currentStatus === 'REPORT_READY' && order?.reportUrl);

  // Separate stages for Home Sample Collection vs Lab Visit
  const stages = isHomeCollection
    ? [
        { key: 'REQUESTED', label: 'Order Created' },
        { key: 'ASSIGNED', label: 'Collection Scheduled' },
        { key: 'SAMPLE_COLLECTED', label: 'Sample Collected at Home' },
        { key: 'IN_LAB_PROCESSING', label: 'Lab Processing' },
        { key: 'REPORT_UPLOAD_PENDING', label: 'Report Upload Pending' },
        { key: 'COMPLETED', label: 'Completed' }
      ]
    : [
        { key: 'REQUESTED', label: 'Order Created' },
        { key: 'ASSIGNED', label: 'Visit Scheduled' },
        { key: 'SAMPLE_COLLECTED', label: 'Sample Collected' },
        { key: 'IN_LAB_PROCESSING', label: 'Lab Processing' },
        { key: 'REPORT_UPLOAD_PENDING', label: 'Report Upload' },
        { key: 'COMPLETED', label: 'Completed' }
      ];

  const getStageIndex = (st: string) => {
    if (st === 'REQUESTED') return 0;
    if (st === 'ASSIGNED') return 1;
    if (st === 'SAMPLE_COLLECTED') return 2;
    if (st === 'IN_LAB_PROCESSING') return 3;
    if (st === 'REPORT_UPLOAD_PENDING') return 4;
    if (st === 'REPORT_READY' || st === 'COMPLETED') return 5;
    return -1;
  };

  const currentStageIdx = getStageIndex(currentStatus);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <FlaskConical size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Lab Order Details
                </h2>
                {order && <StatusBadge status={order.status} />}
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Order #{order?.orderId || order?.id?.substring(0, 8).toUpperCase() || '...'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-medium">Loading real order data...</p>
            </div>
          ) : error || !order ? (
            <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-xl">
              <AlertCircle size={32} className="mx-auto text-rose-500 mb-2" />
              <h3 className="font-bold text-rose-900 text-lg">Unable to Load Order</h3>
              <p className="text-sm text-rose-700 mt-1">{error || 'Order record not found.'}</p>
              <button onClick={fetchOrder} className="mt-4 px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700">
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Alert Feedback Messages */}
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-start gap-2 animate-in fade-in">
                  <AlertCircle size={18} className="shrink-0 text-rose-600 mt-0.5" />
                  <div>{actionError}</div>
                </div>
              )}
              {actionSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-start gap-2 animate-in fade-in">
                  <CheckCircle2 size={18} className="shrink-0 text-emerald-600 mt-0.5" />
                  <div>{actionSuccess}</div>
                </div>
              )}

              {/* Order Lifecycle Progress Bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center justify-between">
                  <span>Order Lifecycle Progress</span>
                  {currentStatus === 'CANCELLED' && (
                    <span className="text-rose-600 font-bold normal-case flex items-center gap-1">
                      <XCircle size={14} /> Cancelled Order
                    </span>
                  )}
                </h3>

                {currentStatus === 'CANCELLED' ? (
                  <div className="p-4 bg-rose-100/60 border border-rose-200 rounded-xl text-sm text-rose-900">
                    <p className="font-semibold flex items-center gap-2">
                      <ShieldAlert size={16} className="text-rose-600" />
                      Order Cancelled
                    </p>
                    <p className="text-rose-700 mt-1 text-xs">
                      Reason: <span className="font-medium">{order.cancellationReason || 'No specific reason recorded.'}</span>
                    </p>
                    <p className="text-rose-600 mt-1 text-xs">
                      Cancelled At: {new Date(order.updatedAt).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {stages.map((stage, idx) => {
                      const isPast = currentStageIdx >= idx;
                      const isCurrent = currentStageIdx === idx;
                      return (
                        <div 
                          key={stage.key}
                          className={`flex flex-col items-center text-center p-2.5 rounded-lg border transition-all ${
                            isCurrent
                              ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-2xs font-semibold'
                              : isPast
                              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                              : 'bg-white border-slate-200 text-slate-400 opacity-70'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 ${
                            isCurrent
                              ? 'bg-blue-600 text-white ring-2 ring-blue-200'
                              : isPast
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-500'
                          }`}>
                            {isPast && !isCurrent ? <CheckCircle2 size={14} /> : idx + 1}
                          </div>
                          <span className="text-xs leading-tight">{stage.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Order Information & Status Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Details */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Order Overview Card */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                    <h3 className="font-bold text-slate-900 mb-3 text-sm flex items-center gap-2">
                      <FileText size={16} className="text-blue-600" />
                      Order Details
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Order ID</span>
                        <span className="font-mono font-semibold text-slate-800">{order.id}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Order Date</span>
                        <span className="font-medium text-slate-800">{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Order Time</span>
                        <span className="font-medium text-slate-800">{new Date(order.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Collection Method</span>
                        <span className="font-semibold text-slate-800">
                          {order.bookingType === 'HOME_COLLECTION' ? 'Home Sample Collection' : 'Lab Visit (Walk-in)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Total Amount</span>
                        <span className="font-bold text-emerald-700 text-sm">₹{order.totalAmount}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Home Collection Fee</span>
                        <span className="font-medium text-slate-800">₹{order.homeCollectionFee || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Patient Information Card */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                    <h3 className="font-bold text-slate-900 mb-3 text-sm flex items-center gap-2">
                      <User size={16} className="text-indigo-600" />
                      Patient Information
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Patient Name</span>
                        <span className="font-semibold text-slate-900">{order.patient?.name || 'Walk-in Patient'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Phone Number</span>
                        <span className="font-medium text-slate-800 flex items-center gap-1">
                          <Phone size={12} className="text-slate-400" />
                          {order.patient?.phone || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Email</span>
                        <span className="font-medium text-slate-800 truncate block">
                          {order.patient?.email || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Gender</span>
                        <span className="font-medium text-slate-800">{order.patient?.gender || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Date of Birth</span>
                        <span className="font-medium text-slate-800">{order.patient?.dob || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Patient Identifier</span>
                        <span className="font-mono text-slate-600">{order.patientId?.substring(0, 8)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Laboratory Information Card */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                    <h3 className="font-bold text-slate-900 mb-3 text-sm flex items-center gap-2">
                      <Building2 size={16} className="text-emerald-600" />
                      Laboratory Information
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 block mb-0.5">Laboratory Name</span>
                        <span className="font-semibold text-slate-900">{order.hospital?.name || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Facility Type</span>
                        <span className="font-medium text-slate-800">{order.hospital?.businessType || 'Diagnostic Lab'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">City / Location</span>
                        <span className="font-medium text-slate-800">{order.hospital?.city || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Contact Phone</span>
                        <span className="font-medium text-slate-800">{order.hospital?.contactPhone || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Address</span>
                        <span className="font-medium text-slate-800 truncate block">{order.hospital?.addressLine1 || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ordered Tests Card */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                    <h3 className="font-bold text-slate-900 mb-3 text-sm flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <FlaskConical size={16} className="text-purple-600" />
                        Ordered Tests ({order.items?.length || 0})
                      </span>
                      <span className="text-xs font-normal text-slate-500">Total: ₹{order.totalAmount}</span>
                    </h3>
                    <div className="space-y-2">
                      {order.items?.map((item: any, idx: number) => {
                        const testInfo = item.labTest?.platformTest;
                        return (
                          <div 
                            key={item.id || idx}
                            className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs"
                          >
                            <div>
                              <p className="font-bold text-slate-900">
                                {testInfo?.name || 'Diagnostic Test'}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-slate-500">
                                {testInfo?.specimenType && (
                                  <span>Specimen: <strong className="text-slate-700">{testInfo.specimenType}</strong></span>
                                )}
                                {testInfo?.code && (
                                  <span>Code: <strong className="text-slate-700">{testInfo.code}</strong></span>
                                )}
                                <span>TAT: <strong className="text-slate-700">{item.labTest?.tatHours || 24}h</strong></span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-slate-900 text-sm">₹{item.price}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sample Collection Details */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                    <h3 className="font-bold text-slate-900 mb-3 text-sm flex items-center gap-2">
                      <MapPin size={16} className="text-indigo-600" />
                      Sample Collection Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Method</span>
                        <span className="font-semibold text-slate-800">
                          {order.bookingType === 'HOME_COLLECTION' ? 'Home Collection' : 'Walk-in / Lab Visit'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Scheduled Slot</span>
                        <span className="font-medium text-slate-800">
                          {order.collectionDate ? new Date(order.collectionDate).toLocaleDateString() : '—'} {order.collectionTimeSlot ? `(${order.collectionTimeSlot})` : ''}
                        </span>
                      </div>
                      {order.bookingType === 'HOME_COLLECTION' && (
                        <div className="col-span-2">
                          <span className="text-slate-400 block mb-0.5">Collection Address</span>
                          <span className="font-medium text-slate-800">{order.collectionAddress || '—'}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-400 block mb-0.5">Phlebotomist / Collector</span>
                        <span className="font-medium text-slate-800">
                          {order.phlebotomistName ? `${order.phlebotomistName} (${order.phlebotomistPhone || 'No Phone'})` : 'Not Assigned'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Sample Collected At</span>
                        <span className="font-medium text-slate-800">
                          {order.sampleCollectedAt ? new Date(order.sampleCollectedAt).toLocaleString() : 'Not Yet Collected'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Col: Lifecycle Actions & Report */}
                <div className="space-y-6">
                  {/* Status Actions Box */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                    <h3 className="font-bold text-slate-900 mb-3 text-sm flex items-center justify-between">
                      <span>Available Actions</span>
                      {actionLoading && <RefreshCw size={14} className="animate-spin text-blue-600" />}
                    </h3>

                    {isTerminal ? (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                        {currentStatus === 'CANCELLED' ? (
                          <p className="text-rose-600 font-medium">This order was cancelled and cannot be changed.</p>
                        ) : (
                          <p className="text-emerald-700 font-medium flex items-center justify-center gap-1">
                            <CheckCircle2 size={16} /> Order has completed its full lifecycle.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {/* Pending -> Schedule or Collect */}
                        {currentStatus === 'REQUESTED' && (
                          <>
                            {order.bookingType === 'HOME_COLLECTION' ? (
                              <button
                                onClick={() => setShowScheduleForm(!showScheduleForm)}
                                disabled={actionLoading}
                                className="w-full text-left p-3 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100/70 transition-colors text-xs font-semibold text-blue-800 flex items-center justify-between cursor-pointer"
                              >
                                <span>1. Schedule & Assign Collector</span>
                                <ArrowRight size={14} />
                              </button>
                            ) : (
                              <div className="space-y-2">
                                <button
                                  onClick={() => handleStatusTransition('ASSIGNED')}
                                  disabled={actionLoading}
                                  className="w-full text-left p-3 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100/70 transition-colors text-xs font-semibold text-blue-800 flex items-center justify-between cursor-pointer"
                                >
                                  <span>1. Confirm / Schedule Lab Visit</span>
                                  <ArrowRight size={14} />
                                </button>
                                <button
                                  onClick={() => handleStatusTransition('SAMPLE_COLLECTED')}
                                  disabled={actionLoading}
                                  className="w-full text-left p-3 rounded-xl bg-purple-50 border border-purple-200 hover:bg-purple-100/70 transition-colors text-xs font-semibold text-purple-800 flex items-center justify-between cursor-pointer"
                                >
                                  <span>2. Mark Sample Collected Directly</span>
                                  <ArrowRight size={14} />
                                </button>
                              </div>
                            )}

                            {showScheduleForm && (
                              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs animate-in fade-in">
                                <div>
                                  <label className="text-slate-500 font-medium block mb-1">Phlebotomist Name *</label>
                                  <input 
                                    type="text" 
                                    value={phlebName} 
                                    onChange={(e) => setPhlebName(e.target.value)}
                                    placeholder="e.g. Ramesh Kumar"
                                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-slate-500 font-medium block mb-1">Phlebotomist Phone</label>
                                  <input 
                                    type="text" 
                                    value={phlebPhone} 
                                    onChange={(e) => setPhlebPhone(e.target.value)}
                                    placeholder="e.g. 9876543210"
                                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-slate-500 font-medium block mb-1 flex items-center gap-1">
                                      <Calendar size={11} /> Date
                                    </label>
                                    <input 
                                      type="date" 
                                      value={schedDate} 
                                      onChange={(e) => setSchedDate(e.target.value)}
                                      className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-slate-500 font-medium block mb-1 flex items-center gap-1">
                                      <Clock size={11} /> Slot
                                    </label>
                                    <input 
                                      type="text" 
                                      value={schedSlot} 
                                      onChange={(e) => setSchedSlot(e.target.value)}
                                      placeholder="09:00 AM - 10:00 AM"
                                      className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                                    />
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleStatusTransition('ASSIGNED', {
                                    phlebotomistName: phlebName,
                                    phlebotomistPhone: phlebPhone,
                                    collectionDate: schedDate || undefined,
                                    collectionTimeSlot: schedSlot || undefined
                                  })}
                                  disabled={actionLoading || !phlebName.trim()}
                                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs disabled:opacity-50 cursor-pointer"
                                >
                                  Confirm Assignment
                                </button>
                              </div>
                            )}
                          </>
                        )}

                        {/* Assigned -> Sample Collected */}
                        {currentStatus === 'ASSIGNED' && (
                          <button
                            onClick={() => handleStatusTransition('SAMPLE_COLLECTED')}
                            disabled={actionLoading}
                            className="w-full text-left p-3 rounded-xl bg-purple-50 border border-purple-200 hover:bg-purple-100/70 transition-colors text-xs font-semibold text-purple-800 flex items-center justify-between cursor-pointer"
                          >
                            <span>Mark Sample as Collected</span>
                            <ArrowRight size={14} />
                          </button>
                        )}

                        {/* Sample Collected -> In Lab Processing */}
                        {currentStatus === 'SAMPLE_COLLECTED' && (
                          <button
                            onClick={() => handleStatusTransition('IN_LAB_PROCESSING')}
                            disabled={actionLoading}
                            className="w-full text-left p-3 rounded-xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100/70 transition-colors text-xs font-semibold text-indigo-800 flex items-center justify-between cursor-pointer"
                          >
                            <span>Move to Lab Processing</span>
                            <ArrowRight size={14} />
                          </button>
                        )}

                        {/* In Lab Processing -> Report Upload Pending */}
                        {currentStatus === 'IN_LAB_PROCESSING' && (
                          <button
                            onClick={() => handleStatusTransition('REPORT_UPLOAD_PENDING')}
                            disabled={actionLoading}
                            className="w-full text-left p-3 rounded-xl bg-cyan-50 border border-cyan-200 hover:bg-cyan-100/70 transition-colors text-xs font-semibold text-cyan-800 flex items-center justify-between cursor-pointer"
                          >
                            <span>Mark Report Upload Pending</span>
                            <ArrowRight size={14} />
                          </button>
                        )}

                        {/* Cancel Order Action */}
                        <div className="pt-2 border-t border-slate-100">
                          <button
                            onClick={() => setShowCancelModal(true)}
                            disabled={actionLoading}
                            className="w-full text-left p-2.5 rounded-xl bg-rose-50/60 border border-rose-200 text-rose-700 hover:bg-rose-100/60 transition-colors text-xs font-semibold flex items-center justify-between cursor-pointer"
                          >
                            <span>Cancel Order</span>
                            <XCircle size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Report Section */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                    <h3 className="font-bold text-slate-900 mb-3 text-sm flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <FileText size={16} className="text-blue-600" />
                        Diagnostic Report
                      </span>
                      {order.reportUrl ? (
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Uploaded
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Pending
                        </span>
                      )}
                    </h3>

                    {order.reportUrl ? (
                      <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-xs text-emerald-900 font-semibold">
                          <FileCheck size={16} className="text-emerald-600" />
                          <span>Report Ready & Persisted</span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Document is accessible to the patient and laboratory staff.
                        </p>
                        <a 
                          href={order.reportUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors mt-1 cursor-pointer"
                        >
                          <Download size={12} />
                          View / Download Report
                        </a>
                      </div>
                    ) : currentStatus === 'CANCELLED' ? (
                      <p className="text-xs text-slate-400 italic">No report required for cancelled orders.</p>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-slate-500">
                          Upload test results (PDF, JPG, PNG). Completes the order workflow.
                        </p>
                        <input 
                          type="file"
                          accept=".pdf,image/jpeg,image/png"
                          onChange={handleFileSelect}
                          disabled={uploadingReport || isTerminal}
                          className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors cursor-pointer"
                        />
                        {selectedFile && (
                          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between">
                            <span className="truncate font-medium text-slate-700 max-w-[160px]">{selectedFile.name}</span>
                            <button
                              onClick={handleUploadReport}
                              disabled={uploadingReport}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs shrink-0 flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                            >
                              <Upload size={12} />
                              {uploadingReport ? 'Uploading...' : 'Confirm Upload'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 flex items-center justify-between bg-slate-50 text-xs">
          <span className="text-slate-500">
            MediQuee Lab Order Lifecycle Management
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 font-semibold text-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Cancellation Confirmation Sub-Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-rose-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2 bg-rose-50 rounded-xl"><AlertCircle size={24} /></div>
              <h3 className="font-bold text-lg text-slate-900">Confirm Order Cancellation</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Are you sure you want to cancel order <strong>#{order?.orderId}</strong>? This will permanently cancel the order and cannot be undone.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">Cancellation Reason *</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter the reason for cancelling this order (e.g. Patient requested, Phlebotomist unavailable, Patient no-show)..."
                rows={3}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-medium text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={actionLoading || !cancelReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default LabOrderDetailsModal;
