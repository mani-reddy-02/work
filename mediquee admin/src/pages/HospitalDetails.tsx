import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Stethoscope, Building, Calendar, DollarSign, MapPin, Mail, Phone } from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';
import { hospitalService } from '../services/hospitalService';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable, { Column } from '../components/ui/DataTable';
import KpiCard from '../components/ui/KpiCard';

const HospitalDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAdminAuth();
  const [hospital, setHospital] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'DOCTORS' | 'DEPARTMENTS' | 'APPOINTMENTS' | 'REVENUE'>('PROFILE');
  const [loading, setLoading] = useState(true);

  const fetchHospital = async () => {
    if (!token || !id) return;
    try {
      const res = await hospitalService.getHospitalById(token, id);
      if (res.success) {
        setHospital(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch hospital details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospital();
  }, [token, id]);

  const handleShareUpdate = async (newShare: number) => {
    if (!token || !id) return;
    if (newShare < 0 || newShare > 100) {
      alert("Share percentage must be between 0 and 100");
      return;
    }
    const res = await hospitalService.updateRevenueShare(token, id, newShare);
    if (res.success) {
      fetchHospital();
    } else {
      alert(res.message || "Failed to update revenue share");
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading hospital details...</div>;
  if (!hospital) return <div className="p-8 text-center text-red-500">Hospital not found.</div>;

  const doctors = hospital.users?.filter((u: any) => u.role === 'DOCTOR') || [];
  const verifiedDoctors = doctors.filter((d: any) => d.active).length;
  
  const doctorColumns: Column<any>[] = [
    { header: 'Doctor Name', accessor: 'name' },
    { header: 'Specialization', accessor: 'specialization' },
    { header: 'Experience', accessor: (d) => `${d.experienceYears || 0} Years` },
    { header: 'Status', accessor: (d) => <StatusBadge status={d.active ? 'VERIFIED' : 'PENDING'} /> },
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

  const departmentColumns: Column<any>[] = [
    { header: 'Department Name', accessor: 'name' },
    { header: 'Description', accessor: 'description' },
    { 
      header: 'Actions', 
      accessor: (d) => (
        <button 
          onClick={() => navigate(`/admin/departments/${d.id}`)}
          className="text-blue-600 hover:underline text-sm"
        >
          View Department
        </button>
      )
    }
  ];

  const bookingColumns: Column<any>[] = [
    { header: 'Date', accessor: (b) => new Date(b.appointmentDate).toLocaleDateString() },
    { header: 'Patient', accessor: (b) => b.patient?.name || b.patientName || 'Unknown' },
    { header: 'Doctor', accessor: (b) => b.doctor?.name || 'Unknown' },
    { header: 'Department', accessor: (b) => b.department?.name || 'Unknown' },
    { header: 'Status', accessor: (b) => <StatusBadge status={b.status} /> },
  ];

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Doctors" value={doctors.length} icon={Stethoscope} />
        <KpiCard title="Verified Doctors" value={verifiedDoctors} icon={Stethoscope} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <KpiCard title="Total Departments" value={hospital.departments?.length || 0} icon={Building} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <KpiCard title="Appointments" value={hospital.opBookings?.length || 0} icon={Calendar} iconColor="text-amber-600" iconBg="bg-amber-50" />
      </div>

      <div className="flex border-b border-slate-200 overflow-x-auto">
        {[
          { id: 'PROFILE', label: 'Profile', icon: Building2 },
          { id: 'DOCTORS', label: 'Doctors', icon: Stethoscope },
          { id: 'DEPARTMENTS', label: 'Departments', icon: Building },
          { id: 'APPOINTMENTS', label: 'Appointments', icon: Calendar },
          { id: 'REVENUE', label: 'Revenue Share', icon: DollarSign },
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
        {activeTab === 'PROFILE' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 border-b pb-2">Hospital Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-slate-500 block">Hospital Name</span><span className="font-medium">{hospital.name}</span></div>
                <div><span className="text-sm text-slate-500 block">Registration Number</span><span className="font-medium">{hospital.registrationNumber || 'N/A'}</span></div>
                <div><span className="text-sm text-slate-500 block">Established Year</span><span className="font-medium">{hospital.establishedYear || 'N/A'}</span></div>
                <div><span className="text-sm text-slate-500 block">System Registration</span><span className="font-medium">{new Date(hospital.createdAt).toLocaleDateString()}</span></div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 border-b pb-2">Contact & Location</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2"><Mail className="text-slate-400" size={16} /> <span>{hospital.contactEmail || 'N/A'}</span></div>
                <div className="flex items-center gap-2"><Phone className="text-slate-400" size={16} /> <span>{hospital.contactPhone || 'N/A'}</span></div>
                <div className="flex items-center gap-2"><MapPin className="text-slate-400" size={16} /> <span>{hospital.addressLine1}, {hospital.city}, {hospital.state}</span></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'DOCTORS' && (
          <DataTable 
            columns={doctorColumns} 
            data={doctors} 
            keyExtractor={(d) => d.id} 
            emptyMessage="No doctors associated with this hospital."
          />
        )}

        {activeTab === 'DEPARTMENTS' && (
          <DataTable 
            columns={departmentColumns} 
            data={hospital.departments || []} 
            keyExtractor={(d) => d.id} 
            emptyMessage="No departments available."
          />
        )}

        {activeTab === 'APPOINTMENTS' && (
          <DataTable 
            columns={bookingColumns} 
            data={hospital.opBookings || []} 
            keyExtractor={(b) => b.id} 
            emptyMessage="No appointments for this hospital."
          />
        )}

        {activeTab === 'REVENUE' && (
          <div className="max-w-md space-y-6">
            <h3 className="font-semibold text-slate-900 border-b pb-2">Financial Configuration</h3>
            
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-emerald-700">Hospital Share</span>
                <span className="font-bold text-emerald-700">{hospital.hospitalShare ?? 80}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-700">MediQuee Commission</span>
                <span className="font-bold text-blue-700">{100 - (hospital.hospitalShare ?? 80)}%</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Update Hospital Share (%)</label>
              <div className="flex gap-2">
                <input 
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={hospital.hospitalShare ?? 80}
                  id="shareInput"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                  onClick={() => {
                    const el = document.getElementById('shareInput') as HTMLInputElement;
                    if(el) handleShareUpdate(Number(el.value));
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 whitespace-nowrap"
                >
                  Update
                </button>
              </div>
              <p className="text-xs text-slate-500">MediQuee commission will be automatically adjusted to equal 100%.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HospitalDetails;
