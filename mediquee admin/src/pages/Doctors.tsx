import React, { useState } from 'react';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { Doctor } from '../types';
import { mockDoctors } from '../mock/data';
import { Stethoscope, UserCheck, UserX, ShieldCheck } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';

const Doctors: React.FC = () => {
  const [doctors] = useState<Doctor[]>(mockDoctors);
  const [search, setSearch] = useState('');

  const filteredDoctors = doctors.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.specialization.toLowerCase().includes(search.toLowerCase()) ||
    d.hospitalName.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Doctor>[] = [
    {
      header: 'Doctor',
      accessor: (d) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900">{d.name}</span>
          <span className="text-xs text-slate-500">{d.qualification}</span>
        </div>
      ),
    },
    {
      header: 'Specialization',
      accessor: 'specialization',
    },
    {
      header: 'Hospital',
      accessor: (d) => <span className="text-sm text-slate-600">{d.hospitalName}</span>,
    },
    {
      header: 'Experience',
      accessor: (d) => `${d.experienceYears} Years`,
    },
    {
      header: 'Verification',
      accessor: (d) => <StatusBadge status={d.verificationStatus} />,
    },
    {
      header: 'Status',
      accessor: (d) => <StatusBadge status={d.status} />,
    },
    {
      header: 'Actions',
      accessor: (d) => (
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View</button>
      ),
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Doctor Management</h2>
          <p className="text-sm text-slate-500">Manage doctor profiles and verifications.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Doctors" value={doctors.length} icon={Stethoscope} />
        <KpiCard title="Verified" value={doctors.filter(d => d.verificationStatus === 'VERIFIED').length} icon={ShieldCheck} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <KpiCard title="Active" value={doctors.filter(d => d.status === 'ACTIVE').length} icon={UserCheck} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <KpiCard title="Inactive" value={doctors.filter(d => d.status === 'INACTIVE').length} icon={UserX} iconColor="text-rose-600" iconBg="bg-rose-50" />
      </div>

      <DataTable 
        data={filteredDoctors}
        columns={columns}
        keyExtractor={(d) => d.id}
        searchPlaceholder="Search doctors by name, specialty, or hospital..."
        onSearch={setSearch}
      />
    </div>
  );
};

export default Doctors;
