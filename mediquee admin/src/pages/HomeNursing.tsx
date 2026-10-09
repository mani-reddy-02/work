import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { Activity, Clock, CheckCircle, HeartPulse, X } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';
import { useAdminAuth } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const HomeNursing: React.FC = () => {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const limit = 20;

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    gender: 'all',
    ageRange: 'all',
    city: 'all',
    status: 'ALL'
  });

  const [kpis, setKpis] = useState({
    totalRequests: 0,
    pending: 0,
    assigned: 0,
    inProgress: 0,
    completed: 0
  });

  // KPI Fetch
  useEffect(() => {
    const fetchKPIs = async () => {
      if (!token) return;
      try {
        const fetchStatus = async (status: string) => {
          const res = await fetch(`${API_URL}/admin/home-nursing?limit=1&status=${status}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          return data.pagination?.total || 0;
        };
        const fetchTotal = async () => {
          const res = await fetch(`${API_URL}/admin/home-nursing?limit=1`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          return data.pagination?.total || 0;
        };

        const [total, pending, assigned, inProgress, completed] = await Promise.all([
          fetchTotal(),
          fetchStatus('CONFIRMED'),
          fetchStatus('ASSIGNED'),
          fetchStatus('IN_PROGRESS'),
          fetchStatus('COMPLETED')
        ]);
        setKpis({ totalRequests: total, pending, assigned, inProgress, completed });
      } catch (err) {
        console.error(err);
      }
    };
    fetchKPIs();
  }, [token]);

  // Data fetch
  useEffect(() => {
    let active = true;
    const loadOrders = async () => {
      if (!token) return;
      setLoading(true);
      setError(null);
      
      try {
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: limit.toString(),
        });
        
        if (search) queryParams.append('search', search);
        if (filters.gender !== 'all') queryParams.append('gender', filters.gender);
        if (filters.city !== 'all') queryParams.append('city', filters.city);
        if (filters.status !== 'ALL') queryParams.append('status', filters.status);
        
        if (filters.ageRange !== 'all') {
          const [min, max] = filters.ageRange.split('-');
          if (min) queryParams.append('ageMin', min);
          if (max && max !== '+') queryParams.append('ageMax', max);
        }

        const res = await fetch(`${API_URL}/admin/home-nursing?${queryParams.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        const result = await res.json();
        
        if (!active) return;

        if (result.success && result.data) {
          setOrders(result.data);
          if (result.pagination) {
            setTotalPages(result.pagination.totalPages);
            setTotalResults(result.pagination.total);
          } else {
            setTotalPages(1);
            setTotalResults(result.data.length);
          }
        } else {
          setError('Failed to fetch home nursing orders');
        }
      } catch (err: any) {
        if (active) setError(err.message || 'Network error');
      } finally {
        if (active) setLoading(false);
      }
    };

    const debounceTimeout = setTimeout(loadOrders, 300);
    return () => {
      active = false;
      clearTimeout(debounceTimeout);
    };
  }, [token, search, currentPage, filters]);

  const handleSearch = (term: string) => {
    setSearch(term);
    setCurrentPage(1);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ gender: 'all', ageRange: 'all', city: 'all', status: 'ALL' });
    setCurrentPage(1);
  };

  const columns: Column<any>[] = [
    {
      header: 'S.No',
      accessor: (o, idx) => <span className="text-slate-500">{((currentPage - 1) * limit) + idx + 1}</span>,
    },
    {
      header: 'Booking ID',
      accessor: (o) => <span className="font-medium text-slate-900">{o.id}</span>,
    },
    {
      header: 'Patient',
      accessor: 'patientName',
    },
    {
      header: 'Service / Hospital',
      accessor: (o) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900">{o.serviceName}</span>
          <span className="text-xs text-slate-500">{o.hospitalName}</span>
        </div>
      ),
    },
    {
      header: 'Provider',
      accessor: (o) => <span className="text-sm text-slate-700">{o.nurseName}</span>,
    },
    {
      header: 'Schedule',
      accessor: (o) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-900">{o.date}</span>
          <span className="text-xs text-slate-500">{o.time} • {o.duration}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (o) => <StatusBadge status={o.status} />,
    },
    {
      header: 'Actions',
      accessor: (o) => (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/admin/home-nursing/${o.rawId}`);
          }}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Manage
        </button>
      ),
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Home Nursing</h2>
          <p className="text-sm text-slate-500">Manage home nursing requests and provider assignments.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard title="Total Requests" value={kpis.totalRequests} icon={HeartPulse} />
        <KpiCard title="Pending" value={kpis.pending} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <KpiCard title="Assigned" value={kpis.assigned} icon={Activity} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <KpiCard title="In Progress" value={kpis.inProgress} icon={Activity} iconColor="text-indigo-600" iconBg="bg-indigo-50" />
        <KpiCard title="Completed" value={kpis.completed} icon={CheckCircle} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
      </div>

      {showFilters && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Advanced Filters</h3>
            <button onClick={clearFilters} className="text-sm text-blue-600 hover:text-blue-700 font-medium">Clear All</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Age</label>
              <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" value={filters.ageRange} onChange={(e) => handleFilterChange('ageRange', e.target.value)}>
                <option value="all">All Ages</option>
                <option value="0-17">0 - 17 Years</option>
                <option value="18-30">18 - 30 Years</option>
                <option value="31-45">31 - 45 Years</option>
                <option value="46-60">46 - 60 Years</option>
                <option value="61-+">61+ Years</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Gender</label>
              <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" value={filters.gender} onChange={(e) => handleFilterChange('gender', e.target.value)}>
                <option value="all">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Place/City</label>
              <input type="text" placeholder="Enter city..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" value={filters.city === 'all' ? '' : filters.city} onChange={(e) => handleFilterChange('city', e.target.value || 'all')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
              <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                <option value="ALL">All Statuses</option>
                <option value="CONFIRMED">Confirmed / Pending</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl">{error}</div>}

      <DataTable 
        data={orders}
        columns={columns}
        keyExtractor={(o) => o.rawId}
        searchPlaceholder="Search Home Nursing bookings..."
        onSearch={handleSearch}
        onRowClick={(o) => navigate(`/admin/home-nursing/${o.rawId}`)}
        onFilterClick={() => setShowFilters(!showFilters)}
        pagination={{
          currentPage,
          totalPages,
          totalResults,
          pageSize: limit,
          onPageChange: setCurrentPage
        }}
      />
    </div>
  );
};

export default HomeNursing;
