import { BottomSheet } from './BottomSheet';

interface ConfirmationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  isDestructive?: boolean;
}

export function ConfirmationSheet({
  isOpen,
  onClose,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  isDestructive = false
}: ConfirmationSheetProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-4 py-2">
        <div className="flex flex-col gap-2">
          <h2 className="text-[20px] font-bold text-[#172033]">{title}</h2>
          <p className="text-[14px] text-[#667085]">{description}</p>
        </div>
        <div className="flex flex-col gap-3 mt-4">
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`w-full py-3.5 rounded-xl font-semibold text-[15px] transition-colors interactive-element ${
              isDestructive 
                ? 'bg-red-50 text-destructive hover:bg-red-100 active:bg-red-200' 
                : 'bg-primary text-white hover:bg-blue-700 active:bg-blue-800'
            }`}
          >
            {confirmLabel}
          </button>
          <button 
            onClick={onClose}
            className="w-full py-3.5 rounded-xl font-semibold text-[15px] text-[#172033] bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors interactive-element"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
