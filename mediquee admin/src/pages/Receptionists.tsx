import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable, { Column } from '../components/ui/DataTable';
import { Users, Eye, RefreshCw, X, Building2 } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';
import { useAdminAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';

const Receptionists: React.FC = () => {
  const { token } = useAdminAuth();
  const navigate = useNavigate();

  const [receptionists, setReceptionists] = useState<any[]>([]);
  const [totalReceptionistsCount, setTotalReceptionistsCount] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const limit = 20;

  // Filters State
  const [hospitalId, setHospitalId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Available filters from backend
  const [availableHospitals, setAvailableHospitals] = useState<{ id: string; name: string }[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset to page 1 on search change
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Click outside to close filter popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    }
    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilters]);

  // Fetch filter options (hospitals) from backend
  useEffect(() => {
    const fetchFilters = async () => {
      if (!token) return;
      try {
        const res = await userService.getReceptionistFilters(token);
        if (res.success && Array.isArray(res.data?.hospitals)) {
          setAvailableHospitals(res.data.hospitals);
        }
      } catch (err) {
        console.error('Failed to fetch receptionist filters:', err);
      }
    };
    fetchFilters();
  }, [token]);

  // Fetch real receptionists data
  const fetchReceptionists = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const filters: any = {
        role: 'RECEPTIONIST',
        page,
        limit
      };

      if (debouncedSearch) filters.search = debouncedSearch;
      if (hospitalId !== 'all') filters.hospitalId = hospitalId;
      if (statusFilter !== 'all') filters.status = statusFilter;

      const res = await userService.getUsers(token, filters);
      if (res.success && Array.isArray(res.data)) {
        setReceptionists(res.data);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages);
          setTotalResults(res.pagination.total);
          // Set KPI count if no filters are applied
          if (hospitalId === 'all' && statusFilter === 'all' && !debouncedSearch) {
            setTotalReceptionistsCount(res.pagination.total);
          }
        }
      } else {
        setError('Failed to load receptionists.');
      }
    } catch (err) {
      console.error('Failed to fetch receptionists:', err);
      setError('An error occurred while fetching receptionists.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceptionists();
  }, [token, debouncedSearch, page, hospitalId, statusFilter]);

  // Reset pagination when filter changes
  useEffect(() => {
    setPage(1);
  }, [hospitalId, statusFilter]);

  const handleClearFilters = () => {
    setHospitalId('all');
    setStatusFilter('all');
    setPage(1);
    setShowFilters(false);
  };

  const columns: Column<any>[] = [
    {
      header: 'S.No',
      accessor: (_: any, idx: number) => (
        <span className="text-slate-500 font-medium text-xs">
          {((page - 1) * limit) + idx + 1}
        </span>
      ),
      className: 'w-16'
    },
    {
      header: 'Receptionist',
      accessor: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 font-semibold text-sm shrink-0">
            {r.name ? r.name.charAt(0).toUpperCase() : 'R'}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-slate-900 hover:text-blue-600 transition-colors">
              {r.name}
            </span>
            <span className="text-xs text-slate-500">{r.email || 'No email provided'}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Contact',
      accessor: (r) => (
        <div className="flex flex-col text-sm text-slate-700">
          <span>{r.phone || 'N/A'}</span>
          {r.city && r.city !== 'N/A' && (
            <span className="text-xs text-slate-500">{r.city}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Associated Hospital',
      accessor: (r) => {
        if (r.hospitalId) {
          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/admin/hospitals/${r.hospitalId}`);
              }}
              className="text-sm text-blue-600 hover:underline font-medium text-left truncate max-w-[220px]"
            >
              {r.hospitalName}
            </button>
          );
        }
        return <span className="text-sm text-slate-600">{r.hospitalName || 'Not Assigned'}</span>;
      },
    },
    {
      header: 'Role / Designation',
      accessor: (r) => (
        <span className="text-sm text-slate-800 font-medium">
          {r.designation || 'Front Desk / Receptionist'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (r) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/admin/receptionists/${r.id}`);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
          title="View Receptionist Details"
        >
          <Eye size={14} />
          View
        </button>
      ),
      className: 'w-24 text-right'
    }
  ];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <p className="text-slate-700 font-medium mb-4">{error}</p>
        <button
          onClick={fetchReceptionists}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }

  const FilterPopover = (
    <div
      ref={filterRef}
      className="absolute right-0 top-12 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-4"
    >
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900 text-sm">Filter Receptionists</h3>
        <button
          onClick={() => setShowFilters(false)}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Associated Hospital
          </label>
          <select
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-2 truncate"
            value={hospitalId}
            onChange={(e) => setHospitalId(e.target.value)}
          >
            <option value="all">All Hospitals</option>
            {availableHospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Account Status
          </label>
          <select
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div className="flex gap-2 pt-3 border-t border-slate-100">
          <button
            onClick={handleClearFilters}
            className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={() => setShowFilters(false)}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Receptionist Management</h2>
          <p className="text-sm text-slate-500">
            View and manage hospital front desk staff and reception personnel
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Receptionists"
          value={totalReceptionistsCount || totalResults}
          icon={Users}
        />
      </div>

      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 bg-white/60 flex items-center justify-center backdrop-blur-[1px] rounded-xl">
            <div className="text-blue-600 animate-pulse font-medium text-sm">
              Loading receptionists...
            </div>
          </div>
        )}

        <div className="relative">
          {showFilters && FilterPopover}
          <DataTable
            data={receptionists}
            columns={columns}
            keyExtractor={(r) => r.id}
            searchPlaceholder="Search receptionists by name, email, phone, or hospital..."
            onSearch={setSearch}
            onFilterClick={(e) => {
              e.stopPropagation();
              setShowFilters(!showFilters);
            }}
            pagination={{
              currentPage: page,
              totalPages,
              totalResults,
              pageSize: limit,
              onPageChange: (newPage) => setPage(newPage)
            }}
            onRowClick={(rec) => navigate(`/admin/receptionists/${rec.id}`)}
            emptyMessage="No receptionists found matching your criteria."
          />
        </div>
      </div>
    </div>
  );
};

export default Receptionists;
