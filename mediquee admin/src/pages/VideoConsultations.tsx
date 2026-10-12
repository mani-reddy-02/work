import React, { useState, useEffect, useCallback } from 'react';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import KpiCard from '../components/ui/KpiCard';
import { useAdminAuth } from '../contexts/AuthContext';
import { videoConsultationService, VideoConsultationItem } from '../services/videoConsultationService';
import {
  Video,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Activity,
  AlertTriangle,
  RotateCcw,
  User,
  Stethoscope,
  Building2,
  X,
  Radio,
  FileText
} from 'lucide-react';

const VideoConsultations: React.FC = () => {
  const { token } = useAdminAuth();

  // State
  const [consultations, setConsultations] = useState<VideoConsultationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Backend Real Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    scheduled: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
  });

  // Provider configuration telemetry
  const [providerConfig, setProviderConfig] = useState<{
    isConfigured: boolean;
    message: string;
  }>({
    isConfigured: false,
    message: 'Checking video streaming infrastructure...',
  });

  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const limit = 20;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Detail Modal State
  const [selectedConsultation, setSelectedConsultation] = useState<VideoConsultationItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchConsultations = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await videoConsultationService.getVideoConsultations(token, {
        page: currentPage,
        limit,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: search.trim() !== '' ? search.trim() : undefined,
      });

      if (res.success && Array.isArray(res.data)) {
        setConsultations(res.data);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalResults(res.pagination.total || res.data.length);
        } else {
          setTotalResults(res.data.length);
          setTotalPages(Math.ceil(res.data.length / limit) || 1);
        }
        if (res.stats) {
          setStats(res.stats);
        }
        if (res.providerConfig) {
          setProviderConfig(res.providerConfig);
        }
      } else {
        setError(res?.error?.message || 'Unable to load video consultations.');
      }
    } catch (err: any) {
      console.error('Failed to load video consultations:', err);
      setError(err?.message || 'Unable to load video consultations.');
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, limit, search, statusFilter]);

  useEffect(() => {
    fetchConsultations();
  }, [fetchConsultations]);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const handleTileFilter = (status: string) => {
    setStatusFilter((prev) => (prev === status ? 'ALL' : status));
  };

  const handleOpenDetails = async (item: VideoConsultationItem) => {
    if (!token) return;
    setSelectedConsultation(item);
    setIsDetailOpen(true);
    setActionSuccess(null);
    setDetailLoading(true);
    try {
      const res = await videoConsultationService.getVideoConsultationById(item.id, token);
      if (res.success && res.data) {
        setSelectedConsultation(res.data);
      }
    } catch (e) {
      console.warn('Failed to fetch full consultation detail:', e);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusTransition = async (newStatus: string) => {
    if (!token || !selectedConsultation) return;
    setUpdatingStatus(true);
    setActionSuccess(null);
    try {
      const res = await videoConsultationService.updateStatus(selectedConsultation.id, newStatus, token);
      if (res.success) {
        setActionSuccess(`Status transitioned to ${newStatus}`);
        // Refresh details
        const refreshed = await videoConsultationService.getVideoConsultationById(selectedConsultation.id, token);
        if (refreshed.success && refreshed.data) {
          setSelectedConsultation(refreshed.data);
        }
        // Refresh main listing
        fetchConsultations();
      } else {
        alert(res.message || 'Failed to update status');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const columns: Column<VideoConsultationItem>[] = [
    {
      header: 'S.No',
      accessor: (_, index) => (
        <span className="text-sm font-medium text-slate-500">
          {(currentPage - 1) * limit + index + 1}
        </span>
      ),
    },
    {
      header: 'Consultation ID',
      accessor: (c) => (
        <div className="flex flex-col">
          <span className="font-semibold text-blue-600 hover:text-blue-700 tracking-wide">
            {c.consultationId}
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {c.bookingId.substring(0, 8)}
          </span>
        </div>
      ),
    },
    {
      header: 'Patient',
      accessor: (c) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900">{c.patientName}</span>
          <span className="text-xs text-slate-500">{c.patientPhone}</span>
        </div>
      ),
    },
    {
      header: 'Doctor',
      accessor: (c) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900">{c.doctorName}</span>
          <span className="text-xs text-slate-500">{c.doctorSpecialization}</span>
        </div>
      ),
    },
    {
      header: 'Hospital',
      accessor: (c) => (
        <div className="flex flex-col">
          <span className="text-sm text-slate-700 font-medium">{c.hospitalName}</span>
          <span className="text-xs text-slate-400">{c.hospitalCity}</span>
        </div>
      ),
    },
    {
      header: 'Scheduled Date/Time',
      accessor: (c) => (
        <div className="flex flex-col text-sm">
          <span className="font-medium text-slate-800">{c.date}</span>
          <span className="text-xs text-slate-500">{c.timeSlot}</span>
        </div>
      ),
    },
    {
      header: 'Consultation Status',
      accessor: (c) => <StatusBadge status={c.consultationStatus} />,
    },
    {
      header: 'Session Status',
      accessor: (c) => {
        let badgeType: 'success' | 'warning' | 'error' | 'info' | 'purple' = 'info';
        if (c.sessionStatus === 'COMPLETED') badgeType = 'success';
        else if (c.sessionStatus === 'IN_PROGRESS') badgeType = 'purple';
        else if (c.sessionStatus === 'WAITING') badgeType = 'warning';
        else if (c.sessionStatus === 'CANCELLED' || c.sessionStatus === 'FAILED') badgeType = 'error';
        return <StatusBadge status={c.sessionStatus} type={badgeType} />;
      },
    },
    {
      header: 'Actions',
      accessor: (c) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleOpenDetails(c);
          }}
          className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
        >
          View Details
        </button>
      ),
    },
  ];

  if (error) {
    return (
      <div className="p-12 text-center bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center min-h-[350px]">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4">
          <XCircle size={28} />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Unable to load Video Consultations</h3>
        <p className="text-sm text-slate-500 max-w-md mb-6">{error}</p>
        <button
          onClick={() => fetchConsultations()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition shadow-sm"
        >
          <RotateCcw size={16} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-xs">
              <Video size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Video Consultations</h2>
              <p className="text-sm text-slate-500">
                Monitor and manage virtual teleconsultations across doctors and patients.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => fetchConsultations()}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-xs self-start sm:self-auto"
        >
          <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Infrastructure Telemetry Banner */}
      <div
        className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm ${
          providerConfig.isConfigured
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            : 'bg-amber-50/80 border-amber-200 text-amber-900'
        }`}
      >
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              providerConfig.isConfigured
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {providerConfig.isConfigured ? <Radio size={18} /> : <AlertTriangle size={18} />}
          </div>
          <div>
            <div className="font-semibold flex items-center gap-2">
              <span>
                {providerConfig.isConfigured
                  ? 'LiveKit Video Streaming Infrastructure Active'
                  : 'Video Infrastructure Integration Status: Pending Cloud Environment Setup'}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  providerConfig.isConfigured
                    ? 'bg-emerald-200/60 text-emerald-800'
                    : 'bg-amber-200/60 text-amber-800'
                }`}
              >
                {providerConfig.isConfigured ? 'Connected' : 'Credentials Missing'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {providerConfig.isConfigured
                ? 'LiveKit Cloud WebRTC mesh is configured. Doctors and patients can stream video calls in real-time.'
                : 'Live consultation booking records, lifecycle status management, and doctor-patient relationships are active. Live streaming calls require LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET in backend environment variables.'}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards (All Counts from Backend DB) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => handleTileFilter('ALL')}
          className={`cursor-pointer transition-all rounded-xl ${
            statusFilter === 'ALL' ? 'ring-2 ring-blue-500 shadow-md' : 'hover:scale-[1.02]'
          }`}
        >
          <KpiCard title="Total Consults" value={stats.total} icon={Activity} />
        </div>

        <div
          onClick={() => handleTileFilter('PENDING')}
          className={`cursor-pointer transition-all rounded-xl ${
            statusFilter === 'PENDING' ? 'ring-2 ring-amber-500 shadow-md' : 'hover:scale-[1.02]'
          }`}
        >
          <KpiCard
            title="Pending"
            value={stats.pending}
            icon={Clock}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
          />
        </div>

        <div
          onClick={() => handleTileFilter('SCHEDULED')}
          className={`cursor-pointer transition-all rounded-xl ${
            statusFilter === 'SCHEDULED' ? 'ring-2 ring-indigo-500 shadow-md' : 'hover:scale-[1.02]'
          }`}
        >
          <KpiCard
            title="Scheduled"
            value={stats.scheduled}
            icon={Calendar}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50"
          />
        </div>

        <div
          onClick={() => handleTileFilter('IN_PROGRESS')}
          className={`cursor-pointer transition-all rounded-xl ${
            statusFilter === 'IN_PROGRESS' ? 'ring-2 ring-purple-500 shadow-md' : 'hover:scale-[1.02]'
          }`}
        >
          <KpiCard
            title="In Progress"
            value={stats.inProgress}
            icon={Radio}
            iconColor="text-purple-600"
            iconBg="bg-purple-50"
          />
        </div>

        <div
          onClick={() => handleTileFilter('COMPLETED')}
          className={`cursor-pointer transition-all rounded-xl ${
            statusFilter === 'COMPLETED' ? 'ring-2 ring-emerald-500 shadow-md' : 'hover:scale-[1.02]'
          }`}
        >
          <KpiCard
            title="Completed"
            value={stats.completed}
            icon={CheckCircle}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
          />
        </div>

        <div
          onClick={() => handleTileFilter('CANCELLED')}
          className={`cursor-pointer transition-all rounded-xl ${
            statusFilter === 'CANCELLED' ? 'ring-2 ring-rose-500 shadow-md' : 'hover:scale-[1.02]'
          }`}
        >
          <KpiCard
            title="Cancelled"
            value={stats.cancelled}
            icon={XCircle}
            iconColor="text-rose-600"
            iconBg="bg-rose-50"
          />
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, patient, doctor, hospital..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">
            Status Filter:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses ({stats.total})</option>
            <option value="PENDING">Pending / Waiting ({stats.pending})</option>
            <option value="SCHEDULED">Scheduled / Confirmed ({stats.scheduled})</option>
            <option value="IN_PROGRESS">In Progress ({stats.inProgress})</option>
            <option value="COMPLETED">Completed ({stats.completed})</option>
            <option value="CANCELLED">Cancelled / No-Show ({stats.cancelled})</option>
          </select>

          {statusFilter !== 'ALL' && (
            <button
              onClick={() => setStatusFilter('ALL')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium underline whitespace-nowrap"
            >
              Reset filter
            </button>
          )}
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center min-h-[350px]">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium">Loading video consultations...</p>
        </div>
      ) : (
        <DataTable
          data={consultations}
          columns={columns}
          keyExtractor={(c) => c.id}
          searchPlaceholder="Search consultations..."
          onSearch={setSearch}
          emptyMessage={
            search || statusFilter !== 'ALL'
              ? 'No video consultations match the selected search or filter.'
              : 'No video consultations found.'
          }
          onRowClick={(c) => handleOpenDetails(c)}
          pagination={{
            currentPage,
            totalPages,
            totalResults,
            pageSize: limit,
            onPageChange: setCurrentPage,
          }}
        />
      )}

      {/* Details Modal */}
      {isDetailOpen && selectedConsultation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Video size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-lg">
                      {selectedConsultation.consultationId}
                    </h3>
                    <StatusBadge status={selectedConsultation.consultationStatus} />
                  </div>
                  <p className="text-xs text-slate-500">
                    Booking ID: {selectedConsultation.bookingId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {actionSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium flex items-center gap-2">
                  <CheckCircle size={16} />
                  {actionSuccess}
                </div>
              )}

              {/* Patient & Doctor Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Patient */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <User size={14} className="text-blue-600" />
                    Patient Information
                  </div>
                  <div className="font-bold text-slate-900 text-base">
                    {selectedConsultation.patientName}
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div>
                      <span className="text-slate-400">Phone:</span> {selectedConsultation.patientPhone}
                    </div>
                    {(selectedConsultation as any).patientEmail && (
                      <div>
                        <span className="text-slate-400">Email:</span>{' '}
                        {(selectedConsultation as any).patientEmail}
                      </div>
                    )}
                    {selectedConsultation.patientGender && (
                      <div>
                        <span className="text-slate-400">Gender / Age:</span>{' '}
                        {selectedConsultation.patientGender}
                        {selectedConsultation.patientAge ? ` • ${selectedConsultation.patientAge} yrs` : ''}
                      </div>
                    )}
                  </div>
                </div>

                {/* Doctor */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <Stethoscope size={14} className="text-indigo-600" />
                    Assigned Doctor
                  </div>
                  <div className="font-bold text-slate-900 text-base">
                    {selectedConsultation.doctorName}
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div>
                      <span className="text-slate-400">Specialization:</span>{' '}
                      {selectedConsultation.doctorSpecialization}
                    </div>
                    <div>
                      <span className="text-slate-400">Department:</span>{' '}
                      {selectedConsultation.departmentName}
                    </div>
                    <div>
                      <span className="text-slate-400">Hospital:</span>{' '}
                      {selectedConsultation.hospitalName} ({selectedConsultation.hospitalCity})
                    </div>
                  </div>
                </div>
              </div>

              {/* Schedule & Telemetry */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-purple-600" />
                    Schedule & Telemetry
                  </div>
                  <span className="text-slate-700 font-bold">
                    Fee: ₹{selectedConsultation.fee}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Date</span>
                    <span className="font-semibold text-slate-800">{selectedConsultation.date}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Time Slot</span>
                    <span className="font-semibold text-slate-800">{selectedConsultation.timeSlot}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Session Status</span>
                    <span className="font-semibold text-slate-800">{selectedConsultation.sessionStatus}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Room Name</span>
                    <span className="font-mono text-slate-700">
                      {selectedConsultation.roomName || 'Pending initiation'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Call Duration</span>
                    <span className="font-semibold text-slate-800">
                      {selectedConsultation.formattedDuration || '00:00'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Created At</span>
                    <span className="text-slate-700">
                      {new Date(selectedConsultation.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Lifecycle Actions */}
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200/70 space-y-3">
                <div className="text-xs font-semibold text-blue-900 uppercase tracking-wider">
                  Admin Consultation Lifecycle Actions
                </div>
                <div className="flex flex-wrap gap-2">
                  {['WAITING', 'PENDING'].includes(selectedConsultation.consultationStatus) && (
                    <>
                      <button
                        disabled={updatingStatus}
                        onClick={() => handleStatusTransition('CONFIRMED')}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                      >
                        Confirm & Schedule
                      </button>
                      <button
                        disabled={updatingStatus}
                        onClick={() => handleStatusTransition('CANCELLED')}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                      >
                        Cancel Consultation
                      </button>
                    </>
                  )}

                  {['CONFIRMED', 'SCHEDULED'].includes(selectedConsultation.consultationStatus) && (
                    <>
                      <button
                        disabled={updatingStatus}
                        onClick={() => handleStatusTransition('IN_CONSULTATION')}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                      >
                        Start Session (In Progress)
                      </button>
                      <button
                        disabled={updatingStatus}
                        onClick={() => handleStatusTransition('CANCELLED')}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                      >
                        Cancel Consultation
                      </button>
                    </>
                  )}

                  {['IN_CONSULTATION', 'IN_PROGRESS'].includes(
                    selectedConsultation.consultationStatus
                  ) && (
                    <button
                      disabled={updatingStatus}
                      onClick={() => handleStatusTransition('COMPLETED')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                    >
                      Complete Consultation
                    </button>
                  )}

                  {['COMPLETED', 'CANCELLED'].includes(selectedConsultation.consultationStatus) && (
                    <span className="text-xs text-slate-500 italic">
                      This consultation is finalised as {selectedConsultation.consultationStatus}.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold"
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

export default VideoConsultations;
