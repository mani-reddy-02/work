import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2 } from "lucide-react"

interface SuccessModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  onClose: () => void;
}

export function SuccessModal({ isOpen, title, description, onClose }: SuccessModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-surface rounded-3xl shadow-xl w-full max-w-sm overflow-hidden relative z-10 flex flex-col items-center p-8 text-center"
          >
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-5 border-[8px] border-green-50/50">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-[22px] font-bold text-[#172033] mb-2">{title}</h2>
            <p className="text-[#667085] text-[15px] mb-8 leading-relaxed px-2">
              {description}
            </p>
            <button 
              onClick={onClose}
              className="w-full bg-primary hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-sm interactive-element"
            >
              Continue
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
