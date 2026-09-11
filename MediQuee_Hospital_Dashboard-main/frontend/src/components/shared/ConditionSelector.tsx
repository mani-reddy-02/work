import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Search, X, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getConditionIconPath } from './ConditionLabel';



// Mock list of specializations
export const allSpecializations = [
  "Cardiology",
  "Neurology",
  "Pulmonology",
  "Nephrology",
  "Ophthalmology",
  "Gastroenterology",
  "Hepatology",
  "Dermatology",
  "General Physician",
  "Pediatrics",
  "Orthopedics",
  "Psychiatry",
  "Oncology",
  "Radiology",
];

// Mock list of tests
export const allTests = [
  "Complete Blood Count",
  "Lipid Profile",
  "Thyroid Profile",
  "HbA1c",
  "Liver Function Test",
  "Kidney Function Test",
  "Urine Routine",
  "Blood Sugar (FBS)",
  "Vitamin D Test",
  "Vitamin B12 Test",
  "X-Ray Chest",
  "ECG",
  "Dengue Test",
  "Malaria Test",
  "HIV Test",
];

interface ConditionSelectorProps {
  type: 'specialization' | 'test';
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}

export function ConditionSelector({ type, value, onChange, error }: ConditionSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const items = type === 'specialization' 
    ? allSpecializations.map(s => ({ name: s, iconPath: getConditionIconPath(s) }))
    : allTests.map(t => ({ name: t, iconPath: getConditionIconPath(t) }));

  // Show top 5 + 'More' in the compact view
  const visibleItems = items.slice(0, 5);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {visibleItems.map(item => {
          const isSelected = value === item.name;
          return (
            <div
              key={item.name}
              onClick={() => onChange(item.name)}
              className={cn(
                "flex items-center p-3 gap-3 rounded-xl border-2 transition-all cursor-pointer interactive-element",
                isSelected 
                  ? "border-primary bg-primary/5" 
                  : cn(error ? "border-destructive/40 bg-white hover:border-destructive" : "border-gray-100 hover:border-primary/40 bg-white")
              )}
            >
              {item.iconPath ? (
                <img src={item.iconPath} alt={item.name} className="w-8 h-8 object-contain drop-shadow-sm shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4 text-gray-400" />
                </div>
              )}
              <span className="text-[13px] font-semibold text-[#172033] leading-tight flex-1">{item.name}</span>
            </div>
          );
        })}
        
        {/* More Button */}
        <div
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center p-3 gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-all cursor-pointer interactive-element"
        >
          <Search className="w-5 h-5 text-gray-500" />
          <span className="text-[13px] font-semibold text-gray-600">Search more...</span>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">
                  Select {type === 'specialization' ? 'Specialization' : 'Test'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-4 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                {filteredItems.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 text-sm">
                    No results found
                  </div>
                ) : (
                  filteredItems.map(item => (
                    <button
                      key={item.name}
                      onClick={() => {
                        onChange(item.name);
                        setIsModalOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border text-left transition-all w-full",
                        value === item.name ? "bg-primary/5 border-primary" : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      {item.iconPath ? (
                        <img src={item.iconPath} alt={item.name} className="w-10 h-10 object-contain drop-shadow-sm" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Activity className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <span className="flex-1 text-sm font-semibold text-gray-900">{item.name}</span>
                      {value === item.name && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
