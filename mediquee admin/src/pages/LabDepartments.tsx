import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable, { Column } from '../components/ui/DataTable';
import { useAdminAuth } from '../contexts/AuthContext';
import { Plus, Edit, Trash2, FlaskConical, TestTube } from 'lucide-react';
import LabDepartmentModal from '../components/LabDepartmentModal';
import { IconImage } from '../components/IconImage';

const LabDepartments: React.FC = () => {
  const { token, adminUser } = useAdminAuth();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);

  // Pagination & Filtering State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const limit = 20;

  const [search, setSearch] = useState('');

  const fetchDepartments = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        ...(search && { search })
      });

      const res = await fetch(`${API_URL}/admin/lab-departments?${params.toString()}`, {
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
        setError('Unable to load lab departments.');
      }
    } catch (err) {
      setError('Unable to load lab departments.');
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, search]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleDelete = async (e: React.MouseEvent, dept: any) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete the lab department "${dept.name}" (${dept.code})? This will also remove any unassigned tests.`)) {
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
      const res = await fetch(`${API_URL}/admin/lab-departments/${dept.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage({ type: 'success', text: `Department "${dept.name}" deleted successfully.` });
        setTimeout(() => setActionMessage(null), 4000);
        fetchDepartments();
      } else {
        alert(data.error?.message || 'Could not delete department.');
      }
    } catch (err) {
      alert('Network error while deleting department.');
    }
  };

  // Quick stats
  const totalTestsCount = departments.reduce((acc, d) => acc + (d.testCount || 0), 0);

  const columns: Column<any>[] = [
    {
      header: 'S.No',
      accessor: (_, index) => (
        <span className="text-sm text-slate-500 font-medium">
          {((currentPage - 1) * limit) + index + 1}
        </span>
      ),
    },
    {
      header: 'Lab Department',
      accessor: (item) => (
        <div className="flex items-center space-x-3.5">
          <IconImage icon={item.icon} name={item.name} size="md" rounded="rounded-xl" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 hover:text-blue-600 transition-colors">
                {item.name}
              </span>
              <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                {item.code}
              </span>
            </div>
            {item.description && (
              <span className="text-xs text-slate-500 truncate max-w-sm mt-0.5" title={item.description}>
                {item.description}
              </span>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Tests',
      accessor: (item) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
          <TestTube size={13} />
          {item.testCount || 0} Tests
        </span>
      )
    },
    {
      header: 'Labs Using',
      accessor: (item) => (
        <span className="text-xs font-medium text-slate-600">
          {item.labCount || 0} Registered Labs
        </span>
      )
    },
    {
      header: 'Created Date',
      accessor: (item) => (
        <span className="text-xs text-slate-500">
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: (item) => (
        <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
          <button
            title="Edit Department"
            onClick={() => { setEditingDept(item); setModalOpen(true); }}
            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit size={16} />
          </button>
          <button
            title="Delete Department"
            onClick={(e) => handleDelete(e, item)}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-7 h-7 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lab Departments</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Configure laboratory departments, manage diagnostic tests, set icons, and define turnaround times.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {(adminUser?.role === 'SUPER_ADMIN' || adminUser?.role === 'HOSPITAL_ADMIN') && (
            <button
              onClick={() => { setEditingDept(null); setModalOpen(true); }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2"
            >
              <Plus size={16} /> Add Lab Department
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Departments</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalResults || departments.length}</p>
          </div>
          <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
            <FlaskConical size={22} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Catalog Tests</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{totalTestsCount}</p>
          </div>
          <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <TestTube size={22} />
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className={`p-4 rounded-xl text-sm font-medium border animate-in fade-in ${
          actionMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {actionMessage.text}
        </div>
      )}

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-center">
          <p className="mb-2 font-medium">{error}</p>
          <button
            onClick={() => fetchDepartments()}
            className="px-4 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      ) : null}

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={departments}
        keyExtractor={(item) => item.id}
        searchPlaceholder="Search lab departments by name, code, description..."
        onSearch={(value) => setSearch(value)}
        onRowClick={(item) => navigate(`/admin/lab-departments/${item.id}`)}
        emptyMessage={loading ? 'Loading lab departments...' : 'No lab departments found.'}
        pagination={{
          currentPage,
          totalPages,
          totalResults,
          pageSize: limit,
          onPageChange: setCurrentPage
        }}
      />

      {modalOpen && (
        <LabDepartmentModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={fetchDepartments}
          existing={editingDept}
        />
      )}
    </div>
  );
};

export default LabDepartments;
