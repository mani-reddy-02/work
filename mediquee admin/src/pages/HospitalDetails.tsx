import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Building, Calendar, DollarSign, MapPin, Mail, Phone, Stethoscope, FileText, CheckCircle, Clock } from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable, { Column } from '../components/ui/DataTable';

const HospitalDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAdminAuth();
  
  const [hospital, setHospital] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DEPARTMENTS' | 'APPOINTMENTS'>('OVERVIEW');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Department Drill-down State
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null);

  const fetchHospital = async () => {
    if (!token || !id) return;
    setLoading(true);
    setError('');
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
      const res = await fetch(`${API_URL}/admin/hospitals/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setHospital(data.data);
      } else {
        setError(data.message || 'Hospital not found.');
      }
    } catch (err) {
      console.error('Failed to fetch hospital details:', err);
      setError('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospital();
  }, [token, id]);

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse font-medium">Loading hospital details...</div>;
  if (error || !hospital) return (
    <div className="p-8 text-center">
      <div className="text-red-500 font-medium mb-4">{error || 'Hospital not found.'}</div>
      <button onClick={fetchHospital} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Retry</button>
    </div>
  );

  const rawDoctors = hospital.users?.filter((u: any) => u.role === 'DOCTOR') || [];
  const bookings = hospital.opBookings || [];
  const departments = hospital.departments || [];

  // Data Enrichment for Departments
  const enrichedDepartments = departments.map((dept: any) => {
    const deptDoctors = rawDoctors.filter((d: any) => d.departmentId === dept.id || d.specialization === dept.name);
    const deptAppointments = bookings.filter((b: any) => b.department?.id === dept.id);
    return {
      ...dept,
      doctorCount: deptDoctors.length,
      appointmentCount: deptAppointments.length,
      doctors: deptDoctors
    };
  });

  const bookingColumns: Column<any>[] = [
    { 
      header: 'Date', 
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
        <span 
          className="text-blue-600 hover:underline cursor-pointer font-medium"
          onClick={(e) => {
            e.stopPropagation();
            if (b.patient?.id) navigate(`/admin/patients/${b.patient.id}`);
          }}
        >
          {b.patient?.name || b.patientName || 'Unknown'}
        </span>
      )
    },
    { header: 'Doctor', accessor: (b) => <span className="text-sm text-slate-700">{b.doctor?.name || 'Unknown'}</span> },
    { header: 'Department', accessor: (b) => <span className="text-sm text-slate-700">{b.department?.name || 'Unknown'}</span> },
    { header: 'Status', accessor: (b) => <StatusBadge status={b.status} /> },
  ];

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 border-b pb-2">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><span className="text-sm text-slate-500 block">Hospital Name</span><span className="font-medium text-slate-900">{hospital.name}</span></div>
            <div><span className="text-sm text-slate-500 block">Hospital ID</span><span className="font-medium text-slate-900 text-xs">{hospital.id}</span></div>
            <div><span className="text-sm text-slate-500 block">Hospital Type</span><span className="font-medium text-slate-900">{hospital.businessType || 'N/A'}</span></div>
            <div><span className="text-sm text-slate-500 block">Facility Type</span><span className="font-medium text-slate-900">{hospital.facilityType || 'N/A'}</span></div>
            <div><span className="text-sm text-slate-500 block">License Number</span><span className="font-medium text-slate-900">{hospital.registrationNumber || 'N/A'}</span></div>
            <div><span className="text-sm text-slate-500 block">System Registration</span><span className="font-medium text-slate-900">{new Date(hospital.createdAt).toLocaleDateString()}</span></div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 border-b pb-2">Facilities</h3>
          <div className="flex flex-wrap gap-2">
            {hospital.services?.length > 0 ? hospital.services.map((s: string, idx: number) => (
              <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">{s}</span>
            )) : <span className="text-sm text-slate-500">N/A</span>}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 border-b pb-2">Contact & Location</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Mail className="text-slate-400 mt-0.5 shrink-0" size={16} /> 
              <span className="text-slate-700">{hospital.contactEmail || 'N/A'}</span>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="text-slate-400 mt-0.5 shrink-0" size={16} /> 
              <span className="text-slate-700">{hospital.contactPhone || 'N/A'}</span>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="text-slate-400 mt-0.5 shrink-0" size={16} /> 
              <span className="text-slate-700">{hospital.addressLine1}, {hospital.city}, {hospital.state}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 border-b pb-2">Compact Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <span className="block text-xs font-medium text-blue-600 mb-1">Departments</span>
              <span className="text-xl font-bold text-slate-900">{enrichedDepartments.length}</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <span className="block text-xs font-medium text-emerald-600 mb-1">Doctors</span>
              <span className="text-xl font-bold text-slate-900">{rawDoctors.length}</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <span className="block text-xs font-medium text-amber-600 mb-1">Appointments</span>
              <span className="text-xl font-bold text-slate-900">{bookings.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDepartments = () => {
    if (selectedDepartment) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <button 
              onClick={() => setSelectedDepartment(null)}
              className="text-slate-400 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <h3 className="font-semibold text-slate-900 text-lg flex items-center gap-2">
              <Building size={20} className="text-blue-600" />
              {selectedDepartment.name} Department
            </h3>
          </div>
          
          {selectedDepartment.doctors.length === 0 ? (
            <div className="text-center py-10 text-slate-500 border border-slate-200 rounded-lg bg-slate-50">
              No doctors assigned to this department.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedDepartment.doctors.map((doc: any) => (
                <div 
                  key={doc.id} 
                  className="p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-shadow cursor-pointer flex gap-4 items-start"
                  onClick={() => navigate(`/admin/doctors/${doc.id}`)}
                >
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                    {doc.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 hover:text-blue-600 transition-colors">Dr. {doc.name}</h4>
                    <p className="text-xs text-slate-500 mb-2">{doc.specialization || selectedDepartment.name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Clock size={12} /> {doc.experienceYears || 0} Years Exp
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (enrichedDepartments.length === 0) {
      return <div className="text-center py-10 text-slate-500">No departments found for this hospital.</div>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {enrichedDepartments.map((dept: any) => (
          <div 
            key={dept.id} 
            className="p-5 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all"
            onClick={() => setSelectedDepartment(dept)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Building size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">{dept.name}</h4>
                  <p className="text-xs text-slate-500 truncate max-w-[200px]">{dept.description || 'General Services'}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100">
              <div className="text-sm text-slate-600 flex items-center gap-1">
                <Stethoscope size={14} className="text-slate-400" />
                <span className="font-medium text-slate-900">{dept.doctorCount}</span> Doctors
              </div>
              <div className="text-sm text-slate-600 flex items-center gap-1">
                <Calendar size={14} className="text-slate-400" />
                <span className="font-medium text-slate-900">{dept.appointmentCount}</span> Appts
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/hospitals')} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            {hospital.name}
            <StatusBadge status={hospital.verifications?.length ? 'VERIFIED' : 'PENDING'} />
          </h1>
          <p className="text-sm text-slate-500">{hospital.city}, {hospital.state}</p>
        </div>
      </div>

      <div className="flex border-b border-slate-200 overflow-x-auto hide-scrollbar">
        {[
          { id: 'OVERVIEW', label: 'Overview', icon: Building2 },
          { id: 'DEPARTMENTS', label: 'Departments', icon: Building },
          { id: 'APPOINTMENTS', label: 'Appointments', icon: Calendar },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              if (tab.id !== 'DEPARTMENTS') setSelectedDepartment(null);
            }}
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
        {activeTab === 'DEPARTMENTS' && renderDepartments()}
        {activeTab === 'APPOINTMENTS' && (
          <DataTable 
            columns={bookingColumns} 
            data={bookings} 
            keyExtractor={(b) => b.id} 
            emptyMessage="No appointments found."
            onRowClick={(b) => navigate(`/admin/appointments/${b.id}`)}
          />
        )}
      </div>
    </div>
  );
};

export default HospitalDetails;
