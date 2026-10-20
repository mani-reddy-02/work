import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAdminAuth } from '../contexts/AuthContext';
import KpiCard from '../components/ui/KpiCard';
import {
  Shield,
  Search,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  X,
  AlertCircle,
  CheckCircle2,
  Upload,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Heart,
  Building2,
  Activity,
  Umbrella,
  Check,
  Percent,
  Bell,
  Phone,
  Mail,
  User,
  Clock,
  CheckCheck
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
const PAGE_SIZE = 20;

export interface InsuranceItem {
  id: string;
  title: string;
  icon?: string | null;
  description: string;
  successRate: number;
  applicationUrl: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface InsuranceLog {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  metadata?: {
    userId?: string | null;
    userName?: string;
    userRef?: string;
    userPhone?: string | null;
    userEmail?: string | null;
    planId?: string;
    planTitle?: string;
    selectedAt?: string;
    [key: string]: any;
  };
}

const PRESET_ICONS = [
  { name: 'Shield', url: '/icons/shield.png', icon: Shield },
  { name: 'Heart', url: '/icons/heart.png', icon: Heart },
  { name: 'Hospital', url: '/icons/hospital.png', icon: Building2 },
  { name: 'Activity', url: '/icons/activity.png', icon: Activity },
  { name: 'Umbrella', url: '/icons/umbrella.png', icon: Umbrella },
];

const Insurance: React.FC = () => {
  const { token } = useAdminAuth();

  // State
  const [insurances, setInsurances] = useState<InsuranceItem[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalInsurancesDb, setTotalInsurancesDb] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [selectedInsurance, setSelectedInsurance] = useState<InsuranceItem | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formSuccessRate, setFormSuccessRate] = useState<string>('95');
  const [formApplicationUrl, setFormApplicationUrl] = useState<string>('');
  const [formIcon, setFormIcon] = useState<string>('');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Remove Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<InsuranceItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to page 1 on search change
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch Insurances
  const fetchInsurances = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: PAGE_SIZE.toString(),
      });
      if (debouncedSearch.trim()) {
        params.append('search', debouncedSearch.trim());
      }

      const res = await fetch(`${API_BASE_URL}/insurance/admin?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (json.success) {
        setInsurances(json.data || []);
        setTotalRecords(json.pagination?.total || 0);
        setTotalPages(json.pagination?.totalPages || 1);
        if (json.stats?.totalInsurances !== undefined) {
          setTotalInsurancesDb(json.stats.totalInsurances);
        }
      } else {
        setError(json.message || 'Failed to load insurance records');
      }
    } catch (err) {
      console.error('Error fetching insurances:', err);
      setError('Unable to connect to the backend server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchInsurances();
    }
  }, [token, currentPage, debouncedSearch]);

  // Tab State: PLANS or ALERTS
  const [activeTab, setActiveTab] = useState<'PLANS' | 'ALERTS'>('PLANS');

  // Logs & Alerts State
  const [logs, setLogs] = useState<InsuranceLog[]>([]);
  const [logsLoading, setLogsLoading] = useState<boolean>(false);
  const [logsSearch, setLogsSearch] = useState<string>('');

  // Fetch Insurance Inquiries & Interaction Logs
  const fetchInsuranceLogs = async () => {
    if (!token) return;
    try {
      setLogsLoading(true);
      const res = await fetch(`${API_BASE_URL}/insurance/admin/logs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setLogs(json.data);
      }
    } catch (err) {
      console.error('Error fetching insurance logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchInsuranceLogs();
      const interval = setInterval(fetchInsuranceLogs, 15000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const markLogAsRead = async (id: string) => {
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, read: true } : l)));
    } catch (err) {
      console.error('Failed to mark log as read:', err);
    }
  };

  const markAllLogsAsRead = async () => {
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs((prev) => prev.map((l) => ({ ...l, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      if (diffSecs < 60) return 'Just now';
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const unreadLogsCount = useMemo(() => {
    return logs.filter((l) => !l.read).length;
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const q = logsSearch.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((log) => {
      const titleMatch = log.title?.toLowerCase().includes(q);
      const msgMatch = log.message?.toLowerCase().includes(q);
      const meta = log.metadata || {};
      const userMatch =
        meta.userName?.toLowerCase().includes(q) ||
        meta.userPhone?.toLowerCase().includes(q) ||
        meta.userEmail?.toLowerCase().includes(q) ||
        meta.planTitle?.toLowerCase().includes(q);
      return titleMatch || msgMatch || userMatch;
    });
  }, [logs, logsSearch]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedInsurance(null);
    setFormTitle('');
    setFormDescription('');
    setFormSuccessRate('95');
    setFormApplicationUrl('');
    setFormIcon('');
    setFormIsActive(true);
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: InsuranceItem) => {
    setIsEditing(true);
    setSelectedInsurance(item);
    setFormTitle(item.title);
    setFormDescription(item.description);
    setFormSuccessRate(item.successRate.toString());
    setFormApplicationUrl(item.applicationUrl);
    setFormIcon(item.icon || '');
    setFormIsActive(item.isActive);
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Validate Form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formTitle.trim()) {
      errors.title = 'Insurance Title is required';
    }

    if (!formDescription.trim()) {
      errors.description = 'Description is required';
    }

    const rateNum = parseFloat(formSuccessRate);
    if (isNaN(rateNum) || formSuccessRate.trim() === '') {
      errors.successRate = 'Success Rate (%) is required';
    } else if (rateNum < 0 || rateNum > 100) {
      errors.successRate = 'Success rate must be between 0% and 100%';
    }

    const trimmedUrl = formApplicationUrl.trim();
    if (!trimmedUrl) {
      errors.applicationUrl = 'Application URL is required';
    } else if (!/^https?:\/\/.+/i.test(trimmedUrl)) {
      errors.applicationUrl = 'Must be a valid URL starting with http:// or https://';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Form Submit (Add or Edit)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      setFormErrors({});

      const payload = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        successRate: parseFloat(formSuccessRate),
        applicationUrl: formApplicationUrl.trim(),
        icon: formIcon.trim() || null,
        isActive: formIsActive,
      };

      const url = isEditing && selectedInsurance
        ? `${API_BASE_URL}/insurance/admin/${selectedInsurance.id}`
        : `${API_BASE_URL}/insurance/admin`;

      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        showSuccess(isEditing ? 'Insurance plan updated successfully' : 'Insurance plan created successfully');
        fetchInsurances();
      } else {
        setFormErrors({ general: json.message || 'Operation failed. Please check inputs.' });
      }
    } catch (err) {
      console.error('Error saving insurance:', err);
      setFormErrors({ general: 'Server connection error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Image File Upload for Icon
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormErrors(prev => ({ ...prev, icon: 'Selected file must be an image (PNG, JPG, SVG, WebP)' }));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setFormErrors(prev => ({ ...prev, icon: 'Image size must be under 2MB' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormIcon(base64);
      setFormErrors(prev => {
        const copy = { ...prev };
        delete copy.icon;
        return copy;
      });
    };
    reader.readAsDataURL(file);
  };

  // Handle Removal
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`${API_BASE_URL}/insurance/admin/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (json.success) {
        showSuccess(`Insurance "${deleteTarget.title}" removed successfully`);
        setDeleteTarget(null);
        fetchInsurances();
      } else {
        setError(json.message || 'Failed to remove insurance');
      }
    } catch (err) {
      console.error('Error removing insurance:', err);
      setError('Failed to connect to server to remove insurance');
    } finally {
      setIsDeleting(false);
    }
  };

  // Clean formatted display URL
  const formatDisplayUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.hostname + (parsed.pathname.length > 15 ? parsed.pathname.slice(0, 15) + '...' : parsed.pathname);
    } catch {
      return url.length > 25 ? url.slice(0, 25) + '...' : url;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Insurance Management</h2>
          <p className="text-sm text-slate-500">
            Manage medical insurance providers, success rates, and user application links.
          </p>
        </div>

        {/* Top Action Bar: Search Bar on Left, Add Insurance Button Beside on Right */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative min-w-[260px] sm:min-w-[320px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or description..."
              className="w-full pl-9 pr-9 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all whitespace-nowrap active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Add Insurance</span>
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-rose-800 text-sm shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchInsurances}
            className="px-3 py-1 bg-white border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold hover:bg-rose-50 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          title="Total Insurance"
          value={totalInsurancesDb}
          icon={Shield}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          subtitle="Authoritative database records"
        />
        <KpiCard
          title="User Inquiries & Alerts"
          value={logs.length}
          icon={Bell}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          subtitle={unreadLogsCount > 0 ? `${unreadLogsCount} new unread alerts` : 'All inquiries logged'}
          onClick={() => setActiveTab('ALERTS')}
        />
        <KpiCard
          title="Active Plans"
          value={insurances.filter(i => i.isActive).length}
          icon={Activity}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          subtitle="Currently published to users"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('PLANS')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'PLANS'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Insurance Plans</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
            {totalRecords}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ALERTS')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'ALERTS'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>User Inquiries & Interaction Alerts</span>
          {unreadLogsCount > 0 ? (
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse">
              {unreadLogsCount} new
            </span>
          ) : (
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
              {logs.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: INSURANCE PLANS */}
      {activeTab === 'PLANS' && (
        <div className="space-y-4">
          {/* Quick Notice Banner if there are new unread user inquiries */}
          {unreadLogsCount > 0 && (
            <div
              onClick={() => setActiveTab('ALERTS')}
              className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-amber-900 text-xs font-medium cursor-pointer hover:border-amber-300 transition-all shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4 animate-bounce" />
                </div>
                <span>
                  <strong>{unreadLogsCount} new user inquiry alert{unreadLogsCount > 1 ? 's' : ''}!</strong> Users have recently touched/opened insurance plans.
                </span>
              </div>
              <span className="font-bold text-amber-700 flex items-center gap-1 hover:underline">
                View Inquiries Log &rarr;
              </span>
            </div>
          )}

          {/* Insurance Records Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Insurance Plans</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing page {currentPage} of {totalPages} ({totalRecords} matching records)
            </p>
          </div>

          <button
            onClick={fetchInsurances}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-14 text-center">S.No.</th>
                <th className="py-3.5 px-4 min-w-[200px]">Insurance Title</th>
                <th className="py-3.5 px-4 w-20 text-center">Icon</th>
                <th className="py-3.5 px-4 w-32">Success Rate</th>
                <th className="py-3.5 px-4 min-w-[280px]">Description</th>
                <th className="py-3.5 px-4 min-w-[180px]">Application URL</th>
                <th className="py-3.5 px-4 w-28 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {loading && insurances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                      <span className="text-sm font-medium">Loading insurance records...</span>
                    </div>
                  </td>
                </tr>
              ) : insurances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                        <Shield className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-bold text-slate-800">
                        {debouncedSearch ? 'No matching insurance found' : 'No insurance records yet'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 text-center">
                        {debouncedSearch
                          ? `No insurance policies matching "${debouncedSearch}". Try another search term.`
                          : 'Get started by clicking "+ Add Insurance" above to register insurance providers.'}
                      </p>
                      {!debouncedSearch && (
                        <button
                          onClick={handleOpenAdd}
                          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                        >
                          Add Your First Insurance
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                insurances.map((item, index) => {
                  const serialNo = (currentPage - 1) * PAGE_SIZE + index + 1;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/75 transition-colors group">
                      {/* S.No. */}
                      <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-500">
                        {serialNo}
                      </td>

                      {/* Insurance Title */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 leading-tight">
                            {item.title}
                          </span>
                          {!item.isActive && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Inactive
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Icon */}
                      <td className="py-3.5 px-4 text-center">
                        {item.icon ? (
                          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto overflow-hidden p-1 shadow-2xs">
                            <img
                              src={item.icon}
                              alt={item.title}
                              className="w-full h-full object-contain rounded-lg"
                              onError={(e) => {
                                // fallback if image fails to render
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>

                      {/* Success Rate */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <Percent className="w-3 h-3 text-emerald-600" />
                          {item.successRate}%
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4">
                        <p className="text-xs text-slate-600 line-clamp-2 max-w-md leading-relaxed" title={item.description}>
                          {item.description}
                        </p>
                      </td>

                      {/* Application URL */}
                      <td className="py-3.5 px-4">
                        <a
                          href={item.applicationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline max-w-[200px] truncate"
                          title={item.applicationUrl}
                        >
                          <span className="truncate">{formatDisplayUrl(item.applicationUrl)}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit insurance"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Remove insurance"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-700">{insurances.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0}</span> to{' '}
            <span className="font-semibold text-slate-700">{Math.min(currentPage * PAGE_SIZE, totalRecords)}</span> of{' '}
            <span className="font-semibold text-slate-700">{totalRecords}</span> entries
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {/* Page number buttons */}
            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((pageNum, idx, arr) => {
                  const prevPageNum = arr[idx - 1];
                  const hasGap = prevPageNum && pageNum - prevPageNum > 1;

                  return (
                    <React.Fragment key={pageNum}>
                      {hasGap && <span className="px-1 text-slate-400">...</span>}
                      <button
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 rounded-lg font-bold text-xs transition-colors ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || loading}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
        </div>
      )}

      {/* TAB 2: USER INQUIRIES & ALERTS LOG */}
      {activeTab === 'ALERTS' && (
        <div className="space-y-4">
          {/* Header & Filter Controls Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">User Inquiries & Touch Logs</h3>
                  {unreadLogsCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">
                      {unreadLogsCount} Unread
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Real-time activity logs whenever users or patients view or interact with insurance plans in the user portal.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                {/* Search Filter */}
                <div className="relative min-w-[220px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={logsSearch}
                    onChange={(e) => setLogsSearch(e.target.value)}
                    placeholder="Search user, phone, plan..."
                    className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                  {logsSearch && (
                    <button
                      onClick={() => setLogsSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {unreadLogsCount > 0 && (
                  <button
                    onClick={markAllLogsAsRead}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Mark all notifications as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mark All Read</span>
                  </button>
                )}

                <button
                  onClick={fetchInsuranceLogs}
                  disabled={logsLoading}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  title="Refresh logs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>

          {/* Logs Feed */}
          {logsLoading && logs.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">Loading inquiry logs...</p>
              <p className="text-xs text-slate-400 mt-1">Fetching latest user interaction data</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-800">
                {logsSearch ? 'No matching logs found' : 'No insurance inquiries yet'}
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {logsSearch
                  ? `No logs match "${logsSearch}". Try searching with a different user name, phone number, or insurance title.`
                  : 'When patients or visitors touch and open insurance plans in their portal, their activity and contact details will appear here as real-time alerts.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => {
                const meta = log.metadata || {};
                const userName = meta.userName || 'Guest Visitor';
                const userRef = meta.userRef;
                const userPhone = meta.userPhone;
                const userEmail = meta.userEmail;
                const planTitle = meta.planTitle || log.title.replace('New Insurance Inquiry: ', '');

                return (
                  <div
                    key={log.id}
                    className={`border rounded-2xl p-4 sm:p-5 transition-all shadow-2xs ${
                      log.read
                        ? 'bg-white border-slate-200 hover:border-slate-300'
                        : 'bg-gradient-to-r from-amber-50/50 via-white to-blue-50/30 border-amber-300/80 shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      {/* Left: Icon & Alert Title */}
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            log.read ? 'bg-slate-100 text-slate-600' : 'bg-amber-500 text-white shadow-sm'
                          }`}
                        >
                          <Bell className="w-5 h-5" />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">
                              {log.title}
                            </h4>
                            {!log.read && (
                              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-amber-500 text-white rounded-md">
                                New
                              </span>
                            )}
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatTimeAgo(log.createdAt)}</span>
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {log.message}
                          </p>
                        </div>
                      </div>

                      {/* Right: Timestamp & Mark Read action */}
                      <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 shrink-0">
                        <span className="text-[11px] text-slate-400 font-medium">
                          {formatDateTime(log.createdAt)}
                        </span>
                        {!log.read && (
                          <button
                            onClick={() => markLogAsRead(log.id)}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Mark as read</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Details Meta Box */}
                    <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs bg-slate-50/70 p-3 rounded-xl">
                      {/* User/Patient */}
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-100/70 text-blue-700 flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">User / Patient</p>
                          <p className="font-bold text-slate-800 truncate">
                            {userName}
                            {userRef && (
                              <span className="ml-1.5 text-[10px] font-normal text-slate-500">
                                ({userRef})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0">
                          <Phone className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">Phone</p>
                          {userPhone ? (
                            <a
                              href={`tel:${userPhone}`}
                              className="font-bold text-emerald-700 hover:underline truncate block"
                            >
                              {userPhone}
                            </a>
                          ) : (
                            <p className="text-slate-400 italic">Not provided</p>
                          )}
                        </div>
                      </div>

                      {/* Email */}
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-purple-100/70 text-purple-700 flex items-center justify-center shrink-0">
                          <Mail className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">Email</p>
                          {userEmail ? (
                            <a
                              href={`mailto:${userEmail}`}
                              className="font-bold text-purple-700 hover:underline truncate block"
                            >
                              {userEmail}
                            </a>
                          ) : (
                            <p className="text-slate-400 italic">Not provided</p>
                          )}
                        </div>
                      </div>

                      {/* Plan */}
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-100/70 text-amber-700 flex items-center justify-center shrink-0">
                          <Shield className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">Plan Touched</p>
                          <p className="font-bold text-slate-800 truncate" title={planTitle}>
                            {planTitle}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Direct Action Chips */}
                    {(userPhone || userEmail) && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-medium">Quick Connect:</span>
                        {userPhone && (
                          <a
                            href={`tel:${userPhone}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Call {userPhone}</span>
                          </a>
                        )}
                        {userEmail && (
                          <a
                            href={`mailto:${userEmail}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold hover:bg-purple-100 transition-colors"
                          >
                            <Mail className="w-3 h-3" />
                            <span>Email Patient</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Insurance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden my-8 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {isEditing ? 'Edit Insurance' : 'Add New Insurance'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isEditing ? 'Update details for this insurance provider' : 'Register a new medical insurance offering'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {formErrors.general && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formErrors.general}</span>
                </div>
              )}

              {/* 1. Insurance Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Insurance Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => {
                    setFormTitle(e.target.value);
                    if (formErrors.title) {
                      setFormErrors(prev => {
                        const copy = { ...prev };
                        delete copy.title;
                        return copy;
                      });
                    }
                  }}
                  placeholder="e.g. Star Comprehensive Health Plan"
                  className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    formErrors.title ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  }`}
                />
                {formErrors.title && <p className="text-rose-600 text-xs mt-1">{formErrors.title}</p>}
              </div>

              {/* 2. Optional Icon Selection & Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Icon <span className="text-slate-400 text-[11px] font-normal">(Optional)</span>
                </label>

                {/* Icon Preview & Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  {/* Preview Box */}
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center p-2 shrink-0 shadow-2xs overflow-hidden relative group">
                    {formIcon ? (
                      <img
                        src={formIcon}
                        alt="Icon preview"
                        className="w-full h-full object-contain rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Shield className="w-7 h-7 text-slate-300" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5 w-full">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Image</span>
                      </button>

                      {formIcon && (
                        <button
                          type="button"
                          onClick={() => setFormIcon('')}
                          className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          Clear Icon
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Upload custom logo/icon (PNG, JPG, SVG, max 2MB) or choose a preset below.
                    </p>
                  </div>
                </div>

                {/* Presets Row */}
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-slate-400 font-medium">Quick presets:</span>
                  {PRESET_ICONS.map((preset) => {
                    const isSelected = formIcon === preset.url;
                    const IconComp = preset.icon;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setFormIcon(preset.url)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          isSelected
                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <IconComp className="w-3.5 h-3.5 text-blue-600" />
                        <span>{preset.name}</span>
                        {isSelected && <Check className="w-3 h-3 text-blue-600" />}
                      </button>
                    );
                  })}
                </div>
                {formErrors.icon && <p className="text-rose-600 text-xs mt-1">{formErrors.icon}</p>}
              </div>

              {/* 3. Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => {
                    setFormDescription(e.target.value);
                    if (formErrors.description) {
                      setFormErrors(prev => {
                        const copy = { ...prev };
                        delete copy.description;
                        return copy;
                      });
                    }
                  }}
                  placeholder="Explain coverage benefits, cashless network facilities, and eligible claim terms..."
                  className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    formErrors.description ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  }`}
                />
                {formErrors.description && <p className="text-rose-600 text-xs mt-1">{formErrors.description}</p>}
              </div>

              {/* 4. Success Rate (%) and Active Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Success Rate (%) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formSuccessRate}
                      onChange={(e) => {
                        setFormSuccessRate(e.target.value);
                        if (formErrors.successRate) {
                          setFormErrors(prev => {
                            const copy = { ...prev };
                            delete copy.successRate;
                            return copy;
                          });
                        }
                      }}
                      placeholder="e.g. 96"
                      className={`w-full pl-3.5 pr-8 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        formErrors.successRate ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                      }`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                      %
                    </span>
                  </div>
                  {formErrors.successRate && <p className="text-rose-600 text-xs mt-1">{formErrors.successRate}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <div className="flex items-center gap-3 pt-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formIsActive}
                        onChange={(e) => setFormIsActive(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      <span className="ml-3 text-xs font-semibold text-slate-700">
                        {formIsActive ? 'Active (Visible to users)' : 'Inactive'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 5. Application URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Application URL <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={formApplicationUrl}
                    onChange={(e) => {
                      setFormApplicationUrl(e.target.value);
                      if (formErrors.applicationUrl) {
                        setFormErrors(prev => {
                          const copy = { ...prev };
                          delete copy.applicationUrl;
                          return copy;
                        });
                      }
                    }}
                    placeholder="https://example-insurance.com/apply"
                    className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      formErrors.applicationUrl ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Users who click &quot;Apply&quot; in the User module will be redirected safely to this destination in a new tab.
                </p>
                {formErrors.applicationUrl && <p className="text-rose-600 text-xs mt-1">{formErrors.applicationUrl}</p>}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center gap-2 active:scale-98"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{isEditing ? 'Save Changes' : 'Save Insurance'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-sm border border-rose-100">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900">Remove Insurance?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to remove <span className="font-bold text-slate-800">&quot;{deleteTarget.title}&quot;</span>? This will permanently delete the offering from the database.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <span>Remove</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Insurance;
