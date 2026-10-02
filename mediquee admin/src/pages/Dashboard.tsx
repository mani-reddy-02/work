import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, UserCircle, Stethoscope, Building2, TestTube, HeartHandshake,
  CalendarCheck, Activity, Video, Home, CreditCard, Landmark, 
  ShieldAlert, AlertCircle, CheckCircle2, IndianRupee, TrendingUp
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import KpiCard from '../components/ui/KpiCard';
import StatusBadge from '../components/ui/StatusBadge';
import { adminService } from '../services/adminService';
import { formatCurrency } from '../utils/finance';
import { useAdminAuth } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const Dashboard: React.FC = () => {
  const { token } = useAdminAuth();
  const [period, setPeriod] = useState('30d');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [kpis, setKpis] = useState({
    totalUsers: 0, totalPatients: 0, totalDoctors: 0, totalHospitals: 0, totalLabs: 0, totalNurses: 0,
    grossRevenue: 0, adminCommission: 0, providerShare: 0, transactions: 0, pendingSettlements: 0,
    pendingVerifications: 0, opAppointments: 0, videoConsultations: 0, labTests: 0, homeSample: 0, homeNursing: 0,
    revenueTrend: [] as any[], revenueByService: [] as any[]
  });

  React.useEffect(() => {
    const fetchStats = async () => {
      if (!token) return;
      try {
        const res = await adminService.getAdminDashboardStats(token);
        if (res.success && res.data) {
          setKpis((prev) => ({
            ...prev,
            totalUsers: res.data.totalUsers ?? prev.totalUsers,
            totalPatients: res.data.totalPatients ?? prev.totalPatients,
            totalDoctors: res.data.totalDoctors ?? prev.totalDoctors,
            totalHospitals: res.data.totalHospitals ?? prev.totalHospitals,
            totalLabs: res.data.totalLabs ?? prev.totalLabs,
            totalNurses: res.data.totalNurses ?? prev.totalNurses,
            grossRevenue: res.data.grossRevenue ?? prev.grossRevenue,
            adminCommission: res.data.adminCommission ?? prev.adminCommission,
            providerShare: res.data.providerShare ?? prev.providerShare,
            transactions: res.data.transactions ?? prev.transactions,
            pendingSettlements: res.data.pendingSettlements ?? prev.pendingSettlements,
            pendingVerifications: res.data.pendingVerifications ?? prev.pendingVerifications,
            revenueTrend: res.data.revenueTrend ?? prev.revenueTrend,
            revenueByService: res.data.revenueByService ?? prev.revenueByService,
          }));
        }
      } catch (err) {
        console.error('Failed to fetch admin stats:', err);
      }
    };
    fetchStats();
  }, [token]);

  return (
    <div className="space-y-8">
      {/* Master Filters Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white  p-4 rounded-xl border border-slate-200  shadow-sm transition-colors">
        <div>
          <h2 className="text-2xl font-bold text-slate-900  tracking-tight">Platform Dashboard</h2>
          <p className="text-sm text-slate-500 ">Master overview of platform operations and revenue.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select 
            className="bg-slate-50  border border-slate-200  text-slate-700  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none transition-colors"
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
            className="bg-slate-50  border border-slate-200  text-slate-700  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none transition-colors"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="6m">Last 6 months</option>
            <option value="1y">This year</option>
          </select>
        </div>
      </div>

      {/* Action Center - Critical Insights */}
      <div className="bg-amber-50  border border-amber-200  rounded-xl p-4 transition-colors">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-amber-600  shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="text-sm font-semibold text-amber-800 ">Action Center Insights</h3>
            <ul className="mt-1 text-sm text-amber-700 space-y-1">
              <li><Link to="/admin/settlements" className="hover:underline font-medium">{formatCurrency(kpis.pendingSettlements)} in pending settlements require processing.</Link></li>
              <li><Link to="/admin/verification" className="hover:underline font-medium">{kpis.pendingVerifications} hospitals waiting for verification approval.</Link></li>
              {kpis.grossRevenue > 0 ? (
                <li>Revenue data is being tracked from active hospital transactions.</li>
              ) : (
                <li>No revenue data available for this period.</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* FINANCIAL OVERVIEW */}
      <section>
        <h3 className="text-lg font-semibold text-slate-900  mb-4">Financial Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link to="/admin/transactions" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Total Gross Revenue" value={formatCurrency(kpis.grossRevenue, true)} icon={IndianRupee} iconColor="text-emerald-600" iconBg="bg-emerald-50" subtitle="All services" />
          </Link>
          <Link to="/admin/transactions?type=commission" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Admin Commission" value={formatCurrency(kpis.adminCommission, true)} icon={TrendingUp} iconColor="text-blue-600" iconBg="bg-blue-50" subtitle="Calculated from actual transactions" />
          </Link>
          <Link to="/admin/settlements" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Provider Share" value={formatCurrency(kpis.providerShare, true)} icon={Landmark} iconColor="text-purple-600" iconBg="bg-purple-50" subtitle="Calculated from actual transactions" />
          </Link>
          <Link to="/admin/transactions" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Total Transactions" value={kpis.transactions.toLocaleString()} icon={CreditCard} iconColor="text-slate-600" iconBg="bg-slate-100 " subtitle="Completed payments" />
          </Link>
          <Link to="/admin/settlements?status=pending" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Pending Settlements" value={formatCurrency(kpis.pendingSettlements, true)} icon={AlertCircle} iconColor="text-amber-600" iconBg="bg-amber-50 " subtitle="Awaiting payout" />
          </Link>
        </div>
      </section>

      {/* PLATFORM OVERVIEW */}
      <section>
        <h3 className="text-lg font-semibold text-slate-900  mb-4">Platform Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link to="/admin/users" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Total Users" value={kpis.totalUsers} icon={Users} />
          </Link>
          <Link to="/admin/users?role=patient" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Patients" value={kpis.totalPatients} icon={UserCircle} />
          </Link>
          <Link to="/admin/doctors" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Doctors" value={kpis.totalDoctors} icon={Stethoscope} />
          </Link>
          <Link to="/admin/hospitals" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Hospitals" value={kpis.totalHospitals} icon={Building2} />
          </Link>
        </div>
      </section>

      {/* REVENUE ANALYTICS CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Line Chart */}
        <div className="bg-white  p-5 rounded-xl border border-slate-200  shadow-sm transition-colors">
          <h3 className="text-base font-semibold text-slate-900  mb-4">Revenue Trend</h3>
          <div className="h-72">
            {kpis.revenueTrend && kpis.revenueTrend.length > 0 ? <ResponsiveContainer width="100%" height="100%">
              <LineChart data={kpis.revenueTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `₹${val/1000}k`} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#f8fafc' }}
                  itemStyle={{ fontSize: '13px', fontWeight: 500 }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="gross" name="Gross Revenue" stroke="#10b981" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="admin" name="Admin Commission" stroke="#3b82f6" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer> : <div className="flex items-center justify-center h-full text-sm text-slate-500">No data available yet.</div>}
          </div>
        </div>

        {/* Revenue by Service Bar Chart */}
        <div className="bg-white  p-5 rounded-xl border border-slate-200  shadow-sm transition-colors">
          <h3 className="text-base font-semibold text-slate-900  mb-4">Revenue by Service</h3>
          <div className="h-72 relative">
            {kpis.revenueByService && kpis.revenueByService.length > 0 ? <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kpis.revenueByService} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.2} />
                <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={100} />
                <RechartsTooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#f8fafc' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="provider" name="Provider Share" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="admin" name="Admin Commission" stackId="a" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer> : <div className="flex items-center justify-center h-full text-sm text-slate-500">No data available yet.</div>}
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default Dashboard;
