import { UploadCloud, CheckCircle2, FileText, Trash2, RefreshCw } from "lucide-react";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DocumentUploadCardProps {
  id: string;
  title: string;
  description: string;
  requirement: "REQUIRED" | "OPTIONAL" | "IF APPLICABLE";
  value?: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}

export function DocumentUploadCard({
  id,
  title,
  description,
  requirement,
  value,
  onChange,
  error
}: DocumentUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    // Check size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      // Use existing toast if available, otherwise just setting error string conceptually
      // Since we don't have access to Toast context directly here without importing, 
      // we'll rely on the parent form validation, but it's good UX to block it here too.
      alert("File size must be 10 MB or less.");
      return;
    }
    onChange(file);
  };

  const getRequirementBadge = () => {
    switch (requirement) {
      case "REQUIRED":
        return <span className="bg-red-50 text-red-600 text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md">Required</span>;
      case "OPTIONAL":
        return <span className="bg-gray-100 text-gray-500 text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md">Optional</span>;
      case "IF APPLICABLE":
        return <span className="bg-blue-50 text-blue-600 text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md">If Applicable</span>;
    }
  };

  return (
    <div className={`flex flex-col bg-white border-2 rounded-[20px] transition-all overflow-hidden ${
      error ? 'border-red-500' : value ? 'border-[#16A34A]/50 bg-[#16A34A]/5' : 'border-gray-200'
    }`}>
      
      <div className="p-4 flex gap-3">
        <div className="w-10 h-10 shrink-0 bg-blue-50 text-blue-500 flex items-center justify-center rounded-xl">
          <FileText className="w-5 h-5" />
        </div>
        
        <div className="flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-[14px] font-bold text-[#172033] leading-tight">{title}</h4>
            {getRequirementBadge()}
          </div>
          <p className="text-[12px] text-[#667085] leading-snug">{description}</p>
        </div>
      </div>

      <div className="px-4 pb-4">
        <AnimatePresence mode="wait">
          {!value ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className={`w-full h-12 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 text-[13px] font-bold transition-colors ${
                  isDragging 
                    ? 'border-[#1769E0] bg-[#1769E0]/5 text-[#1769E0]' 
                    : error
                      ? 'border-red-300 text-red-500 bg-red-50'
                      : 'border-gray-300 text-[#1769E0] bg-gray-50 hover:bg-gray-100'
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) validateAndSetFile(file);
                }}
              >
                <UploadCloud className="w-4 h-4" />
                Upload Document
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="file"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-3"
            >
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#16A34A]/20 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-[13px] font-bold text-[#172033] truncate">{value.name}</span>
                  <span className="text-[11px] font-semibold text-[#667085]">
                    Selected • {(value.size / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="px-3 py-1.5 flex items-center gap-1.5 text-[12px] font-bold text-[#1769E0] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Replace
                </button>
                <button
                  type="button"
                  onClick={() => onChange(null)}
                  className="px-3 py-1.5 flex items-center gap-1.5 text-[12px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {error && !value && (
          <p className="text-red-500 text-[11px] font-semibold mt-2 px-1">{error}</p>
        )}
      </div>

      <input 
        type="file"
        ref={inputRef}
        id={id}
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileSelect}
      />
    </div>
  );
}
