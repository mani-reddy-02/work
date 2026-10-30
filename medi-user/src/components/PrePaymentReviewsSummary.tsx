import React, { useState, useEffect } from 'react';
import { 
  Star, 
  ShieldCheck, 
  Building2, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  MessageSquare,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { reviewsApi, type PublicReview, type PublicReviewsResponse } from '../lib/reviewsApi';

export interface PrePaymentReviewsSummaryProps {
  targetType: 'DOCTOR' | 'HOSPITAL' | 'LABORATORY';
  targetId: string;
  providerName: string;
  rating?: number | null;
  reviewCount?: number | null;
  defaultVisibleCount?: number;
}

export const PrePaymentReviewsSummary: React.FC<PrePaymentReviewsSummaryProps> = ({
  targetType,
  targetId,
  providerName,
  rating: initialRating,
  reviewCount: initialReviewCount,
  defaultVisibleCount = 2,
}) => {
  const [data, setData] = useState<PublicReviewsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    if (!targetId) return;

    const fetchReviews = async () => {
      setIsLoading(true);
      try {
        const res = await reviewsApi.getPublicReviews(targetType, targetId, 1, 10);
        if (isMounted && res.success && res.data) {
          setData(res.data);
        }
      } catch {
        // Fall back gracefully
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchReviews();
    return () => {
      isMounted = false;
    };
  }, [targetType, targetId]);

  const aggregate = data?.aggregate;
  const reviews = data?.reviews || [];
  const effectiveRating = aggregate?.averageRating ?? initialRating ?? null;
  const effectiveReviewCount = aggregate?.totalReviews ?? initialReviewCount ?? 0;
  const hasReviews = reviews.length > 0;

  const visibleReviews = isExpanded ? reviews : reviews.slice(0, defaultVisibleCount);
  const remainingCount = Math.max(0, reviews.length - defaultVisibleCount);

  const getTargetTypeLabel = () => {
    switch (targetType) {
      case 'DOCTOR':
        return 'Doctor';
      case 'LABORATORY':
        return 'Diagnostic Laboratory';
      case 'HOSPITAL':
        return 'Hospital Provider';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-extrabold text-slate-900">
              Patient Reviews & Ratings
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              {getTargetTypeLabel()}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Verified patient ratings and feedback for <span className="font-semibold text-slate-700">{providerName}</span>
          </p>
        </div>

        {/* Rating Score Badge */}
        {effectiveRating ? (
          <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 px-3 py-1.5 rounded-xl self-start sm:self-auto">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-black text-amber-900">
                {Number(effectiveRating).toFixed(1)}
              </span>
            </div>
            <span className="text-slate-300 font-light">•</span>
            <span className="text-[11px] font-bold text-amber-800">
              {effectiveReviewCount} {effectiveReviewCount === 1 ? 'verified review' : 'verified reviews'}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-xl self-start sm:self-auto">
            <Star className="w-3.5 h-3.5 text-slate-300" />
            <span>No published reviews yet</span>
          </div>
        )}
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="py-6 flex items-center justify-center gap-2 text-slate-400 text-xs">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          <span>Loading verified feedback...</span>
        </div>
      ) : !hasReviews ? (
        /* Empty State */
        <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <p className="font-bold text-slate-800">New or unreviewed provider</p>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              No patient reviews have been posted for this provider yet. Once your visit is completed, you'll be invited to submit verified feedback!
            </p>
          </div>
        </div>
      ) : (
        /* Reviews Content */
        <div className="space-y-3">
          {/* Category Averages if available */}
          {aggregate?.categoryAverages && Object.keys(aggregate.categoryAverages).length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pb-1">
              {Object.entries(aggregate.categoryAverages).map(([k, score]) => (
                <div 
                  key={k} 
                  className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-700"
                >
                  <span className="capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}:</span>
                  <span className="text-blue-700">{Number(score).toFixed(1)}</span>
                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                </div>
              ))}
            </div>
          )}

          {/* Review List */}
          <div className="space-y-2.5">
            {visibleReviews.map((rev) => (
              <div 
                key={rev.id} 
                className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition-colors space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">
                      {rev.displayName ? rev.displayName.charAt(0).toUpperCase() : 'P'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-800">
                          {rev.displayName || 'Verified Patient'}
                        </span>
                        {rev.isVerified && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                            <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                            Verified
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(rev.publishedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80 shrink-0">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-black text-amber-800">
                      {rev.rating}.0
                    </span>
                  </div>
                </div>

                {rev.title && (
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {rev.title}
                  </h4>
                )}

                {rev.comment && (
                  <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                    {rev.comment}
                  </p>
                )}

                {/* Provider Official Response */}
                {rev.officialResponse && (
                  <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-100 text-[11px] space-y-0.5">
                    <div className="flex items-center gap-1 text-blue-800 font-bold text-[10px]">
                      <Building2 className="w-3 h-3 text-blue-600" />
                      <span>Official Provider Response</span>
                    </div>
                    <p className="text-slate-700 leading-normal">
                      {rev.officialResponse.response}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Show More / Show Less Toggle Button */}
          {reviews.length > defaultVisibleCount && (
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50/80 hover:bg-blue-100 transition-all cursor-pointer w-full sm:w-auto"
              >
                <span>
                  {isExpanded 
                    ? 'Show Less' 
                    : `Show More Reviews (${remainingCount} more)`}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PrePaymentReviewsSummary;
