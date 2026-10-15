import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAdminAuth } from '../contexts/AuthContext';
import KpiCard from '../components/ui/KpiCard';
import { IconImage } from '../components/IconImage';
import {
  HeartHandshake,
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Power
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
const PAGE_SIZE = 20;

export interface NursingServiceItem {
  id: string;
  name: string;
  code: string;
  category: string;
  description: string;
  duration?: string;
  basePrice?: number;
  iconUrl?: string | null;
  active: boolean;
  hospitalOfferingsCount: number;
  bookingsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface NursingStats {
  totalNursingServices: number;
  totalNurses: number;
  activeServices?: number;
}

const NursingServices: React.FC = () => {
  const { token } = useAdminAuth();

  // State
  const [services, setServices] = useState<NursingServiceItem[]>([]);
  const [stats, setStats] = useState<NursingStats>({
    totalNursingServices: 0,
    totalNurses: 0,
  });
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [selectedService, setSelectedService] = useState<NursingServiceItem | null>(null);

  // Form State
  const [formName, setFormName] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formActive, setFormActive] = useState<boolean>(true);
  const [formCategory, setFormCategory] = useState<string>('Home Nursing');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Delete Confirmation State
  const [actionTarget, setActionTarget] = useState<NursingServiceItem | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to page 1 when search query changes
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch Stats from real backend database query
  const fetchStats = async () => {
    if (!token) return;
    try {
      setStatsLoading(true);
      const res = await fetch(`${API_BASE_URL}/home-nursing/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setStats({
          totalNursingServices: json.data.totalNursingServices ?? json.data.totalServices ?? 0,
          totalNurses: json.data.totalNurses ?? 0,
          activeServices: json.data.activeServices ?? 0,
        });
      }
    } catch (err) {
      console.error('Error fetching nursing stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch Services List with search, status filter, and 20/page pagination
  const fetchServices = useCallback(async () => {
    if (!token) return;
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
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }

      const res = await fetch(`${API_BASE_URL}/home-nursing/admin/services?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (json.success) {
        setServices(json.data || []);
        setTotalRecords(json.pagination?.total || 0);
        setTotalPages(json.pagination?.totalPages || 1);
      } else {
        setError(json.error?.message || 'Failed to load nursing services');
      }
    } catch (err) {
      console.error('Error fetching nursing services:', err);
      setError('Unable to connect to the backend server. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchStats();
  }, [token]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Reset pagination when status filter changes
  const handleStatusFilterChange = (status: 'ALL' | 'ACTIVE' | 'INACTIVE') => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  // Open Add Service Modal
  const handleOpenAddModal = () => {
    setIsEditing(false);
    setSelectedService(null);
    setFormName('');
    setFormDescription('');
    setFormActive(true);
    setFormCategory('Home Nursing');
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Service Modal
  const handleOpenEditModal = (service: NursingServiceItem) => {
    setIsEditing(true);
    setSelectedService(service);
    setFormName(service.name);
    setFormDescription(service.description);
    setFormActive(service.active);
    setFormCategory(service.category || 'Home Nursing');
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Form Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formName.trim()) {
      errors.name = 'Service Name is required';
    } else if (formName.trim().length < 3) {
      errors.name = 'Service Name must be at least 3 characters';
    }

    if (!formDescription.trim()) {
      errors.description = 'Description is required';
    } else if (formDescription.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Add or Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setFormErrors({});

      const payload: Record<string, any> = {
        name: formName.trim(),
        description: formDescription.trim(),
        active: formActive,
        category: formCategory.trim() || 'Home Nursing',
      };
      if (isEditing && selectedService) {
        payload.iconUrl = selectedService.iconUrl || null;
      }

      const url = isEditing && selectedService
        ? `${API_BASE_URL}/home-nursing/admin/services/${selectedService.id}`
        : `${API_BASE_URL}/home-nursing/admin/services`;

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
        setSuccessMsg(
          isEditing
            ? `Nursing service "${formName}" updated successfully!`
            : `Nursing service "${formName}" created successfully!`
        );
        setTimeout(() => setSuccessMsg(null), 4000);
        await fetchServices();
        await fetchStats();
      } else {
        if (json.error?.code === 'DUPLICATE_SERVICE') {
          setFormErrors({ name: json.error.message || 'Service name already exists.' });
        } else {
          setFormErrors({ form: json.error?.message || 'Failed to save nursing service.' });
        }
      }
    } catch (err) {
      console.error('Error saving nursing service:', err);
      setFormErrors({ form: 'Network error occurred while saving. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Quick Activate/Deactivate Toggle
  const handleToggleActive = async (service: NursingServiceItem) => {
    try {
      const res = await fetch(`${API_BASE_URL}/home-nursing/admin/services/${service.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ active: !service.active }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(`Service "${service.name}" ${!service.active ? 'activated' : 'deactivated'} successfully.`);
        setTimeout(() => setSuccessMsg(null), 3000);
        fetchServices();
        fetchStats();
      } else {
        alert(json.error?.message || 'Could not update status');
      }
    } catch (err) {
      alert('Network error while updating status');
    }
  };

  // Handle Safe Delete / Deactivate Action
  const handleConfirmAction = async () => {
    if (!actionTarget) return;

    try {
      setIsProcessingAction(true);
      const res = await fetch(`${API_BASE_URL}/home-nursing/admin/services/${actionTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (json.success) {
        setActionTarget(null);
        setSuccessMsg(json.message || 'Action executed successfully.');
        setTimeout(() => setSuccessMsg(null), 4000);
        await fetchServices();
        await fetchStats();
      } else {
        alert(json.error?.message || 'Failed to complete action');
      }
    } catch (err) {
      console.error('Action error:', err);
      alert('Network error while performing action.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Nursing Services</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Centrally manage home nursing service catalogue, categories, and hospital network offerings.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchServices}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          title="Refresh services"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="flex items-center gap-2 p-4 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl shadow-xs transition-all">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 p-4 text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-xl shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1 font-medium">{error}</div>
          <button onClick={fetchServices} className="underline text-rose-700 hover:text-rose-900 text-xs font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* KPI Summary Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        <KpiCard
          title="Total Nursing Services"
          value={statsLoading ? '...' : stats.totalNursingServices}
          icon={HeartHandshake}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          subtitle="Centrally defined nursing service types"
        />
        <KpiCard
          title="Total Nurses"
          value={statsLoading ? '...' : stats.totalNurses}
          icon={Users}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          subtitle="Registered active nurses across hospital network"
        />
      </div>

      {/* Search and Action Toolbar */}
      <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 w-full md:max-w-xl">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by service name, description, or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter Dropdown */}
          <div className="shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value as any)}
              className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Add New Service Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAddModal}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={17} />
            <span>Add New Service</span>
          </button>
        </div>
      </div>

      {/* Nursing Services Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-16">S.No.</th>
                <th className="py-3.5 px-4 min-w-[220px]">Service Name</th>
                <th className="py-3.5 px-4 min-w-[280px]">Description</th>
                <th className="py-3.5 px-4 w-36 text-center">Status</th>
                <th className="py-3.5 px-4 w-44 text-center">Hospitals Offering</th>
                <th className="py-3.5 px-4 w-36 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                      <span className="text-sm font-medium text-slate-600">Loading nursing services...</span>
                    </div>
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-center">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                        <HeartHandshake className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-bold text-slate-900">No nursing services found</h3>
                      <p className="text-sm text-slate-500 mt-1">
                        {debouncedSearch
                          ? `No services match your query "${debouncedSearch}". Try a different search term.`
                          : 'Get started by creating your first centrally defined nursing service.'}
                      </p>
                      {debouncedSearch ? (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('ALL');
                          }}
                          className="mt-4 px-3.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          Clear Search
                        </button>
                      ) : (
                        <button
                          onClick={handleOpenAddModal}
                          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                        >
                          <Plus size={14} />
                          Add Service
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                services.map((item, index) => {
                  const serialNumber = (currentPage - 1) * PAGE_SIZE + index + 1;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* S.No. */}
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-500">
                        {serialNumber}
                      </td>

                      {/* Service Name & Icon */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                            <IconImage
                              icon={item.iconUrl || undefined}
                              name={item.name}
                              size="md"
                              rounded="rounded-lg"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 text-sm hover:text-blue-600 transition-colors">
                                {item.name}
                              </span>
                              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                {item.code}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500 block mt-0.5">
                              {item.category || 'Home Nursing'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4">
                        <p
                          className="text-xs text-slate-600 line-clamp-2 leading-relaxed max-w-md"
                          title={item.description}
                        >
                          {item.description}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            item.active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.active ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {item.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Number of Hospitals Offering */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                          <Building2 size={13} className="text-blue-600" />
                          <span>
                            {item.hospitalOfferingsCount}{' '}
                            {item.hospitalOfferingsCount === 1 ? 'Hospital' : 'Hospitals'}
                          </span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Active status */}
                          <button
                            type="button"
                            onClick={() => handleToggleActive(item)}
                            title={item.active ? 'Deactivate Service' : 'Activate Service'}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              item.active
                                ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 border-transparent hover:border-amber-200'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border-transparent hover:border-emerald-200'
                            }`}
                          >
                            <Power size={15} />
                          </button>

                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            title="Edit Service"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 size={15} />
                          </button>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => {
                              setActionTarget(item);
                            }}
                            title="Delete Service"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 size={15} />
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

        {/* Pagination Bar */}
        {totalRecords > 0 && (
          <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-sm text-slate-500 gap-4">
            <div className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-700">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{' '}
              <span className="font-semibold text-slate-700">
                {Math.min(currentPage * PAGE_SIZE, totalRecords)}
              </span>{' '}
              of <span className="font-semibold text-slate-700">{totalRecords}</span> services
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage <= 1 || loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                // Render condensed page buttons if many pages
                if (
                  totalPages <= 6 ||
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  (pageNum === 2 && currentPage > 3) ||
                  (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                ) {
                  return (
                    <span key={pageNum} className="px-1 text-slate-400 text-xs">
                      ...
                    </span>
                  );
                }
                return null;
              })}

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages || loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {isEditing ? 'Edit Nursing Service' : 'Add New Nursing Service'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define central service details available across all network hospitals.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formErrors.form && (
                <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{formErrors.form}</span>
                </div>
              )}

              {/* Service Name (Required) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Service Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Wound Dressing & Bandage Care"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    formErrors.name
                      ? 'border-rose-400 focus:border-rose-500'
                      : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
                {formErrors.name && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {formErrors.name}
                  </p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="Home Nursing">Home Nursing</option>
                  <option value="Specialized Care">Specialized Care</option>
                  <option value="Clinical Procedures">Clinical Procedures</option>
                  <option value="Elderly & Palliative Care">Elderly & Palliative Care</option>
                  <option value="Mother & Baby Care">Mother & Baby Care</option>
                  <option value="Post-Surgical Care">Post-Surgical Care</option>
                </select>
              </div>

              {/* Description (Required) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide comprehensive details of what this nursing service includes, procedures covered, and equipment handled..."
                  value={formDescription}
                  onChange={(e) => {
                    setFormDescription(e.target.value);
                    if (formErrors.description) setFormErrors((prev) => ({ ...prev, description: '' }));
                  }}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    formErrors.description
                      ? 'border-rose-400 focus:border-rose-500'
                      : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
                {formErrors.description && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {formErrors.description}
                  </p>
                )}
              </div>



              {/* Active Status */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Active Status
                </label>
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span className="text-sm font-medium text-slate-700">
                    {formActive ? 'Active (available for hospital offering)' : 'Inactive (hidden from new selection)'}
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmitting && <RefreshCw size={14} className="animate-spin" />}
                  <span>{isEditing ? 'Save Changes' : 'Create Service'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Permanent Delete */}
      {actionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Delete Nursing Service?
                </h3>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                  Are you sure you want to permanently delete <span className="font-semibold text-slate-900">"{actionTarget.name}"</span>?
                </p>
                <div className="mt-3 p-3 bg-rose-50/60 border border-rose-200/80 rounded-xl text-xs text-rose-800 space-y-1">
                  <p className="font-semibold text-rose-900">Warning: Permanent Deletion</p>
                  <p>
                    • This will permanently delete the service, all associated hospital offerings, and related bookings.
                  </p>
                  <p>• This action cannot be undone.</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActionTarget(null)}
                disabled={isProcessingAction}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={isProcessingAction}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
              >
                {isProcessingAction && <RefreshCw size={14} className="animate-spin" />}
                <span>Delete Service</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NursingServices;
