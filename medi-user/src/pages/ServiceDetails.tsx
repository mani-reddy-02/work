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
    <div className="flex flex-col h-full bg-slate-50">      {/* Header */}
      <div className="bg-theme-gradient pt-4 pb-20 px-4 text-white rounded-b-3xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">{title}</h1>
        </div>

        <div className="relative max-w-md mx-auto">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
             <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input 
             type="text" 
             className="block w-full pl-12 pr-4 py-3 border-0 rounded-2xl bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-white/50 shadow-lg" 
             placeholder={`Search for ${title.toLowerCase()}...`} 
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 -mt-8 flex-1 pb-8 overflow-y-auto">
        <div className="max-w-md mx-auto space-y-4">
          
          <h2 className="font-bold text-slate-800 px-1 mt-4">Top Specialists</h2>

          {/* Dummy Item 1 */}
          <div className="bg-white p-4 rounded-2xl shadow-soft border border-slate-100 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                 <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150" alt="Dr. Ananya Reddy" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-lg leading-tight">Dr. Ananya Reddy</h3>
                <p className="text-sm text-slate-500 font-medium">Gynecologist • 8 Yrs Exp</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-medium text-slate-700">4.8</span>
                  <span className="text-xs text-slate-400">(320 reviews)</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="truncate">Banjara Hills</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary" />
                <span>Available Today</span>
              </div>
            </div>
            
            <button className="w-full py-2.5 text-center text-sm font-semibold text-white bg-primary rounded-xl hover:bg-blue-700 transition-colors">
              Book Appointment
            </button>
          </div>

          {/* Dummy Item 2 */}
          <div className="bg-white p-4 rounded-2xl shadow-soft border border-slate-100 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                 <img src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=150" alt="Dr. Rajesh Kumar" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-lg leading-tight">Dr. Rajesh Kumar</h3>
                <p className="text-sm text-slate-500 font-medium">Cardiologist • 15 Yrs Exp</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-medium text-slate-700">4.9</span>
                  <span className="text-xs text-slate-400">(415 reviews)</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="truncate">Jubilee Hills</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-primary" />
                <span>Available Tomorrow</span>
              </div>
            </div>
            
            <button className="w-full py-2.5 text-center text-sm font-semibold text-primary border border-primary/20 rounded-xl hover:bg-primary/5 transition-colors">
              Book Appointment
            </button>
          </div>

          <button 
            onClick={() => navigate(id === 'hospital-op' ? '/specialties?type=hospital-op' : '/specialties?type=doctor')}
            className="w-full py-4 flex items-center justify-center gap-2 text-primary font-medium hover:underline mt-2"
          >
            View All Providers <ChevronRight className="w-4 h-4" />
          </button>

        </div>
      </div>
    </div>
  );
};

export default ServiceDetails;
