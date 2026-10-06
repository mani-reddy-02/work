import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable, { Column } from '../components/ui/DataTable';
import { Filter, X, Search } from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';

const Departments: React.FC = () => {
  const { token } = useAdminAuth();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState<any[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  // Search
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState({
    hospitalId: 'all',
    diseaseId: 'all',
    doctorId: 'all'
  });
  
  // Filter Options from Backend
  const [filterOptions, setFilterOptions] = useState({
    hospitals: [],
    diseases: [],
    doctors: []
  });

  // Fetch filters
  useEffect(() => {
    const fetchFilters = async () => {
      if (!token) return;
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
        const res = await fetch(`${API_URL}/admin/departments/filters`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setFilterOptions(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch filters:', err);
      }
    };
    fetchFilters();
  }, [token]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Handle outside click for filters
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    }
    if (showFilters) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilters]);

  const fetchDepartments = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      if (debouncedSearch) queryParams.append('search', debouncedSearch);
      if (filters.hospitalId !== 'all') queryParams.append('hospitalId', filters.hospitalId);
      if (filters.diseaseId !== 'all') queryParams.append('diseaseId', filters.diseaseId);
      if (filters.doctorId !== 'all') queryParams.append('doctorId', filters.doctorId);

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${API_URL}/admin/departments?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        setDepartments(data.data);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalResults(data.pagination.total);
        } else {
          setTotalResults(data.data.length);
          setTotalPages(1);
        }
      } else {
        setError('Failed to load departments.');
      }
    } catch (err) {
      console.error('Failed to fetch departments:', err);
      setError('An error occurred while fetching departments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [token, debouncedSearch, page, filters]);

  const applyFilters = () => {
    setPage(1);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({ hospitalId: 'all', diseaseId: 'all', doctorId: 'all' });
    setPage(1);
    setShowFilters(false);
  };

  const columns: Column<any>[] = [
    {
      header: 'S.No',
      accessor: (_: any, idx: number) => <span className="text-slate-500">{((page - 1) * limit) + idx + 1}</span>,
      className: 'w-16'
    },
    {
      header: 'Department',
      accessor: (d) => (
        <span className="font-medium text-slate-900">{d.name}</span>
      ),
    },
    {
      header: 'Diseases',
      accessor: (d) => <span className="text-sm font-medium text-slate-700">{d.diseaseCount || 0}</span>,
    },
    {
      header: 'Doctors',
      accessor: (d) => <span className="text-sm font-medium text-slate-700">{d.doctorCount || 0}</span>,
    },
    {
      header: 'Hospitals',
      accessor: (d) => <span className="text-sm font-medium text-slate-700">{d.hospitalCount || 0}</span>,
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
          <label className="block text-xs font-medium text-slate-700 mb-1">Hospital</label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2"
            value={filters.hospitalId}
            onChange={(e) => setFilters({...filters, hospitalId: e.target.value})}
          >
            <option value="all">All Hospitals</option>
            {filterOptions.hospitals.map((h: any) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Disease</label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2"
            value={filters.diseaseId}
            onChange={(e) => setFilters({...filters, diseaseId: e.target.value})}
          >
            <option value="all">All Diseases</option>
            {filterOptions.diseases.map((d: any) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Doctor</label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2"
            value={filters.doctorId}
            onChange={(e) => setFilters({...filters, doctorId: e.target.value})}
          >
            <option value="all">All Doctors</option>
            {filterOptions.doctors.map((d: any) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <button 
            onClick={clearFilters}
            className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Clear
          </button>
          <button 
            onClick={applyFilters}
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Departments</h2>
          <p className="text-sm text-slate-500">Manage clinical departments and specializations.</p>
        </div>
      </div>

      <div className="relative">
        {showFilters && FilterPopover}
        {loading && (
          <div className="absolute inset-0 z-10 bg-white/60 flex items-center justify-center backdrop-blur-[1px] rounded-xl">
             <div className="text-blue-600 animate-pulse font-medium">Loading departments...</div>
          </div>
        )}
        <DataTable 
          data={departments}
          columns={columns}
          keyExtractor={(d) => d.id}
          onRowClick={(d) => navigate(`/admin/departments/${d.id}`)}
          searchPlaceholder="Search departments..."
          onSearch={setSearch}
          onFilterClick={(e) => {
            e.stopPropagation();
            setShowFilters(!showFilters);
          }}
          emptyMessage="No departments found. Try adjusting your search or filters."
          pagination={{
            currentPage: page,
            totalPages,
            totalResults,
            pageSize: limit,
            onPageChange: (newPage) => setPage(newPage)
          }}
        />
        
        {!loading && departments.length > 0 && (
          <div className="mt-4 text-sm text-slate-500">
            Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, totalResults)} of {totalResults} departments
          </div>
        )}
      </div>
    </div>
  );
};

export default Departments;
