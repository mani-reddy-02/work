import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Filter, Building2, FlaskConical, Clock, CheckCircle2, 
  XCircle, FileText, Upload, RefreshCw, Calendar, ChevronLeft, ChevronRight,
  Eye, FileCheck, X, AlertCircle, Home, MapPin, UserCheck
} from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { labService, LabOrderAnalytics } from '../services/labService';
import LabOrderDetailsModal from '../components/labs/LabOrderDetailsModal';

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

  const [showLabFilters, setShowLabFilters] = useState(false);
  const [activeLabFilters, setActiveLabFilters] = useState({ place: 'ALL', hospitalId: 'ALL' });
  const [pendingLabFilters, setPendingLabFilters] = useState({ place: 'ALL', hospitalId: 'ALL' });
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

        if (allResult.success) setTotalLabs(allResult.pagination?.total || 0);
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
        ...(activeTab === 'HOSPITAL_BASED' && activeLabFilters.hospitalId !== 'ALL' && { hospitalId: activeLabFilters.hospitalId })
      });

      const response = await fetch(`${API_URL}/laboratories?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();
      if (result.success) {
        setLabs(result.data || []);
        setLabTotalPages(result.pagination?.totalPages || 1);
      } else {
        setLabsError(result.message || 'Failed to fetch labs');
      }
    } catch (err) {
      setLabsError('An error occurred while fetching labs');
    } finally {
      setLoadingLabs(false);
    }
  }, [labCurrentPage, labSearchTerm, activeLabFilters, activeTab, token]);

  useEffect(() => {
    fetchLabs();
  }, [fetchLabs]);

  const handleLabSearch = (term: string) => {
    setLabSearchTerm(term);
    setLabCurrentPage(1);
  };

  const applyLabFilters = () => {
    setActiveLabFilters(pendingLabFilters);
    setLabCurrentPage(1);
    setShowLabFilters(false);
  };

  const clearLabFilters = () => {
    setPendingLabFilters({ place: 'ALL', hospitalId: 'ALL' });
    setActiveLabFilters({ place: 'ALL', hospitalId: 'ALL' });
    setLabCurrentPage(1);
    setShowLabFilters(false);
  };

  const handleTabChange = (tab: 'HOSPITAL_BASED' | 'STANDALONE') => {
    setActiveTab(tab);
    setLabSearchTerm('');
    setPendingLabFilters({ place: 'ALL', hospitalId: 'ALL' });
    setActiveLabFilters({ place: 'ALL', hospitalId: 'ALL' });
    setLabCurrentPage(1);
  };

  const hasActiveLabFilters = activeLabFilters.place !== 'ALL' || (activeTab === 'HOSPITAL_BASED' && activeLabFilters.hospitalId !== 'ALL');

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
    type: l.businessType === 'LABORATORY' ? 'STANDALONE' : 'HOSPITAL_BASED',
    hospitalName: l.businessType !== 'LABORATORY' ? l.name : null,
    location: l.city ? `${l.addressLine1 ? l.addressLine1 + ', ' : ''}${l.city}` : (l.addressLine1 || 'N/A'),
    status: 'Active'
  }));

  // =========================================================================
  // 2. LAB ORDERS OVERVIEW & ANALYTICS STATE (SEPARATED BY COLLECTION METHOD)
  // =========================================================================
  const [activeOrderTab, setActiveOrderTab] = useState<'WALK_IN' | 'HOME_COLLECTION'>('WALK_IN');
  const [orderAnalytics, setOrderAnalytics] = useState<LabOrderAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Lab Orders Table State
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [ordersSearch, setOrdersSearch] = useState('');
  const [debouncedOrdersSearch, setDebouncedOrdersSearch] = useState('');
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);
  const [ordersTotalCount, setOrdersTotalCount] = useState(0);
  const ordersLimit = 20;

  // Filters for Lab Orders
  const [showOrderFilters, setShowOrderFilters] = useState(false);
  const orderFilterRef = useRef<HTMLDivElement>(null);
  const [orderFilters, setOrderFilters] = useState({
    hospitalId: 'ALL',
    date: ''
  });
  const [pendingOrderFilters, setPendingOrderFilters] = useState({
    hospitalId: 'ALL',
    date: ''
  });

  // Selected Order for Details Modal
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedOrdersSearch(ordersSearch);
      setOrdersPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [ordersSearch]);

  // Click outside order filter dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (orderFilterRef.current && !orderFilterRef.current.contains(event.target as Node)) {
        setShowOrderFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Live Analytics Counts from Backend filtered by active collection method
  const fetchOrderAnalytics = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingAnalytics(true);
      const res = await labService.getLabOrdersAnalytics(token, {
        hospitalId: orderFilters.hospitalId !== 'ALL' ? orderFilters.hospitalId : undefined,
        bookingType: activeOrderTab,
        date: orderFilters.date || undefined,
        search: debouncedOrdersSearch || undefined
      });

      if (res.success && res.data) {
        setOrderAnalytics(res.data);
      }
    } catch (e) {
      console.error('Failed to load lab orders analytics:', e);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [token, activeOrderTab, orderFilters, debouncedOrdersSearch]);

  // Fetch Lab Orders Table Data from Backend filtered by active collection method
  const fetchOrders = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingOrders(true);
      setOrdersError(null);

      const res = await labService.getLabBookings(token, {
        page: ordersPage,
        limit: ordersLimit,
        search: debouncedOrdersSearch || undefined,
        status: selectedStatusFilter !== 'ALL' ? selectedStatusFilter : undefined,
        bookingType: activeOrderTab,
        hospitalId: orderFilters.hospitalId !== 'ALL' ? orderFilters.hospitalId : undefined,
        date: orderFilters.date || undefined
      });

      if (res.success && Array.isArray(res.data)) {
        setOrders(res.data);
        if (res.pagination) {
          setOrdersTotalPages(res.pagination.totalPages || 1);
          setOrdersTotalCount(res.pagination.total || 0);
        }
      } else {
        setOrdersError(res.message || 'Failed to fetch lab orders');
      }
    } catch (e: any) {
      setOrdersError(e.message || 'An error occurred while fetching orders');
    } finally {
      setLoadingOrders(false);
    }
  }, [token, activeOrderTab, ordersPage, debouncedOrdersSearch, selectedStatusFilter, orderFilters]);

  // Refresh both analytics and orders
  useEffect(() => {
    fetchOrderAnalytics();
  }, [fetchOrderAnalytics]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Tab switch handler between Lab Visit & Home Sample Collection
  const handleOrderTabChange = (newTab: 'WALK_IN' | 'HOME_COLLECTION') => {
    if (activeOrderTab === newTab) return;
    setActiveOrderTab(newTab);
    setSelectedStatusFilter('ALL');
    setOrdersPage(1);
    setOrdersSearch('');
    setOrderFilters({ hospitalId: 'ALL', date: '' });
    setPendingOrderFilters({ hospitalId: 'ALL', date: '' });
  };

  // Status Tile Click Handler
  const handleTileClick = (statusKey: string) => {
    if (selectedStatusFilter === statusKey) {
      // Toggle off / reset
      setSelectedStatusFilter('ALL');
    } else {
      setSelectedStatusFilter(statusKey);
    }
    setOrdersPage(1);
  };

  const resetAllOrderFilters = () => {
    setSelectedStatusFilter('ALL');
    setOrdersSearch('');
    setOrderFilters({ hospitalId: 'ALL', date: '' });
    setPendingOrderFilters({ hospitalId: 'ALL', date: '' });
    setOrdersPage(1);
  };

  const applyOrderFilters = () => {
    setOrderFilters(pendingOrderFilters);
    setOrdersPage(1);
    setShowOrderFilters(false);
  };

  const clearOrderFiltersOnly = () => {
    setPendingOrderFilters({ hospitalId: 'ALL', date: '' });
    setOrderFilters({ hospitalId: 'ALL', date: '' });
    setOrdersPage(1);
    setShowOrderFilters(false);
  };

  const hasActiveOrderFilters = orderFilters.hospitalId !== 'ALL' || !!orderFilters.date || selectedStatusFilter !== 'ALL' || !!ordersSearch;

  // Open modal for details
  const handleViewOrder = (order: any) => {
    setSelectedOrderId(order.rawId || order.id);
    setIsDetailsModalOpen(true);
  };

  // Called when an order is updated or report uploaded in modal
  const handleOrderUpdated = () => {
    fetchOrders();
    fetchOrderAnalytics();
  };

  // Analytics Tile Configuration - Tailored for Lab Visit vs Home Sample Collection
  const analyticsTiles = activeOrderTab === 'WALK_IN' 
    ? [
        {
          id: 'TOTAL',
          key: 'ALL',
          title: 'Total Lab Visit Orders',
          count: orderAnalytics?.totalOrders ?? null,
          description: 'All walk-in test orders',
          icon: FileText,
          colorClasses: 'text-slate-800 bg-slate-100',
          activeRing: 'ring-2 ring-slate-800 bg-slate-50/90 shadow-md'
        },
        {
          id: 'PENDING',
          key: 'REQUESTED',
          title: 'Pending',
          count: orderAnalytics?.pending ?? null,
          description: 'Awaiting confirmation',
          icon: Clock,
          colorClasses: 'text-amber-700 bg-amber-100',
          activeRing: 'ring-2 ring-amber-600 bg-amber-50/90 shadow-md'
        },
        {
          id: 'SCHEDULED',
          key: 'ASSIGNED',
          title: 'Confirmed / Scheduled',
          count: orderAnalytics?.sampleCollection ?? null,
          description: 'Visit scheduled',
          icon: Calendar,
          colorClasses: 'text-indigo-700 bg-indigo-100',
          activeRing: 'ring-2 ring-indigo-600 bg-indigo-50/90 shadow-md'
        },
        {
          id: 'COLLECTED',
          key: 'SAMPLE_COLLECTED',
          title: 'Sample Collected',
          count: orderAnalytics?.sampleCollected ?? null,
          description: 'Patient visited & collected',
          icon: FlaskConical,
          colorClasses: 'text-blue-700 bg-blue-100',
          activeRing: 'ring-2 ring-blue-600 bg-blue-50/90 shadow-md'
        },
        {
          id: 'PROCESSING',
          key: 'IN_LAB_PROCESSING',
          title: 'Lab Processing',
          count: orderAnalytics?.labProcessing ?? null,
          description: 'Undergoing analysis',
          icon: RefreshCw,
          colorClasses: 'text-purple-700 bg-purple-100',
          activeRing: 'ring-2 ring-purple-600 bg-purple-50/90 shadow-md'
        },
        {
          id: 'REPORT_PENDING',
          key: 'REPORT_UPLOAD_PENDING',
          title: 'Report Upload Pending',
          count: orderAnalytics?.reportUploadPending ?? null,
          description: 'Awaiting result upload',
          icon: Upload,
          colorClasses: 'text-cyan-700 bg-cyan-100',
          activeRing: 'ring-2 ring-cyan-600 bg-cyan-50/90 shadow-md'
        },
        {
          id: 'COMPLETED',
          key: 'REPORT_READY',
          title: 'Completed',
          count: orderAnalytics?.completed ?? null,
          description: 'Report uploaded & issued',
          icon: CheckCircle2,
          colorClasses: 'text-emerald-700 bg-emerald-100',
          activeRing: 'ring-2 ring-emerald-600 bg-emerald-50/90 shadow-md'
        },
        {
          id: 'CANCELLED',
          key: 'CANCELLED',
          title: 'Cancelled',
          count: orderAnalytics?.cancelled ?? null,
          description: 'Terminated orders',
          icon: XCircle,
          colorClasses: 'text-rose-700 bg-rose-100',
          activeRing: 'ring-2 ring-rose-600 bg-rose-50/90 shadow-md'
        }
      ]
    : [
        {
          id: 'TOTAL',
          key: 'ALL',
          title: 'Total Home Collection',
          count: orderAnalytics?.totalOrders ?? null,
          description: 'All doorstep test orders',
          icon: FileText,
          colorClasses: 'text-slate-800 bg-slate-100',
          activeRing: 'ring-2 ring-slate-800 bg-slate-50/90 shadow-md'
        },
        {
          id: 'PENDING',
          key: 'REQUESTED',
          title: 'Pending',
          count: orderAnalytics?.pending ?? null,
          description: 'Awaiting dispatch',
          icon: Clock,
          colorClasses: 'text-amber-700 bg-amber-100',
          activeRing: 'ring-2 ring-amber-600 bg-amber-50/90 shadow-md'
        },
        {
          id: 'SCHEDULED',
          key: 'ASSIGNED',
          title: 'Collection Scheduled',
          count: orderAnalytics?.sampleCollection ?? null,
          description: 'Collector assigned',
          icon: Calendar,
          colorClasses: 'text-indigo-700 bg-indigo-100',
          activeRing: 'ring-2 ring-indigo-600 bg-indigo-50/90 shadow-md'
        },
        {
          id: 'COLLECTED',
          key: 'SAMPLE_COLLECTED',
          title: 'Sample Collected',
          count: orderAnalytics?.sampleCollected ?? null,
          description: 'Collected at home',
          icon: FlaskConical,
          colorClasses: 'text-blue-700 bg-blue-100',
          activeRing: 'ring-2 ring-blue-600 bg-blue-50/90 shadow-md'
        },
        {
          id: 'PROCESSING',
          key: 'IN_LAB_PROCESSING',
          title: 'Lab Processing',
          count: orderAnalytics?.labProcessing ?? null,
          description: 'Sample in lab analysis',
          icon: RefreshCw,
          colorClasses: 'text-purple-700 bg-purple-100',
          activeRing: 'ring-2 ring-purple-600 bg-purple-50/90 shadow-md'
        },
        {
          id: 'REPORT_PENDING',
          key: 'REPORT_UPLOAD_PENDING',
          title: 'Report Upload Pending',
          count: orderAnalytics?.reportUploadPending ?? null,
          description: 'Awaiting report document',
          icon: Upload,
          colorClasses: 'text-cyan-700 bg-cyan-100',
          activeRing: 'ring-2 ring-cyan-600 bg-cyan-50/90 shadow-md'
        },
        {
          id: 'COMPLETED',
          key: 'REPORT_READY',
          title: 'Completed',
          count: orderAnalytics?.completed ?? null,
          description: 'Report uploaded & issued',
          icon: CheckCircle2,
          colorClasses: 'text-emerald-700 bg-emerald-100',
          activeRing: 'ring-2 ring-emerald-600 bg-emerald-50/90 shadow-md'
        },
        {
          id: 'CANCELLED',
          key: 'CANCELLED',
          title: 'Cancelled',
          count: orderAnalytics?.cancelled ?? null,
          description: 'Terminated orders',
          icon: XCircle,
          colorClasses: 'text-rose-700 bg-rose-100',
          activeRing: 'ring-2 ring-rose-600 bg-rose-50/90 shadow-md'
        }
      ];

  return (
    <div className="space-y-8 pb-12">
      {/* =========================================================================
          PAGE HEADER
      ========================================================================= */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Labs & Order Operations</h1>
          <p className="text-slate-500 text-sm">
            Manage laboratory facilities and track diagnostic test orders through their complete lifecycle.
          </p>
        </div>
      </div>

      {/* =========================================================================
          SECTION: LABORATORY SUMMARY TILES (PRESERVED)
      ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
              <FlaskConical size={20} />
            </div>
            <h2 className="text-slate-600 font-semibold text-sm">Total No. of Labs</h2>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {totalLabs === null ? '—' : totalLabs}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">All registered laboratories</p>
        </div>

        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs">
              <Building2 size={20} />
            </div>
            <h2 className="text-slate-600 font-semibold text-sm">Hospital Labs</h2>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {totalHospitalLabs === null ? '—' : totalHospitalLabs}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">Hospital-based diagnostic departments</p>
        </div>

        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs">
              <FlaskConical size={20} />
            </div>
            <h2 className="text-slate-600 font-semibold text-sm">Standalone Labs</h2>
          </div>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {totalStandaloneLabs === null ? '—' : totalStandaloneLabs}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">Independent diagnostic centers</p>
        </div>
      </div>

      {/* =========================================================================
          SECTION: LAB ORDERS OVERVIEW & RESPONSIVE ANALYTICS TILES (SEPARATED)
      ========================================================================= */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        {/* Section Header with Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Lab Orders Overview
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real database order analytics. Separate orders by sample collection method.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Primary Order Tabs: Lab Visit vs Home Sample Collection */}
            <div className="flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/80">
              <button
                onClick={() => handleOrderTabChange('WALK_IN')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeOrderTab === 'WALK_IN'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FlaskConical size={14} />
                <span>Lab Visit</span>
              </button>
              <button
                onClick={() => handleOrderTabChange('HOME_COLLECTION')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeOrderTab === 'HOME_COLLECTION'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Home size={14} />
                <span>Home Sample Collection</span>
              </button>
            </div>

            {selectedStatusFilter !== 'ALL' && (
              <button
                onClick={() => handleTileClick('ALL')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <X size={13} />
                Clear Filter
              </button>
            )}
            <button
              onClick={() => { fetchOrderAnalytics(); fetchOrders(); }}
              disabled={loadingAnalytics}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title="Refresh Analytics"
            >
              <RefreshCw size={16} className={loadingAnalytics ? 'animate-spin text-blue-600' : ''} />
            </button>
          </div>
        </div>

        {/* 8 Responsive Analytics Tiles tailored to active collection method */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {analyticsTiles.map((tile) => {
            const Icon = tile.icon;
            const isSelected = selectedStatusFilter === tile.key || (tile.key === 'REPORT_READY' && selectedStatusFilter === 'COMPLETED');
            
            return (
              <div
                key={tile.id}
                onClick={() => handleTileClick(tile.key)}
                className={`group relative rounded-xl border p-3.5 flex flex-col justify-between transition-all duration-150 cursor-pointer select-none hover:-translate-y-0.5 ${
                  isSelected 
                    ? tile.activeRing 
                    : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-600 truncate pr-1" title={tile.title}>
                      {tile.title}
                    </span>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${tile.colorClasses}`}>
                      <Icon size={14} />
                    </div>
                  </div>
                  <div className="mt-1">
                    <span className="text-2xl font-black tracking-tight text-slate-900 block">
                      {tile.count === null ? (
                        <span className="text-slate-300 text-lg font-normal animate-pulse">...</span>
                      ) : (
                        tile.count
                      )}
                    </span>
                  </div>
                </div>
                
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="truncate">{tile.description}</span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* =========================================================================
            SECTION: DEDICATED LAB ORDERS TABLE (TAILORED COLUMNS)
        ========================================================================= */}
        <div className="space-y-4 pt-2">
          {/* Table Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <span>{activeOrderTab === 'WALK_IN' ? 'Lab Visit Orders' : 'Home Sample Collection Orders'}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                  {ordersTotalCount}
                </span>
              </h3>
              {selectedStatusFilter !== 'ALL' && (
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium border border-blue-200">
                  Status: {selectedStatusFilter.replace('_', ' ')}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={ordersSearch}
                  onChange={(e) => setOrdersSearch(e.target.value)}
                  placeholder="Search Order ID, patient, lab..."
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                {ordersSearch && (
                  <button 
                    onClick={() => setOrdersSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Filters Dropdown */}
              <div className="relative" ref={orderFilterRef}>
                <button
                  onClick={() => setShowOrderFilters(!showOrderFilters)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    hasActiveOrderFilters 
                      ? 'bg-blue-50 text-blue-700 border-blue-300' 
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Filter size={14} />
                  <span>Filters</span>
                  {hasActiveOrderFilters && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  )}
                </button>

                {showOrderFilters && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-4 space-y-3.5 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <h4 className="font-bold text-xs text-slate-900">Filter Lab Orders</h4>
                      {hasActiveOrderFilters && (
                        <button
                          onClick={clearOrderFiltersOnly}
                          className="text-[11px] font-semibold text-rose-600 hover:text-rose-700"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Laboratory / Hospital</label>
                      <select
                        value={pendingOrderFilters.hospitalId}
                        onChange={(e) => setPendingOrderFilters({ ...pendingOrderFilters, hospitalId: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="ALL">All Facilities</option>
                        {hospitals.map(h => (
                          <option key={h.id} value={h.id}>{h.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Date</label>
                      <input
                        type="date"
                        value={pendingOrderFilters.date}
                        onChange={(e) => setPendingOrderFilters({ ...pendingOrderFilters, date: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <button
                      onClick={applyOrderFilters}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Apply Filters
                    </button>
                  </div>
                )}
              </div>

              {hasActiveOrderFilters && (
                <button
                  onClick={resetAllOrderFilters}
                  className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                >
                  Reset All
                </button>
              )}
            </div>
          </div>

          {/* Orders Table Content */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[11px]">
                    <th className="px-4 py-3 w-14">S.No</th>
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">{activeOrderTab === 'WALK_IN' ? 'Laboratory' : 'Assigned Lab'}</th>
                    <th className="px-4 py-3">Test(s)</th>
                    {activeOrderTab === 'WALK_IN' ? (
                      <th className="px-4 py-3">Visit Date</th>
                    ) : (
                      <>
                        <th className="px-4 py-3">Home Address</th>
                        <th className="px-4 py-3">Collection Date</th>
                        <th className="px-4 py-3">Collector</th>
                      </>
                    )}
                    <th className="px-4 py-3">Status</th>
                    {activeOrderTab === 'WALK_IN' && (
                      <th className="px-4 py-3">Report</th>
                    )}
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingOrders ? (
                    <tr>
                      <td colSpan={activeOrderTab === 'WALK_IN' ? 9 : 10} className="px-6 py-16 text-center text-slate-400">
                        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="font-medium text-xs">Loading {activeOrderTab === 'WALK_IN' ? 'lab visit' : 'home collection'} orders...</p>
                      </td>
                    </tr>
                  ) : ordersError ? (
                    <tr>
                      <td colSpan={activeOrderTab === 'WALK_IN' ? 9 : 10} className="px-6 py-12 text-center text-rose-600">
                        <AlertCircle size={24} className="mx-auto mb-2 text-rose-500" />
                        <p className="font-semibold">{ordersError}</p>
                        <button 
                          onClick={fetchOrders}
                          className="mt-3 px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Retry
                        </button>
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={activeOrderTab === 'WALK_IN' ? 9 : 10} className="px-6 py-16 text-center text-slate-400">
                        <FlaskConical size={32} className="mx-auto mb-2 text-slate-300" />
                        <p className="font-bold text-slate-700 text-sm">
                          No {activeOrderTab === 'WALK_IN' ? 'lab visit' : 'home sample collection'} orders found
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {hasActiveOrderFilters ? 'Try adjusting your filters or search criteria.' : 'There are no test bookings recorded for this method yet.'}
                        </p>
                        {hasActiveOrderFilters && (
                          <button
                            onClick={resetAllOrderFilters}
                            className="mt-3 px-3 py-1.5 bg-blue-50 text-blue-700 font-semibold rounded-lg text-xs hover:bg-blue-100 transition-colors cursor-pointer"
                          >
                            Clear all filters
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr 
                        key={o.rawId || o.id}
                        onClick={() => handleViewOrder(o)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="px-4 py-3 font-medium text-slate-500">{o.sno}</td>
                        <td className="px-4 py-3 font-mono font-bold text-blue-700">
                          #{o.id}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{o.patientName}</p>
                          <p className="text-[11px] text-slate-400">{o.patientPhone || 'No Phone'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800">{o.labName}</p>
                          {o.labCity && <p className="text-[11px] text-slate-400">{o.labCity}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="max-w-[180px]">
                            <p className="font-medium text-slate-800 truncate" title={o.testNames}>
                              {o.testNames || 'Diagnostic Test'}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {o.testCount} {o.testCount === 1 ? 'test' : 'tests'} • ₹{o.totalAmount}
                            </p>
                          </div>
                        </td>

                        {/* Lab Visit Columns vs Home Collection Columns */}
                        {activeOrderTab === 'WALK_IN' ? (
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                            <p className="font-medium text-slate-800">{o.collectionDate ? new Date(o.collectionDate).toLocaleDateString() : o.date}</p>
                            <p className="text-[11px] text-slate-400">{o.collectionTimeSlot || o.time}</p>
                          </td>
                        ) : (
                          <>
                            <td className="px-4 py-3 max-w-[200px]">
                              <p className="text-slate-800 truncate" title={o.collectionAddress || 'Not provided'}>
                                {o.collectionAddress || '—'}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                              <p className="font-medium text-slate-800">{o.collectionDate ? new Date(o.collectionDate).toLocaleDateString() : o.date}</p>
                              <p className="text-[11px] text-slate-400">{o.collectionTimeSlot || o.time}</p>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <p className="font-medium text-slate-800">{o.phlebotomistName || 'Unassigned'}</p>
                              {o.phlebotomistPhone && (
                                <p className="text-[11px] text-slate-400">{o.phlebotomistPhone}</p>
                              )}
                            </td>
                          </>
                        )}

                        <td className="px-4 py-3">
                          <StatusBadge status={o.status} />
                        </td>

                        {activeOrderTab === 'WALK_IN' && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            {o.hasReport ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <FileCheck size={12} />
                                Uploaded
                              </span>
                            ) : o.status === 'CANCELLED' ? (
                              <span className="text-[11px] text-slate-400">N/A</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                Pending
                              </span>
                            )}
                          </td>
                        )}

                        <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleViewOrder(o)}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye size={13} />
                            Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {!loadingOrders && orders.length > 0 && (
              <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <p className="text-slate-600">
                  Showing <strong>{((ordersPage - 1) * ordersLimit) + 1}</strong>–<strong>{Math.min(ordersPage * ordersLimit, ordersTotalCount)}</strong> of <strong>{ordersTotalCount}</strong> orders
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setOrdersPage(p => Math.max(1, p - 1))}
                    disabled={ordersPage === 1}
                    className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-600 font-medium flex items-center gap-1 px-2.5 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={14} />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: ordersTotalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === ordersTotalPages || Math.abs(p - ordersPage) <= 1)
                      .map((p, idx, arr) => (
                        <React.Fragment key={p}>
                          {idx > 0 && arr[idx - 1] !== p - 1 && (
                            <span className="text-slate-400 px-1">...</span>
                          )}
                          <button
                            onClick={() => setOrdersPage(p)}
                            className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              ordersPage === p
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      ))}
                  </div>

                  <button
                    onClick={() => setOrdersPage(p => Math.min(ordersTotalPages, p + 1))}
                    disabled={ordersPage === ordersTotalPages}
                    className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-600 font-medium flex items-center gap-1 px-2.5 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION: LABORATORY DIRECTORY (HOSPITAL / STANDALONE) (PRESERVED)
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

      {/* =========================================================================
          ORDER DETAILS & WORKFLOW MODAL
      ========================================================================= */}
      <LabOrderDetailsModal
        orderId={selectedOrderId}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onOrderUpdated={handleOrderUpdated}
        token={token}
      />
    </div>
  );
};

export default Labs;
