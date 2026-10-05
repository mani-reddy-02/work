import React, { useState, useEffect } from 'react';
import { TrendingUp, Building2, Activity, Filter, DollarSign } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';
import DataTable, { Column } from '../components/ui/DataTable';
import { useAdminAuth } from '../contexts/AuthContext';
import { financeService } from '../services/financeService';
import { formatCurrency } from '../utils/finance';

const Revenue: React.FC = () => {
  const { token } = useAdminAuth();
  const [data, setData] = useState<any>({ kpis: {}, revenueByHospital: [], revenueByService: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const res = await financeService.getRevenueAnalytics(token);
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const kpis = data.kpis || {};

  const hospitalColumns: Column<any>[] = [
    { header: 'Hospital Name', accessor: (h) => <span className="font-medium text-slate-900">{h.hospitalName}</span> },
    { header: 'Gross Revenue', accessor: (h) => <span className="font-medium text-slate-900">{formatCurrency(h.gross)}</span> },
    { header: 'Hospital Earnings', accessor: (h) => <span className="font-medium text-emerald-600">{formatCurrency(h.hospital)}</span> },
    { header: 'MediQuee Commission', accessor: (h) => <span className="font-medium text-blue-600">{formatCurrency(h.mediquee)}</span> },
    { header: 'Transactions', accessor: (h) => <span className="text-slate-600">{h.count}</span> },
  ];

  const serviceColumns: Column<any>[] = [
    { header: 'Service Type', accessor: (s) => <span className="font-medium text-slate-900">{s.name}</span> },
    { header: 'Gross Revenue', accessor: (s) => <span className="font-medium text-slate-900">{formatCurrency(s.gross)}</span> },
    { header: 'Hospital Earnings', accessor: (s) => <span className="font-medium text-emerald-600">{formatCurrency(s.hospital)}</span> },
    { header: 'MediQuee Commission', accessor: (s) => <span className="font-medium text-blue-600">{formatCurrency(s.mediquee)}</span> },
    { header: 'Transactions', accessor: (s) => <span className="text-slate-600">{s.count}</span> },
  ];

  if (loading) return <div className="p-6">Loading revenue analytics...</div>;

  const hasData = kpis.totalTransactions > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Revenue Analytics</h2>
          <p className="text-sm text-slate-500">Aggregated financial performance across all hospitals and services.</p>
        </div>
      </div>

      {!hasData ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <p className="text-slate-500">No revenue data available.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Gross Revenue" value={formatCurrency(kpis.grossRevenue)} icon={DollarSign} />
            <KpiCard title="Hospital Share" value={formatCurrency(kpis.hospitalShare)} icon={Building2} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
            <KpiCard title="MediQuee Commission" value={formatCurrency(kpis.mediqueeCommission)} icon={Activity} iconColor="text-blue-600" iconBg="bg-blue-50" />
            <KpiCard title="Total Transactions" value={kpis.totalTransactions} icon={TrendingUp} iconColor="text-purple-600" iconBg="bg-purple-50" />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mt-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Revenue by Hospital</h3>
            <DataTable 
              data={data.revenueByHospital}
              columns={hospitalColumns}
              keyExtractor={(h) => h.hospitalName}
              searchPlaceholder="Search hospital..."
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mt-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Revenue by Service</h3>
            <DataTable 
              data={data.revenueByService.filter((s: any) => s.count > 0)}
              columns={serviceColumns}
              keyExtractor={(s) => s.name}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Revenue;
