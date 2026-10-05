import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Activity, Clock, Hospital, Stethoscope, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable, { Column } from '../components/ui/DataTable';

const PatientDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAdminAuth();
  const [patient, setPatient] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'HISTORY' | 'DOCTORS' | 'HOSPITALS' | 'ACTIVITY'>('OVERVIEW');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatient = async () => {
      if (!token || !id) return;
      try {
        const res = await userService.getUserById(token, id);
        if (res.success) {
          setPatient(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch patient details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [token, id]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading patient details...</div>;
  if (!patient) return <div className="p-8 text-center text-red-500">Patient not found.</div>;

  // Derive unique doctors and hospitals from booking history
  const uniqueDoctorsMap = new Map();
  const uniqueHospitalsMap = new Map();

  (patient.patientBookings || []).forEach((b: any) => {
    if (b.doctor) uniqueDoctorsMap.set(b.doctor.id, b.doctor);
    if (b.hospital) uniqueHospitalsMap.set(b.hospital.id, b.hospital);
  });

  const doctorsList = Array.from(uniqueDoctorsMap.values());
  const hospitalsList = Array.from(uniqueHospitalsMap.values());

  const bookingColumns: Column<any>[] = [
    { header: 'Date', accessor: (b) => new Date(b.appointmentDate).toLocaleDateString() },
    { header: 'Doctor', accessor: (b) => b.doctor?.name || 'Unknown' },
    { header: 'Hospital', accessor: (b) => b.hospital?.name || 'Unknown' },
    { header: 'Department', accessor: (b) => b.department?.name || 'Unknown' },
    { header: 'Status', accessor: (b) => <StatusBadge status={b.status} /> },
  ];

  const doctorColumns: Column<any>[] = [
    { header: 'Doctor Name', accessor: 'name' },
    { 
      header: 'Actions', 
      accessor: (d) => (
        <button 
          onClick={() => navigate(`/admin/doctors/${d.id}`)}
          className="text-blue-600 hover:underline text-sm"
        >
          View Doctor
        </button>
      )
    }
  ];

  const hospitalColumns: Column<any>[] = [
    { header: 'Hospital Name', accessor: 'name' },
    { 
      header: 'Actions', 
      accessor: (h) => (
        <button 
          onClick={() => navigate(`/admin/hospitals/${h.id}`)}
          className="text-blue-600 hover:underline text-sm"
        >
          View Hospital
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/patients')} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            {patient.name}
            <StatusBadge status={patient.active ? 'ACTIVE' : 'INACTIVE'} />
          </h1>
          <p className="text-sm text-slate-500">Patient ID: {patient.id}</p>
        </div>
      </div>

      <div className="flex border-b border-slate-200 overflow-x-auto">
        {[
          { id: 'OVERVIEW', label: 'Overview', icon: User },
          { id: 'HISTORY', label: 'Booking History', icon: Clock },
          { id: 'DOCTORS', label: 'Doctors', icon: Stethoscope },
          { id: 'HOSPITALS', label: 'Hospitals', icon: Hospital },
          { id: 'ACTIVITY', label: 'Activity', icon: Activity },
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
        {activeTab === 'OVERVIEW' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 border-b pb-2">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-slate-500 block">Full Name</span><span className="font-medium">{patient.name}</span></div>
                <div><span className="text-sm text-slate-500 block">Gender</span><span className="font-medium">{patient.gender || 'Not specified'}</span></div>
                <div><span className="text-sm text-slate-500 block">Date of Birth</span><span className="font-medium">{patient.dob || 'Not specified'}</span></div>
                <div><span className="text-sm text-slate-500 block">Registration Date</span><span className="font-medium">{new Date(patient.createdAt).toLocaleDateString()}</span></div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 border-b pb-2">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2"><Mail className="text-slate-400" size={16} /> <span>{patient.email}</span></div>
                <div className="flex items-center gap-2"><Phone className="text-slate-400" size={16} /> <span>{patient.phone || 'N/A'}</span></div>
                <div className="flex items-center gap-2"><MapPin className="text-slate-400" size={16} /> <span>{patient.address || 'Address not provided'}</span></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'HISTORY' && (
          <DataTable 
            columns={bookingColumns} 
            data={patient.patientBookings || []} 
            keyExtractor={(b) => b.id} 
            emptyMessage="No appointment history available."
          />
        )}

        {activeTab === 'DOCTORS' && (
          <DataTable 
            columns={doctorColumns} 
            data={doctorsList} 
            keyExtractor={(d) => d.id} 
            emptyMessage="No doctors associated with this patient."
          />
        )}

        {activeTab === 'HOSPITALS' && (
          <DataTable 
            columns={hospitalColumns} 
            data={hospitalsList} 
            keyExtractor={(h) => h.id} 
            emptyMessage="No hospitals associated with this patient."
          />
        )}

        {activeTab === 'ACTIVITY' && (
          <div className="text-center py-8 text-slate-500">
            No activity available.
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDetails;
