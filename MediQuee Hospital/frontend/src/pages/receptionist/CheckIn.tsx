import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, AlertCircle, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { receptionistApi, type Patient } from '../../services/receptionistApi';

export function CheckIn() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  
  // Form State
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [newPatientData, setNewPatientData] = useState({ name: '', phone: '', age: '', gender: 'Male' });
  
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [doctors, setDoctors] = useState<{ id: string; name: string; departmentId: string }[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [opType, setOpType] = useState('Normal');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToken, setSuccessToken] = useState<string | null>(null);

  useEffect(() => {
    receptionistApi.getDepartments().then(setDepartments);
  }, []);

  useEffect(() => {
    if (selectedDept) {
      receptionistApi.getDoctors(selectedDept).then(docs => setDoctors(docs.filter(d => d.departmentId === selectedDept)));
    }
  }, [selectedDept]);

  const handleSearch = async () => {
    if (!searchQuery) return;
    const results = await receptionistApi.searchPatients(searchQuery);
    setSearchResults(results);
  };

  const handleNext = () => {
    if (step === 1 && (selectedPatient || (isNewPatient && newPatientData.name && newPatientData.phone))) {
      setStep(2);
    } else if (step === 2 && selectedDept && selectedDoctor && opType) {
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await receptionistApi.checkInPatient({
        patientId: selectedPatient?.id,
        patientData: isNewPatient ? { ...newPatientData, age: Number(newPatientData.age) } : undefined,
        departmentId: selectedDept,
        doctorId: selectedDoctor || undefined,
        opType
      });
      setSuccessToken(result.token);
    } catch (err: any) {
      setError(err.message || 'Failed to check in patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col bg-surface min-h-[calc(100vh-80px)] pb-24">
      
      {/* Header */}
      <div className="sticky top-0 z-30 bg-surface border-b border-border shadow-sm px-4 py-3 flex items-center gap-3">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate('/receptionist')} className="p-2 -ml-2 rounded-full hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-[18px] font-bold text-foreground">Check-In Patient</h1>
      </div>

      <div className="p-4 flex flex-col flex-1">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 px-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step >= s ? 'bg-primary text-white' : 'bg-gray-100 text-muted/70'
              }`}>
                {s}
              </div>
              <span className={`text-[10px] font-bold uppercase ${step >= s ? 'text-primary' : 'text-muted/70'}`}>
                {s === 1 ? 'Patient' : s === 2 ? 'Details' : 'Confirm'}
              </span>
            </div>
          ))}
          <div className="absolute left-10 right-10 h-0.5 bg-gray-100 -z-10 top-8">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
              
              <div className="flex bg-gray-50 p-1 rounded-xl">
                <button onClick={() => setIsNewPatient(false)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${!isNewPatient ? 'bg-surface text-foreground shadow-sm' : 'text-muted'}`}>
                  Existing Patient
                </button>
                <button onClick={() => setIsNewPatient(true)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${isNewPatient ? 'bg-surface text-foreground shadow-sm' : 'text-muted'}`}>
                  New Patient
                </button>
              </div>

              {!isNewPatient ? (
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-3 text-muted/70" />
                    <input 
                      type="text" 
                      placeholder="Search phone number or ID..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl outline-none focus:border-primary transition-colors text-sm"
                    />
                    <button onClick={handleSearch} className="absolute right-2 top-2 bg-primary text-white px-3 py-1 rounded-lg text-xs font-bold">
                      Search
                    </button>
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {searchResults.map(p => (
                        <div 
                          key={p.id} 
                          onClick={() => setSelectedPatient(p)}
                          className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${selectedPatient?.id === p.id ? 'bg-blue-50 border-primary' : 'bg-surface border-border hover:border-border'}`}
                        >
                          <div>
                            <h4 className="font-bold text-foreground">{p.name}</h4>
                            <p className="text-xs text-muted">{p.phone} • {p.age}Y • {p.gender}</p>
                          </div>
                          {selectedPatient?.id === p.id && <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-surface" /></div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <input type="text" placeholder="Full Name" value={newPatientData.name} onChange={e => setNewPatientData({...newPatientData, name: e.target.value})} className="w-full px-4 py-3 border border-border rounded-xl text-sm outline-none focus:border-primary" />
                  <input type="tel" placeholder="Phone Number" value={newPatientData.phone} onChange={e => setNewPatientData({...newPatientData, phone: e.target.value})} className="w-full px-4 py-3 border border-border rounded-xl text-sm outline-none focus:border-primary" />
                  <div className="flex gap-4">
                    <input type="number" placeholder="Age" value={newPatientData.age} onChange={e => setNewPatientData({...newPatientData, age: e.target.value})} className="w-1/2 px-4 py-3 border border-border rounded-xl text-sm outline-none focus:border-primary" />
                    <select value={newPatientData.gender} onChange={e => setNewPatientData({...newPatientData, gender: e.target.value})} className="w-1/2 px-4 py-3 border border-border rounded-xl text-sm outline-none focus:border-primary bg-surface">
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-muted uppercase">Department</label>
                <div className="grid grid-cols-2 gap-2">
                  {departments.map(dept => (
                    <button key={dept.id} onClick={() => { setSelectedDept(dept.id); setSelectedDoctor(''); }} className={`p-3 rounded-xl border text-sm font-semibold text-left transition-colors ${selectedDept === dept.id ? 'bg-blue-50 border-primary text-primary' : 'bg-surface border-border text-foreground/80'}`}>
                      {dept.name}
                    </button>
                  ))}
                </div>
              </div>

              {selectedDept && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-muted uppercase">Doctor *</label>
                  <select value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value)} className="w-full px-4 py-3 border border-border rounded-xl text-sm font-semibold text-foreground bg-surface outline-none focus:border-primary">
                    <option value="">Any Available Doctor</option>
                    {doctors.map(doc => <option key={doc.id} value={doc.id}>{doc.name}</option>)}
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-muted uppercase">OP Type</label>
                <div className="flex gap-2">
                  {['Normal', 'Emergency', 'Follow-up'].map(type => (
                    <button key={type} onClick={() => setOpType(type)} className={`flex-1 p-3 rounded-xl border text-sm font-semibold transition-colors ${opType === type ? 'bg-blue-50 border-primary text-primary' : 'bg-surface border-border text-foreground/80'}`}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
              
              <div className="bg-gray-50 rounded-2xl p-5 border border-border flex flex-col gap-4">
                <h3 className="font-bold text-foreground border-b border-border pb-2">Confirm Check-In</h3>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex flex-col">
                    <span className="text-muted text-xs font-semibold">Patient</span>
                    <span className="font-bold text-foreground">{isNewPatient ? newPatientData.name : selectedPatient?.name}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted text-xs font-semibold">Contact</span>
                    <span className="font-bold text-foreground">{isNewPatient ? newPatientData.phone : selectedPatient?.phone}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted text-xs font-semibold">Department</span>
                    <span className="font-bold text-foreground">{departments.find(d => d.id === selectedDept)?.name}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted text-xs font-semibold">Doctor</span>
                    <span className="font-bold text-foreground">{selectedDoctor ? doctors.find(d => d.id === selectedDoctor)?.name : 'Any'}</span>
                  </div>
                  <div className="flex flex-col col-span-2">
                    <span className="text-muted text-xs font-semibold">OP Type</span>
                    <span className="font-bold text-foreground">{opType}</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-semibold border border-red-100 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </motion.div>
          )}

          {/* Success State */}
          {successToken && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-6 py-8">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-black text-foreground">Patient Checked In!</h2>
                <p className="text-muted mt-1 text-sm">Token has been generated successfully</p>
              </div>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl px-8 py-5 text-center">
                <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">OP Token</span>
                <p className="text-3xl font-black text-blue-700 mt-1">{successToken}</p>
              </div>
              <button
                onClick={() => navigate('/receptionist')}
                className="w-full bg-primary text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm mt-4"
              >
                Back to Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Sticky Action */}
      {!successToken && (
        <div className="sticky bottom-[80px] p-4 bg-surface border-t border-border z-30">
          {step < 3 ? (
            <button 
              onClick={handleNext} 
              disabled={(step === 1 && !selectedPatient && (!isNewPatient || !newPatientData.name || !newPatientData.phone)) || (step === 2 && (!selectedDept || !selectedDoctor))}
              className="w-full bg-primary text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="w-full bg-green-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSubmitting ? 'Generating Token...' : 'Confirm Check-In'}
            </button>
          )}
        </div>
      )}

    </div>
  );
}
