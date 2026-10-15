import { useState, useEffect, useCallback } from "react"
import { 
  ArrowLeft, User, Phone, Mail, MapPin, Stethoscope, 
  FileCheck, Briefcase, Clock, IndianRupee, Building2, 
  Calendar, Edit3, RefreshCw, AlertCircle, FileText, CheckCircle2,
  Copy, ExternalLink, Activity, ShieldCheck, HeartPulse
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { userApi, type UserProfile } from "@/services/userApi"
import { nurseApi } from "@/services/nurseApi"
import { Skeleton } from "@/components/ui/Skeleton"
import { cn } from "@/lib/utils"

export function PersonalInformation() {
  const navigate = useNavigate();
  const { role, user, updateUser } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Real-time duty & activity stats for staff
  const [liveStats, setLiveStats] = useState<{
    visitsToday: number;
    upcoming: number;
    inProgress: number;
    completed: number;
  } | null>(null);

  const loadProfile = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const data = await userApi.getMe();
      setProfile(data);
      if (updateUser) {
        updateUser(data);
      }

      // Fetch live activity stats if nurse
      if (data.role === 'NURSE' || role === 'nurse') {
        nurseApi.getDashboard().then(dash => {
          if (dash?.stats) {
            setLiveStats(dash.stats);
          }
        }).catch(() => {});
      }
    } catch (err: any) {
      console.error("Failed to load personal info:", err);
      setError(err?.message || "Failed to load profile details.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [updateUser, role]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const activeUser = profile || (user as unknown as UserProfile | null);

  const userRole = (activeUser?.role || role || '').toLowerCase();
  const isDoctor = userRole.includes('doctor');
  const isNurse = userRole.includes('nurse');
  const isReceptionist = userRole.includes('receptionist');

  const title = activeUser?.designation 
    ? activeUser.designation 
    : (isDoctor 
        ? (activeUser?.department?.name ? `Senior Consultant - ${activeUser.department.name}` : "Senior Consultant Physician") 
        : isNurse 
          ? "Certified Home Healthcare Nurse" 
          : isReceptionist 
            ? "Front Desk Executive" 
            : "Medical Professional");

  const licenseLabel = isDoctor ? "Medical License Number" : isNurse ? "Nursing License Number" : "Staff Registration ID";

  const copyToClipboard = (text: string, label: string) => {
    if (!text || text === "Not provided") return;
    navigator.clipboard.writeText(text);
    toast(`${label} copied to clipboard!`, "success");
  };

  const formatDisplayDob = (rawDob?: string | null): string => {
    if (!rawDob) return "Not provided";
    try {
      const clean = rawDob.includes('T') ? rawDob.split('T')[0] : rawDob;
      const parts = clean.split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts;
        const dt = new Date(Number(y), Number(m) - 1, Number(d));
        if (!isNaN(dt.getTime())) {
          const ageDifMs = Date.now() - dt.getTime();
          const ageDate = new Date(ageDifMs);
          const age = Math.abs(ageDate.getUTCFullYear() - 1970);
          const dateStr = dt.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
          return `${dateStr} (${age} yrs)`;
        }
      }
      return clean;
    } catch {
      return rawDob;
    }
  };

  const formatDisplayAddress = (usr: UserProfile | null): string => {
    if (!usr) return "Not provided";
    if (usr.address) {
      try {
        const parsed = typeof usr.address === 'string' ? JSON.parse(usr.address) : usr.address;
        const addr = Array.isArray(parsed) ? parsed[0] : parsed;
        if (addr && typeof addr === 'object') {
          const parts = [addr.street, addr.city, addr.state, addr.pincode].filter(Boolean);
          if (parts.length > 0) return parts.join(', ');
        }
      } catch {
        if (typeof usr.address === 'string' && usr.address.trim()) {
          return usr.address.trim();
        }
      }
    }
    return "Not provided";
  };

  const displayDob = formatDisplayDob(activeUser?.dob || activeUser?.dateOfBirth);
  const displayAddress = formatDisplayAddress(activeUser);
  const displayGender = activeUser?.gender || "Not provided";
  const displayLicense = activeUser?.licenseNumber || activeUser?.registrationNumber || "Not provided";
  const displaySpecialization = activeUser?.specialization || activeUser?.department?.name || "Not provided";
  const displayQualification = activeUser?.qualification || activeUser?.education || "Not provided";
  
  const rawExperience = activeUser?.experienceYears !== null && activeUser?.experienceYears !== undefined 
    ? activeUser.experienceYears 
    : activeUser?.experience;
  const displayExperience = (rawExperience !== null && rawExperience !== undefined && !Number.isNaN(Number(rawExperience)))
    ? `${rawExperience} Years`
    : "Not provided";

  const hospitalName = activeUser?.hospital?.name || activeUser?.hospitalName || "SM_Hospital";
  const hospitalType = activeUser?.hospital?.facilityType || activeUser?.hospital?.businessType || 'Multi-Specialty Hospital';
  const hospitalReg = activeUser?.hospital?.registrationNumber || activeUser?.registrationNumber || "8225337856578";
  const hospitalDept = activeUser?.department?.name || (activeUser?.specialization ? activeUser.specialization : "General Care & Field Services");
  const hospitalPhone = activeUser?.hospital?.contactPhone || activeUser?.hospitalPhone || "+91 98765 43210";
  const hospitalEmail = activeUser?.hospital?.contactEmail || activeUser?.hospitalEmail || "gorkalsreenu10@gmail.com";
  const hospitalAddress = activeUser?.hospitalAddress || [
    activeUser?.hospital?.addressLine1,
    activeUser?.hospital?.area,
    activeUser?.hospital?.city,
    activeUser?.hospital?.state,
    activeUser?.hospital?.pincode,
  ].filter(Boolean).join(', ') || "Plot 42, Health City, Road No 1, 4/442, Hyderabad, Telangana, 500034";

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/30 pb-32 sm:pb-28">
      
      {/* Sticky Top Header */}
      <div className="sticky top-0 z-30 pt-4 pb-3 px-4 flex items-center justify-between bg-surface/95 backdrop-blur-xl border-b border-border shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 rounded-xl text-muted hover:text-[#0A1A3D] hover:bg-gray-100 transition-colors cursor-pointer"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-[#0A1A3D]" />
          </button>
          <div>
            <h1 className="text-[19px] font-black text-[#0A1A3D] tracking-tight">Personal Information</h1>
            <p className="text-[12px] text-muted font-medium">Real-time profile, credentials & hospital details</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => loadProfile(true)}
            disabled={isRefreshing}
            title="Refresh Real-Time Data"
            className="p-2.5 text-muted hover:text-[#0A1A3D] rounded-xl hover:bg-gray-100 border border-border bg-surface transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={cn("w-4 h-4", (isLoading || isRefreshing) && "animate-spin text-[#1769E0]")} />
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4 max-w-2xl mx-auto w-full">
        {isLoading && !profile && (
          <div className="flex flex-col gap-4">
            <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm flex flex-col items-center gap-3">
              <Skeleton className="w-24 h-24 rounded-full" />
              <Skeleton className="w-40 h-6 rounded-lg" />
              <Skeleton className="w-28 h-4 rounded-md" />
            </div>
            <div className="bg-surface rounded-2xl p-4 border border-border shadow-sm flex flex-col gap-3">
              <Skeleton className="w-full h-12 rounded-xl" />
              <Skeleton className="w-full h-12 rounded-xl" />
              <Skeleton className="w-full h-12 rounded-xl" />
            </div>
          </div>
        )}

        {!isLoading && error && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-2xl flex flex-col items-center text-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <h3 className="text-base font-bold text-gray-900">Failed to Load Profile</h3>
            <p className="text-xs text-red-700">{error}</p>
            <button
              onClick={() => loadProfile()}
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {!error && activeUser && (
          <>
            {/* Top Identity Card */}
            <motion.div 
              initial={{ opacity: 0, y: 8 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="bg-surface rounded-2xl p-6 border border-border/80 shadow-sm flex flex-col items-center text-center relative overflow-hidden"
            >
              {/* Avatar with Ring */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1769E0] to-blue-700 text-white flex items-center justify-center text-3xl font-black mb-3 border-4 border-blue-50 shadow-md">
                {activeUser.name ? activeUser.name.charAt(0).toUpperCase() : <User className="w-12 h-12" />}
              </div>

              <div className="flex items-center gap-1.5 justify-center">
                <h2 className="text-[20px] font-black text-[#0A1A3D] tracking-tight">
                  {activeUser.name || "Not provided"}
                </h2>
                <ShieldCheck className="w-4 h-4 text-[#1769E0]" title="Verified Staff" />
              </div>

              <p className="text-[13px] text-[#1769E0] font-bold mt-0.5">
                {title}
              </p>

              {/* Status Badges */}
              <div className="flex items-center gap-2 mt-2.5 flex-wrap justify-center">
                <span className="bg-blue-50 text-[#1769E0] text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-blue-200">
                  {isReceptionist ? "Receptionist" : activeUser.role?.replace('_', ' ')}
                </span>
                
                <span className={cn(
                  "text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5",
                  activeUser.active !== false
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-red-50 text-red-700 border-red-200"
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", activeUser.active !== false ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
                  {activeUser.active !== false ? "Active Account" : "Inactive"}
                </span>

                {isNurse && (
                  <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                    On Duty Shift
                  </span>
                )}
              </div>
            </motion.div>

            {/* Real-Time Duty & Activity Stats (Live Database Data) */}
            {isNurse && liveStats && (
              <motion.div 
                initial={{ opacity: 0, y: 8 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.04 }}
                className="bg-surface rounded-2xl border border-border/80 shadow-sm p-4 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                  <div className="flex items-center gap-1.5 text-xs font-black text-[#0A1A3D] uppercase tracking-wider">
                    <Activity className="w-3.5 h-3.5 text-[#1769E0]" />
                    <span>Real-Time Activity Overview</span>
                  </div>
                  <span className="text-[11px] font-bold text-muted">Live from Database</span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div 
                    onClick={() => navigate('/nurse/visits', { state: { tab: 'today' } })}
                    className="p-2.5 rounded-xl bg-blue-50/50 border border-blue-100 hover:bg-blue-100/50 cursor-pointer transition-colors"
                  >
                    <span className="text-[18px] font-black text-[#1769E0] block leading-tight">{liveStats.visitsToday}</span>
                    <span className="text-[10px] font-bold text-muted uppercase">Today</span>
                  </div>
                  <div 
                    onClick={() => navigate('/nurse/visits', { state: { tab: 'in_progress' } })}
                    className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-200 hover:bg-amber-100/50 cursor-pointer transition-colors"
                  >
                    <span className="text-[18px] font-black text-amber-600 block leading-tight">{liveStats.inProgress}</span>
                    <span className="text-[10px] font-bold text-muted uppercase">Active</span>
                  </div>
                  <div 
                    onClick={() => navigate('/nurse/visits', { state: { tab: 'upcoming' } })}
                    className="p-2.5 rounded-xl bg-indigo-50/50 border border-indigo-100 hover:bg-indigo-100/50 cursor-pointer transition-colors"
                  >
                    <span className="text-[18px] font-black text-indigo-600 block leading-tight">{liveStats.upcoming}</span>
                    <span className="text-[10px] font-bold text-muted uppercase">Upcoming</span>
                  </div>
                  <div 
                    onClick={() => navigate('/nurse/visits', { state: { tab: 'history' } })}
                    className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 hover:bg-emerald-100/50 cursor-pointer transition-colors"
                  >
                    <span className="text-[18px] font-black text-emerald-600 block leading-tight">{liveStats.completed}</span>
                    <span className="text-[10px] font-bold text-muted uppercase">Finished</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Contact & Personal Identity Card */}
            <motion.div 
              initial={{ opacity: 0, y: 8 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.08 }} 
              className="bg-surface rounded-2xl border border-border/80 shadow-sm overflow-hidden"
            >
              <div className="px-4 py-3 bg-muted/5 border-b border-border flex items-center justify-between">
                <h3 className="text-xs font-black text-[#0A1A3D] uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#1769E0]" />
                  Contact & Identity Details
                </h3>
                <button
                  onClick={() => navigate('/profile/edit')}
                  className="text-[11px] font-extrabold text-[#1769E0] hover:underline"
                >
                  Edit
                </button>
              </div>

              {/* Email */}
              <div className="p-3.5 border-b border-border/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1769E0] border border-blue-100 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Email Address</p>
                    <p className="font-bold text-[#0A1A3D] text-[13px] truncate">{activeUser.email || "Not provided"}</p>
                  </div>
                </div>
                {activeUser.email && (
                  <button 
                    onClick={() => copyToClipboard(activeUser.email, "Email")}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-muted hover:text-[#0A1A3D] transition-colors"
                    title="Copy Email"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Phone */}
              <div className="p-3.5 border-b border-border/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1769E0] border border-blue-100 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Phone Number</p>
                    <p className="font-bold text-[#0A1A3D] text-[13px]">{activeUser.phone || "Not provided"}</p>
                  </div>
                </div>
                {activeUser.phone && (
                  <div className="flex items-center gap-1">
                    <a
                      href={`tel:${activeUser.phone}`}
                      className="px-2 py-1 bg-blue-50 text-[#1769E0] rounded-lg text-[11px] font-extrabold hover:bg-blue-100 transition-colors"
                    >
                      Call
                    </a>
                    <button 
                      onClick={() => copyToClipboard(activeUser.phone || '', "Phone number")}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-muted hover:text-[#0A1A3D] transition-colors"
                      title="Copy Phone"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* DOB */}
              <div className="p-3.5 border-b border-border/60 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1769E0] border border-blue-100 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Date of Birth</p>
                  <p className="font-bold text-[#0A1A3D] text-[13px]">{displayDob}</p>
                </div>
              </div>

              {/* Gender */}
              <div className="p-3.5 border-b border-border/60 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1769E0] border border-blue-100 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Gender</p>
                  <p className="font-bold text-[#0A1A3D] text-[13px]">{displayGender}</p>
                </div>
              </div>

              {/* Personal Residential Address */}
              <div className="p-3.5 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1769E0] border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Residential Address</p>
                    <p className="font-semibold text-[#0A1A3D] text-[13px] leading-relaxed mt-0.5">
                      {displayAddress}
                    </p>
                  </div>
                </div>
                {displayAddress !== "Not provided" && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(displayAddress)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-[#1769E0] hover:bg-blue-50 rounded-lg shrink-0 transition-colors"
                    title="View on Map"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </motion.div>

            {/* Nurse Professional & Clinical Credentials Card */}
            {isNurse && (
              <motion.div 
                initial={{ opacity: 0, y: 8 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.12 }} 
                className="bg-surface rounded-2xl border border-border/80 shadow-sm overflow-hidden"
              >
                <div className="px-4 py-3 bg-muted/5 border-b border-border flex items-center justify-between">
                  <h3 className="text-xs font-black text-[#0A1A3D] uppercase tracking-wider flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-[#1769E0]" />
                    Nursing & Clinical Credentials
                  </h3>
                  <button
                    onClick={() => navigate('/profile/edit')}
                    className="text-[11px] font-extrabold text-[#1769E0] hover:underline"
                  >
                    Edit
                  </button>
                </div>

                {/* Designation */}
                <div className="p-3.5 border-b border-border/60 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Designation</p>
                    <p className="font-extrabold text-[#0A1A3D] text-[13px]">{activeUser.designation || "MLT (ICU)"}</p>
                  </div>
                </div>

                {/* License Number with Copy */}
                <div className="p-3.5 border-b border-border/60 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-muted uppercase tracking-wider">{licenseLabel}</p>
                      <p className="font-mono font-extrabold text-[#0A1A3D] text-[13px]">{displayLicense}</p>
                    </div>
                  </div>
                  {displayLicense !== "Not provided" && (
                    <button 
                      onClick={() => copyToClipboard(displayLicense, "License number")}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-muted hover:text-[#0A1A3D] transition-colors"
                      title="Copy License Number"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Specialization */}
                <div className="p-3.5 border-b border-border/60 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Specialization</p>
                    <p className="font-bold text-[#0A1A3D] text-[13px]">{displaySpecialization}</p>
                  </div>
                </div>

                {/* Qualification */}
                <div className="p-3.5 border-b border-border/60 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Qualification</p>
                    <p className="font-bold text-[#0A1A3D] text-[13px]">{displayQualification}</p>
                  </div>
                </div>

                {/* Experience */}
                <div className="p-3.5 border-b border-border/60 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Clinical Experience</p>
                    <p className="font-bold text-[#0A1A3D] text-[13px]">{displayExperience}</p>
                  </div>
                </div>

                {/* Bio / About Nurse */}
                {activeUser.bio && (
                  <div className="p-3.5 flex items-start gap-3 bg-amber-50/20">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-muted uppercase tracking-wider">About Nurse</p>
                      <p className="text-[#0A1A3D] text-[12px] leading-relaxed mt-0.5 font-medium">{activeUser.bio}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Doctor Clinical Information Card */}
            {isDoctor && (
              <motion.div 
                initial={{ opacity: 0, y: 8 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.12 }} 
                className="bg-surface rounded-2xl border border-border/80 shadow-sm overflow-hidden"
              >
                <div className="px-4 py-3 bg-muted/5 border-b border-border flex items-center justify-between">
                  <h3 className="text-xs font-black text-[#0A1A3D] uppercase tracking-wider flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-[#1769E0]" />
                    Clinical Credentials
                  </h3>
                  <button onClick={() => navigate('/profile/edit')} className="text-[11px] font-extrabold text-[#1769E0] hover:underline">
                    Edit
                  </button>
                </div>

                <div className="p-3.5 border-b border-border/60 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-muted uppercase tracking-wider">{licenseLabel}</p>
                      <p className="font-mono font-extrabold text-[#0A1A3D] text-[13px]">{displayLicense}</p>
                    </div>
                  </div>
                  {displayLicense !== "Not provided" && (
                    <button onClick={() => copyToClipboard(displayLicense, "License number")} className="p-1.5 hover:bg-gray-100 rounded-lg text-muted">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="p-3.5 border-b border-border/60 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Specialization</p>
                    <p className="font-bold text-[#0A1A3D] text-[13px]">{displaySpecialization}</p>
                  </div>
                </div>

                <div className="p-3.5 border-b border-border/60 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Qualification</p>
                    <p className="font-bold text-[#0A1A3D] text-[13px]">{displayQualification}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2">
                  <div className="p-3.5 border-r border-border/60 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Experience</p>
                      <p className="font-bold text-[#0A1A3D] text-[13px]">{displayExperience}</p>
                    </div>
                  </div>
                  <div className="p-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
                      <IndianRupee className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-muted uppercase tracking-wider">OP Fee</p>
                      <p className="font-bold text-[#0A1A3D] text-[13px]">₹{activeUser.consultationFee || 500}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Hospital Facility Affiliation Card */}
            <motion.div 
              initial={{ opacity: 0, y: 8 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.16 }} 
              className="bg-surface rounded-2xl border border-border/80 shadow-sm overflow-hidden"
            >
              <div className="px-4 py-3 bg-muted/5 border-b border-border flex items-center justify-between">
                <h3 className="text-xs font-black text-[#0A1A3D] uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#1769E0]" />
                  Hospital Information
                </h3>
                <span className="text-[11px] font-bold text-muted">Affiliated Facility</span>
              </div>

              {/* Hospital Name & Type */}
              <div className="p-3.5 border-b border-border/60 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Hospital Name</p>
                  <p className="font-black text-[#0A1A3D] text-[14px] mt-0.5">{hospitalName}</p>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1769E0] font-extrabold border border-blue-200">
                  {hospitalType}
                </span>
              </div>

              {/* Registration Number */}
              {hospitalReg && (
                <div className="p-3.5 border-b border-border/60 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Registration Number</p>
                    <p className="font-mono font-extrabold text-[#0A1A3D] text-[13px]">{hospitalReg}</p>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(hospitalReg, "Hospital Registration")}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-muted hover:text-[#0A1A3D] transition-colors"
                    title="Copy Reg Number"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Assigned Department */}
              <div className="p-3.5 border-b border-border/60 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Assigned Department</p>
                  <p className="font-bold text-[#0A1A3D] text-[13px]">{hospitalDept}</p>
                </div>
                {activeUser.department?.code && (
                  <span className="text-[11px] font-mono font-bold text-[#1769E0] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {activeUser.department.code}
                  </span>
                )}
              </div>

              {/* Hospital Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-border/60">
                {hospitalPhone && (
                  <div className="p-3.5 border-b sm:border-b-0 sm:border-r border-border/60 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Phone className="w-4 h-4 text-muted shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-muted uppercase">Hospital Phone</p>
                        <p className="font-bold text-[#0A1A3D] text-[12px] truncate">{hospitalPhone}</p>
                      </div>
                    </div>
                    <a href={`tel:${hospitalPhone}`} className="text-[11px] font-extrabold text-[#1769E0] hover:underline shrink-0 ml-1">
                      Call
                    </a>
                  </div>
                )}
                {hospitalEmail && (
                  <div className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Mail className="w-4 h-4 text-muted shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-muted uppercase">Hospital Email</p>
                        <p className="font-bold text-[#0A1A3D] text-[12px] truncate">{hospitalEmail}</p>
                      </div>
                    </div>
                    <a href={`mailto:${hospitalEmail}`} className="text-[11px] font-extrabold text-[#1769E0] hover:underline shrink-0 ml-1">
                      Email
                    </a>
                  </div>
                )}
              </div>

              {/* Hospital Address */}
              <div className="p-3.5 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <MapPin className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-muted uppercase">Hospital Facility Address</p>
                    <p className="text-[12px] text-[#475467] font-medium leading-relaxed mt-0.5">
                      {hospitalAddress}
                    </p>
                  </div>
                </div>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(hospitalAddress)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-[#1769E0] hover:bg-blue-50 rounded-lg shrink-0 transition-colors"
                  title="View Hospital on Map"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </motion.div>

            {/* Bottom Edit Action Button */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="pt-2">
              <button 
                onClick={() => navigate('/profile/edit')} 
                className="w-full bg-[#1769E0] text-white p-3.5 rounded-xl font-extrabold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-md shadow-[#1769E0]/20 active:scale-[0.99] transition-all cursor-pointer text-[14px]"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Information</span>
              </button>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
