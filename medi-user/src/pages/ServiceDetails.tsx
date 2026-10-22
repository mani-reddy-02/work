import { ArrowLeft, Search, Star, MapPin, Clock, CalendarDays, ChevronRight } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const ServiceDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Create a mapping for dynamic titles based on URL param
  const serviceTitles: Record<string, string> = {
    'hospital-op': 'Hospital OP Booking',
    'doctor': 'Doctor Consultation',
    'consultation': 'Doctor Consultation',
    'nursing': 'Home Nursing',
    'home-nursing': 'Home Nursing',
    'lab': 'Lab Tests',
    'lab-tests': 'Lab Tests',
    'sample': 'Home Sample Collection',
    'home-sample': 'Home Sample Collection',
    'insurance': 'Medical Insurance',
    'checkup': 'Health Check-ups',
    'health-check': 'Health Check-up Packages',
    'elderly': 'Elderly Care',
    'elderly-care': 'Elderly Care',
    'camps': 'Medical Camps'
  };

  const title = serviceTitles[id || ''] || 'Service Details';

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-x-hidden">
      {/* Header */}
      <div className="bg-theme-gradient pt-4 pb-20 px-4 sm:px-6 lg:px-8 text-white rounded-b-3xl">
        <div className="w-full max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigate(-1)} className="p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer shrink-0">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h1>
          </div>

          <div className="relative max-w-xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
               <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input 
               type="text" 
               className="block w-full pl-12 pr-4 py-3 sm:py-3.5 border-0 rounded-2xl bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-white/50 shadow-lg text-sm sm:text-base" 
               placeholder={`Search for ${title.toLowerCase()}...`} 
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 -mt-8 flex-1 pb-10 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-4">
          
          <h2 className="font-bold text-slate-800 text-base sm:text-lg px-1 mt-4">Top Specialists</h2>

          {/* Empty State */}
          <div className="bg-white p-8 text-center rounded-2xl shadow-sm border border-slate-100 mt-4">
             <p className="text-slate-500 text-sm sm:text-base">No specialists currently available for this service.</p>
          </div>

          <button 
            onClick={() => navigate(id === 'hospital-op' ? '/specialties?type=hospital-op' : '/specialties?type=doctor')}
            className="w-full py-4 flex items-center justify-center gap-2 text-primary font-semibold hover:underline mt-2 cursor-pointer text-sm sm:text-base"
          >
            View All Providers <ChevronRight className="w-4 h-4" />
          </button>

        </div>
      </div>
    </div>
  );
};

export default ServiceDetails;
