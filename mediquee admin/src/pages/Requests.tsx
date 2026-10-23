import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  HeartPulse, 
  Megaphone, 
  MessageSquare, 
  Clock, 
  MapPin, 
  Building2, 
  RefreshCw, 
  CheckCircle2, 
  X,
  Users,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  Filter,
  ArrowRight,
  Search,
  LayoutGrid,
  List,
  Sparkles,
  Send,
  Check,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';
import DateRangeFilter, { DatePreset, DateFilterValue } from '../components/ui/DateRangeFilter';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

interface CampRequest {
  id: string;
  hospitalId: string;
  hospital?: { name: string; contactPhone?: string; contactEmail?: string; city?: string; state?: string };
  campTitle: string;
  location: string;
  expectedDate: string;
  specialties: string[];
  expectedPatients?: number | null;
  notes?: string | null;
  status: 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  createdAt: string;
}

interface MarketingRequest {
  id: string;
  hospitalId: string;
  hospital?: { name: string; contactPhone?: string; contactEmail?: string; city?: string; state?: string };
  doctorId?: string | null;
  doctorName?: string | null;
  campaignType: string;
  budget?: number | null;
  targetAudience?: string | null;
  notes?: string | null;
  status: 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  createdAt: string;
}

type CategoryTab = 'ALL' | 'CAMPS' | 'MARKETING' | 'INQUIRIES';
type StatusFilter = 'ALL' | 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

const QUICK_REJECT_PRESETS = [
  'Schedule Conflict / Date Unavailable',
  'Specialty Doctors Unavailable',
  'Budget Insufficient for Campaign Scope',
  'Hospital Unreachable / Incomplete Details',
  'Duplicate or Outdated Request'
];

