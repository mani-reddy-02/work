import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, UserCircle, Stethoscope, Building2, TestTube, HeartHandshake,
  CalendarCheck, Activity, Video, Home, CreditCard, Landmark, 
  ShieldAlert, AlertCircle, CheckCircle2, IndianRupee, TrendingUp, Network,
  Clock, ArrowRight, RefreshCw, Calendar, Check, XCircle, FileText,
  AlertTriangle, PhoneCall, Sparkles, ChevronRight, Megaphone, HeartPulse,
  Shield, UserCheck
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import KpiCard from '../components/ui/KpiCard';
import PendingVerifications from '../components/admin/PendingVerifications';
import { adminService } from '../services/adminService';
import { formatCurrency } from '../utils/finance';
import { useAdminAuth } from '../contexts/AuthContext';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  WAITING: '#3b82f6',
  IN_CONSULTATION: '#8b5cf6',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
  CONFIRMED: '#3b82f6',
  ASSIGNED: '#8b5cf6',
  IN_PROGRESS: '#6366f1',
  REQUESTED: '#f59e0b',
  SAMPLE_COLLECTED: '#06b6d4',
  IN_LAB_PROCESSING: '#8b5cf6',
  REPORT_UPLOAD_PENDING: '#f97316',
  REPORT_READY: '#10b981',
  SCHEDULED: '#3b82f6',
  FAILED: '#ef4444'
};

const PIE_PALETTE = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#ef4444', '#ec4899', '#64748b'];

