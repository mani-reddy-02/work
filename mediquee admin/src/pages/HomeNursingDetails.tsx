import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Building2, 
  User, 
  MapPin, 
  HeartPulse, 
  Stethoscope, 
  CreditCard, 
  CheckCircle2, 
  Circle, 
  AlertCircle,
  ExternalLink,
  Phone,
  Mail,
  FileText,
  History,
  ShieldCheck,
  Check,
  XCircle,
  Clock4
} from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';
import { nursingService } from '../services/nursingService';
import StatusBadge from '../components/ui/StatusBadge';

const HomeNursingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAdminAuth();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooking = async () => {
    if (!token || !id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await nursingService.getHomeNursingBookingById(id, token);
      if (res.success && res.data) {
        setBooking(res.data);
      } else {
        setError(res.message || 'Home nursing request not found.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading home nursing details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id, token]);

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return 'Not recorded';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Not provided';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const calculateAge = (dob?: string | null): number | null => {
    if (!dob) return null;
    try {
      const birth = new Date(dob);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      return age >= 0 && age < 150 ? age : null;
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-slate-200 rounded-xl p-12">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-600 font-medium text-sm">Loading Home Nursing Order Details...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-2xl mx-auto my-8">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Unable to Load Order</h3>
        <p className="text-sm text-slate-500 mb-6">{error || 'Home nursing booking could not be located.'}</p>
        <button
          onClick={() => navigate('/admin/services/home-nursing')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Home Nursing List
        </button>
      </div>
    );
  }

  // Resolve patient details
  const patientDisplayName = booking.patientName || booking.user?.name || 'Not provided';
  const patientPhone = booking.patientPhone || booking.user?.phone || 'Not provided';
  const patientEmail = booking.patientEmail || booking.user?.email || null;
  const patientGender = booking.patientGender || booking.user?.gender || null;
  const resolvedAge = booking.patientAge ?? calculateAge(booking.user?.dob);

  // Status Lifecycle Logic (Strictly Read-Only)
  const currentStatus = (booking.status || 'CONFIRMED').toUpperCase();
  const isCancelled = currentStatus === 'CANCELLED';
  const isCompleted = currentStatus === 'COMPLETED';
  const isInProgress = currentStatus === 'IN_PROGRESS';
  const isAssigned = currentStatus === 'ASSIGNED' || Boolean(booking.nurseId || booking.nurse);

  // Workflow milestones
  const workflowSteps = [
    {
      key: 'CREATED',
      title: 'Request Created',
      desc: 'Order placed by patient and registered on platform',
      isCompleted: true,
      timestamp: booking.createdAt ? formatDateTime(booking.createdAt) : null
    },
    {
      key: 'ASSIGNED',
      title: 'Provider Assigned',
      desc: booking.nurse ? `Assigned to ${booking.nurse.name}` : 'Awaiting nursing provider assignment',
      isCompleted: !isCancelled && isAssigned,
      isActive: currentStatus === 'ASSIGNED',
      timestamp: isAssigned && booking.nurse ? formatDateTime(booking.updatedAt) : null
    },
    {
      key: 'IN_PROGRESS',
      title: 'Service Started',
      desc: isInProgress || isCompleted ? 'Nurse arrived and service in progress' : 'Scheduled visit pending arrival',
      isCompleted: !isCancelled && (isInProgress || isCompleted),
      isActive: isInProgress,
      timestamp: isInProgress ? formatDateTime(booking.updatedAt) : null
    },
    {
      key: 'COMPLETED',
      title: 'Service Completed',
      desc: isCompleted ? 'Nursing service completed successfully' : 'Final visit sign-off',
      isCompleted: isCompleted,
      isActive: isCompleted,
      timestamp: isCompleted ? formatDateTime(booking.updatedAt) : null
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 3. Improved Page Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              onClick={() => navigate('/admin/services/home-nursing')}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 shrink-0 mt-0.5"
              title="Back to Home Nursing Orders"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Home Nursing Request #{booking.bookingNumber || booking.id.substring(0, 8).toUpperCase()}
                </h1>
                <StatusBadge status={booking.status} />
              </div>
              <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-2">
                <span>Created on: <strong className="text-slate-700 font-medium">{formatDateTime(booking.createdAt)}</strong></span>
                {booking.updatedAt && booking.updatedAt !== booking.createdAt && (
                  <span className="hidden sm:inline text-slate-400">• Last updated: {formatDateTime(booking.updatedAt)}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600">
              <ShieldCheck size={14} className="text-emerald-600" />
              Verified Operational Record (Read-Only)
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">

          {/* 4. Service Details Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                  <HeartPulse size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Service Details</h2>
                  <p className="text-xs text-slate-500">Requested nursing procedures and specifications</p>
                </div>
              </div>
              {booking.service?.category && (
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-semibold uppercase tracking-wider">
                  {booking.service.category}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Service Required</p>
                <p className="font-semibold text-slate-900 text-base">{booking.service?.name || 'Not provided'}</p>
                {booking.service?.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{booking.service.description}</p>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Duration Needed</p>
                <p className="font-semibold text-slate-900 text-base">{booking.duration || booking.service?.duration || 'Per Visit'}</p>
                <p className="text-xs text-slate-500 mt-1">Scheduled service time allotment</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Base Catalog Price</p>
                <p className="font-medium text-slate-800">
                  {booking.service?.basePrice !== undefined && booking.service?.basePrice !== null 
                    ? `₹${booking.service.basePrice}` 
                    : 'Standard Catalog Rate'}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Internal Reference</p>
                <p className="font-mono text-xs text-slate-600 break-all">{booking.id}</p>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Additional Patient Notes</p>
              <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {booking.notes && booking.notes.trim() ? (
                  booking.notes
                ) : (
                  <span className="text-slate-400 italic">No additional instructions or notes provided by patient.</span>
                )}
              </div>
            </div>
          </div>

          {/* 5. Patient Information & 6. Assigned Provider */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Patient Information Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                      <User size={18} />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">Patient Information</h3>
                  </div>
                  {booking.user?.id && (
                    <button
                      onClick={() => navigate(`/admin/patients/${booking.user.id}`)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
                    >
                      View Account <ExternalLink size={12} />
                    </button>
                  )}
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Full Name</p>
                    <p className="font-semibold text-slate-900">{patientDisplayName}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Gender</p>
                      <p className="text-slate-800 font-medium">{patientGender || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Age</p>
                      <p className="text-slate-800 font-medium">
                        {resolvedAge !== null && resolvedAge !== undefined ? `${resolvedAge} years` : 'Not provided'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400 font-medium">Contact Phone</p>
                    <p className="text-slate-800 font-medium flex items-center gap-1.5">
                      <Phone size={14} className="text-slate-400" />
                      {patientPhone}
                    </p>
                  </div>

                  {patientEmail && (
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Email Address</p>
                      <p className="text-slate-800 font-medium truncate flex items-center gap-1.5">
                        <Mail size={14} className="text-slate-400 shrink-0" />
                        {patientEmail}
                      </p>
                    </div>
                  )}

                  {booking.user?.id && (
                    <div>
                      <p className="text-xs text-slate-400 font-medium">User Profile ID</p>
                      <p className="font-mono text-xs text-slate-500 break-all">{booking.user.id}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Assigned Provider Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                      <Stethoscope size={18} />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">Assigned Provider</h3>
                  </div>
                  {booking.nurse && (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[11px] font-semibold">
                      Assigned
                    </span>
                  )}
                </div>

                {booking.nurse ? (
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Nurse / Caregiver Name</p>
                      <p className="font-semibold text-slate-900">{booking.nurse.name}</p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400 font-medium">Specialization & Role</p>
                      <p className="text-slate-800 font-medium">
                        {booking.nurse.specialization || booking.nurse.qualification || 'Certified Nursing Professional'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400 font-medium">Contact Phone</p>
                      <p className="text-slate-800 font-medium flex items-center gap-1.5">
                        <Phone size={14} className="text-slate-400" />
                        {booking.nurse.phone || 'Contact not on file'}
                      </p>
                    </div>

                    {booking.nurse.experienceYears && (
                      <div>
                        <p className="text-xs text-slate-400 font-medium">Clinical Experience</p>
                        <p className="text-slate-800 font-medium">{booking.nurse.experienceYears} Years</p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs text-slate-400 font-medium">Provider ID</p>
                      <p className="font-mono text-xs text-slate-500 break-all">{booking.nurse.id}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-6 bg-slate-50/70 border border-slate-200/80 rounded-lg min-h-[160px]">
                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-2">
                      <Clock4 size={20} />
                    </div>
                    <p className="text-sm font-bold text-slate-800">No provider assigned</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-[220px]">
                      Provider assignment has not yet been recorded for this nursing request.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 9. Service History & Operational Audit Timeline */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <History size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Request History & Audit Log</h3>
                <p className="text-xs text-slate-500">Persisted chronological events from backend records</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <p className="text-sm font-semibold text-slate-900">Order Initiated</p>
                    <span className="text-xs text-slate-500">{formatDateTime(booking.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Patient placed request for <strong className="text-slate-800">{booking.service?.name}</strong>.
                  </p>
                </div>
              </div>

              {isAssigned && booking.nurse && (
                <div className="flex items-start gap-3 pt-3 border-t border-slate-100">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <p className="text-sm font-semibold text-slate-900">Provider Assigned</p>
                      <span className="text-xs text-slate-500">{formatDateTime(booking.updatedAt)}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Assigned to nurse: <strong className="text-slate-800">{booking.nurse.name}</strong>.
                    </p>
                  </div>
                </div>
              )}

              {isInProgress && (
                <div className="flex items-start gap-3 pt-3 border-t border-slate-100">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <p className="text-sm font-semibold text-slate-900">Visit Started</p>
                      <span className="text-xs text-slate-500">{formatDateTime(booking.updatedAt)}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Caregiver commenced service at patient address.
                    </p>
                  </div>
                </div>
              )}

              {isCompleted && (
                <div className="flex items-start gap-3 pt-3 border-t border-slate-100">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <p className="text-sm font-semibold text-slate-900">Visit Completed</p>
                      <span className="text-xs text-slate-500">{formatDateTime(booking.updatedAt)}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Nursing service successfully performed and closed.
                    </p>
                  </div>
                </div>
              )}

              {isCancelled && (
                <div className="flex items-start gap-3 pt-3 border-t border-slate-100">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <p className="text-sm font-semibold text-rose-700">Order Cancelled</p>
                      <span className="text-xs text-slate-500">{formatDateTime(booking.updatedAt)}</span>
                    </div>
                    <p className="text-xs text-rose-600 mt-0.5">
                      This service request has been terminated.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Column */}
        <div className="space-y-6">

          {/* 1. Read-Only Service Workflow Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Service Workflow</h3>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Read-Only
              </span>
            </div>

            {isCancelled ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                <div className="flex items-center gap-2 font-bold mb-1 text-sm text-rose-700">
                  <XCircle size={18} /> Request Cancelled
                </div>
                <p>This home nursing request is cancelled and cannot be scheduled or executed.</p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                {workflowSteps.map((step) => (
                  <div key={step.key} className="relative group">
                    <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 bg-white transition-colors ${
                      step.isCompleted 
                        ? 'border-emerald-600 text-emerald-600' 
                        : step.isActive 
                        ? 'border-blue-600 text-blue-600 animate-pulse' 
                        : 'border-slate-300 text-slate-300'
                    }`}>
                      {step.isCompleted ? (
                        <Check size={12} strokeWidth={3} />
                      ) : (
                        <div className={`w-1.5 h-1.5 rounded-full ${step.isActive ? 'bg-blue-600' : 'bg-transparent'}`} />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-semibold ${step.isCompleted ? 'text-slate-900' : 'text-slate-500'}`}>
                          {step.title}
                        </p>
                        {step.isCompleted && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Done
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                      {step.timestamp && (
                        <p className="text-[11px] text-slate-400 mt-1 font-mono">{step.timestamp}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Current Status:</span>
              <StatusBadge status={booking.status} />
            </div>
          </div>

          {/* 7. Location & Time Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm pb-3 border-b border-slate-100 mb-4">
              Location & Schedule
            </h3>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-50 text-slate-600 rounded-lg shrink-0 mt-0.5">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Service Date</p>
                  <p className="font-semibold text-slate-900">{formatDate(booking.serviceDate)}</p>
                  <p className="text-xs font-medium text-slate-600 mt-0.5 flex items-center gap-1">
                    <Clock size={12} /> Time Slot: {booking.timeSlot || 'Not specified'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-slate-100">
                <div className="p-2 bg-slate-50 text-slate-600 rounded-lg shrink-0 mt-0.5">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Service Address</p>
                  <p className="text-slate-900 font-medium leading-snug mt-0.5">
                    {booking.address || 'Address not specified'}
                  </p>
                  {(booking.city || booking.pincode) && (
                    <p className="text-xs text-slate-500 mt-1">
                      {[booking.city, booking.pincode ? `Pincode: ${booking.pincode}` : null].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>

              {booking.hospital && (
                <div className="flex items-start gap-3 pt-3 border-t border-slate-100">
                  <div className="p-2 bg-slate-50 text-slate-600 rounded-lg shrink-0 mt-0.5">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Associated Hospital / Agency</p>
                    <p className="font-semibold text-slate-900 mt-0.5">{booking.hospital.name}</p>
                    {booking.hospital.city && (
                      <p className="text-xs text-slate-500">{booking.hospital.city}</p>
                    )}
                    <button 
                      onClick={() => navigate(`/admin/hospitals/${booking.hospital.id}`)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1 inline-flex items-center gap-1"
                    >
                      View Hospital Profile <ExternalLink size={11} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 8. Financial Details Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CreditCard size={18} />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Financial Details</h3>
              </div>
              <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                booking.paymentStatus === 'PAID' 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                  : booking.paymentStatus === 'REFUNDED'
                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {booking.paymentStatus || 'UNPAID'}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Gross Service Amount</span>
                <span className="font-bold text-slate-900">₹{booking.totalAmount?.toLocaleString('en-IN') || 0}</span>
              </div>

              {booking.mediqueeCommissionPercentage !== null && booking.mediqueeCommissionPercentage !== undefined && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Admin Commission ({booking.mediqueeCommissionPercentage}%)</span>
                  <span className="font-semibold text-rose-600">₹{booking.mediqueeAmount || 0}</span>
                </div>
              )}

              {booking.hospitalSharePercentage !== null && booking.hospitalSharePercentage !== undefined && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Provider Share ({booking.hospitalSharePercentage}%)</span>
                  <span className="font-semibold text-emerald-600">₹{booking.hospitalAmount || 0}</span>
                </div>
              )}

              {booking.paymentMethod && (
                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100">
                  <span className="text-slate-500">Payment Method</span>
                  <span className="font-medium text-slate-700">{booking.paymentMethod}</span>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default HomeNursingDetails;
