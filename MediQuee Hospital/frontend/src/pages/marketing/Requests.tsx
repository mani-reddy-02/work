import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  HeartPulse, Megaphone, Clock, CheckCircle2, XCircle, ArrowLeft, 
  RefreshCw, Plus, Filter, Calendar, IndianRupee, MapPin, Stethoscope, 
  MessageSquare, Sparkles, Building2, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminApi, type MarketingRequestRecord, type MedicalCampRecord } from '@/services/adminApi';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

type FilterTab = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

interface UnifiedRequest {
  id: string;
  type: 'MARKETING' | 'CAMP' | 'INQUIRY';
  title: string;
  category: string;
  referenceId: string;
  submittedAt: string;
  status: 'PENDING' | 'REVIEWING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
  budget?: number | null;
  location?: string;
  expectedDate?: string;
  specialties?: string[];
  notes?: string | null;
  doctorName?: string | null;
}

export function Requests() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, role } = useAuth();
  const isDoctor = role === 'doctor';
  const [camps, setCamps] = useState<MedicalCampRecord[]>([]);
  const [marketing, setMarketing] = useState<MarketingRequestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getHospitalRequests();
      setCamps(data.campRequests || []);
      setMarketing(data.marketingRequests || []);
    } catch (err: any) {
      toast(err.message || 'Failed to load requests', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Combine and normalize both marketing and medical camp requests into unified records
  const unifiedRequests = useMemo<UnifiedRequest[]>(() => {
    const list: UnifiedRequest[] = [];

    // Marketing & Platform Requests
    marketing.forEach((m) => {
      const isPlatformInquiry = m.campaignType?.startsWith('PLATFORM_INQUIRY:');

      // If user is a Doctor, only show requests submitted by this doctor
      // Exclude platform inquiries (hospital-level) and other doctors' requests
      if (isDoctor) {
        if (isPlatformInquiry) return;
        const matchesId = m.doctorId && user?.id && m.doctorId === user.id;
        const matchesName = m.doctorName && user?.name && 
          (m.doctorName.toLowerCase().includes(user.name.toLowerCase()) || 
           user.name.toLowerCase().includes(m.doctorName.toLowerCase()));
        const notesMatch = m.notes && user?.name && m.notes.toLowerCase().includes(user.name.toLowerCase());

        if (!matchesId && !matchesName && !notesMatch) {
          return;
        }
      }

      const cleanTitle = isPlatformInquiry 
        ? m.campaignType.replace('PLATFORM_INQUIRY:', '').trim()
        : (m.campaignType || 'Hospital Marketing & Visibility Campaign');

      list.push({
        id: m.id,
        type: isPlatformInquiry ? 'INQUIRY' : 'MARKETING',
        title: cleanTitle,
        category: isPlatformInquiry 
          ? 'Platform Inquiry & Integration' 
          : (isDoctor ? 'Doctor Branding & Promotion' : 'Marketing & Promotional Campaign'),
        referenceId: `REQ-${m.id.slice(0, 8).toUpperCase()}`,
        submittedAt: m.createdAt,
        status: m.status as any,
        budget: m.budget,
        notes: m.notes,
        doctorName: m.doctorName,
      });
    });

    // Medical Camp Requests (only for hospital admins, never for doctors)
    if (!isDoctor) {
      camps.forEach((c) => {
        list.push({
          id: c.id,
          type: 'CAMP',
          title: c.campTitle || 'Community Health & Medical Camp',
          category: 'Medical & Health Camp',
          referenceId: `CMP-${c.id.slice(0, 8).toUpperCase()}`,
          submittedAt: c.createdAt,
          status: c.status as any,
          location: c.location,
          expectedDate: c.expectedDate,
          specialties: c.specialties,
          notes: c.notes,
        });
      });
    }

    // Sort by latest submitted date
    return list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [marketing, camps, isDoctor, user]);

  // Filtered list based on active tab
  const filteredRequests = useMemo(() => {
    return unifiedRequests.filter((req) => {
      if (activeTab === 'ALL') return true;
      if (activeTab === 'PENDING') return req.status === 'PENDING' || req.status === 'REVIEWING';
      if (activeTab === 'APPROVED') return req.status === 'APPROVED' || req.status === 'COMPLETED';
      if (activeTab === 'REJECTED') return req.status === 'REJECTED';
      return true;
    });
  }, [unifiedRequests, activeTab]);

  // Counts for filter pills
  const counts = useMemo(() => {
    return {
      all: unifiedRequests.length,
      pending: unifiedRequests.filter(r => r.status === 'PENDING' || r.status === 'REVIEWING').length,
      approved: unifiedRequests.filter(r => r.status === 'APPROVED' || r.status === 'COMPLETED').length,
      rejected: unifiedRequests.filter(r => r.status === 'REJECTED').length,
    };
  }, [unifiedRequests]);

  const getStatusBadge = (status: UnifiedRequest['status']) => {
    switch (status) {
      case 'PENDING':
        return {
          label: 'Pending Review',
          className: 'bg-amber-50 text-amber-700 border-amber-200/80',
          icon: Clock,
        };
      case 'REVIEWING':
        return {
          label: 'In Review',
          className: 'bg-blue-50 text-blue-700 border-blue-200/80',
          icon: Clock,
        };
      case 'APPROVED':
        return {
          label: 'Approved & Active',
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          icon: CheckCircle2,
        };
      case 'COMPLETED':
        return {
          label: 'Active / Fulfilled',
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          icon: CheckCircle2,
        };
      case 'REJECTED':
        return {
          label: 'Rejected',
          className: 'bg-red-50 text-red-700 border-red-200/80',
          icon: XCircle,
        };
      default:
        return {
          label: status,
          className: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: Clock,
        };
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

  return (
    <div className="flex flex-col bg-background min-h-[calc(100vh-80px)] pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-border shadow-xs px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => navigate('/profile')}
            className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-muted hover:text-foreground cursor-pointer"
            title="Back to Profile"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">My Requests</h1>
            <p className="text-xs text-muted">
              {isDoctor 
                ? "Doctor branding, reels & appointment campaign requests" 
                : "Marketing campaigns, medical camps & platform requests"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchRequests}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-muted hover:text-foreground cursor-pointer disabled:opacity-50"
            title="Refresh requests"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin text-[#1769E0]")} />
          </button>
          <button
            type="button"
            onClick={() => navigate('/book-marketing')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1769E0] hover:bg-[#1255b8] text-white text-xs font-semibold rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Request</span>
          </button>
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto w-full flex flex-col gap-5 mt-2">
        {/* Filter Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5",
              activeTab === 'ALL'
                ? "bg-[#1769E0] text-white shadow-sm"
                : "bg-surface hover:bg-gray-100 dark:hover:bg-gray-800 text-muted border border-border"
            )}
          >
            <span>All Requests</span>
            <span className={cn(
              "px-1.5 py-0.2 rounded-md text-[10px]",
              activeTab === 'ALL' ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-gray-800 text-muted"
            )}>
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PENDING')}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5",
              activeTab === 'PENDING'
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-surface hover:bg-gray-100 dark:hover:bg-gray-800 text-muted border border-border"
            )}
          >
            <span>Pending</span>
            <span className={cn(
              "px-1.5 py-0.2 rounded-md text-[10px]",
              activeTab === 'PENDING' ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-gray-800 text-muted"
            )}>
              {counts.pending}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('APPROVED')}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5",
              activeTab === 'APPROVED'
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-surface hover:bg-gray-100 dark:hover:bg-gray-800 text-muted border border-border"
            )}
          >
            <span>Approved / Active</span>
            <span className={cn(
              "px-1.5 py-0.2 rounded-md text-[10px]",
              activeTab === 'APPROVED' ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-gray-800 text-muted"
            )}>
              {counts.approved}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('REJECTED')}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5",
              activeTab === 'REJECTED'
                ? "bg-red-600 text-white shadow-sm"
                : "bg-surface hover:bg-gray-100 dark:hover:bg-gray-800 text-muted border border-border"
            )}
          >
            <span>Rejected</span>
            <span className={cn(
              "px-1.5 py-0.2 rounded-md text-[10px]",
              activeTab === 'REJECTED' ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-gray-800 text-muted"
            )}>
              {counts.rejected}
            </span>
          </button>
        </div>

        {/* Loading Spinner */}
        {isLoading && unifiedRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-surface rounded-2xl border border-border shadow-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1769E0] mb-3"></div>
            <p className="text-xs text-muted">Fetching live platform requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          /* Empty State */
          <div className="bg-surface rounded-3xl p-10 text-center border border-border shadow-sm flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#1769E0] flex items-center justify-center mb-4">
              <Megaphone className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              {activeTab === 'ALL' ? 'No requests submitted yet' : `No ${activeTab.toLowerCase()} requests`}
            </h3>
            <p className="text-xs text-muted max-w-sm mt-1.5 mb-6">
              {isDoctor
                ? "Promote your OPD practice, create doctor reels, or boost patient appointments with targeted marketing campaigns."
                : "Promote your hospital doctors, boost OPD footfall with marketing campaigns, or organize community medical camps."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/book-marketing')}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1769E0] hover:bg-[#1255b8] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Megaphone className="w-4 h-4" />
                <span>{isDoctor ? 'Book Doctor Marketing' : 'Book Marketing Campaign'}</span>
              </button>
              {!isDoctor && (
                <button
                  type="button"
                  onClick={() => navigate('/book-camp')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  <HeartPulse className="w-4 h-4" />
                  <span>Organize Medical Camp</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Request Cards */
          <div className="flex flex-col gap-4">
            {filteredRequests.map((req) => {
              const badge = getStatusBadge(req.status);
              const BadgeIcon = badge.icon;

              return (
                <div 
                  key={req.id} 
                  className="bg-surface rounded-2xl p-5 border border-border hover:border-[#1769E0]/40 transition-all shadow-sm flex flex-col gap-4"
                >
                  {/* Top Bar: Icon, Title, ID, and Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div className={cn(
                        "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm",
                        req.type === 'CAMP' 
                          ? "bg-purple-50 text-purple-600 border border-purple-100" 
                          : req.type === 'INQUIRY'
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : "bg-blue-50 text-[#1769E0] border border-blue-100"
                      )}>
                        {req.type === 'CAMP' ? (
                          <HeartPulse className="w-5 h-5" />
                        ) : req.type === 'INQUIRY' ? (
                          <Building2 className="w-5 h-5" />
                        ) : (
                          <Megaphone className="w-5 h-5" />
                        )}
                      </div>

                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-bold tracking-wider uppercase text-muted">
                            {req.category}
                          </span>
                          <span className="text-muted/60">•</span>
                          <span className="font-mono text-[11px] font-semibold text-foreground bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                            {req.referenceId}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-foreground mt-0.5">
                          {req.title}
                        </h3>
                      </div>
                    </div>

                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 shrink-0 shadow-2xs",
                      badge.className
                    )}>
                      <BadgeIcon className="w-3.5 h-3.5" />
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  {/* Metadata Chips: Budget, Date, Doctor, Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2 border-t border-border/60 text-xs">
                    <div className="flex items-center gap-2 text-muted">
                      <Clock className="w-3.5 h-3.5 text-muted/70 shrink-0" />
                      <span>Submitted: <strong className="text-foreground font-medium">{formatDateTime(req.submittedAt)}</strong></span>
                    </div>

                    {req.budget !== undefined && req.budget !== null && (
                      <div className="flex items-center gap-2 text-muted">
                        <IndianRupee className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Budget: <strong className="text-foreground font-bold font-mono">₹{req.budget.toLocaleString('en-IN')}</strong></span>
                      </div>
                    )}

                    {req.doctorName && (
                      <div className="flex items-center gap-2 text-muted">
                        <Stethoscope className="w-3.5 h-3.5 text-[#1769E0] shrink-0" />
                        <span>Doctor: <strong className="text-foreground font-semibold">Dr. {req.doctorName}</strong></span>
                      </div>
                    )}

                    {req.location && (
                      <div className="flex items-center gap-2 text-muted sm:col-span-2">
                        <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <span>Location: <strong className="text-foreground font-medium">{req.location}</strong></span>
                      </div>
                    )}

                    {req.expectedDate && (
                      <div className="flex items-center gap-2 text-muted">
                        <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>Target Date: <strong className="text-foreground font-medium">{formatDateTime(req.expectedDate)}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Notes / Details Description */}
                  {req.notes && (
                    <div className="bg-gray-50/70 dark:bg-gray-900/30 rounded-xl p-3 border border-border/50 text-xs text-foreground/80 leading-relaxed">
                      <div className="font-semibold text-muted text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3" />
                        Details & Specifics:
                      </div>
                      <p className="whitespace-pre-line">{req.notes}</p>
                    </div>
                  )}

                  {/* Specialties Pills for Camps */}
                  {req.specialties && req.specialties.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-muted">Specialties:</span>
                      {req.specialties.map((spec, i) => (
                        <span key={i} className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-[11px] rounded-md font-medium">
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
