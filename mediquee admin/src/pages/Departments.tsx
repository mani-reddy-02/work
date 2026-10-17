import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable, { Column } from '../components/ui/DataTable';
import { useAdminAuth } from '../contexts/AuthContext';
import { Plus, Edit, Trash2, Search, Building2, ActivitySquare, RefreshCw } from 'lucide-react';
import DepartmentModal from '../components/DepartmentModal';
import { IconImage } from '../components/IconImage';
import KpiCard from '../components/ui/KpiCard';

const Departments: React.FC = () => {
  const { token, adminUser } = useAdminAuth();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const limit = 20;

  // Search State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Summary counts
  const [summaryStats, setSummaryStats] = useState({
    totalDepartments: 0,
    totalDiseases: 0
  });

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchDepartments = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        ...(debouncedSearch && { search: debouncedSearch })
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

        if (data.summary) {
          setSummaryStats({
            totalDepartments: data.summary.totalDepartments,
            totalDiseases: data.summary.totalDiseases
          });
        }
      } else {
        setError('Unable to load departments.');
      }
    } catch (err) {
      setError('Unable to load departments.');
    } finally { 
      setLoading(false); 
    }
  }, [token, currentPage, debouncedSearch]);

  useEffect(() => { fetchDepartments(); }, [fetchDepartments]);

  const handleDeleteDepartment = async (e: React.MouseEvent, dept: any) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete the department "${dept.name}"?`)) {
      return;
    }
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
      const res = await fetch(`${API_URL}/admin/departments/${dept.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchDepartments();
      } else {
        alert(data.error?.message || 'Could not delete department.');
      }
    } catch (err) {
      alert('Network error while deleting department.');
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'S.No',
      accessor: (_, index) => (
        <span className="text-sm text-slate-500">
          {((currentPage - 1) * limit) + index + 1}
        </span>
      ),
      className: 'w-16'
    },
    { 
      header: 'Department', 
      accessor: (item) => (
        <div className="flex items-center space-x-3 cursor-pointer">
          <IconImage icon={item.icon} name={item.name} size="sm" rounded="rounded-lg" />
          <span className="font-medium text-slate-900 hover:text-blue-600 transition-colors">{item.name}</span>
        </div>
      )
    },
    { header: 'Diseases', accessor: 'diseaseCount' },
    { header: 'Doctors', accessor: 'doctorCount' },
    { header: 'Hospitals', accessor: 'hospitalCount' },
    { 
      header: 'Created Date', 
      accessor: (item) => <span className="text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</span>
    },
    { 
      header: 'Actions', 
      accessor: (item) => (
        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
          <button title="Edit Department" onClick={() => { setEditingDept(item); setModalOpen(true); }} className="text-indigo-600 hover:text-indigo-900 p-1">
            <Edit size={16}/>
          </button>
          <button title="Delete Department" onClick={(e) => handleDeleteDepartment(e, item)} className="text-red-500 hover:text-red-700 p-1">
            <Trash2 size={16}/>
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* 1. Page title and existing relevant actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Departments</h1>
          <p className="text-sm text-slate-500">Manage clinical departments and disease condition catalogues.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDepartments}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          {(adminUser?.role === 'SUPER_ADMIN' || adminUser?.role === 'HOSPITAL_ADMIN') && (
            <button 
              onClick={() => { setEditingDept(null); setModalOpen(true); }} 
              className="bg-blue-600 hover:bg-blue-700 transition-colors text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm text-sm font-medium"
            >
              <Plus size={16} /> Add New Department
            </button>
          )}
        </div>
      </div>

      {/* 2. Search bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search size={18} className="text-slate-400" />
        </div>
        <input 
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search departments by name or description..."
          className="pl-10 pr-4 py-2.5 w-full bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
        />
      </div>

      {/* 3. Total Departments and Total Diseases summary tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KpiCard 
          title="Total Departments" 
          value={summaryStats.totalDepartments} 
          icon={Building2}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <KpiCard 
          title="Total Diseases" 
          value={summaryStats.totalDiseases} 
          icon={ActivitySquare}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
          <p className="mb-2">{error}</p>
          <button onClick={() => fetchDepartments()} className="px-4 py-2 bg-red-100 hover:bg-red-200 rounded font-medium transition-colors text-sm">
            Retry
          </button>
        </div>
      ) : null}

      {/* 4. Departments list without the Status column & 5. Existing pagination */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 bg-white/60 flex items-center justify-center backdrop-blur-[1px] rounded-xl">
             <div className="text-blue-600 animate-pulse font-medium text-sm">Loading departments...</div>
          </div>
        )}
        <DataTable 
          columns={columns} 
          data={departments} 
          keyExtractor={(item) => item.id} 
          hideToolbar={true}
          onRowClick={(item) => navigate(`/admin/departments/${item.id}`)}
          emptyMessage="No departments found."
          pagination={{
            currentPage,
            totalPages,
            totalResults,
            pageSize: limit,
            onPageChange: setCurrentPage
          }}
        />
      </div>
      
      {modalOpen && (
        <DepartmentModal 
          isOpen={modalOpen} 
          onClose={() => setModalOpen(false)} 
          onSuccess={fetchDepartments} 
          existing={editingDept} 
        />
      )}
    </div>
  );
};

export default Departments;
