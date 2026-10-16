import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Clock, 
  Hospital, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Users, 
  FileText, 
  CheckCircle2, 
  Briefcase,
  AlertCircle,
  Activity
} from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import StatusBadge from '../components/ui/StatusBadge';

const ReceptionistDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAdminAuth();

  const [receptionist, setReceptionist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReceptionist = async () => {
      if (!token || !id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await userService.getUserById(token, id);
        if (res.success && res.data) {
          setReceptionist(res.data);
        } else {
          setError(res.message || 'Receptionist not found');
        }
      } catch (err) {
        console.error('Failed to fetch receptionist details:', err);
        setError('Failed to load receptionist details from server');
      } finally {
        setLoading(false);
      }
    };
    fetchReceptionist();
  }, [token, id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-xl border border-slate-200">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-600 font-medium text-sm">Loading receptionist details...</p>
      </div>
    );
  }

  if (error || !receptionist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-xl border border-slate-200 p-8">
        <div className="w-12 h-12 rounded-full bg-violet-50 text-violet-500 flex items-center justify-center mb-4">
          <AlertCircle size={24} />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{error || 'Receptionist not found'}</h3>
        <p className="text-sm text-slate-500 mb-6 text-center max-w-md">
          The requested receptionist record could not be loaded from the database.
        </p>
        <button
          onClick={() => navigate('/admin/receptionists')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Receptionists
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/receptionists')}
          className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"
          title="Back to Receptionists List"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900">{receptionist.name}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
              Receptionist
            </span>
            <StatusBadge status={receptionist.active ? 'ACTIVE' : 'INACTIVE'} />
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Registered on {new Date(receptionist.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Personal & Account Information */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-semibold border-b border-slate-100 pb-3">
            <User size={18} className="text-blue-600" />
            <span>Profile Information</span>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider block">Full Name</span>
              <span className="font-medium text-slate-800">{receptionist.name}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider block">Email Address</span>
              <div className="flex items-center gap-2 mt-0.5 text-slate-800">
                <Mail size={14} className="text-slate-400" />
                <span>{receptionist.email || 'No email provided'}</span>
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider block">Phone Number</span>
              <div className="flex items-center gap-2 mt-0.5 text-slate-800">
                <Phone size={14} className="text-slate-400" />
                <span>{receptionist.phone || 'N/A'}</span>
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider block">Gender</span>
              <span className="font-medium text-slate-800">{receptionist.gender || 'Not specified'}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider block">Address</span>
              <div className="flex items-start gap-2 mt-0.5 text-slate-800">
                <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <span>{receptionist.address || 'No address specified'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Operational & Role Details */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-semibold border-b border-slate-100 pb-3">
            <Briefcase size={18} className="text-blue-600" />
            <span>Front Desk & Operational Role</span>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider block">Role Designation</span>
              <span className="font-medium text-slate-800">
                {receptionist.designation || 'Front Desk / Receptionist'}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider block">Duty Presence Status</span>
              <div className="mt-1">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                  receptionist.presenceStatus === 'AVAILABLE' || receptionist.presenceStatus === 'ON_DUTY'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  <Activity size={12} />
                  {receptionist.presenceStatus ? receptionist.presenceStatus.replace('_', ' ') : 'OFF DUTY'}
                </span>
              </div>
            </div>
            {receptionist.bio && (
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider block">Role Responsibilities / Bio</span>
                <p className="text-slate-700 mt-1 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                  {receptionist.bio}
                </p>
              </div>
            )}
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider block">Account Status</span>
              <div className="mt-1">
                <StatusBadge status={receptionist.active ? 'ACTIVE' : 'INACTIVE'} />
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider block">Last Updated</span>
              <span className="text-slate-600 text-xs">
                {new Date(receptionist.updatedAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Associated Hospital Information */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-semibold border-b border-slate-100 pb-3">
            <Building2 size={18} className="text-blue-600" />
            <span>Associated Hospital</span>
          </div>

          {receptionist.hospital ? (
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider block">Hospital Name</span>
                <button
                  onClick={() => navigate(`/admin/hospitals/${receptionist.hospital.id}`)}
                  className="font-semibold text-blue-600 hover:underline text-left mt-0.5 block"
                >
                  {receptionist.hospital.name}
                </button>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider block">Facility Type</span>
                <span className="font-medium text-slate-800">
                  {receptionist.hospital.facilityType || 'Multi-Specialty Hospital'}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider block">Hospital Address</span>
                <span className="text-slate-700">
                  {[receptionist.hospital.addressLine1, receptionist.hospital.city, receptionist.hospital.state].filter(Boolean).join(', ') || 'Address on file'}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider block">Hospital Contact</span>
                <span className="text-slate-700">
                  {receptionist.hospital.contactPhone || receptionist.hospital.contactEmail || 'N/A'}
                </span>
              </div>
              <div className="pt-2">
                <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Verification Status</span>
                <StatusBadge status={receptionist.hospital.verificationStatus || 'APPROVED'} />
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-slate-500 text-sm">
              No hospital association recorded for this receptionist.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDetails;
