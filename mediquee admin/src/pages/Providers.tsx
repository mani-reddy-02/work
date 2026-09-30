import React, { useState } from 'react';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { Hospital, Lab, Nurse } from '../types';
import { formatCurrency } from '../utils/finance';
import { Building2, TestTube, HeartHandshake, Landmark } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';

const Providers: React.FC = () => {
  const [search, setSearch] = useState('');
  const [providerType, setProviderType] = useState<'ALL' | 'HOSPITAL' | 'LAB' | 'NURSE'>('ALL');

  // Unified provider list for demonstration
  const allProviders = [
    ...([] as any[]).map(h => ({ ...h, type: 'HOSPITAL', icon: Building2 })),
    ...([] as any[]).map(l => ({ ...l, type: 'LAB', icon: TestTube }))
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
            <div className="w-8 h-8 rounded-lg bg-slate-100  flex items-center justify-center text-slate-500 shrink-0">
              <Icon size={16} />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-slate-900 ">{p.name}</span>
              <span className="text-xs text-slate-500 ">{p.type} • {p.city}</span>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Contact',
      accessor: (p) => (
        <div className="flex flex-col">
          <span className="text-sm text-slate-900 ">{p.email}</span>
          <span className="text-xs text-slate-500 ">{p.phone}</span>
        </div>
      ),
    },
    {
      header: 'Gross Revenue',
      accessor: (p) => <span className="font-medium text-slate-900 ">{formatCurrency(0)}</span>,
    },
    {
      header: 'Pending Settlement',
      accessor: (p) => <span className="font-medium text-amber-600 ">{formatCurrency(0)}</span>,
    },
    {
      header: 'Status',
      accessor: (p) => <StatusBadge status={p.status} />,
    },
    {
      header: 'Actions',
      accessor: (p) => (
        <button className="text-blue-600  hover:text-blue-800 :text-blue-300 text-sm font-medium transition-colors">
          View Financials
        </button>
      ),
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900  tracking-tight">Healthcare Providers</h2>
          <p className="text-sm text-slate-500 ">Manage hospitals, labs, and nursing partners and their financials.</p>
        </div>
        <div className="flex gap-2">
          <select 
            className="bg-white  border border-slate-200  text-slate-700  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none transition-colors"
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
        <KpiCard title="Hospitals" value={0} icon={Building2} iconColor="text-blue-600" iconBg="bg-blue-50 " />
        <KpiCard title="Labs" value={0} icon={TestTube} iconColor="text-purple-600" iconBg="bg-purple-50 " />
        <KpiCard title="Nurses" value={0} icon={HeartHandshake} iconColor="text-emerald-600" iconBg="bg-emerald-50 " />
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
