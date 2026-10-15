import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  UserSquare,
  IndianRupee,
  Activity,
  AlertCircle,
  Stethoscope,
  TestTube,
  Hospital,
  ShieldCheck,
  Phone,
  Mail,
  Home,
  FileText,
  Video,
  Building2,
  CheckCircle2,
  User,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { opAppointmentApi, type OpBookingRecord } from '../lib/opAppointmentApi';
import { labBookingApi, type LabBookingRecord } from '../lib/labTestApi';
import { homeNursingApi, type HomeNursingBookingRecord } from '../lib/homeNursingApi';
import { cn } from '../lib/utils';
import { getDiseaseIconUrl } from '../utils/diseaseIcons';
import { getTestIcon } from '../lib/optimizedTestIcons';

const BookingDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [appointment, setAppointment] = useState<OpBookingRecord | null>(null);
  const [labBooking, setLabBooking] = useState<LabBookingRecord | null>(null);
  const [nursingBooking, setNursingBooking] = useState<HomeNursingBookingRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [doctorImgError, setDoctorImgError] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;



    const loadDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 1. Try fetching as an OP appointment
        const opRes = await opAppointmentApi.fetchAppointmentDetails(id);
        if (opRes.success && opRes.data) {
          setAppointment(opRes.data);
          setIsLoading(false);
          return;
        }

        // 2. Try fetching as a Lab booking
        const labRes = await labBookingApi.getLabBookingById(id);
        if (labRes.success && labRes.data) {
          setLabBooking(labRes.data);
          setIsLoading(false);
          return;
        }

        // 3. Try fetching as a Home Nursing booking
        const nursingRes = await homeNursingApi.getBookingById(id);
        if (nursingRes.success && nursingRes.data) {
          setNursingBooking(nursingRes.data);
          setIsLoading(false);
          return;
        }

        setError(opRes.error || labRes.error || nursingRes.error || 'Booking not found');
      } catch (err: any) {
        setError(err.message || 'Booking not found');
      } finally {
        setIsLoading(false);
      }
    };

    loadDetails();
  }, [id]);


  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary pt-4 pb-20 px-4 text-white rounded-b-3xl shadow-sm">
        <div className="flex items-center gap-3 max-w-md md:max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Booking Details</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 -mt-14 flex-1 pb-8">
        <div className="max-w-md md:max-w-2xl mx-auto space-y-4">
          {/* Loading state */}
          {isLoading && (
            <div className="bg-white p-8 rounded-2xl shadow-soft border border-slate-100 text-center space-y-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-slate-500 font-medium">Loading booking details...</p>
            </div>
          )}

          {/* Error state */}
          {error && !isLoading && (
            <div className="bg-white p-8 rounded-2xl shadow-soft border border-red-100 text-center space-y-4">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">Booking Not Found</h3>
              <p className="text-xs text-slate-500">{error}</p>
              <button
                onClick={() => navigate('/bookings')}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                Back to Bookings
              </button>
            </div>
          )}

          {/* LAB BOOKING LOADED */}
          {labBooking && !isLoading && (
            <>
              <div className="bg-white p-5 rounded-2xl shadow-soft border border-slate-100 flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 overflow-hidden p-1.5">
                  <img
                    src={getTestIcon(labBooking.testName, (labBooking as any).category)}
                    alt={labBooking.testName}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/optimized/Blood Test.webp';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-bold text-slate-800 text-base md:text-lg leading-tight">
                        {labBooking.testName}
                      </h2>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {labBooking.laboratoryName}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold border shrink-0 bg-green-50 text-green-700 border-green-200">
                      {labBooking.status || 'CONFIRMED'}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                      {labBooking.collectionType === 'HOME_COLLECTION' ? 'Home Sample Collection' : 'Visit Laboratory'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {labBooking.bookingNumber}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lab & Test Specific Info Card */}
              <div className="bg-white p-5 rounded-2xl shadow-soft border border-slate-100 space-y-4">
                <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
                  Diagnostic Information
                </h3>

                <div className="flex gap-3 items-start">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 text-primary">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Date & Time</p>
                    <p className="font-bold text-slate-800 text-sm">
                      {labBooking.date || labBooking.bookingDate}, {labBooking.timeSlot || labBooking.time}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 text-primary">
                    <Hospital className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Laboratory</p>
                    <p className="font-bold text-slate-800 text-sm">{labBooking.laboratoryName}</p>
                    <p className="text-xs text-slate-500">{labBooking.laboratoryAddress}</p>
                    {labBooking.laboratoryPhone && (
                      <p className="text-xs text-blue-600 font-medium mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {labBooking.laboratoryPhone}
                      </p>
                    )}
                  </div>
                </div>

                {labBooking.collectionType === 'HOME_COLLECTION' && labBooking.collectionAddress && (
                  <div className="flex gap-3 items-start">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 text-emerald-600">
                      <Home className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                        Home Collection Address
                      </p>
                      <p className="font-medium text-slate-800 text-xs leading-relaxed">
                        {labBooking.collectionAddress}
                      </p>
                    </div>
                  </div>
                )}

                {labBooking.prep && (
                  <div className="flex gap-3 items-start">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 text-amber-600">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                        Preparation Required
                      </p>
                      <p className="text-xs text-slate-700 font-medium">{labBooking.prep}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Patient Details Card */}
              <div className="bg-white p-5 rounded-2xl shadow-soft border border-slate-100 space-y-3">
                <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
                  Patient Information
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Patient Name</span>
                    <span className="font-bold text-slate-800">{labBooking.patientName}</span>
                  </div>
                  {labBooking.patientAge && (
                    <div>
                      <span className="text-slate-400 block text-[11px]">Age & Gender</span>
                      <span className="font-bold text-slate-800">
                        {labBooking.patientAge} Years, {labBooking.patientGender || 'Not specified'}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400 block text-[11px]">Contact Phone</span>
                    <span className="font-bold text-slate-800">{labBooking.patientPhone}</span>
                  </div>
                  {labBooking.patientEmail && (
                    <div>
                      <span className="text-slate-400 block text-[11px]">Email</span>
                      <span className="font-bold text-slate-800">{labBooking.patientEmail}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Card */}
              <div className="bg-white p-5 rounded-2xl shadow-soft border border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2 mb-3">
                  Payment Summary
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Test Price</span>
                    <span className="font-semibold text-slate-800">
                      ₹{Math.round(labBooking.testPrice || 0)}
                    </span>
                  </div>
                  {labBooking.collectionFee > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Home Collection Fee</span>
                      <span className="font-semibold text-slate-800">
                        ₹{Math.round(labBooking.collectionFee)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-slate-100 pt-2 flex justify-between text-sm font-bold text-slate-900">
                    <span>Total Amount Paid</span>
                    <span className="text-primary text-base font-black">
                      {labBooking.amount || `₹${Math.round(labBooking.totalAmount || 0)}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 pb-4 space-y-3">
                {(labBooking.status === 'REPORT_READY' || labBooking.status === 'COMPLETED') && labBooking.reportUrl && (
                  <button
                    onClick={() => window.open(labBooking.reportUrl, '_blank')}
                    className="w-full bg-emerald-600 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <FileText className="w-5 h-5" />
                    Download Lab Report
                  </button>
                )}
                <button
                  onClick={() => navigate('/bookings')}
                  className="w-full bg-primary text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-primary/30 hover:bg-blue-700 transition-colors text-sm"
                >
                  Back to My Bookings
                </button>
              </div>
            </>
          )}

          {/* HOME NURSING BOOKING LOADED */}
          {nursingBooking && !isLoading && (
            <>
              {/* Nursing Service Card */}
              <div className="bg-white p-5 rounded-2xl shadow-soft border border-slate-100 flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-teal-50 text-teal-600 border border-teal-100">
                  <Home className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-bold text-slate-800 text-lg leading-tight">
                        {nursingBooking.serviceName}
                      </h2>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {nursingBooking.serviceCategory || 'Home Healthcare'}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-md text-[10px] font-semibold border',
                        nursingBooking.status === 'CONFIRMED' || nursingBooking.status === 'Confirmed'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : nursingBooking.status === 'COMPLETED'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : nursingBooking.status === 'CANCELLED'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      )}
                    >
                      {nursingBooking.status === 'CONFIRMED' ? 'Confirmed' : nursingBooking.status}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {nursingBooking.bookingNumber}
                    </span>
                  </div>
                </div>
              </div>

              {/* Service & Shift Logistics Card */}
              <div className="bg-white p-5 rounded-2xl shadow-soft border border-slate-100 space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center shrink-0 text-teal-600">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">
                      Service Date
                    </p>
                    <p className="font-semibold text-slate-800">{nursingBooking.date}</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center shrink-0 text-teal-600">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">
                      Shift / Time Slot
                    </p>
                    <p className="font-semibold text-slate-800">{nursingBooking.timeSlot}</p>
                    {nursingBooking.duration && (
                      <p className="text-xs text-slate-500 mt-0.5">Duration: {nursingBooking.duration}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center shrink-0 text-teal-600">
                    <Hospital className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">
                      Providing Hospital
                    </p>
                    <p className="font-semibold text-slate-800">{nursingBooking.hospitalName}</p>
                    {nursingBooking.hospitalAddress && (
                      <p className="text-xs text-slate-500 mt-0.5">{nursingBooking.hospitalAddress}</p>
                    )}
                    {nursingBooking.hospitalPhone && (
                      <p className="text-xs text-teal-700 mt-1 flex items-center gap-1 font-medium">
                        <Phone className="w-3 h-3" /> {nursingBooking.hospitalPhone}
                      </p>
                    )}
                  </div>
                </div>

                {nursingBooking.nurseName && (
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center shrink-0 text-teal-600">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">
                        Assigned Nurse
                      </p>
                      <p className="font-semibold text-slate-800">{nursingBooking.nurseName}</p>
                      <p className="text-xs text-slate-500">{nursingBooking.nurseDesignation || 'Healthcare Nurse'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Patient & Address Card */}
              <div className="bg-white p-5 rounded-2xl shadow-soft border border-slate-100 space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center shrink-0 text-teal-600">
                    <UserSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">
                      Patient Details
                    </p>
                    <p className="font-semibold text-slate-800">{nursingBooking.patientName}</p>
                    <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-2">
                      <span>{nursingBooking.patientPhone}</span>
                      {nursingBooking.patientAge && <span>• {nursingBooking.patientAge} Yrs</span>}
                      {nursingBooking.patientGender && <span>• {nursingBooking.patientGender}</span>}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center shrink-0 text-teal-600">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">
                      Care Location (Home Address)
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {nursingBooking.address}
                      {nursingBooking.city && `, ${nursingBooking.city}`}
                      {nursingBooking.pincode && ` - ${nursingBooking.pincode}`}
                    </p>
                  </div>
                </div>

                {nursingBooking.notes && (
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center shrink-0 text-teal-600">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">
                        Requirements / Notes
                      </p>
                      <p className="text-xs text-slate-700 leading-relaxed">{nursingBooking.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Summary */}
              <div className="bg-white p-5 rounded-2xl shadow-soft border border-slate-100">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-semibold text-slate-700">Payment Status</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {nursingBooking.paymentStatus || 'PAID'}
                  </span>
                </div>
                <div className="pt-3 flex justify-between items-center text-sm font-bold text-slate-900">
                  <span>Total Amount Paid</span>
                  <span className="text-teal-700 text-lg font-black">
                    {nursingBooking.amount || `₹${Math.round(nursingBooking.totalAmount || 0)}`}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 pb-6 space-y-3">
                {nursingBooking.status !== 'CANCELLED' && nursingBooking.status !== 'COMPLETED' && (
                  <button
                    disabled={isCancelling}
                    onClick={async () => {
                      if (!nursingBooking.id) return;
                      if (!window.confirm('Are you sure you want to cancel this home nursing booking?')) return;
                      setIsCancelling(true);
                      try {
                        const res = await homeNursingApi.cancelBooking(nursingBooking.id);
                        if (res.success) {
                          setNursingBooking((prev) =>
                            prev ? { ...prev, status: 'CANCELLED', paymentStatus: 'REFUNDED' } : null
                          );
                          alert('Booking cancelled successfully.');
                        } else {
                          alert(res.error || 'Could not cancel booking.');
                        }
                      } catch (err: any) {
                        alert(err.message || 'Failed to cancel booking.');
                      } finally {
                        setIsCancelling(false);
                      }
                    }}
                    className="w-full bg-rose-50 text-rose-600 border border-rose-200 font-semibold py-3 rounded-2xl hover:bg-rose-100 transition-colors text-xs disabled:opacity-50"
                  >
                    {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
                  </button>
                )}

                <button
                  onClick={() => navigate('/bookings')}
                  className="w-full bg-[#0055ff] text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-colors text-sm"
                >
                  Back to My Bookings
                </button>
              </div>
            </>
          )}

          {/* OP & VIDEO CONSULTATION APPOINTMENT LOADED */}
          {appointment && !isLoading && (
            <>
              {/* 1. PRIMARY HEALTH CONCERN / DISEASE CARD (MAIN HIGHLIGHT) */}
              <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-100 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-blue-100/50 via-cyan-50/30 to-transparent rounded-bl-full pointer-events-none -mr-4 -mt-4" />

                <div className="relative z-10 flex items-start gap-4">
                  {/* Disease 3D Illustration */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/70 border border-blue-100 flex items-center justify-center shrink-0 p-2 shadow-inner overflow-hidden">
                    <img
                      src={getDiseaseIconUrl(appointment.diseaseName || appointment.departmentName)}
                      alt={appointment.diseaseName || 'Health Concern'}
                      className="w-full h-full object-contain drop-shadow-sm"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/optimized/Blood Test.webp';
                      }}
                    />
                  </div>

                  {/* Disease Info & Badges */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                        Primary Health Concern
                      </span>
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 uppercase tracking-wide flex items-center gap-1.5',
                          appointment.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : appointment.status === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : appointment.status === 'IN_CONSULTATION'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        )}
                      >
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            appointment.status === 'COMPLETED'
                              ? 'bg-emerald-500'
                              : appointment.status === 'CANCELLED'
                              ? 'bg-rose-500'
                              : 'bg-amber-500 animate-pulse'
                          )}
                        />
                        {appointment.status || 'WAITING'}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight capitalize truncate">
                      {appointment.diseaseName || appointment.departmentName || 'General Consultation'}
                    </h2>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {appointment.departmentName && (
                        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                          {appointment.departmentName}
                        </span>
                      )}

                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border',
                          (appointment.opType || '').toLowerCase().includes('video')
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                            : 'bg-teal-50 text-teal-700 border-teal-100'
                        )}
                      >
                        {(appointment.opType || '').toLowerCase().includes('video') ? (
                          <>
                            <Video className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Video Consultation</span>
                          </>
                        ) : (
                          <>
                            <Hospital className="w-3.5 h-3.5 text-teal-600" />
                            <span>In-Person Hospital OP</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. DOCTOR PROFILE CARD */}
              <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-100 flex items-start gap-4">
                {/* Doctor Avatar / Blank Placeholder */}
                <div className="relative shrink-0">
                  <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden bg-slate-100 border-2 border-white shadow-md ring-1 ring-slate-200/80 flex items-center justify-center">
                    {appointment.doctorAvatar && appointment.doctorAvatar.trim() && !doctorImgError ? (
                      <img
                        src={appointment.doctorAvatar}
                        alt={appointment.doctorName}
                        className="w-full h-full object-cover object-top"
                        onError={() => setDoctorImgError(true)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                        <User className="w-8 h-8 text-slate-300" />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-full shadow-sm ring-2 ring-white">
                    <Stethoscope className="w-3 h-3" />
                  </div>
                </div>

                {/* Doctor Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-extrabold text-slate-900 text-base sm:text-lg leading-tight">
                      Dr. {appointment.doctorName.replace(/^Dr\.\s*/i, '')}
                    </h3>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                      <ShieldCheck className="w-3 h-3 text-blue-600" />
                      Verified
                    </span>
                  </div>

                  <p className="text-xs sm:text-[13px] font-semibold text-blue-600 mt-0.5 leading-snug">
                    {appointment.doctorDesignation || appointment.departmentName || 'Chief Consultant Physician'}
                  </p>
                </div>
              </div>

              {/* 3. SCHEDULE & LOGISTICS CARD */}
              <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-100 space-y-4">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Appointment Schedule & Location
                </h4>

                {/* Date & Time Twin Highlight Tiles */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Date
                      </span>
                      <span className="text-[13px] sm:text-sm font-extrabold text-slate-900 block truncate">
                        {appointment.date}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Time Slot
                      </span>
                      <span className="text-[13px] sm:text-sm font-extrabold text-slate-900 block truncate">
                        {appointment.timeSlot}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hospital Location (Only if present) */}
                {appointment.hospitalName && (
                  <div className="pt-2 border-t border-slate-100 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Hospital Location
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">
                        {appointment.hospitalName}
                      </p>
                      {appointment.hospitalAddress && (
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          {appointment.hospitalAddress}
                        </p>
                      )}
                      {appointment.hospitalPhone && (
                        <p className="text-xs text-blue-600 font-semibold mt-1 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{appointment.hospitalPhone}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Reason for Visit (Only if present) */}
                {appointment.reason && (
                  <div className="pt-2 border-t border-slate-100 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Reason for Visit
                      </span>
                      <p className="text-xs text-slate-700 font-medium mt-0.5">
                        {appointment.reason}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. PATIENT DETAILS CARD (Only if present) */}
              {(appointment.patientName || appointment.patientPhone) && (
                <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-100 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                    <UserSquare className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Patient Details
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">
                      {appointment.patientName}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                      {appointment.patientPhone && <span>{appointment.patientPhone}</span>}
                      {appointment.patientAge && <span>• {appointment.patientAge} Yrs</span>}
                      {appointment.patientGender && <span>• {appointment.patientGender}</span>}
                    </p>
                  </div>
                </div>
              )}

              {/* 5. CONSULTATION FEE & INVOICE */}
              <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <IndianRupee className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Consultation Fee
                    </span>
                    <span className="text-lg font-black text-slate-900">
                      ₹{appointment.fee !== undefined ? appointment.fee : 500}
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  Paid Online ✓
                </span>
              </div>

              {/* 6. OFFICIAL E-PRESCRIPTION (Only if prescribed) */}
              {appointment.prescription && (
                <div className="bg-white p-5 rounded-3xl shadow-soft border border-blue-100 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-primary flex items-center justify-center font-serif text-lg font-black italic">
                        ℞
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">Doctor's E-Prescription</h3>
                        <p className="text-[11px] text-slate-400">Digitally authorized by Dr. {appointment.doctorName}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Digitally Signed ✓
                    </span>
                  </div>

                  {/* Diagnosis */}
                  {appointment.prescription.diagnosis && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Clinical Diagnosis</span>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">{appointment.prescription.diagnosis}</p>
                    </div>
                  )}

                  {/* Prescribed Medications */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Prescribed Medications</span>
                      <span className="text-[11px] text-slate-400">
                        {appointment.prescription.items?.length || 0} items
                      </span>
                    </div>

                    {appointment.prescription.items && appointment.prescription.items.length > 0 ? (
                      <div className="space-y-2">
                        {appointment.prescription.items.map((med, idx) => (
                          <div key={idx} className="p-3 bg-blue-50/40 rounded-xl border border-blue-100/60 flex items-start justify-between gap-2">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-900">{med.medicineName}</span>
                                {med.strength && (
                                  <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-blue-100 text-primary font-medium">
                                    {med.strength}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500 mt-0.5">
                                {med.dosageForm} • {med.durationDays} Days • {med.timing?.replace('_', ' ') || 'After Food'}
                              </span>
                              {med.instructions && (
                                <span className="text-[11px] text-slate-600 italic mt-0.5">
                                  Note: {med.instructions}
                                </span>
                              )}
                            </div>
                            <span className="font-mono font-bold text-xs text-primary bg-white px-2 py-1 rounded-lg border border-blue-100">
                              {med.frequency}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">
                        No oral medications prescribed during this visit. Advice provided below.
                      </p>
                    )}
                  </div>

                  {/* General Advice */}
                  {appointment.prescription.generalAdvice && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Doctor's Advice</span>
                      <p className="text-xs text-slate-700 bg-amber-50/60 p-3 rounded-xl border border-amber-100 leading-relaxed font-medium">
                        {appointment.prescription.generalAdvice}
                      </p>
                    </div>
                  )}

                  {/* Follow up date */}
                  {appointment.prescription.followUpDate && (
                    <div className="flex items-center gap-2 text-xs text-slate-600 pt-1">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span>Follow-up: <strong>{new Date(appointment.prescription.followUpDate).toLocaleDateString()}</strong></span>
                    </div>
                  )}
                </div>
              )}

              {/* 7. ACTIONS & VIDEO CONSULTATION CALLOUT */}
              <div className="pt-2 pb-4 space-y-3">
                {((appointment.opType || '').toLowerCase().includes('video')) && (
                  <>
                    {appointment.status === 'COMPLETED' ? (
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                        <p className="text-xs font-bold text-emerald-800">Consultation Completed</p>
                        <p className="text-[11px] text-emerald-600 mt-0.5">
                          This video session has concluded. Your prescription and medical notes are available above.
                        </p>
                      </div>
                    ) : appointment.status === 'CANCELLED' ? (
                      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center">
                        <p className="text-xs font-bold text-rose-800">Consultation Cancelled</p>
                        <p className="text-[11px] text-rose-600 mt-0.5">
                          This appointment was cancelled. Please book another appointment if you still require care.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="p-3 bg-blue-50/80 rounded-2xl border border-blue-100 text-[11px] text-blue-700 flex items-start gap-2.5">
                          <Video className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">
                            Please ensure your camera and microphone are connected. When ready, click below to enter the secure consultation room.
                          </span>
                        </div>
                        <button
                          onClick={() => navigate(`/video-consultation/${appointment.id || appointment.appointmentId}`)}
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/25 active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2"
                        >
                          <Video className="w-5 h-5 text-white" />
                          {appointment.status === 'IN_CONSULTATION'
                            ? 'Rejoin Video Consultation'
                            : 'Join Video Consultation'}
                        </button>
                      </div>
                    )}
                  </>
                )}

                <button
                  onClick={() => navigate('/bookings')}
                  className="w-full bg-[#0055ff] hover:bg-blue-600 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-blue-500/25 transition-all text-sm flex items-center justify-center gap-2"
                >
                  Back to My Bookings
                </button>

                {(appointment.id || appointment.appointmentId) && (
                  <p className="text-center text-[10px] text-slate-400 font-mono pt-1">
                    Booking Reference: <span>{appointment.id || appointment.appointmentId}</span>
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;
