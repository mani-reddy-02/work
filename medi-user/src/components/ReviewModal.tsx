import React, { useState } from 'react';
import { Star, X, CheckCircle2, AlertCircle, Building2, Stethoscope, Loader2 } from 'lucide-react';
import { reviewApi, type ReviewTargetType, type ReviewServiceType, type ReviewItem } from '../lib/reviewApi';
import { cn } from '../lib/utils';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  serviceType: ReviewServiceType;
  targetType: ReviewTargetType;
  targetName: string;
  targetSubtitle?: string | null;
  targetImage?: string | null;
  onSuccess: (review: ReviewItem) => void;
}

const STAR_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  serviceType,
  targetType,
  targetName,
  targetSubtitle,
  targetImage,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentStar = hoverRating || rating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (rating < 1 || rating > 5) {
      setErrorMessage('Please select a rating between 1 and 5 stars.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await reviewApi.submitReview({
        bookingId,
        serviceType,
        targetType,
        rating,
        comment: comment.trim() || undefined,
      });

      if (res.success && res.data) {
        setSuccessMessage('Thank you! Your review has been saved.');
        setTimeout(() => {
          onSuccess(res.data!);
          onClose();
        }, 1200);
      } else {
        setErrorMessage(res.error || 'Failed to submit review. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
              {targetType === 'DOCTOR' ? 'Doctor Review' : 'Hospital Review'}
            </span>
            <h3 className="text-[18px] font-black text-slate-900 mt-1">
              Rate {targetType === 'DOCTOR' ? 'Doctor' : 'Hospital / Provider'}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            aria-label="Close review dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Target Profile Card */}
          <div className="flex items-center gap-3.5 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
            {targetImage ? (
              <img
                src={targetImage}
                alt={targetName}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-white"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-blue-100/70 text-blue-600 flex items-center justify-center shrink-0">
                {targetType === 'DOCTOR' ? (
                  <Stethoscope className="w-6 h-6" />
                ) : (
                  <Building2 className="w-6 h-6" />
                )}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-[15px] text-slate-900 truncate">{targetName}</h4>
              {targetSubtitle && (
                <p className="text-[12px] font-medium text-slate-500 truncate">{targetSubtitle}</p>
              )}
            </div>
          </div>

          {/* Star Rating Selection */}
          <div className="space-y-2 text-center py-2">
            <label className="block text-[13px] font-bold text-slate-700">
              How was your experience? <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= currentStar;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    disabled={isSubmitting}
                    className="p-1.5 transition-transform hover:scale-115 active:scale-95 focus:outline-hidden cursor-pointer"
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  >
                    <Star
                      className={cn(
                        'w-8 h-8 transition-colors',
                        isFilled
                          ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                          : 'text-slate-200 hover:text-slate-300'
                      )}
                    />
                  </button>
                );
              })}
            </div>
            <div className="h-5">
              {currentStar > 0 ? (
                <span className="text-[13px] font-bold text-amber-600 animate-in fade-in duration-150">
                  {STAR_LABELS[currentStar]}
                </span>
              ) : (
                <span className="text-[12px] text-slate-400">Tap a star to rate (1 - 5)</span>
              )}
            </div>
          </div>

          {/* Comment / Written Feedback */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[13px]">
              <label htmlFor="review-comment" className="font-bold text-slate-700">
                Written Feedback <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <span className="text-[11px] font-medium text-slate-400">
                {comment.length}/1000
              </span>
            </div>
            <textarea
              id="review-comment"
              rows={3}
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isSubmitting}
              placeholder={`Share details about your experience with ${targetName}...`}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-[14px] text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none disabled:bg-slate-50"
            />
          </div>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-[13px] text-red-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-[13px] text-emerald-700 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-[14px] hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rating === 0 || !!successMessage}
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[14px] transition-all shadow-md shadow-blue-500/20 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : successMessage ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submitted</span>
                </>
              ) : (
                <span>Submit Review</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
