import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { Appointment } from '../types';
import { Activity, Clock, CheckCircle, XCircle, Calendar, CalendarDays } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';
import { useAdminAuth } from '../contexts/AuthContext';
import { appointmentService } from '../services/appointmentService';

const OPBookings: React.FC = () => {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Appointment[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const fetchBookings = async () => {
      if (!token) return;
      try {
        const res = await appointmentService.getAppointments(token);
        if (res.success && Array.isArray(res.data)) {
          // In this system, OPBookings and Appointments share the same model.
          // If we had distinct opTypes like 'Video' or 'Normal', we would filter here.
          setBookings(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch OP bookings:', err);
      }
    };
    fetchBookings();
  }, [token]);

  const todayStr = new Date().toLocaleDateString();

  const kpis = {
    total: bookings.length,
    today: bookings.filter(b => b.date === todayStr).length,
    pending: bookings.filter(b => ['PENDING', 'WAITING'].includes(b.status)).length,
    confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
    completed: bookings.filter(b => b.status === 'COMPLETED').length,
    cancelled: bookings.filter(b => b.status === 'CANCELLED').length,
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = 
      b.id.toLowerCase().includes(search.toLowerCase()) || 
      b.patientName.toLowerCase().includes(search.toLowerCase()) ||
      b.doctorName.toLowerCase().includes(search.toLowerCase()) ||
      b.hospitalName.toLowerCase().includes(search.toLowerCase());
      
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const columns: Column<Appointment>[] = [
    {
      header: 'Booking ID',
      accessor: (b) => <span className="font-medium text-slate-900">{b.id}</span>,
    },
    {
      header: 'Patient',
      accessor: 'patientName',
    },
    {
      header: 'Doctor / Dept',
      accessor: (b) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900">{b.doctorName}</span>
          <span className="text-xs text-slate-500">Department</span>
        </div>
      ),
    },
    {
      header: 'Hospital',
      accessor: (b) => <span className="text-sm text-slate-700">{b.hospitalName}</span>,
    },
    {
      header: 'Schedule',
      accessor: (b) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-900">{b.date}</span>
          <span className="text-xs text-slate-500">{b.time}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (b) => <StatusBadge status={b.status} />,
    },
    {
      header: 'Actions',
      accessor: (b) => (
        <button 
          onClick={() => navigate(`/admin/appointments/${b.id}`)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Manage Booking
        </button>
      ),
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">OP Bookings</h2>
          <p className="text-sm text-slate-500">Manage all outpatient physical consultations.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <KpiCard title="Total OP" value={kpis.total} icon={Activity} />
        <KpiCard title="Today" value={kpis.today} icon={Calendar} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <KpiCard title="Pending" value={kpis.pending} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <KpiCard title="Confirmed" value={kpis.confirmed} icon={CalendarDays} iconColor="text-indigo-600" iconBg="bg-indigo-50" />
        <KpiCard title="Completed" value={kpis.completed} icon={CheckCircle} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <KpiCard title="Cancelled" value={kpis.cancelled} icon={XCircle} iconColor="text-rose-600" iconBg="bg-rose-50" />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <select 
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="WAITING">Waiting</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="IN_CONSULTATION">In Consultation</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <DataTable 
        data={filteredBookings}
        columns={columns}
        keyExtractor={(b) => b.id}
        searchPlaceholder="Search by ID, Patient, Doctor, or Hospital..."
        onSearch={setSearch}
      />
    </div>
  );
};

export default OPBookings;
