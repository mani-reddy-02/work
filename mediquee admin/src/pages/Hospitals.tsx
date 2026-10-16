import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { Hospital } from '../types';
import { Building2, Clock, ShieldCheck, X, RefreshCw } from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';
import KpiCard from '../components/ui/KpiCard';

const Hospitals: React.FC = () => {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const limit = 20;

  // Summary counts for hospitals only
  const [summaryStats, setSummaryStats] = useState({
    total: 0,
    approved: 0,
    pending: 0
  });

  // Location & Verification filters
  const [locationFilter, setLocationFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); 
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    }
    if (showFilters) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilters]);

  const fetchHospitals = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      if (debouncedSearch) queryParams.append('search', debouncedSearch);
      if (locationFilter !== 'all') queryParams.append('location', locationFilter);
      if (verificationFilter !== 'all') queryParams.append('verificationStatus', verificationFilter);

      const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
      const res = await fetch(`${API_URL}/admin/hospitals?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        setHospitals(data.data);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalResults(data.pagination.total);
        } else {
          setTotalResults(data.data.length);
          setTotalPages(1);
        }

        if (data.summary) {
          setSummaryStats({
            total: data.summary.total,
            approved: data.summary.approved,
            pending: data.summary.pending
          });
        }

        // Dynamically extract locations
        if (availableLocations.length === 0) {
          const locs = new Set<string>();
          data.data.forEach((h: any) => {
             if (h.city && h.city !== 'N/A') locs.add(h.city);
          });
          setAvailableLocations(Array.from(locs).sort());
        }
      } else {
        setError('Failed to load hospitals.');
      }
    } catch (err) {
      console.error('Failed to fetch admin hospitals:', err);
      setError('An error occurred while fetching hospitals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, [token, debouncedSearch, page, locationFilter, verificationFilter]);

  // Reset pagination on filter change
  useEffect(() => {
    setPage(1);
  }, [locationFilter, verificationFilter]);

  const columns: Column<any>[] = [
    {
      header: 'S.No',
      accessor: (_: any, idx: number) => <span className="text-slate-500">{((page - 1) * limit) + idx + 1}</span>,
      className: 'w-16'
    },
    {
      header: 'Hospital',
      accessor: (h) => (
        <div className="flex flex-col cursor-pointer" onClick={() => navigate(`/admin/hospitals/${h.id}`)}>
          <span className="font-medium text-slate-900 hover:text-blue-600">{h.name}</span>
          <span className="text-xs text-slate-500">{h.registrationNumber || h.businessType}</span>
        </div>
      ),
    },
    {
      header: 'Location',
      accessor: (h) => (
        <div className="flex flex-col">
          <span className="text-sm text-slate-700">{h.city}</span>
          <span className="text-xs text-slate-500">{h.state}</span>
        </div>
      ),
    },
    {
      header: 'Departments',
      accessor: (h) => <span className="text-sm font-medium text-slate-700">{h.departmentCount || 0}</span>,
    },
    {
      header: 'Doctors',
      accessor: (h) => <span className="text-sm font-medium text-slate-700">{h.doctorCount || 0}</span>,
    },
    {
      header: 'Verification',
      accessor: (h) => <StatusBadge status={h.verificationStatus} />,
    },
    {
      header: 'Admin Commission',
      accessor: (h) => (
        <span className="text-sm font-semibold text-slate-900">
          {h.hospitalShare !== null && h.hospitalShare !== undefined ? `${100 - Number(h.hospitalShare)}%` : <span className="text-xs font-normal text-slate-400">Not configured</span>}
        </span>
      ),
    },
    {
      header: 'Hospital Share',
      accessor: (h) => (
        <span className="text-sm font-semibold text-slate-900">
          {h.hospitalShare !== null && h.hospitalShare !== undefined ? `${h.hospitalShare}%` : <span className="text-xs font-normal text-slate-400">Not configured</span>}
        </span>
      ),
    },
    {
      header: 'Commission Status',
      accessor: (h) => {
        const isConfigured = h.hospitalShare !== null && h.hospitalShare !== undefined;
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
            isConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
          }`}>
            {isConfigured ? 'Configured' : 'Not configured'}
          </span>
        );
      },
    }
  ];

  const FilterPopover = (
    <div ref={filterRef} className="absolute right-0 top-12 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-slate-900">Filters</h3>
        <button onClick={() => setShowFilters(false)} className="text-slate-400 hover:text-slate-600">
          <X size={16} />
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Location (City)</label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <option value="all">All Locations</option>
            {availableLocations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Verification Status</label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
            value={verificationFilter}
            onChange={(e) => {
              setVerificationFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Verification Statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>

        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <button 
            onClick={() => { setLocationFilter('all'); setVerificationFilter('all'); setPage(1); setShowFilters(false); }}
            className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Clear
          </button>
          <button 
            onClick={() => setShowFilters(false)}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Hospital Management</h2>
          <p className="text-sm text-slate-500">Manage hospitals, locations, and view complete profiles.</p>
        </div>
        <button
          onClick={fetchHospitals}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard 
          title="Total Hospitals" 
          value={summaryStats.total} 
          icon={Building2}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          onClick={() => {
            setVerificationFilter('all');
            setPage(1);
          }}
          className={`transition-all ${verificationFilter === 'all' ? 'ring-2 ring-blue-500/20' : ''}`}
        />
        <KpiCard 
          title="Pending Verification" 
          value={summaryStats.pending} 
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          onClick={() => {
            setVerificationFilter(prev => prev === 'PENDING' ? 'all' : 'PENDING');
            setPage(1);
          }}
          className={`transition-all ${verificationFilter === 'PENDING' ? 'ring-2 ring-amber-500 shadow-md' : ''}`}
        />
        <KpiCard 
          title="Approved Hospitals" 
          value={summaryStats.approved} 
          icon={ShieldCheck}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          onClick={() => {
            setVerificationFilter(prev => prev === 'APPROVED' ? 'all' : 'APPROVED');
            setPage(1);
          }}
          className={`transition-all ${verificationFilter === 'APPROVED' ? 'ring-2 ring-emerald-500 shadow-md' : ''}`}
        />
      </div>

      {(verificationFilter !== 'all' || locationFilter !== 'all') && (
        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <span className="font-semibold text-slate-700">Active Filters:</span>
          {verificationFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-slate-800 font-medium border border-slate-200 shadow-xs">
              Status: {verificationFilter === 'APPROVED' ? 'Approved' : 'Pending'}
              <button 
                onClick={() => { setVerificationFilter('all'); setPage(1); }} 
                className="hover:text-red-600 ml-0.5 text-slate-400"
                title="Remove filter"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {locationFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-slate-800 font-medium border border-slate-200 shadow-xs">
              Location: {locationFilter}
              <button 
                onClick={() => { setLocationFilter('all'); setPage(1); }} 
                className="hover:text-red-600 ml-0.5 text-slate-400"
                title="Remove filter"
              >
                <X size={12} />
              </button>
            </span>
          )}
          <button 
            onClick={() => { setLocationFilter('all'); setVerificationFilter('all'); setPage(1); }} 
            className="text-blue-600 hover:underline font-medium text-xs ml-auto"
          >
            Clear all filters
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          {error}
        </div>
      )}

      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 bg-white/60 flex items-center justify-center backdrop-blur-[1px] rounded-xl">
             <div className="text-blue-600 animate-pulse font-medium">Loading hospitals...</div>
          </div>
        )}
        <div className="relative">
          {showFilters && FilterPopover}
          <DataTable 
            data={hospitals}
            columns={columns}
            keyExtractor={(h) => h.id}
            searchPlaceholder="Search hospitals by name, ID, or city..."
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
            onRowClick={(h) => navigate(`/admin/hospitals/${h.id}`)}
            emptyMessage="No hospitals found."
          />
        </div>
      </div>
    </div>
  );
};

export default Hospitals;
