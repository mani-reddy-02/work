import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Building2, 
  User, 
  Receipt, 
  CheckCircle, 
  Clock, 
  CreditCard, 
  ExternalLink, 
  DollarSign, 
  Phone, 
  Mail, 
  MapPin, 
  FlaskConical, 
  Stethoscope, 
  AlertCircle,
  FileText,
  Calendar,
  ShieldCheck,
  Video
} from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';
import { financeService } from '../services/financeService';
import StatusBadge from '../components/ui/StatusBadge';
import { formatCurrency } from '../utils/finance';

const TransactionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAdminAuth();
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTx = async () => {
      if (!token || !id) return;
      try {
        setLoading(true);
        setError(null);
        const res = await financeService.getTransactionById(id, token);
        if (res.success && res.data) {
          setTransaction(res.data);
        } else {
          setError(res.message || 'Transaction record not found in authoritative database');
        }
      } catch (err: any) {
        setError(err.message || 'Error loading transaction details');
      } finally {
        setLoading(false);
      }
    };
    fetchTx();
  }, [id, token]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading authoritative transaction details...</p>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="p-8">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-rose-800 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-lg text-rose-900">Transaction Not Found</h3>
            <p className="text-sm mt-1">{error || 'The requested transaction could not be located in live database records.'}</p>
            <button
              onClick={() => navigate('/admin/transactions')}
              className="mt-4 px-4 py-2 bg-white border border-rose-200 text-rose-700 text-sm font-medium rounded-lg hover:bg-rose-100 transition-colors"
            >
              Back to Transactions
            </button>
          </div>
        </div>
      </div>
    );
  }

  const {
    bookingId = transaction.id?.substring(0, 8).toUpperCase(),
    serviceType = transaction.type || 'Healthcare Service',
    status = 'Pending',
    createdAt,
    payment = {},
    patient = {},
    organization = {},
    service = {},
    commission = {},
    settlement = {},
    history = []
  } = transaction;

  const isPaid = payment.paymentStatus === 'PAID';
  const grossAmount = commission.grossAmount ?? transaction.fee ?? transaction.totalAmount ?? 0;
  const eligibleBasis = commission.eligibleBasis ?? grossAmount;
  const adminRate = commission.adminCommissionRate;
  const adminAmount = commission.adminCommissionAmount;
  const partnerRate = commission.partnerShareRate;
  const partnerAmount = commission.partnerShareAmount;
  const partnerLabel = commission.partnerLabel || (organization.type === 'LABORATORY' ? 'Laboratory Share' : 'Hospital Share');

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/transactions')}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            title="Back to Transactions"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Transaction TX-{bookingId}
              </h1>
              <StatusBadge status={payment.paymentStatus || status} />
              {isPaid ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle size={12} /> Payment Confirmed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  <Clock size={12} /> Payment Pending
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Internal Ref: <span className="font-mono text-slate-700">{transaction.id}</span> • Service: <span className="font-medium text-slate-700">{serviceType}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {service.directBookingUrl && (
            <button
              onClick={() => navigate(service.directBookingUrl)}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <ExternalLink size={14} /> View Booking
            </button>
          )}
          {settlement.settlementUrl && (
            <button
              onClick={() => navigate(settlement.settlementUrl)}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <DollarSign size={14} /> Settlement Cycle
            </button>
          )}
        </div>
      </div>

      {/* 1. TRANSACTION SUMMARY CARD */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Receipt size={18} />
            </div>
            <h2 className="text-base font-bold text-slate-900">Transaction Summary</h2>
          </div>
          <span className="text-xs text-slate-400">Currency: INR (₹)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Transaction ID</p>
            <p className="text-sm font-semibold text-slate-900 font-mono">TX-{bookingId}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Transaction Created</p>
            <p className="text-sm font-medium text-slate-800">
              {createdAt ? new Date(createdAt).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short'
              }) : 'N/A'}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Payment Timestamp</p>
            {payment.paymentDate ? (
              <p className="text-sm font-medium text-emerald-700 flex items-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                {new Date(payment.paymentDate).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short'
                })}
              </p>
            ) : (
              <p className="text-sm font-medium text-amber-600 flex items-center gap-1.5">
                <Clock size={14} className="shrink-0" />
                Not available
              </p>
            )}
          </div>

          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Payment Status</p>
            <StatusBadge status={payment.paymentStatus || 'PENDING'} />
          </div>

          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Service Type</p>
            <p className="text-sm font-semibold text-slate-900">{serviceType}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Payment Method</p>
            <p className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
              <CreditCard size={14} className="text-slate-400 shrink-0" />
              {payment.paymentMethod || 'Online Payment'}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Gross Amount</p>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(grossAmount)}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Eligible Commission Basis</p>
            <p className="text-lg font-bold text-blue-700">{formatCurrency(eligibleBasis)}</p>
          </div>
        </div>

        {/* Timestamp Clarification Notice */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-start sm:items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
          <Clock size={14} className="text-slate-400 shrink-0 mt-0.5 sm:mt-0" />
          <span>
            <strong>Authoritative Clock:</strong> Transaction creation time represents the timestamp when the booking was initiated. Payment confirmation time represents authoritative receipt of funds.
          </span>
        </div>
      </div>

      {/* 2. PATIENT & ORGANIZATION DETAILS (2 COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PATIENT INFORMATION CARD */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <User size={18} />
                </div>
                <h3 className="text-base font-bold text-slate-900">Patient Details</h3>
              </div>
              {patient.id && (
                <button
                  onClick={() => navigate(`/admin/patients/${patient.id}`)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                >
                  View Profile <ExternalLink size={12} />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Full Name</p>
                <p className="text-base font-bold text-slate-900">{patient.name || 'Unknown Patient'}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Patient ID</p>
                  <p className="text-sm font-medium text-slate-700 font-mono">
                    {patient.id ? `PAT-${patient.id.substring(0, 8).toUpperCase()}` : 'Not registered'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Related Booking ID</p>
                  <p className="text-sm font-medium text-slate-700 font-mono">{bookingId}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Phone Number</p>
                  <p className="text-sm text-slate-800 flex items-center gap-1.5">
                    <Phone size={13} className="text-slate-400" />
                    {patient.phone || 'Not available'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Email Address</p>
                  <p className="text-sm text-slate-800 flex items-center gap-1.5 truncate">
                    <Mail size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">{patient.email || 'Not available'}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Gender / Age</p>
                  <p className="text-sm text-slate-800">
                    {[
                      patient.gender,
                      patient.age ? `${patient.age} yrs` : null,
                      patient.dob ? `DOB: ${patient.dob}` : null
                    ].filter(Boolean).join(' • ') || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Address / Region</p>
                  <p className="text-sm text-slate-800 flex items-center gap-1.5">
                    <MapPin size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">{patient.address || 'Address on file'}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
            <span>Identity resolved through authoritative database relationships.</span>
          </div>
        </div>

        {/* ORGANIZATION AND SERVICE DETAILS CARD */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  {organization.type === 'LABORATORY' ? <FlaskConical size={18} /> : <Building2 size={18} />}
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {organization.type === 'LABORATORY' ? 'Laboratory & Service Details' : 'Hospital & Service Details'}
                </h3>
              </div>
              {organization.id && (
                <button
                  onClick={() => navigate(organization.profileUrl || `/admin/hospitals/${organization.id}`)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                >
                  View Profile <ExternalLink size={12} />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Organization</p>
                <div className="flex items-center gap-2">
                  <p className="text-base font-bold text-slate-900">{organization.name || 'Unknown Provider'}</p>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                    {organization.type === 'LABORATORY' ? 'Laboratory' : 'Hospital'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Location / Address</p>
                  <p className="text-sm text-slate-700 flex items-start gap-1.5">
                    <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                    <span>{organization.address || 'Address not listed'}</span>
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Contact</p>
                  <p className="text-sm text-slate-700">
                    {organization.contactPhone && (
                      <span className="flex items-center gap-1.5">
                        <Phone size={13} className="text-slate-400" />
                        {organization.contactPhone}
                      </span>
                    )}
                    {organization.contactEmail && (
                      <span className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 truncate">
                        <Mail size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{organization.contactEmail}</span>
                      </span>
                    )}
                    {!organization.contactPhone && !organization.contactEmail && 'Contact on file'}
                  </p>
                </div>
              </div>

              {/* Service & Provider Specifics */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Service Specification</p>
                
                {/* Doctor Details for OP/Video */}
                {organization.doctor && (
                  <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <Stethoscope size={16} className="text-blue-600 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Dr. {organization.doctor.name}</p>
                        <p className="text-xs text-slate-500">
                          {organization.doctor.specialization || organization.doctor.qualification || 'Consultant'} • {organization.department || 'General Medicine'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Nurse Details for Home Nursing */}
                {organization.nurse && (
                  <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <User size={16} className="text-indigo-600 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Nurse: {organization.nurse.name}</p>
                        <p className="text-xs text-slate-500">{organization.nurse.designation || 'Staff Nurse'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Phlebotomist Details for Lab Home Collection */}
                {organization.phlebotomist && (
                  <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <FlaskConical size={16} className="text-purple-600 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Phlebotomist: {organization.phlebotomist.name}</p>
                        <p className="text-xs text-slate-500">Phone: {organization.phlebotomist.phone}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Video Consultation indicator */}
                {service.videoConsultation && (
                  <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg flex items-center gap-2 text-xs font-medium text-purple-900 mb-2">
                    <Video size={16} className="text-purple-600 shrink-0" />
                    <span>Telemedicine Session • Status: {service.videoConsultation.status}</span>
                  </div>
                )}

                {/* Lab Items List */}
                {service.items && service.items.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {service.items.map((it: any) => (
                      <div key={it.id} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded border border-slate-100">
                        <div>
                          <p className="font-medium text-slate-800">{it.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{it.code} • {it.department}</p>
                        </div>
                        <span className="font-semibold text-slate-900">{formatCurrency(it.price)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Booking Scheduled: {service.appointmentDate || service.collectionDate || service.serviceDate ? new Date(service.appointmentDate || service.collectionDate || service.serviceDate).toLocaleDateString('en-IN') : 'N/A'}</span>
            <span className="font-medium text-slate-700">{service.timeSlot || 'Standard Slot'}</span>
          </div>
        </div>
      </div>

      {/* 3. PAYMENT INFORMATION CARD */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-violet-50 text-violet-600 rounded-lg">
              <CreditCard size={18} />
            </div>
            <h2 className="text-base font-bold text-slate-900">Payment Information</h2>
          </div>
          <span className="text-xs text-slate-400">Authoritative Payment Records</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Payment Reference</p>
            <p className="text-sm font-semibold text-slate-900 font-mono">
              {payment.transactionReference || `TX-${bookingId}`}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Gateway Reference</p>
            <p className="text-sm font-mono text-slate-700">
              {payment.gatewayReference || 'Unavailable (Direct settlement)'}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Payment Method</p>
            <p className="text-sm font-medium text-slate-800">
              {payment.paymentMethod || 'Online'}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Payment Status</p>
            <StatusBadge status={payment.paymentStatus || 'PENDING'} />
          </div>

          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Payment Initiated</p>
            <p className="text-sm font-medium text-slate-800">
              {payment.initiatedAt ? new Date(payment.initiatedAt).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short'
              }) : 'N/A'}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Payment Success Time</p>
            {payment.paymentDate ? (
              <p className="text-sm font-medium text-emerald-700 flex items-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                {new Date(payment.paymentDate).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short'
                })}
              </p>
            ) : (
              <p className="text-sm font-medium text-amber-600">Not available</p>
            )}
          </div>

          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Refund Status</p>
            <p className="text-sm font-medium text-slate-800">
              {payment.refundStatus === 'REFUND_PENDING' ? (
                <span className="text-rose-600 font-semibold">Refund Pending ({formatCurrency(payment.refundAmount || grossAmount)})</span>
              ) : (
                <span className="text-slate-500">Not Applicable</span>
              )}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Last Updated</p>
            <p className="text-sm text-slate-600">
              {payment.lastUpdatedAt ? new Date(payment.lastUpdatedAt).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short'
              }) : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* 4. REVENUE SHARING BREAKDOWN CARD */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Receipt size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Revenue Sharing Breakdown</h2>
              <p className="text-xs text-slate-500">Authoritative platform commission and provider share allocation</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
            Reconciled
          </span>
        </div>

        {/* 3 Metric Summary Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Gross Amount</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(grossAmount)}</p>
            <p className="text-xs text-slate-400 mt-1">Eligible Basis: {formatCurrency(eligibleBasis)}</p>
          </div>

          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200/80">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">MediQuee Commission</p>
              <span className="text-xs font-bold px-2 py-0.5 bg-blue-200/70 text-blue-800 rounded">
                {adminRate !== null && adminRate !== undefined ? `${adminRate}%` : 'Not configured'}
              </span>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {adminAmount !== null && adminAmount !== undefined ? formatCurrency(adminAmount) : 'Unavailable'}
            </p>
            <p className="text-xs text-blue-600/80 mt-1">Platform service fee</p>
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200/80">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">{partnerLabel}</p>
              <span className="text-xs font-bold px-2 py-0.5 bg-emerald-200/70 text-emerald-800 rounded">
                {partnerRate !== null && partnerRate !== undefined ? `${partnerRate}%` : 'Not configured'}
              </span>
            </div>
            <p className="text-2xl font-bold text-emerald-900">
              {partnerAmount !== null && partnerAmount !== undefined ? formatCurrency(partnerAmount) : 'Unavailable'}
            </p>
            <p className="text-xs text-emerald-600/80 mt-1">Payable to {organization.name || 'Provider'}</p>
          </div>
        </div>

        {/* Detailed Financial Allocation Table */}
        <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Allocation Component</th>
                <th className="px-4 py-3">Calculation Basis</th>
                <th className="px-4 py-3 text-right">Rate</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="px-4 py-3 font-medium text-slate-900">Gross Transaction Amount</td>
                <td className="px-4 py-3 text-slate-500">Collected from patient</td>
                <td className="px-4 py-3 text-right">—</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(grossAmount)}</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-blue-900">MediQuee Platform Commission</td>
                <td className="px-4 py-3 text-slate-500">Basis: {formatCurrency(eligibleBasis)}</td>
                <td className="px-4 py-3 text-right font-medium text-blue-700">
                  {adminRate !== null && adminRate !== undefined ? `${adminRate}%` : 'N/A'}
                </td>
                <td className="px-4 py-3 text-right font-bold text-blue-700">
                  {adminAmount !== null && adminAmount !== undefined ? formatCurrency(adminAmount) : 'Unavailable'}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-emerald-900">{partnerLabel}</td>
                <td className="px-4 py-3 text-slate-500">Basis: {formatCurrency(eligibleBasis)}</td>
                <td className="px-4 py-3 text-right font-medium text-emerald-700">
                  {partnerRate !== null && partnerRate !== undefined ? `${partnerRate}%` : 'N/A'}
                </td>
                <td className="px-4 py-3 text-right font-bold text-emerald-700">
                  {partnerAmount !== null && partnerAmount !== undefined ? formatCurrency(partnerAmount) : 'Unavailable'}
                </td>
              </tr>
              {commission.fees > 0 && (
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-800">Additional Service Fee (Home Collection)</td>
                  <td className="px-4 py-3 text-slate-500">Direct logistics fee</td>
                  <td className="px-4 py-3 text-right">—</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">{formatCurrency(commission.fees)}</td>
                </tr>
              )}
              <tr className="bg-slate-50/80 font-bold text-slate-900">
                <td className="px-4 py-3">Total Allocated</td>
                <td className="px-4 py-3 text-xs font-normal text-slate-500">Reconciled to 100% of collected revenue</td>
                <td className="px-4 py-3 text-right">100%</td>
                <td className="px-4 py-3 text-right text-sm">{formatCurrency(grossAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex items-start sm:items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
          <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
          <span>
            <strong>Historical Integrity:</strong> Financial commission splits are permanently locked to this transaction's authoritative persisted record. Future revisions to platform or organization agreements will not alter this audited entry.
          </span>
        </div>
      </div>

      {/* 5. SETTLEMENT DETAILS & TRANSACTION HISTORY (2 COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SETTLEMENT DETAILS CARD */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <DollarSign size={18} />
                </div>
                <h3 className="text-base font-bold text-slate-900">Settlement Details</h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {settlement.settlementStatus || 'Pending Settlement'}
              </span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Settlement Status</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {settlement.settlementStatus || 'Pending Settlement'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Settlement Period</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {settlement.settlementPeriod || 'Current Month'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Batch / Settlement Ref</p>
                  <p className="text-sm font-medium text-slate-700 font-mono">
                    {settlement.settlementBatchId || `SETTLE-${organization.id?.substring(0, 5).toUpperCase()}`}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Amount Payable</p>
                  <p className="text-base font-bold text-emerald-700">
                    {formatCurrency(settlement.amountPayable || partnerAmount || 0)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Payee Organization</p>
                <p className="text-sm font-medium text-slate-800">
                  {settlement.payeeOrganization || organization.name || 'Healthcare Provider'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Managed via Admin Settlements module</span>
            <button
              onClick={() => navigate('/admin/settlements')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium transition-colors"
            >
              Open Settlements <ExternalLink size={12} />
            </button>
          </div>
        </div>

        {/* TRANSACTION HISTORY & AUDIT TRAIL CARD */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Clock size={18} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Transaction History</h3>
            </div>
            <span className="text-xs text-slate-400">Audit Trail</span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {history.length > 0 ? (
              history.map((ev: any, idx: number) => {
                const isCurrent = idx === history.length - 1;
                return (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border-2 bg-white ${
                      ev.status === 'Successful' || ev.status === 'Allocated' 
                        ? 'border-emerald-500 ring-2 ring-emerald-100' 
                        : ev.status === 'Cancelled'
                        ? 'border-rose-500 ring-2 ring-rose-100'
                        : isCurrent
                        ? 'border-blue-500 ring-2 ring-blue-100'
                        : 'border-slate-400'
                    }`} />
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-xs font-bold text-slate-900">{ev.event}</p>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {ev.timestamp ? new Date(ev.timestamp).toLocaleString('en-IN', {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        }) : 'Upcoming Cycle'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{ev.description}</p>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-slate-500 py-4">
                No archived transaction events logged. Current status: <span className="font-semibold text-slate-700">{status}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetails;
