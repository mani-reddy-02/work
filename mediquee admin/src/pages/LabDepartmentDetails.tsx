import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DataTable, { Column } from '../components/ui/DataTable';
import { useAdminAuth } from '../contexts/AuthContext';
import { 
  Plus, Edit, Trash2, ArrowLeft, Building2, TestTube, 
  FlaskConical, Clock, Home, AlertCircle, ShieldAlert 
} from 'lucide-react';
import LabDepartmentModal from '../components/LabDepartmentModal';
import LabTestModal from '../components/LabTestModal';
import { IconImage } from '../components/IconImage';

const LabDepartmentDetails: React.FC = () => {
  const { id } = useParams();
  const { token, adminUser } = useAdminAuth();
  const navigate = useNavigate();

  const [department, setDepartment] = useState<any>(null);
  const [tests, setTests] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<any>(null);

  const fetchDepartment = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    setError(null);
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
      const res = await fetch(`${API_URL}/admin/lab-departments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDepartment(data.data);
        setTests(data.data.tests || []);
        setLabs(data.data.labs || []);
      } else {
        setError(data.error?.message || 'Unable to load lab department details.');
      }
    } catch (err) {
      setError('Network error while loading lab department details.');
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchDepartment();
  }, [fetchDepartment]);

  const handleDeleteTest = async (testItem: any) => {
    if (!window.confirm(`Are you sure you want to delete the test "${testItem.name}" (${testItem.code})?`)) {
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
      const res = await fetch(`${API_URL}/admin/lab-tests/${testItem.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchDepartment();
      } else {
        alert(data.error?.message || 'Could not delete test.');
      }
    } catch (err) {
      alert('Network error while deleting test.');
    }
  };

  const handleDeleteDepartment = async () => {
    if (!department) return;
    if (!window.confirm(`Are you sure you want to delete "${department.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
      const res = await fetch(`${API_URL}/admin/lab-departments/${department.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        navigate('/admin/lab-departments');
      } else {
        alert(data.error?.message || 'Could not delete department.');
      }
    } catch (err) {
      alert('Network error while deleting department.');
    }
  };

  const getSpecimenBadgeColor = (type: string) => {
    switch (type) {
      case 'WHOLE_BLOOD':
      case 'SERUM':
      case 'PLASMA':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'URINE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'STOOL':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'IMAGE_SCAN':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'TISSUE_BIOPSY':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const testColumns: Column<any>[] = [
    {
      header: 'S.No',
      accessor: (_, idx) => <span className="text-sm text-slate-500 font-medium">{idx + 1}</span>
    },
    {
      header: 'Icon',
      accessor: (row) => (
        <IconImage icon={row.icon} name={row.name} size="sm" rounded="rounded-lg" />
      )
    },
    {
      header: 'Test Name & Code',
      accessor: (row) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900">{row.name}</span>
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
              {row.code}
            </span>
          </div>
          {row.description && (
            <span className="text-xs text-slate-500 truncate max-w-xs mt-0.5" title={row.description}>
              {row.description}
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Sample Type',
      accessor: (row) => (
        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-md border ${getSpecimenBadgeColor(row.specimenType)}`}>
          {row.specimenType.replace(/_/g, ' ')}
        </span>
      )
    },
    {
      header: 'Fasting',
      accessor: (row) => row.fastingRequired ? (
        <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
          Yes {row.fastingDurationHours ? `(${row.fastingDurationHours}h)` : ''}
        </span>
      ) : (
        <span className="text-xs text-slate-500">No</span>
      )
    },
    {
      header: 'Home Collection',
      accessor: (row) => row.canBeCollectedAtHome ? (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
          <Home size={12} /> Available
        </span>
      ) : (
        <span className="text-xs text-slate-500">Lab Only</span>
      )
    },
    {
      header: 'TAT',
      accessor: (row) => (
        <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-medium">
          <Clock size={12} className="text-slate-400" />
          {row.defaultTatHours || 24} hrs
        </span>
      )
    },
    {
      header: 'Status',
      accessor: (row) => row.isActive ? (
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
          Active
        </span>
      ) : (
        <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
          Inactive
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
          <button
            title="Edit Test"
            onClick={() => { setEditingTest(row); setTestModalOpen(true); }}
            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit size={16} />
          </button>
          <button
            title="Delete Test"
            onClick={() => handleDeleteTest(row)}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  const labColumns: Column<any>[] = [
    { header: 'S.No', accessor: (_, idx) => <span className="text-sm text-slate-500">{idx + 1}</span> },
    { header: 'Lab Facility', accessor: 'name', className: 'font-medium text-slate-900' },
    { header: 'Type', accessor: (row) => row.type === 'HOSPITAL_BASED' ? 'Hospital Diagnostic Unit' : 'Standalone Laboratory' },
    { header: 'Hospital', accessor: (row) => row.hospital?.name || '-' },
    { header: 'City', accessor: (row) => row.city || row.hospital?.city || '-' },
    { 
      header: 'Status', 
      accessor: (row) => (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${row.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
          {row.status || 'Active'}
        </span>
      )
    }
  ];

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading lab department details...</div>;
  }

  if (error || !department) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-5 rounded-2xl flex flex-col items-start gap-3">
          <p className="font-semibold">{error || 'Lab department not found.'}</p>
          <div className="flex gap-3">
            <button
              onClick={() => fetchDepartment()}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-xl text-xs font-semibold transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/admin/lab-departments')}
              className="px-4 py-2 bg-white border border-red-200 text-red-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Back to Lab Departments
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/admin/lab-departments')}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-semibold transition-colors"
        >
          <ArrowLeft size={16} className="mr-1.5" /> Back to Lab Departments
        </button>
      </div>

      {/* Department Overview Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-800">Lab Department Overview</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDeptModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Edit size={14} /> Edit Department
            </button>
            <button
              onClick={handleDeleteDepartment}
              className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>

        <div className="p-6 flex flex-col md:flex-row gap-6 items-start">
          <div className="shrink-0 flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl h-36 w-36 shadow-2xs">
            <IconImage icon={department.icon} name={department.name} size="lg" rounded="rounded-xl" className="mb-2.5" />
            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${department.isActive ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
              {department.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Department Name</p>
              <p className="text-base font-bold text-slate-900 mt-1">{department.name}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Department Code</p>
              <span className="inline-block mt-1 font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200">
                {department.code}
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Diagnostic Tests</p>
              <p className="text-base font-bold text-blue-600 mt-1">{tests.length} Registered</p>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Clinical Description</p>
              <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                {department.description || 'No description provided for this diagnostic department.'}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Created Date</p>
              <p className="text-xs text-slate-600 font-medium mt-1">
                {new Date(department.createdAt).toLocaleDateString()} {new Date(department.createdAt).toLocaleTimeString()}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Department ID</p>
              <p className="text-xs text-slate-500 font-mono mt-1 select-all">{department.id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tests Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <TestTube size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Diagnostic Tests Catalog ({tests.length})
              </h2>
              <p className="text-xs text-slate-500">
                Add, modify or delete tests under {department.name}.
              </p>
            </div>
          </div>

          {(adminUser?.role === 'SUPER_ADMIN' || adminUser?.role === 'HOSPITAL_ADMIN') && (
            <button
              onClick={() => { setEditingTest(null); setTestModalOpen(true); }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5"
            >
              <Plus size={15} /> Add Diagnostic Test
            </button>
          )}
        </div>

        <DataTable
          columns={testColumns}
          data={tests}
          keyExtractor={(item) => item.id}
          emptyMessage="No diagnostic tests added to this lab department yet."
        />
      </div>

      {/* Associated Laboratories Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Building2 size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Associated Laboratories ({labs.length})
            </h2>
            <p className="text-xs text-slate-500">
              Hospital labs and standalone centers linked to this department.
            </p>
          </div>
        </div>

        <DataTable
          columns={labColumns}
          data={labs}
          keyExtractor={(item) => item.id}
          emptyMessage="No diagnostic laboratories are currently linked directly to this department."
        />
      </div>

      {/* Modals */}
      {deptModalOpen && (
        <LabDepartmentModal
          isOpen={deptModalOpen}
          onClose={() => setDeptModalOpen(false)}
          onSuccess={fetchDepartment}
          existing={department}
        />
      )}

      {testModalOpen && (
        <LabTestModal
          isOpen={testModalOpen}
          onClose={() => setTestModalOpen(false)}
          onSuccess={fetchDepartment}
          existing={editingTest}
          departmentId={department.id}
          departmentName={department.name}
        />
      )}
    </div>
  );
};

export default LabDepartmentDetails;
