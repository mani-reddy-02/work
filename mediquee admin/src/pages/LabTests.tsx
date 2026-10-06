import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { Activity, Clock, CheckCircle, XCircle, FileText, FlaskConical, Filter, X } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';
import { useAdminAuth } from '../contexts/AuthContext';

const LabTests: React.FC = () => {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // KPI state
  const [kpis, setKpis] = useState({
    totalOrders: 0, pending: 0, inProgress: 0, completed: 0, cancelled: 0
  });

  // Pagination & Search
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const limit = 20;

  // Filters
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState({
    status: 'ALL',
    age: 'ALL',
    gender: 'ALL',
    place: 'ALL'
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    if (isFilterOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterOpen]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString()
      });
      if (debouncedSearch) queryParams.append('search', debouncedSearch);
      if (filters.status !== 'ALL') queryParams.append('status', filters.status);
      if (filters.gender !== 'ALL') queryParams.append('gender', filters.gender);
      if (filters.place !== 'ALL') queryParams.append('place', filters.place);
      
      if (filters.age !== 'ALL') {
        if (filters.age === '61+') {
          queryParams.append('ageMin', '61');
        } else {
          const parts = filters.age.split('–');
          if (parts.length === 2) {
            queryParams.append('ageMin', parts[0]);
            queryParams.append('ageMax', parts[1]);
          }
        }
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${API_URL}/admin/lab-bookings?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setOrders(data.data);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalResults(data.pagination.total);
        }
        
        // Fetch KPIs if not filtered
        if (debouncedSearch === '' && filters.status === 'ALL' && filters.age === 'ALL' && filters.gender === 'ALL' && filters.place === 'ALL') {
          const allRes = await fetch(`${API_URL}/admin/lab-bookings?limit=1000`, { headers: { Authorization: `Bearer ${token}` } });
          const allData = await allRes.json();
          if (allData.success && Array.isArray(allData.data)) {
            const all = allData.data;
            setKpis({
              totalOrders: all.length,
              pending: all.filter((o: any) => ['REQUESTED', 'ASSIGNED'].includes(o.status)).length,
              inProgress: all.filter((o: any) => ['SAMPLE_COLLECTED', 'IN_LAB_PROCESSING'].includes(o.status)).length,
              completed: all.filter((o: any) => o.status === 'REPORT_READY').length,
              cancelled: all.filter((o: any) => o.status === 'CANCELLED').length,
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch lab orders:', err);
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, debouncedSearch, filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleClearFilters = () => {
    setFilters({ status: 'ALL', age: 'ALL', gender: 'ALL', place: 'ALL' });
    setIsFilterOpen(false);
  };

  const columns: Column<any>[] = [
    {
      header: 'S.No',
      accessor: (_, index) => <span className="text-sm text-slate-500">{((currentPage - 1) * limit) + index + 1}</span>,
    },
    {
      header: 'Order ID',
      accessor: (o) => <span className="font-medium text-slate-900">{o.id}</span>,
    },
    {
      header: 'Tests',
      accessor: (o) => (
        <div className="flex flex-col max-w-xs">
          <span className="font-medium text-slate-900 truncate" title={o.testNames}>{o.testNames || 'N/A'}</span>
          <span className="text-xs text-slate-500">{o.testCount} tests</span>
        </div>
      ),
    },
    {
      header: 'Patient',
      accessor: 'patientName',
    },
    {
      header: 'Lab / Hospital',
      accessor: (o) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900">{o.hospitalName}</span>
          <span className="text-xs text-slate-500">{o.bookingType?.replace('_', ' ')}</span>
        </div>
      ),
    },
    {
      header: 'Date',
      accessor: (o) => <span className="text-sm text-slate-700">{o.date}</span>,
    },
    {
      header: 'Time',
      accessor: (o) => <span className="text-sm text-slate-700">{o.time || 'N/A'}</span>,
    },
    {
      header: 'Status',
      accessor: (o) => <StatusBadge status={o.status} />,
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Lab Tests & Orders</h2>
          <p className="text-sm text-slate-500">Manage lab test bookings and diagnostics.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard title="Total Orders" value={kpis.totalOrders} icon={FlaskConical} />
        <KpiCard title="Pending" value={kpis.pending} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <KpiCard title="In Progress" value={kpis.inProgress} icon={Activity} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <KpiCard title="Completed" value={kpis.completed} icon={CheckCircle} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <KpiCard title="Cancelled" value={kpis.cancelled} icon={XCircle} iconColor="text-rose-600" iconBg="bg-rose-50" />
      </div>

      <div className="relative">
        {isFilterOpen && (
          <div ref={filterRef} className="absolute right-0 top-16 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-4 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Filters</h3>
              <button onClick={() => setIsFilterOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                <select 
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="REQUESTED">Requested</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="SAMPLE_COLLECTED">Sample Collected</option>
                  <option value="IN_LAB_PROCESSING">In Lab Processing</option>
                  <option value="REPORT_READY">Report Ready</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Age</label>
                <select 
                  value={filters.age}
                  onChange={(e) => setFilters({...filters, age: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="ALL">All Ages</option>
                  <option value="0–17">0–17</option>
                  <option value="18–30">18–30</option>
                  <option value="31–45">31–45</option>
                  <option value="46–60">46–60</option>
                  <option value="61+">61+</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Gender</label>
                <select 
                  value={filters.gender}
                  onChange={(e) => setFilters({...filters, gender: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="ALL">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Place / City</label>
                <select 
                  value={filters.place}
                  onChange={(e) => setFilters({...filters, place: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="ALL">All Places</option>
                  <option value="Tirupati">Tirupati</option>
                  <option value="Kurnool">Kurnool</option>
                  <option value="Vijayawada">Vijayawada</option>
                  <option value="Hyderabad">Hyderabad</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button 
                onClick={handleClearFilters}
                className="flex-1 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Clear
              </button>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Apply
              </button>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium">Loading lab orders...</p>
          </div>
        ) : (
          <DataTable 
            data={orders}
            columns={columns}
            keyExtractor={(o) => o.id}
            searchPlaceholder="Search by ID, Patient, Lab or Test..."
            onSearch={setSearch}
            onFilterClick={(e) => {
              e.stopPropagation();
              setIsFilterOpen(!isFilterOpen);
            }}
            onRowClick={(o) => navigate(`/admin/lab-tests/${o.rawId}`)}
            emptyMessage={
              (debouncedSearch || Object.values(filters).some(v => v !== 'ALL')) 
                ? "No lab tests match the selected filters. Try adjusting your search or filters." 
                : "No lab test bookings found."
            }
            pagination={{
              currentPage,
              totalPages,
              totalResults,
              pageSize: limit,
              onPageChange: setCurrentPage
            }}
          />
        )}
      </div>
    </div>
  );
};

export default LabTests;
