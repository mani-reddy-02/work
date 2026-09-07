import React, { useState, useEffect } from 'react';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { Hospital } from '../types';
import { mockHospitals } from '../mock/data';
import { Building2, Building, ShieldCheck, ShieldAlert } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';
import { useAdminAuth } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const Hospitals: React.FC = () => {
  const { token } = useAdminAuth();
  const [hospitals, setHospitals] = useState<Hospital[]>(mockHospitals);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchHospitals = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE_URL}/admin/hospitals`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            setHospitals(json.data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch admin hospitals:', err);
      }
    };
    fetchHospitals();
  }, [token]);

  const filteredHospitals = hospitals.filter(h => 
    h.name.toLowerCase().includes(search.toLowerCase()) || 
    h.city.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Hospital>[] = [
    {
      header: 'Hospital',
      accessor: (h) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900 dark:text-white">{h.name}</span>
          <span className="text-xs text-slate-500">{h.registrationNumber}</span>
        </div>
      ),
    },
    {
      header: 'Location',
      accessor: (h) => (
        <div className="flex flex-col">
          <span className="text-sm text-slate-700 dark:text-slate-300">{h.city}</span>
          <span className="text-xs text-slate-500">{h.state}</span>
        </div>
      ),
    },
    {
      header: 'Stats',
      accessor: (h) => (
        <div className="flex flex-col text-xs text-slate-500">
          <span>{h.departmentCount} Depts</span>
          <span>{h.doctorCount} Doctors</span>
        </div>
      ),
    },
    {
      header: 'Verification',
      accessor: (h) => <StatusBadge status={h.verificationStatus} />,
    },
    {
      header: 'Status',
      accessor: (h) => <StatusBadge status={h.status} />,
    },
    {
      header: 'Actions',
      accessor: (h) => (
        <button 
          onClick={() => alert(`Viewing hospital: ${h.name}`)}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm font-medium"
        >
          View
        </button>
      ),
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Hospital Management</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">View and manage registered hospitals and medical centers</p>
        </div>
        <button 
          onClick={() => alert('New hospital registration can be performed on the Onboarding portal.')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Building size={16} />
          Add Hospital
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Hospitals" value={hospitals.length} icon={Building2} />
        <KpiCard title="Verified" value={hospitals.filter(h => h.verificationStatus === 'VERIFIED').length} icon={ShieldCheck} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <KpiCard title="Pending" value={hospitals.filter(h => h.verificationStatus === 'PENDING').length} icon={ShieldAlert} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <KpiCard title="Inactive" value={hospitals.filter(h => h.status === 'INACTIVE').length} icon={Building} iconColor="text-rose-600" iconBg="bg-rose-50" />
      </div>

      <DataTable 
        data={filteredHospitals}
        columns={columns}
        keyExtractor={(h) => h.id}
        searchPlaceholder="Search hospitals by name or city..."
        onSearch={setSearch}
      />
    </div>
  );
};

export default Hospitals;
