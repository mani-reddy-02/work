import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100">
        <Icon className="w-8 h-8 text-[#98A2B3]" />
      </div>
      <h3 className="text-[17px] font-bold text-[#172033] mb-1">{title}</h3>
      <p className="text-[14px] text-[#667085] max-w-[250px] mb-6 leading-relaxed">
        {description}
      </p>
      
      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="bg-primary text-white font-semibold text-[14px] px-6 py-2.5 rounded-xl shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-colors interactive-element w-full max-w-[200px]"
        >
          {actionLabel}
        </button>
      )}
      
      {secondaryActionLabel && onSecondaryAction && (
        <button 
          onClick={onSecondaryAction}
          className="text-[#667085] font-semibold text-[14px] px-6 py-2.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors interactive-element w-full max-w-[200px] mt-2"
        >
          {secondaryActionLabel}
        </button>
      )}
    </div>
  );
}
