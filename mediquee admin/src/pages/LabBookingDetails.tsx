import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, Building2, User, Activity, FileText, FlaskConical, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';
import { labService } from '../services/labService';
import StatusBadge from '../components/ui/StatusBadge';

const LabBookingDetails: React.FC = () => {
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
      const res = await labService.getLabBookingById(id, token);
      if (res.success) {
        setBooking(res.data);
      } else {
        setError(res.message || 'Failed to load lab booking');
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
      const res = await labService.updateLabBookingStatus(id, newStatus, token);
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

  if (loading) return <div className="p-6">Loading lab order details...</div>;
  if (error || !booking) return <div className="p-6 text-red-500">{error || 'Booking not found'}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/admin/services/lab-tests')}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Lab Order #{booking.id.substring(0, 8).toUpperCase()}
            </h2>
            <StatusBadge status={booking.status} />
          </div>
          <p className="text-sm text-slate-500">
            Booked on {new Date(booking.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tests List */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FlaskConical className="text-purple-600" size={20} />
              Ordered Tests
            </h3>
            
            <div className="space-y-4">
              {booking.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center p-4 border border-slate-100 rounded-lg bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-900">{item.labTest?.platformTest?.name || 'Unknown Test'}</p>
                    <p className="text-sm text-slate-500">{item.labTest?.platformTest?.category || 'Diagnostic'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900">₹{item.price}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
              <p className="font-bold text-slate-900">Total Amount</p>
              <p className="font-bold text-lg text-slate-900">₹{booking.totalAmount}</p>
            </div>
          </div>

          {/* People involved */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Patient Details</h3>
              <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
                <User size={20} />
              </div>
            </div>
            {booking.patient ? (
              <div className="space-y-3">
                <p className="font-medium text-slate-900">{booking.patient.name}</p>
                <p className="text-sm text-slate-600">{booking.patient.phone || 'No phone'}</p>
                <p className="text-sm text-slate-600">{booking.patient.gender} • {booking.patient.dob || 'Age unknown'}</p>
                <button 
                  onClick={() => navigate(`/admin/patients/${booking.patient.id}`)}
                  className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                >
                  View Patient Profile
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">Patient information unavailable</p>
              </div>
            )}
          </div>
          
        </div>

        {/* Sidebar Info Column */}
        <div className="space-y-6">
          
          {/* Actions */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Update Status</h3>
            <div className="space-y-2">
              <button 
                onClick={() => handleStatusUpdate('ASSIGNED')}
                disabled={updating || booking.status !== 'REQUESTED'}
                className="w-full text-left px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
              >
                1. Assign to Lab
              </button>
              <button 
                onClick={() => handleStatusUpdate('SAMPLE_COLLECTED')}
                disabled={updating || !['REQUESTED', 'ASSIGNED'].includes(booking.status)}
                className="w-full text-left px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
              >
                2. Sample Collected
              </button>
              <button 
                onClick={() => handleStatusUpdate('IN_LAB_PROCESSING')}
                disabled={updating || !['SAMPLE_COLLECTED', 'ASSIGNED'].includes(booking.status)}
                className="w-full text-left px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
              >
                3. In Lab Processing
              </button>
              <button 
                onClick={() => handleStatusUpdate('REPORT_READY')}
                disabled={updating || booking.status === 'REPORT_READY' || booking.status === 'CANCELLED'}
                className="w-full flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
              >
                <CheckCircle size={16} />
                4. Complete (Report Ready)
              </button>
              <button 
                onClick={() => handleStatusUpdate('CANCELLED')}
                disabled={updating || booking.status === 'REPORT_READY' || booking.status === 'CANCELLED'}
                className="w-full flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition-colors disabled:opacity-50 mt-4 text-sm font-medium"
              >
                <XCircle size={16} />
                Cancel Order
              </button>
            </div>
          </div>

          {/* Logistics */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Logistics</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{booking.bookingType.replace('_', ' ')}</p>
                  <p className="text-sm text-slate-500">Service Type</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 pt-4 border-t border-slate-100">
                <div className="p-2 bg-slate-50 text-slate-600 rounded-lg shrink-0">
                  <Building2 size={20} />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{booking.hospital?.name || 'MediQuee Hub'}</p>
                  <p className="text-sm text-slate-500">{booking.hospital?.city || 'HQ'}, {booking.hospital?.addressLine1}</p>
                  {booking.hospital && (
                    <button 
                      onClick={() => navigate(`/admin/hospitals/${booking.hospital.id}`)}
                      className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                    >
                      View Lab/Hospital
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 pt-4 border-t border-slate-100">
                <div className="p-2 bg-slate-50 text-slate-600 rounded-lg shrink-0">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{new Date(booking.date).toLocaleDateString()}</p>
                  <p className="text-sm text-slate-500">Scheduled Date</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LabBookingDetails;
