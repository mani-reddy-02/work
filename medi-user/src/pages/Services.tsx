import { Search, ChevronRight, Stethoscope, Hospital, TestTube, Activity, Home, Shield, ArrowLeft, FileText } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';

const allServices = [
  { id: 'hospital-op', path: '/specialties?type=hospital-op', name: 'OP Booking', desc: 'Book OP appointments in top hospitals', icon: Hospital, color: 'text-teal-500', bg: 'bg-teal-50' },
  { id: 'doctor', path: '/specialties?type=doctor', name: 'Video Consultation', desc: 'Book online appointments with specialist doctors', icon: Stethoscope, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'insurance', path: '/services/insurance', name: 'Insurances', desc: 'Compare & buy the best health insurance', icon: Shield, color: 'text-sky-500', bg: 'bg-sky-50' },
  { id: 'home-nursing', path: '/services/home-nursing', name: 'Home Nursing', desc: 'Professional nursing care at your home', icon: Home, color: 'text-pink-500', bg: 'bg-pink-50' },
  { id: 'lab-tests', path: '/services/lab-tests', name: 'Lab Tests', desc: 'Book lab tests & health packages', icon: TestTube, color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: 'home-sample', path: '/services/home-sample', name: 'Home Sample Collection', desc: 'Sample collection from your home', icon: Activity, color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'reports', path: '/services/reports', name: 'My Reports', desc: 'View and manage your medical reports', icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 'bmi', path: '/services/bmi', name: 'Check My BMI', desc: 'Calculate your Body Mass Index', icon: Activity, color: 'text-indigo-500', bg: 'bg-indigo-50' },
];

const Services = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredServices = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allServices;
    return allServices.filter(s => 
      s.name.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-theme-gradient pt-4 pb-6 px-4 md:px-8 text-white rounded-b-3xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">All Services</h1>
        </div>
        
        <div className="relative max-w-md md:max-w-lg mx-auto">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
             <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input 
             type="text" 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="block w-full pl-12 pr-4 py-3 border-0 rounded-2xl bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-white/50 shadow-lg" 
             placeholder="Search for services..." 
          />
        </div>
      </div>

      {/* Service List */}
      <div className="p-4 sm:p-6 md:p-8 flex-1 overflow-y-auto pb-24">
        <div className="w-full max-w-7xl mx-auto pb-8">
          {filteredServices.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 p-8">
              <p className="text-sm text-slate-500 font-bold">No matching services found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {filteredServices.map((service) => (
                <Link 
                  key={service.id} 
                  to={service.path}
                  className="flex items-center p-4 sm:p-5 bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-md hover:border-blue-200 transition-all group"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${service.bg} ${service.color} mr-4 group-hover:scale-105 transition-transform`}>
                     <service.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0 pr-1">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate group-hover:text-blue-600 transition-colors">{service.name}</h3>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{service.desc}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Services;
