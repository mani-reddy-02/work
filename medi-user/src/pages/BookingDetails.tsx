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
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { opAppointmentApi, type OpBookingRecord } from '../lib/opAppointmentApi';
import { labBookingApi, type LabBookingRecord } from '../lib/labTestApi';
import { homeNursingApi, type HomeNursingBookingRecord } from '../lib/homeNursingApi';
import { cn } from '../lib/utils';

const BookingDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [appointment, setAppointment] = useState<OpBookingRecord | null>(null);
  const [labBooking, setLabBooking] = useState<LabBookingRecord | null>(null);
  const [nursingBooking, setNursingBooking] = useState<HomeNursingBookingRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

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
        <div className="flex items-center gap-3 max-w-md mx-auto">
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
        <div className="max-w-md mx-auto space-y-4">
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
                onClick={() => navigate('/my-bookings')}
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
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <TestTube className="w-7 h-7" />
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
                <button
                  onClick={() => navigate('/my-bookings')}
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
                  onClick={() => navigate('/my-bookings')}
                  className="w-full bg-[#0055ff] text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-colors text-sm"
                >
                  Back to My Bookings
                </button>
              </div>
            </>
          )}

          {/* OP APPOINTMENT LOADED */}
          {appointment && !isLoading && (
            <>
              {/* Doctor Profile Card */}
              <div className="bg-white p-5 rounded-2xl shadow-soft border border-slate-100 flex items-start gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                  {appointment.doctorAvatar ? (
                    <img
                      src={appointment.doctorAvatar}
                      alt={appointment.doctorName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-50 text-primary">
                      <Stethoscope className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-bold text-slate-800 text-lg">
                        Dr. {appointment.doctorName.replace(/^Dr\.\s*/i, '')}
                      </h2>
                      <p className="text-sm text-slate-500 font-medium">
                        {appointment.doctorDesignation || appointment.departmentName || 'OP Specialist'}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold border bg-green-50 text-green-700 border-green-200">
                      {appointment.status || 'Confirmed'}
                    </span>
                  </div>

                  {appointment.diseaseName && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
                        {appointment.diseaseName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {appointment.id || appointment.appointmentId}
                      </span>
                    </div>
                  )}
                  {!appointment.diseaseName && (appointment.id || appointment.appointmentId) && (
                    <div className="mt-2">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {appointment.id || appointment.appointmentId}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Appointment Logistics Card */}
              <div className="bg-white p-5 rounded-2xl shadow-soft border border-slate-100 space-y-5">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-primary">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Date</p>
                    <p className="font-medium text-slate-800">{appointment.date}</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-primary">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Time Slot</p>
                    <p className="font-medium text-slate-800">{appointment.timeSlot}</p>
                  </div>
                </div>

                {appointment.hospitalName && (
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-primary">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Hospital Location</p>
                      <p className="font-medium text-slate-800">{appointment.hospitalName}</p>
                      {appointment.hospitalAddress && (
                        <p className="text-xs text-slate-500">{appointment.hospitalAddress}</p>
                      )}
                    </div>
                  </div>
                )}

                {appointment.reason && (
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-primary">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Reason for Visit</p>
                      <p className="font-medium text-slate-800 text-sm">{appointment.reason}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-primary">
                    <IndianRupee className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Consultation Fee</p>
                    <p className="font-bold text-slate-800 text-sm">
                      ₹{appointment.fee !== undefined ? appointment.fee : 500}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 pb-4">
                <button
                  onClick={() => navigate('/my-bookings')}
                  className="w-full bg-primary text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-primary/30 hover:bg-blue-700 transition-colors text-sm"
                >
                  Back to My Bookings
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;
