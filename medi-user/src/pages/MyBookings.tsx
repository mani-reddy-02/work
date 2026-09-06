import { useState } from 'react';
import { CalendarDays, Clock, MapPin, Activity, ChevronLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const upcomingBookings = [
  {
    id: '1',
    type: 'doctor',
    doctor: 'Dr. Ananya Reddy',
    specialty: 'Gynecologist',
    date: '20 May 2024',
    time: '11:00 AM',
    location: 'Sunshine Hospitals',
    status: 'Confirmed',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150',
  },
  {
    id: '2',
    type: 'service',
    title: 'Home Sample Collection',
    desc: 'Blood Test - Complete',
    date: '18 May 2024',
    time: '8:00 AM',
    status: 'Scheduled',
    icon: Activity,
    color: 'text-orange-500',
    bg: 'bg-orange-50',
  }
];

const MyBookings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header with Tabs */}
      <div className="bg-gradient-to-r from-primary to-secondary pt-4 pb-14 px-4 text-white rounded-b-3xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-white/20 rounded-full transition-colors md:hidden">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">My Bookings</h1>
        </div>
        
        <div className="max-w-md mx-auto bg-white/20 p-1 rounded-full flex relative z-10 backdrop-blur-sm">
          <button 
            className={cn("flex-1 py-2 text-sm font-semibold rounded-full transition-all", activeTab === 'upcoming' ? "bg-white text-primary shadow-sm" : "text-white/90 hover:text-white")}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming
          </button>
          <button 
            className={cn("flex-1 py-2 text-sm font-semibold rounded-full transition-all", activeTab === 'past' ? "bg-white text-primary shadow-sm" : "text-white/90 hover:text-white")}
            onClick={() => setActiveTab('past')}
          >
            Past
          </button>
        </div>
      </div>

      {/* Bookings List */}
      <div className="px-4 -mt-8 flex-1 pb-8 overflow-y-auto">
        <div className="max-w-md mx-auto space-y-4">
          
          {activeTab === 'upcoming' ? (
            upcomingBookings.map((booking) => (
              <Link to={`/booking/${booking.id}`} key={booking.id} className="block bg-white p-4 md:p-5 rounded-2xl shadow-soft border border-slate-100 hover:shadow-md transition-shadow">
                
                <div className="flex items-start justify-between mb-4">
                  {booking.type === 'doctor' ? (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 shrink-0">
                         <img src={booking.image} alt={booking.doctor} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">{booking.doctor}</h4>
                        <p className="text-sm text-slate-500">{booking.specialty}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", booking.bg, booking.color)}>
                         {booking.icon && <booking.icon className="w-6 h-6" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">{booking.title}</h4>
                        <p className="text-sm text-slate-500">{booking.desc}</p>
                      </div>
                    </div>
                  )}
                  
                  <span className={cn(
                    "px-2.5 py-1 rounded-md text-[10px] md:text-xs font-medium border",
                    booking.status === 'Confirmed' ? "bg-green-50 text-green-600 border-green-100" : "bg-blue-50 text-blue-600 border-blue-100"
                  )}>
                    {booking.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm text-slate-600 pt-3 border-t border-slate-100/60">
                   <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-slate-400" />
                      <span>{booking.date}</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{booking.time}</span>
                   </div>
                   {booking.location && (
                     <div className="flex items-center gap-2 col-span-2">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{booking.location}</span>
                     </div>
                   )}
                </div>
              </Link>
            ))
          ) : (
            <div className="py-12 text-center text-slate-500">
               <p>No past bookings found.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default MyBookings;
