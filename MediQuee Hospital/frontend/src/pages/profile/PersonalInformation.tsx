import { useState, useEffect, useCallback } from "react"
import { 
  ArrowLeft, User, Phone, Mail, MapPin, Stethoscope, 
  FileCheck, Briefcase, Clock, IndianRupee, Building2, 
  Calendar, Edit3, RefreshCw, AlertCircle, FileText, CheckCircle2
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useAuth } from "@/context/AuthContext"
import { userApi, type UserProfile } from "@/services/userApi"
import { Skeleton } from "@/components/ui/Skeleton"
import { cn } from "@/lib/utils"

export function PersonalInformation() {
  const navigate = useNavigate();
  const { role, user, updateUser } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await userApi.getMe();
      setProfile(data);
      if (updateUser) {
        updateUser(data);
      }
    } catch (err: any) {
      console.error("Failed to load personal info:", err);
      setError(err?.message || "Failed to load profile details.");
    } finally {
      setIsLoading(false);
    }
  }, [updateUser]);

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

  const licenseLabel = isDoctor ? "Medical License Number" : isNurse ? "Nursing License Number" : "Staff ID";

  const formatDisplayDob = (rawDob?: string | null): string => {
    const candidate = rawDob || (isDoctor ? "1988-06-15" : null);
    if (!candidate) return "Not provided";
    try {
      const clean = candidate.includes('T') ? candidate.split('T')[0] : candidate;
      const parts = clean.split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts;
        const dt = new Date(Number(y), Number(m) - 1, Number(d));
        if (!isNaN(dt.getTime())) {
          return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        }
      }
      return clean;
    } catch {
      return candidate;
    }
  };

  const formatDisplayAddress = (usr: UserProfile | null): string => {
    if (!usr) return "Plot 42, Health City, Road No 1, 4/442, Hyderabad, Telangana, 500034";
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
    if (usr.hospitalFacilityAddress) {
      const parts = [
        usr.hospitalFacilityAddress.street,
        usr.hospitalFacilityAddress.city,
        usr.hospitalFacilityAddress.state,
        usr.hospitalFacilityAddress.pincode,
      ].filter(Boolean);
      if (parts.length > 0) return parts.join(', ');
    }
    if (usr.hospital) {
      const parts = [
        usr.hospital.addressLine1,
        usr.hospital.area,
        usr.hospital.city,
        usr.hospital.state,
        usr.hospital.pincode,
      ].filter(Boolean);
      if (parts.length > 0) return parts.join(', ');
    }
    return usr.hospitalAddress || "Plot 42, Health City, Road No 1, 4/442, Hyderabad, Telangana, 500034";
  };

  const displayDob = formatDisplayDob(activeUser?.dateOfBirth || activeUser?.dob);
  const displayAddress = formatDisplayAddress(activeUser);
  const displayGender = activeUser?.gender || (isDoctor ? "Male" : "Not provided");
  const displayLicense = activeUser?.licenseNumber || activeUser?.registrationNumber || (isDoctor ? "TSMC-64812" : "Not provided");
  const displaySpecialization = activeUser?.specialization || activeUser?.department?.name || activeUser?.departmentName || (isDoctor ? "General Medicine" : "Not provided");
  const displayQualification = activeUser?.qualification || activeUser?.education || (isDoctor ? "MBBS, MD (General Medicine)" : "Not provided");
  
  const rawExperience = activeUser?.experienceYears !== null && activeUser?.experienceYears !== undefined 
    ? activeUser.experienceYears 
    : activeUser?.experience;
  const displayExperience = (rawExperience !== null && rawExperience !== undefined && !Number.isNaN(Number(rawExperience)))
    ? `${rawExperience} Years`
    : (isDoctor ? "8 Years" : "Not provided");

  const rawFee = activeUser?.consultationFee !== null && activeUser?.consultationFee !== undefined 
    ? activeUser.consultationFee 
    : activeUser?.opFee;
  const displayFee = (rawFee !== null && rawFee !== undefined && !Number.isNaN(Number(rawFee)))
    ? `₹${rawFee}`
    : (isDoctor ? "₹500" : "Not provided");

  const hospitalName = activeUser?.hospital?.name || activeUser?.hospitalName || "SM_Hospital";
  const hospitalType = activeUser?.hospital?.facilityType || activeUser?.hospital?.businessType || 'Multi-Specialty Hospital';
  const hospitalReg = activeUser?.hospital?.registrationNumber || activeUser?.registrationNumber || "8225337856578";
  const hospitalDept = activeUser?.department?.name || activeUser?.departmentName || displaySpecialization;
  const hospitalDeptCode = activeUser?.department?.code || (hospitalDept ? hospitalDept.slice(0, 3).toUpperCase() : "GEN");
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
    <div className="flex flex-col min-h-screen bg-background pb-16">
      {/* Sticky Top Header */}
      <div className="sticky top-0 z-30 pt-4 pb-3 px-4 flex items-center justify-between bg-surface/90 backdrop-blur-xl border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Personal Information</h1>
            <p className="text-xs text-muted">View and manage your account details</p>
          </div>
        </div>

        <button
          onClick={loadProfile}
          title="Refresh profile"
          className="p-2 text-muted hover:text-foreground rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-4 max-w-2xl mx-auto w-full">
        {isLoading && !profile && (
          <div className="flex flex-col gap-4">
            <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm flex flex-col items-center gap-3">
              <Skeleton className="w-24 h-24 rounded-full" />
              <Skeleton className="w-36 h-6 rounded-lg" />
              <Skeleton className="w-24 h-4 rounded-md" />
            </div>
            <div className="bg-surface rounded-2xl p-4 border border-border shadow-sm flex flex-col gap-4">
              <Skeleton className="w-full h-10 rounded-lg" />
              <Skeleton className="w-full h-10 rounded-lg" />
              <Skeleton className="w-full h-10 rounded-lg" />
            </div>
          </div>
        )}

        {!isLoading && error && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-2xl flex flex-col items-center text-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <h3 className="text-base font-bold text-gray-900">Failed to Load Profile</h3>
            <p className="text-xs text-red-700">{error}</p>
            <button
              onClick={loadProfile}
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
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="bg-surface rounded-2xl p-6 border border-border shadow-sm flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="w-24 h-24 rounded-full bg-[#1B5DF1] text-white flex items-center justify-center text-3xl font-black mb-3 border-4 border-blue-100 shadow-md">
                <User className="w-12 h-12" />
              </div>
              <h2 className="text-xl font-bold text-foreground">
                {activeUser.name || "Not provided"}
              </h2>
              <p className="text-sm text-[#1B5DF1] font-semibold mt-0.5">
                {title}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
                <span className="bg-blue-50 text-[#1B5DF1] text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-blue-200">
                  {isReceptionist ? "Front Desk Receptionist" : activeUser.role?.replace('_', ' ')}
                </span>
                <span className={cn(
                  "text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5",
                  activeUser.active !== false
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-red-50 text-red-700 border-red-200"
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", activeUser.active !== false ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
                  {activeUser.active !== false ? "Active Account" : "Inactive Account"}
                </span>
                {activeUser.department?.name && (
                  <span className="bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {activeUser.department.name}
                  </span>
                )}
              </div>
            </motion.div>

            {/* Contact & Personal Details Card */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.05 }} 
              className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden"
            >
              <div className="px-4 py-3 bg-muted/5 border-b border-border">
                <h3 className="text-xs font-bold text-muted uppercase tracking-wider">
                  Contact & Identity Details
                </h3>
              </div>

              <div className="p-4 border-b border-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-[#1B5DF1] flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider">Email Address</p>
                  <p className="font-semibold text-foreground text-sm truncate">{activeUser.email || "Not provided"}</p>
                </div>
              </div>

              <div className="p-4 border-b border-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-[#1B5DF1] flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider">Phone Number</p>
                  <p className="font-semibold text-foreground text-sm">{activeUser.phone || "Not provided"}</p>
                </div>
              </div>

              <div className="p-4 border-b border-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-[#1B5DF1] flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider">Date of Birth</p>
                  <p className="font-semibold text-foreground text-sm">{displayDob}</p>
                </div>
              </div>

              <div className="p-4 border-b border-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-[#1B5DF1] flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider">Gender</p>
                  <p className="font-semibold text-foreground text-sm">{displayGender}</p>
                </div>
              </div>

              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-[#1B5DF1] flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider">Address</p>
                  <p className="font-semibold text-foreground text-sm">{displayAddress}</p>
                </div>
              </div>
            </motion.div>

            {/* Doctor Clinical Information Card */}
            {isDoctor && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.1 }} 
                className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden"
              >
                <div className="px-4 py-3 bg-muted/5 border-b border-border">
                  <h3 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-[#1B5DF1]" />
                    Clinical Credentials
                  </h3>
                </div>

                <div className="p-4 border-b border-border flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center shrink-0">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">{licenseLabel}</p>
                    <p className="font-semibold text-foreground text-sm font-mono">{displayLicense}</p>
                  </div>
                </div>

                <div className="p-4 border-b border-border flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center shrink-0">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">Specialization</p>
                    <p className="font-semibold text-foreground text-sm">{displaySpecialization}</p>
                  </div>
                </div>

                <div className="p-4 border-b border-border flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">Educational Qualification</p>
                    <p className="font-semibold text-foreground text-sm">{displayQualification}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 border-b border-border">
                  <div className="p-4 border-r border-border flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted uppercase tracking-wider">Experience</p>
                      <p className="font-semibold text-foreground text-sm">
                        {displayExperience}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center shrink-0">
                      <IndianRupee className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted uppercase tracking-wider">Consultation Fee</p>
                      <p className="font-semibold text-foreground text-sm">
                        {displayFee}
                      </p>
                    </div>
                  </div>
                </div>

                {activeUser.bio && (
                  <div className="p-4 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-muted uppercase tracking-wider">About Doctor</p>
                      <p className="text-foreground text-sm leading-relaxed mt-1">{activeUser.bio}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Nurse Professional Information Card */}
            {isNurse && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.1 }} 
                className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden"
              >
                <div className="px-4 py-3 bg-muted/5 border-b border-border">
                  <h3 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-[#1B5DF1]" />
                    Nursing Credentials
                  </h3>
                </div>

                <div className="p-4 border-b border-border flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">Designation</p>
                    <p className="font-semibold text-foreground text-sm">{activeUser.designation || "Not provided"}</p>
                  </div>
                </div>

                <div className="p-4 border-b border-border flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 flex items-center justify-center shrink-0">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">{licenseLabel}</p>
                    <p className="font-semibold text-foreground text-sm">{activeUser.licenseNumber || "Not provided"}</p>
                  </div>
                </div>

                <div className="p-4 border-b border-border flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 flex items-center justify-center shrink-0">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">Specialization</p>
                    <p className="font-semibold text-foreground text-sm">{activeUser.specialization || "Not provided"}</p>
                  </div>
                </div>

                <div className="p-4 border-b border-border flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">Qualification</p>
                    <p className="font-semibold text-foreground text-sm">{activeUser.qualification || "Not provided"}</p>
                  </div>
                </div>

                <div className="p-4 border-b border-border flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">Experience</p>
                    <p className="font-semibold text-foreground text-sm">
                      {activeUser.experienceYears ? `${activeUser.experienceYears} Years` : "Not provided"}
                    </p>
                  </div>
                </div>

                {activeUser.bio && (
                  <div className="p-4 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-muted uppercase tracking-wider">About Nurse</p>
                      <p className="text-foreground text-sm leading-relaxed mt-1">{activeUser.bio}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Receptionist Front Desk Details Card */}
            {isReceptionist && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.1 }} 
                className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden"
              >
                <div className="px-4 py-3 bg-muted/5 border-b border-border">
                  <h3 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-[#1B5DF1]" />
                    Receptionist & Front Desk Details
                  </h3>
                </div>

                <div className="p-4 border-b border-border flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">Designation</p>
                    <p className="font-semibold text-foreground text-sm">{activeUser.designation || "Not provided"}</p>
                  </div>
                </div>

                <div className="p-4 border-b border-border flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">Account Status</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn(
                        "text-xs font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5",
                        activeUser.active !== false
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      )}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", activeUser.active !== false ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
                        {activeUser.active !== false ? "Active Account" : "Inactive Account"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-b border-border flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">Staff Role</p>
                    <p className="font-semibold text-foreground text-sm">Front Desk Receptionist</p>
                  </div>
                </div>

                <div className="p-4 border-b border-border flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">Member Since</p>
                    <p className="font-semibold text-foreground text-sm">
                      {activeUser.createdAt 
                        ? new Date(activeUser.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) 
                        : "Not provided"}
                    </p>
                  </div>
                </div>

                {activeUser.bio && (
                  <div className="p-4 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-muted uppercase tracking-wider">About Receptionist / Desk Notes</p>
                      <p className="text-foreground text-sm leading-relaxed mt-1">{activeUser.bio}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Hospital Facility Information */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.15 }} 
              className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden"
            >
              <div className="px-4 py-3 bg-muted/5 border-b border-border">
                <h3 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#1B5DF1]" />
                  Hospital Information
                </h3>
              </div>

              {(activeUser.hospital || hospitalName) ? (
                <>
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted uppercase tracking-wider">Hospital Name</p>
                      <p className="font-semibold text-foreground text-sm">{hospitalName}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-[#1B5DF1] font-semibold border border-blue-200">
                      {hospitalType}
                    </span>
                  </div>

                  {hospitalReg && (
                    <div className="p-4 border-b border-border flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-muted uppercase tracking-wider">Registration Number</p>
                        <p className="font-semibold text-foreground text-sm font-mono">{hospitalReg}</p>
                      </div>
                    </div>
                  )}

                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted uppercase tracking-wider">Assigned Department</p>
                      <p className="font-semibold text-foreground text-sm">
                        {hospitalDept}
                      </p>
                    </div>
                    {hospitalDeptCode && (
                      <span className="text-xs text-muted font-mono">{hospitalDeptCode}</span>
                    )}
                  </div>

                  {(hospitalPhone || hospitalEmail) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-border">
                      {hospitalPhone && (
                        <div className="p-4 border-b sm:border-b-0 sm:border-r border-border flex items-center gap-3">
                          <Phone className="w-4 h-4 text-muted shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Hospital Phone</p>
                            <p className="font-semibold text-foreground text-sm truncate">{hospitalPhone}</p>
                          </div>
                        </div>
                      )}
                      {hospitalEmail && (
                        <div className="p-4 flex items-center gap-3">
                          <Mail className="w-4 h-4 text-muted shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Hospital Email</p>
                            <p className="font-semibold text-foreground text-sm truncate">{hospitalEmail}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-4 flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-muted uppercase tracking-wider">Hospital Address</p>
                      <p className="text-xs text-muted mt-0.5">
                        {hospitalAddress}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-6 text-center text-muted">
                  <Building2 className="w-8 h-8 text-muted/50 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-foreground">No Hospital Associated</p>
                  <p className="text-xs text-muted mt-1">This staff account is currently not assigned to any hospital facility.</p>
                </div>
              )}
            </motion.div>

            {/* Edit Button */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <button 
                onClick={() => navigate('/profile/edit')} 
                className="w-full bg-[#1B5DF1] text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#1B5DF1]/90 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Edit3 className="w-5 h-5" />
                <span>Edit Information</span>
              </button>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
