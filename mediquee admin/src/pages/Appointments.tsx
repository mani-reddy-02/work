import React, { useState } from 'react';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { Appointment } from '../types';
import { mockAppointments } from '../mock/data';
import { CalendarCheck, CalendarDays, CalendarOff, CalendarClock } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';

const Appointments: React.FC = () => {
  const [appointments] = useState<Appointment[]>(mockAppointments);
  const [search, setSearch] = useState('');

  const filteredAppointments = appointments.filter(a => 
    a.id.toLowerCase().includes(search.toLowerCase()) || 
    a.patientName.toLowerCase().includes(search.toLowerCase()) ||
    a.doctorName.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Appointment>[] = [
    {
      header: 'ID',
      accessor: (a) => <span className="font-medium text-slate-900">{a.id}</span>,
    },
    {
      header: 'Patient',
      accessor: 'patientName',
    },
    {
      header: 'Doctor & Hospital',
      accessor: (a) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900">{a.doctorName}</span>
          <span className="text-xs text-slate-500">{a.hospitalName}</span>
        </div>
      ),
    },
    {
      header: 'Date & Time',
      accessor: (a) => (
        <div className="flex flex-col">
          <span className="text-sm text-slate-700">{a.date}</span>
          <span className="text-xs text-slate-500">{a.time}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (a) => <StatusBadge status={a.status} />,
    },
    {
      header: 'Actions',
      accessor: (a) => (
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View Details</button>
      ),
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Appointments</h2>
          <p className="text-sm text-slate-500">Global view of all platform appointments.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Appointments" value={appointments.length} icon={CalendarDays} />
        <KpiCard title="Completed" value={appointments.filter(a => a.status === 'COMPLETED').length} icon={CalendarCheck} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <KpiCard title="Pending" value={appointments.filter(a => a.status === 'PENDING').length} icon={CalendarClock} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <KpiCard title="Cancelled" value={appointments.filter(a => a.status === 'CANCELLED').length} icon={CalendarOff} iconColor="text-rose-600" iconBg="bg-rose-50" />
      </div>

      <DataTable 
        data={filteredAppointments}
        columns={columns}
        keyExtractor={(a) => a.id}
        searchPlaceholder="Search by ID, Patient, or Doctor..."
        onSearch={setSearch}
      />
    </div>
  );
};

export default Appointments;
