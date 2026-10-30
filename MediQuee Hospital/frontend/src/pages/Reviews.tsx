import { useState, useEffect, useCallback } from "react";
import { 
  Star, MessageSquare, AlertTriangle, ShieldCheck, CheckCircle2, 
  Clock, Search, Filter, ChevronDown, User, Building2, Send,
  TrendingUp, ThumbsUp, RefreshCw, X, Award, Info
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { reviewsApi, type ProviderReviewItem, type HospitalReviewAnalytics } from "@/services/reviewsApi";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

export function Reviews() {
  const { user, role } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'HOSPITAL' | 'DOCTORS' | 'LABS'>('OVERVIEW');
  const [analytics, setAnalytics] = useState<HospitalReviewAnalytics | null>(null);
  const [reviews, setReviews] = useState<ProviderReviewItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalCount: 0, totalPages: 1 });
  
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('APPROVED');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('ALL');

  // Response Modal State
  const [respondingToReview, setRespondingToReview] = useState<ProviderReviewItem | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  // Dispute Report Modal State
  const [reportingReview, setReportingReview] = useState<ProviderReviewItem | null>(null);
  const [reportReason, setReportReason] = useState('Inappropriate or defamatory content');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setIsLoadingAnalytics(true);
    try {
      const data = await reviewsApi.getHospitalAnalytics(
        user?.hospitalId || undefined,
        role === 'doctor' ? user?.id : undefined
      );
      setAnalytics(data);
    } catch (err: any) {
      console.error('Failed to load review analytics:', err);
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, [user?.hospitalId, user?.id, role]);

  const fetchReviews = useCallback(async (page = 1) => {
    setIsLoadingReviews(true);
    try {
      let targetType: string | undefined = undefined;
      if (activeTab === 'HOSPITAL') targetType = 'HOSPITAL';
      if (activeTab === 'DOCTORS') targetType = 'DOCTOR';
      if (activeTab === 'LABS') targetType = 'LABORATORY';

      const doctorId = activeTab === 'DOCTORS' && selectedDoctorId !== 'ALL' 
        ? selectedDoctorId 
        : (role === 'doctor' ? user?.id : undefined);

      const res = await reviewsApi.getProviderReviews({
        targetType,
        doctorId,
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        page,
        limit: 10,
        search: searchQuery.trim() || undefined,
      });

      setReviews(res.reviews);
      setPagination(res.pagination);
    } catch (err: any) {
      toast({
        title: 'Error loading reviews',
        description: err.message || 'Could not fetch reviews.',
        type: 'error',
      });
    } finally {
      setIsLoadingReviews(false);
    }
  }, [activeTab, selectedDoctorId, role, user?.id, selectedStatus, searchQuery, toast]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    if (activeTab !== 'OVERVIEW') {
      fetchReviews(1);
    }
  }, [activeTab, selectedDoctorId, selectedStatus, fetchReviews]);

  // Handle Response Submission
  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondingToReview || !responseText.trim()) return;

    setIsSubmittingResponse(true);
    try {
      await reviewsApi.submitProviderResponse(respondingToReview.id, responseText.trim());
      toast({
        title: 'Response Submitted',
        description: 'Your official response was submitted and is pending admin moderation approval.',
        type: 'success',
      });
      setRespondingToReview(null);
      setResponseText('');
      fetchReviews(pagination.page);
      fetchAnalytics();
    } catch (err: any) {
      toast({
        title: 'Failed to Submit Response',
        description: err.message || 'Error occurred while saving response.',
        type: 'error',
      });
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  // Handle Dispute Report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingReview) return;

    setIsSubmittingReport(true);
    try {
      await reviewsApi.reportReview(reportingReview.id, {
        reason: reportReason,
        details: reportDetails.trim() || undefined,
      });
      toast({
        title: 'Review Reported',
        description: 'Review has been flagged for admin investigation.',
        type: 'success',
      });
      setReportingReview(null);
      setReportDetails('');
      fetchReviews(pagination.page);
      fetchAnalytics();
    } catch (err: any) {
      toast({
        title: 'Report Failed',
        description: err.message || 'Could not report review.',
        type: 'error',
      });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const formatDimensionKey = (key: string) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace('Staff Behaviour', 'Staff Behaviour')
      .replace('Cleanliness And Environment', 'Cleanliness & Hygiene')
      .replace('Waiting Time And Coordination', 'Waiting Time & Queue')
      .replace('Facilities And Accessibility', 'Facilities & Comfort')
      .replace('Overall Hospital Experience', 'Overall Experience')
      .replace('Medical Communication', 'Medical Communication')
      .replace('Professional Behaviour', 'Professional Conduct')
      .replace('Consultation Experience', 'Consultation Quality')
      .replace('Time And Punctuality', 'Punctuality')
      .replace('Report Delivery', 'Report Delivery')
      .replace('Sample Collection', 'Sample Collection');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Reviews & Ratings</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Real Patient Data
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Centralized feedback, authentic rating distribution, and official patient response management.
          </p>
        </div>

        <button
          onClick={() => { fetchAnalytics(); if (activeTab !== 'OVERVIEW') fetchReviews(pagination.page); }}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Data
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
        {[
          { key: 'OVERVIEW', label: 'Overview & Analytics', icon: TrendingUp },
          { key: 'HOSPITAL', label: 'Hospital Reviews', icon: Building2 },
          { key: 'DOCTORS', label: 'Doctor Reviews', icon: User },
          { key: 'LABS', label: 'Laboratory Reviews', icon: Award },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={cn(
                "flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap",
                isActive
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {isLoadingAnalytics ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : analytics ? (
            <>
              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Overall Rating */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Overall Rating</span>
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    {analytics.overallRating > 0 ? (
                      <>
                        <span className="text-3xl font-extrabold text-gray-900">{analytics.overallRating.toFixed(1)}</span>
                        <span className="text-sm font-medium text-gray-500">/ 5.0</span>
                      </>
                    ) : (
                      <span className="text-base font-semibold text-gray-500">No reviews yet</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Calculated from {analytics.totalPublishedReviews} published reviews
                  </p>
                </div>

                {/* Published Reviews */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Reviews</span>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-gray-900">{analytics.totalPublishedReviews}</span>
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      +{analytics.newReviewsCount} new (30d)
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {analytics.pendingModerationCount} reviews in admin queue
                  </p>
                </div>

                {/* Reviews Requiring Response */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Need Response</span>
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-amber-600" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-3xl font-extrabold text-gray-900">{analytics.reviewsRequiringResponse}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {analytics.pendingResponsesCount} official response(s) awaiting admin approval
                  </p>
                </div>

                {/* Reported Reviews */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Disputes & Reports</span>
                    <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-3xl font-extrabold text-gray-900">{analytics.reportedReviewsCount}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Active disputes currently under admin investigation
                  </p>
                </div>
              </div>

              {/* Distribution & Dimension Scores */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Rating Distribution */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-gray-900">Rating Breakdown</h3>
                  <div className="space-y-2.5">
                    {[5, 4, 3, 2, 1].map(stars => {
                      const count = analytics.distribution[stars] || 0;
                      const pct = analytics.totalPublishedReviews > 0
                        ? Math.round((count / analytics.totalPublishedReviews) * 100)
                        : 0;

                      return (
                        <div key={stars} className="flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-1 w-14 font-medium text-gray-700">
                            <span>{stars}</span>
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          </div>
                          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-600 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-12 text-right text-xs text-gray-500 font-medium">
                            {count} ({pct}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Sentiment Bar */}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                      <span className="font-semibold text-gray-700">Feedback Sentiment</span>
                      <span>
                        {analytics.sentimentDistribution.positive} Positive • {analytics.sentimentDistribution.neutral} Neutral • {analytics.sentimentDistribution.negative} Critical
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
                      {analytics.totalPublishedReviews > 0 ? (
                        <>
                          <div 
                            className="bg-emerald-500 h-full" 
                            style={{ width: `${(analytics.sentimentDistribution.positive / analytics.totalPublishedReviews) * 100}%` }} 
                            title="Positive (4-5 Stars)"
                          />
                          <div 
                            className="bg-amber-400 h-full" 
                            style={{ width: `${(analytics.sentimentDistribution.neutral / analytics.totalPublishedReviews) * 100}%` }} 
                            title="Neutral (3 Stars)"
                          />
                          <div 
                            className="bg-rose-500 h-full" 
                            style={{ width: `${(analytics.sentimentDistribution.negative / analytics.totalPublishedReviews) * 100}%` }} 
                            title="Critical (1-2 Stars)"
                          />
                        </>
                      ) : (
                        <div className="w-full bg-gray-200 h-full" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Category Dimension Averages */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-gray-900">Experience Category Dimensions</h3>
                  {Object.keys(analytics.categoryAverages).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(analytics.categoryAverages).map(([key, avg]) => (
                        <div key={key} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-none">
                          <span className="text-gray-600 font-medium">{formatDimensionKey(key)}</span>
                          <div className="flex items-center gap-1.5 font-bold text-gray-900">
                            <span>{avg.toFixed(1)}</span>
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-sm text-gray-400">
                      No dimension ratings recorded yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Doctor Performance Summary */}
              {analytics.doctorBreakdown && analytics.doctorBreakdown.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Affiliated Doctors' Performance</h3>
                      <p className="text-xs text-gray-500">Live verified patient ratings for practitioners in this hospital</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('DOCTORS')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      View All Doctor Reviews →
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                    {analytics.doctorBreakdown.map(doc => (
                      <div key={doc.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                            {doc.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-gray-900">{doc.name}</div>
                            <div className="text-xs text-gray-500">{doc.specialization || 'Consultant Specialist'}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 font-bold text-sm text-gray-900">
                            {doc.averageRating !== null ? doc.averageRating.toFixed(1) : '—'}
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {doc.reviewCount} {doc.reviewCount === 1 ? 'review' : 'reviews'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-gray-500">
              No analytics data available.
            </div>
          )}
        </div>
      )}

      {/* TAB 2, 3, 4: REVIEW LISTINGS (Hospital, Doctor, Lab) */}
      {activeTab !== 'OVERVIEW' && (
        <div className="space-y-4">
          {/* Controls Bar: Search & Filters */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search reviews by patient, comments, or title..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') fetchReviews(1); }}
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Doctor filter when in DOCTORS tab */}
              {activeTab === 'DOCTORS' && analytics?.doctorBreakdown && (
                <select
                  value={selectedDoctorId}
                  onChange={e => setSelectedDoctorId(e.target.value)}
                  className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="ALL">All Doctors</option>
                  {analytics.doctorBreakdown.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} {doc.averageRating ? `(${doc.averageRating.toFixed(1)} ★)` : ''}
                    </option>
                  ))}
                </select>
              )}

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="APPROVED">Published Reviews</option>
                <option value="PENDING">Pending Moderation</option>
                <option value="FLAGGED">Reported / Under Review</option>
                <option value="ALL">All Statuses</option>
              </select>

              <button
                onClick={() => fetchReviews(1)}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
              >
                Filter
              </button>
            </div>
          </div>

          {/* Reviews List */}
          {isLoadingReviews ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-6 bg-white rounded-2xl border border-gray-200 space-y-3 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-1/4 bg-gray-200 rounded" />
                      <div className="h-3 w-1/6 bg-gray-100 rounded" />
                    </div>
                  </div>
                  <div className="h-12 w-full bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map(review => {
                const isApproved = review.status === 'APPROVED';
                return (
                  <div 
                    key={review.id} 
                    className="p-5 sm:p-6 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-4 hover:border-gray-300 transition-all"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-50 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
                          {review.patientDisplay.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 text-sm">
                              {review.patientDisplay}
                            </span>
                            {review.isVerified && (
                              <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                <CheckCircle2 className="w-3 h-3 text-blue-600" />
                                Verified Patient
                              </span>
                            )}
                            {review.isAnonymous && (
                              <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                Anonymous Display
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                            <span>{new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            <span>•</span>
                            <span className="font-medium text-gray-600">{review.bookingType.replace('_', ' ')}</span>
                            {review.doctor && (
                              <>
                                <span>•</span>
                                <span className="text-blue-600">Dr. {review.doctor.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status and Rating */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                          <span className="font-bold text-sm text-gray-900">{review.rating.toFixed(1)}</span>
                          <div className="flex text-amber-400">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star 
                                key={s} 
                                className={cn(
                                  "w-3.5 h-3.5",
                                  s <= review.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"
                                )} 
                              />
                            ))}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-semibold",
                          review.status === 'APPROVED' && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                          review.status === 'PENDING' && "bg-amber-50 text-amber-700 border border-amber-200",
                          review.status === 'REJECTED' && "bg-rose-50 text-rose-700 border border-rose-200",
                          review.status === 'FLAGGED' && "bg-purple-50 text-purple-700 border border-purple-200"
                        )}>
                          {review.status}
                        </span>
                      </div>
                    </div>

                    {/* Review Body */}
                    <div className="space-y-2">
                      {review.title && (
                        <h4 className="font-bold text-sm text-gray-900">{review.title}</h4>
                      )}
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {review.comment || <span className="italic text-gray-400">No written comment provided.</span>}
                      </p>

                      {/* Dimension Ratings Badges */}
                      {review.categoryRatings && Object.keys(review.categoryRatings).length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {Object.entries(review.categoryRatings).map(([dim, score]) => (
                            <div 
                              key={dim}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                            >
                              <span className="text-gray-600 font-medium">{formatDimensionKey(dim)}:</span>
                              <span className="font-bold text-gray-900">{score}★</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Official Provider Response Section */}
                    {review.response ? (
                      <div className="mt-3 p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                            <Building2 className="w-3.5 h-3.5 text-blue-700" />
                            Official Healthcare Provider Response
                          </div>
                          <span className={cn(
                            "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                            review.response.status === 'APPROVED' && "bg-emerald-100 text-emerald-800",
                            review.response.status === 'PENDING' && "bg-amber-100 text-amber-800",
                            review.response.status === 'REJECTED' && "bg-rose-100 text-rose-800"
                          )}>
                            {review.response.status === 'APPROVED' ? 'Published' : `Response ${review.response.status}`}
                          </span>
                        </div>
                        <p className="text-xs text-blue-900/90 leading-relaxed">
                          {review.response.response}
                        </p>
                        {review.response.rejectionReason && (
                          <p className="text-xs text-rose-600 font-medium mt-1">
                            Moderation Note: {review.response.rejectionReason}
                          </p>
                        )}
                      </div>
                    ) : null}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                      <div className="text-gray-400">
                        Review ID: <span className="font-mono text-gray-500">{review.id.slice(0, 8)}...</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Respond Button */}
                        {!review.response && isApproved && (
                          <button
                            onClick={() => {
                              setRespondingToReview(review);
                              setResponseText('');
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Submit Official Response
                          </button>
                        )}

                        {/* Report Dispute Button */}
                        <button
                          onClick={() => {
                            setReportingReview(review);
                            setReportDetails('');
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 font-medium text-gray-600 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition-colors"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Flag Dispute
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-gray-200">
                  <div className="text-xs text-gray-500">
                    Showing page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} reviews)
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={pagination.page <= 1}
                      onClick={() => fetchReviews(pagination.page - 1)}
                      className="px-3 py-1 text-xs font-medium border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <button
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => fetchReviews(pagination.page + 1)}
                      className="px-3 py-1 text-xs font-medium border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <EmptyState
                icon={MessageSquare}
                title="No reviews found"
                description="No patient reviews match your current filter selections."
                actionLabel="Clear Filters"
                onAction={() => {
                  setSelectedStatus('ALL');
                  setSearchQuery('');
                  setSelectedDoctorId('ALL');
                  fetchReviews(1);
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: OFFICIAL RESPONSE MODAL */}
      {respondingToReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-base">Submit Official Hospital Response</h3>
              </div>
              <button 
                onClick={() => setRespondingToReview(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-xl text-xs space-y-1 border border-gray-100">
              <div className="flex items-center justify-between text-gray-500">
                <span>Patient: <strong>{respondingToReview.patientDisplay}</strong></span>
                <span>Rating: <strong>{respondingToReview.rating} ★</strong></span>
              </div>
              <p className="text-gray-700 italic">"{respondingToReview.comment || 'No comment'}"</p>
            </div>

            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start gap-2.5 text-xs text-blue-800">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p>
                Official responses are reviewed by MediQuee Administration before public display. 
                Please do not disclose sensitive clinical records, diagnosis details, or patient personal contact info.
              </p>
            </div>

            <form onSubmit={handleSubmitResponse} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Official Statement
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Thank you for sharing your feedback. We appreciate your insights and are committed to..."
                  value={responseText}
                  onChange={e => setResponseText(e.target.value)}
                  className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRespondingToReview(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingResponse || !responseText.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmittingResponse ? 'Submitting...' : 'Submit for Admin Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REPORT DISPUTE MODAL */}
      {reportingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-gray-900 text-base">Report Disputed Review</h3>
              </div>
              <button 
                onClick={() => setReportingReview(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Flag this review if it violates platform policy (e.g., abusive conduct, fake identity, or personal data exposure). 
              Admins will investigate and take appropriate moderation action.
            </p>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Reason for Dispute
                </label>
                <select
                  value={reportReason}
                  onChange={e => setReportReason(e.target.value)}
                  className="w-full text-sm p-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                >
                  <option value="Inappropriate or defamatory content">Inappropriate or defamatory content</option>
                  <option value="Disputed patient identity / No consultation">Disputed patient identity / No consultation</option>
                  <option value="Private medical or personal details exposed">Private medical or personal details exposed</option>
                  <option value="Spam, advertising, or abusive harassment">Spam, advertising, or abusive harassment</option>
                  <option value="Conflict of interest or commercial competitor">Conflict of interest or commercial competitor</option>
                  <option value="Other policy violation">Other policy violation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Investigation Details (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide context or reference numbers to assist the admin moderation team..."
                  value={reportDetails}
                  onChange={e => setReportDetails(e.target.value)}
                  className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportingReview(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all disabled:opacity-50"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {isSubmittingReport ? 'Filing Report...' : 'File Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
