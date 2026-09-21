import { useState, useEffect, useCallback } from "react"
import { 
  ArrowLeft, Building2, MapPin, Phone, Mail, PhoneCall, Globe, 
  ShieldCheck, Edit3, X, AlertCircle, Users, 
  Activity, Layers, FileText, RefreshCw
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { hospitalProfileApi, type HospitalProfile, type UpdateHospitalProfileDto } from "@/services/hospitalProfileApi"
import { useToast } from "@/context/ToastContext"
import { Skeleton } from "@/components/ui/Skeleton"
import { cn } from "@/lib/utils"

export function HospitalInfo() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<HospitalProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Edit modal state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formData, setFormData] = useState<UpdateHospitalProfileDto>({});
  const [serviceInput, setServiceInput] = useState<string>('');

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await hospitalProfileApi.getProfile();
      setProfile(data);
    } catch (err: any) {
      console.error("Failed to load hospital profile:", err);
      setError(err?.message || "Unable to load hospital profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleOpenEdit = () => {
    if (!profile) return;
    setFormData({
      name: profile.name || '',
      facilityType: profile.facilityType || '',
      registrationNumber: profile.registrationNumber || '',
      establishedYear: profile.establishedYear || '',
      contactPhone: profile.contactPhone || '',
      contactEmail: profile.contactEmail || '',
      emergencyContact: profile.emergencyContact || '',
      website: profile.website || '',
      addressLine1: profile.addressLine1 || '',
      addressLine2: profile.addressLine2 || '',
      area: profile.area || '',
      city: profile.city || '',
      state: profile.state || '',
      pincode: profile.pincode || '',
      services: profile.services ? [...profile.services] : [],
    });
    setServiceInput('');
    setIsEditing(true);
  };

  const handleCloseEdit = () => {
    if (isSaving) return;
    setIsEditing(false);
  };

  const handleAddService = () => {
    const trimmed = serviceInput.trim();
    if (!trimmed) return;
    const currentServices = formData.services || [];
    if (!currentServices.includes(trimmed)) {
      setFormData({
        ...formData,
        services: [...currentServices, trimmed]
      });
    }
    setServiceInput('');
  };

  const handleRemoveService = (serviceToRemove: string) => {
    const currentServices = formData.services || [];
    setFormData({
      ...formData,
      services: currentServices.filter(s => s !== serviceToRemove)
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await hospitalProfileApi.updateProfile(formData);
      setProfile(updated);
      toast("Hospital profile updated successfully", "success");
      setIsEditing(false);
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      toast(err?.message || "Failed to update profile. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const addressString = profile ? (
    [profile.addressLine1, profile.addressLine2, profile.area, profile.city, profile.state, profile.pincode]
      .filter(Boolean)
      .join(", ") || profile.address || "Not configured"
  ) : "—";

  return (
    <div className="flex flex-col bg-background/50 min-h-[calc(100vh-80px)] pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md pt-4 pb-3 px-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 text-muted hover:text-foreground transition-colors rounded-xl hover:bg-gray-100 active:scale-95"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Hospital Information</h1>
            <p className="text-xs text-muted">Official facility metadata & contact details</p>
          </div>
        </div>

        {profile && (
          <button
            onClick={handleOpenEdit}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1769E0] text-white text-xs font-semibold rounded-xl shadow-sm hover:bg-[#1255b8] active:scale-95 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="p-4 flex flex-col gap-5 max-w-4xl mx-auto w-full">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col gap-4">
            <div className="p-6 bg-surface rounded-3xl border border-border shadow-sm flex flex-col items-center gap-3">
              <Skeleton className="w-20 h-20 rounded-2xl" />
              <Skeleton className="w-48 h-6 rounded-lg" />
              <Skeleton className="w-36 h-4 rounded-lg" />
            </div>
            <div className="p-5 bg-surface rounded-2xl border border-border shadow-sm flex flex-col gap-4">
              <Skeleton className="w-32 h-5 rounded-lg" />
              <Skeleton className="w-full h-12 rounded-xl" />
              <Skeleton className="w-full h-12 rounded-xl" />
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="p-6 bg-red-50/70 border border-red-200/80 rounded-3xl flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">Failed to Load Profile</h3>
            <p className="text-xs text-gray-600 max-w-md">{error}</p>
            <button
              onClick={fetchProfile}
              className="mt-2 flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Profile Content */}
        {!isLoading && profile && (
          <>
            {/* Top Facility Hero Card */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="flex flex-col items-center justify-center p-6 bg-surface rounded-3xl border border-border/70 shadow-sm relative overflow-hidden"
            >
              <div className="w-20 h-20 bg-blue-50 text-[#1769E0] border border-blue-100 rounded-2xl flex items-center justify-center mb-3 shadow-sm">
                <Building2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-foreground text-center">{profile.name}</h2>
              
              <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                {profile.facilityType && (
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 font-semibold text-[11px] rounded-lg">
                    {profile.facilityType}
                  </span>
                )}
                <span className={cn(
                  "px-2.5 py-0.5 font-bold text-[10px] uppercase tracking-wider rounded-lg flex items-center gap-1",
                  profile.verificationStatus === 'VERIFIED'
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                )}>
                  <ShieldCheck className="w-3 h-3" />
                  {profile.verificationStatus === 'VERIFIED' ? 'Verified Hospital' : 'Pending Verification'}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-xs text-muted font-medium">
                <span>Registration No: <strong className="text-foreground">{profile.registrationNumber || "Not configured"}</strong></span>
                {profile.establishedYear && (
                  <span>Est: <strong className="text-foreground">{profile.establishedYear}</strong></span>
                )}
              </div>
            </motion.div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <button 
                type="button"
                onClick={() => navigate('/profile/departments')}
                className="bg-surface p-3.5 rounded-2xl border border-border shadow-sm flex flex-col items-center text-center cursor-pointer hover:border-[#1769E0]/40 hover:shadow-md active:scale-95 transition-all"
                title="View Departments"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1769E0] flex items-center justify-center mb-1.5">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-lg font-black text-foreground">{profile.departmentsCount ?? 0}</span>
                <span className="text-[11px] font-semibold text-muted">Departments</span>
              </button>
              <button 
                type="button"
                onClick={() => navigate('/profile/staff')}
                className="bg-surface p-3.5 rounded-2xl border border-border shadow-sm flex flex-col items-center text-center cursor-pointer hover:border-purple-300 hover:shadow-md active:scale-95 transition-all"
                title="View Staff"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-1.5">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-lg font-black text-foreground">{profile.staffCount ?? 0}</span>
                <span className="text-[11px] font-semibold text-muted">Active Staff</span>
              </button>
              <button 
                type="button"
                onClick={() => navigate('/appointments')}
                className="bg-surface p-3.5 rounded-2xl border border-border shadow-sm flex flex-col items-center text-center cursor-pointer hover:border-emerald-300 hover:shadow-md active:scale-95 transition-all"
                title="View Appointments"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5">
                  <Activity className="w-4 h-4" />
                </div>
                <span className="text-lg font-black text-foreground">{profile.totalBookingsCount ?? 0}</span>
                <span className="text-[11px] font-semibold text-muted">Appointments</span>
              </button>
            </div>

            {/* Emergency Helpline Highlight Card */}
            <div className="p-4 bg-gradient-to-r from-red-50 via-rose-50 to-orange-50 border border-red-200/80 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-600/20">
                  <PhoneCall className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <span className="text-xs font-bold text-red-900 uppercase tracking-wide">24/7 Emergency Helpline</span>
                  <p className="text-sm font-black text-red-700">
                    {profile.emergencyContact || "Helpline not configured"}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleOpenEdit} 
                className="text-xs font-bold text-red-700 hover:text-red-900 underline underline-offset-2"
              >
                Configure
              </button>
            </div>

            {/* Operational Contact Details */}
            <div className="flex flex-col gap-2">
              <h3 className="font-semibold text-foreground text-sm px-1 uppercase tracking-wider">Operational Contacts</h3>
              <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
                <div className="p-4 flex items-center gap-3.5">
                  <Phone className="w-5 h-5 text-muted/70 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-muted">Reception / Main Line</span>
                    <span className="text-sm font-semibold text-foreground">{profile.contactPhone || "Not configured"}</span>
                  </div>
                </div>
                <div className="p-4 flex items-center gap-3.5">
                  <Mail className="w-5 h-5 text-muted/70 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-muted">Official Hospital Email</span>
                    <span className="text-sm font-semibold text-foreground">{profile.contactEmail || "Not configured"}</span>
                  </div>
                </div>
                <div className="p-4 flex items-center gap-3.5">
                  <Globe className="w-5 h-5 text-muted/70 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-muted">Official Website</span>
                    {profile.website ? (
                      <a 
                        href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-sm font-semibold text-[#1769E0] hover:underline"
                      >
                        {profile.website}
                      </a>
                    ) : (
                      <span className="text-sm font-semibold text-foreground">Not configured</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Location & Address */}
            <div className="flex flex-col gap-2">
              <h3 className="font-semibold text-foreground text-sm px-1 uppercase tracking-wider">Facility Address</h3>
              <div className="bg-surface border border-border rounded-2xl shadow-sm p-4 flex items-start gap-3.5">
                <MapPin className="w-5 h-5 text-[#1769E0] shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-muted">Physical Location</span>
                  <span className="text-sm text-foreground font-medium leading-relaxed">{addressString}</span>
                  {(profile.city || profile.pincode) && (
                    <div className="flex gap-2 mt-2">
                      {profile.city && (
                        <span className="px-2 py-0.5 bg-gray-100 text-foreground/80 text-xs rounded-md font-medium">
                          City: {profile.city}
                        </span>
                      )}
                      {profile.pincode && (
                        <span className="px-2 py-0.5 bg-gray-100 text-foreground/80 text-xs rounded-md font-medium">
                          PIN: {profile.pincode}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Services Offered */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">Clinical Services</h3>
                <span className="text-xs text-muted">{profile.services?.length || 0} active</span>
              </div>
              <div className="bg-surface border border-border rounded-2xl shadow-sm p-4">
                {profile.services && profile.services.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.services.map((svc, idx) => {
                      const displayTitle = svc.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      return (
                        <span 
                          key={idx} 
                          className="px-3 py-1 bg-blue-50/80 text-[#1769E0] border border-blue-100 text-xs font-semibold rounded-xl capitalize"
                        >
                          {displayTitle}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted/70 italic">No clinical services listed yet. Click "Edit Profile" to configure.</p>
                )}
              </div>
            </div>

            {/* Verification Documents */}
            <div className="flex flex-col gap-2">
              <h3 className="font-semibold text-foreground text-sm px-1 uppercase tracking-wider">Licensing & Documents</h3>
              <div className="bg-surface border border-border rounded-2xl shadow-sm p-4">
                {profile.verifications && profile.verifications.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {profile.verifications.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2.5 bg-background rounded-xl border border-border">
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-muted" />
                          <span className="text-xs font-semibold text-foreground">{doc.documentType}</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                          On File
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted/70 italic">No regulatory certificates uploaded.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-surface w-full max-w-xl max-h-[90vh] rounded-3xl shadow-2xl border border-border overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-4 px-6 border-b border-border flex items-center justify-between bg-surface sticky top-0 z-10">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Edit Hospital Profile</h2>
                  <p className="text-xs text-muted">Update facility information, contact, and address</p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  disabled={isSaving}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-muted/70 hover:text-foreground/80 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSave} className="overflow-y-auto p-6 flex flex-col gap-6">
                {/* 1. Basic Info */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-muted/70 uppercase tracking-wider">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1 md:col-span-2">
                      <label className="text-xs font-semibold text-foreground/80">Hospital / Facility Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0]"
                        placeholder="e.g. Apollo Hospitals"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-foreground/80">Facility Type</label>
                      <input
                        type="text"
                        value={formData.facilityType || ''}
                        onChange={(e) => setFormData({ ...formData, facilityType: e.target.value })}
                        className="px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0]"
                        placeholder="e.g. Multi-Specialty Hospital"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-foreground/80">Registration / License No.</label>
                      <input
                        type="text"
                        value={formData.registrationNumber || ''}
                        onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                        className="px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0]"
                        placeholder="e.g. REG-2024-8849"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-foreground/80">Established Year</label>
                      <input
                        type="text"
                        value={formData.establishedYear || ''}
                        onChange={(e) => setFormData({ ...formData, establishedYear: e.target.value })}
                        className="px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0]"
                        placeholder="e.g. 2012"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Contact & Helpline */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-muted/70 uppercase tracking-wider">Contact & 24/7 Helpline</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-foreground/80">Reception Phone</label>
                      <input
                        type="tel"
                        value={formData.contactPhone || ''}
                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                        className="px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0]"
                        placeholder="e.g. +91 98765 43210"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-red-700">24/7 Emergency Helpline</label>
                      <input
                        type="tel"
                        value={formData.emergencyContact || ''}
                        onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                        className="px-3.5 py-2.5 bg-red-50/50 border border-red-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400/20 focus:border-red-500 font-semibold text-red-900"
                        placeholder="e.g. 1066 / +91 99999 11111"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-foreground/80">Official Email</label>
                      <input
                        type="email"
                        value={formData.contactEmail || ''}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        className="px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0]"
                        placeholder="e.g. contact@apollohospital.com"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-foreground/80">Website</label>
                      <input
                        type="text"
                        value={formData.website || ''}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0]"
                        placeholder="e.g. www.apollohospital.com"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Address & Location */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-muted/70 uppercase tracking-wider">Facility Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1 md:col-span-2">
                      <label className="text-xs font-semibold text-foreground/80">Address Line 1</label>
                      <input
                        type="text"
                        value={formData.addressLine1 || ''}
                        onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                        className="px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0]"
                        placeholder="Plot No, Street, Road"
                      />
                    </div>
                    <div className="flex flex-col gap-1 md:col-span-2">
                      <label className="text-xs font-semibold text-foreground/80">Address Line 2 (Optional)</label>
                      <input
                        type="text"
                        value={formData.addressLine2 || ''}
                        onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                        className="px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0]"
                        placeholder="Landmark, Suite, Building"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-foreground/80">Area / Locality</label>
                      <input
                        type="text"
                        value={formData.area || ''}
                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                        className="px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0]"
                        placeholder="e.g. Jubilee Hills"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-foreground/80">City</label>
                      <input
                        type="text"
                        value={formData.city || ''}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0]"
                        placeholder="e.g. Hyderabad"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-foreground/80">State</label>
                      <input
                        type="text"
                        value={formData.state || ''}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0]"
                        placeholder="e.g. Telangana"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-foreground/80">Pincode</label>
                      <input
                        type="text"
                        value={formData.pincode || ''}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        className="px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0]"
                        placeholder="e.g. 500033"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Clinical Services Tag Editor */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-muted/70 uppercase tracking-wider">Clinical Services Offered</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={serviceInput}
                      onChange={(e) => setServiceInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddService(); } }}
                      className="flex-1 px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1769E0]/20 focus:border-[#1769E0]"
                      placeholder="Type a service and click Add (e.g. Intensive Care, Cardiology)"
                    />
                    <button
                      type="button"
                      onClick={handleAddService}
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-foreground text-xs font-bold rounded-xl transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  {formData.services && formData.services.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {formData.services.map((svc, idx) => (
                        <span 
                          key={idx} 
                          className="px-2.5 py-1 bg-blue-50 text-[#1769E0] text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-blue-100"
                        >
                          {svc}
                          <button
                            type="button"
                            onClick={() => handleRemoveService(svc)}
                            className="text-blue-400 hover:text-blue-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Actions */}
                <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseEdit}
                    disabled={isSaving}
                    className="px-5 py-2.5 text-gray-600 hover:text-foreground text-sm font-semibold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#1769E0] hover:bg-[#1255b8] text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-50 transition-all"
                  >
                    {isSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
