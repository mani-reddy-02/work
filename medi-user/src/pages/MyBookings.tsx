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
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { opAppointmentApi, type OpBookingRecord } from '../lib/opAppointmentApi';
import { labBookingApi, type LabBookingRecord } from '../lib/labTestApi';
import { homeNursingApi, type HomeNursingBookingRecord } from '../lib/homeNursingApi';

interface UnifiedBooking {
  id: string;
  displayId: string;
  type: 'OP' | 'LAB' | 'NURSING';
  serviceTypeLabel: string;
  title: string;
  subtitle: string;
  date: string;
  timeSlot: string;
  location: string;
  status: string;
  opRecord?: OpBookingRecord;
  labRecord?: LabBookingRecord;
  nursingRecord?: HomeNursingBookingRecord;
}

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short'
  }).format(d);
};

const getStatusConfig = (status: string) => {
  const s = (status || '').toUpperCase();
  switch (s) {
    case 'WAITING':
    case 'PENDING':
    case 'REQUESTED':
      return { label: 'Requested', classes: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'CONFIRMED':
    case 'IN_CONSULTATION':
      return { label: 'Confirmed', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'COMPLETED':
      return { label: 'Completed', classes: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'CANCELLED':
      return { label: 'Cancelled', classes: 'bg-red-50 text-red-700 border-red-200' };
    case 'REPORT_READY':
      return { label: 'Report Ready', classes: 'bg-purple-50 text-purple-700 border-purple-200' };
    default:
      return { label: status, classes: 'bg-slate-50 text-slate-700 border-slate-200' };
  }
};

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
        displayId: b.id,
        type: 'OP',
        serviceTypeLabel: b.opType === 'Video Consultation' ? 'Video Consultation' : 'OP Consultation',
        title: `Dr. ${b.doctorName.replace(/^Dr\.\s*/i, '')}`,
        subtitle: b.hospitalName || 'Hospital Visit',
        date: formatDate(b.date),
        timeSlot: b.timeSlot,
        location: b.hospitalAddress || b.hospitalName || 'Contact hospital for location',
        status: b.status,
        opRecord: b,
      };

      if (isStatusPast || isDatePast) past.push(unified);
      else upcoming.push(unified);
    });

    // Map Lab Bookings
    labBookings.forEach((l) => {
      const isStatusPast = l.status === 'COMPLETED' || l.status === 'CANCELLED';
      const apptDate = new Date(l.date || l.bookingDate);
      const isDatePast = !isNaN(apptDate.getTime()) && apptDate < today;

      const unified: UnifiedBooking = {
        id: l.id,
        displayId: l.bookingNumber || l.bookingId || l.id,
        type: 'LAB',
        serviceTypeLabel: l.collectionType === 'HOME_COLLECTION' ? 'Home Sample Collection' : 'Lab Visit',
        title: l.testName,
        subtitle: l.laboratoryName,
        date: formatDate(l.date || l.bookingDate),
        timeSlot: l.timeSlot || l.time,
        location: l.collectionType === 'HOME_COLLECTION' ? l.collectionAddress || 'Home Collection' : l.laboratoryAddress || l.laboratoryName || 'Contact laboratory for location',
        status: l.status,
        labRecord: l,
      };

      if (isStatusPast || isDatePast) past.push(unified);
      else upcoming.push(unified);
    });

    // Map Home Nursing Bookings
    nursingBookings.forEach((n) => {
      const isStatusPast = n.status === 'COMPLETED' || n.status === 'CANCELLED';
      const serviceDate = new Date(n.date);
      const isDatePast = !isNaN(serviceDate.getTime()) && serviceDate < today;

      const unified: UnifiedBooking = {
        id: n.id,
        displayId: n.bookingNumber || n.id,
        type: 'NURSING',
        serviceTypeLabel: 'Home Nursing',
        title: n.serviceName,
        subtitle: n.hospitalName,
        date: formatDate(n.date),
        timeSlot: n.timeSlot,
        location: n.address || 'Home Service',
        status: n.status,
        nursingRecord: n,
      };

      if (isStatusPast || isDatePast) past.push(unified);
      else upcoming.push(unified);
    });

    const sorter = (a: UnifiedBooking, b: UnifiedBooking) => {
      const dateA = a.opRecord?.date || a.labRecord?.date || a.labRecord?.bookingDate || a.nursingRecord?.date || '';
      const dateB = b.opRecord?.date || b.labRecord?.date || b.labRecord?.bookingDate || b.nursingRecord?.date || '';
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    };

    upcoming.sort(sorter);
    past.sort(sorter);

    return { upcomingList: upcoming, pastList: past };
  }, [opBookings, labBookings, nursingBookings]);

  const displayedBookings = activeTab === 'upcoming' ? upcomingList : pastList;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-20 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-700">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-black text-slate-900 tracking-tight">My Bookings</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
            {upcomingList.length + pastList.length} Total
          </span>
          <button
            onClick={loadBookings}
            disabled={isLoading}
            className="p-2 hover:bg-blue-50 text-blue-600 rounded-full transition-colors disabled:opacity-50 bg-blue-50/50"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white px-4 border-b border-slate-200 sticky top-[60px] z-10">
        <div className="flex items-center justify-center max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={cn(
              'flex-1 py-3.5 text-[13px] font-bold border-b-2 transition-all flex items-center justify-center gap-2',
              activeTab === 'upcoming' ? 'border-[#0055ff] text-[#0055ff]' : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            Upcoming
            {upcomingList.length > 0 && (
              <span className={cn('px-1.5 py-0.5 rounded text-[10px] leading-none', activeTab === 'upcoming' ? 'bg-blue-100' : 'bg-slate-100')}>
                {upcomingList.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={cn(
              'flex-1 py-3.5 text-[13px] font-bold border-b-2 transition-all flex items-center justify-center gap-2',
              activeTab === 'past' ? 'border-[#0055ff] text-[#0055ff]' : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            Past
            {pastList.length > 0 && (
              <span className={cn('px-1.5 py-0.5 rounded text-[10px] leading-none', activeTab === 'past' ? 'bg-blue-100' : 'bg-slate-100')}>
                {pastList.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1">
        <div className="max-w-md md:max-w-full lg:max-w-5xl mx-auto space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
          {error && (
            <div className="col-span-full bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span className="font-semibold">{error}</span>
              </div>
              <button onClick={loadBookings} className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-bold transition-colors">
                Retry
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="col-span-full space-y-3 pt-2 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
                    <div className="flex-1">
                      <div className="h-3 bg-slate-200 rounded w-1/3 mb-2" />
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-3 bg-slate-100 rounded w-full" />
                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                  </div>
                  <div className="h-8 bg-slate-100 rounded-lg w-full mt-4" />
                </div>
              ))}
            </div>
          ) : displayedBookings.length > 0 ? (
            displayedBookings.map((booking) => {
              const statusCfg = getStatusConfig(booking.status);
              
              return (
                <div key={booking.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  {/* Top row */}
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border bg-white',
                        booking.type === 'LAB' ? 'text-blue-600 border-blue-200' :
                        booking.type === 'NURSING' ? 'text-teal-600 border-teal-200' :
                        'text-indigo-600 border-indigo-200'
                      )}>
                        {booking.type === 'LAB' ? <TestTube className="w-4 h-4" /> :
                         booking.type === 'NURSING' ? <Home className="w-4 h-4" /> :
                         <Stethoscope className="w-4 h-4" />}
                      </div>
                      <span className="text-[11px] font-black text-slate-700 uppercase tracking-wide">
                        {booking.serviceTypeLabel}
                      </span>
                    </div>
                    <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider', statusCfg.classes)}>
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* Main Details */}
                  <div className="p-4 flex-1">
                    <h3 className="font-bold text-slate-900 text-sm leading-snug mb-1 truncate">{booking.title}</h3>
                    <p className="text-[12px] font-semibold text-slate-500 mb-4 truncate">{booking.subtitle}</p>

                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          <CalendarDays className="w-3 h-3 text-slate-500" />
                        </div>
                        <div className="flex items-center text-[12px] font-semibold text-slate-700 gap-1.5 flex-wrap">
                          <span>Date:</span>
                          <span className="text-slate-900">{booking.date}</span>
                          <span className="text-slate-300 mx-1 hidden sm:inline">|</span>
                          <Clock className="w-3 h-3 text-slate-400 ml-2 sm:ml-0" />
                          <span>Time:</span>
                          <span className="text-slate-900">{booking.timeSlot || 'TBD'}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-500" />
                        </div>
                        <div className="flex flex-col text-[12px] font-semibold text-slate-700">
                          <span>Location:</span>
                          <span className="text-slate-500 leading-tight line-clamp-2">{booking.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row */}
                  <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span className="font-semibold">ID:</span>
                      <strong className="font-mono text-slate-900 font-bold truncate max-w-[100px] sm:max-w-[150px]">
                        {booking.displayId}
                      </strong>
                    </div>
                    <Link
                      to={`/booking/${booking.id}`}
                      className="flex items-center gap-1 text-[12px] font-black text-[#0055ff] hover:text-blue-700 transition-colors"
                    >
                      View Details
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
              <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 ring-4 ring-slate-50/50">
                <ClipboardList className="w-6 h-6" />
              </div>
              <h3 className="font-black text-slate-800 text-sm mb-1.5">
                {activeTab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
              </h3>
              <p className="text-[12px] font-medium text-slate-500 mb-6 max-w-[240px] mx-auto">
                {activeTab === 'upcoming'
                  ? "You don't have any scheduled appointments, lab tests, or nursing services."
                  : "You don't have any completed or cancelled history yet."}
              </p>
              {activeTab === 'upcoming' && (
                <div className="flex flex-col gap-2 max-w-[200px] mx-auto">
                  <button onClick={() => navigate('/lab-tests')} className="w-full px-4 py-2.5 bg-[#0055ff] text-white rounded-xl text-[12px] font-bold hover:bg-blue-600 transition-colors shadow-sm">
                    Book Lab Test
                  </button>
                  <button onClick={() => navigate('/doctors')} className="w-full px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-[12px] font-bold hover:bg-slate-50 transition-colors">
                    Consult Doctor
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyBookings;
