import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, Building2, User, FileText, FlaskConical, MapPin, CheckCircle, XCircle } from 'lucide-react';
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
      if (res.success) setBooking(res.data);
      else setError(res.message || 'Failed to load lab booking');
    } catch (err) {
      setError('An error occurred while loading');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBooking(); }, [id, token]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!token || !id) return;
    try {
      setUpdating(true);
      const res = await labService.updateLabBookingStatus(id, newStatus, token);
      if (res.success) await fetchBooking();
      else alert(res.message || 'Failed to update status');
    } catch (err) {
      alert('Error updating status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div></div>;
  if (error || !booking) return (
    <div className="p-12 text-center bg-white rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-xl font-bold text-slate-900 mb-2">Booking Not Found</h3>
      <p className="text-slate-500 mb-4">{error || 'The selected booking could not be found.'}</p>
      <button onClick={() => navigate('/admin/services/lab-tests')} className="px-4 py-2 bg-blue-600 text-white rounded-lg">← Back</button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/services/lab-tests')} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="text-sm text-slate-500 mb-1">Admin / Lab Tests / Booking Details</p>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Lab Test Booking Details
            </h2>
            <StatusBadge status={booking.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="text-blue-600" size={20} /> Booking Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div><p className="text-slate-500">Booking ID</p><p className="font-medium text-slate-900">{booking.id}</p></div>
              <div><p className="text-slate-500">Booking Date</p><p className="font-medium text-slate-900">{new Date(booking.createdAt).toLocaleDateString()}</p></div>
              <div><p className="text-slate-500">Updated</p><p className="font-medium text-slate-900">{new Date(booking.updatedAt).toLocaleDateString()}</p></div>
              <div><p className="text-slate-500">Booking Type</p><p className="font-medium text-slate-900">{booking.bookingType?.replace('_', ' ')}</p></div>
              <div><p className="text-slate-500">Total Amount</p><p className="font-medium text-slate-900">₹{booking.totalAmount}</p></div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <User className="text-indigo-600" size={20} /> Patient Information
            </h3>
            {booking.patient ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div><p className="text-slate-500">Name</p><p className="font-medium text-slate-900">{booking.patient.name}</p></div>
                <div><p className="text-slate-500">Phone</p><p className="font-medium text-slate-900">{booking.patient.phone || '—'}</p></div>
                <div><p className="text-slate-500">Email</p><p className="font-medium text-slate-900">{booking.patient.email || '—'}</p></div>
                <div><p className="text-slate-500">Gender</p><p className="font-medium text-slate-900">{booking.patient.gender || '—'}</p></div>
                <div><p className="text-slate-500">DOB</p><p className="font-medium text-slate-900">{booking.patient.dob || '—'}</p></div>
              </div>
            ) : <p className="text-sm text-slate-500">Patient information unavailable</p>}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FlaskConical className="text-purple-600" size={20} /> Test Information
            </h3>
            <div className="space-y-4">
              {booking.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center p-4 border border-slate-100 rounded-lg bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-900">{item.labTest?.platformTest?.name || 'Unknown Test'}</p>
                    <p className="text-sm text-slate-500">{item.labTest?.platformTest?.category || 'Diagnostic'} • ID: {item.labTestId.substring(0,8)}</p>
                  </div>
                  <p className="font-medium text-slate-900">₹{item.price}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Laboratory Information</h3>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-slate-50 text-slate-600 rounded-lg shrink-0"><Building2 size={20} /></div>
              <div>
                <p className="font-medium text-slate-900">{booking.hospital?.name || '—'}</p>
                <p className="text-sm text-slate-500">{booking.hospital?.city || '—'}, {booking.hospital?.addressLine1 || '—'}</p>
                <p className="text-sm text-slate-500 mt-1">Contact: {booking.hospital?.contactPhone || '—'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Test Booking Status</h3>
            <div className="space-y-2">
              <button onClick={() => handleStatusUpdate('ASSIGNED')} disabled={updating || booking.status !== 'REQUESTED'} className="w-full text-left px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg disabled:opacity-50 text-sm font-medium">1. Assign to Lab</button>
              <button onClick={() => handleStatusUpdate('SAMPLE_COLLECTED')} disabled={updating || !['REQUESTED', 'ASSIGNED'].includes(booking.status)} className="w-full text-left px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg disabled:opacity-50 text-sm font-medium">2. Sample Collected</button>
              <button onClick={() => handleStatusUpdate('IN_LAB_PROCESSING')} disabled={updating || !['SAMPLE_COLLECTED', 'ASSIGNED'].includes(booking.status)} className="w-full text-left px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg disabled:opacity-50 text-sm font-medium">3. In Processing</button>
              <button onClick={() => handleStatusUpdate('REPORT_READY')} disabled={updating || booking.status === 'REPORT_READY' || booking.status === 'CANCELLED'} className="w-full flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg disabled:opacity-50 text-sm font-medium"><CheckCircle size={16} />4. Completed</button>
              <button onClick={() => handleStatusUpdate('CANCELLED')} disabled={updating || booking.status === 'REPORT_READY' || booking.status === 'CANCELLED'} className="w-full flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg disabled:opacity-50 mt-4 text-sm font-medium"><XCircle size={16} />Cancel</button>
            </div>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
             <h3 className="text-lg font-bold text-slate-900 mb-4">Timeline</h3>
             <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-2 before:w-0.5 before:bg-slate-200 pl-6">
                <div className="relative">
                  <div className="absolute -left-6 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-sm"></div>
                  <p className="text-sm font-medium text-slate-900">Booking Created</p>
                  <p className="text-xs text-slate-500">{new Date(booking.createdAt).toLocaleString()}</p>
                </div>
                {['ASSIGNED', 'SAMPLE_COLLECTED', 'IN_LAB_PROCESSING', 'REPORT_READY', 'CANCELLED'].includes(booking.status) && (
                  <div className="relative">
                    <div className="absolute -left-6 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-sm"></div>
                    <p className="text-sm font-medium text-slate-900">Current Status: {booking.status}</p>
                    <p className="text-xs text-slate-500">{new Date(booking.updatedAt).toLocaleString()}</p>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabBookingDetails;
