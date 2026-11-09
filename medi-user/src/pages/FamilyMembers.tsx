import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Users, Plus, UserCircle2, Trash2, Edit2, 
  Stethoscope, Video, TestTube, Home, Phone, HeartPulse, Check, X, AlertCircle
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useFamilyMembers, type FamilyMember } from '../lib/familyMembers';

const RELATIONSHIP_OPTIONS = [
  'Father',
  'Mother',
  'Spouse',
  'Son',
  'Daughter',
  'Brother',
  'Sister',
  'Grandfather',
  'Grandmother',
  'Uncle',
  'Aunt',
  'Other',
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export default function FamilyMembers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { members, addMember, updateMember, deleteMember } = useFamilyMembers(user?.id);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<FamilyMember>>({
    name: '',
    relationship: 'Father',
    age: undefined,
    gender: 'Male',
    phone: '',
    bloodGroup: '',
  });

  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [memberToDelete, setMemberToDelete] = useState<FamilyMember | null>(null);

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      relationship: 'Father',
      age: undefined,
      gender: 'Male',
      phone: user?.phone || '',
      bloodGroup: '',
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (member: FamilyMember) => {
    setEditingId(member.id);
    setFormData({
      name: member.name,
      relationship: member.relationship,
      age: member.age,
      gender: member.gender,
      phone: member.phone || '',
      bloodGroup: member.bloodGroup || '',
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const trimmedName = (formData.name || '').trim();
    if (!trimmedName || trimmedName.length < 2) {
      setFormError('Please enter a valid full name (at least 2 characters).');
      return;
    }

    const ageNum = Number(formData.age);
    if (!formData.age || isNaN(ageNum) || ageNum < 0 || ageNum > 125) {
      setFormError('Please enter a valid age between 0 and 125.');
      return;
    }

    if (!formData.relationship) {
      setFormError('Please select a relationship.');
      return;
    }

    const memberPayload: Omit<FamilyMember, 'id'> = {
      name: trimmedName,
      relationship: formData.relationship,
      age: ageNum,
      gender: (formData.gender as 'Male' | 'Female' | 'Other') || 'Male',
      phone: (formData.phone || '').trim() || undefined,
      bloodGroup: (formData.bloodGroup || '').trim() || undefined,
    };

    if (editingId) {
      updateMember(editingId, memberPayload);
      triggerToast(`${trimmedName}'s details updated successfully.`);
    } else {
      addMember(memberPayload);
      triggerToast(`${trimmedName} added to family members.`);
    }

    setIsFormOpen(false);
  };

  const handleConfirmDelete = () => {
    if (memberToDelete) {
      deleteMember(memberToDelete.id);
      triggerToast(`${memberToDelete.name} removed.`);
      setMemberToDelete(null);
    }
  };

  // Quick booking navigators
  const handleBookOp = (member: FamilyMember) => {
    const params = new URLSearchParams({
      type: 'hospital-op',
      patientId: member.id,
      patientName: member.name,
      patientAge: String(member.age),
      patientGender: member.gender,
      patientPhone: member.phone || user?.phone || '',
    });
    navigate(`/specialties?${params.toString()}`);
  };

  const handleBookVideo = (member: FamilyMember) => {
    const params = new URLSearchParams({
      type: 'doctor',
      patientId: member.id,
      patientName: member.name,
      patientAge: String(member.age),
      patientGender: member.gender,
      patientPhone: member.phone || user?.phone || '',
    });
    navigate(`/specialties?${params.toString()}`);
  };

  const handleBookLab = (member: FamilyMember) => {
    const params = new URLSearchParams({
      patientId: member.id,
      patientName: member.name,
      patientAge: String(member.age),
      patientGender: member.gender,
      patientPhone: member.phone || user?.phone || '',
    });
    navigate(`/services/lab-tests?${params.toString()}`);
  };

  const handleBookNursing = (member: FamilyMember) => {
    const params = new URLSearchParams({
      patientId: member.id,
      patientName: member.name,
      patientAge: String(member.age),
      patientGender: member.gender,
      patientPhone: member.phone || user?.phone || '',
    });
    navigate(`/services/home-nursing?${params.toString()}`);
  };

  const getRelationshipBadgeColor = (rel: string) => {
    switch (rel?.toLowerCase()) {
      case 'father':
      case 'mother':
      case 'grandfather':
      case 'grandmother':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'spouse':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'son':
      case 'daughter':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'brother':
      case 'sister':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 overflow-x-hidden pb-12">
      {/* Toast Alert */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm font-semibold animate-in fade-in slide-in-from-top-4">
          <Check className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white sticky top-0 z-20 border-b border-slate-100 shadow-xs">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/profile')} 
              className="p-1 -ml-1 text-slate-600 hover:text-blue-600 transition-colors rounded-full hover:bg-slate-50 cursor-pointer shrink-0"
              title="Back to Profile"
              aria-label="Back to Profile"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Family Members</h1>
              <p className="text-xs text-slate-500 hidden sm:block">Manage family profiles and book consultations on their behalf</p>
            </div>
          </div>

          <button 
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Member
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full flex-1">
        {members.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-xs p-6 sm:p-12 max-w-lg mx-auto">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Users className="w-10 h-10" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">No Family Members Added</h2>
            <p className="text-slate-600 text-xs sm:text-sm mb-6 leading-relaxed">
              Add your parents, spouse, children, or other dependents to easily book hospital visits, video consultations, and health tests for them with one click.
            </p>
            <button 
              onClick={handleOpenAdd}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer text-sm"
            >
              <Plus className="w-4 h-4" /> Add Your First Family Member
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Saved Members ({members.length})
              </span>
              <span className="text-xs text-slate-500">Tap a service below to book directly for that member</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {members.map((member) => (
                <div 
                  key={member.id} 
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between"
                >
                  {/* Member Details */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center shrink-0 text-blue-600 font-bold text-lg">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 text-base sm:text-lg truncate">
                            {member.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getRelationshipBadgeColor(member.relationship)}`}>
                              {member.relationship}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              Age: {member.age} • {member.gender}
                            </span>
                            {member.bloodGroup && (
                              <span className="px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-600 text-[10px] font-bold">
                                {member.bloodGroup}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Edit / Delete actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(member)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit member"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setMemberToDelete(member)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {member.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-4 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 w-fit">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Direct Booking Action Bar for this family member */}
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Book Service for {member.name.split(' ')[0]}:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => handleBookOp(member)}
                        className="flex flex-col items-center justify-center p-2 rounded-xl bg-teal-50/70 hover:bg-teal-100/80 border border-teal-100 text-teal-800 transition-colors cursor-pointer group"
                        title="Book Hospital Outpatient Appointment"
                      >
                        <Stethoscope className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform mb-1" />
                        <span className="text-[11px] font-bold">OP Visit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleBookVideo(member)}
                        className="flex flex-col items-center justify-center p-2 rounded-xl bg-blue-50/70 hover:bg-blue-100/80 border border-blue-100 text-blue-800 transition-colors cursor-pointer group"
                        title="Book Telemedicine Video Consultation"
                      >
                        <Video className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform mb-1" />
                        <span className="text-[11px] font-bold">Video Consult</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleBookLab(member)}
                        className="flex flex-col items-center justify-center p-2 rounded-xl bg-purple-50/70 hover:bg-purple-100/80 border border-purple-100 text-purple-800 transition-colors cursor-pointer group"
                        title="Book Diagnostic Lab Tests"
                      >
                        <TestTube className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform mb-1" />
                        <span className="text-[11px] font-bold">Lab Tests</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleBookNursing(member)}
                        className="flex flex-col items-center justify-center p-2 rounded-xl bg-pink-50/70 hover:bg-pink-100/80 border border-pink-100 text-pink-800 transition-colors cursor-pointer group"
                        title="Book Home Nursing Care"
                      >
                        <Home className="w-4 h-4 text-pink-600 group-hover:scale-110 transition-transform mb-1" />
                        <span className="text-[11px] font-bold">Nursing</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Member Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UserCircle2 className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingId ? 'Edit Family Member' : 'Add Family Member'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Reddy"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Relationship <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.relationship || 'Father'}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    {RELATIONSHIP_OPTIONS.map((rel) => (
                      <option key={rel} value={rel}>{rel}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.gender || 'Male'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Male' | 'Female' | 'Other' })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Age (Years) <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="number"
                    min="0"
                    max="125"
                    required
                    value={formData.age !== undefined ? formData.age : ''}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value === '' ? undefined : Number(e.target.value) })}
                    placeholder="e.g. 52"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Blood Group <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <select
                    value={formData.bloodGroup || ''}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Select Blood Group</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input 
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-colors cursor-pointer text-sm"
                >
                  {editingId ? 'Save Changes' : 'Save Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center mb-1">
              Remove Family Member?
            </h3>
            <p className="text-xs text-slate-600 text-center mb-5">
              Are you sure you want to remove <strong className="text-slate-900">{memberToDelete.name}</strong> from your family members list?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition-colors text-xs cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
