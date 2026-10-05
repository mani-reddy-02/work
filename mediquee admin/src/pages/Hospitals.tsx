import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { Hospital } from '../types';
import { Building2, Building, ShieldCheck, ShieldAlert, X } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';
import { useAdminAuth } from '../contexts/AuthContext';
import { hospitalService } from '../services/hospitalService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const Hospitals: React.FC = () => {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [hospitalShareInput, setHospitalShareInput] = useState<number>(80);
  const [isUpdatingShare, setIsUpdatingShare] = useState(false);

  useEffect(() => {
    const fetchHospitals = async () => {
      if (!token) return;
      try {
        const res = await hospitalService.getHospitals(token);
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setHospitals(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch admin hospitals:', err);
      }
    };
    fetchHospitals();
  }, [token]);

  const filteredHospitals = hospitals.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(search.toLowerCase()) || 
                          h.city.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filter === 'VERIFIED') return h.verificationStatus === 'VERIFIED';
    if (filter === 'PENDING') return h.verificationStatus === 'PENDING';
    if (filter === 'ACTIVE') return h.status === 'ACTIVE';
    if (filter === 'INACTIVE') return h.status === 'INACTIVE';
    
    return true; // 'ALL'
  });

  const handleOpenShareModal = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    setHospitalShareInput(hospital.hospitalShare ?? 80);
    setIsShareModalOpen(true);
  };

  const handleSaveShare = async () => {
    if (!selectedHospital || !token) return;
    if (hospitalShareInput < 0 || hospitalShareInput > 100) {
      alert("Share percentage must be between 0 and 100");
      return;
    }
    
    setIsUpdatingShare(true);
    try {
      const res = await hospitalService.updateRevenueShare(token, selectedHospital.id, hospitalShareInput);
      if (res.success) {
        setHospitals(hospitals.map(h => 
          h.id === selectedHospital.id 
            ? { ...h, hospitalShare: res.data.hospitalShare, mediqueeCommission: res.data.mediqueeCommission }
            : h
        ));
        setIsShareModalOpen(false);
      } else {
        alert(res.message || "Failed to update revenue share");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    } finally {
      setIsUpdatingShare(false);
    }
  };

  const columns: Column<Hospital>[] = [
    {
      header: 'Hospital',
      accessor: (h) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900 ">{h.name}</span>
          <span className="text-xs text-slate-500">{h.registrationNumber}</span>
        </div>
      ),
    },
    {
      header: 'Location',
      accessor: (h) => (
        <div className="flex flex-col">
          <span className="text-sm text-slate-700 ">{h.city}</span>
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
      header: 'Revenue Share',
      accessor: (h) => (
        <div className="flex flex-col text-sm">
          <span className="font-medium text-emerald-600">Hospital: {h.hospitalShare ?? 80}%</span>
          <span className="text-blue-600">MediQuee: {h.mediqueeCommission ?? 20}%</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (h) => <StatusBadge status={h.status} />,
    },
    {
      header: 'Actions',
      accessor: (h) => (
        <div className="flex gap-3">
          <button 
            onClick={() => navigate(`/admin/hospitals/${h.id}`)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View
          </button>
          <button 
            onClick={() => handleOpenShareModal(h)}
            className="text-emerald-600 hover:text-emerald-800 text-sm font-medium"
          >
            Manage Share
          </button>
        </div>
      ),
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 ">Hospitals</h2>
          <p className="text-sm text-slate-500 ">Manage hospitals, verification, doctors, departments and hospital-related information.</p>
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

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
        {['ALL', 'VERIFIED', 'PENDING', 'ACTIVE', 'INACTIVE'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f === 'ALL' ? 'All Hospitals' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <DataTable 
        data={filteredHospitals}
        columns={columns}
        keyExtractor={(h) => h.id}
        searchPlaceholder="Search hospitals by name or city..."
        onSearch={setSearch}
      />

      {isShareModalOpen && selectedHospital && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Revenue Share — {selectedHospital.name}</h3>
              <button onClick={() => setIsShareModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hospital Share (%)</label>
                <input 
                  type="number"
                  min="0"
                  max="100"
                  value={hospitalShareInput}
                  onChange={(e) => setHospitalShareInput(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">MediQuee Commission (%)</label>
                <input 
                  type="number"
                  disabled
                  value={100 - hospitalShareInput}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="pt-2">
                <div className="flex justify-between items-center text-sm font-medium p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-600">Total</span>
                  <span className="text-slate-900">100%</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button 
                onClick={() => setIsShareModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                disabled={isUpdatingShare}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveShare}
                disabled={isUpdatingShare}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isUpdatingShare ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hospitals;
