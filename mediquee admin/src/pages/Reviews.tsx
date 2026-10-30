import React, { useState, useEffect, useCallback } from 'react';
import { 
  Star, MessageSquare, AlertTriangle, ShieldCheck, CheckCircle2, 
  Clock, Search, Filter, RefreshCw, X, Eye, Check, Ban, Flag,
  Building2, Stethoscope, FlaskConical, TrendingUp, AlertCircle,
  ThumbsUp, UserCheck, ShieldAlert, Send
} from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';
import KpiCard from '../components/ui/KpiCard';
import StatusBadge from '../components/ui/StatusBadge';
import { 
  reviewService, 
  type AdminReviewItem, 
  type AdminReviewAnalytics 
} from '../services/reviewService';

export const Reviews: React.FC = () => {
  const { token, adminUser } = useAdminAuth();

  const [activeTab, setActiveTab] = useState<'ALL' | 'QUEUE' | 'RESPONSES' | 'REPORTS' | 'ANALYTICS'>('QUEUE');
  const [analytics, setAnalytics] = useState<AdminReviewAnalytics | null>(null);
  const [reviews, setReviews] = useState<AdminReviewItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, totalCount: 0, totalPages: 1 });

  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTargetType, setSelectedTargetType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedRating, setSelectedRating] = useState<string>('ALL');
  const [onlyVerified, setOnlyVerified] = useState<boolean>(false);

  // Modals
  const [inspectingReview, setInspectingReview] = useState<AdminReviewItem | null>(null);
  
  // Action Modal (Reject / Remove / Flag)
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    reviewId: string;
    action: 'REJECT' | 'REMOVE' | 'FLAG';
    reason: string;
    isSubmitting: boolean;
  }>({
    isOpen: false,
    reviewId: '',
    action: 'REJECT',
    reason: '',
    isSubmitting: false,
  });

  // Response Moderation Modal
  const [responseModal, setResponseModal] = useState<{
    isOpen: boolean;
    review: AdminReviewItem | null;
    action: 'APPROVE' | 'REJECT';
    reason: string;
    isSubmitting: boolean;
  }>({
    isOpen: false,
    review: null,
    action: 'APPROVE',
    reason: '',
    isSubmitting: false,
  });

  // Report Resolution Modal
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    reportId: string;
    resolution: 'RESOLVED' | 'DISMISSED';
    notes: string;
    isSubmitting: boolean;
  }>({
    isOpen: false,
    reportId: '',
    resolution: 'RESOLVED',
    notes: '',
    isSubmitting: false,
  });

  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingAnalytics(true);
      const data = await reviewService.getAdminAnalytics(token);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load admin review analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [token]);

  const fetchReviews = useCallback(async (page = 1) => {
    if (!token) return;
    try {
      setLoadingReviews(true);

      let statusParam: string | undefined = undefined;
      let hasReportsParam: boolean | undefined = undefined;

      if (activeTab === 'QUEUE') {
        statusParam = 'PENDING';
      } else if (activeTab === 'REPORTS') {
        hasReportsParam = true;
      } else if (selectedStatus !== 'ALL') {
        statusParam = selectedStatus;
      }

      const res = await reviewService.getAdminReviews(token, {
        targetType: selectedTargetType === 'ALL' ? undefined : selectedTargetType,
        status: statusParam,
        rating: selectedRating === 'ALL' ? undefined : Number(selectedRating),
        search: searchQuery.trim() || undefined,
        isVerified: onlyVerified ? true : undefined,
        hasReports: hasReportsParam,
        page,
        limit: 12,
      });

      setReviews(res.reviews);
      setPagination(res.pagination);
    } catch (err: any) {
      console.error('Failed to fetch reviews:', err);
      setFeedbackMessage({ type: 'error', text: err.message || 'Error fetching reviews' });
    } finally {
      setLoadingReviews(false);
    }
  }, [token, activeTab, selectedTargetType, selectedStatus, selectedRating, onlyVerified, searchQuery]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    fetchReviews(1);
  }, [fetchReviews]);

  // Handle Approve Action directly
  const handleApprove = async (reviewId: string) => {
    if (!token) return;
    try {
      await reviewService.moderateReview(token, reviewId, 'APPROVE');
      setFeedbackMessage({ type: 'success', text: 'Review approved and published to live profile!' });
      if (inspectingReview?.id === reviewId) {
        setInspectingReview(null);
      }
      fetchReviews(pagination.page);
      fetchAnalytics();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to approve review' });
    }
  };

  // Submit Action (Reject / Remove / Flag)
  const handleSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !actionModal.reviewId || !actionModal.reason.trim()) return;

    setActionModal(prev => ({ ...prev, isSubmitting: true }));
    try {
      await reviewService.moderateReview(
        token, 
        actionModal.reviewId, 
        actionModal.action, 
        actionModal.reason.trim()
      );
      setFeedbackMessage({
        type: 'success',
        text: `Review marked as ${actionModal.action.toLowerCase()}ed with documented reason.`
      });
      setActionModal({ isOpen: false, reviewId: '', action: 'REJECT', reason: '', isSubmitting: false });
      if (inspectingReview?.id === actionModal.reviewId) {
        setInspectingReview(null);
      }
      fetchReviews(pagination.page);
      fetchAnalytics();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Action failed' });
      setActionModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  // Submit Provider Response Moderation
  const handleSubmitResponseModeration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !responseModal.review?.response) return;

    setResponseModal(prev => ({ ...prev, isSubmitting: true }));
    try {
      await reviewService.moderateResponse(
        token,
        responseModal.review.response.id,
        responseModal.action,
        responseModal.reason.trim() || undefined
      );
      setFeedbackMessage({
        type: 'success',
        text: `Provider response ${responseModal.action === 'APPROVE' ? 'approved and published' : 'rejected'}.`
      });
      setResponseModal({ isOpen: false, review: null, action: 'APPROVE', reason: '', isSubmitting: false });
      fetchReviews(pagination.page);
      fetchAnalytics();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to moderate response' });
      setResponseModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  // Submit Report Resolution
  const handleSubmitReportResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !reportModal.reportId) return;

    setReportModal(prev => ({ ...prev, isSubmitting: true }));
    try {
      await reviewService.resolveReport(
        token,
        reportModal.reportId,
        reportModal.resolution,
        reportModal.notes.trim() || undefined
      );
      setFeedbackMessage({
        type: 'success',
        text: `Dispute report marked as ${reportModal.resolution.toLowerCase()}.`
      });
      setReportModal({ isOpen: false, reportId: '', resolution: 'RESOLVED', notes: '', isSubmitting: false });
      fetchReviews(pagination.page);
      fetchAnalytics();
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to update report' });
      setReportModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const getTargetIcon = (targetType: string) => {
    switch (targetType) {
      case 'DOCTOR': return <Stethoscope className="w-4 h-4 text-blue-600" />;
      case 'HOSPITAL': return <Building2 className="w-4 h-4 text-emerald-600" />;
      case 'LABORATORY': return <FlaskConical className="w-4 h-4 text-purple-600" />;
      default: return <Star className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Reviews & Ratings Management</h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Central Verification & Moderation
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Authoritative ratings governance, transaction-backed patient feedback moderation, and provider dispute resolution.
          </p>
        </div>

        <button
          onClick={() => { fetchAnalytics(); fetchReviews(pagination.page); }}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Feedback Toast Banner */}
      {feedbackMessage && (
        <div className={`p-4 rounded-xl flex items-center justify-between border ${
          feedbackMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className="flex items-center gap-2 text-sm font-medium">
            {feedbackMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            {feedbackMessage.text}
          </div>
          <button 
            onClick={() => setFeedbackMessage(null)}
            className="p-1 rounded hover:bg-black/5 text-current"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Reviews"
          value={analytics?.metrics.totalReviews || 0}
          icon={MessageSquare}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          subtitle={`${analytics?.metrics.publishedReviews || 0} published live across profiles`}
        />

        <KpiCard
          title="Moderation Queue"
          value={analytics?.metrics.moderationQueueCount || 0}
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          subtitle={`${analytics?.metrics.pendingReviews || 0} pending review + ${analytics?.metrics.flaggedReviews || 0} flagged`}
          onClick={() => setActiveTab('QUEUE')}
          className="cursor-pointer border-amber-200"
        />

        <KpiCard
          title="Disputes & Reports"
          value={analytics?.metrics.reportedReviews || 0}
          icon={AlertTriangle}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
          subtitle={`${analytics?.metrics.pendingResponsesCount || 0} provider responses awaiting approval`}
          onClick={() => setActiveTab('REPORTS')}
          className="cursor-pointer border-rose-200"
        />

        <KpiCard
          title="Network Averages"
          value={
            analytics?.metrics.averageHospitalRating 
              ? `${analytics.metrics.averageHospitalRating} ★` 
              : 'No ratings'
          }
          icon={Star}
          iconColor="text-amber-500"
          iconBg="bg-amber-50"
          subtitle={`Doctors: ${analytics?.metrics.averageDoctorRating ? `${analytics.metrics.averageDoctorRating} ★` : '—'} • Labs: ${analytics?.metrics.averageLaboratoryRating ? `${analytics.metrics.averageLaboratoryRating} ★` : '—'}`}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
        {[
          { key: 'QUEUE', label: `Moderation Queue (${analytics?.metrics.moderationQueueCount || 0})`, icon: Clock },
          { key: 'ALL', label: 'All Reviews', icon: MessageSquare },
          { key: 'RESPONSES', label: `Provider Responses (${analytics?.metrics.pendingResponsesCount || 0})`, icon: Send },
          { key: 'REPORTS', label: `Dispute Reports (${analytics?.metrics.reportedReviews || 0})`, icon: AlertTriangle },
          { key: 'ANALYTICS', label: 'Platform Analytics', icon: TrendingUp },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: QUEUE / ALL / REPORTS */}
      {activeTab !== 'ANALYTICS' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by patient name, review text, hospital, doctor..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') fetchReviews(1); }}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Target Type Filter */}
              <select
                value={selectedTargetType}
                onChange={e => setSelectedTargetType(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none"
              >
                <option value="ALL">All Entities</option>
                <option value="DOCTOR">Doctors</option>
                <option value="HOSPITAL">Hospitals</option>
                <option value="LABORATORY">Laboratories</option>
              </select>

              {/* Status Filter (only if on ALL tab) */}
              {activeTab === 'ALL' && (
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending Approval</option>
                  <option value="APPROVED">Published</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="FLAGGED">Flagged</option>
                  <option value="REMOVED">Removed</option>
                </select>
              )}

              {/* Star Rating Filter */}
              <select
                value={selectedRating}
                onChange={e => setSelectedRating(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none"
              >
                <option value="ALL">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>

              {/* Verified Toggle */}
              <label className="flex items-center gap-1.5 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyVerified}
                  onChange={e => setOnlyVerified(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                Verified Only
              </label>

              <button
                onClick={() => fetchReviews(1)}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
              >
                Filter
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5">Review Target</th>
                    <th className="px-4 py-3.5">Patient</th>
                    <th className="px-4 py-3.5">Rating & Feedback</th>
                    <th className="px-4 py-3.5">Transaction</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Response</th>
                    <th className="px-4 py-3.5 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingReviews ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
                        Loading reviews...
                      </td>
                    </tr>
                  ) : reviews.length > 0 ? (
                    reviews.map(review => {
                      const targetName = review.targetType === 'DOCTOR'
                        ? (review.doctor?.name ? `Dr. ${review.doctor.name}` : 'Doctor')
                        : (review.hospital?.name || 'Hospital / Lab');

                      return (
                        <tr key={review.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Target */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-lg bg-slate-100 shrink-0">
                                {getTargetIcon(review.targetType)}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900">{targetName}</div>
                                <div className="text-xs text-slate-400 flex items-center gap-1">
                                  <span>{review.targetType}</span>
                                  {review.hospital && <span>• {review.hospital.name}</span>}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Patient */}
                          <td className="px-4 py-3.5">
                            <div>
                              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                {review.isAnonymous ? 'Anonymous Patient' : review.user?.name || 'Verified Patient'}
                                {review.isVerified && (
                                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" title="Verified Transaction" />
                                )}
                              </div>
                              <div className="text-xs text-slate-400">
                                {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </div>
                            </div>
                          </td>

                          {/* Rating & Feedback */}
                          <td className="px-4 py-3.5 max-w-xs">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="font-bold text-slate-900">{review.rating}</span>
                              <div className="flex text-amber-400">
                                {[1, 2, 3, 4, 5].map(s => (
                                  <Star 
                                    key={s} 
                                    className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="text-xs text-slate-700 truncate">
                              {review.title && <strong className="mr-1">{review.title}:</strong>}
                              {review.comment || <span className="italic text-slate-400">No written text</span>}
                            </div>
                          </td>

                          {/* Transaction */}
                          <td className="px-4 py-3.5">
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              {review.bookingType.replace('_', ' ')}
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {review.bookingId.slice(0, 8)}...
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5">
                            <StatusBadge status={review.status} />
                            {review.reports && review.reports.length > 0 && (
                              <div className="text-[10px] text-rose-600 font-semibold flex items-center gap-1 mt-1">
                                <AlertTriangle className="w-3 h-3" />
                                {review.reports.length} Dispute Flag(s)
                              </div>
                            )}
                          </td>

                          {/* Response Status */}
                          <td className="px-4 py-3.5">
                            {review.response ? (
                              <button
                                onClick={() => setResponseModal({
                                  isOpen: true,
                                  review,
                                  action: 'APPROVE',
                                  reason: '',
                                  isSubmitting: false,
                                })}
                                className={`text-xs px-2 py-1 rounded-lg border font-medium ${
                                  review.response.status === 'APPROVED'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : review.response.status === 'PENDING'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                {review.response.status === 'PENDING' ? 'Review Response' : `Response ${review.response.status}`}
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => setInspectingReview(review)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors"
                              title="Inspect Full Review"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {review.status !== 'APPROVED' && (
                              <button
                                onClick={() => handleApprove(review.id)}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-colors"
                                title="Approve & Publish"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}

                            {review.status !== 'REJECTED' && (
                              <button
                                onClick={() => setActionModal({
                                  isOpen: true,
                                  reviewId: review.id,
                                  action: review.status === 'APPROVED' ? 'REMOVE' : 'REJECT',
                                  reason: '',
                                  isSubmitting: false,
                                })}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                                title={review.status === 'APPROVED' ? 'Remove Published Review' : 'Reject with Reason'}
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}

                            {review.status !== 'FLAGGED' && (
                              <button
                                onClick={() => setActionModal({
                                  isOpen: true,
                                  reviewId: review.id,
                                  action: 'FLAG',
                                  reason: '',
                                  isSubmitting: false,
                                })}
                                className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 border border-transparent hover:border-purple-200 transition-colors"
                                title="Flag for Investigation"
                              >
                                <Flag className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        No reviews found matching the current criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
                <div>
                  Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total records)
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => fetchReviews(pagination.page - 1)}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 font-medium"
                  >
                    Previous
                  </button>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => fetchReviews(pagination.page + 1)}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: ANALYTICS TAB */}
      {activeTab === 'ANALYTICS' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rating Distribution */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">Overall Rating Distribution</h3>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map(stars => {
                  const count = analytics.distribution[stars] || 0;
                  const pct = analytics.metrics.publishedReviews > 0
                    ? Math.round((count / analytics.metrics.publishedReviews) * 100)
                    : 0;

                  return (
                    <div key={stars} className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1 w-14 font-medium text-slate-700">
                        <span>{stars}</span>
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      </div>
                      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-14 text-right text-xs text-slate-500 font-medium">
                        {count} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monthly Trend Volume */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">Monthly Review Volume & Averages</h3>
              <div className="space-y-3">
                {analytics.monthlyTrends.map(item => (
                  <div key={item.month} className="flex items-center justify-between text-sm py-2 border-b border-slate-100 last:border-none">
                    <span className="font-semibold text-slate-800">{item.month}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-500">{item.volume} reviews</span>
                      <div className="flex items-center gap-1 font-bold text-slate-900">
                        <span>{item.averageRating > 0 ? item.averageRating.toFixed(1) : '—'}</span>
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Rated Lists */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Top Doctors */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Stethoscope className="w-4 h-4 text-blue-600" />
                Top Rated Doctors
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {analytics.topDoctors.length > 0 ? (
                  analytics.topDoctors.map((doc: any) => (
                    <div key={doc.id} className="py-2.5 flex items-center justify-between">
                      <span className="font-medium text-slate-800 truncate max-w-[150px]">Doctor ID: {doc.targetId.slice(0, 8)}</span>
                      <div className="flex items-center gap-1 font-bold text-slate-900">
                        {doc.averageRating.toFixed(1)} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-slate-400 font-normal">({doc.totalReviews})</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-slate-400 text-center">No doctor aggregates yet.</div>
                )}
              </div>
            </div>

            {/* Top Hospitals */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Building2 className="w-4 h-4 text-emerald-600" />
                Top Rated Hospitals
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {analytics.topHospitals.length > 0 ? (
                  analytics.topHospitals.map((hosp: any) => (
                    <div key={hosp.id} className="py-2.5 flex items-center justify-between">
                      <span className="font-medium text-slate-800 truncate max-w-[150px]">Hospital: {hosp.targetId.slice(0, 8)}</span>
                      <div className="flex items-center gap-1 font-bold text-slate-900">
                        {hosp.averageRating.toFixed(1)} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-slate-400 font-normal">({hosp.totalReviews})</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-slate-400 text-center">No hospital aggregates yet.</div>
                )}
              </div>
            </div>

            {/* Top Labs */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <FlaskConical className="w-4 h-4 text-purple-600" />
                Top Rated Laboratories
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {analytics.topLaboratories.length > 0 ? (
                  analytics.topLaboratories.map((lab: any) => (
                    <div key={lab.id} className="py-2.5 flex items-center justify-between">
                      <span className="font-medium text-slate-800 truncate max-w-[150px]">Lab: {lab.targetId.slice(0, 8)}</span>
                      <div className="flex items-center gap-1 font-bold text-slate-900">
                        {lab.averageRating.toFixed(1)} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-slate-400 font-normal">({lab.totalReviews})</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-slate-400 text-center">No laboratory aggregates yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: INSPECT FULL REVIEW & AUDIT LOGS */}
      {inspectingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Review Inspection & Audit Trail</h3>
                <p className="text-xs text-slate-400 font-mono">ID: {inspectingReview.id}</p>
              </div>
              <button 
                onClick={() => setInspectingReview(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl text-xs border border-slate-100">
              <div>
                <span className="text-slate-400 block">Target Entity</span>
                <span className="font-semibold text-slate-800">{inspectingReview.targetType}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Service / Booking</span>
                <span className="font-semibold text-slate-800">{inspectingReview.bookingType.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Verification Status</span>
                <span className="font-semibold text-emerald-600">
                  {inspectingReview.isVerified ? '✓ Verified Booking' : 'Unverified'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Patient Name</span>
                <span className="font-semibold text-slate-800">{inspectingReview.user?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Patient Phone (Admin Only)</span>
                <span className="font-semibold text-slate-800 font-mono">{inspectingReview.user?.phone || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Submission Date</span>
                <span className="font-semibold text-slate-800">
                  {new Date(inspectingReview.createdAt).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Ratings & Written Content */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-extrabold text-slate-900">{inspectingReview.rating}</span>
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star 
                        key={s} 
                        className={`w-5 h-5 ${s <= inspectingReview.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                      />
                    ))}
                  </div>
                </div>
                <StatusBadge status={inspectingReview.status} />
              </div>

              {inspectingReview.title && (
                <div className="font-bold text-slate-900 text-sm">
                  {inspectingReview.title}
                </div>
              )}

              <p className="text-sm text-slate-700 bg-slate-50/70 p-3 rounded-xl border border-slate-100 leading-relaxed">
                {inspectingReview.comment || <span className="italic text-slate-400">No written comment provided.</span>}
              </p>

              {/* Category Dimension Ratings */}
              {inspectingReview.categoryRatings && Object.keys(inspectingReview.categoryRatings).length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Category Ratings</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(inspectingReview.categoryRatings).map(([key, val]) => (
                      <div key={key} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-slate-600 font-medium">{key.replace(/([A-Z])/g, ' $1')}:</span>
                        <span className="font-bold text-slate-900">{val} ★</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Moderation Logs (Full Audit Trail) */}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Moderation Audit History</h4>
              {inspectingReview.moderationLogs && inspectingReview.moderationLogs.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {inspectingReview.moderationLogs.map(log => (
                    <div key={log.id} className="text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-slate-800">
                          {log.action} by {log.admin.name}
                        </div>
                        {log.reason && (
                          <div className="text-slate-600 mt-0.5">Reason: "{log.reason}"</div>
                        )}
                      </div>
                      <span className="text-slate-400 shrink-0">
                        {new Date(log.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 p-2 bg-slate-50 rounded-lg">No previous moderation actions recorded.</div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => setInspectingReview(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Close
              </button>

              <div className="flex gap-2">
                {inspectingReview.status !== 'APPROVED' && (
                  <button
                    onClick={() => handleApprove(inspectingReview.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Approve & Publish
                  </button>
                )}

                {inspectingReview.status !== 'REJECTED' && (
                  <button
                    onClick={() => setActionModal({
                      isOpen: true,
                      reviewId: inspectingReview.id,
                      action: inspectingReview.status === 'APPROVED' ? 'REMOVE' : 'REJECT',
                      reason: '',
                      isSubmitting: false,
                    })}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    {inspectingReview.status === 'APPROVED' ? 'Remove' : 'Reject'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REJECT / REMOVE / FLAG REASON MODAL */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  {actionModal.action === 'REJECT' && 'Reject Review Submission'}
                  {actionModal.action === 'REMOVE' && 'Remove Published Review'}
                  {actionModal.action === 'FLAG' && 'Flag Review for Investigation'}
                </h3>
              </div>
              <button 
                onClick={() => setActionModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              {actionModal.action === 'REJECT' && 'Specify the policy rationale for rejecting this review. This reason will be recorded in the audit trail and sent to the patient.'}
              {actionModal.action === 'REMOVE' && 'Reviews must only be removed for documented policy violations (e.g., abusive language, private data exposure). Do not remove reviews solely for being critical.'}
              {actionModal.action === 'FLAG' && 'Document why this review requires senior administrative review or provider fact-checking.'}
            </p>

            <form onSubmit={handleSubmitAction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Documented Reason (Mandatory)
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g., Violates communication standards, contains promotional links, or contains confidential third-party medical information..."
                  value={actionModal.reason}
                  onChange={e => setActionModal(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionModal.isSubmitting || !actionModal.reason.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all disabled:opacity-50"
                >
                  <Ban className="w-3.5 h-3.5" />
                  {actionModal.isSubmitting ? 'Recording...' : `Confirm ${actionModal.action}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PROVIDER RESPONSE MODERATION MODAL */}
      {responseModal.isOpen && responseModal.review?.response && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Moderate Provider Official Response</h3>
              </div>
              <button 
                onClick={() => setResponseModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5 border border-slate-100">
              <span className="text-slate-400 block">Submitted Response Statement:</span>
              <p className="text-slate-800 font-medium italic">"{responseModal.review.response.response}"</p>
              <div className="text-[11px] text-slate-500 pt-1">
                Submitted by: {responseModal.review.response.responder?.name || 'Healthcare Staff'} ({responseModal.review.response.responder?.role || 'Provider'})
              </div>
            </div>

            <form onSubmit={handleSubmitResponseModeration} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Moderation Decision
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 p-3 border rounded-xl flex-1 cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="responseAction"
                      checked={responseModal.action === 'APPROVE'}
                      onChange={() => setResponseModal(prev => ({ ...prev, action: 'APPROVE' }))}
                      className="text-emerald-600"
                    />
                    <span className="text-xs font-semibold text-emerald-700">Approve & Publish Response</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 border rounded-xl flex-1 cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="responseAction"
                      checked={responseModal.action === 'REJECT'}
                      onChange={() => setResponseModal(prev => ({ ...prev, action: 'REJECT' }))}
                      className="text-rose-600"
                    />
                    <span className="text-xs font-semibold text-rose-700">Reject Response</span>
                  </label>
                </div>
              </div>

              {responseModal.action === 'REJECT' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rejection Feedback (Provided to Hospital)
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Explain why this response cannot be published (e.g. contains patient private medical details)..."
                    value={responseModal.reason}
                    onChange={e => setResponseModal(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResponseModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={responseModal.isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
                >
                  <Check className="w-3.5 h-3.5" />
                  {responseModal.isSubmitting ? 'Saving...' : 'Save Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;
