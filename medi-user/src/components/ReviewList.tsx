import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, AlertCircle, RefreshCw } from 'lucide-react';
import { reviewApi, type ReviewItem, type ReviewSummary } from '../lib/reviewApi';
import { cn } from '../lib/utils';

interface ReviewListProps {
  targetType: 'HOSPITAL' | 'DOCTOR';
  targetId: string;
  targetName?: string;
  className?: string;
  compact?: boolean;
}

export const ReviewList: React.FC<ReviewListProps> = ({
  targetType,
  targetId,
  targetName,
  className,
  compact = false,
}) => {
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | undefined>(undefined);

  const fetchReviews = async () => {
    if (!targetId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res =
        targetType === 'HOSPITAL'
          ? await reviewApi.getHospitalReviews(targetId, 1, 10, selectedRating)
          : await reviewApi.getDoctorReviews(targetId, 1, 10, selectedRating);

      if (res.success && res.data) {
        setSummary(res.data.summary);
        setReviews(res.data.reviews);
      } else {
        setError(res.error || 'Failed to load reviews');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading reviews');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [targetId, targetType, selectedRating]);

  if (compact) {
    if (isLoading) {
      return <span className="text-[12px] text-slate-400">Loading rating...</span>;
    }
    if (!summary || summary.totalReviews === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-400">
          <Star className="w-3.5 h-3.5 text-slate-300" />
          <span>No reviews yet</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[12px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
        <span>{summary.averageRating?.toFixed(1)}</span>
        <span className="text-slate-400 font-normal">({summary.totalReviews})</span>
      </span>
    );
  }

  return (
    <div className={cn('bg-white rounded-3xl border border-slate-100 p-5 shadow-xs space-y-4', className)}>
      {/* Header & Rating Breakdown */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-[16px] font-black text-slate-900 flex items-center gap-2">
            <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
            <span>Ratings & Reviews</span>
            {targetName && <span className="text-slate-400 font-medium text-[13px]">• {targetName}</span>}
          </h3>
          <p className="text-[12px] text-slate-500 font-medium mt-0.5">
            Verified feedback from patients with completed consultations
          </p>
        </div>

        {summary && summary.totalReviews > 0 ? (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[24px] font-black text-slate-900 leading-none">
                {summary.averageRating?.toFixed(1)}
              </div>
              <div className="text-[11px] font-bold text-slate-400">
                {summary.totalReviews} {summary.totalReviews === 1 ? 'review' : 'reviews'}
              </div>
            </div>
            <div className="flex text-amber-400">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = (summary.averageRating || 0) >= star;
                return (
                  <Star
                    key={star}
                    className={cn('w-4 h-4', filled ? 'fill-amber-400 text-amber-400' : 'text-slate-200')}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-slate-400 text-[13px] font-medium italic">No reviews yet</div>
        )}
      </div>

      {/* Filter by star rating */}
      {summary && summary.totalReviews > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <button
            onClick={() => setSelectedRating(undefined)}
            className={cn(
              'px-2.5 py-1 rounded-xl text-[12px] font-bold transition-all cursor-pointer',
              selectedRating === undefined
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            All
          </button>
          {[5, 4, 3, 2, 1].map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRating(selectedRating === r ? undefined : r)}
              className={cn(
                'px-2.5 py-1 rounded-xl text-[12px] font-bold flex items-center gap-1 transition-all cursor-pointer',
                selectedRating === r
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              <span>{r}</span>
              <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
              <span className="text-[10px] opacity-75">({summary.ratingDistribution[r] || 0})</span>
            </button>
          ))}
        </div>
      )}

      {/* Reviews list */}
      {isLoading ? (
        <div className="py-8 flex items-center justify-center gap-2 text-slate-400 text-[13px]">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
          <span>Loading verified reviews...</span>
        </div>
      ) : error ? (
        <div className="py-4 text-center text-red-600 text-[13px] flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-[13px] space-y-1">
          <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-600">No reviews found</p>
          <p className="text-[12px]">Be the first to review after your appointment is completed!</p>
        </div>
      ) : (
        <div className="space-y-3 divide-y divide-slate-100">
          {reviews.map((rev) => (
            <div key={rev.id} className="pt-3 first:pt-0 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-slate-900">{rev.reviewerName}</span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={cn(
                        'w-3.5 h-3.5',
                        s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                      )}
                    />
                  ))}
                </div>
              </div>
              {rev.comment && <p className="text-[13px] text-slate-600 leading-relaxed">{rev.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
