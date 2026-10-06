import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, Building2, User, Stethoscope, Activity, CheckCircle, XCircle, FileText, Network, CreditCard } from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';
import { appointmentService } from '../services/appointmentService';
import StatusBadge from '../components/ui/StatusBadge';

const AppointmentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAdminAuth();
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointment = async () => {
    if (!token || !id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await appointmentService.getAppointmentById(id, token);
      if (res.success && res.data) {
        setAppointment(res.data);
      } else {
        setError(res.message || 'The selected booking could not be found.');
      }
    } catch (err) {
      setError('The selected booking could not be found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointment();
  }, [id, token]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!token || !id) return;
    try {
      setUpdating(true);
      const res = await appointmentService.updateAppointmentStatus(id, newStatus, token);
      if (res.success) {
        // Refresh appointment
        await fetchAppointment();
      } else {
        alert(res.message || 'Failed to update status');
      }
    } catch (err) {
      alert('Error updating status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">Loading OP booking details...</p>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="p-12 text-center bg-white rounded-xl shadow-sm border border-slate-200 min-h-[400px] flex flex-col items-center justify-center">
        <XCircle size={48} className="text-red-400 mb-4" />
        <h3 className="text-xl font-bold text-slate-900 mb-2">OP Booking Not Found</h3>
        <p className="text-slate-500 mb-6">{error || 'The selected booking could not be found.'}</p>
        <button 
          onClick={() => navigate('/admin/op-bookings')}
          className="px-6 py-2.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
        >
          Back to OP Bookings
        </button>
      </div>
    );
  }

  const isCompleted = appointment.status === 'COMPLETED';
  const isCancelled = appointment.status === 'CANCELLED';
  const isNoShow = appointment.status === 'NO_SHOW';
  
  const bId = appointment.id.substring(0, 8).toUpperCase();
  const createdDate = new Date(appointment.createdAt).toLocaleDateString();
  const createdTime = new Date(appointment.createdAt).toLocaleTimeString();
  const apptDate = new Date(appointment.appointmentDate).toLocaleDateString();
  const apptTime = appointment.timeSlot || appointment.slotTime || 'Not specified';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="text-sm text-slate-500 font-medium flex items-center gap-2">
           <span>Admin</span>
           <span className="text-slate-300">/</span>
           <span className="cursor-pointer hover:text-slate-700" onClick={() => navigate('/admin/op-bookings')}>OP Bookings</span>
           <span className="text-slate-300">/</span>
           <span className="text-slate-800">Booking Details</span>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <button 
            onClick={() => navigate('/admin/op-bookings')}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                OP Booking #{bId}
              </h2>
              <StatusBadge status={appointment.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Booking Summary */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
         <div>
            <p className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Booking ID</p>
            <p className="font-semibold text-slate-900">{bId}</p>
         </div>
         <div>
            <p className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Appt Date</p>
            <p className="font-semibold text-slate-900">{apptDate}</p>
         </div>
         <div>
            <p className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Appt Time</p>
            <p className="font-semibold text-slate-900">{apptTime}</p>
         </div>
         <div>
            <p className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Status</p>
            <div className="mt-0.5"><StatusBadge status={appointment.status} /></div>
         </div>
         <div>
            <p className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Created</p>
            <p className="font-medium text-slate-900 text-sm">{createdDate} <span className="text-slate-500 text-xs">{createdTime}</span></p>
         </div>
         <div>
            <p className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Last Updated</p>
            <p className="font-medium text-slate-900 text-sm">{new Date(appointment.updatedAt).toLocaleDateString()} <span className="text-slate-500 text-xs">{new Date(appointment.updatedAt).toLocaleTimeString()}</span></p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Patient and Doctor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center gap-3">
                <User size={18} className="text-slate-500" />
                <h3 className="font-bold text-slate-900">Patient Information</h3>
              </div>
              <div className="p-4 space-y-4">
                 <div>
                    <p className="text-xs text-slate-500 font-medium">Patient Name</p>
                    <p className="font-medium text-slate-900">{appointment.patientName || appointment.patient?.name || '—'}</p>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-slate-500 font-medium">Age</p>
                        <p className="font-medium text-slate-900">{appointment.patientAge ? `${appointment.patientAge} yrs` : '—'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium">Gender</p>
                        <p className="font-medium text-slate-900">{appointment.patientGender || appointment.patient?.gender || '—'}</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-slate-500 font-medium">Phone</p>
                        <p className="font-medium text-slate-900">{appointment.patientPhone || appointment.patient?.phone || '—'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium">Email</p>
                        <p className="font-medium text-slate-900 truncate">{appointment.patient?.email || '—'}</p>
                    </div>
                 </div>
                 <div>
                    <p className="text-xs text-slate-500 font-medium">Place / Location</p>
                    <p className="font-medium text-slate-900">{appointment.patient?.address || '—'}</p>
                 </div>
                 {appointment.patient && (
                   <button onClick={() => navigate(`/admin/patients/${appointment.patient.id}`)} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                     View Complete Profile &rarr;
                   </button>
                 )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center gap-3">
                <Stethoscope size={18} className="text-slate-500" />
                <h3 className="font-bold text-slate-900">Doctor Information</h3>
              </div>
              <div className="p-4 space-y-4">
                 <div>
                    <p className="text-xs text-slate-500 font-medium">Doctor Name</p>
                    <p className="font-medium text-slate-900">Dr. {appointment.doctor?.name || '—'}</p>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-slate-500 font-medium">Specialization</p>
                        <p className="font-medium text-slate-900 truncate" title={appointment.doctor?.specialization}>{appointment.doctor?.specialization || '—'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium">Experience</p>
                        <p className="font-medium text-slate-900">{appointment.doctor?.experienceYears ? `${appointment.doctor.experienceYears} Years` : '—'}</p>
                    </div>
                 </div>
                 <div>
                    <p className="text-xs text-slate-500 font-medium">Department</p>
                    <p className="font-medium text-slate-900 flex items-center gap-1">
                      <Network size={14} className="text-slate-400" /> {appointment.department?.name || '—'}
                    </p>
                 </div>
                 {appointment.doctor?.licenseNumber && (
                    <div>
                        <p className="text-xs text-slate-500 font-medium">License Number</p>
                        <p className="font-medium text-slate-900">{appointment.doctor.licenseNumber}</p>
                    </div>
                 )}
                 {appointment.doctorId && (
                   <button onClick={() => navigate(`/admin/doctors/${appointment.doctorId}`)} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                     View Complete Profile &rarr;
                   </button>
                 )}
              </div>
            </div>
          </div>

          {/* Hospital & Department */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
             <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center gap-3">
                <Building2 size={18} className="text-slate-500" />
                <h3 className="font-bold text-slate-900">Hospital Information</h3>
             </div>
             <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <p className="text-xs text-slate-500 font-medium">Hospital Name</p>
                   <p className="font-medium text-slate-900 text-lg">{appointment.hospital?.name || '—'}</p>
                   {appointment.hospitalId && (
                     <button onClick={() => navigate(`/admin/hospitals/${appointment.hospitalId}`)} className="text-sm font-medium text-blue-600 hover:text-blue-800 mt-1 inline-block">
                       View Hospital Details &rarr;
                     </button>
                   )}
                </div>
                <div className="space-y-3">
                   <div>
                       <p className="text-xs text-slate-500 font-medium">Address</p>
                       <p className="font-medium text-slate-900">{appointment.hospital?.addressLine1 || '—'}</p>
                       <p className="font-medium text-slate-700">{appointment.hospital?.city ? appointment.hospital.city : ''}</p>
                   </div>
                   <div>
                       <p className="text-xs text-slate-500 font-medium">Contact Phone</p>
                       <p className="font-medium text-slate-900">{appointment.hospital?.contactPhone || '—'}</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Appointment Information */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
             <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center gap-3">
                <FileText size={18} className="text-slate-500" />
                <h3 className="font-bold text-slate-900">Appointment Information</h3>
             </div>
             <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                   <div>
                       <p className="text-xs text-slate-500 font-medium mb-1">Consultation Type</p>
                       <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-medium text-xs rounded border border-slate-200">
                         {appointment.opType || 'OP Consultation'}
                       </span>
                   </div>
                   <div>
                       <p className="text-xs text-slate-500 font-medium mb-1">Booking Fee</p>
                       <p className="font-medium text-slate-900 flex items-center gap-1">
                         <CreditCard size={14} className="text-slate-400" />
                         ₹{appointment.fee || '0.00'}
                       </p>
                   </div>
                   <div>
                       <p className="text-xs text-slate-500 font-medium mb-1">Payment Status</p>
                       <p className="font-medium text-slate-900">{appointment.paymentStatus || 'Pending'}</p>
                   </div>
                </div>
                
                <div className="space-y-4 border-t border-slate-100 pt-6">
                   <div>
                       <p className="text-xs text-slate-500 font-medium">Reason for Visit</p>
                       <p className="text-sm text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-100 mt-1 min-h-[60px]">
                         {appointment.reason || 'No specific reason provided by patient.'}
                       </p>
                   </div>
                   
                   {(appointment.notes || appointment.cancellationReason) && (
                     <div>
                         <p className="text-xs text-slate-500 font-medium">Additional Notes / Cancellation Reason</p>
                         <p className="text-sm text-slate-900 bg-amber-50 p-3 rounded-lg border border-amber-100 mt-1">
                           {appointment.cancellationReason || appointment.notes}
                         </p>
                     </div>
                   )}
                </div>
             </div>
          </div>
          
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          
          {/* Status Actions */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Manage Status</h3>
            <div className="space-y-3">
              <button 
                onClick={() => handleStatusUpdate('CONFIRMED')}
                disabled={updating || isCompleted || isCancelled || appointment.status === 'CONFIRMED'}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-blue-200"
              >
                <CheckCircle size={18} />
                Mark Confirmed
              </button>
              
              <button 
                onClick={() => handleStatusUpdate('COMPLETED')}
                disabled={updating || isCompleted || isCancelled || isNoShow}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-200"
              >
                <Activity size={18} />
                Mark Completed
              </button>
              
              <button 
                onClick={() => handleStatusUpdate('NO_SHOW')}
                disabled={updating || isCompleted || isCancelled || isNoShow}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-700 font-medium hover:bg-amber-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-amber-200"
              >
                <User size={18} />
                Mark No Show
              </button>
              
              <button 
                onClick={() => handleStatusUpdate('CANCELLED')}
                disabled={updating || isCompleted || isCancelled}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-700 font-medium hover:bg-rose-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-rose-200"
              >
                <XCircle size={18} />
                Cancel Booking
              </button>
            </div>
          </div>
          
          {/* Timeline */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Booking Timeline</h3>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200">
               
               {/* Created Event */}
               <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white bg-blue-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-1/2 -ml-3 md:ml-0"></div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-2rem)] pl-8 md:pl-0 md:pr-8 md:text-right">
                     <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-sm">Booking Created</span>
                        <span className="text-xs text-slate-500">{createdDate} at {createdTime}</span>
                     </div>
                  </div>
               </div>

               {/* Confirmed Event if applicable */}
               {(appointment.status === 'CONFIRMED' || isCompleted) && (
                 <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white bg-blue-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-1/2 -ml-3 md:ml-0"></div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-2rem)] pl-8 md:pl-0 md:group-odd:pl-8 md:text-left">
                       <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-sm">Confirmed</span>
                          <span className="text-xs text-slate-500">System / Admin</span>
                       </div>
                    </div>
                 </div>
               )}

               {/* Completed/Cancelled Event */}
               {(isCompleted || isCancelled || isNoShow) && (
                 <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 border-white text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-1/2 -ml-3 md:ml-0 ${isCompleted ? 'bg-emerald-500' : isCancelled ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-2rem)] pl-8 md:pl-0 md:pr-8 md:text-right">
                       <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-sm">{isCompleted ? 'Completed' : isCancelled ? 'Cancelled' : 'No Show'}</span>
                          <span className="text-xs text-slate-500">{new Date(appointment.updatedAt).toLocaleDateString()}</span>
                       </div>
                    </div>
                 </div>
               )}

               {/* Pending/Upcoming Event */}
               {(!isCompleted && !isCancelled && !isNoShow) && (
                 <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-slate-200 bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-1/2 -ml-3 md:ml-0"></div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-2rem)] pl-8 md:pl-0 md:group-odd:pl-8 md:text-left">
                       <div className="flex flex-col">
                          <span className="font-medium text-slate-500 text-sm">Appointment</span>
                          <span className="text-xs text-slate-400">{apptDate}</span>
                       </div>
                    </div>
                 </div>
               )}

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetails;
