import { useState, useEffect, useMemo, useRef } from 'react';
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
  ClipboardList,
  CheckCircle2,
  Building2,
  FileText,
  Star
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { ReviewModal } from '../components/ReviewModal';
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
  rawDate?: string;
  location: string;
  status: string;
  opRecord?: OpBookingRecord;
  labRecord?: LabBookingRecord;
  nursingRecord?: HomeNursingBookingRecord;
}

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  // Avoid UTC midnight shift for date-only format (e.g. 2026-10-17)
  if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
    const [y, m, d] = dateString.split('T')[0].split('-').map(Number);
    const localDate = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
    }).format(localDate);
  }
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
  }).format(d);
};

export const getStatusConfig = (status: string) => {
  const s = (status || '').toUpperCase().trim();
  switch (s) {
    case 'IN_CONSULTATION':
    case 'IN_PROGRESS':
      return { 
        label: 'In Consultation', 
        classes: 'bg-indigo-50 text-indigo-700 border-indigo-200 font-extrabold' 
      };
    case 'WAITING':
      return { 
        label: 'Waiting in Queue', 
        classes: 'bg-amber-50 text-amber-700 border-amber-200 font-extrabold' 
      };
    case 'CONFIRMED':
      return { 
        label: 'Confirmed', 
        classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' 
      };
    case 'CALLED':
      return { 
        label: 'Called (Proceed In)', 
        classes: 'bg-orange-50 text-orange-700 border-orange-200 font-extrabold' 
      };
    case 'PENDING':
    case 'REQUESTED':
      return { 
        label: 'Requested', 
        classes: 'bg-amber-50 text-amber-700 border-amber-200' 
      };
    case 'SAMPLE_COLLECTED':
      return { 
        label: 'Sample Collected', 
        classes: 'bg-cyan-50 text-cyan-700 border-cyan-200 font-bold' 
      };
    case 'IN_LAB_PROCESSING':
      return { 
        label: 'In Lab Processing', 
        classes: 'bg-blue-50 text-blue-700 border-blue-200 font-bold' 
      };
    case 'REPORT_READY':
      return { 
        label: 'Report Ready', 
        classes: 'bg-purple-50 text-purple-700 border-purple-200 font-extrabold' 
      };
    case 'COMPLETED':
      return { 
        label: 'Completed', 
        classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold' 
      };
    case 'CANCELLED':
      return { 
        label: 'Cancelled', 
        classes: 'bg-rose-50 text-rose-700 border-rose-200 font-bold' 
      };
    case 'ASSIGNED':
      return { 
        label: 'Assigned', 
        classes: 'bg-teal-50 text-teal-700 border-teal-200 font-bold' 
      };
    default:
      return { 
        label: status ? status.replace(/_/g, ' ') : 'Confirmed', 
        classes: 'bg-slate-50 text-slate-700 border-slate-200' 
      };
  }
};

export const isNursingCompletable = (status: string) => {
  const s = (status || '').toUpperCase().trim();
  return (
    ['ASSIGNED', 'CONFIRMED', 'IN_PROGRESS', 'ACTIVE', 'ON_THE_WAY'].includes(s) &&
    s !== 'COMPLETED' &&
    s !== 'CANCELLED'
  );
};

export const isHomeSampleCompletable = (status: string, collectionType?: string, reportUrl?: string) => {
  if (collectionType !== 'HOME_COLLECTION') return false;
  const s = (status || '').toUpperCase().trim();
  const hasReport = Boolean(reportUrl || s === 'REPORT_READY');
  return hasReport && s !== 'COMPLETED' && s !== 'CANCELLED';
};

