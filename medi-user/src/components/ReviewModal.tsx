import React, { useState, useEffect } from 'react';
import { 
  X, 
  Star, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  User, 
  Building2, 
  FlaskConical, 
  Stethoscope, 
  RefreshCw,
  Edit3
} from 'lucide-react';
import { reviewsApi, type ReviewTarget, type EligibilityResponse } from '../lib/reviewsApi';
import { cn } from '../lib/utils';

interface ReviewModalProps {
  bookingId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const STAR_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

export const ReviewModal: React.FC<ReviewModalProps> = ({
  bookingId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [eligibility, setEligibility] = useState<EligibilityResponse | null>(null);
  const [selectedTargetIndex, setSelectedTargetIndex] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [categoryRatings, setCategoryRatings] = useState<Record<string, number>>({});
  const [title, setTitle] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [guidelinesAcknowledged, setGuidelinesAcknowledged] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && bookingId) {
      loadTargets();
    }
  }, [isOpen, bookingId]);

  const loadTargets = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    const res = await reviewsApi.getEligibleTargets(bookingId);
    setLoading(false);
    if (res.success && res.data) {
      setEligibility(res.data);
      if (res.data.targets.length > 0) {
        initTargetForm(res.data.targets[0]);
      }
    } else {
      setError(res.error || 'Unable to load review eligibility for this booking.');
    }
  };

  const initTargetForm = (target: ReviewTarget) => {
    if (target.existingReview) {
      const rev = target.existingReview;
      setRating(rev.rating || 5);
      setCategoryRatings(rev.categoryRatings || {});
      setTitle(rev.title || '');
      setComment(rev.comment || '');
      setIsAnonymous(rev.isAnonymous || false);
      setIsEditing(false);
    } else {
      setRating(5);
      // Initialize all dimensions to 5 by default
      const initialCat: Record<string, number> = {};
      target.dimensions.forEach((d) => {
        initialCat[d.key] = 5;
      });
      setCategoryRatings(initialCat);
      setTitle('');
      setComment('');
      setIsAnonymous(false);
      setIsEditing(false);
    }
  };

  const handleSelectTarget = (index: number) => {
    setSelectedTargetIndex(index);
    if (eligibility?.targets[index]) {
      initTargetForm(eligibility.targets[index]);
    }
    setError(null);
    setSuccessMsg(null);
  };

  const handleDimensionChange = (key: string, value: number) => {
    setCategoryRatings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eligibility) return;
    const target = eligibility.targets[selectedTargetIndex];
    if (!target) return;

    if (rating < 1 || rating > 5) {
      setError('Please select an overall star rating between 1 and 5.');
      return;
    }

    if (!guidelinesAcknowledged) {
      setError('Please acknowledge that your review complies with platform guidelines.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isEditing && target.existingReview) {
        const res = await reviewsApi.editReview(target.existingReview.id, {
          rating,
          categoryRatings,
          title: title.trim() || undefined,
          comment: comment.trim() || undefined,
          isAnonymous,
        });

        if (res.success) {
          setSuccessMsg('Your review has been updated and resubmitted for moderation.');
          setIsEditing(false);
          await loadTargets();
          if (onSuccess) onSuccess();
        } else {
          setError(res.error || 'Failed to update review.');
        }
      } else {
        const res = await reviewsApi.submitReview({
          bookingId: target.bookingId,
          bookingType: target.bookingType,
          targetType: target.targetType,
          targetId: target.targetId,
          rating,
          categoryRatings,
          title: title.trim() || undefined,
          comment: comment.trim() || undefined,
          isAnonymous,
          guidelinesAcknowledged: true,
        });

        if (res.success) {
          setSuccessMsg('Thank you! Your review has been submitted and is pending moderation approval.');
          await loadTargets();
          if (onSuccess) onSuccess();
        } else {
          setError(res.error || 'Failed to submit review.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting your review.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentTarget = eligibility?.targets[selectedTargetIndex];
  const hasExisting = Boolean(currentTarget?.existingReview);
  const showForm = !hasExisting || isEditing;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Star className="w-5 h-5 fill-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {hasExisting && !isEditing ? 'Your Review' : 'Rate & Review Your Experience'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Verified Patient Feedback • MediQuee Healthcare Network
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm font-semibold text-slate-600">Verifying completed booking details...</p>
            </div>
          ) : error && !eligibility ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold">Review Ineligible</p>
                <p className="text-xs mt-1 text-rose-700">{error}</p>
              </div>
            </div>
          ) : eligibility ? (
            <>
              {/* Target Selector Tabs (e.g. Doctor vs Hospital for OP appointment) */}
              {eligibility.targets.length > 1 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Select Provider to Review
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl">
                    {eligibility.targets.map((t, idx) => (
                      <button
                        key={`${t.targetType}-${t.targetId}`}
                        type="button"
                        onClick={() => handleSelectTarget(idx)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer',
                          selectedTargetIndex === idx
                            ? 'bg-white text-blue-700 shadow-sm border border-slate-200/60'
                            : 'text-slate-600 hover:text-slate-900'
                        )}
                      >
                        {t.targetType === 'DOCTOR' ? (
                          <Stethoscope className="w-4 h-4 text-blue-600 shrink-0" />
                        ) : t.targetType === 'LABORATORY' ? (
                          <FlaskConical className="w-4 h-4 text-purple-600 shrink-0" />
                        ) : (
                          <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                        )}
                        <span className="truncate">{t.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Provider Info Banner */}
              {currentTarget && (
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-blue-200 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                      {currentTarget.avatar ? (
                        <img 
                          src={currentTarget.avatar} 
                          alt={currentTarget.title} 
                          className="w-full h-full object-cover" 
                        />
                      ) : currentTarget.targetType === 'DOCTOR' ? (
                        <Stethoscope className="w-6 h-6 text-blue-600" />
                      ) : currentTarget.targetType === 'LABORATORY' ? (
                        <FlaskConical className="w-6 h-6 text-purple-600" />
                      ) : (
                        <Building2 className="w-6 h-6 text-indigo-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-slate-900">{currentTarget.title}</h3>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Verified
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">{currentTarget.subtitle}</p>
                      <p className="text-[11px] text-blue-600 font-bold mt-0.5">{currentTarget.serviceTypeLabel}</p>
                    </div>
                  </div>

                  {/* Status Badge if already submitted */}
                  {hasExisting && currentTarget.existingReview && (
                    <div className="text-right">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border',
                        currentTarget.existingReview.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        currentTarget.existingReview.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        currentTarget.existingReview.status === 'FLAGGED' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      )}>
                        {currentTarget.existingReview.status === 'APPROVED' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        {currentTarget.existingReview.status === 'APPROVED' ? 'Published' :
                         currentTarget.existingReview.status === 'REJECTED' ? 'Not Approved' :
                         currentTarget.existingReview.status === 'FLAGGED' ? 'Under Investigation' :
                         'Pending Approval'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Alert Messages */}
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Existing Review Readonly View */}
              {hasExisting && !isEditing && currentTarget?.existingReview && (
                <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star 
                            key={s} 
                            className={cn(
                              'w-5 h-5',
                              s <= currentTarget.existingReview!.rating 
                                ? 'text-amber-400 fill-amber-400' 
                                : 'text-slate-200'
                            )} 
                          />
                        ))}
                      </div>
                      <span className="text-xs font-black text-slate-800">
                        {currentTarget.existingReview.rating}.0 • {STAR_LABELS[currentTarget.existingReview.rating]}
                      </span>
                    </div>

                    {currentTarget.existingReview.canEdit && (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Edit Review</span>
                      </button>
                    )}
                  </div>

                  {/* Category Ratings Breakdown */}
                  {currentTarget.existingReview.categoryRatings && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/80">
                      {currentTarget.dimensions.map((dim) => {
                        const score = currentTarget.existingReview!.categoryRatings[dim.key] || 5;
                        return (
                          <div key={dim.key} className="flex items-center justify-between text-xs py-1">
                            <span className="text-slate-600 font-medium truncate max-w-[200px]">{dim.label}</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star 
                                  key={s} 
                                  className={cn('w-3.5 h-3.5', s <= score ? 'text-amber-400 fill-amber-400' : 'text-slate-200')} 
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {currentTarget.existingReview.title && (
                    <h4 className="font-bold text-slate-900 text-sm">{currentTarget.existingReview.title}</h4>
                  )}

                  {currentTarget.existingReview.comment ? (
                    <p className="text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200">
                      "{currentTarget.existingReview.comment}"
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No written comment provided.</p>
                  )}

                  {/* Official Provider Response */}
                  {currentTarget.existingReview.response && (
                    <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-blue-800 font-bold text-xs">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Official Response from Provider:</span>
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed">
                        {currentTarget.existingReview.response}
                      </p>
                    </div>
                  )}

                  {currentTarget.existingReview.rejectionReason && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                      <strong>Moderation feedback:</strong> {currentTarget.existingReview.rejectionReason}
                    </div>
                  )}
                </div>
              )}

              {/* Review Submission / Edit Form */}
              {showForm && currentTarget && (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Overall Star Rating */}
                  <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100 gap-2">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Overall Experience Rating
                    </span>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                          className="p-1 text-slate-200 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                        >
                          <Star
                            className={cn(
                              'w-8 h-8 transition-colors',
                              (hoverRating || rating) >= star
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-300'
                            )}
                          />
                        </button>
                      ))}
                    </div>
                    <span className="text-xs font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                      {STAR_LABELS[hoverRating || rating]}
                    </span>
                  </div>

                  {/* Entity Specific Dimension Ratings */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Detailed Ratings by Experience Dimension
                    </label>
                    <div className="space-y-2.5 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                      {currentTarget.dimensions.map((dim) => {
                        const currentVal = categoryRatings[dim.key] || 5;
                        return (
                          <div 
                            key={dim.key} 
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 py-1.5 border-b border-slate-100 last:border-0"
                          >
                            <span className="text-xs font-semibold text-slate-800">{dim.label}</span>
                            <div className="flex items-center gap-1.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => handleDimensionChange(dim.key, s)}
                                  className={cn(
                                    'w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center',
                                    currentVal === s
                                      ? 'bg-blue-600 text-white shadow-xs'
                                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                  )}
                                  title={`${s} Star - ${STAR_LABELS[s]}`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Review Title (Optional) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Review Title <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Excellent care, very polite and punctual"
                      maxLength={100}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>

                  {/* Written Feedback (Optional) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Written Feedback <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Describe your consultation or visit experience to help other patients..."
                      maxLength={1000}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                    />
                    <p className="text-[10px] text-slate-400">
                      Tip: Keep feedback constructive. Do not include personal phone numbers or medical reports.
                    </p>
                  </div>

                  {/* Options & Guidelines */}
                  <div className="space-y-2 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span className="text-xs text-slate-700 font-medium">
                        Post anonymously (Your name will display as "Verified Patient")
                      </span>
                    </label>

                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={guidelinesAcknowledged}
                        onChange={(e) => setGuidelinesAcknowledged(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 mt-0.5"
                      />
                      <span className="text-[11px] text-slate-500 leading-tight">
                        I confirm that this review is based on my genuine patient experience and adheres to MediQuee Healthcare review guidelines.
                      </span>
                    </label>
                  </div>

                  {/* Submit Actions */}
                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        Cancel Edit
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Star className="w-3.5 h-3.5 fill-white" />
                          <span>{isEditing ? 'Update Review' : 'Submit Review'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
export default ReviewModal;
