import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DataTable, { Column } from '../components/ui/DataTable';
import { useAdminAuth } from '../contexts/AuthContext';
import { Plus, Edit, ArrowLeft, Building, UserSquare2, ActivitySquare } from 'lucide-react';
import DiseaseModal from '../components/DiseaseModal';

const DepartmentDetails: React.FC = () => {
  const { id } = useParams();
  const { token, user } = useAdminAuth();
  const navigate = useNavigate();
  
  const [department, setDepartment] = useState<any>(null);
  const [diseases, setDiseases] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDisease, setEditingDisease] = useState<any>(null);

  const fetchDepartment = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
      const res = await fetch(`${API_URL}/admin/departments/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setDepartment(data.data);
        setDiseases(data.data.diseases || []);
        setDoctors(data.data.doctors || []);
        setHospitals(data.data.hospitals || []);
      } else {
        setError('Unable to load department details.');
      }
    } catch (err) {
      setError('Unable to load department details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepartment(); }, [id, token]);

  const diseaseColumns: Column<any>[] = [
    { header: 'S.No', accessor: (_, idx) => <span className="text-sm text-slate-500">{idx + 1}</span> },
    { header: 'Icon', accessor: 'icon', render: (val) => val ? <img src={val} className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full bg-slate-200" /> },
    { header: 'Disease', accessor: 'name', className: 'font-medium text-slate-900' },
    { header: 'Description', accessor: 'description', render: (val) => val || '-' },
    { header: 'Status', accessor: 'isActive', render: (val) => val ? <span className="text-green-600 bg-green-100 px-2 py-1 rounded">Active</span> : <span className="text-red-600 bg-red-100 px-2 py-1 rounded">Inactive</span> },
    { header: 'Actions', accessor: 'id', render: (_, row) => (
      <div className="flex space-x-2">
        <button onClick={() => { setEditingDisease(row); setModalOpen(true); }} className="text-indigo-600 hover:text-indigo-900 p-1"><Edit size={16}/></button>
      </div>
    )}
  ];

  const doctorColumns: Column<any>[] = [
    { header: 'S.No', accessor: (_, idx) => <span className="text-sm text-slate-500">{idx + 1}</span> },
    { header: 'Doctor Name', accessor: 'name', className: 'font-medium text-slate-900' },
    { header: 'Specialization', accessor: 'specialization', render: (val) => val || '-' },
    { header: 'Experience', accessor: 'experienceYears', render: (val) => val ? `${val} Years` : '-' },
    { header: 'Status', accessor: 'active', render: (val) => val ? <span className="text-green-600 bg-green-100 px-2 py-1 rounded">Active</span> : <span className="text-red-600 bg-red-100 px-2 py-1 rounded">Inactive</span> },
  ];

  const hospitalColumns: Column<any>[] = [
    { header: 'S.No', accessor: (_, idx) => <span className="text-sm text-slate-500">{idx + 1}</span> },
    { header: 'Hospital Name', accessor: 'name', className: 'font-medium text-slate-900' },
    { header: 'City', accessor: 'city', render: (val) => val || '-' },
    { header: 'Total Doctors', accessor: 'totalDoctors' },
  ];

  if (loading) {
    return <div className="p-6 text-slate-500">Loading department details...</div>;
  }

  if (error || !department) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex flex-col items-start">
          <p className="mb-2">{error || 'Department not found.'}</p>
          <button onClick={() => fetchDepartment()} className="px-4 py-2 bg-red-100 hover:bg-red-200 rounded font-medium transition-colors">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <button onClick={() => navigate('/admin/departments')} className="flex items-center text-blue-600 mb-6 hover:underline font-medium">
        <ArrowLeft size={16} className="mr-1"/> Back to Departments
      </button>

      {/* Department Overview */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-800">Department Overview</h2>
        </div>
        <div className="p-6 flex flex-col md:flex-row gap-6">
          <div className="shrink-0 flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-xl h-32 w-32">
            {department.icon ? (
              <img src={department.icon} className="w-16 h-16 object-contain mb-2" alt={department.name} />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mb-2">
                <span className="text-slate-400 text-2xl">{department.name?.charAt(0)}</span>
              </div>
            )}
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${department.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {department.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <p className="text-sm text-slate-500 font-medium">Department ID</p>
              <p className="text-slate-900 font-mono text-sm mt-1">{department.id}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Department Name</p>
              <p className="text-slate-900 font-semibold mt-1">{department.name}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-slate-500 font-medium">Description</p>
              <p className="text-slate-700 mt-1">{department.description || 'No description provided.'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Created Date</p>
              <p className="text-slate-900 mt-1">{new Date(department.createdAt).toLocaleDateString()} {new Date(department.createdAt).toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Diseases */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <ActivitySquare size={20} className="text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">Diseases ({diseases.length})</h2>
          </div>
          {(user?.role === 'SUPER_ADMIN' || user?.role === 'HOSPITAL_ADMIN') && (
            <button onClick={() => { setEditingDisease(null); setModalOpen(true); }} className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 text-sm font-medium rounded flex items-center transition-colors">
              <Plus size={16} className="mr-1"/> Add Disease
            </button>
          )}
        </div>
        <DataTable columns={diseaseColumns} data={diseases} keyExtractor={(item) => item.id} emptyMessage="No diseases added to this department yet." />
      </div>

      {/* Doctors */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <UserSquare2 size={20} className="text-blue-600" />
          <h2 className="text-lg font-bold text-slate-800">Doctors ({doctors.length})</h2>
        </div>
        <DataTable columns={doctorColumns} data={doctors} keyExtractor={(item) => item.id} emptyMessage="No doctors are currently assigned to this department." />
      </div>

      {/* Hospitals */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <Building size={20} className="text-emerald-600" />
          <h2 className="text-lg font-bold text-slate-800">Hospitals ({hospitals.length})</h2>
        </div>
        <DataTable columns={hospitalColumns} data={hospitals} keyExtractor={(item) => item.id} emptyMessage="No hospitals are associated with this department yet." />
      </div>

      {modalOpen && <DiseaseModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSuccess={fetchDepartment} existing={editingDisease} departmentId={department.id} departmentName={department.name} />}
    </div>
  );
};

export default DepartmentDetails;
