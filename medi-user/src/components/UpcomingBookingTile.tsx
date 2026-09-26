import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, Video, TestTube, Activity, HeartPulse } from 'lucide-react';

interface UpcomingBooking {
  bookingId: string;
  serviceType: 'OP' | 'VIDEO' | 'LAB' | 'HOME_SAMPLE' | 'HOME_NURSING';
  status: string;
  date: string;
  time: string;
  doctorName?: string;
  hospitalName?: string;
  testName?: string;
  serviceName?: string;
  nurseName?: string;
}

interface UpcomingBookingTileProps {
  onLoad?: (hasBooking: boolean, bookingData?: UpcomingBooking) => void;
}

const UpcomingBookingTile = ({ onLoad }: UpcomingBookingTileProps) => {
  const [booking, setBooking] = useState<UpcomingBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUpcomingBooking = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await fetch('/api/v1/user/bookings/upcoming', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        
        if (data.success && data.data) {
          setBooking(data.data);
          onLoad?.(true, data.data);
        } else {
          onLoad?.(false);
        }
      } catch (err) {
        console.error('Failed to fetch upcoming booking', err);
        onLoad?.(false);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingBooking();
  }, []);

  if (loading) {
    return (
      <div className="w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-100 animate-pulse mb-3">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-3"></div>
        <div className="h-5 bg-slate-200 rounded w-2/3 mb-2"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!booking) return null;

  // Format date correctly (handling timezone quirks simply for UI)
  const d = new Date(booking.date);
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const isToday = d.toDateString() === new Date().toDateString();
  const displayDate = isToday ? 'Today' : dateStr;

  const handleClick = () => {
    // Navigate to booking details or generic my bookings
    if (booking.bookingId) {
       navigate(`/booking/${booking.bookingId}`);
    } else {
       navigate('/bookings');
    }
  };

  const renderServiceIcon = () => {
    switch (booking.serviceType) {
      case 'VIDEO': return <Video className="w-4 h-4 text-white/90" />;
      case 'LAB': return <TestTube className="w-4 h-4 text-white/90" />;
      case 'HOME_SAMPLE': return <Activity className="w-4 h-4 text-white/90" />;
      case 'HOME_NURSING': return <HeartPulse className="w-4 h-4 text-white/90" />;
      default: return <Calendar className="w-4 h-4 text-white/90" />;
    }
  };

  const getServiceLabel = () => {
    switch (booking.serviceType) {
      case 'VIDEO': return 'Video Consultation';
      case 'LAB': return 'Lab Test';
      case 'HOME_SAMPLE': return 'Home Sample Collection';
      case 'HOME_NURSING': return 'Home Nursing';
      default: return 'OP Consultation';
    }
  };

  return (
    <div 
      className="w-full cursor-pointer group animate-in slide-in-from-bottom-2 fade-in duration-500 mb-3"
      onClick={handleClick}
    >
      <div className="bg-gradient-to-r from-[#0062e6] to-[#0070f3] rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,98,230,0.3)] relative overflow-hidden transition-transform group-hover:scale-[1.02]">
        
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-black/10 blur-xl"></div>
        
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-1.5 mb-2">
              {renderServiceIcon()}
              <span className="text-[10px] font-bold text-white/90 uppercase tracking-wider">
                Upcoming Booking
              </span>
            </div>
            
            <h3 className="text-[15px] font-bold text-white leading-tight mb-1 truncate">
              {getServiceLabel()}
            </h3>
            
            <p className="text-[13px] font-medium text-white/90 truncate">
              {booking.doctorName ? `Dr. ${booking.doctorName}` : (booking.testName || booking.serviceName || 'MediQuee Service')}
            </p>
            
            <p className="text-[11px] text-white/70 truncate mb-3">
              {booking.hospitalName || 'Verified Provider'}
            </p>
            
            <div className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
              <Calendar className="w-3 h-3 text-white" />
              <span className="text-[12px] font-bold text-white">
                {displayDate} · {booking.time}
              </span>
            </div>
          </div>
          
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-4 group-hover:bg-white/30 transition-colors">
            <ArrowRight className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpcomingBookingTile;
