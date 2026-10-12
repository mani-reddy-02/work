import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, User, FileText, FlaskConical, MapPin, CheckCircle, Home, Clock } from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';
import { labService } from '../services/labService';
import StatusBadge from '../components/ui/StatusBadge';

const HomeSampleDetails: React.FC = () => {
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
      if (res.success && res.data) {
        setBooking(res.data);
      } else {
        setError(res.message || 'Failed to load booking');
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
    if (!token || !id || !newStatus || newStatus === booking?.status) return;
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

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium text-sm">Loading home sample booking...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="p-12 text-center bg-white rounded-xl shadow-sm border border-slate-200 max-w-lg mx-auto mt-8">
        <h3 className="text-xl font-bold text-slate-900 mb-2">Booking Not Found</h3>
        <p className="text-slate-500 mb-6 text-sm">{error || 'The selected booking could not be found.'}</p>
        <button
          onClick={() => navigate('/admin/services/home-sample-collection')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Back to Home Sample Collection
        </button>
      </div>
    );
  }

  const totalBookingAmount = Number(booking.totalAmount) || 0;
  const labShareRate = Number(
    booking.financialBreakdown?.labShareRate 
    ?? booking.hospital?.hospitalShare 
    ?? booking.hospitalSharePercentage 
    ?? 20
  );
  const adminCommissionRate = Number(
    booking.financialBreakdown?.adminCommissionRate 
    ?? (100 - labShareRate)
  );
  const adminCommission = Number(
    booking.financialBreakdown?.adminCommission 
    ?? booking.mediqueeAmount 
    ?? Math.round(((totalBookingAmount * adminCommissionRate) / 100) * 100) / 100
  );
  const labShare = Number(
    booking.financialBreakdown?.labShare 
    ?? booking.hospitalAmount 
    ?? Math.round(((totalBookingAmount * labShareRate) / 100) * 100) / 100
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/services/home-sample-collection')}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
              Admin / Home Sample / Booking Details
            </p>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Home Sample Booking Details
              </h2>
              <StatusBadge status={booking.status} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Summary */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="text-blue-600" size={20} /> Booking Summary
              </h3>
              {!['REPORT_READY', 'COMPLETED', 'CANCELLED'].includes(booking.status) && (
                <div className="flex items-center gap-2">
                  <select
                    value={booking.status}
                    disabled={updating}
                    onChange={(e) => handleStatusUpdate(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value={booking.status} disabled>Update Status</option>
                    {booking.status === 'REQUESTED' && (
                      <>
                        <option value="ASSIGNED">Collector Assigned</option>
                        <option value="SAMPLE_COLLECTED">Sample Collected</option>
                        <option value="CANCELLED">Cancel Order</option>
                      </>
                    )}
                    {booking.status === 'ASSIGNED' && (
                      <>
                        <option value="SAMPLE_COLLECTED">Sample Collected</option>
                        <option value="CANCELLED">Cancel Order</option>
                      </>
                    )}
                    {booking.status === 'SAMPLE_COLLECTED' && (
                      <>
                        <option value="IN_LAB_PROCESSING">In Lab Processing</option>
                        <option value="CANCELLED">Cancel Order</option>
                      </>
                    )}
                    {booking.status === 'IN_LAB_PROCESSING' && (
                      <>
                        <option value="REPORT_READY">Completed</option>
                        <option value="CANCELLED">Cancel Order</option>
                      </>
                    )}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-sm">
              <div>
                <p className="text-slate-500 text-xs">Booking ID</p>
                <p className="font-semibold text-slate-900 font-mono mt-0.5">
                  {booking.orderId || booking.id.substring(0, 8).toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Booking Date</p>
                <p className="font-medium text-slate-900 mt-0.5">{new Date(booking.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Booking Type</p>
                <p className="font-semibold text-slate-900 mt-0.5">{booking.bookingType?.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Current Status</p>
                <div className="mt-1">
                  <StatusBadge status={booking.status} />
                </div>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Total Amount</p>
                <p className="font-bold text-slate-900 text-base mt-0.5">₹{totalBookingAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Updated</p>
                <p className="font-medium text-slate-900 mt-0.5">{new Date(booking.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Patient Information */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <User className="text-indigo-600" size={20} /> Patient Information
            </h3>
            {booking.patient ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                <div>
                  <p className="text-slate-500 text-xs">Name</p>
                  <p className="font-medium text-slate-900 mt-0.5">{booking.patient.name}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Phone</p>
                  <p className="font-medium text-slate-900 mt-0.5">{booking.patient.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Email</p>
                  <p className="font-medium text-slate-900 mt-0.5">{booking.patient.email || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Gender</p>
                  <p className="font-medium text-slate-900 mt-0.5">{booking.patient.gender || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">DOB</p>
                  <p className="font-medium text-slate-900 mt-0.5">{booking.patient.dob || '—'}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Patient information unavailable</p>
            )}
          </div>

          {/* Test Information & Financial Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FlaskConical className="text-purple-600" size={20} /> Test Information
            </h3>
            
            <div className="space-y-4">
              {booking.items?.map((item: any) => {
                const diagId = item.labTest?.id?.substring(0, 8) || item.labTestId?.substring(0, 8) || 'N/A';
                return (
                  <div key={item.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/70">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900 text-base">
                          {item.labTest?.platformTest?.name || 'Diagnostic Test'}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Diagnostic ID: <span className="font-mono text-slate-700 font-medium">{diagId}</span>
                          {item.labTest?.platformTest?.specimenType && (
                            <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-600 font-medium">
                              {item.labTest.platformTest.specimenType}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="text-xs text-slate-500 block">Test Amount</span>
                        <span className="font-bold text-slate-900 text-base">
                          ₹{Number(item.price).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Total Summary */}
              <div className="pt-3 border-t border-slate-200 space-y-2 text-sm">
                {booking.homeCollectionFee > 0 && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Home Sample Collection Fee</span>
                    <span className="font-medium text-slate-900">
                      ₹{Number(booking.homeCollectionFee).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-slate-100 font-semibold text-slate-900">
                  <span className="text-base">Total Booking Amount</span>
                  <span className="text-lg font-bold text-slate-900">
                    ₹{totalBookingAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Dynamic Commission Breakdown */}
              <div className="mt-6 pt-5 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Commission & Revenue Breakdown
                  </h4>
                  <span className="text-xs text-slate-500">
                    Revenue Basis: <span className="font-medium text-slate-700">Net Eligible Order Value (₹{totalBookingAmount.toLocaleString()})</span>
                  </span>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700">Admin Commission</span>
                      <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded-full border border-blue-200">
                        {adminCommissionRate}%
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 text-base">
                      ₹{adminCommission.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700">Lab Share</span>
                      <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 font-semibold rounded-full border border-purple-200">
                        {labShareRate}%
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 text-base">
                      ₹{labShare.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Home Collection Details */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Home className="text-amber-600" size={20} /> Home Sample Collection
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-slate-500">Collection Address</p>
                <p className="font-medium text-slate-900 mt-0.5">{booking.collectionAddress || booking.patient?.address || '—'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div>
                  <p className="text-xs text-slate-500">Collection Date</p>
                  <p className="font-medium text-slate-900 mt-0.5">
                    {booking.collectionDate ? new Date(booking.collectionDate).toLocaleDateString() : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Time Slot</p>
                  <p className="font-medium text-slate-900 mt-0.5">{booking.collectionTimeSlot || '—'}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-500">Collector / Phlebotomist</p>
                <p className="font-medium text-slate-900 mt-0.5">
                  {booking.phlebotomistName || 'Unassigned'} {booking.phlebotomistPhone ? `(${booking.phlebotomistPhone})` : ''}
                </p>
              </div>
              {booking.sampleCollectedAt && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-500">Collected At</p>
                  <p className="font-medium text-slate-900 mt-0.5">{new Date(booking.sampleCollectedAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Laboratory Information */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="text-blue-600" size={20} /> Laboratory Information
            </h3>
            <div className="flex items-start gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                <Building2 size={24} />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-slate-900 text-base">
                  {booking.hospital?.name || '—'}
                </p>
                <p className="text-sm text-slate-500">
                  {[booking.hospital?.addressLine1, booking.hospital?.city].filter(Boolean).join(', ') || '—'}
                </p>
                {booking.hospital?.contactPhone && (
                  <p className="text-sm text-slate-600 pt-1">
                    Contact: <span className="font-medium text-slate-800">{booking.hospital.contactPhone}</span>
                  </p>
                )}
                {booking.hospital?.contactEmail && (
                  <p className="text-sm text-slate-600">
                    Email: <span className="font-medium text-slate-800">{booking.hospital.contactEmail}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="text-slate-500" size={20} /> Order Timeline
            </h3>
            <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-2 before:w-0.5 before:bg-slate-200 pl-6">
              <div className="relative">
                <div className="absolute -left-6 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-sm"></div>
                <p className="text-sm font-semibold text-slate-900">Booking Placed</p>
                <p className="text-xs text-slate-500">{new Date(booking.createdAt).toLocaleString()}</p>
              </div>
              {booking.sampleCollectedAt && (
                <div className="relative">
                  <div className="absolute -left-6 w-4 h-4 rounded-full bg-purple-600 border-4 border-white shadow-sm"></div>
                  <p className="text-sm font-semibold text-slate-900">Sample Collected</p>
                  <p className="text-xs text-slate-500">{new Date(booking.sampleCollectedAt).toLocaleString()}</p>
                </div>
              )}
              <div className="relative">
                <div className="absolute -left-6 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white shadow-sm"></div>
                <p className="text-sm font-semibold text-slate-900">Last Status: {booking.status?.replace('_', ' ')}</p>
                <p className="text-xs text-slate-500">{new Date(booking.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeSampleDetails;
