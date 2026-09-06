import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, Clock, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { receptionistApi, type Patient } from '../../services/receptionistApi';

export function BookAppointment() {
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
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [appointmentType, setAppointmentType] = useState('New Consultation');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } else if (step === 2 && selectedDept && selectedDoctor) {
      setStep(3);
    } else if (step === 3 && date && time && appointmentType) {
      setStep(4);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await receptionistApi.bookAppointment({
        patientId: selectedPatient?.id,
        patientData: isNewPatient ? { ...newPatientData, age: Number(newPatientData.age) } : undefined,
        departmentId: selectedDept,
        doctorId: selectedDoctor || undefined,
        date,
        time,
        appointmentType
      });
    } catch (err: any) {
      setError(err.message || 'Failed to book appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col bg-white min-h-[calc(100vh-80px)] pb-24">
      
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate('/receptionist')} className="p-2 -ml-2 rounded-full hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-[18px] font-bold text-gray-900">Book Appointment</h1>
      </div>

      <div className="p-4 flex flex-col flex-1">
        
        <div className="flex items-center justify-between mb-8 px-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex flex-col items-center gap-1 z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step >= s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                {s}
              </div>
            </div>
          ))}
          <div className="absolute left-10 right-10 h-0.5 bg-gray-100 top-8 z-0">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${((step - 1) / 3) * 100}%` }} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
              
              <div className="flex bg-gray-50 p-1 rounded-xl">
                <button onClick={() => setIsNewPatient(false)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${!isNewPatient ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                  Existing Patient
                </button>
                <button onClick={() => setIsNewPatient(true)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${isNewPatient ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                  New Patient
                </button>
              </div>

              {!isNewPatient ? (
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search phone number or ID..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-primary transition-colors text-sm"
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
                          className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${selectedPatient?.id === p.id ? 'bg-blue-50 border-primary' : 'bg-white border-gray-100 hover:border-gray-200'}`}
                        >
                          <div>
                            <h4 className="font-bold text-gray-900">{p.name}</h4>
                            <p className="text-xs text-gray-500">{p.phone} • {p.age}Y • {p.gender}</p>
                          </div>
                          {selectedPatient?.id === p.id && <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-white" /></div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <input type="text" placeholder="Full Name" value={newPatientData.name} onChange={e => setNewPatientData({...newPatientData, name: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary" />
                  <input type="tel" placeholder="Phone Number" value={newPatientData.phone} onChange={e => setNewPatientData({...newPatientData, phone: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary" />
                  <div className="flex gap-4">
                    <input type="number" placeholder="Age" value={newPatientData.age} onChange={e => setNewPatientData({...newPatientData, age: e.target.value})} className="w-1/2 px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary" />
                    <select value={newPatientData.gender} onChange={e => setNewPatientData({...newPatientData, gender: e.target.value})} className="w-1/2 px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary bg-white">
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
                <label className="text-xs font-bold text-gray-500 uppercase">Department</label>
                <div className="grid grid-cols-2 gap-2">
                  {departments.map(dept => (
                    <button key={dept.id} onClick={() => { setSelectedDept(dept.id); setSelectedDoctor(''); }} className={`p-3 rounded-xl border text-sm font-semibold text-left transition-colors ${selectedDept === dept.id ? 'bg-blue-50 border-primary text-primary' : 'bg-white border-gray-200 text-gray-700'}`}>
                      {dept.name}
                    </button>
                  ))}
                </div>
              </div>

              {selectedDept && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Doctor</label>
                  <select value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 bg-white outline-none focus:border-primary">
                    <option value="">Select Doctor</option>
                    {doctors.map(doc => <option key={doc.id} value={doc.id}>{doc.name}</option>)}
                  </select>
                </div>
              )}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
                <div className="relative">
                  <Calendar className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold bg-white outline-none focus:border-primary" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Time</label>
                <div className="relative">
                  <Clock className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                  <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold bg-white outline-none focus:border-primary" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Type</label>
                <select value={appointmentType} onChange={e => setAppointmentType(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 bg-white outline-none focus:border-primary">
                  <option>New Consultation</option>
                  <option>Follow-up</option>
                  <option>Report Review</option>
                </select>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
              
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex flex-col gap-4">
                <h3 className="font-bold text-gray-900 border-b border-gray-200 pb-2">Confirm Appointment</h3>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs font-semibold">Patient</span>
                    <span className="font-bold text-gray-900">{isNewPatient ? newPatientData.name : selectedPatient?.name}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs font-semibold">Contact</span>
                    <span className="font-bold text-gray-900">{isNewPatient ? newPatientData.phone : selectedPatient?.phone}</span>
                  </div>
                  <div className="flex flex-col col-span-2">
                    <span className="text-gray-500 text-xs font-semibold">Department & Doctor</span>
                    <span className="font-bold text-gray-900">{departments.find(d => d.id === selectedDept)?.name} • {doctors.find(d => d.id === selectedDoctor)?.name}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs font-semibold">Date</span>
                    <span className="font-bold text-primary">{date}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs font-semibold">Time</span>
                    <span className="font-bold text-primary">{time}</span>
                  </div>
                  <div className="flex flex-col col-span-2">
                    <span className="text-gray-500 text-xs font-semibold">Type</span>
                    <span className="font-bold text-gray-900">{appointmentType}</span>
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
        </AnimatePresence>
      </div>

      <div className="sticky bottom-[80px] p-4 bg-white border-t border-gray-100 z-30">
        {step < 4 ? (
          <button 
            onClick={handleNext} 
            disabled={(step === 1 && !selectedPatient && (!isNewPatient || !newPatientData.name || !newPatientData.phone)) || (step === 2 && (!selectedDept || !selectedDoctor)) || (step === 3 && (!date || !time))}
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
            {isSubmitting ? 'Saving...' : 'Book Appointment'}
          </button>
        )}
      </div>

    </div>
  );
}
