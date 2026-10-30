import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Star,
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
  User,
  FlaskConical,
  Stethoscope,
  HeartHandshake,
  Clock,
  Sparkles,
  RefreshCw,
  Send,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { reviewsApi, type ReviewInvitationDto } from '../lib/reviewsApi';
import { cn } from '../lib/utils';

const STAR_LABELS: Record<number, { text: string; color: string; bg: string }> = {
  1: { text: 'Poor', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
  2: { text: 'Fair', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
  3: { text: 'Good', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  4: { text: 'Very Good', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  5: { text: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
};

/**
 * Checks if the user is currently on an unsafe/critical route where
 * popups should NOT interrupt active interactions (e.g. video call, payment, checkout).
 */
function isUnsafeRoute(pathname: string): boolean {
  const p = pathname.toLowerCase();
  return (
    p.startsWith('/video-consultation') ||
    p.startsWith('/payment') ||
    p.startsWith('/checkout') ||
    p.includes('/book/') ||
    p.includes('/pay')
  );
}

export const PostServiceReviewPopup: React.FC = () => {
  const { isLoggedIn, user } = useAuth();
  const location = useLocation();

  // Queue of eligible review invitations
  const [queue, setQueue] = useState<ReviewInvitationDto[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  // Form State for current invitation
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [showCommentBox, setShowCommentBox] = useState<boolean>(false);

  // Submission States
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Prevent multiple calls in rapid succession
  const lastCheckTimeRef = useRef<number>(0);

  // Check eligible invitations from backend
  const checkInvitations = useCallback(async () => {
    if (!isLoggedIn || !user) return;
    if (isUnsafeRoute(location.pathname)) return;

    // Throttle checks to once every 15 seconds unless forced
    const now = Date.now();
    if (now - lastCheckTimeRef.current < 15000) return;
    lastCheckTimeRef.current = now;

    try {
      setIsChecking(true);
      const res = await reviewsApi.getPendingInvitations(false);
      setIsChecking(false);

      if (res.success && res.data && res.data.length > 0) {
        setQueue(res.data);
        setCurrentIndex(0);
        // Reset form for first item
        setRating(5);
        setHoverRating(0);
        setTitle('');
        setComment('');
        setIsAnonymous(false);
        setShowCommentBox(false);
        setError(null);
        setSuccess(false);
        setIsOpen(true);
      }
    } catch {
      setIsChecking(false);
    }
  }, [isLoggedIn, user, location.pathname]);

  // Trigger check on login and route change if safe
  useEffect(() => {
    if (isLoggedIn && !isUnsafeRoute(location.pathname)) {
      // Delay slightly so route transition finishes smoothly
      const timer = setTimeout(() => {
        checkInvitations();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, location.pathname, checkInvitations]);

  const currentItem = queue[currentIndex] || null;

  // Format completed date
  const formatServiceDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  // Helper to get service icon
  const getTargetIcon = (targetType: string, bookingType?: string) => {
    if (targetType === 'DOCTOR') {
      return <Stethoscope className="w-5 h-5 text-blue-600" />;
    }
    if (targetType === 'LABORATORY') {
      return <FlaskConical className="w-5 h-5 text-purple-600" />;
    }
    if (bookingType === 'HOME_NURSING') {
      return <HeartHandshake className="w-5 h-5 text-rose-600" />;
    }
    return <Building2 className="w-5 h-5 text-teal-600" />;
  };

  // Handle Postpone / "Maybe Later" / Close (X)
  const handlePostpone = async () => {
    if (!currentItem) {
      setIsOpen(false);
      return;
    }

    try {
      // Persist postponement in backend for 24h
      await reviewsApi.postponeInvitation({
        invitationId: currentItem.id,
        bookingId: currentItem.bookingId,
        targetId: currentItem.targetId,
        hours: 24,
      });
    } catch (e) {
      console.warn('Failed to postpone invitation on server:', e);
    }

    // Dismiss popup smoothly
    setIsOpen(false);
  };

  // Handle Review Submission
  const handleSubmitReview = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentItem) return;

    if (rating < 1 || rating > 5) {
      setError('Please select a rating between 1 and 5 stars.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Build category ratings from default dimensions
      const categoryRatings: Record<string, number> = {};
      if (currentItem.dimensions && currentItem.dimensions.length > 0) {
        currentItem.dimensions.forEach((dim) => {
          categoryRatings[dim.key] = rating;
        });
      }

      const payload = {
        bookingId: currentItem.bookingId,
        bookingType: currentItem.bookingType,
        targetType: currentItem.targetType,
        targetId: currentItem.targetId,
        rating,
        categoryRatings,
        title: title.trim() || undefined,
        comment: comment.trim() || undefined,
        isAnonymous,
        guidelinesAcknowledged: true,
      };

      const res = await reviewsApi.submitReview(payload);

      if (res.success) {
        setSuccess(true);
        setSubmitting(false);

        // Check if there are more queued invitations
        setTimeout(() => {
          if (currentIndex + 1 < queue.length) {
            // Move to next queued invitation
            setCurrentIndex((prev) => prev + 1);
            setRating(5);
            setHoverRating(0);
            setTitle('');
            setComment('');
            setIsAnonymous(false);
            setShowCommentBox(false);
            setError(null);
            setSuccess(false);
          } else {
            // Completed all queued invitations
            setIsOpen(false);
          }
        }, 1800);
      } else {
        setError(res.error || 'Failed to submit review. Please try again.');
        setSubmitting(false);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while submitting review.');
      setSubmitting(false);
    }
  };

  // If closed or unsafe route or no item, render nothing
  if (!isOpen || !currentItem || isUnsafeRoute(location.pathname)) {
    return null;
  }

  const effectiveRating = hoverRating || rating;
  const ratingMeta = STAR_LABELS[effectiveRating] || STAR_LABELS[5];

  return (
    <div 
      className="fixed inset-x-4 bottom-5 md:inset-x-auto md:right-8 md:bottom-8 z-50 flex justify-end pointer-events-none animate-in slide-in-from-bottom-6 fade-in duration-300"
      aria-live="polite"
    >
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,85,255,0.18)] border border-blue-100 overflow-hidden pointer-events-auto flex flex-col transition-all">
        {/* Top Header with MediQuee Blue Gradient Accent */}
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white p-5 pb-6">
          {/* Subtle Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
          
          <div className="flex items-start justify-between gap-3 relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[11px] font-bold text-white mb-2 tracking-wide uppercase">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Service Completed</span>
                {queue.length > 1 && (
                  <span className="ml-1 opacity-90 text-[10px]">
                    ({currentIndex + 1} of {queue.length})
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black text-white leading-tight">
                How was your experience?
              </h3>
              <p className="text-[12px] text-blue-100 mt-0.5 leading-snug">
                Your feedback helps us improve healthcare services.
              </p>
            </div>

            {/* Close Button (Postpones for 24h) */}
            <button
              onClick={handlePostpone}
              disabled={submitting}
              className="text-white/80 hover:text-white hover:bg-white/15 p-1.5 rounded-full transition-colors cursor-pointer shrink-0"
              title="Close and review later"
              aria-label="Close review popup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col gap-4 bg-slate-50/50">
          {/* Target Service Card */}
          <div className="flex items-center gap-3.5 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
              {currentItem.targetAvatar ? (
                <img
                  src={currentItem.targetAvatar}
                  alt={currentItem.targetTitle}
                  className="w-full h-full object-cover"
                />
              ) : (
                getTargetIcon(currentItem.targetType, currentItem.bookingType)
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-extrabold text-[14px] text-slate-900 truncate">
                  {currentItem.targetTitle}
                </h4>
              </div>
              <p className="text-[12px] font-medium text-slate-500 truncate">
                {currentItem.targetSubtitle || currentItem.serviceTypeLabel}
              </p>
              {currentItem.serviceDate && (
                <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 mt-0.5">
                  <Clock className="w-3 h-3 text-blue-600" />
                  <span>Completed on {formatServiceDate(currentItem.serviceDate)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Success State */}
          {success ? (
            <div className="py-6 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-black text-slate-800">
                Thank You for Your Feedback!
              </h4>
              <p className="text-[12px] text-slate-500 max-w-xs mt-1">
                Your review has been submitted and sent for moderation.
              </p>
              {currentIndex + 1 < queue.length && (
                <p className="text-[11px] font-bold text-blue-600 mt-2">
                  Loading next eligible review...
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="flex flex-col gap-4">
              {/* Star Rating Section */}
              <div className="flex flex-col items-center justify-center pt-1 pb-1">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const isFilled = starVal <= (hoverRating || rating);
                    return (
                      <button
                        key={starVal}
                        type="button"
                        disabled={submitting}
                        onClick={() => setRating(starVal)}
                        onMouseEnter={() => setHoverRating(starVal)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 rounded-xl hover:scale-110 active:scale-95 transition-transform cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        title={`Rate ${starVal} out of 5 stars`}
                        aria-label={`Rate ${starVal} stars`}
                      >
                        <Star
                          className={cn(
                            'w-8 h-8 transition-colors duration-150',
                            isFilled
                              ? 'text-amber-500 fill-amber-400 drop-shadow-sm'
                              : 'text-slate-300 stroke-slate-400 fill-transparent'
                          )}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Rating Label Badge */}
                <div className="mt-2.5">
                  <span
                    className={cn(
                      'inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-2xs transition-colors',
                      ratingMeta.bg,
                      ratingMeta.color
                    )}
                  >
                    {ratingMeta.text}
                  </span>
                </div>
              </div>

              {/* Optional Written Feedback Toggle / Inputs */}
              {!showCommentBox ? (
                <button
                  type="button"
                  onClick={() => setShowCommentBox(true)}
                  className="flex items-center justify-center gap-1.5 text-[12px] font-bold text-blue-600 hover:text-blue-800 transition-colors py-1 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Write a detailed review (optional)</span>
                </button>
              ) : (
                <div className="flex flex-col gap-2.5 pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Short title / headline (optional)"
                    maxLength={100}
                    disabled={submitting}
                    className="w-full text-[13px] px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 placeholder-slate-400"
                  />

                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us what you liked or how we can improve (optional)..."
                    rows={3}
                    maxLength={1000}
                    disabled={submitting}
                    className="w-full text-[13px] p-3.5 bg-white rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 placeholder-slate-400 resize-none"
                  />

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      disabled={submitting}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[11px] font-medium text-slate-600">
                      Submit anonymously (hide your name on public reviews)
                    </span>
                  </label>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span className="flex-1">{error}</span>
                  <button
                    type="button"
                    onClick={() => handleSubmitReview()}
                    className="underline text-xs font-bold text-rose-800 hover:text-rose-900 cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-1">
                {/* Secondary: Maybe Later */}
                <button
                  type="button"
                  onClick={handlePostpone}
                  disabled={submitting}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 hover:border-slate-300 transition-colors disabled:opacity-50 cursor-pointer text-center"
                >
                  Maybe Later
                </button>

                {/* Primary: Submit Review */}
                <button
                  type="submit"
                  disabled={submitting || rating < 1}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black hover:from-blue-700 hover:to-indigo-700 active:scale-98 transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Review</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
export default PostServiceReviewPopup;
