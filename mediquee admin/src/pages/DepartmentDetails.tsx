import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Building, Stethoscope, Calendar, Clock, MapPin, Activity, Plus } from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import AddDiseaseModal from '../components/diseases/AddDiseaseModal';

const DepartmentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAdminAuth();
  
  const [department, setDepartment] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DISEASES' | 'HOSPITALS' | 'DOCTORS' | 'APPOINTMENTS'>('OVERVIEW');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isAddDiseaseOpen, setIsAddDiseaseOpen] = useState(false);

  const fetchDepartment = async () => {
    if (!token || !id) return;
    setLoading(true);
    setError('');
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${API_URL}/admin/departments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDepartment(data.data);
      } else {
        setError(data.error?.message || 'Department not found.');
      }
    } catch (err) {
      console.error('Failed to fetch department details:', err);
      setError('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartment();
  }, [token, id]);

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse font-medium">Loading department data...</div>;
  if (error || !department) return (
    <div className="p-8 text-center">
      <div className="text-red-500 font-medium mb-4">{error || 'Unable to load department data.'}</div>
      <button onClick={fetchDepartment} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Retry</button>
    </div>
  );

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <h3 className="font-semibold text-slate-900 border-b pb-2">Department Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><span className="text-sm text-slate-500 block">Department Name</span><span className="font-medium text-slate-900">{department.name}</span></div>
          <div><span className="text-sm text-slate-500 block">Department ID</span><span className="font-medium text-slate-900 text-xs">{department.id}</span></div>
          <div><span className="text-sm text-slate-500 block">Status</span><StatusBadge status={department.status || 'ACTIVE'} /></div>
          <div><span className="text-sm text-slate-500 block">Created Date</span><span className="font-medium text-slate-900">{new Date(department.createdAt).toLocaleDateString()}</span></div>
        </div>
        <div>
          <span className="text-sm text-slate-500 block mb-1">Description</span>
          <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">{department.description || 'No description provided.'}</p>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="font-semibold text-slate-900 border-b pb-2">Relationship Statistics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div 
            onClick={() => setActiveTab('DISEASES')}
            className="p-4 bg-rose-50 rounded-lg border border-rose-100 cursor-pointer hover:shadow-md transition-shadow"
          >
            <span className="block text-sm font-medium text-rose-600 mb-1 flex items-center gap-2"><Activity size={16}/> Diseases</span>
            <span className="text-2xl font-bold text-slate-900">{department.diseaseCount}</span>
          </div>
          <div 
            onClick={() => setActiveTab('DOCTORS')}
            className="p-4 bg-blue-50 rounded-lg border border-blue-100 cursor-pointer hover:shadow-md transition-shadow"
          >
            <span className="block text-sm font-medium text-blue-600 mb-1 flex items-center gap-2"><Stethoscope size={16}/> Doctors</span>
            <span className="text-2xl font-bold text-slate-900">{department.doctorCount}</span>
          </div>
          <div 
            onClick={() => setActiveTab('HOSPITALS')}
            className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 cursor-pointer hover:shadow-md transition-shadow"
          >
            <span className="block text-sm font-medium text-emerald-600 mb-1 flex items-center gap-2"><Building size={16}/> Hospitals</span>
            <span className="text-2xl font-bold text-slate-900">{department.hospitalCount}</span>
          </div>
          <div 
            onClick={() => setActiveTab('APPOINTMENTS')}
            className="p-4 bg-amber-50 rounded-lg border border-amber-100 cursor-pointer hover:shadow-md transition-shadow"
          >
            <span className="block text-sm font-medium text-amber-600 mb-1 flex items-center gap-2"><Calendar size={16}/> Appointments</span>
            <span className="text-2xl font-bold text-slate-900">{department.appointmentCount}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDiseases = () => (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <button 
          onClick={() => setIsAddDiseaseOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} /> Add Disease
        </button>
      </div>
      
      {department.diseases?.length === 0 ? (
        <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
          No diseases found for this department.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {department.diseases.map((d: any) => (
            <div key={d.id} className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 shrink-0">
                <Heart size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">{d.name}</h4>
                {d.description && <p className="text-xs text-slate-500 line-clamp-2 mt-1">{d.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderHospitals = () => {
    if (department.hospitals?.length === 0) {
      return <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-lg border border-slate-200">No hospitals associated with this department.</div>;
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {department.hospitals.map((h: any) => (
          <div key={h.id} className="p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md cursor-pointer transition-shadow" onClick={() => navigate(`/admin/hospitals/${h.id}`)}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">{h.name}</h4>
                <div className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={12}/> {h.city || 'Unknown'}</div>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-between text-sm">
              <span className="text-slate-600"><span className="font-medium text-slate-900">{h.totalDoctors || 0}</span> Doctors</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDoctors = () => {
    if (department.doctors?.length === 0) {
      return <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-lg border border-slate-200">No doctors assigned to this department.</div>;
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {department.doctors.map((doc: any) => (
          <div key={doc.id} className="p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md cursor-pointer flex gap-4 items-start transition-shadow" onClick={() => navigate(`/admin/doctors/${doc.id}`)}>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0 text-lg">
              {doc.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">Dr. {doc.name}</h4>
              <p className="text-xs text-blue-600 font-medium mb-1">{department.name}</p>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Clock size={12} /> {doc.experienceYears || 0} Years Exp
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const bookingColumns: Column<any>[] = [
    { 
      header: 'Date & Time', 
      accessor: (b) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900">{new Date(b.appointmentDate).toLocaleDateString()}</span>
          <span className="text-xs text-slate-500">{b.timeSlot || b.slotTime || 'N/A'}</span>
        </div>
      )
    },
    { 
      header: 'Patient', 
      accessor: (b) => (
        <span className="text-blue-600 hover:underline cursor-pointer font-medium" onClick={(e) => { e.stopPropagation(); if (b.patient?.id) navigate(`/admin/patients/${b.patient.id}`); }}>
          {b.patient?.name || b.patientName || 'Unknown'}
        </span>
      )
    },
    { header: 'Doctor', accessor: (b) => <span className="text-sm text-slate-700">{b.doctor?.name || 'Unknown'}</span> },
    { header: 'Hospital', accessor: (b) => <span className="text-sm text-slate-700">{b.hospital?.name || 'Unknown'}</span> },
    { header: 'Status', accessor: (b) => <StatusBadge status={b.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/departments')} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{department.name}</h1>
          <p className="text-sm text-slate-500">Manage {department.name.toLowerCase()} department resources and settings.</p>
        </div>
      </div>

      <div className="flex border-b border-slate-200 overflow-x-auto hide-scrollbar">
        {[
          { id: 'OVERVIEW', label: 'Overview', icon: Activity },
          { id: 'DISEASES', label: 'Diseases', icon: Heart },
          { id: 'HOSPITALS', label: 'Hospitals', icon: Building },
          { id: 'DOCTORS', label: 'Doctors', icon: Stethoscope },
          { id: 'APPOINTMENTS', label: 'Appointments', icon: Calendar },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        {activeTab === 'OVERVIEW' && renderOverview()}
        {activeTab === 'DISEASES' && renderDiseases()}
        {activeTab === 'HOSPITALS' && renderHospitals()}
        {activeTab === 'DOCTORS' && renderDoctors()}
        {activeTab === 'APPOINTMENTS' && (
          <DataTable 
            columns={bookingColumns} 
            data={department.appointments || []} 
            keyExtractor={(b) => b.id} 
            emptyMessage="No appointments found for this department."
            onRowClick={(b) => navigate(`/admin/appointments/${b.id}`)}
          />
        )}
      </div>

      {isAddDiseaseOpen && (
        <AddDiseaseModal 
          departmentId={department.id} 
          onClose={() => setIsAddDiseaseOpen(false)} 
          onSuccess={() => { setIsAddDiseaseOpen(false); fetchDepartment(); }} 
        />
      )}
    </div>
  );
};

export default DepartmentDetails;