const MyBookings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [opBookings, setOpBookings] = useState<OpBookingRecord[]>([]);
  const [labBookings, setLabBookings] = useState<LabBookingRecord[]>([]);
  const [nursingBookings, setNursingBookings] = useState<HomeNursingBookingRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const lastFetchRef = useRef<number>(0);

  const handleCompleteNursing = async (bookingId: string) => {
    setCompletingId(bookingId);
    try {
      const res = await homeNursingApi.updateBookingStatus(bookingId, 'COMPLETED');
      if (res.success) {
        setNursingBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: 'COMPLETED' } : b))
        );
        setToastMessage({
          message: 'Home nursing service marked as completed! Moved to Past bookings.',
          type: 'success',
        });
        setTimeout(() => setToastMessage(null), 4000);
        // Silently reload in background to sync all state
        loadBookings(true);
      } else {
        setToastMessage({
          message: res.error || 'Failed to complete home nursing booking.',
          type: 'error',
        });
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err: any) {
      setToastMessage({
        message: err.message || 'Failed to complete home nursing booking.',
        type: 'error',
      });
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setCompletingId(null);
    }
  };

  const handleCompleteLab = async (bookingId: string) => {
    setCompletingId(bookingId);
    try {
      const res = await labBookingApi.updateBookingStatus(bookingId, 'COMPLETED');
      if (res.success) {
        setLabBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: 'COMPLETED' } : b))
        );
        setToastMessage({
          message: 'Home sample collection marked as completed! Moved to Past bookings.',
          type: 'success',
        });
        setTimeout(() => setToastMessage(null), 4000);
        // Silently reload in background to sync all state
        loadBookings(true);
      } else {
        setToastMessage({
          message: res.error || 'Failed to complete home sample collection booking.',
          type: 'error',
        });
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err: any) {
      setToastMessage({
        message: err.message || 'Failed to complete home sample collection booking.',
        type: 'error',
      });
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setCompletingId(null);
    }
  };

  const loadBookings = async (silent = false) => {
    if (!silent) setIsLoading(true);
    if (!silent) setError(null);
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

      if (!silent) {
        if (!opRes.success) {
          setError(opRes.error || 'Unable to load your appointments.');
        } else if (!labRes.success) {
          setError(labRes.error || 'Unable to load your lab bookings.');
        }
      }
    } catch (err: any) {
      if (!silent) setError(err.message || 'Unable to connect to the server.');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
    lastFetchRef.current = Date.now();

    // 5-second gentle live polling
    const timer = setInterval(() => {
      loadBookings(true);
      lastFetchRef.current = Date.now();
    }, 5000);

    const handleThrottledSync = () => {
      if (Date.now() - lastFetchRef.current > 3000) {
        loadBookings(true);
        lastFetchRef.current = Date.now();
      }
    };

    const handleFocus = () => handleThrottledSync();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        handleThrottledSync();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const { upcomingList, pastList } = useMemo(() => {
    const upcoming: UnifiedBooking[] = [];
    const past: UnifiedBooking[] = [];

    // Map OP Bookings: Terminal states (COMPLETED, CANCELLED) move to Past, active stay in Upcoming
    opBookings.forEach((b) => {
      const isStatusPast = b.status === 'COMPLETED' || b.status === 'CANCELLED';

      const unified: UnifiedBooking = {
        id: b.id,
        displayId: b.id,
        type: 'OP',
        serviceTypeLabel: (b.opType || '').toLowerCase().includes('video') ? 'Video Consultation' : 'OP Consultation',
        title: `Dr. ${b.doctorName.replace(/^Dr\.\s*/i, '')}`,
        subtitle: b.hospitalName || 'Hospital Visit',
        date: formatDate(b.date),
        rawDate: b.date,
        timeSlot: b.timeSlot,
        location: b.hospitalAddress || b.hospitalName || 'Contact hospital for location',
        status: b.status,
        opRecord: b,
      };

      if (isStatusPast) past.push(unified);
      else upcoming.push(unified);
    });

    // Map Lab Bookings: COMPLETED and CANCELLED move to Past, pending/in-progress stay in Upcoming
    labBookings.forEach((l: any) => {
      const isStatusPast = l.status === 'COMPLETED' || l.status === 'CANCELLED';

      const rawTests = l.items?.map((i: any) => i.labTest?.platformTest?.name).filter(Boolean) || [];
      const isHome = (l.collectionType || l.bookingType) === 'HOME_COLLECTION';
      const testTitle = l.testName || (rawTests.length > 0 ? rawTests.join(', ') : (isHome ? 'Home Sample Collection' : 'Diagnostic Lab Test'));
      const labName = l.laboratoryName || l.hospital?.name || 'Laboratory';

      const rawDate = l.date || l.bookingDate || (l.collectionDate ? String(l.collectionDate).split('T')[0] : (l.createdAt ? String(l.createdAt).split('T')[0] : ''));
      const rawTime = l.timeSlot || l.time || l.collectionTimeSlot || (isHome ? 'Standard Slot' : 'Flexible Hours');

      const labAddressParts = [
        l.hospital?.addressLine1,
        l.hospital?.area,
        l.hospital?.city
      ].filter(Boolean).join(', ');

      const loc = isHome
        ? (l.collectionAddress || 'Home Collection')
        : (l.laboratoryAddress || labAddressParts || labName || 'Hospital Visit');

      const unified: UnifiedBooking = {
        id: l.id,
        displayId: l.bookingNumber || l.bookingId || (l.id ? `LB-${l.id.slice(0, 8).toUpperCase()}` : l.id),
        type: 'LAB',
        serviceTypeLabel: isHome ? 'Home Sample Collection' : 'Lab Visit',
        title: testTitle,
        subtitle: labName,
        date: formatDate(rawDate),
        rawDate: rawDate,
        timeSlot: rawTime,
        location: loc,
        status: l.status,
        labRecord: l,
      };

      if (isStatusPast) past.push(unified);
      else upcoming.push(unified);
    });

    // Map Home Nursing Bookings
    nursingBookings.forEach((n) => {
      const isStatusPast = n.status === 'COMPLETED' || n.status === 'CANCELLED';

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

      if (isStatusPast) past.push(unified);
      else upcoming.push(unified);
    });

    const sorter = (a: UnifiedBooking, b: UnifiedBooking) => {
      const dateA = a.opRecord?.date || a.labRecord?.date || a.labRecord?.bookingDate || (a.labRecord as any)?.collectionDate || a.nursingRecord?.date || '';
      const dateB = b.opRecord?.date || b.labRecord?.date || b.labRecord?.bookingDate || (b.labRecord as any)?.collectionDate || b.nursingRecord?.date || '';
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
            onClick={() => loadBookings()}
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
      <div className="p-4 sm:p-6 flex-1">
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {error && (
            <div className="col-span-full bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span className="font-semibold">{error}</span>
              </div>
              <button onClick={() => loadBookings()} className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-bold transition-colors">
                Retry
              </button>
            </div>
          )}

          {isLoading && displayedBookings.length === 0 ? (
            <div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
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
                    {booking.opRecord?.doctorDesignation && (
                      <p className="text-[11px] font-medium text-blue-600 mb-0.5 truncate">{booking.opRecord.doctorDesignation}</p>
                    )}
                    <div className="mb-2 flex flex-wrap items-center gap-1.5">
                      {booking.opRecord?.diseaseName && (
                        <span className="inline-block bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {booking.opRecord.diseaseName}
                        </span>
                      )}
                      {booking.opRecord?.prescription?.suggestPhysicalFollowUp && (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                          <Building2 className="w-3 h-3 text-amber-600" />
                          Physical OP Visit Advised
                        </span>
                      )}
                      {booking.type === 'LAB' && isHomeSampleCompletable(booking.status, booking.labRecord?.collectionType, booking.labRecord?.reportUrl) && (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs animate-pulse">
                          <Clock className="w-3 h-3 text-amber-700" />
                          Report Ready • Awaiting Completion
                        </span>
                      )}
                      {booking.type === 'LAB' && booking.status === 'COMPLETED' && booking.labRecord?.collectionType === 'HOME_COLLECTION' && (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Completed
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] font-semibold text-slate-500 mb-4 truncate">{booking.subtitle}</p>

                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          <CalendarDays className="w-3 h-3 text-slate-500" />
                        </div>
                        <div className="flex items-center text-[12px] font-semibold text-slate-700 gap-1.5 flex-wrap">
                          <span>Date:</span>
                          <span className="text-slate-900">{booking.date}</span>
                          {booking.rawDate && booking.rawDate !== booking.date && (
                            <span className="text-slate-400 text-[11px] font-normal">{booking.rawDate}</span>
                          )}
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
                  <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span className="font-semibold">ID:</span>
                      <strong className="font-mono text-slate-900 font-bold truncate max-w-[90px] sm:max-w-[140px]">
                        {booking.displayId}
                      </strong>
                    </div>
                    <div className="flex items-center gap-2">
                      {booking.type === 'NURSING' && isNursingCompletable(booking.status) && (
                        <button
                          disabled={completingId === booking.id}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCompleteNursing(booking.id);
                          }}
                          className="flex items-center gap-1.5 font-bold text-[12px] px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                          title="Mark this home nursing service as completed"
                        >
                          {completingId === booking.id ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Completing...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Complete</span>
                            </>
                          )}
                        </button>
                      )}
                      {booking.type === 'LAB' && isHomeSampleCompletable(booking.status, booking.labRecord?.collectionType, booking.labRecord?.reportUrl) && (
                        <button
                          disabled={completingId === booking.id}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCompleteLab(booking.id);
                          }}
                          className="flex items-center gap-1.5 font-bold text-[12px] px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                          title="Mark this home sample collection as completed"
                        >
                          {completingId === booking.id ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Completing...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Complete</span>
                            </>
                          )}
                        </button>
                      )}
                      {booking.type === 'LAB' && booking.labRecord?.reportUrl && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.open(booking.labRecord!.reportUrl, '_blank');
                          }}
                          className="flex items-center gap-1 font-bold text-[11px] px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                          title="Download official laboratory report"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Report</span>
                        </button>
                      )}
                      {booking.status === 'COMPLETED' && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setReviewBookingId(booking.id);
                          }}
                          className="flex items-center gap-1 font-bold text-[11px] px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                          title="Rate and review your experience"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                          <span>Review</span>
                        </button>
                      )}
                      <Link
                        to={`/booking/${booking.id}`}
                        className="flex items-center gap-1 text-[12px] font-black text-[#0055ff] hover:text-blue-700 transition-colors"
                      >
                        {booking.serviceTypeLabel === 'Video Consultation' ? 'View Consultation' : 'View Details'}
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
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

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 max-w-md mx-auto">
          <div
            className={cn(
              'text-white px-4 py-3 rounded-2xl shadow-2xl text-[13px] font-semibold flex items-center justify-between gap-3 border',
              toastMessage.type === 'error'
                ? 'bg-rose-600 border-rose-500'
                : 'bg-slate-900 border-slate-800'
            )}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-200 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span>{toastMessage.message}</span>
            </div>
            {toastMessage.type === 'success' && activeTab === 'upcoming' && (
              <button
                onClick={() => {
                  setActiveTab('past');
                  setToastMessage(null);
                }}
                className="text-xs font-bold text-blue-300 hover:text-white underline shrink-0 cursor-pointer"
              >
                View Past
              </button>
            )}
      {/* Review Modal */}
      {reviewBookingId && (
        <ReviewModal
          bookingId={reviewBookingId}
          isOpen={Boolean(reviewBookingId)}
          onClose={() => setReviewBookingId(null)}
          onSuccess={() => {
            setReviewBookingId(null);
            loadBookings(true);
          }}
        />
      )}
    </div>
  );
};

export default MyBookings;
