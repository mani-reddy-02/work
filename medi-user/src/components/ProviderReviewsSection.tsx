import React, { useState, useEffect } from 'react';
import { 
  Star, 
  ShieldCheck, 
  Building2, 
  ThumbsUp, 
  MessageSquare, 
  Filter, 
  Clock, 
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { reviewsApi, type PublicReview, type PublicReviewsResponse } from '../lib/reviewsApi';
import { cn } from '../lib/utils';

interface ProviderReviewsSectionProps {
  targetType: 'DOCTOR' | 'HOSPITAL' | 'LABORATORY';
  targetId: string;
  providerName: string;
}

export const ProviderReviewsSection: React.FC<ProviderReviewsSectionProps> = ({
  targetType,
  targetId,
  providerName,
}) => {
  const [data, setData] = useState<PublicReviewsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (targetId) {
      loadReviews(1, ratingFilter);
    }
  }, [targetId, ratingFilter]);

  const loadReviews = async (p = 1, rFilter?: number) => {
    setLoading(true);
    const res = await reviewsApi.getPublicReviews(targetType, targetId, p, 5, rFilter);
    setLoading(false);
    if (res.success && res.data) {
      setData(res.data);
      setPage(p);
    }
  };

  const aggregate = data?.aggregate;
  const hasReviews = (aggregate?.totalReviews || 0) > 0;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Patient Reviews & Ratings</span>
            {hasReviews && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {aggregate?.totalReviews} {aggregate?.totalReviews === 1 ? 'review' : 'reviews'}
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Verified feedback from patients treated by {providerName}
          </p>
        </div>

        {/* Rating Filter Pills */}
        {hasReviews && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setRatingFilter(undefined)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                ratingFilter === undefined
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              All
            </button>
            {[5, 4, 3, 2, 1].map((r) => (
              <button
                key={r}
                onClick={() => setRatingFilter(r)}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  ratingFilter === r
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                <span>{r}</span>
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && !data ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading reviews...</p>
        </div>
      ) : !hasReviews ? (
        <div className="py-10 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <Star className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700">No reviews yet</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Be the first patient to share your experience after completing a consultation or visit.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            {/* Overall Score */}
            <div className="flex flex-col items-center justify-center p-3 text-center border-b md:border-b-0 md:border-r border-slate-200/80">
              <span className="text-4xl font-black text-slate-900 tracking-tight">
                {aggregate?.averageRating ? aggregate.averageRating.toFixed(1) : 'No reviews'}
              </span>
              <div className="flex items-center gap-1 my-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={cn(
                      'w-4 h-4',
                      s <= Math.round(aggregate?.averageRating || 0)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-200'
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-500 font-semibold">
                Based on {aggregate?.totalReviews} verified reviews
              </span>
            </div>

            {/* Distribution Bars */}
            <div className="md:col-span-2 space-y-1.5 justify-center flex flex-col">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = aggregate?.distribution[star] || 0;
                const total = aggregate?.totalReviews || 1;
                const percentage = Math.round((count / total) * 100);

                return (
                  <div key={star} className="flex items-center gap-2.5 text-xs">
                    <span className="w-7 font-bold text-slate-600 flex items-center gap-0.5">
                      {star} <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    </span>
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-medium text-slate-500 text-[11px]">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dimension Averages Pills if present */}
          {aggregate?.categoryAverages && Object.keys(aggregate.categoryAverages).length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Key Dimensions:
              </span>
              {Object.entries(aggregate.categoryAverages).map(([key, val]) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50/70 border border-blue-100 text-blue-800 text-[11px] font-bold"
                >
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                  <span className="text-blue-900">{val.toFixed(1)}</span>
                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                </span>
              ))}
            </div>
          )}

          {/* Review List */}
          <div className="space-y-3.5 divide-y divide-slate-100">
            {data?.reviews.map((rev) => (
              <div key={rev.id} className="pt-3.5 first:pt-0 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">
                      {rev.displayName[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">{rev.displayName}</span>
                        {rev.isVerified && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Verified Patient
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(rev.publishedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-xs font-black text-amber-800">{rev.rating}.0</span>
                  </div>
                </div>

                {rev.title && (
                  <h4 className="font-bold text-xs text-slate-900 leading-snug">{rev.title}</h4>
                )}

                {rev.comment && (
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {rev.comment}
                  </p>
                )}

                {/* Official Provider Response */}
                {rev.officialResponse && (
                  <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 space-y-1">
                    <div className="flex items-center gap-1 text-blue-800 font-bold text-[11px]">
                      <Building2 className="w-3 h-3" />
                      <span>Official Provider Response</span>
                      <span className="text-[10px] text-blue-500 font-normal">
                        • {new Date(rev.officialResponse.publishedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {rev.officialResponse.response}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={data.pagination.page <= 1}
                  onClick={() => loadReviews(data.pagination.page - 1, ratingFilter)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-bold disabled:opacity-40 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={data.pagination.page >= data.pagination.totalPages}
                  onClick={() => loadReviews(data.pagination.page + 1, ratingFilter)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-bold disabled:opacity-40 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
export default ProviderReviewsSection;
