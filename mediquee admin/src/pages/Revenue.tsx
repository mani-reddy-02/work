import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Building2, 
  Activity, 
  DollarSign, 
  ExternalLink, 
  X, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight,
  User,
  Calendar,
  Clock,
  ShieldCheck,
  Receipt,
  Phone,
  BarChart3
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import KpiCard from '../components/ui/KpiCard';
import DataTable, { Column } from '../components/ui/DataTable';
import DateRangeFilter, { DateRangePreset } from '../components/ui/DateRangeFilter';
import StatusBadge from '../components/ui/StatusBadge';
import { useAdminAuth } from '../contexts/AuthContext';
import { financeService } from '../services/financeService';
import { formatCurrency } from '../utils/finance';

const SERVICE_COLORS: Record<string, string> = {
  'OP Bookings': '#3B82F6',
  'Video Consultations': '#0284C7',
  'Lab Tests': '#8B5CF6',
  'Home Sample Collection': '#0D9488',
  'Home Nursing': '#F43F5E'
};

const Revenue: React.FC = () => {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>({ 
    kpis: {}, 
    revenueByHospital: [], 
    revenueByService: [], 
    items: [] 
  });
  const [loading, setLoading] = useState(true);

  // Date Filter State
  const [dateRange, setDateRange] = useState<{ preset: DateRangePreset; startDate?: string; endDate?: string }>({
    preset: 'all'
  });

  // Selected item for the inspectable side drawer / modal
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await financeService.getRevenueAnalytics(token, {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token, dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const kpis = data.kpis || {};
  const hasData = (kpis.totalTransactions || 0) > 0;

  // Prepare Hospital Chart Data (top 7 hospitals by gross revenue)
  const hospitalChartData = (data.revenueByHospital || []).slice(0, 7).map((h: any) => ({
    name: h.hospitalName.length > 16 ? `${h.hospitalName.substring(0, 14)}...` : h.hospitalName,
    fullName: h.hospitalName,
    Gross: h.gross,
    Hospital: h.hospital,
    Commission: h.mediquee,
    count: h.count
  }));

  // Prepare Service Chart Data
  const serviceChartData = (data.revenueByService || [])
    .filter((s: any) => (s.gross > 0 || s.count > 0))
    .map((s: any) => ({
      name: s.name,
      gross: s.gross,
      hospital: s.hospital,
      mediquee: s.mediquee,
      count: s.count,
      fill: SERVICE_COLORS[s.name] || '#64748B'
    }));

  const hospitalColumns: Column<any>[] = [
    { 
      header: 'Hospital / Facility Name', 
      accessor: (h) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900">{h.hospitalName}</span>
          <span className="text-xs text-slate-400">{h.count} completed bookings</span>
        </div>
      )
    },
    { header: 'Gross Revenue', accessor: (h) => <span className="font-semibold text-slate-900">{formatCurrency(h.gross)}</span> },
    { 
      header: 'Hospital Earnings', 
      accessor: (h) => (
        <span className="font-medium text-emerald-600 flex items-center gap-1">
          <ArrowDownRight size={14} />
          {formatCurrency(h.hospital)}
        </span>
      ) 
    },
    { 
      header: 'MediQuee Commission', 
      accessor: (h) => (
        <span className="font-medium text-blue-600 flex items-center gap-1">
          <ArrowUpRight size={14} />
          {formatCurrency(h.mediquee)}
        </span>
      ) 
    },
    { 
      header: 'Actions', 
      accessor: (h) => {
        const firstMatching = (data.items || []).find((it: any) => it.hospitalName === h.hospitalName);
        return (
          <button
            onClick={() => setSelectedItem(firstMatching || {
              bookingId: 'AGGREGATED',
              serviceType: 'Aggregated Provider Revenue',
              hospitalName: h.hospitalName,
              patientName: 'Multiple Patients',
              grossAmount: h.gross,
              hospitalAmount: h.hospital,
              hospitalSharePercentage: Math.round((h.hospital / (h.gross || 1)) * 100),
              mediqueeAmount: h.mediquee,
              mediqueeCommissionPercentage: Math.round((h.mediquee / (h.gross || 1)) * 100),
              date: new Date(),
              status: 'Completed',
              settlementStatus: 'In Cycle'
            })}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Inspect
          </button>
        );
      },
      className: 'text-right'
    }
  ];

  const serviceColumns: Column<any>[] = [
    { 
      header: 'Service Type', 
      accessor: (s) => (
        <div className="flex items-center gap-2">
          <span 
            className="w-2.5 h-2.5 rounded-full" 
            style={{ backgroundColor: SERVICE_COLORS[s.name] || '#64748B' }} 
          />
          <span className="font-semibold text-slate-900">{s.name}</span>
        </div>
      ) 
    },
    { header: 'Transactions', accessor: (s) => <span className="text-slate-700 font-medium">{s.count}</span> },
    { header: 'Gross Revenue', accessor: (s) => <span className="font-semibold text-slate-900">{formatCurrency(s.gross)}</span> },
    { header: 'Provider Earnings', accessor: (s) => <span className="font-medium text-emerald-600">{formatCurrency(s.hospital)}</span> },
    { header: 'Platform Commission', accessor: (s) => <span className="font-medium text-blue-600">{formatCurrency(s.mediquee)}</span> },
    { 
      header: 'Actions', 
      accessor: (s) => {
        const firstMatching = (data.items || []).find((it: any) => it.serviceType === s.name);
        return (
          <button
            onClick={() => setSelectedItem(firstMatching || {
              bookingId: 'AGGREGATED',
              serviceType: s.name,
              hospitalName: 'Multiple Facilities',
              patientName: 'Multiple Patients',
              grossAmount: s.gross,
              hospitalAmount: s.hospital,
              hospitalSharePercentage: Math.round((s.hospital / (s.gross || 1)) * 100),
              mediqueeAmount: s.mediquee,
              mediqueeCommissionPercentage: Math.round((s.mediquee / (s.gross || 1)) * 100),
              date: new Date(),
              status: 'Completed',
              settlementStatus: 'In Cycle'
            })}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Inspect
          </button>
        );
      },
      className: 'text-right'
    }
  ];

  const itemColumns: Column<any>[] = [
    {
      header: 'Ref / TX ID',
      accessor: (it) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs font-bold text-blue-600">TX-{it.bookingId}</span>
          <span className="text-[11px] text-slate-400">{new Date(it.date).toLocaleDateString()}</span>
        </div>
      )
    },
    {
      header: 'Service',
      accessor: (it) => (
        <div className="flex items-center gap-1.5">
          <span 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: SERVICE_COLORS[it.serviceType] || '#64748B' }} 
          />
          <span className="text-xs font-medium text-slate-900">{it.serviceType}</span>
        </div>
      )
    },
    {
      header: 'Hospital / Partner',
      accessor: (it) => <span className="text-xs font-medium text-slate-800">{it.hospitalName}</span>
    },
    {
      header: 'Patient',
      accessor: (it) => <span className="text-xs text-slate-700">{it.patientName}</span>
    },
    {
      header: 'Gross Amount',
      accessor: (it) => <span className="text-xs font-semibold text-slate-900">{formatCurrency(it.grossAmount)}</span>
    },
    {
      header: 'Commission',
      accessor: (it) => (
        <span className="text-xs font-medium text-blue-600">
          {formatCurrency(it.mediqueeAmount)} ({it.mediqueeCommissionPercentage}%)
        </span>
      )
    },
    {
      header: 'Provider Share',
      accessor: (it) => (
        <span className="text-xs font-medium text-emerald-600">
          {formatCurrency(it.hospitalAmount)} ({it.hospitalSharePercentage}%)
        </span>
      )
    },
    {
      header: 'Status',
      accessor: (it) => <StatusBadge status={it.status} />
    },
    {
      header: 'Actions',
      accessor: (it) => (
        <div className="flex items-center gap-2">
          {it.directBookingUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(it.directBookingUrl);
              }}
              className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
              title="View Booking Record"
            >
              <ExternalLink size={12} />
              Booking
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedItem(it);
            }}
            className="px-2 py-1 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Inspect
          </button>
        </div>
      ),
      className: 'text-right'
    }
  ];

  return (
    <div className="space-y-6 relative pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Revenue</h2>
          <p className="text-sm text-slate-500">Aggregated financial performance across all hospitals and services.</p>
        </div>

        {/* Date Filter Component */}
        <DateRangeFilter
          preset={dateRange.preset}
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onChange={(newRange: any) => setDateRange(newRange)}
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Gross Revenue" 
          value={formatCurrency(kpis.grossRevenue || 0)} 
          subtitle="Total patient booking fees"
          icon={DollarSign} 
        />
        <KpiCard 
          title="Hospital Share" 
          value={formatCurrency(kpis.hospitalShare || 0)} 
          subtitle="Payable to partner facilities"
          icon={Building2} 
          iconColor="text-emerald-600" 
          iconBg="bg-emerald-50" 
        />
        <KpiCard 
          title="MediQuee Commission" 
          value={formatCurrency(kpis.mediqueeCommission || 0)} 
          subtitle="Platform retained revenue"
          icon={Activity} 
          iconColor="text-blue-600" 
          iconBg="bg-blue-50" 
        />
        <KpiCard 
          title="Total Transactions" 
          value={kpis.totalTransactions || 0} 
          subtitle={`Avg ${formatCurrency(kpis.averageTransaction || 0)} / order`}
          icon={TrendingUp} 
          iconColor="text-purple-600" 
          iconBg="bg-purple-50" 
        />
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading authoritative revenue metrics...
        </div>
      ) : !hasData ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <p className="text-slate-500">No revenue data recorded for the selected period.</p>
        </div>
      ) : (
        <>
          {/* Charts Section: Hospital Revenue Bar Chart & Service-Wise Graph */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hospital Revenue Graph */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Hospital Revenue Distribution</h3>
                    <p className="text-xs text-slate-500">Gross revenue & provider earnings by facility</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
                    Top Facilities
                  </span>
                </div>
                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hospitalChartData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 11, fill: '#64748B' }} 
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                      />
                      <Tooltip 
                        formatter={(val: any, name: any) => [formatCurrency(val), name === 'Gross' ? 'Gross Revenue' : name === 'Hospital' ? 'Hospital Share' : 'MediQuee Cut']}
                        labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
                        contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Bar dataKey="Gross" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Gross Revenue" />
                      <Bar dataKey="Hospital" fill="#10B981" radius={[4, 4, 0, 0]} name="Hospital Share" />
                      <Bar dataKey="Commission" fill="#6366F1" radius={[4, 4, 0, 0]} name="Platform Cut" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Service-Wise Revenue Graph */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Service-Wise Revenue Breakdown</h3>
                    <p className="text-xs text-slate-500">OP, Video Consults, Lab Tests, Home Collections, Nursing</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md">
                    All 5 Services
                  </span>
                </div>
                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={serviceChartData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 10, fill: '#64748B' }} 
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                      />
                      <Tooltip 
                        formatter={(val: any) => [formatCurrency(val), 'Gross Revenue']}
                        contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px' }}
                      />
                      <Bar dataKey="gross" radius={[6, 6, 0, 0]}>
                        {serviceChartData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue by Hospital Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Revenue by Hospital & Facility</h3>
                <p className="text-xs text-slate-500">Live aggregated earnings & commission breakdown per provider</p>
              </div>
            </div>
            <DataTable 
              data={data.revenueByHospital}
              columns={hospitalColumns}
              keyExtractor={(h) => h.hospitalName}
              searchPlaceholder="Search facility..."
            />
          </div>

          {/* Revenue by Service Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Revenue by Service Category</h3>
                <p className="text-xs text-slate-500">Authoritative platform breakdown across distinct clinical offerings</p>
              </div>
            </div>
            <DataTable 
              data={data.revenueByService}
              columns={serviceColumns}
              keyExtractor={(s) => s.name}
            />
          </div>

          {/* Individual Inspectable Revenue Records */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Detailed Revenue Records</h3>
                <p className="text-xs text-slate-500">Click any transaction to inspect commissions, payout shares, and direct booking links</p>
              </div>
            </div>
            <DataTable 
              data={data.items || []}
              columns={itemColumns}
              keyExtractor={(it) => it.id}
              searchPlaceholder="Filter records by ID, facility, patient..."
              onRowClick={(it) => setSelectedItem(it)}
            />
          </div>
        </>
      )}

      {/* Inspectable Side Drawer / Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" 
            onClick={() => setSelectedItem(null)} 
          />
          <div className="relative w-full max-w-xl bg-white shadow-2xl z-10 flex flex-col h-full overflow-y-auto border-l border-slate-200 animate-slideLeft">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 sticky top-0 backdrop-blur-xs z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <Receipt size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    Revenue Inspection
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    TX-{selectedItem.bookingId} • {selectedItem.serviceType}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6">
              {/* Financial Highlight Box */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-md">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                  Gross Booking Value
                </span>
                <div className="text-3xl font-extrabold tracking-tight mb-4">
                  {formatCurrency(selectedItem.grossAmount)}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700/60">
                  <div>
                    <span className="text-[11px] text-emerald-400 font-medium block">
                      Provider Share ({selectedItem.hospitalSharePercentage}%)
                    </span>
                    <span className="text-lg font-bold text-white">
                      {formatCurrency(selectedItem.hospitalAmount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-blue-400 font-medium block">
                      MediQuee Cut ({selectedItem.mediqueeCommissionPercentage}%)
                    </span>
                    <span className="text-lg font-bold text-white">
                      {formatCurrency(selectedItem.mediqueeAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct Booking Navigation */}
              {selectedItem.directBookingUrl && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-blue-900">Underlying Booking Record</h4>
                    <p className="text-[11px] text-blue-700 mt-0.5">Inspect full clinical details and patient notes in read-only mode.</p>
                  </div>
                  <button
                    onClick={() => {
                      navigate(selectedItem.directBookingUrl);
                      setSelectedItem(null);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    View Booking
                    <ExternalLink size={13} />
                  </button>
                </div>
              )}

              {/* General Metadata */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Record Metadata
                </h4>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Transaction ID</span>
                    <span className="font-mono font-medium text-slate-800">TX-{selectedItem.bookingId}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Service Category</span>
                    <span className="font-semibold text-slate-800">{selectedItem.serviceType}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Partner / Facility</span>
                    <span className="font-semibold text-slate-800">{selectedItem.hospitalName}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Patient Details</span>
                    <span className="font-medium text-slate-800">
                      {selectedItem.patientName} {selectedItem.patientPhone ? `(${selectedItem.patientPhone})` : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Recorded Timestamp</span>
                    <span className="font-medium text-slate-800">
                      {new Date(selectedItem.date).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Booking Status</span>
                    <StatusBadge status={selectedItem.status} />
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Settlement Status</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 text-[11px]">
                      <Clock size={11} /> {selectedItem.settlementStatus || 'Pending Settlement'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Commission Calculation Breakdown */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Commission Reconciliation Breakdown
                </h4>
                <div className="border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Total Booking Gross Basis</span>
                    <span className="font-mono font-medium text-slate-900">{formatCurrency(selectedItem.grossAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-blue-600">
                    <span>MediQuee Commission Rate</span>
                    <span className="font-mono font-bold">{selectedItem.mediqueeCommissionPercentage}%</span>
                  </div>
                  <div className="flex justify-between items-center text-blue-700 font-medium pb-2 border-b border-slate-100">
                    <span>MediQuee Fee Retained</span>
                    <span className="font-mono font-bold">{formatCurrency(selectedItem.mediqueeAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-600">
                    <span>Provider Contract Share Rate</span>
                    <span className="font-mono font-bold">{selectedItem.hospitalSharePercentage}%</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-700 font-medium pb-2 border-b border-slate-100">
                    <span>Net Payable to Hospital</span>
                    <span className="font-mono font-bold">{formatCurrency(selectedItem.hospitalAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 font-semibold text-slate-800">
                    <span>Reconciled Total</span>
                    <span className="font-mono text-sm">{formatCurrency((selectedItem.hospitalAmount || 0) + (selectedItem.mediqueeAmount || 0))}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200"
                >
                  Close Drawer
                </button>
                {selectedItem.directBookingUrl && (
                  <button
                    onClick={() => {
                      navigate(selectedItem.directBookingUrl);
                      setSelectedItem(null);
                    }}
                    className="flex-1 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors inline-flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    View Booking
                    <ExternalLink size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Revenue;
