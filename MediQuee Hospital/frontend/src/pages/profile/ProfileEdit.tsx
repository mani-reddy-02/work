import { useState, useEffect, useCallback } from "react"
import { 
  ArrowLeft, User, Camera, Save, Briefcase, Stethoscope, 
  FileCheck, IndianRupee, Clock, RefreshCw, AlertCircle, CheckCircle2
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
  const primaryColor = isDoctor ? "bg-[#1B5DF1] hover:bg-[#1B5DF1]/90" : "bg-[#1769E0] hover:bg-[#1255b8]";
  const primaryText = isDoctor ? "text-[#1B5DF1]" : "text-[#1769E0]";
  const primaryBgSoft = isDoctor ? "bg-[#1B5DF1]/10" : "bg-[#1769E0]/10";

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Form states
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');

  // Doctor professional fields (client state until erx/schedule module)
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
      const updated = await userApi.updateMe({
        name: name.trim(),
        phone: phone.trim() || undefined,
      });

      setProfile(updated);
      setName(updated.name);
      setPhone(updated.phone || '');

      // Immediately synchronize local auth context
      if (updateUser) {
        updateUser({
          name: updated.name,
          phone: updated.phone || '',
        });
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
    <div className="flex flex-col bg-background/70 min-h-[calc(100vh-80px)] pb-12">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md pt-4 pb-3 px-4 border-b border-border flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 text-muted hover:text-foreground transition-colors rounded-xl hover:bg-gray-100 active:scale-95"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Edit Profile</h1>
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
              onClick={fetchUserProfile}
              className="mt-2 flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
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
                <div className={cn("w-24 h-24 rounded-full flex items-center justify-center border-4 border-white shadow-md overflow-hidden", primaryBgSoft, primaryText)}>
                  <User className="w-10 h-10" />
                </div>
                <button 
                  type="button"
                  title="Change avatar"
                  className={cn("absolute bottom-0 right-0 w-8 h-8 text-white rounded-full flex items-center justify-center border-2 border-white transition-colors shadow-sm cursor-pointer", primaryColor)}
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div className="text-center">
                <h2 className="text-base font-bold text-foreground">{profile.name}</h2>
                <p className="text-xs text-muted capitalize">{profile.role?.toLowerCase().replace('_', ' ')}</p>
              </div>
            </div>

            {/* Basic Information Card */}
            <div className="bg-surface rounded-2xl border border-border shadow-sm p-5 flex flex-col gap-4">
              <h3 className="font-bold text-[#0A1A3D] text-sm border-b border-border pb-2 uppercase tracking-wider">
                Account Information
              </h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground/80">Full Name *</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name" 
                  className={cn(
                    "bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all", 
                    isDoctor ? "focus:border-[#1B5DF1] focus:ring-[#1B5DF1]/20" : "focus:border-[#1769E0] focus:ring-[#1769E0]/20"
                  )} 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground/80">Email Address (Managed by System)</label>
                <input 
                  type="email" 
                  value={profile.email} 
                  disabled 
                  className="bg-gray-100 border border-border rounded-xl px-3.5 py-2.5 text-sm text-muted cursor-not-allowed select-none font-medium" 
                />
                <span className="text-[11px] text-muted/70">Account login email cannot be changed from this screen.</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground/80">Phone Number</label>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210" 
                  className={cn(
                    "bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all", 
                    isDoctor ? "focus:border-[#1B5DF1] focus:ring-[#1B5DF1]/20" : "focus:border-[#1769E0] focus:ring-[#1769E0]/20"
                  )} 
                />
              </div>
            </div>

            {/* Doctor Professional Details (Rendered if user is a DOCTOR) */}
            {isDoctor && (
              <div className="bg-surface rounded-2xl border border-border shadow-sm p-5 flex flex-col gap-4">
                <h3 className="font-bold text-[#0A1A3D] text-sm border-b border-border pb-2 uppercase tracking-wider">
                  Professional Credentials
                </h3>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-muted/70" /> Medical License Number
                  </label>
                  <input 
                    type="text" 
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="e.g. TSMC-44921" 
                    className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20" 
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-muted/70" /> Primary Specialization
                  </label>
                  <input 
                    type="text" 
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. Senior Cardiologist" 
                    className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20" 
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-muted/70" /> Educational Qualification
                  </label>
                  <input 
                    type="text" 
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    placeholder="e.g. MBBS, MD (Medicine), DM" 
                    className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-muted/70" /> Experience (Years)
                    </label>
                    <input 
                      type="number" 
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="e.g. 12" 
                      className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20" 
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                      <IndianRupee className="w-4 h-4 text-muted/70" /> Consultation Fee (₹)
                    </label>
                    <input 
                      type="number" 
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(e.target.value)}
                      placeholder="e.g. 500" 
                      className="bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1B5DF1] focus:ring-2 focus:ring-[#1B5DF1]/20" 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <button 
              type="submit"
              disabled={isSaving}
              className={cn(
                "text-white font-bold rounded-xl py-3.5 px-6 flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer", 
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
          </form>
        )}
      </div>
    </div>
  )
}
