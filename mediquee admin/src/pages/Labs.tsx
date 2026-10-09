import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Building2, FlaskConical } from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';
import DataTable from '../components/ui/DataTable';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const Labs: React.FC = () => {
  const { token } = useAdminAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'HOSPITAL_BASED' | 'STANDALONE'>('HOSPITAL_BASED');
  const [labs, setLabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const [totalLabs, setTotalLabs] = useState<number | null>(null);
  const [totalHospitalLabs, setTotalHospitalLabs] = useState<number | null>(null);
  const [totalStandaloneLabs, setTotalStandaloneLabs] = useState<number | null>(null);

  useEffect(() => {
    const fetchKPIs = async () => {
      if (!token) return;
      try {
        const [allRes, hospitalRes, standaloneRes] = await Promise.all([
          fetch(`${API_URL}/laboratories?limit=1`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/laboratories?type=HOSPITAL_BASED&limit=1`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/laboratories?type=STANDALONE&limit=1`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        const allResult = await allRes.json();
        const hospitalResult = await hospitalRes.json();
        const standaloneResult = await standaloneRes.json();

        if (allResult.success) setTotalLabs(allResult.pagination?.total || 0);
        if (hospitalResult.success) setTotalHospitalLabs(hospitalResult.pagination?.total || 0);
        if (standaloneResult.success) setTotalStandaloneLabs(standaloneResult.pagination?.total || 0);
      } catch (err) {
        console.error('Error fetching KPIs', err);
      }
    };
    fetchKPIs();
  }, [token]);

  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({ place: 'ALL', hospitalId: 'ALL' });
  const [pendingFilters, setPendingFilters] = useState({ place: 'ALL', hospitalId: 'ALL' });
  const [hospitals, setHospitals] = useState<any[]>([]);

  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHospitals = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/admin/hospitals?limit=1000`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        if (result.success) setHospitals(result.data);
      } catch (err) {}
    };
    fetchHospitals();
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchLabs = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        type: activeTab,
        ...(searchTerm && { search: searchTerm }),
        ...(activeFilters.place !== 'ALL' && { place: activeFilters.place }),
        ...(activeTab === 'HOSPITAL_BASED' && activeFilters.hospitalId !== 'ALL' && { hospitalId: activeFilters.hospitalId })
      });

      const response = await fetch(`${API_URL}/laboratories?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();
      if (result.success) {
        setLabs(result.data);
        setTotalPages(result.pagination?.totalPages || 1);
      } else {
        setError(result.message || 'Failed to fetch labs');
      }
    } catch (err) {
      setError('An error occurred while fetching labs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, [currentPage, searchTerm, activeFilters, activeTab, token]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const applyFilters = () => {
    setActiveFilters(pendingFilters);
    setCurrentPage(1);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setPendingFilters({ place: 'ALL', hospitalId: 'ALL' });
    setActiveFilters({ place: 'ALL', hospitalId: 'ALL' });
    setCurrentPage(1);
    setShowFilters(false);
  };

  const handleTabChange = (tab: 'HOSPITAL_BASED' | 'STANDALONE') => {
    setActiveTab(tab);
    setSearchTerm('');
    setPendingFilters({ place: 'ALL', hospitalId: 'ALL' });
    setActiveFilters({ place: 'ALL', hospitalId: 'ALL' });
    setCurrentPage(1);
  };

  const hasActiveFilters = activeFilters.place !== 'ALL' || (activeTab === 'HOSPITAL_BASED' && activeFilters.hospitalId !== 'ALL');

  const baseColumns = [
    { accessor: 'sno', header: 'S.No' },
    { accessor: 'name', header: 'Lab Name' },
    { accessor: 'id', header: 'Lab ID' },
  ];

  const hospitalColumns = activeTab === 'HOSPITAL_BASED' 
    ? [{ accessor: 'hospitalName', header: 'Hospital' }] 
    : [];

  const endColumns = [
    { accessor: 'location', header: 'Location' },
    { accessor: 'contactPhone', header: 'Contact' },
    { accessor: (item: any) => (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${item.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
        {item.status || 'Active'}
      </span>
    ), header: 'Status' }
  ];

  const columns = [...baseColumns, ...hospitalColumns, ...endColumns];

  const tableData = labs.map((l, index) => ({
    ...l,
    sno: ((currentPage - 1) * limit) + index + 1,
    type: l.businessType === 'LABORATORY' ? 'STANDALONE' : 'HOSPITAL_BASED',
    hospitalName: l.businessType !== 'LABORATORY' ? l.name : null,
    location: l.city ? `${l.addressLine1 ? l.addressLine1 + ', ' : ''}${l.city}` : (l.addressLine1 || 'N/A'),
    status: 'Active'
  }));

  const FilterPanel = (
    <div ref={filterRef} className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-900">Filters</h3>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-sm text-rose-600 hover:text-rose-700 font-medium">Clear all</button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Place</label>
          <select 
            value={pendingFilters.place}
            onChange={(e) => setPendingFilters({ ...pendingFilters, place: e.target.value })}
            className="w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">All Places</option>
            <option value="Tirupati">Tirupati</option>
            <option value="Chennai">Chennai</option>
            <option value="Bangalore">Bangalore</option>
          </select>
        </div>
        
        {activeTab === 'HOSPITAL_BASED' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Hospital</label>
            <select 
              value={pendingFilters.hospitalId}
              onChange={(e) => setPendingFilters({ ...pendingFilters, hospitalId: e.target.value })}
              className="w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Hospitals</option>
              {hospitals.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>
        )}

        <button 
          onClick={applyFilters}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Labs</h1>
          <p className="text-slate-500">Manage standalone and hospital-based laboratories.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <FlaskConical size={20} />
            </div>
            <h2 className="text-slate-600 font-medium">Total No. of Labs</h2>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold text-slate-900">
              {totalLabs === null ? '—' : totalLabs}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-2">All laboratories</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 size={20} />
            </div>
            <h2 className="text-slate-600 font-medium">Hospital Labs</h2>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold text-slate-900">
              {totalHospitalLabs === null ? '—' : totalHospitalLabs}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-2">Hospital-based laboratories</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FlaskConical size={20} />
            </div>
            <h2 className="text-slate-600 font-medium">Standalone Labs</h2>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold text-slate-900">
              {totalStandaloneLabs === null ? '—' : totalStandaloneLabs}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-2">Independent laboratories</p>
        </div>
      </div>

      <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1 gap-1">
        <button
          onClick={() => handleTabChange('HOSPITAL_BASED')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${activeTab === 'HOSPITAL_BASED' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          Hospital Labs
        </button>
        <button
          onClick={() => handleTabChange('STANDALONE')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${activeTab === 'STANDALONE' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          Standalone Labs
        </button>
      </div>

      <DataTable
        columns={columns}
        data={tableData}
        keyExtractor={(item: any) => item.rawId || item.id}

        onRowClick={(o: any) => navigate(`/admin/labs/${o.id}`)}
        searchPlaceholder={activeTab === 'HOSPITAL_BASED' ? 'Search Hospital Labs...' : 'Search Standalone Labs...'}
        onSearch={handleSearch}
        onFilterClick={() => setShowFilters(!showFilters)}


      />

      {!loading && !error && tableData.length > 0 && (
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-600">
            Showing {((currentPage - 1) * limit) + 1}–{Math.min(currentPage * limit, ((currentPage - 1) * limit) + tableData.length)} of {(totalPages * limit) - (limit - tableData.length)}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 text-slate-600"
            >
              Previous
            </button>
            <span className="px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded-lg">
              {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 text-slate-600"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Labs;
