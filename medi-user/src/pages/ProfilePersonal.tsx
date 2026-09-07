import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useProfile } from '../lib/profile';

export default function ProfilePersonal() {
  const navigate = useNavigate();
  const { profile, updateProfile, isLoading: isProfileLoading } = useProfile();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setFormData(profile);
    }
  }, [profile, isEditing]);

  const handleSave = async () => {
    setIsSaving(true);
    setApiError(null);

    const res = await updateProfile({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      dob: formData.dob || undefined,
      gender: formData.gender || undefined,
    });

    setIsSaving(false);

    if (res.success) {
      setIsEditing(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      setApiError(res.error || 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    setFormData(profile);
    setApiError(null);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="bg-white sticky top-0 z-20 px-4 py-4 border-b border-slate-100 flex items-center shadow-sm">
        <button 
          onClick={() => navigate('/profile')} 
          className="p-1 -ml-1 mr-3 text-slate-600 hover:text-blue-600 transition-colors rounded-full hover:bg-slate-50"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex-1">Personal Information</h1>
        {!isEditing && (
          <button 
            onClick={() => {
              setApiError(null);
              setIsEditing(true);
            }}
            className="text-sm font-bold text-blue-600 hover:text-blue-700"
          >
            Edit Profile
          </button>
        )}
      </div>

      <div className="p-4 md:p-6 max-w-md mx-auto w-full">
        {showSuccess && (
          <div className="mb-4 bg-emerald-50 text-emerald-600 p-3 rounded-xl flex items-center gap-2 border border-emerald-100 animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">Profile updated successfully</p>
          </div>
        )}

        {apiError && (
          <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl flex items-center gap-2 border border-red-100 animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{apiError}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm mb-6 flex flex-col items-center">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full border-4 border-slate-50 overflow-hidden shadow-sm">
              <img 
                src={profile.avatar || "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"} 
                alt="Profile" 
                className="w-full h-full object-cover" 
              />
            </div>
            {isEditing && (
              <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-900">{profile.name || 'Patient'}</h2>
          <p className="text-slate-500 text-sm">{profile.email}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Full Name</label>
            {isEditing ? (
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900"
              />
            ) : (
              <p className="text-slate-900 font-medium py-1">{profile.name || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Email Address</label>
            {isEditing ? (
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900"
              />
            ) : (
              <p className="text-slate-900 font-medium py-1">{profile.email || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Phone Number</label>
            {isEditing ? (
              <input 
                type="tel" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900"
              />
            ) : (
              <p className="text-slate-900 font-medium py-1">{profile.phone || '-'}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Date of Birth</label>
              {isEditing ? (
                <input 
                  type="date" 
                  value={formData.dob ? formData.dob.split('T')[0] : ''}
                  onChange={(e) => setFormData({...formData, dob: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900"
                />
              ) : (
                <p className="text-slate-900 font-medium py-1">{profile.dob ? profile.dob.split('T')[0] : '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Gender</label>
              {isEditing ? (
                <select 
                  value={formData.gender || 'Male'}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <p className="text-slate-900 font-medium py-1">{profile.gender || '-'}</p>
              )}
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="mt-6 flex gap-3">
            <button 
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
