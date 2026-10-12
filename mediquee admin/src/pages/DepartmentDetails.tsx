import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DataTable, { Column } from '../components/ui/DataTable';
import { useAdminAuth } from '../contexts/AuthContext';
import { Plus, Edit, Trash2, ArrowLeft, Building, UserSquare2, ActivitySquare } from 'lucide-react';
import DiseaseModal from '../components/DiseaseModal';
import { IconImage } from '../components/IconImage';

const DepartmentDetails: React.FC = () => {
  const { id } = useParams();
  const { token, adminUser } = useAdminAuth();
  const navigate = useNavigate();
  
  const [department, setDepartment] = useState<any>(null);
  const [diseases, setDiseases] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search states for module sub-tables
  const [diseaseSearch, setDiseaseSearch] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [hospitalSearch, setHospitalSearch] = useState('');

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

  const handleDeleteDisease = async (disease: any) => {
    if (!window.confirm(`Are you sure you want to delete the disease "${disease.name}"?`)) {
      return;
    }
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
      const res = await fetch(`${API_URL}/admin/diseases/${disease.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchDepartment();
      } else {
        alert(data.error?.message || 'Could not delete disease.');
      }
    } catch (err) {
      alert('Network error while deleting disease.');
    }
  };

  const diseaseColumns: Column<any>[] = [
    { header: 'S.No', accessor: (_: any, idx: number) => <span className="text-sm text-slate-500">{idx + 1}</span> },
    { 
      header: 'Icon', 
      accessor: (row: any) => (
        <IconImage icon={row.icon} name={row.name} size="sm" rounded="rounded-lg" />
      ) 
    },
    { header: 'Disease', accessor: 'name', className: 'font-medium text-slate-900' },
    { header: 'Description', accessor: (row: any) => row.description || '-' },
    { header: 'Status', accessor: (row: any) => row.isActive ? <span className="text-green-600 bg-green-100 px-2 py-1 rounded">Active</span> : <span className="text-red-600 bg-red-100 px-2 py-1 rounded">Inactive</span> },
    { header: 'Actions', accessor: (row: any) => (
      <div className="flex space-x-2">
        <button title="Edit Disease" onClick={() => { setEditingDisease(row); setModalOpen(true); }} className="text-indigo-600 hover:text-indigo-900 p-1"><Edit size={16}/></button>
        <button title="Delete Disease" onClick={() => handleDeleteDisease(row)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16}/></button>
      </div>
    )}
  ];

  const doctorColumns: Column<any>[] = [
    { header: 'S.No', accessor: (_: any, idx: number) => <span className="text-sm text-slate-500">{idx + 1}</span> },
    { header: 'Doctor Name', accessor: 'name', className: 'font-medium text-slate-900' },
    { header: 'Specialization', accessor: (row: any) => row.specialization || '-' },
    { header: 'Experience', accessor: (row: any) => row.experienceYears ? `${row.experienceYears} Years` : '-' },
    { header: 'Status', accessor: (row: any) => row.active ? <span className="text-green-600 bg-green-100 px-2 py-1 rounded">Active</span> : <span className="text-red-600 bg-red-100 px-2 py-1 rounded">Inactive</span> },
  ];

  const hospitalColumns: Column<any>[] = [
    { header: 'S.No', accessor: (_: any, idx: number) => <span className="text-sm text-slate-500">{idx + 1}</span> },
    { header: 'Hospital Name', accessor: 'name', className: 'font-medium text-slate-900' },
    { header: 'City', accessor: (row: any) => row.city || '-' },
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
            <IconImage icon={department.icon} name={department.name} size="lg" rounded="rounded-xl" className="mb-2" />
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
          {(adminUser?.role === 'SUPER_ADMIN' || adminUser?.role === 'HOSPITAL_ADMIN') && (
            <button onClick={() => { setEditingDisease(null); setModalOpen(true); }} className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 text-sm font-medium rounded flex items-center transition-colors">
              <Plus size={16} className="mr-1"/> Add Disease
            </button>
          )}
        </div>
        <DataTable 
          columns={diseaseColumns} 
          data={diseases.filter(d => 
            !diseaseSearch || 
            d.name.toLowerCase().includes(diseaseSearch.toLowerCase()) || 
            (d.id && d.id.toLowerCase().includes(diseaseSearch.toLowerCase())) ||
            (d.description && d.description.toLowerCase().includes(diseaseSearch.toLowerCase()))
          )} 
          keyExtractor={(item) => item.id} 
          searchPlaceholder="Search diseases by name, ID, or description..."
          searchValue={diseaseSearch}
          onSearch={setDiseaseSearch}
          emptyMessage="No diseases match the search." 
        />
      </div>

      {/* Doctors */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <UserSquare2 size={20} className="text-blue-600" />
          <h2 className="text-lg font-bold text-slate-800">Doctors ({doctors.length})</h2>
        </div>
        <DataTable 
          columns={doctorColumns} 
          data={doctors.filter(doc => 
            !doctorSearch || 
            doc.name.toLowerCase().includes(doctorSearch.toLowerCase()) || 
            (doc.specialization && doc.specialization.toLowerCase().includes(doctorSearch.toLowerCase()))
          )} 
          keyExtractor={(item) => item.id} 
          searchPlaceholder="Search doctors by name or specialization..."
          searchValue={doctorSearch}
          onSearch={setDoctorSearch}
          emptyMessage="No doctors match the search." 
        />
      </div>

      {/* Hospitals */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <Building size={20} className="text-emerald-600" />
          <h2 className="text-lg font-bold text-slate-800">Hospitals ({hospitals.length})</h2>
        </div>
        <DataTable 
          columns={hospitalColumns} 
          data={hospitals.filter(h => 
            !hospitalSearch || 
            h.name.toLowerCase().includes(hospitalSearch.toLowerCase()) || 
            (h.city && h.city.toLowerCase().includes(hospitalSearch.toLowerCase()))
          )} 
          keyExtractor={(item) => item.id} 
          searchPlaceholder="Search hospitals by name or city..."
          searchValue={hospitalSearch}
          onSearch={setHospitalSearch}
          emptyMessage="No hospitals match the search." 
        />
      </div>

      {modalOpen && <DiseaseModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSuccess={fetchDepartment} existing={editingDisease} departmentId={department.id} departmentName={department.name} />}
    </div>
  );
};

export default DepartmentDetails;
