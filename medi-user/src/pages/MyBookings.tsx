import { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays,
  Clock,
  MapPin,
  ChevronLeft,
  RefreshCw,
  AlertCircle,
  Stethoscope,
  TestTube,
  Home,
  Hospital,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { opAppointmentApi, type OpBookingRecord } from '../lib/opAppointmentApi';
import { labBookingApi, type LabBookingRecord } from '../lib/labTestApi';
import { homeNursingApi, type HomeNursingBookingRecord } from '../lib/homeNursingApi';

interface UnifiedBooking {
  id: string;
  type: 'OP' | 'LAB' | 'NURSING';
  title: string;
  subtitle: string;
  detailTag?: string;
  date: string;
  timeSlot: string;
  location: string;
  status: string;
  fee?: number | string;
  opRecord?: OpBookingRecord;
  labRecord?: LabBookingRecord;
  nursingRecord?: HomeNursingBookingRecord;
}

const MyBookings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [opBookings, setOpBookings] = useState<OpBookingRecord[]>([]);
  const [labBookings, setLabBookings] = useState<LabBookingRecord[]>([]);
  const [nursingBookings, setNursingBookings] = useState<HomeNursingBookingRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadBookings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [opRes, labRes, nursingRes] = await Promise.all([
        opAppointmentApi.fetchMyAppointments(),
        labBookingApi.getMyLabBookings(),
        homeNursingApi.getMyBookings().catch(() => ({ success: true, data: [] })),
      ]);

      if (opRes.success && opRes.data) {
        setOpBookings(opRes.data);
      }
      if (labRes.success && labRes.data) {
        setLabBookings(labRes.data);
      }
      if (nursingRes.success && nursingRes.data) {
        setNursingBookings(nursingRes.data);
      }

      if (!opRes.success) {
        setError(opRes.error || 'Unable to load your appointments.');
      } else if (!labRes.success) {
        setError(labRes.error || 'Unable to load your lab bookings.');
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

  // Split unified bookings into upcoming vs past
  const { upcomingList, pastList } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming: UnifiedBooking[] = [];
    const past: UnifiedBooking[] = [];

    // Map OP Bookings
    opBookings.forEach((b) => {
      const isStatusPast = b.status === 'COMPLETED' || b.status === 'CANCELLED';
      const apptDate = new Date(b.date);
      const isDatePast = !isNaN(apptDate.getTime()) && apptDate < today;

      const unified: UnifiedBooking = {
        id: b.id,
        type: 'OP',
        title: `Dr. ${b.doctorName.replace(/^Dr\.\s*/i, '')}`,
        subtitle: b.doctorDesignation || b.departmentName || 'OP Consultation',
        detailTag: b.diseaseName || undefined,
        date: b.date,
        timeSlot: b.timeSlot,
        location: b.hospitalName || 'Hospital Visit',
        status: b.status,
        fee: b.fee ? `₹${b.fee}` : undefined,
        opRecord: b,
      };

      if (isStatusPast || isDatePast) {
        past.push(unified);
      } else {
        upcoming.push(unified);
      }
    });

    // Map Lab Bookings
    labBookings.forEach((l) => {
      const isStatusPast = l.status === 'COMPLETED' || l.status === 'CANCELLED';
      const apptDate = new Date(l.date || l.bookingDate);
      const isDatePast = !isNaN(apptDate.getTime()) && apptDate < today;

      const unified: UnifiedBooking = {
        id: l.id,
        type: 'LAB',
        title: l.testName,
        subtitle: l.laboratoryName,
        detailTag: l.collectionType === 'HOME_COLLECTION' ? 'Home Sample Collection' : 'Lab Visit',
        date: l.date || l.bookingDate,
        timeSlot: l.timeSlot || l.time,
        location:
          l.collectionType === 'HOME_COLLECTION'
            ? 'Home Doorstep Collection'
            : l.laboratoryAddress || l.laboratoryName,
        status: l.status,
        fee: l.amount || (l.totalAmount ? `₹${Math.round(l.totalAmount)}` : undefined),
        labRecord: l,
      };

      if (isStatusPast || isDatePast) {
        past.push(unified);
      } else {
        upcoming.push(unified);
      }
    });

    // Map Home Nursing Bookings
    nursingBookings.forEach((n) => {
      const isStatusPast = n.status === 'COMPLETED' || n.status === 'CANCELLED';
      const serviceDate = new Date(n.date);
      const isDatePast = !isNaN(serviceDate.getTime()) && serviceDate < today;

      const unified: UnifiedBooking = {
        id: n.id,
        type: 'NURSING',
        title: n.serviceName,
        subtitle: n.nurseName ? `${n.nurseName} • ${n.hospitalName}` : n.hospitalName,
        detailTag: 'Home Nursing Care',
        date: n.date,
        timeSlot: n.timeSlot,
        location: n.address ? `Home: ${n.address}` : 'Home Service',
        status: n.status,
        fee: n.amount || `₹${Math.round(n.totalAmount)}`,
        nursingRecord: n,
      };

      if (isStatusPast || isDatePast) {
        past.push(unified);
      } else {
        upcoming.push(unified);
      }
    });

    // Sort by date descending
    const sorter = (a: UnifiedBooking, b: UnifiedBooking) =>
      new Date(b.date).getTime() - new Date(a.date).getTime();

    upcoming.sort(sorter);
    past.sort(sorter);

    return { upcomingList: upcoming, pastList: past };
  }, [opBookings, labBookings, nursingBookings]);

  const displayedBookings = activeTab === 'upcoming' ? upcomingList : pastList;

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen">
      {/* Header with Tabs */}
      <div className="bg-gradient-to-r from-primary to-secondary pt-4 pb-14 px-4 text-white rounded-b-3xl shadow-sm">
        <div className="flex items-center justify-between mb-6 max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors md:hidden"
            >
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
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </button>
        </div>

        <div className="max-w-md mx-auto bg-white/20 p-1 rounded-full flex relative z-10 backdrop-blur-sm">
          <button
            className={cn(
              'flex-1 py-2 text-sm font-semibold rounded-full transition-all flex items-center justify-center gap-1.5',
              activeTab === 'upcoming' ? 'bg-white text-primary shadow-sm' : 'text-white/90 hover:text-white'
            )}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming
            {upcomingList.length > 0 && (
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                  activeTab === 'upcoming' ? 'bg-primary/10 text-primary' : 'bg-white/20 text-white'
                )}
              >
                {upcomingList.length}
              </span>
            )}
          </button>
          <button
            className={cn(
              'flex-1 py-2 text-sm font-semibold rounded-full transition-all flex items-center justify-center gap-1.5',
              activeTab === 'past' ? 'bg-white text-primary shadow-sm' : 'text-white/90 hover:text-white'
            )}
            onClick={() => setActiveTab('past')}
          >
            Past
            {pastList.length > 0 && (
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                  activeTab === 'past' ? 'bg-primary/10 text-primary' : 'bg-white/20 text-white'
                )}
              >
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
                <div
                  key={i}
                  className="bg-white p-5 rounded-2xl shadow-soft border border-slate-100 animate-pulse space-y-4"
                >
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
              {displayedBookings.map((booking) => {
                const isConfirmed =
                  booking.status === 'WAITING' ||
                  booking.status === 'Confirmed' ||
                  booking.status === 'CONFIRMED';
                const isCompleted = booking.status === 'COMPLETED';
                const isCancelled = booking.status === 'CANCELLED';

                return (
                  <Link
                    to={`/booking/${booking.id}`}
                    key={booking.id}
                    className="block bg-white p-4 md:p-5 rounded-2xl shadow-soft border border-slate-100 hover:shadow-md hover:border-blue-100 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                            booking.type === 'LAB'
                              ? 'bg-blue-50 text-blue-600 border-blue-100'
                              : booking.type === 'NURSING'
                              ? 'bg-teal-50 text-teal-600 border-teal-100'
                              : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                          }`}
                        >
                          {booking.type === 'LAB' ? (
                            <TestTube className="w-6 h-6" />
                          ) : booking.type === 'NURSING' ? (
                            <Home className="w-6 h-6" />
                          ) : (
                            <Stethoscope className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800 text-sm md:text-base leading-snug">
                            {booking.title}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium">{booking.subtitle}</p>
                          {booking.detailTag && (
                            <span
                              className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                                booking.type === 'LAB'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : booking.type === 'NURSING'
                                  ? 'bg-teal-50 text-teal-700'
                                  : 'bg-blue-50 text-blue-600'
                              }`}
                            >
                              {booking.detailTag}
                            </span>
                          )}
                        </div>
                      </div>

                      <span
                        className={cn(
                          'px-2.5 py-1 rounded-md text-[10px] md:text-xs font-semibold border shrink-0',
                          isConfirmed
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : isCompleted
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : isCancelled
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        )}
                      >
                        {isConfirmed ? 'Confirmed' : isCompleted ? 'Completed' : isCancelled ? 'Cancelled' : booking.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs text-slate-600 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-700">{booking.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-700">{booking.timeSlot}</span>
                      </div>
                      <div className="flex items-center gap-2 col-span-2">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate text-slate-600">{booking.location}</span>
                      </div>
                      <div className="col-span-2 flex items-center justify-between pt-1 border-t border-slate-50 text-[11px] text-slate-400">
                        <span className="truncate">
                          ID: <strong className="font-mono text-slate-700">{(booking.nursingRecord?.bookingNumber || booking.id).slice(0, 15)}</strong>
                        </span>
                        <span className="font-bold text-primary">
                          {booking.type === 'LAB' ? 'Diagnostic Test' : booking.type === 'NURSING' ? 'Home Nursing Visit' : (booking.opRecord?.opType === 'Video Consultation' ? 'Video Consultation' : 'In-Hospital OP Visit')}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}

              {/* Empty state */}
              {displayedBookings.length === 0 && (
                <div className="py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <CalendarDays className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-slate-700 text-sm mb-1">
                    {activeTab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {activeTab === 'upcoming'
                      ? 'Your scheduled OP consultations and lab tests will appear here.'
                      : 'Your completed consultations and test records will appear here.'}
                  </p>
                  {activeTab === 'upcoming' && (
                    <button
                      onClick={() => navigate('/lab-tests')}
                      className="mt-4 px-5 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Book a Lab Test
                    </button>
                  )}
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
