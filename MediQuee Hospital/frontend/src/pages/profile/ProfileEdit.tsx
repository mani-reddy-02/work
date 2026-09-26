import { useState, useEffect, useCallback } from "react"
import { 
  ArrowLeft, User, Camera, Save, Briefcase, Stethoscope, 
  FileCheck, IndianRupee, Clock, RefreshCw, AlertCircle, 
  MapPin, Phone, Mail, Calendar, FileText, Building2, CheckCircle2
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { userApi, type UserProfile } from "@/services/userApi"
import { useToast } from "@/context/ToastContext"
import { Skeleton } from "@/components/ui/Skeleton"
import { cn } from "@/lib/utils"

export function ProfileEdit() {
  const navigate = useNavigate();
  const { role, updateUser } = useAuth();
  const { toast } = useToast();

  const isDoctor = role === 'doctor';
  const isNurse = role === 'nurse';
  const primaryColor = (isDoctor || isNurse) ? "bg-[#1B5DF1] hover:bg-[#1B5DF1]/90" : "bg-[#1769E0] hover:bg-[#1255b8]";
  const primaryText = (isDoctor || isNurse) ? "text-[#1B5DF1]" : "text-[#1769E0]";
  const primaryBgSoft = (isDoctor || isNurse) ? "bg-[#1B5DF1]/10" : "bg-[#1769E0]/10";

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Form states
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [dob, setDob] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [designation, setDesignation] = useState<string>('');
  const [bio, setBio] = useState<string>('');

  // Doctor professional fields
  const [licenseNumber, setLicenseNumber] = useState<string>('');
  const [specialization, setSpecialization] = useState<string>('');
  const [qualification, setQualification] = useState<string>('');
  const [experience, setExperience] = useState<string>('');
  const [consultationFee, setConsultationFee] = useState<string>('');

  const fetchUserProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await userApi.getMe();
      setProfile(data);
      setName(data.name || '');
      setPhone(data.phone || '');
      setGender(data.gender || '');
      setDob(data.dob || '');
      setAddress(data.address || '');
      setDesignation(data.designation || '');
      setBio(data.bio || '');
      setLicenseNumber(data.licenseNumber || '');
      setSpecialization(data.specialization || '');
      setQualification(data.qualification || '');
      setExperience(data.experienceYears !== null && data.experienceYears !== undefined ? String(data.experienceYears) : '');
      setConsultationFee(data.consultationFee !== null && data.consultationFee !== undefined ? String(data.consultationFee) : '');
    } catch (err: any) {
      console.error("Failed to load user profile:", err);
      setError(err?.message || "Failed to load account details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast("Name cannot be empty", "error");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim() || undefined,
        gender: gender || null,
        dob: dob || null,
        address: address.trim() || null,
        designation: designation.trim() || null,
        bio: bio.trim() || null,
        ...(isDoctor || isNurse ? {
          licenseNumber: licenseNumber.trim() || null,
          specialization: specialization.trim() || null,
          qualification: qualification.trim() || null,
          experienceYears: experience ? Number(experience) : null,
          ...(isDoctor ? { consultationFee: consultationFee ? Number(consultationFee) : null } : {}),
        } : {}),
      };

      const updated = await userApi.updateMe(payload);

      setProfile(updated);
      setName(updated.name || '');
      setPhone(updated.phone || '');
      setGender(updated.gender || '');
      setDob(updated.dob || '');
      setAddress(updated.address || '');
      setDesignation(updated.designation || '');
      setBio(updated.bio || '');
      setLicenseNumber(updated.licenseNumber || '');
      setSpecialization(updated.specialization || '');
      setQualification(updated.qualification || '');
      setExperience(updated.experienceYears !== null && updated.experienceYears !== undefined ? String(updated.experienceYears) : '');
      setConsultationFee(updated.consultationFee !== null && updated.consultationFee !== undefined ? String(updated.consultationFee) : '');

      // Immediately synchronize local auth context
      if (updateUser) {
        updateUser(updated);
      }

      toast("Profile updated successfully", "success");
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      toast(err?.message || "Failed to update profile. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col bg-background min-h-screen pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md pt-4 pb-3 px-4 border-b border-border flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 text-muted hover:text-foreground transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 cursor-pointer"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Edit Profile</h1>
            <p className="text-xs text-muted">Update your personal and clinical details</p>
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-6 max-w-2xl mx-auto w-full">
        {/* Loading Skeleton */}
        {isLoading && (
          <div className="flex flex-col gap-5">
            <div className="flex justify-center mt-3">
              <Skeleton className="w-24 h-24 rounded-full" />
            </div>
            <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 flex flex-col gap-4">
              <Skeleton className="w-32 h-5 rounded-lg" />
              <Skeleton className="w-full h-11 rounded-xl" />
              <Skeleton className="w-full h-11 rounded-xl" />
              <Skeleton className="w-full h-11 rounded-xl" />
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="p-6 bg-red-50/70 border border-red-200/80 rounded-2xl flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">Unable to Load Profile</h3>
            <p className="text-xs text-gray-600">{error}</p>
            <button
              type="button"
              onClick={fetchUserProfile}
              className="mt-2 flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Edit Form */}
        {!isLoading && profile && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Avatar Header */}
            <div className="flex flex-col items-center gap-3 mt-2">
              <div className="relative">
                <div className={cn("w-24 h-24 rounded-full flex items-center justify-center border-4 border-surface shadow-md overflow-hidden", primaryBgSoft, primaryText)}>
                  <User className="w-12 h-12" />
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-lg font-bold text-foreground">{profile.name}</h2>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#1B5DF1] border border-blue-200 uppercase tracking-wider">
                    {profile.role?.toLowerCase().replace('_', ' ')}
                  </span>
                  {profile.department?.name && (
                    <span className="text-xs font-medium text-muted">
                      • {profile.department.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Basic Information Card */}
            <div className="bg-surface rounded-2xl border border-border shadow-sm p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <h3 className="font-bold text-foreground text-sm uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-[#1B5DF1]" />
                  Personal Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-foreground/80">Full Name *</label>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. John Doe" 
                    className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 transition-all font-medium" 
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-muted" /> Email Address
                  </label>
                  <input 
                    type="email" 
                    value={profile.email} 
                    disabled 
                    className="bg-gray-100 dark:bg-gray-800/50 border border-border rounded-xl px-3.5 py-2.5 text-sm text-muted cursor-not-allowed select-none font-medium" 
                  />
                  <span className="text-[10px] text-muted">Managed by hospital administration</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-muted" /> Phone Number
                  </label>
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210" 
                    className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 transition-all font-medium" 
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground/80">Gender</label>
                  <select 
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 transition-all font-medium cursor-pointer"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted" /> Date of Birth
                  </label>
                  <input 
                    type="date" 
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 transition-all font-medium"
                  />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-muted" /> Clinic / Residential Address
                  </label>
                  <input 
                    type="text" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Suite 402, MediQuee Hospital, Road No. 2, Banjara Hills" 
                    className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 transition-all font-medium" 
                  />
                </div>
              </div>
            </div>

            {/* Doctor Professional Details */}
            {isDoctor && (
              <div className="bg-surface rounded-2xl border border-border shadow-sm p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <h3 className="font-bold text-foreground text-sm uppercase tracking-wider flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-[#1B5DF1]" />
                    Professional & Clinical Details
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-muted" /> Clinical Designation
                    </label>
                    <input 
                      type="text" 
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Senior Consultant / Specialist" 
                      className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 font-medium" 
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-muted" /> Medical License Number
                    </label>
                    <input 
                      type="text" 
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="e.g. TSMC-44921 / MCI-88320" 
                      className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 font-medium" 
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-muted" /> Primary Specialization
                    </label>
                    <input 
                      type="text" 
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      placeholder="e.g. General Medicine, Cardiology" 
                      className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 font-medium" 
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-muted" /> Educational Qualification
                    </label>
                    <input 
                      type="text" 
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      placeholder="e.g. MBBS, MD (General Medicine)" 
                      className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 font-medium" 
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-muted" /> Clinical Experience (Years)
                    </label>
                    <input 
                      type="number" 
                      min="0"
                      max="70"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="e.g. 10" 
                      className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 font-medium" 
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5 text-muted" /> Consultation Fee (₹)
                    </label>
                    <input 
                      type="number" 
                      min="0"
                      step="50"
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(e.target.value)}
                      placeholder="e.g. 500" 
                      className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 font-medium" 
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-muted" /> About Doctor / Bio
                    </label>
                    <textarea 
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Brief description about your clinical practice, expertise, and patient approach..."
                      className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 font-medium resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Nurse Professional Details */}
            {isNurse && (
              <div className="bg-surface rounded-2xl border border-border shadow-sm p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <h3 className="font-bold text-foreground text-sm uppercase tracking-wider flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-[#1B5DF1]" />
                    Nursing Credentials
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-muted" /> Designation
                    </label>
                    <input 
                      type="text" 
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Staff Nurse / Senior Nurse" 
                      className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 font-medium" 
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-muted" /> Nursing License Number
                    </label>
                    <input 
                      type="text" 
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="e.g. RN-12345" 
                      className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 font-medium" 
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-muted" /> Specialization
                    </label>
                    <input 
                      type="text" 
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      placeholder="e.g. Home Care, ICU, Pediatric" 
                      className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 font-medium" 
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-muted" /> Qualification
                    </label>
                    <input 
                      type="text" 
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      placeholder="e.g. B.Sc Nursing, GNM" 
                      className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 font-medium" 
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-muted" /> Experience (Years)
                    </label>
                    <input 
                      type="number" 
                      min="0"
                      max="50"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="e.g. 5" 
                      className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 font-medium" 
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-muted" /> About / Bio
                    </label>
                    <textarea 
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Brief description about your nursing experience and specialization..."
                      className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20 font-medium resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Hospital & Department Affiliation */}
            {profile.hospital && (
              <div className="bg-surface rounded-2xl border border-border shadow-sm p-5 flex flex-col gap-3">
                <h3 className="font-bold text-foreground text-sm uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2.5">
                  <Building2 className="w-4 h-4 text-[#1B5DF1]" />
                  Facility Affiliation
                </h3>
                <div className="flex items-center justify-between text-sm py-1">
                  <span className="text-muted font-medium">Hospital</span>
                  <span className="font-bold text-foreground">{profile.hospital.name}</span>
                </div>
                {profile.department && (
                  <div className="flex items-center justify-between text-sm py-1 border-t border-border/50">
                    <span className="text-muted font-medium">Assigned Department</span>
                    <span className="font-bold text-[#1B5DF1]">{profile.department.name}</span>
                  </div>
                )}
                {profile.hospital.city && (
                  <div className="flex items-center justify-between text-sm py-1 border-t border-border/50">
                    <span className="text-muted font-medium">Location</span>
                    <span className="font-medium text-foreground">{profile.hospital.city}, {profile.hospital.state}</span>
                  </div>
                )}
              </div>
            )}

            {/* Save Button */}
            <div className="pt-2 pb-16">
              <button 
                type="submit"
                disabled={isSaving}
                className={cn(
                  "w-full text-white font-bold rounded-xl py-3.5 px-6 flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer text-sm", 
                  primaryColor
                )}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
