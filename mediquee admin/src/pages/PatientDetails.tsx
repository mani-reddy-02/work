import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Clock, Mail, Phone, MapPin, Calendar, Activity, CheckCircle, XCircle } from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable, { Column } from '../components/ui/DataTable';

const PatientDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAdminAuth();
  const [patient, setPatient] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'HISTORY'>('OVERVIEW');
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

  const bookings = patient.patientBookings || [];
  const totalBookings = bookings.length;
  const completedBookings = bookings.filter((b: any) => b.status === 'COMPLETED').length;
  const cancelledBookings = bookings.filter((b: any) => b.status === 'CANCELLED').length;
  const upcomingBookings = bookings.filter((b: any) => b.status === 'PENDING' || b.status === 'WAITING' || b.status === 'IN_CONSULTATION').length;

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
      header: 'Doctor', 
      accessor: (b) => (
        <span 
          className="text-blue-600 hover:underline cursor-pointer font-medium"
          onClick={(e) => {
            e.stopPropagation();
            if (b.doctor?.id) navigate(`/admin/doctors/${b.doctor.id}`);
          }}
        >
          {b.doctor?.name || 'Unknown'}
        </span>
      )
    },
    { header: 'Department', accessor: (b) => <span className="text-sm text-slate-700">{b.department?.name || 'Unknown'}</span> },
    { 
      header: 'Hospital', 
      accessor: (b) => (
        <span 
          className="text-blue-600 hover:underline cursor-pointer text-sm"
          onClick={(e) => {
            e.stopPropagation();
            if (b.hospital?.id) navigate(`/admin/hospitals/${b.hospital.id}`);
          }}
        >
          {b.hospital?.name || 'Unknown'}
        </span>
      )
    },
    { header: 'Status', accessor: (b) => <StatusBadge status={b.status} /> },
  ];

  // Calculate age
  let age = 'N/A';
  if (patient.dob) {
    const birthDate = new Date(patient.dob);
    const ageDifMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDifMs);
    age = Math.abs(ageDate.getUTCFullYear() - 1970).toString();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/patients')} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg shrink-0 overflow-hidden">
            {patient.avatar ? <img src={patient.avatar} alt={patient.name} className="w-full h-full object-cover" /> : patient.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              {patient.name}
              <StatusBadge status={patient.active ? 'ACTIVE' : 'INACTIVE'} />
            </h1>
            <p className="text-sm text-slate-500">Patient ID: {patient.id}</p>
          </div>
        </div>
      </div>

      <div className="flex border-b border-slate-200 overflow-x-auto hide-scrollbar">
        {[
          { id: 'OVERVIEW', label: 'Overview', icon: User },
          { id: 'HISTORY', label: 'Booking History', icon: Clock },
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
                <div><span className="text-sm text-slate-500 block">Full Name</span><span className="font-medium text-slate-900">{patient.name}</span></div>
                <div><span className="text-sm text-slate-500 block">Gender</span><span className="font-medium text-slate-900">{patient.gender || 'N/A'}</span></div>
                <div><span className="text-sm text-slate-500 block">Date of Birth</span><span className="font-medium text-slate-900">{patient.dob ? new Date(patient.dob).toLocaleDateString() : 'N/A'}</span></div>
                <div><span className="text-sm text-slate-500 block">Age</span><span className="font-medium text-slate-900">{age}</span></div>
                <div><span className="text-sm text-slate-500 block">Registration Date</span><span className="font-medium text-slate-900">{new Date(patient.createdAt).toLocaleDateString()}</span></div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 border-b pb-2">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2"><Mail className="text-slate-400 mt-0.5 shrink-0" size={16} /> <span className="text-slate-700">{patient.email}</span></div>
                <div className="flex items-start gap-2"><Phone className="text-slate-400 mt-0.5 shrink-0" size={16} /> <span className="text-slate-700">{patient.phone || 'N/A'}</span></div>
                <div className="flex items-start gap-2"><MapPin className="text-slate-400 mt-0.5 shrink-0" size={16} /> 
                  <span className="text-slate-700">
                    {[patient.address, patient.city, patient.state].filter(Boolean).join(', ') || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'HISTORY' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Activity size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Total Bookings</p>
                  <p className="text-xl font-bold text-slate-900">{totalBookings}</p>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-emerald-50 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Completed</p>
                  <p className="text-xl font-bold text-slate-900">{completedBookings}</p>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-amber-50 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Upcoming</p>
                  <p className="text-xl font-bold text-slate-900">{upcomingBookings}</p>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-rose-50 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                  <XCircle size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Cancelled</p>
                  <p className="text-xl font-bold text-slate-900">{cancelledBookings}</p>
                </div>
              </div>
            </div>

            {(() => {
              const hMap = new Map<string, {name: string, count: number}>();
              bookings.forEach((b: any) => {
                if (b.hospital) {
                  const id = b.hospital.id;
                  if (!hMap.has(id)) hMap.set(id, { name: b.hospital.name, count: 0 });
                  hMap.get(id)!.count++;
                }
              });
              const hList = Array.from(hMap.values()).sort((a, b) => b.count - a.count);
              if (hList.length === 0) return null;
              
              return (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Hospitals Visited</h4>
                  <div className="flex flex-wrap gap-2">
                    {hList.map((h, i) => (
                      <div key={i} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm flex items-center gap-2">
                        <span className="font-medium text-slate-900">{h.name}</span>
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-semibold">{h.count} {h.count === 1 ? 'booking' : 'bookings'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <DataTable 
              columns={bookingColumns} 
              data={bookings} 
              keyExtractor={(b) => b.id} 
              emptyMessage="No appointment history available."
              onRowClick={(b) => navigate(`/admin/appointments/${b.id}`)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDetails;
