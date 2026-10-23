import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { Appointment } from '../types';
import { Activity, Clock, CheckCircle, XCircle, Calendar, CalendarDays, Filter, X } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';
import { useAdminAuth } from '../contexts/AuthContext';
import { appointmentService } from '../services/appointmentService';
import { DateRangeFilter, DateFilterValue } from '../components/ui/DateRangeFilter';

const OPBookings: React.FC = () => {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  
  // State
  const [bookings, setBookings] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState({
    total: 0, today: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0
  });

  // Pagination & Filtering State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const limit = 20;

  const [search, setSearch] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Date Filtering State with Presets (Today, Yesterday, This Week, This Month, Custom Range)
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({
    preset: 'all',
    startDate: '',
    endDate: '',
  });
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen]);
  
  const [searchParams] = useSearchParams();
  const urlStatus = searchParams.get('status') || 'ALL';

  const [filters, setFilters] = useState({
    age: 'ALL',
    gender: 'ALL',
    place: 'ALL',
    status: urlStatus
  });

  useEffect(() => {
    const s = searchParams.get('status');
    if (s && s !== filters.status) {
      setFilters(prev => ({ ...prev, status: s }));
    }
  }, [searchParams]);

  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset to page 1 on filter or date change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, dateFilter]);

  const fetchBookings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      let ageMin: string | undefined;
      let ageMax: string | undefined;
      if (filters.age !== 'ALL') {
        if (filters.age === '61+' || filters.age.includes('61')) {
          ageMin = '61';
        } else {
          const parts = filters.age.includes('–') ? filters.age.split('–') : filters.age.split('-');
          if (parts.length === 2) {
            ageMin = parts[0].trim();
            ageMax = parts[1].trim();
          }
        }
      }

      const params: Record<string, any> = {
        page: currentPage,
        limit,
      };

      if (debouncedSearch) params.search = debouncedSearch;
      if (dateFilter.startDate) params.startDate = dateFilter.startDate;
      if (dateFilter.endDate) params.endDate = dateFilter.endDate;
      if (ageMin) params.ageMin = ageMin;
      if (ageMax) params.ageMax = ageMax;
      if (filters.gender !== 'ALL') params.gender = filters.gender;
      if (filters.place !== 'ALL') params.place = filters.place;
      if (filters.status !== 'ALL') params.status = filters.status;

      const res = await appointmentService.getAppointments(token, params);
      
      if (res.success && Array.isArray(res.data)) {
        setBookings(res.data);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalResults(res.pagination.total || res.data.length);
        } else {
          setTotalResults(res.data.length);
          setTotalPages(Math.ceil(res.data.length / limit) || 1);
        }
        
        // Consistent KPI counts returned directly from backend
        if (res.stats) {
          setKpis({
            total: res.stats.total,
            today: res.stats.today,
            pending: res.stats.pending,
            confirmed: res.stats.confirmed,
            completed: res.stats.completed,
            cancelled: res.stats.cancelled,
          });
        }
      } else {
        setError(res?.error?.message || 'Unable to load OP bookings.');
      }
    } catch (err: any) {
      console.error('Failed to fetch OP bookings:', err);
      setError(err?.message || 'Unable to load OP bookings.');
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, debouncedSearch, filters, dateFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleClearFilters = () => {
    setFilters({ age: 'ALL', gender: 'ALL', place: 'ALL', status: 'ALL' });
    setDateFilter({ preset: 'all', startDate: '', endDate: '' });
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  const handleApplyFilters = () => {
    setIsFilterOpen(false);
  };

  const columns: Column<Appointment>[] = [
    {
      header: 'S.No',
      accessor: (_, index) => (
        <span className="text-sm font-medium text-slate-500">
          {((currentPage - 1) * limit) + index + 1}
        </span>
      ),
    },
    {
      header: 'Booking ID',
      accessor: (b: any) => (
        <span className="font-semibold text-blue-600 hover:text-blue-700 tracking-wide font-mono">
          {b.bookingId || b.id.substring(0, 8).toUpperCase()}
        </span>
      ),
    },
    {
      header: 'Patient',
      accessor: (b: any) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900">{b.patientName}</span>
          {b.patientPhone && b.patientPhone !== 'N/A' && (
            <span className="text-xs text-slate-500">{b.patientPhone}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Doctor',
      accessor: (b) => <span className="font-medium text-slate-900">{b.doctorName}</span>,
    },
    {
      header: 'Department',
      accessor: (b) => <span className="text-sm text-slate-700">{b.departmentName || 'General'}</span>,
    },
    {
      header: 'Hospital',
      accessor: (b) => <span className="text-sm text-slate-700">{b.hospitalName}</span>,
    },
    {
      header: 'Booking Date/Time',
      accessor: (b: any) => (
        <div className="flex flex-col text-sm">
          <span className="font-medium text-slate-800">{b.date}</span>
          <span className="text-xs text-slate-500">{b.time || 'N/A'}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (b) => <StatusBadge status={b.status} />,
    },
    {
      header: 'Actions',
      accessor: (b) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/admin/op-bookings/${b.id}`);
          }}
          className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
        >
          View Details
        </button>
      ),
    },
  ];

  if (error) {
    return (
      <div className="p-12 text-center bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center min-h-[350px]">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4">
          <XCircle size={28} />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Unable to load OP bookings</h3>
        <p className="text-sm text-slate-500 max-w-md mb-6">{error}</p>
        <button 
          onClick={() => fetchBookings()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition shadow-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">OP Bookings</h2>
          <p className="text-sm text-slate-500">Monitor and inspect all outpatient physical consultations.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <KpiCard title="Total OP" value={kpis.total} icon={Activity} />
        <KpiCard title="Today" value={kpis.today} icon={Calendar} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <KpiCard title="Pending" value={kpis.pending} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <KpiCard title="Confirmed" value={kpis.confirmed} icon={CalendarDays} iconColor="text-indigo-600" iconBg="bg-indigo-50" />
        <KpiCard title="Completed" value={kpis.completed} icon={CheckCircle} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <KpiCard title="Cancelled" value={kpis.cancelled} icon={XCircle} iconColor="text-rose-600" iconBg="bg-rose-50" />
      </div>

      {/* Date-wise Monitoring Filter Bar */}
      <DateRangeFilter
        value={dateFilter}
        onChange={setDateFilter}
      />

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
                    <option value="PENDING">Pending</option>
                    <option value="WAITING">Waiting</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="IN_CONSULTATION">In Consultation</option>
                    <option value="COMPLETED">Completed</option>
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
                  className="flex-1 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Clear All
                </button>
                <button 
                  onClick={handleApplyFilters}
                  className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                >
                  Apply
                </button>
             </div>
           </div>
         )}
      </div>

      {loading ? (
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center min-h-[400px]">
           <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
           <p className="text-slate-500 font-medium">Loading OP bookings...</p>
         </div>
      ) : (
         <DataTable 
           data={bookings}
           columns={columns}
           keyExtractor={(b) => b.id}
           searchPlaceholder="Search OP bookings..."
           onSearch={setSearch}
           onFilterClick={(e) => {
             e.stopPropagation();
             setIsFilterOpen(!isFilterOpen);
           }}
           emptyMessage={
             (search || Object.values(filters).some(v => v !== 'ALL') || dateFilter.startDate || dateFilter.endDate) 
               ? "No OP bookings match the selected date and filters. Try adjusting your search, date, or filters." 
               : "No OP bookings found."
           }
           onRowClick={(b) => navigate(`/admin/op-bookings/${b.id}`)}
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
  );
};

export default OPBookings;
