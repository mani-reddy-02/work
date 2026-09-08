import { useState, useEffect, useMemo } from 'react';
import { CalendarDays, Clock, MapPin, Activity, ChevronLeft, RefreshCw, AlertCircle, Stethoscope } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { opAppointmentApi, type OpBookingRecord } from '../lib/opAppointmentApi';

// Fallback demo placeholder for non-OP services so unfinished features remain intact
const mockServiceBooking = {
  id: '2',
  type: 'service',
  title: 'Home Sample Collection',
  desc: 'Blood Test - Complete',
  date: '18 May 2024',
  time: '8:00 AM',
  location: 'Home Visit',
  status: 'Scheduled',
  icon: Activity,
  color: 'text-orange-500',
  bg: 'bg-orange-50',
};

const MyBookings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [bookings, setBookings] = useState<OpBookingRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadBookings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await opAppointmentApi.fetchMyAppointments();
      if (!res.success) {
        setError(res.error || 'Unable to load your bookings. Please try again.');
      } else {
        setBookings(res.data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  // Split bookings into upcoming vs past based on status & appointment date
  const { upcomingList, pastList } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming: OpBookingRecord[] = [];
    const past: OpBookingRecord[] = [];

    bookings.forEach((b) => {
      const isStatusPast = b.status === 'COMPLETED' || b.status === 'CANCELLED';
      const apptDate = new Date(b.date);
      const isDatePast = !isNaN(apptDate.getTime()) && apptDate < today;

      if (isStatusPast || isDatePast) {
        past.push(b);
      } else {
        upcoming.push(b);
      }
    });

    return { upcomingList: upcoming, pastList: past };
  }, [bookings]);

  const displayedRealBookings = activeTab === 'upcoming' ? upcomingList : pastList;

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen">
      {/* Header with Tabs */}
      <div className="bg-gradient-to-r from-primary to-secondary pt-4 pb-14 px-4 text-white rounded-b-3xl shadow-sm">
        <div className="flex items-center justify-between mb-6 max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1 hover:bg-white/20 rounded-full transition-colors md:hidden">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold tracking-tight">My Bookings</h1>
          </div>
          <button
            onClick={loadBookings}
            disabled={isLoading}
            className="p-2 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
            title="Refresh bookings"
            aria-label="Refresh bookings"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </button>
        </div>
        
        <div className="max-w-md mx-auto bg-white/20 p-1 rounded-full flex relative z-10 backdrop-blur-sm">
          <button 
            className={cn("flex-1 py-2 text-sm font-semibold rounded-full transition-all flex items-center justify-center gap-1.5", activeTab === 'upcoming' ? "bg-white text-primary shadow-sm" : "text-white/90 hover:text-white")}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming
            {upcomingList.length > 0 && (
              <span className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                activeTab === 'upcoming' ? "bg-primary/10 text-primary" : "bg-white/20 text-white"
              )}>
                {upcomingList.length}
              </span>
            )}
          </button>
          <button 
            className={cn("flex-1 py-2 text-sm font-semibold rounded-full transition-all flex items-center justify-center gap-1.5", activeTab === 'past' ? "bg-white text-primary shadow-sm" : "text-white/90 hover:text-white")}
            onClick={() => setActiveTab('past')}
          >
            Past
            {pastList.length > 0 && (
              <span className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                activeTab === 'past' ? "bg-primary/10 text-primary" : "bg-white/20 text-white"
              )}>
                {pastList.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Bookings List */}
      <div className="px-4 -mt-8 flex-1 pb-24 overflow-y-auto">
        <div className="max-w-md mx-auto space-y-4">

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
              <button
                onClick={loadBookings}
                className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-medium transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading ? (
            <div className="space-y-4 pt-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white p-5 rounded-2xl shadow-soft border border-slate-100 animate-pulse space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-2/3" />
                      <div className="h-3 bg-slate-200 rounded w-1/3" />
                    </div>
                  </div>
                  <div className="h-10 bg-slate-100 rounded-xl" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Real Database OP Bookings */}
              {displayedRealBookings.map((booking) => {
                const isConfirmed = booking.status === 'WAITING' || booking.status === 'Confirmed';
                const isCompleted = booking.status === 'COMPLETED';
                const isCancelled = booking.status === 'CANCELLED';

                return (
                  <Link
                    to={`/booking/${booking.id}`}
                    key={booking.id}
                    className="block bg-white p-4 md:p-5 rounded-2xl shadow-soft border border-slate-100 hover:shadow-md hover:border-blue-100 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          {booking.doctorAvatar ? (
                            <img src={booking.doctorAvatar} alt={booking.doctorName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-blue-50 text-primary">
                              <Stethoscope className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800 text-sm md:text-base">Dr. {booking.doctorName.replace(/^Dr\.\s*/i, '')}</h4>
                          <p className="text-xs text-slate-500 font-medium">
                            {booking.doctorDesignation || booking.departmentName || 'OP Consultation'}
                          </p>
                          {booking.diseaseName && (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600">
                              {booking.diseaseName}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className={cn(
                        "px-2.5 py-1 rounded-md text-[10px] md:text-xs font-semibold border shrink-0",
                        isConfirmed ? "bg-green-50 text-green-700 border-green-200" :
                        isCompleted ? "bg-blue-50 text-blue-700 border-blue-200" :
                        isCancelled ? "bg-red-50 text-red-700 border-red-200" :
                        "bg-amber-50 text-amber-700 border-amber-200"
                      )}>
                        {isConfirmed ? 'Confirmed' : isCompleted ? 'Completed' : isCancelled ? 'Cancelled' : booking.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs text-slate-600 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-700">{booking.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-700">{booking.timeSlot}</span>
                      </div>
                      {booking.hospitalName && (
                        <div className="flex items-center gap-2 col-span-2">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="truncate text-slate-600">
                            {booking.hospitalName}
                            {booking.hospitalAddress ? ` • ${booking.hospitalAddress}` : ''}
                          </span>
                        </div>
                      )}
                      <div className="col-span-2 flex items-center justify-between pt-1 border-t border-slate-50 text-[11px] text-slate-400">
                        <span className="truncate">
                          ID: <strong className="font-mono text-slate-700">{booking.id.slice(0, 8)}...</strong>
                        </span>
                        <span className="font-semibold text-primary">In-Hospital OP Visit</span>
                      </div>
                    </div>
                  </Link>
                );
              })}

              {/* Service Mock Placeholder retained in upcoming tab for demo continuity */}
              {activeTab === 'upcoming' && (
                <div className="block bg-white p-4 md:p-5 rounded-2xl shadow-soft border border-slate-100 opacity-80">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", mockServiceBooking.bg, mockServiceBooking.color)}>
                        <mockServiceBooking.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 text-sm">{mockServiceBooking.title}</h4>
                        <p className="text-xs text-slate-500">{mockServiceBooking.desc}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md text-[10px] md:text-xs font-medium border bg-blue-50 text-blue-600 border-blue-100">
                      {mockServiceBooking.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs text-slate-600 pt-3 border-t border-slate-100/60">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-slate-400" />
                      <span>{mockServiceBooking.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{mockServiceBooking.time}</span>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{mockServiceBooking.location}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty state when no real bookings and tab is past, or no bookings at all */}
              {displayedRealBookings.length === 0 && activeTab === 'past' && (
                <div className="py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <CalendarDays className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-slate-700 text-sm mb-1">No past bookings</h3>
                  <p className="text-xs text-slate-400">Your completed and cancelled consultations will appear here.</p>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default MyBookings;