const Requests: React.FC = () => {
  const { token } = useAdminAuth();
  const [camps, setCamps] = useState<CampRequest[]>([]);
  const [marketing, setMarketing] = useState<MarketingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // View & Filter States
  const [activeCategory, setActiveCategory] = useState<CategoryTab>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Date Filter State
  const [dateRange, setDateRange] = useState<DateFilterValue>({
    preset: 'all',
    startDate: '',
    endDate: ''
  });

  // Modal / Drawer State
  const [selectedRequest, setSelectedRequest] = useState<{ type: 'camp' | 'marketing'; data: any } | null>(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/hospital-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setCamps(json.data?.camps || []);
        setMarketing(json.data?.marketing || []);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotificationMsg({ type, text });
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const handleUpdateStatus = async (type: 'camp' | 'marketing', id: string, newStatus: string, notes?: string) => {
    if (!token) return;
    setActionLoading(id);
    try {
      const payload: any = { status: newStatus };
      if (notes) payload.notes = notes;

      const res = await fetch(`${API_BASE_URL}/admin/hospital-requests/${type}/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const statusLabel = newStatus.charAt(0) + newStatus.slice(1).toLowerCase();
        showNotification(`Request successfully marked as ${statusLabel}`);

        if (type === 'camp') {
          setCamps(prev => prev.map(c => c.id === id ? { ...c, status: newStatus as any, ...(notes ? { notes } : {}) } : c));
          if (selectedRequest?.data.id === id) {
            setSelectedRequest(prev => prev ? { ...prev, data: { ...prev.data, status: newStatus, ...(notes ? { notes } : {}) } } : null);
          }
        } else {
          setMarketing(prev => prev.map(m => m.id === id ? { ...m, status: newStatus as any, ...(notes ? { notes } : {}) } : m));
          if (selectedRequest?.data.id === id) {
            setSelectedRequest(prev => prev ? { ...prev, data: { ...prev.data, status: newStatus, ...(notes ? { notes } : {}) } } : null);
          }
        }
        setRejectMode(false);
        setRejectReason('');
      } else {
        showNotification('Failed to update request status', 'error');
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      showNotification('An error occurred while updating status', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Helper date checker
  const matchesDateRange = (dateStr: string) => {
    if (!dateRange.startDate && !dateRange.endDate) return true;
    try {
      const itemDate = new Date(dateStr).getTime();
      if (dateRange.startDate) {
        const start = new Date(dateRange.startDate).setHours(0, 0, 0, 0);
        if (itemDate < start) return false;
      }
      if (dateRange.endDate) {
        const end = new Date(dateRange.endDate).setHours(23, 59, 59, 999);
        if (itemDate > end) return false;
      }
      return true;
    } catch {
      return true;
    }
  };

  // Transform Marketing into Campaigns vs Inquiries
  const marketingCampaigns = useMemo(() => {
    return marketing.filter(m => !m.campaignType.startsWith('PLATFORM_INQUIRY:'));
  }, [marketing]);

  const platformInquiries = useMemo(() => {
    return marketing.filter(m => m.campaignType.startsWith('PLATFORM_INQUIRY:'));
  }, [marketing]);

  // Unified items list for 'ALL' tab or filtered categories
  const unifiedItems = useMemo(() => {
    const list: Array<{ type: 'camp' | 'marketing'; subType: 'camp' | 'marketing' | 'inquiry'; data: any }> = [];

    camps.forEach(c => list.push({ type: 'camp', subType: 'camp', data: c }));
    marketingCampaigns.forEach(m => list.push({ type: 'marketing', subType: 'marketing', data: m }));
    platformInquiries.forEach(i => list.push({ type: 'marketing', subType: 'inquiry', data: i }));

    return list.sort((a, b) => new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime());
  }, [camps, marketingCampaigns, platformInquiries]);

  // Overall KPI metrics
  const totalCampsCount = camps.length;
  const totalMarketingCount = marketingCampaigns.length;
  const totalInquiriesCount = platformInquiries.length;
  const totalCount = unifiedItems.length;

  const totalPending = unifiedItems.filter(item => item.data.status === 'PENDING').length;
  const totalReviewing = unifiedItems.filter(item => item.data.status === 'REVIEWING').length;
  const totalApproved = unifiedItems.filter(item => item.data.status === 'APPROVED').length;
  const totalRejected = unifiedItems.filter(item => item.data.status === 'REJECTED').length;
  const totalCompleted = unifiedItems.filter(item => item.data.status === 'COMPLETED').length;

  // Filtered Items based on active Category, Status, Search, and Date
  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();

    return unifiedItems.filter(item => {
      // 1. Category Filter
      if (activeCategory === 'CAMPS' && item.subType !== 'camp') return false;
      if (activeCategory === 'MARKETING' && item.subType !== 'marketing') return false;
      if (activeCategory === 'INQUIRIES' && item.subType !== 'inquiry') return false;

      // 2. Status Filter
      if (statusFilter !== 'ALL' && item.data.status !== statusFilter) return false;

      // 3. Date Range Filter
      if (!matchesDateRange(item.data.createdAt)) return false;

      // 4. Search Filter
      if (!term) return true;

      const d = item.data;
      const hospName = d.hospital?.name || '';
      const hospCity = d.hospital?.city || '';
      const docName = d.doctorName || '';
      const id = d.id || '';

      if (item.subType === 'camp') {
        const title = d.campTitle || '';
        const loc = d.location || '';
        const specs = (d.specialties || []).join(' ');
        return (
          title.toLowerCase().includes(term) ||
          loc.toLowerCase().includes(term) ||
          specs.toLowerCase().includes(term) ||
          hospName.toLowerCase().includes(term) ||
          hospCity.toLowerCase().includes(term) ||
          id.toLowerCase().includes(term)
        );
      } else {
        const campType = d.campaignType || '';
        const notes = d.notes || '';
        return (
          campType.toLowerCase().includes(term) ||
          notes.toLowerCase().includes(term) ||
          hospName.toLowerCase().includes(term) ||
          hospCity.toLowerCase().includes(term) ||
          docName.toLowerCase().includes(term) ||
          id.toLowerCase().includes(term)
        );
      }
    });
  }, [unifiedItems, activeCategory, statusFilter, search, dateRange]);

  const hasActiveFilters = statusFilter !== 'ALL' || search.trim().length > 0 || dateRange.preset !== 'all' || activeCategory !== 'ALL';

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setActiveCategory('ALL');
    setDateRange({ preset: 'all', startDate: '', endDate: '' });
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return dateStr;
    }
  };

  const getRelativeTime = (dateStr: string) => {
    try {
      const now = new Date().getTime();
      const past = new Date(dateStr).getTime();
      const diffHrs = Math.floor((now - past) / (1000 * 60 * 60));
      if (diffHrs < 1) return 'Just now';
      if (diffHrs < 24) return `${diffHrs}h ago`;
      const diffDays = Math.floor(diffHrs / 24);
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays}d ago`;
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pending Action
          </span>
        );
      case 'REVIEWING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <Clock size={12} className="text-blue-600" />
            Under Review
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={12} className="text-emerald-600" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <X size={12} className="text-rose-600" />
            Rejected
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
            <Check size={12} className="text-slate-600" />
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-20 relative">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-sm font-medium border animate-slideUp transition-all ${
          notificationMsg.type === 'success' 
            ? 'bg-emerald-900 text-white border-emerald-700' 
            : 'bg-rose-900 text-white border-rose-700'
        }`}>
          {notificationMsg.type === 'success' ? <CheckCircle2 size={17} className="text-emerald-400" /> : <AlertCircle size={17} className="text-rose-400" />}
          <span>{notificationMsg.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Partner Requests & Communications</h2>
            {totalPending > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse">
                {totalPending} new
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Process incoming medical camp applications, marketing promotions, and partner queries from hospitals.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <DateRangeFilter
            value={dateRange}
            onChange={(newRange) => setDateRange(newRange)}
          />

          <button 
            onClick={fetchRequests}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs disabled:opacity-50"
            title={`Last refreshed at ${lastRefreshed.toLocaleTimeString()}`}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-blue-600' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Top Live KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pending / Action Required */}
        <div 
          onClick={() => { setStatusFilter('PENDING'); setActiveCategory('ALL'); }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden shadow-xs hover:shadow-md ${
            statusFilter === 'PENDING'
              ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-400'
              : 'bg-gradient-to-br from-amber-50 to-orange-50/60 border-amber-200 text-slate-900 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${statusFilter === 'PENDING' ? 'text-amber-100' : 'text-amber-800'}`}>
              Action Required
            </span>
            <div className={`p-2 rounded-xl ${statusFilter === 'PENDING' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-700'}`}>
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold mt-2 tracking-tight">{totalPending}</div>
          <p className={`text-xs mt-1 ${statusFilter === 'PENDING' ? 'text-amber-100' : 'text-amber-700 font-medium'}`}>
            Pending review & approval
          </p>
        </div>

        {/* Medical Camps */}
        <div 
          onClick={() => setActiveCategory('CAMPS')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md ${
            activeCategory === 'CAMPS'
              ? 'bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-400'
              : 'bg-white border-slate-200 text-slate-900 hover:border-indigo-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeCategory === 'CAMPS' ? 'text-indigo-100' : 'text-slate-400'}`}>
              Medical Camps
            </span>
            <div className={`p-2 rounded-xl ${activeCategory === 'CAMPS' ? 'bg-indigo-700 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
              <HeartPulse size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold mt-2 tracking-tight">{totalCampsCount}</div>
          <p className={`text-xs mt-1 ${activeCategory === 'CAMPS' ? 'text-indigo-100' : 'text-slate-500'}`}>
            Physical camp proposals
          </p>
        </div>

        {/* Marketing Campaigns */}
        <div 
          onClick={() => setActiveCategory('MARKETING')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md ${
            activeCategory === 'MARKETING'
              ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-400'
              : 'bg-white border-slate-200 text-slate-900 hover:border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeCategory === 'MARKETING' ? 'text-blue-100' : 'text-slate-400'}`}>
              Marketing Campaigns
            </span>
            <div className={`p-2 rounded-xl ${activeCategory === 'MARKETING' ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-600'}`}>
              <Megaphone size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold mt-2 tracking-tight">{totalMarketingCount}</div>
          <p className={`text-xs mt-1 ${activeCategory === 'MARKETING' ? 'text-blue-100' : 'text-slate-500'}`}>
            Brand promotions & ads
          </p>
        </div>

        {/* Platform Inquiries */}
        <div 
          onClick={() => setActiveCategory('INQUIRIES')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md ${
            activeCategory === 'INQUIRIES'
              ? 'bg-purple-600 text-white border-purple-700 ring-2 ring-purple-400'
              : 'bg-white border-slate-200 text-slate-900 hover:border-purple-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeCategory === 'INQUIRIES' ? 'text-purple-100' : 'text-slate-400'}`}>
              Platform Inquiries
            </span>
            <div className={`p-2 rounded-xl ${activeCategory === 'INQUIRIES' ? 'bg-purple-700 text-white' : 'bg-purple-50 text-purple-600'}`}>
              <MessageSquare size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold mt-2 tracking-tight">{totalInquiriesCount}</div>
          <p className={`text-xs mt-1 ${activeCategory === 'INQUIRIES' ? 'text-purple-100' : 'text-slate-500'}`}>
            Questions & support tickets
          </p>
        </div>
      </div>

      {/* Segmented Category Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-1">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setActiveCategory('ALL')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeCategory === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>All Requests</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeCategory === 'ALL' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {totalCount}
            </span>
          </button>

          <button
            onClick={() => setActiveCategory('CAMPS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeCategory === 'CAMPS'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <HeartPulse size={14} />
            <span>Medical Camps</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeCategory === 'CAMPS' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {totalCampsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveCategory('MARKETING')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeCategory === 'MARKETING'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Megaphone size={14} />
            <span>Marketing</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeCategory === 'MARKETING' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {totalMarketingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveCategory('INQUIRIES')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeCategory === 'INQUIRIES'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <MessageSquare size={14} />
            <span>Inquiries</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeCategory === 'INQUIRIES' ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {totalInquiriesCount}
            </span>
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start md:self-auto border border-slate-200">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Card Grid View"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === 'list' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Compact List View"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Search & Status Pill Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by facility, title, specialty, doctor, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-400 font-semibold mr-1 hidden sm:inline">Status:</span>
          {(['ALL', 'PENDING', 'REVIEWING', 'APPROVED', 'REJECTED', 'COMPLETED'] as const).map(tab => {
            const count = tab === 'ALL' 
              ? totalCount 
              : tab === 'PENDING' ? totalPending 
              : tab === 'REVIEWING' ? totalReviewing 
              : tab === 'APPROVED' ? totalApproved 
              : tab === 'REJECTED' ? totalRejected 
              : totalCompleted;

            return (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  statusFilter === tab 
                    ? 'bg-blue-600 text-white shadow-2xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === tab ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-bold transition-colors border border-rose-200 flex items-center gap-1 ml-1"
            >
              <RotateCcw size={12} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Filter size={24} />
          </div>
          <h3 className="font-bold text-slate-800 text-base">No Matching Requests Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {hasActiveFilters 
              ? "We couldn't find any partner requests matching your current filters or date range. Try clearing or expanding your search."
              : "No hospital communications or requests have been received yet."}
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW OF REQUEST CARDS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map(({ type, subType, data }) => {
            const isCamp = subType === 'camp';
            const isMarketing = subType === 'marketing';
            const isInquiry = subType === 'inquiry';
            const isPending = data.status === 'PENDING';
            const isReviewing = data.status === 'REVIEWING';

            const title = isCamp 
              ? data.campTitle 
              : isInquiry 
              ? data.campaignType.replace('PLATFORM_INQUIRY:', '').trim() 
              : data.campaignType;

            return (
              <div 
                key={data.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Header Banner */}
                <div className="p-5 pb-3">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      {isCamp ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <HeartPulse size={12} /> Medical Camp
                        </span>
                      ) : isMarketing ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          <Megaphone size={12} /> Marketing
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          <MessageSquare size={12} /> Platform Inquiry
                        </span>
                      )}
                    </div>
                    {getStatusBadge(data.status)}
                  </div>

                  {/* Main Title */}
                  <h3 
                    onClick={() => setSelectedRequest({ type, data })}
                    className="font-bold text-slate-900 text-base tracking-tight hover:text-blue-600 cursor-pointer transition-colors line-clamp-2"
                  >
                    {title}
                  </h3>

                  {/* Hospital Info & Location */}
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <Building2 size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{data.hospital?.name || `Hospital ID: ${data.hospitalId?.substring(0, 8)}`}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500 pt-0.5">
                      <span className="flex items-center gap-1 text-[11px]">
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                        {data.hospital?.city ? `${data.hospital.city}, ${data.hospital.state || 'IN'}` : (data.location || 'Location Not Specified')}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400">
                        {getRelativeTime(data.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Context Specific Chips */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                    {isCamp && (
                      <>
                        <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                          <Calendar size={11} className="text-slate-400" />
                          {new Date(data.expectedDate).toLocaleDateString()}
                        </span>
                        {(data.specialties || []).slice(0, 2).map((s: string) => (
                          <span key={s} className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium border border-indigo-100">
                            {s}
                          </span>
                        ))}
                        {(data.specialties || []).length > 2 && (
                          <span className="text-[11px] bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded-md font-medium">
                            +{data.specialties.length - 2} more
                          </span>
                        )}
                      </>
                    )}

                    {isMarketing && (
                      <>
                        {data.doctorName && (
                          <span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-semibold border border-blue-100 flex items-center gap-1">
                            <Users size={11} className="text-blue-500" />
                            Dr. {data.doctorName}
                          </span>
                        )}
                        {data.budget && (
                          <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold border border-emerald-100">
                            ₹{Number(data.budget).toLocaleString()} budget
                          </span>
                        )}
                      </>
                    )}

                    {isInquiry && (
                      <span className="text-[11px] text-slate-500 line-clamp-1 italic">
                        "{data.notes?.split('|')?.[0] || 'Direct hospital administrative inquiry'}"
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-4 pt-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedRequest({ type, data })}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                  >
                    View Details
                    <ChevronRight size={13} />
                  </button>

                  <div className="flex items-center gap-1.5">
                    {isPending && (
                      <button
                        onClick={() => handleUpdateStatus(type, data.id, 'REVIEWING')}
                        disabled={actionLoading === data.id}
                        className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-all shadow-2xs disabled:opacity-50"
                        title="Mark Under Review"
                      >
                        Review
                      </button>
                    )}

                    {(isPending || isReviewing) && (
                      <button
                        onClick={() => handleUpdateStatus(type, data.id, 'APPROVED')}
                        disabled={actionLoading === data.id}
                        className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all shadow-2xs flex items-center gap-1 disabled:opacity-50"
                        title="Approve Proposal"
                      >
                        <Check size={12} />
                        Approve
                      </button>
                    )}

                    {data.status === 'APPROVED' && (
                      <button
                        onClick={() => handleUpdateStatus(type, data.id, 'COMPLETED')}
                        disabled={actionLoading === data.id}
                        className="px-2.5 py-1 text-[11px] font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-all shadow-2xs disabled:opacity-50"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* COMPACT LIST VIEW */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredItems.map(({ type, subType, data }) => {
              const isCamp = subType === 'camp';
              const isInquiry = subType === 'inquiry';
              const title = isCamp 
                ? data.campTitle 
                : isInquiry 
                ? data.campaignType.replace('PLATFORM_INQUIRY:', '').trim() 
                : data.campaignType;

              return (
                <div 
                  key={data.id}
                  className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                  onClick={() => setSelectedRequest({ type, data })}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      isCamp ? 'bg-indigo-50 text-indigo-600' : isInquiry ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {isCamp ? <HeartPulse size={18} /> : isInquiry ? <MessageSquare size={18} /> : <Megaphone size={18} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-slate-900 text-sm hover:text-blue-600 transition-colors truncate">
                          {title}
                        </span>
                        {getStatusBadge(data.status)}
                      </div>
                      <div className="flex items-center gap-x-4 gap-y-1 text-xs text-slate-500 flex-wrap">
                        <span className="font-medium text-slate-800 flex items-center gap-1">
                          <Building2 size={12} className="text-slate-400" />
                          {data.hospital?.name || 'Hospital ID: ' + data.hospitalId?.substring(0, 8)}
                        </span>
                        {data.hospital?.city && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} className="text-slate-400" />
                            {data.hospital.city}
                          </span>
                        )}
                        {data.doctorName && (
                          <span className="text-blue-700 font-semibold bg-blue-50 px-2 py-0.2 rounded-md text-[11px]">
                            Dr. {data.doctorName}
                          </span>
                        )}
                        <span className="text-slate-400">
                          {formatDateTime(data.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedRequest({ type, data })}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs"
                    >
                      Inspect
                    </button>
                    {(data.status === 'PENDING' || data.status === 'REVIEWING') && (
                      <button
                        onClick={() => handleUpdateStatus(type, data.id, 'APPROVED')}
                        disabled={actionLoading === data.id}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* INSPECT & ACTION SLIDE-OVER DRAWER */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" 
            onClick={() => { setSelectedRequest(null); setRejectMode(false); setRejectReason(''); }}
          />
          <div className="relative w-full max-w-xl bg-white shadow-2xl z-10 flex flex-col h-full overflow-y-auto border-l border-slate-200 animate-slideLeft">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 bg-slate-50/80 sticky top-0 backdrop-blur-xs z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  selectedRequest.type === 'camp' 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : selectedRequest.data.campaignType?.startsWith('PLATFORM_INQUIRY:')
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {selectedRequest.type === 'camp' ? <HeartPulse size={20} /> : <Megaphone size={20} />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {selectedRequest.type === 'camp' ? 'Medical Camp Proposal' : 'Marketing & Inquiry'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Ref ID: {selectedRequest.data.id}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setSelectedRequest(null); setRejectMode(false); setRejectReason(''); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-6 space-y-6">
              {/* Stepper Status Bar */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Lifecycle Progress
                  </span>
                  {getStatusBadge(selectedRequest.data.status)}
                </div>

                {/* Progress Visualizer */}
                <div className="grid grid-cols-4 gap-2 pt-2">
                  <div className={`h-2 rounded-full ${
                    ['PENDING', 'REVIEWING', 'APPROVED', 'COMPLETED'].includes(selectedRequest.data.status)
                      ? 'bg-blue-600' : 'bg-slate-200'
                  }`} title="Submitted" />
                  <div className={`h-2 rounded-full ${
                    ['REVIEWING', 'APPROVED', 'COMPLETED'].includes(selectedRequest.data.status)
                      ? 'bg-blue-600' : 'bg-slate-200'
                  }`} title="Under Review" />
                  <div className={`h-2 rounded-full ${
                    ['APPROVED', 'COMPLETED'].includes(selectedRequest.data.status)
                      ? 'bg-emerald-600' : selectedRequest.data.status === 'REJECTED' ? 'bg-rose-500' : 'bg-slate-200'
                  }`} title="Approved" />
                  <div className={`h-2 rounded-full ${
                    selectedRequest.data.status === 'COMPLETED'
                      ? 'bg-slate-800' : 'bg-slate-200'
                  }`} title="Completed" />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1.5 px-0.5">
                  <span>Received</span>
                  <span>Reviewing</span>
                  <span>Approved</span>
                  <span>Completed</span>
                </div>
              </div>

              {/* Hospital / Facility Contact Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                    <Building2 size={15} className="text-blue-600" />
                    Hospital / Partner Facility
                  </h4>
                  {selectedRequest.data.hospital?.city && (
                    <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                      <MapPin size={12} />
                      {selectedRequest.data.hospital.city}, {selectedRequest.data.hospital.state || 'IN'}
                    </span>
                  )}
                </div>

                <div className="text-sm font-bold text-slate-900">
                  {selectedRequest.data.hospital?.name || 'Partner Facility'}
                </div>

                {/* Direct Outreach Shortcuts */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {selectedRequest.data.hospital?.contactPhone ? (
                    <a 
                      href={`tel:${selectedRequest.data.hospital.contactPhone}`}
                      className="px-3 py-2 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Phone size={13} className="text-blue-600" />
                      {selectedRequest.data.hospital.contactPhone}
                    </a>
                  ) : (
                    <div className="px-3 py-2 bg-slate-50 text-slate-400 border border-slate-200 rounded-xl text-xs flex items-center justify-center gap-1.5">
                      <Phone size={13} /> Phone N/A
                    </div>
                  )}

                  {selectedRequest.data.hospital?.contactEmail ? (
                    <a 
                      href={`mailto:${selectedRequest.data.hospital.contactEmail}`}
                      className="px-3 py-2 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Mail size={13} className="text-blue-600" />
                      Send Email
                    </a>
                  ) : (
                    <div className="px-3 py-2 bg-slate-50 text-slate-400 border border-slate-200 rounded-xl text-xs flex items-center justify-center gap-1.5">
                      <Mail size={13} /> Email N/A
                    </div>
                  )}
                </div>
              </div>

              {/* Request Details Breakdown */}
              {selectedRequest.type === 'camp' ? (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Medical Camp Specifications
                  </h4>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Camp Title</span>
                      <span className="font-bold text-slate-900 text-sm text-right">{selectedRequest.data.campTitle}</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Proposed Location</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1 text-right">
                        <MapPin size={13} className="text-slate-400" />
                        {selectedRequest.data.location}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Scheduled / Target Date</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1 text-right">
                        <Calendar size={13} className="text-slate-400" />
                        {new Date(selectedRequest.data.expectedDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="py-1 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium block mb-1.5">Target Clinical Specialties</span>
                      <div className="flex flex-wrap gap-1.5">
                        {(selectedRequest.data.specialties || []).map((s: string) => (
                          <span key={s} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg border border-indigo-200">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 font-medium">Expected Patient Turnout</span>
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <Users size={13} className="text-slate-400" />
                        {selectedRequest.data.expectedPatients ? `${selectedRequest.data.expectedPatients} Patients` : 'Not specified'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Campaign / Inquiry Specifications
                  </h4>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3 text-xs">
                    <div className="py-1 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium block mb-1">Subject / Campaign Services</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {selectedRequest.data.campaignType?.replace('PLATFORM_INQUIRY:', '').trim()}
                      </span>
                    </div>

                    {selectedRequest.data.doctorName && (
                      <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                        <span className="text-slate-500 font-medium">Requesting Doctor</span>
                        <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                          Dr. {selectedRequest.data.doctorName}
                        </span>
                      </div>
                    )}

                    {selectedRequest.data.budget && (
                      <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                        <span className="text-slate-500 font-medium">Proposed Marketing Budget</span>
                        <span className="font-bold text-emerald-700 text-sm">
                          ₹{Number(selectedRequest.data.budget).toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 font-medium">Submission Timestamp</span>
                      <span className="font-medium text-slate-800">
                        {formatDateTime(selectedRequest.data.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Message / Notes Section */}
              {selectedRequest.data.notes && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Hospital Notes / Request Details
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {selectedRequest.data.notes}
                  </div>
                </div>
              )}

              {/* Rejection Form Mode */}
              {rejectMode && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wide">
                    <ShieldAlert size={16} />
                    State Reason for Rejection
                  </div>
                  <p className="text-xs text-rose-700">
                    Choose a quick preset reason or describe specific details to notify the partner facility.
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_REJECT_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setRejectReason(preset)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors border ${
                          rejectReason === preset 
                            ? 'bg-rose-600 text-white border-rose-600' 
                            : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={3}
                    placeholder="Provide additional context or custom reason for rejection..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full bg-white border border-rose-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => { setRejectMode(false); setRejectReason(''); }}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-rose-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedRequest.type, selectedRequest.data.id, 'REJECTED', `Rejection Reason: ${rejectReason}`)}
                      disabled={!rejectReason.trim() || actionLoading === selectedRequest.data.id}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Action Footer */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 sticky bottom-0 z-10 flex flex-col gap-2">
              {!rejectMode && (
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  {(selectedRequest.data.status === 'PENDING' || selectedRequest.data.status === 'REVIEWING') && (
                    <button
                      onClick={() => setRejectMode(true)}
                      className="flex-1 py-2.5 text-xs font-bold text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 rounded-xl transition-all shadow-xs"
                    >
                      Reject Request
                    </button>
                  )}

                  {selectedRequest.data.status === 'PENDING' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedRequest.type, selectedRequest.data.id, 'REVIEWING')}
                      disabled={actionLoading === selectedRequest.data.id}
                      className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-xs disabled:opacity-50"
                    >
                      Mark Under Review
                    </button>
                  )}

                  {(selectedRequest.data.status === 'PENDING' || selectedRequest.data.status === 'REVIEWING') && (
                    <button
                      onClick={() => handleUpdateStatus(selectedRequest.type, selectedRequest.data.id, 'APPROVED')}
                      disabled={actionLoading === selectedRequest.data.id}
                      className="flex-1 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 size={15} />
                      Approve & Contact
                    </button>
                  )}

                  {selectedRequest.data.status === 'APPROVED' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedRequest.type, selectedRequest.data.id, 'COMPLETED')}
                      disabled={actionLoading === selectedRequest.data.id}
                      className="flex-1 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Check size={15} />
                      Mark Completed
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Requests;
