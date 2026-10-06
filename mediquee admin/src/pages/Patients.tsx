import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable, { Column } from '../components/ui/DataTable';
import { UserPlus, Filter, X, RefreshCw } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';
import { useAdminAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';

const Patients: React.FC = () => {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  
  const [patients, setPatients] = useState<any[]>([]);
  const [totalPatientsCount, setTotalPatientsCount] = useState(0); // for KPI
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const limit = 20;

  // Filters State
  const [ageRange, setAgeRange] = useState('all');
  const [gender, setGender] = useState('all');
  const [city, setCity] = useState('all');
  const [hospitalId, setHospitalId] = useState('all');
  
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Available filter options fetched from backend
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [availableHospitals, setAvailableHospitals] = useState<{id: string, name: string}[]>([]);
  
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

  // Handle click outside for filters popover
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

  // Fetch filter options (cities, hospitals) from the backend
  useEffect(() => {
    const fetchFilters = async () => {
      if (!token) return;
      try {
        const res = await userService.getPatientFilters(token);
        if (res.success && res.data) {
          setAvailableCities(res.data.cities || []);
          setAvailableHospitals(res.data.hospitals || []);
        }
      } catch (err) {
        console.error('Failed to fetch patient filters:', err);
      }
    };
    fetchFilters();
  }, [token]);

  // Fetch patients based on selected filters, pagination, and search
  const fetchPatients = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const filters: any = { 
        role: 'PATIENT',
        page,
        limit
      };
      
      if (gender !== 'all') filters.gender = gender;
      if (city !== 'all') filters.city = city;
      if (hospitalId !== 'all') filters.hospitalId = hospitalId;
      if (debouncedSearch) filters.search = debouncedSearch;
      
      if (ageRange !== 'all') {
        const [min, max] = ageRange.split('-');
        if (min) filters.ageMin = min;
        if (max) filters.ageMax = max === '+' ? '999' : max; // Handling 61+
      }

      const res = await userService.getUsers(token, filters);
      if (res.success && Array.isArray(res.data)) {
        setPatients(res.data);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages);
          setTotalResults(res.pagination.total);
          // If no filters are applied, use this as the KPI total
          if (gender === 'all' && city === 'all' && hospitalId === 'all' && ageRange === 'all' && !debouncedSearch) {
             setTotalPatientsCount(res.pagination.total);
          }
        }
      } else {
        setError('Failed to load patients.');
      }
    } catch (err) {
      console.error('Failed to fetch patients:', err);
      setError('An error occurred while fetching patients.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [token, ageRange, gender, city, hospitalId, debouncedSearch, page]);

  // Reset pagination when a filter changes
  useEffect(() => {
    setPage(1);
  }, [ageRange, gender, city, hospitalId]);

  const handleClearFilters = () => {
    setAgeRange('all');
    setGender('all');
    setCity('all');
    setHospitalId('all');
    setShowFilters(false);
  };

  const columns: Column<any>[] = [
    {
      header: 'S.No',
      accessor: (_: any, idx: number) => <span className="text-slate-500">{((page - 1) * limit) + idx + 1}</span>,
      className: 'w-16'
    },
    {
      header: 'Patient',
      accessor: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-slate-900 ">{user.name}</span>
            <span className="text-xs text-slate-500 ">{user.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Age',
      accessor: (user) => <span className="text-sm text-slate-700">{user.age !== null ? user.age : 'N/A'}</span>,
    },
    {
      header: 'Gender',
      accessor: (user) => <span className="text-sm text-slate-700">{user.gender || 'N/A'}</span>,
    },
    {
      header: 'Place',
      accessor: (user) => <span className="text-sm text-slate-700">{user.city || 'N/A'}</span>,
    },
    {
      header: 'Registered Date',
      accessor: (user) => <span className="text-sm text-slate-700">{new Date(user.createdAt).toLocaleDateString()}</span>,
    }
  ];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-slate-200 shadow-sm">
        <p className="text-slate-700 font-medium mb-4">{error}</p>
        <button onClick={fetchPatients} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }

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
          <label className="block text-xs font-medium text-slate-700 mb-1">Age</label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
            value={ageRange}
            onChange={(e) => setAgeRange(e.target.value)}
          >
            <option value="all">All Ages</option>
            <option value="0-17">0–17</option>
            <option value="18-30">18–30</option>
            <option value="31-45">31–45</option>
            <option value="46-60">46–60</option>
            <option value="61-+">61+</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Gender</label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="all">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Place</label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            <option value="all">All Places</option>
            {availableCities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Hospital</label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 truncate"
            value={hospitalId}
            onChange={(e) => setHospitalId(e.target.value)}
          >
            <option value="all">All Hospitals</option>
            {availableHospitals.map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <button 
            onClick={handleClearFilters}
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 ">Patients</h2>
          <p className="text-sm text-slate-500 ">View and manage registered patient records</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="Total Patients" value={totalPatientsCount || totalResults} icon={UserPlus} />
      </div>

      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 bg-white/60 flex items-center justify-center backdrop-blur-[1px] rounded-xl">
             <div className="text-blue-600 animate-pulse font-medium">Loading patients...</div>
          </div>
        )}
        <div className="relative">
          {showFilters && FilterPopover}
          <DataTable 
            data={patients}
            columns={columns}
            keyExtractor={(user) => user.id}
            searchPlaceholder="Search patients by name, email or phone..."
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
            onRowClick={(patient) => navigate(`/admin/patients/${patient.id}`)}
            emptyMessage="No patients found."
          />
        </div>
      </div>
    </div>
  );
};

export default Patients;
