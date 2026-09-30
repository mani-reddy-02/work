import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Network, Activity, Stethoscope, Building2 } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { useAdminAuth } from '../contexts/AuthContext';
import { departmentService } from '../services/departmentService';

interface DepartmentOverview {
  id: string;
  name: string;
  description: string;
  diseaseCount: number;
  hospitalCount: number;
  doctorCount: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

const Departments: React.FC = () => {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<DepartmentOverview[]>([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchDepartments = async () => {
    if (!token) return;
    const res = await departmentService.getDepartments(token);
    if (res.success && Array.isArray(res.data)) {
      setDepartments(res.data);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [token]);

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newDeptName.trim()) return;
    
    setIsSubmitting(true);
    setError('');
    
    const res = await departmentService.createDepartment(token, newDeptName, newDeptDesc);
    if (res.success) {
      setShowAddModal(false);
      setNewDeptName('');
      setNewDeptDesc('');
      fetchDepartments(); // Refresh list
    } else {
      setError(res.error?.message || 'Failed to create department');
    }
    setIsSubmitting(false);
  };

  const filtered = departments.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<DepartmentOverview>[] = [
    {
      header: 'Department',
      accessor: (d) => (
        <div>
          <p className="font-medium text-slate-900 ">{d.name}</p>
          {d.description && <p className="text-xs text-slate-500  mt-0.5 line-clamp-1">{d.description}</p>}
        </div>
      ),
    },
    {
      header: 'Diseases',
      accessor: (d) => (
        <div className="flex items-center gap-1.5 text-slate-600 ">
          <Activity size={16} />
          <span>{d.diseaseCount}</span>
        </div>
      ),
    },
    {
      header: 'Doctors',
      accessor: (d) => (
        <div className="flex items-center gap-1.5 text-slate-600 ">
          <Stethoscope size={16} />
          <span>{d.doctorCount}</span>
        </div>
      ),
    },
    {
      header: 'Hospitals',
      accessor: (d) => (
        <div className="flex items-center gap-1.5 text-slate-600 ">
          <Building2 size={16} />
          <span>{d.hospitalCount}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (d) => <StatusBadge status={d.status} />,
    },
    {
      header: 'Actions',
      accessor: (d) => (
        <button
          onClick={() => navigate(`/admin/departments/${d.id}`)}
          className="text-sm font-medium text-blue-600  hover:text-blue-700 :text-blue-300"
        >
          View Details
        </button>
      ),
    },
  ];

  const totalDepts = departments.length;
  const activeDepts = departments.filter(d => d.status === 'ACTIVE').length;
  const inactiveDepts = totalDepts - activeDepts;
  const totalDiseases = departments.reduce((acc, d) => acc + d.diseaseCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 ">Departments</h1>
          <p className="mt-1 text-slate-500 ">Manage medical departments and their associated diseases and doctors.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          + Add Department
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Total Departments"
          value={totalDepts.toString()}
          icon={Network}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <KpiCard
          title="Active Departments"
          value={activeDepts.toString()}
          icon={Network}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <KpiCard
          title="Inactive Departments"
          value={inactiveDepts.toString()}
          icon={Network}
          iconColor="text-slate-600"
          iconBg="bg-slate-50"
        />
        <KpiCard
          title="Total Diseases"
          value={totalDiseases.toString()}
          icon={Activity}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
        />
      </div>

      <div className="bg-white  border border-slate-200  rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200  flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50/50 ">
          <input
            type="text"
            placeholder="Search departments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-xs px-3 py-2 bg-white  border border-slate-300  rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500  transition-colors"
          />
        </div>
        
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(d) => d.id}
          emptyMessage={search ? "No departments found matching your search." : "No departments available."}
        />
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Add Department</h2>
            </div>
            <form onSubmit={handleAddDepartment} className="p-4 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="e.g. Cardiology"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
                  placeholder="Optional description"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              
              <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newDeptName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Add Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
