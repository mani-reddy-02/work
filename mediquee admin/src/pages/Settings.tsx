import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  User, 
  Shield, 
  Sliders, 
  Bell, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Eye, 
  EyeOff, 
  Camera, 
  Sparkles, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Calendar, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Radio, 
  Check, 
  X, 
  Laptop, 
  RefreshCw,
  Building,
  KeyRound,
  ExternalLink
} from 'lucide-react';
import { useAdminAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { profileService, PlatformSettingsData } from '../services/profileService';

const PRESET_AVATARS = [
  { id: '1', name: 'Executive Leader', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces' },
  { id: '2', name: 'Clinical Director', url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=256&h=256&fit=crop&crop=faces' },
  { id: '3', name: 'System Architect', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=faces' },
  { id: '4', name: 'Medical Specialist', url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=256&h=256&fit=crop&crop=faces' },
  { id: '5', name: 'Tech Officer', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=256&h=256&fit=crop&crop=faces' },
  { id: '6', name: 'Avatar Modern', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MediAdmin' },
  { id: '7', name: 'Avatar Tech', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=MediQuee' },
  { id: '8', name: 'Avatar Classic', url: 'https://api.dicebear.com/7.x/initials/svg?seed=SuperAdmin&backgroundColor=0284c7' },
];

const Settings: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  const { adminUser, updateProfile, changePassword, refreshProfile, logout } = useAdminAuth();
  const { theme, toggleTheme } = useTheme();

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    designation: '',
    gender: '',
    dob: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    bio: '',
    avatar: '',
  });

  const [initialProfile, setInitialProfile] = useState(profileForm);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Avatar Modal State
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Platform Settings State
  const [platformSettings, setPlatformSettings] = useState<PlatformSettingsData>(profileService.getSettings());
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync profile data when adminUser loads or updates
  useEffect(() => {
    if (adminUser) {
      let parsedAddress = { street: '', city: '', state: '', pincode: '' };
      if (adminUser.address) {
        try {
          if (adminUser.address.startsWith('[')) {
            const arr = JSON.parse(adminUser.address);
            if (arr && arr[0]) {
              parsedAddress = {
                street: arr[0].street || '',
                city: arr[0].city || '',
                state: arr[0].state || '',
                pincode: arr[0].pincode || '',
              };
            }
          } else if (adminUser.address.startsWith('{')) {
            const obj = JSON.parse(adminUser.address);
            parsedAddress = {
              street: obj.street || obj.addressLine1 || '',
              city: obj.city || '',
              state: obj.state || '',
              pincode: obj.pincode || '',
            };
          } else {
            parsedAddress.street = adminUser.address;
          }
        } catch {
          parsedAddress.street = adminUser.address;
        }
      }

      const populated = {
        name: adminUser.name || '',
        email: adminUser.email || '',
        phone: adminUser.phone || '',
        designation: adminUser.designation || 'System Administrator',
        gender: adminUser.gender || '',
        dob: adminUser.dob ? adminUser.dob.split('T')[0] : '',
        street: parsedAddress.street,
        city: parsedAddress.city,
        state: parsedAddress.state,
        pincode: parsedAddress.pincode,
        bio: adminUser.bio || '',
        avatar: adminUser.avatar || '',
      };

      setProfileForm(populated);
      setInitialProfile(populated);
    }
  }, [adminUser]);

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
    setProfileFeedback(null);
    setPasswordFeedback(null);
    setSettingsFeedback(null);
  };

  // --- Profile Submission ---
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileSaving(true);
    setProfileFeedback(null);

    // Format address JSON
    const addressObj = {
      type: 'Headquarters / Admin Base',
      street: profileForm.street.trim(),
      city: profileForm.city.trim(),
      state: profileForm.state.trim(),
      pincode: profileForm.pincode.trim(),
    };
    const addressStr = (addressObj.street || addressObj.city) 
      ? JSON.stringify([addressObj]) 
      : null;

    const payload = {
      name: profileForm.name.trim(),
      email: profileForm.email.trim(),
      phone: profileForm.phone.trim() || undefined,
      designation: profileForm.designation.trim() || null,
      gender: profileForm.gender || null,
      dob: profileForm.dob || null,
      avatar: profileForm.avatar || null,
      bio: profileForm.bio.trim() || null,
      address: addressStr,
    };

    const res = await updateProfile(payload);
    setIsProfileSaving(false);

    if (res.success) {
      setProfileFeedback({ type: 'success', message: res.message || 'Profile settings updated successfully!' });
      setInitialProfile(profileForm);
      setTimeout(() => setProfileFeedback(null), 5000);
    } else {
      setProfileFeedback({ type: 'error', message: res.error || 'Failed to update profile.' });
    }
  };

  const handleResetProfile = () => {
    setProfileForm(initialProfile);
    setProfileFeedback(null);
  };

  // --- Password Submission ---
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (!passwordForm.currentPassword) {
      setPasswordFeedback({ type: 'error', message: 'Current password is required.' });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordFeedback({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordFeedback({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setIsPasswordSaving(true);
    const res = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
    setIsPasswordSaving(false);

    if (res.success) {
      setPasswordFeedback({ type: 'success', message: 'Your password has been changed successfully!' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordFeedback(null), 5000);
    } else {
      setPasswordFeedback({ type: 'error', message: res.error || 'Failed to change password. Please verify current password.' });
    }
  };

  // Password strength score
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const passStrength = getPasswordStrength(passwordForm.newPassword);

  // --- Platform Settings Save ---
  const handleSavePlatformSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSettingsSaving(true);
    const updated = profileService.saveSettings(platformSettings);
    setPlatformSettings(updated);
    setTimeout(() => {
      setIsSettingsSaving(false);
      setSettingsFeedback({ type: 'success', message: 'Platform configurations saved successfully!' });
      setTimeout(() => setSettingsFeedback(null), 4000);
    }, 400);
  };

  const hasProfileChanged = JSON.stringify(profileForm) !== JSON.stringify(initialProfile);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/2 bottom-0 w-80 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Avatar with click-to-edit */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-white/20 overflow-hidden shadow-2xl flex items-center justify-center">
                <img 
                  src={profileForm.avatar || adminUser?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"} 
                  alt="Admin Avatar" 
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin";
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => setShowAvatarModal(true)}
                title="Change Avatar"
                className="absolute -bottom-1 -right-1 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg border border-white/30 transition-all cursor-pointer group-hover:scale-110"
              >
                <Camera size={14} />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {profileForm.name || adminUser?.name || 'Super Admin'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-blue-200/80 text-sm mt-1 flex items-center gap-2 flex-wrap">
                <span>{profileForm.designation || 'System Administrator'}</span>
                <span>•</span>
                <span>{adminUser?.email || 'admin@mediquee.com'}</span>
              </p>
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-300">
                <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                  <ShieldCheck size={13} className="text-emerald-400" />
                  Full System Permissions
                </span>
                <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                  <Calendar size={13} className="text-blue-400" />
                  Since {adminUser?.createdAt ? new Date(adminUser.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Sep 2026'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              onClick={() => refreshProfile()}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-medium backdrop-blur-md border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
            <button
              onClick={logout}
              className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-xl text-xs font-medium backdrop-blur-md border border-rose-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {[
          { id: 'profile', label: 'Admin Profile', icon: User, desc: 'Personal & professional info' },
          { id: 'security', label: 'Security & Access', icon: Shield, desc: 'Password & credentials' },
          { id: 'system', label: 'Platform Settings', icon: Sliders, desc: 'Global rules & discovery' },
          { id: 'preferences', label: 'Preferences', icon: Bell, desc: 'Themes & alerts' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2.5 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon size={17} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ===================== TAB 1: ADMIN PROFILE ===================== */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          {profileFeedback && (
            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm animate-fadeIn ${
              profileFeedback.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {profileFeedback.type === 'success' ? <CheckCircle2 size={18} className="shrink-0 text-emerald-600" /> : <AlertCircle size={18} className="shrink-0 text-rose-600" />}
              <span>{profileFeedback.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Personal & Contact Information */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-base">Personal & Account Information</h3>
                    <p className="text-xs text-slate-500">Official administrative profile details displayed across the platform.</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                    Admin ID: {adminUser?.id?.slice(0, 8) || 'SUPER-01'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Full Legal Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        placeholder="Enter full name"
                        className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Official Designation / Title
                    </label>
                    <div className="relative">
                      <Briefcase size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={profileForm.designation}
                        onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })}
                        placeholder="e.g. Lead Administrator, Chief Medical Officer"
                        className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        placeholder="admin@mediquee.com"
                        className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Mobile Phone Number
                    </label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="e.g. 9999999999"
                        className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Gender
                    </label>
                    <select
                      value={profileForm.gender}
                      onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="date"
                        value={profileForm.dob}
                        onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Administrative Bio / Operational Scope
                  </label>
                  <textarea
                    rows={3}
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    placeholder="Provide a summary of administrative responsibilities, hospital oversight duties, or medical board credentials..."
                    className="w-full p-3 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                  />
                  <span className="text-[11px] text-slate-400 block text-right mt-1">
                    {profileForm.bio.length} characters
                  </span>
                </div>
              </div>

              {/* Physical / Operations Base Address */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <MapPin size={17} className="text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">Headquarters & Operational Address</h3>
                    <p className="text-xs text-slate-500">Official location used for administrative dispatches and audits.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Street Address / Base Building</label>
                    <input
                      type="text"
                      value={profileForm.street}
                      onChange={(e) => setProfileForm({ ...profileForm, street: e.target.value })}
                      placeholder="e.g. MediQuee Central Towers, Financial District"
                      className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">City</label>
                    <input
                      type="text"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                      placeholder="e.g. Hyderabad / Madanapalle"
                      className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">State</label>
                    <input
                      type="text"
                      value={profileForm.state}
                      onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                      placeholder="e.g. Telangana / Andhra Pradesh"
                      className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Postal / Pincode</label>
                    <input
                      type="text"
                      value={profileForm.pincode}
                      onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })}
                      placeholder="e.g. 500034"
                      className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Avatar Preview & Quick Summary */}
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs text-center space-y-4">
                <h3 className="font-semibold text-slate-900 text-sm">Profile Avatar</h3>
                
                <div className="relative mx-auto w-28 h-28 rounded-2xl bg-slate-100 border-2 border-slate-200 overflow-hidden shadow-inner group">
                  <img
                    src={profileForm.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"}
                    alt="Current Avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin";
                    }}
                  />
                  <div 
                    onClick={() => setShowAvatarModal(true)}
                    className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-medium cursor-pointer"
                  >
                    <Camera size={20} className="mb-1" />
                    Change
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowAvatarModal(true)}
                    className="w-full py-2 px-3 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles size={14} className="text-blue-600" />
                    Choose / Customize Avatar
                  </button>
                  {profileForm.avatar && (
                    <button
                      type="button"
                      onClick={() => setProfileForm({ ...profileForm, avatar: '' })}
                      className="text-xs text-rose-500 hover:underline block mx-auto"
                    >
                      Remove Custom Photo
                    </button>
                  )}
                </div>
              </div>

              {/* Role & Privileges Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-blue-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Role Authority</h4>
                </div>
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                    <span>Role Level</span>
                    <span className="font-semibold text-slate-900">Tier 1 Super Admin</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                    <span>Provider Approvals</span>
                    <span className="text-emerald-600 font-semibold">Enabled</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                    <span>Financial Settlements</span>
                    <span className="text-emerald-600 font-semibold">Authoritative</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span>Security Clearance</span>
                    <span className="text-blue-600 font-semibold">Unrestricted</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="sticky bottom-4 z-20 bg-white/90 backdrop-blur-md border border-slate-200/80 p-4 rounded-xl shadow-lg flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {hasProfileChanged ? (
                <span className="text-amber-600 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  Unsaved profile changes pending
                </span>
              ) : (
                'All profile information up to date'
              )}
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleResetProfile}
                disabled={!hasProfileChanged || isProfileSaving}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={14} />
                Reset
              </button>
              <button
                type="submit"
                disabled={!hasProfileChanged || isProfileSaving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                {isProfileSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                {isProfileSaving ? 'Saving Changes...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ===================== TAB 2: SECURITY & ACCESS ===================== */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {passwordFeedback && (
            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm animate-fadeIn ${
              passwordFeedback.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {passwordFeedback.type === 'success' ? <CheckCircle2 size={18} className="shrink-0 text-emerald-600" /> : <AlertCircle size={18} className="shrink-0 text-rose-600" />}
              <span>{passwordFeedback.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Change Password Card */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-base">Change Master Password</h3>
                    <p className="text-xs text-slate-500">Ensure your administrative account uses a strong, dedicated passphrase.</p>
                  </div>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Current Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showCurrentPass ? 'text' : 'password'}
                        required
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        New Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={showNewPass ? 'text' : 'password'}
                          required
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          placeholder="Min 8 characters"
                          className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Confirm New Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={showConfirmPass ? 'text' : 'password'}
                          required
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          placeholder="Re-enter new password"
                          className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPass(!showConfirmPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Password Strength Indicator */}
                  {passwordForm.newPassword && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600">Password Strength:</span>
                        <span className={`font-bold ${
                          passStrength <= 1 ? 'text-rose-500' : passStrength === 2 ? 'text-amber-500' : 'text-emerald-600'
                        }`}>
                          {passStrength <= 1 ? 'Weak' : passStrength === 2 ? 'Medium' : 'Strong'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex gap-0.5">
                        <div className={`h-full flex-1 transition-all ${passStrength >= 1 ? (passStrength <= 1 ? 'bg-rose-500' : passStrength === 2 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-200'}`} />
                        <div className={`h-full flex-1 transition-all ${passStrength >= 2 ? (passStrength === 2 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-200'}`} />
                        <div className={`h-full flex-1 transition-all ${passStrength >= 3 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                        <div className={`h-full flex-1 transition-all ${passStrength >= 4 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-500 pt-1">
                        <span className={`flex items-center gap-1 ${passwordForm.newPassword.length >= 8 ? 'text-emerald-600 font-semibold' : ''}`}>
                          {passwordForm.newPassword.length >= 8 ? '✓' : '•'} 8+ characters
                        </span>
                        <span className={`flex items-center gap-1 ${/[0-9]/.test(passwordForm.newPassword) ? 'text-emerald-600 font-semibold' : ''}`}>
                          {/[0-9]/.test(passwordForm.newPassword) ? '✓' : '•'} Numbers included
                        </span>
                        <span className={`flex items-center gap-1 ${/[A-Z]/.test(passwordForm.newPassword) ? 'text-emerald-600 font-semibold' : ''}`}>
                          {/[A-Z]/.test(passwordForm.newPassword) ? '✓' : '•'} Uppercase letter
                        </span>
                        <span className={`flex items-center gap-1 ${passwordForm.newPassword === passwordForm.confirmPassword && passwordForm.confirmPassword ? 'text-emerald-600 font-semibold' : ''}`}>
                          {passwordForm.newPassword === passwordForm.confirmPassword && passwordForm.confirmPassword ? '✓' : '•'} Passwords match
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isPasswordSaving || !passwordForm.currentPassword || !passwordForm.newPassword}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                    >
                      {isPasswordSaving ? <RefreshCw size={14} className="animate-spin" /> : <Lock size={14} />}
                      {isPasswordSaving ? 'Updating Password...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Col: Active Sessions & Governance */}
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Laptop size={17} className="text-blue-600" />
                  <h3 className="font-semibold text-slate-900 text-sm">Active Session Details</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Device & OS</span>
                    <span className="font-medium text-slate-800">Windows PC / Desktop</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Browser Environment</span>
                    <span className="font-medium text-slate-800">Chrome / Chromium Engine</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Security Token</span>
                    <span className="font-medium text-emerald-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active JWT
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Last Authentication</span>
                    <span className="font-medium text-slate-800">Just now</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full py-2 px-3 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Terminate Current Session & Sign Out
                  </button>
                </div>
              </div>

              {/* Platform Governance Standards */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-5 shadow-md space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Security Protocols</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  All Super Admin requests are cryptographically verified with strict role-based access control (RBAC). Sensitive actions like doctor license approvals and financial settlements are logged authoritatively.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 3: PLATFORM SETTINGS ===================== */}
      {activeTab === 'system' && (
        <form onSubmit={handleSavePlatformSettings} className="space-y-6">
          {settingsFeedback && (
            <div className="p-4 rounded-xl flex items-center gap-3 text-sm bg-emerald-50 text-emerald-800 border border-emerald-200 animate-fadeIn">
              <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
              <span>{settingsFeedback.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Platform Identity */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Building size={17} className="text-blue-600" />
                <h3 className="font-semibold text-slate-900 text-sm">Platform Identity & Contact</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Platform Brand Name</label>
                  <input
                    type="text"
                    value={platformSettings.platformName}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, platformName: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Support & Audit Email</label>
                  <input
                    type="email"
                    value={platformSettings.supportEmail}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, supportEmail: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Support Helpline</label>
                    <input
                      type="text"
                      value={platformSettings.supportPhone}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, supportPhone: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Emergency Helpline</label>
                    <input
                      type="text"
                      value={platformSettings.emergencyHelpline}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, emergencyHelpline: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Rules */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <ShieldCheck size={17} className="text-emerald-600" />
                <h3 className="font-semibold text-slate-900 text-sm">Provider Verification Standards</h3>
              </div>

              <div className="space-y-4 divide-y divide-slate-100">
                <label className="flex items-start justify-between gap-4 pt-2 cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Require Manual Verification for Hospitals</p>
                    <p className="text-[11px] text-slate-500">Newly registered hospitals must be approved by Super Admin before going live.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={platformSettings.requireHospitalVerification}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, requireHospitalVerification: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer mt-1"
                  />
                </label>

                <label className="flex items-start justify-between gap-4 pt-3 cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Require Medical License Verification for Doctors</p>
                    <p className="text-[11px] text-slate-500">Doctors must have valid TSMC/State medical license audited prior to OPD slots booking.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={platformSettings.requireDoctorVerification}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, requireDoctorVerification: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer mt-1"
                  />
                </label>

                <label className="flex items-start justify-between gap-4 pt-3 cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Require Audit for Diagnostic Laboratories</p>
                    <p className="text-[11px] text-slate-500">Enforce manual approval for diagnostic labs and test catalogs.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={platformSettings.requireLabVerification}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, requireLabVerification: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer mt-1"
                  />
                </label>
              </div>
            </div>

            {/* Geolocation & Search Radius */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <MapPin size={17} className="text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">Geolocation & Discovery Parameters</h3>
                    <p className="text-xs text-slate-500">Configure default discovery perimeter for nearby hospitals and laboratories.</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Authoritative Geocoder Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Default Nearby Search Radius</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[25, 50, 100].map((radius) => (
                      <button
                        key={radius}
                        type="button"
                        onClick={() => setPlatformSettings({ ...platformSettings, defaultNearbyRadiusKm: radius })}
                        className={`py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          platformSettings.defaultNearbyRadiusKm === radius
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-sm font-bold">{radius} km</span>
                        <span className="text-[10px] opacity-80">{radius === 25 ? 'City / Town' : radius === 50 ? 'District' : 'Regional'}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-700">Strict Distance Enforcement</label>
                  <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={platformSettings.strictRadiusFiltering}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, strictRadiusFiltering: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer mt-0.5"
                    />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">Filter Out Distant Healthcare Providers</p>
                      <p className="text-[11px] text-slate-500">Only display genuine facilities located within user-selected radius perimeter (prevents showing distant hospitals as nearby).</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSettingsSaving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSettingsSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              {isSettingsSaving ? 'Saving Configurations...' : 'Save System Settings'}
            </button>
          </div>
        </form>
      )}

      {/* ===================== TAB 4: PREFERENCES ===================== */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visual Appearance */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Sun size={17} className="text-amber-500" />
                <h3 className="font-semibold text-slate-900 text-sm">Theme & Interface Appearance</h3>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-500">Choose your preferred workspace visual style for the administrative dashboard.</p>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { if (theme !== 'light') toggleTheme(); }}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col items-center gap-2 ${
                      theme === 'light'
                        ? 'bg-blue-50/60 border-blue-600 shadow-xs ring-1 ring-blue-600'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                      <Sun size={20} />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Light Mode</span>
                    <span className="text-[11px] text-slate-500 text-center">Bright & high clarity</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { if (theme !== 'dark') toggleTheme(); }}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col items-center gap-2 ${
                      theme === 'dark'
                        ? 'bg-slate-800 border-blue-500 shadow-xs ring-1 ring-blue-500 text-white'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-700 text-blue-300 flex items-center justify-center">
                      <Moon size={20} />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Dark Mode</span>
                    <span className="text-[11px] text-slate-500 text-center">Gentle on the eyes</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Admin Notifications Subscriptions */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Bell size={17} className="text-blue-600" />
                <h3 className="font-semibold text-slate-900 text-sm">Administrative Alerts & Notifications</h3>
              </div>

              <div className="space-y-3 divide-y divide-slate-100">
                <label className="flex items-center justify-between gap-4 pt-1 cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">New Hospital Registration Alerts</p>
                    <p className="text-[11px] text-slate-500">Receive immediate notifications when new facilities register.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={platformSettings.emailAlertOnHospitalRegistration}
                    onChange={(e) => {
                      const updated = profileService.saveSettings({ emailAlertOnHospitalRegistration: e.target.checked });
                      setPlatformSettings(updated);
                    }}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between gap-4 pt-3 cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">High-Priority Clinical Escalations</p>
                    <p className="text-[11px] text-slate-500">Alerts for urgent home nursing or camp service escalations.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={platformSettings.emailAlertOnHighPriorityRequest}
                    onChange={(e) => {
                      const updated = profileService.saveSettings({ emailAlertOnHighPriorityRequest: e.target.checked });
                      setPlatformSettings(updated);
                    }}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between gap-4 pt-3 cursor-pointer">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Daily Revenue Settlement Summary</p>
                    <p className="text-[11px] text-slate-500">Automated end-of-day digest of platform payouts and commissions.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={platformSettings.dailyFinancialSummary}
                    onChange={(e) => {
                      const updated = profileService.saveSettings({ dailyFinancialSummary: e.target.checked });
                      setPlatformSettings(updated);
                    }}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== AVATAR PICKER MODAL ===================== */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Select Profile Avatar</h3>
                <p className="text-xs text-slate-500">Choose from preset professional avatars or enter a custom photo URL.</p>
              </div>
              <button
                onClick={() => setShowAvatarModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Presets Grid */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Preset Avatars</label>
              <div className="grid grid-cols-4 gap-3">
                {PRESET_AVATARS.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => {
                      setProfileForm({ ...profileForm, avatar: av.url });
                      setShowAvatarModal(false);
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      profileForm.avatar === av.url
                        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <img src={av.url} alt={av.name} className="w-12 h-12 rounded-lg object-cover" />
                    <span className="text-[10px] text-slate-600 font-medium truncate w-full text-center">
                      {av.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom URL Input */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Or Custom Image URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customAvatarUrl.trim()) {
                      setProfileForm({ ...profileForm, avatar: customAvatarUrl.trim() });
                      setCustomAvatarUrl('');
                      setShowAvatarModal(false);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
