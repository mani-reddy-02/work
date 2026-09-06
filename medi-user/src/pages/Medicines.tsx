import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Pill, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

const mockMedicines = [
  {
    id: 1,
    name: "Paracetamol 500mg",
    category: "Fever & pain relief",
    form: "Tablet",
    price: 50,
    usage: "Take 1 tablet every 6 hours after food for fever or pain."
  },
  {
    id: 2,
    name: "Cetirizine 10mg",
    category: "Allergy relief",
    form: "Tablet",
    price: 80,
    usage: "Take 1 tablet at night or as directed for allergy symptoms."
  },
  {
    id: 3,
    name: "Amoxicillin 250mg",
    category: "Antibiotic",
    form: "Capsule",
    price: 120,
    usage: "Take 1 capsule every 8 hours. Complete the full course."
  },
  {
    id: 4,
    name: "Cough Syrup",
    category: "Cough & Cold",
    form: "Syrup",
    price: 95,
    usage: "Take 2 teaspoons 3 times a day for cough relief."
  }
];

export default function Medicines() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMedicine, setSelectedMedicine] = useState<typeof mockMedicines[0] | null>(null);
  const [addedToList, setAddedToList] = useState(false);

  const q = searchQuery.toLowerCase().trim();
  const filteredMedicines = q ? mockMedicines.filter(m => 
    m.name.toLowerCase().includes(q) || 
    m.category.toLowerCase().includes(q)
  ) : mockMedicines;

  const handleAddToList = () => {
    setAddedToList(true);
    setTimeout(() => {
      setSelectedMedicine(null);
      setAddedToList(false);
    }, 2000);
  };

  if (selectedMedicine) {
    return (
      <div className="max-w-7xl mx-auto w-full flex flex-col min-h-[calc(100vh-64px)] bg-slate-50 md:bg-transparent">
        <div className="bg-white sticky top-0 z-20 px-4 py-4 border-b border-slate-100 flex items-center shadow-sm md:rounded-t-2xl md:border">
          <button 
            onClick={() => { setSelectedMedicine(null); setAddedToList(false); }} 
            className="p-1 -ml-1 mr-3 text-slate-600 hover:text-primary transition-colors rounded-full hover:bg-slate-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Medicine Details</h1>
        </div>

        <div className="flex-1 p-4 md:p-6 bg-slate-50 md:bg-white md:border-x md:border-b md:rounded-b-2xl">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-4">
                <Pill className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">{selectedMedicine.name}</h2>
              <p className="text-slate-500 font-medium">{selectedMedicine.category}</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-6 space-y-4">
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
                <p className="text-xl font-bold text-primary">₹{selectedMedicine.price}</p>
              </div>
            </div>

            <button 
              onClick={handleAddToList}
              disabled={addedToList}
              className={cn(
                "w-full py-3.5 font-semibold rounded-xl transition-all flex items-center justify-center gap-2",
                addedToList 
                  ? "bg-green-100 text-green-700" 
                  : "bg-primary text-white hover:bg-blue-700 shadow-md shadow-primary/20"
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
    <div className="max-w-7xl mx-auto w-full flex flex-col min-h-[calc(100vh-64px)] md:px-4 md:py-6 bg-slate-50 md:bg-transparent">
      {/* Header */}
      <div className="bg-white sticky top-0 z-20 px-4 py-4 border-b border-slate-100 flex items-center shadow-sm md:rounded-t-2xl md:border">
        <button 
          onClick={() => navigate(-1)} 
          className="p-1 -ml-1 mr-3 text-slate-600 hover:text-primary transition-colors rounded-full hover:bg-slate-50"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Medicines</h1>
      </div>

      <div className="flex-1 p-4 md:p-6 bg-slate-50 md:bg-white md:border-x md:border-b md:rounded-b-2xl">
        <div className="max-w-md mx-auto mb-6">
          <h2 className="text-slate-600 font-medium mb-4 text-center">Find and manage your medicines</h2>
          
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
             </div>
             <input 
               type="text" 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all shadow-sm" 
               placeholder="Search medicines..." 
             />
          </div>
        </div>

        <div className="space-y-3 max-w-md mx-auto">
          {q && filteredMedicines.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-[14px] text-slate-500 font-bold">No matching medicines found</p>
            </div>
          ) : (
            filteredMedicines.map(medicine => (
              <div key={medicine.id} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                    <Pill className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 leading-tight">{medicine.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">{medicine.category}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                      <span className="text-xs text-slate-500">{medicine.form}</span>
                    </div>
                    <p className="text-sm font-semibold text-primary mt-1">₹{medicine.price}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedMedicine(medicine)}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg transition-colors flex items-center gap-1 border border-slate-200"
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
