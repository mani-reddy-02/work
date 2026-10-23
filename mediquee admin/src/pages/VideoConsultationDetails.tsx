import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Calendar,
  Building2,
  User,
  Stethoscope,
  Activity,
  XCircle,
  FileText,
  Network,
  CreditCard,
  Video,
  Radio,
  ShieldCheck,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';
import { videoConsultationService } from '../services/videoConsultationService';
import StatusBadge from '../components/ui/StatusBadge';
import { formatAddress } from '../utils/formatAddress';

const VideoConsultationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAdminAuth();
  const [consultation, setConsultation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConsultation = async () => {
    if (!token || !id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await videoConsultationService.getVideoConsultationById(id, token);
      if (res.success && res.data) {
        setConsultation(res.data);
      } else {
        setError(res.message || 'The selected video consultation could not be found.');
      }
    } catch (err: any) {
      setError(err?.message || 'The selected video consultation could not be found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultation();
  }, [id, token]);

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">Loading video consultation details...</p>
      </div>
    );
  }

  if (error || !consultation) {
    return (
      <div className="p-12 text-center bg-white rounded-xl shadow-sm border border-slate-200 min-h-[400px] flex flex-col items-center justify-center">
        <XCircle size={48} className="text-rose-400 mb-4" />
        <h3 className="text-xl font-bold text-slate-900 mb-2">Video Consultation Not Found</h3>
        <p className="text-slate-500 mb-6">{error || 'The selected video consultation could not be found.'}</p>
        <button
          onClick={() => navigate('/admin/services/video-consultation')}
          className="px-6 py-2.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
        >
          Back to Video Consultations
        </button>
      </div>
    );
  }

  const isCompleted = consultation.consultationStatus === 'COMPLETED' || consultation.sessionStatus === 'COMPLETED';
  const isCancelled = consultation.consultationStatus === 'CANCELLED' || consultation.sessionStatus === 'CANCELLED';
  const isInProgress = consultation.consultationStatus === 'IN_CONSULTATION' || consultation.sessionStatus === 'IN_PROGRESS';

  const cId = consultation.consultationId || `VC-${consultation.id.substring(0, 8).toUpperCase()}`;
  const bId = (consultation.bookingId || consultation.id).substring(0, 8).toUpperCase();
  const createdDate = new Date(consultation.createdAt).toLocaleDateString();
  const createdTime = new Date(consultation.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const apptDate = consultation.appointmentDate ? new Date(consultation.appointmentDate).toLocaleDateString() : '—';
  const apptTime = consultation.timeSlot || 'Not specified';

  // Format session status badge
  let sessionBadgeType: 'success' | 'warning' | 'error' | 'info' | 'purple' = 'info';
  if (consultation.sessionStatus === 'COMPLETED') sessionBadgeType = 'success';
  else if (consultation.sessionStatus === 'IN_PROGRESS') sessionBadgeType = 'purple';
  else if (consultation.sessionStatus === 'WAITING') sessionBadgeType = 'warning';
  else if (consultation.sessionStatus === 'CANCELLED' || consultation.sessionStatus === 'FAILED') sessionBadgeType = 'error';

  return (
    <div className="space-y-6">
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col gap-2">
        <div className="text-sm text-slate-500 font-medium flex items-center gap-2">
          <span>Admin</span>
          <span className="text-slate-300">/</span>
          <span>Operations</span>
          <span className="text-slate-300">/</span>
          <span
            className="cursor-pointer hover:text-slate-700 transition"
            onClick={() => navigate('/admin/services/video-consultation')}
          >
            Video Consultations
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-800 font-semibold">Consultation Details</span>
        </div>

        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={() => navigate('/admin/services/video-consultation')}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            title="Back to Video Consultations"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Video size={24} className="text-blue-600" />
                {cId}
              </h2>
              <StatusBadge status={consultation.consultationStatus} />
              <StatusBadge status={consultation.sessionStatus} type={sessionBadgeType} />
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Booking Ref: #{bId}</p>
          </div>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Consultation ID</p>
          <p className="font-semibold text-slate-900">{cId}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Booking ID</p>
          <p className="font-semibold text-blue-600 font-mono">{bId}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Date</p>
          <p className="font-semibold text-slate-900">{apptDate}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Time Slot</p>
          <p className="font-semibold text-slate-900">{apptTime}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Call Duration</p>
          <p className="font-semibold text-slate-900">{consultation.formattedDuration || '00:00'}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Consultation Fee</p>
          <p className="font-semibold text-slate-900">₹{consultation.fee || 0}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Created</p>
          <p className="font-medium text-slate-900 text-sm">
            {createdDate} <span className="text-slate-400 text-xs">{createdTime}</span>
          </p>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient and Doctor Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Patient Information */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center gap-3">
                <User size={18} className="text-slate-500" />
                <h3 className="font-bold text-slate-900">Patient Information</h3>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Patient Name</p>
                  <p className="font-medium text-slate-900">{consultation.patientName || '—'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Age</p>
                    <p className="font-medium text-slate-900">
                      {consultation.patientAge ? `${consultation.patientAge} yrs` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Gender</p>
                    <p className="font-medium text-slate-900">{consultation.patientGender || '—'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Phone</p>
                    <p className="font-medium text-slate-900">{consultation.patientPhone || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Email</p>
                    <p className="font-medium text-slate-900 truncate" title={consultation.patientEmail}>
                      {consultation.patientEmail || '—'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Address / Location</p>
                  <p className="font-medium text-slate-900">{formatAddress(consultation.patientAddress)}</p>
                </div>
              </div>
            </div>

            {/* Doctor Information */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center gap-3">
                <Stethoscope size={18} className="text-slate-500" />
                <h3 className="font-bold text-slate-900">Doctor Information</h3>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Doctor Name</p>
                  <p className="font-medium text-slate-900">Dr. {consultation.doctorName || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Specialization</p>
                  <p className="font-medium text-slate-900">{consultation.doctorSpecialization || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Department</p>
                  <p className="font-medium text-slate-900 flex items-center gap-1.5">
                    <Network size={14} className="text-slate-400" /> {consultation.departmentName || '—'}
                  </p>
                </div>
                {consultation.doctorEmail && consultation.doctorEmail !== 'N/A' && (
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Doctor Email</p>
                    <p className="font-medium text-slate-900 truncate">{consultation.doctorEmail}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hospital & Department */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center gap-3">
              <Building2 size={18} className="text-slate-500" />
              <h3 className="font-bold text-slate-900">Hospital & Clinic Details</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-slate-500 font-medium">Hospital Name</p>
                <p className="font-medium text-slate-900 text-lg">{consultation.hospitalName || '—'}</p>
                <p className="text-xs text-slate-500 mt-1">Department: {consultation.departmentName || 'General Medicine'}</p>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Address</p>
                  <p className="font-medium text-slate-900">{consultation.hospitalAddress || '—'}</p>
                  <p className="font-medium text-slate-700">{consultation.hospitalCity ? consultation.hospitalCity : ''}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Video Consultation & Telemetry Information */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-slate-500" />
                <h3 className="font-bold text-slate-900">Consultation & Session Details</h3>
              </div>
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-xs rounded-md">
                Virtual Video Consultation
              </span>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">Room Identifier</p>
                  <p className="font-mono text-sm text-slate-800 bg-slate-50 px-2.5 py-1 rounded border border-slate-200 inline-block truncate max-w-full">
                    {consultation.roomName || 'Pending initiation'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">Consultation Fee</p>
                  <p className="font-medium text-slate-900 flex items-center gap-1">
                    <CreditCard size={14} className="text-slate-400" />
                    ₹{consultation.fee || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">Actual Start Time</p>
                  <p className="font-medium text-slate-900 text-sm">
                    {consultation.startedAt ? new Date(consultation.startedAt).toLocaleTimeString() : 'Not started yet'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">Actual End Time</p>
                  <p className="font-medium text-slate-900 text-sm">
                    {consultation.endedAt ? new Date(consultation.endedAt).toLocaleTimeString() : 'Not ended'}
                  </p>
                </div>
              </div>

              {/* Attendance and Telemetry */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">Patient Joined At</p>
                  <p className="font-medium text-slate-800 text-sm">
                    {consultation.patientJoinedAt ? new Date(consultation.patientJoinedAt).toLocaleTimeString() : 'Pending join'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">Doctor Joined At</p>
                  <p className="font-medium text-slate-800 text-sm">
                    {consultation.doctorJoinedAt ? new Date(consultation.doctorJoinedAt).toLocaleTimeString() : 'Pending join'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">Recorded Duration</p>
                  <p className="font-medium text-slate-800 text-sm">
                    {consultation.durationSeconds ? `${consultation.durationSeconds} seconds (${consultation.formattedDuration})` : '00:00'}
                  </p>
                </div>
              </div>

              {/* Reason / Clinical Notes */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Reason for Consultation</p>
                  <p className="text-sm text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-100 mt-1 min-h-[50px]">
                    {consultation.reason || 'General virtual video consultation.'}
                  </p>
                </div>

                {consultation.cancellationReason && (
                  <div>
                    <p className="text-xs text-rose-600 font-medium">Cancellation Reason</p>
                    <p className="text-sm text-rose-900 bg-rose-50 p-3 rounded-lg border border-rose-200 mt-1">
                      {consultation.cancellationReason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Column (Read-Only) */}
        <div className="space-y-6">
          {/* Read-Only Status Overview */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Consultation Status</h3>
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Booking Status</span>
                <StatusBadge status={consultation.consultationStatus} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Session State</span>
                <StatusBadge status={consultation.sessionStatus} type={sessionBadgeType} />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed pt-2 border-t border-slate-200">
                This consultation is monitored in read-only mode by Administrators. Status transitions are managed in real-time by the attending Doctor and Patient during the virtual call.
              </p>
            </div>
          </div>

          {/* Infrastructure Health Telemetry */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Radio size={18} className="text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Network Infrastructure</h3>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">LiveKit Cloud Mesh:</span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                    consultation.providerConfig?.isConfigured
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {consultation.providerConfig?.isConfigured ? 'Active / Configured' : 'Credentials Missing'}
                </span>
              </div>
              <div className="text-slate-500 leading-normal text-[11px]">
                {consultation.providerConfig?.message || 'Secure peer WebRTC connection mesh for video streaming.'}
              </div>
            </div>
          </div>

          {/* Consultation Timeline (Read-Only) */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Consultation Timeline</h3>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200">
              {/* Created */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white bg-blue-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-1/2 -ml-3 md:ml-0"></div>
                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-2rem)] pl-8 md:pl-0 md:pr-8 md:text-right">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 text-sm">Consultation Booked</span>
                    <span className="text-xs text-slate-500">{createdDate} at {createdTime}</span>
                  </div>
                </div>
              </div>

              {/* Scheduled Event */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white bg-indigo-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-1/2 -ml-3 md:ml-0"></div>
                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-2rem)] pl-8 md:pl-0 md:group-odd:pl-8 md:text-left">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 text-sm">Scheduled Slot</span>
                    <span className="text-xs text-slate-500">{apptDate} ({apptTime})</span>
                  </div>
                </div>
              </div>

              {/* In Progress / Active */}
              {(isInProgress || isCompleted) && (
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white bg-purple-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-1/2 -ml-3 md:ml-0"></div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-2rem)] pl-8 md:pl-0 md:pr-8 md:text-right">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 text-sm">Session Connected</span>
                      <span className="text-xs text-slate-500">
                        {consultation.startedAt ? new Date(consultation.startedAt).toLocaleTimeString() : 'Live stream initiated'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Completed / Cancelled */}
              {(isCompleted || isCancelled) && (
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div
                    className={`flex items-center justify-center w-6 h-6 rounded-full border-2 border-white text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-1/2 -ml-3 md:ml-0 ${
                      isCompleted ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  ></div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-2rem)] pl-8 md:pl-0 md:group-odd:pl-8 md:text-left">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 text-sm">
                        {isCompleted ? 'Consultation Completed' : 'Consultation Cancelled'}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(consultation.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoConsultationDetails;
