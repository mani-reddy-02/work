import React, { useState, useEffect } from 'react';
import { Star, CheckCircle2, Building2, Stethoscope, MessageSquare, RefreshCw } from 'lucide-react';
import { reviewApi, type ReviewItem, type ReviewTargetType, type ReviewServiceType, type BookingReviewStatusResponse } from '../lib/reviewApi';
import { ReviewModal } from './ReviewModal';
import { ReviewList } from './ReviewList';

interface BookingReviewCardProps {
  bookingId: string;
  serviceType: ReviewServiceType;
  isCompleted: boolean;
  hospital: {
    id: string;
    name: string;
    logoUrl?: string | null;
  };
  doctor?: {
    id: string;
    name: string;
    avatar?: string | null;
    specialization?: string | null;
  } | null;
  onToast?: (message: string, type: 'success' | 'error') => void;
}

export const BookingReviewCard: React.FC<BookingReviewCardProps> = ({
  bookingId,
  serviceType,
  isCompleted,
  hospital,
  doctor,
  onToast,
}) => {
  const [reviewStatus, setReviewStatus] = useState<BookingReviewStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    targetType: ReviewTargetType;
    targetName: string;
    targetSubtitle?: string | null;
    targetImage?: string | null;
  } | null>(null);

  const fetchStatus = async () => {
    if (!bookingId) return;
    setIsLoading(true);
    try {
      const res = await reviewApi.getBookingReviewStatus(bookingId);
      if (res.success && res.data) {
        setReviewStatus(res.data);
      }
    } catch (e) {
      // non-blocking
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [bookingId]);

  if (!isCompleted) {
    return null;
  }

  const isConsultation = serviceType === 'OP_CONSULTATION' || serviceType === 'VIDEO_CONSULTATION';
  const hospitalReview = reviewStatus?.hospitalReview;
  const doctorReview = reviewStatus?.doctorReview;

  return (
    <div className="space-y-4 pt-1">
      <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-100 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Ratings & Experience</h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {isConsultation
                  ? 'Rate the hospital facility and your consulting doctor'
                  : 'Rate the healthcare service provider'}
              </p>
            </div>
          </div>
          {isLoading && <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />}
        </div>

        {/* Reviews Container */}
        <div className="space-y-3">
          {/* Hospital / Provider Review Card */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100/70 text-blue-600 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold tracking-wider uppercase text-blue-600">
                  {isConsultation ? 'Hospital Facility' : 'Service Provider'}
                </span>
                <h4 className="font-bold text-slate-900 text-xs truncate">{hospital.name}</h4>
                {hospitalReview && (
                  <div className="flex items-center gap-1 mt-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${
                          s <= hospitalReview.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                    <span className="text-[11px] font-bold text-slate-700 ml-1">
                      {hospitalReview.rating}/5
                    </span>
                  </div>
                )}
              </div>
            </div>

            {hospitalReview ? (
              <div className="text-right sm:text-right">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Reviewed
                </span>
                {hospitalReview.comment && (
                  <p className="text-[11px] text-slate-500 italic mt-1 max-w-[200px] truncate">
                    "{hospitalReview.comment}"
                  </p>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setModalConfig({
                    isOpen: true,
                    targetType: 'HOSPITAL',
                    targetName: hospital.name,
                    targetSubtitle: isConsultation ? 'Hospital Facility' : 'Healthcare Provider',
                    targetImage: hospital.logoUrl,
                  })
                }
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <Star className="w-3.5 h-3.5" />
                <span>Rate {isConsultation ? 'Hospital' : 'Provider'}</span>
              </button>
            )}
          </div>

          {/* Doctor Review Card (Only for OP / Video Consultation) */}
          {isConsultation && doctor && (
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {doctor.avatar ? (
                  <img
                    src={doctor.avatar}
                    alt={doctor.name}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 bg-white shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-indigo-100/70 text-indigo-600 flex items-center justify-center shrink-0">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-600">
                    Consulting Doctor
                  </span>
                  <h4 className="font-bold text-slate-900 text-xs truncate">{doctor.name}</h4>
                  {doctor.specialization && (
                    <p className="text-[10px] text-slate-500 truncate">{doctor.specialization}</p>
                  )}
                  {doctorReview && (
                    <div className="flex items-center gap-1 mt-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${
                            s <= doctorReview.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-200'
                          }`}
                        />
                      ))}
                      <span className="text-[11px] font-bold text-slate-700 ml-1">
                        {doctorReview.rating}/5
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {doctorReview ? (
                <div className="text-right sm:text-right">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Reviewed
                  </span>
                  {doctorReview.comment && (
                    <p className="text-[11px] text-slate-500 italic mt-1 max-w-[200px] truncate">
                      "{doctorReview.comment}"
                    </p>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setModalConfig({
                      isOpen: true,
                      targetType: 'DOCTOR',
                      targetName: doctor.name,
                      targetSubtitle: doctor.specialization || 'Consulting Specialist',
                      targetImage: doctor.avatar,
                    })
                  }
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>Rate Doctor</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Public Hospital Reviews */}
      <ReviewList targetType="HOSPITAL" targetId={hospital.id} targetName={hospital.name} />

      {/* Review Modal */}
      {modalConfig && (
        <ReviewModal
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig(null)}
          bookingId={bookingId}
          serviceType={serviceType}
          targetType={modalConfig.targetType}
          targetName={modalConfig.targetName}
          targetSubtitle={modalConfig.targetSubtitle}
          targetImage={modalConfig.targetImage}
          onSuccess={(newReview) => {
            setReviewStatus((prev) => {
              if (!prev) {
                return {
                  isEligible: true,
                  serviceType,
                  hospital,
                  doctor: doctor || null,
                  hospitalReview: newReview.targetType === 'HOSPITAL' ? newReview : null,
                  doctorReview: newReview.targetType === 'DOCTOR' ? newReview : null,
                };
              }
              return {
                ...prev,
                hospitalReview: newReview.targetType === 'HOSPITAL' ? newReview : prev.hospitalReview,
                doctorReview: newReview.targetType === 'DOCTOR' ? newReview : prev.doctorReview,
              };
            });
            if (onToast) {
              onToast(
                `Thank you! Your ${newReview.targetType.toLowerCase()} review has been submitted.`,
                'success'
              );
            }
          }}
        />
      )}
    </div>
  );
};
