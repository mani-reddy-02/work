import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Clock, Hospital, Building, ShieldCheck, FileText, Mail, Phone } from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable, { Column } from '../components/ui/DataTable';

const DoctorDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAdminAuth();
  const [doctor, setDoctor] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'HISTORY'>('PROFILE');
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

  // Derive all hospitals and departments from bookings (authoritative real backend data)
  const hMap = new Map<string, {name: string, count: number, id: string}>();
  const dMap = new Map<string, {name: string, count: number, id: string}>();

  bookings.forEach((b: any) => {
    if (b.hospital) {
      const hid = b.hospital.id;
      if (!hMap.has(hid)) hMap.set(hid, { name: b.hospital.name, count: 0, id: hid });
      hMap.get(hid)!.count++;
    }
    if (b.department) {
      const did = b.department.id;
      if (!dMap.has(did)) dMap.set(did, { name: b.department.name, count: 0, id: did });
      dMap.get(did)!.count++;
    }
  });

  // If no bookings, fallback to basic relations if they exist
  if (bookings.length === 0 && doctor.hospital) {
      hMap.set(doctor.hospital.id, { name: doctor.hospital.name, count: 0, id: doctor.hospital.id });
  }
  if (bookings.length === 0 && doctor.department) {
      dMap.set(doctor.department.id, { name: doctor.department.name, count: 0, id: doctor.department.id });
  }

  const hList = Array.from(hMap.values()).sort((a, b) => b.count - a.count);
  const dList = Array.from(dMap.values()).sort((a, b) => b.count - a.count);

  const mainSpecialization = dList.length > 0 ? dList[0].name : (doctor.specialization || doctor.department?.name || 'Not specified');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/doctors')} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg shrink-0 overflow-hidden">
            {doctor.avatar ? <img src={doctor.avatar} alt={doctor.name} className="w-full h-full object-cover" /> : doctor.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              Dr. {doctor.name}
              <StatusBadge status={doctor.active ? 'VERIFIED' : 'PENDING'} />
            </h1>
            <p className="text-sm text-slate-500">Doctor ID: {doctor.id}</p>
          </div>
        </div>
      </div>

      <div className="flex border-b border-slate-200 overflow-x-auto hide-scrollbar">
        {[
          { id: 'PROFILE', label: 'Professional Profile', icon: User },
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
        {activeTab === 'PROFILE' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 border-b pb-2">Professional Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="text-sm text-slate-500 block">Full Name</span><span className="font-medium text-slate-900">Dr. {doctor.name}</span></div>
                  <div><span className="text-sm text-slate-500 block">Qualifications</span><span className="font-medium text-slate-900">{doctor.qualification || 'Not provided'}</span></div>
                  <div><span className="text-sm text-slate-500 block">Experience</span><span className="font-medium text-slate-900">{doctor.experienceYears || 0} Years</span></div>
                  <div><span className="text-sm text-slate-500 block">Registration Date</span><span className="font-medium text-slate-900">{new Date(doctor.createdAt).toLocaleDateString()}</span></div>
                  <div><span className="text-sm text-slate-500 block">Gender</span><span className="font-medium text-slate-900">{doctor.gender || 'Not specified'}</span></div>
                  <div><span className="text-sm text-slate-500 block">Date of Birth</span><span className="font-medium text-slate-900">{doctor.dob ? new Date(doctor.dob).toLocaleDateString() : 'Not specified'}</span></div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 border-b pb-2">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2"><Mail className="text-slate-400 mt-0.5 shrink-0" size={16} /> <span className="text-slate-700">{doctor.email}</span></div>
                  <div className="flex items-start gap-2"><Phone className="text-slate-400 mt-0.5 shrink-0" size={16} /> <span className="text-slate-700">{doctor.phone || 'N/A'}</span></div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 border-b pb-2">Specialization & Departments</h3>
                <div className="flex flex-wrap gap-2">
                  {dList.length > 0 ? dList.map((d, i) => (
                    <div key={i} className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700 font-medium flex items-center gap-2">
                      <Building size={14} />
                      {d.name}
                    </div>
                  )) : (
                    <div className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700 font-medium flex items-center gap-2">
                      <Building size={14} />
                      {mainSpecialization}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 border-b pb-2">Associated Hospitals</h3>
                <div className="flex flex-col gap-3">
                  {hList.length > 0 ? hList.map((h, i) => (
                    <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center">
                          <Hospital size={16} className="text-slate-400" />
                        </div>
                        <span className="font-medium text-slate-900">{h.name}</span>
                      </div>
                      <button 
                        onClick={() => navigate(`/admin/hospitals/${h.id}`)}
                        className="text-xs font-medium text-blue-600 hover:underline"
                      >
                        View
                      </button>
                    </div>
                  )) : (
                    <span className="text-sm text-slate-500">No hospitals associated.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'HISTORY' && (
          <div className="space-y-6">
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

export default DoctorDetails;
