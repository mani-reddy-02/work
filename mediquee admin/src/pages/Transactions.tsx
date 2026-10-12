import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { formatCurrency } from '../utils/finance';
import { ArrowDownRight, ArrowUpRight, TrendingUp, Filter } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';
import { useAdminAuth } from '../contexts/AuthContext';
import { financeService } from '../services/financeService';

const Transactions: React.FC = () => {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const res = await financeService.getTransactions(token);
        if (res.success && Array.isArray(res.data)) {
          setTransactions(res.data);
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
  const [serviceFilter, setServiceFilter] = useState('all');
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

  // Extract unique services
  const availableServices = React.useMemo(() => {
    const s = new Set<string>();
    transactions.forEach(t => {
      if (t.service) s.add(t.service);
    });
    return Array.from(s);
  }, [transactions]);

  const filteredTransactions = transactions.filter(t => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term ||
      (t.bookingId && t.bookingId.toLowerCase().includes(term)) || 
      (t.patientName && t.patientName.toLowerCase().includes(term)) ||
      (t.hospitalName && t.hospitalName.toLowerCase().includes(term)) ||
      (t.service && t.service.toLowerCase().includes(term)) ||
      (t.id && t.id.toLowerCase().includes(term));

    const matchesStatus = statusFilter === 'all' || (t.status && t.status.toUpperCase() === statusFilter.toUpperCase());
    const matchesService = serviceFilter === 'all' || t.service === serviceFilter;

    return matchesSearch && matchesStatus && matchesService;
  });

  const totalResults = filteredTransactions.length;
  const paginatedTransactions = filteredTransactions.slice((page - 1) * pageSize, page * pageSize);

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setServiceFilter('all');
    setPage(1);
    setShowFilters(false);
  };

  const hasActiveFilters = statusFilter !== 'all' || serviceFilter !== 'all' || search.trim().length > 0;

  const columns: Column<any>[] = [
    {
      header: 'Transaction ID',
      accessor: (t) => (
        <div className="flex flex-col">
          <button 
            onClick={() => navigate(`/admin/transactions/${t.id}`)}
            className="font-medium text-blue-600 hover:underline text-left"
          >
            TX-{t.bookingId || t.id.substring(0, 8)}
          </button>
          <span className="text-xs text-slate-500 ">{new Date(t.date).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      header: 'Patient',
      accessor: (t) => <span className="text-slate-900 font-medium">{t.patientName}</span>,
    },
    {
      header: 'Hospital & Service',
      accessor: (t) => (
        <div className="flex flex-col">
          <span className="text-slate-900 font-medium">{t.hospitalName}</span>
          <span className="text-xs text-slate-500 ">{t.service}</span>
        </div>
      ),
    },
    {
      header: 'Gross Amount',
      accessor: (t) => <span className="font-medium text-slate-900 ">{formatCurrency(t.grossAmount)}</span>,
    },
    {
      header: 'Hospital Share',
      accessor: (t) => (
        <div className="flex flex-col">
          <span className="font-medium text-emerald-600 flex items-center gap-1"><ArrowDownRight size={14} />{formatCurrency(t.hospitalAmount)}</span>
          <span className="text-[10px] text-slate-400">{t.hospitalSharePercentage}% Share</span>
        </div>
      ),
    },
    {
      header: 'MediQuee Commission',
      accessor: (t) => (
        <div className="flex flex-col">
          <span className="font-medium text-blue-600 flex items-center gap-1"><ArrowUpRight size={14} />{formatCurrency(t.mediqueeAmount)}</span>
          <span className="text-[10px] text-slate-400">{t.mediqueeCommissionPercentage}% Share</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (t) => <StatusBadge status={t.status} />
    }
  ];

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Transactions</h2>
          <p className="text-sm text-slate-500">View individual financial records for all patient bookings and services.</p>
        </div>
      </div>

      {showFilters && (
        <div ref={filterRef} className="absolute right-0 top-20 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-900 text-sm">Filter Transactions</h3>
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
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            {availableServices.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Service Type</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                  value={serviceFilter}
                  onChange={(e) => {
                    setServiceFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">All Services</option>
                  {availableServices.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

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
        data={paginatedTransactions}
        columns={columns}
        keyExtractor={(t) => t.id}
        searchPlaceholder="Search by ID, Patient, Hospital, or Service..."
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
        emptyMessage={hasActiveFilters ? "No matching transaction records found." : "No transactions found."}
      />
    </div>
  );
};

export default Transactions;
