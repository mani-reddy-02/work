import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, Building2, TestTube, RefreshCw } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';
import { useAdminAuth } from '../contexts/AuthContext';
import { adminService } from '../services/adminService';
import PendingVerifications from '../components/admin/PendingVerifications';

const Verification: React.FC = () => {
  const { token } = useAdminAuth();
  const [stats, setStats] = useState<{
    pending: number;
    approvedHospitals: number;
    approvedLabs: number;
    totalPartners: number;
  }>({
    pending: 0,
    approvedHospitals: 0,
    approvedLabs: 0,
    totalPartners: 0
  });
  const [loadingStats, setLoadingStats] = useState(false);

  const fetchStats = async () => {
    if (!token) return;
    try {
      setLoadingStats(true);
      const res = await adminService.getPendingVerifications(token);
      if (res.success && res.data) {
        if (res.data.stats) {
          setStats(res.data.stats);
        } else {
          const pendingCount = (res.data.hospitals?.length || 0) + 
                               (res.data.standaloneLabs?.length || 0) + 
                               (res.data.hospitalBasedLabs?.length || 0);
          setStats(prev => ({ ...prev, pending: pendingCount }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch verification stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Verification Center</h2>
          <p className="text-sm text-slate-500">
            Review partner registrations, inspect operating licenses, and configure financial revenue share percentages.
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loadingStats}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs disabled:opacity-50"
        >
          <RefreshCw size={15} className={loadingStats ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Pending Review" 
          value={stats.pending} 
          icon={Clock} 
          iconColor="text-amber-600" 
          iconBg="bg-amber-50" 
        />
        <KpiCard 
          title="Verified Hospitals" 
          value={stats.approvedHospitals} 
          icon={Building2} 
          iconColor="text-blue-600" 
          iconBg="bg-blue-50" 
        />
        <KpiCard 
          title="Verified Labs" 
          value={stats.approvedLabs} 
          icon={TestTube} 
          iconColor="text-indigo-600" 
          iconBg="bg-indigo-50" 
        />
        <KpiCard 
          title="Total Registered Partners" 
          value={stats.totalPartners} 
          icon={ShieldCheck} 
          iconColor="text-emerald-600" 
          iconBg="bg-emerald-50" 
        />
      </div>

      <PendingVerifications />
    </div>
  );
};

export default Verification;