const Dashboard: React.FC = () => {
  const { token } = useAdminAuth();
  const [period, setPeriod] = useState('this_month');
  const [serviceFilter, setServiceFilter] = useState('all');
  const defaultEndDate = new Date().toISOString().slice(0, 10);
  const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [customStart, setCustomStart] = useState(defaultStartDate);
  const [customEnd, setCustomEnd] = useState(defaultEndDate);
  const [showCustomDates, setShowCustomDates] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Unified Analytics Data State
  const [analytics, setAnalytics] = useState<{
    overview: {
      totalUsers: number;
      totalPatients: number;
      totalDoctors: number;
      totalHospitals: number;
      totalDepartments: number;
      totalLabs: number;
      activeDoctors: number;
      verifiedHospitals: number;
      totalOpBookings: number;
      totalVideoConsultations: number;
      totalLabOrders: number;
      totalHomeSampleOrders: number;
      totalHomeNursingRequests: number;
      totalNurses: number;
      totalReceptionists: number;
      totalInsurances: number;
      pendingHospitalVerifications: number;
      pendingLabVerifications: number;
    };
    services: {
      op: any;
      video: any;
      labVisit: any;
      homeSample: any;
      homeNursing: any;
    };
    financial: {
      grossRevenue: number;
      adminCommission: number;
      providerShare: number;
      transactions: number;
      pendingSettlements: number;
      revenueTrend: any[];
      revenueByService: any[];
      revenueByHospital: any[];
      topHospitals: any[];
    };
    departmentDistribution: any[];
    doctorDistribution: any[];
    actionablePending: {
      hospitals: number;
      labs: number;
      marketingRequests: number;
      campRequests: number;
      opWaiting: number;
      labReportsPending: number;
      homeSampleRequested: number;
      homeNursingConfirmed: number;
    };
    recentActivity: any[];
  }>({
    overview: {
      totalUsers: 0,
      totalPatients: 0,
      totalDoctors: 0,
      totalHospitals: 0,
      totalDepartments: 0,
      totalLabs: 0,
      activeDoctors: 0,
      verifiedHospitals: 0,
      totalOpBookings: 0,
      totalVideoConsultations: 0,
      totalLabOrders: 0,
      totalHomeSampleOrders: 0,
      totalHomeNursingRequests: 0,
      totalNurses: 0,
      totalReceptionists: 0,
      totalInsurances: 0,
      pendingHospitalVerifications: 0,
      pendingLabVerifications: 0,
    },
    services: {
      op: { total: 0, pending: 0, waiting: 0, inConsultation: 0, todayAppointments: 0, completed: 0, cancelled: 0, completionRate: 0, cancellationRate: 0, statusDistribution: [] },
      video: { isSupported: true, total: 0, scheduled: 0, waiting: 0, inProgress: 0, completed: 0, cancelled: 0, failed: 0, completionRate: 0, cancellationRate: 0, statusDistribution: [] },
      labVisit: { total: 0, requested: 0, assigned: 0, sampleCollected: 0, inProcessing: 0, reportUploadPending: 0, reportReady: 0, completed: 0, cancelled: 0, completionRate: 0, cancellationRate: 0, statusDistribution: [] },
      homeSample: { total: 0, requested: 0, assigned: 0, sampleCollected: 0, inProcessing: 0, reportUploadPending: 0, reportReady: 0, completed: 0, cancelled: 0, completionRate: 0, cancellationRate: 0, statusDistribution: [] },
      homeNursing: { total: 0, confirmed: 0, assigned: 0, inProgress: 0, completed: 0, cancelled: 0, completionRate: 0, cancellationRate: 0, statusDistribution: [] },
    },
    financial: {
      grossRevenue: 0,
      adminCommission: 0,
      providerShare: 0,
      transactions: 0,
      pendingSettlements: 0,
      revenueTrend: [],
      revenueByService: [],
      revenueByHospital: [],
      topHospitals: [],
    },
    departmentDistribution: [],
    doctorDistribution: [],
    actionablePending: {
      hospitals: 0,
      labs: 0,
      marketingRequests: 0,
      campRequests: 0,
      opWaiting: 0,
      labReportsPending: 0,
      homeSampleRequested: 0,
      homeNursingConfirmed: 0,
    },
    recentActivity: [],
  });

  const fetchStats = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const isCustom = period === 'custom';
      const res = await adminService.getAdminDashboardStats(
        token,
        period,
        serviceFilter,
        isCustom ? customStart : undefined,
        isCustom ? customEnd : undefined
      );

      if (res.success && res.data) {
        const d = res.data;
        setAnalytics({
          overview: d.overview || {
            totalUsers: d.totalUsers || 0,
            totalPatients: d.totalPatients || 0,
            totalDoctors: d.totalDoctors || 0,
            totalHospitals: d.totalHospitals || 0,
            totalDepartments: d.totalDepartments || 0,
            totalLabs: d.totalLabs || 0,
            activeDoctors: d.activeDoctors || 0,
            verifiedHospitals: d.verifiedHospitals || 0,
            totalOpBookings: d.totalAppointments || 0,
            totalVideoConsultations: 0,
            totalLabOrders: 0,
            totalHomeSampleOrders: 0,
            totalHomeNursingRequests: 0,
            totalNurses: d.totalNurses || 0,
            totalReceptionists: d.totalReceptionists || 0,
            totalInsurances: d.totalInsurances || 0,
            pendingHospitalVerifications: d.pendingVerifications || 0,
            pendingLabVerifications: 0,
          },
          services: d.services || {
            op: {
              total: d.totalAppointments || 0,
              pending: d.appointmentStatuses?.find((s: any) => s.name === 'WAITING')?.value || 0,
              waiting: d.appointmentStatuses?.find((s: any) => s.name === 'WAITING')?.value || 0,
              inConsultation: d.appointmentStatuses?.find((s: any) => s.name === 'IN_CONSULTATION')?.value || 0,
              todayAppointments: 0,
              completed: d.appointmentStatuses?.find((s: any) => s.name === 'COMPLETED')?.value || 0,
              cancelled: d.appointmentStatuses?.find((s: any) => s.name === 'CANCELLED')?.value || 0,
              completionRate: 0,
              cancellationRate: 0,
              statusDistribution: d.appointmentStatuses || [],
            },
            video: { isSupported: true, total: 0, scheduled: 0, waiting: 0, inProgress: 0, completed: 0, cancelled: 0, failed: 0, completionRate: 0, cancellationRate: 0, statusDistribution: [] },
            labVisit: { total: 0, requested: 0, assigned: 0, sampleCollected: 0, inProcessing: 0, reportUploadPending: 0, reportReady: 0, completed: 0, cancelled: 0, completionRate: 0, cancellationRate: 0, statusDistribution: [] },
            homeSample: { total: 0, requested: 0, assigned: 0, sampleCollected: 0, inProcessing: 0, reportUploadPending: 0, reportReady: 0, completed: 0, cancelled: 0, completionRate: 0, cancellationRate: 0, statusDistribution: [] },
            homeNursing: { total: 0, confirmed: 0, assigned: 0, inProgress: 0, completed: 0, cancelled: 0, completionRate: 0, cancellationRate: 0, statusDistribution: [] },
          },
          financial: d.financial || {
            grossRevenue: d.grossRevenue || 0,
            adminCommission: d.adminCommission || 0,
            providerShare: d.providerShare || 0,
            transactions: d.transactions || 0,
            pendingSettlements: 0,
            revenueTrend: d.revenueTrend || [],
            revenueByService: d.revenueByService || [],
            revenueByHospital: d.revenueByHospital || [],
            topHospitals: d.topHospitals || [],
          },
          departmentDistribution: d.departmentDistribution || [],
          doctorDistribution: d.doctorDistribution || [],
          actionablePending: d.actionablePending || {
            hospitals: d.pendingVerifications || 0,
            labs: 0,
            marketingRequests: 0,
            campRequests: 0,
            opWaiting: 0,
            labReportsPending: 0,
            homeSampleRequested: 0,
            homeNursingConfirmed: 0,
          },
          recentActivity: d.recentActivity || [],
        });
      } else {
        setError('Failed to load real platform analytics data.');
      }
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
      setError('An error occurred while fetching analytics from the backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token, period, serviceFilter]);

  const handlePeriodChange = (val: string) => {
    setPeriod(val);
    setShowCustomDates(val === 'custom');
  };

  const handleApplyCustomDates = () => {
    if (customStart && customEnd) {
      fetchStats();
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* ERROR / SYNC ALERT BANNER IF ANY */}
      {error && (
        <div className="bg-rose-50 border border-rose-200/80 p-4 rounded-xl flex items-center justify-between text-rose-800 text-sm shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="text-rose-600 shrink-0" />
            <div>
              <span className="font-semibold block">Analytics Notice</span>
              <span className="text-xs text-rose-600">{error}</span>
            </div>
          </div>
          <button 
            onClick={fetchStats}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            Retry Connection
          </button>
        </div>
      )}
      {/* ACTIONABLE PENDING ACTIONS BANNER */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={18} />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Immediate Action Required</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Link 
            to="/admin/verification" 
            className="p-3.5 bg-white hover:bg-amber-50/40 rounded-xl border border-slate-200 hover:border-amber-300 transition-all shadow-sm group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Hospital Approvals</span>
              <Building2 size={16} className="text-amber-500" />
            </div>
            <p className="text-xl font-bold text-slate-900 mt-2 group-hover:text-amber-600 transition-colors">
              {analytics.actionablePending.hospitals}
            </p>
            <span className="text-[11px] text-amber-600 font-medium flex items-center gap-1 mt-0.5">
              Review docs <ChevronRight size={12} />
            </span>
          </Link>

          <Link 
            to="/admin/labs?verification=pending" 
            className="p-3.5 bg-white hover:bg-indigo-50/40 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all shadow-sm group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Lab Approvals</span>
              <TestTube size={16} className="text-indigo-500" />
            </div>
            <p className="text-xl font-bold text-slate-900 mt-2 group-hover:text-indigo-600 transition-colors">
              {analytics.actionablePending.labs}
            </p>
            <span className="text-[11px] text-indigo-600 font-medium flex items-center gap-1 mt-0.5">
              Review licenses <ChevronRight size={12} />
            </span>
          </Link>

          <Link 
            to="/admin/requests" 
            className="p-3.5 bg-white hover:bg-purple-50/40 rounded-xl border border-slate-200 hover:border-purple-300 transition-all shadow-sm group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Marketing Requests</span>
              <Megaphone size={16} className="text-purple-500" />
            </div>
            <p className="text-xl font-bold text-slate-900 mt-2 group-hover:text-purple-600 transition-colors">
              {analytics.actionablePending.marketingRequests}
            </p>
            <span className="text-[11px] text-purple-600 font-medium flex items-center gap-1 mt-0.5">
              Review requests <ChevronRight size={12} />
            </span>
          </Link>

          <Link 
            to="/admin/requests" 
            className="p-3.5 bg-white hover:bg-emerald-50/40 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all shadow-sm group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Medical Camps Request</span>
              <HeartPulse size={16} className="text-emerald-500" />
            </div>
            <p className="text-xl font-bold text-slate-900 mt-2 group-hover:text-emerald-600 transition-colors">
              {analytics.actionablePending.campRequests}
            </p>
            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
              Review camps <ChevronRight size={12} />
            </span>
          </Link>
        </div>
      </section>

      {/* PENDING VERIFICATIONS ACCORDION */}
      <PendingVerifications />

      {/* 2. PLATFORM OVERVIEW TILES (CLICKABLE) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Platform Overview</h2>
            <p className="text-xs text-slate-500">All-time active network entities and total bookings</p>
          </div>
        </div>

        {/* Row 1: Network & Staff Entities */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <Link to="/admin/patients" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Total Patients" value={analytics.overview.totalPatients.toLocaleString()} icon={UserCircle} iconColor="text-blue-600" iconBg="bg-blue-50" subtitle="Registered users" />
          </Link>
          <Link to="/admin/hospitals" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Total Hospitals" value={analytics.overview.totalHospitals.toLocaleString()} icon={Building2} iconColor="text-purple-600" iconBg="bg-purple-50" subtitle={`${analytics.overview.verifiedHospitals} Verified`} />
          </Link>
          <Link to="/admin/labs" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Total Labs" value={analytics.overview.totalLabs.toLocaleString()} icon={TestTube} iconColor="text-teal-600" iconBg="bg-teal-50" subtitle="Diagnostic centers" />
          </Link>
          <Link to="/admin/doctors" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Total Doctors" value={analytics.overview.totalDoctors.toLocaleString()} icon={Stethoscope} iconColor="text-emerald-600" iconBg="bg-emerald-50" subtitle={`${analytics.overview.activeDoctors} Active`} />
          </Link>
          <Link to="/admin/services/home-nursing" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Total Nurses" value={analytics.overview.totalNurses.toLocaleString()} icon={HeartPulse} iconColor="text-rose-600" iconBg="bg-rose-50" subtitle="Registered staff" />
          </Link>
          <Link to="/admin/hospitals" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Total Receptionist" value={analytics.overview.totalReceptionists.toLocaleString()} icon={UserCheck} iconColor="text-amber-600" iconBg="bg-amber-50" subtitle="Front desk staff" />
          </Link>
        </div>

        {/* Row 2: Bookings, Services & Insurances */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <Link to="/admin/op-bookings" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Total OPs" value={analytics.overview.totalOpBookings.toLocaleString()} icon={CalendarCheck} iconColor="text-indigo-600" iconBg="bg-indigo-50" subtitle="Clinical visits" />
          </Link>
          <Link to="/admin/services/video-consultation" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Total Video Consultancies" value={analytics.overview.totalVideoConsultations.toLocaleString()} icon={Video} iconColor="text-sky-600" iconBg="bg-sky-50" subtitle="Virtual sessions" />
          </Link>
          <Link to="/admin/services/lab-tests" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Total Lab Tests" value={analytics.overview.totalLabOrders.toLocaleString()} icon={TestTube} iconColor="text-violet-600" iconBg="bg-violet-50" subtitle="Walk-in lab tests" />
          </Link>
          <Link to="/admin/services/home-sample-collection" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Total Home Sample Collections" value={analytics.overview.totalHomeSampleOrders.toLocaleString()} icon={Home} iconColor="text-cyan-600" iconBg="bg-cyan-50" subtitle="Doorstep collections" />
          </Link>
          <Link to="/admin/services/home-nursing" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Total Home Nursing" value={analytics.overview.totalHomeNursingRequests.toLocaleString()} icon={HeartHandshake} iconColor="text-rose-600" iconBg="bg-rose-50" subtitle="Attendant requests" />
          </Link>
          <Link to="/admin/reports" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Total Insurances" value={analytics.overview.totalInsurances.toLocaleString()} icon={Shield} iconColor="text-blue-600" iconBg="bg-blue-50" subtitle="Active plans" />
          </Link>
        </div>
      </section>

      {/* 3. END-TO-END SERVICE WORKFLOW LIFECYCLES */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Service Workflows & Lifecycle Analytics</h2>
          
          {/* Period Filter Tiles: Today, This Week, This Month, Custom */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => handlePeriodChange('today')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === 'today'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handlePeriodChange('this_week')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === 'this_week' || period === '7d' || period === 'week'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => handlePeriodChange('this_month')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === 'this_month' || period === 'month' || period === '30d'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => handlePeriodChange('custom')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                period === 'custom'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Calendar size={13} />
              Custom
            </button>
          </div>
        </div>

        {/* Custom Date Range Picker */}
        {showCustomDates && (
          <div className="flex flex-wrap items-center gap-3 p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
              <span>From:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleApplyCustomDates(); }}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
              <span>To:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleApplyCustomDates(); }}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
            </div>
            <button
              type="button"
              onClick={handleApplyCustomDates}
              disabled={!customStart || !customEnd}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
            >
              Apply Filter
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* SERVICE 1: OP BOOKINGS WORKFLOW */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Activity size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">OP Booking Workflow</h3>
                  </div>
                </div>
                <Link to="/admin/op-bookings" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  View all <ArrowRight size={13} />
                </Link>
              </div>

              {/* 4 Status Tiles: Total, Pending, Completed, Cancelled */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                <Link to="/admin/op-bookings" className="p-3 bg-slate-50 rounded-xl text-center hover:bg-slate-100 transition-colors">
                  <span className="text-xs text-slate-500 font-medium block">Total</span>
                  <span className="text-lg font-bold text-slate-900">{analytics.services.op.total}</span>
                </Link>
                <Link to="/admin/op-bookings?status=WAITING" className="p-3 bg-amber-50 rounded-xl text-center hover:bg-amber-100 transition-colors">
                  <span className="text-xs text-amber-600 font-medium block">Pending</span>
                  <span className="text-lg font-bold text-amber-700">
                    {Math.max(0, (analytics.services.op.total || 0) - (analytics.services.op.completed || 0) - (analytics.services.op.cancelled || 0))}
                  </span>
                </Link>
                <Link to="/admin/op-bookings?status=COMPLETED" className="p-3 bg-emerald-50 rounded-xl text-center hover:bg-emerald-100 transition-colors">
                  <span className="text-xs text-emerald-600 font-medium block">Completed</span>
                  <span className="text-lg font-bold text-emerald-700">{analytics.services.op.completed}</span>
                </Link>
                <Link to="/admin/op-bookings?status=CANCELLED" className="p-3 bg-rose-50 rounded-xl text-center hover:bg-rose-100 transition-colors">
                  <span className="text-xs text-rose-600 font-medium block">Cancelled</span>
                  <span className="text-lg font-bold text-rose-700">{analytics.services.op.cancelled}</span>
                </Link>
              </div>
            </div>

            {/* Micro pie chart */}
            {(analytics.services.op.statusDistribution || []).filter((d: any) => d.value > 0).length > 0 ? (
              <div className="h-32 mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={(analytics.services.op.statusDistribution || []).filter((d: any) => d.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={28} outerRadius={48} paddingAngle={2}>
                      {(analytics.services.op.statusDistribution || []).filter((d: any) => d.value > 0).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || PIE_PALETTE[index % PIE_PALETTE.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-28 mt-2 flex flex-col items-center justify-center text-slate-400 text-xs bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                <Activity size={22} className="text-slate-300 mb-1" />
                <span>No OP bookings in this period</span>
              </div>
            )}
          </div>

          {/* SERVICE 2: VIDEO CONSULTATION WORKFLOW */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                    <Video size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Video Consultation Workflow</h3>
                  </div>
                </div>
                <Link to="/admin/services/video-consultation" className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1">
                  View sessions <ArrowRight size={13} />
                </Link>
              </div>

              {/* 4 Status Tiles: Total, Pending, Completed, Cancelled */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                <Link to="/admin/services/video-consultation" className="p-3 bg-slate-50 rounded-xl text-center hover:bg-slate-100 transition-colors">
                  <span className="text-xs text-slate-500 font-medium block">Total</span>
                  <span className="text-lg font-bold text-slate-900">{analytics.services.video.total}</span>
                </Link>
                <Link to="/admin/services/video-consultation?status=SCHEDULED" className="p-3 bg-amber-50 rounded-xl text-center hover:bg-amber-100 transition-colors">
                  <span className="text-xs text-amber-600 font-medium block">Pending</span>
                  <span className="text-lg font-bold text-amber-700">
                    {Math.max(0, (analytics.services.video.total || 0) - (analytics.services.video.completed || 0) - (analytics.services.video.cancelled || 0))}
                  </span>
                </Link>
                <Link to="/admin/services/video-consultation?status=COMPLETED" className="p-3 bg-emerald-50 rounded-xl text-center hover:bg-emerald-100 transition-colors">
                  <span className="text-xs text-emerald-600 font-medium block">Completed</span>
                  <span className="text-lg font-bold text-emerald-700">{analytics.services.video.completed}</span>
                </Link>
                <Link to="/admin/services/video-consultation?status=CANCELLED" className="p-3 bg-rose-50 rounded-xl text-center hover:bg-rose-100 transition-colors">
                  <span className="text-xs text-rose-600 font-medium block">Cancelled</span>
                  <span className="text-lg font-bold text-rose-700">{analytics.services.video.cancelled}</span>
                </Link>
              </div>
            </div>

            {/* Micro pie chart */}
            {(analytics.services.video.statusDistribution || []).filter((d: any) => d.value > 0).length > 0 ? (
              <div className="h-32 mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={(analytics.services.video.statusDistribution || []).filter((d: any) => d.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={28} outerRadius={48} paddingAngle={2}>
                      {(analytics.services.video.statusDistribution || []).filter((d: any) => d.value > 0).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || PIE_PALETTE[index % PIE_PALETTE.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-28 mt-2 flex flex-col items-center justify-center text-slate-400 text-xs bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                <Video size={22} className="text-slate-300 mb-1" />
                <span>No video consultations in this period</span>
              </div>
            )}
          </div>

          {/* SERVICE 3: LAB VISIT (WALK-IN) WORKFLOW */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                    <TestTube size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Lab Visit Workflow (Walk-in)</h3>
                  </div>
                </div>
                <Link to="/admin/services/lab-tests?bookingType=WALK_IN" className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1">
                  View orders <ArrowRight size={13} />
                </Link>
              </div>

              {/* 4 Status Tiles: Total, Pending, Completed, Cancelled */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                <Link to="/admin/services/lab-tests?bookingType=WALK_IN" className="p-3 bg-slate-50 rounded-xl text-center hover:bg-slate-100 transition-colors">
                  <span className="text-xs text-slate-500 font-medium block">Total</span>
                  <span className="text-lg font-bold text-slate-900">{analytics.services.labVisit.total}</span>
                </Link>
                <Link to="/admin/services/lab-tests?bookingType=WALK_IN&status=PENDING" className="p-3 bg-amber-50 rounded-xl text-center hover:bg-amber-100 transition-colors">
                  <span className="text-xs text-amber-600 font-medium block">Pending</span>
                  <span className="text-lg font-bold text-amber-700">
                    {Math.max(0, (analytics.services.labVisit.total || 0) - ((analytics.services.labVisit.reportReady || 0) + (analytics.services.labVisit.completed || 0)) - (analytics.services.labVisit.cancelled || 0))}
                  </span>
                </Link>
                <Link to="/admin/services/lab-tests?bookingType=WALK_IN&status=REPORT_READY" className="p-3 bg-emerald-50 rounded-xl text-center hover:bg-emerald-100 transition-colors">
                  <span className="text-xs text-emerald-600 font-medium block">Completed</span>
                  <span className="text-lg font-bold text-emerald-700">
                    {(analytics.services.labVisit.reportReady || 0) + (analytics.services.labVisit.completed || 0)}
                  </span>
                </Link>
                <Link to="/admin/services/lab-tests?bookingType=WALK_IN&status=CANCELLED" className="p-3 bg-rose-50 rounded-xl text-center hover:bg-rose-100 transition-colors">
                  <span className="text-xs text-rose-600 font-medium block">Cancelled</span>
                  <span className="text-lg font-bold text-rose-700">{analytics.services.labVisit.cancelled}</span>
                </Link>
              </div>
            </div>

            {/* Micro pie chart */}
            {(analytics.services.labVisit.statusDistribution || []).filter((d: any) => d.value > 0).length > 0 ? (
              <div className="h-32 mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={(analytics.services.labVisit.statusDistribution || []).filter((d: any) => d.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={28} outerRadius={48} paddingAngle={2}>
                      {(analytics.services.labVisit.statusDistribution || []).filter((d: any) => d.value > 0).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || PIE_PALETTE[index % PIE_PALETTE.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-28 mt-2 flex flex-col items-center justify-center text-slate-400 text-xs bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                <TestTube size={22} className="text-slate-300 mb-1" />
                <span>No walk-in lab orders in this period</span>
              </div>
            )}
          </div>

          {/* SERVICE 4: HOME SAMPLE COLLECTION WORKFLOW */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
                    <Home size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Home Sample Collection Workflow</h3>
                  </div>
                </div>
                <Link to="/admin/services/home-sample-collection" className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 flex items-center gap-1">
                  View requests <ArrowRight size={13} />
                </Link>
              </div>

              {/* 4 Status Tiles: Total, Pending, Completed, Cancelled */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                <Link to="/admin/services/home-sample-collection" className="p-3 bg-slate-50 rounded-xl text-center hover:bg-slate-100 transition-colors">
                  <span className="text-xs text-slate-500 font-medium block">Total</span>
                  <span className="text-lg font-bold text-slate-900">{analytics.services.homeSample.total}</span>
                </Link>
                <Link to="/admin/services/home-sample-collection?status=REQUESTED" className="p-3 bg-amber-50 rounded-xl text-center hover:bg-amber-100 transition-colors">
                  <span className="text-xs text-amber-600 font-medium block">Pending</span>
                  <span className="text-lg font-bold text-amber-700">
                    {Math.max(0, (analytics.services.homeSample.total || 0) - ((analytics.services.homeSample.reportReady || 0) + (analytics.services.homeSample.completed || 0)) - (analytics.services.homeSample.cancelled || 0))}
                  </span>
                </Link>
                <Link to="/admin/services/home-sample-collection?status=REPORT_READY" className="p-3 bg-emerald-50 rounded-xl text-center hover:bg-emerald-100 transition-colors">
                  <span className="text-xs text-emerald-600 font-medium block">Completed</span>
                  <span className="text-lg font-bold text-emerald-700">
                    {(analytics.services.homeSample.reportReady || 0) + (analytics.services.homeSample.completed || 0)}
                  </span>
                </Link>
                <Link to="/admin/services/home-sample-collection?status=CANCELLED" className="p-3 bg-rose-50 rounded-xl text-center hover:bg-rose-100 transition-colors">
                  <span className="text-xs text-rose-600 font-medium block">Cancelled</span>
                  <span className="text-lg font-bold text-rose-700">{analytics.services.homeSample.cancelled}</span>
                </Link>
              </div>
            </div>

            {/* Micro pie chart */}
            {(analytics.services.homeSample.statusDistribution || []).filter((d: any) => d.value > 0).length > 0 ? (
              <div className="h-32 mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={(analytics.services.homeSample.statusDistribution || []).filter((d: any) => d.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={28} outerRadius={48} paddingAngle={2}>
                      {(analytics.services.homeSample.statusDistribution || []).filter((d: any) => d.value > 0).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || PIE_PALETTE[index % PIE_PALETTE.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-28 mt-2 flex flex-col items-center justify-center text-slate-400 text-xs bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                <Home size={22} className="text-slate-300 mb-1" />
                <span>No home sample orders in this period</span>
              </div>
            )}
          </div>

          {/* SERVICE 5: HOME NURSING WORKFLOW */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between lg:col-span-2">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                    <HeartHandshake size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Home Nursing Workflow</h3>
                  </div>
                </div>
                <Link to="/admin/services/home-nursing" className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1">
                  View assignments <ArrowRight size={13} />
                </Link>
              </div>

              {/* 4 Status Tiles: Total, Pending, Completed, Cancelled */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                <Link to="/admin/services/home-nursing" className="p-3 bg-slate-50 rounded-xl text-center hover:bg-slate-100 transition-colors">
                  <span className="text-xs text-slate-500 font-medium block">Total</span>
                  <span className="text-lg font-bold text-slate-900">{analytics.services.homeNursing.total}</span>
                </Link>
                <Link to="/admin/services/home-nursing?status=CONFIRMED" className="p-3 bg-amber-50 rounded-xl text-center hover:bg-amber-100 transition-colors">
                  <span className="text-xs text-amber-600 font-medium block">Pending</span>
                  <span className="text-lg font-bold text-amber-700">
                    {Math.max(0, (analytics.services.homeNursing.total || 0) - (analytics.services.homeNursing.completed || 0) - (analytics.services.homeNursing.cancelled || 0))}
                  </span>
                </Link>
                <Link to="/admin/services/home-nursing?status=COMPLETED" className="p-3 bg-emerald-50 rounded-xl text-center hover:bg-emerald-100 transition-colors">
                  <span className="text-xs text-emerald-600 font-medium block">Completed</span>
                  <span className="text-lg font-bold text-emerald-700">{analytics.services.homeNursing.completed}</span>
                </Link>
                <Link to="/admin/services/home-nursing?status=CANCELLED" className="p-3 bg-rose-50 rounded-xl text-center hover:bg-rose-100 transition-colors">
                  <span className="text-xs text-rose-600 font-medium block">Cancelled</span>
                  <span className="text-lg font-bold text-rose-700">{analytics.services.homeNursing.cancelled}</span>
                </Link>
              </div>
            </div>

            {/* Donut pie chart */}
            {(analytics.services.homeNursing.statusDistribution || []).filter((d: any) => d.value > 0).length > 0 ? (
              <div className="h-36 mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={(analytics.services.homeNursing.statusDistribution || []).filter((d: any) => d.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={52}
                      paddingAngle={2}
                    >
                      {(analytics.services.homeNursing.statusDistribution || []).filter((d: any) => d.value > 0).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || PIE_PALETTE[index % PIE_PALETTE.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-28 mt-2 flex flex-col items-center justify-center text-slate-400 text-xs bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                <HeartHandshake size={22} className="text-slate-300 mb-1" />
                <span>No home nursing bookings in this period</span>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* 4. REVENUE & COMMISSION ANALYTICS */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Revenue, Commissions & Reconciliation</h2>
          <p className="text-xs text-slate-500">Reconciled financial data based on hospital revenue shares and platform commissions</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link to="/admin/transactions" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Gross Volume" value={formatCurrency(analytics.financial.grossRevenue, true)} icon={IndianRupee} iconColor="text-emerald-600" iconBg="bg-emerald-50" subtitle="Platform gross booking fee" />
          </Link>
          <Link to="/admin/transactions" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Platform Commission" value={formatCurrency(analytics.financial.adminCommission, true)} icon={TrendingUp} iconColor="text-blue-600" iconBg="bg-blue-50" subtitle="MediQuee net share" />
          </Link>
          <Link to="/admin/settlements" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Provider Share" value={formatCurrency(analytics.financial.providerShare, true)} icon={Landmark} iconColor="text-purple-600" iconBg="bg-purple-50" subtitle="Payable to hospitals & labs" />
          </Link>
          <Link to="/admin/transactions" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Transactions" value={analytics.financial.transactions.toLocaleString()} icon={CreditCard} iconColor="text-slate-600" iconBg="bg-slate-100" subtitle="Bookings & orders processed" />
          </Link>
          <Link to="/admin/settlements?status=pending" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Pending Settlements" value={formatCurrency(analytics.financial.pendingSettlements, true)} icon={AlertCircle} iconColor="text-amber-600" iconBg="bg-amber-50" subtitle="Unsettled provider balances" />
          </Link>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend Over Time */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Revenue Progression Over Time</h3>
              <span className="text-xs text-slate-400 font-medium">{period} aggregation</span>
            </div>
            <div className="h-72">
              {analytics.financial.revenueTrend?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.financial.revenueTrend} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorAdmin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorProvider" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#1e293b', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any) => formatCurrency(value)}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Area type="monotone" dataKey="gross" name="Gross Revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorGross)" strokeWidth={2} />
                    <Area type="monotone" dataKey="provider" name="Provider Share" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorProvider)" strokeWidth={2} />
                    <Area type="monotone" dataKey="admin" name="Admin Commission" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAdmin)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-slate-400">No revenue events recorded in this period</div>
              )}
            </div>
          </div>

          {/* Revenue Breakdown by Service (Bar Chart) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Financial Breakdown by Service</h3>
              <span className="text-xs text-slate-400 font-medium">Reconciled shares</span>
            </div>
            <div className="h-72">
              {analytics.financial.revenueByService?.some(s => s.gross > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.financial.revenueByService} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={120} />
                    <RechartsTooltip 
                      cursor={{ fill: '#f8fafc' }}
                      formatter={(value: any) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="provider" name="Provider Share" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="admin" name="Admin Commission" stackId="a" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-slate-400">No service revenue recorded in selected range</div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Service Financial Reconciliation Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Reconciled Service Ledger</h3>
            <span className="text-xs text-slate-400">Source: Real booking fee aggregates</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Healthcare Service</th>
                  <th className="px-6 py-3.5 text-right">Transactions</th>
                  <th className="px-6 py-3.5 text-right">Gross Booking Volume</th>
                  <th className="px-6 py-3.5 text-right text-blue-700">Admin Commission (Net)</th>
                  <th className="px-6 py-3.5 text-right text-purple-700">Provider Share (Payable)</th>
                  <th className="px-6 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analytics.financial.revenueByService?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{item.name}</td>
                    <td className="px-6 py-4 text-right">{item.transactions}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">{formatCurrency(item.gross)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-blue-700">{formatCurrency(item.admin)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-purple-700">{formatCurrency(item.provider)}</td>
                    <td className="px-6 py-4 text-center">
                      <Link 
                        to={`/admin/transactions?service=${encodeURIComponent(item.name)}`}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Ledger →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. DEPARTMENT & DOCTOR PERFORMANCE DISTRIBUTION */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Performance & Clinical Trends</h2>
          <p className="text-xs text-slate-500">Appointment distributions by medical department and healthcare provider</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department Distribution */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Bookings by Specialty / Department</h3>
              <Link to="/admin/departments" className="text-xs font-semibold text-blue-600 hover:underline">Manage</Link>
            </div>
            <div className="h-64">
              {analytics.departmentDistribution?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.departmentDistribution} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }} />
                    <Bar dataKey="count" name="Appointments" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-slate-400">No department booking records</div>
              )}
            </div>
          </div>

          {/* Top Doctors by Booking Count */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Top Doctors by Consultation Volume</h3>
              <Link to="/admin/doctors" className="text-xs font-semibold text-blue-600 hover:underline">View Doctors</Link>
            </div>
            <div className="h-64">
              {analytics.doctorDistribution?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.doctorDistribution} layout="vertical" margin={{ top: 5, right: 15, left: 30, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={110} />
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }} />
                    <Bar dataKey="count" name="Appointments" fill="#10b981" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-slate-400">No doctor booking records</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 6. RECENT PLATFORM ACTIVITY FEED */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Recent Platform Activity</h2>
            <p className="text-xs text-slate-500">Live feed of incoming bookings and workflow stage updates</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {analytics.recentActivity?.length > 0 ? (
            analytics.recentActivity.map((act) => (
              <div key={act.id} className="p-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    act.service.includes('OP') ? 'bg-blue-50 text-blue-600' :
                    act.service.includes('Video') ? 'bg-sky-50 text-sky-600' :
                    act.service.includes('Lab') ? 'bg-purple-50 text-purple-600' :
                    act.service.includes('Sample') ? 'bg-cyan-50 text-cyan-600' :
                    'bg-rose-50 text-rose-600'
                  }`}>
                    {act.service.includes('OP') ? <Activity size={18} /> :
                     act.service.includes('Video') ? <Video size={18} /> :
                     act.service.includes('Lab') ? <TestTube size={18} /> :
                     act.service.includes('Sample') ? <Home size={18} /> :
                     <HeartHandshake size={18} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{act.title}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="font-medium text-slate-700">{act.hospital}</span>
                      <span>•</span>
                      <span>{new Date(act.timestamp).toLocaleDateString()} at {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900 block">{formatCurrency(act.amount)}</span>
                    <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider bg-slate-100 text-slate-700">
                      {act.status}
                    </span>
                  </div>
                  <Link 
                    to={act.link}
                    className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-slate-400">
              No recent activity recorded yet
            </div>
          )}
        </div>
      </section>

      {/* 7. TOP HOSPITALS BY VOLUME */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Top Hospital Partners by Revenue</h2>
          <Link to="/admin/hospitals" className="text-xs font-semibold text-blue-600 hover:underline">All Hospitals</Link>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3.5 w-16 text-center">Rank</th>
                  <th className="px-6 py-3.5">Hospital Name</th>
                  <th className="px-6 py-3.5 text-right">Transactions</th>
                  <th className="px-6 py-3.5 text-right">Gross Booking Volume</th>
                  <th className="px-6 py-3.5 text-right text-blue-700 font-semibold">Platform Commission</th>
                  <th className="px-6 py-3.5 text-right text-purple-700 font-semibold">Hospital Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analytics.financial.topHospitals?.length > 0 ? (
                  analytics.financial.topHospitals.map((hosp, idx) => (
                    <tr key={hosp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 text-center font-bold text-slate-400">#{idx + 1}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        <Link to={`/admin/hospitals/${hosp.id}`} className="hover:text-blue-600 hover:underline">
                          {hosp.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">{hosp.transactions}</td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-900">{formatCurrency(hosp.gross)}</td>
                      <td className="px-6 py-4 text-right font-semibold text-blue-700">{formatCurrency(hosp.admin)}</td>
                      <td className="px-6 py-4 text-right font-semibold text-purple-700">{formatCurrency(hosp.provider)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">No hospital billing activity in this period</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Dashboard;
