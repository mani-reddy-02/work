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
import { mockKPIsAdvanced, mockChartData, mockAppointments, mockActivities } from '../mock/data';
import { formatCurrency } from '../utils/finance';

const Dashboard: React.FC = () => {
  const [period, setPeriod] = useState('30d');
  const [serviceFilter, setServiceFilter] = useState('all');

  return (
    <div className="space-y-8">
      {/* Master Filters Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Platform Dashboard</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Master overview of platform operations and revenue.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select 
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none transition-colors"
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
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none transition-colors"
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
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 transition-colors">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-500">Action Center Insights</h3>
            <ul className="mt-1 text-sm text-amber-700 dark:text-amber-600/90 space-y-1">
              <li><Link to="/admin/settlements" className="hover:underline font-medium">{formatCurrency(mockKPIsAdvanced.pendingSettlements)} in pending settlements require processing.</Link></li>
              <li><Link to="/admin/verification" className="hover:underline font-medium">{mockKPIsAdvanced.pendingVerifications} providers waiting for verification approval.</Link></li>
              <li>OP Booking is currently the highest-revenue service this month.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* FINANCIAL OVERVIEW */}
      <section>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Financial Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link to="/admin/transactions" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Total Gross Revenue" value={formatCurrency(mockKPIsAdvanced.grossRevenue, true)} icon={IndianRupee} iconColor="text-emerald-600" iconBg="bg-emerald-50 dark:bg-emerald-500/10" subtitle="All services" />
          </Link>
          <Link to="/admin/transactions?type=commission" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Admin Commission" value={formatCurrency(mockKPIsAdvanced.adminCommission, true)} icon={TrendingUp} iconColor="text-blue-600" iconBg="bg-blue-50 dark:bg-blue-500/10" subtitle="20% platform share" />
          </Link>
          <Link to="/admin/settlements" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Provider Share" value={formatCurrency(mockKPIsAdvanced.providerShare, true)} icon={Landmark} iconColor="text-purple-600" iconBg="bg-purple-50 dark:bg-purple-500/10" subtitle="80% provider share" />
          </Link>
          <Link to="/admin/transactions" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Total Transactions" value={mockKPIsAdvanced.transactions.toLocaleString()} icon={CreditCard} iconColor="text-slate-600" iconBg="bg-slate-100 dark:bg-slate-800" subtitle="Completed payments" />
          </Link>
          <Link to="/admin/settlements?status=pending" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Pending Settlements" value={formatCurrency(mockKPIsAdvanced.pendingSettlements, true)} icon={AlertCircle} iconColor="text-amber-600" iconBg="bg-amber-50 dark:bg-amber-500/10" subtitle="Awaiting payout" />
          </Link>
        </div>
      </section>

      {/* PLATFORM OVERVIEW */}
      <section>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Platform Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link to="/admin/users" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Total Users" value={mockKPIsAdvanced.totalUsers} icon={Users} />
          </Link>
          <Link to="/admin/users?role=patient" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Patients" value={mockKPIsAdvanced.totalPatients} icon={UserCircle} />
          </Link>
          <Link to="/admin/doctors" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Doctors" value={mockKPIsAdvanced.totalDoctors} icon={Stethoscope} />
          </Link>
          <Link to="/admin/hospitals" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Hospitals" value={mockKPIsAdvanced.totalHospitals} icon={Building2} />
          </Link>
          <Link to="/admin/providers?type=lab" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Labs" value={mockKPIsAdvanced.totalLabs} icon={TestTube} />
          </Link>
          <Link to="/admin/providers?type=nurse" className="block hover:scale-[1.02] transition-transform">
            <KpiCard title="Nurses" value={mockKPIsAdvanced.totalNurses} icon={HeartHandshake} />
          </Link>
        </div>
      </section>

      {/* REVENUE ANALYTICS CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Line Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Revenue Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[
                { name: 'Jan', gross: 400000, admin: 80000, provider: 320000 },
                { name: 'Feb', gross: 550000, admin: 110000, provider: 440000 },
                { name: 'Mar', gross: 480000, admin: 96000, provider: 384000 },
                { name: 'Apr', gross: 650000, admin: 130000, provider: 520000 },
                { name: 'May', gross: 720000, admin: 144000, provider: 576000 },
                { name: 'Jun', gross: 890000, admin: 178000, provider: 712000 },
              ]} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Service Bar Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Revenue by Service</h3>
          <div className="h-72 relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'OP Booking', admin: 280000, provider: 1120000 },
                { name: 'Video Consult', admin: 120000, provider: 480000 },
                { name: 'Lab Tests', admin: 350000, provider: 1400000 },
                { name: 'Home Sample', admin: 90000, provider: 360000 },
                { name: 'Home Nursing', admin: 132000, provider: 528000 },
              ]} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.2} />
                <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={100} />
                <RechartsTooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#f8fafc' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="provider" name="Provider Share (80%)" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="admin" name="Admin Commission (20%)" stackId="a" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default Dashboard;
