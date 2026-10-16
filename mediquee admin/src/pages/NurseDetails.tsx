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
  Award, 
  FileText, 
  HeartHandshake, 
  CheckCircle2, 
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable, { Column } from '../components/ui/DataTable';

const NurseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAdminAuth();

  const [nurse, setNurse] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ASSIGNMENTS'>('OVERVIEW');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNurse = async () => {
      if (!token || !id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await userService.getUserById(token, id);
        if (res.success && res.data) {
          setNurse(res.data);
        } else {
          setError(res.message || 'Nurse not found');
        }
      } catch (err) {
        console.error('Failed to fetch nurse details:', err);
        setError('Failed to load nurse details from server');
      } finally {
        setLoading(false);
      }
    };
    fetchNurse();
  }, [token, id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-xl border border-slate-200">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-600 font-medium text-sm">Loading nurse details...</p>
      </div>
    );
  }

  if (error || !nurse) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-xl border border-slate-200 p-8">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
          <AlertCircle size={24} />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{error || 'Nurse not found'}</h3>
        <p className="text-sm text-slate-500 mb-6 text-center max-w-md">
          The requested nurse record could not be loaded from the database.
        </p>
        <button
          onClick={() => navigate('/admin/nurses')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Nurses
        </button>
      </div>
    );
  }

  const assignedBookings = nurse.assignedNursingBookings || [];

  const assignmentColumns: Column<any>[] = [
    {
      header: 'Booking No.',
      accessor: (b) => (
        <span className="font-semibold text-slate-900 text-xs">
          {b.bookingNumber || `HN-${b.id.substring(0, 8).toUpperCase()}`}
        </span>
      ),
      className: 'w-36'
    },
    {
      header: 'Service',
      accessor: (b) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900 text-sm">
            {b.service?.name || 'Home Nursing Service'}
          </span>
          <span className="text-xs text-slate-500">
            {b.duration || b.service?.duration || 'Standard Session'}
          </span>
        </div>
      )
    },
    {
      header: 'Patient Details',
      accessor: (b) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900 text-sm">{b.patientName}</span>
          <span className="text-xs text-slate-500">{b.patientPhone}</span>
        </div>
      )
    },
    {
      header: 'Schedule',
      accessor: (b) => (
        <div className="flex flex-col text-sm">
          <span className="text-slate-800 font-medium">
            {new Date(b.serviceDate).toLocaleDateString()}
          </span>
          <span className="text-xs text-slate-500">{b.timeSlot || 'Scheduled'}</span>
        </div>
      )
    },
    {
      header: 'Location',
      accessor: (b) => (
        <span className="text-xs text-slate-600 truncate max-w-[200px]" title={b.address}>
          {b.address || 'Address provided on file'}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: (b) => <StatusBadge status={b.status} />
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/nurses')}
          className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"
          title="Back to Nurses List"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900">{nurse.name}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              Nurse
            </span>
            <StatusBadge status={nurse.active ? 'ACTIVE' : 'INACTIVE'} />
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Registered on {new Date(nurse.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'OVERVIEW'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Profile & Hospital Overview
        </button>
        <button
          onClick={() => setActiveTab('ASSIGNMENTS')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'ASSIGNMENTS'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Home Nursing Assignments</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700">
            {assignedBookings.length}
          </span>
        </button>
      </div>

      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-semibold border-b border-slate-100 pb-3">
              <User size={18} className="text-blue-600" />
              <span>Personal Information</span>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider block">Full Name</span>
                <span className="font-medium text-slate-800">{nurse.name}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider block">Email Address</span>
                <div className="flex items-center gap-2 mt-0.5 text-slate-800">
                  <Mail size={14} className="text-slate-400" />
                  <span>{nurse.email || 'N/A'}</span>
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider block">Phone Number</span>
                <div className="flex items-center gap-2 mt-0.5 text-slate-800">
                  <Phone size={14} className="text-slate-400" />
                  <span>{nurse.phone || 'N/A'}</span>
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider block">Gender</span>
                <span className="font-medium text-slate-800">{nurse.gender || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider block">Address</span>
                <div className="flex items-start gap-2 mt-0.5 text-slate-800">
                  <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                  <span>{nurse.address || 'No residential address on file'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Details */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-semibold border-b border-slate-100 pb-3">
              <Briefcase size={18} className="text-blue-600" />
              <span>Professional Credentials</span>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider block">Designation</span>
                <span className="font-medium text-slate-800">
                  {nurse.designation || 'Staff Nurse'}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider block">Qualification</span>
                <div className="flex items-center gap-2 mt-0.5 text-slate-800">
                  <Award size={14} className="text-slate-400" />
                  <span>{nurse.qualification || 'Nursing Degree / Certificate'}</span>
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider block">Experience</span>
                <span className="font-medium text-slate-800">
                  {nurse.experienceYears ? `${nurse.experienceYears} Years` : 'Not specified'}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider block">License / Registration</span>
                <div className="flex items-center gap-2 mt-0.5 text-slate-800">
                  <FileText size={14} className="text-slate-400" />
                  <span>{nurse.licenseNumber || 'Verified Registration'}</span>
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider block">Clinical Department</span>
                <span className="font-medium text-slate-800">
                  {nurse.department?.name || 'Home Nursing / General Care'}
                </span>
              </div>
            </div>
          </div>

          {/* Associated Hospital */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-semibold border-b border-slate-100 pb-3">
              <Building2 size={18} className="text-blue-600" />
              <span>Associated Hospital</span>
            </div>

            {nurse.hospital ? (
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider block">Hospital Name</span>
                  <button
                    onClick={() => navigate(`/admin/hospitals/${nurse.hospital.id}`)}
                    className="font-semibold text-blue-600 hover:underline text-left mt-0.5 block"
                  >
                    {nurse.hospital.name}
                  </button>
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider block">Facility Type</span>
                  <span className="font-medium text-slate-800">
                    {nurse.hospital.facilityType || 'Multi-Specialty Hospital'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider block">Location</span>
                  <span className="text-slate-700">
                    {[nurse.hospital.addressLine1, nurse.hospital.city, nurse.hospital.state].filter(Boolean).join(', ') || 'Address on file'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider block">Hospital Contact</span>
                  <span className="text-slate-700">
                    {nurse.hospital.contactPhone || nurse.hospital.contactEmail || 'N/A'}
                  </span>
                </div>
                <div className="pt-2">
                  <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Hospital Verification</span>
                  <StatusBadge status={nurse.hospital.verificationStatus || 'APPROVED'} />
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-500 text-sm">
                No direct hospital ownership link found on this profile.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'ASSIGNMENTS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 text-sm">
              Assigned Home Nursing Bookings & Visit History
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {assignedBookings.length} total assignment{assignedBookings.length === 1 ? '' : 's'}
            </span>
          </div>

          <DataTable
            data={assignedBookings}
            columns={assignmentColumns}
            keyExtractor={(b) => b.id}
            emptyMessage="No home nursing bookings currently assigned to this nurse."
          />
        </div>
      )}
    </div>
  );
};

export default NurseDetails;
