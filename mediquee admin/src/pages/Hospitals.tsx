import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { Hospital } from '../types';
import { Building2, Plus, Filter, X, RefreshCw } from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';
import { hospitalService } from '../services/hospitalService';
import KpiCard from '../components/ui/KpiCard';

const Hospitals: React.FC = () => {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [totalCount, setTotalCount] = useState(0); 
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const limit = 20;

  // Location filter
  const [locationFilter, setLocationFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add Hospital Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    businessType: 'HOSPITAL',
    facilityType: 'GENERAL',
    registrationNumber: ''
  });
  const [addError, setAddError] = useState('');

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
      // Build query string since hospitalService.getHospitals doesn't naturally accept filters argument in its default definition.
      // Assuming hospitalService.getHospitals can be extended or we use fetch directly for the new API.
      // Let's just use raw fetch to guarantee we hit our new query parameters perfectly.
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      if (debouncedSearch) queryParams.append('search', debouncedSearch);
      if (locationFilter !== 'all') queryParams.append('location', locationFilter);

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
          if (locationFilter === 'all' && !debouncedSearch) {
             setTotalCount(data.pagination.total);
          }
        } else {
          // Fallback if pagination object is missing
          setTotalResults(data.data.length);
          setTotalPages(1);
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
  }, [token, debouncedSearch, page, locationFilter]);

  // Reset pagination on filter change
  useEffect(() => {
    setPage(1);
  }, [locationFilter]);

  const handleAddHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');

    if (!addForm.name || !addForm.email || !addForm.phone || !addForm.address || !addForm.city || !addForm.state) {
      setAddError('Please fill in all required fields.');
      return;
    }

    // Basic email and phone validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addForm.email)) {
      setAddError('Invalid email format.');
      return;
    }
    if (addForm.phone.length < 10) {
      setAddError('Phone number must be at least 10 digits.');
      return;
    }

    setIsAdding(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
      const res = await fetch(`${API_URL}/admin/hospitals`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(addForm)
      });
      const data = await res.json();
      if (data.success) {
        setIsAddModalOpen(false);
        setAddForm({ name: '', email: '', phone: '', address: '', city: '', state: '', businessType: 'HOSPITAL', facilityType: 'GENERAL', registrationNumber: '' });
        fetchHospitals(); // Refresh the list
      } else {
        setAddError(data.message || 'Failed to add hospital.');
      }
    } catch (err) {
      setAddError('Network error occurred.');
    } finally {
      setIsAdding(false);
    }
  };

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

        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <button 
            onClick={() => { setLocationFilter('all'); setShowFilters(false); }}
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
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Add Hospital
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Hospitals" value={totalCount || totalResults} icon={Building2} />
      </div>

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

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden my-8">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Add New Hospital</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddHospital} className="p-6 space-y-6">
              {addError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{addError}</div>}
              
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3 border-b pb-2">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Hospital Name *</label>
                    <input type="text" value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Registration / License No.</label>
                    <input type="text" value={addForm.registrationNumber} onChange={e => setAddForm({...addForm, registrationNumber: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Business Type</label>
                    <select value={addForm.businessType} onChange={e => setAddForm({...addForm, businessType: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg text-sm">
                      <option value="HOSPITAL">Hospital</option>
                      <option value="LABORATORY">Standalone Laboratory</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Facility Type</label>
                    <select value={addForm.facilityType} onChange={e => setAddForm({...addForm, facilityType: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg text-sm">
                      <option value="GENERAL">General</option>
                      <option value="SPECIALTY">Specialty</option>
                      <option value="MULTI_SPECIALTY">Multi-Specialty</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3 border-b pb-2">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Email *</label>
                    <input type="email" value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Phone *</label>
                    <input type="tel" value={addForm.phone} onChange={e => setAddForm({...addForm, phone: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg text-sm" required />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3 border-b pb-2">Location</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Complete Address *</label>
                    <input type="text" value={addForm.address} onChange={e => setAddForm({...addForm, address: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">City *</label>
                    <input type="text" value={addForm.city} onChange={e => setAddForm({...addForm, city: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">State *</label>
                    <input type="text" value={addForm.state} onChange={e => setAddForm({...addForm, state: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg text-sm" required />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors" disabled={isAdding}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50" disabled={isAdding}>
                  {isAdding ? 'Saving...' : 'Add Hospital'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hospitals;
