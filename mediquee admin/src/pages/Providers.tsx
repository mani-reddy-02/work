import React, { useState } from 'react';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { Hospital, Lab, Nurse } from '../types';
import { mockHospitals, mockLabs } from '../mock/data';
import { formatCurrency } from '../utils/finance';
import { Building2, TestTube, HeartHandshake, Landmark } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';

const Providers: React.FC = () => {
  const [search, setSearch] = useState('');
  const [providerType, setProviderType] = useState<'ALL' | 'HOSPITAL' | 'LAB' | 'NURSE'>('ALL');

  // Unified provider list for demonstration
  const allProviders = [
    ...mockHospitals.map(h => ({ ...h, type: 'HOSPITAL', icon: Building2 })),
    ...mockLabs.map(l => ({ ...l, type: 'LAB', icon: TestTube }))
  ];

  const filteredProviders = allProviders.filter(p => 
    (providerType === 'ALL' || p.type === providerType) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || 
     p.city.toLowerCase().includes(search.toLowerCase()))
  );

  const columns: Column<any>[] = [
    {
      header: 'Provider',
      accessor: (p) => {
        const Icon = p.icon;
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
              <Icon size={16} />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-slate-900 dark:text-white">{p.name}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{p.type} • {p.city}</span>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Contact',
      accessor: (p) => (
        <div className="flex flex-col">
          <span className="text-sm text-slate-900 dark:text-slate-300">{p.email}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{p.phone}</span>
        </div>
      ),
    },
    {
      header: 'Gross Revenue (Mock)',
      accessor: (p) => <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(Math.floor(Math.random() * 500000) + 50000)}</span>,
    },
    {
      header: 'Pending Settlement',
      accessor: (p) => <span className="font-medium text-amber-600 dark:text-amber-500">{formatCurrency(Math.floor(Math.random() * 50000) + 5000)}</span>,
    },
    {
      header: 'Status',
      accessor: (p) => <StatusBadge status={p.status} />,
    },
    {
      header: 'Actions',
      accessor: (p) => (
        <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium transition-colors">
          View Financials
        </button>
      ),
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Healthcare Providers</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage hospitals, labs, and nursing partners and their financials.</p>
        </div>
        <div className="flex gap-2">
          <select 
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none transition-colors"
            value={providerType}
            onChange={(e) => setProviderType(e.target.value as any)}
          >
            <option value="ALL">All Providers</option>
            <option value="HOSPITAL">Hospitals</option>
            <option value="LAB">Labs</option>
            <option value="NURSE">Nurses</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KpiCard title="Total Providers" value={allProviders.length} icon={Landmark} />
        <KpiCard title="Hospitals" value={mockHospitals.length} icon={Building2} iconColor="text-blue-600" iconBg="bg-blue-50 dark:bg-blue-500/10" />
        <KpiCard title="Labs" value={mockLabs.length} icon={TestTube} iconColor="text-purple-600" iconBg="bg-purple-50 dark:bg-purple-500/10" />
        <KpiCard title="Nurses" value={0} icon={HeartHandshake} iconColor="text-emerald-600" iconBg="bg-emerald-50 dark:bg-emerald-500/10" />
      </div>

      <DataTable 
        data={filteredProviders}
        columns={columns}
        keyExtractor={(p) => p.id}
        searchPlaceholder="Search providers by name or city..."
        onSearch={setSearch}
      />
    </div>
  );
};

export default Providers;
