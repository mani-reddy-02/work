import React, { useState } from 'react';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { VerificationRequest } from '../types';
import { ShieldAlert, ShieldCheck, Clock } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';
import { useAdminAuth } from '../contexts/AuthContext';
import { verificationService } from '../services/verificationService';
import PendingVerifications from '../components/admin/PendingVerifications';

const Verification: React.FC = () => {
  const { token } = useAdminAuth();
  const [requests, setRequests] = React.useState<VerificationRequest[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'HOSPITAL' | 'DOCTOR'>('HOSPITAL');

  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = React.useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  React.useEffect(() => {
    const fetchRequests = async () => {
      if (!token) return;
      try {
        const res = await verificationService.getVerificationRequests(token);
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setRequests(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch verification requests:', err);
      }
    };
    fetchRequests();
  }, [token]);

  // Click outside listener for filter popover
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilters(false);
      }
    };
    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilters]);

  const filteredRequests = requests.filter(r => {
    const matchesTab = r.entityType === activeTab;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || 
      r.entityName.toLowerCase().includes(term) || 
      r.id.toLowerCase().includes(term);
    return matchesTab && matchesStatus && matchesSearch;
  });

  const totalResults = filteredRequests.length;
  const paginatedRequests = filteredRequests.slice((page - 1) * pageSize, page * pageSize);

  const handleClearFilters = () => {
    setStatusFilter('all');
    setSearch('');
    setPage(1);
    setShowFilters(false);
  };

  const hasActiveFilters = statusFilter !== 'all' || search.trim().length > 0;

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

      <PendingVerifications />

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col relative">
        <div className="flex border-b border-slate-200">
          <button 
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'HOSPITAL' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => {
              setActiveTab('HOSPITAL');
              setPage(1);
            }}
          >
            Hospitals
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'DOCTOR' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => {
              setActiveTab('DOCTOR');
              setPage(1);
            }}
          >
            Doctors
          </button>
        </div>
        
        {showFilters && (
          <div ref={filterRef} className="absolute right-4 top-16 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-900 text-sm">Filter Verifications</h3>
              <button onClick={() => setShowFilters(false)} className="text-slate-400 hover:text-slate-600 text-xs">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 flex gap-2">
                <button 
                  onClick={handleClearFilters}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                >
                  Clear All
                </button>
                <button 
                  onClick={() => setShowFilters(false)}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="p-0 border-t-0">
           <div className="border-0 shadow-none">
             <DataTable 
                data={paginatedRequests}
                columns={columns}
                keyExtractor={(r) => r.id}
                searchPlaceholder={`Search ${activeTab.toLowerCase()} by name or ID...`}
                searchValue={search}
                onSearch={(term) => {
                  setSearch(term);
                  setPage(1);
                }}
                onFilterClick={() => setShowFilters(!showFilters)}
                pagination={{
                  currentPage: page,
                  totalPages: Math.max(1, Math.ceil(totalResults / pageSize)),
                  totalResults,
                  pageSize,
                  onPageChange: (p) => setPage(p)
                }}
                emptyMessage={hasActiveFilters ? "No matching verification records found." : "No verification requests."}
              />
           </div>
        </div>
      </div>
    </div>
  );
};

export default Verification;
