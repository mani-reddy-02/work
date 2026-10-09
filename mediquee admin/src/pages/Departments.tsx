import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable, { Column } from '../components/ui/DataTable';
import { useAdminAuth } from '../contexts/AuthContext';
import { Plus, Edit, X } from 'lucide-react';
import DepartmentModal from '../components/DepartmentModal';

const Departments: React.FC = () => {
  const { token, user } = useAdminAuth();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);

  // Pagination & Filtering State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const limit = 20;

  const [search, setSearch] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState({
    status: 'ALL'
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

  const fetchDepartments = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(filters.status !== 'ALL' && { status: filters.status })
      });

      const res = await fetch(`${API_URL}/admin/departments?${params.toString()}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const data = await res.json();
      
      if (data.success) {
        setDepartments(data.data);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalResults(data.pagination.total);
        } else {
          setTotalResults(data.data.length);
          setTotalPages(Math.ceil(data.data.length / limit));
        }
      } else {
        setError('Unable to load departments.');
      }
    } catch (err) {
      setError('Unable to load departments.');
    } finally { 
      setLoading(false); 
    }
  }, [token, currentPage, search, filters]);

  useEffect(() => { fetchDepartments(); }, [fetchDepartments]);

  // Reset to page 1 on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filters]);

  const handleClearFilters = () => {
    setFilters({ status: 'ALL' });
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  const handleApplyFilters = () => {
    setIsFilterOpen(false);
  };

  const columns: Column<any>[] = [
    {
      header: 'S.No',
      accessor: (_, index) => (
        <span className="text-sm text-slate-500">
          {((currentPage - 1) * limit) + index + 1}
        </span>
      ),
    },
    { 
      header: 'Department', 
      accessor: (item) => (
        <div className="flex items-center space-x-3">
          {item.icon ? <img src={item.icon} className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full bg-slate-200" />}
          <span className="font-medium text-slate-900">{item.name}</span>
        </div>
      )
    },
    { header: 'Diseases', accessor: 'diseaseCount' },
    { header: 'Doctors', accessor: 'doctorCount' },
    { header: 'Hospitals', accessor: 'hospitalCount' },
    { 
      header: 'Status', 
      accessor: (item) => item.isActive ? 
        <span className="text-green-600 bg-green-100 px-2 py-1 rounded">Active</span> : 
        <span className="text-red-600 bg-red-100 px-2 py-1 rounded">Inactive</span> 
    },
    { 
      header: 'Created Date', 
      accessor: (item) => <span className="text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</span>
    },
    { 
      header: 'Actions', 
      accessor: (item) => (
        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => { setEditingDept(item); setModalOpen(true); }} className="text-indigo-600 hover:text-indigo-900 p-1">
            <Edit size={16}/>
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Departments</h1>
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'HOSPITAL_ADMIN') && (
          <button onClick={() => { setEditingDept(null); setModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 transition-colors text-white px-4 py-2 rounded flex items-center shadow-sm">
            <Plus size={16} className="mr-2"/> Add New Department
          </button>
        )}
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center mb-6">
          <p className="mb-2">{error}</p>
          <button onClick={() => fetchDepartments()} className="px-4 py-2 bg-red-100 hover:bg-red-200 rounded font-medium transition-colors">
            Retry
          </button>
        </div>
      ) : null}

      <div className="relative">
        <DataTable 
          columns={columns} 
          data={departments} 
          keyExtractor={(item) => item.id} 
          searchPlaceholder="Search departments..."
          onSearch={(value) => setSearch(value)}
          onRowClick={(item) => navigate(`/admin/departments/${item.id}`)}
          emptyMessage={loading ? "Loading departments..." : departments.length === 0 && !error ? (
            <div className="flex flex-col items-center">
              <span className="mb-4">No departments found.</span>
              {(user?.role === 'SUPER_ADMIN' || user?.role === 'HOSPITAL_ADMIN') && (
                <button onClick={() => { setEditingDept(null); setModalOpen(true); }} className="text-blue-600 hover:underline">
                  + Add New Department
                </button>
              )}
            </div>
          ) : ""}
          onFilterClick={() => setIsFilterOpen(!isFilterOpen)}
          pagination={{
            currentPage,
            totalPages,
            totalResults,
            pageSize: limit,
            onPageChange: setCurrentPage
          }}
        />

        {isFilterOpen && (
          <div 
            ref={filterRef}
            className="absolute right-0 top-16 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 z-10"
          >
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800">Filters</h3>
              <button onClick={() => setIsFilterOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select 
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 p-2"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex gap-3">
              <button 
                onClick={handleClearFilters}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Clear Filters
              </button>
              <button 
                onClick={handleApplyFilters}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>
      
      {modalOpen && <DepartmentModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSuccess={fetchDepartments} existing={editingDept} />}
    </div>
  );
};
export default Departments;
