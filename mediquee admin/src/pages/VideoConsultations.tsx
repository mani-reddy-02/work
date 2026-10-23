import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import KpiCard from '../components/ui/KpiCard';
import { useAdminAuth } from '../contexts/AuthContext';
import { videoConsultationService, VideoConsultationItem } from '../services/videoConsultationService';
import { DateRangeFilter, DateFilterValue } from '../components/ui/DateRangeFilter';
import {
  Video,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Activity,
  AlertTriangle,
  RotateCcw,
  X,
  Radio,
} from 'lucide-react';

const VideoConsultations: React.FC = () => {
  const { token } = useAdminAuth();
  const navigate = useNavigate();

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

  // Date Filtering State with Presets (Today, Yesterday, This Week, This Month, Custom Range)
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({
    preset: 'all',
    startDate: '',
    endDate: '',
  });

  const fetchConsultations = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page: currentPage,
        limit,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: search.trim() !== '' ? search.trim() : undefined,
      };

      if (dateFilter.startDate) params.startDate = dateFilter.startDate;
      if (dateFilter.endDate) params.endDate = dateFilter.endDate;

      const res = await videoConsultationService.getVideoConsultations(token, params);

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
  }, [token, currentPage, limit, search, statusFilter, dateFilter]);

  useEffect(() => {
    fetchConsultations();
  }, [fetchConsultations]);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, dateFilter]);

  const handleTileFilter = (status: string) => {
    setStatusFilter((prev) => (prev === status ? 'ALL' : status));
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
            navigate(`/admin/services/video-consultation/${c.id}`);
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
                Monitor and inspect virtual teleconsultations across doctors and patients.
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

      {/* Date-Wise Monitoring Filter Bar */}
      <DateRangeFilter
        value={dateFilter}
        onChange={setDateFilter}
      />

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
            search || statusFilter !== 'ALL' || dateFilter.startDate || dateFilter.endDate
              ? 'No video consultations match the selected search, date, or filter.'
              : 'No video consultations found.'
          }
          onRowClick={(c) => navigate(`/admin/services/video-consultation/${c.id}`)}
          pagination={{
            currentPage,
            totalPages,
            totalResults,
            pageSize: limit,
            onPageChange: setCurrentPage,
          }}
        />
      )}
    </div>
  );
};

export default VideoConsultations;
