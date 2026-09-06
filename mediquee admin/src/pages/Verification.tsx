import React, { useState } from 'react';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { VerificationRequest } from '../types';
import { mockVerifications } from '../mock/data';
import { ShieldAlert, ShieldCheck, Clock } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';

const Verification: React.FC = () => {
  const [requests] = useState<VerificationRequest[]>(mockVerifications);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'HOSPITAL' | 'DOCTOR'>('HOSPITAL');

  const filteredRequests = requests.filter(r => 
    r.entityType === activeTab &&
    (r.entityName.toLowerCase().includes(search.toLowerCase()) || 
     r.id.toLowerCase().includes(search.toLowerCase()))
  );

  const columns: Column<VerificationRequest>[] = [
    {
      header: 'Request ID',
      accessor: (r) => <span className="font-medium text-slate-900">{r.id}</span>,
    },
    {
      header: 'Entity Name',
      accessor: 'entityName',
    },
    {
      header: 'Submitted',
      accessor: (r) => new Date(r.createdAt).toLocaleDateString(),
    },
    {
      header: 'Status',
      accessor: (r) => <StatusBadge status={r.status} />,
    },
    {
      header: 'Actions',
      accessor: (r) => (
        <button className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-md text-sm font-medium transition-colors">
          Review
        </button>
      ),
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Verification Center</h2>
          <p className="text-sm text-slate-500">Review and approve hospital and doctor registrations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard title="Pending Review" value={requests.filter(r => r.status === 'PENDING').length} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <KpiCard title="Approved Today" value={0} icon={ShieldCheck} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <KpiCard title="Total Reviewed" value={45} icon={ShieldAlert} iconColor="text-blue-600" iconBg="bg-blue-50" />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="flex border-b border-slate-200">
          <button 
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'HOSPITAL' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('HOSPITAL')}
          >
            Hospitals
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'DOCTOR' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('DOCTOR')}
          >
            Doctors
          </button>
        </div>
        
        <div className="p-0 border-t-0">
           {/* Custom wrapper to reuse DataTable styling but avoiding double borders */}
           <div className="border-0 shadow-none">
             <DataTable 
                data={filteredRequests}
                columns={columns}
                keyExtractor={(r) => r.id}
                searchPlaceholder={`Search ${activeTab.toLowerCase()} verifications...`}
                onSearch={setSearch}
              />
           </div>
        </div>
      </div>
    </div>
  );
};

export default Verification;
