import React, { useState, useEffect, useCallback } from 'react';
import {
  Star,
  Building2,
  Stethoscope,
  Search,
  Filter,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  X,
  FileText
} from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';
import { reviewService, type AdminReviewItem, type AdminReviewStats } from '../services/reviewService';
import KpiCard from '../components/ui/KpiCard';

const SERVICE_LABELS: Record<string, string> = {
  OP_CONSULTATION: 'OP Consultation',
  VIDEO_CONSULTATION: 'Video Consultation',
  LAB_TEST: 'Lab Test',
  HOME_SAMPLE_COLLECTION: 'Home Sample',
  HOME_NURSING: 'Home Nursing'
};

const Reviews: React.FC = () => {
  const { token } = useAdminAuth();

  // State
  const [reviews, setReviews] = useState<AdminReviewItem[]>([]);
  const [stats, setStats] = useState<AdminReviewStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState<string>('');
  const [targetType, setTargetType] = useState<string>('ALL');
  const [serviceType, setServiceType] = useState<string>('ALL');
  const [ratingFilter, setRatingFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const limit = 15;

  // Selected Review for Modal
  const [selectedReview, setSelectedReview] = useState<AdminReviewItem | null>(null);
  const [isModerating, setIsModerating] = useState<boolean>(false);
  const [moderationNotes, setModerationNotes] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    setStatsLoading(true);
    try {
      const res = await reviewService.getAdminReviewStats(token);
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setStatsLoading(false);
    }
  }, [token]);

  const fetchReviews = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await reviewService.getAdminReviews(token, {
        search: search.trim() || undefined,
        targetType: targetType !== 'ALL' ? targetType : undefined,
        serviceType: serviceType !== 'ALL' ? serviceType : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        rating: ratingFilter !== 'ALL' ? parseInt(ratingFilter) : undefined,
        page,
        limit
      });

      if (res.success && res.data) {
        setReviews(res.data.items || []);
        setTotalPages(res.data.pagination.totalPages || 1);
        setTotalItems(res.data.pagination.totalItems || 0);
      } else {
        setError(res.error?.message || 'Failed to load reviews');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with server');
    } finally {
      setLoading(false);
    }
  }, [token, search, targetType, serviceType, statusFilter, ratingFilter, page]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Handle Moderation Action (Hide / Publish)
  const handleModerate = async (review: AdminReviewItem, newStatus: 'PUBLISHED' | 'HIDDEN') => {
    if (!token) return;
    setIsModerating(true);
    try {
      const res = await reviewService.moderateReview(
        token,
        review.id,
        newStatus,
        moderationNotes || undefined
      );

      if (res.success && res.data) {
        // Update local review list
        setReviews((prev) =>
          prev.map((r) => (r.id === review.id ? { ...r, ...res.data } : r))
        );
        if (selectedReview && selectedReview.id === review.id) {
          setSelectedReview({ ...selectedReview, ...res.data });
        }
        setActionSuccess(`Review has been ${newStatus === 'PUBLISHED' ? 'published' : 'hidden'} successfully.`);
        setTimeout(() => setActionSuccess(null), 3000);
        // Refresh stats
        fetchStats();
      } else {
        alert(res.error?.message || 'Failed to update review moderation status.');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating moderation status');
    } finally {
      setIsModerating(false);
      setModerationNotes('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
            <span>Reviews & Ratings Management</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Verified patient ratings and feedback across all medical departments, doctors, and hospitals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchStats();
              fetchReviews();
            }}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Reviews"
          value={stats ? stats.totalReviews.toLocaleString() : '...'}
          subtitle={
            stats
              ? `${stats.publishedReviews} Published • ${stats.hiddenReviews} Hidden`
              : 'Loading statistics...'
          }
          icon={MessageSquare}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <KpiCard
          title="Overall Average"
          value={stats?.overallAverage ? `${stats.overallAverage} ★` : 'No reviews'}
          subtitle="Calculated over all published patient reviews"
          icon={Star}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <KpiCard
          title="Hospital Reviews"
          value={stats ? stats.hospital.count.toLocaleString() : '...'}
          subtitle={
            stats?.hospital.average
              ? `Avg: ${stats.hospital.average} ★ across hospitals`
              : 'No hospital reviews yet'
          }
          icon={Building2}
          iconColor="text-teal-600"
          iconBg="bg-teal-50"
        />
        <KpiCard
          title="Doctor Reviews"
          value={stats ? stats.doctor.count.toLocaleString() : '...'}
          subtitle={
            stats?.doctor.average
              ? `Avg: ${stats.doctor.average} ★ across doctors`
              : 'No doctor reviews yet'
          }
          icon={Stethoscope}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
        />
      </div>

      {/* Rating Breakdown & Service Distribution Bar */}
      {stats && stats.totalReviews > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Star Distribution */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Star Rating Distribution
            </h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.ratingDistribution[star] || 0;
                const percentage = stats.publishedReviews > 0 ? (count / stats.publishedReviews) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-3 text-xs">
                    <span className="w-12 font-bold text-slate-700 flex items-center gap-1">
                      {star} <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                    </span>
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-16 text-right font-medium text-slate-500">
                      {count} ({Math.round(percentage)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Service Breakdown */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Reviews by Service Type
            </h3>
            <div className="space-y-2">
              {Object.entries(SERVICE_LABELS).map(([key, label]) => {
                const count = stats.serviceDistribution[key] || 0;
                const percentage = stats.publishedReviews > 0 ? (count / stats.publishedReviews) * 100 : 0;
                return (
                  <div key={key} className="flex items-center gap-3 text-xs">
                    <span className="w-36 font-semibold text-slate-700 truncate">{label}</span>
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-16 text-right font-medium text-slate-500">
                      {count} ({Math.round(percentage)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Action Notification Toast */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by review ID, hospital, doctor, patient name, or comments..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Quick Filter dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Target Type Filter */}
            <select
              value={targetType}
              onChange={(e) => {
                setTargetType(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 cursor-pointer focus:outline-hidden"
            >
              <option value="ALL">All Targets</option>
              <option value="HOSPITAL">Hospital Reviews</option>
              <option value="DOCTOR">Doctor Reviews</option>
            </select>

            {/* Service Type Filter */}
            <select
              value={serviceType}
              onChange={(e) => {
                setServiceType(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 cursor-pointer focus:outline-hidden"
            >
              <option value="ALL">All Services</option>
              <option value="OP_CONSULTATION">OP Consultation</option>
              <option value="VIDEO_CONSULTATION">Video Consultation</option>
              <option value="LAB_TEST">Lab Tests</option>
              <option value="HOME_SAMPLE_COLLECTION">Home Sample Collection</option>
              <option value="HOME_NURSING">Home Nursing</option>
            </select>

            {/* Rating Filter */}
            <select
              value={ratingFilter}
              onChange={(e) => {
                setRatingFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 cursor-pointer focus:outline-hidden"
            >
              <option value="ALL">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 cursor-pointer focus:outline-hidden"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="HIDDEN">Hidden</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Rating</th>
                <th className="py-3.5 px-4">Target & Service</th>
                <th className="py-3.5 px-4">Provider / Doctor</th>
                <th className="py-3.5 px-4">Patient</th>
                <th className="py-3.5 px-4 max-w-xs">Feedback / Comment</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Loading patient reviews...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-rose-500">
                    <div className="flex items-center justify-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>{error}</span>
                    </div>
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">No reviews found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      No customer reviews match your active search or filter criteria.
                    </p>
                  </td>
                </tr>
              ) : (
                reviews.map((r) => {
                  const isPublished = r.status === 'PUBLISHED';
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Rating Stars */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-lg font-black text-xs">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            <span>{r.rating}</span>
                          </span>
                        </div>
                      </td>

                      {/* Target & Service */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              r.targetType === 'DOCTOR'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {r.targetType === 'DOCTOR' ? (
                              <Stethoscope className="w-3 h-3" />
                            ) : (
                              <Building2 className="w-3 h-3" />
                            )}
                            <span>{r.targetType}</span>
                          </span>
                          <span className="block text-[10px] text-slate-400 font-medium">
                            {SERVICE_LABELS[r.serviceType] || r.serviceType}
                          </span>
                        </div>
                      </td>

                      {/* Provider / Doctor */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          {r.targetType === 'DOCTOR' && r.doctor ? (
                            <>
                              <span className="font-bold text-slate-900 block truncate max-w-[160px]">
                                {r.doctor.name}
                              </span>
                              <span className="text-[10px] text-slate-500 block truncate max-w-[160px]">
                                {r.hospital.name}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="font-bold text-slate-900 block truncate max-w-[160px]">
                                {r.hospital.name}
                              </span>
                              {r.hospital.city && (
                                <span className="text-[10px] text-slate-400 block">
                                  {r.hospital.city}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>

                      {/* Patient */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800 block">
                            {r.user?.name || 'Verified Patient'}
                          </span>
                          {r.user?.phone && (
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {r.user.phone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Comment */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {r.comment ? (
                          <p className="text-slate-600 line-clamp-2 text-xs leading-relaxed">
                            "{r.comment}"
                          </p>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No written comment</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isPublished
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isPublished ? (
                            <>
                              <Eye className="w-3 h-3 text-emerald-500" />
                              <span>Published</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 text-rose-500" />
                              <span>Hidden</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                        {new Date(r.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View details */}
                          <button
                            type="button"
                            onClick={() => setSelectedReview(r)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
                            title="View full review details"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {/* Moderation quick toggle */}
                          {isPublished ? (
                            <button
                              type="button"
                              onClick={() => handleModerate(r, 'HIDDEN')}
                              disabled={isModerating}
                              className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                              title="Hide this review from public display"
                            >
                              Hide
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleModerate(r, 'PUBLISHED')}
                              disabled={isModerating}
                              className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                              title="Publish this review back to public view"
                            >
                              Publish
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
          <div>
            Showing <span className="font-bold text-slate-800">{reviews.length}</span> of{' '}
            <span className="font-bold text-slate-800">{totalItems}</span> reviews
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Review Details & Moderation Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                  Review Details
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {selectedReview.targetType === 'DOCTOR' ? 'Doctor Review' : 'Hospital Review'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReview(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Rating & Status */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-5 h-5 ${
                          s <= selectedReview.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-base font-black text-slate-900">
                    {selectedReview.rating} / 5
                  </span>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                    selectedReview.status === 'PUBLISHED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {selectedReview.status === 'PUBLISHED' ? 'Published' : 'Hidden from Public'}
                </span>
              </div>

              {/* Written Comment */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Patient Comment
                </span>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700 leading-relaxed font-medium">
                  {selectedReview.comment ? (
                    `"${selectedReview.comment}"`
                  ) : (
                    <span className="text-slate-400 italic">No written comment provided.</span>
                  )}
                </div>
              </div>

              {/* Targets & Context Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Hospital</span>
                  <p className="font-bold text-slate-900">{selectedReview.hospital.name}</p>
                  {selectedReview.hospital.city && (
                    <p className="text-[11px] text-slate-500">{selectedReview.hospital.city}</p>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Service Type</span>
                  <p className="font-bold text-slate-900">
                    {SERVICE_LABELS[selectedReview.serviceType] || selectedReview.serviceType}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono truncate">
                    Ref: {selectedReview.bookingId}
                  </p>
                </div>

                {selectedReview.doctor && (
                  <div className="col-span-2 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-1">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase">
                      Consulting Doctor
                    </span>
                    <p className="font-bold text-slate-900">{selectedReview.doctor.name}</p>
                    {selectedReview.doctor.specialization && (
                      <p className="text-[11px] text-slate-500">
                        {selectedReview.doctor.specialization}
                      </p>
                    )}
                  </div>
                )}

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Patient</span>
                  <p className="font-bold text-slate-900">{selectedReview.user.name}</p>
                  {selectedReview.user.phone && (
                    <p className="text-[11px] text-slate-500 font-mono">
                      {selectedReview.user.phone}
                    </p>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Submission Date</span>
                  <p className="font-bold text-slate-900">
                    {new Date(selectedReview.createdAt).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </p>
                </div>
              </div>

              {/* Moderation History */}
              {selectedReview.moderatedAt && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1 text-amber-900">
                  <span className="font-bold block">Moderation Log:</span>
                  <p className="text-[11px]">
                    Status changed by <strong>{selectedReview.moderatedBy || 'Super Admin'}</strong> on{' '}
                    {new Date(selectedReview.moderatedAt).toLocaleString()}
                  </p>
                  {selectedReview.moderationNotes && (
                    <p className="text-[11px] italic mt-1">
                      Note: "{selectedReview.moderationNotes}"
                    </p>
                  )}
                </div>
              )}

              {/* Moderation Controls Form */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <label className="text-xs font-bold text-slate-700 block">
                  Admin Moderation Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Reason for hiding/publishing (e.g., policy violation, spam, verified feedback)..."
                  value={moderationNotes}
                  onChange={(e) => setModerationNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500"
                />

                <div className="flex items-center gap-3 pt-1">
                  {selectedReview.status === 'PUBLISHED' ? (
                    <button
                      type="button"
                      disabled={isModerating}
                      onClick={() => handleModerate(selectedReview, 'HIDDEN')}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <EyeOff className="w-4 h-4" />
                      <span>{isModerating ? 'Updating...' : 'Hide Review'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isModerating}
                      onClick={() => handleModerate(selectedReview, 'PUBLISHED')}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{isModerating ? 'Updating...' : 'Publish Review'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedReview(null)}
                    className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;
