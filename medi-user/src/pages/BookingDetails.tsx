import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, MapPin, UserSquare, IndianRupee, Activity, AlertCircle, Stethoscope } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { opAppointmentApi, type OpBookingRecord } from '../lib/opAppointmentApi';
import { cn } from '../lib/utils';

const BookingDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [appointment, setAppointment] = useState<OpBookingRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    // Handle mock demo service fallback
    if (id === '2') {
      setIsLoading(false);
      return;
    }

    const loadDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await opAppointmentApi.fetchAppointmentDetails(id);
        if (!res.success || !res.data) {
          setError(res.error || 'Appointment details could not be found.');
        } else {
          setAppointment(res.data);
        }
      } catch (err: any) {
        setError(err.message || 'Unable to connect to the server.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDetails();
  }, [id]);

  // If mock service demo '2'
  if (id === '2') {
    return (
      <div className="flex flex-col h-full bg-slate-50 min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary pt-4 pb-20 px-4 text-white rounded-b-3xl">
          <div className="flex items-center gap-3 max-w-md mx-auto">
            <button onClick={() => navigate(-1)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">Booking Details</h1>
          </div>
        </div>

        <div className="px-4 -mt-14 flex-1 pb-8">
          <div className="max-w-md mx-auto space-y-4">
            <div className="bg-white p-5 rounded-2xl shadow-soft border border-slate-100 flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 bg-orange-50 text-orange-500">
                <Activity className="w-7 h-7" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-lg">Home Sample Collection</h2>
                <p className="text-sm text-slate-500 font-medium">Blood Test - Complete</p>
                <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100">
                  Scheduled
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-soft border border-slate-100 space-y-5">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-primary">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Date</p>
                  <p className="font-medium text-slate-800">18 May 2024</p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-primary">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Time</p>
                  <p className="font-medium text-slate-800">8:00 AM</p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-primary">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Location</p>
                  <p className="font-medium text-slate-800">Home Visit</p>
                </div>
              </div>
            </div>

            <div className="pt-4 pb-2">
              <button
                onClick={() => navigate('/bookings')}
                className="w-full bg-primary text-white font-semibold py-4 rounded-full shadow-lg shadow-primary/30 hover:bg-blue-700 transition-colors"
              >
                Back to Bookings
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isConfirmed = appointment?.status === 'WAITING' || appointment?.status === 'Confirmed';
  const isCompleted = appointment?.status === 'COMPLETED';
  const isCancelled = appointment?.status === 'CANCELLED';

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary pt-4 pb-20 px-4 text-white rounded-b-3xl shadow-sm">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
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
              <p className="text-sm text-slate-500 font-medium">Loading appointment details...</p>
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

          {/* Appointment Loaded */}
          {appointment && !isLoading && (
            <>
              {/* Doctor Profile Card */}
              <div className="bg-white p-5 rounded-2xl shadow-soft border border-slate-100 flex items-start gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                  {appointment.doctorAvatar ? (
                    <img src={appointment.doctorAvatar} alt={appointment.doctorName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-50 text-primary">
                      <Stethoscope className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-bold text-slate-800 text-lg">Dr. {appointment.doctorName.replace(/^Dr\.\s*/i, '')}</h2>
                      <p className="text-sm text-slate-500 font-medium">
                        {appointment.doctorDesignation || appointment.departmentName || 'OP Specialist'}
                      </p>
                    </div>
                    <span className={cn(
                      "px-2.5 py-1 rounded-md text-[10px] font-semibold border",
                      isConfirmed ? "bg-green-50 text-green-700 border-green-200" :
                      isCompleted ? "bg-blue-50 text-blue-700 border-blue-200" :
                      isCancelled ? "bg-red-50 text-red-700 border-red-200" :
                      "bg-amber-50 text-amber-700 border-amber-200"
                    )}>
                      {isConfirmed ? 'Confirmed' : isCompleted ? 'Completed' : isCancelled ? 'Cancelled' : appointment.status}
                    </span>
                  </div>

                  {appointment.diseaseName && (
                    <div className="mt-2">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
                        {appointment.diseaseName}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Booking Info Card */}
              <div className="bg-white p-5 rounded-2xl shadow-soft border border-slate-100 space-y-5">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-primary">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Date</p>
                    <p className="font-semibold text-slate-800">{appointment.date}</p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-primary">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Time Slot</p>
                    <p className="font-semibold text-slate-800">{appointment.timeSlot}</p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-primary">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Hospital</p>
                    <p className="font-semibold text-slate-800">{appointment.hospitalName}</p>
                    {appointment.hospitalAddress && (
                      <p className="text-xs text-slate-500 mt-0.5">{appointment.hospitalAddress}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-primary">
                    <UserSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Consultation Type</p>
                    <p className="font-semibold text-slate-800">In-Hospital Visit ({appointment.opType || 'Normal'} OP)</p>
                    {appointment.reason && (
                      <p className="text-xs text-slate-500 mt-0.5">Reason: {appointment.reason}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-primary">
                    <IndianRupee className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Consultation Fee</p>
                    <p className="font-bold text-slate-800 text-base">₹{appointment.fee}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Booking Reference:</span>
                  <span className="font-mono font-bold text-slate-700">{appointment.id}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 pb-2 space-y-3">
                <button
                  onClick={() => navigate('/bookings')}
                  className="w-full bg-primary text-white font-semibold py-4 rounded-full shadow-lg shadow-primary/30 hover:bg-blue-700 transition-colors"
                >
                  Back to My Bookings
                </button>
                <p className="text-center text-xs text-slate-400 font-medium">
                  Real database appointment record • Stored securely
                </p>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default BookingDetails;
