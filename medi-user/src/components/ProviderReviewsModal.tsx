import React from 'react';
import { X, Star, ShieldCheck, Building2 } from 'lucide-react';
import { ProviderReviewsSection } from './ProviderReviewsSection';

export interface ProviderReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'DOCTOR' | 'HOSPITAL' | 'LABORATORY';
  targetId: string;
  providerName: string;
  onSelectProvider?: () => void;
}

export const ProviderReviewsModal: React.FC<ProviderReviewsModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  providerName,
  onSelectProvider,
}) => {
  if (!isOpen || !targetId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                {targetType === 'DOCTOR' ? 'Doctor Reviews' : targetType === 'LABORATORY' ? 'Laboratory Reviews' : 'Hospital Reviews'}
              </span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-base sm:text-lg truncate mt-0.5">
              {providerName}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Scrollable Provider Reviews Section */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <ProviderReviewsSection
            targetType={targetType}
            targetId={targetId}
            providerName={providerName}
          />
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
          {onSelectProvider && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onSelectProvider();
              }}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              Select & Proceed
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderReviewsModal;
