import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-20 left-0 right-0 z-[150] px-4 pointer-events-none flex flex-col gap-2 items-center">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              layout
              key={t.id}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border pointer-events-auto max-w-[400px] w-full",
                t.type === 'success' ? "bg-surface border-green-100 shadow-green-900/5" : "",
                t.type === 'error' ? "bg-surface border-red-100 shadow-red-900/5" : "",
                t.type === 'warning' ? "bg-surface border-orange-100 shadow-orange-900/5" : "",
                t.type === 'info' ? "bg-surface border-blue-100 shadow-blue-900/5" : ""
              )}
            >
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-success shrink-0" />}
              {t.type === 'error' && <XCircle className="w-5 h-5 text-destructive shrink-0" />}
              {t.type === 'warning' && <AlertCircle className="w-5 h-5 text-warning shrink-0" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-blue-500 shrink-0" />}
              
              <span className="text-[14px] font-semibold text-[#172033] flex-1">
                {t.message}
              </span>
              
              <button 
                onClick={() => removeToast(t.id)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 transition-colors shrink-0 interactive-element"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
