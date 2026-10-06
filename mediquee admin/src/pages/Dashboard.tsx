import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, UserCircle, Stethoscope, Building2, TestTube, HeartHandshake,
  CalendarCheck, Activity, Video, Home, CreditCard, Landmark, 
  ShieldAlert, AlertCircle, CheckCircle2, IndianRupee, TrendingUp, Network, Clock
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import KpiCard from '../components/ui/KpiCard';
import PendingVerifications from '../components/admin/PendingVerifications';
import { adminService } from '../services/adminService';
import { formatCurrency } from '../utils/finance';
import { useAdminAuth } from '../contexts/AuthContext';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#64748b'];
const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  WAITING: '#3b82f6',
  IN_CONSULTATION: '#8b5cf6',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
  NO_SHOW: '#64748b'
};

const Dashboard: React.FC = () => {
  const { token } = useAdminAuth();
  const [period, setPeriod] = useState('30d');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [kpis, setKpis] = useState({
    totalPatients: 0, totalDoctors: 0, totalHospitals: 0, totalDepartments: 0,
    activeDoctors: 0, verifiedHospitals: 0, pendingVerifications: 0, totalAppointments: 0,
    grossRevenue: 0, adminCommission: 0, providerShare: 0, transactions: 0, pendingSettlements: 0,
    revenueTrend: [] as any[], 
    revenueByService: [] as any[],
    revenueByHospital: [] as any[],
    topHospitals: [] as any[],
    appointmentStatuses: [] as any[],
    appointmentTrend: [] as any[]
  });

  const fetchStats = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getAdminDashboardStats(token, period, serviceFilter);
      if (res.success && res.data) {
        setKpis((prev) => ({
          ...prev,
          ...res.data
        }));
      } else {
        setError('Failed to load analytics data.');
      }
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
      setError('An error occurred while fetching analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token, period, serviceFilter]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-slate-200 shadow-sm">
        <AlertCircle className="text-red-500 mb-2" size={32} />
        <p className="text-slate-700 font-medium">{error}</p>
        <button onClick={fetchStats} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Master Filters Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-colors">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Analytics</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select 
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none transition-colors"
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
          >
            <option value="all">All Services</option>
            <option value="op">OP Booking</option>
            <option value="video">Video Consultation</option>
            <option value="lab">Lab Tests</option>
            <option value="home_sample">Home Sample Collection</option>
            <option value="home_nursing">Home Nursing</option>
          </select>
          <select 
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none transition-colors"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      <PendingVerifications />

      {loading ? (
        <div className="h-64 flex items-center justify-center bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mb-4"></div>
            <p className="text-slate-500">Loading analytics...</p>
          </div>
        </div>
      ) : (
        <>
          {/* FINANCIAL OVERVIEW */}
          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Financial Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Link to="/admin/transactions" className="block hover:scale-[1.02] transition-transform">
                <KpiCard title="Total Gross Revenue" value={formatCurrency(kpis.grossRevenue, true)} icon={IndianRupee} iconColor="text-emerald-600" iconBg="bg-emerald-50" subtitle="Actual gross revenue" />
              </Link>
              <Link to="/admin/transactions?type=commission" className="block hover:scale-[1.02] transition-transform">
                <KpiCard title="Admin Commission" value={formatCurrency(kpis.adminCommission, true)} icon={TrendingUp} iconColor="text-blue-600" iconBg="bg-blue-50" subtitle="Platform commission" />
              </Link>
              <Link to="/admin/settlements" className="block hover:scale-[1.02] transition-transform">
                <KpiCard title="Provider Share" value={formatCurrency(kpis.providerShare, true)} icon={Landmark} iconColor="text-purple-600" iconBg="bg-purple-50" subtitle="Provider amount" />
              </Link>
              <Link to="/admin/transactions" className="block hover:scale-[1.02] transition-transform">
                <KpiCard title="Total Transactions" value={kpis.transactions.toLocaleString()} icon={CreditCard} iconColor="text-slate-600" iconBg="bg-slate-100" subtitle="Completed/valid" />
              </Link>
              <Link to="/admin/settlements?status=pending" className="block hover:scale-[1.02] transition-transform">
                <KpiCard title="Pending Settlements" value={formatCurrency(kpis.pendingSettlements, true)} icon={AlertCircle} iconColor="text-amber-600" iconBg="bg-amber-50" subtitle="Unsettled amount" />
              </Link>
            </div>
          </section>

          {/* REVENUE ANALYTICS CHARTS */}
          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue Analytics</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Revenue Trend Area Chart */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-colors">
                <h3 className="text-base font-semibold text-slate-900 mb-4">Revenue Trend</h3>
                <div className="h-72">
                  {kpis.revenueTrend && kpis.revenueTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={kpis.revenueTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `₹${val/1000}k`} />
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#1e293b', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          itemStyle={{ fontSize: '13px', fontWeight: 500 }}
                          formatter={(value: any) => formatCurrency(value)}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        <Area type="monotone" dataKey="gross" name="Gross Revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorGross)" strokeWidth={2} />
                        <Area type="monotone" dataKey="provider" name="Provider Share" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorProvider)" strokeWidth={2} />
                        <Area type="monotone" dataKey="admin" name="Admin Commission" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAdmin)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-slate-500">No revenue data available</div>
                  )}
                </div>
              </div>

              {/* Revenue Distribution Donut Chart */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-colors flex flex-col">
                <h3 className="text-base font-semibold text-slate-900 mb-4">Revenue Distribution</h3>
                <div className="flex-1 min-h-[288px] relative">
                  {kpis.grossRevenue > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Admin Share', value: kpis.adminCommission },
                            { name: 'Hospital Share', value: kpis.providerShare }
                          ]}
                          cx="50%" cy="50%"
                          innerRadius={80} outerRadius={110}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          <Cell fill="#3b82f6" />
                          <Cell fill="#8b5cf6" />
                        </Pie>
                        <RechartsTooltip formatter={(value: any) => formatCurrency(value)} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '13px' }} verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-slate-500">No revenue data available</div>
                  )}
                  {kpis.grossRevenue > 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-36px]">
                      <span className="text-xs text-slate-500 font-medium">Gross Revenue</span>
                      <span className="text-lg font-bold text-slate-800">{formatCurrency(kpis.grossRevenue, true)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Revenue by Service Bar Chart */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-colors">
                <h3 className="text-base font-semibold text-slate-900 mb-4">Revenue by Service</h3>
                <div className="h-72 relative">
                  {kpis.revenueByService && kpis.revenueByService.length > 0 && kpis.revenueByService.some(s => s.gross > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={kpis.revenueByService} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={120} />
                        <RechartsTooltip 
                          cursor={{ fill: '#f1f5f9' }}
                          formatter={(value: any) => formatCurrency(value)}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#1e293b' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        <Bar dataKey="provider" name="Provider Share" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="admin" name="Admin Commission" stackId="a" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-slate-500">No data available for selected services</div>
                  )}
                </div>
              </div>

              {/* Revenue by Hospital Bar Chart */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-colors">
                <h3 className="text-base font-semibold text-slate-900 mb-4">Revenue by Hospital</h3>
                <div className="h-72 relative">
                  {kpis.revenueByHospital && kpis.revenueByHospital.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={kpis.revenueByHospital.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={120} />
                        <RechartsTooltip 
                          cursor={{ fill: '#f1f5f9' }}
                          formatter={(value: any) => formatCurrency(value)}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#1e293b' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        <Bar dataKey="provider" name="Hospital Share" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="admin" name="Admin Commission" stackId="a" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-slate-500">No hospital revenue data available</div>
                  )}
                </div>
              </div>
            </div>

            {/* Service Analytics Table */}
            <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-base font-semibold text-slate-900">Service Analytics</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-3">Service</th>
                      <th className="px-6 py-3 text-right">Transactions</th>
                      <th className="px-6 py-3 text-right">Gross Revenue</th>
                      <th className="px-6 py-3 text-right">Admin Commission</th>
                      <th className="px-6 py-3 text-right">Provider Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {kpis.revenueByService && kpis.revenueByService.length > 0 ? (
                      kpis.revenueByService.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                          <td className="px-6 py-4 text-right">{item.transactions}</td>
                          <td className="px-6 py-4 text-right font-medium">{formatCurrency(item.gross)}</td>
                          <td className="px-6 py-4 text-right">{formatCurrency(item.admin)}</td>
                          <td className="px-6 py-4 text-right">{formatCurrency(item.provider)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No service data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* PLATFORM ANALYTICS */}
          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Platform Analytics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
              <Link to="/admin/patients" className="block hover:scale-[1.02] transition-transform">
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div><p className="text-sm text-slate-500">Patients</p><p className="text-2xl font-bold text-slate-900">{kpis.totalPatients}</p></div>
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center"><Users size={20} className="text-blue-600" /></div>
                </div>
              </Link>
              <Link to="/admin/doctors" className="block hover:scale-[1.02] transition-transform">
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div><p className="text-sm text-slate-500">Doctors</p><p className="text-2xl font-bold text-slate-900">{kpis.totalDoctors}</p></div>
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center"><Stethoscope size={20} className="text-emerald-600" /></div>
                </div>
              </Link>
              <Link to="/admin/hospitals" className="block hover:scale-[1.02] transition-transform">
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div><p className="text-sm text-slate-500">Hospitals</p><p className="text-2xl font-bold text-slate-900">{kpis.totalHospitals}</p></div>
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center"><Building2 size={20} className="text-purple-600" /></div>
                </div>
              </Link>
              <Link to="/admin/departments" className="block hover:scale-[1.02] transition-transform">
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div><p className="text-sm text-slate-500">Departments</p><p className="text-2xl font-bold text-slate-900">{kpis.totalDepartments}</p></div>
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center"><Network size={20} className="text-orange-600" /></div>
                </div>
              </Link>
              <Link to="/admin/appointments" className="block hover:scale-[1.02] transition-transform">
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div><p className="text-sm text-slate-500">Appointments</p><p className="text-2xl font-bold text-slate-900">{kpis.totalAppointments}</p></div>
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center"><CalendarCheck size={20} className="text-indigo-600" /></div>
                </div>
              </Link>
              <Link to="/admin/doctors" className="block hover:scale-[1.02] transition-transform">
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div><p className="text-sm text-slate-500">Active Doctors</p><p className="text-2xl font-bold text-slate-900">{kpis.activeDoctors}</p></div>
                  <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center"><Activity size={20} className="text-teal-600" /></div>
                </div>
              </Link>
              <Link to="/admin/hospitals" className="block hover:scale-[1.02] transition-transform">
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div><p className="text-sm text-slate-500">Verified Hospitals</p><p className="text-2xl font-bold text-slate-900">{kpis.verifiedHospitals}</p></div>
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center"><CheckCircle2 size={20} className="text-green-600" /></div>
                </div>
              </Link>
              <Link to="/admin/verification" className="block hover:scale-[1.02] transition-transform">
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div><p className="text-sm text-slate-500">Pending Verifications</p><p className="text-2xl font-bold text-slate-900">{kpis.pendingVerifications}</p></div>
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center"><ShieldAlert size={20} className="text-amber-600" /></div>
                </div>
              </Link>
            </div>
          </section>

          {/* APPOINTMENT ANALYTICS */}
          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Appointment Analytics</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Appointment Status */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-colors flex flex-col">
                <h3 className="text-base font-semibold text-slate-900 mb-4">Appointment Status</h3>
                <div className="flex-1 min-h-[288px] relative">
                  {kpis.appointmentStatuses && kpis.appointmentStatuses.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={kpis.appointmentStatuses}
                          cx="50%" cy="50%"
                          innerRadius={80} outerRadius={110}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {kpis.appointmentStatuses.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '13px' }} verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-slate-500">No appointment data available</div>
                  )}
                  {kpis.appointmentStatuses && kpis.appointmentStatuses.length > 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-36px]">
                      <span className="text-xs text-slate-500 font-medium">Total</span>
                      <span className="text-lg font-bold text-slate-800">{kpis.totalAppointments}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Appointment Trend */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-colors">
                <h3 className="text-base font-semibold text-slate-900 mb-4">Appointment Trend</h3>
                <div className="h-72">
                  {kpis.appointmentTrend && kpis.appointmentTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={kpis.appointmentTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#1e293b' }}
                          cursor={{ fill: '#f1f5f9' }}
                        />
                        <Bar dataKey="count" name="Appointments" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-slate-500">No appointment trend available</div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* PROVIDER ANALYTICS */}
          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Top Hospitals by Revenue</h3>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-3 w-16 text-center">Rank</th>
                      <th className="px-6 py-3">Hospital Name</th>
                      <th className="px-6 py-3 text-right">Transactions</th>
                      <th className="px-6 py-3 text-right">Gross Revenue</th>
                      <th className="px-6 py-3 text-right text-blue-600">Platform Comm.</th>
                      <th className="px-6 py-3 text-right">Hospital Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {kpis.topHospitals && kpis.topHospitals.length > 0 ? (
                      kpis.topHospitals.map((hosp, idx) => (
                        <tr key={hosp.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-center font-medium text-slate-400">#{idx + 1}</td>
                          <td className="px-6 py-4 font-medium text-slate-900">
                            <Link to={`/admin/hospitals/${hosp.id}`} className="hover:text-blue-600 hover:underline">
                              {hosp.name}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-right">{hosp.transactions}</td>
                          <td className="px-6 py-4 text-right font-medium">{formatCurrency(hosp.gross)}</td>
                          <td className="px-6 py-4 text-right font-medium text-blue-700">{formatCurrency(hosp.admin)}</td>
                          <td className="px-6 py-4 text-right">{formatCurrency(hosp.provider)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No revenue data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

        </>
      )}
    </div>
  );
};

export default Dashboard;
