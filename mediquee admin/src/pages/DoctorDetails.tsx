import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Clock, Hospital, Building, ShieldCheck, FileText, Mail, Phone } from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable, { Column } from '../components/ui/DataTable';
import KpiCard from '../components/ui/KpiCard';

const DoctorDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAdminAuth();
  const [doctor, setDoctor] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'HISTORY' | 'HOSPITAL' | 'DEPARTMENT' | 'VERIFICATION'>('PROFILE');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctor = async () => {
      if (!token || !id) return;
      try {
        const res = await userService.getUserById(token, id);
        if (res.success) {
          setDoctor(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch doctor details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [token, id]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading doctor details...</div>;
  if (!doctor) return <div className="p-8 text-center text-red-500">Doctor not found.</div>;

  const bookings = doctor.doctorBookings || [];
  const completed = bookings.filter((b: any) => b.status === 'COMPLETED').length;
  const upcoming = bookings.filter((b: any) => b.status === 'WAITING' || b.status === 'PENDING').length;
  const cancelled = bookings.filter((b: any) => b.status === 'CANCELLED').length;

  const bookingColumns: Column<any>[] = [
    { header: 'Date', accessor: (b) => new Date(b.appointmentDate).toLocaleDateString() },
    { header: 'Patient', accessor: (b) => b.patient?.name || b.patientName || 'Unknown' },
    { header: 'Hospital', accessor: (b) => b.hospital?.name || 'Unknown' },
    { header: 'Department', accessor: (b) => b.department?.name || 'Unknown' },
    { header: 'Status', accessor: (b) => <StatusBadge status={b.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/doctors')} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              Dr. {doctor.name}
              <StatusBadge status={doctor.active ? 'ACTIVE' : 'INACTIVE'} />
            </h1>
            <p className="text-sm text-slate-500">{doctor.specialization || doctor.department?.name || 'General'} Specialist</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Appointments" value={bookings.length} icon={FileText} />
        <KpiCard title="Completed" value={completed} icon={User} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <KpiCard title="Upcoming" value={upcoming} icon={Clock} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <KpiCard title="Cancelled" value={cancelled} icon={Clock} iconColor="text-rose-600" iconBg="bg-rose-50" />
      </div>

      <div className="flex border-b border-slate-200 overflow-x-auto">
        {[
          { id: 'PROFILE', label: 'Professional Profile', icon: User },
          { id: 'HISTORY', label: 'Appointment History', icon: Clock },
          { id: 'HOSPITAL', label: 'Hospital', icon: Hospital },
          { id: 'DEPARTMENT', label: 'Department', icon: Building },
          { id: 'VERIFICATION', label: 'Verification', icon: ShieldCheck },
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
              <h3 className="font-semibold text-slate-900 border-b pb-2">Professional Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-slate-500 block">Full Name</span><span className="font-medium">Dr. {doctor.name}</span></div>
                <div><span className="text-sm text-slate-500 block">Qualifications</span><span className="font-medium">{doctor.qualification || 'Not provided'}</span></div>
                <div><span className="text-sm text-slate-500 block">Experience</span><span className="font-medium">{doctor.experienceYears || 0} Years</span></div>
                <div><span className="text-sm text-slate-500 block">Registration Date</span><span className="font-medium">{new Date(doctor.createdAt).toLocaleDateString()}</span></div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 border-b pb-2">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2"><Mail className="text-slate-400" size={16} /> <span>{doctor.email}</span></div>
                <div className="flex items-center gap-2"><Phone className="text-slate-400" size={16} /> <span>{doctor.phone || 'N/A'}</span></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'HISTORY' && (
          <DataTable 
            columns={bookingColumns} 
            data={bookings} 
            keyExtractor={(b) => b.id} 
            emptyMessage="No appointment history available."
          />
        )}

        {activeTab === 'HOSPITAL' && (
          <div className="space-y-4">
            {doctor.hospital ? (
              <div className="p-4 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900">{doctor.hospital.name}</h4>
                  <p className="text-sm text-slate-500">{doctor.hospital.city}, {doctor.hospital.state}</p>
                </div>
                <button 
                  onClick={() => navigate(`/admin/hospitals/${doctor.hospital.id}`)}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100"
                >
                  View Hospital
                </button>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">No hospital assignment.</div>
            )}
          </div>
        )}

        {activeTab === 'DEPARTMENT' && (
          <div className="space-y-4">
            {doctor.department ? (
              <div className="p-4 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900">{doctor.department.name}</h4>
                </div>
                <button 
                  onClick={() => navigate(`/admin/departments/${doctor.department.id}`)}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100"
                >
                  View Department
                </button>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">No department assignment.</div>
            )}
          </div>
        )}

        {activeTab === 'VERIFICATION' && (
          <div className="space-y-6 max-w-2xl">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <h4 className="font-semibold text-slate-900">Account Status</h4>
                <p className="text-sm text-slate-500">Current verification state in the system.</p>
              </div>
              <StatusBadge status={doctor.active ? 'VERIFIED' : 'PENDING'} />
            </div>
            
            <div className="flex gap-4">
               {/* Verification actions would go here in a full implementation */}
               <button disabled className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium opacity-50 cursor-not-allowed">
                 Verify Doctor
               </button>
               <button disabled className="px-4 py-2 bg-rose-100 text-rose-600 rounded-lg font-medium opacity-50 cursor-not-allowed">
                 Reject
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDetails;
