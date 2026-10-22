import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Pill, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
export default function Medicines() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMedicine, setSelectedMedicine] = useState<any | null>(null);
  const [addedToList, setAddedToList] = useState(false);
  const [medicines, setMedicines] = useState<any[]>([]);

  const q = searchQuery.toLowerCase().trim();
  const filteredMedicines = q ? medicines.filter(m => 
    m.name.toLowerCase().includes(q) || 
    m.category.toLowerCase().includes(q)
  ) : medicines;

  const handleAddToList = () => {
    setAddedToList(true);
    setTimeout(() => {
      setSelectedMedicine(null);
      setAddedToList(false);
    }, 2000);
  };

  if (selectedMedicine) {
    return (
      <div className="max-w-4xl mx-auto w-full flex flex-col min-h-[calc(100vh-64px)] px-4 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-x-hidden">
        <div className="bg-white sticky top-0 z-20 px-4 sm:px-6 py-4 border border-slate-100 flex items-center shadow-sm rounded-t-2xl">
          <button 
            onClick={() => { setSelectedMedicine(null); setAddedToList(false); }} 
            className="p-1 -ml-1 mr-3 text-slate-600 hover:text-primary transition-colors rounded-full hover:bg-slate-50 cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Medicine Details</h1>
        </div>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-white border-x border-b border-slate-100 rounded-b-2xl">
          <div className="max-w-xl mx-auto">
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-sm mb-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <Pill className="w-8 h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">{selectedMedicine.name}</h2>
              <p className="text-slate-500 font-medium text-sm sm:text-base">{selectedMedicine.category}</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm mb-6 space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Form</h4>
                <p className="text-slate-800 font-medium">{selectedMedicine.form}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Usage Information</h4>
                <p className="text-slate-800 text-sm leading-relaxed">{selectedMedicine.usage}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Example Price</h4>
                <p className="text-xl sm:text-2xl font-bold text-primary">₹{selectedMedicine.price}</p>
              </div>
            </div>

            <button 
              onClick={handleAddToList}
              disabled={addedToList}
              className={cn(
                "w-full py-3.5 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base",
                addedToList 
                  ? "bg-green-100 text-green-700" 
                  : "bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20"
              )}
            >
              {addedToList ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Added to Medicine List
                </>
              ) : (
                "Add to List"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col min-h-[calc(100vh-64px)] px-4 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-x-hidden">
      {/* Header */}
      <div className="bg-white sticky top-0 z-20 px-4 sm:px-6 py-4 border border-slate-100 flex items-center shadow-sm rounded-t-2xl">
        <button 
          onClick={() => navigate(-1)} 
          className="p-1 -ml-1 mr-3 text-slate-600 hover:text-primary transition-colors rounded-full hover:bg-slate-50 cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Medicines</h1>
      </div>

      <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-white border-x border-b border-slate-100 rounded-b-2xl">
        <div className="max-w-xl mx-auto mb-6">
          <h2 className="text-slate-600 font-medium mb-4 text-center text-sm sm:text-base">Find and manage your medicines</h2>
          
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
             </div>
             <input 
               type="text" 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm sm:text-base transition-all shadow-sm" 
               placeholder="Search medicines..." 
             />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {q && filteredMedicines.length === 0 ? (
            <div className="text-center py-12 sm:col-span-2 lg:col-span-3">
              <p className="text-sm font-bold text-slate-500">No matching medicines found</p>
            </div>
          ) : (
            filteredMedicines.map(medicine => (
              <div key={medicine.id} className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm flex items-center justify-between gap-3 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center shrink-0 border border-teal-100/50">
                    <Pill className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 leading-tight truncate text-sm sm:text-base">{medicine.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-xs text-slate-500">{medicine.category}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span className="text-xs text-slate-500">{medicine.form}</span>
                    </div>
                    <p className="text-sm font-bold text-primary mt-1">₹{medicine.price}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedMedicine(medicine)}
                  className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-1 border border-slate-200 cursor-pointer shrink-0"
                >
                  View
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
