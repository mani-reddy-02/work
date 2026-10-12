import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { formatCurrency } from '../utils/finance';
import { FileText, Filter } from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';
import { financeService } from '../services/financeService';

const Settlements: React.FC = () => {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const [settlements, setSettlements] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const res = await financeService.getSettlements(token);
        if (res.success && Array.isArray(res.data)) {
          setSettlements(res.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = React.useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Click outside to close filter popover
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

  const filteredSettlements = settlements.filter(s => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term ||
      (s.id && s.id.toLowerCase().includes(term)) || 
      (s.hospitalName && s.hospitalName.toLowerCase().includes(term)) ||
      (s.period && s.period.toLowerCase().includes(term));

    const matchesStatus = statusFilter === 'all' || (s.status && s.status.toUpperCase() === statusFilter.toUpperCase());

    return matchesSearch && matchesStatus;
  });

  const totalResults = filteredSettlements.length;
  const paginatedSettlements = filteredSettlements.slice((page - 1) * pageSize, page * pageSize);

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPage(1);
    setShowFilters(false);
  };

  const hasActiveFilters = statusFilter !== 'all' || search.trim().length > 0;

  const columns: Column<any>[] = [
    {
      header: 'Settlement ID',
      accessor: (s) => (
        <button 
          onClick={() => navigate(`/admin/settlements/${s.id}`)}
          className="font-medium text-blue-600 hover:underline text-left"
        >
          {s.id}
        </button>
      ),
    },
    {
      header: 'Hospital',
      accessor: (s) => (
        <button 
          onClick={() => navigate(`/admin/hospitals/${s.hospitalId}`)}
          className="font-medium text-slate-900 hover:text-blue-600"
        >
          {s.hospitalName}
        </button>
      ),
    },
    {
      header: 'Period',
      accessor: (s) => <span className="text-slate-900">{s.period}</span>,
    },
    {
      header: 'Transactions',
      accessor: (s) => <span className="text-slate-600">{s.transactionCount}</span>,
    },
    {
      header: 'Gross Revenue',
      accessor: (s) => <span className="text-slate-900">{formatCurrency(s.grossRevenue)}</span>,
    },
    {
      header: 'Settlement Amount',
      accessor: (s) => <span className="font-medium text-emerald-600">{formatCurrency(s.hospitalAmount)}</span>,
    },
    {
      header: 'Status',
      accessor: (s) => <StatusBadge status={s.status} />
    }
  ];

  if (loading) return <div className="p-6 text-slate-500">Loading settlements...</div>;

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Settlements</h2>
          <p className="text-sm text-slate-500">Manage money payable and paid to hospitals for their services.</p>
        </div>
      </div>

      {showFilters && (
        <div ref={filterRef} className="absolute right-0 top-20 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-900 text-sm">Filter Settlements</h3>
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
                <option value="SETTLED">Settled</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
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

      <DataTable 
        data={paginatedSettlements}
        columns={columns}
        keyExtractor={(s) => s.id}
        searchPlaceholder="Search by ID, Hospital, or Period..."
        searchValue={search}
        onSearch={(val) => {
          setSearch(val);
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
        emptyMessage={hasActiveFilters ? "No matching settlement records found." : "No settlements found."}
      />
    </div>
  );
};

export default Settlements;
