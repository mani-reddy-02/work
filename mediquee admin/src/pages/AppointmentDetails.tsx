import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, Building2, User, Stethoscope, Activity, CreditCard, CheckCircle, XCircle } from 'lucide-react';
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
      const res = await appointmentService.getAppointmentById(id, token);
      if (res.success) {
        setAppointment(res.data);
      } else {
        setError(res.message || 'Failed to load appointment');
      }
    } catch (err) {
      setError('An error occurred while loading');
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

  if (loading) return <div className="p-6">Loading appointment details...</div>;
  if (error || !appointment) return <div className="p-6 text-red-500">{error || 'Appointment not found'}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/admin/appointments')}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Appointment #{appointment.id.substring(0, 8).toUpperCase()}
            </h2>
            <StatusBadge status={appointment.status} />
          </div>
          <p className="text-sm text-slate-500">
            Booked on {new Date(appointment.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Schedule Info */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Schedule Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Date</p>
                  <p className="text-sm text-slate-500">{new Date(appointment.appointmentDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Time</p>
                  <p className="text-sm text-slate-500">{appointment.timeSlot || appointment.slotTime || 'Not specified'}</p>
                </div>
              </div>
            </div>
            {appointment.reason && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-sm font-medium text-slate-900">Reason for Visit</p>
                <p className="text-sm text-slate-600 mt-1">{appointment.reason}</p>
              </div>
            )}
          </div>

          {/* People involved */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Patient</h3>
                <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
                  <User size={20} />
                </div>
              </div>
              {appointment.patient ? (
                <div className="space-y-3">
                  <p className="font-medium text-slate-900">{appointment.patient.name}</p>
                  <p className="text-sm text-slate-600">{appointment.patient.phone || 'No phone'}</p>
                  <p className="text-sm text-slate-600">{appointment.patient.gender} • {appointment.patient.dob || 'Age unknown'}</p>
                  <button 
                    onClick={() => navigate(`/admin/patients/${appointment.patient.id}`)}
                    className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                  >
                    View Patient Profile
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="font-medium text-slate-900">{appointment.patientName}</p>
                  <p className="text-sm text-slate-600">{appointment.patientPhone}</p>
                  <p className="text-sm text-slate-600">{appointment.patientGender} • {appointment.patientAge} yrs</p>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">Guest Booking</span>
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Doctor</h3>
                <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
                  <Stethoscope size={20} />
                </div>
              </div>
              <div className="space-y-3">
                <p className="font-medium text-slate-900">Dr. {appointment.doctor?.name || 'Unknown'}</p>
                <p className="text-sm text-slate-600">{appointment.doctor?.specialization || 'General'}</p>
                <p className="text-sm text-slate-600">{appointment.doctor?.experienceYears || 0} years experience</p>
                {appointment.doctor && (
                  <button 
                    onClick={() => navigate(`/admin/doctors/${appointment.doctor.id}`)}
                    className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                  >
                    View Doctor Profile
                  </button>
                )}
              </div>
            </div>
          </div>
          
        </div>

        {/* Sidebar Info Column */}
        <div className="space-y-6">
          
          {/* Actions */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => handleStatusUpdate('CONFIRMED')}
                disabled={updating || appointment.status === 'CONFIRMED' || appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED'}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <CheckCircle size={18} />
                Confirm
              </button>
              <button 
                onClick={() => handleStatusUpdate('COMPLETED')}
                disabled={updating || appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED'}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <CheckCircle size={18} />
                Complete
              </button>
              <button 
                onClick={() => handleStatusUpdate('NO_SHOW')}
                disabled={updating || appointment.status === 'NO_SHOW' || appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED'}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <XCircle size={18} />
                No-Show
              </button>
              <button 
                onClick={() => handleStatusUpdate('CANCELLED')}
                disabled={updating || appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED'}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <XCircle size={18} />
                Cancel
              </button>
            </div>
          </div>

          {/* Hospital & Dept Info */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Location</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-50 text-slate-600 rounded-lg shrink-0">
                  <Building2 size={20} />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{appointment.hospital?.name}</p>
                  <p className="text-sm text-slate-500">{appointment.hospital?.city}, {appointment.hospital?.addressLine1}</p>
                  {appointment.hospital && (
                    <button 
                      onClick={() => navigate(`/admin/hospitals/${appointment.hospital.id}`)}
                      className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                    >
                      View Hospital
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3 pt-4 border-t border-slate-100">
                <div className="p-2 bg-slate-50 text-slate-600 rounded-lg shrink-0">
                  <Activity size={20} />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{appointment.department?.name || 'General'}</p>
                  <p className="text-sm text-slate-500">Department</p>
                  {appointment.department && (
                    <button 
                      onClick={() => navigate(`/admin/departments/${appointment.department.id}`)}
                      className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                    >
                      View Department
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Payment</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Consultation Fee</span>
                <span className="font-medium text-slate-900">₹{appointment.fee}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Hospital Share ({appointment.hospitalSharePercentage || 80}%)</span>
                <span className="font-medium text-emerald-600">₹{appointment.hospitalAmount || (appointment.fee * 0.8)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Platform Share ({appointment.mediqueeCommissionPercentage || 20}%)</span>
                <span className="font-medium text-blue-600">₹{appointment.mediqueeAmount || (appointment.fee * 0.2)}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AppointmentDetails;
