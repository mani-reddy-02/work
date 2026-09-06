import { useState } from 'react';
import { ChevronLeft, Calculator, Activity, ArrowRight, RefreshCcw, User, Info, History, Calendar, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

interface BmiHistoryRecord {
  id: string;
  dateTime: string;
  bmi: string;
  category: string;
  color: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  isAdult: boolean;
}

const CheckMyBMI = () => {
  const navigate = useNavigate();
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ 
    bmi: string, 
    category: string, 
    color: string,
    age: number,
    gender: string,
    height: number,
    weight: number,
    isAdult: boolean 
  } | null>(null);

  const [history, setHistory] = useState<BmiHistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem('mediquee_bmi_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const calculateBMI = () => {
    setError('');
    
    if (!age || !gender || !weight || !height) {
      setError('All fields are required.');
      return;
    }

    const a = parseInt(age, 10);
    const h = parseFloat(height);
    const w = parseFloat(weight);

    if (isNaN(a) || a <= 0) {
      setError('Age must be a valid positive number.');
      return;
    }
    if (isNaN(h) || h <= 0) {
      setError('Height must be greater than 0.');
      return;
    }
    if (isNaN(w) || w <= 0) {
      setError('Weight must be greater than 0.');
      return;
    }

    const heightInMeters = h / 100;
    const bmiValue = w / (heightInMeters * heightInMeters);
    const bmi = bmiValue.toFixed(1);
    
    const isAdult = a >= 18;
    let category = '';
    let color = 'text-blue-500';

    if (isAdult) {
      if (bmiValue < 18.5) {
        category = 'Underweight';
        color = 'text-blue-500';
      } else if (bmiValue >= 18.5 && bmiValue <= 24.9) {
        category = 'Normal weight';
        color = 'text-emerald-500';
      } else if (bmiValue >= 25 && bmiValue <= 29.9) {
        category = 'Overweight';
        color = 'text-orange-500';
      } else {
        category = 'Obesity';
        color = 'text-red-500';
      }
    } else {
      category = 'BMI interpretation for children and teenagers requires age- and sex-specific growth charts.';
      color = 'text-slate-600';
    }
    
    const newRecord: BmiHistoryRecord = {
      id: Date.now().toString(),
      dateTime: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      bmi,
      category,
      color,
      age: a,
      gender,
      height: h,
      weight: w,
      isAdult
    };

    setResult({ bmi, category, color, age: a, gender, height: h, weight: w, isAdult });

    setHistory(prev => {
      const updated = [newRecord, ...prev];
      try {
        localStorage.setItem('mediquee_bmi_history', JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save BMI history to localStorage', err);
      }
      return updated;
    });
  };

  const resetForm = () => {
    setResult(null);
    setError('');
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('mediquee_bmi_history');
    } catch (err) {
      console.error('Failed to clear BMI history', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-theme-gradient pt-4 pb-14 px-4 text-white rounded-b-3xl">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Check My BMI</h1>
        </div>
      </div>

      <div className="px-4 -mt-8 flex-1 pb-8 overflow-y-auto">
        {!result ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                <Calculator className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-slate-800">BMI Calculator</h2>
                <p className="text-xs text-slate-500">Enter your details below</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-medium mb-4 flex items-start gap-2 border border-red-100">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Age</label>
                <input 
                  type="number" 
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 25"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Gender</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Male', 'Female', 'Other'].map(g => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={cn(
                        "py-3 px-2 rounded-xl border text-xs font-semibold transition-all text-center",
                        gender === g 
                          ? "border-primary bg-primary/5 text-primary" 
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Height (cm)</label>
                  <input 
                    type="number" 
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="e.g. 170"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Weight (kg)</label>
                  <input 
                    type="number" 
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="e.g. 65"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <button 
                onClick={calculateBMI}
                className="w-full py-3.5 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary/90 transition-colors flex justify-center items-center gap-2 mt-4"
              >
                Calculate BMI <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300 mb-4">
            {/* Result Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center">
              <div className="w-16 h-16 mx-auto bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Activity className={cn("w-8 h-8", result.color)} />
              </div>
              <p className="text-slate-500 text-sm font-medium mb-1">Your BMI</p>
              <div className="text-[42px] font-black text-slate-800 mb-2 leading-none">{result.bmi}</div>
              
              {result.isAdult ? (
                <>
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">BMI Category</p>
                  <div className={cn("text-lg font-bold mb-6", result.color)}>
                    {result.category}
                  </div>
                  
                  {/* BMI Scale */}
                  <div className="grid grid-cols-4 gap-1 text-[10px] font-medium text-slate-500 mt-2">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-full bg-blue-400 rounded-l-full mb-1"></div>
                      <span className="truncate w-full text-center">{'< 18.5'}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-full bg-emerald-400 mb-1"></div>
                      <span className="truncate w-full text-center">18.5 - 24.9</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-full bg-orange-400 mb-1"></div>
                      <span className="truncate w-full text-center">25 - 29.9</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-full bg-red-400 rounded-r-full mb-1"></div>
                      <span className="truncate w-full text-center">30+</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className={cn("text-sm font-medium leading-relaxed", result.color)}>
                    {result.category}
                  </p>
                </div>
              )}
            </div>

            {/* Entered Information Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                Entered Information
              </h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Age</p>
                  <p className="font-semibold text-slate-800">{result.age} years</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Gender</p>
                  <p className="font-semibold text-slate-800">{result.gender}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Height</p>
                  <p className="font-semibold text-slate-800">{result.height} cm</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Weight</p>
                  <p className="font-semibold text-slate-800">{result.weight} kg</p>
                </div>
              </div>
            </div>

            {/* Recalculate Button */}
            <button 
              onClick={resetForm}
              className="w-full py-3.5 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors flex justify-center items-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" /> Recalculate
            </button>
          </div>
        )}

        {/* BMI History Section — directly below the calculator / result area */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              BMI History
            </h2>
            {history.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-400">
                  {history.length} {history.length === 1 ? 'record' : 'records'}
                </span>
                <button
                  onClick={clearHistory}
                  title="Clear history"
                  className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {history.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
              <div className="w-12 h-12 mx-auto bg-slate-50 rounded-full flex items-center justify-center mb-3">
                <History className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-700 mb-1">No BMI history yet</p>
              <p className="text-xs text-slate-400 max-w-[240px] mx-auto">
                Calculate your BMI to see your history here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((rec) => (
                <div 
                  key={rec.id}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:border-slate-200 transition-all"
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[22px] font-black text-slate-800 leading-none">{rec.bmi}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">BMI</span>
                      {rec.isAdult && rec.category && (
                        <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100", rec.color)}>
                          {rec.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{rec.dateTime}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-2.5 border-t border-slate-100 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Height</span>
                      <span className="font-semibold text-slate-700">{rec.height} cm</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Weight</span>
                      <span className="font-semibold text-slate-700">{rec.weight} kg</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Age</span>
                      <span className="font-semibold text-slate-700">{rec.age} yrs</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Gender</span>
                      <span className="font-semibold text-slate-700">{rec.gender}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckMyBMI;
