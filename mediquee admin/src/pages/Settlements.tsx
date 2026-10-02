import React, { useState } from 'react';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { Settlement } from '../types';
import { formatCurrency } from '../utils/finance';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';

const Settlements: React.FC = () => {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [search, setSearch] = useState('');

  const filteredSettlements = settlements.filter(s => 
    s.id.toLowerCase().includes(search.toLowerCase()) || 
    s.providerName.toLowerCase().includes(search.toLowerCase())
  );

  const handleSimulatePayment = (id: string) => {
    setSettlements(prev => prev.map(s => s.id === id ? { ...s, status: 'PAID' } : s));
  };

  const columns: Column<Settlement>[] = [
    {
      header: 'Settlement ID & Period',
      accessor: (s) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900 ">{s.id}</span>
          <span className="text-xs text-slate-500 ">
            {new Date(s.periodStart).toLocaleDateString()} - {new Date(s.periodEnd).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      header: 'Provider',
      accessor: (s) => (
        <div className="flex flex-col">
          <span className="text-slate-900  font-medium">{s.providerName}</span>
          <span className="text-xs text-slate-500 ">{s.providerType}</span>
        </div>
      ),
    },
    {
      header: 'Gross / Admin',
      accessor: (s) => (
        <div className="flex flex-col">
          <span className="text-slate-900 ">{formatCurrency(s.grossRevenue)}</span>
          <span className="text-xs text-emerald-600 ">- {formatCurrency(s.adminCommission)}</span>
        </div>
      ),
    },
    {
      header: 'Payout Amount',
      accessor: (s) => <span className="font-bold text-blue-600 ">{formatCurrency(s.providerShare)}</span>,
    },
    {
      header: 'Status',
      accessor: (s) => <StatusBadge status={s.status} />,
    },
    {
      header: 'Actions',
      accessor: (s) => (
        s.status === 'PENDING' ? (
          <button 
            onClick={() => handleSimulatePayment(s.id)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
          >
            Process Payout
          </button>
        ) : (
          <button className="text-slate-500 hover:text-slate-700  :text-slate-200 px-3 py-1.5 text-sm font-medium transition-colors">
            View Receipt
          </button>
        )
      ),
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Provider Settlements</h2>
          <p className="text-sm text-slate-500 ">Manage and process revenue share payouts to network providers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard title="Pending Settlement" value={formatCurrency(settlements.filter(s => s.status !== 'PAID').reduce((acc, curr) => acc + curr.providerShare, 0))} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50 " />
        <KpiCard title="Processed Today" value={formatCurrency(0)} icon={CheckCircle} iconColor="text-emerald-600" iconBg="bg-emerald-50 " />
        <KpiCard title="Failed Transfers" value={0} icon={AlertCircle} iconColor="text-rose-600" iconBg="bg-rose-50 " />
      </div>

      <DataTable 
        data={filteredSettlements}
        columns={columns}
        keyExtractor={(s) => s.id}
        searchPlaceholder="Search by ID or Provider..."
        onSearch={setSearch}
      />
    </div>
  );
};

export default Settlements;
