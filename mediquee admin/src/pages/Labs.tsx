import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, FlaskConical, Clock, ChevronLeft, ChevronRight,
  X, AlertCircle, TestTube, ShieldCheck
} from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import KpiCard from '../components/ui/KpiCard';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const Labs: React.FC = () => {
  const { token } = useAdminAuth();
  const navigate = useNavigate();

  // =========================================================================
  // 1. LAB DIRECTORY STATE (PRESERVED)
  // =========================================================================
  const [activeTab, setActiveTab] = useState<'HOSPITAL_BASED' | 'STANDALONE'>('HOSPITAL_BASED');
  const [labs, setLabs] = useState<any[]>([]);
  const [loadingLabs, setLoadingLabs] = useState(false);
  const [labsError, setLabsError] = useState<string | null>(null);

  const [labSearchTerm, setLabSearchTerm] = useState('');
  const [labCurrentPage, setLabCurrentPage] = useState(1);
  const [labTotalPages, setLabTotalPages] = useState(1);
  const labLimit = 20;

  const [totalLabs, setTotalLabs] = useState<number | null>(null);
  const [totalHospitalLabs, setTotalHospitalLabs] = useState<number | null>(null);
  const [totalStandaloneLabs, setTotalStandaloneLabs] = useState<number | null>(null);

  // Verification Summary Stats from real database
  const [verificationStats, setVerificationStats] = useState({
    total: 0,
    approved: 0,
    pending: 0
  });
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'APPROVED' | 'PENDING'>('all');

  const [showLabFilters, setShowLabFilters] = useState(false);
  const [activeLabFilters, setActiveLabFilters] = useState({ place: 'ALL', hospitalId: 'ALL', verificationStatus: 'ALL' });
  const [pendingLabFilters, setPendingLabFilters] = useState({ place: 'ALL', hospitalId: 'ALL', verificationStatus: 'ALL' });
  const [hospitals, setHospitals] = useState<any[]>([]);

  const labFilterRef = useRef<HTMLDivElement>(null);

  // Fetch KPI Cards for Laboratories Directory
  useEffect(() => {
    const fetchKPIs = async () => {
      if (!token) return;
      try {
        const [allRes, hospitalRes, standaloneRes] = await Promise.all([
          fetch(`${API_URL}/laboratories?limit=1`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/laboratories?type=HOSPITAL_BASED&limit=1`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/laboratories?type=STANDALONE&limit=1`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        const allResult = await allRes.json();
        const hospitalResult = await hospitalRes.json();
        const standaloneResult = await standaloneRes.json();

        if (allResult.success) {
          setTotalLabs(allResult.pagination?.total || 0);
          if (allResult.summary) {
            setVerificationStats({
              total: allResult.summary.total,
              approved: allResult.summary.approved,
              pending: allResult.summary.pending
            });
          }
        }
        if (hospitalResult.success) setTotalHospitalLabs(hospitalResult.pagination?.total || 0);
        if (standaloneResult.success) setTotalStandaloneLabs(standaloneResult.pagination?.total || 0);
      } catch (err) {
        console.error('Error fetching lab KPIs', err);
      }
    };
    fetchKPIs();
  }, [token]);

  // Fetch Hospital List for filters
  useEffect(() => {
    const fetchHospitals = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/admin/hospitals?limit=1000`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        if (result.success) setHospitals(result.data);
      } catch (err) {
        console.error('Failed to load hospitals', err);
      }
    };
    fetchHospitals();
  }, [token]);

  // Click outside listener for lab filter dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (labFilterRef.current && !labFilterRef.current.contains(event.target as Node)) {
        setShowLabFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Laboratories Table Data
  const fetchLabs = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingLabs(true);
      const queryParams = new URLSearchParams({
        page: labCurrentPage.toString(),
        limit: labLimit.toString(),
        type: activeTab,
        ...(labSearchTerm && { search: labSearchTerm }),
        ...(activeLabFilters.place !== 'ALL' && { place: activeLabFilters.place }),
        ...(activeTab === 'HOSPITAL_BASED' && activeLabFilters.hospitalId !== 'ALL' && { hospitalId: activeLabFilters.hospitalId }),
        ...(verificationFilter !== 'all' && { verificationStatus: verificationFilter }),
        ...(activeLabFilters.verificationStatus !== 'ALL' && verificationFilter === 'all' && { verificationStatus: activeLabFilters.verificationStatus })
      });

      const response = await fetch(`${API_URL}/laboratories?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();
      if (result.success) {
        setLabs(result.data || []);
        setLabTotalPages(result.pagination?.totalPages || 1);
        if (result.summary) {
          setVerificationStats({
            total: result.summary.total,
            approved: result.summary.approved,
            pending: result.summary.pending
          });
        }
      } else {
        setLabsError(result.message || 'Failed to fetch labs');
      }
    } catch (err) {
      setLabsError('An error occurred while fetching labs');
    } finally {
      setLoadingLabs(false);
    }
  }, [labCurrentPage, labSearchTerm, activeLabFilters, activeTab, verificationFilter, token]);

  useEffect(() => {
    fetchLabs();
  }, [fetchLabs]);

  const handleLabSearch = (term: string) => {
    setLabSearchTerm(term);
    setLabCurrentPage(1);
  };

  const applyLabFilters = () => {
    setActiveLabFilters(pendingLabFilters);
    if (pendingLabFilters.verificationStatus !== 'ALL') {
      setVerificationFilter(pendingLabFilters.verificationStatus as any);
    } else {
      setVerificationFilter('all');
    }
    setLabCurrentPage(1);
    setShowLabFilters(false);
  };

  const clearLabFilters = () => {
    setPendingLabFilters({ place: 'ALL', hospitalId: 'ALL', verificationStatus: 'ALL' });
    setActiveLabFilters({ place: 'ALL', hospitalId: 'ALL', verificationStatus: 'ALL' });
    setVerificationFilter('all');
    setLabCurrentPage(1);
    setShowLabFilters(false);
  };

  const handleTabChange = (tab: 'HOSPITAL_BASED' | 'STANDALONE') => {
    setActiveTab(tab);
    setLabSearchTerm('');
    setPendingLabFilters({ place: 'ALL', hospitalId: 'ALL', verificationStatus: 'ALL' });
    setActiveLabFilters({ place: 'ALL', hospitalId: 'ALL', verificationStatus: 'ALL' });
    setVerificationFilter('all');
    setLabCurrentPage(1);
  };

  const hasActiveLabFilters = activeLabFilters.place !== 'ALL' || (activeTab === 'HOSPITAL_BASED' && activeLabFilters.hospitalId !== 'ALL') || activeLabFilters.verificationStatus !== 'ALL' || verificationFilter !== 'all';

  const baseLabColumns = [
    { accessor: 'sno', header: 'S.No' },
    { accessor: 'name', header: 'Lab Name' },
    { accessor: 'id', header: 'Lab ID' },
  ];

  const hospitalColumns = activeTab === 'HOSPITAL_BASED' 
    ? [{ accessor: 'hospitalName', header: 'Hospital' }] 
    : [];

  const endLabColumns = [
    { accessor: 'location', header: 'Location' },
    { accessor: 'contactPhone', header: 'Contact' },
    { accessor: (item: any) => (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
        {item.status || 'Active'}
      </span>
    ), header: 'Status' },
    {
      accessor: (item: any) => (
        <StatusBadge status={item.verificationStatus || 'APPROVED'} />
      ),
      header: 'Verification'
    },
    {
      accessor: (item: any) => (
        <span className="text-sm font-semibold text-slate-900">
          {item.hospitalShare !== null && item.hospitalShare !== undefined ? `${100 - Number(item.hospitalShare)}%` : <span className="text-xs font-normal text-slate-400">Not configured</span>}
        </span>
      ),
      header: 'Admin Commission'
    },
    {
      accessor: (item: any) => (
        <span className="text-sm font-semibold text-slate-900">
          {item.hospitalShare !== null && item.hospitalShare !== undefined ? `${Number(item.hospitalShare)}%` : <span className="text-xs font-normal text-slate-400">Not configured</span>}
        </span>
      ),
      header: 'Lab Share'
    },
    {
      accessor: (item: any) => {
        const isConfigured = item.hospitalShare !== null && item.hospitalShare !== undefined;
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
            isConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
          }`}>
            {isConfigured ? 'Configured' : 'Not configured'}
          </span>
        );
      },
      header: 'Commission Status'
    }
  ];

  const labColumns = [...baseLabColumns, ...hospitalColumns, ...endLabColumns];

  const labTableData = labs.map((l, index) => ({
    ...l,
    sno: ((labCurrentPage - 1) * labLimit) + index + 1,
    type: l.type || (l.businessType === 'LABORATORY' ? 'STANDALONE' : 'HOSPITAL_BASED'),
    hospitalName: l.hospitalName || l.hospital?.name || (l.businessType !== 'LABORATORY' ? l.name : null),
    location: l.city ? `${(l.addressLine1 || l.address) ? (l.addressLine1 || l.address) + ', ' : ''}${l.city}` : (l.addressLine1 || l.address || 'N/A'),
    status: l.status || 'Active',
    verificationStatus: l.verificationStatus || 'APPROVED'
  }));


  return (
    <div className="space-y-8 pb-12">
      {/* =========================================================================
          PAGE HEADER
      ========================================================================= */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Laboratories</h1>
          <p className="text-slate-500 text-sm">
            Manage hospital-based and standalone laboratory facilities registered on MediQuee.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/lab-departments')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2"
          >
            <TestTube size={16} /> Manage Lab Departments & Tests
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION: LABORATORY SUMMARY & VERIFICATION TILES
      ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard
          title="Total Laboratories"
          value={verificationStats.total || totalLabs || 0}
          icon={FlaskConical}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          subtitle="All registered laboratory facilities"
          onClick={() => {
            setVerificationFilter('all');
            setPendingLabFilters(prev => ({ ...prev, verificationStatus: 'ALL' }));
            setActiveLabFilters(prev => ({ ...prev, verificationStatus: 'ALL' }));
            setLabCurrentPage(1);
          }}
          className={`transition-all cursor-pointer ${verificationFilter === 'all' ? 'ring-2 ring-blue-500/20' : ''}`}
        />

        <KpiCard
          title="Pending Verification"
          value={verificationStats.pending}
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          subtitle="Awaiting admin verification review"
          onClick={() => {
            const next = verificationFilter === 'PENDING' ? 'all' : 'PENDING';
            setVerificationFilter(next);
            setPendingLabFilters(prev => ({ ...prev, verificationStatus: next === 'PENDING' ? 'PENDING' : 'ALL' }));
            setActiveLabFilters(prev => ({ ...prev, verificationStatus: next === 'PENDING' ? 'PENDING' : 'ALL' }));
            setLabCurrentPage(1);
          }}
          className={`transition-all cursor-pointer ${verificationFilter === 'PENDING' ? 'ring-2 ring-amber-500 shadow-md' : ''}`}
        />

        <KpiCard
          title="Approved Laboratories"
          value={verificationStats.approved}
          icon={ShieldCheck}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          subtitle="Verified and active diagnostic partners"
          onClick={() => {
            const next = verificationFilter === 'APPROVED' ? 'all' : 'APPROVED';
            setVerificationFilter(next);
            setPendingLabFilters(prev => ({ ...prev, verificationStatus: next === 'APPROVED' ? 'APPROVED' : 'ALL' }));
            setActiveLabFilters(prev => ({ ...prev, verificationStatus: next === 'APPROVED' ? 'APPROVED' : 'ALL' }));
            setLabCurrentPage(1);
          }}
          className={`transition-all cursor-pointer ${verificationFilter === 'APPROVED' ? 'ring-2 ring-emerald-500 shadow-md' : ''}`}
        />
      </div>

      {/* Active Verification Filter Notification */}
      {verificationFilter !== 'all' && (
        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <span className="font-semibold text-slate-700">Active Verification Filter:</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-slate-800 font-medium border border-slate-200 shadow-xs">
            Status: {verificationFilter === 'APPROVED' ? 'Approved Laboratories' : 'Pending Verification'}
            <button 
              onClick={() => {
                setVerificationFilter('all');
                setPendingLabFilters(prev => ({ ...prev, verificationStatus: 'ALL' }));
                setActiveLabFilters(prev => ({ ...prev, verificationStatus: 'ALL' }));
                setLabCurrentPage(1);
              }} 
              className="hover:text-red-600 ml-0.5 text-slate-400 cursor-pointer"
              title="Remove filter"
            >
              <X size={12} />
            </button>
          </span>
          <button 
            onClick={() => {
              setVerificationFilter('all');
              setPendingLabFilters(prev => ({ ...prev, verificationStatus: 'ALL' }));
              setActiveLabFilters(prev => ({ ...prev, verificationStatus: 'ALL' }));
              setLabCurrentPage(1);
            }} 
            className="text-blue-600 hover:underline font-medium text-xs ml-auto cursor-pointer"
          >
            Clear verification filter
          </button>
        </div>
      )}

      {/* =========================================================================
          SECTION: LABORATORY DIRECTORY (HOSPITAL / STANDALONE)
      ========================================================================= */}
      <section className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Laboratory Directory</h2>
            <p className="text-xs text-slate-500">
              Manage hospital-based and standalone laboratory facilities registered on MediQuee.
            </p>
          </div>
        </div>

        {/* Directory Tabs */}
        <div className="flex bg-white rounded-xl shadow-xs border border-slate-200 p-1 gap-1">
          <button
            onClick={() => handleTabChange('HOSPITAL_BASED')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${activeTab === 'HOSPITAL_BASED' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Hospital Labs
          </button>
          <button
            onClick={() => handleTabChange('STANDALONE')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${activeTab === 'STANDALONE' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Standalone Labs
          </button>
        </div>

        {/* Filter Panel for Labs */}
        <div className="relative">
          {showLabFilters && (
            <div ref={labFilterRef} className="absolute right-0 top-0 mt-1 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-4 animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-sm text-slate-900">Lab Directory Filters</h3>
                {hasActiveLabFilters && (
                  <button onClick={clearLabFilters} className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer">
                    Clear all
                  </button>
                )}
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Place / City</label>
                  <select 
                    value={pendingLabFilters.place}
                    onChange={(e) => setPendingLabFilters({ ...pendingLabFilters, place: e.target.value })}
                    className="w-full border-slate-200 rounded-lg shadow-xs text-xs focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="ALL">All Places</option>
                    <option value="Tirupati">Tirupati</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="adoni">Adoni</option>
                  </select>
                </div>
                
                {activeTab === 'HOSPITAL_BASED' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Associated Hospital</label>
                    <select 
                      value={pendingLabFilters.hospitalId}
                      onChange={(e) => setPendingLabFilters({ ...pendingLabFilters, hospitalId: e.target.value })}
                      className="w-full border-slate-200 rounded-lg shadow-xs text-xs focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="ALL">All Hospitals</option>
                      {hospitals.map(h => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Verification Status</label>
                  <select 
                    value={pendingLabFilters.verificationStatus}
                    onChange={(e) => setPendingLabFilters({ ...pendingLabFilters, verificationStatus: e.target.value })}
                    className="w-full border-slate-200 rounded-lg shadow-xs text-xs focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="ALL">All Verification Statuses</option>
                    <option value="APPROVED">Approved</option>
                    <option value="PENDING">Pending</option>
                  </select>
                </div>

                <button 
                  onClick={applyLabFilters}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}

          <DataTable
            columns={labColumns}
            data={labTableData}
            keyExtractor={(item: any) => item.rawId || item.id}
            onRowClick={(o: any) => navigate(`/admin/labs/${o.id}`)}
            searchPlaceholder={activeTab === 'HOSPITAL_BASED' ? 'Search Hospital Labs...' : 'Search Standalone Labs...'}
            onSearch={handleLabSearch}
            onFilterClick={() => setShowLabFilters(!showLabFilters)}
          />
        </div>

        {/* Directory Pagination */}
        {!loadingLabs && !labsError && labTableData.length > 0 && (
          <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-xs border border-slate-200 text-xs">
            <p className="text-slate-600">
              Showing {((labCurrentPage - 1) * labLimit) + 1}–{Math.min(labCurrentPage * labLimit, ((labCurrentPage - 1) * labLimit) + labTableData.length)} of {(labTotalPages * labLimit) - (labLimit - labTableData.length)} laboratories
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLabCurrentPage(p => Math.max(1, p - 1))}
                disabled={labCurrentPage === 1}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 text-slate-600 font-medium cursor-pointer"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 font-bold rounded-lg">
                {labCurrentPage}
              </span>
              <button
                onClick={() => setLabCurrentPage(p => Math.min(labTotalPages, p + 1))}
                disabled={labCurrentPage === labTotalPages}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 text-slate-600 font-medium cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Labs;
