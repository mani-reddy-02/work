import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Building2, 
  FlaskConical, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  UploadCloud, 
  FileText, 
  FileCheck2, 
  Trash2, 
  ExternalLink, 
  Download, 
  ShieldCheck, 
  Receipt,
  User,
  Hash,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';
import { settlementService, ManualPayoutPayload } from '../services/settlementService';
import StatusBadge from '../components/ui/StatusBadge';
import { formatCurrency } from '../utils/finance';

const SettlementDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, adminUser } = useAdminAuth();

  const [settlement, setSettlement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Attachment upload modal / form state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDocType, setUploadDocType] = useState('SETTLEMENT_STATEMENT');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Payout Modal state
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutStep, setPayoutStep] = useState<'form' | 'confirm'>('form');
  const [transferRef, setTransferRef] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [exceptionReason, setExceptionReason] = useState('');
  const [useException, setUseException] = useState(false);
  const [proofFile, setProofFile] = useState<{ fileName: string; fileData: string } | null>(null);
  const [selectedProofAttachmentId, setSelectedProofAttachmentId] = useState<string>('');
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState<string | null>(null);

  const fetchSettlement = useCallback(async () => {
    if (!id || !token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await settlementService.getSettlementById(id, token);
      if (res.success && res.data) {
        setSettlement(res.data);
      } else {
        setError(res.message || 'Settlement record not found');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to load settlement details');
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchSettlement();
  }, [fetchSettlement]);

  // Handle Attachment Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settlement || !token) return;

    // Validate size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      setUploadError('File size exceeds the 20MB limit.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const fileData = reader.result as string;
        const res = await settlementService.uploadAttachment(
          settlement.id,
          {
            fileName: file.name,
            documentType: uploadDocType,
            fileData
          },
          token
        );

        if (res.success) {
          await fetchSettlement();
          if (fileInputRef.current) fileInputRef.current.value = '';
        } else {
          setUploadError(res.message || 'Upload failed');
        }
        setIsUploading(false);
      };
      reader.onerror = () => {
        setUploadError('Failed to read selected file');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to upload attachment');
      setIsUploading(false);
    }
  };

  // Handle Attachment Delete
  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!token || !settlement) return;
    if (!window.confirm('Are you sure you want to delete this attachment?')) return;

    try {
      const res = await settlementService.deleteAttachment(settlement.id, attachmentId, token);
      if (res.success) {
        await fetchSettlement();
      } else {
        alert(res.message || 'Failed to delete attachment');
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to delete attachment');
    }
  };

  // Handle Payout Proof file selection inside payout dialog
  const handlePayoutProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setPayoutError('Payment proof exceeds 20MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProofFile({
        fileName: file.name,
        fileData: reader.result as string
      });
      setPayoutError(null);
    };
    reader.readAsDataURL(file);
  };

  // Submit Manual Payout
  const handleSubmitPayout = async () => {
    if (!settlement || !token || isSubmittingPayout) return;

    setPayoutError(null);
    setIsSubmittingPayout(true);

    try {
      const payload: ManualPayoutPayload = {
        transferReference: useException ? undefined : transferRef.trim(),
        exceptionReason: useException ? exceptionReason.trim() : undefined,
        paymentDate: new Date(paymentDate).toISOString(),
        paymentMethod,
        amount: settlement.breakdown.payableAmount,
        notes: payoutNotes.trim() || undefined,
        proofAttachmentId: selectedProofAttachmentId || undefined,
        proofFile: proofFile ? {
          fileName: proofFile.fileName,
          fileData: proofFile.fileData,
          documentType: 'BANK_TRANSFER_RECEIPT'
        } : undefined
      };

      const res = await settlementService.processManualPayout(settlement.id, payload, token);

      if (res.success) {
        setPayoutSuccessMsg('Payout recorded successfully! Partner has been notified.');
        setIsPayoutModalOpen(false);
        setPayoutStep('form');
        await fetchSettlement();
        setTimeout(() => setPayoutSuccessMsg(null), 6000);
      } else {
        setPayoutError(res.message || 'Failed to record payout');
      }
    } catch (err: any) {
      setPayoutError(err?.message || 'Error occurred while processing payout');
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading settlement details...</p>
        </div>
      </div>
    );
  }

  if (error || !settlement) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
          <AlertCircle size={28} className="mx-auto mb-2 text-red-600" />
          <p className="font-semibold">{error || 'Settlement not found'}</p>
        </div>
        <button 
          onClick={() => navigate('/admin/settlements')}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800"
        >
          Return to Settlements
        </button>
      </div>
    );
  }

  const isLab = settlement.partnerType === 'Lab' || settlement.rawPartnerType === 'LABORATORY';
  const isPaid = settlement.status === 'PAID';
  const breakdown = settlement.breakdown || {};
  const transactions = settlement.transactions || [];
  const attachments = settlement.attachments || [];
  const partner = settlement.partner || {};
  const payoutHistory = settlement.payoutHistory || [];

  return (
    <div className="space-y-6 pb-20">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/admin/settlements')}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            title="Back to Settlements"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {settlement.partnerName || partner.name || 'Healthcare Partner'}
              </h1>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                {settlement.settlementNumber || settlement.id}
              </span>
              <StatusBadge status={settlement.status} />
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isLab ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {isLab ? <FlaskConical size={12} /> : <Building2 size={12} />}
                {isLab ? 'Diagnostic Lab' : 'Hospital'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Period: <span className="font-medium text-slate-700">{settlement.periodLabel || settlement.period}</span> • Generated {new Date(settlement.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-3">
          {!isPaid ? (
            <button
              onClick={() => {
                setPayoutError(null);
                setPayoutStep('form');
                setIsPayoutModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
            >
              <CheckCircle2 size={17} />
              Mark Payout Completed
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
              <ShieldCheck size={16} className="text-emerald-600" />
              Settlement Paid & Reconciled
            </div>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      {payoutSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-sm flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{payoutSuccessMsg}</span>
          </div>
          <button onClick={() => setPayoutSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800 text-xs font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Overview Cards & Partner Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Summary & Revenue Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* A. SETTLEMENT SUMMARY CARD */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Receipt size={18} className="text-blue-600" />
              Settlement Summary
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Settlement Period</p>
                <p className="text-xs font-bold text-slate-800 mt-1">{settlement.periodLabel}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Included Transactions</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{settlement.transactionCount} bookings</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Due Date</p>
                <p className="text-xs font-semibold text-slate-700 mt-1">
                  {settlement.dueDate ? new Date(settlement.dueDate).toLocaleDateString() : 'Weekly Cycle'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Settlement Status</p>
                <div className="mt-1">
                  <StatusBadge status={settlement.status} />
                </div>
              </div>
            </div>

            {/* If paid, display payout execution audit box */}
            {isPaid && (
              <div className="mt-4 p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    Payment Record Details
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">
                    Paid on {settlement.paymentDate ? new Date(settlement.paymentDate).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-700">
                  <div>
                    <span className="text-slate-500">Transfer Reference (UTR): </span>
                    <span className="font-mono font-semibold text-slate-900">{settlement.paymentReference || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Method: </span>
                    <span className="font-medium text-slate-900">{settlement.paymentMethod || 'BANK_TRANSFER'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Recorded By: </span>
                    <span className="font-medium text-slate-900">{settlement.processedBy || 'Admin'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* B. REVENUE BREAKDOWN & CALCULATION FLOW */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <DollarSign size={18} className="text-emerald-600" />
              Authoritative Revenue Breakdown & Commission Split
            </h3>

            {/* Calculation flow strip */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center">
                <div className="p-2">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Gross Revenue</span>
                  <p className="text-sm font-bold text-slate-900 mt-1">{formatCurrency(breakdown.grossRevenue)}</p>
                </div>

                <div className="p-2 flex flex-col justify-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Commission Basis</span>
                  <p className="text-xs font-semibold text-slate-700 mt-1">{formatCurrency(breakdown.commissionBasis)}</p>
                </div>

                <div className="p-2 flex flex-col justify-center">
                  <span className="text-[10px] text-blue-500 uppercase font-semibold">Admin Cut ({breakdown.adminCommissionRate}%)</span>
                  <p className="text-xs font-semibold text-blue-600 mt-1">-{formatCurrency(breakdown.adminCommission)}</p>
                </div>

                <div className="p-2 flex flex-col justify-center">
                  <span className="text-[10px] text-purple-500 uppercase font-semibold">Partner Share ({breakdown.partnerShareRate}%)</span>
                  <p className="text-xs font-semibold text-purple-700 mt-1">{formatCurrency(breakdown.partnerShare)}</p>
                </div>

                <div className="p-2 flex flex-col justify-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Adjustments</span>
                  <p className="text-xs font-semibold text-slate-500 mt-1">-{formatCurrency(breakdown.adjustments + breakdown.refunds)}</p>
                </div>

                <div className="p-2 bg-emerald-100/70 border border-emerald-300 rounded-lg flex flex-col justify-center">
                  <span className="text-[10px] text-emerald-800 uppercase font-bold">Final Payable</span>
                  <p className="text-sm font-extrabold text-emerald-900 mt-0.5">{formatCurrency(breakdown.payableAmount)}</p>
                </div>
              </div>
            </div>

            {/* Detailed Split Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Gross Transaction Amount:</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(breakdown.grossRevenue)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Eligible Commission Basis:</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(breakdown.commissionBasis)}</span>
                </div>
                <div className="flex justify-between text-xs text-blue-600">
                  <span>MediQuee Admin Commission ({breakdown.adminCommissionRate}%):</span>
                  <span className="font-bold">-{formatCurrency(breakdown.adminCommission)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-slate-200">
                  <span>Refunds & Adjustments:</span>
                  <span className="font-semibold">-{formatCurrency(breakdown.adjustments + breakdown.refunds)}</span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between text-xs text-emerald-800">
                    <span>Partner Share Base ({breakdown.partnerShareRate}%):</span>
                    <span className="font-semibold">{formatCurrency(breakdown.partnerShare)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-emerald-700 mt-1">
                    <span>Previously Paid Amount:</span>
                    <span className="font-semibold">{formatCurrency(breakdown.paidAmount)}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-emerald-200">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold text-emerald-900 uppercase">
                      {isPaid ? "Total Paid to Partner" : "Outstanding Payable Amount"}
                    </span>
                    <span className="text-2xl font-black text-emerald-900">
                      {formatCurrency(isPaid ? breakdown.paidAmount : breakdown.outstandingAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Partner Organization & Manual Transfer Guidelines */}
        <div className="space-y-6">
          {/* Partner Facility Details */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Partner Organization</h3>
              <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                {isLab ? <FlaskConical size={18} /> : <Building2 size={18} />}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-base font-bold text-slate-900">{settlement.partnerName}</p>
                <p className="text-xs text-slate-500">ID: {settlement.partnerId}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs space-y-1.5 text-slate-600">
                <p><span className="text-slate-400">Phone:</span> {partner.contactPhone || 'N/A'}</p>
                <p><span className="text-slate-400">Email:</span> {partner.contactEmail || 'N/A'}</p>
                <p><span className="text-slate-400">City:</span> {partner.city || 'N/A'}, {partner.state || ''}</p>
                {partner.addressLine1 && <p><span className="text-slate-400">Address:</span> {partner.addressLine1}</p>}
                <p><span className="text-slate-400">Agreed Share:</span> <span className="font-semibold text-slate-800">{partner.hospitalShare ?? 80}%</span></p>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={() => navigate(`/admin/hospitals/${settlement.partnerId}`)}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-blue-600 text-xs font-semibold rounded-lg border border-slate-200 transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  View Facility Profile
                  <ExternalLink size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* Workflow Guidance Card */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200 rounded-xl p-5 text-xs text-slate-600 space-y-2.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Info size={16} className="text-blue-600" />
              <span>Manual Payout Instructions</span>
            </div>
            <p>
              1. Transfer <strong className="text-slate-900 font-semibold">{formatCurrency(breakdown.payableAmount)}</strong> via your external corporate banking portal or UPI.
            </p>
            <p>
              2. Download or export the bank confirmation receipt or UTR screenshot.
            </p>
            <p>
              3. Click <strong>Mark Payout Completed</strong>, enter the real UTR/Reference, attach proof, and submit.
            </p>
            <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/80">
              * The partner will immediately receive an in-app notification with payment details.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 3: ATTACHMENT MANAGEMENT */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud size={18} className="text-blue-600" />
              Settlement Documents & Payment Proofs ({attachments.length})
            </h3>
            <p className="text-xs text-slate-500">
              Attach bank transfer receipts, UPI screenshots, settlement statements, or payment confirmation documents.
            </p>
          </div>

          {/* Upload Button & Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={uploadDocType}
              onChange={(e) => setUploadDocType(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
            >
              <option value="BANK_TRANSFER_RECEIPT">Bank Transfer Receipt</option>
              <option value="UPI_RECEIPT">UPI Screenshot</option>
              <option value="SETTLEMENT_STATEMENT">Settlement Statement</option>
              <option value="PAYMENT_CONFIRMATION">Payment Confirmation</option>
              <option value="OTHER">Other Supporting Document</option>
            </select>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.csv"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <UploadCloud size={14} className={isUploading ? "animate-spin" : ""} />
              {isUploading ? "Uploading..." : "Upload Document"}
            </button>
          </div>
        </div>

        {uploadError && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
            {uploadError}
          </div>
        )}

        {attachments.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
            <FileText size={28} className="mx-auto mb-2 opacity-50" />
            No documents uploaded yet. Upload transfer proofs or statements using the button above.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {attachments.map((att: any) => (
              <div 
                key={att.id}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 bg-white rounded-lg border border-slate-200 text-blue-600">
                      <FileCheck2 size={18} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold text-slate-800 truncate" title={att.fileName}>
                        {att.fileName}
                      </p>
                      <span className="inline-block text-[10px] font-medium text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded mt-1">
                        {att.documentType.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {!isPaid && (
                    <button
                      onClick={() => handleDeleteAttachment(att.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                      title="Delete attachment"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{new Date(att.uploadedAt).toLocaleDateString()}</span>
                  <a
                    href={att.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
                  >
                    View / Download
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* C. INCLUDED TRANSACTIONS TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Included Transactions ({transactions.length})
            </h3>
            <p className="text-xs text-slate-500">
              Authoritative list of individual bookings settled in this weekly batch.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3">Txn / Booking ID</th>
                <th className="px-4 py-3">Service Type</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Payment Date</th>
                <th className="px-4 py-3 text-right">Gross Amount</th>
                <th className="px-4 py-3 text-right">Admin Comm.</th>
                <th className="px-4 py-3 text-right">Partner Share</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((t: any, idx: number) => (
                <tr key={t.id || idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-blue-600">
                    {t.bookingId}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {t.serviceType}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {t.patientName}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {t.paymentDate ? new Date(t.paymentDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">
                    {formatCurrency(t.grossAmount)}
                  </td>
                  <td className="px-4 py-3 text-right text-blue-600 font-medium">
                    {formatCurrency(t.adminCommission)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-700">
                    {formatCurrency(t.partnerShare)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {t.status || 'COMPLETED'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: MANUAL PAYOUT RECORDING WORKFLOW */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck size={20} className="text-emerald-600" />
                  Confirm Manual Payout
                </h3>
                <p className="text-xs text-slate-500">
                  Record an external bank transfer or UPI payout in MediQuee
                </p>
              </div>
              <button 
                onClick={() => setIsPayoutModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* Alert: No pretend automatic money movement */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-start gap-2.5">
                <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">External Transfer Required</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed">
                    Clicking Confirm does not execute an automated bank debit. Perform the transfer outside the app via corporate banking / UPI, then enter the confirmed UTR/Reference below.
                  </p>
                </div>
              </div>

              {payoutError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span className="font-medium">{payoutError}</span>
                </div>
              )}

              {/* Settlement Summary Card */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Partner Organization:</span>
                  <span className="font-bold text-slate-900">{settlement.partnerName} ({settlement.partnerType})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Settlement ID:</span>
                  <span className="font-mono font-semibold text-slate-800">{settlement.settlementNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Settlement Period:</span>
                  <span className="font-medium text-slate-700">{settlement.periodLabel}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm">
                  <span className="font-bold text-slate-900">Total Payable Amount:</span>
                  <span className="font-black text-emerald-700 text-base">{formatCurrency(breakdown.payableAmount)}</span>
                </div>
              </div>

              {payoutStep === 'form' ? (
                <div className="space-y-3.5">
                  {/* Transfer Reference / UTR */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Bank Transfer Reference / UTR / Transaction ID <span className="text-red-500">*</span>
                    </label>
                    {!useException ? (
                      <input
                        type="text"
                        placeholder="e.g. UTR291847192847 or UPI Ref ID"
                        value={transferRef}
                        onChange={(e) => setTransferRef(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <input
                        type="text"
                        placeholder="State recorded reason for reference exemption"
                        value={exceptionReason}
                        onChange={(e) => setExceptionReason(e.target.value)}
                        className="w-full p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-xs"
                      />
                    )}
                    <div className="mt-1 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setUseException(!useException)}
                        className="text-[11px] text-blue-600 hover:underline"
                      >
                        {useException ? "Enter standard UTR reference" : "Reference unavailable? Use controlled exception"}
                      </button>
                    </div>
                  </div>

                  {/* Payment Date & Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Actual Payment Date & Time</label>
                      <input
                        type="datetime-local"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="BANK_TRANSFER">Direct Bank Transfer (NEFT/RTGS)</option>
                        <option value="UPI">Corporate UPI Transfer</option>
                        <option value="IMPS">Instant IMPS</option>
                        <option value="CHEQUE">Corporate Cheque</option>
                        <option value="OTHER">Other Manual Method</option>
                      </select>
                    </div>
                  </div>

                  {/* Payment Proof Attachment */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Payment Proof / Bank Transfer Receipt
                    </label>
                    {attachments.length > 0 && (
                      <div className="mb-2">
                        <select
                          value={selectedProofAttachmentId}
                          onChange={(e) => setSelectedProofAttachmentId(e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs mb-1.5"
                        >
                          <option value="">-- Or select an already uploaded attachment --</option>
                          {attachments.map((att: any) => (
                            <option key={att.id} value={att.id}>
                              {att.fileName} ({att.documentType})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <input
                      type="file"
                      onChange={handlePayoutProofChange}
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {proofFile && (
                      <p className="mt-1 text-[11px] text-emerald-600 font-medium">
                        ✓ Selected: {proofFile.fileName}
                      </p>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Internal Audit Notes</label>
                    <textarea
                      rows={2}
                      placeholder="Optional notes or transfer remarks..."
                      value={payoutNotes}
                      onChange={(e) => setPayoutNotes(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              ) : (
                /* Step 2: Confirmation Screen */
                <div className="space-y-4 py-2">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-2">
                    <p className="font-bold text-emerald-900 text-sm">Please Verify Payout Summary:</p>
                    <div className="grid grid-cols-2 gap-2 text-slate-700">
                      <div><span className="text-slate-400">Partner:</span> {settlement.partnerName}</div>
                      <div><span className="text-slate-400">Payable Amount:</span> <strong className="text-emerald-800">{formatCurrency(breakdown.payableAmount)}</strong></div>
                      <div><span className="text-slate-400">Reference:</span> <span className="font-mono font-semibold">{useException ? exceptionReason : transferRef}</span></div>
                      <div><span className="text-slate-400">Date/Time:</span> {new Date(paymentDate).toLocaleString()}</div>
                      <div><span className="text-slate-400">Method:</span> {paymentMethod}</div>
                      <div><span className="text-slate-400">Attached Proof:</span> {proofFile?.fileName || (selectedProofAttachmentId ? "Existing Attachment" : "None")}</div>
                    </div>
                  </div>

                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    By confirming, you verify that the transfer of {formatCurrency(breakdown.payableAmount)} was successfully completed externally. This settlement will be permanently locked as PAID and recorded in the payout audit history.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  if (payoutStep === 'confirm') {
                    setPayoutStep('form');
                  } else {
                    setIsPayoutModalOpen(false);
                  }
                }}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100"
              >
                {payoutStep === 'confirm' ? "Back to Edit" : "Cancel"}
              </button>

              {payoutStep === 'form' ? (
                <button
                  type="button"
                  disabled={!useException && !transferRef.trim()}
                  onClick={() => setPayoutStep('confirm')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  Review Confirmation &rarr;
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmittingPayout}
                  onClick={handleSubmitPayout}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {isSubmittingPayout ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Persisting Payout...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      Confirm Payout Completed
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettlementDetails;
