import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, Building2, User, Activity, MapPin, CheckCircle, XCircle, HeartPulse, Stethoscope } from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';
import { nursingService } from '../services/nursingService';
import StatusBadge from '../components/ui/StatusBadge';

const HomeNursingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAdminAuth();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBooking = async () => {
    if (!token || !id) return;
    try {
      setLoading(true);
      const res = await nursingService.getHomeNursingBookingById(id, token);
      if (res.success) {
        setBooking(res.data);
      } else {
        setError(res.message || 'Failed to load home nursing request');
      }
    } catch (err) {
      setError('An error occurred while loading');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id, token]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!token || !id) return;
    try {
      setUpdating(true);
      const res = await nursingService.updateHomeNursingBookingStatus(id, newStatus, token);
      if (res.success) {
        await fetchBooking();
      } else {
        alert(res.message || 'Failed to update status');
      }
    } catch (err) {
      alert('Error updating status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-6">Loading request details...</div>;
  if (error || !booking) return <div className="p-6 text-red-500">{error || 'Booking not found'}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/admin/services/home-nursing')}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Nursing Request #{booking.bookingNumber || booking.id.substring(0, 8).toUpperCase()}
            </h2>
            <StatusBadge status={booking.status} />
          </div>
          <p className="text-sm text-slate-500">
            Created on {new Date(booking.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Service Details */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <HeartPulse className="text-rose-600" size={20} />
              Service Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Service Required</p>
                <p className="font-medium text-slate-900">{booking.service?.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Duration Needed</p>
                <p className="font-medium text-slate-900">{booking.duration || 'Not specified'}</p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-sm font-medium text-slate-500 mb-1">Additional Notes</p>
              <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                {booking.notes || 'No additional notes provided by the patient.'}
              </p>
            </div>
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
              
              <div className="space-y-3">
                <p className="font-medium text-slate-900">{booking.patientName}</p>
                <p className="text-sm text-slate-600">{booking.patientPhone}</p>
                <p className="text-sm text-slate-600">{booking.patientGender || 'Unknown'} • {booking.patientAge ? `${booking.patientAge} years` : 'Age unknown'}</p>
                
                {booking.user && (
                  <button 
                    onClick={() => navigate(`/admin/patients/${booking.user.id}`)}
                    className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                  >
                    View User Account
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Assigned Provider</h3>
                <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
                  <Stethoscope size={20} />
                </div>
              </div>
              
              {booking.nurse ? (
                <div className="space-y-3">
                  <p className="font-medium text-slate-900">{booking.nurse.name}</p>
                  <p className="text-sm text-slate-600">{booking.nurse.phone}</p>
                  <p className="text-sm text-slate-600">{booking.nurse.specialization || 'Nurse'}</p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                  <p className="text-sm font-medium text-slate-600 mb-2">No provider assigned yet</p>
                  <button className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors">
                    Assign Provider
                  </button>
                </div>
              )}
            </div>
          </div>
          
        </div>

        {/* Sidebar Info Column */}
        <div className="space-y-6">
          
          {/* Actions */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Status Workflow</h3>
            <div className="space-y-2">
              <button 
                onClick={() => handleStatusUpdate('ASSIGNED')}
                disabled={updating || booking.status !== 'CONFIRMED'}
                className="w-full text-left px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
              >
                1. Provider Assigned
              </button>
              <button 
                onClick={() => handleStatusUpdate('IN_PROGRESS')}
                disabled={updating || !['CONFIRMED', 'ASSIGNED'].includes(booking.status)}
                className="w-full text-left px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
              >
                2. In Progress (Service Started)
              </button>
              <button 
                onClick={() => handleStatusUpdate('COMPLETED')}
                disabled={updating || booking.status === 'COMPLETED' || booking.status === 'CANCELLED'}
                className="w-full flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
              >
                <CheckCircle size={16} />
                3. Service Completed
              </button>
              <button 
                onClick={() => handleStatusUpdate('CANCELLED')}
                disabled={updating || booking.status === 'COMPLETED' || booking.status === 'CANCELLED'}
                className="w-full flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition-colors disabled:opacity-50 mt-4 text-sm font-medium"
              >
                <XCircle size={16} />
                Cancel Request
              </button>
            </div>
          </div>

          {/* Location & Time */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Location & Time</h3>
            <div className="space-y-4">
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-50 text-slate-600 rounded-lg shrink-0">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{new Date(booking.serviceDate).toLocaleDateString()}</p>
                  <p className="text-sm font-medium text-slate-700 mt-0.5">{booking.timeSlot}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Requested Schedule</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 pt-4 border-t border-slate-100">
                <div className="p-2 bg-slate-50 text-slate-600 rounded-lg shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Service Address</p>
                  <p className="text-sm text-slate-700 mt-1">{booking.address}</p>
                  {booking.city && <p className="text-sm text-slate-600">{booking.city}, {booking.pincode}</p>}
                </div>
              </div>

              <div className="flex items-start gap-3 pt-4 border-t border-slate-100">
                <div className="p-2 bg-slate-50 text-slate-600 rounded-lg shrink-0">
                  <Building2 size={20} />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{booking.hospital?.name}</p>
                  <p className="text-xs text-slate-500">Service Provider / Agency</p>
                  {booking.hospital && (
                    <button 
                      onClick={() => navigate(`/admin/hospitals/${booking.hospital.id}`)}
                      className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                    >
                      View Agency
                    </button>
                  )}
                </div>
              </div>
              
            </div>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Payment Status</h3>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${booking.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {booking.paymentStatus}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HomeNursingDetails;
